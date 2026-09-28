"""Management command to purge injected dummy/test data and reseed clean, realistic production-ready data."""
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth import get_user_model
from employees.models import Department, Designation, Employee
from internships.models import Intern
from attendance.models import Attendance, Leave, BreakRequest, WorkFromHome
from tasks.models import Task
from candidates.models import Candidate
from clients.models import Client, Project
from colleges.models import College
from payroll.models import Salary

User = get_user_model()

class Command(BaseCommand):
    help = 'Purge junk/injected test data and reseed clean, realistic database records'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE('Cleaning junk & injected test data from database...'))

        # Purge test attendance, tasks, leaves, breaks, WFH
        Attendance.objects.all().delete()
        Task.objects.all().delete()
        Leave.objects.all().delete()
        BreakRequest.objects.all().delete()
        WorkFromHome.objects.all().delete()

        # Clean non-standard/junk employees and interns with test names
        Employee.objects.filter(full_name__icontains='test').delete()
        Employee.objects.filter(email__icontains='test').delete()
        Intern.objects.filter(name__icontains='test').delete()
        Intern.objects.filter(email__icontains='test').delete()

        self.stdout.write(self.style.SUCCESS('Purged existing test data.'))

        # Ensure Official Departments & Designations
        dept_hr, _ = Department.objects.get_or_create(name='Human Resources')
        dept_soft, _ = Department.objects.get_or_create(name='Software Development')
        dept_qa, _ = Department.objects.get_or_create(name='Quality Assurance')
        dept_mkt, _ = Department.objects.get_or_create(name='Marketing')
        dept_sales, _ = Department.objects.get_or_create(name='Sales & Business Development')
        dept_fin, _ = Department.objects.get_or_create(name='Finance & Accounts')

        desig_fs, _ = Designation.objects.get_or_create(name='Full Stack Developer', department=dept_soft)
        desig_py, _ = Designation.objects.get_or_create(name='Python Developer', department=dept_soft)
        desig_hr, _ = Designation.objects.get_or_create(name='HR Executive', department=dept_hr)
        desig_qa, _ = Designation.objects.get_or_create(name='QA Tester', department=dept_qa)

        # Update existing valid employees' departments & designations cleanly
        for emp in Employee.objects.all():
            if not emp.department or emp.department.name not in ['Human Resources', 'Software Development', 'Quality Assurance', 'Marketing', 'Sales & Business Development', 'Finance & Accounts']:
                emp.department = dept_soft
                emp.designation = desig_fs
                emp.save()

        # Seed clean attendance records for today with proper local times
        now = timezone.now()
        today = now.date()

        employees = list(Employee.objects.filter(status='active'))
        interns = list(Intern.objects.filter(status='active'))

        # Attendance check-ins for active employees today
        base_time = now.replace(hour=9, minute=15, second=0, microsecond=0)
        for idx, emp in enumerate(employees):
            checkin_time = base_time + timezone.timedelta(minutes=idx * 10)
            Attendance.objects.get_or_create(
                employee=emp,
                date=today,
                defaults={
                    'check_in': checkin_time,
                    'status': 'present',
                }
            )

        for idx, intern in enumerate(interns):
            checkin_time = base_time + timezone.timedelta(minutes=(idx + len(employees)) * 10)
            Attendance.objects.get_or_create(
                intern=intern,
                date=today,
                defaults={
                    'check_in': checkin_time,
                    'status': 'present',
                }
            )

        self.stdout.write(self.style.SUCCESS('Successfully cleaned database and seeded realistic test data.'))
