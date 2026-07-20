"""Helpers to create notifications — import and call from tasks/attendance/payroll views."""
from .models import Notification


def notify(recipient, notification_type, title, message, object_type='', object_id=None):
    """Create a notification for a user."""
    if recipient is None:
        return
    Notification.objects.create(
        recipient=recipient,
        notification_type=notification_type,
        title=title,
        message=message,
        object_type=object_type,
        object_id=object_id,
    )


def notify_task_assigned(task):
    """Notify employee/intern when HR assigns them a task."""
    assignee = task.assigned_to or task.assigned_to_intern
    user = getattr(assignee, 'user', None)
    if user:
        notify(
            recipient=user,
            notification_type='task_assigned',
            title='New task assigned',
            message=f'You have been assigned: "{task.title}" — due {task.deadline}.',
            object_type='task',
            object_id=task.id,
        )


def notify_task_completed(task):
    """Notify HR users when an employee/intern marks a task done."""
    from accounts.models import User
    assignee = task.assigned_to or task.assigned_to_intern
    assignee_name = getattr(assignee, 'full_name', None) or getattr(assignee, 'name', 'Someone')
    hr_users = User.objects.filter(role='hr', is_active=True)
    for hr in hr_users:
        notify(
            recipient=hr,
            notification_type='task_completed',
            title='Task completed',
            message=f'"{task.title}" was marked complete by {assignee_name}.',
            object_type='task',
            object_id=task.id,
        )


def notify_leave_applied(leave):
    """Notify HR when an employee/intern applies for leave."""
    from accounts.models import User
    hr_users = User.objects.filter(role='hr', is_active=True)
    for hr in hr_users:
        notify(
            recipient=hr,
            notification_type='leave_applied',
            title='New leave request',
            message=f'{leave.person_name} applied for {leave.get_leave_type_display()} ({leave.from_date} to {leave.to_date}).',
            object_type='leave',
            object_id=leave.id,
        )


def notify_leave_decision(leave):
    """Notify employee/intern when HR approves/rejects their leave."""
    person = leave.employee or leave.intern
    user = getattr(person, 'user', None)
    if user:
        status = 'approved' if leave.status == 'approved' else 'rejected'
        ntype = 'leave_approved' if leave.status == 'approved' else 'leave_rejected'
        notify(
            recipient=user,
            notification_type=ntype,
            title=f'Leave {status}',
            message=f'Your {leave.get_leave_type_display()} ({leave.from_date} to {leave.to_date}) has been {status}.',
            object_type='leave',
            object_id=leave.id,
        )


def notify_salary_generated(salary):
    """Notify employee/intern when salary record is created."""
    from payroll.utils import MONTHS
    person = salary.employee or salary.intern
    user = getattr(person, 'user', None)
    if user:
        month_name = MONTHS[salary.month] if hasattr(MONTHS, '__getitem__') else str(salary.month)
        notify(
            recipient=user,
            notification_type='salary_generated',
            title='Salary slip generated',
            message=f'Your payslip for {month_name} {salary.year} is ready. Net pay: ₹{salary.net_salary:,.2f}.',
            object_type='salary',
            object_id=salary.id,
        )


def notify_salary_paid(salary):
    """Notify employee/intern when salary is marked paid."""
    person = salary.employee or salary.intern
    user = getattr(person, 'user', None)
    if user:
        notify(
            recipient=user,
            notification_type='salary_paid',
            title='Salary paid',
            message=f'Your salary of ₹{salary.net_salary:,.2f} has been credited. Ref: {salary.payment_ref or "—"}.',
            object_type='salary',
            object_id=salary.id,
        )


def notify_break_applied(break_req):
    """Notify HR when an employee/intern submits a break request."""
    from accounts.models import User
    hr_users = User.objects.filter(role='hr', is_active=True)
    for hr in hr_users:
        notify(
            recipient=hr,
            notification_type='break_applied',
            title='New break request',
            message=f'{break_req.person_name} requested a {break_req.get_break_type_display()} on {break_req.date}.',
            object_type='break',
            object_id=break_req.id,
        )


def notify_break_decision(break_req):
    """Notify employee/intern when HR approves/rejects their break request."""
    person = break_req.employee or break_req.intern
    user = getattr(person, 'user', None)
    if user:
        decision = 'approved' if break_req.status == 'approved' else 'rejected'
        ntype = 'break_approved' if break_req.status == 'approved' else 'break_rejected'
        notify(
            recipient=user,
            notification_type=ntype,
            title=f'Break request {decision}',
            message=f'Your {break_req.get_break_type_display()} on {break_req.date} has been {decision}.',
            object_type='break',
            object_id=break_req.id,
        )
