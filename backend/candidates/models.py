from django.db import models
from django.utils import timezone
from accounts.models import User
from employees.models import Employee, Department


class JobVacancy(models.Model):
    EMPLOYMENT_TYPE_CHOICES = [
        ('full_time', 'Full-time'),
        ('part_time', 'Part-time'),
        ('internship', 'Internship'),
        ('contract', 'Contract'),
    ]
    STATUS_CHOICES = [('open', 'Open'), ('closed', 'Closed')]

    title = models.CharField(max_length=200)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name='vacancies')
    description = models.TextField(blank=True)
    requirements = models.TextField(blank=True)
    employment_type = models.CharField(max_length=20, choices=EMPLOYMENT_TYPE_CHOICES, default='full_time')
    location = models.CharField(max_length=150, blank=True, default='Kollam, Kerala')
    openings = models.PositiveIntegerField(default=1)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='open')
    posted_date = models.DateField(auto_now_add=True)
    closing_date = models.DateField(null=True, blank=True)

    class Meta:
        ordering = ['-posted_date']

    @property
    def applicant_count(self):
        return self.candidates.count()

    def __str__(self):
        return f'{self.title} ({self.get_status_display()})'


class Candidate(models.Model):
    STATUS_CHOICES = [
        ('applied', 'Applied'),
        ('shortlisted', 'Shortlisted'),
        ('interview_scheduled', 'Interview Scheduled'),
        ('interviewed', 'Interviewed'),
        ('selected', 'Selected'),
        ('rejected', 'Rejected'),
        ('offer_sent', 'Offer Sent'),
        ('offer_accepted', 'Offer Accepted'),
        ('joined', 'Joined'),
        ('rejected_offer', 'Rejected Offer'),
    ]
    
    INTERVIEW_STATUS_CHOICES = [
        ('scheduled', 'Scheduled'),
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('no_show', 'No Show'),
        ('rescheduled', 'Rescheduled'),
    ]

    candidate_id = models.CharField(max_length=30, unique=True, editable=False)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100, blank=True)
    email = models.EmailField(unique=True)
    mobile = models.CharField(max_length=15)
    
    position_applied = models.CharField(max_length=200)
    college_name = models.CharField(max_length=200, blank=True, help_text="College/University the candidate studied at")
    resume = models.FileField(upload_to='resumes/', null=True, blank=True)
    cover_letter = models.TextField(blank=True)
    
    # Interview Details
    interview_scheduled_date = models.DateField(null=True, blank=True)
    interview_scheduled_time = models.TimeField(null=True, blank=True)
    interview_status = models.CharField(max_length=20, choices=INTERVIEW_STATUS_CHOICES, default='pending')
    interview_notes = models.TextField(blank=True)
    interviewed_by = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name='interviewed_candidates')
    interview_date = models.DateField(null=True, blank=True)
    interview_rating = models.IntegerField(null=True, blank=True, help_text="Rating out of 10")
    
    # Selection & Offer
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='applied')
    selection_date = models.DateField(null=True, blank=True)
    
    # Offer Letter
    offer_letter_generated = models.BooleanField(default=False)
    offer_letter_file = models.FileField(upload_to='offer_letters/', null=True, blank=True)
    offer_letter_sent = models.BooleanField(default=False)
    offer_letter_sent_date = models.DateTimeField(null=True, blank=True)
    
    # Welcome Email
    welcome_email_sent = models.BooleanField(default=False)
    welcome_email_sent_date = models.DateTimeField(null=True, blank=True)
    email_status = models.CharField(max_length=20, default='pending', choices=[
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('failed', 'Failed'),
        ('resent', 'Resent'),
    ])
    email_attempts = models.IntegerField(default=0)
    email_error_message = models.TextField(blank=True)
    
    # Joining Details
    joining_date = models.DateField(null=True, blank=True)
    joining_confirmed = models.BooleanField(default=False)
    joining_confirmation_date = models.DateTimeField(null=True, blank=True)
    
    # General
    source = models.CharField(max_length=100, blank=True)  # LinkedIn, Referral, etc
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def _generate_id(self):
        seq = Candidate.objects.count() + 1
        candidate = f'CAND-PL-{seq:03d}'
        while Candidate.objects.filter(candidate_id=candidate).exists():
            seq += 1
            candidate = f'CAND-PL-{seq:03d}'
        return candidate

    def save(self, *args, **kwargs):
        if not self.candidate_id:
            self.candidate_id = self._generate_id()
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.candidate_id} — {self.first_name} {self.last_name}'

    @property
    def full_name(self):
        return f'{self.first_name} {self.last_name}'.strip()
