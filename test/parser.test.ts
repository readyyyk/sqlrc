import { describe, it, expect } from 'vitest';
import { parseFile, transformSql } from '../src/core/parser';
import { VariableInfo } from '../src/types';
import * as path from 'path';

describe('SQL Parser', () => {
  it('should parse SQL file with SQLRC directives', async () => {
    const filePath = path.join(__dirname, '../examples/users.sql');
    const parsedFile = await parseFile(filePath);
    
    expect(parsedFile).toBeDefined();
    expect(parsedFile.filePath).toBe(filePath);
    expect(parsedFile.queries.length).toBeGreaterThan(0);
    
    // Check the first query (GetUserById)
    const firstQuery = parsedFile.queries[0];
    expect(firstQuery.functionName).toBe('GetUserById');
    expect(firstQuery.returnType).toBe('one');
    expect(firstQuery.parameters.length).toBe(1);
    expect(firstQuery.parameters[0].name).toBe('userId');
    expect(firstQuery.parameters[0].originalType).toBe('int');
  });
  
  it('should transform SQL with positional parameters', () => {
    const sql = 'SELECT * FROM users WHERE id = <@userId:int@> AND role = <@role:string@>';
    const variables: VariableInfo[] = [
      { name: 'userId', originalType: 'int', order: 0 },
      { name: 'role', originalType: 'string', order: 1 }
    ];
    
    const transformed = transformSql(sql, variables, 'positional');
    expect(transformed).toBe('SELECT * FROM users WHERE id = ? AND role = ?');
  });
  
  it('should transform SQL with named parameters', () => {
    const sql = 'SELECT * FROM users WHERE id = <@userId:int@> AND role = <@role:string@>';
    const variables: VariableInfo[] = [
      { name: 'userId', originalType: 'int', order: 0 },
      { name: 'role', originalType: 'string', order: 1 }
    ];
    
    const transformed = transformSql(sql, variables, 'named');
    expect(transformed).toBe('SELECT * FROM users WHERE id = :userId AND role = :role');
  });
  
  it('should transform SQL with numbered parameters', () => {
    const sql = 'SELECT * FROM users WHERE id = <@userId:int@> AND role = <@role:string@>';
    const variables: VariableInfo[] = [
      { name: 'userId', originalType: 'int', order: 0 },
      { name: 'role', originalType: 'string', order: 1 }
    ];
    
    const transformed = transformSql(sql, variables, 'numbered');
    expect(transformed).toBe('SELECT * FROM users WHERE id = $1 AND role = $2');
  });
});
