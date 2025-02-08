package gen

import (
"context"
)


// GetSingle
const GetSingleSql = `
-- TODO check + probably @unsafe directive
SELECT *
FROM users
WHERE ?
`

type GetSingleParams struct {
Condition string
}

type GetSingleResult struct {
Condition string
}

func (q *Queries) GetSingle(ctx context.Context, arg GetSingleParams) (*TO_BE_DONE, error) {
row := q.DB.QueryRowContext(ctx, GetSingleSql, arg.Condition) 
var i TO_BE_DONE
err := row.Scan(
&i.Fk,
&i.Id,
&i.Text,
)
return &i, err
}


// InsertSingle
const InsertSingleSql = `
INSERT INTO users (text, fk) VALUES (?, ?) RETURNING id, username, image i
`

type InsertSingleParams struct {
Text string
Fk string
}

type InsertSingleResult struct {
Text string
Fk string
}

func (q *Queries) InsertSingle(ctx context.Context, arg InsertSingleParams) (*TO_BE_DONE, error) {
row := q.DB.QueryRowContext(ctx, InsertSingleSql, arg.Text, arg.Fk) 
var i TO_BE_DONE
err := row.Scan(
&i.Fk,
&i.Id,
&i.Text,
)
return &i, err
}


// GetRepeated
const GetRepeatedSql = `
SELECT * FROM users WHERE id = ? AND ? > 10
`

type GetRepeatedParams struct {
Id int
}

type GetRepeatedResult struct {
Id int
}

func (q *Queries) GetRepeated(ctx context.Context, arg GetRepeatedParams) (*TO_BE_DONE, error) {
row := q.DB.QueryRowContext(ctx, GetRepeatedSql, arg.Id, arg.Id) 
var i TO_BE_DONE
err := row.Scan(
&i.Fk,
&i.Id,
&i.Text,
)
return &i, err
}


// GetMany
const GetManySql = `
SELECT * FROM users WHERE id < ?
`

type GetManyParams struct {
Id int
}

type GetManyResult struct {
Id int
}

func (q *Queries) GetMany(ctx context.Context, arg GetManyParams) (*[]TO_BE_DONE, error) {
rows, err := q.DB.QueryContext(ctx, GetManySql, arg.Id)
if err != nil {
return nil, err
}
defer rows.Close()
var items []TO_BE_DONE
for rows.Next() {
var i TO_BE_DONE
if err := rows.Scan(
&i.Id,
&i.Fk,
&i.Text,
); err != nil {
return nil, err
}
items = append(items, i)
}
if err := rows.Close(); err != nil {
return nil, err
}
if err := rows.Err(); err != nil {
return nil, err
}
return &items, nil
}


// GetJoin
const GetJoinSql = `
SELECT u.*, f.*
FROM users as u
LEFT JOIN friends f
ON f.id = u.id
where u.username = ?
`

type GetJoinParams struct {
Username string
}

type GetJoinResult struct {
Username string
}

func (q *Queries) GetJoin(ctx context.Context, arg GetJoinParams) (*[]TO_BE_DONE, error) {
rows, err := q.DB.QueryContext(ctx, GetJoinSql, arg.Username)
if err != nil {
return nil, err
}
defer rows.Close()
var items []TO_BE_DONE
for rows.Next() {
var i TO_BE_DONE
if err := rows.Scan(
&i.Id,
&i.Fk,
&i.Text,
); err != nil {
return nil, err
}
items = append(items, i)
}
if err := rows.Close(); err != nil {
return nil, err
}
if err := rows.Err(); err != nil {
return nil, err
}
return &items, nil
}


// GetWorthy
const GetWorthySql = `
SELECT t1.*, tg.texT
FROM transactions as t1
  LEFT JOIN tags tg ON tg.transaction_id = t1.id
WHERE
  t1.owner_id = ?
  AND
  (t1.id IN (
    SELECT tags.transaction_id
    FROM tags tags
    WHERE
      tags.user_id = ?
      AND
      tags.text IN (?)
  ))
  AND
  (t1.created_at > ?)
  AND
  (t1.created_at < ?)
  AND
  (t1.description LIKE ?)
GROUP BY t1.id
LIMIT ?
OFFSET ?
`

type GetWorthyParams struct {
User_id string
Cs_tags string
Min_created_at string
Max_created_at string
Description_wk string
Limit int
Offset int
}

type GetWorthyResult struct {
User_id string
Cs_tags string
Min_created_at string
Max_created_at string
Description_wk string
Limit int
Offset int
}

func (q *Queries) GetWorthy(ctx context.Context, arg GetWorthyParams) (*TO_BE_DONE, error) {
row := q.DB.QueryRowContext(ctx, GetWorthySql, arg.User_id, arg.User_id, arg.Cs_tags, arg.Min_created_at, arg.Max_created_at, arg.Description_wk, arg.Limit, arg.Offset) 
var i TO_BE_DONE
err := row.Scan(
&i.Fk,
&i.Id,
&i.Text,
)
return &i, err
}


// InsertMultiReturning
const InsertMultiReturningSql = `
INSERT INTO products (name, price)
VALUES (
    'Phone',
    (SELECT price FROM (
        DELETE FROM temp_prices
        WHERE product_name = 'Phone'
        RETURNING price
    ) as deleted_price)
)
RETURNING
    id,
    name product_name,
    price * 0.2 tax,
    price * 1.2 as price_with_tax
`

type InsertMultiReturningParams struct {

}

type InsertMultiReturningResult struct {

}

func (q *Queries) InsertMultiReturning(ctx context.Context, arg InsertMultiReturningParams) (*TO_BE_DONE, error) {
row := q.DB.QueryRowContext(ctx, InsertMultiReturningSql, ) 
var i TO_BE_DONE
err := row.Scan(
&i.Fk,
&i.Id,
&i.Text,
)
return &i, err
}


// SelectScaryReturn
const SelectScaryReturnSql = `
-- WITH dept_stats AS (
--     SELECT
--         d.id,
--         d.name,
--         COUNT(*) AS emp_count,
--         AVG(e.salary) AS avg_salary
--     FROM departments d
--     LEFT JOIN employees e ON d.id = e.department_id
--     GROUP BY d.id, d.name
-- )
SELECT
    e.first_name AS employee_name,
    e.salary current_salary,
    e.salary * 1.1 AS projected_salary,
    d.name AS department,
    ds.emp_count AS department_size,
    ds.avg_salary AS dept_avg_salary,
    -- CASE
    --     WHEN e.salary > ds.avg_salary THEN 'Above Average'
    --     ELSE 'Below Average'
    -- END AS salary_comparison,
    -- RANK() OVER (PARTITION BY e.department_id ORDER BY e.salary DESC) AS dept_salary_rank
FROM employees as e
JOIN departments d ON e.department_id = d.id
-- JOIN dept_stats ds ON d.id = ds.id
WHERE e.salary > (SELECT AVG(salary) FROM employees)
ORDER BY e.salary DESC
`

type SelectScaryReturnParams struct {

}

type SelectScaryReturnResult struct {

}

func (q *Queries) SelectScaryReturn(ctx context.Context, arg SelectScaryReturnParams) (*[]TO_BE_DONE, error) {
rows, err := q.DB.QueryContext(ctx, SelectScaryReturnSql, )
if err != nil {
return nil, err
}
defer rows.Close()
var items []TO_BE_DONE
for rows.Next() {
var i TO_BE_DONE
if err := rows.Scan(
&i.Id,
&i.Fk,
&i.Text,
); err != nil {
return nil, err
}
items = append(items, i)
}
if err := rows.Close(); err != nil {
return nil, err
}
if err := rows.Err(); err != nil {
return nil, err
}
return &items, nil
}