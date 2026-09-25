"""Premium intern payment receipt — PL Soft Tech Solutions.

Clean, minimal, premium design with subtle colors, clear hierarchy,
and professional spacing. Inspired by modern invoice/receipt templates.
"""
import os
from io import BytesIO
from decimal import Decimal
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable,
)
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

LOGO_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'payroll', 'company_logo.png')

COMPANY_NAME = 'PL Soft Tech Solutions Pvt Ltd'
COMPANY_PHONE = '+91 73583 86560'
COMPANY_EMAIL = 'hr@plsofttech.com'
COMPANY_ADDRESS = 'J M, Complex, Junction, Kappukadu, Tamil Nadu 629162'

# ── Palette ──────────────────────────────────────────────────────────────────
BLUE        = colors.HexColor('#2563EB')
BLUE_DARK   = colors.HexColor('#1D4ED8')
BLUE_LIGHT  = colors.HexColor('#EFF6FF')
BLUE_BORDER = colors.HexColor('#BFDBFE')
GREEN       = colors.HexColor('#16A34A')
GREEN_LIGHT = colors.HexColor('#F0FDF4')
GREEN_BORDER = colors.HexColor('#BBF7D0')
CHARCOAL    = colors.HexColor('#1E293B')
GRAY_700    = colors.HexColor('#334155')
GRAY_500    = colors.HexColor('#64748B')
GRAY_300    = colors.HexColor('#CBD5E1')
GRAY_100    = colors.HexColor('#F1F5F9')
GRAY_50     = colors.HexColor('#F8FAFC')
WHITE       = colors.white


def _s(name, **kw):
    defaults = dict(fontName='Helvetica', fontSize=9, textColor=GRAY_700, leading=12)
    defaults.update(kw)
    return ParagraphStyle(name, **defaults)


def _money(v):
    return f'{Decimal(str(v)).quantize(Decimal("0.01")):,}'


def generate_intern_receipt_pdf(intern):
    buf = BytesIO()
    W, H = A4
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        topMargin=0, bottomMargin=0,
        leftMargin=0, rightMargin=0
    )
    uw = W  # full width — we handle margins internally
    elements = []

    # ════════════════════════════════════════════════════════════════════════
    # HEADER — Clean blue band, full width
    # ════════════════════════════════════════════════════════════════════════
    logo_text = Paragraph(
        '<font size="20" color="#FFFFFF"><b>PL</b></font>',
        _s('logo', fontName='Helvetica-Bold', alignment=TA_CENTER, leading=22)
    )
    logo_box = Table([[logo_text]], colWidths=[44], rowHeights=[44])
    logo_box.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), WHITE),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ROUNDEDCORNERS', [6, 6, 6, 6]),
    ]))

    company = Paragraph(
        f'<font size="15" color="#FFFFFF"><b>{COMPANY_NAME}</b></font>',
        _s('co', leading=20)
    )
    receipt_label = Paragraph(
        '<font size="11" color="rgba(255,255,255,0.7)">PAYMENT RECEIPT</font>',
        _s('rl', alignment=TA_RIGHT, leading=14)
    )

    header = Table(
        [[logo_box, company, receipt_label]],
        colWidths=[54, uw - 54 - 160, 160]
    )
    header.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), BLUE),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (0, 0), 28),
        ('LEFTPADDING', (1, 0), (1, 0), 14),
        ('RIGHTPADDING', (-1, 0), (-1, 0), 28),
        ('TOPPADDING', (0, 0), (-1, -1), 18),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 18),
    ]))
    elements.append(header)

    # ════════════════════════════════════════════════════════════════════════
    # BODY — padded inner content
    # ════════════════════════════════════════════════════════════════════════
    pad = 32  # horizontal padding
    iw = uw - (pad * 2)  # inner width

    elements.append(Spacer(1, 28))

    # ── Receipt meta (ID + Date) — right-aligned ──────────────────────────
    payment_date_str = intern.payment_date.strftime('%d %b %Y') if intern.payment_date else '—'
    receipt_no = f'RCP-{intern.intern_id}'

    meta_lbl = _s('ml', fontName='Helvetica', fontSize=7.5, textColor=GRAY_500)
    meta_val = _s('mv', fontName='Helvetica-Bold', fontSize=9, textColor=CHARCOAL, leading=12)

    meta_data = [
        [
            Paragraph('RECEIPT NO.', meta_lbl),
            Paragraph('DATE', meta_lbl),
        ],
        [
            Paragraph(receipt_no, meta_val),
            Paragraph(payment_date_str, meta_val),
        ],
    ]
    meta_tbl = Table(meta_data, colWidths=[iw / 2, iw / 2])
    meta_tbl.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
    ]))

    meta_wrapper = Table([[meta_tbl]], colWidths=[iw])
    meta_wrapper.setStyle(TableStyle([
        ('LEFTPADDING', (0, 0), (-1, -1), pad),
        ('RIGHTPADDING', (0, 0), (-1, -1), pad),
    ]))
    elements.append(meta_wrapper)
    elements.append(Spacer(1, 20))

    # ── Divider ───────────────────────────────────────────────────────────
    div_line = Table([['']], colWidths=[iw])
    div_line.setStyle(TableStyle([
        ('LINEBELOW', (0, 0), (-1, -1), 0.8, GRAY_300),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))
    div_wrapper = Table([[div_line]], colWidths=[uw])
    div_wrapper.setStyle(TableStyle([
        ('LEFTPADDING', (0, 0), (-1, -1), pad),
        ('RIGHTPADDING', (0, 0), (-1, -1), pad),
    ]))
    elements.append(div_wrapper)
    elements.append(Spacer(1, 20))

    # ── Intern details — clean two-column grid ────────────────────────────
    lbl = _s('dl', fontName='Helvetica', fontSize=7.5, textColor=GRAY_500, spaceAfter=2)
    val = _s('dv', fontName='Helvetica-Bold', fontSize=10, textColor=CHARCOAL, leading=13)

    def _detail(label, value):
        return [Paragraph(label, lbl), Paragraph(str(value) if value else '—', val)]

    start_str = intern.start_date.strftime('%d %b %Y') if intern.start_date else '—'
    end_str = intern.end_date.strftime('%d %b %Y') if intern.end_date else '—'

    details = [
        _detail('Received From', intern.name),
        _detail('Intern ID', intern.intern_id),
        _detail('College', intern.college_name),
        _detail('Domain / Program', intern.domain),
        _detail('Internship Period', f'{start_str}  —  {end_str}'),
    ]

    col_w = iw / 2
    detail_rows = []
    for i in range(0, len(details), 2):
        row = []
        row.extend(details[i])
        if i + 1 < len(details):
            row.extend(details[i + 1])
        else:
            row.extend(['', ''])
        detail_rows.append(row)

    detail_tbl = Table(detail_rows, colWidths=[col_w, col_w, col_w, col_w])
    detail_tbl.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))

    detail_wrapper = Table([[detail_tbl]], colWidths=[iw])
    detail_wrapper.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), GRAY_50),
        ('BOX', (0, 0), (-1, -1), 0.5, GRAY_100),
        ('LEFTPADDING', (0, 0), (-1, -1), pad),
        ('RIGHTPADDING', (0, 0), (-1, -1), pad),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(detail_wrapper)
    elements.append(Spacer(1, 24))

    # ── Amount box — premium highlight ────────────────────────────────────
    amount = intern.stipend_amount or 0
    amount_str = _money(amount)

    amt_title = Paragraph(
        '<font size="8" color="#64748B">AMOUNT PAID</font>',
        _s('at', leading=10)
    )
    amt_value = Paragraph(
        f'<font size="26" color="#16A34A"><b>&#8377; {amount_str}</b></font>',
        _s('av', leading=30)
    )

    amt_box_content = Table(
        [[amt_title], [amt_value]],
        colWidths=[iw - 40]
    )
    amt_box_content.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))

    amt_outer = Table([[amt_box_content]], colWidths=[iw])
    amt_outer.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), GREEN_LIGHT),
        ('BOX', (0, 0), (-1, -1), 1.2, GREEN_BORDER),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('LEFTPADDING', (0, 0), (-1, -1), pad),
        ('RIGHTPADDING', (0, 0), (-1, -1), pad),
        ('TOPPADDING', (0, 0), (-1, -1), 16),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 16),
    ]))
    elements.append(amt_outer)
    elements.append(Spacer(1, 8))

    # ── Amount in words ───────────────────────────────────────────────────
    from payroll.payslip_pdf import amount_in_words
    words = amount_in_words(amount)
    words_p = Paragraph(
        f'<font size="7.5" color="#64748B"><i>{words}</i></font>',
        _s('words', alignment=TA_CENTER, leading=10)
    )
    words_tbl = Table([[words_p]], colWidths=[iw])
    words_tbl.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))
    words_wrapper = Table([[words_tbl]], colWidths=[iw])
    words_wrapper.setStyle(TableStyle([
        ('LEFTPADDING', (0, 0), (-1, -1), pad),
        ('RIGHTPADDING', (0, 0), (-1, -1), pad),
    ]))
    elements.append(words_wrapper)
    elements.append(Spacer(1, 30))

    # ── Confirmation text ─────────────────────────────────────────────────
    confirm = Paragraph(
        f'<font size="8.5" color="#334155">'
        f'This is to confirm that <b>{intern.name}</b> (ID: {intern.intern_id}) '
        f'has successfully paid the internship fee of <b>₹{amount_str}</b> '
        f'towards the <b>{intern.domain}</b> internship program at '
        f'<b>{COMPANY_NAME}</b>.</font>',
        _s('confirm', alignment=TA_CENTER, leading=14)
    )
    confirm_wrapper = Table([[confirm]], colWidths=[iw])
    confirm_wrapper.setStyle(TableStyle([
        ('LEFTPADDING', (0, 0), (-1, -1), pad),
        ('RIGHTPADDING', (0, 0), (-1, -1), pad),
    ]))
    elements.append(confirm_wrapper)
    elements.append(Spacer(1, 36))

    # ── Divider ───────────────────────────────────────────────────────────
    elements.append(div_wrapper)
    elements.append(Spacer(1, 20))

    # ── Footer — Signature + Disclaimer ───────────────────────────────────
    sig_left = Paragraph(
        '<font size="7.5" color="#94A3B8">'
        'This is a system-generated document.<br/>'
        'No physical signature is required.</font>',
        _s('sig_l', leading=10)
    )
    sig_right = Paragraph(
        f'<font size="8.5" color="#1E293B"><b>For {COMPANY_NAME}</b></font><br/>'
        '<font size="7.5" color="#94A3B8">Authorised Signatory</font><br/>'
        '<font size="7" color="#2563EB">HR Department</font>',
        _s('sig_r', alignment=TA_RIGHT, leading=12)
    )

    sig_tbl = Table([[sig_left, '', sig_right]], colWidths=[iw * 0.4, iw * 0.2, iw * 0.4])
    sig_tbl.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    sig_wrapper = Table([[sig_tbl]], colWidths=[iw])
    sig_wrapper.setStyle(TableStyle([
        ('LEFTPADDING', (0, 0), (-1, -1), pad),
        ('RIGHTPADDING', (0, 0), (-1, -1), pad),
    ]))
    elements.append(sig_wrapper)
    elements.append(Spacer(1, 24))

    # ── Bottom bar ────────────────────────────────────────────────────────
    bot_text = Paragraph(
        f'<font size="6.5" color="rgba(255,255,255,0.8)">'
        f'{COMPANY_NAME} &nbsp;&bull;&nbsp; {COMPANY_ADDRESS} &nbsp;&bull;&nbsp; '
        f'{COMPANY_PHONE} &nbsp;&bull;&nbsp; {COMPANY_EMAIL}</font>',
        _s('bt', alignment=TA_CENTER, leading=9)
    )
    bot_bar = Table([[bot_text]], colWidths=[uw])
    bot_bar.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), BLUE_DARK),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ]))
    elements.append(bot_bar)

    doc.build(elements)
    buf.seek(0)
    return buf
