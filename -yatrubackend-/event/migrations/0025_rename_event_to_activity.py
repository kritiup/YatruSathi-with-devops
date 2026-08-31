"""Rename the core model ``Event`` -> ``Activity`` and every FK that pointed at
it (``Booking.event`` -> ``Booking.activity``, and likewise on Favorite,
Review, ChatGroup, ChatMessage, and the gallery model).

Hand-written so the table/column renames are explicit and ordered rather than
depending on the autodetector's interactive "did you rename?" prompt.
"""

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('event', '0024_alter_booking_options_alter_chatgroup_options_and_more'),
    ]

    operations = [
        migrations.RenameModel(old_name='Event', new_name='Activity'),
        migrations.RenameModel(old_name='EventImage', new_name='ActivityImage'),
        migrations.RenameField(
            model_name='activityimage', old_name='event', new_name='activity'
        ),
        migrations.RenameField(
            model_name='booking', old_name='event', new_name='activity'
        ),
        migrations.RenameField(
            model_name='favorite', old_name='event', new_name='activity'
        ),
        migrations.RenameField(
            model_name='review', old_name='event', new_name='activity'
        ),
        migrations.RenameField(
            model_name='chatgroup', old_name='event', new_name='activity'
        ),
        migrations.RenameField(
            model_name='chatmessage', old_name='event', new_name='activity'
        ),
        migrations.AlterUniqueTogether(
            name='booking', unique_together={('user', 'activity')}
        ),
        migrations.AlterUniqueTogether(
            name='favorite', unique_together={('user', 'activity')}
        ),
    ]
