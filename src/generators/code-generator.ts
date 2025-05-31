import { ParsedFile, QueryInfo, VariableInfo, FieldInfo } from '../types';

/**
 * Interface for code generators
 * All language-specific generators should implement this interface
 */
export interface CodeGenerator {
  /**
   * Generate code for all queries in a parsed file
   * @param parsedFile Parsed SQL file with queries
   * @param outputDir Directory to save generated files
   */
  generate(parsedFile: ParsedFile, outputDir: string): Promise<void>;
  
  /**
   * Generate code for a single query
   * @param queryInfo Query information
   * @returns Generated code as string or structured output
   */
  generateSingleQuery(queryInfo: QueryInfo): string | Record<string, string>;
  
  /**
   * Map SQL type to language-specific type
   * @param sqlType Original SQL type (e.g., "int", "string_array")
   * @returns Language-specific type as string
   */
  mapType(sqlType: string): string;
}

/**
 * Abstract base class for code generators
 * Provides common functionality for all generators
 */
export abstract class BaseCodeGenerator implements CodeGenerator {
  /**
   * Generate code for all queries in a parsed file
   * @param parsedFile Parsed SQL file with queries
   * @param outputDir Directory to save generated files
   */
  abstract generate(parsedFile: ParsedFile, outputDir: string): Promise<void>;
  
  /**
   * Generate code for a single query
   * @param queryInfo Query information
   * @returns Generated code as string or structured output
   */
  abstract generateSingleQuery(queryInfo: QueryInfo): string | Record<string, string>;
  
  /**
   * Map SQL type to language-specific type
   * @param sqlType Original SQL type (e.g., "int", "string_array")
   * @returns Language-specific type as string
   */
  abstract mapType(sqlType: string): string;
  
  /**
   * Convert a string to camel case
   * @param str Input string
   * @returns Camel case string
   */
  protected toCamelCase(str: string): string {
    return str
      .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
      .replace(/^(.)/, (c) => c.toLowerCase());
  }
  
  /**
   * Convert a string to pascal case
   * @param str Input string
   * @returns Pascal case string
   */
  protected toPascalCase(str: string): string {
    const camel = this.toCamelCase(str);
    return camel.charAt(0).toUpperCase() + camel.slice(1);
  }
  
  /**
   * Convert a string to snake case
   * @param str Input string
   * @returns Snake case string
   */
  protected toSnakeCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .replace(/[\s-]+/g, '_')
      .toLowerCase();
  }
}
