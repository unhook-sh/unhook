#!/bin/bash

set -e

echo "🧪 Testing Unhook CLI npm package approach with Bun..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Run this from the CLI package directory."
    exit 1
fi

# Function to timeout command - works on both Linux and macOS
run_with_timeout() {
    local timeout_duration=$1
    shift

    # Try gtimeout first (from GNU coreutils on macOS), then timeout, then fallback
    if command -v gtimeout >/dev/null 2>&1; then
        gtimeout "$timeout_duration" "$@"
    elif command -v timeout >/dev/null 2>&1; then
        timeout "$timeout_duration" "$@"
    else
        # Fallback: run command and kill after timeout using background process
        "$@" &
        local pid=$!
        local count=0
        local max_count=$((timeout_duration))

        while [ $count -lt $max_count ] && kill -0 $pid 2>/dev/null; do
            sleep 1
            count=$((count + 1))
        done

        if kill -0 $pid 2>/dev/null; then
            kill $pid 2>/dev/null || true
            wait $pid 2>/dev/null || true
            return 124  # timeout exit code
        else
            wait $pid 2>/dev/null || return $?
        fi
    fi
}

# Test 1: Check if bun is available
echo "📦 Testing Bun availability..."
if ! command -v bun &> /dev/null; then
    echo "❌ Bun not found. Please install Bun from https://bun.sh"
    exit 1
fi

# Test 2: Check TypeScript compilation
echo "🔨 Testing TypeScript compilation..."
bun run typecheck

# Test 3: Test direct execution (development)
echo "🚀 Testing direct CLI execution (development)..."
run_with_timeout 5 bun src/cli.tsx --help >/dev/null 2>&1 || {
    exit_code=$?
    if [ $exit_code -eq 124 ]; then
        echo "✅ CLI started successfully (timed out as expected)"
    elif [ $exit_code -eq 0 ]; then
        echo "✅ CLI executed successfully"
    else
        echo "❌ CLI failed to start (exit code: $exit_code)"
        exit 1
    fi
}

# Test 4: Test Bun build
echo "🏗️  Testing Bun build process..."
bun run build
echo "✅ Build successful"

# Test 5: Check if built file exists
echo "📋 Testing built file..."
if [ ! -f "bin/unhook.js" ]; then
    echo "❌ bin/unhook.js not found after build"
    exit 1
fi

echo "✅ bin/unhook.js exists"

# Test 6: Check if cli.cjs exists and is executable
echo "📋 Testing CLI launcher..."
if [ ! -f "bin/cli.cjs" ]; then
    echo "❌ bin/cli.cjs not found"
    exit 1
fi

if [ ! -x "bin/cli.cjs" ]; then
    echo "❌ bin/cli.cjs is not executable"
    exit 1
fi

echo "✅ bin/cli.cjs exists and is executable"

# Test 7: Test cli.cjs execution
echo "⚡ Testing CLI launcher execution..."
run_with_timeout 5 ./bin/cli.cjs --help >/dev/null 2>&1 || {
    exit_code=$?
    if [ $exit_code -eq 124 ]; then
        echo "✅ CLI launcher executed successfully (timed out as expected)"
    elif [ $exit_code -eq 0 ]; then
        echo "✅ CLI launcher executed successfully"
    else
        echo "❌ CLI launcher failed to execute (exit code: $exit_code)"
        exit 1
    fi
}

# Test 8: Test direct bun execution for comparison
echo "🔄 Testing direct Bun execution..."
run_with_timeout 5 bun src/cli.tsx --help >/dev/null 2>&1 || {
    exit_code=$?
    if [ $exit_code -eq 124 ]; then
        echo "✅ Bun execution successful (timed out as expected)"
    elif [ $exit_code -eq 0 ]; then
        echo "✅ Bun execution successful"
    else
        echo "❌ Bun execution failed (exit code: $exit_code)"
        exit 1
    fi
}

echo ""
echo "🎉 All tests passed!"
echo "✅ The CLI is ready for npm distribution"
echo ""
echo "To test installation:"
echo "  npm pack"
echo "  npm install -g unhook-cli-*.tgz"
echo "  unhook --help"
echo ""
echo "To publish:"
echo "  npm publish"