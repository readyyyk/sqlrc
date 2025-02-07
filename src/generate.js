// @ts-check

import { ownToGoTypes, sqlToGoTypes } from "./types.js";

/** @typedef {import("./types.js").ParamedQuery} ParamedQuery */
/** @typedef {import("./types.js").ColumnToken} ColumnToken */
/** @typedef {import("./types.js").QueryToken} QueryToken */
/** @typedef {import("./types.js").OwnType} OwnType */


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

/**
 * @param {ParamedQuery} query
 * @param {string} sqlName
 * @param {string} paramsName
 * @returns {string}
 */
const generateReturnOne = (query, sqlName, paramsName) => {
  let result = "";
  /** @type {string[]} */
  const goParams = Object.entries(query.params)
      .reduce((acc, [name, p]) => {
        for (const pos of p.positions) {
          // @ts-expect-error in this case string Is assignable to never
          acc[pos] = name;
        }
        return acc;
      }, []);
    const completeGoParams = goParams.map(p=>"arg."+capitalize(p)).join(', ');
    const functionName = capitalize(query.queryToken.name);
    result += `\n
func (q *Queries) ${functionName}(ctx context.Context, arg ${paramsName}) (*TO_BE_DONE, error) {
  row := q.DB.QueryRowContext(ctx, ${sqlName}, ${completeGoParams}) 
  var i TO_BE_DONE
	err := row.Scan(
		&i.Fk,
		&i.Id,
		&i.Text,
	)
	return &i, err
}`
  return result;
}

/**
 * @param {ParamedQuery} query
 * @param {string} sqlName
 * @param {string} paramsName
 * @returns {string}
 */
const generateExec = (query, sqlName, paramsName) => {
  throw new Error("Not implemented")
}



/**
 * @param {ParamedQuery} query
 * @param {string} sqlName
 * @param {string} paramsName
 * @returns {string}
 */
const generateReturnMany = (query, sqlName, paramsName) => {
  let result = "";
  /** @type {string[]} */
  const goParams = Object.entries(query.params)
      .reduce((acc, [name, p]) => {
        for (const pos of p.positions) {
          // @ts-expect-error in this case string Is assignable to never
          acc[pos] = name;
        }
        return acc;
      }, []);
    const completeGoParams = goParams.map(p=>"arg."+capitalize(p)).join(', ');
    const functionName = capitalize(query.queryToken.name);
    result += `\n
func (q *Queries) ${functionName}(ctx context.Context, arg ${paramsName}) (*[]TO_BE_DONE, error) {
  rows, err := q.DB.QueryContext(ctx, ${sqlName}, ${completeGoParams})
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []TO_BE_DONE
	for rows.Next() {
		var i TO_BE_DONE
		if err := rows.Scan(
			&i.Id,
			&i.Fk,
			&i.Text,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	if err := rows.Close(); err != nil {
		return nil, err
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return &items, nil
}
`
  return result;
}

/**
 * @param {string} packageName
 * @param {ParamedQuery[]} paramedQueries 
 * @returns {string}
 */
export const generateQueryFile = (paramedQueries, packageName) => {
  let result = `package ${packageName}

import (
	"context"
)`;
  for(const query of paramedQueries) {
    result += `\n\n\n// ${query.queryToken.name}`;
    const sqlName = query.queryToken.name+"Sql"
    result += `\nconst ${sqlName} = \`\n${query.resultSql}\n\``;

    const paramsName = capitalize(query.queryToken.name)+"Params";
    const params = Object.entries(query.params)
      .map(([name, p]) => `${capitalize(name)} ${ownToGoTypes[p.type]}`);
    result += `\n\ntype ${paramsName} struct {\n${params.join('\n')}\n}`
    
    switch (query.queryToken.type) {
      case "many":
        result += generateReturnMany(query, sqlName, paramsName);
        break;
      case "one":
        result += generateReturnOne(query, sqlName, paramsName);
        break;
      case "exec":
        result += generateExec(query, sqlName, paramsName);
        break;
      default:
        throw new Error("Got invalid query return type (for sqlrc)")
    }
  }
  return result; 
}
