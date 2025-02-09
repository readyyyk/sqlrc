import { sqlToGoTypes, TScehmaToken } from "../types";
import { capitalize, trimLeftTempl } from "./utils";

type TGenerateSchema = (tokens: TScehmaToken, packageName: string, removeTrailingS: boolean) => string;
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
    for (const [name, col] of Object.entries(columns)) {
      // Probably need to add formatting, but dont care until it is valid code
      // Also user may have custom styleguide
      structCode += `\n${capitalize(name)} ${sqlToGoTypes[col.type]} \`db:"${name}"\``;
    }
    structCode += "\n}\n";

    result += "\n" + structCode;
  }

  return result;
};
