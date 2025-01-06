--@ sqlrc:GetSingle:one
-- TODO check + probably @unsafe directive
SELECT *
FROM users
WHERE <@condition:string@>;

--@ sqlrc:InsertSingle:one
INSERT INTO users (text, fk) VALUES (<@text:string@>, <@fk:string@>) RETURNING id;

--@ sqlrc:GetRepeated:one
SELECT * FROM users WHERE id = <@id:int@> AND <@id:int@> > 10;

--@ sqlrc:GetMany:many
SELECT * FROM users WHERE id < <@id:int@>;

