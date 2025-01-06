// @ts-check
import { Command } from "commander";
import { getCodes } from "./fs.js";
import { parseQuery, parseSchema } from "./parse.js";
const program = new Command();

program
  .name("sqlrc")
  .description("CLI tool that uses SQL to create GOlang structs and queries")
  .requiredOption("--cfg <string>", "Path to config")
  .action((options) => {
    try {
      const codes = getCodes(process.cwd(), options.cfg);

      const x = codes.queries.map((q) => parseQuery(q));
      const x1 = parseSchema(codes.schame);

      console.log(x);
      console.log(x1);
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  });

program.parse();
