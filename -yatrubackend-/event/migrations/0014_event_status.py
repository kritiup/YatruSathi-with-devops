# Generated migration for event status field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('event', '0013_email_otp'),
    ]

    operations = [
        migrations.AddField(
            model_name='event',
            name='status',
            field=models.CharField(
                choices=[
                    ('upcoming', 'Upcoming'),
                    ('ongoing', 'Ongoing'),
                    ('completed', 'Completed'),
                    ('cancelled', 'Cancelled')
                ],
                default='upcoming',
                max_length=20
            ),
        ),
    ]
