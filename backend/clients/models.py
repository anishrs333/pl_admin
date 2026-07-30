from django.db import models

class Client(models.Model):
    name = models.CharField(max_length=200)
    contact_person = models.CharField(max_length=100)
    email = models.EmailField()
    mobile = models.CharField(max_length=15)
    address = models.TextField(blank=True)
    def __str__(self): return self.name

class Project(models.Model):
    STATUS_CHOICES = [('active','Active'),('completed','Completed'),('on_hold','On Hold')]
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='projects')
    name = models.CharField(max_length=200)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    paid_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')

    @property
    def balance_amount(self):
        return self.total_amount - self.paid_amount

    def clean(self):
        super().clean()
        if self.paid_amount > self.total_amount:
            raise models.ValidationError({'paid_amount': 'Paid amount cannot exceed total amount.'})

    def __str__(self): return f'{self.client.name} — {self.name}'
