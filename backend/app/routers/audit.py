import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.models import AuditEvent
from app.services.audit_chain import verify_chain

router = APIRouter(prefix="/api/v1/audit", tags=["audit"])


@router.get("/export")
async def export_audit(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AuditEvent).order_by(AuditEvent.id.asc()))
    events = result.scalars().all()

    return {
        "total": len(events),
        "events": [
            {
                "id": e.id,
                "type": e.event_type,
                "roll_no": e.roll_no,
                "center_id": e.center_id,
                "payload": e.payload,
                "hmac": e.hmac_value,
                "timestamp": e.created_at.isoformat(),
            }
            for e in events
        ],
    }


@router.get("/verify")
async def verify_audit_chain(db: AsyncSession = Depends(get_db)):
    result = await verify_chain(db)
    return result
