import hashlib
import hmac
import os
from datetime import datetime
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.models import AuditEvent


SECRET_KEY = os.getenv("AUDIT_HMAC_KEY", "paperguard-audit-secret-2026")


def compute_hmac(data: str, key: str = SECRET_KEY) -> str:
    return hmac.new(key.encode(), data.encode(), hashlib.sha256).hexdigest()


def build_hmac_chain(
    event_id: int,
    event_type: str,
    roll_no: str,
    center_id: str,
    timestamp: str,
    payload: str,
    prev_hmac: str,
) -> str:
    message = f"{event_id}|{event_type}|{roll_no}|{center_id}|{timestamp}|{payload}|{prev_hmac}"
    return compute_hmac(message)


async def get_last_hmac(db: AsyncSession) -> str:
    result = await db.execute(
        select(AuditEvent).order_by(AuditEvent.id.desc()).limit(1)
    )
    last = result.scalar_one_or_none()
    return last.hmac_value if last else ""


async def create_audit_event(
    db: AsyncSession,
    event_type: str,
    roll_no: str = "",
    center_id: str = "",
    payload: str = "",
) -> AuditEvent:
    prev_hmac = await get_last_hmac(db)
    now = datetime.utcnow().isoformat()

    max_id = await db.scalar(select(func.coalesce(func.max(AuditEvent.id), 0)))
    temp_id = (max_id or 0) + 1
    hmac_value = build_hmac_chain(temp_id, event_type, roll_no, center_id, now, payload, prev_hmac)

    event = AuditEvent(
        event_type=event_type,
        roll_no=roll_no,
        center_id=center_id,
        payload=payload,
        hmac_value=hmac_value,
        prev_hmac=prev_hmac,
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)
    return event


async def verify_chain(db: AsyncSession) -> dict:
    result = await db.execute(
        select(AuditEvent).order_by(AuditEvent.id.asc())
    )
    events = result.scalars().all()

    if not events:
        return {"valid": True, "broken_at": None, "total": 0}

    for i, event in enumerate(events):
        expected = build_hmac_chain(
            event.id,
            event.event_type,
            event.roll_no,
            event.center_id,
            event.created_at.isoformat(),
            event.payload,
            event.prev_hmac,
        )
        if not hmac.compare_digest(event.hmac_value, expected):
            return {"valid": False, "broken_at": event.id, "total": len(events)}

    return {"valid": True, "broken_at": None, "total": len(events)}
