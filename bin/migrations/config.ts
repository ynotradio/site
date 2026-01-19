import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

const envPaths = [
  path.resolve(process.cwd(), '.', 'bin', 'migrations', '.env'),
  path.resolve(process.cwd(), 'src', 'partials', '.env'),
];

// Use the first .env file that exists
for (const envPath of envPaths) {
  console.log(`Checking for environment file at: ${envPath}`);
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

// Migration settings
export const migrationConfig = {
  baseUrl: 'https://www.ynotradio.net/',
};
