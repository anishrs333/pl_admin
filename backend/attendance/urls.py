from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AttendanceViewSet, LeaveViewSet
from .wfh_views import WorkFromHomeViewSet
from .break_views import BreakRequestViewSet

router = DefaultRouter()
router.register('leaves', LeaveViewSet, basename='leave')
router.register('wfh', WorkFromHomeViewSet, basename='wfh')
router.register('breaks', BreakRequestViewSet, basename='break')
router.register('', AttendanceViewSet, basename='attendance')
urlpatterns = [path('', include(router.urls))]

