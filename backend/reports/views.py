from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from accounts.permissions import IsHR
from employees.models import Employee, Department
from internships.models import Intern
from attendance.models import Attendance, Leave
from candidates.models import Candidate
from tasks.models import Task
from payroll.models import Salary


class DashboardStatsView(APIView):
    permission_classes = [IsHR]

    def get(self, request):
        today = timezone.now().date()
        return Response({
            'total_employees': Employee.objects.filter(status='active').count(),
            'total_interns': Intern.objects.filter(status='active').count(),
            'total_candidates': Candidate.objects.exclude(status__in=['rejected', 'joined']).count(),
            'today_attendance': Attendance.objects.filter(date=today, status='present').count(),
            'today_attendance_employees': Attendance.objects.filter(date=today, status='present', employee__isnull=False).count(),
            'today_attendance_interns': Attendance.objects.filter(date=today, status='present', intern__isnull=False).count(),
            'pending_tasks': Task.objects.filter(status='pending').count(),
            'pending_leaves': Leave.objects.filter(status='pending').count(),
            'departments': Department.objects.count(),
            'pending_payroll': Salary.objects.filter(status='pending').count(),
        })


class MyDashboardStatsView(APIView):
    """Self-service summary card for employee/intern home screen."""
    def get(self, request):
        user = request.user
        today = timezone.now().date()
        if hasattr(user, 'employee_profile'):
            emp = user.employee_profile
            return Response({
                'kind': 'employee',
                'pending_tasks': Task.objects.filter(assigned_to=emp, status='pending').count(),
                'attendance_today': Attendance.objects.filter(employee=emp, date=today).exists(),
                'latest_payslip': Salary.objects.filter(employee=emp).order_by('-year', '-month').first() is not None,
            })
        if hasattr(user, 'intern_profile'):
            intern = user.intern_profile
            return Response({
                'kind': 'intern',
                'pending_tasks': (
                    intern.tasks.filter(status='pending').count()
                    + Task.objects.filter(assigned_to_intern=intern, status='pending').count()
                ),
                'attendance_today': Attendance.objects.filter(intern=intern, date=today).exists(),
                'certificate_issued': intern.certificate_issued,
            })
        return Response({'kind': 'unknown'})
