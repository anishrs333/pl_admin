from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import HttpResponse
from django.utils import timezone
from accounts.permissions import IsHR, IsFullHR, IsHRorSelfReadOnly
from .models import Salary, Advance
from .serializers import SalarySerializer, AdvanceSerializer
from .payslip_pdf import generate_payslip_pdf


class SalaryViewSet(viewsets.ModelViewSet):
    """Payroll management — Employees & Interns.

    HR/Full HR can see and manage all salary records (employee + intern).
    Employees can only see their own salary records.
    Interns can view/download only their own slips.
    """
    serializer_class = SalarySerializer
    permission_classes = [IsHRorSelfReadOnly]
    pagination_class = None
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['employee__full_name', 'intern__name']
    ordering = ['-month', '-year']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'mark_paid', 'create_and_send']:
            return [IsFullHR()]
        if self.action == 'leave_summary':
            return [IsHR()]
        return [IsHRorSelfReadOnly()]

    def get_queryset(self):
        qs = Salary.objects.select_related('employee', 'intern')
        user = self.request.user
        if user.is_full_hr:
            return qs
        if hasattr(user, 'employee_profile'):
            return qs.filter(employee=user.employee_profile)
        if hasattr(user, 'intern_profile'):
            return qs.filter(intern=user.intern_profile)
        return qs.none()

    def perform_create(self, serializer):
        from notifications.utils import notify_salary_generated
        salary = serializer.save()
        notify_salary_generated(salary)

    @action(detail=False, methods=['post'], url_path='create-and-send')
    def create_and_send(self, request):
        """Create a salary record and notify the employee/intern in-app."""
        employee_id = request.data.get('employee')
        intern_id = request.data.get('intern')
        month = request.data.get('month')
        year = request.data.get('year')

        if not employee_id and not intern_id:
            return Response({'detail': 'Either employee or intern is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if not month or not year:
            return Response({'detail': 'Month and year are required.'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = SalarySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        salary = serializer.save()  # perform_create already sends notification

        return Response({'detail': 'Payslip created and employee notified.', 'salary': SalarySerializer(salary).data}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def slip_pdf(self, request, pk=None):
        """Download payslip PDF."""
        salary = self.get_object()
        pdf_buffer = generate_payslip_pdf(salary)
        response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
        filename = f"Payslip_{salary.person_code}_{salary.month}_{salary.year}.pdf"
        if request.query_params.get('inline') == '1':
            response['Content-Disposition'] = f'inline; filename="{filename}"'
        else:
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response

    @action(detail=True, methods=['post'])
    def mark_paid(self, request, pk=None):
        """Mark salary as paid."""
        from notifications.utils import notify_salary_paid
        salary = self.get_object()
        salary.status = 'paid'
        salary.paid_date = timezone.now().date()
        salary.payment_ref = request.data.get('payment_ref', salary.payment_ref)
        salary.save()
        notify_salary_paid(salary)
        return Response(SalarySerializer(salary).data)

    @action(detail=False, methods=['get'], url_path='leave-summary', permission_classes=[IsHR])
    def leave_summary(self, request):
        """Retrieve leave and LOP details for an employee/intern in a given month and year."""
        employee_id = request.query_params.get('employee')
        intern_id = request.query_params.get('intern')
        month_str = request.query_params.get('month')
        year_str = request.query_params.get('year')

        if not employee_id and not intern_id:
            return Response({'detail': 'Either employee or intern is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if not month_str or not year_str:
            return Response({'detail': 'Month and year are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            month = int(month_str)
            year = int(year_str)
        except ValueError:
            return Response({'detail': 'Invalid month or year.'}, status=status.HTTP_400_BAD_REQUEST)

        # Get base salary
        base_salary = 0
        if employee_id:
            from employees.models import Employee
            try:
                person = Employee.objects.get(pk=employee_id)
                base_salary = person.salary or 0
            except Employee.DoesNotExist:
                return Response({'detail': 'Employee not found.'}, status=status.HTTP_404_NOT_FOUND)
        else:
            from internships.models import Intern
            try:
                person = Intern.objects.get(pk=intern_id)
                base_salary = person.stipend_amount or 0
            except Intern.DoesNotExist:
                return Response({'detail': 'Intern not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Query approved leaves overlapping the month
        import calendar
        from datetime import date
        days_in_month = calendar.monthrange(year, month)[1]
        start_date = date(year, month, 1)
        end_date = date(year, month, days_in_month)

        from attendance.models import Leave
        leaves_query = Leave.objects.filter(status='approved')
        if employee_id:
            leaves_query = leaves_query.filter(employee_id=employee_id)
        else:
            leaves_query = leaves_query.filter(intern_id=intern_id)

        leaves = leaves_query.filter(from_date__lte=end_date, to_date__gte=start_date)

        total_leaves = 0
        lop_days = 0

        for leave in leaves:
            overlap_start = max(leave.from_date, start_date)
            overlap_end = min(leave.to_date, end_date)
            overlap_days = (overlap_end - overlap_start).days + 1
            total_leaves += overlap_days
            if leave.leave_type == 'unpaid':
                lop_days += overlap_days

        # Per-day salary calculation based on total gross per month
        # We will use 30 as standard divisor since user example uses 30 days divisor
        per_day_salary = round(base_salary / 30, 2)
        leave_deduction = round(per_day_salary * lop_days, 2)

        return Response({
            'base_salary': base_salary,
            'total_leaves': total_leaves,
            'lop_days': lop_days,
            'per_day_salary': per_day_salary,
            'leave_deduction': leave_deduction,
        })


class AdvanceViewSet(viewsets.ModelViewSet):
    """Salary advance requests."""
    serializer_class = AdvanceSerializer
    pagination_class = None
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['employee__full_name']
    ordering = ['-requested_at']

    def get_permissions(self):
        if self.action in ['approve', 'reject']:
            return [IsHR()]
        return [IsHRorSelfReadOnly()]

    def get_queryset(self):
        qs = Advance.objects.select_related('employee')
        user = self.request.user
        if user.is_full_hr:
            return qs
        return qs.filter(employee__user=user)

    def perform_create(self, serializer):
        user = self.request.user
        if hasattr(user, 'employee_profile') and not user.is_full_hr:
            serializer.save(employee=user.employee_profile)
        else:
            serializer.save()

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        advance = self.get_object()
        advance.status = 'approved'
        advance.save()
        return Response(AdvanceSerializer(advance).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        advance = self.get_object()
        advance.status = 'rejected'
        advance.save()
        return Response(AdvanceSerializer(advance).data)
