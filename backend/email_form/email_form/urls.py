from django.urls import path, include

from email_form.views import ContactFormAPIView


urlpatterns = [
    path("open-form/", ContactFormAPIView.as_view(), name="contact-form"),
]