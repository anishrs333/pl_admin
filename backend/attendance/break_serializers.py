from rest_framework import serializers
from .models import BreakRequest


class BreakRequestSerializer(serializers.ModelSerializer):
    person_name = serializers.CharField(read_only=True)
    person_code = serializers.CharField(read_only=True)
    person_type = serializers.CharField(read_only=True)
    break_type_display = serializers.CharField(source='get_break_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    reviewer_name = serializers.CharField(source='reviewer.full_name', read_only=True)

    class Meta:
        model = BreakRequest
        fields = [
            'id', 'employee', 'intern', 'person_name', 'person_code', 'person_type',
            'break_type', 'break_type_display',
            'date', 'reason',
            'status', 'status_display',
            'reviewer', 'reviewer_name', 'reviewed_at', 'reviewer_notes',
            'created_at',
        ]
        read_only_fields = ['reviewed_at', 'created_at', 'reviewer', 'employee', 'intern', 'status']
