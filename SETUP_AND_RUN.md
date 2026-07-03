# PL Soft Tech HR Console - Complete Setup & Run Instructions

## 📋 System Requirements

- **Python**: 3.10 or higher
- **Node.js**: 18.x or higher  
- **PostgreSQL**: 14 or higher
- **RAM**: 2GB minimum
- **Disk Space**: 500MB minimum

---

## 🚀 QUICK START (15 Minutes)

### Step 1: Download & Extract
```bash
# Extract the ZIP file to your desired location
unzip pl_softtech_HR_CONSOLE_FINAL.zip
cd pl_softtech_v3
```

### Step 2: Create PostgreSQL Database
```bash
# On Windows (using Command Prompt):
psql -U postgres
CREATE DATABASE pl_softtech_db;
\q

# On Mac/Linux:
createdb pl_softtech_db
```

### Step 3: Setup Backend (Terminal 1)
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create database migrations
python manage.py makemigrations

# Run migrations
python manage.py migrate

# Create sample data and admin account
python setup_db.py

# Start backend server
python manage.py runserver
```

✅ Backend will run at: **http://localhost:8000**

### Step 4: Setup Frontend (Terminal 2)
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

✅ Frontend will run at: **http://localhost:5173**

### Step 5: Login & Test
Open browser: **http://localhost:5173**

**HR Admin Login:**
- Username: `hr_admin`
- Password: `admin@123`

**Employee Login:**
- Username: `EMP-PL-001`
- Password: `9999999999`

**Intern Login:**
- Username: `INT-PL-001`
- Password: `9999999999`

---

## 🔧 DETAILED SETUP GUIDE

### Prerequisites Installation

#### Windows

**1. Install Python 3.10+**
- Download from: https://www.python.org/downloads/
- During installation: Check "Add Python to PATH"
- Verify: `python --version`

**2. Install PostgreSQL 14+**
- Download from: https://www.postgresql.org/download/windows/
- During installation: Remember the password for `postgres` user
- Verify: `psql --version`

**3. Install Node.js 18+**
- Download from: https://nodejs.org/
- Download LTS version
- Verify: `node --version` and `npm --version`

#### Mac

```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Python
brew install python@3.11

# Install PostgreSQL
brew install postgresql

# Install Node.js
brew install node

# Verify installations
python3 --version
psql --version
node --version
npm --version
```

#### Linux (Ubuntu/Debian)

```bash
# Update packages
sudo apt update
sudo apt upgrade -y

# Install Python
sudo apt install python3.11 python3-pip python3-venv -y

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs -y

# Verify installations
python3 --version
psql --version
node --version
npm --version
```

---

### Backend Setup (Detailed)

#### 1. Navigate to Backend Directory
```bash
cd pl_softtech_v3/backend
```

#### 2. Create Virtual Environment
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Mac/Linux
python3 -m venv venv
source venv/bin/activate
```

You should see `(venv)` in your terminal prompt.

#### 3. Upgrade pip
```bash
pip install --upgrade pip
```

#### 4. Install Dependencies
```bash
pip install -r requirements.txt
```

This will install:
- Django 5.0
- Django REST Framework
- PostgreSQL adapter
- JWT authentication
- PDF generation
- Image processing
- And more...

#### 5. Create .env File
Create a file named `.env` in the backend directory:

```
DB_NAME=pl_softtech_db
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_HOST=localhost
DB_PORT=5432

SECRET_KEY=your-secret-key-here
DEBUG=True

EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

#### 6. Create Database Migrations
```bash
python manage.py makemigrations
```

Expected output:
```
Migrations for 'accounts':
  accounts/migrations/0001_initial.py
    - Create model User
Migrations for 'employees':
  employees/migrations/0001_initial.py
...
```

#### 7. Apply Migrations
```bash
python manage.py migrate
```

Expected output:
```
Running migrations:
  Applying accounts.0001_initial... OK
  Applying admin.0001_initial... OK
  Applying auth.0001_initial... OK
  ...
Operations to perform: 50
```

#### 8. Create Sample Data
```bash
python setup_db.py
```

This creates:
- HR Admin account: `hr_admin` / `admin@123`
- Sample Employee: `EMP-PL-001` (ID)
- Sample Intern: `INT-PL-001` (ID)
- Sample Candidate: `CAND-PL-001` (ID)
- Sample College, Client, Department, Designation

#### 9. Start Backend Server
```bash
python manage.py runserver
```

Expected output:
```
Starting development server at http://127.0.0.1:8000/
Quit the server with CONTROL-C.
```

✅ Backend is running at: **http://localhost:8000**

**Test Backend:**
```bash
# In another terminal
curl http://localhost:8000/api/auth/me/
# Should return: {"detail":"Authentication credentials were not provided."}
```

---

### Frontend Setup (Detailed)

#### 1. Open New Terminal (Keep Backend Running!)

#### 2. Navigate to Frontend Directory
```bash
cd pl_softtech_v3/frontend
```

#### 3. Install Node Dependencies
```bash
npm install
```

This will download and install:
- React 18
- Vite build tool
- Axios HTTP client
- React Query state management
- Lucide React icons
- And many more packages

This may take 2-3 minutes. Coffee break! ☕

#### 4. Create .env File (Optional)
Create `.env` file in frontend directory:

```
VITE_API_URL=http://localhost:8000/api
```

#### 5. Start Development Server
```bash
npm run dev
```

Expected output:
```
  VITE v4.5.0  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

✅ Frontend is running at: **http://localhost:5173**

---

## 🔐 First Login & Testing

### Step 1: Open Browser
Go to: **http://localhost:5173**

### Step 2: Login as HR Admin
- **Username**: `hr_admin`
- **Password**: `admin@123`

### Step 3: Test Features
- ✅ Dashboard loads without errors
- ✅ Sidebar shows all menu items
- ✅ Notifications bell appears (top right)
- ✅ Click "Employees" - should see sample employee
- ✅ Click "Candidates" - should see sample candidate
- ✅ Click "Attendance" - should see attendance page
- ✅ Click "Payroll" - should see payroll page

### Step 4: Logout & Test Employee
- Click profile icon (top right)
- Click "Logout"
- Login with: `EMP-PL-001` / `9999999999`
- Should see limited menu (Employee self-service only)
- Can check-in/out, apply leave, see tasks, download payslip

### Step 5: Logout & Test Intern
- Logout
- Login with: `INT-PL-001` / `9999999999`
- Should see similar limited menu as Employee

---

## 📊 API Testing

### Test with curl

```bash
# 1. Login
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"hr_admin","password":"admin@123"}'

# Response will have access token like:
# {"access":"eyJ0eXAiOiJKV1QiLCJhbGc...","refresh":"eyJ0eXAiOiJKV1QiLCJhbGc..."}

# 2. Save token (replace with actual token)
TOKEN="your_access_token_here"

# 3. Get current user
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/auth/me/

# 4. List employees
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/employees/

# 5. List candidates
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/candidates/
```

---

## 🐛 Troubleshooting

### Backend Issues

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

# Reinstall packages
pip install -r requirements.txt
```

**Error: "Connection refused" (Database)**
```bash
# PostgreSQL not running
# Windows: Start PostgreSQL service
# Mac: brew services start postgresql
# Linux: sudo systemctl start postgresql

# Test connection
psql -U postgres -d pl_softtech_db
```

**Error: "Database does not exist"**
```bash
# Create database
createdb pl_softtech_db

# Or in PostgreSQL
psql -U postgres
CREATE DATABASE pl_softtech_db;
\q
```

### Frontend Issues

**Error: "Port 5173 already in use"**
```bash
# Kill process
lsof -i :5173
kill -9 <PID>

# Or use different port
npm run dev -- --port 5174
```

**Error: "Module not found"**
```bash
# Delete and reinstall
rm -rf node_modules
npm install
npm run dev
```

**Blank Page**
```bash
# Clear browser cache
Ctrl+Shift+Del  (Windows/Linux)
Cmd+Shift+Del   (Mac)

# Select "All time" and clear
# Then reload page (F5 or Cmd+R)
```

### Database Issues

**Error: "Column does not exist"**
```bash
# Run migrations again
python manage.py migrate

# Or reset everything (WARNING: Deletes all data!)
dropdb pl_softtech_db
createdb pl_softtech_db
python manage.py migrate
python setup_db.py
```

---

## 📝 API Endpoints Summary

### Authentication
```
POST   /api/auth/login/        - Login
POST   /api/auth/refresh/      - Refresh token
GET    /api/auth/me/           - Get current user
POST   /api/auth/logout/       - Logout
```

### Employees
```
GET    /api/employees/         - List employees
POST   /api/employees/         - Create employee
GET    /api/employees/{id}/    - Get employee
PUT    /api/employees/{id}/    - Update employee
DELETE /api/employees/{id}/    - Delete employee
```

### Attendance
```
GET    /api/attendance/        - List attendance
POST   /api/attendance/checkin/      - Check in
POST   /api/attendance/checkout/     - Check out
GET    /api/attendance/today/        - Today's attendance
GET    /api/attendance/my_status/    - My status
```

### Leave
```
GET    /api/leaves/            - List leaves
POST   /api/leaves/            - Apply leave
POST   /api/leaves/{id}/approve/     - Approve
POST   /api/leaves/{id}/reject/      - Reject
GET    /api/leaves/summary/          - Leave balance
```

### Tasks
```
GET    /api/tasks/             - List tasks
POST   /api/tasks/             - Create task
POST   /api/tasks/{id}/complete/     - Mark complete
```

### Payroll
```
GET    /api/payroll/           - List salary records
POST   /api/payroll/           - Create salary
GET    /api/payroll/{id}/slip_pdf/   - Download payslip
POST   /api/payroll/{id}/mark_paid/  - Mark paid
```

### Candidates
```
GET    /api/candidates/        - List candidates
POST   /api/candidates/        - Create candidate
POST   /api/candidates/{id}/schedule_interview/   - Schedule
POST   /api/candidates/{id}/send_offer/           - Send offer
```

### Notifications
```
GET    /api/notifications/             - List notifications
POST   /api/notifications/{id}/mark_read/   - Mark read
POST   /api/notifications/mark_all_read/    - Mark all read
```

---

## 🚀 Production Deployment

### Before Going Live

1. **Update Settings**
   - Set `DEBUG = False` in settings.py
   - Change `ALLOWED_HOSTS` to your domain
   - Generate strong `SECRET_KEY`

2. **Configure Email**
   ```
   EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USE_TLS=True
   EMAIL_HOST_USER=your-email@gmail.com
   EMAIL_HOST_PASSWORD=app-password
   ```

3. **Setup Database Backup**
   ```bash
   pg_dump pl_softtech_db > backup.sql
   ```

4. **Collect Static Files**
   ```bash
   python manage.py collectstatic --noinput
   ```

### Deploy Options

**Heroku:**
```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create your-app-name

# Add PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Deploy
git push heroku main
```

**DigitalOcean, AWS, Railway, Render:**
- Follow platform-specific Django deployment guides
- Use Gunicorn as application server
- Use Nginx as reverse proxy

---

## ✅ Verification Checklist

After setup, verify:

- [ ] Backend running at localhost:8000
- [ ] Frontend running at localhost:5173  
- [ ] Can login as hr_admin
- [ ] Dashboard loads without errors
- [ ] Can see sample employee
- [ ] Can see sample candidate
- [ ] Can check-in/out
- [ ] Can apply for leave
- [ ] Can assign task
- [ ] Can download payslip PDF
- [ ] Notifications bell works
- [ ] No console errors (F12)
- [ ] All pages load quickly

---

## 📧 Features to Test

### 1. Employee Management ✅
- Add new employee
- Upload profile picture
- Verify auto-generated ID (EMP-PL-00X)
- Verify auto-created login

### 2. Attendance ✅
- Check-in with timestamp
- Check-out with work hours calculation
- View attendance dashboard
- See late indicators

### 3. Leave Management ✅
- Apply for leave with reason
- HR approve leave
- Get notification
- Check leave balance

### 4. Tasks ✅
- Assign task to employee
- Employee marks done
- HR gets notification

### 5. Payroll ✅
- Create salary record
- Download payslip PDF
- Verify professional formatting
- Mark as paid

### 6. Candidates ✅
- Add candidate with resume
- Schedule interview
- Generate offer letter
- Send email

### 7. Notifications ✅
- Bell shows unread count
- Click to see all
- Mark as read

---

## 📚 Project Structure

```
pl_softtech_v3/
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── setup_db.py
│   ├── config/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── accounts/       - User authentication
│   ├── employees/      - Employee management
│   ├── attendance/     - Check-in/Leave/WFH
│   ├── tasks/          - Task management
│   ├── payroll/        - Salary & payslips
│   ├── internships/    - Intern management
│   ├── candidates/     - Candidate management
│   ├── notifications/  - Notifications
│   ├── colleges/       - Colleges
│   └── clients/        - Clients
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
    │   ├── components/
    │   └── pages/
    └── node_modules/
```

---

## 🎯 Next Steps

1. ✅ Extract ZIP file
2. ✅ Install prerequisites
3. ✅ Follow Step-by-Step Setup above
4. ✅ Test all features
5. ✅ Customize branding/colors
6. ✅ Configure email (SMTP)
7. ✅ Deploy to production

---

## 💡 Tips & Tricks

### Keep Both Servers Running
- Backend needs to run continuously
- Frontend needs to run continuously
- Use two terminal windows

### Common Commands

```bash
# Stop backend
Ctrl+C

# Stop frontend
Ctrl+C

# Restart backend
python manage.py runserver

# Restart frontend
npm run dev

# View backend logs
tail -f backend.log

# Reset database
python manage.py flush
```

### Useful Django Commands

```bash
# Create superuser
python manage.py createsuperuser

# View all users
python manage.py shell
>>> from accounts.models import User
>>> User.objects.all()

# Reset password
python manage.py changepassword username
```

---

## 🎉 You're All Set!

Your professional HR system is ready to use!

**Start Using:**
1. Backend: `python manage.py runserver`
2. Frontend: `npm run dev`
3. Visit: `http://localhost:5173`
4. Login: `hr_admin` / `admin@123`

**Need Help?**
- Check troubleshooting section above
- Check console errors (F12)
- Check server logs
- Review documentation in ZIP

---

**Built with ❤️ using Django + React + PostgreSQL**

Happy HR Management! 🚀

