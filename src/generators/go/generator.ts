import * as fs from 'fs/promises';
import * as path from 'path';
import { BaseCodeGenerator } from '../code-generator';
import { ParsedFile, QueryInfo, VariableInfo, FieldInfo, QueryReturnType } from '../../types';

/**
 * Go code generator
 * Generates Go code for database interactions based on parsed SQL queries
 */
export class GoCodeGenerator extends BaseCodeGenerator {
  /**
   * Type mapping from SQL types to Go types
   */
  private typeMap: Record<string, string> = {
    'int': 'int',
    'integer': 'int',
    'smallint': 'int16',
    'bigint': 'int64',
    'float': 'float64',
    'double': 'float64',
    'decimal': 'float64',
    'numeric': 'float64',
    'boolean': 'bool',
    'bool': 'bool',
    'string': 'string',
    'text': 'string',
    'varchar': 'string',
    'char': 'string',
    'date': 'time.Time',
    'time': 'time.Time',
    'timestamp': 'time.Time',
    'timestamptz': 'time.Time',
    'json': 'json.RawMessage',
    'jsonb': 'json.RawMessage',
    'uuid': 'string', // Could be uuid.UUID with a suitable package
    'string_array': '[]string',
    'int_array': '[]int',
    'float_array': '[]float64',
    'bool_array': '[]bool'
  };

  /**
   * Generate Go code for all queries in a parsed file
   * @param parsedFile Parsed SQL file with queries
   * @param outputDir Directory to save generated files
   */
  async generate(parsedFile: ParsedFile, outputDir: string): Promise<void> {
    // Create a filename based on the SQL file name
    const baseName = path.basename(parsedFile.filePath, '.sql');
    const outputFile = path.join(outputDir, `${baseName}.go`);
    
    // Generate imports
    let code = this.generateImports();
    
    // Generate code for each query
    for (const query of parsedFile.queries) {
      code += this.generateSingleQuery(query);
    }
    
    // Write the file
    await fs.writeFile(outputFile, code, 'utf-8');
  }

  /**
   * Generate Go code for a single query
   * @param queryInfo Query information
   * @returns Generated Go code
   */
  generateSingleQuery(queryInfo: QueryInfo): string {
    let code = '';
    
    // Generate parameter struct
    if (queryInfo.parameters.length > 0) {
      code += this.generateParamStruct(queryInfo);
    }
    
    // Generate result struct if applicable
    if (queryInfo.returnType !== QueryReturnType.EXEC) {
      code += this.generateResultStruct(queryInfo);
    }
    
    // Generate SQL constant
    code += this.generateSqlConstant(queryInfo);
    
    // Generate function
    code += this.generateFunction(queryInfo);
    
    return code;
  }

  /**
   * Map SQL type to Go type
   * @param sqlType Original SQL type
   * @returns Go type
   */
  mapType(sqlType: string): string {
    return this.typeMap[sqlType.toLowerCase()] || 'interface{}';
  }

  /**
   * Generate Go imports
   * @returns Go imports code
   */
  private generateImports(): string {
    return `package db

import (
	"context"
	"database/sql"
	"encoding/json"
	"time"
)

// Queries struct for database operations
type Queries struct {
	DB *sql.DB
}

// New creates a new Queries instance
func New(db *sql.DB) *Queries {
	return &Queries{DB: db}
}

`;
  }

  /**
   * Generate Go parameter struct
   * @param queryInfo Query information
   * @returns Go parameter struct code
   */
  private generateParamStruct(queryInfo: QueryInfo): string {
    const structName = `${this.toPascalCase(queryInfo.functionName)}Params`;
    
    let code = `// ${structName} contains the parameters for ${queryInfo.functionName}
type ${structName} struct {
`;
    
    // Используем Set для отслеживания уже добавленных полей
    const addedFields = new Set<string>();
    
    for (const param of queryInfo.parameters) {
      const fieldName = this.toPascalCase(param.name);
      
      // Пропускаем дублирующиеся поля
      if (addedFields.has(fieldName)) {
        continue;
      }
      
      addedFields.add(fieldName);
      const fieldType = this.mapType(param.originalType);
      code += `	${fieldName} ${fieldType}\n`;
    }
    
    code += '}\n\n';
    
    return code;
  }

  /**
   * Generate Go result struct
   * @param queryInfo Query information
   * @returns Go result struct code
   */
  private generateResultStruct(queryInfo: QueryInfo): string {
    const structName = `${this.toPascalCase(queryInfo.functionName)}Result`;
    
    let code = `// ${structName} contains the result for ${queryInfo.functionName}
type ${structName} struct {
`;
    
    // Если у запроса есть поля результата, используем их
    if (queryInfo.resultFields.length > 0) {
      for (const field of queryInfo.resultFields) {
        const fieldName = this.toPascalCase(field.name);
        const fieldType = this.mapType(field.originalType);
        code += `	${fieldName} ${fieldType}\n`;
      }
    } else {
      // Для запросов с RETURNING, но без явно указанных полей результата,
      // попробуем извлечь поля из SQL-запроса
      const returningFields = this.extractReturningFields(queryInfo.transformedSql);
      if (returningFields.length > 0) {
        for (const field of returningFields) {
          code += `	${this.toPascalCase(field)} interface{}\n`;
        }
      } else {
        // Если не удалось извлечь поля, добавим заглушку
        code += `	// Add fields based on the query's RETURNING clause\n`;
      }
    }
    
    code += '}\n\n';
    
    return code;
  }
  
  /**
   * Extract field names from RETURNING clause in SQL
   * @param sql SQL query
   * @returns Array of field names
   */
  private extractReturningFields(sql: string): string[] {
    const returningMatch = sql.match(/RETURNING\s+([\s\S]+?)(?:$|WHERE|GROUP BY|ORDER BY|LIMIT|OFFSET)/i);
    if (!returningMatch) return [];
    
    const returningClause = returningMatch[1].trim();
    return returningClause.split(',')
      .map(field => {
        // Extract field name, handling aliases and functions
        const fieldName = field.trim().split(/\s+/).pop()?.replace(/["`]/g, '') || '';
        return fieldName;
      })
      .filter(name => name !== '');
  }

  /**
   * Generate Go SQL constant
   * @param queryInfo Query information
   * @returns Go SQL constant code
   */
  private generateSqlConstant(queryInfo: QueryInfo): string {
    const constName = `${this.toSnakeCase(queryInfo.functionName)}SQL`;
    
    return `const ${constName} = \`${queryInfo.transformedSql}\`\n\n`;
  }

  /**
   * Generate Go function for executing the query
   * @param queryInfo Query information
   * @returns Go function code
   */
  private generateFunction(queryInfo: QueryInfo): string {
    const funcName = this.toPascalCase(queryInfo.functionName);
    const hasParams = queryInfo.parameters.length > 0;
    const paramType = hasParams ? `${funcName}Params` : '';
    
    let returnType = '';
    let returnStatement = '';
    
    switch (queryInfo.returnType) {
      case QueryReturnType.ONE:
        returnType = `(*${funcName}Result, error)`;
        returnStatement = 'return &result, nil';
        break;
      case QueryReturnType.MANY:
        returnType = `([]${funcName}Result, error)`;
        returnStatement = 'return results, nil';
        break;
      case QueryReturnType.EXEC:
        returnType = 'error';
        returnStatement = 'return nil';
        break;
    }
    
    let code = `// ${funcName} executes the ${queryInfo.functionName} query
func (q *Queries) ${funcName}(ctx context.Context`;
    
    if (hasParams) {
      code += `, arg ${paramType}`;
    }
    
    code += `) ${returnType} {\n`;
    
    // Function body
    const sqlConstName = `${this.toSnakeCase(queryInfo.functionName)}SQL`;
    
    if (queryInfo.returnType === QueryReturnType.EXEC) {
      // EXEC query
      code += `	_, err := q.DB.ExecContext(ctx, ${sqlConstName}`;
      
      if (hasParams) {
        code += ', ';
        code += queryInfo.parameters.map(p => `arg.${this.toPascalCase(p.name)}`).join(', ');
      }
      
      code += `)\n	if err != nil {\n		return err\n	}\n\n	${returnStatement}\n}\n\n`;
    } else if (queryInfo.returnType === QueryReturnType.ONE) {
      // ONE query
      code += `	row := q.DB.QueryRowContext(ctx, ${sqlConstName}`;
      
      if (hasParams) {
        code += ', ';
        code += queryInfo.parameters.map(p => `arg.${this.toPascalCase(p.name)}`).join(', ');
      }
      
      code += `)\n\n	var result ${funcName}Result\n	err := row.Scan(\n`;
      
      // Scan fields
      if (queryInfo.resultFields.length > 0) {
        code += queryInfo.resultFields.map(f => `		&result.${this.toPascalCase(f.name)}`).join(',\n');
        code += '\n';
      } else {
        // Для запросов с RETURNING, но без явно указанных полей результата
        const returningFields = this.extractReturningFields(queryInfo.transformedSql);
        if (returningFields.length > 0) {
          code += returningFields.map(f => `		&result.${this.toPascalCase(f)}`).join(',\n');
          code += '\n';
        }
      }
      
      code += `	)\n	if err != nil {\n		return nil, err\n	}\n\n	${returnStatement}\n}\n\n`;
    } else if (queryInfo.returnType === QueryReturnType.MANY) {
      // MANY query
      code += `	rows, err := q.DB.QueryContext(ctx, ${sqlConstName}`;
      
      if (hasParams) {
        code += ', ';
        code += queryInfo.parameters.map(p => `arg.${this.toPascalCase(p.name)}`).join(', ');
      }
      
      code += `)\n	if err != nil {\n		return nil, err\n	}\n	defer rows.Close()\n\n	var results []${funcName}Result\n	for rows.Next() {\n		var result ${funcName}Result\n		err := rows.Scan(\n`;
      
      // Scan fields
      if (queryInfo.resultFields.length > 0) {
        code += queryInfo.resultFields.map(f => `			&result.${this.toPascalCase(f.name)}`).join(',\n');
        code += '\n';
      } else {
        // Для запросов с RETURNING, но без явно указанных полей результата
        const returningFields = this.extractReturningFields(queryInfo.transformedSql);
        if (returningFields.length > 0) {
          code += returningFields.map(f => `			&result.${this.toPascalCase(f)}`).join(',\n');
          code += '\n';
        }
      }
      
      code += `		)\n		if err != nil {\n			return nil, err\n		}\n		results = append(results, result)\n	}\n\n	if err := rows.Err(); err != nil {\n		return nil, err\n	}\n\n	${returnStatement}\n}\n\n`;
    }
    
    return code;
  }
}
