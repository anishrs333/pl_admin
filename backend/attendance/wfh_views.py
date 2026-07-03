from rest_framework import viewsets, filters, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from accounts.permissions import IsHR, IsHRorSelfReadOnly
from .models import WorkFromHome
from .wfh_serializers import WorkFromHomeSerializer


class WorkFromHomeViewSet(viewsets.ModelViewSet):
    """Work From Home request management."""
    serializer_class = WorkFromHomeSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['employee__full_name', 'reason']
    ordering = ['-created_at']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update']:
            return [IsHRorSelfReadOnly()]
        elif self.action in ['approve', 'reject']:
            return [IsHR()]
        else:
            return [IsHRorSelfReadOnly()]

    def get_queryset(self):
        qs = WorkFromHome.objects.select_related('employee', 'reviewer').all()
        user = self.request.user
        if user.role == 'hr' or user.is_superuser:
            return qs
        return qs.filter(employee__user=user)

    def perform_create(self, serializer):
        user = self.request.user
        if not (user.role == 'hr' or user.is_superuser):
            if hasattr(user, 'employee_profile'):
                serializer.save(employee=user.employee_profile)
            else:
                raise serializers.ValidationError('No employee profile found.')
        else:
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
            notify(
                recipient=wfh.employee.user,
                notification_type='wfh_approved',
                title='Work From Home Approved',
                message=f'Your WFH request from {wfh.from_date} to {wfh.to_date} has been approved'
            )
        except:
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
            notify(
                recipient=wfh.employee.user,
                notification_type='wfh_rejected',
                title='Work From Home Rejected',
                message=f'Your WFH request from {wfh.from_date} to {wfh.to_date} has been rejected. Reason: {wfh.reviewer_notes}'
            )
        except:
            pass
        
        return Response(WorkFromHomeSerializer(wfh).data)
