#!/bin/bash

# Unhook Docker Image Build Script
# This script builds and optionally pushes Docker images

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
PUSH=false
REGISTRY=""
TAG="latest"
PLATFORM="linux/amd64"

# Function to print colored output
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --push)
            PUSH=true
            shift
            ;;
        --registry)
            REGISTRY="$2"
            shift 2
            ;;
        --tag)
            TAG="$2"
            shift 2
            ;;
        --platform)
            PLATFORM="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --push              Push images to registry after building"
            echo "  --registry URL      Docker registry URL (e.g., docker.io/myorg)"
            echo "  --tag TAG           Image tag (default: latest)"
            echo "  --platform PLATFORM Platform to build for (default: linux/amd64)"
            echo "  --help              Show this help message"
            exit 0
            ;;
        *)
            print_message $RED "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Check prerequisites
print_message $YELLOW "Checking prerequisites..."

if ! command_exists docker; then
    print_message $RED "Docker is not installed. Please install Docker first."
    exit 1
fi

# Determine image names
if [ -n "$REGISTRY" ]; then
    WEB_IMAGE="$REGISTRY/unhook-web:$TAG"
    ROUTER_IMAGE="$REGISTRY/unhook-router:$TAG"
else
    WEB_IMAGE="unhook/web:$TAG"
    ROUTER_IMAGE="unhook/router:$TAG"
fi

print_message $BLUE "Building images:"
print_message $BLUE "  Web: $WEB_IMAGE"
print_message $BLUE "  Router: $ROUTER_IMAGE"
print_message $BLUE "  Platform: $PLATFORM"

# Build web application image
print_message $YELLOW "Building web application image..."
docker build \
    --platform "$PLATFORM" \
    -f Dockerfile.web \
    -t "$WEB_IMAGE" \
    --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:-}" \
    --build-arg NEXT_PUBLIC_CLERK_SIGN_IN_URL="${NEXT_PUBLIC_CLERK_SIGN_IN_URL:-/sign-in}" \
    --build-arg NEXT_PUBLIC_CLERK_SIGN_UP_URL="${NEXT_PUBLIC_CLERK_SIGN_UP_URL:-/sign-up}" \
    --build-arg NEXT_PUBLIC_POSTHOG_KEY="${NEXT_PUBLIC_POSTHOG_KEY:-}" \
    --build-arg NEXT_PUBLIC_POSTHOG_HOST="${NEXT_PUBLIC_POSTHOG_HOST:-https://app.posthog.com}" \
    --build-arg NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-}" \
    .

if [ $? -eq 0 ]; then
    print_message $GREEN "✓ Web application image built successfully"
else
    print_message $RED "✗ Failed to build web application image"
    exit 1
fi

# Build webhook router image
print_message $YELLOW "Building webhook router image..."
docker build \
    --platform "$PLATFORM" \
    -f Dockerfile.router \
    -t "$ROUTER_IMAGE" \
    .

if [ $? -eq 0 ]; then
    print_message $GREEN "✓ Webhook router image built successfully"
else
    print_message $RED "✗ Failed to build webhook router image"
    exit 1
fi

# Push images if requested
if [ "$PUSH" = true ]; then
    if [ -z "$REGISTRY" ]; then
        print_message $RED "Registry must be specified when pushing images"
        exit 1
    fi

    print_message $YELLOW "Pushing images to registry..."

    print_message $YELLOW "Pushing web application image..."
    docker push "$WEB_IMAGE"
    if [ $? -eq 0 ]; then
        print_message $GREEN "✓ Web application image pushed successfully"
    else
        print_message $RED "✗ Failed to push web application image"
        exit 1
    fi

    print_message $YELLOW "Pushing webhook router image..."
    docker push "$ROUTER_IMAGE"
    if [ $? -eq 0 ]; then
        print_message $GREEN "✓ Webhook router image pushed successfully"
    else
        print_message $RED "✗ Failed to push webhook router image"
        exit 1
    fi
fi

print_message $GREEN ""
print_message $GREEN "Build completed successfully!"
print_message $YELLOW ""
print_message $YELLOW "Images built:"
print_message $YELLOW "  - $WEB_IMAGE"
print_message $YELLOW "  - $ROUTER_IMAGE"

if [ "$PUSH" = false ]; then
    print_message $YELLOW ""
    print_message $YELLOW "To push images to a registry, run:"
    print_message $YELLOW "  $0 --push --registry your-registry"
fi