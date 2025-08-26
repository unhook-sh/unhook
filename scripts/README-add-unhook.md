# Add Unhook to All GitHub Repositories

This directory contains scripts to automatically add Unhook configuration files and VS Code extension recommendations to all GitHub repositories for the user `seawatts`.

## What These Scripts Do

1. **Fetch all repositories** from your GitHub account
2. **Add `unhook.yml`** configuration file to each repository (if it doesn't exist)
3. **Add VS Code extension recommendations** including the Unhook extension
4. **Commit and push** all changes automatically

## Test Mode (Recommended)

Before running the scripts on all repositories, it's highly recommended to test on a single repository first:

```bash
# Test on a single repository
./scripts/add-unhook-to-repos.sh --test --repo=my-test-repo

# Or with TypeScript
bun run scripts/add-unhook-to-repos.ts --test --repo=my-test-repo
```

**Benefits of Test Mode:**
- ✅ Verify the script works correctly with your setup
- ✅ Check that the generated files look correct
- ✅ Ensure commits and pushes work as expected
- ✅ Test on a repository you can easily revert if needed
- ✅ Validate the Unhook configuration format

## Prerequisites

### Required
- **GitHub CLI (`gh`)** - Must be installed and authenticated
- **Git** - For cloning and pushing repositories
- **Bun** - For running the TypeScript version (optional)

### GitHub CLI Setup
1. Install GitHub CLI:
   ```bash
   # macOS
   brew install gh

   # Ubuntu/Debian
   sudo apt install gh

   # Windows
   winget install GitHub.cli
   ```

2. Authenticate with GitHub:
   ```bash
   gh auth login
   ```

3. Verify authentication:
   ```bash
   gh auth status
   ```

## Available Scripts

### 1. Shell Script (Recommended)
**File:** `add-unhook-to-repos.sh`

**Usage:**
```bash
# Make executable
chmod +x scripts/add-unhook-to-repos.sh

# Test on a single repository first (recommended)
./scripts/add-unhook-to-repos.sh --test --repo=my-test-repo

# Run on all repositories after testing
./scripts/add-unhook-to-repos.sh
```

**Test Mode Options:**
- `--test` or `-t` - Enable test mode
- `--repo=repo-name` - Specify repository name for testing

**Features:**
- ✅ No dependencies beyond system tools
- ✅ Colored output for better readability
- ✅ Proper error handling and cleanup
- ✅ Handles existing files gracefully
- ✅ Safe to run multiple times

### 2. TypeScript Script
**File:** `add-unhook-to-repos.ts`

**Usage:**
```bash
# Test on a single repository first (recommended)
bun run scripts/add-unhook-to-repos.ts --test --repo=my-test-repo

# Run on all repositories after testing
bun run scripts/add-unhook-to-repos.ts

# Or make executable and run directly
chmod +x scripts/add-unhook-to-repos.ts
./scripts/add-unhook-to-repos.ts --test --repo=my-test-repo
```

**Test Mode Options:**
- `--test` or `-t` - Enable test mode
- `--repo=repo-name` - Specify repository name for testing

**Features:**
- ✅ Type-safe implementation
- ✅ Better error handling
- ✅ Fallback to GitHub API if CLI not available
- ✅ More robust repository processing

## What Gets Added

### 1. `unhook.yml` Configuration
```yaml
# Unhook Webhook Configuration
#
# For more information, visit: https://docs.unhook.sh/configuration
#
# Copy the following URL in your services:
# https://unhook.sh/wh_example
#
# Optionally, you can attach ?source=Clerk to the URL.
# Clerk: https://unhook.sh/wh_example?source=clerk
# Stripe: https://unhook.sh/wh_example?source=stripe
# etc...
#
# Schema:
#   webhookUrl: string                    # Full webhook URL (e.g., https://unhook.sh/org/webhook-name)
#   destination:                         # Array of destination endpoints
#     - name: string                     # Name of the endpoint
#       url: string|URL|RemotePattern    # URL to forward webhooks to
#       ping?: boolean|string|URL        # Optional ping configuration
#   delivery:                             # Array of delivery rules
#     - source?: string                  # Optional source filter (default: *)
#       destination: string              # Name of the destination from 'destination' array

# Test Curl:
# curl -X POST https://unhook.sh/wh_example?source=test -H "Content-Type: application/json" -d '{"type": "test.command", "data": { "message": "Hello, world!" }}'

webhookUrl: https://unhook.sh/your-org/your-webhook-name
destination:
  - name: local
    url: http://localhost:3000/api/webhooks
delivery:
  - source: '*'
    destination: local
```

### 2. `.vscode/extensions.json`
```json
{
  "recommendations": [
    "unhook.unhook-vscode",
    "ms-vscode.vscode-json",
    "redhat.vscode-yaml"
  ]
}
```

## Safety Features

- **No overwrites**: Existing `unhook.yml` files are preserved
- **Smart updates**: Only adds Unhook extension if not already recommended
- **Clean commits**: Creates descriptive commit messages
- **Error handling**: Continues processing other repos if one fails
- **Cleanup**: Automatically removes temporary files and directories
- **Interrupt handling**: Gracefully handles Ctrl+C and process termination

## Output Example

```
🚀 Starting to add Unhook to all repositories for user: seawatts
📋 Using GitHub CLI to fetch repositories...
📋 Found 25 repositories
🎯 Processing 23 non-fork repositories

📁 Processing: my-project
  📥 Cloning repository...
  ➕ Adding unhook.yml...
  ➕ Creating .vscode/extensions.json...
  💾 Committing changes...
  🚀 Pushing changes...
  ✅ Successfully updated my-project

📁 Processing: another-project
  ⚠️  unhook.yml already exists, skipping...
  🔄 Updating existing .vscode/extensions.json...
  💾 Committing changes...
  🚀 Pushing changes...
  ✅ Successfully updated another-project

✅ Completed processing all repositories
🧹 Cleaning up temporary directory...
✅ Cleanup completed
✅ Script completed successfully!
```

## Troubleshooting

### Common Issues

1. **GitHub CLI not authenticated**
   ```bash
   gh auth login
   gh auth status
   ```

2. **Repository access issues**
   - Ensure you have access to all repositories
   - Check if any repos are private and require special permissions

3. **Git push failures**
   - Some repos might have branch protection rules
   - Check if you have write access to the default branch

4. **Rate limiting**
   - GitHub API has rate limits
   - The script processes repos sequentially to avoid overwhelming the API

### Test Mode Issues

If test mode isn't working:

1. **Repository doesn't exist:**
   ```bash
   # Verify the repository exists
   gh repo view seawatts/repo-name
   ```

2. **Permission denied:**
   - Ensure you have write access to the repository
   - Check if the repository has branch protection rules

3. **Git operations fail:**
   - Verify the repository can be cloned: `gh repo clone seawatts/repo-name`
   - Check if the default branch is `main` or `master`

### Manual Override

If you need to process specific repositories manually:

```bash
# Clone a specific repo
gh repo clone seawatts/repo-name

# Add the files manually
cp scripts/templates/unhook.yml repo-name/
mkdir -p repo-name/.vscode
cp scripts/templates/vscode_extensions.json repo-name/.vscode/extensions.json

# Commit and push
cd repo-name
git add .
git commit -m "feat: add Unhook configuration"
git push
```

## Customization

### Modify Configuration Templates

Edit the templates in the scripts to customize:
- Webhook ports and paths
- Provider-specific event types
- Development settings
- Additional VS Code extensions

### Filter Repositories

Modify the scripts to:
- Skip specific repositories by name
- Only process repositories matching certain patterns
- Exclude private repositories
- Process repositories in parallel (with caution)

## Notes

- **Fork repositories are automatically skipped** to avoid conflicts
- **The script is idempotent** - safe to run multiple times
- **Temporary files are created in `/tmp`** and cleaned up automatically
- **All operations are logged** for debugging purposes
- **Git operations use `--quiet` flag** to reduce output noise

## Support

If you encounter issues:
1. Check the prerequisites are met
2. Verify GitHub CLI authentication
3. Check repository access permissions
4. Review the error messages for specific issues
