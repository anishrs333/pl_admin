from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import LoginView, MeView, ChangePasswordView, VerifyIDView

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('verify-id/', VerifyIDView.as_view(), name='verify-id'),
    path('refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('me/', MeView.as_view(), name='me'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
]
