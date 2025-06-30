import base64
import io
from PIL import Image
from sqlalchemy.orm import Session
from models.database import GeneratedContent, User, SystemStory
from typing import Optional, List
from datetime import datetime

def image_to_base64(image: Image.Image, format: str = "PNG") -> str:
    """Convert PIL Image to base64 string"""
    buffer = io.BytesIO()
    image.save(buffer, format=format)
    img_str = base64.b64encode(buffer.getvalue()).decode()
    return img_str

def base64_to_image(base64_str: str) -> Image.Image:
    """Convert base64 string back to PIL Image"""
    img_data = base64.b64decode(base64_str)
    img_buffer = io.BytesIO(img_data)
    image = Image.open(img_buffer)
    return image

def save_generated_content(db: Session, user_id: int, prompt: str, generated_text: str, image):
    """Save generated content to database with base64 encoded image."""
    # Convert PIL image to base64
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    image_data = base64.b64encode(buffer.getvalue()).decode()
    
    db_content = GeneratedContent(
        user_id=user_id,
        prompt=prompt,
        generated_text=generated_text,
        image_data=image_data,
        image_format="PNG"
    )
    db.add(db_content)
    db.commit()
    db.refresh(db_content)
    return db_content

def get_user_content(db: Session, user_id: int, limit: int = 10):
    """Get user's content generation history."""
    return db.query(GeneratedContent).filter(
        GeneratedContent.user_id == user_id
    ).order_by(GeneratedContent.created_at.desc()).limit(limit).all()

def get_latest_user_content(db: Session, user_id: int):
    """Get the latest generated content for a user."""
    return db.query(GeneratedContent).filter(
        GeneratedContent.user_id == user_id
    ).order_by(GeneratedContent.created_at.desc()).first()

def get_content_by_id(db: Session, content_id: int, user_id: int):
    """Get specific content by ID for a user."""
    return db.query(GeneratedContent).filter(
        GeneratedContent.id == content_id,
        GeneratedContent.user_id == user_id
    ).first()

def delete_user_content(db: Session, content_id: int, user_id: int):
    """Delete user's content by ID."""
    content = db.query(GeneratedContent).filter(
        GeneratedContent.id == content_id,
        GeneratedContent.user_id == user_id
    ).first()
    
    if content:
        db.delete(content)
        db.commit()
        return True
    return False

def toggle_favorite_status(db: Session, content_id: int, user_id: int):
    """Toggle the favorite status of a content item."""
    content = db.query(GeneratedContent).filter(
        GeneratedContent.id == content_id,
        GeneratedContent.user_id == user_id
    ).first()
    
    if content:
        content.is_favorite = not content.is_favorite
        db.commit()
        db.refresh(content)
        return content
    return None

def set_favorite_status(db: Session, content_id: int, user_id: int, is_favorite: bool):
    """Set the favorite status of a content item."""
    content = db.query(GeneratedContent).filter(
        GeneratedContent.id == content_id,
        GeneratedContent.user_id == user_id
    ).first()
    
    if content:
        content.is_favorite = is_favorite
        db.commit()
        db.refresh(content)
        return content
    return None

def get_user_favorites(db: Session, user_id: int, limit: int = 10):
    """Get user's favorite content."""
    return db.query(GeneratedContent).filter(
        GeneratedContent.user_id == user_id,
        GeneratedContent.is_favorite == True
    ).order_by(GeneratedContent.created_at.desc()).limit(limit).all()

# System Story Functions
def create_system_story(db: Session, admin_id: int, title: str, prompt: str, generated_text: str, image, category: str):
    """Create a system story."""
    # Convert PIL image to base64
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    image_data = base64.b64encode(buffer.getvalue()).decode()
    
    db_story = SystemStory(
        title=title,
        prompt=prompt,
        generated_text=generated_text,
        image_data=image_data,
        image_format="PNG",
        category=category,
        created_by=admin_id
    )
    db.add(db_story)
    db.commit()
    db.refresh(db_story)
    return db_story

def get_system_stories(db: Session, category: str = None, limit: int = 20):
    """Get system stories, optionally filtered by category."""
    query = db.query(SystemStory).filter(SystemStory.is_active == True)
    
    if category:
        query = query.filter(SystemStory.category == category)
    
    return query.order_by(SystemStory.created_at.desc()).limit(limit).all()

def get_all_system_stories(db: Session):
    """Get all active system stories."""
    return db.query(SystemStory).filter(SystemStory.is_active == True).order_by(SystemStory.created_at.desc()).all()

def delete_system_story(db: Session, story_id: int, admin_id: int):
    """Delete a system story (admin only)."""
    # Check if the user is admin
    admin = db.query(User).filter(User.id == admin_id, User.is_admin == True).first()
    if not admin:
        return False
    
    story = db.query(SystemStory).filter(SystemStory.id == story_id).first()
    if story:
        db.delete(story)
        db.commit()
        return True
    return False

def create_admin_user(db: Session, username: str, email: str, hashed_password: str):
    """Create an admin user."""
    admin_user = User(
        username=username,
        email=email,
        hashed_password=hashed_password,
        is_active=True,
        is_admin=True
    )
    db.add(admin_user)
    db.commit()
    db.refresh(admin_user)
    return admin_user

def get_admin_user(db: Session, username: str):
    """Get admin user by username."""
    return db.query(User).filter(User.username == username, User.is_admin == True).first() 