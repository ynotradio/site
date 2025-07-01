import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Try to load environment variables from different possible .env locations
const envPaths = [
  path.resolve(__dirname, '..', '.env'),                // /migrations/.env
  path.resolve(process.cwd(), '.env'),                  // Current directory
  path.resolve(process.cwd(), '..', 'src', 'partials', '.env') // Project source
];

// Use the first .env file that exists
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    console.log(`Loading environment from: ${envPath}`);
    dotenv.config({ path: envPath });
    break;
  }
}

// Database configuration
export const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'ynot_site',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
};

// Sanity configuration - from VS Code settings.json if available
export const sanityConfig = {
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET,
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2023-03-01', // Use current date or a fixed recent version
};

// Migration settings
export const migrationConfig = {
  outputFile: path.resolve(__dirname, '..', 'person.ndjson'),
  baseUrl: 'https://www.ynotradio.net/',
};
