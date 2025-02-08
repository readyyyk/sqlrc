import { ALLOWED_QUERY_RETURN_TYPES, isALLOWED_QUERY_RETURN_TYPES, type TQueryToken } from "../../types";

const SQL_COMMENT_TOKEN = "--@";
const SQL_DELITMER_TOKEN = ";";

export const parseQuery = (sqlcode: string): TQueryToken[] => {
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

  const result = [] as TQueryToken[];
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
