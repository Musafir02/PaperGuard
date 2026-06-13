import os
from datetime import datetime, timedelta
from Crypto.Cipher import AES
from Crypto.Random import get_random_bytes
import hashlib
import base64


def generate_aes_key() -> bytes:
    return get_random_bytes(32)


def encrypt_data(data: bytes, key: bytes) -> dict:
    cipher = AES.new(key, AES.MODE_GCM)
    ciphertext, tag = cipher.encrypt_and_digest(data)
    return {
        "ciphertext": base64.b64encode(ciphertext).decode(),
        "nonce": base64.b64encode(cipher.nonce).decode(),
        "tag": base64.b64encode(tag).decode(),
    }


def decrypt_data(encrypted: dict, key: bytes) -> bytes:
    cipher = AES.new(
        key,
        AES.MODE_GCM,
        nonce=base64.b64decode(encrypted["nonce"]),
    )
    return cipher.decrypt_and_verify(
        base64.b64decode(encrypted["ciphertext"]),
        base64.b64decode(encrypted["tag"]),
    )


def compute_sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def verify_sha256(data: bytes, expected_hash: str) -> bool:
    return compute_sha256(data) == expected_hash
