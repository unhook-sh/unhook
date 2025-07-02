#!/bin/bash

# Unhook Kubernetes Deployment Script
# This script helps deploy Unhook to a Kubernetes cluster

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
NAMESPACE="unhook"
APPLY_SECRETS=true
IMAGE_TAG="latest"
DOCKER_REGISTRY=""

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
        --namespace)
            NAMESPACE="$2"
            shift 2
            ;;
        --skip-secrets)
            APPLY_SECRETS=false
            shift
            ;;
        --image-tag)
            IMAGE_TAG="$2"
            shift 2
            ;;
        --registry)
            DOCKER_REGISTRY="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --namespace NAME     Kubernetes namespace (default: unhook)"
            echo "  --skip-secrets       Skip applying secrets (if already configured)"
            echo "  --image-tag TAG      Docker image tag (default: latest)"
            echo "  --registry URL       Docker registry URL"
            echo "  --help               Show this help message"
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

if ! command_exists kubectl; then
    print_message $RED "kubectl is not installed. Please install kubectl first."
    exit 1
fi

# Check if kubectl is configured
if ! kubectl cluster-info >/dev/null 2>&1; then
    print_message $RED "kubectl is not configured. Please configure kubectl to connect to your cluster."
    exit 1
fi

# Display cluster info
print_message $BLUE "Deploying to cluster:"
kubectl cluster-info | head -n 1

# Create namespace
print_message $YELLOW "Creating namespace: $NAMESPACE"
kubectl apply -f deploy/kubernetes/namespace.yaml

# Apply ConfigMap
print_message $YELLOW "Applying ConfigMap..."
kubectl apply -f deploy/kubernetes/configmap.yaml

# Apply Secrets
if [ "$APPLY_SECRETS" = true ]; then
    print_message $YELLOW "Applying Secrets..."
    print_message $RED "WARNING: The secret.yaml file contains placeholder values!"
    print_message $RED "Please ensure you have updated it with your actual values before proceeding."
    read -p "Have you updated the secret.yaml file? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        kubectl apply -f deploy/kubernetes/secret.yaml
    else
        print_message $YELLOW "Skipping secrets. Make sure to apply them manually."
    fi
fi

# Update image tags if custom registry is specified
if [ -n "$DOCKER_REGISTRY" ]; then
    print_message $YELLOW "Updating image references to use registry: $DOCKER_REGISTRY"
    
    # Update web-app deployment
    sed -i.bak "s|image: unhook/web:.*|image: $DOCKER_REGISTRY/unhook/web:$IMAGE_TAG|g" deploy/kubernetes/web-app.yaml
    
    # Update router deployment
    sed -i.bak "s|image: unhook/router:.*|image: $DOCKER_REGISTRY/unhook/router:$IMAGE_TAG|g" deploy/kubernetes/webhook-router.yaml
fi

# Deploy services in order
print_message $YELLOW "Deploying PostgreSQL..."
kubectl apply -f deploy/kubernetes/postgres.yaml

print_message $YELLOW "Deploying Redis..."
kubectl apply -f deploy/kubernetes/redis.yaml

# Wait for databases to be ready
print_message $YELLOW "Waiting for databases to be ready..."
kubectl wait --namespace=$NAMESPACE --for=condition=ready pod -l app=unhook-postgres --timeout=120s
kubectl wait --namespace=$NAMESPACE --for=condition=ready pod -l app=unhook-redis --timeout=120s

print_message $YELLOW "Deploying Web Application..."
kubectl apply -f deploy/kubernetes/web-app.yaml

print_message $YELLOW "Deploying Webhook Router..."
kubectl apply -f deploy/kubernetes/webhook-router.yaml

print_message $YELLOW "Deploying Ingress..."
print_message $RED "NOTE: Update the domain in ingress.yaml before applying!"
kubectl apply -f deploy/kubernetes/ingress.yaml

# Wait for deployments to be ready
print_message $YELLOW "Waiting for deployments to be ready..."
kubectl wait --namespace=$NAMESPACE --for=condition=available deployment/unhook-web --timeout=300s
kubectl wait --namespace=$NAMESPACE --for=condition=available deployment/unhook-router --timeout=300s

# Display status
print_message $GREEN "Deployment complete!"
print_message $YELLOW ""
print_message $YELLOW "Current status:"
kubectl get all -n $NAMESPACE

print_message $YELLOW ""
print_message $YELLOW "Useful commands:"
print_message $YELLOW "  View pods:          kubectl get pods -n $NAMESPACE"
print_message $YELLOW "  View logs:          kubectl logs -n $NAMESPACE [pod-name]"
print_message $YELLOW "  Port forward web:   kubectl port-forward -n $NAMESPACE svc/unhook-web 3000:3000"
print_message $YELLOW "  Port forward router: kubectl port-forward -n $NAMESPACE svc/unhook-router 8080:8080"
print_message $YELLOW "  Delete deployment:  kubectl delete namespace $NAMESPACE"

# Restore backup files if registry was updated
if [ -n "$DOCKER_REGISTRY" ]; then
    mv deploy/kubernetes/web-app.yaml.bak deploy/kubernetes/web-app.yaml
    mv deploy/kubernetes/webhook-router.yaml.bak deploy/kubernetes/webhook-router.yaml
fi