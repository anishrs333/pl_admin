from django.db import models
from employees.models import Employee


class Salary(models.Model):
    STATUS_CHOICES = [('pending', 'Pending'), ('paid', 'Paid')]

    # Exactly one of employee / intern is set per salary record.
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='salaries', null=True, blank=True)
    intern = models.ForeignKey('internships.Intern', on_delete=models.CASCADE, related_name='salaries', null=True, blank=True)
    month = models.IntegerField()
    year = models.IntegerField()
    basic_salary = models.DecimalField(max_digits=10, decimal_places=2)
    hra = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    allowances = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    incentives = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    pf_deduction = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tax_deduction = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    other_deductions = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Leave deduction fields
    leaves_taken = models.PositiveIntegerField(default=0)
    lop_days = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    leave_deduction = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    per_day_salary = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    net_salary = models.DecimalField(max_digits=10, decimal_places=2, editable=False)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    paid_date = models.DateField(null=True, blank=True)
    payment_ref = models.CharField(max_length=40, blank=True)

    class Meta:
        unique_together = [('employee', 'month', 'year'), ('intern', 'month', 'year')]
        ordering = ['-year', '-month']

    @property
    def gross(self):
        return self.basic_salary + self.hra + self.allowances + self.incentives

    @property
    def total_deductions(self):
        return self.pf_deduction + self.tax_deduction + self.other_deductions + self.leave_deduction

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

    def save(self, *args, **kwargs):
        # Auto-compute per-day salary and leave deduction if not set
        if self.per_day_salary == 0 and self.basic_salary > 0:
            self.per_day_salary = round(self.basic_salary / 30, 2)
        if self.leave_deduction == 0 and self.lop_days > 0:
            self.leave_deduction = round(self.per_day_salary * self.lop_days, 2)
            
        self.net_salary = self.gross - self.total_deductions
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.person_name} — {self.month}/{self.year}'


class Advance(models.Model):
    STATUS_CHOICES = [('pending', 'Pending'), ('approved', 'Approved'), ('rejected', 'Rejected'), ('repaid', 'Repaid')]

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='advances')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    requested_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.employee.full_name} — ₹{self.amount}'
