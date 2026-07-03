from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from accounts.permissions import IsHR, IsHRorSelfReadOnly
from .models import Task
from .serializers import TaskSerializer


class TaskViewSet(viewsets.ModelViewSet):
    """Task management — assignable to Employees or Interns."""
    serializer_class = TaskSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
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
        qs = Task.objects.select_related('assigned_to', 'assigned_to_intern')
        user = self.request.user
        if user.role == 'hr' or user.is_superuser:
            return qs
        if hasattr(user, 'employee_profile'):
            return qs.filter(assigned_to__user=user)
        if hasattr(user, 'intern_profile'):
            return qs.filter(assigned_to_intern__user=user)
        return qs.none()

    def perform_create(self, serializer):
        from notifications.utils import notify_task_assigned
        task = serializer.save()
        notify_task_assigned(task)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Mark task as completed."""
        from notifications.utils import notify_task_completed
        task = self.get_object()
        user = request.user

        # HR can mark any task complete
        is_owner = (
            (hasattr(user, 'employee_profile') and task.assigned_to == user.employee_profile) or
            (hasattr(user, 'intern_profile') and task.assigned_to_intern == user.intern_profile)
        )

        if not (user.role == 'hr' or user.is_superuser or is_owner):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        task.status = 'completed'
        task.completed_at = timezone.now()
        task.save()
        if not (user.role == 'hr' or user.is_superuser):
            notify_task_completed(task)
        return Response(TaskSerializer(task).data)
