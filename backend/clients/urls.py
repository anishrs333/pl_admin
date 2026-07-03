from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ClientViewSet, ProjectViewSet
router = DefaultRouter()
router.register('projects', ProjectViewSet, basename='project')
router.register('', ClientViewSet, basename='client')
urlpatterns = [path('', include(router.urls))]
