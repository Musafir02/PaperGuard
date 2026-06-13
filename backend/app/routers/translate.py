import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services.audit_chain import create_audit_event
from app.services.translate_render import render_translated_version

router = APIRouter(prefix="/api/v1/pipeline/translate", tags=["translate"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("")
async def translate_paper(
    languages: str = Form(...),
    image: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    lang_list = [l.strip() for l in languages.split(",") if l.strip()]
    if not lang_list:
        raise HTTPException(status_code=400, detail="No languages specified")

    image_bytes = await image.read()
    source_filename = f"master_{uuid.uuid4().hex[:8]}.png"
    source_path = os.path.join(UPLOAD_DIR, source_filename)
    with open(source_path, "wb") as f:
        f.write(image_bytes)

    results = []
    for lang in lang_list:
        batch_id = f"TRANS-{uuid.uuid4().hex[:8].upper()}"
        out_filename = f"trans_{lang.lower()}_{uuid.uuid4().hex[:6]}.png"
        out_path = os.path.join(UPLOAD_DIR, out_filename)
        render_translated_version(source_path, out_path, lang)

        results.append({
            "language": lang,
            "batch_id": batch_id,
            "image_url": f"/uploads/{out_filename}",
            "status": "completed",
        })

    await create_audit_event(
        db, "TRANSLATE",
        payload=f"languages={','.join(lang_list)}|count={len(lang_list)}",
    )

    return {
        "status": "translated",
        "source_image": f"/uploads/{source_filename}",
        "count": len(results),
        "papers": results,
    }
