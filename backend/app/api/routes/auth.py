import re
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models.user import User, UserRole
from app.schemas.auth import LoginRequest, TokenResponse, SetupStatusResponse, AdminSetupRequest
from app.schemas.user import UserResponse
from app.services.auth_service import authenticate_user
from app.core.security import create_access_token, get_password_hash

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.get("/setup-status", response_model=SetupStatusResponse)
def get_setup_status(db: Session = Depends(get_db)):
    """
    Check if the initial administrator setup is required.
    Returns setup_required=True if no active Admin account exists in the database.
    """
    admin_count = db.query(User).filter(User.role == UserRole.ADMIN, User.is_active == True).count()
    setup_required = admin_count == 0
    return SetupStatusResponse(
        setup_required=setup_required,
        message="Initial administrator setup is required." if setup_required else "Administrator setup already completed."
    )


@router.post("/setup-admin", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def setup_initial_admin(data: AdminSetupRequest, db: Session = Depends(get_db)):
    """
    Create the first administrator account if no active admin exists.
    Permanently locked once an admin account is established.
    """
    # Verify setup lock
    admin_count = db.query(User).filter(User.role == UserRole.ADMIN, User.is_active == True).count()
    if admin_count > 0:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Initial administrator setup has already been completed. Setup is locked."
        )

    # Validate username
    username_clean = data.username.strip().lower()
    if len(username_clean) < 3 or len(username_clean) > 50:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Username must be between 3 and 50 characters."
        )
    if not re.match(r"^[a-zA-Z0-9_\-]+$", username_clean):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Username may only contain letters, numbers, underscores, and hyphens."
        )

    # Check username uniqueness (case-insensitive)
    existing_user = db.query(User).filter(User.username.ilike(username_clean)).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this username already exists."
        )

    # Validate password
    if len(data.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Password must be at least 8 characters in length."
        )

    full_name = data.full_name.strip() if data.full_name and data.full_name.strip() else f"Admin {username_clean.capitalize()}"
    email = str(data.email).strip().lower() if data.email else f"{username_clean}@clinic.portal"

    # Ensure email uniqueness if fallback collides
    if db.query(User).filter(User.email.ilike(email)).first():
        email = f"{username_clean}_{int(datetime.now().timestamp())}@clinic.portal"

    hashed_pw = get_password_hash(data.password)
    admin_user = User(
        username=username_clean,
        email=email,
        full_name=full_name,
        hashed_password=hashed_pw,
        role=UserRole.ADMIN,
        is_active=True
    )
    db.add(admin_user)
    db.commit()
    db.refresh(admin_user)
    return UserResponse.model_validate(admin_user)



@router.post("/login", response_model=TokenResponse)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate user and return JWT access token.
    Generic error returned on failure to prevent user enumeration.
    """
    user = authenticate_user(
        db,
        identifier=login_data.username_or_email,
        password=login_data.password
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(subject=user.id)
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@router.get("/me", response_model=UserResponse)
def get_current_authenticated_user(current_user: User = Depends(get_current_user)):
    """
    Get profile information of the currently authenticated user.
    """
    return UserResponse.model_validate(current_user)


@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    """
    Acknowledge user logout.
    Client clears local storage / tokens upon this call.
    """
    return {
        "success": True,
        "message": "Successfully logged out."
    }
