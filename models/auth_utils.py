from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from .database import User
import os
import secrets
import base64
import re

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-this-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a password."""
    return pwd_context.hash(password)

def validate_password_strength(password: str) -> tuple[bool, str]:
    """Validate password strength according to security requirements."""
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if not re.search(r'[a-zA-Z]', password):
        return False, "Password must contain at least one letter"
    
    if not re.search(r'\d', password):
        return False, "Password must contain at least one number"
    
    if not re.search(r'[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?]', password):
        return False, "Password must contain at least one special character (!@#$%^&*)"
    
    return True, "Password meets all requirements"

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str):
    """Verify and decode a JWT token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None
        return username
    except JWTError:
        return None

def generate_reset_token() -> str:
    """Generate a secure reset token."""
    return secrets.token_urlsafe(32)

def get_user_by_username(db: Session, username: str):
    """Get user by username."""
    return db.query(User).filter(User.username == username).first()

def get_user_by_email(db: Session, email: str):
    """Get user by email."""
    return db.query(User).filter(User.email == email).first()

def create_user(db: Session, username: str, email: str, password: str):
    """Create a new user."""
    # Validate password strength
    is_valid, message = validate_password_strength(password)
    if not is_valid:
        raise ValueError(message)
    
    hashed_password = get_password_hash(password)
    db_user = User(
        username=username,
        email=email,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def authenticate_user(db: Session, username: str, password: str):
    """Authenticate a user."""
    user = get_user_by_username(db, username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

def update_reset_token(db: Session, user: User, reset_token: str):
    """Update user's reset token."""
    user.reset_token = reset_token
    user.reset_token_expires = datetime.utcnow() + timedelta(hours=1)  # Token expires in 1 hour
    db.commit()
    return user

def reset_user_password(db: Session, reset_token: str, new_password: str):
    """Reset user password using reset token."""
    user = db.query(User).filter(
        User.reset_token == reset_token,
        User.reset_token_expires > datetime.utcnow()
    ).first()
    
    if not user:
        return False
    
    # Validate new password strength
    is_valid, message = validate_password_strength(new_password)
    if not is_valid:
        raise ValueError(message)
    
    user.hashed_password = get_password_hash(new_password)
    user.reset_token = None
    user.reset_token_expires = None
    db.commit()
    return True

def validate_base64_image(base64_string: str) -> bool:
    """Validate if a string is a valid base64 encoded image."""
    try:
        if not base64_string:
            return False
        
        # Check if it has data URL prefix
        if base64_string.startswith('data:image/'):
            # Extract the base64 part after the comma
            base64_part = base64_string.split(',')[1] if ',' in base64_string else base64_string
        else:
            base64_part = base64_string
        
        # Try to decode
        decoded = base64.b64decode(base64_part)
        
        # Check if it's a valid image format by looking at file headers
        image_signatures = [
            b'\xff\xd8\xff',  # JPEG
            b'\x89PNG\r\n\x1a\n',  # PNG
            b'GIF87a',  # GIF87a
            b'GIF89a',  # GIF89a
            b'RIFF',  # WebP (starts with RIFF)
        ]
        
        return any(decoded.startswith(sig) for sig in image_signatures)
    except Exception:
        return False

def update_user_profile(db: Session, user: User, username: Optional[str] = None, email: Optional[str] = None, full_name: Optional[str] = None, bio: Optional[str] = None, profile_picture: Optional[str] = None):
    """Update user profile information (username, email, full_name, bio, and/or profile picture)."""
    updated = False
    
    if username and username != user.username:
        # Check if username is already taken
        existing_user = get_user_by_username(db, username)
        if existing_user and existing_user.id != user.id:
            raise ValueError("Username already taken")
        user.username = username
        updated = True
    
    if email and email != user.email:
        # Check if email is already taken
        existing_user = get_user_by_email(db, email)
        if existing_user and existing_user.id != user.id:
            raise ValueError("Email already taken")
        user.email = email
        updated = True
    
    if full_name is not None:
        user.full_name = full_name if full_name.strip() else None
        updated = True
    
    if bio is not None:
        user.bio = bio if bio.strip() else None
        updated = True
    
    if profile_picture is not None:
        if profile_picture == "":
            # Empty string means remove profile picture
            user.profile_picture = None
            updated = True
        else:
            # Validate the base64 image
            if not validate_base64_image(profile_picture):
                raise ValueError("Invalid image format. Please upload a valid PNG, JPEG, or GIF image.")
            
            # Check size (limit to 5MB when decoded)
            try:
                if profile_picture.startswith('data:image/'):
                    base64_part = profile_picture.split(',')[1]
                else:
                    base64_part = profile_picture
                
                decoded_size = len(base64.b64decode(base64_part))
                if decoded_size > 5 * 1024 * 1024:  # 5MB limit
                    raise ValueError("Image size too large. Please upload an image smaller than 5MB.")
            except Exception:
                raise ValueError("Invalid image data.")
            
            user.profile_picture = profile_picture
            updated = True
    
    if updated:
        db.commit()
        db.refresh(user)
    
    return user

def update_user_password(db: Session, user: User, current_password: str, new_password: str):
    """Update user password after verifying current password."""
    if not verify_password(current_password, user.hashed_password):
        raise ValueError("Current password is incorrect")
    
    # Validate new password strength
    is_valid, message = validate_password_strength(new_password)
    if not is_valid:
        raise ValueError(message)
    
    user.hashed_password = get_password_hash(new_password)
    db.commit()
    return user

def get_user_stats(db: Session, user_id: int):
    """Get user statistics including total stories and favorites count."""
    from .database import GeneratedContent
    
    total_stories = db.query(GeneratedContent).filter(GeneratedContent.user_id == user_id).count()
    favorite_stories = db.query(GeneratedContent).filter(
        GeneratedContent.user_id == user_id,
        GeneratedContent.is_favorite == True
    ).count()
    
    return {
        "total_stories": total_stories,
        "favorite_stories": favorite_stories
    }

def delete_user(db: Session, user: User, password: str):
    """Delete user account after verifying password."""
    # Verify password before deletion
    if not verify_password(password, user.hashed_password):
        raise ValueError("Password is incorrect")
    
    # Import here to avoid circular imports
    from .database import GeneratedContent
    
    # Delete all user's generated content first
    user_content = db.query(GeneratedContent).filter(GeneratedContent.user_id == user.id).all()
    for content in user_content:
        db.delete(content)
    
    # Delete the user
    db.delete(user)
    db.commit()
    
    return True 