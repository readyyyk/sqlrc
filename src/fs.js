// @ts-check
import fs from "node:fs";
import path from "node:path";

/** @typedef {import("./types.js").TConfig} TConfig */

/**
 * @throws
 * @param {string} cfgPath
 * @returns {TConfig}
 */
export const getConfig = (cfgPath) => {
  const configContent = fs.readFileSync(cfgPath, "utf-8");
  const data = JSON.parse(configContent);
  // WARNING no type-checking. Probably need to add validation
  return data;
};

/**
 * @param {TConfig} cfg
 * @param {string} cfgDir
 * */
export const getCodes = (cfg, cfgDir) => {
  const schemaCodePath = path.resolve(cfgDir, cfg.schema);
  /**@type {string[]}*/
  const queriesCodePaths = cfg.queries.map((a) => path.resolve(cfgDir, a));

  const schemaCode = fs.readFileSync(schemaCodePath, "utf-8");
  const queriesCodes = queriesCodePaths.map((p) => fs.readFileSync(p, "utf-8"));

  return {
    schame: schemaCode,
    queries: queriesCodes,
  };
};

/**
 * @param {string} schemaContent 
 * @param {string} to 
 */
export const writeSchema = (schemaContent, to) => {
  if (!fs.existsSync(to)){
    fs.mkdirSync(path.dirname(to), { recursive: true });
  }
  fs.writeFileSync(to, schemaContent);
}

