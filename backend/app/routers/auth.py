from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from app.database import get_db
from app.models.models import Student, Center
from app.services.risk_scorer import calculate_risk_score

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


class InvigilatorLogin(BaseModel):
    invigilator_id: str
    center_id: str
    device_id: str


@router.post("/invigilator")
async def login_invigilator(req: InvigilatorLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Center).where(Center.id == req.center_id))
    center = result.scalar_one_or_none()
    if not center:
        raise HTTPException(status_code=404, detail="Center not found")

    if not center.is_active:
        raise HTTPException(status_code=403, detail="Center is locked by Kill Switch")

    return {
        "status": "authenticated",
        "center_id": center.id,
        "center_name": center.name,
        "phase": center.phase.value,
        "invigilator_id": req.invigilator_id,
    }
