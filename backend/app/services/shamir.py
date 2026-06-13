from Crypto.Protocol.SecretSharing import Shamir

def split_secret(secret: bytes, threshold: int, total_shares: int) -> list[tuple[int, bytes]]:
    if len(secret) != 16:
        raise ValueError("Secret must be exactly 16 bytes")
    return Shamir.split(threshold, total_shares, secret)

def combine_shares(shares: list[tuple[int, bytes]]) -> bytes:
    return Shamir.combine(shares)
