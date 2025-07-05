from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import os
import dotenv

from controllers.auth_routes import router as auth_router
from controllers.generation_routes import router as generation_router

# Load environment variables
dotenv.load_dotenv()

app = FastAPI(title="AI Content Generator with Authentication", version="1.0.0")

# Add CORS middleware - Allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(generation_router)

@app.get("/")
async def root():
    """Serve the main index page"""
    return FileResponse("views/index.html")

@app.get("/index.html")
async def index_page():
    """Serve the main index page"""
    return FileResponse("views/index.html")

@app.get("/generate-story.html")
async def generate_story_page():
    """Serve the story generation page"""
    return FileResponse("views/generate-story.html")

@app.get("/favorites.html")
async def favorites_page():
    """Serve the favorites page"""
    return FileResponse("views/favorites.html")

@app.get("/recent-stories.html")
async def recent_stories_page():
    """Serve the recent stories page"""
    return FileResponse("views/recent-stories.html")

@app.get("/about.html")
async def about_page():
    """Serve the about page"""
    return FileResponse("views/about.html")

@app.get("/welcome.html")
async def welcome_page():
    """Serve the welcome/login page"""
    return FileResponse("views/welcome.html")

@app.get("/admin.html")
async def admin_page():
    """Serve the admin dashboard page"""
    return FileResponse("views/admin.html")

@app.get("/profile-settings.html")
async def profile_settings_page():
    """Serve the profile settings modal page"""
    return FileResponse("views/profile-settings.html")

@app.get("/script.js")
async def script_js():
    """Serve the main script file"""
    return FileResponse("views/js/script.js", media_type="application/javascript")

@app.get("/profile-settings-component.js")
async def profile_settings_component_js():
    """Serve the profile settings component JavaScript file"""
    return FileResponse("views/js/profile-settings-component.js", media_type="application/javascript")

@app.get("/api.js")
async def api_js():
    """Serve the API integration JavaScript file"""
    return FileResponse("views/js/api.js", media_type="application/javascript")

@app.get("/styles.css")
async def styles_css():
    """Serve the main CSS file"""
    return FileResponse("views/css/styles.css", media_type="text/css")

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/api")
async def api_info():
    return {
        "message": "AI Content Generator API",
        "docs": "/docs",
        "auth_endpoints": [
            "/auth/register",
            "/auth/login", 
            "/auth/me",
            "/auth/profile",
            "/auth/password",
            "/auth/request-password-reset",
            "/auth/reset-password"
        ],
        "generation_endpoints": [
            "/generate/content",
            "/generate/latest",
            "/generate/history",
            "/generate/content/{id}",
            "/generate/favorites",
            "/generate/content/{id}/favorite",
            "/generate/system-stories",
            "/generate/latest-image"  # legacy
        ],
        "admin_endpoints": [
            "/generate/admin/system-story",
            "/generate/admin/system-stories",
            "/generate/admin/system-story/{id}"
        ]
    }

@app.get("/test-assets.html")
async def test_assets_page():
    """Serve the asset loading test page"""
    return FileResponse("test_assets.html")

@app.get("/test-favorites-fix.html")
async def test_favorites_fix_page():
    """Serve the favorites fix test page"""
    return FileResponse("test_favorites_fix.html")

@app.get("/test-icons.html")
async def test_icons_page():
    """Serve the social icons test page"""
    return FileResponse("test-icons.html")

@app.get("/css/{file_path:path}")
async def serve_css(file_path: str):
    """Serve a CSS file"""
    return FileResponse(f"views/css/{file_path}")

@app.get("/js/{file_path:path}")
async def serve_js(file_path: str):
    """Serve a JavaScript file"""
    return FileResponse(f"views/js/{file_path}", media_type="application/javascript")

@app.get("/assets/{file_path:path}")
async def serve_assets(file_path: str):
    """Serve asset files (images, icons, etc.)"""
    return FileResponse(f"views/assets/{file_path}")

@app.get("/fonts/{file_path:path}")
async def serve_fonts(file_path: str):
    """Serve font files"""
    return FileResponse(f"views/fonts/{file_path}")