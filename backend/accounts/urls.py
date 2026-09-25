from django.urls import path
from .views import LoginView, MeView, ChangePasswordView, VerifyIDView, UserListView, CookieTokenRefreshView, LogoutView

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('verify-id/', VerifyIDView.as_view(), name='verify-id'),
    path('refresh/', CookieTokenRefreshView.as_view(), name='token-refresh'),
    path('me/', MeView.as_view(), name='me'),
    path('users/', UserListView.as_view(), name='user-list'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('logout/', LogoutView.as_view(), name='logout'),
]
