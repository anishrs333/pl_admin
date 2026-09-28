from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from django.contrib.auth import authenticate
from .models import User
from .serializers import LoginSerializer, ChangePasswordSerializer, MeSerializer, UserListSerializer
from .permissions import IsHR


class LoginView(TokenObtainPairView):
    """
    POST /api/auth/login/  { username, password }
    `username` accepts: HR username, Employee ID (PL-EMP-...), or Intern ID (PL-INT-...)
    Returns access token + role + linked profile, and sets refresh token in httpOnly cookie.
    """
    serializer_class = LoginSerializer
    throttle_scope = 'login'

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except TokenError as e:
            raise InvalidToken(e.args[0])

        data = serializer.validated_data
        refresh = data.pop('refresh')
        response = Response(data, status=status.HTTP_200_OK)

        # Set httponly cookie for refresh token
        from django.conf import settings
        response.set_cookie(
            key='refresh_token',
            value=refresh,
            httponly=True,
            secure=not settings.DEBUG,
            samesite='Lax',
            max_age=7 * 24 * 60 * 60,  # 7 days
        )
        return response


class MeView(generics.RetrieveAPIView):
    serializer_class = MeSerializer

    def get_object(self):
        return self.request.user


class UserListView(generics.ListAPIView):
    """List users with HR/TL roles — for task assignment dropdowns."""
    permission_classes = [IsHR]
    serializer_class = UserListSerializer
    pagination_class = None

    def get_queryset(self):
        return User.objects.filter(role__in=['hr', 'hr_executive'], is_active=True).order_by('first_name')


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
        user = User.objects.filter(username__iexact=username, is_active=True).first()
        if not user:
            return Response({'valid': False, 'message': 'No account found for this ID.'}, status=status.HTTP_404_NOT_FOUND)
        return Response({'valid': True, 'role': user.role})


class CookieTokenRefreshView(APIView):
    """
    POST /api/auth/refresh/
    Reads the refresh token from httpOnly cookie and re-issues a new access token.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        from rest_framework_simplejwt.serializers import TokenRefreshSerializer
        refresh_token = request.COOKIES.get('refresh_token')
        if not refresh_token:
            return Response({'detail': 'Refresh token not found in cookies.'}, status=status.HTTP_400_BAD_REQUEST)

        # Inject refresh token into serializer validation context
        data = {'refresh': refresh_token}
        serializer = TokenRefreshSerializer(data=data)
        try:
            serializer.is_valid(raise_exception=True)
        except TokenError as e:
            raise InvalidToken(e.args[0])

        validated_data = serializer.validated_data
        new_refresh = validated_data.pop('refresh', None)

        response = Response(validated_data, status=status.HTTP_200_OK)
        if new_refresh:
            from django.conf import settings
            response.set_cookie(
                key='refresh_token',
                value=new_refresh,
                httponly=True,
                secure=not settings.DEBUG,
                samesite='Lax',
                max_age=7 * 24 * 60 * 60,
            )
        return response


class LogoutView(APIView):
    """
    POST /api/auth/logout/
    Clears the refresh token cookie.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        response = Response({'detail': 'Logged out successfully.'}, status=status.HTTP_200_OK)
        response.delete_cookie('refresh_token')
        return response
