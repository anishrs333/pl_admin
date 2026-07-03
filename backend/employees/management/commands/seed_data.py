from django.core.management.base import BaseCommand
from accounts.models import User
from employees.models import Department, Designation, Employee
from internships.models import Intern
from datetime import date


class Command(BaseCommand):
    help = 'Seed HR login, departments, sample employees and interns'

    def handle(self, *args, **kwargs):
        # --- HR account (the only staff login in this build) ---
        if not User.objects.filter(username='hr_admin').exists():
            User.objects.create_superuser(
                'hr_admin', 'hr@plsofttech.com', 'Hr@2026',
                role='hr', first_name='HR', last_name='Administrator',
                must_change_password=False,
            )
            self.stdout.write(self.style.SUCCESS('HR account created → hr_admin / Hr@2026'))
        else:
            self.stdout.write('HR account already exists')

        # --- departments & designations ---
        dept_names = ['Backend Development', 'Frontend Development', 'UI/UX Design', 'Sales & Marketing', 'HR & Admin', 'QA Testing']
        depts = {d: Department.objects.get_or_create(name=d)[0] for d in dept_names}

        designations = [
            ('Senior Backend Developer', 'Backend Development'),
            ('Junior Backend Developer', 'Backend Development'),
            ('React Developer', 'Frontend Development'),
            ('UI Designer', 'UI/UX Design'),
            ('Sales Executive', 'Sales & Marketing'),
            ('HR Executive', 'HR & Admin'),
        ]
        desigs = {}
        for name, dept in designations:
            desigs[name] = Designation.objects.get_or_create(name=name, department=depts[dept])[0]

        # --- sample employees (IDs auto-generate as PL-EMP-YYYY-NNNN) ---
        sample_employees = [
            ('Arjun Kumar', 'arjun@plsofttech.com', '9876543210', 'Backend Development', 'Senior Backend Developer', 75000, date(2026, 1, 15)),
            ('Priya Menon', 'priya@plsofttech.com', '9876543211', 'UI/UX Design', 'UI Designer', 65000, date(2026, 2, 1)),
            ('Rahul Sharma', 'rahul@plsofttech.com', '9876543212', 'Sales & Marketing', 'Sales Executive', 55000, date(2026, 3, 10)),
        ]
        for name, email, mobile, dept, desig, salary, jdate in sample_employees:
            emp, created = Employee.objects.get_or_create(email=email, defaults={
                'full_name': name, 'mobile': mobile, 'department': depts[dept],
                'designation': desigs[desig], 'joining_date': jdate, 'salary': salary,
            })
            if created:
                self.stdout.write(f'  Employee → {emp.employee_id}  |  login: {emp.employee_id} / {mobile}')

        # --- sample interns (IDs auto-generate as PL-INT-YYYY-NNNN) ---
        sample_interns = [
            ('Kiran Das', 'kiran.intern@example.com', '9000000001', 'SNGCE Kollam', 'Web Development', date(2026, 4, 1), date(2026, 7, 1)),
            ('Anjali Nair', 'anjali.intern@example.com', '9000000002', 'TKM College', 'Data Science', date(2026, 4, 1), date(2026, 7, 1)),
        ]
        for name, email, mobile, college, domain, sdate, edate in sample_interns:
            intern, created = Intern.objects.get_or_create(email=email, defaults={
                'name': name, 'mobile': mobile, 'college_name': college, 'domain': domain,
                'start_date': sdate, 'end_date': edate,
            })
            if created:
                self.stdout.write(f'  Intern → {intern.intern_id}  |  login: {intern.intern_id} / {mobile}')

        self.stdout.write(self.style.SUCCESS('\nSeed complete.'))
        self.stdout.write(self.style.WARNING('\n--- Login reference ---'))
        self.stdout.write('HR:       hr_admin / Hr@2026  (full console access)')
        self.stdout.write('Employee: PL-EMP-2026-0001 / 9876543210  (self-service only)')
        self.stdout.write('Intern:   PL-INT-2026-0001 / 9000000001  (self-service only)')
