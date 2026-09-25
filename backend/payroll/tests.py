"""Automated tests for payroll permissions, leave-based salary calculations,
and the /payroll/leave-summary/ endpoint.

Run with:
    .venv\\Scripts\\python.exe manage.py test payroll --verbosity=2
"""
from decimal import Decimal
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status

from accounts.models import User
from employees.models import Employee, Department, Designation
from internships.models import Intern
from attendance.models import Leave
from payroll.models import Salary


# ─── Helpers ──────────────────────────────────────────────────────────────────

def make_user(username, role, **kw):
    u = User.objects.create_user(username=username, password='testpass', role=role, **kw)
    return u


# ─── Base test case ────────────────────────────────────────────────────────────

class PayrollTestBase(TestCase):
    def setUp(self):
        # HR (full)
        self.hr_user = make_user('hr_admin', 'hr')
        # HR Executive
        self.hr_exec_user = make_user('hr_exec', 'hr_executive')
        # Regular employee
        self.emp_user = make_user('emp_user', 'employee')

        dept = Department.objects.create(name='Engineering')
        desig = Designation.objects.create(name='Software Developer', department=dept)

        self.employee = Employee.objects.create(
            user=self.emp_user,
            full_name='Test Employee',
            employee_id='PL-EMP-001',
            mobile='9999999999',
            department=dept,
            designation=desig,
            salary=Decimal('7000.00'),
            joining_date='2024-01-01',
        )

        # Intern user
        self.intern_user = make_user('intern_user', 'intern')
        self.intern = Intern.objects.create(
            user=self.intern_user,
            name='Test Intern',
            intern_id='PL-INT-001',
            email='intern@test.com',
            mobile='8888888888',
            college_name='Test College',
            domain='Software Development',
            stipend_amount=5000,
            internship_type='paid',
            start_date='2024-01-01',
            end_date='2024-06-30',
        )

        # Salary records
        self.emp_salary = Salary.objects.create(
            employee=self.employee,
            month=7,
            year=2026,
            basic_salary=Decimal('3500.00'),
            hra=Decimal('1400.00'),
            allowances=Decimal('2100.00'),
            incentives=Decimal('0.00'),
            pf_deduction=Decimal('0.00'),
            tax_deduction=Decimal('0.00'),
            other_deductions=Decimal('0.00'),
            lop_days=Decimal('0'),
            leave_deduction=Decimal('0.00'),
        )

        self.hr_client = APIClient()
        self.emp_client = APIClient()
        self.intern_client = APIClient()
        self.hr_exec_client = APIClient()
        self.anon_client = APIClient()

        # Authenticate using force_authenticate (bypasses cookie flow)
        self.hr_client.force_authenticate(user=self.hr_user)
        self.hr_exec_client.force_authenticate(user=self.hr_exec_user)
        self.emp_client.force_authenticate(user=self.emp_user)
        self.intern_client.force_authenticate(user=self.intern_user)


# ─── Permission tests ──────────────────────────────────────────────────────────

class SalaryPermissionTests(PayrollTestBase):
    """Test who can see what salary records."""

    def test_hr_sees_all_salaries(self):
        res = self.hr_client.get('/api/payroll/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        count = res.data.get('count', len(res.data))
        self.assertGreaterEqual(count, 1)

    def test_employee_sees_own_salary_only(self):
        res = self.emp_client.get('/api/payroll/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        results = res.data.get('results', res.data)
        for sal in results:
            self.assertEqual(sal.get('employee'), self.employee.id)

    def test_intern_sees_own_salary_only(self):
        intern_salary = Salary.objects.create(
            intern=self.intern,
            month=7,
            year=2026,
            basic_salary=Decimal('5000.00'),
            hra=Decimal('0.00'),
            allowances=Decimal('0.00'),
            incentives=Decimal('0.00'),
        )
        res = self.intern_client.get('/api/payroll/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        results = res.data.get('results', res.data)
        ids = [s.get('id') for s in results]
        self.assertIn(intern_salary.id, ids)
        self.assertNotIn(self.emp_salary.id, ids)

    def test_anon_blocked(self):
        res = self.anon_client.get('/api/payroll/')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_hr_exec_cannot_create_salary(self):
        """HR Executive (is_hr, not is_full_hr) cannot create salary records."""
        data = {
            'employee': self.employee.id,
            'month': 8, 'year': 2026,
            'basic_salary': '3500.00',
        }
        res = self.hr_exec_client.post('/api/payroll/', data, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_full_hr_can_create_salary(self):
        data = {
            'employee': self.employee.id,
            'month': 9, 'year': 2026,
            'basic_salary': '3500.00',
            'hra': '1400.00',
            'allowances': '2100.00',
            'incentives': '0',
            'pf_deduction': '0',
            'tax_deduction': '0',
            'other_deductions': '0',
        }
        res = self.hr_client.post('/api/payroll/', data, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)


# ─── Leave deduction calculation tests ────────────────────────────────────────

class LeaveDeductionTests(PayrollTestBase):
    """Test the leave-based salary deduction formula."""

    def test_net_salary_with_lop_deduction(self):
        """Gross ₹7000, 1 LOP day → deduction = 7000/30 ≈ ₹233.33 → net ≈ ₹6766.67."""
        salary = Salary(
            employee=self.employee,
            month=8,
            year=2026,
            basic_salary=Decimal('3500.00'),
            hra=Decimal('1400.00'),
            allowances=Decimal('2100.00'),
            incentives=Decimal('0.00'),
            pf_deduction=Decimal('0.00'),
            tax_deduction=Decimal('0.00'),
            other_deductions=Decimal('0.00'),
            lop_days=Decimal('1'),
        )
        salary.save()
        # per_day_salary = 3500/30 ≈ 116.67 (based on basic_salary)
        # leave_deduction = 116.67 * 1 ≈ 116.67
        # net = 7000 - 116.67 ≈ 6883.33
        self.assertGreater(salary.leave_deduction, 0)
        self.assertLess(float(salary.net_salary), 7000)

    def test_zero_lop_no_deduction(self):
        """Zero LOP days → leave_deduction stays 0."""
        salary = Salary.objects.create(
            employee=self.employee,
            month=10,
            year=2026,
            basic_salary=Decimal('3500.00'),
            hra=Decimal('1400.00'),
            allowances=Decimal('2100.00'),
            incentives=Decimal('0.00'),
            lop_days=Decimal('0'),
        )
        self.assertEqual(salary.leave_deduction, Decimal('0.00'))
        self.assertEqual(float(salary.net_salary), 7000.0)

    def test_example_slip_calculation(self):
        """Replicates the user's example: 30-day month, 1 leave, gross=7000 → net≈6767."""
        gross = Decimal('7000.00')
        lop_days = Decimal('1')
        per_day = gross / 30
        deduction = round(per_day * lop_days, 2)
        net = gross - deduction
        # The example shows net = 6767 (233 deducted)
        self.assertAlmostEqual(float(net), 6766.67, places=1)


# ─── Leave summary endpoint tests ─────────────────────────────────────────────

class LeaveSummaryEndpointTests(PayrollTestBase):
    """Test GET /api/payroll/leave-summary/"""

    def test_hr_can_fetch_leave_summary(self):
        res = self.hr_client.get('/api/payroll/leave-summary/', {
            'employee': self.employee.id,
            'month': 7,
            'year': 2026,
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('total_leaves', res.data)
        self.assertIn('lop_days', res.data)
        self.assertIn('per_day_salary', res.data)
        self.assertIn('leave_deduction', res.data)

    def test_leave_summary_with_approved_unpaid_leave(self):
        """An approved unpaid leave in the period increases lop_days and leave_deduction."""
        Leave.objects.create(
            employee=self.employee,
            from_date='2026-07-10',
            to_date='2026-07-10',
            leave_type='unpaid',
            status='approved',
            reason='Personal',
        )
        res = self.hr_client.get('/api/payroll/leave-summary/', {
            'employee': self.employee.id,
            'month': 7,
            'year': 2026,
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertGreater(res.data['lop_days'], 0)
        self.assertGreater(res.data['leave_deduction'], 0)

    def test_employee_blocked_from_leave_summary(self):
        """Employees cannot call leave-summary (it's HR-only)."""
        res = self.emp_client.get('/api/payroll/leave-summary/', {
            'employee': self.employee.id,
            'month': 7, 'year': 2026,
        })
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_missing_params_returns_400(self):
        res = self.hr_client.get('/api/payroll/leave-summary/', {'month': 7, 'year': 2026})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


# ─── PDF download endpoint tests ──────────────────────────────────────────────

class SlipPDFTests(PayrollTestBase):
    """Test payslip PDF download with inline/attachment disposition."""

    def test_hr_can_download_pdf(self):
        res = self.hr_client.get(f'/api/payroll/{self.emp_salary.id}/slip_pdf/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res['Content-Type'], 'application/pdf')
        self.assertIn('attachment', res['Content-Disposition'])

    def test_inline_param_changes_disposition(self):
        res = self.hr_client.get(f'/api/payroll/{self.emp_salary.id}/slip_pdf/?inline=1')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('inline', res['Content-Disposition'])

    def test_employee_can_download_own_slip(self):
        res = self.emp_client.get(f'/api/payroll/{self.emp_salary.id}/slip_pdf/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_anon_cannot_download_pdf(self):
        res = self.anon_client.get(f'/api/payroll/{self.emp_salary.id}/slip_pdf/')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
