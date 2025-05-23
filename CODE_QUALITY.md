# Y-Not Radio PHP Code Quality Guide

## Code Linting

We use PHP_CodeSniffer with custom rules to maintain code quality and consistency across the codebase.

### Running the Linter

From the project root, run:

```bash
./lint.sh
```

This will check all PHP files in the `/src` directory for issues.

### Options

- `--fix` - Automatically fix issues when possible
- `--dir=PATH` - Specify a subdirectory to scan (default: ./src)
- `--no-summary` - Skip the summary report

Example:
```bash
./lint.sh --fix --dir=./src/cp
```

### Custom Sniffs

#### BrokenRequireSniff

We've implemented a custom sniff to detect broken require/include statements. This is especially important after the reorganization of files into the `/cp` directory.

The sniff will check if the included file exists by trying various possible paths:

- Absolute path (as written)
- Relative to the current file
- Relative to the /src directory
- With "../" prefix removed (for CP directory files)
- Relative to the project root

When a broken require is detected, the error message will show all paths that were checked:

```
Include/require file "non_existent_file.php" not found. Checked paths:
non_existent_file.php, /workspaces/site/src/non_existent_file.php,
/workspaces/site/non_existent_file.php
```

The linter also provides warnings for CP directory files that might need path adjustments after reorganization:

```
Path "/partials/header.php" might need adjustment after CP directory reorganization. Consider using: "../partials/header.php"
```

## Best Practices

### File Organization

- Control panel files should be kept in the `/cp` directory
- Common functions should be in the `/functions` directory
- Templates and partials should be in the `/partials` directory

### Path References

When including files in PHP:

1. **In the root directory:**
   ```php
   require_once 'partials/_header.php';
   require_once 'functions/main_fns.php';
   ```

2. **In the `/cp` directory:**
   ```php
   require_once '../partials/_header.php';
   require_once '../functions/main_fns.php';
   ```

3. **Using the base path variable:**
   ```php
   $base_path = (strpos($page_file, 'cp/') !== false || dirname($_SERVER['PHP_SELF']) == '/cp') ? "../" : "";
   require_once $base_path . 'partials/_header.php';
   ```

### File References in HTML/CSS/JS

Always use dynamic path construction:

```php
<link href="<?php echo $base_path; ?>style/base.css" rel="stylesheet">
<script src="<?php echo $base_path; ?>js/common_functions.js"></script>
<img src="<?php echo $base_path; ?>images/logo.png" alt="Logo">
```

### PHP String Constants

Always use quotes for array keys:

```php
// Good
$username = $_POST['username'];
$remember = isset($_POST['remember_me']) ? $_POST['remember_me'] : 0;

// Bad - will generate warnings
$username = $_POST[username];
$remember = $_POST[remember_me];
```

## Continuous Integration

The linter can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Action
name: PHP Linting
on: [push, pull_request]
jobs:
  phpcs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '7.4'
      - name: Install dependencies
        run: composer install
      - name: Run PHP_CodeSniffer
        run: ./lint.sh
```

### Git Pre-Commit Hook

To enforce code quality locally before commits, you can set up a pre-commit hook:

```bash
# Create .git/hooks/pre-commit
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash

# Run PHP linter on staged PHP files
echo "Running PHP linter on staged files..."
./lint.sh
if [ $? -ne 0 ]; then
  echo "Linting errors found. Please fix them before committing."
  exit 1
fi

exit 0
EOF

# Make the hook executable
chmod +x .git/hooks/pre-commit
```

## Common Issues

### Broken Require/Include Statements

The most common issue after our directory reorganization is incorrect paths in require/include statements. Use the linter to detect these automatically:

```bash
./lint.sh --dir=./src/cp
```

Fix by updating paths to use `../` for files moved to the `/cp` directory.
