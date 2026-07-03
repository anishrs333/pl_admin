from django.contrib import admin
from .models import Attendance, Leave


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ['employee', 'date', 'check_in', 'check_out', 'work_hours', 'status']
    list_filter = ['status', 'date']
    search_fields = ['employee__full_name', 'employee__employee_id']
    date_hierarchy = 'date'


@admin.register(Leave)
class LeaveAdmin(admin.ModelAdmin):
    list_display = ['employee', 'leave_type', 'from_date', 'to_date', 'total_days', 'status', 'created_at']
    list_filter = ['leave_type', 'status']
    search_fields = ['employee__full_name', 'employee__employee_id']
    readonly_fields = ['created_at', 'reviewed_at', 'total_days']
