from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from employees.models import Employee, Department, Designation
from django.utils import timezone

User = get_user_model()


class InactiveEmployeeLoginTest(TestCase):
    """Test that inactive employees cannot log in."""

    def setUp(self):
        self.client = APIClient()
        self.dept = Department.objects.create(name='Engineering')
        self.desig = Designation.objects.create(name='Developer', department=self.dept)

    def test_inactive_employee_cannot_obtain_token(self):
        emp = Employee.objects.create(
            full_name='Test User', email='test@example.com', mobile='9999999999',
            department=self.dept, designation=self.desig,
            joining_date=timezone.now().date(), salary=50000, status='active',
        )
        user = emp.user
        user.set_password('9999999999')
        user.save()

        resp = self.client.post('/api/auth/login/', {'username': user.username, 'password': '9999999999'}, format='json')
        self.assertEqual(resp.status_code, 200)

        emp.status = 'inactive'
        emp.save()

        resp = self.client.post('/api/auth/login/', {'username': user.username, 'password': '9999999999'}, format='json')
        self.assertIn(resp.status_code, [401, 400])

    def test_active_employee_can_log_in(self):
        emp = Employee.objects.create(
            full_name='Active User', email='active@example.com', mobile='8888888888',
            department=self.dept, designation=self.desig,
            joining_date=timezone.now().date(), salary=50000, status='active',
        )
        user = emp.user
        user.set_password('8888888888')
        user.save()

        resp = self.client.post('/api/auth/login/', {'username': user.username, 'password': '8888888888'}, format='json')
        self.assertEqual(resp.status_code, 200)

    def test_user_sync_on_employee_status_change(self):
        emp = Employee.objects.create(
            full_name='Sync Test', email='sync@example.com', mobile='7777777777',
            department=self.dept, designation=self.desig,
            joining_date=timezone.now().date(), salary=50000, status='active',
        )
        self.assertTrue(emp.user.is_active)

        emp.status = 'inactive'
        emp.save()
        emp.user.refresh_from_db()
        self.assertFalse(emp.user.is_active)

        emp.status = 'active'
        emp.save()
        emp.user.refresh_from_db()
        self.assertTrue(emp.user.is_active)
