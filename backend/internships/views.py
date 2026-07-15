from rest_framework import viewsets, filters, parsers, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from accounts.permissions import IsHR, IsHRorSelfReadOnly
from .models import Intern, InternTask
from .serializers import InternSerializer, InternTaskSerializer


class InternViewSet(viewsets.ModelViewSet):
    """Intern management."""
    serializer_class = InternSerializer
    permission_classes = [IsHRorSelfReadOnly]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'email', 'intern_id']
    ordering = ['-created_at']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsHR()]
        return [IsHRorSelfReadOnly()]

    def get_queryset(self):
        qs = Intern.objects.select_related('mentor')
        user = self.request.user
        if user.role == 'hr' or user.is_superuser:
            return qs
        return qs.filter(user=user)

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        response_data = serializer.data
        if hasattr(serializer.instance, '_email_sent') and not serializer.instance._email_sent:
            response_data['warning'] = 'Intern created, but welcome email failed to send. Please check SMTP settings.'
        return Response(response_data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=True, methods=['post'], permission_classes=[IsHR])
    def resend_welcome_email(self, request, pk=None):
        intern = self.get_object()
        success = intern._send_welcome_email()
        if success:
            return Response({'detail': 'Welcome email resent successfully.'})
        return Response(
            {'detail': 'Failed to send welcome email. Check SMTP settings.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


class InternTaskViewSet(viewsets.ModelViewSet):
    """Daily task tracking for interns (separate from the shared Task app)."""
    serializer_class = InternTaskSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'intern__name']
    ordering = ['-created_at']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsHR()]
        return [IsHRorSelfReadOnly()]

    def get_queryset(self):
        qs = InternTask.objects.select_related('intern')
        user = self.request.user
        if user.role == 'hr' or user.is_superuser:
            return qs
        if hasattr(user, 'intern_profile'):
            return qs.filter(intern=user.intern_profile)
        return qs.none()

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        task = self.get_object()
        task.status = 'completed'
        task.save()
        return Response(InternTaskSerializer(task).data)
