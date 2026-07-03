from rest_framework import viewsets, filters
from accounts.permissions import IsHR
from .models import Client, Project
from .serializers import ClientSerializer, ProjectSerializer


class ClientViewSet(viewsets.ModelViewSet):
    """Manage clients (HR only)."""
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    permission_classes = [IsHR]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'contact_person', 'email', 'mobile']
    ordering = ['name']


class ProjectViewSet(viewsets.ModelViewSet):
    """Manage projects (HR only)."""
    queryset = Project.objects.select_related('client')
    serializer_class = ProjectSerializer
    permission_classes = [IsHR]
