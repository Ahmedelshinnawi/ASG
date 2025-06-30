from fastapi import APIRouter, HTTPException, Depends
from huggingface_hub import InferenceClient
from diffusers import AutoPipelineForText2Image
import torch
import os
from typing import Annotated
from sqlalchemy.orm import Session

from models.database import get_db, User
from models.auth_models import (
    PromptRequest, 
    ContentGenerationResponse, 
    GeneratedContentResponse,
    UserContentListResponse,
    FavoriteRequest,
    FavoriteResponse,
    SystemStoryCreate,
    SystemStoryResponse,
    SystemStoriesListResponse
)
from controllers.auth_routes import get_current_user
from models.content_utils import (
    save_generated_content, 
    get_latest_user_content, 
    get_user_content,
    get_content_by_id,
    delete_user_content,
    toggle_favorite_status,
    get_user_favorites,
    set_favorite_status,
    create_system_story,
    get_system_stories,
    get_all_system_stories,
    delete_system_story
)

router = APIRouter(prefix="/generate", tags=["generation"])

# Load AI models
HF_API_KEY = os.getenv("HF_API_KEY")
if not HF_API_KEY:
    raise ValueError("Set the Hugging Face API key in the environment variable HF_API_KEY")

client = InferenceClient(provider="sambanova", api_key=HF_API_KEY)

# Load text-to-image model
pipe_txt2img = AutoPipelineForText2Image.from_pretrained(
    "dreamlike-art/dreamlike-photoreal-2.0",
    torch_dtype=torch.float16,
    use_safetensors=True
).to("cuda")

print("Generation models loaded successfully!")

@router.post("/content", response_model=ContentGenerationResponse)
async def generate_content(
    request: PromptRequest, 
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """Generate text and image content and store in database."""
    try:
        # Generate text
        messages = [{"role": "user", "content": request.text}]
        completion = client.chat.completions.create(
            model="meta-llama/Llama-3.1-8B-Instruct",
            messages=messages,
            max_tokens=500
        )
        generated_text = completion.choices[0].message.content

        # Generate image
        image = pipe_txt2img(request.text).images[0]
        
        # Save to database
        content = save_generated_content(
            db=db,
            user_id=current_user.id,
            prompt=request.text,
            generated_text=generated_text,
            image=image
        )
        
        return ContentGenerationResponse(
            id=content.id,
            text=content.generated_text,
            image_base64=content.image_data,
            image_format=content.image_format,
            is_favorite=content.is_favorite,
            user=current_user.username,
            created_at=content.created_at
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/latest", response_model=ContentGenerationResponse)
async def get_latest_content(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """Get the latest generated content for the current user."""
    content = get_latest_user_content(db, current_user.id)
    
    if not content:
        raise HTTPException(status_code=404, detail="No content found for this user")
    
    return ContentGenerationResponse(
        id=content.id,
        text=content.generated_text,
        image_base64=content.image_data,
        image_format=content.image_format,
        is_favorite=content.is_favorite,
        user=current_user.username,
        created_at=content.created_at
    )

@router.get("/history", response_model=UserContentListResponse)
async def get_content_history(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
    limit: int = 10
):
    """Get user's content generation history."""
    content_list = get_user_content(db, current_user.id, limit)
    
    content_responses = [
        GeneratedContentResponse(
            id=content.id,
            prompt=content.prompt,
            generated_text=content.generated_text,
            image_data=content.image_data,
            image_format=content.image_format,
            is_favorite=content.is_favorite,
            created_at=content.created_at
        )
        for content in content_list
    ]
    
    return UserContentListResponse(
        content=content_responses,
        total_count=len(content_responses),
        user=current_user.username
    )

@router.get("/content/{content_id}", response_model=GeneratedContentResponse)
async def get_specific_content(
    content_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """Get specific content by ID."""
    content = get_content_by_id(db, content_id, current_user.id)
    
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    return GeneratedContentResponse(
        id=content.id,
        prompt=content.prompt,
        generated_text=content.generated_text,
        image_data=content.image_data,
        image_format=content.image_format,
        is_favorite=content.is_favorite,
        created_at=content.created_at
    )

@router.delete("/content/{content_id}")
async def delete_content(
    content_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """Delete specific content by ID."""
    success = delete_user_content(db, content_id, current_user.id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Content not found")
    
    return {"message": "Content deleted successfully"}

# Legacy endpoint for backward compatibility
@router.get("/latest-image")
async def get_latest_image_legacy(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """Legacy endpoint - redirects to latest content."""
    content = get_latest_user_content(db, current_user.id)
    
    if not content or not content.image_data:
        raise HTTPException(status_code=404, detail="No image found for this user")
    
    return {
        "image_base64": content.image_data,
        "image_format": content.image_format,
        "created_at": content.created_at
    }

@router.post("/content/{content_id}/favorite", response_model=FavoriteResponse)
async def toggle_content_favorite(
    content_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """Toggle the favorite status of a content item."""
    content = toggle_favorite_status(db, content_id, current_user.id)
    
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    return FavoriteResponse(
        id=content.id,
        is_favorite=content.is_favorite,
        message="Favorite status updated successfully"
    )

@router.put("/content/{content_id}/favorite", response_model=FavoriteResponse)
async def set_content_favorite(
    content_id: int,
    favorite_request: FavoriteRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """Set the favorite status of a content item."""
    content = set_favorite_status(db, content_id, current_user.id, favorite_request.is_favorite)
    
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    return FavoriteResponse(
        id=content.id,
        is_favorite=content.is_favorite,
        message="Favorite status updated successfully"
    )

@router.get("/favorites", response_model=UserContentListResponse)
async def get_user_favorite_content(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
    limit: int = 10
):
    """Get user's favorite content."""
    favorites = get_user_favorites(db, current_user.id, limit)
    
    content_responses = [
        GeneratedContentResponse(
            id=content.id,
            prompt=content.prompt,
            generated_text=content.generated_text,
            image_data=content.image_data,
            image_format=content.image_format,
            is_favorite=content.is_favorite,
            created_at=content.created_at
        )
        for content in favorites
    ]
    
    return UserContentListResponse(
        content=content_responses,
        total_count=len(content_responses),
        user=current_user.username
    )

# System Stories Routes
@router.get("/system-stories", response_model=SystemStoriesListResponse)
async def get_public_system_stories(
    db: Session = Depends(get_db),
    category: str = None
):
    """Get public system stories for the home page (accessible to all users)."""
    stories = get_system_stories(db, category)
    
    story_responses = [
        SystemStoryResponse(
            id=story.id,
            title=story.title,
            prompt=story.prompt,
            generated_text=story.generated_text,
            image_data=story.image_data,
            image_format=story.image_format,
            category=story.category,
            is_active=story.is_active,
            created_at=story.created_at
        )
        for story in stories
    ]
    
    return SystemStoriesListResponse(
        stories=story_responses,
        total_count=len(story_responses),
        category=category
    )

# Admin Routes
def get_admin_user(current_user: Annotated[User, Depends(get_current_user)]):
    """Dependency to ensure user is admin."""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

@router.post("/admin/system-story", response_model=SystemStoryResponse)
async def create_admin_system_story(
    story_request: SystemStoryCreate,
    admin_user: Annotated[User, Depends(get_admin_user)],
    db: Session = Depends(get_db)
):
    """Create a system story (admin only)."""
    try:
        # Generate text for the system story
        messages = [{"role": "user", "content": story_request.prompt}]
        completion = client.chat.completions.create(
            model="meta-llama/Llama-3.1-8B-Instruct",
            messages=messages,
            max_tokens=200
        )
        generated_text = completion.choices[0].message.content

        # Generate image
        image = pipe_txt2img(story_request.prompt).images[0]
        
        # Save to database
        story = create_system_story(
            db=db,
            admin_id=admin_user.id,
            title=story_request.title,
            prompt=story_request.prompt,
            generated_text=generated_text,
            image=image,
            category=story_request.category
        )
        
        return SystemStoryResponse(
            id=story.id,
            title=story.title,
            prompt=story.prompt,
            generated_text=story.generated_text,
            image_data=story.image_data,
            image_format=story.image_format,
            category=story.category,
            is_active=story.is_active,
            created_at=story.created_at
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/admin/system-stories", response_model=SystemStoriesListResponse)
async def get_admin_system_stories(
    admin_user: Annotated[User, Depends(get_admin_user)],
    db: Session = Depends(get_db)
):
    """Get all system stories (admin only)."""
    stories = get_all_system_stories(db)
    
    story_responses = [
        SystemStoryResponse(
            id=story.id,
            title=story.title,
            prompt=story.prompt,
            generated_text=story.generated_text,
            image_data=story.image_data,
            image_format=story.image_format,
            category=story.category,
            is_active=story.is_active,
            created_at=story.created_at
        )
        for story in stories
    ]
    
    return SystemStoriesListResponse(
        stories=story_responses,
        total_count=len(story_responses)
    )

@router.delete("/admin/system-story/{story_id}")
async def delete_admin_system_story(
    story_id: int,
    admin_user: Annotated[User, Depends(get_admin_user)],
    db: Session = Depends(get_db)
):
    """Delete a system story (admin only)."""
    success = delete_system_story(db, story_id, admin_user.id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Story not found")
    
    return {"message": "System story deleted successfully"} 

