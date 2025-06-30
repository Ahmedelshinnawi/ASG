"""
Main application entry point for the AI Content Generator
This file serves as the entry point for the FastAPI application using MVC architecture.
"""

from controllers.main import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 