-- Post-related queries

--@ sqlrc:GetPostById:one
SELECT 
    p.id,
    p.title,
    p.content,
    p.user_id,
    u.username as author_username,
    p.is_published,
    p.created_at,
    p.updated_at
FROM posts p
JOIN users u ON p.user_id = u.id
WHERE p.id = <@postId:int@>;

--@ sqlrc:ListPosts:many
SELECT 
    p.id,
    p.title,
    p.content,
    p.user_id,
    u.username as author_username,
    p.is_published,
    p.created_at,
    p.updated_at
FROM posts p
JOIN users u ON p.user_id = u.id
WHERE p.is_published = TRUE
ORDER BY p.created_at DESC
LIMIT <@limit:int@>
OFFSET <@offset:int@>;

--@ sqlrc:ListPostsByUser:many
SELECT 
    p.id,
    p.title,
    p.content,
    p.user_id,
    u.username as author_username,
    p.is_published,
    p.created_at,
    p.updated_at
FROM posts p
JOIN users u ON p.user_id = u.id
WHERE p.user_id = <@userId:int@>
ORDER BY p.created_at DESC
LIMIT <@limit:int@>
OFFSET <@offset:int@>;

--@ sqlrc:CreatePost:one
INSERT INTO posts (
    title,
    content,
    user_id,
    is_published
) VALUES (
    <@title:string@>,
    <@content:string@>,
    <@userId:int@>,
    <@isPublished:bool@>
)
RETURNING 
    id,
    title,
    content,
    user_id,
    is_published,
    created_at,
    updated_at;

--@ sqlrc:UpdatePost:one
UPDATE posts
SET 
    title = <@title:string@>,
    content = <@content:string@>,
    is_published = <@isPublished:bool@>,
    updated_at = CURRENT_TIMESTAMP
WHERE id = <@postId:int@>
RETURNING 
    id,
    title,
    content,
    user_id,
    is_published,
    created_at,
    updated_at;

--@ sqlrc:DeletePost:exec
DELETE FROM posts
WHERE id = <@postId:int@>;

--@ sqlrc:SearchPosts:many
SELECT 
    p.id,
    p.title,
    p.content,
    p.user_id,
    u.username as author_username,
    p.is_published,
    p.created_at,
    p.updated_at
FROM posts p
JOIN users u ON p.user_id = u.id
WHERE 
    (p.title LIKE '%' || <@searchTerm:string@> || '%' OR
     p.content LIKE '%' || <@searchTerm:string@> || '%')
    AND (p.is_published = TRUE OR p.user_id = <@currentUserId:int@>)
ORDER BY p.created_at DESC
LIMIT <@limit:int@>
OFFSET <@offset:int@>;

--@ sqlrc:GetPostsWithTags:many
SELECT 
    p.id,
    p.title,
    p.content,
    p.user_id,
    u.username as author_username,
    p.is_published,
    p.created_at,
    p.updated_at,
    GROUP_CONCAT(t.name, ',') as tags
FROM posts p
JOIN users u ON p.user_id = u.id
LEFT JOIN post_tags pt ON p.id = pt.post_id
LEFT JOIN tags t ON pt.tag_id = t.id
WHERE p.is_published = TRUE
GROUP BY p.id
HAVING 
    <@tagName:string@> IS NULL OR 
    tags LIKE '%' || <@tagName:string@> || '%'
ORDER BY p.created_at DESC
LIMIT <@limit:int@>
OFFSET <@offset:int@>;
