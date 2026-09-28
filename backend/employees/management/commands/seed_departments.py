from django.core.management.base import BaseCommand
from employees.models import Department, Designation

DEPARTMENTS_WITH_DESIGNATIONS = {
    'Human Resources': [
        'HR Intern',
        'HR Executive',
        'HR Recruiter',
        'HR Manager',
    ],
    'Software Development': [
        'Full Stack Developer',
        'Backend Developer',
        'Frontend Developer',
        'Mobile App Developer',
        'React Developer',
        'Python Developer',
        'Java Developer',
        'MERN Stack Developer',
    ],
    'Quality Assurance': [
        'QA Intern',
        'Junior QA Tester',
        'QA Tester',
        'Software Tester',
        'Manual Tester',
    ],
    'Marketing': [
        'Marketing Intern',
        'Marketing Assistant',
        'Marketing Executive',
        'Marketing Coordinator',
        'Marketing Specialist',
        'Digital Marketing Executive',
        'Digital Marketing Specialist',
        'Digital Marketing Manager',
    ],
    'Sales & Business Development': [
        'Sales Intern',
        'Sales Assistant',
        'Sales Executive',
        'Senior Sales Executive',
        'Sales Representative',
    ],
    'Finance & Accounts': [
        'Finance Intern',
        'Accounts Assistant',
        'Accounts Executive',
        'Senior Accounts Executive',
        'SAP FICO Executive',
        'SAP FICO Consultant',
        'Finance Manager',
    ],
}

class Command(BaseCommand):
    help = 'Seed departments and designations hierarchy into the database'

    def handle(self, *args, **options):
        dept_count = 0
        desig_count = 0
        for dept_name, desig_list in DEPARTMENTS_WITH_DESIGNATIONS.items():
            dept, created = Department.objects.get_or_create(name=dept_name)
            if created:
                dept_count += 1
            for desig_name in desig_list:
                _, d_created = Designation.objects.get_or_create(name=desig_name, department=dept)
                if d_created:
                    desig_count += 1

        self.stdout.write(self.style.SUCCESS(f'Successfully seeded {dept_count} departments and {desig_count} designations.'))
