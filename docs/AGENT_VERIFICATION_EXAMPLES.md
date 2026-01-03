# Example: Using Agent Verification Tools

This document shows practical examples of how GitHub Copilot agents should use the verification tools when working on different types of changes.

## Example 1: Adding a New Payload Collection

**Scenario:** You're adding a new `Albums` collection to Payload.

### Steps:

1. **Make your changes** to the collection files
   ```bash
   # Edit payload/src/collections/Albums.ts
   # Update payload.config.ts to import and register the collection
   ```

2. **Generate TypeScript types**
   ```bash
   npm run payload:generate-types
   ```

3. **Create and run migrations**
   ```bash
   npm run payload:migrate:create
   npm run payload:migrate
   ```

4. **Verify Payload works**
   ```bash
   npm run verify:payload
   ```

5. **Check the collection in the admin UI**
   - Navigate to http://localhost:3000/admin
   - Verify the Albums collection appears
   - Try creating a test album record

6. **Test via API**
   ```bash
   # Test API endpoint
   curl http://localhost:3000/api/albums
   ```

7. **Run tests and linting**
   ```bash
   npm run lint
   npm test
   ```

### What to include in your PR:
- Screenshot of the admin UI showing the new collection
- Note that `verify:payload` passed
- Any test output showing successful creation of records

---

## Example 2: Creating a Migration Script

**Scenario:** You're creating a script to import DJ data from MySQL to Payload.

### Steps:

1. **Create your migration script**
   ```bash
   # Create bin/migrations/importDJs.ts
   ```

2. **Write tests for your migration**
   ```bash
   # Create bin/migrations/importDJs.test.ts
   ```

3. **Verify both systems are running**
   ```bash
   # Terminal 1: Start legacy site
   npm run verify:legacy
   
   # Terminal 2: Start Payload
   npm run verify:payload
   ```

4. **Run your migration script**
   ```bash
   npx tsx bin/migrations/importDJs.ts
   ```

5. **Verify the data in Payload**
   ```bash
   # Check via API
   curl http://localhost:3000/api/djs
   
   # Or check in Admin UI
   # http://localhost:3000/admin/collections/djs
   ```

6. **Compare with source data**
   ```bash
   # Query source MySQL database
   docker-compose exec mysql mysql -u ynot_sql_user -pynot_sql_pass ynot_site \
     -e "SELECT COUNT(*) FROM djs;"
   
   # Compare with Payload count
   curl http://localhost:3000/api/djs | grep totalDocs
   ```

7. **Run your tests**
   ```bash
   npm test -- importDJs.test.ts
   ```

### What to include in your PR:
- Summary of records migrated (e.g., "Migrated 45 DJs from MySQL to Payload")
- Note any data transformations or mappings applied
- Test results showing migration works correctly
- Note that both `verify:payload` and `verify:legacy` passed

---

## Example 3: Adding PHP/PostgreSQL Integration

**Scenario:** You're adding PHP code to query Payload's PostgreSQL database.

### Steps:

1. **Add your PHP code**
   ```bash
   # Create src/includes/payload-concerts.php
   ```

2. **Create a test script**
   ```bash
   # Create test/test_payload_concerts.php
   ```

3. **Start both systems**
   ```bash
   npm run verify:legacy   # Starts Docker containers
   npm run verify:payload  # Starts Payload (for reference data)
   ```

4. **Test your PHP code**
   ```bash
   docker-compose exec phpfpm php /app/test/test_payload_concerts.php
   ```

5. **Verify the query results**
   - Check that data is retrieved correctly
   - Compare with direct PostgreSQL query if needed
   - Verify performance is acceptable

6. **Test in the browser**
   - Navigate to http://localhost:8080/your-page.php
   - Verify the page renders correctly
   - Check browser console for errors

7. **Check for SQL injection vulnerabilities**
   - Review your code for proper parameterized queries
   - Test with edge cases (e.g., names with apostrophes)

### What to include in your PR:
- Screenshot of the page working in the browser
- Sample query output from your test script
- Note that `verify:legacy` passed
- Security review notes (parameterized queries, input validation, etc.)

---

## Example 4: Updating Frontend Components

**Scenario:** You're updating a Next.js component to display data from Payload.

### Steps:

1. **Make your changes**
   ```bash
   # Edit src/components/YourComponent.tsx
   ```

2. **Start Payload for API access**
   ```bash
   npm run verify:payload
   ```

3. **Start Next.js dev server**
   ```bash
   npm run dev
   ```

4. **Test in the browser**
   - Navigate to http://localhost:3000/your-route
   - Verify component renders correctly
   - Check browser console for errors
   - Test user interactions

5. **Take screenshots**
   ```bash
   # Use your browser's screenshot tool or
   # playwright-browser_take_screenshot tool
   ```

6. **Run linting and tests**
   ```bash
   npm run lint
   npm test
   ```

### What to include in your PR:
- Screenshots of the component in action
- Note that `verify:payload` passed
- Description of any API calls being made
- Test results

---

## Example 5: Fixing a Bug

**Scenario:** You're fixing a bug in an existing Payload collection field.

### Steps:

1. **Understand the bug**
   - Review the issue description
   - Check existing code and data

2. **Make your fix**
   ```bash
   # Edit the collection file
   ```

3. **Test with both systems**
   ```bash
   npm run verify:payload
   ```

4. **Create a migration if needed**
   ```bash
   # If schema changed
   npm run payload:migrate:create
   npm run payload:migrate
   ```

5. **Test the fix**
   - Via Admin UI: http://localhost:3000/admin
   - Via API: `curl http://localhost:3000/api/[collection]`
   - Via any affected frontend pages

6. **Verify no regressions**
   ```bash
   npm test
   npm run lint
   ```

### What to include in your PR:
- Description of the bug and the fix
- Steps to reproduce the original bug
- Evidence the fix works (screenshots, API output, etc.)
- Note that tests pass

---

## Common Patterns

### Before Starting Any Work

```bash
# Pull latest changes
git pull origin main

# Verify your environment is working
npm run verify:payload    # If working on Payload
npm run verify:legacy     # If working on legacy site
npm run verify:all        # If working on both
```

### Before Submitting a PR

```bash
# Run all checks
npm run lint              # Check code style
npm test                  # Run test suite
npm run verify:payload    # Verify Payload works (if applicable)
npm run verify:legacy     # Verify legacy site works (if applicable)

# Generate types if working with Payload
npm run payload:generate-types

# Take screenshots of any UI changes
# Document your changes
```

### When Verification Fails

1. **Check the error messages carefully**
2. **Review the troubleshooting guide**: [docs/AGENT_VERIFICATION.md](../docs/AGENT_VERIFICATION.md#troubleshooting)
3. **Check logs**:
   - Payload: `.agent-tmp/payload-server.log`
   - Docker: `docker-compose logs [service]`
4. **Document the issue in your PR** if you can't resolve it
5. **Tag maintainers for help** if needed

---

## Tips for Agents

✅ **DO:**
- Run verification scripts before submitting PRs
- Include verification results in PR descriptions
- Take screenshots of UI changes
- Document any warnings or non-critical failures
- Test both the happy path and edge cases

❌ **DON'T:**
- Submit PRs without running verification
- Ignore failed health checks
- Skip testing with real data
- Assume changes work without verification
- Remove verification steps to save time

---

## Quick Reference

```bash
# Verify Payload CMS
npm run verify:payload
./bin/agent-helpers/verify-payload.sh

# Verify Legacy Site
npm run verify:legacy
./bin/agent-helpers/verify-legacy.sh

# Verify Both
npm run verify:all

# Payload Health Check
npx tsx bin/agent-helpers/health-check-payload.ts

# Start Payload Server
npm run payload:dev

# Start Legacy Site
docker-compose up -d

# Stop Legacy Site
docker-compose down

# View Logs
tail -f .agent-tmp/payload-server.log           # Payload
docker-compose logs -f [service]          # Docker service

# Run Migrations
npm run payload:migrate

# Generate Types
npm run payload:generate-types

# Run Tests
npm test

# Run Linting
npm run lint
```

---

For more details, see the comprehensive [Agent Verification Guide](../docs/AGENT_VERIFICATION.md).
