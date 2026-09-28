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


from django.db import models

class DashboardStatsView(APIView):
    permission_classes = [IsHR]

    def get(self, request):
        today = timezone.now().date()

        # Active Employees List & Count
        active_emps_qs = Employee.objects.select_related('department', 'designation').exclude(status='inactive').order_by('full_name')
        active_employees_list = [
            {
                'id': e.id,
                'code': e.employee_id,
                'name': e.full_name,
                'email': e.email,
                'mobile': e.mobile,
                'dept': e.department.name if e.department else '—',
                'desig': e.designation.name if e.designation else '—',
                'status': e.status,
                'pic': request.build_absolute_uri(e.profile_picture.url) if e.profile_picture else None,
            }
            for e in active_emps_qs
        ]

        # Active Interns List & Count
        active_interns_qs = Intern.objects.filter(status='active').order_by('name')
        active_interns_list = [
            {
                'id': i.id,
                'code': i.intern_id,
                'name': i.name,
                'email': i.email,
                'mobile': i.mobile,
                'college': i.college_name,
                'domain': i.domain,
                'status': i.status,
                'pic': request.build_absolute_uri(i.profile_picture.url) if i.profile_picture else None,
            }
            for i in active_interns_qs
        ]

        # Completed Interns List & Count
        completed_interns_qs = Intern.objects.filter(status='completed').order_by('name')
        completed_interns_list = [
            {
                'id': i.id,
                'code': i.intern_id,
                'name': i.name,
                'email': i.email,
                'mobile': i.mobile,
                'college': i.college_name,
                'domain': i.domain,
                'status': i.status,
                'pic': request.build_absolute_uri(i.profile_picture.url) if i.profile_picture else None,
            }
            for i in completed_interns_qs
        ]

        # Employees Present Today List & Count
        emp_att_today_qs = Attendance.objects.select_related('employee', 'employee__department').filter(
            date=today, status='present', employee__isnull=False
        ).order_by('employee__full_name')
        employees_present_today_list = [
            {
                'id': a.employee.id,
                'code': a.employee.employee_id,
                'name': a.employee.full_name,
                'dept': a.employee.department.name if a.employee.department else '—',
                'check_in': timezone.localtime(a.check_in).strftime('%I:%M %p') if a.check_in else '—',
                'pic': request.build_absolute_uri(a.employee.profile_picture.url) if a.employee.profile_picture else None,
            }
            for a in emp_att_today_qs
        ]

        # Interns Present Today List & Count
        intern_att_today_qs = Attendance.objects.select_related('intern').filter(
            date=today, status='present', intern__isnull=False
        ).order_by('intern__name')
        interns_present_today_list = [
            {
                'id': a.intern.id,
                'code': a.intern.intern_id,
                'name': a.intern.name,
                'domain': a.intern.domain,
                'check_in': timezone.localtime(a.check_in).strftime('%I:%M %p') if a.check_in else '—',
                'pic': request.build_absolute_uri(a.intern.profile_picture.url) if a.intern.profile_picture else None,
            }
            for a in intern_att_today_qs
        ]

        # Analytics: 7-Day Attendance Trend
        attendance_trend = []
        for i in range(6, -1, -1):
            d = today - timezone.timedelta(days=i)
            d_str = d.strftime('%d %b')
            p_emp = Attendance.objects.filter(date=d, status='present', employee__isnull=False).count()
            p_int = Attendance.objects.filter(date=d, status='present', intern__isnull=False).count()
            l_cnt = Attendance.objects.filter(date=d, status='late').count()
            attendance_trend.append({
                'date': d_str,
                'Employees': p_emp,
                'Interns': p_int,
                'Total': p_emp + p_int,
                'Late': l_cnt,
            })

        # Analytics: Department Roster Distribution
        dept_dist = []
        for dept in Department.objects.all():
            e_cnt = Employee.objects.filter(department=dept).exclude(status='inactive').count()
            dept_dist.append({
                'name': dept.name,
                'Employees': e_cnt,
            })

        # Analytics: Internship Domain Distribution
        domain_counts = Intern.objects.values('domain').annotate(
            active=models.Count('id', filter=models.Q(status='active')),
            completed=models.Count('id', filter=models.Q(status='completed'))
        )
        domain_dist = [
            {
                'name': d['domain'] or 'General',
                'Active': d['active'],
                'Completed': d['completed'],
            }
            for d in domain_counts if d['domain']
        ]

        # Analytics: Task Status Breakdown
        task_status = [
            {'name': 'Pending', 'value': Task.objects.filter(status='pending').count()},
            {'name': 'In Progress', 'value': Task.objects.filter(status='in_progress').count()},
            {'name': 'Completed', 'value': Task.objects.filter(status='completed').count()},
        ]

        return Response({
            'total_employees': len(active_employees_list),
            'active_employees_list': active_employees_list,

            'total_interns': len(active_interns_list),
            'active_interns_list': active_interns_list,

            'completed_interns_count': len(completed_interns_list),
            'completed_interns_list': completed_interns_list,

            'today_attendance': len(employees_present_today_list) + len(interns_present_today_list),
            'today_attendance_employees': len(employees_present_today_list),
            'employees_present_today_list': employees_present_today_list,

            'today_attendance_interns': len(interns_present_today_list),
            'interns_present_today_list': interns_present_today_list,

            'total_candidates': Candidate.objects.exclude(status__in=['rejected', 'joined']).count(),
            'pending_tasks': Task.objects.filter(status='pending').count(),
            'pending_leaves': Leave.objects.filter(status='pending').count(),
            'departments': Department.objects.count(),
            'pending_payroll': Salary.objects.filter(status='pending').count(),

            # Visual Charts Datasets
            'attendance_trend': attendance_trend,
            'department_distribution': dept_dist,
            'domain_distribution': domain_dist,
            'task_status': task_status,
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
