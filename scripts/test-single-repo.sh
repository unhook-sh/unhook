#!/bin/bash

# Test script to demonstrate testing Unhook addition on a single repository

set -e

echo "🧪 Testing Unhook addition on a single repository"
echo ""

# Check if repository name is provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 <repository-name>"
    echo ""
    echo "Example: $0 my-test-repo"
    echo ""
    echo "This will test adding Unhook configuration to the specified repository"
    exit 1
fi

REPO_NAME=$1

echo "📋 Testing repository: $REPO_NAME"
echo ""

# Test the shell script
echo "🔧 Testing shell script..."
if ./scripts/add-unhook-to-repos.sh --test --repo="$REPO_NAME"; then
    echo "✅ Shell script test passed!"
else
    echo "❌ Shell script test failed!"
    exit 1
fi

echo ""
echo "🎉 Test completed successfully!"
echo ""
echo "💡 Next steps:"
echo "1. Check the repository to ensure files were added correctly"
echo "2. Verify the commit was created and pushed"
echo "3. If everything looks good, run without --test to process all repositories:"
echo "   ./scripts/add-unhook-to-repos.sh"
echo ""
echo "🔍 To view the repository:"
echo "   gh repo view seawatts/$REPO_NAME"
echo "   gh repo clone seawatts/$REPO_NAME"
