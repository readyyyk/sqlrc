// @ts-check

/** @typedef {{
  schema: string,
  queries: string[],
  remove_trailing_s: boolean,
  pakage: {
    name: string,
    path: string
  }
}} TConfig */

/** @typedef {"many" | "one" | "exec"} QueryReturnType */
/** @typedef {{sql: string, name: string, type: QueryReturnType}} QueryToken */
/** @type {Readonly<QueryReturnType[]>} */
export const ALLOWED_QUERY_RETURN_TYPES = Object.freeze([
  "one",
  "many",
  "exec",
]);
/**
 * @param {string} toCheck
 * @returns {toCheck is QueryReturnType}
 */
export const isALLOWED_QUERY_RETURN_TYPES = (toCheck) => {
  // @ts-expect-error QueryReturnType is subtype of string
  return ALLOWED_QUERY_RETURN_TYPES.includes(toCheck);
};

/** @typedef {"string" | "int"} GoTypes */
/** @typedef {"TEXT" | "INTEGER"} ColumnType */
/** @typedef {{name: string, type: ColumnType}} ColumnToken */

/** @type {Readonly<ColumnType[]>} */
export const ALLOWED_SQL_COLUMN_TYPES = Object.freeze(["TEXT", "INTEGER"]);

/** @type {Record<ColumnType, GoTypes>} */
export const sqlToGoTypes = {
  TEXT: "string",
  INTEGER: "int",
};
/**
 * @param {string} toCheck
 * @returns {toCheck is ColumnType}
 */
export const isALLOWED_SQL_COLUMN_TYPES = (toCheck) => {
  // @ts-expect-error QueryReturnType is subtype of string
  return ALLOWED_SQL_COLUMN_TYPES.includes(toCheck);
};
