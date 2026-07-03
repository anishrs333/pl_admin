from rest_framework import serializers
from .models import WorkFromHome


class WorkFromHomeSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_id = serializers.CharField(source='employee.employee_id', read_only=True)
    reviewer_name = serializers.CharField(source='reviewer.full_name', read_only=True)

    class Meta:
        model = WorkFromHome
        fields = [
            'id', 'employee', 'employee_name', 'employee_id',
            'from_date', 'to_date', 'reason', 'status',
            'reviewer', 'reviewer_name', 'reviewed_at', 'reviewer_notes',
            'created_at'
        ]
        read_only_fields = ['reviewed_at', 'created_at', 'reviewer']

    @property
    def total_days(self):
        delta = self.initial_data['to_date'] - self.initial_data['from_date']
        return delta.days + 1
