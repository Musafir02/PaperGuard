from contextlib import asynccontextmanager
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.database import init_db
from app.routers import auth, centers, translate, watermark, preprint, killswitch, audit, telegram_hunter, translator_shield


UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="PaperGuard",
    description="Exam paper security pipeline",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(centers.router)
app.include_router(translate.router)
app.include_router(watermark.router)
app.include_router(preprint.router)
app.include_router(killswitch.router)
app.include_router(audit.router)
app.include_router(telegram_hunter.router)
app.include_router(translator_shield.router)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


@app.get("/api/v1/health")
async def health():
    return {"status": "ok", "service": "paperguard"}
