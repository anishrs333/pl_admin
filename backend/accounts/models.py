from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Single auth table for everyone who can log in:
      - hr        -> full console access (the only staff role in this build)
      - employee  -> self-service only, linked via Employee.user
      - intern    -> self-service only, linked via Intern.user
    """
    ROLE_CHOICES = [
        ('hr', 'HR Administrator'),
        ('employee', 'Employee'),
        ('intern', 'Intern'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='employee')
    phone = models.CharField(max_length=15, blank=True)
    must_change_password = models.BooleanField(default=True)
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def is_hr(self):
        return self.role == 'hr' or self.is_superuser

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
