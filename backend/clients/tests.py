from django.test import TestCase
from clients.models import Client, Project
from decimal import Decimal


class ProjectBalanceTest(TestCase):
    """Test balance_amount computation and paid_amount validation."""

    def setUp(self):
        self.client = Client.objects.create(
            name='Test Client', contact_person='John', email='john@test.com',
            mobile='9999999999',
        )

    def test_balance_computation(self):
        project = Project.objects.create(
            client=self.client, name='Project A',
            start_date='2026-01-01', total_amount=Decimal('50000'), paid_amount=Decimal('20000'),
        )
        self.assertEqual(project.balance_amount, Decimal('30000'))

    def test_zero_balance(self):
        project = Project.objects.create(
            client=self.client, name='Project B',
            start_date='2026-01-01', total_amount=Decimal('10000'), paid_amount=Decimal('10000'),
        )
        self.assertEqual(project.balance_amount, Decimal('0'))

    def test_full_balance(self):
        project = Project.objects.create(
            client=self.client, name='Project C',
            start_date='2026-01-01', total_amount=Decimal('0'), paid_amount=Decimal('0'),
        )
        self.assertEqual(project.balance_amount, Decimal('0'))

    def test_paid_exceeds_total_rejected(self):
        project = Project(
            client=self.client, name='Project D',
            start_date='2026-01-01', total_amount=Decimal('10000'), paid_amount=Decimal('15000'),
        )
        with self.assertRaises(Exception):
            project.full_clean()

    def test_serializer_validates_paid_amount(self):
        from clients.serializers import ProjectSerializer
        data = {
            'client': self.client.id, 'name': 'Serializer Test',
            'start_date': '2026-01-01', 'total_amount': '10000', 'paid_amount': '20000', 'status': 'active',
        }
        serializer = ProjectSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('paid_amount', serializer.errors)

    def test_serializer_accepts_valid_amounts(self):
        from clients.serializers import ProjectSerializer
        data = {
            'client': self.client.id, 'name': 'Valid Test',
            'start_date': '2026-01-01', 'total_amount': '50000', 'paid_amount': '30000', 'status': 'active',
        }
        serializer = ProjectSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_balance_amount_in_serializer_output(self):
        from clients.serializers import ProjectSerializer
        project = Project.objects.create(
            client=self.client, name='Output Test',
            start_date='2026-01-01', total_amount=Decimal('50000'), paid_amount=Decimal('20000'),
        )
        serializer = ProjectSerializer(project)
        self.assertEqual(serializer.data['balance_amount'], '30000.00')
