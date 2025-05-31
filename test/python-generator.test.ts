import { describe, it, expect } from 'vitest';
import { PythonCodeGenerator } from '../src/generators/python/generator';
import { QueryInfo, QueryReturnType, VariableInfo, FieldInfo } from '../src/types';

describe('Python Code Generator', () => {
  it('should generate Python code for a query with one result', () => {
    const generator = new PythonCodeGenerator();
    
    const queryInfo: QueryInfo = {
      functionName: 'GetUserById',
      returnType: QueryReturnType.ONE,
      originalSql: 'SELECT id, username, email FROM users WHERE id = <@userId:int@>',
      transformedSql: 'SELECT id, username, email FROM users WHERE id = $1',
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
    
    // Check that the code contains the parameter dataclass
    expect(code).toContain('@dataclass');
    expect(code).toContain('class GetUserByIdParams');
    expect(code).toContain('user_id: int');
    
    // Check that the code contains the result dataclass
    expect(code).toContain('class GetUserByIdResult');
    expect(code).toContain('id: int');
    expect(code).toContain('username: str');
    expect(code).toContain('email: str');
    
    // Check that the code contains the SQL constant
    expect(code).toContain('GET_USER_BY_ID_SQL');
    
    // Check that the code contains the function
    expect(code).toContain('async def get_user_by_id(self, params: GetUserByIdParams)');
    expect(code).toContain('-> Optional[GetUserByIdResult]');
  });
  
  it('should generate Python code for a query with many results', () => {
    const generator = new PythonCodeGenerator();
    
    const queryInfo: QueryInfo = {
      functionName: 'ListUsers',
      returnType: QueryReturnType.MANY,
      originalSql: 'SELECT id, username FROM users LIMIT <@limit:int@>',
      transformedSql: 'SELECT id, username FROM users LIMIT $1',
      parameters: [
        { name: 'limit', originalType: 'int', order: 0 }
      ],
      resultFields: [
        { name: 'id', originalType: 'int' },
        { name: 'username', originalType: 'string' }
      ]
    };
    
    const code = generator.generateSingleQuery(queryInfo);
    
    // Check that the code contains the parameter dataclass
    expect(code).toContain('class ListUsersParams');
    expect(code).toContain('limit: int');
    
    // Check that the code contains the result dataclass
    expect(code).toContain('class ListUsersResult');
    
    // Check that the code contains the function
    expect(code).toContain('async def list_users(self, params: ListUsersParams)');
    expect(code).toContain('-> List[ListUsersResult]');
  });
  
  it('should generate Python code for a query with no results (exec)', () => {
    const generator = new PythonCodeGenerator();
    
    const queryInfo: QueryInfo = {
      functionName: 'DeleteUser',
      returnType: QueryReturnType.EXEC,
      originalSql: 'DELETE FROM users WHERE id = <@userId:int@>',
      transformedSql: 'DELETE FROM users WHERE id = $1',
      parameters: [
        { name: 'userId', originalType: 'int', order: 0 }
      ],
      resultFields: []
    };
    
    const code = generator.generateSingleQuery(queryInfo);
    
    // Check that the code contains the parameter dataclass
    expect(code).toContain('class DeleteUserParams');
    
    // Check that the code does not contain a result dataclass
    expect(code).not.toContain('class DeleteUserResult');
    
    // Check that the code contains the function
    expect(code).toContain('async def delete_user(self, params: DeleteUserParams)');
    expect(code).toContain('-> None');
  });
  
  it('should map SQL types to Python types correctly', () => {
    const generator = new PythonCodeGenerator();
    
    expect(generator.mapType('int')).toBe('int');
    expect(generator.mapType('string')).toBe('str');
    expect(generator.mapType('bool')).toBe('bool');
    expect(generator.mapType('timestamp')).toBe('datetime');
    expect(generator.mapType('string_array')).toBe('List[str]');
    expect(generator.mapType('unknown_type')).toBe('Any');
  });
});
