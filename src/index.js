import { Command } from 'commander';
const program = new Command();

program
  .name('sqlrc')
  .description('CLI tool that uses SQL to create GOlang structs and queries')
  .requiredOption('--dir <string>', "Path to config")
  .action((options) => {
    try {
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  });

program.parse();

