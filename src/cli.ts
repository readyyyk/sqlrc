#!/usr/bin/env node

import { Command } from 'commander';
import path from 'path';
import fs from 'fs/promises';
import { ParsedFile } from './types';

// Import modules
import { parseFile } from './core/parser';
import { GoCodeGenerator } from './generators/go/generator';
import { PythonCodeGenerator } from './generators/python/generator';

/**
 * SQLRC-Gen - A CLI tool for generating type-safe database code from SQL files
 * with custom extensions for metadata and typed variables.
 */

const program = new Command();

program
  .name('sqlrc-gen')
  .description('Generate type-safe database code from SQL files with SQLRC extensions')
  .version('0.1.0');

program
  .requiredOption('-i, --input <path>', 'Path to SQL file or directory of SQL files')
  .requiredOption('-o, --output-dir <path>', 'Directory to save generated files')
  .requiredOption('-l, --lang <language>', 'Target language (go, python)')
  .option('-c, --config <path>', 'Path to config file for advanced settings');

program.parse(process.argv);

const options = program.opts();

/**
 * Main function to run the CLI
 */
async function main() {
  try {
    console.log('SQLRC-Gen starting...');
    
    // Validate input path
    const inputPath = path.resolve(options.input);
    const outputDir = path.resolve(options.outputDir);
    const language = options.lang.toLowerCase();
    
    // Validate language
    if (!['go', 'python'].includes(language)) {
      console.error(`Error: Unsupported language "${language}". Supported languages: go, python`);
      process.exit(1);
    }
    
    // Check if input path exists
    try {
      const stat = await fs.stat(inputPath);
      if (!stat.isFile() && !stat.isDirectory()) {
        console.error(`Error: Input path "${inputPath}" is neither a file nor a directory`);
        process.exit(1);
      }
    } catch (err) {
      console.error(`Error: Input path "${inputPath}" does not exist`);
      process.exit(1);
    }
    
    // Create output directory if it doesn't exist
    try {
      await fs.mkdir(outputDir, { recursive: true });
    } catch (err) {
      console.error(`Error: Failed to create output directory "${outputDir}"`);
      process.exit(1);
    }
    
    // Implement file discovery logic
    const sqlFiles: string[] = [];
    
    if ((await fs.stat(inputPath)).isFile()) {
      if (inputPath.endsWith('.sql')) {
        sqlFiles.push(inputPath);
      } else {
        console.error(`Error: Input file "${inputPath}" is not a SQL file`);
        process.exit(1);
      }
    } else {
      console.log(`Searching for SQL files in "${inputPath}"...`);
      const discoveredFiles = await findSqlFiles(inputPath);
      sqlFiles.push(...discoveredFiles);
    }
    
    console.log(`Found ${sqlFiles.length} SQL files to process`);
    
    // Process each SQL file
    for (const sqlFile of sqlFiles) {
      console.log(`Processing ${sqlFile}...`);
      const parsedFile: ParsedFile = await parseFile(sqlFile);
      
      // Generate code based on language
      if (language === 'go') {
        const generator = new GoCodeGenerator();
        await generator.generate(parsedFile, outputDir);
      } else if (language === 'python') {
        const generator = new PythonCodeGenerator();
        await generator.generate(parsedFile, outputDir);
      }
    }
    
    console.log('SQLRC-Gen completed successfully');
  } catch (error) {
    console.error('An unexpected error occurred:', error);
    process.exit(1);
  }
}

/**
 * Recursively find all SQL files in a directory
 * @param dirPath Directory path to search in
 * @returns Array of SQL file paths
 */
async function findSqlFiles(dirPath: string): Promise<string[]> {
  const sqlFiles: string[] = [];
  
  // Read directory contents
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  
  // Process each entry
  for (const entry of entries) {
    const entryPath = path.join(dirPath, entry.name);
    
    if (entry.isDirectory()) {
      // Recursively search subdirectories
      const subDirFiles = await findSqlFiles(entryPath);
      sqlFiles.push(...subDirFiles);
    } else if (entry.isFile() && entry.name.endsWith('.sql')) {
      // Add SQL files to the list
      sqlFiles.push(entryPath);
    }
  }
  
  return sqlFiles;
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
