import {
  ALLOWED_OWN_TYPES,
  ALLOWED_QUERY_RETURN_TYPES,
  ALLOWED_SQL_COLUMN_TYPES,
  isALLOWED_OWN_TYPES,
  isALLOWED_QUERY_RETURN_TYPES,
  isALLOWED_SQL_COLUMN_TYPES,
  type ParamedQuery,
  type ColumnToken,
  type QueryToken,
  type OwnType,
} from "./types.ts";

const SQL_COMMENT_TOKEN = "--@";
const SQL_DELITMER_TOKEN = ";";

export const parseQuery = (sqlcode: string): QueryToken[] => {
  const parts = sqlcode
    .split(SQL_COMMENT_TOKEN)
    .map((a) => a.trim())
    .filter(Boolean);
  const sqlParts = parts
    .map((a) => a.split(SQL_DELITMER_TOKEN))
    .flat()
    .map((a) => a.trim())
    .filter(Boolean);

  if (parts.length !== sqlParts.length) {
    throw new Error(
      "You can use only one query per method. Consider using `Subqueries` or `CTEs`",
    );
  }

  const result = [] as QueryToken[];
  for (const query of sqlParts) {
    const [head, ...rest] = query.split("\n");
    const sql = rest
      .map((a) => a.trimEnd())
      .filter(Boolean)
      .join("\n");
    const [_, name, type] = head.split(":");
    if (!isALLOWED_QUERY_RETURN_TYPES(type)) {
      throw new Error(
        "Invalid query return type. \nGot: " +
          type +
          "\nAllowed are: " +
          JSON.stringify(ALLOWED_QUERY_RETURN_TYPES),
      );
    }
    result.push({ sql, name, type });
  }
  return result;
};

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



const PARAM_REGEX = /(\<\@)([^:]+):([^\@]+)(\@\>)/g
const NAME_GROUP_IDX = 2;
const TYPE_GROUP_IDX = 3;

export const parseQueryParams = (queryToken: QueryToken): ParamedQuery => {
  /** @type {ParamedQuery} */
  const result: ParamedQuery = {
    queryToken,
    params: {},
    resultSql: '',
  }

  result.resultSql = queryToken.sql.replaceAll(PARAM_REGEX, '?');
  
  const matches = result.queryToken.sql.matchAll(PARAM_REGEX);
  let i=0;
  for (const match of matches) {
    const name = match[NAME_GROUP_IDX];
    const _type = match[TYPE_GROUP_IDX];

    if (!isALLOWED_OWN_TYPES(_type)) {
      throw new Error(
        "Invalid own type. \nGot: " +
          _type +
          "\nAllowed are: " +
          JSON.stringify(ALLOWED_OWN_TYPES),
      );
    }

    result.params[name] = {
      name,
      type: _type,
      positions: result.params[name]?.positions
        ? result.params[name].positions.concat(i)
        : [i],
    }

    i++;
  }

  return result;
}
