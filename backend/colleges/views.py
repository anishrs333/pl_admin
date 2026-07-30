from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
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

    @action(detail=True, methods=['post'])
    def toggle_called(self, request, pk=None):
        college = self.get_object()
        if college.call_status == 'called':
            college.call_status = 'not_called'
            college.last_called_date = None
        else:
            college.call_status = 'called'
            college.last_called_date = timezone.now().date()
        college.save(update_fields=['call_status', 'last_called_date'])
        return Response(CollegeSerializer(college, context={'request': request}).data)

    @action(detail=True, methods=['post'])
    def toggle_status(self, request, pk=None):
        college = self.get_object()
        college.status = 'updated' if college.status != 'updated' else 'not_updated'
        college.save(update_fields=['status'])
        return Response(CollegeSerializer(college, context={'request': request}).data)


class WorkshopViewSet(viewsets.ModelViewSet):
    """Manage workshops (HR only)."""
    queryset = Workshop.objects.select_related('college')
    serializer_class = WorkshopSerializer
    permission_classes = [IsHR]
