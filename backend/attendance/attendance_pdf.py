"""Attendance report PDF generator — Weekly and Monthly views.

Uses ReportLab (same as payslip_pdf.py) to produce professional
attendance reports with company branding.
"""
from io import BytesIO
from collections import defaultdict
from datetime import date, timedelta

from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch, mm
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable,
)
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT


# ── Colour Palette ────────────────────────────────────────────────────────────
PRIMARY       = colors.HexColor('#1B5E9E')
PRIMARY_DARK  = colors.HexColor('#14456F')
PRIMARY_LIGHT = colors.HexColor('#E8F0FE')
PRIMARY_50    = colors.HexColor('#F0F6FF')
CHARCOAL      = colors.HexColor('#212121')
GRAY_800      = colors.HexColor('#424242')
GRAY_600      = colors.HexColor('#757575')
GRAY_400      = colors.HexColor('#BDBDBD')
GRAY_200      = colors.HexColor('#EEEEEE')
GRAY_100      = colors.HexColor('#F5F5F5')
WHITE         = colors.white
GREEN         = colors.HexColor('#0D7C3D')
GREEN_LIGHT   = colors.HexColor('#E6F5EC')
RED           = colors.HexColor('#D32F2F')
RED_LIGHT     = colors.HexColor('#FFEBEE')
AMBER         = colors.HexColor('#E65100')
AMBER_LIGHT   = colors.HexColor('#FFF8E1')

MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December']

WEEKDAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

COMPANY_NAME = 'PL Soft Tech Solutions Pvt Ltd'


def _s(name, **kw):
    defaults = dict(fontName='Helvetica', fontSize=8, textColor=GRAY_800, leading=10)
    defaults.update(kw)
    return ParagraphStyle(name, **defaults)


def _fmt_time(dt):
    """Format a datetime to HH:MM, or return '—'."""
    if not dt:
        return '—'
    if hasattr(dt, 'strftime'):
        return dt.strftime('%H:%M')
    return '—'


def _fmt_hours(h):
    if not h:
        return '—'
    return f'{h:.1f}h'


def _get_week_range(ref_date):
    """Return (monday, sunday) of the week containing ref_date."""
    monday = ref_date - timedelta(days=ref_date.weekday())
    sunday = monday + timedelta(days=6)
    return monday, sunday


def _get_month_range(ref_date):
    """Return (first_day, last_day) of the month containing ref_date."""
    first = ref_date.replace(day=1)
    if ref_date.month == 12:
        last = ref_date.replace(day=31)
    else:
        last = ref_date.replace(month=ref_date.month + 1, day=1) - timedelta(days=1)
    return first, last


def _build_header(title, subtitle, uw):
    """Build a blue header band with company name and report title."""
    co = Paragraph(
        f'<font size="12" color="#FFFFFF"><b>{COMPANY_NAME}</b></font><br/>'
        f'<font size="7" color="#B3D4F5">{subtitle}</font>',
        _s('co', leading=14)
    )
    rpt = Paragraph(
        f'<font size="14" color="#FFFFFF"><b>{title}</b></font>',
        _s('rpt', alignment=TA_RIGHT, leading=16)
    )
    tbl = Table([[co, rpt]], colWidths=[uw * 0.6, uw * 0.4])
    tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), PRIMARY),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (0, 0), 14),
        ('RIGHTPADDING', (-1, 0), (-1, 0), 14),
        ('TOPPADDING', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
    ]))
    return tbl


def _build_footer(uw):
    """Build a bottom blue band."""
    band = Table(
        [[Paragraph(
            f'<font size="6.5" color="#B3D4F5">{COMPANY_NAME} &nbsp;|&nbsp; '
            f'Attendance Report &nbsp;|&nbsp; System Generated</font>',
            _s('ft', alignment=TA_CENTER)
        )]],
        colWidths=[uw]
    )
    band.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), PRIMARY_DARK),
        ('TOPPADDING', (0, 0), (-1, -1), 7),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
    ]))
    return band


# ══════════════════════════════════════════════════════════════════════════════
#  WEEKLY REPORT
# ══════════════════════════════════════════════════════════════════════════════

def generate_weekly_report_pdf(records, start_date, end_date):
    """Generate a weekly attendance report PDF.

    Args:
        records: QuerySet of Attendance objects for the date range.
        start_date: date object for period start.
        end_date: date object for period end.
    Returns:
        BytesIO buffer containing the PDF.
    """
    buf = BytesIO()
    W, H = landscape(A4)
    doc = SimpleDocTemplate(
        buf, pagesize=landscape(A4),
        topMargin=0.3 * inch, bottomMargin=0.3 * inch,
        leftMargin=0.4 * inch, rightMargin=0.4 * inch
    )
    uw = W - 0.8 * inch
    elements = []

    # Header
    subtitle = f'{start_date.strftime("%d %b %Y")} — {end_date.strftime("%d %b %Y")}'
    elements.append(_build_header('WEEKLY ATTENDANCE REPORT', subtitle, uw))
    elements.append(Spacer(1, 12))

    # Build date columns (only weekdays with data, or all 7 if <=7 days)
    num_days = (end_date - start_date).days + 1
    if num_days <= 7:
        day_cols = [start_date + timedelta(days=i) for i in range(num_days)]
    else:
        # For >7 days, show date range
        day_cols = [start_date + timedelta(days=i) for i in range(min(num_days, 14))]

    # Group records by person
    people = defaultdict(dict)  # {(type, id): {date: record}}
    for rec in records:
        key = ('employee', rec.employee_id) if rec.employee_id else ('intern', rec.intern_id)
        people[key][rec.date] = rec

    # Sort people: employees first, then interns, alphabetical
    sorted_people = sorted(people.keys(), key=lambda k: (0 if k[0] == 'employee' else 1, str(k[1])))

    if not sorted_people:
        elements.append(Paragraph(
            '<font size="10" color="#757575">No attendance records found for this period.</font>',
            _s('empty', alignment=TA_CENTER)
        ))
        elements.append(_build_footer(uw))
        doc.build(elements)
        buf.seek(0)
        return buf

    # Table header
    hdr_s = _s('hdr', fontName='Helvetica-Bold', fontSize=7, textColor=WHITE)
    body_s = _s('body', fontSize=7, textColor=GRAY_800)
    bold_s = _s('bold', fontSize=7, fontName='Helvetica-Bold', textColor=CHARCOAL)
    mono_s = _s('mono', fontSize=6.5, textColor=GRAY_800, fontName='Courier')
    center_s = _s('center', fontSize=7, textColor=GRAY_800, alignment=TA_CENTER)
    status_pres = _s('sp', fontSize=6.5, textColor=GREEN, fontName='Helvetica-Bold', alignment=TA_CENTER)
    status_abs  = _s('sa', fontSize=6.5, textColor=RED, fontName='Helvetica-Bold', alignment=TA_CENTER)
    status_late = _s('sl', fontSize=6.5, textColor=AMBER, fontName='Helvetica-Bold', alignment=TA_CENTER)

    # Column widths: Name | Type | then one column per day
    name_w = 130
    type_w = 55
    remaining = uw - name_w - type_w
    day_w = remaining / max(len(day_cols), 1)

    header_row = [
        Paragraph('Name', hdr_s),
        Paragraph('Type', hdr_s),
    ]
    for d in day_cols:
        label = f'{d.strftime("%a")}\n{d.strftime("%d %b")}'
        header_row.append(Paragraph(label, hdr_s))

    header_row.append(Paragraph('Total\nHours', hdr_s))
    col_widths = [name_w, type_w] + [day_w] * len(day_cols) + [55]

    rows = [header_row]

    for key in sorted_people:
        kind, pid = key
        recs_by_date = people[key]

        # Get person name from first record
        first_rec = next(iter(recs_by_date.values()))
        name = first_rec.person_name
        ptype = 'Employee' if kind == 'employee' else 'Intern'

        row = [
            Paragraph(name, bold_s),
            Paragraph(ptype, body_s),
        ]

        total_hours = 0
        for d in day_cols:
            rec = recs_by_date.get(d)
            if rec:
                status = rec.status or 'absent'
                time_str = _fmt_time(rec.check_in)
                if rec.check_out:
                    time_str += f'\n{_fmt_time(rec.check_out)}'
                hours = rec.work_hours or 0
                total_hours += hours

                if status == 'present':
                    cell_style = status_pres
                elif status == 'late':
                    cell_style = status_late
                else:
                    cell_style = status_abs

                row.append(Paragraph(
                    f'{status.upper()}\n{time_str}\n{_fmt_hours(hours)}',
                    cell_style
                ))
            else:
                row.append(Paragraph('—', center_s))

        row.append(Paragraph(_fmt_hours(total_hours), bold_s))
        rows.append(row)

    # Summary row
    summary_row = [
        Paragraph(f'<b>Total: {len(sorted_people)} people</b>', bold_s),
        Paragraph('', body_s),
    ]
    for d in day_cols:
        day_recs = [people[k].get(d) for k in sorted_people if d in people[k]]
        present_count = sum(1 for r in day_recs if r and r.status == 'present')
        summary_row.append(Paragraph(f'{present_count}/{len(sorted_people)}', center_s))
    summary_row.append(Paragraph('', body_s))
    rows.append(summary_row)

    tbl = Table(rows, colWidths=col_widths, repeatRows=1)
    style_cmds = [
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('ROWBACKGROUNDS', (0, 1), (-1, -2), [WHITE, GRAY_100]),
        ('LINEBELOW', (0, 0), (-1, -2), 0.3, GRAY_200),
        ('BOX', (0, 0), (-1, -1), 0.5, GRAY_200),
        # Summary row
        ('BACKGROUND', (0, -1), (-1, -1), PRIMARY_LIGHT),
        ('LINEABOVE', (0, -1), (-1, -1), 0.8, GRAY_400),
    ]
    tbl.setStyle(TableStyle(style_cmds))
    elements.append(tbl)
    elements.append(Spacer(1, 14))

    # Legend
    legend_s = _s('legend', fontSize=7, textColor=GRAY_600)
    elements.append(Paragraph(
        '<font color="#0D7C3D"><b>PRESENT</b></font> &nbsp;&nbsp; '
        '<font color="#E65100"><b>LATE</b></font> &nbsp;&nbsp; '
        '<font color="#D32F2F"><b>ABSENT</b></font> &nbsp;&nbsp; '
        '<font color="#757575">— = No record</font>',
        legend_s
    ))
    elements.append(Spacer(1, 10))
    elements.append(_build_footer(uw))

    doc.build(elements)
    buf.seek(0)
    return buf


# ══════════════════════════════════════════════════════════════════════════════
#  MONTHLY REPORT
# ══════════════════════════════════════════════════════════════════════════════

def generate_monthly_report_pdf(records, start_date, end_date):
    """Generate a monthly attendance summary PDF.

    Shows per-employee summary (days present/absent/late, total hours)
    plus a compact daily breakdown.
    """
    buf = BytesIO()
    W, H = A4
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        topMargin=0.3 * inch, bottomMargin=0.3 * inch,
        leftMargin=0.45 * inch, rightMargin=0.45 * inch
    )
    uw = W - 0.9 * inch
    elements = []

    # Header
    subtitle = f'{start_date.strftime("%d %b %Y")} — {end_date.strftime("%d %b %Y")}'
    elements.append(_build_header('MONTHLY ATTENDANCE REPORT', subtitle, uw))
    elements.append(Spacer(1, 12))

    # Group records by person
    people = defaultdict(dict)
    for rec in records:
        key = ('employee', rec.employee_id) if rec.employee_id else ('intern', rec.intern_id)
        people[key][rec.date] = rec

    sorted_people = sorted(people.keys(), key=lambda k: (0 if k[0] == 'employee' else 1, str(k[1])))

    if not sorted_people:
        elements.append(Paragraph(
            '<font size="10" color="#757575">No attendance records found for this period.</font>',
            _s('empty', alignment=TA_CENTER)
        ))
        elements.append(_build_footer(uw))
        doc.build(elements)
        buf.seek(0)
        return buf

    num_days = (end_date - start_date).days + 1

    # ── SUMMARY TABLE ────────────────────────────────────────────────────────
    hdr_s = _s('hdr', fontName='Helvetica-Bold', fontSize=7.5, textColor=WHITE)
    body_s = _s('body', fontSize=7.5, textColor=GRAY_800)
    bold_s = _s('bold', fontSize=7.5, fontName='Helvetica-Bold', textColor=CHARCOAL)
    num_s  = _s('num', fontSize=7.5, textColor=CHARCOAL, fontName='Courier', alignment=TA_CENTER)
    center_s = _s('center', fontSize=7.5, textColor=GRAY_800, alignment=TA_CENTER)

    header_row = [
        Paragraph('#', hdr_s),
        Paragraph('Name', hdr_s),
        Paragraph('Type', hdr_s),
        Paragraph('Working\nDays', hdr_s),
        Paragraph('Present', hdr_s),
        Paragraph('Late', hdr_s),
        Paragraph('Absent', hdr_s),
        Paragraph('Total\nHours', hdr_s),
        Paragraph('Avg\nHours', hdr_s),
    ]
    col_widths = [22, 130, 55, 48, 48, 42, 48, 50, 48]
    # Adjust if needed
    total_cw = sum(col_widths)
    if total_cw < uw:
        scale = uw / total_cw
        col_widths = [w * scale for w in col_widths]

    rows = [header_row]
    grand_total_hours = 0
    grand_present = 0
    grand_late = 0
    grand_absent = 0

    for idx, key in enumerate(sorted_people, 1):
        kind, pid = key
        recs = people[key]
        first_rec = next(iter(recs.values()))
        name = first_rec.person_name
        ptype = 'Employee' if kind == 'employee' else 'Intern'

        present = sum(1 for r in recs.values() if r.status == 'present')
        late = sum(1 for r in recs.values() if r.status == 'late')
        absent = num_days - present - late
        total_h = sum(r.work_hours or 0 for r in recs.values())
        avg_h = total_h / present if present else 0

        grand_total_hours += total_h
        grand_present += present
        grand_late += late
        grand_absent += absent

        rows.append([
            Paragraph(str(idx), center_s),
            Paragraph(name, bold_s),
            Paragraph(ptype, body_s),
            Paragraph(str(num_days), num_s),
            Paragraph(str(present), num_s),
            Paragraph(str(late), num_s),
            Paragraph(str(absent), num_s),
            Paragraph(f'{total_h:.1f}', num_s),
            Paragraph(f'{avg_h:.1f}', num_s),
        ])

    # Grand total row
    n = len(sorted_people)
    avg_total = grand_total_hours / n if n else 0
    rows.append([
        Paragraph('', body_s),
        Paragraph(f'<b>Overall ({n} people)</b>', bold_s),
        Paragraph('', body_s),
        Paragraph(f'<b>{num_days * n}</b>', num_s),
        Paragraph(f'<b>{grand_present}</b>', num_s),
        Paragraph(f'<b>{grand_late}</b>', num_s),
        Paragraph(f'<b>{grand_absent}</b>', num_s),
        Paragraph(f'<b>{grand_total_hours:.1f}</b>', num_s),
        Paragraph(f'<b>{avg_total:.1f}</b>', num_s),
    ])

    tbl = Table(rows, colWidths=col_widths, repeatRows=1)
    style_cmds = [
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('ROWBACKGROUNDS', (0, 1), (-1, -2), [WHITE, GRAY_100]),
        ('LINEBELOW', (0, 0), (-1, -2), 0.3, GRAY_200),
        ('BOX', (0, 0), (-1, -1), 0.5, GRAY_200),
        ('BACKGROUND', (0, -1), (-1, -1), PRIMARY_LIGHT),
        ('LINEABOVE', (0, -1), (-1, -1), 0.8, GRAY_400),
    ]
    tbl.setStyle(TableStyle(style_cmds))
    elements.append(tbl)
    elements.append(Spacer(1, 18))

    # ── DAILY BREAKDOWN (compact) ───────────────────────────────────────────
    elements.append(Paragraph(
        '<font size="9" color="#1B5E9E"><b>DAILY BREAKDOWN</b></font>',
        _s('db_title', leading=12)
    ))
    elements.append(Spacer(1, 6))

    # Show daily breakdown in chunks of up to 7 days per page section
    day_labels = [start_date + timedelta(days=i) for i in range(num_days)]
    chunk_size = 7
    for chunk_start in range(0, len(day_labels), chunk_size):
        chunk = day_labels[chunk_start:chunk_start + chunk_size]

        day_hdr = [Paragraph('Name', hdr_s)]
        for d in chunk:
            day_hdr.append(Paragraph(f'{d.strftime("%a")}\n{d.strftime("%d")}', hdr_s))

        name_col_w = 110
        day_col_w = (uw - name_col_w) / max(len(chunk), 1)
        day_col_widths = [name_col_w] + [day_col_w] * len(chunk)

        day_rows = [day_hdr]
        for key in sorted_people:
            recs = people[key]
            first_rec = next(iter(recs.values()))
            name = first_rec.person_name

            row = [Paragraph(name, body_s)]
            for d in chunk:
                rec = recs.get(d)
                if rec:
                    status = (rec.status or 'absent').upper()
                    row.append(Paragraph(status, center_s))
                else:
                    row.append(Paragraph('—', center_s))
            day_rows.append(row)

        day_tbl = Table(day_rows, colWidths=day_col_widths, repeatRows=1)
        day_style = [
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
            ('LEFTPADDING', (0, 0), (-1, -1), 3),
            ('RIGHTPADDING', (0, 0), (-1, -1), 3),
            ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
            ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, GRAY_100]),
            ('LINEBELOW', (0, 0), (-1, -1), 0.3, GRAY_200),
            ('BOX', (0, 0), (-1, -1), 0.5, GRAY_200),
        ]
        day_tbl.setStyle(TableStyle(day_style))
        elements.append(day_tbl)
        elements.append(Spacer(1, 10))

    elements.append(Spacer(1, 8))

    # Legend
    legend_s = _s('legend', fontSize=7, textColor=GRAY_600)
    elements.append(Paragraph(
        '<font color="#0D7C3D"><b>PRESENT</b></font> &nbsp;&nbsp; '
        '<font color="#E65100"><b>LATE</b></font> &nbsp;&nbsp; '
        '<font color="#D32F2F"><b>ABSENT</b></font> &nbsp;&nbsp; '
        '<font color="#757575">— = No record</font>',
        legend_s
    ))
    elements.append(Spacer(1, 10))
    elements.append(_build_footer(uw))

    doc.build(elements)
    buf.seek(0)
    return buf
