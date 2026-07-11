from rest_framework import viewsets, filters, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from accounts.permissions import IsHR, IsHRorSelfReadOnly
from .models import WorkFromHome
from .wfh_serializers import WorkFromHomeSerializer
from .views import _get_self_target


class WorkFromHomeViewSet(viewsets.ModelViewSet):
    """Work From Home request management."""
    serializer_class = WorkFromHomeSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['employee__full_name', 'intern__name', 'reason', 'task_description']
    ordering = ['-created_at']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update']:
            return [IsHRorSelfReadOnly()]
        elif self.action in ['approve', 'reject']:
            return [IsHR()]
        else:
            return [IsHRorSelfReadOnly()]

    def get_queryset(self):
        qs = WorkFromHome.objects.select_related('employee', 'intern', 'reviewer').all()
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

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve WFH request."""
        wfh = self.get_object()
        if wfh.status != 'pending':
            return Response({'error': f'Cannot approve a request that is already {wfh.status}.'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        wfh.status = 'approved'
        wfh.reviewer = request.user.employee_profile if hasattr(request.user, 'employee_profile') else None
        wfh.reviewed_at = timezone.now()
        wfh.reviewer_notes = request.data.get('reviewer_notes', '')
        wfh.save()
        
        try:
            from notifications.utils import notify
            recipient = wfh.employee.user if wfh.employee else wfh.intern.user
            notify(
                recipient=recipient,
                notification_type='wfh_approved',
                title='Work From Home Approved',
                message=f'Your WFH request for {wfh.date} has been approved'
            )
        except Exception:
            pass
        
        return Response(WorkFromHomeSerializer(wfh).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject WFH request."""
        wfh = self.get_object()
        if wfh.status != 'pending':
            return Response({'error': f'Cannot reject a request that is already {wfh.status}.'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        wfh.status = 'rejected'
        wfh.reviewer = request.user.employee_profile if hasattr(request.user, 'employee_profile') else None
        wfh.reviewed_at = timezone.now()
        wfh.reviewer_notes = request.data.get('reviewer_notes', '')
        wfh.save()
        
        try:
            from notifications.utils import notify
            recipient = wfh.employee.user if wfh.employee else wfh.intern.user
            notify(
                recipient=recipient,
                notification_type='wfh_rejected',
                title='Work From Home Rejected',
                message=f'Your WFH request for {wfh.date} has been rejected. Reason: {wfh.reviewer_notes}'
            )
        except Exception:
            pass
        
        return Response(WorkFromHomeSerializer(wfh).data)
