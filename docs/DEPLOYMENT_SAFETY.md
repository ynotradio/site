# Production Deployment Safety Checklist

## CRITICAL: Before ANY deployment to ynotradio.net

This checklist ensures the production PHP site remains stable and can roll back instantly.

---

## Pre-Deployment Checks

### 1. Feature Flags Are Server-Managed

As of the `bin/deploy.sh` merge-instead-of-replace change, deploys
**preserve** whatever `USE_POSTGRES_*` values are currently in the
production `.env`. Your local `.env.php` flag values are ignored at
deploy time — only secrets and other config keys are pushed.

To inspect or change a flag, edit the production `.env` directly:

```bash
ssh ynotradio 'sudo cat /opt/bitnami/apache/htdocs/.env | grep USE_POSTGRES'

# To flip a flag:
ssh ynotradio 'sudo sed -i "s/^USE_POSTGRES_FOO=.*/USE_POSTGRES_FOO=true/" /opt/bitnami/apache/htdocs/.env'
```

A full pre-deploy backup is automatically saved to
`/opt/bitnami/apache/htdocs/.env.predeploy` on every deploy, so you
can roll back the env file with one command if a deploy goes wrong:

```bash
ssh ynotradio 'sudo cp /opt/bitnami/apache/htdocs/.env.predeploy /opt/bitnami/apache/htdocs/.env'
```

### 2. Check Database Connections

**Production PHP must connect to:**

- MySQL: `localhost`

```bash
ssh ynotradio 'cat ~/htdocs/.env | grep DB_HOST'
```

**Should be:** Production MySQL hostname (NOT `mysql` or `localhost`)

### 3. Verify No Payload/Next.js Files in PHP Directory

```bash
ssh ynotradio 'ls ~/htdocs/.env* 2>/dev/null'
```

**Should NOT exist:**

- `.env.local` (that's for Next.js, not PHP)
- Any Payload config files

---

## Deployment Steps

### 1. Create Git Tag

```bash
git tag -a deploy-$(date +%Y%m%d-%H%M) -m "Deployment $(date)"
git push --tags
```

### 2. Deploy Code

Today, this uses ./bin/deploy.sh

### 3. Immediate Post-Deploy Verification

**Within 30 seconds of deployment:**

```bash
# Test homepage loads
curl -I https://www.ynotradio.net/

# Test a data page (should show MySQL data)
curl -s https://www.ynotradio.net/concerts.php | grep -c "<tr>"

# Check for PHP errors
ssh ynotradio 'tail -20 /var/log/apache2/error.log'
```

### 4. Feature Flag Verification

**After every deployment, verify flags are still false:**

```bash
ssh ynotradio 'cat ~/htdocs/.env | grep USE_POSTGRES | grep true'
```

**Should return nothing** (no matches for "true")

---

## If Something Goes Wrong

### Immediate Rollback

**Option A: Toggle feature flags (if Postgres is the problem)**

```bash
ssh ynotradio 'cd ~/htdocs && sed -i "s/USE_POSTGRES_.*=true/&=false/g" .env'
```

**Option B: Revert to previous Git tag**

```bash
ssh ynotradio 'cd /var/www/html && git reset --hard <previous-tag>'
```

**Option C: Restore from backup**

```bash
# Restore last known good deployment
# (Your existing backup restoration process)
```

---

## Postgres Cutover Plan (FUTURE)

When ready to switch production from MySQL → Postgres:

1. **Final data sync** (during maintenance window)

   ```bash
   yarn import --from prod-mysql --to prod-neon
   ```

2. **Verify data parity**

   ```bash
   yarn verify-data --mysql prod --postgres prod
   ```

3. **Toggle ONE feature flag** (canary test)

   ```bash
   # On production server
   USE_POSTGRES_CONCERTS=true
   ```

4. **Monitor for 10 minutes**
   - Check error logs
   - Test concerts page
   - Verify data loads

5. **If successful, toggle remaining flags**
6. **If ANY issues, immediately toggle back to false**

---

## Current Status

**Production MySQL:** ✅ Active, primary data source
**Production Neon Postgres:** ⏸️ Receiving imports, NOT used by site
**Feature Flags:** ✅ All false (MySQL mode)
**Rollback Time:** ~30 seconds (toggle feature flags)

**SAFETY PRINCIPLE:** Production site ALWAYS on MySQL until explicit cutover decision.
