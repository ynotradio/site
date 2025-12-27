/**
 * Migration script for importing deejays from MySQL to Sanity
 *
 * MySQL Schema:
 *   deejays: id, name, show, email, external_connect_text, external_connect_url, pic, sort, deleted
 *
 * Usage:
 *   npm run import:deejays              # Import all
 *   npm run import:deejays -- --from-last  # Resume from last imported ID + 1
 *   npm run import:deejays -- --start-id=100  # Import with ID >= 100
 */

import * as readline from 'readline';
import { createClient } from '@sanity/client';
import { connectToDatabase, getActiveDeejays } from './database';
import { importDeejaysDirectly } from './sanityImport';
import { sanityConfig } from './config';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Command-line options
interface ImportOptions {
  fromLast?: boolean;
  startId?: number;
}

/**
 * Parse command-line arguments
 */
function parseArguments(): ImportOptions {
  const options: ImportOptions = {};
  const args = process.argv.slice(2);

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--from-last') {
      options.fromLast = true;
    } else if (arg === '--start-id' && i + 1 < args.length) {
      options.startId = parseInt(args[i + 1], 10);
      i++;
    }
  }

  return options;
}

async function importDeejays() {
  let connection;

  try {
    // Parse command-line arguments
    const options = parseArguments();

    console.log('Starting deejay import process...');

    // Check if Sanity token is provided and warn about permissions
    if (!sanityConfig.token) {
      console.error('Error: No Sanity API token provided. Please set the SANITY_API_TOKEN environment variable.');
      return;
    }
    console.log(`Using Sanity API token: ${sanityConfig.token.substring(0, 5)}...${sanityConfig.token.substring(sanityConfig.token.length - 5)}`);
    console.log('Note: The Sanity API token must have the following permissions:');
    console.log('  - "create" permission for documents');
    console.log('  - "create" permission for assets');
    console.log('If you encounter 403 Forbidden errors, please check your token permissions in the Sanity management console.');

    // Create Sanity client
    const client = createClient({
      projectId: sanityConfig.projectId,
      dataset: sanityConfig.dataset,
      token: sanityConfig.token,
      apiVersion: sanityConfig.apiVersion,
      useCdn: false,
    });

    // Handle --from-last flag
    if (options.fromLast) {
      console.log('Fetching last imported deejay ID...');
      // Deejays are stored as _type: 'person' with _id: 'deejay-{id}'
      // We need to query for person documents with IDs starting with 'deejay-'
      const query = '*[_type == \'person\' && _id match \'deejay-*\'] | order(_id desc) [0] { _id }';
      const result = await client.fetch<{ _id: string } | null>(query);
      if (result) {
        // Extract the ID from the _id field (format: 'deejay-{id}')
        const match = result._id.match(/^deejay-(\d+)$/);
        if (match) {
          const lastId = parseInt(match[1], 10);
          options.startId = lastId + 1;
          console.log(`Last imported ID: ${lastId}. Starting from ID: ${options.startId}`);
        } else {
          console.log('Could not parse last deejay ID. Starting from the beginning.');
        }
      } else {
        console.log('No deejay found in Sanity. Starting from the beginning.');
      }
    }

    // Log filters if any
    if (options.startId) {
      console.log('Import filters:');
      console.log(`  - Start ID: ${options.startId}`);
    }

    // Connect to the database
    connection = await connectToDatabase();

    // Get active deejays from the database
    const deejays = await getActiveDeejays(connection, options);

    // Import directly to Sanity
    const success = await importDeejaysDirectly(deejays);

    if (success) {
      console.log('Deejay import completed successfully!');
    } else {
      console.log('Deejay import encountered issues. Check the logs above for details.');
    }
  } catch (error) {
    console.error('Error during import process:', error);
  } finally {
    // Close the database connection
    if (connection) {
      await connection.end();
      console.log('Database connection closed.');
    }

    // Close readline interface
    rl.close();
  }
}

// Run the import process
importDeejays();

// Handle process exit
process.on('exit', () => {
  console.log('Import process complete.');
});
