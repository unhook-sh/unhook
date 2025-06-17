#!/usr/bin/env node

const os = require('node:os');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

// Get version from package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const version = packageJson.version;
const cliName = 'unhook';

const platformMap = { win32: 'win32', darwin: 'darwin', linux: 'linux' };
const archMap = { x64: 'x64', arm64: 'arm64' };

const platform = platformMap[os.platform()];
const arch = archMap[os.arch()];
const ext = os.platform() === 'win32' ? '.exe' : '';

if (!platform || !arch) {
  console.error(
    `❌ Unsupported platform or architecture: ${os.platform()}-${os.arch()}`,
  );
  console.error(
    'Supported platforms: Windows (x64), macOS (x64, arm64), Linux (x64, arm64)',
  );
  process.exit(1);
}

// For Linux, check if we should use musl variant
let targetArch = arch;
if (platform === 'linux') {
  try {
    // Check for musl by looking for the musl loader
    if (
      fs.existsSync('/lib/ld-musl-x86_64.so.1') ||
      fs.existsSync('/lib/ld-musl-aarch64.so.1')
    ) {
      targetArch = `${arch}-musl`;
    }
  } catch (_err) {
    // If we can't determine, default to glibc variant
  }
}

const binName = `${cliName}-${platform}-${targetArch}${ext}`;
const installDir = path.join(os.homedir(), `.${cliName}/bin`);
const versionedInstallDir = path.join(installDir, version);
const binPath = path.join(versionedInstallDir, binName);

function showInstallInstructions() {
  console.error('💡 To install the CLI binary, run:');
  console.error(`   npm install ${packageJson.name}`);
  console.error(
    '   or try running this command again - the binary will be downloaded automatically.',
  );
}

function runBinary() {
  if (!fs.existsSync(binPath)) {
    console.error(`❌ Binary not found at ${binPath}`);
    console.error(`Expected binary: ${binName}`);
    showInstallInstructions();

    // Try to run the install script automatically
    console.log('🔄 Attempting to download binary automatically...');
    try {
      const installScript = path.join(
        __dirname,
        '..',
        'scripts',
        'install.cjs',
      );
      if (fs.existsSync(installScript)) {
        // Run the install script synchronously
        const installResult = spawnSync(process.execPath, [installScript], {
          stdio: 'inherit',
          env: process.env,
        });
        if (installResult.status === 0) {
          // After installing, try running the binary again
          runBinary();
          return;
        }
        console.error(
          `❌ Auto-download failed with exit code: ${installResult.status}`,
        );
        showInstallInstructions();
        process.exit(1);
      }
    } catch (err) {
      console.error(`❌ Auto-download failed: ${err.message}`);
      showInstallInstructions();
      process.exit(1);
    }
    process.exit(1);
  }

  try {
    // Verify the binary is executable
    fs.accessSync(binPath, fs.constants.X_OK);
  } catch (err) {
    console.error(`❌ Binary is not executable: ${err.message}`);
    try {
      fs.chmodSync(binPath, 0o755);
      console.log('✅ Fixed binary permissions');
    } catch (chmodErr) {
      console.error(`❌ Failed to fix permissions: ${chmodErr.message}`);
      process.exit(1);
    }
  }

  // Execute the binary with all arguments
  const result = spawnSync(binPath, process.argv.slice(2), {
    stdio: 'inherit',
    env: process.env,
  });

  if (result.error) {
    console.error(`❌ Failed to execute binary: ${result.error.message}`);

    if (result.error.code === 'ENOENT') {
      console.error('Binary not found or not executable');
      showInstallInstructions();
    } else if (result.error.code === 'EACCES') {
      console.error('Permission denied when executing binary');
      if (os.platform() === 'darwin') {
        console.error('This may be due to macOS security restrictions.');
        console.error(
          'Try: System Preferences > Security & Privacy > Allow downloaded binary',
        );
      }
    }
    process.exit(1);
  }

  // Exit with the same code as the binary
  process.exit(result.status || 0);
}

runBinary();
