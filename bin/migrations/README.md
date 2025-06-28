# Sanity CMS Migration Tools

This directory contains TypeScript scripts for migrating data from the legacy MySQL database to Sanity CMS.

## Available Scripts

### Deejay Migration

The script in `src/importDeejays.ts` migrates deejay data from the MySQL database to Sanity CMS as "person" documents.

## Usage

From the project root:

```bash
# Run the deejay import (uses tsx to run TypeScript directly)
npm run import:deejays
```

No build step is required as we're using tsx to run TypeScript files directly.

## Configuration

Create a `.env` file in this directory with:

```
# Database Configuration
DB_NAME=ynot_site
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=localhost

# Sanity Configuration
SANITY_PROJECT_ID=your_project_id
SANITY_DATASET=production
SANITY_API_TOKEN=your_sanity_token
```

### Sanity API Token Permissions

The Sanity API token must have the following permissions:

- **create** permission for documents
- **create** permission for assets

To create a new token with these permissions:

1. Go to [manage.sanity.io](https://manage.sanity.io)
2. Select your project
3. Go to API > Tokens
4. Click "Add API token"
5. Give it a name (e.g., "Import Token")
6. Set permissions to include:
   - Editor (gives read/write access to documents)
   - Asset write (allows uploading images)
7. Copy the token and add it to your `.env` file

Without these permissions, you'll see "403 Forbidden" errors with the message "Insufficient permissions; permission create required".

The script will also check:
- The project's `src/partials/.env` 
- Default values from VSCode settings.json

## Source Code Organization

- `src/config.ts` - Environment and configuration setup
- `src/database.ts` - MySQL database connections and queries
- `src/transform.ts` - Data transformation from MySQL to Sanity format
- `src/sanityImport.ts` - Sanity CMS direct import via client API
- `src/importDeejays.ts` - Main script for deejay migration
