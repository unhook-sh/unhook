#!/usr/bin/env bash

# This script ensures all text files have LF line endings
# Run this if you're experiencing formatting issues between local and CI

echo "Fixing line endings in all text files..."

# Find all text files and convert CRLF to LF
find . -type f \
  -not -path "./node_modules/*" \
  -not -path "./.git/*" \
  -not -path "./dist/*" \
  -not -path "./.next/*" \
  -not -path "./.turbo/*" \
  -not -path "./bun.lock" \
  \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" \
     -o -name "*.json" -o -name "*.md" -o -name "*.yml" -o -name "*.yaml" \
     -o -name "*.css" -o -name "*.scss" -o -name "*.html" \) \
  -exec dos2unix {} \; 2>/dev/null || true

echo "Line endings fixed. Please commit any changes."