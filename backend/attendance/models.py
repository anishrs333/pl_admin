from django.db import models
from django.utils import timezone
from employees.models import Employee


class Attendance(models.Model):
    STATUS_CHOICES = [
        ('present', 'Present'),
        ('absent', 'Absent'),
        ('late', 'Late'),
        ('half_day', 'Half Day'),
    ]

    # Exactly one of employee / intern is set per record.
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='attendance_records', null=True, blank=True)
    intern = models.ForeignKey('internships.Intern', on_delete=models.CASCADE, related_name='attendance_records', null=True, blank=True)
    date = models.DateField()
    check_in = models.DateTimeField(null=True, blank=True)
    check_out = models.DateTimeField(null=True, blank=True)
    work_hours = models.FloatField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='present')
    is_late = models.BooleanField(default=False)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [('employee', 'date'), ('intern', 'date')]
        ordering = ['-date']

    @property
    def person(self):
        return self.employee or self.intern

    @property
    def person_name(self):
        return self.employee.full_name if self.employee else (self.intern.name if self.intern else '—')

    @property
    def person_code(self):
        return self.employee.employee_id if self.employee else (self.intern.intern_id if self.intern else '—')

    @property
    def person_type(self):
        return 'employee' if self.employee_id else 'intern'

    def __str__(self):
        return f'{self.person_name} — {self.date}'


class Leave(models.Model):
    LEAVE_TYPE_CHOICES = [
        ('sick', 'Sick Leave'),
        ('paid', 'Paid Leave'),
        ('unpaid', 'Unpaid Leave'),
        ('casual', 'Casual Leave'),
        ('earned', 'Earned Leave'),
        ('maternity', 'Maternity Leave'),
        ('paternity', 'Paternity Leave'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
    ]

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='leaves', null=True, blank=True)
    intern = models.ForeignKey('internships.Intern', on_delete=models.CASCADE, related_name='leaves', null=True, blank=True)
    leave_type = models.CharField(max_length=20, choices=LEAVE_TYPE_CHOICES)
    from_date = models.DateField()
    to_date = models.DateField()
    reason = models.TextField()
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    reviewer = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_leaves')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewer_notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    @property
    def total_days(self):
        delta = self.to_date - self.from_date
        return delta.days + 1

    @property
    def person(self):
        return self.employee or self.intern

    @property
    def person_name(self):
        return self.employee.full_name if self.employee else (self.intern.name if self.intern else '—')

    @property
    def person_code(self):
        return self.employee.employee_id if self.employee else (self.intern.intern_id if self.intern else '—')

    @property
    def person_type(self):
        return 'employee' if self.employee_id else 'intern'

    def __str__(self):
        return f'{self.person_name} — {self.leave_type} ({self.from_date} to {self.to_date})'


class WorkFromHome(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
    ]

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='wfh_requests')
    from_date = models.DateField()
    to_date = models.DateField()
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    reviewer = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_wfh')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewer_notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    @property
    def total_days(self):
        delta = self.to_date - self.from_date
        return delta.days + 1

    def __str__(self):
        return f'{self.employee.full_name} — WFH ({self.from_date} to {self.to_date})'
