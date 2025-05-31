# SQLRC-Gen

Generate type-safe database code from SQL files with custom extensions.

## Overview

SQLRC-Gen is a command-line tool that parses SQL files containing custom extensions (metadata directives and typed variable placeholders) and generates language-specific code for database interactions. It currently supports Go and Python as target languages.

### Features

- Parse SQL files with custom SQLRC directives and typed variable placeholders
- Generate type-safe parameter and result structures
- Generate functions to execute the queries
- Support for different query return types (one, many, exec)
- Extensible architecture for adding support for additional target languages

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/sqlrc-gen.git
cd sqlrc-gen

# Install dependencies
pnpm install

# Build the project
pnpm build
```

## Usage

### Basic Usage

```bash
sqlrc-gen --input <sql-file-or-dir> --output-dir <output-dir> --lang <language>
```

### Options

- `--input, -i`: Path to SQL file or directory of SQL files
- `--output-dir, -o`: Directory to save generated files
- `--lang, -l`: Target language (go, python)
- `--config, -c`: (Optional) Path to config file for advanced settings

### Example

```bash
sqlrc-gen --input examples/users.sql --output-dir ./generated --lang go
```

## SQL Syntax Extensions

SQLRC-Gen extends SQL with two custom syntax elements:

### 1. SQLRC Directives

SQLRC directives define metadata for a SQL query, including the function name and return type.

```sql
--@ sqlrc:FunctionName:ReturnType
```

Where:
- `FunctionName`: The name of the generated function
- `ReturnType`: One of:
  - `one`: Returns a single row
  - `many`: Returns multiple rows
  - `exec`: Executes a command, no rows returned

### 2. Variable Placeholders

Variable placeholders define typed parameters in SQL queries.

```sql
<@variableName:variableType@>
```

Where:
- `variableName`: The name of the variable
- `variableType`: The type of the variable (e.g., int, string, bool, string_array)

## Example SQL File

```sql
--@ sqlrc:GetUserById:one
SELECT 
    id,
    username,
    email
FROM users
WHERE id = <@userId:int@>;

--@ sqlrc:CreateUser:exec
INSERT INTO users (username, email)
VALUES (<@username:string@>, <@email:string@>);
```

## Generated Code

### Go

```go
// Generated Go code includes:
// - Parameter structs
// - Result structs
// - SQL constants
// - Functions to execute queries
```

### Python

```python
# Generated Python code includes:
# - Parameter dataclasses
# - Result dataclasses
# - SQL constants
# - Async functions to execute queries
```

## Development

```bash
# Run in development mode (watch for changes)
pnpm dev

# Generate Tree-sitter grammar
pnpm grammar:generate

# Build Tree-sitter WASM
pnpm grammar:build
```

## License

MIT
