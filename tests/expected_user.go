package gen

import (
	"context"
)

// GetSingle
const getSingle__raw = `
-- sqlrc:GetSingle:one
SELECT * FROM users WHERE <@condition:string@>
`
const getSingleSql = `
SELECT * FROM users WHERE ?
`

type GetSingleParams struct {
  Condition string
}

func (q *Queries) GetSingle(ctx context.Context, arg GetSingleParams) (*User, error) {
	row := q.DB.QueryRowContext(ctx, getSingleSql, arg.Condition) 
  var i User
	err := row.Scan(
		&i.Fk,
		&i.Id,
		&i.Text,
	)
	return &i, err
}

// InsertSingle
const insertSingle__raw = `
-- sqlrc:InsertSingle:one
INSERT INTO users (text, fk) VALUES (<@text:string@>, <@fk:string@>) RETURNING id;
`
const insertSingleSql = `
INSERT INTO users (text, fk) VALUES (?, ?) RETURNING id
`

type InsertSingleParams struct {
  Text string
  Fk string
}
type InsertSingleResult struct {
  Id int
}

func (q *Queries) InsertSingle(ctx context.Context, arg InsertSingleParams) (*InsertSingleResult, error) {
	row := q.DB.QueryRowContext(ctx, getSingleSql, arg.Text, arg.Fk) 
  var i InsertSingleResult
	err := row.Scan(
		&i.Id,
	)
	return &i, err
}

// GetRepeated
const getRepeated__raw = `
-- sqlrc:GetRepeated:one
SELECT * FROM users WHERE id = <@id:int@> AND <@id:int@> > 10;
`
const getRepeatedSql = `
SELECT * FROM users WHERE id = ? AND ? > 10;
`

type GetRepeatedParams struct {
  Id int
}

func (q *Queries) GetRepeated(ctx context.Context, arg GetRepeatedParams) (*User, error) {
	row := q.DB.QueryRowContext(ctx, getRepeatedSql, arg.Id, arg.Id) 
  var i User
	err := row.Scan(
		&i.Fk,
		&i.Id,
		&i.Text,
	)
	return &i, err
}

// GetMany
const getMany__raw = `
-- sqlrc:GetMany:many
SELECT * FROM users WHERE id < <@id:int@>;
`
const getManySql = `
SELECT * FROM users WHERE id < ?;
`

type GetManyParams struct {
  Id int
}

func (q *Queries) GetMany(ctx context.Context, arg GetManyParams) (*[]User, error) {
  rows, err := q.DB.QueryContext(ctx, getManySql, arg.Id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []User
	for rows.Next() {
		var i User
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
