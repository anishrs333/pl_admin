# PL Soft Tech HR Console — Fixed & Verified

This build was fully re-audited: every backend app was traced end‑to‑end, the
server was actually run against a **real PostgreSQL database**, and every one
of your 11 reported issues was exercised with real HTTP requests (login,
check‑in/out, apply/approve leave, assign/complete tasks, generate/pay/
download payslips) before packaging. The frontend was also rebuilt
(`npm run build`) to confirm there are no JS errors.

---

## 1. The root cause of "nothing works"

Your error log showed this on the very first `migrate`:

```
ImportError: cannot import name 'AuthViewSet' from 'accounts.views'
```

`config/urls.py` was trying to register a router `ViewSet` that never
existed in `accounts/views.py` — so **the server could not start at all**.
That's why nothing downstream (dashboard, attendance, payroll…) ever had a
chance to work. On top of that single blocking bug, there were **9 more
crash‑causing bugs** hiding behind it (wrong field names, missing
`ViewSet`s, broken permissions) that only surfaced once the server could
actually boot. All of them are fixed below.

---

## 2. Your 11 issues — what was wrong & what was changed

| # | Issue | Root cause | Fix |
|---|-------|-----------|-----|
| 1 | Employee profile won't open | `EmployeeViewSet` only allowed **HR** to call `/employees/` — a logged‑in employee got a 403 trying to view their own record. | Employees can now view (read‑only) their own record; HR still has full access. |
| 2 | Employee attendance should be just check‑in/out | The self‑service attendance screen was already simple, but the app couldn't start (bug above), so it never loaded. | Works now; also extended so **interns** get the same check‑in/check‑out. |
| 3 | Applied leave should show on HR dashboard | `LeaveSerializer` referenced a field `applied_at` that doesn't exist on the model (it's `created_at`) — this crashed the endpoint. Leave counts were also missing from the dashboard. | Fixed the field mismatch, added a **"Pending Leave Requests"** card to the HR dashboard, and wired up notifications so HR is notified the moment leave is applied for. |
| 4 | Payslip format | The "Download PDF" button was actually returning a JSON message, not a PDF (so downloads were corrupted). | Rewrote the endpoint to stream a real PDF. Payslip now has a letterhead‑style logo mark, and works for **both employees and interns**. |
| 5 | Task "done" should show to HR | Completing a task worked, but no notification was ever sent to HR. | Wired up `notify_task_completed` — HR now gets a notification the moment a task is marked done. |
| 6 | HR dashboard not working | The `reports` app (which powers the dashboard) was **never wired into `config/urls.py`** — every dashboard call was a 404. | Added `path('api/reports/', include('reports.urls'))` and expanded the stats returned. |
| 7 | HR needs to pay/assign + Departments & Designations | Same root startup bug blocked all of this. Departments/Designations endpoints already existed. | Confirmed working end‑to‑end; sample data now seeds 4 departments and 5 designations automatically. |
| 8 | HR attendance should show Employees **and** Interns | The `Attendance` model only had a foreign key to `Employee` — interns physically could not check in. | Added an `intern` field to `Attendance` (in addition to `employee`), extended check‑in/out to interns, and merged both into one roster on the HR Attendance page with an Employee/Intern badge. |
| 9 | HR should assign tasks to Employees **and** Interns | The `Task` model only supported `Employee`. | Added `assigned_to_intern` to `Task`. The "Assign to" dropdown now lists both, grouped. |
| 10 | HR should pay salary to Employees **and** Interns | The `Salary` model only supported `Employee`; on top of that, `mark_paid` was writing to fields (`payment_status`/`payment_date`) that don't exist on the model, so **marking something "paid" silently did nothing**. | Added `intern` to `Salary`, fixed `mark_paid` to use the real field names (`status`, `paid_date`), and the payroll form now lets HR pick an employee **or** an intern. |
| 11 | Insert all sample data / rebuild from scratch | The sample‑data script itself crashed on payroll (wrong field names again) and assumed an employee already existed. | Rewrote `setup_sample_data.py` to be self‑contained and idempotent — it creates the HR admin, departments, designations, 3 employees, 2 interns, a sample leave, sample tasks (one per type), sample payroll (one per type), candidates, colleges and clients, and prints the exact login IDs it generated. |

### Other real bugs found & fixed along the way (not on your list, but were crashing things)
- `attendance/wfh_serializers.py` imported a serializer that doesn't exist → crashed on startup.
- `internships/urls.py` referenced an `InternTaskViewSet` that was never defined → crashed on startup.
- `IsHRorSelfReadOnly` (the permission class used almost everywhere) would throw an `AttributeError` whenever it hit a record belonging to an intern instead of an employee — now it's null‑safe for both.
- `Candidate.resume` was a required file field with no way to save a candidate without a resume upload; made optional.
- Employee/Leave admin pages referenced the same non‑existent `applied_at` field.

---

## 3. Setup instructions (Windows)

```bat
:: 1. Fresh database
dropdb -U postgres pl_softtech_db
createdb -U postgres pl_softtech_db

:: 2. Backend
cd pl_softtech_v3\backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

set DB_PASSWORD=pl@206
python manage.py migrate
python setup_sample_data.py

:: 3. Frontend (in a second terminal)
cd pl_softtech_v3\frontend
npm install
npm run dev

:: 4. Backend server (in the first terminal)
python manage.py runserver
```

Open **http://localhost:5173**.

> Set `DB_PASSWORD` (and `DB_NAME`/`DB_USER`/`DB_HOST`/`DB_PORT` if different
> from the defaults) as environment variables before running any
> `manage.py` command — `config/settings.py` reads them from the
> environment rather than hard‑coding your password in a file.

### Login credentials (created by `setup_sample_data.py`)

| Role | Username | Password |
|------|----------|----------|
| HR | `hr_admin` | `admin@123` |
| Employee | `EMP-PL-001` | `9999999999` |
| Intern | `INT-PL-001` | `9999999998` |

(Two more sample employees and one more intern are also created — check the
script's console output for their exact generated IDs, or look them up as
HR under Employees / Internships.)

---

## 4. Database backups — how to make sure you never lose data again

Two scripts were added at `backend/backup_db.py` and `backend/restore_db.py`.
Run them any time with your venv active:

```bat
cd pl_softtech_v3\backend
venv\Scripts\activate
set DB_PASSWORD=pl@206
python backup_db.py
```

This writes **two files** into `backend/backups/`:

1. **`pl_softtech_db_<timestamp>.dump`** — a native PostgreSQL dump (fast,
   complete, includes everything). Restore with:
   ```bat
   python restore_db.py backups\pl_softtech_db_20260702_120000.dump
   ```
2. **`fixture_<timestamp>.json`** — a plain‑text Django export of every row
   as JSON. This is your safety net if PostgreSQL itself is ever
   unavailable or you switch machines — restore with:
   ```bat
   python manage.py migrate      :: on a fresh empty database first
   python restore_db.py backups\fixture_20260702_120000.json
   ```

**Copy the `backups/` folder to a USB drive, cloud storage, or another
computer regularly** — a local dump sitting next to a database that fails
isn't a backup. A simple habit: run `backup_db.py` at the end of each
working day, or wire it into Windows Task Scheduler to run automatically.

### Doing it manually (no script), if you ever need it
```bat
:: backup
set PGPASSWORD=pl@206
pg_dump -U postgres -F c -f my_backup.dump pl_softtech_db

:: restore into a fresh database
dropdb -U postgres pl_softtech_db
createdb -U postgres pl_softtech_db
pg_restore -U postgres -d pl_softtech_db my_backup.dump
```

---

## 5. What changed under the hood (for your own reference)

- `backend/config/urls.py` — rewritten to properly `include()` every app's
  own router instead of a broken duplicate router.
- `backend/attendance/models.py`, `serializers.py`, `views.py` — Attendance
  and Leave now support interns; leave/task/salary notifications wired in.
- `backend/tasks/models.py`, `serializers.py`, `views.py` — tasks can be
  assigned to an employee **or** an intern.
- `backend/payroll/models.py`, `serializers.py`, `views.py`,
  `payslip_pdf.py` — salaries support interns, `mark_paid` actually
  persists now, and the PDF endpoint returns a real PDF with a logo.
  mark.
- `backend/employees/views.py` — employees can view their own profile.
- `backend/internships/views.py` — added the missing `InternTaskViewSet`.
- `backend/reports/views.py` — dashboard now reports pending leaves and a
  employee/intern breakdown of today's attendance.
- `backend/accounts/permissions.py` — `IsHRorSelfReadOnly` made null‑safe
  for intern‑owned records.
- `backend/setup_sample_data.py` — rewritten, idempotent, covers every
  module.
- `backend/backup_db.py`, `backend/restore_db.py` — new backup tooling.
- `frontend/src/pages/Attendance.jsx`, `Tasks.jsx`, `Payroll.jsx`,
  `Dashboard.jsx` — updated to show/assign both employees and interns, and
  added the pending‑leaves dashboard card.
- All Django migrations were regenerated from scratch against the fixed
  models — run `migrate` on a **fresh** database as shown above.

Everything above was verified against a live PostgreSQL 16 instance (login,
dashboard stats, employee self‑profile, check‑in/out, leave apply→approve→
notify, task assign→complete→notify, salary create→mark paid→PDF download)
before this zip was built.
