#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🐳 Starting interactive Mac build environment...${NC}"

# Create output directory
mkdir -p ./dist

# Build the Docker image
echo -e "${YELLOW}📦 Building Docker image...${NC}"
docker build -f Dockerfile.mac -t unhook-mac-builder .

echo -e "${GREEN}✅ Docker image built successfully!${NC}"

echo -e "${YELLOW}🚀 Starting interactive container...${NC}"
echo -e "${YELLOW}💡 Inside the container, you can run:${NC}"
echo ""
echo -e "   ${BLUE}# Build Mac ARM64 binary${NC}"
echo -e "   ${GREEN}export BUN_TARGET='bun-darwin-arm64'${NC}"
echo -e "   ${GREEN}export PLATFORM='darwin'${NC}"
echo -e "   ${GREEN}export TARGET='arm64'${NC}"
echo -e "   ${GREEN}bun build apps/cli/src/cli.tsx --compile --target=\"\$BUN_TARGET\" --outfile=\"apps/cli/bin/unhook\" --external=\"react-devtools-core\"${NC}"
echo ""
echo -e "   ${BLUE}# Build Mac x64 binary${NC}"
echo -e "   ${GREEN}export BUN_TARGET='bun-darwin-x64'${NC}"
echo -e "   ${GREEN}export TARGET='x64'${NC}"
echo -e "   ${GREEN}bun build apps/cli/src/cli.tsx --compile --target=\"\$BUN_TARGET\" --outfile=\"apps/cli/bin/unhook\" --external=\"react-devtools-core\"${NC}"
echo ""
echo -e "   ${BLUE}# Copy binary to output (accessible on host)${NC}"
echo -e "   ${GREEN}cp apps/cli/bin/unhook /output/unhook-darwin-arm64${NC}"
echo ""
echo -e "   ${BLUE}# Other useful commands${NC}"
echo -e "   ${GREEN}bun install${NC}                    # Install dependencies"
echo -e "   ${GREEN}bun run build${NC}                  # Build shared packages"
echo -e "   ${GREEN}ls -la apps/cli/bin/${NC}           # Check built binaries"
echo -e "   ${GREEN}ls -la /output/${NC}                # Check output directory"
echo -e "   ${GREEN}exit${NC}                           # Exit container"
echo ""

# Run the container interactively with output directory mounted
docker run -it --rm \
    -v "$(pwd):/workspace" \
    -v "$(pwd)/dist:/output" \
    -w /workspace \
    --name unhook-mac-dev \
    unhook-mac-builder