package gen

import "database/sql"

type Queries struct {
  DB sql.DB
}

type User struct {
Id int `db:"id"`
Fk string `db:"fk"`
Text string `db:"text"`
}
