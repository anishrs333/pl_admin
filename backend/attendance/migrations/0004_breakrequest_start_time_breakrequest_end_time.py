from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('attendance', '0003_breakrequest'),
    ]

    operations = [
        migrations.AddField(
            model_name='breakrequest',
            name='start_time',
            field=models.TimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='breakrequest',
            name='end_time',
            field=models.TimeField(blank=True, null=True),
        ),
    ]
