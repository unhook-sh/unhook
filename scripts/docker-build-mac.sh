#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🐳 Building Mac binaries in Docker...${NC}"

# Create output directory
mkdir -p ./dist

# Build the Docker image
echo -e "${YELLOW}📦 Building Docker image...${NC}"
docker build -f Dockerfile.mac -t unhook-mac-builder .

echo -e "${YELLOW}🔨 Building Mac binaries...${NC}"

# Run the build in Docker and copy binaries out
docker run --rm \
    -v "$(pwd)/dist:/output" \
    unhook-mac-builder \
    bash -c "
        echo '🔧 Installing dependencies...'
        bun install

        echo '🏗️  Building shared packages...'
        bun run build

        echo '🍎 Building Mac ARM64 binary...'
        export BUN_TARGET='bun-darwin-arm64'
        export PLATFORM='darwin'
        export TARGET='arm64'
        export BINARY_EXT=''

        bun build apps/cli/src/cli.tsx \
          --compile \
          --target=\"\$BUN_TARGET\" \
          --outfile=\"apps/cli/bin/unhook\" \
          --external=\"react-devtools-core\"

        BINARY_NAME=\"unhook-\${PLATFORM}-\${TARGET}\${BINARY_EXT}\"
        mv \"apps/cli/bin/unhook\" \"apps/cli/bin/\${BINARY_NAME}\"
        chmod +x \"apps/cli/bin/\${BINARY_NAME}\"
        cp \"apps/cli/bin/\${BINARY_NAME}\" \"/output/\"

        echo '🍎 Building Mac x64 binary...'
        export BUN_TARGET='bun-darwin-x64'
        export TARGET='x64'

        bun build apps/cli/src/cli.tsx \
          --compile \
          --target=\"\$BUN_TARGET\" \
          --outfile=\"apps/cli/bin/unhook\" \
          --external=\"react-devtools-core\"

        BINARY_NAME=\"unhook-\${PLATFORM}-\${TARGET}\${BINARY_EXT}\"
        mv \"apps/cli/bin/unhook\" \"apps/cli/bin/\${BINARY_NAME}\"
        chmod +x \"apps/cli/bin/\${BINARY_NAME}\"
        cp \"apps/cli/bin/\${BINARY_NAME}\" \"/output/\"

        echo '✅ Mac binaries built and copied to /output'
        ls -la /output/
    "

echo -e "${GREEN}✅ Mac binaries built successfully!${NC}"
echo -e "${YELLOW}📁 Binaries are available in: ./dist/${NC}"
ls -la ./dist/

echo ""
echo -e "${BLUE}🧪 To test the binaries:${NC}"
echo -e "   ${GREEN}./dist/unhook-darwin-arm64 --version${NC}    # For Apple Silicon Macs"
echo -e "   ${GREEN}./dist/unhook-darwin-x64 --version${NC}      # For Intel Macs"
echo ""
echo -e "${YELLOW}💡 If you get 'permission denied', run:${NC}"
echo -e "   ${BLUE}chmod +x ./dist/unhook-darwin-*${NC}"