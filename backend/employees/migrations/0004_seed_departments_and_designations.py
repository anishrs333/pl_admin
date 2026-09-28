from django.db import migrations

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

def seed_data(apps, schema_editor):
    Department = apps.get_model('employees', 'Department')
    Designation = apps.get_model('employees', 'Designation')

    for dept_name, desig_list in DEPARTMENTS_WITH_DESIGNATIONS.items():
        dept, _ = Department.objects.get_or_create(name=dept_name)
        for desig_name in desig_list:
            Designation.objects.get_or_create(name=desig_name, department=dept)

def reverse_seed(apps, schema_editor):
    pass

class Migration(migrations.Migration):

    dependencies = [
        ('employees', '0003_alter_employee_salary'),
    ]

    operations = [
        migrations.RunPython(seed_data, reverse_seed),
    ]
