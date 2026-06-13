import asyncio
from sqlalchemy import text
from api.database import async_session, init_db
from api.models import Center, Student, Alert, RiskLevel, AlertStatus
from api.services.totp_lock import generate_totp_secret
from api.services.risk_scorer import calculate_risk_score

CENTERS = [
    {
        "id": "MH-001",
        "name": "Vidyalankar Institute",
        "city": "Mumbai",
        "state": "Maharashtra",
        "lat": 19.0760,
        "lon": 72.8777,
        "security_info": "This center is located in Mumbai, Maharashtra and has a clean historical record with zero reported security incidents. The exam center is equipped with CCTV cameras covering all examination rooms, entry points, and printing areas. Security protocols require dual-officer authentication for decrypting exam papers. Invigilators have undergone comprehensive training on digital security measures."
    },
    {
        "id": "RJ-042",
        "name": "Allen Career Institute",
        "city": "Kota",
        "state": "Rajasthan",
        "lat": 25.2138,
        "lon": 75.8648,
        "security_info": "This center is located in Kota, Rajasthan and is marked as high monitoring status due to being in a known competitive examination coaching hub. It is equipped with advanced signal jammers, active CCTV feeds linked directly to the national control center, and biometric authentication for students. Invigilators are highly vetted external faculty members."
    },
    {
        "id": "RJ-087",
        "name": "Sikar Public School",
        "city": "Sikar",
        "state": "Rajasthan",
        "lat": 27.6094,
        "lon": 75.1399,
        "security_info": "This center is located in Sikar, Rajasthan and has had past security audits indicating minor compliance delays. It is under strict surveillance with local police guards stationed at all main gates. The decryption of physical exam papers requires active coordination with NTA coordinators and SMS OTP backups. Special observers have been deployed to oversee the process."
    },
    {
        "id": "BR-015",
        "name": "Patna Academy",
        "city": "Patna",
        "state": "Bihar",
        "lat": 25.6093,
        "lon": 85.1376,
        "security_info": "This center is located in Patna, Bihar and has been flagged with monitor risk levels due to regional historical trends of leak incidents. Security measures have been upgraded to include metal detectors, active radio frequency scanners, and face recognition check-ins for all staff. Paper decryption is prohibited until exactly two hours before the start."
    },
    {
        "id": "DL-003",
        "name": "Vidyamandir Classes",
        "city": "Delhi",
        "state": "Delhi",
        "lat": 28.7041,
        "lon": 77.1025,
        "security_info": "This center is located in Delhi, Delhi and has a consistent history of full compliance with national security guidelines. The exam rooms are monitored via continuous centralized CCTV video streaming. Thermal printers are configured with custom firmware to embed invisible margin fingerprints on every print job. High-speed local networks are completely air-gapped from the public internet."
    },
    {
        "id": "UP-029",
        "name": "Physics Wallah Center",
        "city": "Lucknow",
        "state": "Uttar Pradesh",
        "lat": 26.8467,
        "lon": 80.9462,
        "security_info": "This center is located in Lucknow, Uttar Pradesh and has been recently established with modern infrastructure. All security personnel are licensed private contractors. Secure paper storage is lock-locked and requires physical co-signing by both the center superintendent and local state observers. Backup electricity generators are installed to prevent any power failures."
    },
    {
        "id": "KA-011",
        "name": "Base Academy",
        "city": "Bangalore",
        "state": "Karnataka",
        "lat": 12.9716,
        "lon": 77.5946,
        "security_info": "This center is located in Bangalore, Karnataka and serves as a model exam center with state-of-the-art infrastructure. All invigilation staff have completed multi-factor authentication registration. Local network connections are encrypted using AES-256 and monitored by an active firewall to block unauthorized external traffic. Print rooms are physically isolated and require biometric check-ins."
    },
    {
        "id": "TN-008",
        "name": "FIITJEE Chennai",
        "city": "Chennai",
        "state": "Tamil Nadu",
        "lat": 13.0827,
        "lon": 80.2707,
        "security_info": "This center is located in Chennai, Tamil Nadu and is known for its excellent implementation of high-security protocols. Decryption key retrieval is restricted to double-quorum authentication. The physical margins of the papers are printed with localized security hashes. Local state police forces assist with safe transfer and storage of secure materials."
    }
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
    {
        "channel_name": "neet_leaks_2026",
        "message_id": 101,
        "similarity_score": 0.87,
        "status": AlertStatus.PENDING,
        "description": "A suspicious post was flagged on the neet_leaks_2026 public channel containing multiple leaked question papers for the upcoming competitive exams. The uploaded files match our digital watermarks from our designated printing presses, which indicates a high-priority leak that requires immediate forensic analysis to trace the source student roll numbers and revoke access before the national examination starts tomorrow morning."
    },
    {
        "channel_name": "exam_papers_free",
        "message_id": 205,
        "similarity_score": 0.92,
        "status": AlertStatus.CONFIRMED,
        "description": "A confirmed document leak was detected on the exam_papers_free channel containing complete high-resolution photos of the biology and physics sections. The digital watermarks extracted from the images match the security credentials issued for the examination centers in Rajasthan. Forensic decryption of the margin patterns shows high correlation with printing batch number 42."
    },
    {
        "channel_name": "study_material_grp",
        "message_id": 312,
        "similarity_score": 0.65,
        "status": AlertStatus.PENDING,
        "description": "A pending alert was generated after an image with question paper formatting was uploaded to the study_material_grp channel. Preliminary visual comparisons and perceptual hashing suggest that this image contains mock test questions rather than active exam content. However, we are conducting a secondary scan to verify that no authentic watermark blocks are embedded in the file."
    }
]

async def seed():
    await init_db()
    async with async_session() as db:
        await db.execute(text("DELETE FROM audit_events"))
        await db.execute(text("DELETE FROM watermark_records"))
        await db.execute(text("DELETE FROM translator_access"))
        await db.execute(text("DELETE FROM alerts"))
        await db.execute(text("DELETE FROM students"))
        await db.execute(text("DELETE FROM centers"))
        await db.commit()

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
                security_info=c["security_info"]
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
                description=a["description"]
            )
            db.add(alert)

        await db.commit()
        print(f"Seeded {len(CENTERS)} centers, {len(STUDENTS)} students, {len(ALERTS)} alerts")

if __name__ == "__main__":
    asyncio.run(seed())
