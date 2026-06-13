import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from app.database import async_session, init_db
from app.models.models import Center, Student, AuditEvent, Alert, RiskLevel, CenterPhase, AlertStatus
from app.services.totp_lock import generate_totp_secret
from app.services.risk_scorer import calculate_risk_score


CENTERS = [
    {"id": "MH-001", "name": "Vidyalankar Institute", "city": "Mumbai", "state": "Maharashtra", "lat": 19.0760, "lon": 72.8777},
    {"id": "RJ-042", "name": "Allen Career Institute", "city": "Kota", "state": "Rajasthan", "lat": 25.2138, "lon": 75.8648},
    {"id": "RJ-087", "name": "Sikar Public School", "city": "Sikar", "state": "Rajasthan", "lat": 27.6094, "lon": 75.1399},
    {"id": "BR-015", "name": "Patna Academy", "city": "Patna", "state": "Bihar", "lat": 25.6093, "lon": 85.1376},
    {"id": "DL-003", "name": "Vidyamandir Classes", "city": "Delhi", "state": "Delhi", "lat": 28.7041, "lon": 77.1025},
    {"id": "UP-029", "name": "Physics Wallah Center", "city": "Lucknow", "state": "Uttar Pradesh", "lat": 26.8467, "lon": 80.9462},
    {"id": "KA-011", "name": "Base Academy", "city": "Bangalore", "state": "Karnataka", "lat": 12.9716, "lon": 77.5946},
    {"id": "TN-008", "name": "FIITJEE Chennai", "city": "Chennai", "state": "Tamil Nadu", "lat": 13.0827, "lon": 80.2707},
]

STUDENTS = [
    {"roll_no": "NEET2026-0001", "name": "Aarav Sharma", "center_id": "MH-001"},
    {"roll_no": "NEET2026-0002", "name": "Priya Patel", "center_id": "MH-001"},
    {"roll_no": "NEET2026-0003", "name": "Rohit Kumar", "center_id": "RJ-042"},
    {"roll_no": "NEET2026-0004", "name": "Sneha Gupta", "center_id": "RJ-042"},
    {"roll_no": "NEET2026-0005", "name": "Amit Singh", "center_id": "RJ-087"},
    {"roll_no": "NEET2026-0006", "name": "Deepa Nair", "center_id": "BR-015"},
    {"roll_no": "NEET2026-0007", "name": "Vikram Rao", "center_id": "DL-003"},
    {"roll_no": "NEET2026-0008", "name": "Ananya Das", "center_id": "UP-029"},
    {"roll_no": "NEET2026-0009", "name": "Karthik Menon", "center_id": "KA-011"},
    {"roll_no": "NEET2026-0010", "name": "Lakshmi Iyer", "center_id": "TN-008"},
]

ALERTS = [
    {"channel_name": "neet_leaks_2026", "message_id": 101, "similarity_score": 0.87, "status": AlertStatus.PENDING},
    {"channel_name": "exam_papers_free", "message_id": 205, "similarity_score": 0.92, "status": AlertStatus.CONFIRMED},
    {"channel_name": "study_material_grp", "message_id": 312, "similarity_score": 0.65, "status": AlertStatus.PENDING},
]


async def seed():
    await init_db()
    async with async_session() as db:
        for c in CENTERS:
            risk = calculate_risk_score(c["state"], latitude=c["lat"], longitude=c["lon"])
            center = Center(
                id=c["id"],
                name=c["name"],
                city=c["city"],
                state=c["state"],
                latitude=c["lat"],
                longitude=c["lon"],
                risk_score=risk["score"],
                risk_level=RiskLevel(risk["level"]),
                totp_secret=generate_totp_secret(),
            )
            db.add(center)

        for s in STUDENTS:
            student = Student(
                roll_no=s["roll_no"],
                name=s["name"],
                center_id=s["center_id"],
            )
            db.add(student)

        for a in ALERTS:
            alert = Alert(
                channel_name=a["channel_name"],
                message_id=a["message_id"],
                similarity_score=a["similarity_score"],
                status=a["status"],
            )
            db.add(alert)

        await db.commit()
        print(f"Seeded {len(CENTERS)} centers, {len(STUDENTS)} students, {len(ALERTS)} alerts")


if __name__ == "__main__":
    asyncio.run(seed())
