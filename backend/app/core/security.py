import hashlib
import hmac
import os
import base64
from datetime import datetime, timedelta, timezone
from typing import Any, Union, Optional
from jose import jwt, JWTError
from app.core.config import settings

# Salt and hash functions using standard PBKDF2-HMAC-SHA256
# Reliable across all Python versions and platforms without binary dependency issues
ITERATIONS = 120_000
HASH_NAME = "sha256"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies a plain password against a stored hash formatted as:
    algorithm$iterations$salt$hash
    """
    try:
        parts = hashed_password.split("$")
        if len(parts) != 4:
            return False
        algo, iter_str, salt_b64, hash_b64 = parts
        iterations = int(iter_str)
        salt = base64.b64decode(salt_b64)
        expected_hash = base64.b64decode(hash_b64)

        computed_hash = hashlib.pbkdf2_hmac(
            algo,
            plain_password.encode("utf-8"),
            salt,
            iterations
        )
        return hmac.compare_digest(computed_hash, expected_hash)
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    """
    Hashes a password with a fresh random 16-byte salt using PBKDF2-HMAC-SHA256.
    """
    salt = os.urandom(16)
    computed_hash = hashlib.pbkdf2_hmac(
        HASH_NAME,
        password.encode("utf-8"),
        salt,
        ITERATIONS
    )
    salt_b64 = base64.b64encode(salt).decode("ascii")
    hash_b64 = base64.b64encode(computed_hash).decode("ascii")
    return f"{HASH_NAME}${ITERATIONS}${salt_b64}${hash_b64}"


def create_access_token(subject: Union[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Generates a signed JWT access token.
    """
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "iat": datetime.now(timezone.utc)
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """
    Decodes and validates a JWT access token.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None
