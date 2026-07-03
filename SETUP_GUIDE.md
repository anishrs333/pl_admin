# PL Soft Tech HR Console - Complete Setup Guide

## Prerequisites

- **Python 3.10+** (download from python.org)
- **Node.js 18+** (download from nodejs.org)
- **PostgreSQL 14+** (download from postgresql.org)

---

## Step 1: PostgreSQL Database Setup

### Windows:
1. Install PostgreSQL from https://www.postgresql.org/download/windows/
2. During installation, remember the superuser password
3. Open **pgAdmin** (installed with PostgreSQL)
4. Right-click Databases → Create → Database
5. Name: `pl_softtech_db`
6. Click Save

### Mac/Linux:
```bash
# Create database
createdb pl_softtech_db
```

---

## Step 2: Backend Setup

### 1. Extract the zip and navigate to backend

```bash
cd pl_softtech_v3/backend
```

### 2. Create virtual environment

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Mac/Linux
python3 -m venv venv
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure database (optional)

Edit `.env` if your PostgreSQL uses different credentials:

```
DB_NAME=pl_softtech_db
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
```

### 5. Run database migrations & create admin

```bash
python setup_db.py
```

This will:
- Create database tables
- Create HR admin account
- Show you the login credentials

**Default HR Admin:**
- Username: `hr_admin`
- Password: `admin@123`

### 6. Start backend server

```bash
python manage.py runserver
```

✅ Backend runs at: **http://localhost:8000**

Admin panel: **http://localhost:8000/admin/**

---

## Step 3: Frontend Setup

### 1. Open a new terminal and navigate to frontend

```bash
cd pl_softtech_v3/frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start development server

```bash
npm run dev
```

✅ Frontend runs at: **http://localhost:5173**

---

## Step 4: Login & Start Using

1. Open **http://localhost:5173** in your browser
2. Login with:
   - **Username:** `hr_admin`
   - **Password:** `admin@123`
3. Click "Dashboard" to get started

---

## ID Formats

| Entity | Format | Example |
|--------|--------|---------|
| Employee | EMP-PL-### | EMP-PL-001 |
| Intern | INT-PL-### | INT-PL-001 |
| Candidate | CAND-PL-### | CAND-PL-001 |

---

## Features

### ✅ Attendance
- **Check-in / Check-out** — Time-stamped per employee per day
- **Leave Management** — Sick, Paid, Unpaid, Casual, Earned
- **Leave Approval** — HR approves/rejects with notes
- **Leave Balance** — Summary view per employee

### ✅ Tasks
- **Assign Tasks** — HR assigns with priority & deadline
- **Employee View** — See assigned tasks
- **Task Complete** — Mark done with confirmation dialog
- **Search & Filter** — By status or employee

### ✅ Payroll
- **Salary Records** — Create with earnings & deductions
- **Professional Payslips** — Download as PDF
- **Mark Paid** — Track payment status
- **Employee View** — Download own payslips

### ✅ Notifications
- **Real-time Bell** — Unread count in sidebar
- **Task Notifications** — When assigned
- **Leave Notifications** — When approved/rejected
- **Payroll Notifications** — When salary generated/paid
- **Mark Read** — Single or all notifications

### ✅ Employees & Interns
- **Profile Pictures** — Upload & display
- **Auto Login** — Email sent with credentials
- **Search** — By name, email, ID
- **Status Tracking** — Active, Probation, On Leave, Inactive

---

## API Endpoints

### Authentication
```
POST   /api/auth/login/          - Login
GET    /api/auth/me/             - Current user
```

### Attendance
```
POST   /api/attendance/checkin/   - Check in
POST   /api/attendance/checkout/  - Check out
GET    /api/attendance/today/     - Today's records
GET    /api/attendance/leaves/    - Leave requests
POST   /api/attendance/leaves/{id}/approve/  - Approve leave
POST   /api/attendance/leaves/{id}/reject/   - Reject leave
```

### Employees
```
GET    /api/employees/            - List employees
POST   /api/employees/            - Create employee (multipart for photo)
PATCH  /api/employees/{id}/       - Update employee (multipart for photo)
```

### Tasks
```
GET    /api/tasks/                - List tasks
POST   /api/tasks/                - Create task
POST   /api/tasks/{id}/complete/  - Mark complete
```

### Payroll
```
GET    /api/payroll/              - List salary records
POST   /api/payroll/              - Create salary record
POST   /api/payroll/{id}/mark_paid/  - Mark as paid
GET    /api/payroll/{id}/slip_pdf/   - Download PDF
```

### Internships
```
GET    /api/internships/          - List interns
POST   /api/internships/          - Create intern (multipart for photo)
```

### Notifications
```
GET    /api/notifications/        - List notifications
GET    /api/notifications/unread_count/  - Unread count
POST   /api/notifications/{id}/mark_read/  - Mark read
POST   /api/notifications/mark_all_read/   - Mark all read
```

---

## Troubleshooting

### Backend won't start
```bash
# Kill any process on port 8000
# Windows: netstat -ano | findstr :8000
# Mac/Linux: lsof -i :8000

# Restart from scratch:
rm db.sqlite3
python setup_db.py
python manage.py runserver
```

### Frontend won't start
```bash
npm install
npm run dev
```

### Modal not closing
- Refresh the page (Ctrl+R / Cmd+R)
- Check browser console for errors (F12)

### Images not showing
- Ensure backend is running
- Clear browser cache (Ctrl+Shift+Del)

### Database connection error
- Check PostgreSQL is running
- Verify credentials in `.env`
- Run `python manage.py migrate`

---

## Production Deployment

For production use:

1. **Backend:**
   ```bash
   pip install gunicorn whitenoise
   gunicorn config.wsgi --workers 4 --bind 0.0.0.0:8000
   ```

2. **Frontend:**
   ```bash
   npm run build
   # Deploy dist/ folder to Vercel, Netlify, or static host
   ```

3. **Database:** Use managed PostgreSQL (AWS RDS, Heroku, Railway, etc.)

4. **Email:** Configure real SMTP instead of console backend

---

## File Structure

```
pl_softtech_v3/
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── setup_db.py
│   ├── .env.example
│   ├── config/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── accounts/          ← User & auth
│   ├── employees/         ← Employee CRUD
│   ├── attendance/        ← Check-in/out, leaves
│   ├── tasks/             ← Task management
│   ├── payroll/           ← Salary & payslips
│   ├── internships/       ← Intern management
│   ├── notifications/     ← Notification system
│   ├── candidates/        ← Job candidates
│   ├── colleges/          ← College management
│   └── clients/           ← Client management
│
└── frontend/
    ├── package.json
    ├── src/
    │   ├── App.jsx
    │   ├── index.css
    │   ├── lib/
    │   │   └── api.js         ← API client
    │   ├── context/
    │   │   ├── AuthContext.jsx
    │   │   └── NotificationContext.jsx
    │   ├── components/
    │   │   ├── Sidebar.jsx
    │   │   ├── Layout.jsx
    │   │   ├── Modal.jsx
    │   │   ├── NotificationBell.jsx
    │   │   └── ...
    │   └── pages/
    │       ├── Dashboard.jsx
    │       ├── Attendance.jsx
    │       ├── Tasks.jsx
    │       ├── Payroll.jsx
    │       ├── Employees.jsx
    │       ├── Internships.jsx
    │       ├── Candidates.jsx
    │       └── ...
```

---

## Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Check server logs (Terminal where backend/frontend is running)
3. Open browser console (F12 → Console tab)
4. Verify both backend and frontend are running

---

**Built with ❤️ using Django + React + PostgreSQL**

