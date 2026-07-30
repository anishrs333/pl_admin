from rest_framework import viewsets, filters, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import HttpResponse
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
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
        if self.action in ['list', 'retrieve', 'checkin', 'checkout', 'my_status']:
            return [IsHRorSelfReadOnly()]
        else:
            return [IsHR()]

    def get_queryset(self):
        qs = Attendance.objects.select_related('employee', 'intern')
        user = self.request.user
        if user.is_hr or user.is_superuser:
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
        """Today's attendance — HR sees everyone (employees + interns).
        Supports optional start_date / end_date query params for date-range queries.
        """
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        if start_date and end_date:
            qs = Attendance.objects.filter(
                date__gte=start_date, date__lte=end_date
            ).select_related('employee', 'intern')
        else:
            today = timezone.now().date()
            qs = Attendance.objects.filter(date=today).select_related('employee', 'intern')

        user = request.user
        if not (user.is_hr or user.is_superuser):
            kind, profile = _get_self_target(user)
            qs = qs.filter(employee=profile) if kind == 'employee' else qs.filter(intern=profile)
        serializer = AttendanceSerializer(qs, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def report_pdf(self, request):
        """Generate attendance report PDF for a date range."""
        from datetime import date as date_type
        from .attendance_pdf import generate_weekly_report_pdf, generate_monthly_report_pdf

        start_str = request.query_params.get('start_date')
        end_str = request.query_params.get('end_date')
        report_type = request.query_params.get('type', 'weekly')

        if not start_str or not end_str:
            return Response({'error': 'start_date and end_date are required'}, status=400)

        try:
            start_date = date_type.fromisoformat(start_str)
            end_date = date_type.fromisoformat(end_str)
        except ValueError:
            return Response({'error': 'Invalid date format (use YYYY-MM-DD)'}, status=400)

        qs = Attendance.objects.filter(
            date__gte=start_date, date__lte=end_date
        ).select_related('employee', 'intern').order_by('date', 'employee__full_name', 'intern__name')

        if report_type == 'monthly':
            pdf_buffer = generate_monthly_report_pdf(qs, start_date, end_date)
        else:
            pdf_buffer = generate_weekly_report_pdf(qs, start_date, end_date)

        response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
        filename = f'Attendance_{report_type}_{start_str}_to_{end_str}.pdf'
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response

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

    @action(detail=False, methods=['post'])
    def mark_manual(self, request):
        """HR manually set/correct an employee's or intern's attendance for a given day.
        Creates the row if none exists (e.g. absent days with no record).
        POST { person_type, person_id, date, check_in?, check_out?, status }
        """
        person_type = request.data.get('person_type')
        person_id = request.data.get('person_id')
        date_str = request.data.get('date')
        check_in_str = request.data.get('check_in')
        check_out_str = request.data.get('check_out')
        att_status = request.data.get('status', 'present')

        if not person_type or not person_id or not date_str:
            return Response({'error': 'person_type, person_id, and date are required.'}, status=status.HTTP_400_BAD_REQUEST)

        from datetime import date as date_type
        from datetime import datetime as dt_type
        try:
            att_date = date_type.fromisoformat(date_str)
        except ValueError:
            return Response({'error': 'Invalid date format (use YYYY-MM-DD)'}, status=status.HTTP_400_BAD_REQUEST)

        lookup = {'date': att_date}
        if person_type == 'employee':
            from employees.models import Employee
            try:
                emp = Employee.objects.get(pk=person_id)
            except Employee.DoesNotExist:
                return Response({'error': 'Employee not found.'}, status=status.HTTP_404_NOT_FOUND)
            lookup['employee'] = emp
        elif person_type == 'intern':
            from internships.models import Intern
            try:
                intern = Intern.objects.get(pk=person_id)
            except Intern.DoesNotExist:
                return Response({'error': 'Intern not found.'}, status=status.HTTP_404_NOT_FOUND)
            lookup['intern'] = intern
        else:
            return Response({'error': 'person_type must be "employee" or "intern".'}, status=status.HTTP_400_BAD_REQUEST)

        attendance, created = Attendance.objects.get_or_create(**lookup)

        if check_in_str:
            try:
                attendance.check_in = dt_type.fromisoformat(check_in_str)
            except ValueError:
                return Response({'error': 'Invalid check_in format (use ISO datetime)'}, status=status.HTTP_400_BAD_REQUEST)

        if check_out_str:
            try:
                attendance.check_out = dt_type.fromisoformat(check_out_str)
            except ValueError:
                return Response({'error': 'Invalid check_out format (use ISO datetime)'}, status=status.HTTP_400_BAD_REQUEST)

        attendance.status = att_status

        if attendance.check_in and attendance.check_out:
            attendance.work_hours = round((attendance.check_out - attendance.check_in).total_seconds() / 3600, 2)
        elif not attendance.check_in and not attendance.check_out:
            attendance.work_hours = None

        attendance.is_manually_edited = True
        attendance.modified_by = request.user
        attendance.save()

        return Response(AttendanceSerializer(attendance, context={'request': request}).data)


class LeaveViewSet(viewsets.ModelViewSet):
    """Leave management (Employees)."""
    serializer_class = LeaveSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status']
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
        if user.is_hr or user.is_superuser:
            qs_all = qs
        elif hasattr(user, 'employee_profile'):
            qs_all = qs.filter(employee=user.employee_profile)
        elif hasattr(user, 'intern_profile'):
            qs_all = qs.filter(intern=user.intern_profile)
        else:
            qs_all = qs.none()
        # Manual status filter as fallback
        status_param = self.request.query_params.get('status')
        if status_param and status_param != 'all':
            qs_all = qs_all.filter(status=status_param)
        return qs_all

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
