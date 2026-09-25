from rest_framework import serializers
from .models import Candidate
from employees.models import Employee


class CandidateSerializer(serializers.ModelSerializer):
    interviewed_by_name = serializers.CharField(source='interviewed_by.full_name', read_only=True)
    resume_url = serializers.SerializerMethodField()
    offer_letter_url = serializers.SerializerMethodField()

    class Meta:
        model = Candidate
        fields = [
            'id', 'candidate_id', 'first_name', 'last_name', 'email', 'mobile',
            'position_applied', 'college_name', 'resume', 'resume_url', 'cover_letter',
            'interview_scheduled_date', 'interview_scheduled_time',
            'interview_status', 'interview_notes', 'interviewed_by', 'interviewed_by_name',
            'interview_date', 'interview_rating',
            'status', 'selection_date',
            'offer_letter_generated', 'offer_letter_file', 'offer_letter_url',
            'offer_letter_sent', 'offer_letter_sent_date',
            'welcome_email_sent', 'welcome_email_sent_date',
            'email_status', 'email_attempts', 'email_error_message',
            'joining_date', 'joining_confirmed', 'joining_confirmation_date',
            'source', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['candidate_id', 'created_at', 'updated_at', 'email_attempts']

    def get_resume_url(self, obj):
        if obj.resume:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.resume.url)
        return None

    def get_offer_letter_url(self, obj):
        if obj.offer_letter_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.offer_letter_file.url)
        return None


class CandidateListSerializer(serializers.ModelSerializer):
    interviewed_by_name = serializers.CharField(source='interviewed_by.full_name', read_only=True)

    class Meta:
        model = Candidate
        fields = [
            'id', 'candidate_id', 'first_name', 'last_name', 'email', 'mobile',
            'position_applied', 'college_name', 'interview_status', 'status', 'email_status',
            'joining_date', 'interviewed_by_name', 'created_at'
        ]
