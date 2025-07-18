# Unhook Scripts

This directory contains utility scripts for managing the Unhook platform.

## Scripts

### `ensure-user-resources.ts`

Ensures that all users in the database have the necessary resources for a complete Unhook experience.

#### What it does

This script checks for and creates missing resources for users:

1. **Users in Clerk** - Ensures users exist in the authentication system
2. **Users in Database** - Ensures user records exist in the local database
3. **Organizations** - Creates organizations in both Clerk and database
4. **Stripe Customers** - Creates billing customers in Stripe
5. **API Keys** - Creates API keys for webhook access
6. **Webhooks** - Creates default webhooks for receiving events

#### Usage

```bash
# Run in dry-run mode (recommended first)
bun run scripts/ensure-user-resources.ts --dry-run

# Run to actually create resources
bun run scripts/ensure-user-resources.ts
```

#### Environment Variables

The script requires the following environment variables:

- `CLERK_SECRET_KEY` - Clerk secret key for user management
- `POSTGRES_URL` - Database connection string
- `STRIPE_SECRET_KEY` - Stripe secret key for customer creation

#### When to use

- After database migrations that might leave users without resources
- When setting up a new environment
- When troubleshooting missing user resources
- As part of deployment scripts to ensure data consistency

#### Safety

- Always run with `--dry-run` first to see what would be created
- The script is idempotent - it won't create duplicate resources
- It uses upsert operations to handle existing data gracefully

### Other Scripts

Additional scripts may be added to this directory for other maintenance tasks.