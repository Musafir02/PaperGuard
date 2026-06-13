import os
import base64
import json
import httpx
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
    "Gujarati": {"title": "NEET 2025 (UG)", "set_label": "સેટ", "name_label": "નામ", "roll_label": "રોલ", "seat_label": "સીਟ"},
    "Kannada": {"title": "NEET 2025 (UG)", "set_label": "ಸೆಟ್", "name_label": "ಹೆಸರು", "roll_label": "ರೋಲ್", "seat_label": "ಸೀಟ್"},
    "Malayalam": {"title": "NEET 2025 (UG)", "set_label": "സെറ്റ്", "name_label": "പേര്", "roll_label": "റോൾ", "seat_label": "സീറ്റ്"},
    "Odia": {"title": "NEET 2025 (UG)", "set_label": "ସେଟ୍", "name_label": "ନାମ", "roll_label": "ରୋଲ୍", "seat_label": "ସିଟ୍"},
    "Punjabi": {"title": "NEET 2025 (UG)", "set_label": "ਸੈੱਟ", "name_label": "ਨਾਮ", "roll_label": "ਰੋਲ", "seat_label": "ਸੀਟ"},
    "Urdu": {"title": "NEET 2025 (UG)", "set_label": "سیٹ", "name_label": "نام", "roll_label": "رول نمبر", "seat_label": "سیٹ"},
}

def _get_font(language: str, size: int) -> ImageFont.FreeTypeFont:
    paths = []
    if language in ["Hindi", "Marathi"]:
        paths.append("C:/Windows/Fonts/mangal.ttf")
        paths.append("C:/Windows/Fonts/kokila.ttf")
        paths.append("C:/Windows/Fonts/utsaah.ttf")
    paths.extend([
        "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/segoeui.ttf",
        "C:/Windows/Fonts/tahoma.ttf",
    ])
    for path in paths:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                continue
    return ImageFont.load_default()

def extract_text_from_image_nvidia(image_path: str) -> str:
    api_key = os.getenv("NVIDIA_API_KEY")
    base_url = os.getenv("NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1")
    if not api_key:
        raise ValueError("NVIDIA_API_KEY environment variable is not set")
    
    with open(image_path, "rb") as f:
        encoded_image = base64.b64encode(f.read()).decode("utf-8")
        
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "meta/llama-3.2-11b-vision-instruct",
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "Extract all questions and choices from this exam paper image. Output only the extracted exam questions text precisely as written, without any introduction or markdown wrapper."},
                    {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{encoded_image}"}}
                ]
            }
        ],
        "max_tokens": 1024
    }
    
    r = httpx.post(f"{base_url}/chat/completions", headers=headers, json=payload, timeout=45.0)
    if r.status_code != 200:
        raise RuntimeError(f"NVIDIA Vision NIM returned status {r.status_code}: {r.text}")
        
    content = r.json()["choices"][0]["message"]["content"].strip()
    if not content:
        raise RuntimeError("NVIDIA Vision NIM returned empty text content")
    return content

def translate_text_nvidia(text: str, target_lang: str) -> str:
    api_key = os.getenv("NVIDIA_API_KEY")
    base_url = os.getenv("NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1")
    if not api_key:
        raise ValueError("NVIDIA_API_KEY environment variable is not set")
    if target_lang == "English":
        return text
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "meta/llama-3.1-70b-instruct",
        "messages": [
            {
                "role": "user",
                "content": f"Translate the following competitive exam questions and options into {target_lang}. Translate accurately. Maintain the layout and formatting (like Q1, Q2, option labels like A, B, C, D). Output ONLY the translated text, do not add any explanation, quotes or preamble:\n{text}"
            }
        ],
        "temperature": 0.1,
        "max_tokens": 2048
    }
    
    r = httpx.post(f"{base_url}/chat/completions", headers=headers, json=payload, timeout=35.0)
    if r.status_code != 200:
        raise RuntimeError(f"NVIDIA Translation NIM returned status {r.status_code}: {r.text}")
        
    result = r.json()["choices"][0]["message"]["content"].strip()
    if result.startswith('"') and result.endswith('"'):
        result = result[1:-1]
    if result.startswith("'") and result.endswith("'"):
        result = result[1:-1]
    return result

def render_translated_version(source_path: str, output_path: str, language: str):
    banner_info = LANG_BANNERS.get(language, {"bg": (100, 100, 100), "text": language})
    labels = EXAM_LABELS.get(language, EXAM_LABELS["English"])

    banner_h = 48
    metadata_h = 56
    width = 800

    extracted_text = extract_text_from_image_nvidia(source_path)
    question_text = translate_text_nvidia(extracted_text, language)
    
    q_font = _get_font(language, 14)
    dummy_img = Image.new("RGB", (100, 100))
    dummy_draw = ImageDraw.Draw(dummy_img)

    raw_lines = question_text.split("\n")
    wrapped_lines = []
    for raw_line in raw_lines:
        words = raw_line.split(" ")
        current_line = []
        for word in words:
            current_line.append(word)
            line_str = " ".join(current_line)
            w_bbox = dummy_draw.textbbox((0, 0), line_str, font=q_font)
            if w_bbox[2] - w_bbox[0] > width - 40:
                current_line.pop()
                wrapped_lines.append(" ".join(current_line))
                current_line = [word]
        if current_line:
            wrapped_lines.append(" ".join(current_line))

    content_h = (len(wrapped_lines) * 22) + 60
    total_h = banner_h + metadata_h + content_h

    canvas = Image.new("RGB", (width, total_h), (255, 255, 255))
    draw = ImageDraw.Draw(canvas)

    draw.rectangle([0, 0, width, banner_h], fill=banner_info["bg"])
    banner_font = _get_font(language, 18)
    bbox = draw.textbbox((0, 0), banner_info["text"], font=banner_font)
    tw = bbox[2] - bbox[0]
    draw.text(((width - tw) // 2, (banner_h - (bbox[3] - bbox[1])) // 2), banner_info["text"], fill=(255, 255, 255), font=banner_font)

    draw.rectangle([0, banner_h, width, banner_h + metadata_h], fill=(245, 245, 245))
    meta_font = _get_font(language, 13)
    y = banner_h + 8
    draw.text((16, y), f"{labels['title']}", fill=(30, 30, 30), font=_get_font(language, 15))
    y += 22
    draw.text((16, y), f"{labels['set_label']}: NEET-2025-SET-A   |   {labels['name_label']}: Aarav Sharma   |   {labels['roll_label']}: 2024NEET04521   |   {labels['seat_label']}: A-12", fill=(80, 80, 80), font=meta_font)

    y_text = banner_h + metadata_h + 30
    for line in wrapped_lines:
        draw.text((20, y_text), line, fill=(0, 0, 0), font=q_font)
        y_text += 22

    stamp_font = _get_font(language, 10)
    stamp_text = f"PaperGuard · {language} Version"
    s_bbox = draw.textbbox((0, 0), stamp_text, font=stamp_font)
    sw = s_bbox[2] - s_bbox[0]
    draw.rectangle([width - sw - 24, total_h - 26, width - 12, total_h - 10], fill=(0, 0, 0, 180))
    draw.text((width - sw - 18, total_h - 24), stamp_text, fill=(200, 200, 200), font=stamp_font)

    canvas.save(output_path, "PNG")
    return output_path
