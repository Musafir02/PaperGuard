import pyotp
import os


def generate_totp_secret() -> str:
    return pyotp.random_base32()


def get_totp(secret: str, interval: int = 90) -> pyotp.TOTP:
    return pyotp.TOTP(secret, interval=interval)


def verify_totp(secret: str, code: str, interval: int = 90) -> bool:
    totp = get_totp(secret, interval)
    return totp.verify(code, valid_window=1)


def get_current_code(secret: str, interval: int = 90) -> str:
    totp = get_totp(secret, interval)
    return totp.now()
