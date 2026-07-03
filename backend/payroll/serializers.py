from rest_framework import serializers
from .models import Salary, Advance


class SalarySerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    employee_code = serializers.SerializerMethodField()
    person_type = serializers.CharField(read_only=True)
    gross = serializers.ReadOnlyField()
    total_deductions = serializers.ReadOnlyField()

    class Meta:
        model = Salary
        fields = '__all__'
        read_only_fields = ['net_salary']

    def get_employee_name(self, obj):
        return obj.person_name

    def get_employee_code(self, obj):
        return obj.person_code

    def validate(self, data):
        employee = data.get('employee', getattr(self.instance, 'employee', None))
        intern = data.get('intern', getattr(self.instance, 'intern', None))
        if bool(employee) == bool(intern):
            raise serializers.ValidationError('Select exactly one employee or intern for this salary record.')
        return data


class AdvanceSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)

    class Meta:
        model = Advance
        fields = '__all__'
        read_only_fields = ['requested_at']
