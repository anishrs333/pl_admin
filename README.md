# PL Soft Tech HR Console - Admin & Payroll Management System

Welcome to the **PL Soft Tech HR Console** repository. This platform handles Employee & Intern Management, Payroll & Payslips, Attendance, Tasks, WFH Requests, and College Outreach.

---

## 📅 Comprehensive Overview of Today's Updates (August 11, 2026)

### 1. 💵 Payroll & Payslip Form UX Enhancements
- **Normal Text Input Boxes**:
  - Converted all numeric input fields in the payslip modal and creation page from `type="number"` to standard `type="text"` to eliminate browser up/down number spinner arrows.
  - **Fields Updated**: Year, Basic Salary (₹), HRA (₹), Allowances (₹), Incentive / Bonus (₹), Provident Fund (₹), Income Tax (₹), Other Deductions (₹), Leaves Taken (days), LOP Days (Loss of Pay), Per Day Salary (₹), and Leave Deduction (₹).
  - **Files**: `frontend/src/components/SendPayslipModal.jsx`, `frontend/src/pages/Payroll.jsx`.
- **Automatic Leave Deduction Calculation**:
  - Integrated `/api/payroll/leave-summary/` backend endpoint to automatically fetch total leaves taken, LOP days, per-day salary, and leave deduction amount based on employee salary and leave records.

---

### 2. 🔍 Multi-Criteria Filter Toolbar in Payroll
- Introduced a full interactive filter toolbar on the **Payroll / My Payslips** page.
- **Filtering Options**:
  - 🔎 **Search**: Filter by employee/intern name or code.
  - 📅 **Month Filter**: Filter payslips by specific month (All Months, Jan – Dec).
  - 📆 **Year Filter**: Filter by year (dynamically extracted from records).
  - 💳 **Status Filter**: Filter by payment status (**Paid** / **Pending**).
  - 👤 **Type Filter**: Filter by recipient category (**Employees** / **Interns**) for HR view.
  - 🔄 **Reset**: One-click reset button when any filters are active.
- **File**: `frontend/src/pages/Payroll.jsx`.

---

### 3. 🗑️ Cleaned Up "View Payslips" Action Option
- Removed the second action button (**View Payslips** - `FileText` icon) from the row actions in both Employee and Intern tables/cards.
- Cleaned up `viewPayslips` state, unused component imports, and modal handlers.
- Retained the **Send Payslip** (`Send` paper plane icon) button intact in action columns.
- Removed PDF download logic inside `PayslipListModal.jsx`.
- **Files**: `frontend/src/pages/Employees.jsx`, `frontend/src/pages/Internships.jsx`, `frontend/src/components/PayslipListModal.jsx`.

---

### 4. 🔑 Authentication & Mobile PDF Viewing Improvements
- Added support for token pass-through authentication via query parameter (`token=...`) in `backend/accounts/authentication.py` and `backend/accounts/views.py`.
- Enables mobile users to view and download PDF payslips directly in mobile browsers without cross-origin token loss.
- Enhanced `AuthContext.jsx` to synchronize session tokens seamlessly across tabs.

---

### 5. 🛡️ Backend Permissions & Automated Tests
- Updated permission classes across `accounts`, `attendance`, `employees`, `internships`, `payroll`, and `tasks` to enforce strict Role-Based Access Control (HR vs Employee/Intern).
- Added comprehensive unit tests for payroll endpoints in `backend/payroll/tests.py`.

---

## 🛠️ Project Setup & Installation

### Backend (Django REST Framework)
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```

---

## 📄 License
Internal proprietary software for PL Soft Tech.
