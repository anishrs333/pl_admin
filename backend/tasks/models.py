from django.db import models
from employees.models import Employee


class Task(models.Model):
    PRIORITY_CHOICES = [('low', 'Low'), ('medium', 'Medium'), ('high', 'High'), ('urgent', 'Urgent')]
    STATUS_CHOICES = [('pending', 'Pending'), ('in_progress', 'In Progress'), ('completed', 'Completed')]

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    # Exactly one of assigned_to / assigned_to_intern is set per task.
    assigned_to = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='assigned_tasks', null=True, blank=True)
    assigned_to_intern = models.ForeignKey('internships.Intern', on_delete=models.CASCADE, related_name='assigned_tasks', null=True, blank=True)
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    deadline = models.DateField()
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    @property
    def assignee(self):
        return self.assigned_to or self.assigned_to_intern

    @property
    def assignee_name(self):
        return self.assigned_to.full_name if self.assigned_to else (self.assigned_to_intern.name if self.assigned_to_intern else '—')

    @property
    def assignee_type(self):
        return 'employee' if self.assigned_to_id else 'intern'

    def __str__(self):
        return f'{self.title} → {self.assignee_name}'
