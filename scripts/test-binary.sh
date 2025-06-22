#!/bin/bash

set -e

# Test script for the built unhook binary
# Usage: ./scripts/test-binary.sh [binary-path]

BINARY_PATH=${1:-"apps/cli/bin/unhook-darwin-arm64"}

echo "🧪 Testing unhook binary at: $BINARY_PATH"

if [ ! -f "$BINARY_PATH" ]; then
    echo "❌ Binary not found at: $BINARY_PATH"
    echo "📁 Available files in apps/cli/bin/:"
    ls -la apps/cli/bin/ 2>/dev/null || echo "Directory doesn't exist"
    echo ""
    echo "Usage: $0 [binary-path]"
    echo "Example: $0 apps/cli/bin/unhook-darwin-arm64"
    exit 1
fi

# Make sure it's executable
chmod +x "$BINARY_PATH"

echo "🔍 Running comprehensive tests..."

# Test --version
echo "1. Testing --version..."
if "$BINARY_PATH" --version; then
    echo "   ✅ --version works"
else
    echo "   ❌ --version failed"
    exit 1
fi

echo ""

# Test --help
echo "2. Testing --help..."
if "$BINARY_PATH" --help > /dev/null 2>&1; then
    echo "   ✅ --help works"
else
    echo "   ❌ --help failed"
    exit 1
fi

echo ""

# Test help for subcommands
echo "3. Testing subcommand help..."
for cmd in "init" "listen" "login"; do
    echo "   Testing: $cmd --help"
    if timeout 10s "$BINARY_PATH" "$cmd" --help > /dev/null 2>&1; then
        echo "   ✅ $cmd --help works"
    else
        echo "   ❌ $cmd --help failed"
        exit 1
    fi
done

echo ""

# Test that the binary doesn't crash on startup
echo "4. Testing binary startup (no crash test)..."
if timeout 5s "$BINARY_PATH" --verbose 2>/dev/null || [ $? -eq 124 ]; then
    echo "   ✅ Binary starts without crashing"
else
    echo "   ❌ Binary crashed on startup"
    exit 1
fi

echo ""

# Show binary info
echo "📊 Binary information:"
echo "   Size: $(du -h "$BINARY_PATH" | cut -f1)"
echo "   Type: $(file "$BINARY_PATH")"
echo "   Executable: $([ -x "$BINARY_PATH" ] && echo "Yes" || echo "No")"

echo ""
echo "🎉 All tests passed! Binary is working correctly."
echo "📍 You can run the binary with:"
echo "   ./$BINARY_PATH --help"
echo "   ./$BINARY_PATH --version"
echo "   ./$BINARY_PATH init --help"
echo "   ./$BINARY_PATH listen --help"
echo "   ./$BINARY_PATH login --help"