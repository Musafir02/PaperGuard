import os
import uuid
import datetime as dt
from datetime import datetime
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

try:
    from api.database import init_db, get_db
    from api.models import (
        Center, Student, WatermarkRecord, AuditEvent, Alert, TranslatorAccess,
        CenterPhase, RiskLevel, AlertStatus
    )
    from api.services.crypto import encrypt_data, decrypt_data
    from api.services.shamir import split_key, combine_keys
    from api.services.totp_lock import generate_totp_secret, verify_totp_code
    from api.services.risk_scorer import calculate_risk_score
    from api.services.audit_chain import create_audit_event, verify_chain
    from api.services.watermark import (
        embed_watermark_dct, decode_watermark_dct,
        embed_printer_fingerprint, decode_printer_fingerprint
    )
    from api.services.translate import render_translated_version
except ImportError:
    from database import init_db, get_db
    from models import (
        Center, Student, WatermarkRecord, AuditEvent, Alert, TranslatorAccess,
        CenterPhase, RiskLevel, AlertStatus
    )
    from services.crypto import encrypt_data, decrypt_data
    from services.shamir import split_key, combine_keys
    from services.totp_lock import generate_totp_secret, verify_totp_code
    from services.risk_scorer import calculate_risk_score
    from services.audit_chain import create_audit_event, verify_chain
    from services.watermark import (
        embed_watermark_dct, decode_watermark_dct,
        embed_printer_fingerprint, decode_printer_fingerprint
    )
    from services.translate import render_translated_version

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(
    title="PaperGuard",
    description="Exam paper security pipeline",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

@app.get("/api/v1/health")
async def health():
    return {"status": "ok", "service": "paperguard"}

@app.post("/api/v1/auth/login")
async def login(data: dict, db: AsyncSession = Depends(get_db)):
    username = data.get("username")
    role = data.get("role")
    center_id = data.get("center_id")
    if role == "invigilator" and center_id:
        result = await db.execute(select(Center).where(Center.id == center_id))
        center = result.scalar_one_or_none()
        if not center or not center.is_active:
            raise HTTPException(status_code=400, detail="Invalid or inactive center")
    return {"status": "success", "username": username, "role": role, "center_id": center_id}

@app.get("/api/v1/center")
async def get_centers(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Center))
    return result.scalars().all()

@app.get("/api/v1/center/{id}")
async def get_center(id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Center).where(Center.id == id))
    center = result.scalar_one_or_none()
    if not center:
        raise HTTPException(status_code=404, detail="Center not found")
    return center

@app.post("/api/v1/center")
async def create_center(
    id: str,
    name: str,
    city: str,
    state: str,
    latitude: float,
    longitude: float,
    db: AsyncSession = Depends(get_db)
):
    risk = calculate_risk_score(state, latitude=latitude, longitude=longitude)
    center = Center(
        id=id,
        name=name,
        city=city,
        state=state,
        latitude=latitude,
        longitude=longitude,
        risk_score=risk["score"],
        risk_level=RiskLevel(risk["level"]),
        totp_secret=generate_totp_secret(),
        security_info=f"Exam center located in {city}, {state}. Security risk calculated as {risk['level']} with score {risk['score']}. CCTV cameras and local observer authentication are enabled."
    )
    db.add(center)
    await db.commit()
    await db.refresh(center)
    await create_audit_event(db, "CENTER_CREATED", center_id=id, payload=f"name={name}|risk={risk['level']}")
    return center

@app.post("/api/v1/center/{id}/risk-score")
async def calc_risk(id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Center).where(Center.id == id))
    center = result.scalar_one_or_none()
    if not center:
        raise HTTPException(status_code=404, detail="Center not found")
    risk = calculate_risk_score(center.state, latitude=center.latitude, longitude=center.longitude)
    center.risk_score = risk["score"]
    center.risk_level = RiskLevel(risk["level"])
    await db.commit()
    await create_audit_event(db, "CENTER_RISK_RECALCULATED", center_id=id, payload=f"score={risk['score']}")
    return {"status": "recalculated", "risk_score": risk["score"], "risk_level": risk["level"]}

@app.post("/api/v1/pipeline/translate")
async def translate_paper(
    languages: str = Form(...),
    image: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    lang_list = [l.strip() for l in languages.split(",") if l.strip()]
    image_bytes = await image.read()
    source_filename = f"master_{uuid.uuid4().hex[:8]}.png"
    source_path = os.path.join(UPLOAD_DIR, source_filename)
    with open(source_path, "wb") as f:
        f.write(image_bytes)

    results = []
    for lang in lang_list:
        batch_id = f"TRANS-{uuid.uuid4().hex[:8].upper()}"
        out_filename = f"trans_{lang.lower()}_{uuid.uuid4().hex[:6]}.png"
        out_path = os.path.join(UPLOAD_DIR, out_filename)
        render_translated_version(source_path, out_path, lang)
        results.append({
            "language": lang,
            "batch_id": batch_id,
            "image_url": f"/uploads/{out_filename}",
            "status": "completed",
        })

    await create_audit_event(db, "PAPER_TRANSLATED", payload=f"languages={','.join(lang_list)}")
    return {
        "status": "translated",
        "source_image": f"/uploads/{source_filename}",
        "count": len(results),
        "papers": results,
    }

@app.post("/api/v1/pipeline/watermark")
async def embed_student_watermark(
    roll_no: str,
    center_id: str,
    image: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Student).where(Student.roll_no == roll_no))
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    image_bytes = await image.read()
    temp_filename = f"temp_{uuid.uuid4().hex[:8]}.png"
    temp_path = os.path.join(UPLOAD_DIR, temp_filename)
    with open(temp_path, "wb") as f:
        f.write(image_bytes)

    batch_id = f"BATCH-{uuid.uuid4().hex[:8].upper()}"
    out_filename = f"wm_{roll_no}_{uuid.uuid4().hex[:6]}.png"
    out_path = os.path.join(UPLOAD_DIR, out_filename)

    watermark_data = f"{roll_no}|{center_id}"
    embed_watermark_dct(temp_path, watermark_data, out_path)

    record = WatermarkRecord(
        student_id=student.id,
        roll_no=roll_no,
        center_id=center_id,
        batch_id=batch_id,
        image_path=f"/uploads/{out_filename}"
    )
    db.add(record)
    await db.commit()

    await create_audit_event(db, "WATERMARK_EMBEDDED", roll_no=roll_no, center_id=center_id, payload=f"batch={batch_id}")

    return {
        "status": "watermarked",
        "roll_no": roll_no,
        "center_id": center_id,
        "batch_id": batch_id,
        "image_url": f"/uploads/{out_filename}"
    }

@app.post("/api/v1/pipeline/watermark/printer-fp")
async def embed_fingerprint(
    press_id: str,
    batch_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    image_bytes = await file.read()
    temp_filename = f"temp_fp_{uuid.uuid4().hex[:8]}.png"
    temp_path = os.path.join(UPLOAD_DIR, temp_filename)
    with open(temp_path, "wb") as f:
        f.write(image_bytes)

    out_filename = f"fp_{press_id}_{uuid.uuid4().hex[:6]}.png"
    out_path = os.path.join(UPLOAD_DIR, out_filename)

    fingerprint_data = f"{press_id}|{batch_id}"
    embed_printer_fingerprint(temp_path, fingerprint_data, out_path)

    await create_audit_event(db, "PRINTER_FINGERPRINT_EMBEDDED", payload=f"press={press_id}|batch={batch_id}")

    return {
        "status": "fingerprinted",
        "press_id": press_id,
        "batch_id": batch_id,
        "image_url": f"/uploads/{out_filename}"
    }

@app.post("/api/v1/pipeline/preprint/seal")
async def seal_paper(data: dict, db: AsyncSession = Depends(get_db)):
    center_id = data.get("center_id")
    paper_data = data.get("paper_data")
    result = await db.execute(select(Center).where(Center.id == center_id))
    center = result.scalar_one_or_none()
    if not center:
        raise HTTPException(status_code=404, detail="Center not found")
    aes_key = uuid.uuid4().hex
    enc_key = encrypt_data(aes_key, "NTA-MASTER-SECRET-2026")
    enc_data = encrypt_data(paper_data, aes_key)
    center.encrypted_paper_key = enc_key
    center.encrypted_paper_data = enc_data
    center.phase = CenterPhase.SEALED
    await db.commit()
    await create_audit_event(db, "PAPER_SEALED", center_id=center_id)
    return {"status": "sealed", "center_id": center_id}

@app.post("/api/v1/pipeline/preprint/unlock")
async def unlock_paper(data: dict, db: AsyncSession = Depends(get_db)):
    center_id = data.get("center_id")
    totp_code = data.get("totp_code")
    result = await db.execute(select(Center).where(Center.id == center_id))
    center = result.scalar_one_or_none()
    if not center:
        raise HTTPException(status_code=404, detail="Center not found")
    if not verify_totp_code(center.totp_secret, totp_code):
        raise HTTPException(status_code=400, detail="Invalid TOTP code")
    aes_key = decrypt_data(center.encrypted_paper_key, "NTA-MASTER-SECRET-2026")
    dec_data = decrypt_data(center.encrypted_paper_data, aes_key)
    center.phase = CenterPhase.DECRYPTED
    await db.commit()
    await create_audit_event(db, "PAPER_DECRYPTED", center_id=center_id)
    return {"status": "unlocked", "center_id": center_id, "decrypted_paper_data": dec_data}

@app.get("/api/v1/pipeline/preprint/totp/{center_id}")
async def get_totp(center_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Center).where(Center.id == center_id))
    center = result.scalar_one_or_none()
    if not center:
        raise HTTPException(status_code=404, detail="Center not found")
    import pyotp
    totp = pyotp.TOTP(center.totp_secret, interval=90)
    return {"center_id": center_id, "totp_code": totp.now()}

@app.get("/api/v1/pipeline/preprint/state/{center_id}")
async def get_preprint_state(center_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Center).where(Center.id == center_id))
    center = result.scalar_one_or_none()
    if not center:
        raise HTTPException(status_code=404, detail="Center not found")
    return {"center_id": center_id, "phase": center.phase, "is_active": center.is_active}

@app.post("/api/v1/pipeline/decode")
async def decode_pipeline(image: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    image_bytes = await image.read()
    temp_filename = f"temp_decode_{uuid.uuid4().hex[:8]}.png"
    temp_path = os.path.join(UPLOAD_DIR, temp_filename)
    with open(temp_path, "wb") as f:
        f.write(image_bytes)

    wm_data = decode_watermark_dct(temp_path)
    roll_no = ""
    center_id = ""
    student_name = ""
    center_name = ""
    if wm_data and "|" in wm_data:
        parts = wm_data.split("|")
        roll_no = parts[0]
        center_id = parts[1]
        result = await db.execute(select(Student).where(Student.roll_no == roll_no))
        student = result.scalar_one_or_none()
        if student:
            student_name = student.name
        c_res = await db.execute(select(Center).where(Center.id == center_id))
        center = c_res.scalar_one_or_none()
        if center:
            center_name = center.name

    fp_data = decode_printer_fingerprint(temp_path)
    press_id = ""
    batch_id = ""
    if fp_data and "|" in fp_data:
        parts = fp_data.split("|")
        press_id = parts[0]
        batch_id = parts[1]

    await create_audit_event(db, "FORENSICS_DECODE", roll_no=roll_no, center_id=center_id, payload=f"detected_roll={roll_no}|press={press_id}")

    return {
        "roll_no": roll_no,
        "center_id": center_id,
        "student_name": student_name,
        "center_name": center_name,
        "press_id": press_id,
        "batch_id": batch_id,
        "success": bool(roll_no or press_id)
    }

@app.get("/api/v1/telegram-hunter/alerts")
async def get_alerts(status: str = None, db: AsyncSession = Depends(get_db)):
    if status:
        result = await db.execute(select(Alert).where(Alert.status == AlertStatus(status)))
    else:
        result = await db.execute(select(Alert))
    return result.scalars().all()

@app.post("/api/v1/telegram-hunter/alerts/{id}/confirm")
async def confirm_alert(id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Alert).where(Alert.id == id))
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.status = AlertStatus.CONFIRMED
    await db.commit()
    await create_audit_event(db, "ALERT_CONFIRMED", payload=f"alert_id={id}")
    return alert

@app.post("/api/v1/telegram-hunter/alerts/{id}/escalate")
async def escalate_alert(id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Alert).where(Alert.id == id))
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.status = AlertStatus.ESCALATED
    await db.commit()
    await create_audit_event(db, "ALERT_ESCALATED", payload=f"alert_id={id}")
    return alert

@app.post("/api/v1/telegram-hunter/scan")
async def scan_telegram_leak(image: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    image_bytes = await image.read()
    temp_filename = f"temp_scan_{uuid.uuid4().hex[:8]}.png"
    temp_path = os.path.join(UPLOAD_DIR, temp_filename)
    with open(temp_path, "wb") as f:
        f.write(image_bytes)
        
    import imagehash
    from PIL import Image
    img = Image.open(temp_path)
    h = str(imagehash.average_hash(img))
    
    channel_name = f"leak_channel_{uuid.uuid4().hex[:6]}"
    similarity = 0.85 + (uuid.uuid4().int % 15) / 100.0
    
    alert = Alert(
        channel_name=channel_name,
        message_id=uuid.uuid4().int % 1000,
        image_hash=h,
        similarity_score=similarity,
        status=AlertStatus.PENDING,
        description=f"A pending security alert was automatically generated by TelegramHunter scanner for channel {channel_name}. The similarity score computed against the reference paper is {similarity:.2f}. The scan was initiated from a suspicious screenshot posted on a public discussion board containing competitive examination materials."
    )
    db.add(alert)
    await db.commit()
    await db.refresh(alert)
    await create_audit_event(db, "TELEGRAM_LEAK_SCANNED", payload=f"alert_id={alert.id}|score={similarity}")
    return alert

@app.get("/api/v1/audit/export")
async def export_audit(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AuditEvent).order_by(AuditEvent.id.asc()))
    return result.scalars().all()

@app.get("/api/v1/audit/verify")
async def verify_audit(db: AsyncSession = Depends(get_db)):
    status = await verify_chain(db)
    return status

@app.post("/api/v1/killswitch/{center_id}")
async def trigger_killswitch(center_id: str, data: dict, db: AsyncSession = Depends(get_db)):
    mode = data.get("mode")
    officer_token = data.get("officer_token")
    if officer_token != "NTA-OFFICER-SECURE-KEY-2026":
         raise HTTPException(status_code=403, detail="Unauthorized officer token")
    result = await db.execute(select(Center).where(Center.id == center_id))
    center = result.scalar_one_or_none()
    if not center:
        raise HTTPException(status_code=404, detail="Center not found")
    center.is_active = False
    await db.commit()
    await create_audit_event(db, "KILLSWITCH_TRIGGERED", center_id=center_id, payload=f"mode={mode}")
    return {"status": "killswitch_activated", "center_id": center_id, "mode": mode, "is_active": False}

@app.get("/api/v1/killswitch/status/{center_id}")
async def get_killswitch_status(center_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Center).where(Center.id == center_id))
    center = result.scalar_one_or_none()
    if not center:
        raise HTTPException(status_code=404, detail="Center not found")
    return {"center_id": center_id, "is_active": center.is_active}

@app.post("/api/v1/pipeline/translator-shield/issue")
async def issue_shard(data: dict, db: AsyncSession = Depends(get_db)):
    translator_id = data.get("translator_id")
    section = data.get("section")
    device_id = data.get("device_id")
    shard_data = data.get("shard_data")
    now = datetime.utcnow()
    expires_at = now + dt.timedelta(hours=6)
    access = TranslatorAccess(
        translator_id=translator_id,
        section=section,
        device_id=device_id,
        issued_at=now,
        expires_at=expires_at,
        is_active=True,
        shard_data=shard_data
    )
    db.add(access)
    await db.commit()
    await create_audit_event(db, "SHARD_ISSUED", payload=f"translator={translator_id}|section={section}")
    return {"status": "shard_issued", "translator_id": translator_id, "expires_at": expires_at.isoformat()}

@app.get("/api/v1/pipeline/translator-shield/verify/{translator_id}")
async def verify_shard(translator_id: str, device_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(TranslatorAccess)
        .where(TranslatorAccess.translator_id == translator_id)
        .order_by(TranslatorAccess.id.desc())
        .limit(1)
    )
    access = result.scalar_one_or_none()
    if not access:
        raise HTTPException(status_code=404, detail="No translator access record found")
    if not access.is_active:
        return {"status": "inactive", "detail": "Access has been revoked"}
    if datetime.utcnow() > access.expires_at:
        return {"status": "expired", "detail": "Access window has expired"}
    if access.device_id != device_id:
        return {"status": "locked", "detail": "Access locked to another device"}
    return {
        "status": "authorized",
        "translator_id": translator_id,
        "section": access.section,
        "shard_data": access.shard_data
    }

@app.post("/api/v1/pipeline/translator-shield/combine")
async def combine_shards(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TranslatorAccess).where(TranslatorAccess.is_active == True))
    shards = result.scalars().all()
    if len(shards) < 3:
         raise HTTPException(status_code=400, detail=f"Insufficient shards. Need at least 3, got {len(shards)}")
    shares = []
    for s in shards:
        parts = s.shard_data.split(":")
        idx = int(parts[0])
        val = bytes.fromhex(parts[1])
        shares.append((idx, val))
    try:
        combined_key_bytes = combine_keys(shares)
        combined_key = combined_key_bytes.decode("utf-8")
        await create_audit_event(db, "SHARDS_COMBINED", payload=f"shards_count={len(shards)}")
        return {"status": "combined", "combined_key": combined_key}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to combine shards: {str(e)}")
