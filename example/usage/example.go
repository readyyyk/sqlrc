package usage

import (
	"database/sql"

	db_shared "github.com/re-worthy/backend-go/internal/db/shared"

	_ "github.com/tursodatabase/go-libsql"
)

const DRIVER_NAME = "libsql"

/*
Dont forget to defer close database
*/
func GetLocalConnection(dataSourceName string) (*sql.DB, error) {
	db, err := sql.Open(DRIVER_NAME, dataSourceName)
	if err != nil {
		return &sql.DB{}, err
	}

	return db, nil
}