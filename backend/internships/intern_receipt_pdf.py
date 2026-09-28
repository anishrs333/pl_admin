"""Premium Intern Payment Confirmation Receipt Generator — PL Soft Tech Solutions.

Generates a clean, professional PDF payment receipt with company logo,
intern details grid, bold rupee amount box, amount in words, system verification notes,
and authorized signatory block.
"""
import os
from io import BytesIO
from decimal import Decimal
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
)
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

LOGO_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'payroll', 'company_logo.png')

COMPANY_NAME = 'PL Soft Tech Solutions Pvt Ltd'
COMPANY_PHONE = '+91 73583 86560'
COMPANY_EMAIL = 'hr@plsofttech.com'
COMPANY_ADDRESS = 'J M Complex, Junction, Kappukadu, Tamil Nadu 629162'

# ── Professional Color Palette ────────────────────────────────────────────────
NAVY_HEADER  = colors.HexColor('#0F172A')
BLUE_ACCENT  = colors.HexColor('#2563EB')
BLUE_LIGHT   = colors.HexColor('#EFF6FF')
GREEN_ACCENT = colors.HexColor('#16A34A')
GREEN_LIGHT  = colors.HexColor('#F0FDF4')
GREEN_BORDER = colors.HexColor('#BBF7D0')
CHARCOAL     = colors.HexColor('#1E293B')
SLATE_TEXT   = colors.HexColor('#475569')
MUTED_TEXT   = colors.HexColor('#64748B')
BORDER_GRAY  = colors.HexColor('#E2E8F0')
BG_LIGHT     = colors.HexColor('#F8FAFC')
WHITE        = colors.white


def _s(name, **kw):
    defaults = dict(fontName='Helvetica', fontSize=9, textColor=SLATE_TEXT, leading=12)
    defaults.update(kw)
    return ParagraphStyle(name, **defaults)


def _money(val):
    return f'{Decimal(str(val)):,.2f}'


def generate_intern_receipt_pdf(intern):
    buf = BytesIO()
    W, H = A4
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        topMargin=0, bottomMargin=0,
        leftMargin=0, rightMargin=0
    )
    page_width = W
    elements = []

    # ════════════════════════════════════════════════════════════════════════
    # 1. HEADER BAND — Logo + Company Name + Receipt Title
    # ════════════════════════════════════════════════════════════════════════
    if os.path.exists(LOGO_PATH):
        logo_img = Image(LOGO_PATH, width=44, height=44)
    else:
        logo_text = Paragraph('<font size="18" color="#FFFFFF"><b>PL</b></font>', _s('lg_t', fontName='Helvetica-Bold', alignment=TA_CENTER, leading=20))
        logo_tbl = Table([[logo_text]], colWidths=[44], rowHeights=[44])
        logo_tbl.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), BLUE_ACCENT),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        logo_img = logo_tbl

    company_heading = Paragraph(
        f'<font size="14" color="#FFFFFF"><b>{COMPANY_NAME}</b></font><br/>'
        f'<font size="8" color="#94A3B8">{COMPANY_ADDRESS}</font><br/>'
        f'<font size="8" color="#94A3B8">Phone: {COMPANY_PHONE} &nbsp;|&nbsp; Email: {COMPANY_EMAIL}</font>',
        _s('co_info', leading=13)
    )

    receipt_title = Paragraph(
        '<font size="14" color="#FFFFFF"><b>PAYMENT RECEIPT</b></font><br/>'
        '<font size="8.5" color="#60A5FA">INTERNSHIP PROGRAM</font>',
        _s('rcp_title', alignment=TA_RIGHT, leading=14)
    )

    header_table = Table(
        [[logo_img, company_heading, receipt_title]],
        colWidths=[54, page_width - 54 - 170, 170]
    )
    header_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), NAVY_HEADER),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (0, 0), 24),
        ('LEFTPADDING', (1, 0), (1, 0), 12),
        ('RIGHTPADDING', (-1, 0), (-1, 0), 24),
        ('TOPPADDING', (0, 0), (-1, -1), 16),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 16),
    ]))
    elements.append(header_table)

    # ════════════════════════════════════════════════════════════════════════
    # 2. INNER CONTENT — Padded Body
    # ════════════════════════════════════════════════════════════════════════
    pad = 32
    inner_width = page_width - (pad * 2)

    elements.append(Spacer(1, 24))

    # Receipt Metadata Bar
    payment_date_str = intern.payment_date.strftime('%d %b %Y') if intern.payment_date else '—'
    receipt_no = f'RCP-{intern.intern_id}'

    meta_lbl = _s('mlbl', fontName='Helvetica', fontSize=8, textColor=MUTED_TEXT)
    meta_val = _s('mval', fontName='Helvetica-Bold', fontSize=9.5, textColor=CHARCOAL, leading=13)

    meta_content = [
        [
            Paragraph('RECEIPT NUMBER', meta_lbl),
            Paragraph('PAYMENT DATE', meta_lbl),
            Paragraph('PAYMENT STATUS', meta_lbl),
        ],
        [
            Paragraph(receipt_no, meta_val),
            Paragraph(payment_date_str, meta_val),
            Paragraph('<font color="#16A34A"><b>PAID / VERIFIED</b></font>', meta_val),
        ]
    ]

    meta_tbl = Table(meta_content, colWidths=[inner_width / 3, inner_width / 3, inner_width / 3])
    meta_tbl.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
    ]))

    meta_wrapper = Table([[meta_tbl]], colWidths=[inner_width])
    meta_wrapper.setStyle(TableStyle([
        ('LEFTPADDING', (0, 0), (-1, -1), pad),
        ('RIGHTPADDING', (0, 0), (-1, -1), pad),
    ]))
    elements.append(meta_wrapper)
    elements.append(Spacer(1, 16))

    # Divider Line
    divider = Table([['']], colWidths=[inner_width])
    divider.setStyle(TableStyle([
        ('LINEBELOW', (0, 0), (-1, -1), 0.8, BORDER_GRAY),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))
    div_wrapper = Table([[divider]], colWidths=[page_width])
    div_wrapper.setStyle(TableStyle([
        ('LEFTPADDING', (0, 0), (-1, -1), pad),
        ('RIGHTPADDING', (0, 0), (-1, -1), pad),
    ]))
    elements.append(div_wrapper)
    elements.append(Spacer(1, 20))

    # ── Intern Details Grid ───────────────────────────────────────────────
    lbl_style = _s('dlbl', fontName='Helvetica', fontSize=8, textColor=MUTED_TEXT, spaceAfter=2)
    val_style = _s('dval', fontName='Helvetica-Bold', fontSize=10, textColor=CHARCOAL, leading=14)

    start_str = intern.start_date.strftime('%d %b %Y') if intern.start_date else '—'
    end_str = intern.end_date.strftime('%d %b %Y') if intern.end_date else '—'
    mentor_name = intern.mentor.full_name if intern.mentor else '—'

    grid_data = [
        [
            Paragraph('RECEIVED FROM', lbl_style),
            Paragraph('INTERN ID', lbl_style),
        ],
        [
            Paragraph(intern.name, val_style),
            Paragraph(intern.intern_id, val_style),
        ],
        [Paragraph('', lbl_style), Paragraph('', lbl_style)], # spacing row
        [
            Paragraph('COLLEGE / UNIVERSITY', lbl_style),
            Paragraph('DOMAIN / PROGRAM', lbl_style),
        ],
        [
            Paragraph(intern.college_name, val_style),
            Paragraph(intern.domain, val_style),
        ],
        [Paragraph('', lbl_style), Paragraph('', lbl_style)],
        [
            Paragraph('INTERNSHIP DURATION', lbl_style),
            Paragraph('ASSIGNED MENTOR', lbl_style),
        ],
        [
            Paragraph(f'{start_str}  —  {end_str}', val_style),
            Paragraph(mentor_name, val_style),
        ],
    ]

    half_width = inner_width / 2
    grid_table = Table(grid_data, colWidths=[half_width, half_width])
    grid_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('RIGHTPADDING', (0, 0), (-1, -1), 12),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
    ]))

    grid_box = Table([[grid_table]], colWidths=[inner_width])
    grid_box.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), BG_LIGHT),
        ('BOX', (0, 0), (-1, -1), 1, BORDER_GRAY),
        ('LEFTPADDING', (0, 0), (-1, -1), pad),
        ('RIGHTPADDING', (0, 0), (-1, -1), pad),
        ('TOPPADDING', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
    ]))
    elements.append(grid_box)
    elements.append(Spacer(1, 24))

    # ── Amount Box ────────────────────────────────────────────────────────
    amount = intern.stipend_amount or 0
    amount_formatted = _money(amount)

    amt_title = Paragraph('<font size="8" color="#475569">TOTAL AMOUNT RECEIVED</font>', _s('at', leading=10, alignment=TA_CENTER))
    amt_val = Paragraph(f'<font size="24" color="#16A34A"><b>&#8377; {amount_formatted}</b></font>', _s('av', leading=28, alignment=TA_CENTER))

    amt_content = Table([[amt_title], [amt_val]], colWidths=[inner_width - 32])
    amt_content.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))

    amt_card = Table([[amt_content]], colWidths=[inner_width])
    amt_card.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), GREEN_LIGHT),
        ('BOX', (0, 0), (-1, -1), 1.2, GREEN_BORDER),
        ('LEFTPADDING', (0, 0), (-1, -1), pad),
        ('RIGHTPADDING', (0, 0), (-1, -1), pad),
        ('TOPPADDING', (0, 0), (-1, -1), 14),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 14),
    ]))
    elements.append(amt_card)
    elements.append(Spacer(1, 8))

    # Amount in words
    from payroll.payslip_pdf import amount_in_words
    words = amount_in_words(amount)
    words_p = Paragraph(f'<font size="8" color="#64748B">Amount in Words: <i><b>{words}</b></i></font>', _s('words', alignment=TA_CENTER, leading=11))
    
    words_wrapper = Table([[words_p]], colWidths=[inner_width])
    words_wrapper.setStyle(TableStyle([
        ('LEFTPADDING', (0, 0), (-1, -1), pad),
        ('RIGHTPADDING', (0, 0), (-1, -1), pad),
    ]))
    elements.append(words_wrapper)
    elements.append(Spacer(1, 24))

    # ── Formal Confirmation Text ──────────────────────────────────────────
    confirm_p = Paragraph(
        f'<font size="8.5" color="#334155">'
        f'This official receipt confirms that <b>{intern.name}</b> (ID: <b>{intern.intern_id}</b>) '
        f'has paid the amount of <b>₹{amount_formatted}</b> for enrolling in the '
        f'<b>{intern.domain}</b> Internship Training Program at <b>{COMPANY_NAME}</b>.</font>',
        _s('conf', alignment=TA_CENTER, leading=14)
    )
    confirm_box = Table([[confirm_p]], colWidths=[inner_width])
    confirm_box.setStyle(TableStyle([
        ('LEFTPADDING', (0, 0), (-1, -1), pad),
        ('RIGHTPADDING', (0, 0), (-1, -1), pad),
    ]))
    elements.append(confirm_box)
    elements.append(Spacer(1, 28))

    elements.append(div_wrapper)
    elements.append(Spacer(1, 24))

    # ── Signatory & Verification Block ───────────────────────────────────
    sig_left = Paragraph(
        '<font size="7.5" color="#94A3B8">'
        '<b>System Verified Document</b><br/>'
        'Issued by PL Soft Tech Accounts Department.<br/>'
        'No physical signature required.</font>',
        _s('s_l', leading=11)
    )

    sig_right = Paragraph(
        f'<font size="8.5" color="#0F172A"><b>For {COMPANY_NAME}</b></font><br/><br/>'
        '<font size="8" color="#475569"><b>Authorized Signatory</b></font><br/>'
        '<font size="7.5" color="#2563EB">HR & Operations Department</font>',
        _s('s_r', alignment=TA_RIGHT, leading=12)
    )

    sig_table = Table([[sig_left, '', sig_right]], colWidths=[inner_width * 0.45, inner_width * 0.1, inner_width * 0.45])
    sig_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    sig_wrapper = Table([[sig_table]], colWidths=[inner_width])
    sig_wrapper.setStyle(TableStyle([
        ('LEFTPADDING', (0, 0), (-1, -1), pad),
        ('RIGHTPADDING', (0, 0), (-1, -1), pad),
    ]))
    elements.append(sig_wrapper)
    elements.append(Spacer(1, 24))

    # ── Bottom Address Bar ────────────────────────────────────────────────
    footer_text = Paragraph(
        f'<font size="7" color="#FFFFFF">'
        f'{COMPANY_NAME} &nbsp;&bull;&nbsp; {COMPANY_ADDRESS} &nbsp;&bull;&nbsp; '
        f'Ph: {COMPANY_PHONE} &nbsp;&bull;&nbsp; {COMPANY_EMAIL}</font>',
        _s('ftr', alignment=TA_CENTER, leading=10)
    )
    footer_bar = Table([[footer_text]], colWidths=[page_width])
    footer_bar.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), NAVY_HEADER),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ]))
    elements.append(footer_bar)

    doc.build(elements)
    buf.seek(0)
    return buf
