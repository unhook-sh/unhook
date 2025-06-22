#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🐳 Building development Docker container...${NC}"

# Build the Docker image
docker build -f Dockerfile.dev -t unhook-dev .

echo -e "${GREEN}✅ Docker image built successfully!${NC}"

echo -e "${YELLOW}🚀 Starting interactive container...${NC}"
echo -e "${YELLOW}💡 Inside the container, you can run:${NC}"
echo -e "   ${BLUE}bun run build:cli${NC}                    # Build the CLI"
echo -e "   ${BLUE}ls -la apps/cli/bin/${NC}                 # Check built binaries"
echo -e "   ${BLUE}./apps/cli/bin/unhook-linux-x64 --version${NC}  # Test the binary"
echo -e "   ${BLUE}exit${NC}                                  # Exit container"
echo ""

# Run the container interactively
docker run -it --rm \
    -v "$(pwd):/workspace" \
    -w /workspace \
    --name unhook-dev \
    unhook-dev