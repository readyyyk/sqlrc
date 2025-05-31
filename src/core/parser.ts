// @ts-nocheck
import * as fs from 'fs/promises';
import * as path from 'path';
import { ParsedFile, QueryInfo, VariableInfo, FieldInfo, QueryReturnType } from '../types';

// Tree-sitter imports
import Parser from 'tree-sitter';
import WebTreeSitter from 'web-tree-sitter';

// Определим типы для Tree-sitter, чтобы избежать ошибок TypeScript
type TreeSitterNode = any;
type TreeSitterCapture = any;
type TreeSitterMatch = any;
type TreeSitterTree = any;
type TreeSitterParser = any;
type TreeSitterQuery = any;

/**
 * Initialize the Tree-sitter parser
 */
async function initializeParser(): Promise<TreeSitterParser | null> {
  try {
    // Поскольку мы не можем правильно инициализировать Tree-sitter,
    // используем регулярные выражения для парсинга
    console.log('Using regex-based parser for now. Tree-sitter integration is in progress.');
    return null;
    
    /* Код для будущей интеграции Tree-sitter:
    // Initialize Tree-sitter
    const Parser = await WebTreeSitter.init();
    
    // Load the WASM language file
    const wasmPath = path.join(__dirname, '../../src/grammars/tree-sitter-extended_sql.wasm');
    
    try {
      await fs.access(wasmPath);
    } catch (error) {
      console.warn(`WASM file not found at ${wasmPath}. Using regex-based parser instead.`);
      return null;
    }
    
    const language = await Parser.Language.load(wasmPath);
    const parser = new Parser();
    parser.setLanguage(language);
    return parser;
    */
  } catch (error) {
    console.warn(`Failed to initialize Tree-sitter parser: ${error}. Using regex-based parser instead.`);
    return null;
  }
}

/**
 * Parse a SQL file and extract queries with SQLRC directives
 * @param filePath Path to the SQL file
 * @returns ParsedFile object containing extracted queries
 */
export async function parseFile(filePath: string): Promise<ParsedFile> {
  try {
    // Read the file content
    const content = await fs.readFile(filePath, 'utf-8');
    
    // Try to initialize the Tree-sitter parser
    const parser = await initializeParser();
    
    let queries: QueryInfo[] = [];
    
    if (parser) {
      // Parse using Tree-sitter if available
      const tree = parser.parse(content);
      const directives = extractSqlrcDirectives(tree);
      
      // Process each directive and its associated SQL
      if (directives.length > 0) {
        // Implement Tree-sitter based parsing
        // For now, fallback to regex-based parsing until we fully implement Tree-sitter parsing
        queries = parseWithRegex(content);
      } else {
        queries = parseWithRegex(content);
      }
    } else {
      // Fallback to regex-based parsing
      queries = parseWithRegex(content);
    }
    
    return {
      filePath,
      queries
    };
  } catch (error) {
    throw new Error(`Failed to parse file ${filePath}: ${error}`);
  }
}

/**
 * Parse SQL content using regex as a fallback when Tree-sitter is not available
 * @param content SQL file content
 * @returns Array of QueryInfo objects
 */
function parseWithRegex(content: string): QueryInfo[] {
  const queries: QueryInfo[] = [];
  
  // Split content by SQL statements (assuming they end with semicolons)
  const statements = content.split(';');
  
  // Regular expression for SQLRC directives
  const directiveRegex = /--@\s*sqlrc:([a-zA-Z0-9_]+):([a-zA-Z0-9_]+)/;
  
  // Regular expression for variable placeholders
  const placeholderRegex = /<@([a-zA-Z0-9_]+):([a-zA-Z0-9_]+)@>/g;
  
  let currentDirective: { functionName: string, returnType: string } | null = null;
  let currentSql = '';
  
  // Process each statement
  for (const statement of statements) {
    const trimmed = statement.trim();
    if (!trimmed) continue;
    
    // Check for directive
    const directiveMatch = trimmed.match(directiveRegex);
    if (directiveMatch) {
      // Found a directive, start a new query
      currentDirective = {
        functionName: directiveMatch[1],
        returnType: directiveMatch[2]
      };
      
      // Extract the SQL part (everything after the directive line)
      const lines = trimmed.split('\n');
      const sqlLines = lines.slice(1);
      currentSql = sqlLines.join('\n');
    } else if (currentDirective) {
      // Continuation of previous SQL
      currentSql += '\n' + trimmed;
    }
    
    // If we have a directive and SQL, create a query
    if (currentDirective && currentSql) {
      // Extract variable placeholders
      const variables: VariableInfo[] = [];
      let match;
      let order = 0;
      
      // Reset regex state
      placeholderRegex.lastIndex = 0;
      
      // Find all placeholders
      while ((match = placeholderRegex.exec(currentSql)) !== null) {
        variables.push({
          name: match[1],
          originalType: match[2],
          order: order++
        });
      }
      
      // Create query info
      const queryInfo: QueryInfo = {
        functionName: currentDirective.functionName,
        returnType: currentDirective.returnType as QueryReturnType,
        originalSql: currentSql,
        transformedSql: transformSql(currentSql, variables),
        parameters: variables,
        resultFields: inferResultFields(currentSql)
      };
      
      queries.push(queryInfo);
      
      // Reset for next query
      currentDirective = null;
      currentSql = '';
    }
  }
  
  return queries;
}

/**
 * Infer result fields from a SQL query (simplified version)
 * @param sql SQL query
 * @returns Array of inferred field info
 */
function inferResultFields(sql: string): FieldInfo[] {
  const fields: FieldInfo[] = [];
  
  // Simple regex to extract column names from SELECT statements
  // This is a simplified approach and won't work for all SQL queries
  const selectRegex = /SELECT\s+(.+?)\s+FROM/is;
  const match = sql.match(selectRegex);
  
  if (match) {
    const columnsStr = match[1];
    
    // Split by commas, but ignore commas inside functions
    // This is a simplified approach and won't handle all cases
    const columns = columnsStr.split(',')
      .map(col => col.trim())
      .filter(col => col && col !== '*');
    
    // Process each column
    for (const column of columns) {
      // Check for alias
      const aliasMatch = column.match(/\s+AS\s+([a-zA-Z0-9_]+)$/i);
      let name = '';
      
      if (aliasMatch) {
        name = aliasMatch[1];
      } else {
        // Extract the last part of the column name (e.g., "table.column" -> "column")
        const parts = column.split('.');
        name = parts[parts.length - 1];
      }
      
      // Guess the type based on column name (very simplified)
      let type = 'string';
      if (name.includes('id') || name.endsWith('_id')) {
        type = 'int';
      } else if (name.includes('date') || name.includes('time')) {
        type = 'timestamp';
      } else if (name.includes('is_') || name.includes('has_')) {
        type = 'bool';
      }
      
      fields.push({ name, originalType: type });
    }
  }
  
  return fields;
}

/**
 * Extract SQLRC directives from the parse tree
 * @param tree Tree-sitter parse tree
 * @returns Array of extracted directives
 */
function extractSqlrcDirectives(tree: TreeSitterTree | null): any[] {
  if (!tree || !tree.rootNode) {
    return [];
  }
  
  try {
    // Create a query to find all sqlrc_directive nodes
    const query = new Parser.Query(tree.getLanguage(), '(sqlrc_directive) @directive');
    const matches = query.matches(tree.rootNode);
    
    return matches.map(match => {
      const captureNode = match.captures.find(c => c.name === 'directive');
      if (!captureNode) return null;
      
      const node = captureNode.node;
      const functionNameNode = node.child('function_name');
      const returnTypeNode = node.child('return_type');
      
      if (!functionNameNode || !returnTypeNode) return null;
      
      return {
        functionName: functionNameNode.text,
        returnType: returnTypeNode.text,
        node: node
      };
    }).filter(Boolean);
  } catch (error) {
    console.warn(`Failed to extract SQLRC directives: ${error}`);
    return [];
  }
}

/**
 * Extract variable placeholders from a SQL statement
 * @param statementNode Tree-sitter node for the SQL statement
 * @returns Array of VariableInfo objects
 */
function extractVariablePlaceholders(statementNode: TreeSitterNode | null): VariableInfo[] {
  if (!statementNode) {
    return [];
  }
  
  try {
    // Create a query to find all variable_placeholder nodes
    const query = new Parser.Query(statementNode.getLanguage(), '(variable_placeholder) @variable');
    const matches = query.matches(statementNode);
    
    return matches.map((match, index) => {
      const captureNode = match.captures.find(c => c.name === 'variable');
      if (!captureNode) return null;
      
      const node = captureNode.node;
      const nameNode = node.child('name');
      const typeNode = node.child('type');
      
      if (!nameNode || !typeNode) return null;
      
      return {
        name: nameNode.text,
        originalType: typeNode.text,
        order: index
      };
    }).filter(Boolean) as VariableInfo[];
  } catch (error) {
    console.warn(`Failed to extract variable placeholders: ${error}`);
    return [];
  }
}

/**
 * Transform SQL by replacing custom placeholders with language-specific parameter markers
 * @param sql Original SQL string
 * @param variables Array of extracted variables
 * @param paramStyle Parameter style ('?' for positional, ':name' for named, etc.)
 * @returns Transformed SQL string
 */
export function transformSql(sql: string, variables: VariableInfo[], paramStyle: 'positional' | 'named' | 'numbered' = 'positional'): string {
  let transformedSql = sql;
  
  if (paramStyle === 'positional') {
    // Replace all variable placeholders with ?
    variables.forEach(variable => {
      const regex = new RegExp(`<@${variable.name}:${variable.originalType}@>`, 'g');
      transformedSql = transformedSql.replace(regex, '?');
    });
  } else if (paramStyle === 'named') {
    // Replace all variable placeholders with :name
    variables.forEach(variable => {
      const regex = new RegExp(`<@${variable.name}:${variable.originalType}@>`, 'g');
      transformedSql = transformedSql.replace(regex, `:${variable.name}`);
    });
  } else if (paramStyle === 'numbered') {
    // Replace all variable placeholders with $1, $2, etc.
    variables.forEach((variable, index) => {
      const regex = new RegExp(`<@${variable.name}:${variable.originalType}@>`, 'g');
      transformedSql = transformedSql.replace(regex, `$${index + 1}`);
    });
  }
  
  return transformedSql;
}
