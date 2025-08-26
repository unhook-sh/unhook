#!/bin/bash

# Test script to verify GitHub CLI setup before running the main script

set -e

echo "🔍 Testing GitHub CLI setup..."

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed"
    echo ""
    echo "Please install it first:"
    echo "  macOS: brew install gh"
    echo "  Ubuntu: sudo apt install gh"
    echo "  Windows: winget install GitHub.cli"
    echo "  Or visit: https://cli.github.com/"
    exit 1
fi

echo "✅ GitHub CLI is installed"

# Check authentication status
if ! gh auth status &> /dev/null; then
    echo "❌ GitHub CLI is not authenticated"
    echo ""
    echo "Please authenticate with:"
    echo "  gh auth login"
    exit 1
fi

echo "✅ GitHub CLI is authenticated"

# Get current user
CURRENT_USER=$(gh api user --jq .login)
echo "✅ Authenticated as: $CURRENT_USER"

# Test repository access
if ! gh repo list --limit 1 &> /dev/null; then
    echo "❌ Cannot list repositories"
    echo "Please check your permissions and try again"
    exit 1
fi

echo "✅ Repository access confirmed"

# Count repositories
REPO_COUNT=$(gh repo list --json name --limit 1000 | jq length)
echo "✅ Found $REPO_COUNT repositories"

echo ""
echo "🎉 GitHub CLI setup is ready!"
echo "You can now run: ./scripts/add-unhook-to-repos.sh"
