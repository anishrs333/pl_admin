# from django.contrib import admin
# from accounts.models import User


# admin.site.register(User)

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = (
        "username",
        "email",
        "role",
        "is_active",
        "is_staff",
        "must_change_password",
    )

    list_filter = (
        "role",
        "is_active",
        "is_staff",
        "must_change_password",
    )

    search_fields = (
        "username",
        "email",
        "first_name",
        "last_name",
        "phone",
    )

    ordering = ("username",)

    fieldsets = UserAdmin.fieldsets + (
        (
            "Additional Information",
            {
                "fields": (
                    "role",
                    "phone",
                    "must_change_password",
                    "last_login_ip",
                    "created_at",
                )
            },
        ),
    )

    readonly_fields = (
        "created_at",
        "last_login_ip",
    )

    add_fieldsets = UserAdmin.add_fieldsets + (
        (
            "Additional Information",
            {
                "fields": (
                    "role",
                    "phone",
                    "must_change_password",
                )
            },
        ),
    )