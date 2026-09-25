"""
Database backup helper.

Creates TWO backups every time it runs (belt & suspenders):
  1. A native PostgreSQL dump (backups/pl_softtech_db_YYYYMMDD_HHMMSS.dump)
     -> restore with pg_restore, fastest/most complete option.
  2. A portable Django JSON fixture (backups/fixture_YYYYMMDD_HHMMSS.json)
     -> restore with `python manage.py loaddata`, works even if you
        switch database engines or PostgreSQL isn't installed.

Usage:
    python backup_db.py
"""
import os
import subprocess
import sys
from datetime import datetime

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKUP_DIR = os.path.join(BASE_DIR, 'backups')
os.makedirs(BACKUP_DIR, exist_ok=True)

timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')

DB_NAME = os.environ.get('DB_NAME', 'pl_softtech_db')
DB_USER = os.environ.get('DB_USER', 'postgres')
DB_PASSWORD = os.environ.get('DB_PASSWORD', 'postgres')
DB_HOST = os.environ.get('DB_HOST', 'localhost')
DB_PORT = os.environ.get('DB_PORT', '5432')


def backup_postgres():
    dump_path = os.path.join(BACKUP_DIR, f'pl_softtech_db_{timestamp}.dump')
    env = os.environ.copy()
    env['PGPASSWORD'] = DB_PASSWORD
    cmd = [
        'pg_dump', '-h', DB_HOST, '-p', DB_PORT, '-U', DB_USER,
        '-F', 'c', '-f', dump_path, DB_NAME,
    ]
    print(f'Running: {" ".join(cmd)}')
    result = subprocess.run(cmd, env=env, capture_output=True, text=True)
    if result.returncode == 0:
        print(f'✓ PostgreSQL dump saved → {dump_path}')
    else:
        print(f'✗ pg_dump failed (is PostgreSQL / pg_dump installed and on PATH?):\n{result.stderr}')


def backup_json_fixture():
    fixture_path = os.path.join(BACKUP_DIR, f'fixture_{timestamp}.json')
    cmd = [
        sys.executable, 'manage.py', 'dumpdata',
        '--natural-foreign', '--natural-primary',
        '--exclude', 'contenttypes', '--exclude', 'auth.permission', '--exclude', 'admin.logentry',
        '--indent', '2',
        '-o', fixture_path,
    ]
    print(f'\nRunning: {" ".join(cmd)}')
    result = subprocess.run(cmd, cwd=BASE_DIR, capture_output=True, text=True)
    if result.returncode == 0:
        print(f'✓ JSON fixture saved → {fixture_path}')
    else:
        print(f'✗ dumpdata failed:\n{result.stderr}')


if __name__ == '__main__':
    print('=' * 60)
    print('PL Soft Tech HR Console — Database Backup')
    print('=' * 60)
    backup_postgres()
    backup_json_fixture()
    print('\nDone. Keep the backups/ folder somewhere safe (cloud drive, external disk, etc).')
