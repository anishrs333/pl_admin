from rest_framework import serializers
from .models import Department, Designation, Employee


class DepartmentSerializer(serializers.ModelSerializer):
    employee_count = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = ['id', 'name', 'description', 'employee_count']

    def get_employee_count(self, obj):
        return obj.employees.filter(status='active').count()


class DesignationSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        model = Designation
        fields = ['id', 'name', 'department', 'department_name']


class EmployeeSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    designation_name = serializers.CharField(source='designation.name', read_only=True)
    login_username = serializers.CharField(source='user.username', read_only=True)
    profile_picture_url = serializers.SerializerMethodField()

    class Meta:
        model = Employee
        fields = [
            'id', 'employee_id', 'full_name', 'email', 'mobile',
            'department', 'department_name', 'designation', 'designation_name',
            'joining_date', 'salary', 'address',
            'emergency_contact_name', 'emergency_contact',
            'status', 'profile_picture', 'profile_picture_url', 'document',
            'login_username', 'created_at', 'updated_at',
        ]
        read_only_fields = ['employee_id', 'created_at', 'updated_at']

    def get_profile_picture_url(self, obj):
        request = self.context.get('request')
        if obj.profile_picture and request:
            return request.build_absolute_uri(obj.profile_picture.url)
        return None


class EmployeeListSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    designation_name = serializers.CharField(source='designation.name', read_only=True)
    profile_picture_url = serializers.SerializerMethodField()

    class Meta:
        model = Employee
        fields = [
            'id', 'employee_id', 'full_name', 'email', 'mobile',
            'department_name', 'designation_name', 'status', 'joining_date',
            'profile_picture', 'profile_picture_url',
        ]

    def get_profile_picture_url(self, obj):
        request = self.context.get('request')
        if obj.profile_picture and request:
            return request.build_absolute_uri(obj.profile_picture.url)
        return None
