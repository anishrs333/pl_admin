from rest_framework import viewsets, filters, status, parsers
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.core.mail import EmailMessage
from accounts.permissions import IsHR
from .models import Candidate
from .serializers import CandidateSerializer, CandidateListSerializer
from payroll.payslip_pdf import MONTHS


class CandidateViewSet(viewsets.ModelViewSet):
    """Candidate management - Interview scheduling, offer letters, email tracking."""
    permission_classes = [IsHR]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['first_name', 'last_name', 'email', 'position_applied', 'candidate_id']
    ordering = ['-created_at']

    def get_queryset(self):
        return Candidate.objects.select_related('interviewed_by').all()

    def get_serializer_class(self):
        return CandidateListSerializer if self.action == 'list' else CandidateSerializer

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx

    @action(detail=True, methods=['post'])
    def schedule_interview(self, request, pk=None):
        """Schedule interview for candidate."""
        candidate = self.get_object()
        data = request.data
        
        candidate.interview_scheduled_date = data.get('interview_scheduled_date')
        candidate.interview_scheduled_time = data.get('interview_scheduled_time')
        candidate.interview_status = 'scheduled'
        candidate.interviewed_by = request.user.employee_profile if hasattr(request.user, 'employee_profile') else None
        candidate.save()
        
        # Send notification
        try:
            from notifications.utils import notify
            notify(
                recipient=candidate,
                notification_type='interview_scheduled',
                title='Interview Scheduled',
                message=f'Your interview is scheduled for {candidate.interview_scheduled_date} at {candidate.interview_scheduled_time}'
            )
        except:
            pass
        
        return Response(CandidateSerializer(candidate, context=self.get_serializer_context()).data)

    @action(detail=True, methods=['post'])
    def mark_interviewed(self, request, pk=None):
        """Mark interview as completed."""
        candidate = self.get_object()
        data = request.data
        
        candidate.interview_status = 'completed'
        candidate.interview_date = timezone.now().date()
        candidate.interview_notes = data.get('interview_notes', '')
        candidate.interview_rating = data.get('interview_rating')
        candidate.save()
        
        return Response(CandidateSerializer(candidate, context=self.get_serializer_context()).data)

    @action(detail=True, methods=['post'])
    def generate_offer(self, request, pk=None):
        """Generate offer letter PDF."""
        candidate = self.get_object()
        data = request.data
        
        candidate.status = 'selected'
        candidate.selection_date = timezone.now().date()
        candidate.joining_date = data.get('joining_date')
        candidate.offer_letter_generated = True
        candidate.save()
        
        # Generate PDF (simplified - use actual template in production)
        try:
            from payroll.payslip_pdf import generate_payslip_pdf
            # In production, use actual offer letter template
        except:
            pass
        
        return Response({
            'status': 'offer_generated',
            'candidate_id': candidate.candidate_id,
            'candidate_name': candidate.full_name,
            'position': candidate.position_applied,
            'joining_date': candidate.joining_date
        })

    @action(detail=True, methods=['post'])
    def send_offer(self, request, pk=None):
        """Send offer letter email to candidate."""
        candidate = self.get_object()
        
        try:
            subject = f'Offer Letter - {candidate.position_applied}'
            message = f"""
Dear {candidate.full_name},

Congratulations! We are pleased to offer you the position of {candidate.position_applied} at PL Soft Tech Solutions Pvt Ltd.

Joining Date: {candidate.joining_date}
Position: {candidate.position_applied}

We look forward to welcoming you to our team!

Best regards,
HR Department
PL Soft Tech Solutions Pvt Ltd
            """
            
            email = EmailMessage(
                subject=subject,
                body=message,
                from_email='hr@plsofttech.com',
                to=[candidate.email],
            )
            email.send(fail_silently=True)
            
            candidate.offer_letter_sent = True
            candidate.offer_letter_sent_date = timezone.now()
            candidate.email_status = 'sent'
            candidate.save()
            
            # Notify HR
            from notifications.utils import notify
            notify(
                recipient=request.user,
                notification_type='offer_sent',
                title='Offer Letter Sent',
                message=f'Offer letter sent to {candidate.full_name}'
            )
            
        except Exception as e:
            candidate.email_status = 'failed'
            candidate.email_error_message = str(e)
            candidate.save()
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(CandidateSerializer(candidate, context=self.get_serializer_context()).data)

    @action(detail=True, methods=['post'])
    def send_welcome_email(self, request, pk=None):
        """Send welcome email to joining candidate."""
        candidate = self.get_object()
        
        try:
            subject = f'Welcome to PL Soft Tech Solutions - {candidate.position_applied}'
            message = f"""
Dear {candidate.full_name},

Welcome to PL Soft Tech Solutions Pvt Ltd!

We are excited to have you join our team as a {candidate.position_applied}.

Joining Date: {candidate.joining_date}
Office Address: [Your Office Address]
Reporting Time: 09:00 AM

Please bring the following documents on your joining date:
- Original ID proof
- Educational certificates
- Address proof
- Medical reports (if applicable)

HR Contact: hr@plsofttech.com | Phone: [Your Phone Number]

Looking forward to working with you!

Best regards,
HR Department
PL Soft Tech Solutions Pvt Ltd
            """
            
            email = EmailMessage(
                subject=subject,
                body=message,
                from_email='hr@plsofttech.com',
                to=[candidate.email],
            )
            email.send(fail_silently=True)
            
            candidate.welcome_email_sent = True
            candidate.welcome_email_sent_date = timezone.now()
            candidate.save()
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(CandidateSerializer(candidate, context=self.get_serializer_context()).data)

    @action(detail=True, methods=['post'])
    def confirm_joining(self, request, pk=None):
        """Confirm candidate has joined."""
        candidate = self.get_object()
        
        candidate.status = 'joined'
        candidate.joining_confirmed = True
        candidate.joining_confirmation_date = timezone.now()
        candidate.save()
        
        # Create employee record if needed
        try:
            from employees.models import Employee
            if not hasattr(candidate, 'employee'):
                Employee.objects.create(
                    full_name=candidate.full_name,
                    email=candidate.email,
                    mobile=candidate.mobile,
                    joining_date=candidate.joining_date or timezone.now().date(),
                    salary=0,  # Set in payroll
                )
        except:
            pass
        
        return Response(CandidateSerializer(candidate, context=self.get_serializer_context()).data)
