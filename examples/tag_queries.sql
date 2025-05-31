-- Tag-related queries

--@ sqlrc:GetTagById:one
SELECT 
    id,
    name
FROM tags
WHERE id = <@tagId:int@>;

--@ sqlrc:GetTagByName:one
SELECT 
    id,
    name
FROM tags
WHERE name = <@name:string@>;

--@ sqlrc:ListTags:many
SELECT 
    id,
    name
FROM tags
ORDER BY name ASC
LIMIT <@limit:int@>
OFFSET <@offset:int@>;

--@ sqlrc:CreateTag:one
INSERT INTO tags (
    name
) VALUES (
    <@name:string@>
)
RETURNING 
    id,
    name;

--@ sqlrc:UpdateTag:one
UPDATE tags
SET 
    name = <@name:string@>
WHERE id = <@tagId:int@>
RETURNING 
    id,
    name;

--@ sqlrc:DeleteTag:exec
DELETE FROM tags
WHERE id = <@tagId:int@>;

--@ sqlrc:AddTagToPost:exec
INSERT INTO post_tags (
    post_id,
    tag_id
) VALUES (
    <@postId:int@>,
    <@tagId:int@>
);

--@ sqlrc:RemoveTagFromPost:exec
DELETE FROM post_tags
WHERE post_id = <@postId:int@>
  AND tag_id = <@tagId:int@>;

--@ sqlrc:ListTagsByPost:many
SELECT 
    t.id,
    t.name
FROM tags t
JOIN post_tags pt ON t.id = pt.tag_id
WHERE pt.post_id = <@postId:int@>
ORDER BY t.name ASC;

--@ sqlrc:ListPostsByTag:many
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
JOIN post_tags pt ON p.id = pt.post_id
JOIN tags t ON pt.tag_id = t.id
WHERE t.id = <@tagId:int@>
  AND p.is_published = TRUE
ORDER BY p.created_at DESC
LIMIT <@limit:int@>
OFFSET <@offset:int@>;
