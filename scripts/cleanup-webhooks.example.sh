#!/bin/bash

# Example script for running the webhook cleanup
# This script shows how to set up the environment and run the cleanup

set -e  # Exit on any error

echo "🧹 Unhook Webhook Cleanup Example"
echo "=================================="
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

bun run cleanup:webhooks:dry-run

echo ""
echo "📋 Review the output above to see what would be cleaned up"
echo ""

# Ask for confirmation
read -p "Do you want to proceed with the actual cleanup? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Proceeding with webhook cleanup..."
    echo ""

    bun run cleanup:webhooks

    echo ""
    echo "✅ Webhook cleanup completed!"
    echo ""
    echo "🔍 Running final validation..."
    bun run cleanup:webhooks:dry-run

    echo ""
    echo "🎉 All done! Your webhook data has been cleaned up."
else
    echo "❌ Cleanup cancelled by user"
    exit 0
fi