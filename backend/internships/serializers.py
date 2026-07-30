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
            'internship_type', 'stipend_amount', 'payment_date',
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

    def validate(self, data):
        internship_type = data.get('internship_type', getattr(self.instance, 'internship_type', 'unpaid'))
        stipend_amount = data.get('stipend_amount', getattr(self.instance, 'stipend_amount', None))
        payment_date = data.get('payment_date', getattr(self.instance, 'payment_date', None))
        if internship_type == 'unpaid':
            data['stipend_amount'] = None
            data['payment_date'] = None
        elif internship_type == 'paid':
            if stipend_amount not in (3000, 5000):
                raise serializers.ValidationError({'stipend_amount': 'Paid internship must have a fee of ₹3,000 or ₹5,000.'})
        return data


class InternListSerializer(serializers.ModelSerializer):
    mentor_name = serializers.CharField(source='mentor.full_name', read_only=True, allow_null=True)
    profile_picture_url = serializers.SerializerMethodField()

    class Meta:
        model = Intern
        fields = [
            'id', 'intern_id', 'name', 'email', 'mobile',
            'college_name', 'domain', 'status',
            'internship_type', 'stipend_amount', 'payment_date',
            'start_date', 'end_date',
            'profile_picture', 'profile_picture_url',
            'mentor_name',
        ]

    def get_profile_picture_url(self, obj):
        request = self.context.get('request')
        if obj.profile_picture and request:
            return request.build_absolute_uri(obj.profile_picture.url)
        return None
