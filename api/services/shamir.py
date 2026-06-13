from Crypto.Protocol.SecretSharing import Shamir

def split_key(key: bytes, k: int, n: int) -> list[tuple[int, bytes]]:
    shares = Shamir.split(k, n, key)
    return [(idx, share) for idx, share in shares]

def combine_keys(shares: list[tuple[int, bytes]]) -> bytes:
    return Shamir.combine(shares)
