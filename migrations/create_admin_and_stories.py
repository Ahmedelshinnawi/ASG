#!/usr/bin/env python3
"""
Script to create an admin user and generate initial system stories
"""
import os
import sys
from sqlalchemy.orm import Session
from models.database import SessionLocal, User, SystemStory
from models.auth_utils import get_password_hash
from models.content_utils import create_admin_user, create_system_story
from huggingface_hub import InferenceClient
from diffusers import AutoPipelineForText2Image
import torch

def create_admin():
    """Create an admin user"""
    db = SessionLocal()
    try:
        # Check if admin already exists
        existing_admin = db.query(User).filter(User.is_admin == True).first()
        if existing_admin:
            print(f"Admin user already exists: {existing_admin.username}")
            return existing_admin
        
        # Create admin user
        admin_username = "admin"
        admin_email = "admin@storytelling.ai"
        admin_password = "admin123"  # Change this in production!
        
        hashed_password = get_password_hash(admin_password)
        
        admin_user = create_admin_user(
            db=db,
            username=admin_username,
            email=admin_email,
            hashed_password=hashed_password
        )
        
        print(f"Admin user created successfully!")
        print(f"Username: {admin_username}")
        print(f"Email: {admin_email}")
        print(f"Password: {admin_password}")
        print("Please change the password after first login!")
        
        return admin_user
        
    except Exception as e:
        print(f"Error creating admin user: {e}")
        return None
    finally:
        db.close()

def setup_ai_models():
    """Setup AI models for story generation"""
    try:
        # Load AI models
        HF_API_KEY = os.getenv("HF_API_KEY")
        if not HF_API_KEY:
            print("Warning: HF_API_KEY not found. Using dummy stories.")
            return None, None
        
        client = InferenceClient(provider="sambanova", api_key=HF_API_KEY)
        
        # Load text-to-image model
        pipe_txt2img = AutoPipelineForText2Image.from_pretrained(
            "dreamlike-art/dreamlike-photoreal-2.0",
            torch_dtype=torch.float16,
            use_safetensors=True
        ).to("cuda")
        
        print("AI models loaded successfully!")
        return client, pipe_txt2img
        
    except Exception as e:
        print(f"Error loading AI models: {e}")
        print("Will create dummy stories instead.")
        return None, None

def create_dummy_image():
    """Create a simple dummy image when AI models are not available"""
    from PIL import Image, ImageDraw, ImageFont
    
    # Create a simple colored image
    img = Image.new('RGB', (400, 300), color='lightblue')
    draw = ImageDraw.Draw(img)
    
    # Try to use a font, fallback to default if not available
    try:
        font = ImageFont.truetype("arial.ttf", 20)
    except:
        font = ImageFont.load_default()
    
    # Add some text
    draw.text((50, 150), "Story Image", fill='darkblue', font=font)
    
    return img

def generate_system_stories(admin_user):
    """Generate initial system stories"""
    db = SessionLocal()
    try:
        # Check if stories already exist
        existing_stories = db.query(SystemStory).count()
        if existing_stories > 0:
            print(f"System stories already exist ({existing_stories} stories)")
            return
        
        # Setup AI models
        client, pipe_txt2img = setup_ai_models()
        
        # Define story prompts
        teaching_stories = [
            {
                "title": "The Wise Teacher",
                "prompt": "A wise teacher helping students learn about friendship and kindness",
                "category": "teaching"
            },
            {
                "title": "The Brave Captain",
                "prompt": "A brave sea captain teaching children about courage and teamwork",
                "category": "teaching"
            },
            {
                "title": "The Kind Doctor",
                "prompt": "A kind doctor helping patients and teaching about health and care",
                "category": "teaching"
            },
            {
                "title": "The Creative Chef",
                "prompt": "A creative chef teaching children about cooking and healthy eating",
                "category": "teaching"
            }
        ]
        
        recommended_stories = [
            {
                "title": "The Magic Adventure",
                "prompt": "A magical adventure story with fairies and enchanted forests",
                "category": "recommended"
            },
            {
                "title": "The Space Explorer",
                "prompt": "A young astronaut exploring distant planets and meeting alien friends",
                "category": "recommended"
            },
            {
                "title": "The Animal Kingdom",
                "prompt": "A story about animals in the jungle learning to work together",
                "category": "recommended"
            },
            {
                "title": "The Time Traveler",
                "prompt": "A child who travels through time to learn about history",
                "category": "recommended"
            }
        ]
        
        all_stories = teaching_stories + recommended_stories
        
        for story_data in all_stories:
            try:
                print(f"Creating story: {story_data['title']}")
                
                # Generate text
                if client:
                    messages = [{"role": "user", "content": story_data['prompt']}]
                    completion = client.chat.completions.create(
                        model="meta-llama/Llama-3.1-8B-Instruct",
                        messages=messages,
                        max_tokens=200
                    )
                    generated_text = completion.choices[0].message.content
                else:
                    # Dummy text when AI is not available
                    generated_text = f"This is a wonderful story about {story_data['title'].lower()}. " \
                                   f"In this tale, we follow the adventures and learn valuable lessons about " \
                                   f"life, friendship, and growth. The story teaches us important values " \
                                   f"and inspires us to be better people."
                
                # Generate image
                if pipe_txt2img:
                    image = pipe_txt2img(story_data['prompt']).images[0]
                else:
                    image = create_dummy_image()
                
                # Create system story
                story = create_system_story(
                    db=db,
                    admin_id=admin_user.id,
                    title=story_data['title'],
                    prompt=story_data['prompt'],
                    generated_text=generated_text,
                    image=image,
                    category=story_data['category']
                )
                
                print(f"✓ Created: {story.title}")
                
            except Exception as e:
                print(f"✗ Failed to create {story_data['title']}: {e}")
                continue
        
        print(f"System stories creation completed!")
        
    except Exception as e:
        print(f"Error generating system stories: {e}")
    finally:
        db.close()

def main():
    """Main function"""
    print("Setting up admin user and system stories...")
    
    # Create admin user
    admin_user = create_admin()
    if not admin_user:
        print("Failed to create admin user. Exiting.")
        sys.exit(1)
    
    # Generate system stories
    generate_system_stories(admin_user)
    
    print("\nSetup completed successfully!")
    print("\nNext steps:")
    print("1. Start the application: python app.py")
    print("2. Login as admin to manage system stories")
    print("3. View the home page to see the generated stories")

if __name__ == "__main__":
    main() 