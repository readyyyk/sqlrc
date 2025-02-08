import { TParamedQuery, TWResolvedReturnQuery } from "../../types";
import { getTableName } from "./getTableName";

/** @returns Record<alias|columnName, value> */
const handleFieldAlias = (cur: string): Record<string, string> => {
    cur = cur.replace(/ as /i, " ");

    const parts = cur.split(" ");
    if (parts.length === 1) {
        return {[parts[0]]: parts[0]};
    }

    const alias = parts.at(-1)!;
    const value = parts.slice(0, -1).join(" ");
    return {[alias]: value};
}

/** @returns Record<alias|columnName, value> */
const getFieldsWAliases = (fields: string[]): Record<string, string> =>
    fields.reduce((acc, cur) => ({
        ...acc,
        ...handleFieldAlias(cur)
    }), {} as Record<string, string>);


const RETURNING_KW = "returning";
const handleReturning = (result: TWResolvedReturnQuery, sqlWoComments: string) => {
    const idxReturning = sqlWoComments.toLowerCase().lastIndexOf(RETURNING_KW);
    if (idxReturning === -1) {
        return;
    }
    const fields = sqlWoComments
      .slice(idxReturning + RETURNING_KW.length)
      .split(",")
      .map(a=>a.trim());

      const tableName = getTableName(sqlWoComments);
      const fieldsWAliases = getFieldsWAliases(fields);
    
    for (const [name, value] of Object.entries(fieldsWAliases)) {
        let field = value;
        if (!/^[a-zA-Z_0-9]+$/.test(field)) {
            const foundField = field.match(/(^|\s)([a-zA-Z_0-9]+)(^|\s)/m);
            if (!foundField) {
                throw new Error("Field name not found in: " + field);
            }
            field = foundField?.[1];
        }
        result.result[tableName] = {
            tableField: field,
            returningName: name,
        }
    }
}


const SELECT_KW = "select";
const FROM_KW = "from";
const handleSelect = (result: TWResolvedReturnQuery, sqlWoComments: string): string[] => {
    const idxSelect = sqlWoComments.toLowerCase().indexOf(SELECT_KW);
    const idxFrom = sqlWoComments.toLowerCase().indexOf(FROM_KW);
    
    const selectFieldsStr = sqlWoComments.slice(idxSelect + SELECT_KW.length, idxFrom);
    const selectFields = selectFieldsStr.split(",").map(a=>a.trim());

    // hadnle table aliases, like
    // SELECT u.* FROM users u;

    const JOIN_RE = /(^|\s)join($|\s)/gmi;
    const JOIN_RE_MATCH_LE = 6;
    const ON_RE = /(^|\s)on($|\s)/gmi;
    const joinMatches = Array.from(sqlWoComments.matchAll(JOIN_RE));
    const onMatches = Array.from(sqlWoComments.matchAll(ON_RE));
    if (joinMatches.length !== onMatches.length) {
        throw new Error("Undefined behaviour. Contact gh@readyyyk. Different number of matches for JOIN and ON keywords in sql: \n" + sqlWoComments);
    }
    
    const tableFields = [] as string[];
    let i = 0;
    while(i < joinMatches.length) {
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

    /// TODO handle fields w table aliases

    return selectFields;
}

export const parseResolveResult = (q: TParamedQuery): TWResolvedReturnQuery => {
    const result: TWResolvedReturnQuery = {
        ...q,
        result: {}
    };

    const woComments = q.resultSql.replaceAll(/--.+[\n\r]/g, "");
    const woCommentsL = woComments.toLowerCase();

    if (woCommentsL.startsWith("select")) {
        handleSelect(result, woComments);
    } else {
        // handle RETURNING keyword (insert, update, delete)
        handleReturning(result, woComments);
    }

    return result
}
