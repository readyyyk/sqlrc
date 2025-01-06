// @ts-check

import { sqlToGoTypes } from "./types.js";

/** @typedef {import("./types.js").ColumnToken} ColumnToken */
/** @typedef {import("./types.js").QueryToken} QueryToken */


/** @param {string} a*/
const capitalize = (a) => a[0].toUpperCase() + a.slice(1); 

/**
 * @param {string} packageName
 * @param {Record<string, ColumnToken[]>} tokens
 * @param {Boolean} removeTrailingS
 * @returns {string}
 */
export const generateSchema = (tokens, packageName, removeTrailingS) => {
  let result = `package ${packageName}

import "database/sql"

type Queries struct {
  DB sql.DB
}`;

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
