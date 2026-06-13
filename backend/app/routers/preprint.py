import os
import json
import base64
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from app.database import get_db
from app.models.models import Center, CenterPhase
from app.services.crypto import generate_aes_key, encrypt_data, decrypt_data, compute_sha256, verify_sha256
from app.services.totp_lock import verify_totp, get_current_code
from app.services.audit_chain import create_audit_event

router = APIRouter(prefix="/api/v1/pipeline/preprint", tags=["preprint"])

class PrePrintUnlockRequest(BaseModel):
    center_id: str
    totp_code: str


class PrePrintSealRequest(BaseModel):
    center_id: str
    paper_data: str


@router.post("/seal")
async def seal_paper(req: PrePrintSealRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Center).where(Center.id == req.center_id))
    center = result.scalar_one_or_none()
    if not center:
        raise HTTPException(status_code=404, detail="Center not found")

    key = generate_aes_key()
    encrypted = encrypt_data(req.paper_data.encode(), key)

    center.encrypted_paper_key = base64.b64encode(key).decode()
    center.encrypted_paper_data = json.dumps(encrypted)

    paper_hash = compute_sha256(req.paper_data.encode())

    await create_audit_event(
        db, "PAPER_SEALED", center_id=req.center_id,
        payload=f"hash={paper_hash}",
    )
    await db.commit()

    return {
        "status": "sealed",
        "center_id": req.center_id,
        "encrypted_package": encrypted,
        "sha256_hash": paper_hash,
    }


@router.post("/unlock")
async def unlock_paper(req: PrePrintUnlockRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Center).where(Center.id == req.center_id))
    center = result.scalar_one_or_none()
    if not center:
        raise HTTPException(status_code=404, detail="Center not found")

    if center.phase not in (CenterPhase.SEALED, CenterPhase.QUORUM):
        raise HTTPException(status_code=400, detail=f"Cannot unlock in {center.phase.value} phase")

    if not verify_totp(center.totp_secret, req.totp_code):
        raise HTTPException(status_code=401, detail="Invalid TOTP code")

    if not center.encrypted_paper_key:
        raise HTTPException(status_code=400, detail="No sealed paper for this center")

    center.phase = CenterPhase.DECRYPTED
    await db.commit()

    await create_audit_event(
        db, "PAPER_UNLOCKED", center_id=req.center_id,
        payload="phase=DECRYPTED",
    )

    return {
        "status": "unlocked",
        "center_id": req.center_id,
        "phase": "DECRYPTED",
    }


@router.get("/totp/{center_id}")
async def get_current_totp(center_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Center).where(Center.id == center_id))
    center = result.scalar_one_or_none()
    if not center:
        raise HTTPException(status_code=404, detail="Center not found")

    code = get_current_code(center.totp_secret)
    return {"center_id": center_id, "totp_code": code}


@router.get("/state/{center_id}")
async def get_center_state(center_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Center).where(Center.id == center_id))
    center = result.scalar_one_or_none()
    if not center:
        raise HTTPException(status_code=404, detail="Center not found")

    return {
        "center_id": center_id,
        "phase": center.phase.value,
        "has_paper": bool(center.encrypted_paper_key),
    }
