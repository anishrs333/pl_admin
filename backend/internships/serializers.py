from rest_framework import serializers
from .models import Intern, InternTask


class InternTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = InternTask
        fields = '__all__'


class InternSerializer(serializers.ModelSerializer):
    mentor_name = serializers.CharField(source='mentor.full_name', read_only=True)
    login_username = serializers.CharField(source='user.username', read_only=True, allow_null=True)
    tasks = InternTaskSerializer(many=True, read_only=True)
    profile_picture_url = serializers.SerializerMethodField()

    class Meta:
        model = Intern
        fields = [
            'id', 'intern_id', 'name', 'email', 'mobile', 'college_name', 'domain',
            'description', 'mentor', 'mentor_name',
            'start_date', 'end_date', 'status',
            'performance_score', 'certificate_issued',
            'profile_picture', 'profile_picture_url',
            'login_username', 'tasks', 'created_at',
        ]
        read_only_fields = ['intern_id', 'created_at', 'login_username', 'user']

    def get_profile_picture_url(self, obj):
        request = self.context.get('request')
        if obj.profile_picture and request:
            return request.build_absolute_uri(obj.profile_picture.url)
        return None


class InternListSerializer(serializers.ModelSerializer):
    mentor_name = serializers.CharField(source='mentor.full_name', read_only=True, allow_null=True)
    profile_picture_url = serializers.SerializerMethodField()

    class Meta:
        model = Intern
        fields = [
            'id', 'intern_id', 'name', 'email', 'mobile',
            'college_name', 'domain', 'status',
            'start_date', 'end_date',
            'profile_picture', 'profile_picture_url',
            'mentor_name',
        ]

    def get_profile_picture_url(self, obj):
        request = self.context.get('request')
        if obj.profile_picture and request:
            return request.build_absolute_uri(obj.profile_picture.url)
        return None
