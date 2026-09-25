from django.urls import path
from .views import DashboardStatsView, MyDashboardStatsView
urlpatterns = [
    path('dashboard/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('my-dashboard/', MyDashboardStatsView.as_view(), name='my-dashboard-stats'),
]
