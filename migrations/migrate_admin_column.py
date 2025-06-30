#!/usr/bin/env python3
"""
Migration script to add is_admin column to users table
"""
import sqlite3
import os

def migrate_database():
    """Add is_admin column to users table if it doesn't exist"""
    db_path = "users.db"
    
    if not os.path.exists(db_path):
        print("Database file not found. This is normal for first-time setup.")
        return True
    
    try:
        # Connect to database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if is_admin column exists
        cursor.execute("PRAGMA table_info(users)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'is_admin' not in columns:
            print("Adding is_admin column to users table...")
            cursor.execute("ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT 0")
            conn.commit()
            print("Successfully added is_admin column")
        else:
            print("is_admin column already exists")
        
        # Check if system_stories table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='system_stories'")
        if not cursor.fetchone():
            print("Creating system_stories table...")
            cursor.execute("""
                CREATE TABLE system_stories (
                    id INTEGER PRIMARY KEY,
                    title VARCHAR NOT NULL,
                    prompt TEXT NOT NULL,
                    generated_text TEXT NOT NULL,
                    image_data TEXT,
                    image_format VARCHAR DEFAULT 'PNG',
                    category VARCHAR NOT NULL,
                    created_by INTEGER NOT NULL,
                    is_active BOOLEAN DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(created_by) REFERENCES users (id)
                )
            """)
            conn.commit()
            print("Successfully created system_stories table")
        else:
            print("system_stories table already exists")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"Migration failed: {e}")
        return False

if __name__ == "__main__":
    success = migrate_database()
    if success:
        print("Database migration completed successfully!")
    else:
        print("Database migration failed!")
        exit(1) 