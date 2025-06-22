# Mac Binary Testing with Docker

This setup allows you to build and test Mac binaries using Docker, replicating the exact GitHub Actions environment while producing Mac-compatible binaries.

## 🚀 Quick Start

### Option 1: Automated Build & Test
```bash
# Build Mac binaries (both ARM64 and x64)
./scripts/docker-build-mac.sh

# Test the appropriate binary for your Mac
./scripts/test-mac-binary.sh
```

### Option 2: Interactive Development
```bash
# Start interactive Docker environment
./scripts/docker-mac-dev.sh

# Inside the container, build manually:
bun install
bun run build
export BUN_TARGET='bun-darwin-arm64'
bun build apps/cli/src/cli.tsx --compile --target="$BUN_TARGET" --outfile="apps/cli/bin/unhook"
cp apps/cli/bin/unhook /output/unhook-darwin-arm64
```

## 📁 Files

- `Dockerfile.mac` - Docker image for cross-compiling Mac binaries
- `docker-build-mac.sh` - Automated script to build both ARM64 and x64 Mac binaries
- `docker-mac-dev.sh` - Interactive Docker environment for debugging builds
- `test-mac-binary.sh` - Test script that auto-detects your Mac architecture

## 🎯 How It Works

1. **Cross-compilation**: Uses Bun's cross-compilation feature to build Mac binaries on Linux
2. **Docker isolation**: Replicates the exact GitHub Actions environment (Ubuntu 22.04 + Node 18 + Bun)
3. **Binary extraction**: Copies built binaries to `./dist/` for local testing
4. **Architecture detection**: Automatically tests the correct binary for your Mac (ARM64 vs x64)

## 🔧 Manual Commands

### Build ARM64 Mac Binary
```bash
export BUN_TARGET='bun-darwin-arm64'
bun build apps/cli/src/cli.tsx \
  --compile \
  --target="$BUN_TARGET" \
  --outfile="apps/cli/bin/unhook" \
  --external="react-devtools-core"
```

### Build x64 Mac Binary
```bash
export BUN_TARGET='bun-darwin-x64'
bun build apps/cli/src/cli.tsx \
  --compile \
  --target="$BUN_TARGET" \
  --outfile="apps/cli/bin/unhook" \
  --external="react-devtools-core"
```

## 🧪 Testing

The `test-mac-binary.sh` script will:
1. **Auto-detect** your Mac architecture (ARM64 vs x64)
2. **Find the appropriate binary** in `./dist/`
3. **Run comprehensive tests**:
   - `--version` command
   - `--help` command
   - Basic startup test

## 🔍 Troubleshooting

### Binary Not Found
```bash
# Make sure you've built the binaries first
./scripts/docker-build-mac.sh
```

### Permission Denied
```bash
# Make binaries executable
chmod +x ./dist/unhook-darwin-*
```

### Wrong Architecture
```bash
# Check your Mac architecture
uname -m

# ARM64 Macs use: ./dist/unhook-darwin-arm64
# Intel Macs use: ./dist/unhook-darwin-x64
```

## 🆚 Comparison with Other Approaches

| Approach | Pros | Cons |
|----------|------|------|
| **Docker Mac Build** | ✅ Exact GitHub Actions environment<br>✅ Cross-platform builds<br>✅ Reproducible<br>✅ Can test locally | ❌ Requires Docker<br>❌ Longer build time |
| **Native Mac Build** | ✅ Fast<br>✅ Direct testing | ❌ Different from CI environment<br>❌ Platform-specific |
| **GitHub Actions** | ✅ Production environment | ❌ Slow feedback loop<br>❌ No local testing |

## 💡 Benefits

- **🔒 Exact environment**: Matches GitHub Actions exactly
- **🍎 Mac-compatible**: Produces real Mac binaries you can test
- **🚀 Fast iteration**: Build and test locally without CI
- **🔧 Debug-friendly**: Interactive mode for troubleshooting
- **📱 Smart detection**: Auto-selects correct binary for your Mac