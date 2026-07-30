from rest_framework import serializers
from .models import Client, Project

class ProjectSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.name', read_only=True)
    balance_amount = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = Project
        fields = '__all__'

    def validate(self, data):
        paid_amount = data.get('paid_amount', getattr(self.instance, 'paid_amount', 0))
        total_amount = data.get('total_amount', getattr(self.instance, 'total_amount', 0))
        if paid_amount > total_amount:
            raise serializers.ValidationError({'paid_amount': 'Paid amount cannot exceed total amount.'})
        return data

class ClientSerializer(serializers.ModelSerializer):
    projects = ProjectSerializer(many=True, read_only=True)
    class Meta:
        model = Client
        fields = '__all__'
