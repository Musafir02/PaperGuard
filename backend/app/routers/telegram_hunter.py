import os
import uuid
import imagehash
from PIL import Image
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.models import Alert, AlertStatus, WatermarkRecord
from app.services.audit_chain import create_audit_event

router = APIRouter(prefix="/api/v1/telegram-hunter", tags=["telegram-hunter"])

@router.get("/alerts")
async def list_alerts(
    status: str = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(Alert).order_by(Alert.created_at.desc())
    if status:
        query = query.where(Alert.status == AlertStatus(status))

    result = await db.execute(query)
    alerts = result.scalars().all()

    return {
        "total": len(alerts),
        "alerts": [
            {
                "id": a.id,
                "channel_name": a.channel_name,
                "message_id": a.message_id,
                "image_hash": a.image_hash,
                "similarity_score": a.similarity_score,
                "status": a.status.value,
                "created_at": a.created_at.isoformat(),
            }
            for a in alerts
        ],
    }

@router.post("/alerts/{alert_id}/confirm")
async def confirm_alert(alert_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalar_one_or_none()
    if not alert:
        return {"error": "Alert not found"}

    alert.status = AlertStatus.CONFIRMED
    await db.commit()
    return {"status": "confirmed", "alert_id": alert_id}

@router.post("/alerts/{alert_id}/escalate")
async def escalate_alert(alert_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalar_one_or_none()
    if not alert:
        return {"error": "Alert not found"}

    alert.status = AlertStatus.ESCALATED
    await db.commit()
    return {"status": "escalated", "alert_id": alert_id, "message": "Escalated to CBI"}

@router.post("/scan")
async def scan_leak_image(
    image: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    filename = f"scan_{uuid.uuid4().hex[:8]}.png"
    upload_dir = "uploads"
    os.makedirs(upload_dir, exist_ok=True)
    scan_path = os.path.join(upload_dir, filename)
    
    content = await image.read()
    with open(scan_path, "wb") as f:
        f.write(content)
        
    try:
        suspect_hash = imagehash.phash(Image.open(scan_path))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image: {str(e)}")
        
    result = await db.execute(select(WatermarkRecord))
    records = result.scalars().all()
    
    match_found = False
    best_similarity = 0.0
    matched_record = None
    
    for r in records:
        if not r.image_path or not os.path.exists(r.image_path):
            continue
        try:
            ref_hash = imagehash.phash(Image.open(r.image_path))
            distance = suspect_hash - ref_hash
            similarity = (64 - distance) / 64.0
            if similarity > best_similarity:
                best_similarity = similarity
                matched_record = r
                if distance <= 12:
                    match_found = True
        except Exception:
            continue
            
    if best_similarity > 0.7:
        alert = Alert(
            channel_name="telegram_leak_feed",
            message_id=int(uuid.uuid4().hex[:6], 16) % 100000,
            image_hash=str(suspect_hash),
            similarity_score=best_similarity,
            status=AlertStatus.PENDING if best_similarity < 0.9 else AlertStatus.CONFIRMED
        )
        db.add(alert)
        await db.commit()
        await db.refresh(alert)
        
        await create_audit_event(
            db, "LEAK_ALERT_CREATED",
            roll_no=matched_record.roll_no if matched_record else "",
            center_id=matched_record.center_id if matched_record else "",
            payload=f"similarity={best_similarity:.2f}|alert_id={alert.id}"
        )
        
        return {
            "status": "alert_created",
            "similarity": best_similarity,
            "match_found": match_found,
            "roll_no": matched_record.roll_no if matched_record else None,
            "center_id": matched_record.center_id if matched_record else None,
            "alert": {
                "id": alert.id,
                "channel_name": alert.channel_name,
                "similarity_score": alert.similarity_score,
                "status": alert.status.value
            }
        }
        
    return {
        "status": "no_match",
        "similarity": best_similarity,
        "match_found": False
    }
