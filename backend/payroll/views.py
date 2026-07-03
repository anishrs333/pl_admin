from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import HttpResponse
from django.utils import timezone
from accounts.permissions import IsHR, IsHRorSelfReadOnly
from .models import Salary, Advance
from .serializers import SalarySerializer, AdvanceSerializer
from .payslip_pdf import generate_payslip_pdf


class SalaryViewSet(viewsets.ModelViewSet):
    """Payroll management — Employees & Interns."""
    serializer_class = SalarySerializer
    permission_classes = [IsHRorSelfReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['employee__full_name', 'intern__name']
    ordering = ['-month', '-year']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'mark_paid']:
            return [IsHR()]
        return [IsHRorSelfReadOnly()]

    def get_queryset(self):
        qs = Salary.objects.select_related('employee', 'intern')
        user = self.request.user
        if user.role == 'hr' or user.is_superuser:
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

    @action(detail=True, methods=['get'])
    def slip_pdf(self, request, pk=None):
        """Download payslip PDF."""
        salary = self.get_object()
        pdf_buffer = generate_payslip_pdf(salary)
        response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="Payslip_{salary.person_code}_{salary.month}_{salary.year}.pdf"'
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


class AdvanceViewSet(viewsets.ModelViewSet):
    """Salary advance requests."""
    serializer_class = AdvanceSerializer
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
        if user.role == 'hr' or user.is_superuser:
            return qs
        return qs.filter(employee__user=user)

    def perform_create(self, serializer):
        user = self.request.user
        if hasattr(user, 'employee_profile') and not (user.role == 'hr' or user.is_superuser):
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
