"""Professional payslip PDF generation for PL Soft Tech Solutions."""
from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December']

BRAND_COLOR = colors.HexColor('#312E6B')
MUTED = colors.HexColor('#6B6880')
FAINT = colors.HexColor('#A8A5B5')
LINE = colors.HexColor('#E4E2ED')
ROW_ALT = colors.HexColor('#F7F6FB')
NET_GREEN = colors.HexColor('#1F7A45')
WHITE = colors.white
BLACK = colors.HexColor('#1A1830')

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
    """Convert a rupee amount to words using the Indian numbering system (lakh/crore)."""
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


def generate_payslip_pdf(salary):
    """Generate a clean, professional payslip PDF for an employee or intern."""
    buf = BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=0.55*inch, bottomMargin=0.55*inch,
                             leftMargin=0.65*inch, rightMargin=0.65*inch)
    elements = []

    # ---------- Header: logo mark + company block ----------
    logo_mark = Table([['PL']], colWidths=[0.55*inch], rowHeights=[0.55*inch])
    logo_mark.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), BRAND_COLOR),
        ('TEXTCOLOR', (0, 0), (-1, -1), WHITE),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 17),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    company_block = Paragraph(
        '<b>PL SOFT TECH SOLUTIONS PVT LTD</b><br/>'
        '<font size="8" color="#6B6880">Kollam, Kerala, India &nbsp;·&nbsp; hr@plsofttech.com &nbsp;·&nbsp; plsofttech.com</font>',
        ParagraphStyle('company', fontSize=15.5, textColor=BRAND_COLOR, fontName='Helvetica-Bold', leading=17))
    payslip_tag = Paragraph(
        f'<font size="8" color="#A8A5B5">PAYSLIP</font><br/>'
        f'<font size="11" color="#1A1830"><b>{MONTHS[salary.month]} {salary.year}</b></font>',
        ParagraphStyle('tag', alignment=TA_RIGHT, leading=13))
    header_table = Table([[logo_mark, company_block, payslip_tag]], colWidths=[0.75*inch, 4.15*inch, 1.7*inch])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 8))
    elements.append(HRFlowable(width='100%', thickness=1.3, color=BRAND_COLOR))
    elements.append(Spacer(1, 14))

    # ---------- Employee info block ----------
    person = salary.employee or salary.intern
    is_intern = salary.employee is None
    designation = ('Intern — ' + (person.domain or '')) if is_intern else (person.designation.name if person.designation else '—')
    department = '—' if is_intern else (person.department.name if person.department else '—')
    joined = person.start_date if is_intern else person.joining_date
    pay_days = 30

    info_rows = [
        ['Employee Name', salary.person_name, 'Employee ID', salary.person_code],
        ['Designation', designation, 'Department', department],
        ['Date of Joining', joined.strftime('%d %b %Y') if joined else '—', 'Pay Period', f'{MONTHS[salary.month]} {salary.year}'],
        ['Employment Type', 'Intern' if is_intern else 'Full-time Employee', 'Days Paid', f'{pay_days} / {pay_days}'],
    ]
    info_table = Table(info_rows, colWidths=[1.4*inch, 2.1*inch, 1.4*inch, 1.7*inch])
    info_table.setStyle(TableStyle([
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica'),
        ('FONTNAME', (2, 0), (2, -1), 'Helvetica'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica-Bold'),
        ('FONTNAME', (3, 0), (3, -1), 'Helvetica-Bold'),
        ('TEXTCOLOR', (0, 0), (0, -1), MUTED),
        ('TEXTCOLOR', (2, 0), (2, -1), MUTED),
        ('TEXTCOLOR', (1, 0), (1, -1), BLACK),
        ('TEXTCOLOR', (3, 0), (3, -1), BLACK),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('LINEBELOW', (0, 0), (-1, -2), 0.4, LINE),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('BACKGROUND', (0, 0), (-1, -1), ROW_ALT),
        ('BOX', (0, 0), (-1, -1), 0.6, LINE),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 16))

    # ---------- Earnings & Deductions side by side ----------
    basic = float(salary.basic_salary or 0)
    hra = float(salary.hra or 0)
    allowances = float(salary.allowances or 0)
    incentives = float(salary.incentives or 0)
    gross = basic + hra + allowances + incentives

    pf = float(salary.pf_deduction or 0)
    tax = float(salary.tax_deduction or 0)
    other = float(salary.other_deductions or 0)
    total_ded = pf + tax + other
    net = float(salary.net_salary) if salary.net_salary is not None else (gross - total_ded)

    def money(v):
        return f'Rs. {v:,.2f}'

    earnings_rows = [['EARNINGS', 'AMOUNT']]
    for label, val in [('Basic Salary', basic), ('House Rent Allowance', hra),
                        ('Special Allowances', allowances), ('Incentive / Bonus', incentives)]:
        if val or label == 'Basic Salary':
            earnings_rows.append([label, money(val)])
    earnings_rows.append(['Gross Earnings', money(gross)])

    deduction_rows = [['DEDUCTIONS', 'AMOUNT']]
    for label, val in [('Provident Fund (PF)', pf), ('Income Tax (TDS)', tax), ('Other Deductions', other)]:
        deduction_rows.append([label, money(val)])
    while len(deduction_rows) < len(earnings_rows) - 1:
        deduction_rows.append(['', ''])
    deduction_rows.append(['Total Deductions', money(total_ded)])

    def side_table(rows, header_bg, total_color):
        t = Table(rows, colWidths=[1.75*inch, 1.15*inch])
        style = [
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BACKGROUND', (0, 0), (-1, 0), header_bg),
            ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 0.4, LINE),
            ('ROWBACKGROUNDS', (0, 1), (-1, -2), [WHITE, ROW_ALT]),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('LEFTPADDING', (0, 0), (-1, -1), 7),
            ('RIGHTPADDING', (0, 0), (-1, -1), 7),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#EEEDF9')),
            ('TEXTCOLOR', (0, -1), (-1, -1), total_color),
            ('LINEABOVE', (0, -1), (-1, -1), 0.8, total_color),
        ]
        t.setStyle(TableStyle(style))
        return t

    earn_table = side_table(earnings_rows, BRAND_COLOR, BRAND_COLOR)
    ded_table = side_table(deduction_rows, colors.HexColor('#8A5A2E'), colors.HexColor('#B4531F'))

    combo = Table([[earn_table, Spacer(1, 1), ded_table]], colWidths=[2.95*inch, 0.2*inch, 2.95*inch])
    elements.append(combo)
    elements.append(Spacer(1, 14))

    # ---------- Net pay banner ----------
    net_table = Table([['NET PAY', money(net)]], colWidths=[4.85*inch, 1.25*inch])
    net_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (0, 0), 12),
        ('FONTSIZE', (1, 0), (1, 0), 14),
        ('BACKGROUND', (0, 0), (-1, -1), NET_GREEN),
        ('TEXTCOLOR', (0, 0), (-1, -1), WHITE),
        ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
        ('ALIGN', (0, 0), (0, 0), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 11),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 11),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
    ]))
    elements.append(net_table)
    elements.append(Spacer(1, 6))
    elements.append(Paragraph(f'<i>Amount in words: {amount_in_words(net)}</i>',
                               ParagraphStyle('words', fontSize=8.5, textColor=MUTED)))
    elements.append(Spacer(1, 22))

    # ---------- Footer ----------
    elements.append(HRFlowable(width='100%', thickness=0.6, color=LINE))
    elements.append(Spacer(1, 10))
    elements.append(Paragraph(
        'This is a system-generated payslip issued by the HR department and does not require a physical signature.',
        ParagraphStyle('note', fontSize=8, textColor=FAINT, alignment=TA_CENTER)))
    elements.append(Spacer(1, 4))
    elements.append(Paragraph(
        '<b>PL Soft Tech Solutions Pvt Ltd</b> &nbsp;·&nbsp; hr@plsofttech.com',
        ParagraphStyle('footer', fontSize=8.5, textColor=MUTED, alignment=TA_CENTER)))

    doc.build(elements)
    buf.seek(0)
    return buf
