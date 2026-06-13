import json
import base64
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from app.database import get_db
from app.models.models import TranslatorAccess
from app.services.shamir import split_secret, combine_shares
from app.services.audit_chain import create_audit_event

router = APIRouter(prefix="/api/v1/pipeline/translator-shield", tags=["translator-shield"])

SECTION_INDICES = {
    "Physics": 1,
    "Chemistry": 2,
    "Biology": 3
}

SECRET_KEY = b"NEET2026_SEC_KEY"

class IssueShardRequest(BaseModel):
    translator_id: str
    section: str
    device_id: str
    shard_data: str

@router.post("/issue")
async def issue_shard(req: IssueShardRequest, db: AsyncSession = Depends(get_db)):
    expires_at = datetime.utcnow() + timedelta(hours=6)

    section_index = SECTION_INDICES.get(req.section, 1)
    shares = split_secret(SECRET_KEY, 2, 3)
    share = [s for s in shares if s[0] == section_index][0]
    
    real_shard_data = json.dumps({
        "index": share[0],
        "value": base64.b64encode(share[1]).decode()
    })

    access = TranslatorAccess(
        translator_id=req.translator_id,
        section=req.section,
        device_id=req.device_id,
        expires_at=expires_at,
        shard_data=real_shard_data,
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

@router.post("/combine")
async def combine_translator_shards(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(TranslatorAccess)
        .where(TranslatorAccess.is_active == True)
    )
    records = result.scalars().all()
    
    shares = []
    for r in records:
        try:
            data = json.loads(r.shard_data)
            index = data["index"]
            value = base64.b64decode(data["value"])
            shares.append((index, value))
        except Exception:
            continue
            
    if len(shares) < 2:
        raise HTTPException(status_code=400, detail="At least 2 translator shards are required to reconstruct the key")
        
    try:
        reconstructed = combine_shares(shares)
        return {
            "status": "success",
            "reconstructed_key_hex": reconstructed.hex(),
            "matches_original": reconstructed == SECRET_KEY
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to combine shards: {str(e)}")
