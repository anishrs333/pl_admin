from django.db import migrations


def sync_user_active(apps, schema_editor):
    Employee = apps.get_model('employees', 'Employee')
    for emp in Employee.objects.select_related('user').filter(user__isnull=False):
        should_be_active = emp.status != 'inactive'
        if emp.user.is_active != should_be_active:
            emp.user.is_active = should_be_active
            emp.user.save(update_fields=['is_active'])

    Intern = apps.get_model('internships', 'Intern')
    for intern in Intern.objects.select_related('user').filter(user__isnull=False):
        should_be_active = intern.status not in ('completed', 'terminated')
        if intern.user.is_active != should_be_active:
            intern.user.is_active = should_be_active
            intern.user.save(update_fields=['is_active'])


class Migration(migrations.Migration):

    dependencies = [
        ('employees', '0001_initial'),
        ('internships', '0001_initial'),
        ('accounts', '__first__'),
    ]

    operations = [
        migrations.RunPython(sync_user_active, migrations.RunPython.noop),
    ]
