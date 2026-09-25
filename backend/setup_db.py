"""
Run this once to set up the database:
  python setup_db.py

Set environment variables:
  HR_ADMIN_PASSWORD  - password for the HR admin (default: generated)
  SHELJ_PASSWORD     - password for shelj superuser (default: generated)
"""
import subprocess, sys, secrets, string

def gen_password(length=14):
    alphabet = string.ascii_letters + string.digits + "!@#$%"
    return ''.join(secrets.choice(alphabet) for _ in range(length))

hr_pw = gen_password()
shelj_pw = gen_password()

commands = [
    [sys.executable, 'manage.py', 'makemigrations'],
    [sys.executable, 'manage.py', 'migrate'],
    [sys.executable, 'manage.py', 'shell', '-c',
    f"from accounts.models import User; User.objects.filter(username='hr_admin').exists() or User.objects.create_superuser(username='hr_admin', email='hr@plsofttech.com', password='{hr_pw}', role='hr', must_change_password=False); print('HR admin: hr_admin / {hr_pw}')"],
    [sys.executable, 'manage.py', 'shell', '-c',
    f"from accounts.models import User; User.objects.filter(username='shelj').exists() or User.objects.create_superuser(username='shelj', email='shelj@plsofttech.com', password='{shelj_pw}', role='hr', must_change_password=False); print('shelj: shelj / {shelj_pw}')"],
]

for cmd in commands:
    print(f'\n>>> {" ".join(cmd[1:])}')
    result = subprocess.run(cmd, cwd='.')
    if result.returncode != 0:
        print(f'Error running {cmd}')
        sys.exit(1)

print('\n✓ Database setup complete!')
print(f'HR Login  — hr_admin  / {hr_pw}')
print(f'HR Login  — shelj     / {shelj_pw}')
