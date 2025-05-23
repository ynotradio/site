#!/bin/bash

# Y-Not Radio PHP Linting Script
# This script runs PHP_CodeSniffer to check for code issues
# with a special focus on broken require/include statements

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Y-Not Radio PHP Linter${NC}"
echo "=============================="

# Check if we're in the project root
if [ ! -f "phpcs.xml" ]; then
    echo -e "${RED}Error: Run this script from the project root directory.${NC}"
    exit 1
fi

# Options
SHOW_SUMMARY=1
FIX_ISSUES=0
TARGET_DIR="./src"

# Process command line arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --fix) FIX_ISSUES=1 ;;
        --dir=*) TARGET_DIR="${1#*=}" ;;
        --no-summary) SHOW_SUMMARY=0 ;;
        --help)
            echo "Usage: ./lint.sh [options]"
            echo ""
            echo "Options:"
            echo "  --fix           Automatically fix issues when possible"
            echo "  --dir=PATH      Specify a subdirectory to scan (default: ./src)"
            echo "  --no-summary    Skip the summary report"
            echo "  --help          Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown parameter: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
    shift
done

# Check if PHP_CodeSniffer is installed
if ! command -v ./vendor/bin/phpcs &> /dev/null; then
    echo -e "${RED}PHP_CodeSniffer not found.${NC}"
    echo "Installing PHP_CodeSniffer..."
    composer require --dev squizlabs/php_codesniffer
fi

echo -e "${GREEN}Checking PHP files in ${TARGET_DIR}...${NC}"

# Run the linter
if [ $FIX_ISSUES -eq 1 ]; then
    echo "Running in FIX mode (will attempt to fix issues automatically)"
    ./vendor/bin/phpcbf --standard=phpcs.xml "${TARGET_DIR}"
fi

# Register custom standard path before running
echo "Setting up custom standards..."
STANDARD_PATH=$(pwd)/src/PHP_CodeSniffer/Standards
./vendor/bin/phpcs --config-set installed_paths ${STANDARD_PATH}

# Run PHPCS for reporting
./vendor/bin/phpcs --standard=phpcs.xml "${TARGET_DIR}"
PHPCS_EXIT_CODE=$?

# Show a nice summary
if [ $SHOW_SUMMARY -eq 1 ]; then
    echo ""
    echo -e "${YELLOW}Summary:${NC}"
    echo "---------------------"
    
    # Count issues
    BROKEN_REQUIRES=$(./vendor/bin/phpcs --standard=phpcs.xml "${TARGET_DIR}" -n | grep -c "BrokenRequire")
    TOTAL_ISSUES=$(./vendor/bin/phpcs --standard=phpcs.xml "${TARGET_DIR}" -n | grep -c "ERROR\|WARNING")
    
    echo -e "- Broken requires/includes: ${RED}${BROKEN_REQUIRES}${NC}"
    echo -e "- Total issues: ${RED}${TOTAL_ISSUES}${NC}"
    
    if [ $BROKEN_REQUIRES -eq 0 ] && [ $TOTAL_ISSUES -eq 0 ]; then
        echo -e "${GREEN}All checks passed!${NC}"
    else
        echo -e "${YELLOW}Some issues need to be addressed.${NC}"
        echo "Run with --fix to attempt automatic fixes."
    fi
fi

exit $PHPCS_EXIT_CODE
