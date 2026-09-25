from rest_framework import serializers
from .models import WorkFromHome


class WorkFromHomeSerializer(serializers.ModelSerializer):
    person_name = serializers.CharField(read_only=True)
    person_code = serializers.CharField(read_only=True)
    person_type = serializers.CharField(read_only=True)
    reviewer_name = serializers.CharField(source='reviewer.full_name', read_only=True)

    class Meta:
        model = WorkFromHome
        fields = [
            'id', 'employee', 'intern', 'person_name', 'person_code', 'person_type',
            'date', 'reason', 'working_address', 'expected_hours', 'task_description', 'status',
            'reviewer', 'reviewer_name', 'reviewed_at', 'reviewer_notes',
            'created_at'
        ]
<<<<<<< HEAD
        read_only_fields = ['reviewed_at', 'created_at', 'reviewer', 'status']
=======
        read_only_fields = ['reviewed_at', 'created_at', 'reviewer', 'employee', 'intern', 'status']
>>>>>>> e6612d4285a38b7472367da6263ce41b31f0b002

