import type { TWResolvedReturnQuery } from "../types";

export const capitalize = (a: string) => a[0].toUpperCase() + a.slice(1); 
export type TGenerateFunc = (query: TWResolvedReturnQuery, sqlName: string, paramsName: string) => string

export const trimLeft: (s: string) => string = (s) => String(s).split("\n").map(a=>a.trimStart()).join("\n");
export const trimLeftTempl: (s: TemplateStringsArray, ...values: any[]) => string = (s, ...values) => {
    const result = s.reduce((acc, cur, i) => acc + cur + (values[i] ? String(values[i]) : ""), "");
    return trimLeft(result);
}

