from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from app.database import get_db
from app.models.models import Center

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

class LoginRequest(BaseModel):
    username: str
    password: str
    role: str
    center_id: str = ""

@router.post("/login")
async def login_user(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    if req.role == "nta_member":
        if req.username == "nta" and req.password == "nta@2026":
            return {
                "status": "authenticated",
                "role": "nta_member",
                "username": req.username,
                "center_id": "ALL"
            }
        raise HTTPException(status_code=401, detail="Invalid NTA credentials")

    elif req.role == "center_officer":
        if req.username == "officer" and req.password == "officer@2026":
            center_id = req.center_id or "RJ-042"
            result = await db.execute(select(Center).where(Center.id == center_id))
            center = result.scalar_one_or_none()
            if not center:
                raise HTTPException(status_code=404, detail="Center not found")
            return {
                "status": "authenticated",
                "role": "center_officer",
                "username": req.username,
                "center_id": center_id
            }
        raise HTTPException(status_code=401, detail="Invalid Officer credentials")

    elif req.role == "invigilator":
        if req.username == "invigilator" and req.password == "invigilator@2026":
            center_id = req.center_id or "MH-001"
            result = await db.execute(select(Center).where(Center.id == center_id))
            center = result.scalar_one_or_none()
            if not center:
                raise HTTPException(status_code=404, detail="Center not found")
            if not center.is_active:
                raise HTTPException(status_code=403, detail="Center is locked by Kill Switch")
            return {
                "status": "authenticated",
                "role": "invigilator",
                "username": req.username,
                "center_id": center_id
            }
        raise HTTPException(status_code=401, detail="Invalid Invigilator credentials")

    raise HTTPException(status_code=400, detail="Invalid role specified")
