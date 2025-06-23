#!/bin/bash

# Test CLI build locally using act (GitHub Actions runner)
# This simulates the exact CI environment

set -e

echo "🧪 Testing CLI build in simulated CI environment"

# Check if act is installed
if ! command -v act &> /dev/null; then
    echo "❌ act is not installed. Installing..."

    # Install act based on OS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install act
        else
            echo "Please install Homebrew first: https://brew.sh"
            exit 1
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash
    else
        echo "Please install act manually: https://github.com/nektos/act#installation"
        exit 1
    fi
fi

echo "✅ act is available"

# Create a minimal GitHub workflow for testing
mkdir -p .github/workflows/test

cat > .github/workflows/test/cli-build-test.yml << 'EOF'
name: Local CLI Build Test

on:
  workflow_dispatch:
  push:
    branches: [main]

permissions:
  contents: write
  packages: write
  actions: read

env:
  FORCE_COLOR: 3
  NEXT_PUBLIC_SUPABASE_ANON_KEY: sk_test_123
  NEXT_PUBLIC_SUPABASE_URL: https://test.supabase.co
  NEXT_PUBLIC_POSTHOG_KEY: phc_test_123
  NEXT_PUBLIC_POSTHOG_HOST: https://app.posthog.com
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: pk_test_123
  NEXT_PUBLIC_API_URL: https://api.unhook.sh
  NEXT_PUBLIC_APP_ENV: production

jobs:
  test-cli-build:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        include:
          - platform: linux
            target: x64
            binary_ext: ""
          - platform: linux
            target: arm64
            binary_ext: ""

    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install

      - name: Build CLI
        shell: bash
        run: |
          cd apps/cli

          # Set target based on matrix
          if [[ "${{ matrix.platform }}" == "linux" ]]; then
            if [[ "${{ matrix.target }}" == "x64" ]]; then
              BUN_TARGET="bun-linux-x64"
            elif [[ "${{ matrix.target }}" == "arm64" ]]; then
              BUN_TARGET="bun-linux-arm64"
            fi
          fi

          echo "Building with target: $BUN_TARGET"

          # Use the fixed build command
          bun run clean
          bun run typecheck

          NEXT_PUBLIC_APP_TYPE=cli bun build ./src/cli.tsx \
            --outfile ./bin/unhook-test-${{ matrix.platform }}-${{ matrix.target }} \
            --env 'NEXT_PUBLIC_*' \
            --compile \
            --bundle \
            --no-splitting \
            --external react-devtools-core \
            --external react-devtools \
            --external react-scan \
            --minify
        env:
          BUN_BUILD_TARGET: ${{ matrix.target }}

      - name: Test compiled binary
        shell: bash
        run: |
          cd apps/cli

          # Make sure binary exists
          if [[ ! -f "./bin/unhook-test-${{ matrix.platform }}-${{ matrix.target }}" ]]; then
            echo "❌ Binary not found"
            exit 1
          fi

          # Make executable
          chmod +x "./bin/unhook-test-${{ matrix.platform }}-${{ matrix.target }}"

          # Test execution (with required env vars)
          echo "🧪 Testing binary execution..."

          # Test basic execution
          if ./bin/unhook-test-${{ matrix.platform }}-${{ matrix.target }} --version 2>&1 | grep -q "error.*chunk id map"; then
            echo "❌ 'No chunk id map found' error detected!"
            exit 1
          else
            echo "✅ No 'chunk id map' error detected"
          fi

          echo "✅ Binary compiled and tested successfully"

      - name: Upload test artifacts
        uses: actions/upload-artifact@v4
        with:
          name: cli-test-${{ matrix.platform }}-${{ matrix.target }}
          path: apps/cli/bin/unhook-test-${{ matrix.platform }}-${{ matrix.target }}
EOF

echo "📝 Created test workflow"

# Run the workflow with act
echo "🚀 Running GitHub Actions locally with act..."

# Run with specific environment
act workflow_dispatch \
  --workflows .github/workflows/test/cli-build-test.yml \
  --artifact-server-path /tmp/act-artifacts \
  --env-file <(cat << 'EOF'
NEXT_PUBLIC_SUPABASE_ANON_KEY=sk_test_123
NEXT_PUBLIC_SUPABASE_URL=https://test.supabase.co
NEXT_PUBLIC_POSTHOG_KEY=phc_test_123
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_123
NEXT_PUBLIC_API_URL=https://api.unhook.sh
NEXT_PUBLIC_APP_ENV=production
EOF
) \
  --verbose

echo "🎉 Local CI test completed!"

# Cleanup
rm -rf .github/workflows/test

echo "✅ Test workflow file cleaned up"