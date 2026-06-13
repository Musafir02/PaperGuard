from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.models import Alert, AlertStatus

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
