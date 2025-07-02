#!/bin/bash

# Unhook Docker Deployment Script
# This script helps deploy Unhook using Docker Compose

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
PROFILE=""
BUILD=false
DETACH=true

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
        --production)
            PROFILE="--profile production"
            shift
            ;;
        --build)
            BUILD=true
            shift
            ;;
        --attach)
            DETACH=false
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --production    Include production services (nginx)"
            echo "  --build         Build images before starting"
            echo "  --attach        Don't run in detached mode"
            echo "  --help          Show this help message"
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

if ! command_exists docker-compose && ! docker compose version >/dev/null 2>&1; then
    print_message $RED "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check for .env file
if [ ! -f ".env" ]; then
    print_message $YELLOW ".env file not found. Creating from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_message $GREEN ".env file created. Please edit it with your configuration."
        print_message $YELLOW "Run this script again after updating .env file."
        exit 0
    else
        print_message $RED ".env.example file not found. Cannot create .env file."
        exit 1
    fi
fi

# Build images if requested
if [ "$BUILD" = true ]; then
    print_message $YELLOW "Building Docker images..."
    docker-compose build
fi

# Start services
print_message $YELLOW "Starting Unhook services..."

if [ "$DETACH" = true ]; then
    docker-compose $PROFILE up -d
else
    docker-compose $PROFILE up
fi

# Check if services are running
if [ "$DETACH" = true ]; then
    sleep 5
    print_message $YELLOW "Checking service status..."
    
    if docker-compose ps | grep -q "unhook-web.*Up"; then
        print_message $GREEN "Web application is running at http://localhost:${WEB_PORT:-3000}"
    else
        print_message $RED "Web application failed to start. Check logs with: docker-compose logs web"
    fi
    
    if docker-compose ps | grep -q "unhook-router.*Up"; then
        print_message $GREEN "Webhook router is running at http://localhost:${ROUTER_PORT:-8080}"
    else
        print_message $RED "Webhook router failed to start. Check logs with: docker-compose logs webhook-router"
    fi
    
    print_message $YELLOW ""
    print_message $YELLOW "Useful commands:"
    print_message $YELLOW "  View logs:        docker-compose logs -f [service]"
    print_message $YELLOW "  Stop services:    docker-compose down"
    print_message $YELLOW "  View status:      docker-compose ps"
    print_message $YELLOW "  Execute command:  docker-compose exec [service] [command]"
fi