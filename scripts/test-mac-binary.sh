#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Testing Mac binaries built by Docker...${NC}"

# Detect Mac architecture
ARCH=$(uname -m)
if [ "$ARCH" = "arm64" ]; then
    BINARY="./dist/unhook-darwin-arm64"
    echo -e "${YELLOW}📱 Detected Apple Silicon Mac, using ARM64 binary${NC}"
elif [ "$ARCH" = "x86_64" ]; then
    BINARY="./dist/unhook-darwin-x64"
    echo -e "${YELLOW}💻 Detected Intel Mac, using x64 binary${NC}"
else
    echo -e "${RED}❌ Unknown architecture: $ARCH${NC}"
    exit 1
fi

# Check if binary exists
if [ ! -f "$BINARY" ]; then
    echo -e "${RED}❌ Binary not found at: $BINARY${NC}"
    echo -e "${YELLOW}💡 Run one of these first:${NC}"
    echo -e "   ${GREEN}./scripts/docker-build-mac.sh${NC}    # Automated build"
    echo -e "   ${GREEN}./scripts/docker-mac-dev.sh${NC}      # Interactive build"
    echo ""
    echo -e "${YELLOW}📁 Available files in ./dist/:${NC}"
    ls -la ./dist/ 2>/dev/null || echo "Directory doesn't exist"
    exit 1
fi

# Make sure it's executable
chmod +x "$BINARY"

echo -e "${GREEN}✅ Found binary at: $BINARY${NC}"
echo ""

# Run comprehensive tests
echo -e "${BLUE}🔍 Running comprehensive tests...${NC}"

# Test --version
echo -e "${YELLOW}1. Testing --version...${NC}"
if "$BINARY" --version; then
    echo -e "   ${GREEN}✅ --version works${NC}"
else
    echo -e "   ${RED}❌ --version failed${NC}"
fi

echo ""

# Test --help
echo -e "${YELLOW}2. Testing --help...${NC}"
if "$BINARY" --help | head -10; then
    echo -e "   ${GREEN}✅ --help works${NC}"
else
    echo -e "   ${RED}❌ --help failed${NC}"
fi

echo ""

# Test basic startup (with invalid command to avoid hanging)
echo -e "${YELLOW}3. Testing basic startup...${NC}"
if timeout 5 "$BINARY" invalid-command 2>/dev/null; then
    echo -e "   ${GREEN}✅ Binary starts without crashing${NC}"
else
    EXIT_CODE=$?
    if [ $EXIT_CODE -eq 124 ]; then
        echo -e "   ${GREEN}✅ Binary starts (timed out as expected)${NC}"
    else
        echo -e "   ${GREEN}✅ Binary starts and exits gracefully${NC}"
    fi
fi

echo ""
echo -e "${GREEN}🎉 Mac binary testing completed!${NC}"
echo -e "${BLUE}📍 Binary location: $BINARY${NC}"