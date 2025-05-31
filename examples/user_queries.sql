-- User-related queries

--@ sqlrc:GetUserById:one
SELECT 
    id,
    username,
    email,
    role,
    is_active,
    created_at,
    updated_at
FROM users
WHERE id = <@userId:int@>;

--@ sqlrc:GetUserByUsername:one
SELECT 
    id,
    username,
    email,
    role,
    is_active,
    created_at,
    updated_at
FROM users
WHERE username = <@username:string@>;

--@ sqlrc:ListUsers:many
SELECT 
    id,
    username,
    email,
    role,
    is_active,
    created_at,
    updated_at
FROM users
ORDER BY created_at DESC
LIMIT <@limit:int@>
OFFSET <@offset:int@>;

--@ sqlrc:CreateUser:one
INSERT INTO users (
    username,
    email,
    password_hash,
    role,
    is_active
) VALUES (
    <@username:string@>,
    <@email:string@>,
    <@passwordHash:string@>,
    <@role:string@>,
    <@isActive:bool@>
)
RETURNING 
    id,
    username,
    email,
    role,
    is_active,
    created_at,
    updated_at;

--@ sqlrc:UpdateUser:one
UPDATE users
SET 
    username = <@username:string@>,
    email = <@email:string@>,
    role = <@role:string@>,
    is_active = <@isActive:bool@>,
    updated_at = CURRENT_TIMESTAMP
WHERE id = <@userId:int@>
RETURNING 
    id,
    username,
    email,
    role,
    is_active,
    created_at,
    updated_at;

--@ sqlrc:UpdateUserPassword:exec
UPDATE users
SET 
    password_hash = <@passwordHash:string@>,
    updated_at = CURRENT_TIMESTAMP
WHERE id = <@userId:int@>;

--@ sqlrc:DeleteUser:exec
DELETE FROM users
WHERE id = <@userId:int@>;

--@ sqlrc:SearchUsers:many
SELECT 
    id,
    username,
    email,
    role,
    is_active,
    created_at,
    updated_at
FROM users
WHERE 
    (username LIKE '%' || <@searchTerm:string@> || '%' OR
     email LIKE '%' || <@searchTerm:string@> || '%')
    AND (<@role:string@> IS NULL OR role = <@role:string@>)
ORDER BY 
    CASE WHEN <@orderBy:string@> = 'username' THEN username END ASC,
    CASE WHEN <@orderBy:string@> = 'email' THEN email END ASC,
    CASE WHEN <@orderBy:string@> = 'created_at' THEN created_at END DESC
LIMIT <@limit:int@>
OFFSET <@offset:int@>;
