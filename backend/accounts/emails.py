"""
Welcome-email sender, fired the moment an Employee or Intern record (and
its linked login) is created. Uses Django's email backend, which defaults
to printing to the console in development — switch EMAIL_BACKEND to SMTP
in settings.py (or via env vars) to send real mail with zero code changes.
"""
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
import logging

logger = logging.getLogger(__name__)


def send_welcome_email(*, full_name, email, login_id, password, role_label, extra=None):
    """
    role_label: human string like 'Employee' or 'Intern' for copy in the email.
    extra: dict of role-specific details to show (department, domain, etc).

    This function deliberately swallows ALL exceptions. Onboarding a person
    (creating their record + login) must never fail because of an email
    template error, a missing setting, or an SMTP outage — those are logged
    and reported, not raised.
    """
    try:
        context = {
            'full_name': full_name,
            'login_id': login_id,
            'password': password,
            'role_label': role_label,
            'company_name': getattr(settings, 'COMPANY_NAME', 'PL Soft Tech Solutions'),
            'login_url': getattr(settings, 'FRONTEND_LOGIN_URL', 'http://localhost:5173/login'),
            'extra': extra or {},
        }
        subject = f"Welcome to {context['company_name']}, {full_name.split()[0]}! \U0001F389"
        text_body = render_to_string('accounts/welcome_email.txt', context)
        html_body = render_to_string('accounts/welcome_email.html', context)

        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', None) or 'hr@plsofttech.com'
        msg = EmailMultiAlternatives(subject=subject, body=text_body, from_email=from_email, to=[email])
        msg.attach_alternative(html_body, 'text/html')
        msg.send(fail_silently=False)
        logger.info('Welcome email sent to %s <%s>', full_name, email)
    except Exception as exc:
        logger.warning('Welcome email failed for %s <%s>: %s', full_name, email, exc)
