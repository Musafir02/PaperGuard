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

TRANSLATED_QUESTIONS = {
    "Hindi": "प्रश्न 1. 4 ओम और 6 ओम के दो प्रतिरोधक 12V बैटरी के साथ श्रृंखला में जुड़े हुए हैं। सर्किट के माध्यम से प्रवाह क्या है?",
    "English": "Q1. Two resistors of 4 Ohm and 6 Ohm are connected in series with a 12V battery. What is the current through the circuit?",
    "Tamil": "கேள்வி 1. 4 ஓம் மற்றும் 6 ஓம் இரண்டு மின்தடையங்கள் 12V மின்கலத்துடன் தொடராக இணைக்கப்பட்டுள்ளன. மின்சுற்று வழியாக செல்லும் மின்னோட்டம் என்ன?",
    "Telugu": "ప్రశ్న 1. 4 ఓం మరియు 6 ఓం రెండు నిరోధకాలు 12V బ్యాటరీతో సిరీస్‌లో అనుసంధանիਅబడి ఉన్నాయి. సర్క్యూట్ ద్వారా విద్యుత్ ప్రవాహం ఎంత?",
    "Bengali": "প্রশ্ন ১. ৪ ওহম এবং ৬ ওহমের দুটি রোধক একটি ১২ভোল্ট ব্যাটারির সাথে শ্রেণীতে সংযুক্ত রয়েছে। সার্কিটের মধ্য দিয়ে প্রবাহিত তড়িৎপ্রবাহ কত?",
    "Marathi": "प्रश्न १. ४ ओहम आणि ६ ओहमचे दोन रोधक १२V बॅटरीसोबत एकसर जोडणीत जोडलेले आहेत. सर्किटमधील विद्युत प्रवाह किती आहे?",
    "Gujarati": "પ્રશ્ન ૧. ૪ ઓહ્મ અને 6 ઓહ્મના બે અવરોધકો ૧૨V બેટરી સાથે શ્રેણીમાં જોડાયેલા છે. સર્કિટમાંથી વહેતો પ્રવાહ કેટલો છે?",
    "Kannada": "ಪ್ರಶ್ನೆ 1. 4 ಓಮ್ ಮತ್ತು 6 ಓಮ್‌ನ ಎರಡು ರೋಧಕಗಳನ್ನು 12V ಬ್ಯಾಟರಿಯೊಂದಿಗೆ ಸರಣಿಯಲ್ಲಿ ಜೋಡಿಸಲಾಗಿದೆ. ಸರ್ಕ್ಯೂಟ್ ಮೂಲಕ ಹರಿಯುವ ವಿದ್ಯುತ್ ಪ್ರವಾಹ ಎಷ್ಟು?",
    "Malayalam": "ചോദ്യം 1. 4 ഓമിന്റെയും 6 ഓമിന്റെയും രണ്ട് റെസിസ്റ്ററുകൾ 12V ബാറ്ററിയുമായി ശ്രേണിയിൽ ഘടിപ്പിച്ചിരിക്കുന്നു. സർക്യൂട്ടിലൂടെയുള്ള കറന്റ് എത്രയാണ്?",
    "Odia": "ପ୍ରଶ୍ନ ୧. ୪ ଓମ୍ ଏବଂ ୬ ଓମ୍‌ର ଦୁଇଟି ପ୍ରତିରୋଧକ ଏକ ୧୨V ବ୍ୟାଟେରୀ ସହିତ ଶ୍ରେଣୀରେ ସଂଯୁକ୍ତ ଅଛି | ସର୍କିଟ୍ ମଧ୍ୟରେ ପ୍ରବାହିତ ବିଦ୍ୟୁତ୍ ପ୍ରବାହ କେତେ?",
    "Punjabi": "ਪ੍ਰਸ਼ਨ 1. 4 ਓਮ ਅਤੇ 6 ਓਮ ਦੇ ਦੋ ਪ੍ਰਤੀਰੋਧਕ ਇੱਕ 12V ਬੈਟਰੀ ਨਾਲ ਲੜੀ ਵਿੱਚ ਜੁੜੇ ਹੋਏ ਹਨ। ਸਰਕਟ ਵਿੱਚੋਂ ਲੰਘਣ ਵਾਲਾ ਕਰੰਟ ਕਿੰਨਾ ਹੈ?",
    "Urdu": "سوال 1. 4 اوہم اور 6 اوہم کے دو مزاحم 12V بیٹری کے ساتھ سیریز میں جڑے ہوئے ہیں۔ سرکٹ سے گزرنے والا کرنٹ کتنا ہے؟"
}

def _get_font(size: int) -> ImageFont.FreeTypeFont:
    for path in [
        "C:/Windows/Fonts/nirmala.ttf",
        "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/segoeui.ttf",
        "C:/Windows/Fonts/tahoma.ttf",
    ]:
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()

def render_translated_version(source_path: str, output_path: str, language: str):
    banner_info = LANG_BANNERS.get(language, {"bg": (100, 100, 100), "text": language})
    labels = EXAM_LABELS.get(language, EXAM_LABELS["English"])

    banner_h = 48
    metadata_h = 56
    content_h = 240
    total_h = banner_h + metadata_h + content_h
    width = 800

    canvas = Image.new("RGB", (width, total_h), (255, 255, 255))
    draw = ImageDraw.Draw(canvas)

    draw.rectangle([0, 0, width, banner_h], fill=banner_info["bg"])
    banner_font = _get_font(18)
    bbox = draw.textbbox((0, 0), banner_info["text"], font=banner_font)
    tw = bbox[2] - bbox[0]
    draw.text(((width - tw) // 2, (banner_h - (bbox[3] - bbox[1])) // 2), banner_info["text"], fill=(255, 255, 255), font=banner_font)

    draw.rectangle([0, banner_h, width, banner_h + metadata_h], fill=(245, 245, 245))
    meta_font = _get_font(13)
    y = banner_h + 8
    draw.text((16, y), f"{labels['title']}", fill=(30, 30, 30), font=_get_font(15))
    y += 22
    draw.text((16, y), f"{labels['set_label']}: NEET-2025-SET-A   |   {labels['name_label']}: Aarav Sharma   |   {labels['roll_label']}: 2024NEET04521   |   {labels['seat_label']}: A-12", fill=(80, 80, 80), font=meta_font)

    question_text = TRANSLATED_QUESTIONS.get(language, TRANSLATED_QUESTIONS["English"])
    q_font = _get_font(15)
    
    words = question_text.split(" ")
    lines = []
    current_line = []
    for word in words:
        current_line.append(word)
        line_str = " ".join(current_line)
        w_bbox = draw.textbbox((0, 0), line_str, font=q_font)
        if w_bbox[2] - w_bbox[0] > width - 40:
            current_line.pop()
            lines.append(" ".join(current_line))
            current_line = [word]
    if current_line:
        lines.append(" ".join(current_line))
        
    y_text = banner_h + metadata_h + 30
    for line in lines:
        draw.text((20, y_text), line, fill=(0, 0, 0), font=q_font)
        y_text += 25

    stamp_font = _get_font(10)
    stamp_text = f"PaperGuard · {language} Version"
    s_bbox = draw.textbbox((0, 0), stamp_text, font=stamp_font)
    sw = s_bbox[2] - s_bbox[0]
    draw.rectangle([width - sw - 24, total_h - 26, width - 12, total_h - 10], fill=(0, 0, 0, 180))
    draw.text((width - sw - 18, total_h - 24), stamp_text, fill=(200, 200, 200), font=stamp_font)

    canvas.save(output_path, "PNG")
    return output_path
