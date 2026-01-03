# Local Setup Guide for Agent Development Environments

This guide provides step-by-step instructions for setting up the Payload CMS and legacy PHP/MySQL site on your local workstation using the agent helper scripts.

## Prerequisites

Before starting, ensure you have:

- **Node.js 22+** - [Download from nodejs.org](https://nodejs.org/)
- **Docker Desktop** - [Download from docker.com](https://www.docker.com/products/docker-desktop/)
- **Git** - [Download from git-scm.com](https://git-scm.com/)
- **A code editor** - VS Code, Cursor, or your preferred editor
- **Terminal/Command Line access**

## Quick Start

```bash
# Clone the repository
git clone https://github.com/ynotradio/site.git
cd site

# For Payload CMS
npm run verify:payload

# For Legacy PHP/MySQL site
npm run verify:legacy
```

## Part 1: Setting Up Payload CMS

### Step 1: Clone the Repository

```bash
git clone https://github.com/ynotradio/site.git
cd site
```

### Step 2: Create Environment Configuration

```bash
# Copy the example environment file
cp .env.example .env.local
```

### Step 3: Configure Database Connection

Open `.env.local` in your editor and update these values:

**Option A: Using Neon (Recommended for testing)**
1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a new project
3. Copy the connection string
4. Update `.env.local`:
```bash
DATABASE_URI=postgresql://user:password@ep-cool-name.us-east-2.aws.neon.tech/neondb
PAYLOAD_SECRET=your-random-secret-here
```

**Option B: Using Local PostgreSQL**
```bash
# Install PostgreSQL locally first
# macOS: brew install postgresql
# Ubuntu: sudo apt-get install postgresql
# Windows: Download from postgresql.org

# Then update .env.local:
DATABASE_URI=postgresql://localhost:5432/ynot_payload_dev
PAYLOAD_SECRET=your-random-secret-here
```

**Generate a secure secret:**
```bash
# On macOS/Linux:
openssl rand -hex 32

# On Windows (PowerShell):
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

### Step 4: Run the Verification Script

```bash
npm run verify:payload
```

The script will:
1. ✅ Check your `.env.local` configuration
2. ✅ Install dependencies (this may take a few minutes)
3. ✅ Run database migrations
4. ✅ Start the Payload server
5. ✅ Ask if you want to seed sample data (optional)
6. ✅ Provide access URLs

### Step 5: Access Payload CMS

Once the script completes:

1. **Open your browser** to http://localhost:3000/admin
2. **Create your admin account:**
   - Enter email address
   - Create a password
   - Click "Create Account"
3. **Explore the Admin UI:**
   - Browse collections (People, DJs, Artists, Venues, etc.)
   - Create test records
   - Upload media files
   - Test your changes

### Step 6: Use the API

**REST API:**
```bash
# Get all DJs
curl http://localhost:3000/api/djs

# Get all venues
curl http://localhost:3000/api/venues
```

**GraphQL Playground:**
- Navigate to http://localhost:3000/api/graphql
- Try queries like:
```graphql
query {
  DJs {
    docs {
      id
      name
    }
  }
}
```

### Step 7: Stop the Server

When finished testing:
```bash
# Find the process ID from the script output
kill <PID>

# Or use Ctrl+C if the script is still running
```

---

## Part 2: Setting Up Legacy PHP/MySQL Site

### Step 1: Ensure Docker is Running

**macOS/Windows:**
- Open Docker Desktop application
- Wait for it to show "Docker is running"

**Linux:**
```bash
sudo systemctl start docker
```

### Step 2: Run the Verification Script

```bash
npm run verify:legacy
```

The script will:
1. ✅ Check Docker is running
2. ✅ Start MySQL, PHP-FPM, Apache, and PHPMyAdmin containers
3. ✅ Wait for services to be ready
4. ✅ Provide access URLs and credentials

### Step 3: Access the Legacy Site

**Main Site:**
- Open http://localhost:8080 in your browser
- Browse pages and test functionality

**PHPMyAdmin (Database Management):**
- Open http://localhost:8181 in your browser
- Login with:
  - Server: `mysql`
  - Username: `ynot_sql_user`
  - Password: `ynot_sql_pass`
  - Database: `ynot_site`

### Step 4: Import Database (If Needed)

If you have a database dump:

```bash
# Place your SQL file in src/db/docker/ynot_db.sql
# Then run:
./bin/import_db.sh
```

### Step 5: Stop the Containers

When finished testing:
```bash
docker compose down
```

---

## Part 3: Running Both Systems Together

For migration work, you often need both systems running:

**Terminal 1 - Payload:**
```bash
npm run verify:payload
```

**Terminal 2 - Legacy Site:**
```bash
npm run verify:legacy
```

Now you can:
- Compare functionality between old and new
- Test data migration scripts
- Verify PHP can query PostgreSQL (for gradual migration)

---

## Part 4: Testing Your Changes

### For Payload Collection Changes

1. **Make your code changes** to collection files in `payload/src/collections/`
2. **Generate TypeScript types:**
   ```bash
   npm run payload:generate-types
   ```
3. **Run migrations:**
   ```bash
   npm run payload:migrate
   ```
4. **Restart Payload** (kill and re-run `npm run verify:payload`)
5. **Test in Admin UI:**
   - Navigate to http://localhost:3000/admin
   - Find your collection in the sidebar
   - Try creating/editing records
   - Verify fields work as expected

### For Migration Scripts

1. **Create your migration script** in `bin/migrations/`
2. **Start both systems:**
   ```bash
   # Terminal 1:
   npm run verify:legacy
   
   # Terminal 2:
   npm run verify:payload
   ```
3. **Run your migration:**
   ```bash
   npx tsx bin/migrations/your-script.ts
   ```
4. **Verify results:**
   - Check Payload Admin UI for imported data
   - Use PHPMyAdmin to verify source data
   - Compare counts and field mappings

### For PHP Changes

1. **Make your PHP changes** in `src/`
2. **Restart containers:**
   ```bash
   docker compose restart phpfpm apache
   ```
3. **Test in browser:**
   - Navigate to http://localhost:8080
   - Test the page/functionality you changed
4. **Check logs if needed:**
   ```bash
   docker compose logs -f phpfpm
   docker compose logs -f apache
   ```

---

## Part 5: Common Issues & Solutions

### Issue: "Port already in use"

**Payload (port 3000):**
```bash
# Find what's using the port
lsof -ti:3000 | xargs kill -9

# Or change the port in .env.local
PORT=3001
```

**Legacy site (ports 8080, 8181):**
```bash
# Stop existing containers
docker compose down

# Or change ports in docker-compose.yml
```

### Issue: "Cannot connect to database"

**For Payload:**
1. Verify your `DATABASE_URI` in `.env.local`
2. Check if PostgreSQL is running (if local)
3. Test connection:
   ```bash
   psql "postgresql://your-connection-string"
   ```

**For Legacy:**
1. Wait 30-60 seconds for MySQL to initialize
2. Check MySQL logs:
   ```bash
   docker compose logs mysql
   ```

### Issue: "EBADENGINE Unsupported engine"

Your Node version is too old. Verify version:
```bash
node -v  # Should show v22.x.x or higher
```

Update Node:
- **macOS:** `brew upgrade node`
- **Windows:** Download from nodejs.org
- **Linux:** Use nvm: `nvm install 22`

### Issue: "Docker is not running"

**macOS/Windows:**
- Open Docker Desktop application
- Wait for it to fully start

**Linux:**
```bash
sudo systemctl start docker
sudo systemctl enable docker  # Start on boot
```

---

## Part 6: Useful Commands

### Payload Commands

```bash
# Start Payload manually
npm run payload:dev

# Generate TypeScript types
npm run payload:generate-types

# Run migrations
npm run payload:migrate

# Create new migration
npm run payload:migrate:create

# Check migration status
npm run payload:migrate:status

# Seed sample data
npm run payload:seed
```

### Docker Commands

```bash
# View running containers
docker compose ps

# View logs
docker compose logs -f [service]

# Restart a service
docker compose restart [service]

# Stop all containers
docker compose down

# Stop and remove volumes (⚠️  deletes data!)
docker compose down -v

# Execute MySQL commands
docker compose exec mysql mysql -u root -proot ynot_site
```

### Testing Commands

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix
```

---

## Part 7: Workflow Examples

### Example 1: Adding a New Collection

```bash
# 1. Create collection file
# Edit: payload/src/collections/Albums.ts

# 2. Register in payload.config.ts
# Add: import { Albums } from './payload/src/collections/Albums'
# Add to collections array

# 3. Generate types and migrate
npm run payload:generate-types
npm run payload:migrate

# 4. Test with verification script
npm run verify:payload

# 5. Open browser to http://localhost:3000/admin
# 6. Find "Albums" in sidebar
# 7. Create a test album
```

### Example 2: Testing a Migration Script

```bash
# 1. Start both systems
# Terminal 1:
npm run verify:legacy

# Terminal 2:
npm run verify:payload

# 2. Run your migration
# Terminal 3:
npx tsx bin/migrations/importAlbums.ts

# 3. Verify in Payload Admin UI
# Browse to http://localhost:3000/admin/collections/albums

# 4. Check counts match
# Source: http://localhost:8181 (PHPMyAdmin)
# Destination: http://localhost:3000/admin
```

### Example 3: Fixing a Bug

```bash
# 1. Make your fix
# Edit the relevant file

# 2. Start the appropriate system
npm run verify:payload   # For Payload changes
# or
npm run verify:legacy    # For PHP changes

# 3. Test the fix in browser
# Reproduce the original bug
# Verify it's now fixed

# 4. Run tests
npm test
npm run lint
```

---

## Part 8: Next Steps

After successful setup:

1. **Read the migration documentation:**
   - `docs/payload-migration/README.md` - Overview
   - `docs/payload-migration/04-migration-tasks.md` - Task list

2. **Review the agent guides:**
   - `docs/AGENT_QUICK_START.md` - Checklist for tasks
   - `docs/AGENT_VERIFICATION.md` - Detailed procedures
   - `docs/AGENT_VERIFICATION_EXAMPLES.md` - Real examples

3. **Explore the codebase:**
   - `payload/src/collections/` - Collection definitions
   - `bin/migrations/` - Migration scripts
   - `src/` - Legacy PHP code

4. **Start contributing:**
   - Pick a task from the migration plan
   - Make your changes
   - Test with these verification scripts
   - Submit a PR

---

## Getting Help

If you encounter issues:

1. **Check the troubleshooting sections** in this guide
2. **Review logs:**
   - Payload: `.agent-tmp/payload-server.log`
   - Docker: `docker compose logs [service]`
3. **Search existing issues** on GitHub
4. **Open a new issue** with:
   - What you tried to do
   - Error messages
   - Your environment (OS, Node version, Docker version)

---

## Summary

You now have working local development environments for:
- ✅ Payload CMS at http://localhost:3000/admin
- ✅ Legacy PHP site at http://localhost:8080
- ✅ PHPMyAdmin at http://localhost:8181

Use these to:
- Test your changes like an end user
- Verify migrations work correctly
- Ensure backward compatibility
- Build confidence before submitting PRs

Happy coding! 🚀
