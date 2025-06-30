"""
Migration script to add profile_picture column to the users table
Run this script once to update existing databases
"""

import sqlite3
import os
from datetime import datetime

def migrate_profile_picture():
    """Add profile_picture column to users table if it doesn't exist."""
    
    # Database path
    db_path = "users.db"
    
    if not os.path.exists(db_path):
        print(f"Database {db_path} not found. No migration needed.")
        return
    
    try:
        # Connect to the database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if profile_picture column exists
        cursor.execute("PRAGMA table_info(users)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'profile_picture' not in columns:
            print("Adding profile_picture column to users table...")
            
            # Add the new column
            cursor.execute("ALTER TABLE users ADD COLUMN profile_picture TEXT")
            
            # Commit the changes
            conn.commit()
            
            print("✅ Successfully added profile_picture column to users table")
        else:
            print("ℹ️  profile_picture column already exists in users table")
        
        # Close the connection
        conn.close()
        
    except Exception as e:
        print(f"❌ Error during migration: {e}")
        if conn:
            conn.close()

if __name__ == "__main__":
    print("🔄 Starting profile picture migration...")
    migrate_profile_picture()
    print("✅ Migration completed!") 