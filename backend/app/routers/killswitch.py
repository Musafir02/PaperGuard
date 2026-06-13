from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from app.database import get_db
from app.models.models import Center, CenterPhase
from app.services.audit_chain import create_audit_event

router = APIRouter(prefix="/api/v1/killswitch", tags=["killswitch"])

class KillSwitchRequest(BaseModel):
    center_id: str
    mode: str
    officer_token: str

@router.post("/{center_id}")
async def activate_kill_switch(
    center_id: str,
    req: KillSwitchRequest,
    db: AsyncSession = Depends(get_db),
):
    if req.center_id != center_id:
        raise HTTPException(status_code=400, detail="Center ID mismatch")

    if req.officer_token != "NTA-OFFICER-2026":
        raise HTTPException(status_code=401, detail="Invalid officer token")

    result = await db.execute(select(Center).where(Center.id == center_id))
    center = result.scalar_one_or_none()
    if not center:
        raise HTTPException(status_code=404, detail="Center not found")

    valid_modes = {
        "PRE_PRINT": [CenterPhase.SEALED, CenterPhase.QUORUM],
        "POST_PRINT": [CenterPhase.PRINTING, CenterPhase.DISTRIBUTED],
    }

    if req.mode not in valid_modes:
        raise HTTPException(status_code=400, detail="Invalid mode. Use PRE_PRINT or POST_PRINT")

    center.is_active = False
    await db.commit()

    await create_audit_event(
        db, "KILL_SWITCH_ACTIVATED", center_id=center_id,
        payload=f"mode={req.mode}",
    )

    return {
        "status": "activated",
        "center_id": center_id,
        "mode": req.mode,
        "message": f"All terminals at center {center_id} are now locked",
    }

@router.get("/status/{center_id}")
async def kill_switch_status(center_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Center).where(Center.id == center_id))
    center = result.scalar_one_or_none()
    if not center:
        raise HTTPException(status_code=404, detail="Center not found")
        
    return {
        "locked": not center.is_active,
        "center_id": center_id,
        "phase": center.phase.value
    }
