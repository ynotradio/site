# Agent Helper Scripts

Utilities for GitHub Copilot agents working on Y-Not Radio site.

## Environment Detection

Use `detect-environment.sh` to adapt scripts to different environments:

```bash
# Source the utility
source bin/agent-helpers/detect-environment.sh

# Print environment info
print_environment

# Check environment
if detect_ci; then
  echo "Running in CI/CD"
  # Use optimized workflow
fi

if ! detect_network; then
  echo "Network restricted - cannot pull packages"
  exit 1
fi

# Get appropriate timeout
TIMEOUT=$(get_timeout "service_ready")
timeout $TIMEOUT bash -c 'until service_ready; do sleep 5; done'
```

## Creating New Helper Scripts

When creating helper scripts:

1. **Source environment detection**
   ```bash
   source "$(dirname "$0")/detect-environment.sh"
   print_environment
   ```

2. **Use appropriate timeouts**
   ```bash
   TIMEOUT=$(get_timeout "npm_install")
   timeout $TIMEOUT npm install
   ```

3. **Provide clear output**
   ```bash
   echo "✅ Success message"
   echo "⚠️  Warning message"
   echo "❌ Error message"
   ```

4. **Exit with proper codes**
   ```bash
   exit 0  # Success
   exit 1  # Failure
   ```

5. **Log to .agent-tmp/**
   ```bash
   mkdir -p .agent-tmp
   command 2>&1 | tee .agent-tmp/command.log
   ```

## Required Reading

Before creating scripts or PRs:

- [Agent Testing Checklist](../../docs/AGENT_TESTING_CHECKLIST.md) - Success criteria
- [Agent Automation Status](../../docs/AGENT_AUTOMATION_STATUS.md) - Current state

## Performance Baselines

Scripts should respect these baselines:

| Operation | Expected | Warning | Failure |
|-----------|----------|---------|---------|
| Container start | < 60s | 60-120s | > 120s |
| npm install | < 120s | 120-300s | > 300s |
| Service ready | < 180s | 180-360s | > 360s |

If exceeding "Warning" thresholds, report performance issues in PR.
