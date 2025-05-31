## Project Brief: SQLRC-Gen

This project, SQLRC-Gen, is a Command Line Interface (CLI) tool developed in TypeScript. Its primary function is to parse SQL files that include custom extensions:
1.  **Metadata Directives:** Such as `--@ sqlrc:FunctionName:ReturnType`.
2.  **Typed Variable Placeholders:** Such as `<@variableName:variableType@>`.

Based on these parsed SQL files, SQLRC-Gen will generate language-specific code, initially targeting Go and Python. This generated code will facilitate database interaction by providing:
-   Type-safe parameter structures.
-   Type-safe result structures.
-   Functions to execute the SQL queries.

The architecture of SQLRC-Gen is designed with extensibility in mind, allowing for future support of additional target programming languages and various SQL type mappings.

*Source: Derived from [plan.md](plan.md:1-3)*
