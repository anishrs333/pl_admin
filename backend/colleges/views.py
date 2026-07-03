from rest_framework import viewsets, filters
from accounts.permissions import IsHR
from .models import College, Workshop
from .serializers import CollegeSerializer, WorkshopSerializer


class CollegeViewSet(viewsets.ModelViewSet):
    """Manage colleges (HR only)."""
    queryset = College.objects.all()
    serializer_class = CollegeSerializer
    permission_classes = [IsHR]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'contact_person', 'email']
    ordering = ['name']


class WorkshopViewSet(viewsets.ModelViewSet):
    """Manage workshops (HR only)."""
    queryset = Workshop.objects.select_related('college')
    serializer_class = WorkshopSerializer
    permission_classes = [IsHR]
