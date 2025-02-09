#! /usr/bin/env node
import { getCodes, getConfig, write } from "./fs.ts";
import { parseQuery, parseQueryParams, parseSchema, parseResolveResult } from "./parse/index.ts";
import { generateQueryFile, generateSchema } from "./generate";
import path from "node:path";
import { argv } from "node:process";

console.log("sqlRc")
console.log("CLI tool that uses SQL to create Golang structs and queries")
console.log("--cfg <string>", "Path to config")

if(argv[2] !== "--cfg") {
  process.exit(1);
};
if(!argv[3]) {
  process.exit(1);
};

console.log("\nStarted...")
try {
  const cfgPath = path.resolve(process.cwd(), argv[3]);
  const workDir = path.dirname(cfgPath);

  const config = getConfig(cfgPath);

  const codes = getCodes(config, workDir);

  const schemaTokens = parseSchema(codes.schame);
  const schemaContent = generateSchema(schemaTokens, config.pakage.name, config.remove_trailing_s);
  const schemaPath = path.resolve(workDir, config.pakage.path, "schema.go");
  write(schemaContent, schemaPath);
  console.log("✅ Wrote schema to "+schemaPath)

  const querySetsTokens = codes.queries.map((q) => parseQuery(q));
  const queriesSetsWParams = querySetsTokens.map(qs => qs.map(parseQueryParams));
  const qsWResolvedResult = queriesSetsWParams.map(qs => qs.map(parseResolveResult));

  const querySetsContent = qsWResolvedResult.map(
    qsWParams => generateQueryFile(qsWParams, schemaTokens, config.pakage.name)
  );
  const queryPath = path.resolve(workDir, config.pakage.path, "query.go"); // TODO replace w actual names
  write(querySetsContent[0], queryPath);
  console.log("✅ Wrote query to "+schemaPath)
} catch (e) {
  console.error(e);
  process.exit(1);
}
