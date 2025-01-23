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

/** @typedef {{sql: string, name: string, type: QueryReturnType}} QueryToken */
/** @typedef {{
  queryToken: QueryToken,
  params: Record<string, {
    name: string,
    type: OwnType,
    positions: number[]
  }>
  resultSql: string
}} ParamedQuery */


/** @typedef {"many" | "one" | "exec"} QueryReturnType */
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

/** @typedef {"TEXT" | "INTEGER"} ColumnType */
/** @typedef {{name: string, type: ColumnType}} ColumnToken */

/** @type {Readonly<ColumnType[]>} */
export const ALLOWED_SQL_COLUMN_TYPES = Object.freeze(["TEXT", "INTEGER"]);
/** @typedef {"string" | "int"} GoType */
/** @type {Record<ColumnType, GoType>} */
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

/** @typedef {"string" | "number"} JSType */
/** @type {Record<ColumnType, JSType>} */
export const sqlToJSTypes = {
  TEXT: "string",
  INTEGER: "number",
};


/** @type {Readonly<GoType[]>} */
export const ALLOWED_GO_TYPES = Object.freeze([
  "int",
  "string",
]);
/**
 * @param {string} toCheck
 * @returns {toCheck is GoType}
 */
export const isALLOWED_GO_TYPES = (toCheck) => {
  // @ts-expect-error QueryReturnType is subtype of string
  return ALLOWED_GO_TYPES.includes(toCheck);
}


/** @typedef {GoType} OwnType */
/** @type {Readonly<GoType[]>} */
export const ALLOWED_OWN_TYPES = ALLOWED_GO_TYPES;
/**
 * @param {string} toCheck
 * @returns {toCheck is OwnType}
 */
export const isALLOWED_OWN_TYPES = (toCheck) => {
  // @ts-expect-error QueryReturnType is subtype of string
  return ALLOWED_OWN_TYPES.includes(toCheck);
}

