#!/bin/bash

set -e

# Alternative script for using existing .env file
# Usage: ./scripts/test-build-with-env.sh [env-file]

ENV_FILE=${1:-.env}

echo "🧹 Cleaning up Docker resources..."
docker system prune -f --volumes 2>/dev/null || true

echo "🔧 Setting up local environment..."
export DOCKER_BUILDKIT=1
export BUILDKIT_PROGRESS=plain

# Check if env file exists
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Environment file not found: $ENV_FILE"
    echo "💡 Usage: $0 [env-file]"
    echo "   Example: $0 .env"
    echo "   Example: $0 .env.local"
    exit 1
fi

echo "🔑 Using environment file: $ENV_FILE"

echo "🚀 Running simplified GitHub Actions workflow locally..."
act workflow_dispatch \
  --workflows .github/workflows/cli-github-release-local.yml \
  --job build \
  --verbose \
  --env-file "$ENV_FILE" 2>&1 | tee act-output.log

echo "✅ Local testing completed. Check act-output.log for details."
echo "📋 The binary testing happens inside the workflow container."
echo "📍 If you need to test a binary locally, use: ./scripts/test-binary.sh [binary-path]"