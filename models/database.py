from sqlalchemy import create_engine, Column, Integer, String, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os

# Database URL - using SQLite for simplicity
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./users.db")

engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=True)  # User's full name
    bio = Column(Text, nullable=True)  # User's bio/description
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)  # Admin flag
    created_at = Column(DateTime, default=datetime.utcnow)
    reset_token = Column(String, nullable=True)
    reset_token_expires = Column(DateTime, nullable=True)
    profile_picture = Column(Text, nullable=True)  # Base64 encoded profile picture
    
    # Relationship to generated content
    generated_content = relationship("GeneratedContent", back_populates="user")

class GeneratedContent(Base):
    __tablename__ = "generated_content"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    prompt = Column(Text, nullable=False)
    generated_text = Column(Text, nullable=False)
    image_data = Column(Text, nullable=True)  # Base64 encoded image
    image_format = Column(String, default="PNG")  # Image format (PNG, JPEG, etc.)
    is_favorite = Column(Boolean, default=False)  # Track favorite stories
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship to user
    user = relationship("User", back_populates="generated_content")

class SystemStory(Base):
    __tablename__ = "system_stories"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    prompt = Column(Text, nullable=False)
    generated_text = Column(Text, nullable=False)
    image_data = Column(Text, nullable=True)  # Base64 encoded image
    image_format = Column(String, default="PNG")
    category = Column(String, nullable=False)  # e.g., "teaching", "recommended"
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)  # Admin who created it
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship to admin user
    creator = relationship("User")

# Create tables
Base.metadata.create_all(bind=engine)

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() 