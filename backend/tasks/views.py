from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from accounts.permissions import IsHR, IsHRorSelfReadOnly
from .models import Task
from .serializers import TaskSerializer


class TaskViewSet(viewsets.ModelViewSet):
    """Task management — HR assigns everyone."""
    serializer_class = TaskSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status']
    search_fields = ['title', 'description']
    ordering = ['-created_at']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsHR()]
        elif self.action == 'complete':
            return [IsHRorSelfReadOnly()]
        else:
            return [IsHRorSelfReadOnly()]

    def get_queryset(self):
        qs = Task.objects.select_related('assigned_to', 'assigned_to_intern', 'assigned_to_user')
        user = self.request.user
        if user.is_hr:
            qs_all = qs
        elif hasattr(user, 'employee_profile'):
            qs_all = qs.filter(assigned_to__user=user)
        elif hasattr(user, 'intern_profile'):
            qs_all = qs.filter(assigned_to_intern__user=user)
        else:
            qs_all = qs.none()
        status_param = self.request.query_params.get('status')
        if status_param and status_param != 'all':
            qs_all = qs_all.filter(status=status_param)
        return qs_all

    def perform_create(self, serializer):
        from notifications.utils import notify_task_assigned
        task = serializer.save()
        notify_task_assigned(task)

    def create(self, request, *args, **kwargs):
        user = request.user
        data = request.data.copy()

        # HR Exec cannot assign to HR Admin
        if user.role == 'hr_executive':
            assigned_user_id = data.get('assigned_to_user')
            if assigned_user_id:
                from accounts.models import User
                try:
                    target = User.objects.get(pk=assigned_user_id)
                    if target.role == 'hr':
                        return Response({'assigned_to_user': 'HR Executive cannot assign tasks to HR Administrator.'}, status=status.HTTP_400_BAD_REQUEST)
                except User.DoesNotExist:
                    pass

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Mark task as completed."""
        from notifications.utils import notify_task_completed
        task = self.get_object()
        user = request.user

        is_owner = (
            (hasattr(user, 'employee_profile') and task.assigned_to == user.employee_profile) or
            (hasattr(user, 'intern_profile') and task.assigned_to_intern == user.intern_profile) or
            (task.assigned_to_user_id == user.id)
        )

        if not (user.is_hr or is_owner):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        task.status = 'completed'
        task.completed_at = timezone.now()
        task.save()
        if not user.is_hr:
            notify_task_completed(task)
        return Response(TaskSerializer(task).data)
