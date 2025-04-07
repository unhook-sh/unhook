#!/bin/bash

# Exit on error
set -e

# Check if we have the required arguments
if [ "$#" -ne 3 ]; then
    echo "Usage: $0 <path-to-binary> <apple-id> <app-specific-password>"
    exit 1
fi

BINARY_PATH="$1"
APPLE_ID="$2"
APP_PASSWORD="$3"
TEAM_ID="QG5N3R59QB"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLI_ROOT="$(dirname "$SCRIPT_DIR")"
CERT_DIR="$CLI_ROOT/certificates"

# Ensure certificates directory exists
mkdir -p "$CERT_DIR"

echo "🔑 Signing binary with Developer ID..."
codesign --deep --force --options runtime --sign "Developer ID Application: Christopher Trevor Watts ($TEAM_ID)" \
    --entitlements "$CLI_ROOT/entitlements.plist" \
    "$BINARY_PATH"

echo "📦 Creating ZIP for notarization..."
ditto -c -k --keepParent "$BINARY_PATH" "$CERT_DIR/unhook.zip"

echo "📤 Submitting for notarization..."
xcrun notarytool submit "$CERT_DIR/unhook.zip" \
    --apple-id "$APPLE_ID" \
    --password "$APP_PASSWORD" \
    --team-id "$TEAM_ID" \
    --wait

echo "🔍 Stapling notarization ticket..."
xcrun stapler staple "$BINARY_PATH"

echo "✅ Verifying binary..."
codesign -vvv --verify "$BINARY_PATH"
spctl --assess --type exec --verbose "$BINARY_PATH"

# Cleanup
rm "$CERT_DIR/unhook.zip"

echo "✨ Done! Binary is now signed, notarized, and stapled."