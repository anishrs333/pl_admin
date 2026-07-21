from rest_framework import viewsets, filters, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from accounts.permissions import IsHR, IsHRorSelfReadOnly
from .models import BreakRequest
from .break_serializers import BreakRequestSerializer
from .views import _get_self_target


class BreakRequestViewSet(viewsets.ModelViewSet):
    """Break request management — personal breaks and half days."""
    serializer_class = BreakRequestSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['employee__full_name', 'intern__name', 'reason']
    ordering = ['-created_at']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update']:
            return [IsHRorSelfReadOnly()]
        elif self.action in ['approve', 'reject']:
            return [IsHR()]
        else:
            return [IsHRorSelfReadOnly()]

    def get_queryset(self):
        qs = BreakRequest.objects.select_related('employee', 'intern', 'reviewer').all()
        user = self.request.user
        if user.role == 'hr' or user.is_superuser:
            return qs

        kind, profile = _get_self_target(user)
        if kind == 'employee':
            return qs.filter(employee=profile)
        if kind == 'intern':
            return qs.filter(intern=profile)
        return qs.none()

    def perform_create(self, serializer):
        user = self.request.user
        if not (user.role == 'hr' or user.is_superuser):
            kind, profile = _get_self_target(user)
            if kind == 'employee':
                serializer.save(employee=profile)
            elif kind == 'intern':
                serializer.save(intern=profile)
            else:
                raise serializers.ValidationError('No employee/intern profile found.')
        else:
            # HR creating on behalf of someone
            serializer.save()

        # Notify HR about the new break request
        try:
            from notifications.utils import notify_break_applied
            notify_break_applied(serializer.instance)
        except Exception:
            pass

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve break request."""
        br = self.get_object()
        if br.status != 'pending':
            return Response({'error': f'Cannot approve a request that is already {br.status}.'},
                            status=status.HTTP_400_BAD_REQUEST)

        br.status = 'approved'
        br.reviewer = request.user.employee_profile if hasattr(request.user, 'employee_profile') else None
        br.reviewed_at = timezone.now()
        br.reviewer_notes = request.data.get('reviewer_notes', '')
        br.save()

        try:
            from notifications.utils import notify
            recipient = br.employee.user if br.employee else br.intern.user
            notify(
                recipient=recipient,
                notification_type='break_approved',
                title='Break Request Approved',
                message=f'Your {br.get_break_type_display()} request for {br.date} has been approved.'
            )
        except Exception:
            pass

        return Response(BreakRequestSerializer(br).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject break request."""
        br = self.get_object()
        if br.status != 'pending':
            return Response({'error': f'Cannot reject a request that is already {br.status}.'},
                            status=status.HTTP_400_BAD_REQUEST)

        br.status = 'rejected'
        br.reviewer = request.user.employee_profile if hasattr(request.user, 'employee_profile') else None
        br.reviewed_at = timezone.now()
        br.reviewer_notes = request.data.get('reviewer_notes', '')
        br.save()

        try:
            from notifications.utils import notify
            recipient = br.employee.user if br.employee else br.intern.user
            notify(
                recipient=recipient,
                notification_type='break_rejected',
                title='Break Request Rejected',
                message=f'Your {br.get_break_type_display()} request for {br.date} has been rejected. Reason: {br.reviewer_notes}'
            )
        except Exception:
            pass

        return Response(BreakRequestSerializer(br).data)
