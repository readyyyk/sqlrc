import os
import sqlite3
from dataclasses import dataclass

# This is a simplified example that doesn't use asyncio
# It demonstrates how the generated code would be used

@dataclass
class CreateUserParams:
    username: str
    email: str
    password_hash: str
    role: str
    is_active: bool

@dataclass
class GetUserByIdParams:
    user_id: int

@dataclass
class DeleteUserParams:
    user_id: int

class UserQueries:
    def __init__(self, conn):
        self.conn = conn
        
    def create_user(self, params):
        query = """
        INSERT INTO users (username, email, password_hash, role, is_active)
        VALUES (?, ?, ?, ?, ?)
        """
        cursor = self.conn.cursor()
        cursor.execute(query, (
            params.username, 
            params.email, 
            params.password_hash, 
            params.role, 
            params.is_active
        ))
        self.conn.commit()
        
        # Get the inserted ID
        user_id = cursor.lastrowid
        
        # Fetch the created user
        return self.get_user_by_id(GetUserByIdParams(user_id=user_id))
            
    def get_user_by_id(self, params):
        query = """
        SELECT id, username, email, role, is_active, created_at, updated_at
        FROM users
        WHERE id = ?
        """
        cursor = self.conn.cursor()
        cursor.execute(query, (params.user_id,))
        row = cursor.fetchone()
        
        if row is None:
            return None
            
        return {
            'id': row[0],
            'username': row[1],
            'email': row[2],
            'role': row[3],
            'is_active': row[4],
            'created_at': row[5],
            'updated_at': row[6]
        }
            
    def delete_user(self, params):
        query = "DELETE FROM users WHERE id = ?"
        cursor = self.conn.cursor()
        cursor.execute(query, (params.user_id,))
        self.conn.commit()

def initialize_database(db_path):
    # Remove existing database if it exists
    if os.path.exists(db_path):
        os.remove(db_path)
    
    # Read schema.sql file
    with open(os.path.join(os.path.dirname(__file__), "..", "schema.sql"), "r") as f:
        schema_sql = f.read()
    
    # Create a new database and execute the schema
    conn = sqlite3.connect(db_path)
    conn.executescript(schema_sql)
    return conn

def main():
    # Database file path
    db_path = "blog.db"
    
    # Initialize the database
    conn = initialize_database(db_path)
    
    # Enable row factory to get column names
    conn.row_factory = sqlite3.Row
    
    # Create queries instance
    user_queries = UserQueries(conn)
    
    # Create a user
    user = user_queries.create_user(CreateUserParams(
        username="testuser",
        email="test@example.com",
        password_hash="hashed_password",
        role="user",
        is_active=True
    ))
    print(f"Created user: {user}")
    
    # Get user by ID
    if user:  # Check if user is not None
        fetched_user = user_queries.get_user_by_id(GetUserByIdParams(user_id=user['id']))
        print(f"Fetched user: {fetched_user}")
        
        # Delete user
        user_queries.delete_user(DeleteUserParams(user_id=user['id']))
        print("Deleted user")
    else:
        print("User creation failed")
    
    # Close the connection
    conn.close()
    
    print("All operations completed successfully!")

if __name__ == "__main__":
    main()
