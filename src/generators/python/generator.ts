import * as fs from 'fs/promises';
import * as path from 'path';
import { BaseCodeGenerator } from '../code-generator';
import { ParsedFile, QueryInfo, VariableInfo, FieldInfo, QueryReturnType } from '../../types';

/**
 * Python code generator
 * Generates Python code for database interactions based on parsed SQL queries
 */
export class PythonCodeGenerator extends BaseCodeGenerator {
  /**
   * Type mapping from SQL types to Python types
   */
  private typeMap: Record<string, string> = {
    'int': 'int',
    'integer': 'int',
    'smallint': 'int',
    'bigint': 'int',
    'float': 'float',
    'double': 'float',
    'decimal': 'Decimal',
    'numeric': 'Decimal',
    'boolean': 'bool',
    'bool': 'bool',
    'string': 'str',
    'text': 'str',
    'varchar': 'str',
    'char': 'str',
    'date': 'date',
    'time': 'time',
    'timestamp': 'datetime',
    'timestamptz': 'datetime',
    'json': 'Dict[str, Any]',
    'jsonb': 'Dict[str, Any]',
    'uuid': 'str',  // Could be UUID with a suitable import
    'string_array': 'List[str]',
    'int_array': 'List[int]',
    'float_array': 'List[float]',
    'bool_array': 'List[bool]'
  };

  /**
   * Generate Python code for all queries in a parsed file
   * @param parsedFile Parsed SQL file with queries
   * @param outputDir Directory to save generated files
   */
  async generate(parsedFile: ParsedFile, outputDir: string): Promise<void> {
    // Create a filename based on the SQL file name
    const baseName = path.basename(parsedFile.filePath, '.sql');
    const outputFile = path.join(outputDir, `${this.toSnakeCase(baseName)}.py`);
    
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
   * Generate Python code for a single query
   * @param queryInfo Query information
   * @returns Generated Python code
   */
  generateSingleQuery(queryInfo: QueryInfo): string {
    let code = '';
    
    // Generate parameter dataclass
    if (queryInfo.parameters.length > 0) {
      code += this.generateParamDataclass(queryInfo);
    }
    
    // Generate result dataclass if applicable
    if (queryInfo.returnType !== QueryReturnType.EXEC) {
      code += this.generateResultDataclass(queryInfo);
    }
    
    // Generate SQL constant
    code += this.generateSqlConstant(queryInfo);
    
    // Generate function
    code += this.generateFunction(queryInfo);
    
    return code;
  }

  /**
   * Map SQL type to Python type
   * @param sqlType Original SQL type
   * @returns Python type
   */
  mapType(sqlType: string): string {
    return this.typeMap[sqlType.toLowerCase()] || 'Any';
  }

  /**
   * Generate Python imports
   * @returns Python imports code
   */
  private generateImports(): string {
    return `from dataclasses import dataclass
from typing import List, Dict, Optional, Any, Union, Tuple
from datetime import date, time, datetime
from decimal import Decimal
import asyncio
import asyncpg

class Queries:
    def __init__(self, pool):
        self.pool = pool

`;
  }

  /**
   * Generate Python parameter dataclass
   * @param queryInfo Query information
   * @returns Python parameter dataclass code
   */
  private generateParamDataclass(queryInfo: QueryInfo): string {
    const className = `${this.toPascalCase(queryInfo.functionName)}Params`;
    
    let code = `@dataclass
class ${className}:
    """Parameters for ${this.toSnakeCase(queryInfo.functionName)} query"""
`;
    
    // Используем Set для отслеживания уже добавленных полей
    const addedFields = new Set<string>();
    
    for (const param of queryInfo.parameters) {
      const fieldName = this.toSnakeCase(param.name);
      
      // Пропускаем дублирующиеся поля
      if (addedFields.has(fieldName)) {
        continue;
      }
      
      addedFields.add(fieldName);
      const fieldType = this.mapType(param.originalType);
      code += `    ${fieldName}: ${fieldType}\n`;
    }
    
    code += '\n\n';
    
    return code;
  }

  /**
   * Generate Python result dataclass
   * @param queryInfo Query information
   * @returns Python result dataclass code
   */
  private generateResultDataclass(queryInfo: QueryInfo): string {
    const className = `${this.toPascalCase(queryInfo.functionName)}Result`;
    
    let code = `@dataclass
class ${className}:
    """Result for ${this.toSnakeCase(queryInfo.functionName)} query"""
`;
    
    // Если у запроса есть поля результата, используем их
    if (queryInfo.resultFields.length > 0) {
      for (const field of queryInfo.resultFields) {
        const fieldName = this.toSnakeCase(field.name);
        const fieldType = this.mapType(field.originalType);
        code += `    ${fieldName}: ${fieldType}\n`;
      }
    } else {
      // Для запросов с RETURNING, но без явно указанных полей результата,
      // попробуем извлечь поля из SQL-запроса
      const returningFields = this.extractReturningFields(queryInfo.transformedSql);
      if (returningFields.length > 0) {
        for (const field of returningFields) {
          code += `    ${this.toSnakeCase(field)}: Any\n`;
        }
      } else {
        // Если не удалось извлечь поля, добавим заглушку
        code += `    # Add fields based on the query's RETURNING clause\n`;
      }
    }
    
    code += '\n\n';
    
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
   * Generate Python SQL constant
   * @param queryInfo Query information
   * @returns Python SQL constant code
   */
  private generateSqlConstant(queryInfo: QueryInfo): string {
    const constName = `${this.toSnakeCase(queryInfo.functionName).toUpperCase()}_SQL`;
    
    return `${constName} = """${queryInfo.transformedSql}"""\n\n`;
  }

  /**
   * Generate Python function for executing the query
   * @param queryInfo Query information
   * @returns Python function code
   */
  private generateFunction(queryInfo: QueryInfo): string {
    const funcName = this.toSnakeCase(queryInfo.functionName);
    const hasParams = queryInfo.parameters.length > 0;
    const paramType = hasParams ? `${this.toPascalCase(queryInfo.functionName)}Params` : '';
    
    let returnType = '';
    let returnStatement = '';
    
    switch (queryInfo.returnType) {
      case QueryReturnType.ONE:
        returnType = `Optional[${this.toPascalCase(queryInfo.functionName)}Result]`;
        returnStatement = 'return result';
        break;
      case QueryReturnType.MANY:
        returnType = `List[${this.toPascalCase(queryInfo.functionName)}Result]`;
        returnStatement = 'return results';
        break;
      case QueryReturnType.EXEC:
        returnType = 'None';
        returnStatement = 'return None';
        break;
    }
    
    let code = `async def ${funcName}(self`;
    
    if (hasParams) {
      code += `, params: ${paramType}`;
    }
    
    code += `) -> ${returnType}:
    """
    Execute the ${funcName} query
    """
    async with self.pool.acquire() as conn:
`;
    
    const sqlConstName = `${this.toSnakeCase(queryInfo.functionName).toUpperCase()}_SQL`;
    
    if (queryInfo.returnType === QueryReturnType.EXEC) {
      // EXEC query
      code += `        await conn.execute(${sqlConstName}`;
      
      if (hasParams) {
        code += ', ';
        code += queryInfo.parameters.map(p => `params.${this.toSnakeCase(p.name)}`).join(', ');
      }
      
      code += `)\n        ${returnStatement}\n\n`;
    } else if (queryInfo.returnType === QueryReturnType.ONE) {
      // ONE query
      code += `        row = await conn.fetchrow(${sqlConstName}`;
      
      if (hasParams) {
        code += ', ';
        code += queryInfo.parameters.map(p => `params.${this.toSnakeCase(p.name)}`).join(', ');
      }
      
      code += `)\n        if row is None:\n            return None\n\n        result = ${this.toPascalCase(queryInfo.functionName)}Result(\n`;
      
      // Map fields
      if (queryInfo.resultFields.length > 0) {
        code += queryInfo.resultFields.map((f, i) => `            ${this.toSnakeCase(f.name)}=row[${i}]`).join(',\n');
        code += '\n';
      } else {
        // Для запросов с RETURNING, но без явно указанных полей результата
        const returningFields = this.extractReturningFields(queryInfo.transformedSql);
        if (returningFields.length > 0) {
          code += returningFields.map((f, i) => `            ${this.toSnakeCase(f)}=row[${i}]`).join(',\n');
          code += '\n';
        }
      }
      
      code += `        )\n        ${returnStatement}\n\n`;
    } else if (queryInfo.returnType === QueryReturnType.MANY) {
      // MANY query
      code += `        rows = await conn.fetch(${sqlConstName}`;
      
      if (hasParams) {
        code += ', ';
        code += queryInfo.parameters.map(p => `params.${this.toSnakeCase(p.name)}`).join(', ');
      }
      
      code += `)\n        results = []\n        for row in rows:\n            result = ${this.toPascalCase(queryInfo.functionName)}Result(\n`;
      
      // Map fields
      if (queryInfo.resultFields.length > 0) {
        code += queryInfo.resultFields.map((f, i) => `                ${this.toSnakeCase(f.name)}=row[${i}]`).join(',\n');
        code += '\n';
      } else {
        // Для запросов с RETURNING, но без явно указанных полей результата
        const returningFields = this.extractReturningFields(queryInfo.transformedSql);
        if (returningFields.length > 0) {
          code += returningFields.map((f, i) => `                ${this.toSnakeCase(f)}=row[${i}]`).join(',\n');
          code += '\n';
        }
      }
      
      code += `            )\n            results.append(result)\n\n        ${returnStatement}\n\n`;
    }
    
    return code;
  }
}
