import os
import django
import sys

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User

def create_user(username, email, password, is_staff=False):
    try:
        if User.objects.filter(username=username).exists():
            print(f"⚠️ User {username} already exists.")
            return
        user = User.objects.create_user(username, email, password)
        user.is_staff = is_staff
        user.save()
        print(f"✅ User {username} created successfully.")
    except Exception as e:
        print(f"❌ Error creating user: {e}")

def reset_password(username, new_password):
    try:
        user = User.objects.get(username=username)
        user.set_password(new_password)
        user.save()
        print(f"✅ Password for {username} reset successfully.")
    except User.DoesNotExist:
        print(f"❌ User {username} not found.")
    except Exception as e:
        print(f"❌ Error resetting password: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python utils.py [create_user|reset_password] ...Args")
        sys.exit(1)
    
    cmd = sys.argv[1]
    if cmd == "create_user" and len(sys.argv) == 5:
        create_user(sys.argv[2], sys.argv[3], sys.argv[4])
    elif cmd == "reset_password" and len(sys.argv) == 4:
        reset_password(sys.argv[2], sys.argv[3])
    else:
        print("Invalid command or arguments.")
