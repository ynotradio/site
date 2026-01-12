#!/usr/bin/env tsx
/**
 * Copy one Neon PostgreSQL database to another
 * 
 * This script performs a complete database copy using pg_dump and pg_restore.
 * It's designed to work with Neon databases but will work with any PostgreSQL database.
 * 
 * Usage:
 *   tsx bin/copy-neon-db.ts <source> <target>
 * 
 * Where <source> and <target> are one of:
 *   - dev: Development database (NEON_DEV_DATABASE_URL or DATABASE_URI)
 *   - prod: Production database (NEON_PROD_DATABASE_URL)
 * 
 * Examples:
 *   tsx bin/copy-neon-db.ts dev prod    # Copy development to production
 *   tsx bin/copy-neon-db.ts prod dev    # Copy production to development
 * 
 * Environment Variables Required:
 *   - NEON_DEV_DATABASE_URL or DATABASE_URI (for dev database)
 *   - NEON_PROD_DATABASE_URL (for prod database)
 */

import dotenv from 'dotenv';
import path from 'path';
import { execSync } from 'child_process';
import readline from 'readline';
import pg from 'pg';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const { Client } = pg;

type DatabaseEnv = 'dev' | 'prod';

interface DatabaseConfig {
  url: string;
  name: string;
}

/**
 * Get database configuration for the specified environment
 */
function getDatabaseConfig(env: DatabaseEnv): DatabaseConfig {
  let url: string | undefined;
  let name: string;

  if (env === 'dev') {
    url = process.env.NEON_DEV_DATABASE_URL || process.env.DATABASE_URI;
    name = 'Development';
  } else {
    url = process.env.NEON_PROD_DATABASE_URL;
    name = 'Production';
  }

  if (!url) {
    throw new Error(
      `Database URL not found for ${name}. ` +
      `Please set ${env === 'dev' ? 'NEON_DEV_DATABASE_URL or DATABASE_URI' : 'NEON_PROD_DATABASE_URL'} in .env.local`
    );
  }

  return { url, name };
}

/**
 * Ask user for confirmation
 */
function askConfirmation(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

/**
 * Get count of tables in the database
 */
async function getTableCount(connectionString: string): Promise<number> {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: true },
  });

  try {
    await client.connect();
    const result = await client.query(`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
    `);
    return parseInt(result.rows[0].count, 10);
  } finally {
    await client.end();
  }
}

/**
 * Get list of tables in the database
 */
async function getTableList(connectionString: string): Promise<string[]> {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: true },
  });

  try {
    await client.connect();
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    return result.rows.map(row => row.table_name);
  } finally {
    await client.end();
  }
}

/**
 * Drop all tables in the target database
 */
async function dropAllTables(connectionString: string): Promise<void> {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: true },
  });

  try {
    await client.connect();
    console.log('  🗑️  Dropping existing schema...');
    
    // Drop all tables by dropping and recreating the public schema
    await client.query('DROP SCHEMA public CASCADE');
    await client.query('CREATE SCHEMA public');
    
    // Grant permissions (Neon-specific)
    await client.query('GRANT ALL ON SCHEMA public TO neondb_owner');
    await client.query('GRANT ALL ON SCHEMA public TO public');
    
    console.log('  ✅ Schema dropped and recreated');
  } finally {
    await client.end();
  }
}

/**
 * Sanitize connection string for pg_dump/psql compatibility
 * Removes channel_binding parameter which may not be supported by all clients
 */
function sanitizeConnectionString(connectionString: string): string {
  try {
    const url = new URL(connectionString);
    const params = new URLSearchParams(url.search);
    
    // Remove channel_binding if present
    if (params.has('channel_binding')) {
      params.delete('channel_binding');
      url.search = params.toString();
      return url.toString();
    }
    
    return connectionString;
  } catch {
    // If URL parsing fails, return original string
    return connectionString;
  }
}

/**
 * Find PostgreSQL tools in common locations
 */
function findPgTools(): { pgDump: string; psql: string } | null {
  const commonPaths = [
    '', // Check PATH first
    '/opt/homebrew/opt/postgresql@17/bin/',
    '/opt/homebrew/opt/postgresql@16/bin/',
    '/opt/homebrew/opt/postgresql@15/bin/',
    '/opt/homebrew/opt/postgresql/bin/',
    '/usr/local/opt/postgresql@17/bin/',
    '/usr/local/opt/postgresql@16/bin/',
    '/usr/local/opt/postgresql/bin/',
    '/usr/local/bin/',
    '/usr/bin/',
  ];

  for (const path of commonPaths) {
    try {
      const pgDump = `${path}pg_dump`;
      const psql = `${path}psql`;
      
      execSync(`${pgDump} --version`, { stdio: 'pipe' });
      execSync(`${psql} --version`, { stdio: 'pipe' });
      
      return { pgDump, psql };
    } catch {
      continue;
    }
  }

  return null;
}

/**
 * Check if required PostgreSQL tools are available
 */
function checkPgTools(): { pgDump: string; psql: string } {
  const tools = findPgTools();
  
  if (!tools) {
    throw new Error(
      'PostgreSQL client tools (pg_dump, psql) are not found.\n' +
      'Please install them first:\n' +
      '  macOS: brew install postgresql@17 && brew link postgresql@17\n' +
      '  Ubuntu/Debian: sudo apt-get install postgresql-client\n' +
      '  Windows: Download from https://www.postgresql.org/download/windows/\n\n' +
      'If already installed via Homebrew, try linking:\n' +
      '  brew link postgresql@17 --force'
    );
  }

  return tools;
}

/**
 * Create a database dump using pg_dump
 */
function createDump(connectionString: string, dumpFile: string, pgDumpPath: string): void {
  console.log('  📦 Creating database dump...');
  
  try {
    const sanitizedUrl = sanitizeConnectionString(connectionString);
    
    // Use pg_dump to create a dump file
    // --no-owner: Skip ownership commands
    // --no-acl: Skip access privileges
    // --clean: Add DROP statements before CREATE
    // --if-exists: Use IF EXISTS with DROP statements
    execSync(
      `"${pgDumpPath}" "${sanitizedUrl}" ` +
      `--no-owner --no-acl --clean --if-exists ` +
      `--file="${dumpFile}"`,
      { stdio: 'inherit' }
    );
    
    console.log('  ✅ Dump created successfully');
  } catch (error: any) {
    throw new Error(`Failed to create dump: ${error.message}`);
  }
}

/**
 * Restore a database dump using psql
 */
function restoreDump(connectionString: string, dumpFile: string, psqlPath: string): void {
  console.log('  📥 Restoring database dump...');
  
  try {
    const sanitizedUrl = sanitizeConnectionString(connectionString);
    
    // Use psql to restore the dump
    // --quiet: Suppress non-error output
    // --no-psqlrc: Don't read startup file
    execSync(
      `"${psqlPath}" "${sanitizedUrl}" ` +
      `--quiet --no-psqlrc ` +
      `--file="${dumpFile}"`,
      { stdio: 'inherit' }
    );
    
    console.log('  ✅ Dump restored successfully');
  } catch (error: any) {
    throw new Error(`Failed to restore dump: ${error.message}`);
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🔄 Neon Database Copy Tool\n');

  // Parse command line arguments
  const args = process.argv.slice(2);
  
  if (args.length !== 2) {
    console.error('Usage: tsx bin/copy-neon-db.ts <source> <target>');
    console.error('  source/target: dev or prod');
    console.error('\nExamples:');
    console.error('  tsx bin/copy-neon-db.ts dev prod    # Copy dev → prod');
    console.error('  tsx bin/copy-neon-db.ts prod dev    # Copy prod → dev');
    process.exit(1);
  }

  const sourceEnv = args[0].toLowerCase() as DatabaseEnv;
  const targetEnv = args[1].toLowerCase() as DatabaseEnv;

  // Validate arguments
  if (!['dev', 'prod'].includes(sourceEnv) || !['dev', 'prod'].includes(targetEnv)) {
    console.error('❌ Error: source and target must be either "dev" or "prod"');
    process.exit(1);
  }

  if (sourceEnv === targetEnv) {
    console.error('❌ Error: source and target cannot be the same');
    process.exit(1);
  }

  try {
    // Check if PostgreSQL tools are available
    const pgTools = checkPgTools();
    console.log(`🔧 Using pg_dump: ${pgTools.pgDump}`);
    console.log(`🔧 Using psql: ${pgTools.psql}\n`);
    
    // Get database configurations
    const sourceConfig = getDatabaseConfig(sourceEnv);
    const targetConfig = getDatabaseConfig(targetEnv);

    console.log(`📊 Source: ${sourceConfig.name} Database`);
    console.log(`📊 Target: ${targetConfig.name} Database\n`);

    // Get table counts
    console.log('🔍 Analyzing databases...');
    const sourceTableCount = await getTableCount(sourceConfig.url);
    const targetTableCount = await getTableCount(targetConfig.url);
    
    console.log(`  Source has ${sourceTableCount} tables`);
    console.log(`  Target has ${targetTableCount} tables\n`);

    if (sourceTableCount === 0) {
      console.error('❌ Error: Source database is empty. Nothing to copy.');
      process.exit(1);
    }

    // Get list of tables from source
    const sourceTables = await getTableList(sourceConfig.url);
    console.log(`📋 Source tables: ${sourceTables.join(', ')}\n`);

    // Show warning and ask for confirmation
    console.log('⚠️  WARNING: This will completely replace the target database!');
    console.log(`⚠️  All data in ${targetConfig.name} will be DELETED and replaced with data from ${sourceConfig.name}.`);
    console.log('\n🚨 THIS ACTION CANNOT BE UNDONE!\n');

    const confirmed = await askConfirmation('Are you sure you want to continue? (yes/no): ');
    
    if (!confirmed) {
      console.log('\n❌ Operation cancelled by user.');
      process.exit(0);
    }

    console.log('\n🚀 Starting database copy...\n');

    // Create temporary dump file
    const dumpFile = `/tmp/neon-db-dump-${Date.now()}.sql`;

    try {
      // Step 1: Create dump from source
      console.log('Step 1/3: Creating dump from source database');
      createDump(sourceConfig.url, dumpFile, pgTools.pgDump);

      // Step 2: Drop all tables in target
      console.log('\nStep 2/3: Clearing target database');
      await dropAllTables(targetConfig.url);

      // Step 3: Restore dump to target
      console.log('\nStep 3/3: Restoring dump to target database');
      restoreDump(targetConfig.url, dumpFile, pgTools.psql);

      console.log('\n✅ Database copy completed successfully!');

      // Verify target
      console.log('\n🔍 Verifying target database...');
      const newTargetTableCount = await getTableCount(targetConfig.url);
      console.log(`  Target now has ${newTargetTableCount} tables`);

      if (newTargetTableCount !== sourceTableCount) {
        console.warn(`⚠️  Warning: Table count mismatch (expected ${sourceTableCount}, got ${newTargetTableCount})`);
      } else {
        console.log('  ✅ Table count matches source');
      }

    } finally {
      // Clean up temporary dump file
      try {
        execSync(`rm -f "${dumpFile}"`);
        console.log('\n🧹 Cleaned up temporary files');
      } catch (error) {
        console.warn('\n⚠️  Warning: Failed to clean up temporary dump file');
      }
    }

    console.log('\n✨ Done!');

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the main function
main();
