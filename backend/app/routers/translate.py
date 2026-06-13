import json
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from app.database import get_db
from app.services.audit_chain import create_audit_event

router = APIRouter(prefix="/api/v1/pipeline/translate", tags=["translate"])


class TranslateRequest(BaseModel):
    master_paper: dict
    languages: list[str]


@router.post("")
async def translate_paper(req: TranslateRequest, db: AsyncSession = Depends(get_db)):
    results = []
    for lang in req.languages:
        lang_paper = {
            "language": lang,
            "questions": req.master_paper.get("questions", []),
            "batch_id": f"TRANS-{uuid.uuid4().hex[:8].upper()}",
        }
        results.append(lang_paper)

    await create_audit_event(
        db, "TRANSLATE",
        payload=f"languages={','.join(req.languages)}",
    )

    return {
        "status": "translated",
        "languages": req.languages,
        "papers": results,
    }
