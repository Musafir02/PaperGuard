import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from app.database import get_db
from app.models.models import TranslatorAccess
from app.services.crypto import generate_aes_key, encrypt_data
from app.services.audit_chain import create_audit_event

router = APIRouter(prefix="/api/v1/pipeline/translator-shield", tags=["translator-shield"])


class IssueShardRequest(BaseModel):
    translator_id: str
    section: str
    device_id: str
    shard_data: str


@router.post("/issue")
async def issue_shard(req: IssueShardRequest, db: AsyncSession = Depends(get_db)):
    from datetime import datetime, timedelta

    expires_at = datetime.utcnow() + timedelta(hours=6)

    access = TranslatorAccess(
        translator_id=req.translator_id,
        section=req.section,
        device_id=req.device_id,
        expires_at=expires_at,
        shard_data=req.shard_data,
    )
    db.add(access)
    await db.commit()

    await create_audit_event(
        db, "SHARD_ISSUED",
        payload=f"translator={req.translator_id}|section={req.section}",
    )

    return {
        "status": "issued",
        "translator_id": req.translator_id,
        "section": req.section,
        "expires_at": expires_at.isoformat(),
    }


@router.get("/verify/{translator_id}")
async def verify_access(
    translator_id: str,
    device_id: str,
    db: AsyncSession = Depends(get_db),
):
    from datetime import datetime

    result = await db.execute(
        select(TranslatorAccess)
        .where(TranslatorAccess.translator_id == translator_id)
        .where(TranslatorAccess.is_active == True)
        .order_by(TranslatorAccess.id.desc())
        .limit(1)
    )
    access = result.scalar_one_or_none()

    if not access:
        return {"authorized": False, "reason": "No active shard found"}

    if datetime.utcnow() > access.expires_at:
        return {"authorized": False, "reason": "Access expired"}

    if access.device_id != device_id:
        return {"authorized": False, "reason": "Device mismatch"}

    return {
        "authorized": True,
        "section": access.section,
        "expires_at": access.expires_at.isoformat(),
    }
