from django.contrib import admin

from email_form.models import ContactForm

@admin.register(ContactForm)
class ContactFormAdmin(admin.ModelAdmin):
    readonly_fields = ("created_at",)

    fields = (
        "full_name",
        "email",
        "phone",
        "company",
        "subject",
        "message",
        "created_at",
    )