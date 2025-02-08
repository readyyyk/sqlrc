import { ALLOWED_SQL_COLUMN_TYPES, ColumnToken, isALLOWED_SQL_COLUMN_TYPES } from "../types";

const SQL_TABLE_DELITMER = "CREATE";
const SQL_TABLE_NAME_REGEX = /(TABLE|table)\s+(\w+)/g;
const SQL_TABLE_NAME_REGEX_GROUP_INDEX = 2;

/** @returns Go <StructureName, <FieldName, FieldType>> */
export const parseSchema = (sqlcode: string): Record<string, ColumnToken[]> => {
  const tableDeclarations = sqlcode
    .replaceAll(/--[^\n]*\n/g, "\n")
    .split(SQL_TABLE_DELITMER)
    .map((a) => a.trim())
    .filter(Boolean);

  const tableNames = tableDeclarations
    .map((a) => {
      const res = SQL_TABLE_NAME_REGEX.exec(a);
      SQL_TABLE_NAME_REGEX.lastIndex = 0;
      return res;
    })
    .map((m, i) => {
      if (m === null) {
        throw new Error(
          "Cant find table name in declaration: \n" + tableDeclarations[i],
        );
      }
      return m[SQL_TABLE_NAME_REGEX_GROUP_INDEX];
    });

  const tablesFields = tableDeclarations.map((declaration) =>
    declaration
      .split("(")
      .slice(1)
      .join("(")
      // ^ take everything after first "(" and return removed "("
      .split(/\)[^\)]*;$/)[0]
      // ^ take everything before last ")"+{all symbols that are not ")"}+";"
      .split(/, *\n/)
      // ^ split by comma+trailing spaces if they exis+\n
      .map((field) => field.trim())
      .filter(Boolean)
      .map((field) => {
        const name = field.split(" ")[0];
        const type = field.split(" ")[1];
        const isNullable =
          field.search("NOT NULL") === -1 && field.search("PRIMARY KEY") === -1;
        isNullable &&
          console.warn(
            "[WARN]: Nullable field found. NULL state is not handled in output code. Read github.com/re-worthy/sqlrc",
          );
        if (!isALLOWED_SQL_COLUMN_TYPES(type)) {
          throw new Error(
            "Unsupported column type. \nGot: " +
              type +
              "\nAllowed are: " +
              JSON.stringify(ALLOWED_SQL_COLUMN_TYPES),
          );
        }
        return { name, type };
      }),
  );

  /** @type {Record<string, ColumnToken[]>}  */
  const result: Record<string, ColumnToken[]> = {};
  for (let i = 0; i < tableNames.length; i++) {
    const tName = tableNames[i];
    const tokens = tablesFields[i];
    result[tName] = tokens;
  }
  return result;
};
