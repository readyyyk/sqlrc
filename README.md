# SQLrc

## TODO

- [ ] joins
- [ ] select aliases
- [ ] generated file warranty
- [ ] capitalized params warranty

## Limitations

1. Table definition:

Each column must start with new string!

![create-table-stmt](./docs/images/create-table-stmt.png)

If in column definitions, tokens `PRIMARY KEY` or `NOT NULL`
are not found, codegen outputs warning

Original docs: <https://www.sqlite.org/lang_createtable.html>

2. With-statements

With statements (CTEs) are not supported

3. Aliases

Table field is searched by regex: `/[\w^]([a-zA-Z_0-9]+)[\w$]/`

Type of the returning field resolved by the type of the table field.

> (So, type convertions are not supported, [feature requests are welcome](https://github.com/readyyyk/sqlrc/issues/new?template=Blank+issue))

4. Resolve return type

When resolving return type for `insert`, `update`, `delete` queries the first of `insert into {tableName}`, `delete from {tableName}`, `update {tableName}` is considered affected table, so for
```sql
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
    price * 1.2 price_with_tax;
```

CASE-WHEN statements are not supported