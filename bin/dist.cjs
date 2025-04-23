#! /usr/bin/env node
// by @readyyyk
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/fs.ts
var import_node_fs = __toESM(require("node:fs"), 1);
var import_node_path = __toESM(require("node:path"), 1);
var getConfig = (cfgPath) => {
  const configContent = import_node_fs.default.readFileSync(cfgPath, "utf-8");
  const data = JSON.parse(configContent);
  return data;
};
var getCodes = (cfg, cfgDir) => {
  const schemaCodePath = import_node_path.default.resolve(cfgDir, cfg.schema);
  const queriesCodePaths = cfg.queries.map((a) => import_node_path.default.resolve(cfgDir, a));
  const schemaCode = import_node_fs.default.readFileSync(schemaCodePath, "utf-8");
  const queriesCodes = queriesCodePaths.map((p) => import_node_fs.default.readFileSync(p, "utf-8"));
  return {
    schame: schemaCode,
    queries: queriesCodes
  };
};
var write = (content, to) => {
  if (!import_node_fs.default.existsSync(to)) {
    import_node_fs.default.mkdirSync(import_node_path.default.dirname(to), { recursive: true });
  }
  import_node_fs.default.writeFileSync(to, content);
};

// src/types.ts
var ALLOWED_QUERY_RETURN_TYPES = [
  "one",
  "many",
  "exec"
];
var isALLOWED_QUERY_RETURN_TYPES = (toCheck) => {
  return ALLOWED_QUERY_RETURN_TYPES.includes(toCheck);
};
var ALLOWED_SQL_COLUMN_TYPES = [
  "TEXT",
  "INTEGER"
];
var isALLOWED_SQL_COLUMN_TYPES = (toCheck) => {
  return ALLOWED_SQL_COLUMN_TYPES.includes(toCheck);
};
var ALLOWED_GO_TYPES = [
  "int",
  "string"
];
var ALLOWED_OWN_TYPES = ALLOWED_GO_TYPES;
var isALLOWED_OWN_TYPES = (toCheck) => {
  return ALLOWED_OWN_TYPES.includes(toCheck);
};
var sqlToGoTypes = {
  TEXT: "string",
  INTEGER: "int"
};
var ownToGoTypes = {
  string: "string",
  int: "int"
};

// src/parse/schema.ts
var SQL_TABLE_DELITMER = "CREATE";
var SQL_TABLE_NAME_REGEX = /(TABLE|table)\s+(\w+)/g;
var SQL_TABLE_NAME_REGEX_GROUP_INDEX = 2;
var parseSchema = (sqlcode) => {
  const tableDeclarations = sqlcode.replaceAll(/--[^\n]*\n/g, "\n").split(SQL_TABLE_DELITMER).map((a) => a.trim()).filter(Boolean);
  const tableNames = tableDeclarations.map((a) => {
    const res = SQL_TABLE_NAME_REGEX.exec(a);
    SQL_TABLE_NAME_REGEX.lastIndex = 0;
    return res;
  }).map((m, i) => {
    if (m === null) {
      throw new Error(
        "Cant find table name in declaration: \n" + tableDeclarations[i]
      );
    }
    return m[SQL_TABLE_NAME_REGEX_GROUP_INDEX];
  });
  const tablesFields = tableDeclarations.map(
    (declaration) => declaration.split("(").slice(1).join("(").split(/\)[^\)]*;$/)[0].split(/, *\n/).map((field) => field.trim()).filter(Boolean).map((field) => {
      const name = field.split(" ")[0];
      const type = field.split(" ")[1];
      const isNullable = field.search("NOT NULL") === -1 && field.search("PRIMARY KEY") === -1;
      isNullable && console.warn(
        "[WARN]: Nullable field found. NULL state is not handled in output code. Read github.com/re-worthy/sqlrc"
      );
      if (!isALLOWED_SQL_COLUMN_TYPES(type)) {
        throw new Error(
          "Unsupported column type. \nGot: " + type + "\nAllowed are: " + JSON.stringify(ALLOWED_SQL_COLUMN_TYPES)
        );
      }
      return { name, type };
    })
  );
  const result = {};
  for (let i = 0; i < tableNames.length; i++) {
    const tName = tableNames[i];
    const tokens = tablesFields[i];
    for (const token of tokens) {
      if (!result[tName]) {
        result[tName] = {};
      }
      result[tName][token.name] = { type: token.type };
    }
  }
  return result;
};

// src/parse/query/parse.ts
var SQL_COMMENT_TOKEN = "--@";
var SQL_DELITMER_TOKEN = ";";
var parseQuery = (sqlcode) => {
  const parts = sqlcode.split(SQL_COMMENT_TOKEN).map((a) => a.trim()).filter(Boolean);
  const sqlParts = parts.map((a) => a.split(SQL_DELITMER_TOKEN)).flat().map((a) => a.trim()).filter(Boolean);
  if (parts.length !== sqlParts.length) {
    throw new Error(
      "You can use only one query per method. Consider using `Subqueries` or `CTEs`"
    );
  }
  const result = [];
  for (const query of sqlParts) {
    const [head, ...rest] = query.split("\n");
    const sql = rest.map((a) => a.trimEnd()).filter(Boolean).join("\n");
    const [_, name, type] = head.split(":");
    if (!isALLOWED_QUERY_RETURN_TYPES(type)) {
      throw new Error(
        "Invalid query return type. \nGot: " + type + "\nAllowed are: " + JSON.stringify(ALLOWED_QUERY_RETURN_TYPES)
      );
    }
    result.push({ sql, name, type });
  }
  return result;
};

// src/parse/query/params.ts
var PARAM_REGEX = /(\<\@)([^:]+):([^\@]+)(\@\>)/g;
var NAME_GROUP_IDX = 2;
var TYPE_GROUP_IDX = 3;
var parseQueryParams = (queryToken) => {
  const result = {
    queryToken,
    params: {},
    resultSql: ""
  };
  result.resultSql = queryToken.sql.replaceAll(PARAM_REGEX, "?");
  const matches = result.queryToken.sql.matchAll(PARAM_REGEX);
  let i = 0;
  for (const match of matches) {
    const name = match[NAME_GROUP_IDX];
    const _type = match[TYPE_GROUP_IDX];
    if (!isALLOWED_OWN_TYPES(_type)) {
      throw new Error(
        "Invalid own type. \nGot: " + _type + "\nAllowed are: " + JSON.stringify(ALLOWED_OWN_TYPES)
      );
    }
    result.params[name] = {
      name,
      type: _type,
      positions: result.params[name]?.positions ? result.params[name].positions.concat(i) : [i]
    };
    i++;
  }
  return result;
};

// src/parse/query/getTableName.ts
var kwInsert = "insert into ";
var kwUpdate = "update ";
var kwDelete = "delete from ";
var getTableName = (sqlString) => {
  const sqlStringL = sqlString.toLowerCase();
  const idxInsert = sqlStringL.indexOf(kwInsert);
  const idxUpdate = sqlStringL.indexOf(kwUpdate);
  const idxDelete = sqlStringL.indexOf(kwDelete);
  if (idxInsert !== -1) {
    return sqlString.slice(idxInsert + kwInsert.length).split(" ")[0];
  }
  if (idxUpdate !== -1) {
    return sqlString.slice(idxUpdate + kwUpdate.length).split(" ")[0];
  }
  if (idxDelete !== -1) {
    return sqlString.slice(idxDelete + kwDelete.length).split(" ")[0];
  }
  throw new Error("Cant get table from sql: " + sqlString);
};

// src/parse/query/result.ts
var handleFieldAlias = (cur) => {
  cur = cur.replace(/ as /i, " ");
  const parts = cur.split(" ");
  if (parts.length === 1) {
    return { [parts[0]]: parts[0] };
  }
  const alias = parts.at(-1);
  const value = parts.slice(0, -1).join(" ");
  return { [alias]: value };
};
var getFieldsWAliases = (fields) => fields.reduce((acc, cur) => ({
  ...acc,
  ...handleFieldAlias(cur)
}), {});
var RETURNING_KW = "returning";
var handleReturning = (result, sqlWoComments) => {
  const idxReturning = sqlWoComments.toLowerCase().lastIndexOf(RETURNING_KW);
  if (idxReturning === -1) {
    return;
  }
  const fields = sqlWoComments.slice(idxReturning + RETURNING_KW.length).split(",").map((a) => a.trim());
  const tableName = getTableName(sqlWoComments);
  const fieldsWAliases = getFieldsWAliases(fields);
  for (const [name, value] of Object.entries(fieldsWAliases)) {
    let field = value;
    if (!/^(\*|[a-zA-Z_0-9]+)$/.test(field)) {
      const foundField = field.match(/(^|\s)(\*|[a-zA-Z_0-9]+)($|\s)/m);
      if (!foundField) {
        throw new Error("Field name not found in: " + field);
      }
      field = foundField?.[1];
    }
    if (!result.result[tableName]) {
      result.result[tableName] = [];
    }
    result.result[tableName].push({
      tableField: field,
      returningName: name
    });
  }
};
var SELECT_KW = "select";
var FROM_KW = "from";
var handleSelect = (result, sqlWoComments) => {
  const idxSelect = sqlWoComments.toLowerCase().indexOf(SELECT_KW);
  const idxFrom = sqlWoComments.toLowerCase().indexOf(FROM_KW);
  const selectFieldsStr = sqlWoComments.slice(idxSelect + SELECT_KW.length, idxFrom);
  const selectFields = selectFieldsStr.split(",").map((a) => a.trim()).filter(Boolean);
  const selectFieldsWAliases = getFieldsWAliases(selectFields);
  const JOIN_RE = /(^|\s)join($|\s)/gmi;
  const JOIN_RE_MATCH_LE = 6;
  const ON_RE = /(^|\s)on($|\s)/gmi;
  const joinMatches = Array.from(sqlWoComments.matchAll(JOIN_RE));
  const onMatches = Array.from(sqlWoComments.matchAll(ON_RE));
  if (joinMatches.length !== onMatches.length) {
    throw new Error("Undefined behaviour. Contact gh@readyyyk. Different number of matches for JOIN and ON keywords in sql: \n" + sqlWoComments);
  }
  const tableFields = [];
  let i = 0;
  while (i < joinMatches.length) {
    const jm = joinMatches[i];
    const om = onMatches[i];
    tableFields.push(sqlWoComments.slice(jm.index + JOIN_RE_MATCH_LE, om.index));
    i++;
  }
  const fromTableParts = sqlWoComments.slice(idxFrom + FROM_KW.length).trim().split(/\s/);
  let fromTableField = fromTableParts[0];
  if (fromTableParts.length > 3 && fromTableParts[1].toLowerCase() === "as") {
    fromTableField = fromTableParts.slice(0, 3).join(" ");
  }
  tableFields.push(fromTableField);
  const tablesAliases = getFieldsWAliases(tableFields);
  if (Object.entries(tablesAliases).length === 1) {
    for (const [name, value] of Object.entries(selectFieldsWAliases)) {
      let field = value;
      const tableName = Object.entries(tablesAliases)[0][1];
      if (!/^(\*|[a-zA-Z_0-9]+)$/.test(field)) {
        const foundField = field.match(/(^|\s)([a-zA-Z_0-9]+\.)?(\*|[a-zA-Z_0-9]+)($|\s)/m);
        if (!foundField) {
          throw new Error("Field name not found in: " + field);
        }
        field = foundField?.[3];
      }
      if (!result.result[tableName]) {
        result.result[tableName] = [];
      }
      result.result[tableName].push({
        tableField: field,
        returningName: field === "*" ? field : name
      });
    }
    return;
  }
  for (const [name, value] of Object.entries(selectFieldsWAliases)) {
    let field = value;
    let tableName = Object.entries(tablesAliases)[0][1];
    if (!/^(\*|[a-zA-Z_0-9]+)$/.test(field)) {
      const foundField = field.match(/(^|\s)([a-zA-Z_0-9]+\.)?(\*|[a-zA-Z_0-9]+)($|\s)/m);
      if (!foundField) {
        throw new Error("Field name not found in: " + field);
      }
      field = foundField?.[3];
      console.assert(!!foundField?.[3], "Cant find field, value: ", foundField?.[3], "\nmatched value: ", foundField);
      const tableAlias = foundField[2].slice(0, -1);
      tableName = tablesAliases[tableAlias];
    }
    if (!result.result[tableName]) {
      result.result[tableName] = [];
    }
    result.result[tableName].push({
      tableField: field,
      returningName: field === "*" ? field : name
    });
  }
  return;
};
var parseResolveResult = (q) => {
  const result = {
    ...q,
    result: {}
  };
  const woComments = q.resultSql.replaceAll(/--.+[\n\r]/g, "");
  const woCommentsL = woComments.toLowerCase();
  if (woCommentsL.startsWith("select")) {
    handleSelect(result, woComments);
  } else {
    handleReturning(result, woComments);
  }
  return result;
};

// src/generate/utils.ts
var capitalize = (a) => a[0].toUpperCase() + a.slice(1);
var trimLeft = (s) => String(s).split("\n").map((a) => a.trimStart()).join("\n");
var trimLeftTempl = (s, ...values) => {
  const result = s.reduce((acc, cur, i) => acc + cur + (values[i] ? String(values[i]) : ""), "");
  return trimLeft(result);
};

// src/generate/schema.ts
var generateSchema = (tokens, packageName, removeTrailingS) => {
  let result = trimLeftTempl`
        package ${packageName}

        import "database/sql"

        type Queries struct {
            DB *sql.DB
        }`.slice(1);
  for (const tableName in tokens) {
    const columns = tokens[tableName];
    let structName = capitalize(tableName);
    if (removeTrailingS && structName.at(-1)?.toLowerCase() === "s") {
      structName = structName.slice(0, -1);
    }
    let structCode = `
type ${structName} struct {`;
    for (const [name, col] of Object.entries(columns)) {
      structCode += `
${capitalize(name)} ${sqlToGoTypes[col.type]} \`db:"${name}"\``;
    }
    structCode += "\n}\n";
    result += "\n" + structCode;
  }
  return result;
};

// src/generate/return/exec.ts
var generateExec = (query, d) => {
  throw new Error("Not implemented");
};

// src/generate/return/one.ts
var generateReturnOne = (query, d) => {
  let result = "";
  const goParams = Object.entries(query.params).reduce((acc, [name, p]) => {
    for (const pos of p.positions) {
      acc[pos] = name;
    }
    return acc;
  }, []);
  const completeGoParams = goParams.map((p) => "arg." + capitalize(p)).join(", ");
  const functionName = capitalize(query.queryToken.name);
  result += trimLeftTempl`\n
    func (q *Queries) ${functionName}(ctx context.Context, arg ${d.paramsName}) (*${d.resultName}, error) {
      row := q.DB.QueryRowContext(ctx, ${d.sqlName}, ${completeGoParams}) 
      var i ${d.resultName}
        err := row.Scan(
          ${Object.keys(d.resultFields).map((s) => `&i.${s},`).join("\n")}
        )
        return &i, err
    }`;
  return result;
};

// src/generate/return/many.ts
var generateReturnMany = (query, d) => {
  let result = "";
  const goParams = Object.entries(query.params).reduce((acc, [name, p]) => {
    for (const pos of p.positions) {
      acc[pos] = name;
    }
    return acc;
  }, []);
  const completeGoParams = goParams.map((p) => "arg." + capitalize(p)).join(", ");
  const functionName = capitalize(query.queryToken.name);
  result += trimLeftTempl`\n
        func (q *Queries) ${functionName}(ctx context.Context, arg ${d.paramsName}) (*[]${d.resultName}, error) {
            rows, err := q.DB.QueryContext(ctx, ${d.sqlName}, ${completeGoParams})
            if err != nil {
                return nil, err
            }
            defer rows.Close()
            var items []${d.resultName}
            for rows.Next() {
                var i ${d.resultName}
                if err := rows.Scan(
                    ${Object.keys(d.resultFields).map((s) => `&i.${s},`).join("\n")}
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
        }`;
  return result;
};

// src/generate/query.ts
var import_console = require("console");
var getResultFields = (q, schema) => {
  const result = {};
  for (const tableName of Object.keys(q)) {
    const fields = q[tableName];
    for (const field of fields) {
      if (field.tableField === "*") {
        (0, import_console.assert)(!!schema[tableName], "Cant find schema for table: " + tableName);
        const sqlFields = schema[tableName];
        for (const [sqlFieldName, sqlField] of Object.entries(sqlFields)) {
          result[capitalize(sqlFieldName)] = sqlToGoTypes[sqlField.type];
        }
      } else {
        (0, import_console.assert)(!!schema[tableName]?.[field.tableField]?.type, `Cant find type for table: ${tableName}, column: ${field.tableField}`);
        const sqlType = schema[tableName][field.tableField].type;
        (0, import_console.assert)(!!sqlToGoTypes[sqlType], `Cant find golang type for sql type: ${sqlType}`);
        const goType = sqlToGoTypes[sqlType];
        const structField = field.returningName.indexOf(".") !== -1 ? field.returningName.slice(field.returningName.indexOf(".") + 1) : field.returningName;
        result[capitalize(structField)] = goType;
      }
    }
  }
  return result;
};
var generateQueryFile = (paramedQueries, schema, packageName) => {
  let result = trimLeftTempl`
        package ${packageName}
  
        import (
            "context"
        )`.slice(1);
  for (const query of paramedQueries) {
    result += `


// ${query.queryToken.name}`;
    const sqlName = query.queryToken.name + "Sql";
    result += `
const ${sqlName} = \`
${query.resultSql}
\``;
    const paramsName = capitalize(query.queryToken.name) + "Params";
    const paramsFields = Object.entries(query.params).map(([name, p]) => `${capitalize(name)} ${ownToGoTypes[p.type]}`);
    result += trimLeftTempl`\n
            type ${paramsName} struct {
                ${paramsFields.join("\n")}
            }`;
    const resultName = capitalize(query.queryToken.name) + "Result";
    const resultFields = getResultFields(query.result, schema);
    result += trimLeftTempl`\n
            type ${resultName} struct {
                ${Object.entries(resultFields).map(([name, type]) => name + " " + type).join("\n")}
            }`;
    switch (query.queryToken.type) {
      case "many":
        result += generateReturnMany(query, { sqlName, paramsName, resultName, resultFields });
        break;
      case "one":
        result += generateReturnOne(query, { sqlName, paramsName, resultName, resultFields });
        break;
      case "exec":
        result += generateExec(query, { sqlName, paramsName, resultName, resultFields });
        break;
      default:
        throw new Error("Got invalid query return type (for sqlrc)");
    }
  }
  return result;
};

// src/index.ts
var import_node_path2 = __toESM(require("node:path"), 1);
var import_node_process = require("node:process");
console.log("sqlRc");
console.log("CLI tool that uses SQL to create Golang structs and queries");
console.log("--cfg <string>", "Path to config");
if (import_node_process.argv[2] !== "--cfg") {
  process.exit(1);
}
if (!import_node_process.argv[3]) {
  process.exit(1);
}
console.log("\nStarted...");
try {
  const cfgPath = import_node_path2.default.resolve(process.cwd(), import_node_process.argv[3]);
  const workDir = import_node_path2.default.dirname(cfgPath);
  const config = getConfig(cfgPath);
  const codes = getCodes(config, workDir);
  const schemaTokens = parseSchema(codes.schame);
  const schemaContent = generateSchema(schemaTokens, config.pakage.name, config.remove_trailing_s);
  const schemaPath = import_node_path2.default.resolve(workDir, config.pakage.path, "schema.go");
  write(schemaContent, schemaPath);
  console.log("\u2705 Wrote schema to " + schemaPath);
  const querySetsTokens = codes.queries.map((q) => parseQuery(q));
  const queriesSetsWParams = querySetsTokens.map((qs) => qs.map(parseQueryParams));
  const qsWResolvedResult = queriesSetsWParams.map((qs) => qs.map(parseResolveResult));
  const querySetsContent = qsWResolvedResult.map(
    (qsWParams) => generateQueryFile(qsWParams, schemaTokens, config.pakage.name)
  );
  const queryPath = import_node_path2.default.resolve(workDir, config.pakage.path, "query.go");
  write(querySetsContent[0], queryPath);
  console.log("\u2705 Wrote query to " + schemaPath);
} catch (e) {
  console.error(e);
  process.exit(1);
}
