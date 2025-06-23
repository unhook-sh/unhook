#!/bin/bash

# This script contains the exact commands to run inside the Docker container
# to replicate the GitHub Actions build process

set -e

echo "🔧 Running build commands inside Docker container..."

echo "1. Installing dependencies..."
bun install

echo "2. Building shared packages..."
bun run build

echo "3. Building CLI for linux-x64..."
cd /workspace
export BUN_TARGET="bun-linux-x64"
export PLATFORM="linux"
export TARGET="x64"
export BINARY_EXT=""

echo "4. Running bun build..."
bun build apps/cli/src/cli.tsx \
  --compile \
  --target="$BUN_TARGET" \
  --outfile="apps/cli/bin/unhook"

echo "5. Renaming binary..."
BINARY_NAME="unhook-${PLATFORM}-${TARGET}${BINARY_EXT}"
mv "apps/cli/bin/unhook" "apps/cli/bin/${BINARY_NAME}"

echo "6. Making binary executable..."
chmod +x "apps/cli/bin/${BINARY_NAME}"

echo "7. Testing the binary..."
ls -la apps/cli/bin/

echo "8. Running version test..."
"./apps/cli/bin/${BINARY_NAME}" --version

echo "9. Running help test..."
"./apps/cli/bin/${BINARY_NAME}" --help

echo "✅ Build and test completed successfully!"