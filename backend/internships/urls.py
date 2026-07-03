from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InternViewSet, InternTaskViewSet

router = DefaultRouter()
router.register('tasks', InternTaskViewSet, basename='intern-task')
router.register('', InternViewSet, basename='intern')

urlpatterns = [path('', include(router.urls))]
