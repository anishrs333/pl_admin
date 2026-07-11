"""Premium corporate payslip PDF — PL Soft Tech Solutions.

Design: Clean white document with deep teal (#0F766E) accent, gold summary
stripe, single unified pay table, structured header with top color band,
and professional authorised signatory section.
"""
from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch, mm
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable,
)
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December']

# ── Colour Palette — Teal + Gold Corporate ──────────────────────────────────
TEAL        = colors.HexColor('#0F766E')
TEAL_DARK   = colors.HexColor('#134E4A')
TEAL_LIGHT  = colors.HexColor('#CCFBF1')
TEAL_50     = colors.HexColor('#F0FDFA')
GOLD        = colors.HexColor('#B45309')
GOLD_BG     = colors.HexColor('#FFFBEB')
GOLD_BORDER = colors.HexColor('#F59E0B')
CHARCOAL    = colors.HexColor('#1C1917')
STONE_700   = colors.HexColor('#44403C')
STONE_500   = colors.HexColor('#78716C')
STONE_300   = colors.HexColor('#D6D3D1')
STONE_200   = colors.HexColor('#E7E5E4')
STONE_100   = colors.HexColor('#F5F5F4')
WHITE       = colors.white
RED_SOFT    = colors.HexColor('#B91C1C')
RED_BG      = colors.HexColor('#FEF2F2')

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
    defaults = dict(fontName='Helvetica', fontSize=9, textColor=STONE_700, leading=12)
    defaults.update(kw)
    return ParagraphStyle(name, **defaults)


def _money(v):
    """Format value as Indian Rupee."""
    return f'{v:,.2f}'


def generate_payslip_pdf(salary):
    """Generate a premium, corporate-grade payslip PDF with teal-gold theme."""
    buf = BytesIO()
    W, H = A4
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        topMargin=0.35 * inch, bottomMargin=0.35 * inch,
        leftMargin=0.6 * inch, rightMargin=0.6 * inch
    )
    uw = W - 1.2 * inch  # usable width ~6.5 inches
    elements = []

    # =========================================================================
    # TOP COLOR BAND — thin teal strip across the top
    # =========================================================================
    top_band = Table([['']],  colWidths=[uw], rowHeights=[5])
    top_band.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), TEAL),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))
    elements.append(top_band)
    elements.append(Spacer(1, 12))

    # =========================================================================
    # 1.  COMPANY HEADER — Logo + Name + Payslip Label
    # =========================================================================
    logo = Table([['PL']], colWidths=[0.5 * inch], rowHeights=[0.5 * inch])
    logo.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), TEAL),
        ('TEXTCOLOR', (0, 0), (-1, -1), WHITE),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 16),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))

    company = Paragraph(
        '<font size="13" color="#1C1917"><b>PL Soft Tech Solutions Pvt Ltd</b></font><br/>'
        '<font size="7.5" color="#78716C">Kollam, Kerala, India &nbsp;&bull;&nbsp; '
        'CIN: U72200KL2024PTC000000 &nbsp;&bull;&nbsp; hr@plsofttech.com</font>',
        _s('co', leading=15)
    )

    slip_label = Paragraph(
        '<font size="7" color="#78716C">SALARY SLIP</font><br/>'
        f'<font size="12" color="#0F766E"><b>{MONTHS[salary.month]} {salary.year}</b></font>',
        _s('sl', alignment=TA_RIGHT, leading=14)
    )

    hdr = Table([[logo, company, slip_label]],
                colWidths=[0.7 * inch, 3.6 * inch, 2.2 * inch])
    hdr.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (1, 0), (1, 0), 12),
    ]))
    elements.append(hdr)
    elements.append(Spacer(1, 8))
    elements.append(HRFlowable(width='100%', thickness=0.8, color=STONE_300))
    elements.append(Spacer(1, 12))

    # =========================================================================
    # 2.  EMPLOYEE DETAILS — 2-column card with teal left accent
    # =========================================================================
    person = salary.employee or salary.intern
    is_intern = salary.employee is None
    designation = ('Intern — ' + (person.domain or '')) if is_intern else (
        person.designation.name if person.designation else '—')
    department = '—' if is_intern else (
        person.department.name if person.department else '—')
    joined = person.start_date if is_intern else person.joining_date

    lbl_s = _s('lbl', fontName='Helvetica', fontSize=7.5, textColor=STONE_500,
               spaceAfter=1)
    val_s = _s('val', fontName='Helvetica-Bold', fontSize=9.5, textColor=CHARCOAL)

    def _field(label, value):
        return [
            Paragraph(label.upper(), lbl_s),
            Paragraph(str(value) if value else '—', val_s),
        ]

    # Row 1
    r1 = _field('Employee Name', salary.person_name) + _field('Employee ID', salary.person_code)
    r2 = _field('Designation', designation) + _field('Department', department)
    r3 = _field('Date of Joining',
                joined.strftime('%d %b %Y') if joined else '—') + \
         _field('Pay Period', f'01 {MONTHS[salary.month][:3]} – '
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
        ('BACKGROUND', (0, 0), (-1, -1), TEAL_50),
        ('BOX', (0, 0), (-1, -1), 0.5, STONE_200),
        ('LINEBELOW', (0, 0), (-1, -2), 0.3, STONE_200),
        ('LINEAFTER', (1, 0), (1, -1), 0.3, STONE_200),
    ]))

    # Teal left accent bar (4px wide)
    accent = Table([['']],  colWidths=[4], rowHeights=[emp_tbl.wrap(0, 0)[1]])
    accent.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), TEAL),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))

    emp_wrapper = Table([[accent, emp_tbl]], colWidths=[4, uw - 4])
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
    # 3.  UNIFIED PAY TABLE — Earnings on left, Deductions on right, single table
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

    # Header row
    hdr_s = _s('th', fontName='Helvetica-Bold', fontSize=8, textColor=WHITE)
    body_s = _s('bd', fontSize=8.5, textColor=STONE_700)
    amt_s = _s('am', fontSize=8.5, textColor=CHARCOAL, alignment=TA_RIGHT)
    bold_s = _s('bl', fontName='Helvetica-Bold', fontSize=9, textColor=CHARCOAL)
    bold_r = _s('br', fontName='Helvetica-Bold', fontSize=9, textColor=CHARCOAL,
                alignment=TA_RIGHT)

    pay_rows = []
    # Header
    pay_rows.append([
        Paragraph('EARNINGS', hdr_s),
        Paragraph('AMOUNT (₹)', hdr_s),
        Paragraph('DEDUCTIONS', hdr_s),
        Paragraph('AMOUNT (₹)', hdr_s),
    ])
    # Body
    for i in range(max_rows):
        el, ev = earn_items[i]
        dl, dv = ded_items[i]
        pay_rows.append([
            Paragraph(el, body_s),
            Paragraph(_money(ev) if el else '', amt_s),
            Paragraph(dl, body_s),
            Paragraph(_money(dv) if dl else '', amt_s),
        ])
    # Totals
    tot_earn_s = _s('te', fontName='Helvetica-Bold', fontSize=9, textColor=TEAL_DARK)
    tot_earn_a = _s('ta', fontName='Helvetica-Bold', fontSize=9.5, textColor=TEAL_DARK,
                    alignment=TA_RIGHT)
    tot_ded_s = _s('td2', fontName='Helvetica-Bold', fontSize=9, textColor=RED_SOFT)
    tot_ded_a = _s('td3', fontName='Helvetica-Bold', fontSize=9.5, textColor=RED_SOFT,
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

    n_body = len(pay_rows) - 2  # exclude header & total
    style_cmds = [
        # Global
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        # Header row
        ('BACKGROUND', (0, 0), (1, 0), TEAL),
        ('BACKGROUND', (2, 0), (3, 0), STONE_700),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        # Alternating rows
        ('ROWBACKGROUNDS', (0, 1), (-1, -2), [WHITE, STONE_100]),
        # Grid lines
        ('LINEBELOW', (0, 0), (-1, -2), 0.3, STONE_200),
        ('LINEAFTER', (1, 0), (1, -1), 0.6, STONE_300),  # center divider
        ('BOX', (0, 0), (-1, -1), 0.6, STONE_200),
        # Total row
        ('BACKGROUND', (0, -1), (1, -1), TEAL_LIGHT),
        ('BACKGROUND', (2, -1), (3, -1), RED_BG),
        ('LINEABOVE', (0, -1), (-1, -1), 1, STONE_300),
    ]
    pay_tbl.setStyle(TableStyle(style_cmds))
    elements.append(pay_tbl)
    elements.append(Spacer(1, 14))

    # =========================================================================
    # 4.  NET PAY — Gold/Amber highlight banner
    # =========================================================================
    net_l = Paragraph(
        '<font size="10" color="#92400E"><b>NET PAY (Take Home)</b></font>',
        _s('nl', leading=13)
    )
    net_a = Paragraph(
        f'<font size="18" color="#92400E"><b>&#8377; {_money(net)}</b></font>',
        _s('na', alignment=TA_RIGHT, leading=20)
    )
    net_banner = Table([[net_l, net_a]], colWidths=[uw * 0.5, uw * 0.5])
    net_banner.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), GOLD_BG),
        ('BOX', (0, 0), (-1, -1), 1.2, GOLD_BORDER),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('LEFTPADDING', (0, 0), (0, 0), 14),
        ('RIGHTPADDING', (-1, 0), (-1, 0), 14),
    ]))
    elements.append(net_banner)
    elements.append(Spacer(1, 6))

    # Amount in words
    elements.append(Paragraph(
        f'<i><font color="#78716C" size="8">In Words: </font>'
        f'<font color="#44403C" size="8.5"><b>{amount_in_words(net)}</b></font></i>',
        _s('wrds', spaceAfter=4)
    ))
    elements.append(Spacer(1, 20))

    # =========================================================================
    # 5.  PAYMENT SUMMARY BAR — compact info strip
    # =========================================================================
    summary_data = [
        [
            Paragraph('<font size="7" color="#78716C">PAYMENT MODE</font><br/>'
                      '<font size="8.5" color="#1C1917"><b>Bank Transfer</b></font>',
                      _s('pm', leading=12)),
            Paragraph('<font size="7" color="#78716C">PAYMENT STATUS</font><br/>'
                      f'<font size="8.5" color="#0F766E"><b>'
                      f'{("PAID" if salary.status == "paid" else "GENERATED")}'
                      f'</b></font>',
                      _s('ps', leading=12)),
            Paragraph('<font size="7" color="#78716C">PAYMENT REF</font><br/>'
                      f'<font size="8.5" color="#1C1917"><b>'
                      f'{salary.payment_ref or "—"}</b></font>',
                      _s('pr', leading=12)),
            Paragraph('<font size="7" color="#78716C">GENERATED ON</font><br/>'
                      f'<font size="8.5" color="#1C1917"><b>'
                      f'{salary.created_at.strftime("%d %b %Y") if hasattr(salary, "created_at") and salary.created_at else "—"}'
                      f'</b></font>',
                      _s('go', leading=12)),
        ]
    ]
    summary_tbl = Table(summary_data, colWidths=[uw / 4] * 4)
    summary_tbl.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BACKGROUND', (0, 0), (-1, -1), STONE_100),
        ('BOX', (0, 0), (-1, -1), 0.5, STONE_200),
        ('LINEAFTER', (0, 0), (-2, -1), 0.3, STONE_200),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
    ]))
    elements.append(summary_tbl)
    elements.append(Spacer(1, 24))

    # =========================================================================
    # 6.  FOOTER — Signatory + Disclaimer + Bottom band
    # =========================================================================
    elements.append(HRFlowable(width='100%', thickness=0.4, color=STONE_200))
    elements.append(Spacer(1, 16))

    sig = Table([
        [
            Paragraph(
                '<font size="7.5" color="#78716C">'
                'This is a system-generated document.<br/>'
                'No signature is required.</font>',
                _s('disc', leading=10)
            ),
            '',
            Paragraph(
                '<font size="9" color="#1C1917"><b>For PL Soft Tech Solutions</b></font><br/>'
                '<font size="7.5" color="#78716C">Authorised Signatory</font><br/>'
                '<font size="7" color="#0F766E">HR Department</font>',
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
        '<font size="6.5" color="#A8A29E">'
        'CONFIDENTIAL — This payslip is intended solely for the named employee. '
        'Unauthorized reproduction or distribution is strictly prohibited.</font>',
        _s('conf', alignment=TA_CENTER, leading=9)
    ))
    elements.append(Spacer(1, 8))

    # Bottom teal band
    bot_band = Table(
        [[Paragraph(
            '<font size="7" color="#CCFBF1">'
            'PL Soft Tech Solutions Pvt Ltd &nbsp;&bull;&nbsp; Kollam, Kerala &nbsp;&bull;&nbsp; '
            '+91 474-XXXXXXX &nbsp;&bull;&nbsp; www.plsofttech.com</font>',
            _s('bb', alignment=TA_CENTER)
        )]],
        colWidths=[uw]
    )
    bot_band.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), TEAL_DARK),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ]))
    elements.append(bot_band)

    doc.build(elements)
    buf.seek(0)
    return buf
