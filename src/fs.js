// @ts-check
import fs from "node:fs";
import path from "node:path";

/**
 * @throws
 * @param {string} cwd
 * @param {string} relativeConfigPath
 */
export const getCodes = (cwd, relativeConfigPath) => {
  const cfgPath = path.resolve(cwd, relativeConfigPath);
  const configContent = fs.readFileSync(cfgPath, "utf-8");
  const data = JSON.parse(configContent);

  const cfgDir = path.dirname(cfgPath);
  const schemaCodePath = path.resolve(cfgDir, data.schema);
  /**@type {string[]}*/
  const queriesCodePaths = data.queries.map((a) => path.resolve(cfgDir, a));

  const schemaCode = fs.readFileSync(schemaCodePath, "utf-8");
  const queriesCodes = queriesCodePaths.map((p) => fs.readFileSync(p, "utf-8"));

  return {
    schame: schemaCode,
    queries: queriesCodes,
  };
};
