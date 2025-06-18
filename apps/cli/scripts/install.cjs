#!/usr/bin/env node

// @biome-ignore file
// @ts-nocheck

// Prevent recursive execution - check this first before doing anything else
if (process.env.UNHOOK_CLI_LAUNCHED === '1') {
  console.error('❌ Recursive execution detected. Exiting.');
  process.exit(1);
}

const os = require('node:os');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync, execSync } = require('node:child_process');
const https = require('node:https');

// This is replaced by the version in the package.json by the build script tooling/npm/prepare-publish.js
let version = 'unknown';

// Check for environment variable override first (for testing)
if (process.env.UNHOOK_CLI_VERSION) {
  version = process.env.UNHOOK_CLI_VERSION;
  console.debug(`🔧 Using version from environment: ${version}`);
} else {
  try {
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    console.debug(`📁 Reading package.json from: ${packageJsonPath}`);
    version = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')).version;
  } catch (err) {
    const customMessage = `FATAL: Could not read package.json for version info.\nReason: ${err.message}\nMake sure package.json exists and is accessible at: ${packageJsonPath}`;
    throw new Error(customMessage);
  }
}

const repo = 'unhook-sh/unhook';
const cliName = 'unhook';
const platformMap = { win32: 'win32', darwin: 'darwin', linux: 'linux' };
const archMap = {
  x64: 'x64',
  arm64: 'arm64',
  // Add musl variants for Linux
  'x64-musl': 'x64-musl',
  'arm64-musl': 'arm64-musl',
};

const platform = platformMap[os.platform()];
const arch = archMap[os.arch()];
const ext = os.platform() === 'win32' ? '.exe' : '';

if (!platform || !arch) {
  console.error(
    `❌ Unsupported platform or arch: ${os.platform()}-${os.arch()}`,
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
// Ensure version has 'v' prefix for GitHub releases
const versionTag = version.startsWith('v') ? version : `v${version}`;
const url = `https://github.com/${repo}/releases/download/${versionTag}/${binName}`;

const installDir = path.join(os.homedir(), `.${cliName}/bin`);
const versionedInstallDir = path.join(installDir, versionTag);
const binPath = path.join(versionedInstallDir, binName);

function clearOldVersions() {
  if (!fs.existsSync(installDir)) return;

  try {
    const versions = fs.readdirSync(installDir);
    for (const oldVersion of versions) {
      // Skip if it's the current version (compare with versionTag, not raw version)
      if (oldVersion === versionTag) continue;

      const oldVersionPath = path.join(installDir, oldVersion);
      console.debug(`🧹 Clearing old version: ${oldVersion}`);
      fs.rmSync(oldVersionPath, { recursive: true, force: true });
    }
  } catch (err) {
    console.debug(`⚠️  Warning: Could not clear old versions: ${err.message}`);
  }
}

function ensureInstallDir() {
  if (!fs.existsSync(installDir)) {
    console.debug(`📁 Creating installation directory: ${installDir}`);
    try {
      fs.mkdirSync(installDir, { recursive: true });
    } catch (err) {
      if (err.code === 'EACCES') {
        console.error(`❌ Permission denied creating directory: ${installDir}`);
        console.error(
          'Please run the installer with appropriate permissions or create the directory manually:',
        );
        if (os.platform() !== 'win32') {
          console.error(`  sudo mkdir -p ${installDir}`);
          console.error(`  sudo chown $(whoami) ${installDir}`);
        }
        process.exit(1);
      }
      throw err;
    }
  }
}

function downloadBinary(cb) {
  console.debug(
    `🔍 Checking for binary at: ${binPath} (version: ${versionTag})`,
  );
  if (fs.existsSync(binPath)) {
    console.debug(
      `✅ Binary already exists at ${binPath} (version: ${versionTag})`,
    );
    return cb();
  }

  ensureInstallDir();

  if (!fs.existsSync(versionedInstallDir)) {
    console.debug(
      `📁 Creating versioned installation directory: ${versionedInstallDir}`,
    );
    fs.mkdirSync(versionedInstallDir, { recursive: true });
  }

  clearOldVersions();

  const file = fs.createWriteStream(binPath);
  console.log(`⬇️  Downloading ${binName} from GitHub releases...`);
  console.debug(`URL: ${url}`);

  let _didDownload = false;

  const request = https.get(url, (res) => {
    console.debug(`Response status: ${res.statusCode}`);
    if (res.statusCode === 302 || res.statusCode === 301) {
      // Follow redirect
      const redirectUrl = res.headers.location;
      console.debug(`Following redirect to ${redirectUrl}`);
      https
        .get(redirectUrl, (redirectRes) => {
          console.debug(`Redirect response status: ${redirectRes.statusCode}`);
          if (redirectRes.statusCode !== 200) {
            console.error(`❌ Download failed: ${redirectRes.statusCode}`);
            if (redirectRes.statusCode === 404) {
              console.error(`Binary not found: ${binName}`);
              console.error('This may be because:');
              console.error('- The binary for your platform is not available');
              console.error('- The version has not been released yet');
              console.error(
                `- Check releases at: https://github.com/${repo}/releases`,
              );
            }
            process.exit(1);
          }
          redirectRes.pipe(file);
          file.on('finish', () => {
            _didDownload = true;
            file.close();
            setBinaryPermissions();
            console.log(`✅ Successfully downloaded and installed ${binName}`);
            cb();
          });
        })
        .on('error', (err) => {
          console.error(`❌ Download error: ${err.message}`);
          process.exit(1);
        });
    } else if (res.statusCode !== 200) {
      console.error(`❌ Download failed: ${res.statusCode}`);
      if (res.statusCode === 404) {
        console.error(`Binary not found: ${binName}`);
        console.error('This may be because:');
        console.error('- The binary for your platform is not available');
        console.error('- The version has not been released yet');
        console.error(
          `- Check releases at: https://github.com/${repo}/releases`,
        );
      }
      process.exit(1);
    } else {
      res.pipe(file);
      file.on('finish', () => {
        _didDownload = true;
        file.close();
        setBinaryPermissions();
        console.log(`✅ Successfully downloaded and installed ${binName}`);
        cb();
      });
    }
  });

  request.on('error', (err) => {
    console.error(`❌ Download error: ${err.message}`);
    if (err.code === 'ENOTFOUND') {
      console.error(
        'Network error: Could not connect to GitHub. Please check your internet connection.',
      );
    }
    process.exit(1);
  });

  // Add timeout for the request
  request.setTimeout(30000, () => {
    console.error(
      '❌ Download timeout: The download took too long. Please try again.',
    );
    process.exit(1);
  });
}

function setBinaryPermissions() {
  console.debug(`🔧 Setting permissions on ${binPath}`);
  try {
    fs.chmodSync(binPath, 0o755);

    // Remove quarantine attribute on macOS
    if (os.platform() === 'darwin') {
      try {
        execSync(`xattr -d com.apple.quarantine "${binPath}"`, {
          stdio: 'ignore',
        });
        console.debug('🍎 Removed macOS quarantine attribute');
      } catch (err) {
        // Ignore errors if the attribute doesn't exist
        if (!err.message.includes('No such xattr')) {
          console.debug(
            `⚠️  Warning: Failed to remove quarantine attribute: ${err.message}`,
          );
        }
      }
    }
  } catch (err) {
    if (err.code === 'EACCES') {
      console.error(`❌ Permission denied setting permissions on: ${binPath}`);
      console.error(
        'Please run the installer with appropriate permissions or set permissions manually:',
      );
      if (os.platform() !== 'win32') {
        console.error(`  chmod 755 ${binPath}`);
      }
      process.exit(1);
    }
    throw err;
  }
}

function runBinary() {
  if (!fs.existsSync(binPath)) {
    console.error(`❌ Binary not found at ${binPath}`);
    process.exit(1);
  }

  console.debug(`🚀 Running binary from: ${binPath}`);
  console.debug(`Arguments: ${process.argv.slice(2).join(' ')}`);

  try {
    // First verify the binary is executable
    try {
      fs.accessSync(binPath, fs.constants.X_OK);
    } catch (err) {
      console.error(`❌ Binary is not executable: ${err.message}`);
      console.debug('🔧 Attempting to fix permissions...');
      setBinaryPermissions();
    }

    const env = { ...process.env, UNHOOK_CLI_LAUNCHED: '1' };
    const result = spawnSync(binPath, process.argv.slice(2), {
      stdio: 'inherit',
      env,
    });

    if (result.error) {
      console.error(`❌ Failed to execute binary: ${result.error.message}`);
      if (result.error.code === 'ENOENT') {
        console.error('Binary not found or not executable');
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

    if (result.status === null) {
      console.error('❌ Process terminated without exit code');
      process.exit(1);
    }

    process.exit(result.status);
  } catch (error) {
    console.error(`❌ Unexpected error running binary: ${error.message}`);
    process.exit(1);
  }
}

// If this script is being run directly (not required), download and run
if (require.main === module) {
  if (process.env.UNHOOK_CLI_INSTALL_ONLY === '1') {
    downloadBinary(() => {
      console.log('✅ Binary installation complete');
    });
  } else {
    downloadBinary(runBinary);
  }
} else {
  // If required as a module, just download
  downloadBinary(() => {
    console.log('✅ Binary installation complete');
  });
}
