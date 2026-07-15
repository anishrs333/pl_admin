from rest_framework import viewsets, filters, parsers, status
from rest_framework.decorators import action
from rest_framework.response import Response
from accounts.permissions import IsHR, IsHRorSelfReadOnly
from .models import Employee, Department, Designation
from .serializers import EmployeeSerializer, DepartmentSerializer, DesignationSerializer


class DepartmentViewSet(viewsets.ModelViewSet):
    """Department management."""
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsHR]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']


class DesignationViewSet(viewsets.ModelViewSet):
    """Designation management."""
    queryset = Designation.objects.select_related('department')
    serializer_class = DesignationSerializer
    permission_classes = [IsHR]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']


class EmployeeViewSet(viewsets.ModelViewSet):
    """Employee management. HR sees/manages everyone; an employee can view their own record."""
    serializer_class = EmployeeSerializer
    permission_classes = [IsHRorSelfReadOnly]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['full_name', 'email', 'employee_id']
    ordering = ['-created_at']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsHR()]
        return [IsHRorSelfReadOnly()]

    def get_queryset(self):
        qs = Employee.objects.select_related('department', 'designation')
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
            response_data['warning'] = 'Employee created, but welcome email failed to send. Please check SMTP settings.'
        return Response(response_data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=True, methods=['post'], permission_classes=[IsHR])
    def resend_welcome_email(self, request, pk=None):
        employee = self.get_object()
        success = employee._send_welcome_email()
        if success:
            return Response({'detail': 'Welcome email resent successfully.'})
        return Response(
            {'detail': 'Failed to send welcome email. Check SMTP settings.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
