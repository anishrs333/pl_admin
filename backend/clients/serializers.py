from rest_framework import serializers
from .models import Client, Project

class ProjectSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.name', read_only=True)
    class Meta:
        model = Project
        fields = '__all__'

class ClientSerializer(serializers.ModelSerializer):
    projects = ProjectSerializer(many=True, read_only=True)
    class Meta:
        model = Client
        fields = '__all__'
