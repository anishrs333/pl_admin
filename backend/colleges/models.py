from django.db import models

class College(models.Model):
    name = models.CharField(max_length=200)
    contact_person = models.CharField(max_length=100)
    mobile = models.CharField(max_length=15)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)
    def __str__(self): return self.name

class Workshop(models.Model):
    STATUS_CHOICES = [('scheduled','Scheduled'),('completed','Completed'),('cancelled','Cancelled')]
    college = models.ForeignKey(College, on_delete=models.CASCADE, related_name='workshops')
    title = models.CharField(max_length=200)
    date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    remarks = models.TextField(blank=True)
    def __str__(self): return f'{self.college.name} — {self.title}'
