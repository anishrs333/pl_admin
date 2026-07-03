"""
Database restore helper — restores from a backup created by backup_db.py.

Usage:
    python restore_db.py backups/pl_softtech_db_20260702_045457.dump
    python restore_db.py backups/fixture_20260702_045457.json
"""
import os
import subprocess
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DB_NAME = os.environ.get('DB_NAME', 'pl_softtech_db')
DB_USER = os.environ.get('DB_USER', 'postgres')
DB_PASSWORD = os.environ.get('DB_PASSWORD', 'postgres')
DB_HOST = os.environ.get('DB_HOST', 'localhost')
DB_PORT = os.environ.get('DB_PORT', '5432')


def restore_dump(path):
    env = os.environ.copy()
    env['PGPASSWORD'] = DB_PASSWORD
    print(f'This will OVERWRITE the current contents of database "{DB_NAME}".')
    confirm = input('Type YES to continue: ')
    if confirm != 'YES':
        print('Cancelled.')
        return
    cmd = ['pg_restore', '-h', DB_HOST, '-p', DB_PORT, '-U', DB_USER,
           '-d', DB_NAME, '--clean', '--if-exists', path]
    result = subprocess.run(cmd, env=env, capture_output=True, text=True)
    print(result.stdout)
    if result.returncode == 0:
        print(f'✓ Restored from {path}')
    else:
        print(f'✗ pg_restore reported issues (often harmless "does not exist" notices):\n{result.stderr}')


def restore_fixture(path):
    print('This will load data from the JSON fixture into the current database.')
    print('Run `python manage.py migrate` FIRST on a fresh/empty database before this.')
    confirm = input('Type YES to continue: ')
    if confirm != 'YES':
        print('Cancelled.')
        return
    cmd = [sys.executable, 'manage.py', 'loaddata', path]
    result = subprocess.run(cmd, cwd=BASE_DIR, capture_output=True, text=True)
    print(result.stdout, result.stderr)
    if result.returncode == 0:
        print(f'✓ Loaded fixture {path}')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        print('Usage: python restore_db.py <path-to-backup-file>')
        sys.exit(1)
    path = sys.argv[1]
    if not os.path.exists(path):
        print(f'File not found: {path}')
        sys.exit(1)
    if path.endswith('.json'):
        restore_fixture(path)
    else:
        restore_dump(path)
