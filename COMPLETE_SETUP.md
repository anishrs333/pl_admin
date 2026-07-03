# PL Soft Tech HR Console v3.1 - Complete Setup Guide

## 🎯 Overview

This is a professional, production-ready HR management system built with Django and React. It includes:

- ✅ Employee & Intern Management
- ✅ Attendance Tracking (Check-in/Out)
- ✅ Leave Management (7 types)
- ✅ Work From Home Requests
- ✅ Task Management
- ✅ Payroll Management
- ✅ Candidate Management with Interview Scheduling
- ✅ Professional Payslip PDF Generation
- ✅ Notifications System
- ✅ Role-based Access Control

---

## 📋 Prerequisites

### System Requirements
- Python 3.10+
- Node.js 18+
- PostgreSQL 14+
- 2GB RAM (minimum)
- 500MB disk space

### Tools to Install
1. **Python**: https://www.python.org/downloads/
2. **Node.js**: https://nodejs.org/
3. **PostgreSQL**: https://www.postgresql.org/download/
4. **Git** (optional): https://git-scm.com/

---

## 🚀 Step-by-Step Setup

### Step 1: Create Database

#### On Windows (Using pgAdmin):
1. Open pgAdmin
2. Right-click "Databases" → "Create" → "Database"
3. Name: `pl_softtech_db`
4. Click Save

#### On Mac/Linux (Terminal):
```bash
createdb pl_softtech_db
```

#### Verify:
```bash
psql -l | grep pl_softtech_db
# Should show the database you just created
```

---

### Step 2: Backend Setup

#### 2.1 Navigate to Backend Directory
```bash
cd pl_softtech_v3/backend
```

#### 2.2 Create Virtual Environment

**Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

**Mac/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

#### 2.3 Install Dependencies
```bash
pip install -r requirements.txt
```

#### 2.4 Create Environment File
Create `.env` file in backend directory:
```
DB_NAME=pl_softtech_db
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432

EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
# For production SMTP:
# EMAIL_HOST=smtp.gmail.com
# EMAIL_PORT=587
# EMAIL_HOST_USER=your-email@gmail.com
# EMAIL_HOST_PASSWORD=app-password
```

#### 2.5 Create Migrations
```bash
python manage.py makemigrations
```

You should see output like:
```
Migrations for 'accounts':
  accounts/migrations/0001_initial.py
    - Create model User
...
```

#### 2.6 Run Migrations
```bash
python manage.py migrate
```

Output should show:
```
Running migrations:
  Applying accounts.0001_initial... OK
  Applying admin.0001_initial... OK
  ...
  Operations to perform: 50
  Applying ... OK
```

#### 2.7 Create Superuser
```bash
python manage.py createsuperuser
```

Enter:
- Username: `admin`
- Email: `admin@example.com`
- Password: (choose one)

#### 2.8 Create Sample Data
```bash
python setup_db.py
```

This will create:
- HR Admin account (hr_admin / admin@123)
- Sample Employee (EMP-PL-001)
- Sample Intern (INT-PL-001)
- Sample Candidate (CAND-PL-001)

#### 2.9 Start Backend Server
```bash
python manage.py runserver
```

✅ Backend should be running at: **http://localhost:8000**

**Test it:**
```bash
curl http://localhost:8000/api/auth/me/
# Should ask for authentication
```

Admin panel: **http://localhost:8000/admin/**

---

### Step 3: Frontend Setup

#### 3.1 Open New Terminal Window/Tab

Keep backend running in first terminal!

#### 3.2 Navigate to Frontend
```bash
cd pl_softtech_v3/frontend
```

#### 3.3 Install Dependencies
```bash
npm install
```

This will download all React packages (may take 2-3 minutes).

#### 3.4 Start Development Server
```bash
npm run dev
```

✅ Frontend should be running at: **http://localhost:5173**

You should see:
```
  VITE v4.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

---

### Step 4: Login & Test

#### 4.1 Open Browser
Go to: **http://localhost:5173**

#### 4.2 Login as HR Admin
- **Username**: `hr_admin`
- **Password**: `admin@123`

#### 4.3 Verify All Features
- ✅ Dashboard loads
- ✅ Sidebar shows all menu items
- ✅ Notifications bell appears
- ✅ Can navigate to Employees page
- ✅ Can navigate to Candidates page
- ✅ Can navigate to Payroll page

#### 4.4 Test Employee Login
Logout, then login as:
- **Username**: `EMP-PL-001`
- **Password**: (use mobile from employee record, or `9999999999`)

Should see limited menu (Employee self-service only).

#### 4.5 Test Intern Login
- **Username**: `INT-PL-001`
- **Password**: (mobile from intern record, or `9999999999`)

---

## 🔧 Common Issues & Solutions

### Backend Won't Start

**Error: "Address already in use"**
```bash
# Windows - Kill process on port 8000
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :8000
kill -9 <PID>

# Or use different port
python manage.py runserver 8001
```

**Error: "No module named 'django'"**
```bash
# Make sure venv is activated
source venv/bin/activate  # Mac/Linux
venv\Scripts\activate     # Windows

# Reinstall dependencies
pip install -r requirements.txt
```

**Error: "Connection refused" (Database)**
```bash
# Make sure PostgreSQL is running
# Windows: Services → PostgreSQL → Start
# Mac: brew services start postgresql
# Linux: sudo systemctl start postgresql

# Check connection
psql -U postgres -d pl_softtech_db
# Should connect successfully
```

### Frontend Won't Start

**Error: "Port 5173 already in use"**
```bash
# Kill process on port 5173
lsof -i :5173
kill -9 <PID>

# Or use different port
npm run dev -- --port 5174
```

**Error: "Module not found"**
```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install
npm run dev
```

**Blank Page**
```bash
# Clear browser cache
Ctrl+Shift+Del (or Cmd+Shift+Del on Mac)
# Select "All time"
# Clear
# Reload page
```

### Database Issues

**Error: "database does not exist"**
```bash
# Create database
createdb pl_softtech_db

# Then run migrations
python manage.py migrate
```

**Error: "Authentication failed for user"**
```bash
# Check password in .env
# PostgreSQL default password is usually blank

# Reset password (Mac/Linux)
psql -U postgres
ALTER USER postgres WITH PASSWORD 'new_password';
\q
```

---

## 📊 API Testing

### Test Endpoints with curl

```bash
# Login
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"hr_admin","password":"admin@123"}'

# Response: {"access":"token_here","refresh":"refresh_token"}

# Get current user
curl -H "Authorization: Bearer TOKEN_HERE" \
  http://localhost:8000/api/auth/me/

# List employees
curl -H "Authorization: Bearer TOKEN_HERE" \
  http://localhost:8000/api/employees/

# List candidates
curl -H "Authorization: Bearer TOKEN_HERE" \
  http://localhost:8000/api/candidates/
```

---

## 🎯 Key Features to Test

### 1. Attendance
- HR Dashboard: Check-in/Out stats
- Employee: Check-in, Check-out
- Search by date

### 2. Leave Management
- Employee: Apply for leave
- HR: View pending leaves
- HR: Approve/Reject with notes
- Check notifications

### 3. Tasks
- HR: Assign task to employee
- Employee: Mark task done
- Check notifications

### 4. Payroll
- HR: Create salary record
- Download PDF payslip
- Mark as paid

### 5. Candidates
- HR: Add candidate
- Schedule interview
- Generate offer letter
- Send email

### 6. Notifications
- Bell icon shows count
- Click to see all
- Mark as read

---

## 📝 File Structure

```
pl_softtech_v3/
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── setup_db.py
│   ├── .env
│   ├── config/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── accounts/          ← User authentication
│   ├── employees/         ← Employee management
│   ├── attendance/        ← Check-in/Leave/WFH
│   ├── tasks/             ← Task management
│   ├── payroll/           ← Salary & payslips
│   ├── internships/       ← Intern management
│   ├── candidates/        ← Candidate management
│   ├── notifications/     ← Notification system
│   ├── colleges/          ← College management
│   └── clients/           ← Client management
│
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── src/
    │   ├── App.jsx
    │   ├── index.css
    │   ├── lib/
    │   │   └── api.js
    │   ├── context/
    │   │   ├── AuthContext.jsx
    │   │   └── NotificationContext.jsx
    │   ├── components/
    │   │   ├── Sidebar.jsx
    │   │   ├── Layout.jsx
    │   │   ├── Modal.jsx
    │   │   └── ...
    │   └── pages/
    │       ├── Dashboard.jsx
    │       ├── Employees.jsx
    │       ├── Candidates.jsx
    │       ├── Attendance.jsx
    │       ├── Tasks.jsx
    │       ├── Payroll.jsx
    │       └── ...
```

---

## 🔐 Security Notes

1. **Change Admin Password**
   ```bash
   python manage.py changepassword admin
   ```

2. **Set Debug = False** (Production)
   - Edit `config/settings.py`
   - Set `DEBUG = False`

3. **Update ALLOWED_HOSTS**
   - Add your domain

4. **Configure SMTP** (Email)
   - Update `.env` with real SMTP credentials
   - Test email sending

5. **Use HTTPS** (Production)
   - Get SSL certificate
   - Configure in server

---

## 📧 Email Configuration

### For Gmail:
1. Enable 2-Factor Authentication
2. Generate App Password (https://myaccount.google.com/apppasswords)
3. Update `.env`:
```
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=app-password
```

### For Other Services:
- SendGrid, AWS SES, Mailgun, etc.
- See Django documentation for configuration

---

## 🎯 Default Accounts

After running `setup_db.py`:

| Role | Username | Password | ID |
|------|----------|----------|-----|
| HR | hr_admin | admin@123 | — |
| Employee | EMP-PL-001 | 9999999999 | EMP-PL-001 |
| Intern | INT-PL-001 | 9999999999 | INT-PL-001 |
| Candidate | — | — | CAND-PL-001 |

---

## 🚀 Production Deployment

### Before Going Live:

1. **Database Backup**
   ```bash
   pg_dump pl_softtech_db > backup.sql
   ```

2. **Environment Variables**
   - Update all .env values
   - Use secure secrets manager

3. **Static Files**
   ```bash
   python manage.py collectstatic --noinput
   ```

4. **Security Checklist**
   - [ ] DEBUG = False
   - [ ] SECRET_KEY is strong
   - [ ] ALLOWED_HOSTS configured
   - [ ] HTTPS enabled
   - [ ] CORS configured
   - [ ] Database backups automated
   - [ ] Logs configured
   - [ ] Monitoring set up

5. **Deploy To:**
   - AWS, Heroku, DigitalOcean, Railway, Render, etc.
   - Follow platform-specific Django deployment guides

---

## 📞 Troubleshooting

### Database Connection Issues
```bash
# Test connection
python manage.py dbshell
# Should open PostgreSQL prompt
```

### Static Files Not Loading
```bash
python manage.py collectstatic
python manage.py runserver
```

### Migrations Failed
```bash
# See what migrations exist
python manage.py showmigrations

# Revert specific migration
python manage.py migrate app_name 0001

# Reapply
python manage.py migrate
```

### Reset Everything
```bash
# WARNING: This deletes all data!
dropdb pl_softtech_db
createdb pl_softtech_db
python manage.py migrate
python setup_db.py
```

---

## ✅ Verification Checklist

After setup, verify:

- [ ] Backend running at localhost:8000
- [ ] Frontend running at localhost:5173
- [ ] Can login as HR admin
- [ ] Dashboard loads without errors
- [ ] Employee page shows sample employee
- [ ] Candidate page shows sample candidate
- [ ] Can check-in/out
- [ ] Can apply for leave
- [ ] Can download payslip PDF
- [ ] Notifications bell works
- [ ] All pages load without console errors

---

## 📚 Additional Resources

- **Django Docs**: https://docs.djangoproject.com/
- **DRF Docs**: https://www.django-rest-framework.org/
- **React Docs**: https://react.dev/
- **PostgreSQL Docs**: https://www.postgresql.org/docs/

---

## 🎉 You're Ready!

Your HR System is now running. Start using it to:
- Manage employees & interns
- Track attendance
- Handle leaves & WFH
- Assign tasks
- Generate payslips
- Schedule interviews
- Send offer letters
- Track candidates

---

**Need Help?**
- Check documentation in zip
- Review API endpoints
- Check browser console (F12)
- Check server logs
- See troubleshooting section above

**Built with ❤️ using Django + React + PostgreSQL**

