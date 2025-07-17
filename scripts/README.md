# Unhook Scripts

This directory contains utility scripts for maintaining and cleaning up the Unhook database and user resources.

## Available Scripts

### Organization Cleanup (`cleanup-orgs.ts`)

Removes duplicate organizations for users who have multiple organizations, keeping only the oldest one.

**Usage:**
```bash
# Dry run to see what would be cleaned up
bun run cleanup:orgs:dry-run

# Actually perform the cleanup
bun run cleanup:orgs
```

### Webhook Cleanup (`cleanup-webhooks.ts`)

Removes organizations that have no webhooks and organizations with multiple webhooks (keeping the oldest webhook).

**Usage:**
```bash
# Dry run to see what would be cleaned up
bun run cleanup:webhooks:dry-run

# Actually perform the cleanup
bun run cleanup:webhooks
```

### User Resource Creation (`ensure-user-resources.ts`)

Ensures that every user has at least one organization and one webhook. Creates missing resources in both Clerk and the database.

**Usage:**
```bash
# Dry run to see what would be created
bun run ensure:user-resources:dry-run

# Actually create missing resources
bun run ensure:user-resources
```

## What Each Script Does

### Organization Cleanup
- Finds users with multiple organizations
- Keeps the oldest organization (based on creation date)
- Deletes duplicate organizations from both Clerk and the database
- Removes associated org memberships

### Webhook Cleanup
- Finds organizations without any webhooks and deletes them
- Finds organizations with multiple webhooks and keeps only the oldest one
- Deletes organizations from both Clerk and the database
- Removes associated org memberships

### User Resource Creation
- Finds users without any organizations and creates one for each
- Finds users with organizations but no webhooks and creates a "Default" webhook
- Creates organizations in Clerk with appropriate names (e.g., "Chris's Team")
- Creates organizations in the database with proper relationships
- Creates org memberships with admin role
- Creates webhooks with default configuration

## Safety Features

All scripts include:
- **Dry run mode**: Use `--dry-run` flag to see what would happen without making changes
- **Error handling**: Graceful handling of API failures and database errors
- **Validation**: Post-execution validation to confirm changes were successful
- **Detailed logging**: Clear output showing what actions are being taken

## Prerequisites

- Environment variables must be set up (CLERK_SECRET_KEY, POSTGRES_URL)
- Database connection must be available
- Clerk API access must be configured

## Running Scripts

All scripts can be run using the npm scripts defined in the root `package.json`:

```bash
# Using infisical for environment variables
infisical run -- bun run <script-name>

# Examples:
infisical run -- bun run cleanup:orgs:dry-run
infisical run -- bun run ensure:user-resources
```

## Script Order

When running multiple scripts, consider this order:

1. **User Resource Creation** - Ensure all users have basic resources
2. **Organization Cleanup** - Remove duplicate organizations
3. **Webhook Cleanup** - Remove organizations without webhooks

This ensures that users have the minimum required resources before cleaning up duplicates.