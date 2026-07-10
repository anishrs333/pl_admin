from django.db import models
from django.utils import timezone
from accounts.models import User


class Department(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name


class Designation(models.Model):
    name = models.CharField(max_length=100)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, related_name='designations')

    class Meta:
        unique_together = ['name', 'department']

    def __str__(self):
        return self.name


class Employee(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'), ('probation', 'Probation'),
        ('on_leave', 'On Leave'), ('inactive', 'Inactive'),
    ]

    employee_id = models.CharField(max_length=30, unique=True, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='employee_profile', null=True, blank=True)

    full_name = models.CharField(max_length=150)
    email = models.EmailField(unique=True)
    mobile = models.CharField(max_length=15)

    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, related_name='employees')
    designation = models.ForeignKey(Designation, on_delete=models.SET_NULL, null=True, related_name='employees')

    joining_date = models.DateField()
    salary = models.DecimalField(max_digits=10, decimal_places=2)

    address = models.TextField(blank=True)
    emergency_contact_name = models.CharField(max_length=100, blank=True)
    emergency_contact = models.CharField(max_length=15, blank=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    profile_picture = models.ImageField(upload_to='employees/', null=True, blank=True)
    document = models.FileField(upload_to='employee_docs/', null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def _generate_id(self):
        """Generate ID: EMP-PL-001, EMP-PL-002, etc."""
        seq = Employee.objects.count() + 1
        candidate = f'EMP-PL-{seq:03d}'
        while Employee.objects.filter(employee_id=candidate).exists():
            seq += 1
            candidate = f'EMP-PL-{seq:03d}'
        return candidate

    def _provision_login(self):
        """Create the linked User account: username = employee_id, password = mobile number."""
        if self.user_id:
            return
        username = self.employee_id
        if User.objects.filter(username=username).exists():
            return
        parts = self.full_name.split()
        user = User.objects.create_user(
            username=username,
            email=self.email,
            password=self.mobile,
            first_name=parts[0] if parts else self.full_name,
            last_name=' '.join(parts[1:]) if len(parts) > 1 else '',
            role='employee',
            must_change_password=True,
        )
        self.user = user
        self.user_id = user.id
        Employee.objects.filter(pk=self.pk).update(user=user)
        self._send_welcome_email()

    def _send_welcome_email(self):
        from accounts.emails import send_welcome_email
        send_welcome_email(
            full_name=self.full_name,
            email=self.email,
            login_id=self.employee_id,
            password=self.mobile,
            role_label='Employee',
            extra={
                'Department': self.department.name if self.department else '—',
                'Designation': self.designation.name if self.designation else '—',
                'Joining date': self.joining_date.strftime('%d-%m-%Y'),
            },
        )

    def save(self, *args, **kwargs):
        is_new = self._state.adding
        if not self.employee_id:
            self.employee_id = self._generate_id()
        super().save(*args, **kwargs)
        if is_new:
            self._provision_login()

    def __str__(self):
        return f'{self.employee_id} — {self.full_name}'
