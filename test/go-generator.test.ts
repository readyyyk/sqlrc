import { describe, it, expect } from 'vitest';
import { GoCodeGenerator } from '../src/generators/go/generator';
import { QueryInfo, QueryReturnType, VariableInfo, FieldInfo } from '../src/types';

describe('Go Code Generator', () => {
  it('should generate Go code for a query with one result', () => {
    const generator = new GoCodeGenerator();
    
    const queryInfo: QueryInfo = {
      functionName: 'GetUserById',
      returnType: QueryReturnType.ONE,
      originalSql: 'SELECT id, username, email FROM users WHERE id = <@userId:int@>',
      transformedSql: 'SELECT id, username, email FROM users WHERE id = ?',
      parameters: [
        { name: 'userId', originalType: 'int', order: 0 }
      ],
      resultFields: [
        { name: 'id', originalType: 'int' },
        { name: 'username', originalType: 'string' },
        { name: 'email', originalType: 'string' }
      ]
    };
    
    const code = generator.generateSingleQuery(queryInfo);
    
    // Check that the code contains the parameter struct
    expect(code).toContain('type GetUserByIdParams struct');
    expect(code).toContain('UserId int');
    
    // Check that the code contains the result struct
    expect(code).toContain('type GetUserByIdResult struct');
    expect(code).toContain('Id int');
    expect(code).toContain('Username string');
    expect(code).toContain('Email string');
    
    // Check that the code contains the SQL constant
    expect(code).toContain('const get_user_by_idSQL');
    
    // Check that the code contains the function
    expect(code).toContain('func (q *Queries) GetUserById(ctx context.Context, arg GetUserByIdParams) (*GetUserByIdResult, error)');
  });
  
  it('should generate Go code for a query with many results', () => {
    const generator = new GoCodeGenerator();
    
    const queryInfo: QueryInfo = {
      functionName: 'ListUsers',
      returnType: QueryReturnType.MANY,
      originalSql: 'SELECT id, username FROM users LIMIT <@limit:int@>',
      transformedSql: 'SELECT id, username FROM users LIMIT ?',
      parameters: [
        { name: 'limit', originalType: 'int', order: 0 }
      ],
      resultFields: [
        { name: 'id', originalType: 'int' },
        { name: 'username', originalType: 'string' }
      ]
    };
    
    const code = generator.generateSingleQuery(queryInfo);
    
    // Check that the code contains the parameter struct
    expect(code).toContain('type ListUsersParams struct');
    expect(code).toContain('Limit int');
    
    // Check that the code contains the result struct
    expect(code).toContain('type ListUsersResult struct');
    
    // Check that the code contains the function
    expect(code).toContain('func (q *Queries) ListUsers(ctx context.Context, arg ListUsersParams) ([]ListUsersResult, error)');
  });
  
  it('should generate Go code for a query with no results (exec)', () => {
    const generator = new GoCodeGenerator();
    
    const queryInfo: QueryInfo = {
      functionName: 'DeleteUser',
      returnType: QueryReturnType.EXEC,
      originalSql: 'DELETE FROM users WHERE id = <@userId:int@>',
      transformedSql: 'DELETE FROM users WHERE id = ?',
      parameters: [
        { name: 'userId', originalType: 'int', order: 0 }
      ],
      resultFields: []
    };
    
    const code = generator.generateSingleQuery(queryInfo);
    
    // Check that the code contains the parameter struct
    expect(code).toContain('type DeleteUserParams struct');
    
    // Check that the code does not contain a result struct
    expect(code).not.toContain('type DeleteUserResult struct');
    
    // Check that the code contains the function
    expect(code).toContain('func (q *Queries) DeleteUser(ctx context.Context, arg DeleteUserParams) error');
  });
  
  it('should map SQL types to Go types correctly', () => {
    const generator = new GoCodeGenerator();
    
    expect(generator.mapType('int')).toBe('int');
    expect(generator.mapType('string')).toBe('string');
    expect(generator.mapType('bool')).toBe('bool');
    expect(generator.mapType('timestamp')).toBe('time.Time');
    expect(generator.mapType('string_array')).toBe('[]string');
    expect(generator.mapType('unknown_type')).toBe('interface{}');
  });
});
