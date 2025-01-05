package gen

import "database/sql"

type Queries struct {
  DB sql.DB
}

type User struct {
    Fk string
    Text string
    Id int
}

