#!/bin/bash

set -e

echo "🧹 Cleaning up Docker resources..."
docker system prune -f --volumes 2>/dev/null || true

echo "🔧 Setting up local environment..."
export DOCKER_BUILDKIT=1
export BUILDKIT_PROGRESS=plain

echo "🔑 Generating environment variables from Infisical..."
# Generate .env file from Infisical (will prompt for login if needed)
if command -v infisical &> /dev/null; then
    # Export secrets to .env file
    infisical export --format=dotenv --path="/" > .env.generated
    echo "✅ Environment variables generated from Infisical"
    ENV_FILE=".env.generated"
else
    echo "❌ Infisical CLI not found. Please install it first:"
    echo "   npm install -g @infisical/cli"
    echo "   # or"
    echo "   brew install infisical/get-cli/infisical"
    exit 1
fi

echo "🚀 Running simplified GitHub Actions workflow locally..."
act workflow_dispatch \
  --workflows .github/workflows/cli-github-release-local.yml \
  --job build \
  --verbose \
  --env-file "$ENV_FILE" 2>&1 | tee act-output.log

echo "🧹 Cleaning up generated env file..."
rm -f .env.generated

echo "✅ Local testing completed. Check act-output.log for details."
echo "📋 The binary testing happens inside the workflow container."
echo "📍 If you need to test a binary locally, use: ./scripts/test-binary.sh [binary-path]"