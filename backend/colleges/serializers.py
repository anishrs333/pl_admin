from rest_framework import serializers
from .models import College, Workshop

class WorkshopSerializer(serializers.ModelSerializer):
    college_name = serializers.CharField(source='college.name', read_only=True)
    class Meta:
        model = Workshop
        fields = '__all__'

class CollegeSerializer(serializers.ModelSerializer):
    workshops = WorkshopSerializer(many=True, read_only=True)
    class Meta:
        model = College
        fields = '__all__'
