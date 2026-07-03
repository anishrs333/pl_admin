# Changelog - PL Soft Tech HR Console v3

## Version 3.0 - Complete Overhaul

### Major Features Added
- ✅ **Attendance System** with check-in/check-out timestamps
- ✅ **Leave Management** (Sick, Paid, Unpaid, Casual, Earned)
- ✅ **Leave Approval Workflow** with HR review & employee notifications
- ✅ **Notification System** with real-time bell and persistent panel
- ✅ **Task Management** with assignment & completion tracking
- ✅ **Professional Payslips** as downloadable PDF with company branding
- ✅ **Profile Pictures** for employees and interns
- ✅ **Search & Filter** working across all entities
- ✅ **Modal Forms** with proper validation & close handlers
- ✅ **Automatic Login Provisioning** when adding employees/interns
- ✅ **Email Notifications** sent on important events

### ID Format Changes (Breaking Change)
- **Employee IDs**: Changed from `PL-EMP-2026-0001` to `EMP-PL-001`
- **Intern IDs**: Changed from `PL-INT-2026-NNNN` to `INT-PL-001`
- **Candidate IDs**: Added `CAND-PL-001` format

### API Improvements
- `/api/attendance/checkin/` - Employee check-in
- `/api/attendance/checkout/` - Employee check-out
- `/api/attendance/leaves/` - Full leave CRUD with approve/reject
- `/api/tasks/{id}/complete/` - Mark task done with notification
- `/api/payroll/{id}/slip_pdf/` - Download professional PDF payslip
- `/api/notifications/` - Full notification management

### Frontend Improvements
- ✅ Fixed Layout system (main-area + page-body wrapper)
- ✅ Fixed Modal close button (X button now works)
- ✅ Fixed table overflow (removed negative margins)
- ✅ Added Notification Bell with unread count
- ✅ Improved form validation and error handling
- ✅ Added loading spinners on buttons
- ✅ Professional card-based UI
- ✅ Responsive search inputs on all pages

### Backend Improvements
- ✅ Added Notifications app with utils for firing events
- ✅ Improved serializer validation with proper error messages
- ✅ Added MultiPartParser for file uploads
- ✅ Proper permission classes (IsHR, IsHRorSelfReadOnly)
- ✅ Email notifications on employee creation
- ✅ Automatic user provisioning on employee/intern creation

### Bug Fixes
- ✅ Modal X button now properly closes
- ✅ Form validation errors now show clearly
- ✅ Search now filters on backend (not just frontend)
- ✅ Profile picture URLs properly exposed in API
- ✅ Employee status field properly validated
- ✅ Leave dates properly validated (from_date < to_date)
- ✅ Task completion fires HR notifications
- ✅ Payslip PDF properly generated with ReportLab

### Known Limitations
- Email backend uses console (development only)
- No WebSocket for real-time notifications (polling every 30s)
- PDF generation uses ReportLab (simple template)

### Next Steps for Production
1. Configure real SMTP for email notifications
2. Add WebSocket for real-time notifications (django-channels)
3. Implement custom PDF design (reportlab or weasyprint)
4. Add two-factor authentication
5. Add audit logging for all changes
6. Implement role-based access control (RBAC)

