#!/bin/bash

# Example script for running the organization cleanup
# This script shows how to set up the environment and run the cleanup

set -e  # Exit on any error

echo "🧹 Unhook Organization Cleanup Example"
echo "======================================"
echo ""

# Check if required environment variables are set
if [ -z "$CLERK_SECRET_KEY" ]; then
    echo "❌ CLERK_SECRET_KEY environment variable is not set"
    echo "   Please set it with: export CLERK_SECRET_KEY=your_secret_key"
    exit 1
fi

if [ -z "$POSTGRES_URL" ]; then
    echo "❌ POSTGRES_URL environment variable is not set"
    echo "   Please set it with: export POSTGRES_URL=your_postgres_url"
    exit 1
fi

echo "✅ Environment variables are set"
echo ""

# First, run a dry-run to see what would be cleaned up
echo "🔍 Running dry-run to preview changes..."
echo ""

bun run cleanup:orgs:dry-run

echo ""
echo "📋 Dry-run completed. Review the output above."
echo ""

# Ask for confirmation
read -p "Do you want to proceed with the actual cleanup? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Proceeding with cleanup..."
    echo ""

    bun run cleanup:orgs

    echo ""
    echo "✅ Cleanup completed!"
else
    echo "❌ Cleanup cancelled"
    exit 0
fi