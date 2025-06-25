#!/bin/bash

# Test script to simulate GitHub action workflow
# This helps verify that our package and publish scripts work as expected

set -e

echo "🧪 Testing GitHub Action Workflow for VS Code Extension"
echo "======================================================"

# Get version from package.json (same as GitHub action does)
VERSION=$(node -p "require('./package.json').version")
echo "📋 Version from package.json: $VERSION"

# Expected filename
EXPECTED_FILE="unhook-vscode-$VERSION.vsix"
echo "📦 Expected package file: $EXPECTED_FILE"

# Clean up any existing packages
echo "🧹 Cleaning up existing packages..."
rm -f *.vsix

# Run the package command (same as GitHub action)
echo "📦 Running package command..."
bun run package

# Verify the expected file was created
if [ ! -f "$EXPECTED_FILE" ]; then
  echo "❌ Expected package file not found. Listing available files:"
  ls -la *.vsix || echo "No .vsix files found"
  exit 1
fi

echo "✅ Package created successfully: $EXPECTED_FILE"

# Get file size for verification
FILE_SIZE=$(stat -f%z "$EXPECTED_FILE" 2>/dev/null || stat -c%s "$EXPECTED_FILE" 2>/dev/null || echo "unknown")
echo "📊 Package size: $FILE_SIZE bytes"

# List package contents (without extracting)
echo "📋 Package contents:"
if command -v unzip >/dev/null 2>&1; then
  unzip -l "$EXPECTED_FILE" | head -20
else
  echo "   (unzip not available, cannot list contents)"
fi

echo ""
echo "✅ GitHub Action workflow test completed successfully!"
echo "   The package '$EXPECTED_FILE' is ready for publishing."