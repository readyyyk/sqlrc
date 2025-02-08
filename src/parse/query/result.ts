import { TParamedQuery, TWResolvedReturnQuery } from "../../types";
import { getTableName } from "./getTableName";

const RETURNING_KW = "returning";
export const parseResolveResult = (q: TParamedQuery): TWResolvedReturnQuery => {
  const result: TWResolvedReturnQuery = {
    ...q,
    result: {}
  };

  const woComments = q.resultSql.replaceAll(/--.+[\n\r]/g, "");
  const woCommentsL = woComments.toLowerCase();
  if (woCommentsL.startsWith("select")) {
    // handle select
    
  } else {
    // handle RETURNING keyword
    const tableName = getTableName(woComments);

    const returningIdx = woCommentsL.lastIndexOf(RETURNING_KW);
    if (returningIdx === -1) {
      return result;
    }
    const fields = woComments
      .slice(returningIdx + RETURNING_KW.length)
      .split(",")
      .map(a=>a.trim());

    const fieldsWAliases = fields.reduce((acc, cur) => {
      cur = cur.replace(/ as /i, " ");

      const parts = cur.split(" ");
      if (parts.length === 1) {
        return {...acc, [parts[0]]: parts[0]};
      }

      const alias = parts.at(-1)!;
      const value = parts.slice(0, -1).join(" ");
      return {...acc, [alias]: value};
    }, {} as Record<string, string>);

    for (const [name, value] of Object.entries(fieldsWAliases)) {
      let field = value;
      if (!/^[a-zA-Z_0-9]+$/.test(field)) {
        const foundField = field.match(/[\w^]([a-zA-Z_0-9]+)[\w$]/);
        if (!foundField) {
          throw new Error("Field name not found in: " + field);
        }
        field = foundField?.[0];
      }
      result.result[tableName] = {
        tableField: field,
        returningName: name,
      }
    }
  }

  return result
}
