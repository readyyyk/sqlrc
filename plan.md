## Project Summary

This project outlines the development of a Command Line Interface (CLI) tool, "SQLRC-Gen," built with TypeScript. SQLRC-Gen parses SQL files containing custom extensions: metadata directives (e.g., `--@ sqlrc:FunctionName:ReturnType`) and typed variable placeholders (e.g., `<@variableName:variableType@>`). It then generates language-specific code (initially Go and Python) for database interaction, including type-safe parameter and result structures, and functions to execute the queries. The architecture will be designed for extensibility to support additional target languages and SQL type mappings.

---

## Technical Plan: SQLRC-Gen

### Phase 1: Project Foundation & Core Parsing Setup

#### Feature 1.1: Project Initialization and Basic Structure
*   **Task 1.1.1:** Initialize a new TypeScript project using PNPM.
    *   [ ] `pnpm init`
    *   [ ] Install TypeScript: `pnpm add -D typescript @types/node`
    *   [ ] Configure `tsconfig.json` (e.g., `target: ES2020`, `module: NodeNext` or `CommonJS`, `outDir`, `rootDir`, `strict: true`).
*   **Task 1.1.2:** Install core CLI dependencies.
    *   [ ] Install `commander` for CLI argument parsing: `pnpm add commander`
*   **Task 1.1.3:** Install Tree-sitter dependencies.
    *   [ ] Install Tree-sitter CLI globally or locally: `pnpm add -D tree-sitter-cli` (for generating parsers)
    *   [ ] Install Tree-sitter library for Node.js: `pnpm add tree-sitter web-tree-sitter` (web-tree-sitter for wasm compatibility)
*   **Task 1.1.4:** Define basic project directory structure.
    *   Example:
        ```
        /src
            /core                 // Core parsing and IR logic
            /generators           // Language-specific generators
                /go
                /python
            /grammars             // Tree-sitter grammar definitions
            /models               // Data models (IR, etc.)
            /cli.ts               // Main CLI entry point
            /types.ts             // Shared type definitions
        /test
        /examples               // Example extended SQL files
        ```

#### Feature 1.2: Tree-sitter Grammar Definition for Extended SQL
*Goal: Create a grammar that recognizes standard SQL constructs along with the custom `sqlrc` directives and variable placeholders.*
*Approach: Start with a basic SQL grammar (or a simplified one) and augment it, or adapt an existing one if suitable.*

*   **Task 1.2.1:** Create `grammar.js` for "Extended SQL."
    *   [ ] Define the grammar name (e.g., `extended_sql`).
    *   [ ] Stub out basic rules: `source_file`, `statement`.
*   **Task 1.2.2:** Define the `sqlrc_directive` node.
    *   [ ] This node should capture the pattern `--@ sqlrc:FUNCTION_NAME:RETURN_TYPE`.
    *   [ ] Sub-nodes: `function_name` (identifier), `return_type` (e.g., 'one', 'many', 'exec').
    *   Example structure in `grammar.js`:
        ```javascript
        // conceptual
        // sqlrc_directive: $ => seq(
        //   '--@',
        //   'sqlrc:',
        //   field('function_name', $.identifier),
        //   ':',
        //   field('return_type', choice('one', 'many', 'exec')) // Adjust choices as needed
        // ),
        ```
*   **Task 1.2.3:** Define the `variable_placeholder` node.
    *   [ ] This node should capture the pattern `<@NAME:TYPE@>`.
    *   [ ] Sub-nodes: `name` (identifier), `type` (identifier).
    *   Example structure in `grammar.js`:
        ```javascript
        // conceptual
        // variable_placeholder: $ => seq(
        //   '<@',
        //   field('name', $.identifier),
        //   ':',
        //   field('type', $.identifier), // e.g., int, string
        //   '@>'
        // ),
        ```
*   **Task 1.2.4:** Integrate custom nodes with a base SQL grammar.
    *   [ ] **Option A (Augment existing):** If using `tree-sitter-sql` or similar, investigate how to add these as valid top-level elements (for `sqlrc_directive`, possibly as a special comment type) and expression elements (for `variable_placeholder`). This might involve forking and modifying the chosen SQL grammar.
    *   [ ] **Option B (Custom with SQL snippets):** Define `sql_content` as any sequence of characters not part of custom directives. This is simpler but less powerful for SQL analysis.
    *   [ ] **Chosen Approach (for this plan):** Assume `sqlrc_directive` can appear at the top-level or before a main SQL query, and `variable_placeholder` can appear where SQL expressions/literals are typically allowed.
    *   [ ] Ensure the grammar correctly handles SQL keywords, identifiers, strings, comments, etc., around these custom nodes. For instance, `variable_placeholder` should be recognized within a `WHERE` clause or `LIMIT` clause.
*   **Task 1.2.5:** Generate the parser.
    *   [ ] Run `tree-sitter generate` in the directory containing `grammar.js`.
    *   [ ] This will produce `parser.c`, `binding.gyp`, etc.
    *   [ ] Compile to WebAssembly for Node.js usage: (e.g., `tree-sitter build --wasm`) or use native bindings.

---

### Phase 2: Parsing and Intermediate Representation (IR)

#### Feature 2.1: Parsing Engine Implementation
*Goal: Use the generated Tree-sitter parser to parse input extended SQL files.*

*   **Task 2.1.1:** Create a Parser Service/Module in TypeScript.
    *   [ ] Function to initialize the Tree-sitter parser with the `extended_sql` language (WASM or native module).
*   **Task 2.1.2:** Function to parse an input SQL string.
    *   [ ] Input: SQL string.
    *   [ ] Output: Tree-sitter `Tree` object.
*   **Task 2.1.3:** Develop Tree-sitter query utilities.
    *   [ ] Write queries to find `sqlrc_directive` nodes.
        *   Example query: `(sqlrc_directive) @directive`
    *   [ ] Write queries to find `variable_placeholder` nodes within a given SQL statement.
        *   Example query: `(variable_placeholder) @variable`

#### Feature 2.2: Intermediate Representation (IR) Design
*Goal: Define data structures to hold the extracted information in a language-agnostic way.*

*   **Task 2.2.1:** Define `VariableInfo` structure.
    *   Properties: `name` (string), `originalType` (string, e.g., "int", "string_array"), `order` (number, for positional params).
*   **Task 2.2.2:** Define `QueryInfo` structure.
    *   Properties:
        *   `functionName` (string)
        *   `returnType` (string, e.g., "one", "many", "exec")
        *   `originalSql` (string)
        *   `transformedSql` (string, placeholder for later)
        *   `parameters` (Array of `VariableInfo`)
        *   `resultFields` (Array of `FieldInfo` { `name`: string, `originalType`: string }, initially empty or manually defined, for future SQL `SELECT` parsing)
*   **Task 2.2.3:** Define `ParsedFile` structure.
    *   Properties: `filePath` (string), `queries` (Array of `QueryInfo`).

#### Feature 2.3: IR Extraction Logic
*Goal: Traverse the Tree-sitter CST and populate the IR structures.*

*   **Task 2.3.1:** Implement logic to extract `sqlrc_directive` data.
    *   [ ] Use Tree-sitter queries to find all `sqlrc_directive` nodes.
    *   [ ] For each, extract `function_name` and `return_type` text values.
*   **Task 2.3.2:** Implement logic to extract `variable_placeholder` data for each query.
    *   [ ] For each SQL statement associated with an `sqlrc_directive`.
    *   [ ] Use Tree-sitter queries to find all `variable_placeholder` nodes within that statement.
    *   [ ] Extract `name` and `type` text values, maintaining their order of appearance.
    *   [ ] Populate the `parameters` array in the corresponding `QueryInfo` object.
*   **Task 2.3.3:** (Placeholder for future) Logic to infer `resultFields` from `SELECT` clause.
    *   [ ] Initially, this might be empty or require manual configuration. Advanced: leverage Tree-sitter SQL parsing to identify selected columns and their aliases.

#### Feature 2.4: SQL Transformation Logic
*Goal: Modify the original SQL string by replacing custom placeholders with language-specific bind parameter markers.*

*   **Task 2.4.1:** Develop a function to transform SQL for generic positional placeholders (e.g., `?`).
    *   [ ] Iterate through `variable_placeholder` nodes in order.
    *   [ ] Replace `<@NAME:TYPE@>` occurrences with `?`.
    *   [ ] Store this in `QueryInfo.transformedSql`.
*   **Task 2.4.2:** (Future extension) Develop a function for named placeholders (e.g., `:name`) or numbered placeholders (e.g., `$1, $2`).
    *   This will be used by specific code generators if they require it.

---

### Phase 3: Code Generation Framework and Target Languages

#### Feature 3.1: Code Generation Architecture
*Goal: Design an extensible system for generating code for different target languages.*

*   **Task 3.1.1:** Define a `CodeGenerator` interface/abstract class.
    *   Methods:
        *   `generate(parsedFile: ParsedFile, outputDir: string): Promise<void>`
        *   `generateSingleQuery(queryInfo: QueryInfo): string` (or set of strings for different parts like params, result, function)
        *   `mapType(sqlType: string): string` (maps `originalType` from IR to language-specific type)
*   **Task 3.1.2:** Implement a Type Mapping System.
    *   [ ] Create a configuration or registry for type mappings (e.g., "int" -> "int" in Go, "int" -> "int" in Python; "string_array" -> "[]string" in Go, "string_array" -> "List[str]" in Python).
    *   [ ] Each `CodeGenerator` implementation will use this system.

#### Feature 3.2: Go Code Generator
*Goal: Generate Go code based on the IR.*

*   **Task 3.2.1:** Create `GoCodeGenerator` class implementing `CodeGenerator`.
*   **Task 3.2.2:** Implement Go type mapping.
    *   [ ] `mapType("int")` -> `"int"`
    *   [ ] `mapType("string")` -> `"string"`
    *   [ ] `mapType("string_array")` -> `"pq.StringArray"` (if using `lib/pq`) or handle array expansion.
    *   [ ] Add more types as needed (e.g., "bool", "float", "timestamp").
*   **Task 3.2.3:** Implement generation of Go parameter struct.
    *   From: `QueryInfo.parameters`
    *   Example: `type FunctionNameParams struct { Param1Name GoType1; Param2Name GoType2 }`
*   **Task 3.2.4:** Implement generation of Go result struct.
    *   [ ] **Initial Approach:** Require manual definition of result struct fields in a config or a special comment.
    *   [ ] **Simplified Generation:** If `QueryInfo.resultFields` is populated (even manually), generate:
        `type FunctionNameResult struct { Field1Name GoType1; Field2Name GoType2 }`
    *   [ ] **Scanning:** Ensure `rows.Scan()` arguments match the result struct fields.
*   **Task 3.2.5:** Implement generation of the SQL query constant string.
    *   [ ] Use `QueryInfo.transformedSql` (with `?` placeholders).
*   **Task 3.2.6:** Implement generation of the Go database interaction function.
    *   [ ] Function signature: `func (q *Queries) FunctionName(ctx context.Context, arg FunctionNameParams) (*[]FunctionNameResult | *FunctionNameResult | error)` based on `QueryInfo.returnType`.
    *   [ ] Use `q.DB.QueryContext` or `q.DB.ExecContext`.
    *   [ ] Handle parameter passing (e.g., `arg.Param1Name, arg.Param2Name`).
    *   [ ] Handle `rows.Scan()` for single or multiple results (`many` vs `one`). Handle `exec` for no results.
    *   [ ] Include error handling and `rows.Close()`.
    *   [ ] Special handling for `string_array` parameters if they need to be passed in a specific way (e.g., `pq.Array` for PostgreSQL).
*   **Task 3.2.7:** Implement file generation logic.
    *   [ ] Combine generated parts into a single `.go` file or multiple.
    *   [ ] Include necessary imports (e.g., "context", "database/sql", "github.com/lib/pq" if used).

#### Feature 3.3: Python Code Generator
*Goal: Generate Python code based on the IR.*

*   **Task 3.3.1:** Create `PythonCodeGenerator` class implementing `CodeGenerator`.
*   **Task 3.3.2:** Implement Python type mapping.
    *   [ ] `mapType("int")` -> `"int"`
    *   [ ] `mapType("string")` -> `"str"`
    *   [ ] `mapType("string_array")` -> `"List[str]"`
    *   [ ] Type hints should be used.
*   **Task 3.3.3:** Implement generation of Python parameter dataclass/dictionary.
    *   From: `QueryInfo.parameters`
    *   Example (dataclass): `@dataclass class FunctionNameParams: Param1Name: PyType1; Param2Name: PyType2`
*   **Task 3.3.4:** Implement generation of Python result dataclass/dictionary.
    *   [ ] Similar to Go, initially manual or simplified from `QueryInfo.resultFields`.
*   **Task 3.3.5:** Implement generation of the SQL query constant string.
    *   [ ] Use `QueryInfo.transformedSql` (with `?` or `%s` depending on DB driver). Adjust transformation if needed.
*   **Task 3.3.6:** Implement generation of the Python database interaction function.
    *   [ ] Function signature: `async def function_name(self, conn, params: FunctionNameParams) -> List[FunctionNameResult] | FunctionNameResult | None:`
    *   [ ] Use a common Python DB API (e.g., `asyncpg`, `psycopg2`, `sqlite3`).
    *   [ ] Handle parameter passing (often as a tuple or dictionary).
    *   [ ] Handle fetching results (`fetchone`, `fetchall`).
    *   [ ] Map rows to result dataclasses.
*   **Task 3.3.7:** Implement file generation logic.
    *   [ ] Combine into `.py` files.
    *   [ ] Include necessary imports (e.g., `typing`, `dataclasses`, DB driver).

---

### Phase 4: CLI, Testing, and Finalization

#### Feature 4.1: CLI Interface Implementation
*Goal: Allow users to interact with the tool via command-line arguments.*

*   **Task 4.1.1:** Setup `commander` for parsing arguments.
    *   [ ] Define options:
        *   `--input <file_or_dir>` (path to SQL file or directory of SQL files)
        *   `--output-dir <dir>` (directory to save generated files)
        *   `--lang <language>` (e.g., "go", "python") - support multiple?
        *   `--config <path_to_config_file>` (optional, for advanced settings like type mappings, result struct definitions)
*   **Task 4.1.2:** Implement file discovery logic.
    *   [ ] If input is a directory, find all `.sql` (or configurable extension) files.
*   **Task 4.1.3:** Main CLI workflow.
    *   [ ] Parse arguments.
    *   [ ] For each input file:
        *   Read content.
        *   Parse using `ParsingEngine`.
        *   Create IR.
        *   Select appropriate `CodeGenerator` based on `--lang`.
        *   Call `generator.generate(parsedFile, outputDir)`.
    *   [ ] Add logging for progress and errors.

#### Feature 4.2: Testing Strategy
*Goal: Ensure correctness and robustness of the tool.*

*   **Task 4.2.1:** Setup a testing framework (e.g., Jest, Vitest).
    *   [ ] `pnpm add -D jest @types/jest ts-jest` (or Vitest equivalents)
*   **Task 4.2.2:** Unit tests for Tree-sitter grammar and AST traversal.
    *   [ ] Test parsing of `sqlrc_directive` and `variable_placeholder`.
    *   [ ] Test extraction of names, types, and function metadata.
*   **Task 4.2.3:** Unit tests for IR generation.
    *   [ ] Given specific CSTs, ensure correct `QueryInfo` and `VariableInfo` are created.
*   **Task 4.2.4:** Unit tests for SQL transformation.
    *   [ ] Ensure placeholders are correctly replaced.
*   **Task 4.2.5:** Unit tests for each Code Generator.
    *   [ ] Test type mapping logic.
    *   [ ] Test generation of structs/classes and functions for various IR inputs.
    *   [ ] Use snapshot testing for generated code snippets.
*   **Task 4.2.6:** Integration tests for the CLI.
    *   [ ] Run the CLI tool against example `.sql` files and verify the output generated files.

#### Feature 4.3: Documentation and Refinements
*Goal: Provide clear instructions and improve tool usability.*

*   **Task 4.3.1:** Write README.md.
    *   [ ] Project description, features.
    *   [ ] Installation instructions.
    *   [ ] Usage examples for CLI.
    *   [ ] Syntax for extended SQL (`sqlrc` and variables).
    *   [ ] How to define types and expected type mappings.
*   **Task 4.3.2:** Add comments and TSDoc to the codebase.
*   **Task 4.3.3:** Error handling improvements.
    *   [ ] Provide clear error messages for parsing failures, invalid types, etc.
*   **Task 4.3.4:** (Optional) Investigate more advanced SQL `SELECT` clause parsing for automatic result struct field detection.
    *   [ ] This would involve more deeply using the capabilities of a full SQL Tree-sitter grammar to identify `SELECT ... AS ...` and `table.*` patterns.
