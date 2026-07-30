from django.db import models

class College(models.Model):
    STATUS_CHOICES = [('updated', 'Updated'), ('not_updated', 'Not Updated')]
    CALL_STATUS_CHOICES = [('called', 'Called'), ('not_called', 'Not Called')]

    name = models.CharField(max_length=200)
    contact_person = models.CharField(max_length=100)
    mobile = models.CharField(max_length=15)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='not_updated')
    call_status = models.CharField(max_length=20, choices=CALL_STATUS_CHOICES, default='not_called')
    last_called_date = models.DateField(null=True, blank=True)
    follow_up_notes = models.TextField(blank=True)

    def __str__(self): return self.name

class Workshop(models.Model):
    STATUS_CHOICES = [('scheduled','Scheduled'),('completed','Completed'),('cancelled','Cancelled')]
    college = models.ForeignKey(College, on_delete=models.CASCADE, related_name='workshops')
    title = models.CharField(max_length=200)
    date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    remarks = models.TextField(blank=True)
    def __str__(self): return f'{self.college.name} — {self.title}'
