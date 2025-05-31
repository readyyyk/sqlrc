## System Patterns: SQLRC-Gen

**Last Updated:** 2025-05-31

---

### Pattern 001: Code Generator Interface
*   **Source:** [`plan.md`](plan.md:147) (Task 3.1.1)
*   **Description:** Defines a common interface or abstract class (`CodeGenerator`) that all language-specific code generators (e.g., `GoCodeGenerator`, `PythonCodeGenerator`) will implement. This promotes consistency and simplifies the addition of new target languages.
*   **Key Methods (as per plan):**
    *   `generate(parsedFile: ParsedFile, outputDir: string): Promise<void>`
    *   `generateSingleQuery(queryInfo: QueryInfo): string` (or structured output)
    *   `mapType(sqlType: string): string`
*   **Benefits:**
    *   **Extensibility:** New languages can be supported by creating a new class that implements this interface.
    *   **Decoupling:** The core parsing and IR logic is decoupled from the specifics of code generation for any particular language.
    *   **Maintainability:** Changes to the generation logic for one language are isolated.
*   **Status:** Defined in plan, to be implemented in Phase 3.

---

### Pattern 002: Type Mapping System
*   **Source:** [`plan.md`](plan.md:152) (Task 3.1.2)
*   **Description:** A system (likely a configuration, registry, or a set of rules within each generator) responsible for translating `originalType` strings from the Intermediate Representation (IR) (e.g., "int", "string_array") into their corresponding language-specific type declarations (e.g., "int" in Go, "List[str]" in Python).
*   **Implementation:** Each `CodeGenerator` implementation will utilize or implement this system for its target language.
*   **Benefits:**
    *   **Clarity:** Centralizes type conversion logic.
    *   **Configurability:** Allows for easier updates or additions to type mappings.
    *   **Consistency:** Ensures types are handled uniformly within each generator.
*   **Status:** Defined in plan, to be implemented in Phase 3.

---
*(Future patterns will be appended here)*
