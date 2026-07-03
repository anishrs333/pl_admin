from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DepartmentViewSet, DesignationViewSet, EmployeeViewSet

router = DefaultRouter()
router.register('departments', DepartmentViewSet)
router.register('designations', DesignationViewSet)
router.register('', EmployeeViewSet, basename='employee')

urlpatterns = [path('', include(router.urls))]
