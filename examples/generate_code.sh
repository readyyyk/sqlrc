#!/bin/bash

# This script generates code from all SQL files in the examples directory

# Create output directories if they don't exist
mkdir -p examples/go/db
mkdir -p examples/python/db

# Generate Go code
echo "Generating Go code..."
pnpm start --input examples/user_queries.sql --output-dir examples/go/db --lang go
pnpm start --input examples/post_queries.sql --output-dir examples/go/db --lang go
pnpm start --input examples/comment_queries.sql --output-dir examples/go/db --lang go
pnpm start --input examples/tag_queries.sql --output-dir examples/go/db --lang go
echo "Go code generation complete."

# Generate Python code
echo "Generating Python code..."
pnpm start --input examples/user_queries.sql --output-dir examples/python/db --lang python
pnpm start --input examples/post_queries.sql --output-dir examples/python/db --lang python
pnpm start --input examples/comment_queries.sql --output-dir examples/python/db --lang python
pnpm start --input examples/tag_queries.sql --output-dir examples/python/db --lang python
echo "Python code generation complete."

echo "Code generation completed successfully!"
