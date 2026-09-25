from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CollegeViewSet, WorkshopViewSet
router = DefaultRouter()
router.register('workshops', WorkshopViewSet, basename='workshop')
router.register('', CollegeViewSet, basename='college')
urlpatterns = [path('', include(router.urls))]
