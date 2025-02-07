// @ts-check
import fs from "node:fs";
import path from "node:path";

import {type TConfig} from './types.ts';

export const getConfig = (cfgPath: string): TConfig => {
  const configContent = fs.readFileSync(cfgPath, "utf-8");
  const data = JSON.parse(configContent);
  // WARNING no type-checking. Probably need to add validation
  return data;
};

export const getCodes = (cfg: TConfig, cfgDir: string) => {
  const schemaCodePath = path.resolve(cfgDir, cfg.schema);
  const queriesCodePaths = cfg.queries.map((a) => path.resolve(cfgDir, a));

  const schemaCode = fs.readFileSync(schemaCodePath, "utf-8");
  const queriesCodes = queriesCodePaths.map((p) => fs.readFileSync(p, "utf-8"));

  return {
    schame: schemaCode,
    queries: queriesCodes,
  };
};

export const write = (content: string, to: string) => {
  if (!fs.existsSync(to)){
    fs.mkdirSync(path.dirname(to), { recursive: true });
  }
  fs.writeFileSync(to, content);
}

