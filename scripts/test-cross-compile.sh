#!/bin/bash

# Quick cross-compilation test
# Tests the exact build commands that CI uses without requiring Docker

set -e

echo "⚡ Quick cross-compilation test for CLI"
echo "This tests the same build commands used in CI"

cd "$(dirname "$0")/../apps/cli"

# Set required environment variables (like CI does)
export NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY:-"sk_test_123"}
export NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL:-"https://test.supabase.co"}
export NEXT_PUBLIC_POSTHOG_KEY=${NEXT_PUBLIC_POSTHOG_KEY:-"phc_test_123"}
export NEXT_PUBLIC_POSTHOG_HOST=${NEXT_PUBLIC_POSTHOG_HOST:-"https://app.posthog.com"}
export NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:-"pk_test_123"}
export NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-"https://api.unhook.sh"}
export NEXT_PUBLIC_APP_ENV=${NEXT_PUBLIC_APP_ENV:-"production"}
export FORCE_COLOR=3

echo "📋 Environment variables set"

# Test targets (same as CI matrix)
declare -a TARGETS=(
  "bun-linux-x64"
  "bun-linux-arm64"
  "bun-darwin-x64"
  "bun-darwin-arm64"
)

echo "🧪 Testing cross-compilation for ${#TARGETS[@]} targets..."

# Track results
declare -a RESULTS=()
FAILED=0

for TARGET in "${TARGETS[@]}"; do
  echo ""
  echo "🔨 Building for target: $TARGET"

  # Extract platform and arch from target
  PLATFORM=$(echo $TARGET | cut -d'-' -f2)
  ARCH=$(echo $TARGET | cut -d'-' -f3)

  OUTPUT_FILE="./bin/unhook-test-${PLATFORM}-${ARCH}"

  # Clean previous builds
  rm -f "$OUTPUT_FILE"

  # Build with the exact command from CI (our fixed version)
  echo "Running build command..."

  if NEXT_PUBLIC_APP_TYPE=cli bun build ./src/cli.tsx \
    --outfile "$OUTPUT_FILE" \
    --env 'NEXT_PUBLIC_*' \
    --compile \
    --target "$TARGET" \
    --bundle \
    --no-splitting \
    --external react-devtools-core \
    --external react-devtools \
    --external react-scan \
    --minify; then

    # Check if binary was created
    if [[ -f "$OUTPUT_FILE" ]]; then
      echo "✅ Binary created: $OUTPUT_FILE"

      # Make executable and test
      chmod +x "$OUTPUT_FILE"

      # Quick test - check for the specific error
      echo "🧪 Testing for 'chunk id map' error..."

      # Capture both stdout and stderr
      TEST_OUTPUT=$("$OUTPUT_FILE" --version 2>&1 || true)

      if echo "$TEST_OUTPUT" | grep -q "chunk id map"; then
        echo "❌ FAIL: 'No chunk id map found' error detected!"
        echo "Error output: $TEST_OUTPUT"
        RESULTS+=("❌ $TARGET: chunk id map error")
        FAILED=1
      else
        echo "✅ PASS: No 'chunk id map' error"
        RESULTS+=("✅ $TARGET: OK")
      fi

      # Show file size
      SIZE=$(ls -lh "$OUTPUT_FILE" | awk '{print $5}')
      echo "📦 Binary size: $SIZE"

    else
      echo "❌ FAIL: Binary not created"
      RESULTS+=("❌ $TARGET: build failed")
      FAILED=1
    fi

  else
    echo "❌ FAIL: Build command failed"
    RESULTS+=("❌ $TARGET: compile failed")
    FAILED=1
  fi
done

echo ""
echo "📊 Test Results Summary:"
echo "======================="

for RESULT in "${RESULTS[@]}"; do
  echo "$RESULT"
done

if [[ $FAILED -eq 0 ]]; then
  echo ""
  echo "🎉 All cross-compilation tests PASSED!"
  echo "✅ No 'chunk id map' errors detected"
  echo "✅ All targets compiled successfully"
  echo "✅ Ready for CI deployment"
else
  echo ""
  echo "❌ Some tests FAILED!"
  echo "Please check the build configuration"
  exit 1
fi

echo ""
echo "🧹 Cleaning up test binaries..."
rm -f ./bin/unhook-test-*

echo "✅ Cross-compilation test completed successfully!"