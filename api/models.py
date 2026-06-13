import enum
from datetime import datetime
from sqlalchemy import String, Integer, Float, DateTime, Enum, ForeignKey, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

try:
    from api.database import Base
except ImportError:
    from database import Base

class CenterPhase(str, enum.Enum):
    SEALED = "SEALED"
    QUORUM = "QUORUM"
    DECRYPTED = "DECRYPTED"
    PRINTING = "PRINTING"
    DISTRIBUTED = "DISTRIBUTED"

class RiskLevel(str, enum.Enum):
    PASS = "PASS"
    MONITOR = "MONITOR"
    FLAG = "FLAG"
    BLOCK = "BLOCK"

class AlertStatus(str, enum.Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    ESCALATED = "ESCALATED"

class Center(Base):
    __tablename__ = "centers"

    id: Mapped[str] = mapped_column(String(20), primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    city: Mapped[str] = mapped_column(String(100))
    state: Mapped[str] = mapped_column(String(100))
    latitude: Mapped[float] = mapped_column(Float, default=0.0)
    longitude: Mapped[float] = mapped_column(Float, default=0.0)
    phase: Mapped[CenterPhase] = mapped_column(Enum(CenterPhase), default=CenterPhase.SEALED)
    risk_score: Mapped[int] = mapped_column(Integer, default=0)
    risk_level: Mapped[RiskLevel] = mapped_column(Enum(RiskLevel), default=RiskLevel.PASS)
    totp_secret: Mapped[str] = mapped_column(String(64), default="")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    encrypted_paper_key: Mapped[str] = mapped_column(Text, default="")
    encrypted_paper_data: Mapped[str] = mapped_column(Text, default="")
    security_info: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    students: Mapped[list["Student"]] = relationship(back_populates="center")
    audit_events: Mapped[list["AuditEvent"]] = relationship(back_populates="center")

class Student(Base):
    __tablename__ = "students"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    roll_no: Mapped[str] = mapped_column(String(30), unique=True)
    name: Mapped[str] = mapped_column(String(200))
    center_id: Mapped[str] = mapped_column(ForeignKey("centers.id"))
    device_id: Mapped[str] = mapped_column(String(100), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    center: Mapped["Center"] = relationship(back_populates="center")
    watermarks: Mapped[list["WatermarkRecord"]] = relationship(back_populates="student")

class WatermarkRecord(Base):
    __tablename__ = "watermark_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"))
    roll_no: Mapped[str] = mapped_column(String(30))
    center_id: Mapped[str] = mapped_column(String(20))
    batch_id: Mapped[str] = mapped_column(String(50))
    press_id: Mapped[str] = mapped_column(String(50), default="")
    image_path: Mapped[str] = mapped_column(String(500), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    student: Mapped["Student"] = relationship(back_populates="watermarks")

class AuditEvent(Base):
    __tablename__ = "audit_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    event_type: Mapped[str] = mapped_column(String(50))
    roll_no: Mapped[str] = mapped_column(String(30), default="")
    center_id: Mapped[str] = mapped_column(String(20), ForeignKey("centers.id"), default="")
    payload: Mapped[str] = mapped_column(Text, default="")
    hmac_value: Mapped[str] = mapped_column(String(64))
    prev_hmac: Mapped[str] = mapped_column(String(64), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    center: Mapped["Center"] = relationship(back_populates="audit_events")

class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    channel_name: Mapped[str] = mapped_column(String(200))
    message_id: Mapped[int] = mapped_column(Integer, default=0)
    image_hash: Mapped[str] = mapped_column(String(64), default="")
    similarity_score: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[AlertStatus] = mapped_column(Enum(AlertStatus), default=AlertStatus.PENDING)
    description: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class TranslatorAccess(Base):
    __tablename__ = "translator_access"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    translator_id: Mapped[str] = mapped_column(String(50))
    section: Mapped[str] = mapped_column(String(50))
    device_id: Mapped[str] = mapped_column(String(100))
    issued_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    expires_at: Mapped[datetime] = mapped_column(DateTime)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    shard_data: Mapped[str] = mapped_column(Text, default="")
