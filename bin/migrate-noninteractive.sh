#!/bin/bash
# Non-interactive migration script for CI/CD
# Automatically answers 'y' to the confirmation prompt

echo "Running migrations non-interactively..."
echo "y" | npm run payload:migrate
