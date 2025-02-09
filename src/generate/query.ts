import { generateExec, generateReturnMany, generateReturnOne } from "./return";
import { GoType, ownToGoTypes, TScehmaToken, TWResolvedReturnQuery } from "../types";
import { capitalize, trimLeftTempl } from "./utils";

const getResultFields = (q: TWResolvedReturnQuery): Record<string, GoType> => {
    const result = {} as Record<string, GoType>;
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
        const resultFields = Object.entries(query.params)
            .map(([name, p]) => `${capitalize(name)} ${ownToGoTypes[p.type]}`);
        result += trimLeftTempl`\n
            type ${resultName} struct {
                ${resultFields.join('\n')}
            }`;
        
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
};