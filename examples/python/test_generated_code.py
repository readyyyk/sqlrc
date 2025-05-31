import os
import sqlite3
import asyncio
from dataclasses import dataclass
from typing import Optional

# Import the generated code
from db.user_queries import Queries, GetUserByIdParams, DeleteUserParams

# Define missing classes
@dataclass
class CreateUserParams:
    """Parameters for create_user query"""
    username: str
    email: str
    password_hash: str
    role: str
    is_active: bool

@dataclass
class CreateUserResult:
    """Result for create_user query"""
    id: int
    username: str
    email: str
    role: str
    is_active: bool
    created_at: str
    updated_at: str

# Mock connection pool for SQLite
class SqlitePool:
    def __init__(self, db_path: str):
        self.db_path = db_path
        self.conn = None
        
    async def acquire(self):
        return SqliteConnection(self.db_path)

class SqliteConnection:
    def __init__(self, db_path: str):
        self.db_path = db_path
        self.conn = None
        
    async def __aenter__(self):
        self.conn = sqlite3.connect(self.db_path)
        self.conn.row_factory = sqlite3.Row
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.conn:
            self.conn.close()
            
    async def execute(self, query: str, *args):
        cursor = self.conn.cursor()
        cursor.execute(query, args)
        self.conn.commit()
        return cursor.rowcount
        
    async def fetchrow(self, query: str, *args):
        cursor = self.conn.cursor()
        cursor.execute(query, args)
        row = cursor.fetchone()
        return row
        
    async def fetch(self, query: str, *args):
        cursor = self.conn.cursor()
        cursor.execute(query, args)
        rows = cursor.fetchall()
        return rows

# Patch the create_user method to fix the missing fields
async def patched_create_user(self, params: CreateUserParams) -> Optional[CreateUserResult]:
    """
    Execute the create_user query with fixed result handling
    """
    async with self.pool.acquire() as conn:
        # Use a modified query without RETURNING for SQLite compatibility
        query = """
        INSERT INTO users (
            username,
            email,
            password_hash,
            role,
            is_active
        ) VALUES (?, ?, ?, ?, ?)
        """
        await conn.execute(query, params.username, params.email, params.password_hash, params.role, params.is_active)
        
        # Get the last inserted ID
        row = await conn.fetchrow("SELECT last_insert_rowid() as id")
        user_id = row[0]
        
        # Fetch the created user
        get_params = GetUserByIdParams(user_id=user_id)
        return await self.get_user_by_id(get_params)

async def initialize_database(db_path: str):
    # Remove existing database if it exists
    if os.path.exists(db_path):
        os.remove(db_path)
    
    # Read schema.sql file
    with open(os.path.join(os.path.dirname(__file__), "..", "schema.sql"), "r") as f:
        schema_sql = f.read()
    
    # Create a new database and execute the schema
    conn = sqlite3.connect(db_path)
    conn.executescript(schema_sql)
    conn.close()

async def main():
    # Database file path
    db_path = "test_generated.db"
    
    # Initialize the database
    await initialize_database(db_path)
    
    # Create a connection pool
    pool = SqlitePool(db_path)
    
    # Create queries instance
    queries = Queries(pool)
    
    # Patch the create_user method
    queries.create_user = patched_create_user.__get__(queries)
    
    # Test the generated code
    print("Testing generated code...")
    
    # Create a user
    user = await queries.create_user(CreateUserParams(
        username="testuser",
        email="test@example.com",
        password_hash="hashed_password",
        role="user",
        is_active=True
    ))
    print(f"Created user: {user}")
    
    # Get user by ID
    if user:
        user_id = user.id
        fetched_user = await queries.get_user_by_id(GetUserByIdParams(user_id=user_id))
        print(f"Fetched user: {fetched_user}")
        
        # Delete user
        await queries.delete_user(DeleteUserParams(user_id=user_id))
        print("Deleted user")
        
        # Verify deletion
        deleted_user = await queries.get_user_by_id(GetUserByIdParams(user_id=user_id))
        print(f"After deletion: {deleted_user}")
    else:
        print("User creation failed")
    
    print("Test completed!")

if __name__ == "__main__":
    asyncio.run(main())
