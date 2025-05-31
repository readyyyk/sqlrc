-- Comment-related queries

--@ sqlrc:GetCommentById:one
SELECT 
    c.id,
    c.content,
    c.user_id,
    u.username as author_username,
    c.post_id,
    c.created_at
FROM comments c
JOIN users u ON c.user_id = u.id
WHERE c.id = <@commentId:int@>;

--@ sqlrc:ListCommentsByPost:many
SELECT 
    c.id,
    c.content,
    c.user_id,
    u.username as author_username,
    c.post_id,
    c.created_at
FROM comments c
JOIN users u ON c.user_id = u.id
WHERE c.post_id = <@postId:int@>
ORDER BY c.created_at ASC
LIMIT <@limit:int@>
OFFSET <@offset:int@>;

--@ sqlrc:ListCommentsByUser:many
SELECT 
    c.id,
    c.content,
    c.user_id,
    u.username as author_username,
    c.post_id,
    p.title as post_title,
    c.created_at
FROM comments c
JOIN users u ON c.user_id = u.id
JOIN posts p ON c.post_id = p.id
WHERE c.user_id = <@userId:int@>
ORDER BY c.created_at DESC
LIMIT <@limit:int@>
OFFSET <@offset:int@>;

--@ sqlrc:CreateComment:one
INSERT INTO comments (
    content,
    user_id,
    post_id
) VALUES (
    <@content:string@>,
    <@userId:int@>,
    <@postId:int@>
)
RETURNING 
    id,
    content,
    user_id,
    post_id,
    created_at;

--@ sqlrc:UpdateComment:one
UPDATE comments
SET 
    content = <@content:string@>
WHERE id = <@commentId:int@>
  AND user_id = <@userId:int@>
RETURNING 
    id,
    content,
    user_id,
    post_id,
    created_at;

--@ sqlrc:DeleteComment:exec
DELETE FROM comments
WHERE id = <@commentId:int@>
  AND (user_id = <@userId:int@> OR <@isAdmin:bool@> = TRUE);

--@ sqlrc:CountCommentsByPost:one
SELECT 
    COUNT(*) as comment_count
FROM comments
WHERE post_id = <@postId:int@>;
