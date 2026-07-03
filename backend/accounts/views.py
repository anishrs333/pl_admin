from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from django.contrib.auth import authenticate
from .models import User
from .serializers import LoginSerializer, ChangePasswordSerializer, MeSerializer


class LoginView(TokenObtainPairView):
    """
    POST /api/auth/login/  { username, password }
    `username` accepts: HR username, Employee ID (PL-EMP-...), or Intern ID (PL-INT-...)
    Returns access/refresh tokens + role + linked profile in one round trip.
    """
    serializer_class = LoginSerializer


class MeView(generics.RetrieveAPIView):
    serializer_class = MeSerializer

    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = request.user
        user.set_password(serializer.validated_data['new_password'])
        user.must_change_password = False
        user.save()
        return Response({'message': 'Password updated successfully.'})


class VerifyIDView(APIView):
    """
    Lightweight pre-check used by the login screen to confirm an ID format
    is recognized before submitting full credentials (no password required).
    POST { username }
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username', '').strip()
        exists = User.objects.filter(username__iexact=username, is_active=True).exists()
        if not exists:
            return Response({'valid': False, 'message': 'No account found for this ID.'}, status=status.HTTP_404_NOT_FOUND)
        user = User.objects.get(username__iexact=username)
        return Response({'valid': True, 'role': user.role})
