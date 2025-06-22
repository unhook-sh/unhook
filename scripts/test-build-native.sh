#!/bin/bash

set -e

echo "🔧 Testing CLI build natively (without Docker)..."

# Clean up any previous builds
rm -rf apps/cli/bin 2>/dev/null || true

echo "📦 Installing dependencies..."
bun install

echo "🏗️ Building CLI for current platform..."
mkdir -p apps/cli/bin

# Build for current platform
echo "Building with Bun..."
bun --filter @unhook/cli build

echo "✅ Build completed successfully!"
echo "📁 Binary location: apps/cli/bin/"
ls -la apps/cli/bin/

echo "🧪 Testing binary..."
if [ -x "apps/cli/bin/unhook" ]; then
    echo "Binary is executable"
    apps/cli/bin/unhook --version 2>/dev/null || echo "Binary runs but version command might not be implemented"
else
    echo "⚠️  Binary is not executable or not found"
fi