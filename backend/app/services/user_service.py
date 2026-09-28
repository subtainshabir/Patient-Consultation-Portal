from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.user import User, UserRole
from app.schemas.user import UserCreate
from app.core.security import get_password_hash


def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email.ilike(email)).first()


def get_user_by_username(db: Session, username: str) -> Optional[User]:
    return db.query(User).filter(User.username.ilike(username)).first()


def get_user_by_identifier(db: Session, identifier: str) -> Optional[User]:
    """
    Looks up user by either case-insensitive email or username.
    """
    clean_identifier = identifier.strip().lower()
    return db.query(User).filter(
        or_(
            User.email.ilike(clean_identifier),
            User.username.ilike(clean_identifier)
        )
    ).first()


def create_user(db: Session, user_in: UserCreate) -> User:
    hashed_password = get_password_hash(user_in.password)
    db_user = User(
        email=user_in.email.lower().strip(),
        username=user_in.username.lower().strip(),
        hashed_password=hashed_password,
        full_name=user_in.full_name.strip(),
        role=user_in.role,
        is_active=user_in.is_active
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user
