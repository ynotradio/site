import { createClient } from '@sanity/client';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import { SanityImportData } from './transform';
import { sanityConfig } from './config';

const execAsync = promisify(exec);

// Create Sanity client
export const sanityClient = createClient({
  projectId: sanityConfig.projectId,
  dataset: sanityConfig.dataset,
  token: sanityConfig.token,
  apiVersion: sanityConfig.apiVersion,
  useCdn: false, // We need fresh data for content management
});

// Check for existing documents
export async function checkForExistingDocuments(): Promise<number> {
  try {
    const query = "*[_type == 'person']";
    const result = await sanityClient.fetch(query);

    if (Array.isArray(result) && result.length > 0) {
      console.log(`Found ${result.length} existing person documents in Sanity.`);
      return result.length;
    }

    console.log('No existing person documents found in Sanity.');
    return 0;
  } catch (error) {
    console.error('Failed to check for existing documents:', error);
    return -1; // Error indicator
  }
}

// Save data to JSON file
export async function saveToJsonFile(data: SanityImportData, outputPath: string): Promise<void> {
  try {
    // Convert to NDJSON format (one JSON object per line)
    const ndjsonContent = data.imports.map((doc) => JSON.stringify(doc)).join('\n');

    await fs.writeFile(
      outputPath,
      ndjsonContent,
      'utf8',
    );
    console.log(`Successfully wrote person.ndjson file to ${outputPath}`);
  } catch (error) {
    console.error('Failed to write JSON file:', error);
    throw error;
  }
}

// Delete existing person documents
export async function deleteExistingPersonDocuments(dataset: string): Promise<boolean> {
  try {
    const cleanFilePath = 'clean.ndjson';

    // Export all documents except persons
    console.log('Exporting non-person documents...');
    await execAsync(`npx sanity dataset export "*[_type != 'person']" ${cleanFilePath} --dataset ${dataset}`);

    // Import back only the non-person documents
    console.log('Importing non-person documents...');
    await execAsync(`npx sanity dataset import ${cleanFilePath} ${dataset} --replace`);

    // Clean up
    await fs.unlink(cleanFilePath);
    console.log('Deleted existing person documents successfully.');
    return true;
  } catch (error) {
    console.error('Failed to delete existing person documents:', error);
    return false;
  }
}

// Import data to Sanity
export async function importToSanity(jsonFilePath: string, dataset: string): Promise<boolean> {
  try {
    console.log(`Importing data into Sanity from ${jsonFilePath}...`);
    const command = `npx sanity dataset import ${jsonFilePath} ${dataset}`;
    console.log(`Running: ${command}`);

    const { stdout, stderr } = await execAsync(command);

    if (stderr && !stderr.includes('Completed')) {
      console.error('Import stderr:', stderr);
      return false;
    }

    console.log('Import stdout:', stdout);
    console.log('Import completed successfully!');
    return true;
  } catch (error) {
    console.error('Import failed:', error);
    return false;
  }
}
