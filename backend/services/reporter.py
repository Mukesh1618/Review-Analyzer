import io
import re
from datetime import datetime
from typing import Dict, Any
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def clean_pdf_text(text: str) -> str:
    """Removes non-ASCII characters, emojis, and reformats text for ReportLab Paragraph HTML tags."""
    if not text:
        return "N/A"
    # Remove heavy emojis or unicode that Helvetica doesn't support
    cleaned = re.sub(r'[^\x00-\x7F]+', ' ', text)
    # Replace markdown bold **text** with ReportLab Paragraph bold <b>text</b>
    cleaned = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', cleaned)
    # Replace markdown bullet points - text with bullet lists or simple formatting
    cleaned = re.sub(r'^-\s*', r'&bull; ', cleaned, flags=re.MULTILINE)
    # Replace newlines with HTML breaks
    cleaned = cleaned.replace('\n', '<br/>')
    # Collapse multiple break tags to prevent empty spaces
    cleaned = re.sub(r'(<br/>\s*){3,}', '<br/><br/>', cleaned)
    return cleaned

def generate_report_pdf(analysis: Dict[str, Any]) -> bytes:
    """
    Takes an analysis.json state dictionary and returns the generated PDF bytes.
    Builds a premium executive styled report matching the user's design mockups.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )
    
    styles = getSampleStyleSheet()
    
    # Custom premium slate and corporate colors
    primary_color = colors.HexColor('#005cbb') # Elegant Deep Blue
    secondary_color = colors.HexColor('#32353c') # Sleek Charcoal
    text_color = colors.HexColor('#222222')
    light_bg = colors.HexColor('#f8f9fa')
    border_color = colors.HexColor('#e2e8f0')
    
    # Define custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=primary_color,
        spaceAfter=12
    )
    
    h1_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=primary_color,
        spaceBefore=14,
        spaceAfter=10,
        keepWithNext=True
    )
    
    body_style = ParagraphStyle(
        'ReportBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=text_color,
        spaceAfter=8
    )
    
    oblique_style = ParagraphStyle(
        'ExecutiveSummaryText',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=10,
        leading=15,
        textColor=secondary_color
    )
    
    meta_label_style = ParagraphStyle(
        'MetaLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=12,
        textColor=secondary_color
    )
    
    meta_val_style = ParagraphStyle(
        'MetaVal',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=12,
        textColor=text_color
    )
    
    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor('#1e293b')
    )
    
    table_header_center_style = ParagraphStyle(
        'TableHeaderCenter',
        parent=table_header_style,
        alignment=1
    )
    
    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=text_color
    )
    
    table_cell_center_style = ParagraphStyle(
        'TableCellCenter',
        parent=table_cell_style,
        alignment=1
    )
    
    story = []
    
    # --- REPORT HEADER & META INFORMATION GRID TABLE ---
    product_name = analysis.get("product_name", "AI Ingested Product")
    
    sentiment_dist = analysis.get("sentiment_distribution", {})
    pos = sentiment_dist.get("positive", 0)
    neu = sentiment_dist.get("neutral", 0)
    neg = sentiment_dist.get("negative", 0)
    total = pos + neu + neg
    
    # Extract Trust Score
    auth_text = analysis.get("fake_review_analysis", "")
    trust_match = re.search(r"Trust Score:\s*(\d+)%", auth_text)
    trust_score = f"{trust_match.group(1)}%" if trust_match else "85%"
    
    # Extract Overall Sentiment Score
    score_match = re.search(r"OVERALL SCORE:\s*([\d.]+)", analysis.get("sentiment_analysis", ""))
    if score_match:
        overall_score = f"{score_match.group(1)} / 10"
    else:
        calculated = ((pos + 0.5 * neu) / (total or 1)) * 10
        overall_score = f"{calculated:.1f} / 10"
        
    meta_table_data = [
        [
            Paragraph("<b>Target Product:</b>", meta_label_style),
            Paragraph(clean_pdf_text(product_name), meta_val_style),
            Paragraph("<b>Integrity Trust Score:</b>", meta_label_style),
            Paragraph(trust_score, meta_val_style)
        ],
        [
            Paragraph("<b>Total Reviews Audited:</b>", meta_label_style),
            Paragraph(str(total), meta_val_style),
            Paragraph("<b>Overall Sentiment Score:</b>", meta_label_style),
            Paragraph(overall_score, meta_val_style)
        ]
    ]
    
    meta_table = Table(meta_table_data, colWidths=[120, 146, 120, 146])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), light_bg),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('PADDING', (0,0), (-1,-1), 8),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    
    # Solid blue header banner table
    banner_p1 = Paragraph("REVIEWMIND AI EXECUTIVE REPORT", ParagraphStyle(
        'BannerSub', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=8.5, leading=11, textColor=colors.white, spaceAfter=6
    ))
    banner_p2 = Paragraph(clean_pdf_text(product_name), ParagraphStyle(
        'BannerTitle', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=24, leading=28, textColor=colors.white, spaceAfter=8
    ))
    current_date = datetime.now().strftime("%B %d, %Y")
    banner_p3 = Paragraph(f"Generated on {current_date} • Powered by LangChain Cognitive Intelligence", ParagraphStyle(
        'BannerMeta', parent=styles['Normal'], fontName='Helvetica', fontSize=8.5, leading=11, textColor=colors.HexColor('#93c5fd')
    ))
    
    banner_content = [banner_p1, banner_p2, banner_p3]
    banner_table = Table([[banner_content]], colWidths=[532])
    banner_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#005cbb')),
        ('PADDING', (0,0), (-1,-1), 16),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 18),
        ('TOPPADDING', (0,0), (-1,-1), 18),
    ]))
    
    story.append(banner_table)
    story.append(Spacer(1, 12))
    story.append(meta_table)
    story.append(Spacer(1, 14))
    
    # --- I. EXECUTIVE SUMMARY & PRODUCT SYNTHESIS ---
    story.append(Paragraph("I. Executive Summary & Product Synthesis", h1_style))
    summary_text = clean_pdf_text(analysis.get("detailed_summary") or analysis.get("short_summary") or "No summary available.")
    
    summary_p = Paragraph(summary_text, oblique_style)
    summary_box = Table([[summary_p]], colWidths=[532])
    summary_box.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), light_bg),
        ('BOX', (0,0), (-1,-1), 0.8, colors.HexColor('#cbd5e1')),
        ('PADDING', (0,0), (-1,-1), 12),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(summary_box)
    story.append(Spacer(1, 14))
    
    # --- KEYWORDS BOX (ABOVE STRENGTHS & WEAKNESSES) ---
    kw_list = analysis.get("keyword_analysis", "")
    if kw_list:
        keywords = [k.strip() for k in kw_list.split(",") if k.strip()]
        if keywords:
            kw_title = Paragraph("<b>KEYWORD TRENDS & FEATURE ATTRIBUTION</b>", ParagraphStyle(
                'KwTitle', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=8.5, leading=11, textColor=colors.HexColor('#475569'), spaceAfter=8
            ))
            
            badge_cells = []
            for kw in keywords[:5]: # Take top 5 keywords
                badge_p = Paragraph(f"<b>#{kw}</b>", ParagraphStyle(
                    'KwBadgeText', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=8, leading=10, textColor=colors.HexColor('#1d4ed8'), alignment=1
                ))
                badge_table = Table([[badge_p]], colWidths=[96])
                badge_table.setStyle(TableStyle([
                    ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#eff6ff')),
                    ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#bfdbfe')),
                    ('PADDING', (0,0), (-1,-1), 5),
                    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                ]))
                badge_cells.append(badge_table)
                
            badges_table = Table([badge_cells], colWidths=[102, 102, 102, 102, 102])
            badges_table.setStyle(TableStyle([
                ('ALIGN', (0,0), (-1,-1), 'CENTER'),
                ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                ('PADDING', (0,0), (-1,-1), 0),
            ]))
            
            kw_box_content = [kw_title, badges_table]
            kw_box = Table([[kw_box_content]], colWidths=[532])
            kw_box.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
                ('BOX', (0,0), (-1,-1), 0.8, colors.HexColor('#cbd5e1')),
                ('PADDING', (0,0), (-1,-1), 10),
                ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ]))
            
            story.append(KeepTogether([
                kw_box,
                Spacer(1, 14)
            ]))
        
    # --- II. KEY ATTRIBUTE BREAKDOWN (STRENGTHS & WEAKNESSES) ---
    pros_text = clean_pdf_text(analysis.get("pros", "No strengths identified."))
    cons_text = clean_pdf_text(analysis.get("cons", "No weaknesses identified."))
    
    pros_cons_data = [
        [Paragraph("<b>Strengths</b>", ParagraphStyle('GreenHeader', parent=h1_style, textColor=colors.HexColor('#059669'), spaceBefore=0, spaceAfter=6)), 
          Paragraph("<b>Weaknesses</b>", ParagraphStyle('RedHeader', parent=h1_style, textColor=colors.HexColor('#dc2626'), spaceBefore=0, spaceAfter=6))],
         [Paragraph(pros_text, body_style), Paragraph(cons_text, body_style)]
    ]
    
    pros_cons_table = Table(pros_cons_data, colWidths=[260, 260])
    pros_cons_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,-1), colors.HexColor('#ecfdf5')), # Soft green bg for Pros
        ('BACKGROUND', (1,0), (1,-1), colors.HexColor('#fef2f2')), # Soft red bg for Cons
        ('BOX', (0,0), (0,-1), 0.8, colors.HexColor('#a7f3d0')),
        ('BOX', (1,0), (1,-1), 0.8, colors.HexColor('#fecaca')),
        ('PADDING', (0,0), (-1,-1), 12),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(KeepTogether([
        Paragraph("II. Key Attribute Breakdown", h1_style),
        pros_cons_table
    ]))
    story.append(Spacer(1, 14))
    
    # --- III. ASPECT ATTRIBUTE SCORECARD ---
    aspect_table_data = [
        [
            Paragraph("<b>Aspect Attribute</b>", table_header_style),
            Paragraph("<b>Score</b>", table_header_center_style),
            Paragraph("<b>Performance Benchmark</b>", table_header_center_style)
        ]
    ]
    
    aspect_raw = analysis.get("aspect_analysis", "")
    has_aspects = False
    if aspect_raw:
        for line in aspect_raw.split('\n'):
            match = re.match(r'\*?\*?(.*?)\*?\*?:\s*([\d.]+)/10', line)
            if match:
                has_aspects = True
                aspect_name = match.group(1).strip()
                score_str = match.group(2).strip()
                try:
                    score_val = float(score_str)
                except ValueError:
                    score_val = 5.0
                    
                if score_val >= 8.0:
                    benchmark_text = "<b>EXCELLENT</b>"
                    benchmark_color = '#059669' # Green
                elif score_val >= 6.0:
                     benchmark_text = "<b>GOOD</b>"
                     benchmark_color = '#d97706' # Orange
                else:
                     benchmark_text = "<b>CRITICAL</b>"
                     benchmark_color = '#dc2626' # Red
                     
                aspect_table_data.append([
                    Paragraph(aspect_name, table_cell_style),
                    Paragraph(f"{score_str} / 10", table_cell_center_style),
                    Paragraph(f"<font color='{benchmark_color}'>{benchmark_text}</font>", table_cell_center_style)
                ])
                
    if has_aspects:
        aspect_scorecard_table = Table(aspect_table_data, colWidths=[180, 120, 232])
        t_style = [
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#e2e8f0')), # Shaded slate header
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
            ('PADDING', (0,0), (-1,-1), 6),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]
        for r_idx in range(1, len(aspect_table_data)):
            if r_idx % 2 == 0:
                t_style.append(('BACKGROUND', (0, r_idx), (-1, r_idx), colors.HexColor('#f8f9fa')))
                
        aspect_scorecard_table.setStyle(TableStyle(t_style))
        story.append(KeepTogether([
            Paragraph("III. Aspect Attribute Scorecard", h1_style),
            aspect_scorecard_table
        ]))
        story.append(Spacer(1, 14))
        
    # --- IV. REVIEW AUTHENTICITY AUDIT ---
    security_text = clean_pdf_text(analysis.get("fake_review_analysis", "No authenticity scan available."))
    security_p = Paragraph(security_text, table_cell_style)
    
    security_box = Table([[security_p]], colWidths=[532])
    security_box.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#fff1f2')), # Soft Rose Background
        ('BOX', (0,0), (-1,-1), 0.8, colors.HexColor('#fecdd3')), # Soft Pink Border
        ('PADDING', (0,0), (-1,-1), 12),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(KeepTogether([
        Paragraph("IV. Review Authenticity Audit", h1_style),
        security_box
    ]))
    
    # Build Document
    def add_footer(canvas, doc):
        canvas.saveState()
        canvas.setFont('Helvetica', 8)
        canvas.setFillColor(colors.HexColor('#71717a'))
        canvas.setStrokeColor(colors.HexColor('#e4e4e7'))
        canvas.setLineWidth(0.5)
        canvas.line(40, 45, 572, 45)
        
        canvas.drawString(40, 30, "ReviewMind AI Product Analysis Report — Executive Intelligence Division")
        canvas.drawRightString(572, 30, f"Page {doc.page}")
        canvas.restoreState()
        
    doc.build(story, onFirstPage=add_footer, onLaterPages=add_footer)
    buffer.seek(0)
    return buffer.getvalue()