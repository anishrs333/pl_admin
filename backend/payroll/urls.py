from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SalaryViewSet, AdvanceViewSet

router = DefaultRouter()
router.register('advances', AdvanceViewSet, basename='advance')
router.register('', SalaryViewSet, basename='salary')
urlpatterns = [path('', include(router.urls))]
