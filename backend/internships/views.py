from rest_framework import viewsets, filters, parsers, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import HttpResponse
from accounts.permissions import IsHR, IsFullHR, IsHRorSelfReadOnly
from .models import Intern, InternTask
from .serializers import InternSerializer, InternTaskSerializer


class InternViewSet(viewsets.ModelViewSet):
    """Intern management. HR/TL sees everyone; an intern can view their own record."""
    serializer_class = InternSerializer
    permission_classes = [IsHRorSelfReadOnly]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]
    pagination_class = None
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'email', 'intern_id']
    ordering = ['-created_at']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsHR()]
        if self.action == 'receipt_pdf':
            return [IsFullHR()]
        return [IsHRorSelfReadOnly()]

    def get_queryset(self):
        qs = Intern.objects.select_related('mentor')
        user = self.request.user
        if user.is_hr:
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
            response_data['warning'] = 'Intern created, but welcome email failed to send. Please check SMTP settings.'
        return Response(response_data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=True, methods=['post'], permission_classes=[IsHR])
    def resend_welcome_email(self, request, pk=None):
        intern = self.get_object()
        success = intern._send_welcome_email()
        if success:
            return Response({'detail': 'Welcome email resent successfully.'})
        return Response(
            {'detail': 'Failed to send welcome email. Check SMTP settings.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    @action(detail=True, methods=['get'], permission_classes=[IsFullHR], url_path='receipt-pdf')
    def receipt_pdf(self, request, pk=None):
        """Download payment confirmation receipt PDF for a paid intern."""
        intern = self.get_object()
        if intern.internship_type != 'paid':
            return Response(
                {'detail': 'Receipt is only available for paid interns.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        from .intern_receipt_pdf import generate_intern_receipt_pdf
        pdf_buffer = generate_intern_receipt_pdf(intern)
        response = HttpResponse(pdf_buffer, content_type='application/pdf')
        filename = f'receipt_{intern.intern_id}.pdf'
        if request.query_params.get('inline') == '1':
            response['Content-Disposition'] = f'inline; filename="{filename}"'
        else:
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response


class InternTaskViewSet(viewsets.ModelViewSet):
    """Daily task tracking for interns (separate from the shared Task app)."""
    serializer_class = InternTaskSerializer
    pagination_class = None
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'intern__name']
    ordering = ['-created_at']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsHR()]
        return [IsHRorSelfReadOnly()]

    def get_queryset(self):
        qs = InternTask.objects.select_related('intern')
        user = self.request.user
        if user.is_hr:
            return qs
        if hasattr(user, 'intern_profile'):
            return qs.filter(intern=user.intern_profile)
        return qs.none()

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        task = self.get_object()
        task.status = 'completed'
        task.save()
        return Response(InternTaskSerializer(task).data)
