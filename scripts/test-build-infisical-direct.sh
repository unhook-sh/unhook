#!/bin/bash

set -e

# Script that uses Infisical to inject environment variables directly
# This avoids creating temporary .env files on disk

echo "🧹 Cleaning up Docker resources..."
docker system prune -f --volumes 2>/dev/null || true

echo "🔧 Setting up local environment..."
export DOCKER_BUILDKIT=1
export BUILDKIT_PROGRESS=plain

echo "🔑 Loading environment variables from Infisical..."
if ! command -v infisical &> /dev/null; then
    echo "❌ Infisical CLI not found. Please install it first:"
    echo "   npm install -g @infisical/cli"
    echo "   # or"
    echo "   brew install infisical/get-cli/infisical"
    exit 1
fi

echo "🚀 Running GitHub Actions workflow with Infisical secrets..."

# Use infisical run to inject environment variables directly
infisical run --path="/" -- act workflow_dispatch \
  --workflows .github/workflows/cli-github-release-local.yml \
  --job build \
  --verbose \
  2>&1 | tee act-output.log

echo "✅ Local testing completed. Check act-output.log for details."
echo "📋 The binary testing happens inside the workflow container."
echo "📍 If you need to test a binary locally, use: ./scripts/test-binary.sh [binary-path]"