# Docker Development Environment

This directory contains scripts for testing the CLI build process in a Docker environment that matches the GitHub Actions setup.

## Quick Start

1. **Run the interactive Docker environment:**
   ```bash
   ./scripts/docker-dev.sh
   ```

2. **Inside the container, run the build commands:**
   ```bash
   # Option 1: Run the automated build script
   ./scripts/docker-build-commands.sh

   # Option 2: Run commands manually step by step
   bun install
   bun run build
   # ... (see docker-build-commands.sh for full list)
   ```

## Files

- `Dockerfile.dev` - Development Docker image with Node.js, Bun, and dependencies
- `docker-dev.sh` - Script to build and run the interactive Docker container
- `docker-build-commands.sh` - Automated build script to run inside the container

## Manual Testing Steps

Once inside the container (`./scripts/docker-dev.sh`), you can:

1. **Check the environment:**
   ```bash
   node --version
   bun --version
   ls -la
   ```

2. **Install dependencies:**
   ```bash
   bun install
   ```

3. **Build shared packages:**
   ```bash
   bun run build
   ```

4. **Build the CLI binary:**
   ```bash
   export BUN_TARGET="bun-linux-x64"
   export PLATFORM="linux"
   export TARGET="x64"

   bun build apps/cli/src/cli.tsx \
     --compile \
     --target="$BUN_TARGET" \
     --outfile="apps/cli/bin/unhook" \
     --external="react-devtools-core"
   ```

5. **Test the binary:**
   ```bash
   mv apps/cli/bin/unhook apps/cli/bin/unhook-linux-x64
   chmod +x apps/cli/bin/unhook-linux-x64
   ./apps/cli/bin/unhook-linux-x64 --version
   ./apps/cli/bin/unhook-linux-x64 --help
   ```

## Debugging Tips

- If a step fails, you can run each command individually to see the exact error
- Use `ls -la` to check if files were created where expected
- Use `echo $VARIABLE` to check environment variables
- The container mounts your local code, so changes are reflected immediately

## Exit Container

When done testing, simply type:
```bash
exit
```

The container will be automatically removed (`--rm` flag).