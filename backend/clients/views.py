from decimal import Decimal, ROUND_HALF_UP
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from accounts.permissions import IsFullHR
from .models import Client, Project
from .serializers import ClientSerializer, ProjectSerializer


class ClientViewSet(viewsets.ModelViewSet):
    """Manage clients (HR only)."""
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    permission_classes = [IsFullHR]
    pagination_class = None
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'contact_person', 'email', 'mobile']
    ordering = ['name']


class ProjectViewSet(viewsets.ModelViewSet):
    """Manage projects (HR only)."""
    queryset = Project.objects.select_related('client')
    serializer_class = ProjectSerializer
    permission_classes = [IsFullHR]
    pagination_class = None

    @action(detail=True, methods=['post'], permission_classes=[IsFullHR])
    def mark_cleared(self, request, pk=None):
        """Mark project as fully paid — sets paid_amount = total_amount."""
        project = self.get_object()
        if project.paid_amount >= project.total_amount:
            return Response({'detail': 'Project is already fully paid.'}, status=status.HTTP_400_BAD_REQUEST)
        project.paid_amount = project.total_amount
        project.save(update_fields=['paid_amount'])
        return Response(ProjectSerializer(project).data)

    @action(detail=True, methods=['post'], permission_classes=[IsFullHR])
    def add_payment(self, request, pk=None):
        """Add a partial payment to the project."""
        project = self.get_object()
        amount = request.data.get('amount')
        if amount is None:
            return Response({'detail': 'Amount is required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            amount = Decimal(str(amount)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        except Exception:
            return Response({'detail': 'Invalid amount.'}, status=status.HTTP_400_BAD_REQUEST)
        if amount <= 0:
            return Response({'detail': 'Amount must be positive.'}, status=status.HTTP_400_BAD_REQUEST)
        new_paid = project.paid_amount + amount
        if new_paid > project.total_amount:
            return Response({'detail': 'Payment exceeds total amount.'}, status=status.HTTP_400_BAD_REQUEST)
        project.paid_amount = new_paid
        project.save(update_fields=['paid_amount'])
        return Response(ProjectSerializer(project).data)
