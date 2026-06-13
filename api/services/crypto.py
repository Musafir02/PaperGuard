import base64
import hashlib
from Crypto.Cipher import AES

def encrypt_data(data: str, key: str) -> str:
    key_bytes = hashlib.sha256(key.encode()).digest()
    cipher = AES.new(key_bytes, AES.MODE_GCM)
    ciphertext, tag = cipher.encrypt_and_digest(data.encode("utf-8"))
    result = cipher.nonce + tag + ciphertext
    return base64.b64encode(result).decode("utf-8")

def decrypt_data(enc_data: str, key: str) -> str:
    key_bytes = hashlib.sha256(key.encode()).digest()
    raw = base64.b64decode(enc_data.encode("utf-8"))
    nonce = raw[:16]
    tag = raw[16:32]
    ciphertext = raw[32:]
    cipher = AES.new(key_bytes, AES.MODE_GCM, nonce=nonce)
    return cipher.decrypt_and_verify(ciphertext, tag).decode("utf-8")
