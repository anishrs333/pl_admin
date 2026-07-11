"""Zoho-style payslip PDF — PL Soft Tech Solutions.

Design: Clean Zoho Payroll inspired layout with blue header band,
company logo, structured employee info grid, earnings/deductions
table with alternating rows, bold net-pay banner, and professional
footer with contact details.
"""
import os
from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch, mm
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable,
    Image,
)
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December']

# ── Logo path ────────────────────────────────────────────────────────────────
LOGO_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'company_logo.png')

# ── Company Info ─────────────────────────────────────────────────────────────
COMPANY_NAME = 'PL Soft Tech Solutions Pvt Ltd'
COMPANY_PHONE = '+91 73583 86560'
COMPANY_EMAIL = 'hr@plsofttech.com'
COMPANY_ADDRESS = 'J M, Complex, Junction, Kappukadu, Tamil Nadu 629162'

# ── Colour Palette — Zoho Blue Corporate ─────────────────────────────────────
PRIMARY       = colors.HexColor('#1B5E9E')    # Main header blue
PRIMARY_DARK  = colors.HexColor('#14456F')    # Darker blue accents
PRIMARY_LIGHT = colors.HexColor('#E8F0FE')    # Light blue bg
PRIMARY_50    = colors.HexColor('#F0F6FF')    # Very light blue
ACCENT        = colors.HexColor('#0D7C3D')    # Green for net pay
ACCENT_BG     = colors.HexColor('#E6F5EC')    # Light green bg
ACCENT_DARK   = colors.HexColor('#0A6331')    # Dark green
CHARCOAL      = colors.HexColor('#212121')    # Primary text
GRAY_800      = colors.HexColor('#424242')    # Secondary text
GRAY_600      = colors.HexColor('#757575')    # Muted text
GRAY_400      = colors.HexColor('#BDBDBD')    # Borders
GRAY_200      = colors.HexColor('#EEEEEE')    # Light borders
GRAY_100      = colors.HexColor('#F5F5F5')    # Alternating row bg
GRAY_50       = colors.HexColor('#FAFAFA')    # Card bg
WHITE         = colors.white
RED           = colors.HexColor('#D32F2F')    # Deductions
RED_LIGHT     = colors.HexColor('#FFEBEE')    # Deductions bg
ORANGE_BG     = colors.HexColor('#FFF8E1')    # Amount in words bg
ORANGE_BORDER = colors.HexColor('#FFB300')

# ── Number to Words (Indian System) ─────────────────────────────────────────
_ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
         'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
         'Seventeen', 'Eighteen', 'Nineteen']
_TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']


def _two_digit_words(n):
    if n < 20:
        return _ONES[n]
    return (_TENS[n // 10] + (' ' + _ONES[n % 10] if n % 10 else '')).strip()


def _three_digit_words(n):
    if n >= 100:
        return _ONES[n // 100] + ' Hundred' + (' ' + _two_digit_words(n % 100) if n % 100 else '')
    return _two_digit_words(n)


def amount_in_words(amount):
    """Convert a rupee amount to words (Indian lakh/crore system)."""
    n = int(round(float(amount)))
    if n == 0:
        return 'Zero Rupees Only'
    parts = []
    crore, n = divmod(n, 10000000)
    lakh, n = divmod(n, 100000)
    thousand, n = divmod(n, 1000)
    hundred = n
    if crore:
        parts.append(_three_digit_words(crore) + ' Crore')
    if lakh:
        parts.append(_three_digit_words(lakh) + ' Lakh')
    if thousand:
        parts.append(_three_digit_words(thousand) + ' Thousand')
    if hundred:
        parts.append(_three_digit_words(hundred))
    return ' '.join(parts).strip() + ' Rupees Only'


def _s(name, **kw):
    """Helper to create paragraph styles."""
    defaults = dict(fontName='Helvetica', fontSize=9, textColor=GRAY_800, leading=12)
    defaults.update(kw)
    return ParagraphStyle(name, **defaults)


def _money(v):
    """Format value as Indian Rupee."""
    return f'{v:,.2f}'


def generate_payslip_pdf(salary):
    """Generate a Zoho-style payslip PDF with company logo and clean layout."""
    buf = BytesIO()
    W, H = A4
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        topMargin=0.3 * inch, bottomMargin=0.3 * inch,
        leftMargin=0.55 * inch, rightMargin=0.55 * inch
    )
    uw = W - 1.1 * inch  # usable width
    elements = []

    # =========================================================================
    # 1. HEADER — Blue band with Logo + Company Name + Payslip Title
    # =========================================================================

    # Company logo image
    logo_element = None
    if os.path.exists(LOGO_PATH):
        logo_element = Image(LOGO_PATH, width=0.55 * inch, height=0.55 * inch)
    else:
        # Fallback text logo
        logo_tbl = Table([['PL']], colWidths=[0.55 * inch], rowHeights=[0.55 * inch])
        logo_tbl.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), PRIMARY),
            ('TEXTCOLOR', (0, 0), (-1, -1), WHITE),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 18),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        logo_element = logo_tbl

    company_info = Paragraph(
        f'<font size="14" color="#FFFFFF"><b>{COMPANY_NAME}</b></font><br/>'
        f'<font size="7.5" color="#B3D4F5">{COMPANY_ADDRESS}</font><br/>'
        f'<font size="7.5" color="#B3D4F5">'
        f'Phone: {COMPANY_PHONE} &nbsp;|&nbsp; Email: {COMPANY_EMAIL}</font>',
        _s('co_hdr', leading=14)
    )

    slip_title = Paragraph(
        '<font size="16" color="#FFFFFF"><b>PAYSLIP</b></font><br/>'
        f'<font size="9" color="#B3D4F5">{MONTHS[salary.month]} {salary.year}</font>',
        _s('sl_title', alignment=TA_RIGHT, leading=16)
    )

    header_row = Table(
        [[logo_element, company_info, slip_title]],
        colWidths=[0.75 * inch, 3.5 * inch, uw - 4.25 * inch]
    )
    header_row.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), PRIMARY),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (0, 0), 12),
        ('LEFTPADDING', (1, 0), (1, 0), 10),
        ('RIGHTPADDING', (-1, 0), (-1, 0), 14),
        ('TOPPADDING', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
    ]))
    elements.append(header_row)
    elements.append(Spacer(1, 14))

    # =========================================================================
    # 2. EMPLOYEE DETAILS — Zoho-style info grid (2 columns, labeled fields)
    # =========================================================================
    person = salary.employee or salary.intern
    is_intern = salary.employee is None
    designation = ('Intern — ' + (person.domain or '')) if is_intern else (
        person.designation.name if person.designation else '—')
    department = '—' if is_intern else (
        person.department.name if person.department else '—')
    joined = person.start_date if is_intern else person.joining_date

    lbl_s = _s('lbl', fontName='Helvetica', fontSize=7, textColor=GRAY_600,
               spaceAfter=1)
    val_s = _s('val', fontName='Helvetica-Bold', fontSize=9, textColor=CHARCOAL,
               leading=11)

    def _field(label, value):
        return [
            Paragraph(label.upper(), lbl_s),
            Paragraph(str(value) if value else '—', val_s),
        ]

    # Employee info rows
    r1 = _field('Employee Name', salary.person_name) + \
         _field('Employee ID', salary.person_code)
    r2 = _field('Designation', designation) + \
         _field('Department', department)
    r3 = _field('Date of Joining',
                joined.strftime('%d %b %Y') if joined else '—') + \
         _field('Pay Period',
                f'01 {MONTHS[salary.month][:3]} – '
                f'{30 if salary.month != 2 else 28} {MONTHS[salary.month][:3]} {salary.year}')
    r4 = _field('Employment Type',
                'Intern' if is_intern else 'Full-Time') + \
         _field('Working Days', '30 / 30')

    cw = uw / 4
    emp_tbl = Table([r1, r2, r3, r4], colWidths=[cw] * 4)
    emp_tbl.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 7),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('BACKGROUND', (0, 0), (-1, -1), PRIMARY_50),
        ('BOX', (0, 0), (-1, -1), 0.6, GRAY_200),
        ('LINEBELOW', (0, 0), (-1, -2), 0.3, GRAY_200),
        ('LINEAFTER', (1, 0), (1, -1), 0.3, GRAY_200),
    ]))

    # Blue left accent bar (3px wide)
    accent_bar = Table([['']],  colWidths=[3], rowHeights=[emp_tbl.wrap(0, 0)[1]])
    accent_bar.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), PRIMARY),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))

    emp_wrapper = Table([[accent_bar, emp_tbl]], colWidths=[3, uw - 3])
    emp_wrapper.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))
    elements.append(emp_wrapper)
    elements.append(Spacer(1, 16))

    # =========================================================================
    # 3. EARNINGS & DEDUCTIONS TABLE — Zoho-style split table
    # =========================================================================
    basic = float(salary.basic_salary or 0)
    hra = float(salary.hra or 0)
    allow = float(salary.allowances or 0)
    incentive = float(salary.incentives or 0)
    gross = basic + hra + allow + incentive

    pf = float(salary.pf_deduction or 0)
    tax = float(salary.tax_deduction or 0)
    other_ded = float(salary.other_deductions or 0)
    total_ded = pf + tax + other_ded
    net = float(salary.net_salary) if salary.net_salary is not None else (gross - total_ded)

    earn_items = [('Basic Salary', basic), ('House Rent Allowance', hra),
                  ('Special Allowances', allow), ('Incentive / Bonus', incentive)]
    earn_items = [(l, v) for l, v in earn_items if v or l == 'Basic Salary']

    ded_items = [('Provident Fund', pf), ('Income Tax (TDS)', tax),
                 ('Other Deductions', other_ded)]

    max_rows = max(len(earn_items), len(ded_items))
    while len(earn_items) < max_rows:
        earn_items.append(('', 0))
    while len(ded_items) < max_rows:
        ded_items.append(('', 0))

    # Styles for table cells
    hdr_s = _s('th', fontName='Helvetica-Bold', fontSize=8, textColor=WHITE)
    body_s = _s('bd', fontSize=8.5, textColor=GRAY_800)
    amt_s = _s('am', fontSize=8.5, textColor=CHARCOAL, fontName='Helvetica',
               alignment=TA_RIGHT)
    bold_amt = _s('bam', fontSize=9, textColor=CHARCOAL,
                  fontName='Helvetica-Bold', alignment=TA_RIGHT)

    pay_rows = []

    # Section header: EARNINGS | AMOUNT | DEDUCTIONS | AMOUNT
    pay_rows.append([
        Paragraph('EARNINGS', hdr_s),
        Paragraph('AMOUNT (₹)', hdr_s),
        Paragraph('DEDUCTIONS', hdr_s),
        Paragraph('AMOUNT (₹)', hdr_s),
    ])

    # Body rows
    for i in range(max_rows):
        el, ev = earn_items[i]
        dl, dv = ded_items[i]
        pay_rows.append([
            Paragraph(el, body_s),
            Paragraph(_money(ev) if el else '', amt_s),
            Paragraph(dl, body_s),
            Paragraph(_money(dv) if dl else '', amt_s),
        ])

    # Totals row
    tot_earn_s = _s('te', fontName='Helvetica-Bold', fontSize=9, textColor=PRIMARY_DARK)
    tot_earn_a = _s('ta', fontName='Helvetica-Bold', fontSize=9.5, textColor=PRIMARY_DARK,
                    alignment=TA_RIGHT)
    tot_ded_s = _s('td2', fontName='Helvetica-Bold', fontSize=9, textColor=RED)
    tot_ded_a = _s('td3', fontName='Helvetica-Bold', fontSize=9.5, textColor=RED,
                   alignment=TA_RIGHT)

    pay_rows.append([
        Paragraph('GROSS EARNINGS', tot_earn_s),
        Paragraph(_money(gross), tot_earn_a),
        Paragraph('TOTAL DEDUCTIONS', tot_ded_s),
        Paragraph(_money(total_ded), tot_ded_a),
    ])

    half = uw / 2
    qtr = half / 2
    pay_tbl = Table(pay_rows, colWidths=[qtr + 20, qtr - 20, qtr + 20, qtr - 20])

    style_cmds = [
        # Global
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 7),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        # Header row — blue for earnings, dark gray for deductions
        ('BACKGROUND', (0, 0), (1, 0), PRIMARY),
        ('BACKGROUND', (2, 0), (3, 0), GRAY_800),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        # Alternating rows
        ('ROWBACKGROUNDS', (0, 1), (-1, -2), [WHITE, GRAY_100]),
        # Grid lines
        ('LINEBELOW', (0, 0), (-1, -2), 0.3, GRAY_200),
        ('LINEAFTER', (1, 0), (1, -1), 0.8, GRAY_400),  # center divider
        ('BOX', (0, 0), (-1, -1), 0.6, GRAY_200),
        # Total row
        ('BACKGROUND', (0, -1), (1, -1), PRIMARY_LIGHT),
        ('BACKGROUND', (2, -1), (3, -1), RED_LIGHT),
        ('LINEABOVE', (0, -1), (-1, -1), 1, GRAY_400),
    ]
    pay_tbl.setStyle(TableStyle(style_cmds))
    elements.append(pay_tbl)
    elements.append(Spacer(1, 14))

    # =========================================================================
    # 4. NET PAY — Green highlight banner (Zoho-style)
    # =========================================================================
    net_label = Paragraph(
        '<font size="10" color="#0A6331"><b>NET PAY (Take Home)</b></font>',
        _s('net_l', leading=13)
    )
    net_amount = Paragraph(
        f'<font size="20" color="#0A6331"><b>&#8377; {_money(net)}</b></font>',
        _s('net_a', alignment=TA_RIGHT, leading=22)
    )
    net_banner = Table([[net_label, net_amount]], colWidths=[uw * 0.45, uw * 0.55])
    net_banner.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), ACCENT_BG),
        ('BOX', (0, 0), (-1, -1), 1.5, ACCENT),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 14),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 14),
        ('LEFTPADDING', (0, 0), (0, 0), 16),
        ('RIGHTPADDING', (-1, 0), (-1, 0), 16),
    ]))
    elements.append(net_banner)
    elements.append(Spacer(1, 6))

    # Amount in words
    words_banner = Table(
        [[Paragraph(
            f'<font size="7.5" color="#757575">In Words: </font>'
            f'<font size="8" color="#424242"><b>{amount_in_words(net)}</b></font>',
            _s('wrds', leading=10)
        )]],
        colWidths=[uw]
    )
    words_banner.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), ORANGE_BG),
        ('BOX', (0, 0), (-1, -1), 0.5, ORANGE_BORDER),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
    ]))
    elements.append(words_banner)
    elements.append(Spacer(1, 18))

    # =========================================================================
    # 5. PAYMENT DETAILS — Compact info strip
    # =========================================================================
    info_lbl_s = _s('info_lbl', fontSize=7, textColor=GRAY_600, leading=10)
    info_val_s = _s('info_val', fontSize=8.5, fontName='Helvetica-Bold',
                    textColor=CHARCOAL, leading=11)

    payment_status_color = '#0D7C3D' if salary.status == 'paid' else '#E65100'
    payment_status_text = 'PAID' if salary.status == 'paid' else 'GENERATED'

    summary_data = [
        [
            Paragraph(
                '<font size="7" color="#757575">PAYMENT MODE</font><br/>'
                '<font size="8.5" color="#212121"><b>Bank Transfer</b></font>',
                _s('pm', leading=12)),
            Paragraph(
                '<font size="7" color="#757575">PAYMENT STATUS</font><br/>'
                f'<font size="8.5" color="{payment_status_color}"><b>'
                f'{payment_status_text}</b></font>',
                _s('ps', leading=12)),
            Paragraph(
                '<font size="7" color="#757575">PAYMENT REF</font><br/>'
                f'<font size="8.5" color="#212121"><b>'
                f'{salary.payment_ref or "—"}</b></font>',
                _s('pr', leading=12)),
            Paragraph(
                '<font size="7" color="#757575">GENERATED ON</font><br/>'
                f'<font size="8.5" color="#212121"><b>'
                f'{salary.created_at.strftime("%d %b %Y") if hasattr(salary, "created_at") and salary.created_at else "—"}'
                f'</b></font>',
                _s('go', leading=12)),
        ]
    ]
    summary_tbl = Table(summary_data, colWidths=[uw / 4] * 4)
    summary_tbl.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BACKGROUND', (0, 0), (-1, -1), GRAY_100),
        ('BOX', (0, 0), (-1, -1), 0.5, GRAY_200),
        ('LINEAFTER', (0, 0), (-2, -1), 0.3, GRAY_200),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
    ]))
    elements.append(summary_tbl)
    elements.append(Spacer(1, 24))

    # =========================================================================
    # 6. FOOTER — Signatory + Disclaimer + Bottom band
    # =========================================================================
    elements.append(HRFlowable(width='100%', thickness=0.4, color=GRAY_200))
    elements.append(Spacer(1, 16))

    sig = Table([
        [
            Paragraph(
                '<font size="7.5" color="#757575">'
                'This is a system-generated document.<br/>'
                'No signature is required.</font>',
                _s('disc', leading=10)
            ),
            '',
            Paragraph(
                f'<font size="9" color="#212121"><b>For {COMPANY_NAME}</b></font><br/>'
                '<font size="7.5" color="#757575">Authorised Signatory</font><br/>'
                f'<font size="7" color="#1B5E9E">HR Department</font>',
                _s('sig', alignment=TA_RIGHT, leading=12)
            ),
        ]
    ], colWidths=[uw * 0.4, uw * 0.2, uw * 0.4])
    sig.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    elements.append(sig)
    elements.append(Spacer(1, 16))

    # Confidential notice
    elements.append(Paragraph(
        '<font size="6.5" color="#BDBDBD">'
        'CONFIDENTIAL — This payslip is intended solely for the named employee. '
        'Unauthorized reproduction or distribution is strictly prohibited.</font>',
        _s('conf', alignment=TA_CENTER, leading=9)
    ))
    elements.append(Spacer(1, 8))

    # Bottom blue band with contact info
    bot_band = Table(
        [[Paragraph(
            f'<font size="7" color="#B3D4F5">'
            f'{COMPANY_NAME} &nbsp;|&nbsp; '
            f'{COMPANY_ADDRESS} &nbsp;|&nbsp; '
            f'{COMPANY_PHONE} &nbsp;|&nbsp; '
            f'{COMPANY_EMAIL}</font>',
            _s('bb', alignment=TA_CENTER)
        )]],
        colWidths=[uw]
    )
    bot_band.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), PRIMARY_DARK),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ]))
    elements.append(bot_band)

    doc.build(elements)
    buf.seek(0)
    return buf
