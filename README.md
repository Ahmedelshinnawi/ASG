<div align="center">
  <img src="views/assets/Group 177.png" alt="ASG Logo" width="200" height="100">
  
  # ASG - AI Storytelling Generation Platform
  
  *Unleash the power of AI to create engaging, personalized stories with stunning visuals*
</div>

---

## 🌟 Overview

ASG (AI Storytelling Generation) is a cutting-edge web platform that combines artificial intelligence with creative storytelling to generate unique, engaging narratives accompanied by beautiful AI-generated artwork. The platform is designed to foster creativity and imagination for users of all ages, with robust safety measures and comprehensive user management features.

## ✨ Key Features

### 🎭 **AI-Powered Story Generation**

- **Intelligent Text Generation**: Powered by Meta's Llama-3.1-8B-Instruct model via SambaNova API
- **Smart Image Generation**: Multiple specialized AI models for different content types:
  - **Fantasy Model**: `prompthero/openjourney-v4` - Perfect for magical, fairy-tale content
  - **Realistic Model**: `dreamlike-art/dreamlike-photoreal-2.0` - Ideal for photorealistic scenes
  - **Fallback Model**: `runwayml/stable-diffusion-v1-5` - General-purpose content generation
- **Automatic Model Selection**: AI automatically chooses the best image model based on story content and keywords
- **Genre-Aware Generation**: Supports multiple genres including Fantasy, Adventure, Horror, Comedy, and more

### 👤 **User Management & Authentication**

- **Secure Registration/Login**: JWT-based authentication with password hashing
- **User Profiles**: Customizable profiles with bio, profile pictures, and statistics
- **Password Management**: Password reset functionality with secure token generation
- **Account Management**: Profile updates, password changes, and account deletion

### 📚 **Content Management**

- **Personal Story Library**: Save, organize, and manage generated stories
- **Favorites System**: Mark stories as favorites for easy access
- **Story History**: View complete generation history with timestamps
- **Story Sharing**: View and interact with generated content
- **Content Deletion**: Remove unwanted stories from personal library

### 🔧 **Admin Dashboard**

- **System Story Management**: Create and manage featured stories for the homepage
- **Content Moderation**: Admin-only access to manage platform content
- **User Administration**: Manage user accounts and permissions
- **Analytics**: View system statistics and user engagement metrics

### 🎨 **User Interface**

- **Modern Web Design**: Clean, responsive interface with beautiful animations
- **Mobile-Friendly**: Fully responsive design that works on all devices
- **Interactive Elements**: Dynamic loading states, modal dialogs, and smooth transitions
- **Accessibility**: Keyboard navigation and screen reader compatible

## 🏗️ Technical Architecture

### **Backend (FastAPI)**

- **Framework**: FastAPI with Python 3.8+
- **Database**: SQLite with SQLAlchemy ORM
- **Authentication**: JWT tokens with OAuth2 password flow
- **API Design**: RESTful API with automatic OpenAPI documentation
- **AI Integration**: Hugging Face Hub and Diffusers library integration

### **Frontend (Vanilla JavaScript)**

- **Architecture**: Modern ES6+ JavaScript with modular design
- **Styling**: Custom CSS with responsive design principles
- **State Management**: Client-side authentication and session management
- **User Experience**: Progressive loading and error handling

### **AI Models**

- **Text Generation**: Meta Llama-3.1-8B-Instruct via SambaNova
- **Image Generation**: Multiple Stable Diffusion variants for specialized content
- **Model Management**: Lazy loading and GPU memory optimization
- **Content Analysis**: Automatic keyword detection for model selection

## 📊 Database Schema

### **Users Table**

- User authentication and profile information
- Admin permissions and account status
- Profile customization (bio, profile picture)
- Account creation and security tokens

### **Generated Content Table**

- User-generated stories with prompts and AI responses
- Base64-encoded images with format metadata
- Favorites marking and creation timestamps
- Content ownership and privacy controls

### **System Stories Table**

- Admin-curated content for homepage display
- Categorized stories (teaching, recommended)
- Content approval and activation status
- Creator attribution and management

## 🚀 API Endpoints

### **Authentication Endpoints**

```
POST /auth/register          - User registration
POST /auth/login             - User authentication
GET  /auth/me                - Current user info
GET  /auth/profile           - User profile with stats
PUT  /auth/profile           - Update user profile
PUT  /auth/password          - Change password
POST /auth/request-password-reset - Request password reset
POST /auth/reset-password    - Reset password with token
DELETE /auth/account         - Delete user account
```

### **Story Generation Endpoints**

```
POST /generate/content                    - Generate story with auto model selection
POST /generate/content/{model_type}       - Generate with specific model
GET  /generate/latest                     - Get latest user story
GET  /generate/history                    - Get user story history
GET  /generate/content/{id}               - Get specific story
DELETE /generate/content/{id}             - Delete specific story
POST /generate/content/{id}/favorite      - Toggle favorite status
PUT  /generate/content/{id}/favorite      - Set favorite status
GET  /generate/favorites                  - Get user favorites
GET  /generate/system-stories             - Get public system stories
GET  /generate/models/info                - Get AI model information
```

### **Admin Endpoints**

```
POST /generate/admin/system-story         - Create system story
POST /generate/admin/system-story/{model} - Create with specific model
GET  /generate/admin/system-stories       - Get all system stories
DELETE /generate/admin/system-story/{id}  - Delete system story
```

## 🎯 User Workflows

### **New User Journey**

1. **Registration**: Create account with username, email, and password
2. **Profile Setup**: Add personal information and profile picture
3. **Story Generation**: Use the AI generator with custom prompts
4. **Content Management**: Save favorites and manage story library
5. **Community Interaction**: View featured system stories

### **Story Creation Process**

1. **Prompt Input**: Enter creative prompt with optional genre selection
2. **AI Processing**: System selects optimal AI models automatically
3. **Content Generation**: Text and image generated simultaneously
4. **Result Display**: Story and artwork displayed with save options
5. **Library Management**: Add to favorites or personal collection

### **Admin Management**

1. **Admin Access**: Secure admin authentication required
2. **Content Creation**: Generate system stories for homepage
3. **Content Moderation**: Review and manage user-generated content
4. **System Monitoring**: View analytics and user engagement

## 🛠️ Installation & Setup

### **Prerequisites**

- Python 3.8 or higher
- CUDA-compatible GPU (for optimal AI performance)
- Hugging Face API key for SambaNova access

### **Installation Steps**

1. **Clone the Repository**

```bash
git clone https://github.com/Ahmedelshinnawi/ASG.git
cd ASG
```

2. **Create Virtual Environment**

```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate     # Windows
```

3. **Install Dependencies**

```bash
pip install -r requirements.txt
```

4. **Environment Configuration**

```bash
# Create .env file
echo "HF_API_KEY=your_huggingface_api_key_here" > .env
```

5. **Database Setup**

```bash
# Run migration scripts
python migrations/migrate_admin_column.py
python migrations/migrate_favorites.py
python migrations/migrate_profile_picture.py
```

6. **Initialize Admin User**

```bash
python migrations/create_admin_and_stories.py
```

7. **Start the Application**

```bash
python app.py
```

### **Access Points**

- **Main Application**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Admin Dashboard**: http://localhost:8000/admin.html

## 🎨 Features in Detail

### **Multi-Model AI System**

The platform uses sophisticated AI model selection based on content analysis:

- **Keyword Detection**: Analyzes prompts for genre-specific terms
- **Automatic Routing**: Selects the best model for content type
- **Fallback Handling**: Graceful degradation if preferred models fail
- **Memory Management**: Efficient GPU usage with lazy loading

### **User Experience Features**

- **Progressive Loading**: Smooth loading states during AI generation
- **Error Handling**: Comprehensive error messages and recovery options
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Accessibility**: WCAG 2.1 compliance with keyboard navigation

### **Security & Privacy**

- **Secure Authentication**: Bcrypt password hashing with JWT tokens
- **Data Protection**: User content isolation and secure storage
- **Admin Controls**: Role-based access control for sensitive operations
- **Session Management**: Secure token handling and expiration

### **Content Organization**

- **Smart Categorization**: Teaching stories vs. recommended content
- **Favorite System**: Quick access to preferred stories
- **Search & Filter**: Sort by date, favorites, or content type
- **Export Options**: Download or share generated content

## 🔮 Future Enhancements

### **Planned Features**

- **Collaborative Storytelling**: Multi-user story creation
- **Advanced AI Models**: Integration with latest language models
- **Social Features**: User following and content sharing
- **Mobile App**: Native iOS and Android applications
- **Voice Integration**: Audio narration and voice prompts
- **Multi-language Support**: International language options

### **Technical Improvements**

- **Cloud Deployment**: Scalable cloud infrastructure
- **Performance Optimization**: Caching and CDN integration
- **Analytics Dashboard**: Detailed usage analytics
- **API Rate Limiting**: Enhanced security and resource management

## 🤝 Contributing

We welcome contributions to the ASG platform! Please follow these guidelines:

1. **Fork the Repository**: Create your own fork for development
2. **Create Feature Branch**: Use descriptive branch names
3. **Follow Code Style**: Maintain consistent formatting and documentation
4. **Test Thoroughly**: Ensure all features work as expected
5. **Submit Pull Request**: Include detailed description of changes

## 📄 License

This project is part of a graduation project and is intended for educational and demonstration purposes. Please respect intellectual property rights and AI model usage terms.

## 🙏 Acknowledgments

- **Meta AI**: For the Llama-3.1-8B-Instruct language model
- **SambaNova**: For AI model hosting and API access
- **Hugging Face**: For the model repository and Diffusers library
- **Stability AI**: For Stable Diffusion models
- **FastAPI Team**: For the excellent web framework
- **Community Contributors**: For feedback and testing

---

<div align="center">
  <p><strong>ASG - Where AI Meets Imagination</strong></p>
  <p>Transform your ideas into captivating stories with the power of artificial intelligence</p>
</div>
