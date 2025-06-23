#!/bin/bash

# Comprehensive CI testing script
# Offers multiple ways to test the CLI build locally

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 CLI Build Testing Suite${NC}"
echo -e "${BLUE}===========================${NC}"
echo ""
echo "This script helps you test the CLI build locally to verify"
echo "it will work in GitHub Actions without the 'No chunk id map found' error."
echo ""

# Check what tools are available
ACT_AVAILABLE=false
DOCKER_AVAILABLE=false
BUN_AVAILABLE=false

if command -v act &> /dev/null; then
    ACT_AVAILABLE=true
fi

if command -v docker &> /dev/null; then
    DOCKER_AVAILABLE=true
fi

if command -v bun &> /dev/null; then
    BUN_AVAILABLE=true
fi

echo "Available testing methods:"
echo ""

if $ACT_AVAILABLE; then
    echo -e "  ${GREEN}✅ act (GitHub Actions locally)${NC} - Most accurate"
else
    echo -e "  ${YELLOW}❌ act (not installed)${NC} - Most accurate"
fi

if $DOCKER_AVAILABLE; then
    echo -e "  ${GREEN}✅ Docker${NC} - Clean environment"
else
    echo -e "  ${YELLOW}❌ Docker (not available)${NC} - Clean environment"
fi

if $BUN_AVAILABLE; then
    echo -e "  ${GREEN}✅ Cross-compilation${NC} - Fastest"
else
    echo -e "  ${RED}❌ Bun (required for all tests)${NC}"
    echo "Please install Bun first: https://bun.sh"
    exit 1
fi

echo ""

# If no arguments, show menu
if [ $# -eq 0 ]; then
    echo "Choose a testing method:"
    echo ""

    OPTIONS=()

    if $ACT_AVAILABLE; then
        OPTIONS+=("act" "GitHub Actions locally (most accurate)")
    fi

    if $DOCKER_AVAILABLE; then
        OPTIONS+=("docker" "Docker environment (clean)")
    fi

    OPTIONS+=("cross" "Cross-compilation test (fastest)")
    OPTIONS+=("all" "Run all available tests")

    # Simple menu
    PS3="Select test method: "
    select opt in "${OPTIONS[@]::${#OPTIONS[@]}:2}"; do
        case $opt in
            "GitHub Actions locally (most accurate)")
                METHOD="act"
                break
                ;;
            "Docker environment (clean)")
                METHOD="docker"
                break
                ;;
            "Cross-compilation test (fastest)")
                METHOD="cross"
                break
                ;;
            "Run all available tests")
                METHOD="all"
                break
                ;;
            *)
                echo "Invalid option $REPLY"
                ;;
        esac
    done
else
    METHOD=$1
fi

echo ""
echo -e "${BLUE}Running test method: ${METHOD}${NC}"
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

case $METHOD in
    "act")
        if ! $ACT_AVAILABLE; then
            echo -e "${RED}❌ act is not available. Install it first:${NC}"
            echo "  macOS: brew install act"
            echo "  Linux: curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash"
            exit 1
        fi
        echo -e "${YELLOW}🚀 Running GitHub Actions locally with act...${NC}"
        bash "$SCRIPT_DIR/test-ci-locally.sh"
        ;;

    "docker")
        if ! $DOCKER_AVAILABLE; then
            echo -e "${RED}❌ Docker is not available. Please install Docker first.${NC}"
            exit 1
        fi
        echo -e "${YELLOW}🐳 Running Docker-based test...${NC}"
        bash "$SCRIPT_DIR/test-docker-build.sh"
        ;;

    "cross")
        echo -e "${YELLOW}⚡ Running cross-compilation test...${NC}"
        bash "$SCRIPT_DIR/test-cross-compile.sh"
        ;;

    "all")
        echo -e "${YELLOW}🔄 Running all available tests...${NC}"

        TESTS_RUN=0
        TESTS_PASSED=0

        # Cross-compilation test (always available)
        echo ""
        echo -e "${BLUE}=== Cross-compilation Test ===${NC}"
        if bash "$SCRIPT_DIR/test-cross-compile.sh"; then
            echo -e "${GREEN}✅ Cross-compilation test PASSED${NC}"
            TESTS_PASSED=$((TESTS_PASSED + 1))
        else
            echo -e "${RED}❌ Cross-compilation test FAILED${NC}"
        fi
        TESTS_RUN=$((TESTS_RUN + 1))

        # Docker test (if available)
        if $DOCKER_AVAILABLE; then
            echo ""
            echo -e "${BLUE}=== Docker Test ===${NC}"
            if bash "$SCRIPT_DIR/test-docker-build.sh"; then
                echo -e "${GREEN}✅ Docker test PASSED${NC}"
                TESTS_PASSED=$((TESTS_PASSED + 1))
            else
                echo -e "${RED}❌ Docker test FAILED${NC}"
            fi
            TESTS_RUN=$((TESTS_RUN + 1))
        fi

        # Act test (if available)
        if $ACT_AVAILABLE; then
            echo ""
            echo -e "${BLUE}=== GitHub Actions (act) Test ===${NC}"
            if bash "$SCRIPT_DIR/test-ci-locally.sh"; then
                echo -e "${GREEN}✅ GitHub Actions test PASSED${NC}"
                TESTS_PASSED=$((TESTS_PASSED + 1))
            else
                echo -e "${RED}❌ GitHub Actions test FAILED${NC}"
            fi
            TESTS_RUN=$((TESTS_RUN + 1))
        fi

        echo ""
        echo -e "${BLUE}=== Final Results ===${NC}"
        echo "Tests run: $TESTS_RUN"
        echo "Tests passed: $TESTS_PASSED"

        if [ $TESTS_PASSED -eq $TESTS_RUN ]; then
            echo -e "${GREEN}🎉 All tests PASSED! Ready for CI deployment.${NC}"
            exit 0
        else
            echo -e "${RED}❌ Some tests FAILED. Please fix issues before deploying.${NC}"
            exit 1
        fi
        ;;

    *)
        echo -e "${RED}❌ Unknown test method: $METHOD${NC}"
        echo "Available methods: act, docker, cross, all"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}🎉 Test completed successfully!${NC}"

# Show next steps
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. If tests passed, your fix should work in GitHub Actions"
echo "2. Commit and push your changes"
echo "3. The CLI binaries should build without 'No chunk id map found' errors"
echo "4. Published binaries should work with 'npx @unhook/cli'"