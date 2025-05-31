/**
 * Common type definitions for SQLRC-Gen
 */

/**
 * Information about a variable placeholder in SQL
 */
export interface VariableInfo {
  /** Name of the variable */
  name: string;
  
  /** Original type as specified in SQL (e.g., "int", "string_array") */
  originalType: string;
  
  /** Order of appearance in the SQL query (for positional parameters) */
  order: number;
}

/**
 * Information about a field in the result set
 */
export interface FieldInfo {
  /** Name of the field */
  name: string;
  
  /** Original type as inferred or specified */
  originalType: string;
}

/**
 * Information about a parsed SQL query with SQLRC directives
 */
export interface QueryInfo {
  /** Function name from the SQLRC directive */
  functionName: string;
  
  /** Return type from the SQLRC directive (e.g., "one", "many", "exec") */
  returnType: string;
  
  /** Original SQL query text */
  originalSql: string;
  
  /** SQL with placeholders transformed for the target language */
  transformedSql: string;
  
  /** Array of parameters extracted from variable placeholders */
  parameters: VariableInfo[];
  
  /** Array of result fields (from SELECT clause or manually defined) */
  resultFields: FieldInfo[];
}

/**
 * Information about a parsed SQL file
 */
export interface ParsedFile {
  /** Path to the original SQL file */
  filePath: string;
  
  /** Array of queries extracted from the file */
  queries: QueryInfo[];
}

/**
 * Return types for SQL queries
 */
export enum QueryReturnType {
  /** Returns a single row */
  ONE = 'one',
  
  /** Returns multiple rows */
  MANY = 'many',
  
  /** Executes a command, no rows returned */
  EXEC = 'exec'
}
