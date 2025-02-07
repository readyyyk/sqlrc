#! /usr/bin/env node
// @ts-check
import { Command } from "commander";
import { getCodes, getConfig, write } from "./fs.js";
import { parseQuery, parseQueryParams, parseSchema } from "./parse.js";
import { generateQueryFile, generateSchema } from "./generate.js";
import path from "node:path";


const program = new Command();

program
  .name("sqlrc")
  .description("CLI tool that uses SQL to create GOlang structs and queries")
  .requiredOption("--cfg <string>", "Path to config")
  .action((options) => {
    try {
      const cfgPath = path.resolve(process.cwd(), options.cfg);
      const workDir = path.dirname(cfgPath);

      const config = getConfig(cfgPath);

      const codes = getCodes(config, workDir);

      const schemaTokens = parseSchema(codes.schame);
      const schemaContent = generateSchema(schemaTokens, config.pakage.name, config.remove_trailing_s);
      const schemaPath = path.resolve(workDir, config.pakage.path, "schema.go");
      write(schemaContent, schemaPath);
      console.log("✅ Wrote schema to "+schemaPath)

      const querySetsTokens = codes.queries.map((q) => parseQuery(q));
      const queriesSetsWParams = querySetsTokens.map(
        qs =>
           qs.map(q => parseQueryParams(q)
        )
      );

      /*
      console.log(
          sqlP.sql2ast(
            queriesWParams[4].resultSql.replaceAll("?", '"?"').replace(/RETURNING.+/, "").trim()
          ).value
      );
      */

      const querySetsContent = queriesSetsWParams.map(
        qsWParams => generateQueryFile(qsWParams, config.pakage.name)
      );
      const queryPath = path.resolve(workDir, config.pakage.path, "query.go"); // TODO replace w actual names
      write(querySetsContent[0], queryPath);
      console.log("✅ Wrote query to "+schemaPath)
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  });

program.parse();
