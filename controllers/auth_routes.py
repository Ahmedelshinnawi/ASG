from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import Annotated

from models.database import get_db, User
from models.auth_models import (
    UserCreate, Token, User as UserResponse, PasswordResetRequest, 
    PasswordReset, UserUpdate, UserProfileResponse
)
from models.auth_utils import (
    create_access_token, authenticate_user, get_user_by_username, 
    get_user_by_email, create_user, verify_token, generate_reset_token,
    update_reset_token, reset_user_password, update_user_profile,
    update_user_password, get_user_stats, delete_user, ACCESS_TOKEN_EXPIRE_MINUTES
)

router = APIRouter(prefix="/auth", tags=["authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)], db: Session = Depends(get_db)):
    """Get current authenticated user."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    username = verify_token(token)
    if username is None:
        raise credentials_exception
    
    user = get_user_by_username(db, username=username)
    if user is None:
        raise credentials_exception
    
    return user

@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user."""
    # Check if username already exists
    if get_user_by_username(db, user_data.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Check if email already exists
    if get_user_by_email(db, user_data.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    user = create_user(db, user_data.username, user_data.email, user_data.password)
    return user

@router.post("/login", response_model=Token)
async def login(form_data: Annotated[OAuth2PasswordRequestForm, Depends()], db: Session = Depends(get_db)):
    """Login user and return access token."""
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: Annotated[User, Depends(get_current_user)]):
    """Get current user information."""
    return current_user

@router.post("/request-password-reset")
async def request_password_reset(request: PasswordResetRequest, db: Session = Depends(get_db)):
    """Request password reset token."""
    user = get_user_by_email(db, request.email)
    if not user:
        # Don't reveal if email exists or not for security
        return {"message": "If the email exists, a reset token has been sent"}
    
    reset_token = generate_reset_token()
    update_reset_token(db, user, reset_token)
    
    # In a real application, you would send this token via email
    # For demo purposes, we'll return it (remove this in production)
    return {
        "message": "Password reset token generated",
        "reset_token": reset_token  # Remove this in production!
    }

@router.post("/reset-password")
async def reset_password(reset_data: PasswordReset, db: Session = Depends(get_db)):
    """Reset password using reset token."""
    success = reset_user_password(db, reset_data.reset_token, reset_data.new_password)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    return {"message": "Password reset successfully"}

@router.get("/profile", response_model=UserProfileResponse)
async def get_profile(current_user: Annotated[User, Depends(get_current_user)], db: Session = Depends(get_db)):
    """Get current user profile with statistics."""
    stats = get_user_stats(db, current_user.id)
    
    return UserProfileResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        full_name=current_user.full_name,
        bio=current_user.bio,
        is_active=current_user.is_active,
        is_admin=current_user.is_admin or False,  # Handle None case
        created_at=current_user.created_at,
        total_stories=stats["total_stories"],
        favorite_stories=stats["favorite_stories"],
        profile_picture=current_user.profile_picture
    )

@router.put("/profile", response_model=UserProfileResponse)
async def update_profile(
    profile_data: UserUpdate, 
    current_user: Annotated[User, Depends(get_current_user)], 
    db: Session = Depends(get_db)
):
    """Update user profile information."""
    try:
        # Handle password update separately if provided
        if profile_data.current_password and profile_data.new_password:
            update_user_password(db, current_user, profile_data.current_password, profile_data.new_password)
        
        # Update profile information
        updated_user = update_user_profile(
            db, 
            current_user, 
            username=profile_data.username,
            email=profile_data.email,
            full_name=profile_data.full_name,
            bio=profile_data.bio,
            profile_picture=profile_data.profile_picture
        )
        
        # Get updated stats
        stats = get_user_stats(db, updated_user.id)
        
        return UserProfileResponse(
            id=updated_user.id,
            username=updated_user.username,
            email=updated_user.email,
            full_name=updated_user.full_name,
            bio=updated_user.bio,
            is_active=updated_user.is_active,
            is_admin=updated_user.is_admin or False,  # Handle None case
            created_at=updated_user.created_at,
            total_stories=stats["total_stories"],
            favorite_stories=stats["favorite_stories"],
            profile_picture=updated_user.profile_picture
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.put("/password")
async def change_password(
    password_data: UserUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """Change user password."""
    if not password_data.current_password or not password_data.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Both current_password and new_password are required"
        )
    
    try:
        update_user_password(db, current_user, password_data.current_password, password_data.new_password)
        return {"message": "Password updated successfully"}
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.delete("/account")
async def delete_account(
    password_data: dict,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """Delete user account after password verification."""
    password = password_data.get("password")
    if not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password is required for account deletion"
        )
    
    try:
        delete_user(db, current_user, password)
        return {"message": "Account deleted successfully"}
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        ) 