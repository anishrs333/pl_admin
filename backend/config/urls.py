from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),

    # Auth (login, refresh, me, change-password, verify-id)
    path('api/auth/', include('accounts.urls')),

    # Employees, Departments, Designations
    path('api/employees/', include('employees.urls')),

    # Attendance + Leaves (+ Work From Home)
    path('api/attendance/', include('attendance.urls')),

    # Tasks
    path('api/tasks/', include('tasks.urls')),

    # Payroll (Salary + Advances)
    path('api/payroll/', include('payroll.urls')),

    # Internships (Interns + Intern tasks)
    path('api/internships/', include('internships.urls')),

    # Recruitment
    path('api/candidates/', include('candidates.urls')),

    # Colleges & Workshops
    path('api/colleges/', include('colleges.urls')),

    # Clients & Projects
    path('api/clients/', include('clients.urls')),

    # Notifications
    path('api/notifications/', include('notifications.urls')),

    # Dashboard / reports
    path('api/reports/', include('reports.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
