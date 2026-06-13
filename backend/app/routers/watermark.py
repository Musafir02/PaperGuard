import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.models import WatermarkRecord, Student, Center
from app.services.watermark_dct import embed_watermark_dct, decode_watermark_dct, embed_printer_fingerprint, decode_printer_fingerprint
from app.services.audit_chain import create_audit_event

router = APIRouter(prefix="/api/v1/pipeline", tags=["watermark"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/watermark")
async def watermark_paper(
    roll_no: str,
    center_id: str,
    image: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    student_result = await db.execute(
        select(Student).where(Student.roll_no == roll_no)
    )
    student = student_result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    batch_id = f"BATCH-{uuid.uuid4().hex[:8].upper()}"
    filename = f"wm_{roll_no}_{uuid.uuid4().hex[:8]}.png"
    output_path = os.path.join(UPLOAD_DIR, filename)

    image_bytes = await image.read()
    input_path = os.path.join(UPLOAD_DIR, f"input_{uuid.uuid4().hex[:8]}.png")
    with open(input_path, "wb") as f:
        f.write(image_bytes)

    embed_watermark_dct(input_path, roll_no, output_path)

    record = WatermarkRecord(
        student_id=student.id,
        roll_no=roll_no,
        center_id=center_id,
        batch_id=batch_id,
        image_path=output_path,
    )
    db.add(record)
    await db.commit()

    await create_audit_event(
        db, "WATERMARK_EMBED", roll_no=roll_no, center_id=center_id,
        payload=f"batch={batch_id}",
    )

    return {
        "status": "watermarked",
        "roll_no": roll_no,
        "center_id": center_id,
        "batch_id": batch_id,
        "image_path": output_path,
    }


@router.post("/watermark/printer-fp")
async def embed_printer_fingerprint_endpoint(
    center_id: str,
    press_id: str,
    batch_id: str,
    time_window: str,
    image: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    fingerprint_data = f"{press_id}|{batch_id}|{time_window}"
    filename = f"fp_{center_id}_{uuid.uuid4().hex[:8]}.png"
    output_path = os.path.join(UPLOAD_DIR, filename)

    image_bytes = await image.read()
    input_path = os.path.join(UPLOAD_DIR, f"fp_input_{uuid.uuid4().hex[:8]}.png")
    with open(input_path, "wb") as f:
        f.write(image_bytes)

    embed_printer_fingerprint(input_path, fingerprint_data, output_path)

    await create_audit_event(
        db, "PRINTER_FP_EMBED", center_id=center_id,
        payload=f"press={press_id}|batch={batch_id}|window={time_window}",
    )

    return {
        "status": "fingerprint_embedded",
        "center_id": center_id,
        "press_id": press_id,
        "batch_id": batch_id,
        "time_window": time_window,
        "image_path": output_path,
    }


@router.post("/decode")
async def decode_image(
    image: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    filename = f"decode_{uuid.uuid4().hex[:8]}.png"
    input_path = os.path.join(UPLOAD_DIR, filename)

    image_bytes = await image.read()
    with open(input_path, "wb") as f:
        f.write(image_bytes)

    watermark_data = decode_watermark_dct(input_path)
    fingerprint_data = decode_printer_fingerprint(input_path)

    result = {
        "watermark": {"decoded": bool(watermark_data), "data": watermark_data},
        "fingerprint": {"decoded": bool(fingerprint_data), "data": fingerprint_data},
    }

    if watermark_data:
        parts = watermark_data.split("|")
        result["watermark"]["roll_no"] = parts[0] if parts else ""
        if len(parts) > 1:
            result["watermark"]["center_id"] = parts[1]

    if fingerprint_data:
        parts = fingerprint_data.split("|")
        result["fingerprint"]["press_id"] = parts[0] if parts else ""
        if len(parts) > 1:
            result["fingerprint"]["batch_id"] = parts[1]
        if len(parts) > 2:
            result["fingerprint"]["time_window"] = parts[2]

    await create_audit_event(
        db, "FORENSIC_DECODE",
        payload=f"watermark={bool(watermark_data)}|fingerprint={bool(fingerprint_data)}",
    )

    return result
