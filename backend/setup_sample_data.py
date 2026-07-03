"""
One-shot, idempotent sample data seeder.
Run with: python setup_sample_data.py   (after `python manage.py migrate`)

Creates:
  - HR admin login
  - Departments & Designations
  - 3 sample Employees (auto-generates login + welcome email to console)
  - 2 sample Interns (auto-generates login + welcome email to console)
  - 1 sample Leave, 2 sample Tasks (1 employee + 1 intern),
    2 sample Salary records (1 employee + 1 intern)
  - Sample Candidates, Colleges, Clients
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.utils import timezone
from accounts.models import User
from employees.models import Employee, Department, Designation
from attendance.models import Leave
from tasks.models import Task
from payroll.models import Salary
from candidates.models import Candidate
from colleges.models import College
from clients.models import Client
from internships.models import Intern


def setup_hr_admin():
    if not User.objects.filter(username='hr_admin').exists():
        User.objects.create_superuser(
            username='hr_admin', email='hr@plsofttech.com', password='admin@123',
            role='hr', first_name='HR', last_name='Administrator', must_change_password=False,
        )
        print("✓ HR admin created → hr_admin / admin@123")
    else:
        print("… HR admin already exists")


def setup_departments():
    departments = [
        ('IT', 'Information Technology Department'),
        ('HR', 'Human Resources Department'),
        ('Operations', 'Operations Department'),
        ('Finance', 'Finance Department'),
    ]
    for name, description in departments:
        obj, created = Department.objects.get_or_create(name=name, defaults={'description': description})
        if created:
            print(f"✓ Department '{name}' created")
    return {d.name: d for d in Department.objects.all()}


def setup_designations(depts):
    designations = [
        ('Software Developer', 'IT'),
        ('Senior Developer', 'IT'),
        ('HR Manager', 'HR'),
        ('Operations Manager', 'Operations'),
        ('Finance Manager', 'Finance'),
    ]
    for name, dept_name in designations:
        dept = depts.get(dept_name)
        if dept:
            obj, created = Designation.objects.get_or_create(name=name, department=dept)
            if created:
                print(f"✓ Designation '{name}' created")
    return {d.name: d for d in Designation.objects.all()}


def setup_employees(depts, desigs):
    sample = [
        ('Anish Anish', 'anish@plsofttech.com', '9999999999', 'IT', 'Software Developer', 50000, timezone.now().date()),
        ('Priya Menon', 'priya@plsofttech.com', '9876543211', 'IT', 'Senior Developer', 65000, timezone.now().date()),
        ('Rahul Sharma', 'rahul@plsofttech.com', '9876543212', 'Operations', 'Operations Manager', 55000, timezone.now().date()),
    ]
    created_employees = []
    for name, email, mobile, dept, desig, salary, jdate in sample:
        emp, created = Employee.objects.get_or_create(email=email, defaults={
            'full_name': name, 'mobile': mobile,
            'department': depts.get(dept), 'designation': desigs.get(desig),
            'joining_date': jdate, 'salary': salary, 'status': 'active',
        })
        if created:
            print(f"✓ Employee '{name}' created → login: {emp.employee_id} / {mobile}")
        created_employees.append(emp)
    return created_employees


def setup_interns():
    sample = [
        ('John Intern', 'johnint@example.com', '9999999998', 'Sample College', 'Web Development'),
        ('Jane Intern', 'janeint@example.com', '9999999997', 'ABC University', 'Python Development'),
    ]
    created_interns = []
    for name, email, mobile, college, domain in sample:
        intern, created = Intern.objects.get_or_create(email=email, defaults={
            'name': name, 'mobile': mobile, 'college_name': college, 'domain': domain,
            'start_date': timezone.now().date(),
            'end_date': timezone.now().date() + timezone.timedelta(days=180),
            'status': 'active',
        })
        if created:
            print(f"✓ Intern '{name}' created → login: {intern.intern_id} / {mobile}")
        created_interns.append(intern)
    return created_interns


def setup_leave(employee):
    if employee and not Leave.objects.filter(employee=employee).exists():
        Leave.objects.create(
            employee=employee,
            leave_type='sick',
            from_date=timezone.now().date(),
            to_date=timezone.now().date() + timezone.timedelta(days=2),
            reason='Medical checkup',
            status='pending',
        )
        print(f"✓ Sample leave created for {employee.full_name}")


def setup_tasks(employee, intern):
    if employee and not Task.objects.filter(assigned_to=employee).exists():
        Task.objects.create(
            title='Complete project report', description='Finish the project documentation',
            assigned_to=employee, priority='high',
            deadline=timezone.now().date() + timezone.timedelta(days=5), status='pending',
        )
        print(f"✓ Sample task assigned to employee {employee.full_name}")
    if intern and not Task.objects.filter(assigned_to_intern=intern).exists():
        Task.objects.create(
            title='Prepare onboarding notes', description='Summarize week-1 learnings',
            assigned_to_intern=intern, priority='medium',
            deadline=timezone.now().date() + timezone.timedelta(days=5), status='pending',
        )
        print(f"✓ Sample task assigned to intern {intern.name}")


def setup_payroll(employee, intern):
    today = timezone.now().date()
    if employee and not Salary.objects.filter(employee=employee, month=today.month, year=today.year).exists():
        Salary.objects.create(
            employee=employee, month=today.month, year=today.year,
            basic_salary=50000, hra=10000, allowances=5000,
            pf_deduction=1800, tax_deduction=5000, status='pending',
        )
        print(f"✓ Sample payroll created for employee {employee.full_name}")
    if intern and not Salary.objects.filter(intern=intern, month=today.month, year=today.year).exists():
        Salary.objects.create(
            intern=intern, month=today.month, year=today.year,
            basic_salary=15000, hra=0, allowances=1000,
            pf_deduction=0, tax_deduction=0, status='pending',
        )
        print(f"✓ Sample payroll created for intern {intern.name}")


def setup_candidates():
    candidates = [
        ('John', 'Doe', 'john@example.com', '9999999996', 'Software Developer', 'applied'),
        ('Jane', 'Smith', 'jane@example.com', '9999999995', 'HR Manager', 'shortlisted'),
        ('Bob', 'Johnson', 'bob@example.com', '9999999994', 'Finance Manager', 'interviewed'),
    ]
    for first, last, email, mobile, position, status in candidates:
        obj, created = Candidate.objects.get_or_create(email=email, defaults={
            'first_name': first, 'last_name': last, 'mobile': mobile,
            'position_applied': position, 'status': status,
        })
        if created:
            print(f"✓ Candidate '{first} {last}' created")


def setup_colleges():
    colleges = [
        ('Sample College', 'Principal Name', 'college@example.com', '9999999993'),
        ('ABC University', 'Dr. Admin', 'abc@university.com', '9999999992'),
        ('XYZ Institute', 'Director', 'xyz@institute.com', '9999999991'),
    ]
    for name, contact, email, mobile in colleges:
        obj, created = College.objects.get_or_create(name=name, defaults={
            'contact_person': contact, 'email': email, 'mobile': mobile,
        })
        if created:
            print(f"✓ College '{name}' created")


def setup_clients():
    clients = [
        ('Sample Client', 'Client Manager', 'client@example.com', '9999999990'),
        ('Tech Solutions', 'Project Lead', 'tech@solutions.com', '9999999989'),
        ('Digital Agency', 'Account Manager', 'agency@digital.com', '9999999988'),
    ]
    for name, contact, email, mobile in clients:
        obj, created = Client.objects.get_or_create(name=name, defaults={
            'contact_person': contact, 'email': email, 'mobile': mobile,
        })
        if created:
            print(f"✓ Client '{name}' created")


def main():
    print("\n" + "=" * 60)
    print("Setting up sample data...")
    print("=" * 60 + "\n")

    setup_hr_admin()
    depts = setup_departments()
    desigs = setup_designations(depts)
    employees = setup_employees(depts, desigs)
    interns = setup_interns()

    first_emp = employees[0] if employees else Employee.objects.first()
    first_intern = interns[0] if interns else Intern.objects.first()

    setup_leave(first_emp)
    setup_tasks(first_emp, first_intern)
    setup_payroll(first_emp, first_intern)
    setup_candidates()
    setup_colleges()
    setup_clients()

    print("\n" + "=" * 60)
    print("✓ Sample data setup complete!")
    print("=" * 60)
    print("\n--- Login reference ---")
    print("HR:        hr_admin / admin@123")
    if first_emp:
        print(f"Employee:  {first_emp.employee_id} / {first_emp.mobile}")
    if first_intern:
        print(f"Intern:    {first_intern.intern_id} / {first_intern.mobile}")
    print()


if __name__ == '__main__':
    main()
