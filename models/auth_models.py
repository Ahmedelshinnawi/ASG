from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    bio: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None
    profile_picture: Optional[str] = None  # Base64 encoded image

class UserProfileResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str] = None
    bio: Optional[str] = None
    is_active: bool
    is_admin: bool
    created_at: datetime
    total_stories: int
    favorite_stories: int
    profile_picture: Optional[str] = None  # Base64 encoded image

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class User(BaseModel):
    id: int
    username: str
    email: str
    is_active: bool
    is_admin: bool
    created_at: datetime

    class Config:
        from_attributes = True

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordReset(BaseModel):
    reset_token: str
    new_password: str

class PromptRequest(BaseModel):
    text: str

class GeneratedContentResponse(BaseModel):
    id: int
    prompt: str
    generated_text: str
    image_data: Optional[str] = None  # Base64 encoded image
    image_format: str = "PNG"
    is_favorite: bool = False
    created_at: datetime

    class Config:
        from_attributes = True

class ContentGenerationResponse(BaseModel):
    id: int
    text: str
    image_base64: Optional[str] = None
    image_format: str = "PNG"
    is_favorite: bool = False
    user: str
    created_at: datetime

class UserContentListResponse(BaseModel):
    content: List[GeneratedContentResponse]
    total_count: int
    user: str

class FavoriteRequest(BaseModel):
    is_favorite: bool

class FavoriteResponse(BaseModel):
    id: int
    is_favorite: bool
    message: str

# System Story Models
class SystemStoryCreate(BaseModel):
    title: str
    prompt: str
    category: str  # "teaching" or "recommended"

class SystemStoryResponse(BaseModel):
    id: int
    title: str
    prompt: str
    generated_text: str
    image_data: Optional[str] = None
    image_format: str = "PNG"
    category: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class SystemStoriesListResponse(BaseModel):
    stories: List[SystemStoryResponse]
    total_count: int
    category: Optional[str] = None 