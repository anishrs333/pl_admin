from rest_framework import serializers
from .models import Task


class TaskSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.SerializerMethodField()
    assignee_type = serializers.CharField(read_only=True)

    class Meta:
        model = Task
        fields = '__all__'
        read_only_fields = ['created_at', 'completed_at']

    def get_assigned_to_name(self, obj):
        return obj.assignee_name

    def validate(self, data):
        assigned_to = data.get('assigned_to', getattr(self.instance, 'assigned_to', None))
        assigned_to_intern = data.get('assigned_to_intern', getattr(self.instance, 'assigned_to_intern', None))
        if bool(assigned_to) == bool(assigned_to_intern):
            raise serializers.ValidationError('Assign the task to exactly one employee or intern.')
        return data
