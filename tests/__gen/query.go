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
INSERT INTO users (text, fk) VALUES (?, ?) RETURNING id
`

type InsertSingleParams struct {
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
