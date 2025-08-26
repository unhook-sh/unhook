#!/bin/bash

# Script to add Unhook configuration and VS Code extension recommendations to all GitHub repositories
# for the user seawatts

set -e

GITHUB_USER="seawatts"
TEMP_DIR="/tmp/unhook-repos"
UNHOOK_EXTENSION_ID="unhook.unhook-vscode"

# Test mode configuration
TEST_MODE=false
TEST_REPO=""
YES_MODE=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --test|-t)
      TEST_MODE=true
      shift
      ;;
    --yes|-y)
      YES_MODE=true
      shift
      ;;
    --repo=*)
      TEST_REPO="${1#*=}"
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [--test|--repo=repo-name]"
      echo "  --test, -t          Enable test mode"
      echo "  --repo=repo-name    Specify repository name for test mode"
      echo "  --yes,  -y          Auto-confirm all prompts"
      exit 1
      ;;
  esac
done

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to cleanup on exit
cleanup() {
    if [ -d "$TEMP_DIR" ]; then
        print_status "Cleaning up temporary directory..."
        rm -rf "$TEMP_DIR"
        print_success "Cleanup completed"
    fi
}

# Set trap to cleanup on exit
trap cleanup EXIT
trap 'print_error "Process interrupted by user"; cleanup; exit 1' INT TERM

# Unhook configuration template
cat > /tmp/unhook_config.yml << 'EOF'
# Unhook Webhook Configuration
#
# For more information, visit: https://docs.unhook.sh/configuration
#
# Copy the following URL in your services:
# https://unhook.sh/wh_seawatts
#
# Optionally, you can attach ?source=Clerk to the URL.
# Clerk: https://unhook.sh/wh_seawatts?source=clerk
# Stripe: https://unhook.sh/wh_seawatts?source=stripe
# etc...
#
# Schema:
#   webhookId: string                    # Unique identifier for your webhook
#   destination:                         # Array of destination endpoints
#     - name: string                     # Name of the endpoint
#       url: string|URL|RemotePattern    # URL to forward webhooks to
#       ping?: boolean|string|URL        # Optional ping configuration
#   delivery:                             # Array of delivery rules
#     - source?: string                  # Optional source filter (default: *)
#       destination: string              # Name of the destination from 'destination' array

# Test Curl:
# curl -X POST https://unhook.sh/wh_seawatts?source=test -H "Content-Type: application/json" -d '{"type": "test.command", "data": { "message": "Hello, world!" }}'

webhookId: wh_seawatts
destination:
  - name: local
    url: http://localhost:3000/api/webhooks
delivery:
  - source: '*'
    destination: local
EOF

# VS Code extensions template
cat > /tmp/vscode_extensions.json << 'EOF'
{
  "recommendations": [
    "unhook.unhook-vscode",
    "ms-vscode.vscode-json",
    "redhat.vscode-yaml"
  ]
}
EOF

if [ "$TEST_MODE" = true ]; then
    if [ -z "$TEST_REPO" ]; then
        print_error "Test mode requires specifying a repository with --repo=repo-name"
        echo "Example: $0 --test --repo=my-test-repo"
        exit 1
    fi

    print_status "🧪 TEST MODE: Adding Unhook to single repository: $TEST_REPO"
    print_status "Starting to add Unhook to repository: $TEST_REPO"

    # Create temp directory
    mkdir -p "$TEMP_DIR"
    cd "$TEMP_DIR"

    # Test mode: process only the specified repository
    echo "$TEST_REPO" > repo_names.txt

else
    print_status "Starting to add Unhook to all repositories for user: $GITHUB_USER"

    # Create temp directory
    mkdir -p "$TEMP_DIR"
    cd "$TEMP_DIR"

    # Check if GitHub CLI is available
    if command -v gh &> /dev/null; then
        print_status "Using GitHub CLI to fetch repositories..."
        gh repo list "$GITHUB_USER" --json name,nameWithOwner,url,defaultBranchRef,isPrivate,isFork --limit 1000 > repos.json

        if [ ! -s repos.json ]; then
            print_error "Failed to fetch repositories with GitHub CLI"
            exit 1
        fi

        # Extract repository names using jq for proper JSON parsing
        jq -r '.[].name' repos.json > repo_names.txt
    else
        print_error "GitHub CLI (gh) is not installed. Please install it first:"
        echo "  macOS: brew install gh"
        echo "  Ubuntu: sudo apt install gh"
        echo "  Or visit: https://cli.github.com/"
        exit 1
    fi
fi

# Count repositories
REPO_COUNT=$(wc -l < repo_names.txt)
print_status "Found $REPO_COUNT repositories"

# Process each repository
while IFS= read -r repo_name; do
    if [ -z "$repo_name" ]; then
        continue
    fi

    echo
    print_status "Processing: $repo_name"

    # Clone or pull repository first to check current state
    if [ -d "$repo_name" ]; then
        print_status "  Repository already exists, pulling latest changes..."
        cd "$repo_name"
        git pull > /dev/null 2>&1
        cd ..
    else
        print_status "  Cloning repository..."
        gh repo clone "$GITHUB_USER/$repo_name"
    fi

    cd "$repo_name"

    # Check if both files already exist and are properly configured
    UNHOOK_EXISTS=false
    VSCODE_EXISTS=false
    NEEDS_CHANGES=false

    # Check if unhook.yml already exists
    if [ -f "unhook.yml" ]; then
        print_warning "  unhook.yml already exists"
        UNHOOK_EXISTS=true
    else
        NEEDS_CHANGES=true
    fi

    # Check if .vscode/extensions.json exists and needs updates
    if [ -f ".vscode/extensions.json" ]; then
        VSCODE_EXISTS=true

        # Check if Unhook extension is already recommended
        if ! grep -q "$UNHOOK_EXTENSION_ID" .vscode/extensions.json; then
            NEEDS_CHANGES=true
        fi
    else
        NEEDS_CHANGES=true
    fi

    # If both files already exist and are properly configured, skip processing
    if [ "$UNHOOK_EXISTS" = true ] && [ "$VSCODE_EXISTS" = true ] && [ "$NEEDS_CHANGES" = false ]; then
        print_status "  Repository already has Unhook configured, skipping..."
        cd ..
        continue
    fi

    # Only ask for confirmation if we actually need to make changes
    if [ "$YES_MODE" != true ]; then
        echo -n "❓ Add Unhook files to '$repo_name'? [y/N]: "
        # Use /dev/tty to ensure we're reading from the terminal, not from stdin
        read -r answer < /dev/tty
        case "${answer}" in
            [Yy]|[Yy][Ee][Ss])
                ;;
            *)
                print_status "  Skipping $repo_name"
                cd ..
                continue
                ;;
        esac
    fi

    # Now actually make the changes
    if [ "$UNHOOK_EXISTS" = false ]; then
        print_status "  Adding unhook.yml..."
        cp /tmp/unhook_config.yml unhook.yml
    fi

    # Update or create .vscode/extensions.json
    if [ -f ".vscode/extensions.json" ]; then
        print_status "  Checking existing .vscode/extensions.json..."

        # Check if Unhook extension is already recommended
        if ! grep -q "$UNHOOK_EXTENSION_ID" .vscode/extensions.json; then
            print_status "  Adding Unhook extension to recommendations..."
            # Add Unhook extension to the beginning of recommendations array
            sed -i.bak 's/"recommendations": \[/"recommendations": [\n    "unhook.unhook-vscode",/' .vscode/extensions.json
            rm -f .vscode/extensions.json.bak
        else
            print_status "  Unhook extension already recommended"
        fi
    else
        print_status "  Creating .vscode/extensions.json..."
        mkdir -p .vscode
        cp /tmp/vscode_extensions.json .vscode/extensions.json
    fi

    # Check if there are any changes to commit (including untracked files)
    if ! git diff --quiet || [ -n "$(git ls-files --others --exclude-standard)" ]; then
        print_status "  Committing changes..."

        # Add all files
        git add . > /dev/null 2>&1

        # Commit with descriptive message
        git commit -m "feat: add Unhook configuration and VS Code extension recommendations

- Add unhook.yml for webhook development setup
- Add VS Code extension recommendations including Unhook extension
- Configure local development environment for webhook testing" > /dev/null 2>&1

        # Push changes
        print_status "  Pushing changes..."
        git push origin "$(git branch --show-current)" > /dev/null 2>&1

        print_success "  Successfully updated $repo_name"
    else
        print_status "  No changes to commit for $repo_name"
    fi

    cd ..

done < repo_names.txt

if [ "$TEST_MODE" = true ]; then
    print_success "Test completed successfully!"
    print_status "💡 If everything looks good, run without --test to process all repositories"
else
    print_success "Completed processing all repositories"
fi

# Cleanup temporary files
rm -f /tmp/unhook_config.yml /tmp/vscode_extensions.json

print_success "Script completed successfully!"
