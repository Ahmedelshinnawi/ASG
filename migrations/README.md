# Database Migrations

This folder contains one-time migration scripts that were used to set up the initial database structure and data. These migrations have already been applied and are kept here for historical reference.

## Migration Files

### 1. `migrate_admin_column.py`

- **Purpose**: Adds `is_admin` column to the users table and creates the `system_stories` table
- **Status**: ✅ Applied
- **Date Applied**: During initial setup
- **Description**:
  - Adds `is_admin BOOLEAN DEFAULT 0` column to users table
  - Creates system_stories table with proper schema and foreign key constraints

### 2. `create_admin_and_stories.py`

- **Purpose**: Creates the initial admin user and generates system stories
- **Status**: ✅ Applied
- **Date Applied**: During initial setup
- **Description**:
  - Creates admin user with credentials (username: admin, email: admin@storytelling.ai)
  - Generates 8 initial system stories (4 teaching, 4 recommended)
  - Uses AI models when available, falls back to dummy content

### 3. `migrate_favorites.py`

- **Purpose**: Adds `is_favorite` column to the generated_content table
- **Status**: ✅ Applied
- **Date Applied**: During database evolution
- **Description**:
  - Adds `is_favorite BOOLEAN DEFAULT FALSE` column to generated_content table
  - Enables users to mark stories as favorites

### 4. `migrate_profile_picture.py`

- **Purpose**: Adds `profile_picture` column to the users table
- **Status**: ✅ Applied
- **Date Applied**: During database evolution
- **Description**:
  - Adds `profile_picture TEXT` column to users table
  - Enables users to store base64-encoded profile pictures

## Current Database State

- **Admin users**: 1
- **System stories**: 8
- **Users table**: Contains `is_admin`, `profile_picture`, `full_name`, and `bio` columns
- **Generated content table**: Contains `is_favorite` column
- **System stories table**: Fully created and populated

## Important Notes

⚠️ **DO NOT RE-RUN THESE SCRIPTS** - They are designed for one-time use and may cause errors if run again.

🔒 **Security**: The admin creation script contains hardcoded credentials for initial setup. The password should be changed after first login.

📝 **Reference Only**: These files are kept for documentation and troubleshooting purposes only.

## If You Need To

- **Reset Database**: Delete `users.db` and run these scripts again
- **Create New Admin**: Use the admin interface or modify the creation script
- **Add System Stories**: Use the admin dashboard in the application
