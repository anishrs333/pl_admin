from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.exceptions import AuthenticationFailed
from django.contrib.auth import authenticate
from .models import User


class LoginSerializer(TokenObtainPairSerializer):
    """
    Verifies username/ID + password, then enriches the JWT and the login
    response with role + linked-profile info so the frontend can route
    correctly without a second request.
    """
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['full_name'] = user.get_full_name() or user.username
        token['must_change_password'] = user.must_change_password
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user

        data['role'] = user.role
        data['username'] = user.username
        data['full_name'] = user.get_full_name() or user.username
        data['email'] = user.email
        data['must_change_password'] = user.must_change_password

        if hasattr(user, 'employee_profile'):
            emp = user.employee_profile
            data['profile'] = {
                'kind': 'employee',
                'id': emp.id,
                'code': emp.employee_id,
                'department': emp.department.name if emp.department else None,
                'designation': emp.designation.name if emp.designation else None,
                'status': emp.status,
            }
        elif hasattr(user, 'intern_profile'):
            intern = user.intern_profile
            data['profile'] = {
                'kind': 'intern',
                'id': intern.id,
                'code': intern.intern_id,
                'domain': intern.domain,
                'college': intern.college_name,
                'status': intern.status,
            }
        else:
            data['profile'] = None

        return data


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=4)

    def validate_current_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Current password is incorrect.')
        return value


class MeSerializer(serializers.ModelSerializer):
    profile = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'phone', 'must_change_password', 'profile']

    def get_profile(self, obj):
        if hasattr(obj, 'employee_profile'):
            emp = obj.employee_profile
            return {'kind': 'employee', 'id': emp.id, 'code': emp.employee_id, 'status': emp.status}
        if hasattr(obj, 'intern_profile'):
            intern = obj.intern_profile
            return {'kind': 'intern', 'id': intern.id, 'code': intern.intern_id, 'status': intern.status}
        return None
