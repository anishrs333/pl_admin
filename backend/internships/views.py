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
