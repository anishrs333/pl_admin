from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from employees.models import Employee, Department, Designation
from internships.models import Intern
from django.utils import timezone

User = get_user_model()


class InternLoginBlockTest(TestCase):
    """Test that completed/terminated interns cannot log in."""

    def setUp(self):
        self.client = APIClient()
        self.dept = Department.objects.create(name='Engineering')
        self.desig = Designation.objects.create(name='Mentor', department=self.dept)
        self.mentor = Employee.objects.create(
            full_name='Mentor User', email='mentor@example.com', mobile='6666666666',
            department=self.dept, designation=self.desig,
            joining_date=timezone.now().date(), salary=50000, status='active',
        )

    def _create_intern(self, status='active'):
        intern = Intern.objects.create(
            name='Test Intern', email=f'intern_{status}@example.com', mobile='5555555555',
            college_name='Test College', domain='Web Dev',
            start_date=timezone.now().date(), end_date=timezone.now().date(),
            mentor=self.mentor, status=status,
        )
        user = intern.user
        user.set_password('5555555555')
        user.save()
        return intern, user

    def test_active_intern_can_log_in(self):
        intern, user = self._create_intern('active')
        resp = self.client.post('/api/auth/login/', {'username': user.username, 'password': '5555555555'}, format='json')
        self.assertEqual(resp.status_code, 200)

    def test_completed_intern_cannot_log_in(self):
        intern, user = self._create_intern('active')
        intern.status = 'completed'
        intern.save()
        user.refresh_from_db()
        self.assertFalse(user.is_active)

        resp = self.client.post('/api/auth/login/', {'username': user.username, 'password': '5555555555'}, format='json')
        self.assertIn(resp.status_code, [401, 400, 429])

    def test_terminated_intern_cannot_log_in(self):
        intern, user = self._create_intern('active')
        intern.status = 'terminated'
        intern.save()
        user.refresh_from_db()
        self.assertFalse(user.is_active)

        resp = self.client.post('/api/auth/login/', {'username': user.username, 'password': '5555555555'}, format='json')
        self.assertIn(resp.status_code, [401, 400, 429])

    def test_user_reactivated_on_status_return_to_active(self):
        intern, user = self._create_intern('active')
        intern.status = 'completed'
        intern.save()
        user.refresh_from_db()
        self.assertFalse(user.is_active)

        intern.status = 'active'
        intern.save()
        user.refresh_from_db()
        self.assertTrue(user.is_active)


class PaidInternValidationTest(TestCase):
    """Test that paid intern serializer validates stipend and clears fields for unpaid."""

    def test_intern_serializer_validates_stipend(self):
        from internships.serializers import InternSerializer
        data = {
            'name': 'Test', 'email': 'val@test.com', 'mobile': '1111111111',
            'college_name': 'College', 'domain': 'Dev',
            'start_date': timezone.now().date(), 'end_date': timezone.now().date(),
            'internship_type': 'paid', 'stipend_amount': 9999,
        }
        serializer = InternSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('stipend_amount', serializer.errors)

    def test_paid_intern_requires_valid_stipend(self):
        from internships.serializers import InternSerializer
        data = {
            'name': 'Test2', 'email': 'val2@test.com', 'mobile': '1111111112',
            'college_name': 'College', 'domain': 'Dev',
            'start_date': timezone.now().date(), 'end_date': timezone.now().date(),
            'internship_type': 'paid', 'stipend_amount': 3000,
        }
        serializer = InternSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_unpaid_intern_clears_stipend_and_payment_date(self):
        from internships.serializers import InternSerializer
        data = {
            'name': 'Test3', 'email': 'val3@test.com', 'mobile': '1111111113',
            'college_name': 'College', 'domain': 'Dev',
            'start_date': timezone.now().date(), 'end_date': timezone.now().date(),
            'internship_type': 'unpaid', 'stipend_amount': 5000,
            'payment_date': timezone.now().date(),
        }
        serializer = InternSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertIsNone(serializer.validated_data.get('stipend_amount'))
        self.assertIsNone(serializer.validated_data.get('payment_date'))


class InternReceiptPdfTest(TestCase):
    """Test that receipt PDF endpoint works correctly."""

    def setUp(self):
        self.client = APIClient()
        self.hr_user = User.objects.create_superuser(
            username='hr_receipt', email='hr@receipt.com', password='hr12345',
            role='hr',
        )
        self.dept = Department.objects.create(name='Engineering')
        self.desig = Designation.objects.create(name='Mentor', department=self.dept)
        self.mentor = Employee.objects.create(
            full_name='Mentor User', email='mentor3@example.com', mobile='7777777777',
            department=self.dept, designation=self.desig,
            joining_date=timezone.now().date(), salary=50000, status='active',
        )

    def _create_paid_intern(self):
        return Intern.objects.create(
            name='Paid Intern', email='paid_receipt@example.com', mobile='8888888888',
            college_name='Test College', domain='ML',
            start_date=timezone.now().date(), end_date=timezone.now().date(),
            mentor=self.mentor, internship_type='paid', stipend_amount=5000,
            payment_date=timezone.now().date(),
        )

    def test_paid_intern_receipt_returns_pdf(self):
        intern = self._create_paid_intern()
        self.client.force_authenticate(user=self.hr_user)
        resp = self.client.get(f'/api/internships/{intern.id}/receipt-pdf/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp['Content-Type'], 'application/pdf')
        self.assertIn('receipt_', resp['Content-Disposition'])

    def test_unpaid_intern_receipt_returns_400(self):
        intern = Intern.objects.create(
            name='Unpaid Intern', email='unpaid_receipt@example.com', mobile='9999999999',
            college_name='Test College', domain='Design',
            start_date=timezone.now().date(), end_date=timezone.now().date(),
            mentor=self.mentor, internship_type='unpaid',
        )
        self.client.force_authenticate(user=self.hr_user)
        resp = self.client.get(f'/api/internships/{intern.id}/receipt-pdf/')
        self.assertEqual(resp.status_code, 400)

    def test_non_hr_cannot_access_receipt(self):
        intern = self._create_paid_intern()
        regular_user = User.objects.create_user(
            username='regular', email='reg@receipt.com', password='reg12345',
            role='employee',
        )
        self.client.force_authenticate(user=regular_user)
        resp = self.client.get(f'/api/internships/{intern.id}/receipt-pdf/')
        self.assertEqual(resp.status_code, 403)
