from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.models import Center, Student, CenterPhase, RiskLevel
from app.services.risk_scorer import calculate_risk_score
from app.services.totp_lock import generate_totp_secret

router = APIRouter(prefix="/api/v1", tags=["centers"])


@router.get("/center")
async def list_centers(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Center))
    centers = result.scalars().all()
    return [
        {
            "id": c.id,
            "name": c.name,
            "city": c.city,
            "state": c.state,
            "phase": c.phase.value,
            "risk_score": c.risk_score,
            "risk_level": c.risk_level.value,
            "latitude": c.latitude,
            "longitude": c.longitude,
            "is_active": c.is_active,
        }
        for c in centers
    ]


@router.get("/center/{center_id}")
async def get_center(center_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Center).where(Center.id == center_id))
    center = result.scalar_one_or_none()
    if not center:
        raise HTTPException(status_code=404, detail="Center not found")

    students_result = await db.execute(
        select(Student).where(Student.center_id == center_id)
    )
    students = students_result.scalars().all()

    return {
        "id": center.id,
        "name": center.name,
        "city": center.city,
        "state": center.state,
        "phase": center.phase.value,
        "risk_score": center.risk_score,
        "risk_level": center.risk_level.value,
        "latitude": center.latitude,
        "longitude": center.longitude,
        "students": [{"id": s.id, "roll_no": s.roll_no, "name": s.name} for s in students],
    }


@router.post("/center")
async def create_center(
    center_id: str,
    name: str,
    city: str,
    state: str,
    latitude: float = 0.0,
    longitude: float = 0.0,
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(select(Center).where(Center.id == center_id))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Center already exists")

    risk = calculate_risk_score(state, latitude=latitude, longitude=longitude)

    center = Center(
        id=center_id,
        name=name,
        city=city,
        state=state,
        latitude=latitude,
        longitude=longitude,
        risk_score=risk["score"],
        risk_level=RiskLevel(risk["level"]),
        totp_secret=generate_totp_secret(),
    )
    db.add(center)
    await db.commit()
    return {"status": "created", "center_id": center_id, "risk": risk}


@router.post("/center/{center_id}/risk-score")
async def recalculate_risk(center_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Center).where(Center.id == center_id))
    center = result.scalar_one_or_none()
    if not center:
        raise HTTPException(status_code=404, detail="Center not found")

    risk = calculate_risk_score(
        center.state,
        latitude=center.latitude,
        longitude=center.longitude,
    )
    center.risk_score = risk["score"]
    center.risk_level = RiskLevel(risk["level"])
    await db.commit()

    return {"center_id": center_id, "risk": risk}


@router.post("/center/{center_id}/phase")
async def update_phase(center_id: str, phase: CenterPhase, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Center).where(Center.id == center_id))
    center = result.scalar_one_or_none()
    if not center:
        raise HTTPException(status_code=404, detail="Center not found")

    center.phase = phase
    await db.commit()
    return {"center_id": center_id, "phase": phase.value}
