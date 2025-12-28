# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Unhook is an open-source webhook development tool that provides secure webhook forwarding with smart routing, team collaboration, and end-to-end encryption. It allows developers to share a single webhook endpoint while testing locally.

## Key Commands

### Development
```bash
# Install dependencies
bun install

# Start all development servers
bun dev

# Start only the web app
bun dev:next

# Run the CLI
cd apps/cli && bun start

# Run CLI with debug logging
cd apps/cli && bun start:debug
```

### Code Quality
```bash
# Format code
bun format:fix

# Check formatting
bun format

# TypeScript type checking
bun typecheck
```

### Testing
```bash
# Run all tests
bun test

# Run tests for a specific package
cd apps/cli && bun test
```

### Database
```bash
# Generate a new migration
bun db:gen-migration

# Run migrations
bun db:migrate

# Push schema changes (development)
bun db:push

# Seed the database
bun db:seed

# Open Drizzle Studio
bun db:studio
```

### Building & Publishing
```bash
# Build all packages
bun build

# Release packages (interactive mode)
bun run release

# Release packages (dry-run)
bun run release:dry-run

# Release packages (CI mode)
bun run release:ci
```

## Architecture Overview

### Monorepo Structure
- **apps/**: Main applications
  - `cli`: React-based terminal interface using Ink
  - `vscode-extension`: VS Code integration for webhook monitoring
  - `web-app`: Next.js 15 dashboard with tRPC API
- **packages/**: Shared libraries
  - `api`: tRPC router and procedures
  - `db`: Drizzle ORM schema and migrations
  - `ui`: Shared React components
  - `client`: Core webhook handling logic
- **tooling/**: Build configurations and CI/CD

### Key Technologies
- **Runtime**: Bun (package manager and test runner)
- **Monorepo**: Turborepo for orchestration
- **Framework**: Next.js 15 with App Router
- **API**: tRPC for type-safe APIs
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time**: Supabase for WebSocket connections
- **Auth**: Clerk for authentication
- **Styling**: TailwindCSS with shadcn/ui components
- **Code Quality**: Biome for formatting/linting

### Important Patterns

1. **Type-Safe API Layer**: All API calls use tRPC with full type inference from backend to frontend
2. **Real-time Updates**: Webhook events are pushed via Supabase subscriptions
3. **Database Schema**: Located in `packages/db/src/schema.ts` - uses Drizzle ORM with PostgreSQL
4. **Authentication**: Clerk handles user auth with organization support
5. **CLI Architecture**: Built with React + Ink for interactive terminal UI

### Development Guidelines

1. **Code Style**: Enforced by Biome
   - 2-space indentation
   - Single quotes
   - Semicolons required
   - ESM modules only (no CommonJS)

2. **Git Hooks**: Pre-commit formatting and type checking via lefthook

3. **Environment Variables**: Extensive use of env vars for configuration (see `turbo.json` globalEnv section)

4. **Testing**: Use Bun's built-in test runner, tests co-located with components

5. **Database Changes**: Always run `bun db:push` after schema modifications to generate types and update policies

### Working with Specific Features

**CLI Development**:
- Main entry: `apps/cli/src/index.tsx`
- Uses Ink for React-based terminal UI
- Secure credential storage via keytar

**Web App Development**:
- Next.js 15 with App Router
- tRPC API routes in `apps/web-app/src/server/api/`
- Supabase client for real-time features

**VS Code Extension**:
- Entry point: `apps/vscode-extension/src/extension.ts`
- Communicates with CLI via local server

**Database Migrations**:
- Schema in `packages/db/src/schema.ts`
- Migrations in `packages/db/drizzle/`
- Always use `bun db:gen-migration` for new migrations