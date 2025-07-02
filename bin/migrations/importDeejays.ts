import * as readline from 'readline';
import { connectToDatabase, getActiveDeejays } from './database';
import { importDeejaysDirectly } from './sanityImport';
import { sanityConfig } from './config';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function importDeejays() {
  let connection;

  try {
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

    // Connect to the database
    connection = await connectToDatabase();

    // Get active deejays from the database
    const deejays = await getActiveDeejays(connection);

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
