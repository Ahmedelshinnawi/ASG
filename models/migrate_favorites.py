#!/usr/bin/env python3
"""
Migration script to add is_favorite column to existing GeneratedContent table
Run this script once to update your existing database
"""

import os
import sqlite3
from sqlalchemy import create_engine, text
from .database import DATABASE_URL

def migrate_database():
    """Add is_favorite column to existing database"""
    print("🔄 Starting database migration...")
    
    try:
        if "sqlite" in DATABASE_URL:
            # For SQLite databases
            db_path = DATABASE_URL.replace("sqlite:///", "")
            if os.path.exists(db_path):
                print(f"📂 Found existing database: {db_path}")
                
                conn = sqlite3.connect(db_path)
                cursor = conn.cursor()
                
                # Check if is_favorite column already exists
                cursor.execute("PRAGMA table_info(generated_content)")
                columns = [column[1] for column in cursor.fetchall()]
                
                if 'is_favorite' not in columns:
                    print("➕ Adding is_favorite column...")
                    cursor.execute("ALTER TABLE generated_content ADD COLUMN is_favorite BOOLEAN DEFAULT FALSE")
                    conn.commit()
                    print("✅ Successfully added is_favorite column")
                else:
                    print("ℹ️  is_favorite column already exists")
                
                conn.close()
            else:
                print("ℹ️  No existing database found - will be created with new schema")
        else:
            # For other databases (PostgreSQL, MySQL, etc.)
            engine = create_engine(DATABASE_URL)
            with engine.connect() as conn:
                # Check if column exists
                result = conn.execute(text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name='generated_content' AND column_name='is_favorite'
                """))
                
                if not result.fetchone():
                    print("➕ Adding is_favorite column...")
                    conn.execute(text("ALTER TABLE generated_content ADD COLUMN is_favorite BOOLEAN DEFAULT FALSE"))
                    conn.commit()
                    print("✅ Successfully added is_favorite column")
                else:
                    print("ℹ️  is_favorite column already exists")
        
        print("🎉 Migration completed successfully!")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        raise

if __name__ == "__main__":
    migrate_database() 