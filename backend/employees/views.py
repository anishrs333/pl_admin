from rest_framework import viewsets, filters, parsers
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
