package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"

	_ "github.com/mattn/go-sqlite3"
	"github.com/readyyyk/sqlrc/examples/go/db"
)

func main() {
	// Create a temporary SQLite database
	dbFile := "blog.db"

	// Remove existing database if it exists
	os.Remove(dbFile)

	// Open a connection to the SQLite database
	sqlDB, err := sql.Open("sqlite3", dbFile)
	if err != nil {
		log.Fatalf("Failed to open database: %v", err)
	}
	defer sqlDB.Close()

	// Create a new Queries instance
	queries := db.New(sqlDB)

	// Initialize the database with schema
	if err := initializeDatabase(sqlDB); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	// Create a context
	ctx := context.Background()

	// Create a user
	user, err := createUser(ctx, queries)
	if err != nil {
		log.Fatalf("Failed to create user: %v", err)
	}
	fmt.Printf("Created user: %+v\n", user)

	// Create a post
	post, err := createPost(ctx, queries, user.ID)
	if err != nil {
		log.Fatalf("Failed to create post: %v", err)
	}
	fmt.Printf("Created post: %+v\n", post)

	// Create a tag
	tag, err := createTag(ctx, queries)
	if err != nil {
		log.Fatalf("Failed to create tag: %v", err)
	}
	fmt.Printf("Created tag: %+v\n", tag)

	// Add tag to post
	if err := addTagToPost(ctx, queries, post.ID, tag.ID); err != nil {
		log.Fatalf("Failed to add tag to post: %v", err)
	}
	fmt.Println("Added tag to post")

	// Create a comment
	comment, err := createComment(ctx, queries, user.ID, post.ID)
	if err != nil {
		log.Fatalf("Failed to create comment: %v", err)
	}
	fmt.Printf("Created comment: %+v\n", comment)

	// Get user by ID
	fetchedUser, err := queries.GetUserById(ctx, db.GetUserByIdParams{
		UserId: user.ID,
	})
	if err != nil {
		log.Fatalf("Failed to get user: %v", err)
	}
	fmt.Printf("Fetched user: %+v\n", fetchedUser)

	// List posts
	posts, err := queries.ListPosts(ctx, db.ListPostsParams{
		Limit:  10,
		Offset: 0,
	})
	if err != nil {
		log.Fatalf("Failed to list posts: %v", err)
	}
	fmt.Printf("Listed %d posts\n", len(posts))

	// List comments by post
	comments, err := queries.ListCommentsByPost(ctx, db.ListCommentsByPostParams{
		PostId: post.ID,
		Limit:  10,
		Offset: 0,
	})
	if err != nil {
		log.Fatalf("Failed to list comments: %v", err)
	}
	fmt.Printf("Listed %d comments\n", len(comments))

	// List tags by post
	tags, err := queries.ListTagsByPost(ctx, db.ListTagsByPostParams{
		PostId: post.ID,
	})
	if err != nil {
		log.Fatalf("Failed to list tags: %v", err)
	}
	fmt.Printf("Listed %d tags\n", len(tags))

	// Update post
	updatedPost, err := queries.UpdatePost(ctx, db.UpdatePostParams{
		PostId:      post.ID,
		Title:       "Updated Title",
		Content:     "Updated Content",
		IsPublished: true,
	})
	if err != nil {
		log.Fatalf("Failed to update post: %v", err)
	}
	fmt.Printf("Updated post: %+v\n", updatedPost)

	// Delete comment
	if err := queries.DeleteComment(ctx, db.DeleteCommentParams{
		CommentId: comment.ID,
		UserId:    user.ID,
		IsAdmin:   true,
	}); err != nil {
		log.Fatalf("Failed to delete comment: %v", err)
	}
	fmt.Println("Deleted comment")

	// Delete post
	if err := queries.DeletePost(ctx, db.DeletePostParams{
		PostId: post.ID,
	}); err != nil {
		log.Fatalf("Failed to delete post: %v", err)
	}
	fmt.Println("Deleted post")

	// Delete user
	if err := queries.DeleteUser(ctx, db.DeleteUserParams{
		UserId: user.ID,
	}); err != nil {
		log.Fatalf("Failed to delete user: %v", err)
	}
	fmt.Println("Deleted user")

	fmt.Println("All operations completed successfully!")
}

func initializeDatabase(db *sql.DB) error {
	// Read schema.sql file
	schemaPath := filepath.Join(filepath.Dir(os.Args[0]), "..", "schema.sql")
	schemaBytes, err := os.ReadFile(schemaPath)
	if err != nil {
		return fmt.Errorf("failed to read schema file: %w", err)
	}

	// Execute schema SQL
	_, err = db.Exec(string(schemaBytes))
	if err != nil {
		return fmt.Errorf("failed to execute schema SQL: %w", err)
	}

	return nil
}

func createUser(ctx context.Context, queries *db.Queries) (*db.CreateUserResult, error) {
	return queries.CreateUser(ctx, db.CreateUserParams{
		Username:     "testuser",
		Email:        "test@example.com",
		PasswordHash: "hashed_password",
		Role:         "user",
		IsActive:     true,
	})
}

func createPost(ctx context.Context, queries *db.Queries, userId int64) (*db.CreatePostResult, error) {
	return queries.CreatePost(ctx, db.CreatePostParams{
		Title:       "Test Post",
		Content:     "This is a test post content.",
		UserId:      userId,
		IsPublished: false,
	})
}

func createTag(ctx context.Context, queries *db.Queries) (*db.CreateTagResult, error) {
	return queries.CreateTag(ctx, db.CreateTagParams{
		Name: "test-tag",
	})
}

func addTagToPost(ctx context.Context, queries *db.Queries, postId, tagId int64) error {
	return queries.AddTagToPost(ctx, db.AddTagToPostParams{
		PostId: postId,
		TagId:  tagId,
	})
}

func createComment(ctx context.Context, queries *db.Queries, userId, postId int64) (*db.CreateCommentResult, error) {
	return queries.CreateComment(ctx, db.CreateCommentParams{
		Content: "This is a test comment.",
		UserId:  userId,
		PostId:  postId,
	})
}
