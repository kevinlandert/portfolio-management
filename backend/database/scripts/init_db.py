#!/usr/bin/env python3
"""
Database Initialization Script
Creates database and runs all schema files in order.
"""

import sys
import os
from pathlib import Path
import sqlite3

# Add the scripts directory to Python path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from db_connection import get_db

def init_database():
    """
    Initialize database by running schema files in order.
    Creates database directory if it doesn't exist.
    """
    # Ensure database directory exists
    db_path = Path(__file__).parent.parent / "data"
    db_path.mkdir(parents=True, exist_ok=True)
    
    db = get_db()
    schema_dir = Path(__file__).parent.parent / "schema"
    
    if not schema_dir.exists():
        print(f"❌ Schema directory not found: {schema_dir}")
        return False
    
    print(f"📂 Schema directory: {schema_dir}")
    print(f"📊 Initializing database at: {db.conn.execute('PRAGMA database_list').fetchone()[2]}")
    
    # Get all SQL files and sort by name (01_, 02_, etc.)
    schema_files = sorted(schema_dir.glob("*.sql"))
    
    if not schema_files:
        print(f"⚠️  No schema files found in {schema_dir}")
        return False
    
    print(f"📋 Found {len(schema_files)} schema file(s)\n")
    
    success_count = 0
    
    for schema_file in schema_files:
        try:
            print(f"📄 Executing: {schema_file.name}")
            
            with open(schema_file, 'r', encoding='utf-8') as f:
                sql_content = f.read()
            
            # Use executescript for better handling of multi-statement SQL files
            # This properly handles semicolons and transactions
            try:
                # Split by semicolon but handle comments better
                statements = []
                current_statement = []
                
                for line in sql_content.split('\n'):
                    # Remove inline comments (-- comments)
                    if '--' in line:
                        line = line[:line.index('--')]
                    
                    current_statement.append(line)
                    
                    # If line ends with semicolon, it's end of statement
                    if line.strip().endswith(';'):
                        stmt = ' '.join(current_statement).strip()
                        # Remove the trailing semicolon for execute
                        if stmt.endswith(';'):
                            stmt = stmt[:-1]
                        if stmt and not stmt.isspace():
                            statements.append(stmt)
                        current_statement = []
                
                # Execute each statement individually with error handling
                for i, statement in enumerate(statements, 1):
                    try:
                        # Execute with proper error reporting
                        db.conn.execute(statement)
                        db.conn.commit()
                    except sqlite3.Error as e:
                        error_msg = str(e)
                        print(f"    ❌ Error in statement {i}: {error_msg[:200]}")
                        print(f"    Statement: {statement[:100]}...")
                        raise  # Re-raise to stop execution
            
            except sqlite3.Error as e:
                print(f"    ❌ Failed to execute {schema_file.name}: {str(e)}")
                return False
            
            # Verify table was created (for instrument schema)
            if 'instrument' in sql_content.lower():
                try:
                    result = db.conn.execute(
                        "SELECT name FROM sqlite_master WHERE type='table' AND name='instrument'"
                    ).fetchone()
                    if result:
                        print(f"    ✅ Table 'instrument' created successfully")
                    else:
                        print(f"    ⚠️  Warning: Table 'instrument' not found after creation")
                except Exception as e:
                    print(f"    ⚠️  Could not verify table creation: {e}")
            
            success_count += 1
            print(f"    ✅ {schema_file.name} completed\n")
            
        except FileNotFoundError:
            print(f"    ❌ File not found: {schema_file}")
            return False
        except Exception as e:
            print(f"    ❌ Error executing {schema_file.name}: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
    
    print(f"✅ Database initialization complete!")
    print(f"   {success_count}/{len(schema_files)} schema files executed")
    
    # Final verification
    try:
        tables = db.conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
        ).fetchall()
        if tables:
            print(f"\n📊 Created tables: {[t[0] for t in tables]}")
        else:
            print(f"\n⚠️  Warning: No tables found in database")
    except Exception as e:
        print(f"\n⚠️  Could not list tables: {e}")
    
    return True

if __name__ == "__main__":
    try:
        success = init_database()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"❌ Fatal error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)