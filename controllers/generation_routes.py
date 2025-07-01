from fastapi import APIRouter, HTTPException, Depends
from huggingface_hub import InferenceClient
from diffusers import AutoPipelineForText2Image
import torch
import os
import re
from typing import Annotated, Optional
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

# Configure PyTorch for better memory management (must be set before any torch operations)
os.environ['PYTORCH_CUDA_ALLOC_CONF'] = 'expandable_segments:True'

router = APIRouter(prefix="/generate", tags=["generation"])

# Load AI models
HF_API_KEY = os.getenv("HF_API_KEY")
if not HF_API_KEY:
    raise ValueError("Set the Hugging Face API key in the environment variable HF_API_KEY")

client = InferenceClient(provider="sambanova", api_key=HF_API_KEY)

# Model configurations
MODEL_CONFIGS = {
    "realistic": {
        "model": "dreamlike-art/dreamlike-photoreal-2.0",
        "keywords": ["photo", "realistic", "portrait", "landscape", "photography", "street photography", "professional", "business", "lifestyle", "wedding", "architectural", "interior design", "exterior", "urban", "rural", "contemporary", "photorealistic", "candid", "documentary", "journalistic", "studio", "natural lighting", "bokeh", "depth of field", "macro", "telephoto", "wide angle"]
    },
    "fantasy": {
        "model": "prompthero/openjourney-v4", 
        "keywords": ["fantasy", "fairy tale", "magic", "magical", "wizard", "witch", "dragon", "castle", "knight", "princess", "prince", "unicorn", "fairy", "elf", "dwarf", "troll", "goblin", "ogre", "monster", "creature", "mythical", "legendary", "enchanted", "spell", "potion", "wand", "sword", "shield", "armor", "quest", "adventure", "kingdom", "realm", "dungeon", "tower", "portal", "crystal", "gem", "treasure", "scroll", "ancient magic", "mystical", "ethereal", "celestial", "divine", "angelic", "demonic", "supernatural", "otherworldly", "anime", "manga", "cartoon", "animated", "stylized", "surreal", "whimsical", "enchanting", "spellbound", "magical realism"]
    },
    "fallback": {
        "model": "runwayml/stable-diffusion-v1-5",
        "keywords": []
    }
}

# Global variables for lazy loading
current_model = None
current_model_type = None

def clear_gpu_memory():
    """Clear GPU memory to free up space for new models."""
    global current_model
    if current_model is not None:
        try:
            # Move model to CPU and delete reference
            current_model.to("cpu")
            del current_model
            current_model = None
            
            # Clear CUDA cache more thoroughly
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
                torch.cuda.synchronize()
                # Force garbage collection
                import gc
                gc.collect()
            
            print("✓ GPU memory cleared")
        except Exception as e:
            print(f"Warning: Error clearing GPU memory: {e}")
    
    # Also clear cache even if no model was loaded
    if torch.cuda.is_available():
        try:
            torch.cuda.empty_cache()
            torch.cuda.synchronize()
        except Exception as e:
            print(f"Warning: Error clearing CUDA cache: {e}")

def load_model(model_type: str):
    """Load a specific model with lazy loading."""
    global current_model, current_model_type
    
    # Check if we already have the requested model loaded
    if current_model_type == model_type and current_model is not None:
        print(f"✓ Model '{model_type}' already loaded")
        return current_model
    
    # Clear existing model from GPU memory
    clear_gpu_memory()
    
    try:
        print(f"Loading {model_type} model: {MODEL_CONFIGS[model_type]['model']}...")
        
        # Try to load the new model with optimized settings
        try:
            # First try with fp16 variant
            current_model = AutoPipelineForText2Image.from_pretrained(
                MODEL_CONFIGS[model_type]["model"],
                torch_dtype=torch.float16,
                use_safetensors=True,
                low_cpu_mem_usage=True,
                variant="fp16"
            )
        except:
            # Fallback without fp16 variant if not available
            current_model = AutoPipelineForText2Image.from_pretrained(
                MODEL_CONFIGS[model_type]["model"],
                torch_dtype=torch.float16,
                use_safetensors=True,
                low_cpu_mem_usage=True
            )
        
        # Move to CUDA after loading
        current_model = current_model.to("cuda")
        
        current_model_type = model_type
        print(f"✓ Loaded {model_type} model: {MODEL_CONFIGS[model_type]['model']}")
        
        return current_model
        
    except Exception as e:
        print(f"Error loading {model_type} model: {e}")
        current_model = None
        current_model_type = None
        
        # Try to load fallback model if the requested one fails and it's not already fallback
        if model_type != "fallback":
            print(f"Attempting to load fallback model...")
            try:
                try:
                    # First try with fp16 variant
                    current_model = AutoPipelineForText2Image.from_pretrained(
                        MODEL_CONFIGS["fallback"]["model"],
                        torch_dtype=torch.float16,
                        use_safetensors=True,
                        low_cpu_mem_usage=True,
                        variant="fp16"
                    )
                except:
                    # Fallback without fp16 variant
                    current_model = AutoPipelineForText2Image.from_pretrained(
                        MODEL_CONFIGS["fallback"]["model"],
                        torch_dtype=torch.float16,
                        use_safetensors=True,
                        low_cpu_mem_usage=True
                    )
                
                current_model = current_model.to("cuda")
                current_model_type = "fallback"
                print(f"✓ Loaded fallback model: {MODEL_CONFIGS['fallback']['model']}")
                return current_model
                
            except Exception as fallback_error:
                print(f"Failed to load fallback model: {fallback_error}")
                raise fallback_error
        else:
            raise e

def load_models():
    """Initialize the lazy loading system."""
    print("Initializing lazy loading system for image generation models...")
    print("Models will be loaded on-demand to optimize GPU memory usage.")
    print(f"Available models: {list(MODEL_CONFIGS.keys())}")
    
    # Pre-load the fallback model as it's most commonly used
    try:
        load_model("fallback")
        print("✓ Lazy loading system initialized successfully!")
    except Exception as e:
        print(f"Warning: Could not pre-load fallback model: {e}")
        print("Models will be loaded on first use.")

def detect_content_style(prompt: str) -> str:
    """
    Detect the appropriate style based on the prompt content.
    Returns: 'realistic', 'fantasy', or 'fallback'
    """
    prompt_lower = prompt.lower()
    
    # Clean the prompt for better matching
    cleaned_prompt = re.sub(r'[^\w\s]', ' ', prompt_lower)
    cleaned_prompt = re.sub(r'\s+', ' ', cleaned_prompt).strip()
    
    # Score each category
    realistic_score = 0
    fantasy_score = 0
    
    # Track matched keywords for debugging
    realistic_matches = []
    fantasy_matches = []
    
    # Check realistic keywords
    for keyword in MODEL_CONFIGS["realistic"]["keywords"]:
        keyword_lower = keyword.lower()
        # Check for exact word matches or phrase matches
        if f" {keyword_lower} " in f" {cleaned_prompt} " or cleaned_prompt.startswith(keyword_lower) or cleaned_prompt.endswith(keyword_lower):
            realistic_score += 1
            realistic_matches.append(keyword)
        # Also check for keyword as substring for compound words
        elif keyword_lower in cleaned_prompt and len(keyword_lower) > 3:  # Only for longer keywords
            realistic_score += 0.5
            realistic_matches.append(f"{keyword}*")
    
    # Check fantasy keywords
    for keyword in MODEL_CONFIGS["fantasy"]["keywords"]:
        keyword_lower = keyword.lower()
        # Check for exact word matches or phrase matches
        if f" {keyword_lower} " in f" {cleaned_prompt} " or cleaned_prompt.startswith(keyword_lower) or cleaned_prompt.endswith(keyword_lower):
            fantasy_score += 1
            fantasy_matches.append(keyword)
        # Also check for keyword as substring for compound words
        elif keyword_lower in cleaned_prompt and len(keyword_lower) > 3:  # Only for longer keywords
            fantasy_score += 0.5
            fantasy_matches.append(f"{keyword}*")
    
    # Determine best match with debug output
    print(f"🔍 Keyword Detection for: '{prompt[:50]}{'...' if len(prompt) > 50 else ''}'")
    print(f"   Realistic score: {realistic_score} (matches: {realistic_matches[:5]}{'...' if len(realistic_matches) > 5 else ''})")
    print(f"   Fantasy score: {fantasy_score} (matches: {fantasy_matches[:5]}{'...' if len(fantasy_matches) > 5 else ''})")
    
    # More conservative decision logic - require higher confidence
    if fantasy_score > realistic_score and fantasy_score >= 1.0:
        selected_style = "fantasy"
    elif realistic_score >= 1.0 and realistic_score > fantasy_score:
        selected_style = "realistic"
    else:
        selected_style = "fallback"
    
    print(f"   ➡️ Selected model: {selected_style}")
    return selected_style

def get_image_model(style: str):
    """Get the appropriate image generation model using lazy loading."""
    try:
        if style in MODEL_CONFIGS:
            return load_model(style)
        else:
            print(f"Warning: Style '{style}' not found, using fallback model")
            return load_model("fallback")
    except Exception as e:
        print(f"Error loading model for style '{style}': {e}")
        # If we can't load any model, raise the error
        raise Exception(f"Unable to load any image generation model: {e}")

def generate_image_with_model(prompt: str, model_style: Optional[str] = None):
    """
    Generate image using the appropriate model based on prompt or specified style.
    
    Args:
        prompt: The text prompt for image generation
        model_style: Optional specific model style to use ('realistic', 'fantasy', 'fallback')
    
    Returns:
        Generated PIL Image
    """
    # Determine model style
    if model_style and model_style in MODEL_CONFIGS:
        selected_style = model_style
    else:
        selected_style = detect_content_style(prompt)
    
    # Get the appropriate model
    model = get_image_model(selected_style)
    
    if model is None:
        raise Exception("No image generation model available")
    
    print(f"Using {selected_style} model for prompt: {prompt[:50]}...")
    
    # Generate image
    try:
        image = model(prompt).images[0]
        return image
    except Exception as e:
        print(f"Error with {selected_style} model: {e}")
        # Try fallback model if the selected one fails
        if selected_style != "fallback" and "fallback" in MODEL_CONFIGS:
            print("Attempting with fallback model...")
            fallback_model = get_image_model("fallback")
            return fallback_model(prompt).images[0]
        else:
            raise e

# Initialize models
load_models()

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

        # Generate image with automatic model selection
        image = generate_image_with_model(request.text)
        
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

@router.post("/content/{model_type}", response_model=ContentGenerationResponse)
async def generate_content_with_specific_model(
    model_type: str,
    request: PromptRequest, 
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """Generate content using a specific model type (realistic, fantasy, or fallback)."""
    if model_type not in ["realistic", "fantasy", "fallback"]:
        raise HTTPException(status_code=400, detail="Invalid model type. Use 'realistic', 'fantasy', or 'fallback'")
    
    try:
        # Generate text
        messages = [{"role": "user", "content": request.text}]
        completion = client.chat.completions.create(
            model="meta-llama/Llama-3.1-8B-Instruct",
            messages=messages,
            max_tokens=500
        )
        generated_text = completion.choices[0].message.content

        # Generate image with specified model
        image = generate_image_with_model(request.text, model_type)
        
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

@router.get("/models/info")
async def get_model_info():
    """Get information about available models and their keywords."""
    return {
        "available_models": list(MODEL_CONFIGS.keys()),
        "model_details": {
            "realistic": {
                "name": MODEL_CONFIGS["realistic"]["model"],
                "description": "Best for realistic, photographic content",
                "sample_keywords": MODEL_CONFIGS["realistic"]["keywords"][:20]  # Show first 20 keywords
            },
            "fantasy": {
                "name": MODEL_CONFIGS["fantasy"]["model"],
                "description": "Best for fantasy, fairy-tale, and artistic content",
                "sample_keywords": MODEL_CONFIGS["fantasy"]["keywords"][:20]  # Show first 20 keywords
            },
            "fallback": {
                "name": MODEL_CONFIGS["fallback"]["model"],
                "description": "General purpose model for all other content",
                "sample_keywords": ["general", "versatile", "all-purpose"]
            }
        },
        "auto_detection": "The system automatically selects the best model based on prompt keywords"
    }

@router.post("/models/detect")
async def test_keyword_detection(request: PromptRequest):
    """Test endpoint to see which model would be selected for a given prompt."""
    selected_style = detect_content_style(request.text)
    
    return {
        "prompt": request.text,
        "selected_model": selected_style,
        "model_name": MODEL_CONFIGS[selected_style]["model"],
        "available_models": {
            "realistic": MODEL_CONFIGS["realistic"]["model"],
            "fantasy": MODEL_CONFIGS["fantasy"]["model"], 
            "fallback": MODEL_CONFIGS["fallback"]["model"]
        }
    }

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

        # Generate image with automatic model selection
        image = generate_image_with_model(story_request.prompt)
        
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

@router.post("/admin/system-story/{model_type}", response_model=SystemStoryResponse)
async def create_admin_system_story_with_model(
    model_type: str,
    story_request: SystemStoryCreate,
    admin_user: Annotated[User, Depends(get_admin_user)],
    db: Session = Depends(get_db)
):
    """Create a system story with a specific model (admin only)."""
    if model_type not in ["realistic", "fantasy", "fallback"]:
        raise HTTPException(status_code=400, detail="Invalid model type. Use 'realistic', 'fantasy', or 'fallback'")
    
    try:
        # Generate text for the system story
        messages = [{"role": "user", "content": story_request.prompt}]
        completion = client.chat.completions.create(
            model="meta-llama/Llama-3.1-8B-Instruct",
            messages=messages,
            max_tokens=200
        )
        generated_text = completion.choices[0].message.content

        # Generate image with specified model
        image = generate_image_with_model(story_request.prompt, model_type)
        
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
