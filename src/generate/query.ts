import { generateExec, generateReturnMany, generateReturnOne } from "./return";
import { GoType, ownToGoTypes, sqlToGoTypes, TScehmaToken, TWResolvedReturnQuery } from "../types";
import { capitalize, trimLeftTempl } from "./utils";
import { assert } from "console";

const getResultFields = (q: TWResolvedReturnQuery["result"], schema: TScehmaToken): Record<string, GoType> => {
    const result = {} as Record<string, GoType>;
    for (const tableName of Object.keys(q)) {
        const fields = q[tableName];
        for (const field of fields) {
            if (field.tableField === "*") {
                assert(!!(schema[tableName]), "Cant find schema for table: " + tableName)
                const sqlFields = schema[tableName];
                for (const [sqlFieldName, sqlField] of Object.entries(sqlFields)) {
                    result[capitalize(sqlFieldName)] = sqlToGoTypes[sqlField.type];
                }
            } else {
                // handle single field
                assert(!!(schema[tableName]?.[field.tableField]?.type), `Cant find type for table: ${tableName}, column: ${field.tableField}`)
                const sqlType = schema[tableName][field.tableField].type;
                assert(!!(sqlToGoTypes[sqlType]), `Cant find golang type for sql type: ${sqlType}`)
                const goType = sqlToGoTypes[sqlType];
                const structField = field.returningName.indexOf(".") !== -1
                    ? field.returningName.slice(field.returningName.indexOf(".")+1)
                    : field.returningName
                result[capitalize(structField)] = goType;
            }
        }
    }
    return result;
}

export const generateQueryFile = (paramedQueries: TWResolvedReturnQuery[], schema: TScehmaToken, packageName: string): string => {
    let result = trimLeftTempl`
        package ${packageName}
  
        import (
            "context"
        )`.slice(1);
    for(const query of paramedQueries) {
        result += `\n\n\n// ${query.queryToken.name}`;
        const sqlName = query.queryToken.name+"Sql"
        result += `\nconst ${sqlName} = \`\n${query.resultSql}\n\``;

        const paramsName = capitalize(query.queryToken.name)+"Params";
        const paramsFields = Object.entries(query.params)
            .map(([name, p]) => `${capitalize(name)} ${ownToGoTypes[p.type]}`);
        result += trimLeftTempl`\n
            type ${paramsName} struct {
                ${paramsFields.join('\n')}
            }`;
        
        const resultName = capitalize(query.queryToken.name)+"Result";
        const resultFields = getResultFields(query.result, schema);
        result += trimLeftTempl`\n
            type ${resultName} struct {
                ${Object.entries(resultFields).map(([name, type])=>name+" "+type).join('\n')}
            }`;
        
        switch (query.queryToken.type) {
            case "many":
                result += generateReturnMany(query, {sqlName, paramsName, resultName, resultFields});
                break;
            case "one":
                result += generateReturnOne(query, {sqlName, paramsName, resultName, resultFields});
                break;
            case "exec":
                result += generateExec(query, {sqlName, paramsName, resultName, resultFields});
                break;
            default:
                throw new Error("Got invalid query return type (for sqlrc)")
        }
    }
    return result; 
};