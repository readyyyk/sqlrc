# SQLRC-Gen Examples

This directory contains examples of SQL files with SQLRC directives and example applications that use the generated code.

## Directory Structure

- `schema.sql` - Database schema definition with CREATE TABLE statements
- `user_queries.sql` - SQL queries for user-related operations
- `post_queries.sql` - SQL queries for post-related operations
- `comment_queries.sql` - SQL queries for comment-related operations
- `tag_queries.sql` - SQL queries for tag-related operations
- `go/` - Example Go application using the generated code
- `python/` - Example Python application using the generated code

## Database Schema

The example uses a simple blog database with the following tables:
- `users` - User accounts
- `posts` - Blog posts
- `comments` - Comments on posts
- `tags` - Tags for categorizing posts
- `post_tags` - Many-to-many relationship between posts and tags

## Generating Code

To generate Go code from the SQL files:

```bash
# Generate Go code
sqlrc-gen --input examples/user_queries.sql --output-dir examples/go/db --lang go
sqlrc-gen --input examples/post_queries.sql --output-dir examples/go/db --lang go
sqlrc-gen --input examples/comment_queries.sql --output-dir examples/go/db --lang go
sqlrc-gen --input examples/tag_queries.sql --output-dir examples/go/db --lang go
```

To generate Python code from the SQL files:

```bash
# Generate Python code
sqlrc-gen --input examples/user_queries.sql --output-dir examples/python/db --lang python
sqlrc-gen --input examples/post_queries.sql --output-dir examples/python/db --lang python
sqlrc-gen --input examples/comment_queries.sql --output-dir examples/python/db --lang python
sqlrc-gen --input examples/tag_queries.sql --output-dir examples/python/db --lang python
```

## Running the Examples

### Go Example

The Go example uses SQLite as the database and demonstrates how to use the generated code to perform CRUD operations.

Prerequisites:
- Go 1.16 or later
- SQLite3

```bash
# Install dependencies
cd examples/go
go mod init github.com/readyyyk/sqlrc/examples/go
go get github.com/mattn/go-sqlite3

# Generate the code (if not already done)
cd ../..
sqlrc-gen --input examples/user_queries.sql --output-dir examples/go/db --lang go
sqlrc-gen --input examples/post_queries.sql --output-dir examples/go/db --lang go
sqlrc-gen --input examples/comment_queries.sql --output-dir examples/go/db --lang go
sqlrc-gen --input examples/tag_queries.sql --output-dir examples/go/db --lang go

# Run the example
cd examples/go
go run main.go
```

### Python Example

The Python example also uses SQLite and demonstrates how to use the generated code with asyncio.

Prerequisites:
- Python 3.7 or later
- aiosqlite (optional, for a real implementation)

```bash
# Generate the code (if not already done)
sqlrc-gen --input examples/user_queries.sql --output-dir examples/python/db --lang python
sqlrc-gen --input examples/post_queries.sql --output-dir examples/python/db --lang python
sqlrc-gen --input examples/comment_queries.sql --output-dir examples/python/db --lang python
sqlrc-gen --input examples/tag_queries.sql --output-dir examples/python/db --lang python

# Run the example
cd examples/python
python main.py
```

## Understanding the Generated Code

The generated code includes:

1. **Type Definitions**: Structs (Go) or dataclasses (Python) for parameters and results
2. **SQL Constants**: The SQL queries with placeholders replaced with appropriate parameter markers
3. **Database Functions**: Functions to execute the queries with proper parameter binding and result mapping

### Go Example

In Go, the generated code uses the standard `database/sql` package and follows these patterns:

```go
// Parameter struct
type CreateUserParams struct {
    Username     string
    Email        string
    PasswordHash string
    Role         string
    IsActive     bool
}

// Result struct
type CreateUserResult struct {
    ID        int64
    Username  string
    Email     string
    Role      string
    IsActive  bool
    CreatedAt time.Time
    UpdatedAt time.Time
}

// SQL constant
const createUserSQL = `INSERT INTO users (...) VALUES (...) RETURNING ...`

// Database function
func (q *Queries) CreateUser(ctx context.Context, arg CreateUserParams) (*CreateUserResult, error) {
    // Execute the query and map results
}
```

### Python Example

In Python, the generated code uses asyncio and follows these patterns:

```python
@dataclass
class CreateUserParams:
    username: str
    email: str
    password_hash: str
    role: str
    is_active: bool

@dataclass
class CreateUserResult:
    id: int
    username: str
    email: str
    role: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

CREATE_USER_SQL = """INSERT INTO users (...) VALUES (...) RETURNING ..."""

async def create_user(self, params: CreateUserParams) -> CreateUserResult:
    # Execute the query and map results
```

## Customizing the Examples

You can modify the SQL files to add new queries or change existing ones. After making changes, regenerate the code using the `sqlrc-gen` command.

You can also modify the example applications to use different database drivers or add more functionality.
