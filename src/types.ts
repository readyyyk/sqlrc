// @ts-check

export type TConfig = {
  schema: string,
  queries: string[],
  remove_trailing_s: boolean,
  pakage: {
    name: string,
    path: string
  }
}

export type TQueryToken = {
  sql: string;
  name: string;
  type: QueryReturnType;
};

export type TParamedQuery = {
    queryToken: TQueryToken;
    params: Record<string, {
        name: string;
        type: OwnType;
        positions: number[];
    }>;
    resultSql: string;
};

/** @description .result Record<tableName, field> */
export type TWResolvedReturnQuery = TParamedQuery & {
  result: Record<string, {
    tableField: string;
    returningName: string;
  }>
};


export const ALLOWED_QUERY_RETURN_TYPES = [
  "one",
  "many",
  "exec",
] as const;
export type QueryReturnType = typeof ALLOWED_QUERY_RETURN_TYPES[number];
export const isALLOWED_QUERY_RETURN_TYPES = (toCheck: string): toCheck is QueryReturnType => {
  // @ts-expect-error QueryReturnType is subtype of string
  return ALLOWED_QUERY_RETURN_TYPES.includes(toCheck);
};

export const ALLOWED_SQL_COLUMN_TYPES = [
  "TEXT",
  "INTEGER",
] as const;
export type ColumnType = typeof ALLOWED_SQL_COLUMN_TYPES[number];
export const isALLOWED_SQL_COLUMN_TYPES = (toCheck: string): toCheck is ColumnType => {
  // @ts-expect-error QueryReturnType is subtype of string
  return ALLOWED_SQL_COLUMN_TYPES.includes(toCheck);
};

export const ALLOWED_GO_TYPES = [
  "int",
  "string",
] as const;
export type GoType = typeof ALLOWED_GO_TYPES[number];
export const isALLOWED_GO_TYPES = (toCheck: string): toCheck is GoType => {
  // @ts-expect-error QueryReturnType is subtype of string
  return ALLOWED_GO_TYPES.includes(toCheck);
}

export const ALLOWED_OWN_TYPES = ALLOWED_GO_TYPES;
export type OwnType = typeof ALLOWED_OWN_TYPES[number];
export const isALLOWED_OWN_TYPES = (toCheck: string): toCheck is OwnType => {
  // @ts-expect-error QueryReturnType is subtype of string
  return ALLOWED_OWN_TYPES.includes(toCheck);
}

export type JSType = "string" | "number"

export type ColumnToken = { name: string; type: ColumnType; };


export const sqlToJSTypes: Record<ColumnType, JSType> = {
  TEXT: "string",
  INTEGER: "number",
};

export const sqlToGoTypes: Record<ColumnType, GoType> = {
  TEXT: "string",
  INTEGER: "int",
};

export const ownToGoTypes: Record<OwnType, GoType> = {
  string: "string",
  int: "int",
};

