// @ts-check
import { Command } from "commander";
import { getCodes, getConfig, writeSchema } from "./fs.js";
import { parseQuery, parseSchema } from "./parse.js";
import { generateSchema } from "./generate.js";
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

      const queryTokens = codes.queries.map((q) => parseQuery(q));
      const schemaTokens = parseSchema(codes.schame);

      const schemaContent = generateSchema(schemaTokens, config.pakage.name, config.remove_trailing_s);

      const schemaPath = path.resolve(workDir, config.pakage.path, "schema.go");
      writeSchema(schemaContent, schemaPath);
      console.log("✅ Wrote schema to "+schemaPath)
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  });

program.parse();
