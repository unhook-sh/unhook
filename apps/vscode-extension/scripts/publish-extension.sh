#!/bin/bash

# VS Code Extension Publishing Script
# This script demonstrates the new simplified workflow for packaging and publishing the Unhook VS Code extension

set -e

echo "🚀 Unhook VS Code Extension Publishing"
echo "======================================"

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "src" ]; then
    echo "❌ Please run this script from the apps/vscode-extension directory"
    exit 1
fi

# Show available commands
echo ""
echo "Available commands:"
echo "  📦 bun run package         - Build and create .vsix package"
echo "  🚀 bun run publish         - Package and publish to both marketplaces"
echo "  📊 bun run publish:vscode  - Publish to VS Code Marketplace only"
echo "  🌐 bun run publish:ovsx    - Publish to Open VSX Registry only"
echo ""

# Ask user what they want to do
echo "What would you like to do?"
echo "1) Package only (create .vsix)"
echo "2) Package and publish to both marketplaces"
echo "3) Publish to VS Code Marketplace only"
echo "4) Publish to Open VSX Registry only"
echo "5) Exit"
echo ""

read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo "📦 Creating package..."
        bun run package
        echo "✅ Package created! Look for the .vsix file in this directory"
        ;;
    2)
        echo "🚀 Publishing to both marketplaces..."
        bun run publish
        echo "✅ Published to both VS Code Marketplace and Open VSX Registry!"
        ;;
    3)
        echo "📊 Publishing to VS Code Marketplace..."
        bun run publish:vscode
        echo "✅ Published to VS Code Marketplace!"
        ;;
    4)
        echo "🌐 Publishing to Open VSX Registry..."
        bun run publish:ovsx
        echo "✅ Published to Open VSX Registry!"
        ;;
    5)
        echo "👋 Goodbye!"
        exit 0
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac

echo ""
echo "🎉 Operation completed successfully!"