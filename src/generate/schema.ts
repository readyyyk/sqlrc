import { ColumnToken, sqlToGoTypes } from "../types";
import { capitalize, trimLeftTempl } from "./utils";

type TGenerateSchema = (tokens: Record<string, ColumnToken[]>, packageName: string, removeTrailingS: boolean) => string;
export const generateSchema: TGenerateSchema = (tokens, packageName, removeTrailingS) => {
    let result = trimLeftTempl`
        package ${packageName}

        import "database/sql"

        type Queries struct {
            DB sql.DB
        }`.slice(1);

  for (const tableName in tokens) {
    const columns = tokens[tableName];

    let structName = capitalize(tableName);
    if (removeTrailingS && structName.at(-1)?.toLowerCase() === "s") {
      structName = structName.slice(0,-1)
    }

    let structCode = `\ntype ${structName} struct {`;
    for (const col of columns) {
      // Probably need to add formatting, but dont care until it is valid code
      // Also user may have custom styleguide
      structCode += `\n${capitalize(col.name)} ${sqlToGoTypes[col.type]} \`db:"${col.name}"\``;
    }
    structCode += "\n}\n";

    result += "\n" + structCode;
  }

  return result;
};
