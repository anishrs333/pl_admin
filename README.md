# PL Soft Tech HR Console v3

A full-stack HR management system built with **Django REST Framework** + **React** + **PostgreSQL**.

---

## What's New in v3

| Feature | Details |
|---|---|
| ✅ Attendance Check-in/out | Time-stamped check-in and check-out per employee per day |
| ✅ Leave Management | Sick, Paid, Unpaid, Casual, Earned leave with description field |
| ✅ Leave Approval | HR can approve/reject with reviewer notes; employee gets notified |
| ✅ Notification System | Bell icon in sidebar — notified on task assign, leave decision, salary |
| ✅ Task "Done" Confirmation | Confirm dialog before completing; HR is notified instantly |
| ✅ Profile Pictures | Employees & Interns support photo upload; shown in all lists |
| ✅ Working Search | All search inputs properly filter backend data |
| ✅ Professional Payslips | PDF matching PL Soft Tech design with logo, ledger table, net pay banner |

---

## Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL 14+

---

## Database Setup

### 1. Create PostgreSQL database

```sql
-- In psql or pgAdmin:
CREATE DATABASE pl_softtech_db;
-- (user: postgres, password: postgres, port: 5432 — or edit backend/.env)
```

### 2. Configure environment (optional)

Edit `backend/.env`:
```
DB_NAME=pl_softtech_db
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_HOST=localhost
DB_PORT=5432
```

---

## Running the Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations & create HR admin
python setup_db.py

# Start server
python manage.py runserver
```

**Backend runs at:** `http://localhost:8000`

**HR admin credentials:**
- Username: `hr_admin`
- Password: `admin@123`

**Admin panel:** `http://localhost:8000/admin/`

---

## Running the Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

**Frontend runs at:** `http://localhost:5173`

---

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login/` | Login — returns JWT tokens |
| GET | `/api/auth/me/` | Current user profile |
| GET/POST | `/api/employees/` | List / create employees |
| PATCH | `/api/employees/{id}/` | Update employee (supports multipart for profile_picture) |
| GET/POST | `/api/attendance/` | Attendance records |
| POST | `/api/attendance/checkin/` | Check in `{ employee_id }` |
| POST | `/api/attendance/checkout/` | Check out `{ employee_id }` |
| GET | `/api/attendance/today/` | Today's attendance |
| GET | `/api/attendance/my_status/` | Current user's today status |
| GET/POST | `/api/attendance/leaves/` | Leave requests |
| POST | `/api/attendance/leaves/{id}/approve/` | Approve leave (HR) |
| POST | `/api/attendance/leaves/{id}/reject/` | Reject leave (HR) |
| GET | `/api/attendance/leaves/summary/` | Leave balance summary |
| GET/POST | `/api/tasks/` | Tasks list / assign |
| POST | `/api/tasks/{id}/complete/` | Mark task complete |
| GET/POST | `/api/payroll/` | Salary records |
| POST | `/api/payroll/{id}/mark_paid/` | Mark salary paid (HR) |
| GET | `/api/payroll/{id}/slip_pdf/` | Download PDF payslip |
| GET | `/api/notifications/` | User notifications |
| GET | `/api/notifications/unread_count/` | Unread count |
| POST | `/api/notifications/{id}/mark_read/` | Mark one read |
| POST | `/api/notifications/mark_all_read/` | Mark all read |

---

## Employee / Intern Login

When HR adds an employee, a login is **automatically provisioned**:
- Username: Employee ID (e.g. `PL-EMP-2026-0001`)
- Password: Mobile number (employee must change on first login)

---

## Roles

| Role | Access |
|------|--------|
| `hr` | Full console — all employees, payroll, tasks, attendance |
| `employee` | Self-service — own profile, attendance, tasks, payslips |
| `intern` | Self-service — own profile, tasks |

