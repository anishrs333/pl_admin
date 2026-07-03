from rest_framework import viewsets, filters, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from accounts.permissions import IsHR, IsHRorSelfReadOnly
from .models import Attendance, Leave
from .serializers import AttendanceSerializer, LeaveSerializer


def _get_self_target(user):
    """Return ('employee'|'intern', profile) for the logged-in self-service user, or (None, None)."""
    if hasattr(user, 'employee_profile'):
        return 'employee', user.employee_profile
    if hasattr(user, 'intern_profile'):
        return 'intern', user.intern_profile
    return None, None


class AttendanceViewSet(viewsets.ModelViewSet):
    """Attendance management - Check-in/Check-out for both Employees and Interns."""
    serializer_class = AttendanceSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['employee__full_name', 'intern__name']
    ordering = ['-date']

    def get_permissions(self):
        if self.action in ['checkin', 'checkout', 'my_status']:
            return [IsHRorSelfReadOnly()]
        else:
            return [IsHR()]

    def get_queryset(self):
        qs = Attendance.objects.select_related('employee', 'intern')
        user = self.request.user
        if user.role == 'hr' or user.is_superuser:
            return qs
        kind, profile = _get_self_target(user)
        if kind == 'employee':
            return qs.filter(employee=profile)
        if kind == 'intern':
            return qs.filter(intern=profile)
        return qs.none()

    @action(detail=False, methods=['post'])
    def checkin(self, request):
        """Employee/Intern self check-in."""
        kind, profile = _get_self_target(request.user)
        if not kind:
            return Response({'error': 'No employee/intern profile'}, status=status.HTTP_400_BAD_REQUEST)

        today = timezone.now().date()
        lookup = {'employee': profile, 'date': today} if kind == 'employee' else {'intern': profile, 'date': today}
        attendance, created = Attendance.objects.get_or_create(**lookup)

        if attendance.check_in:
            return Response({'error': 'Already checked in'}, status=status.HTTP_400_BAD_REQUEST)

        attendance.check_in = timezone.now()
        attendance.status = 'present'
        attendance.save()

        return Response(AttendanceSerializer(attendance, context={'request': request}).data)

    @action(detail=False, methods=['post'])
    def checkout(self, request):
        """Employee/Intern self check-out."""
        kind, profile = _get_self_target(request.user)
        if not kind:
            return Response({'error': 'No employee/intern profile'}, status=status.HTTP_400_BAD_REQUEST)

        today = timezone.now().date()
        lookup = {'employee': profile, 'date': today} if kind == 'employee' else {'intern': profile, 'date': today}
        try:
            attendance = Attendance.objects.get(**lookup)
        except Attendance.DoesNotExist:
            return Response({'error': 'Not checked in'}, status=status.HTTP_400_BAD_REQUEST)

        if not attendance.check_in:
            return Response({'error': 'Not checked in'}, status=status.HTTP_400_BAD_REQUEST)

        if attendance.check_out:
            return Response({'error': 'Already checked out'}, status=status.HTTP_400_BAD_REQUEST)

        attendance.check_out = timezone.now()
        delta = attendance.check_out - attendance.check_in
        attendance.work_hours = round(delta.total_seconds() / 3600, 2)
        attendance.save()

        return Response(AttendanceSerializer(attendance, context={'request': request}).data)

    @action(detail=False, methods=['get'])
    def today(self, request):
        """Today's attendance — HR sees everyone (employees + interns)."""
        today = timezone.now().date()
        qs = Attendance.objects.filter(date=today).select_related('employee', 'intern')
        user = request.user
        if not (user.role == 'hr' or user.is_superuser):
            kind, profile = _get_self_target(user)
            qs = qs.filter(employee=profile) if kind == 'employee' else qs.filter(intern=profile)
        serializer = AttendanceSerializer(qs, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def my_status(self, request):
        """Current user's attendance status for today."""
        kind, profile = _get_self_target(request.user)
        if not kind:
            return Response({'error': 'No employee/intern profile'}, status=status.HTTP_400_BAD_REQUEST)

        today = timezone.now().date()
        lookup = {'employee': profile, 'date': today} if kind == 'employee' else {'intern': profile, 'date': today}
        try:
            attendance = Attendance.objects.get(**lookup)
            return Response(AttendanceSerializer(attendance, context={'request': request}).data)
        except Attendance.DoesNotExist:
            return Response({'check_in': None, 'check_out': None, 'status': 'not_marked'})


class LeaveViewSet(viewsets.ModelViewSet):
    """Leave management (Employees)."""
    serializer_class = LeaveSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['employee__full_name', 'reason']
    ordering = ['-created_at']

    def get_permissions(self):
        if self.action == 'create':
            return [IsHRorSelfReadOnly()]
        elif self.action in ['approve', 'reject']:
            return [IsHR()]
        else:
            return [IsHRorSelfReadOnly()]

    def get_queryset(self):
        qs = Leave.objects.select_related('employee', 'intern', 'reviewer')
        user = self.request.user
        if user.role == 'hr' or user.is_superuser:
            return qs
        if hasattr(user, 'employee_profile'):
            return qs.filter(employee=user.employee_profile)
        if hasattr(user, 'intern_profile'):
            return qs.filter(intern=user.intern_profile)
        return qs.none()

    def perform_create(self, serializer):
        from notifications.utils import notify_leave_applied
        user = self.request.user
        if hasattr(user, 'employee_profile'):
            leave = serializer.save(employee=user.employee_profile)
        elif hasattr(user, 'intern_profile'):
            leave = serializer.save(intern=user.intern_profile)
        else:
            raise serializers.ValidationError('Only employees and interns can apply for leave.')
        notify_leave_applied(leave)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve leave request."""
        from notifications.utils import notify_leave_decision
        leave = self.get_object()
        if leave.status != 'pending':
            return Response({'error': f'Cannot approve {leave.status} leave'}, status=status.HTTP_400_BAD_REQUEST)

        leave.status = 'approved'
        leave.reviewer = request.user.employee_profile if hasattr(request.user, 'employee_profile') else None
        leave.reviewed_at = timezone.now()
        leave.reviewer_notes = request.data.get('reviewer_notes', '')
        leave.save()
        notify_leave_decision(leave)

        return Response(LeaveSerializer(leave).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject leave request."""
        from notifications.utils import notify_leave_decision
        leave = self.get_object()
        if leave.status != 'pending':
            return Response({'error': f'Cannot reject {leave.status} leave'}, status=status.HTTP_400_BAD_REQUEST)

        leave.status = 'rejected'
        leave.reviewer = request.user.employee_profile if hasattr(request.user, 'employee_profile') else None
        leave.reviewed_at = timezone.now()
        leave.reviewer_notes = request.data.get('reviewer_notes', '')
        leave.save()
        notify_leave_decision(leave)

        return Response(LeaveSerializer(leave).data)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Leave balance summary."""
        user = request.user
        if hasattr(user, 'employee_profile'):
            leaves = Leave.objects.filter(employee=user.employee_profile)
        elif hasattr(user, 'intern_profile'):
            leaves = Leave.objects.filter(intern=user.intern_profile)
        else:
            return Response({'error': 'No employee/intern profile'}, status=status.HTTP_400_BAD_REQUEST)

        leave_types = {}
        for leave_type in ['sick', 'paid', 'casual', 'unpaid', 'earned']:
            count = leaves.filter(leave_type=leave_type, status='approved').count()
            leave_types[leave_type] = count

        return Response(leave_types)
