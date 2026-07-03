from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AttendanceViewSet, LeaveViewSet
from .wfh_views import WorkFromHomeViewSet

router = DefaultRouter()
router.register('leaves', LeaveViewSet, basename='leave')
router.register('wfh', WorkFromHomeViewSet, basename='wfh')
router.register('', AttendanceViewSet, basename='attendance')
urlpatterns = [path('', include(router.urls))]
