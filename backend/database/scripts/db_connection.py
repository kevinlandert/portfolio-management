import sqlite3
from pathlib import Path

class DatabaseConnection:
    def __init__(self):
        db_path = Path(__file__).parent.parent / "data" / "portfolio.db"
        self.conn = sqlite3.connect(str(db_path))
    
    def execute_query(self, query: str, params: tuple = None):
        """Execute a SELECT query"""
        cursor = self.conn.cursor()
        cursor.execute(query, params or ())
        return cursor.fetchall()
    
    def execute_update(self, query: str, params: tuple = None):
        """Execute INSERT/UPDATE/DELETE"""
        cursor = self.conn.cursor()
        cursor.execute(query, params or ())
        self.conn.commit()
        return cursor.lastrowid

def get_db():
    """Get database connection singleton"""
    return DatabaseConnection()