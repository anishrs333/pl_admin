from rest_framework import serializers

from .models import ContactForm


class ContactFormSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactForm
        fields = "__all__"
        read_only_fields = ["id", "created_at"]