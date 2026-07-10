from django.db import models
from django.utils import timezone
from accounts.models import User
from employees.models import Employee


class Intern(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('terminated', 'Terminated'),
    ]

    intern_id = models.CharField(max_length=30, unique=True, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='intern_profile', null=True, blank=True)

    name = models.CharField(max_length=150)
    email = models.EmailField(unique=True)
    mobile = models.CharField(max_length=15)
    college_name = models.CharField(max_length=200)
    domain = models.CharField(max_length=100)
    description = models.TextField(blank=True, help_text='Brief bio or internship objective')
    mentor = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name='mentees')

    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    performance_score = models.IntegerField(null=True, blank=True)
    certificate_issued = models.BooleanField(default=False)

    profile_picture = models.ImageField(upload_to='interns/', null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def _generate_id(self):
        """Generate ID: INT-PL-001, INT-PL-002, etc."""
        seq = Intern.objects.count() + 1
        candidate = f'INT-PL-{seq:03d}'
        while Intern.objects.filter(intern_id=candidate).exists():
            seq += 1
            candidate = f'INT-PL-{seq:03d}'
        return candidate

    def _provision_login(self):
        if self.user_id:
            return
        username = self.intern_id
        if User.objects.filter(username=username).exists():
            return
        parts = self.name.split()
        user = User.objects.create_user(
            username=username,
            email=self.email,
            password=self.mobile,
            first_name=parts[0] if parts else self.name,
            last_name=' '.join(parts[1:]) if len(parts) > 1 else '',
            role='intern',
            must_change_password=True,
        )
        self.user = user
        self.user_id = user.id
        Intern.objects.filter(pk=self.pk).update(user=user)
        self._send_welcome_email()

    def _send_welcome_email(self):
        from accounts.emails import send_welcome_email
        send_welcome_email(
            full_name=self.name,
            email=self.email,
            login_id=self.intern_id,
            password=self.mobile,
            role_label='Intern',
            extra={
                'Domain': self.domain,
                'College': self.college_name,
                'Duration': f'{self.start_date} to {self.end_date}',
            },
        )

    def save(self, *args, **kwargs):
        is_new = self._state.adding
        if not self.intern_id:
            self.intern_id = self._generate_id()
        super().save(*args, **kwargs)
        if is_new:
            self._provision_login()

    def __str__(self):
        return f'{self.intern_id} — {self.name}'


class InternTask(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
    ]

    intern = models.ForeignKey(Intern, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    due_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateField(auto_now_add=True)

    def __str__(self):
        return f'{self.intern.name} — {self.title}'
