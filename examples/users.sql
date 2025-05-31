-- Example SQL file with SQLRC directives and variable placeholders

--@ sqlrc:GetUserById:one
SELECT 
    id,
    username,
    email,
    created_at,
    updated_at,
    is_active,
    role
FROM users
WHERE id = <@userId:int@>;

--@ sqlrc:GetUsersByRole:many
SELECT 
    id,
    username,
    email,
    created_at,
    updated_at,
    is_active
FROM users
WHERE role = <@role:string@>
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
    created_at,
    role,
    is_active;

--@ sqlrc:UpdateUserStatus:exec
UPDATE users
SET 
    is_active = <@isActive:bool@>,
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
    created_at,
    updated_at,
    is_active,
    role
FROM users
WHERE 
    (username ILIKE '%' || <@searchTerm:string@> || '%' OR
     email ILIKE '%' || <@searchTerm:string@> || '%')
    AND (<@roleFilter:string_array@> IS NULL OR role = ANY(<@roleFilter:string_array@>))
ORDER BY 
    CASE WHEN <@orderBy:string@> = 'username' THEN username END ASC,
    CASE WHEN <@orderBy:string@> = 'email' THEN email END ASC,
    CASE WHEN <@orderBy:string@> = 'created_at' THEN created_at END DESC
LIMIT <@limit:int@>
OFFSET <@offset:int@>;
