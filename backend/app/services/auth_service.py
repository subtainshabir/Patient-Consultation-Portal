from typing import Optional
from sqlalchemy.orm import Session
from app.models.user import User
from app.services.user_service import get_user_by_identifier
from app.core.security import verify_password


def authenticate_user(db: Session, identifier: str, password: str) -> Optional[User]:
    """
    Authenticates a user by email/username and password.
    Returns the user if valid and active, otherwise None.
    Does not leak whether the username exists.
    """
    user = get_user_by_identifier(db, identifier)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    if not user.is_active:
        return None
    return user
