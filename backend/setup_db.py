"""
Run this once to set up the database:
  python setup_db.py
"""
import subprocess, sys

commands = [
    [sys.executable, 'manage.py', 'makemigrations'],
    [sys.executable, 'manage.py', 'migrate'],
    [sys.executable, 'manage.py', 'shell', '-c',
    "from accounts.models import User; User.objects.filter(username='hr_admin').exists() or User.objects.create_superuser(username='hr_admin', email='hr@plsofttech.com', password='admin@123', role='hr', must_change_password=False); print('HR admin: hr_admin / admin@123')"],
    [sys.executable, 'manage.py', 'shell', '-c',
    "from accounts.models import User; User.objects.filter(username='shelj').exists() or User.objects.create_superuser(username='shelj', email='shelj@plsofttech.com', password='0000', role='hr', must_change_password=False)"],
]

for cmd in commands:
    print(f'\n>>> {" ".join(cmd[1:])}')
    result = subprocess.run(cmd, cwd='.')
    if result.returncode != 0:
        print(f'Error running {cmd}')
        sys.exit(1)

print('\n✓ Database setup complete!')
print('HR Login — username: hr_admin  password: admin@123')
