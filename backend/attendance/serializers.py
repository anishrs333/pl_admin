from rest_framework import serializers
from .models import Attendance, Leave


class AttendanceSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    employee_code = serializers.SerializerMethodField()
    employee_picture = serializers.SerializerMethodField()
    person_type = serializers.CharField(read_only=True)

    class Meta:
        model = Attendance
        fields = [
            'id', 'employee', 'intern', 'employee_name', 'employee_code', 'employee_picture', 'person_type',
            'date', 'check_in', 'check_out', 'status', 'work_hours', 'notes',
        ]

    def get_employee_name(self, obj):
        return obj.person_name

    def get_employee_code(self, obj):
        return obj.person_code

    def get_employee_picture(self, obj):
        request = self.context.get('request')
        pic = obj.employee.profile_picture if obj.employee else (obj.intern.profile_picture if obj.intern else None)
        if pic and request:
            return request.build_absolute_uri(pic.url)
        return None


class LeaveSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    employee_code = serializers.SerializerMethodField()
    person_type = serializers.CharField(read_only=True)
    leave_type_display = serializers.CharField(source='get_leave_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    total_days = serializers.ReadOnlyField()

    class Meta:
        model = Leave
        fields = [
            'id', 'employee', 'intern', 'employee_name', 'employee_code', 'person_type',
            'leave_type', 'leave_type_display',
            'from_date', 'to_date', 'total_days',
            'reason', 'description',
            'status', 'status_display',
            'created_at', 'reviewed_at', 'reviewer_notes',
        ]
        read_only_fields = ['created_at', 'reviewed_at', 'employee', 'intern']

    def get_employee_name(self, obj):
        return obj.person_name

    def get_employee_code(self, obj):
        return obj.person_code

    def validate(self, data):
        from_date = data.get('from_date')
        to_date = data.get('to_date')
        if from_date and to_date and from_date > to_date:
            raise serializers.ValidationError({'to_date': 'End date must be after start date.'})
        return data
