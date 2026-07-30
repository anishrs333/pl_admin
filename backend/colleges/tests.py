from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from colleges.models import College
from django.utils import timezone

User = get_user_model()


class CollegeStatusTest(TestCase):
    """Test college status and call_status defaults and toggling."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='hr_test', password='testpass', role='hr',
        )
        self.client.force_authenticate(user=self.user)
        self.college = College.objects.create(
            name='Test College', contact_person='Prof. X', mobile='9999999999',
        )

    def test_defaults(self):
        self.assertEqual(self.college.status, 'not_updated')
        self.assertEqual(self.college.call_status, 'not_called')
        self.assertIsNone(self.college.last_called_date)

    def test_toggle_called_sets_date(self):
        resp = self.client.post(f'/api/colleges/{self.college.id}/toggle_called/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['call_status'], 'called')
        self.assertEqual(resp.data['last_called_date'], timezone.now().date().isoformat())

    def test_toggle_called_back(self):
        self.college.call_status = 'called'
        self.college.last_called_date = timezone.now().date()
        self.college.save()

        resp = self.client.post(f'/api/colleges/{self.college.id}/toggle_called/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['call_status'], 'not_called')
        self.assertIsNone(resp.data['last_called_date'])

    def test_toggle_status(self):
        resp = self.client.post(f'/api/colleges/{self.college.id}/toggle_status/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['status'], 'updated')

        resp = self.client.post(f'/api/colleges/{self.college.id}/toggle_status/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['status'], 'not_updated')

    def test_unauthenticated_cannot_toggle(self):
        unauth_client = APIClient()
        resp = unauth_client.post(f'/api/colleges/{self.college.id}/toggle_called/')
        self.assertIn(resp.status_code, [401, 403])

    def test_follow_up_notes_field(self):
        self.college.follow_up_notes = 'Called on Monday, will follow up next week'
        self.college.save()
        self.college.refresh_from_db()
        self.assertEqual(self.college.follow_up_notes, 'Called on Monday, will follow up next week')
