import os
from PIL import Image, ImageDraw, ImageFont

LANG_BANNERS = {
    "Hindi": {"bg": (255, 153, 51), "text": "हिन्दी — Hindi"},
    "English": {"bg": (52, 101, 164), "text": "English"},
    "Tamil": {"bg": (102, 0, 153), "text": "தமிழ் — Tamil"},
    "Telugu": {"bg": (0, 128, 128), "text": "తెలుగు — Telugu"},
    "Bengali": {"bg": (0, 102, 51), "text": "বাংলা — Bengali"},
    "Marathi": {"bg": (153, 51, 0), "text": "मराठी — Marathi"},
    "Gujarati": {"bg": (204, 0, 0), "text": "ગુજરાતી — Gujarati"},
    "Kannada": {"bg": (102, 51, 0), "text": "ಕನ್ನಡ — Kannada"},
    "Malayalam": {"bg": (0, 51, 102), "text": "മലയാളം — Malayalam"},
    "Odia": {"bg": (51, 102, 0), "text": "ଓଡ଼ିଆ — Odia"},
    "Punjabi": {"bg": (102, 0, 102), "text": "ਪੰਜਾਬੀ — Punjabi"},
    "Urdu": {"bg": (0, 102, 102), "text": "اردو — Urdu"},
}

EXAM_LABELS = {
    "Hindi": {"title": "NEET 2025 (UG)", "set_label": "सेट", "name_label": "नाम", "roll_label": "रोल नंबर", "seat_label": "सीट"},
    "English": {"title": "NEET 2025 (UG)", "set_label": "Set", "name_label": "Name", "roll_label": "Roll", "seat_label": "Seat"},
    "Tamil": {"title": "NEET 2025 (UG)", "set_label": "தொகுப்பு", "name_label": "பெயர்", "roll_label": "எண்", "seat_label": "இடம்"},
    "Telugu": {"title": "NEET 2025 (UG)", "set_label": "సెట్", "name_label": "పేరు", "roll_label": "రోల్ నం", "seat_label": "సీటు"},
    "Bengali": {"title": "NEET 2025 (UG)", "set_label": "সেট", "name_label": "নাম", "roll_label": "রোল", "seat_label": "সিট"},
    "Marathi": {"title": "NEET 2025 (UG)", "set_label": "सेट", "name_label": "नाव", "roll_label": "रोल नं", "seat_label": "बस्ता"},
    "Gujarati": {"title": "NEET 2025 (UG)", "set_label": "સેટ", "name_label": "નામ", "roll_label": "રોલ", "seat_label": "સીટ"},
    "Kannada": {"title": "NEET 2025 (UG)", "set_label": "ಸೆಟ್", "name_label": "ಹೆಸರು", "roll_label": "ರೋಲ್", "seat_label": "ಸೀಟ್"},
    "Malayalam": {"title": "NEET 2025 (UG)", "set_label": "സെറ്റ്", "name_label": "പേര്", "roll_label": "റോൾ", "seat_label": "സീറ്റ്"},
    "Odia": {"title": "NEET 2025 (UG)", "set_label": "ସେଟ୍", "name_label": "ନାମ", "roll_label": "ରୋଲ୍", "seat_label": "ସିଟ୍"},
    "Punjabi": {"title": "NEET 2025 (UG)", "set_label": "ਸੈੱਟ", "name_label": "ਨਾਮ", "roll_label": "ਰੋਲ", "seat_label": "ਸੀਟ"},
    "Urdu": {"title": "NEET 2025 (UG)", "set_label": "سیٹ", "name_label": "نام", "roll_label": "رول نمبر", "seat_label": "سیٹ"},
}


def _get_font(size: int) -> ImageFont.FreeTypeFont:
    for path in [
        "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/segoeui.ttf",
        "C:/Windows/Fonts/tahoma.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]:
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def render_translated_version(source_path: str, output_path: str, language: str):
    src = Image.open(source_path).convert("RGB")
    src_w, src_h = src.size

    banner_info = LANG_BANNERS.get(language, {"bg": (100, 100, 100), "text": language})
    labels = EXAM_LABELS.get(language, EXAM_LABELS["English"])

    banner_h = 48
    metadata_h = 56
    total_h = banner_h + metadata_h + src_h

    canvas = Image.new("RGB", (src_w, total_h), (255, 255, 255))
    draw = ImageDraw.Draw(canvas)

    draw.rectangle([0, 0, src_w, banner_h], fill=banner_info["bg"])
    banner_font = _get_font(18)
    bbox = draw.textbbox((0, 0), banner_info["text"], font=banner_font)
    tw = bbox[2] - bbox[0]
    draw.text(((src_w - tw) // 2, (banner_h - (bbox[3] - bbox[1])) // 2), banner_info["text"], fill=(255, 255, 255), font=banner_font)

    draw.rectangle([0, banner_h, src_w, banner_h + metadata_h], fill=(245, 245, 245))
    meta_font = _get_font(13)
    y = banner_h + 8
    draw.text((16, y), f"{labels['title']}", fill=(30, 30, 30), font=_get_font(15))
    y += 22
    draw.text((16, y), f"{labels['set_label']}: NEET-2025-SET-A   |   {labels['name_label']}: Aarav Sharma   |   {labels['roll_label']}: 2024NEET04521   |   {labels['seat_label']}: A-12", fill=(80, 80, 80), font=meta_font)

    canvas.paste(src, (0, banner_h + metadata_h))

    stamp_font = _get_font(10)
    stamp_text = f"PaperGuard · {language} Version"
    s_bbox = draw.textbbox((0, 0), stamp_text, font=stamp_font)
    sw = s_bbox[2] - s_bbox[0]
    draw.rectangle([src_w - sw - 24, total_h - 26, src_w - 12, total_h - 10], fill=(0, 0, 0, 180))
    draw.text((src_w - sw - 18, total_h - 24), stamp_text, fill=(200, 200, 200), font=stamp_font)

    canvas.save(output_path, "PNG")
    return output_path
