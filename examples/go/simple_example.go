package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"

	_ "github.com/mattn/go-sqlite3"
)

// Simplified example that demonstrates how the generated code would be used

// Parameter structs
type CreateUserParams struct {
	Username     string
	Email        string
	PasswordHash string
	Role         string
	IsActive     bool
}

type GetUserByIdParams struct {
	UserId int64
}

type DeleteUserParams struct {
	UserId int64
}

// Result structs
type User struct {
	ID        int64
	Username  string
	Email     string
	Role      string
	IsActive  bool
	CreatedAt string
	UpdatedAt string
}

// Queries struct for database operations
type Queries struct {
	DB *sql.DB
}

// New creates a new Queries instance
func New(db *sql.DB) *Queries {
	return &Queries{DB: db}
}

// CreateUser creates a new user
func (q *Queries) CreateUser(params CreateUserParams) (*User, error) {
	query := `
	INSERT INTO users (username, email, password_hash, role, is_active)
	VALUES (?, ?, ?, ?, ?)
	`
	result, err := q.DB.Exec(query, params.Username, params.Email, params.PasswordHash, params.Role, params.IsActive)
	if err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return nil, fmt.Errorf("failed to get last insert ID: %w", err)
	}

	// Get the created user
	return q.GetUserById(GetUserByIdParams{UserId: id})
}

// GetUserById gets a user by ID
func (q *Queries) GetUserById(params GetUserByIdParams) (*User, error) {
	query := `
	SELECT id, username, email, role, is_active, created_at, updated_at
	FROM users
	WHERE id = ?
	`
	row := q.DB.QueryRow(query, params.UserId)

	var user User
	err := row.Scan(
		&user.ID,
		&user.Username,
		&user.Email,
		&user.Role,
		&user.IsActive,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to scan user: %w", err)
	}

	return &user, nil
}

// DeleteUser deletes a user by ID
func (q *Queries) DeleteUser(params DeleteUserParams) error {
	query := `DELETE FROM users WHERE id = ?`
	_, err := q.DB.Exec(query, params.UserId)
	if err != nil {
		return fmt.Errorf("failed to delete user: %w", err)
	}
	return nil
}

func initializeDatabase(dbPath string) (*sql.DB, error) {
	// Remove existing database if it exists
	os.Remove(dbPath)

	// Open a connection to the SQLite database
	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	// Read schema.sql file
	schemaPath := filepath.Join(filepath.Dir(os.Args[0]), "..", "schema.sql")
	schemaBytes, err := os.ReadFile(schemaPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read schema file: %w", err)
	}

	// Execute schema SQL
	_, err = db.Exec(string(schemaBytes))
	if err != nil {
		return nil, fmt.Errorf("failed to execute schema SQL: %w", err)
	}

	return db, nil
}

func main() {
	// Create a temporary SQLite database
	dbFile := "blog.db"

	// Initialize the database
	db, err := initializeDatabase(dbFile)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer db.Close()

	// Create a new Queries instance
	queries := New(db)

	// Create a user
	user, err := queries.CreateUser(CreateUserParams{
		Username:     "testuser",
		Email:        "test@example.com",
		PasswordHash: "hashed_password",
		Role:         "user",
		IsActive:     true,
	})
	if err != nil {
		log.Fatalf("Failed to create user: %v", err)
	}
	fmt.Printf("Created user: %+v\n", user)

	// Get user by ID
	fetchedUser, err := queries.GetUserById(GetUserByIdParams{
		UserId: user.ID,
	})
	if err != nil {
		log.Fatalf("Failed to get user: %v", err)
	}
	fmt.Printf("Fetched user: %+v\n", fetchedUser)

	// Delete user
	err = queries.DeleteUser(DeleteUserParams{
		UserId: user.ID,
	})
	if err != nil {
		log.Fatalf("Failed to delete user: %v", err)
	}
	fmt.Println("Deleted user")

	fmt.Println("All operations completed successfully!")
}
