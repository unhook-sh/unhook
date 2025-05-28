#!/usr/bin/env node

// @biome-ignore file
// @ts-nocheck
const os = require('node:os');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync, execSync } = require('node:child_process');
const https = require('node:https');

// This is replaced by the version in the package.json by the build script tooling/npm/prepare-publish.js
const version = '{{ PACKAGE_VERSION }}';
const repo = 'unhook-sh/unhook';
const cliName = 'unhook';
const platformMap = { win32: 'windows', darwin: 'darwin', linux: 'linux' };
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
  console.error(`Unsupported platform or arch: ${os.platform()}-${os.arch()}`);
  process.exit(1);
}

// For Linux, check if we should use musl variant
const isMusl =
  platform === 'linux' && fs.existsSync('/lib/ld-musl-x86_64.so.1');
const targetArch = platform === 'linux' && isMusl ? `${arch}-musl` : arch;

const binName = `${cliName}-${platform}-${targetArch}${ext}`;
const url = `https://github.com/${repo}/releases/download/${version}/${binName}`;

// Use /usr/local/bin for macOS, ~/.unhook/bin for other platforms
const installDir = path.join(os.homedir(), `.${cliName}/bin`);
const versionedInstallDir = path.join(installDir, version);
const binPath = path.join(versionedInstallDir, binName);

function clearOldVersions() {
  if (!fs.existsSync(installDir)) return;

  const versions = fs.readdirSync(installDir);
  for (const oldVersion of versions) {
    // Skip if it's not a valid version number (like the placeholder)
    if (!oldVersion.startsWith('v')) continue;
    if (oldVersion !== version) {
      const oldVersionPath = path.join(installDir, oldVersion);
      console.debug(`Clearing old version: ${oldVersion}`);
      fs.rmSync(oldVersionPath, { recursive: true, force: true });
    }
  }
}

function ensureInstallDir() {
  if (!fs.existsSync(installDir)) {
    console.debug(`Creating installation directory: ${installDir}`);
    try {
      fs.mkdirSync(installDir, { recursive: true });
    } catch (err) {
      if (err.code === 'EACCES') {
        console.error(`Permission denied creating directory: ${installDir}`);
        console.error(
          'Please run the installer with sudo or create the directory manually:',
        );
        console.error(`  sudo mkdir -p ${installDir}`);
        console.error(`  sudo chown $(whoami) ${installDir}`);
        process.exit(1);
      }
      throw err;
    }
  }
}

function downloadBinary(cb) {
  if (fs.existsSync(binPath)) {
    console.debug(`Binary already exists at ${binPath}`);
    return cb();
  }

  ensureInstallDir();

  if (!fs.existsSync(versionedInstallDir)) {
    console.debug(
      `Creating versioned installation directory: ${versionedInstallDir}`,
    );
    fs.mkdirSync(versionedInstallDir, { recursive: true });
  }

  clearOldVersions();

  const file = fs.createWriteStream(binPath);
  console.debug(`Downloading from ${url}`);

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
            console.error(`Download failed: ${redirectRes.statusCode}`);
            process.exit(1);
          }
          redirectRes.pipe(file);
          file.on('finish', () => {
            file.close();
            console.debug(
              `Download complete, setting permissions on ${binPath}`,
            );
            try {
              fs.chmodSync(binPath, 0o755);
              // Remove quarantine attribute on macOS
              if (os.platform() === 'darwin') {
                try {
                  execSync(`xattr -d com.apple.quarantine "${binPath}"`);
                } catch (err) {
                  // Ignore errors if the attribute doesn't exist
                  if (!err.message.includes('No such xattr')) {
                    console.warn(
                      `Warning: Failed to remove quarantine attribute: ${err.message}`,
                    );
                  }
                }
              }
            } catch (err) {
              if (err.code === 'EACCES') {
                console.error(
                  `Permission denied setting permissions on: ${binPath}`,
                );
                console.error(
                  'Please run the installer with sudo or set permissions manually:',
                );
                console.error(`  sudo chmod 755 ${binPath}`);
                process.exit(1);
              }
              throw err;
            }
            cb();
          });
        })
        .on('error', (err) => {
          console.error(`Download error: ${err.message}`);
          process.exit(1);
        });
    } else if (res.statusCode !== 200) {
      console.error(`Download failed: ${res.statusCode}`);
      process.exit(1);
    } else {
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        console.debug(`Download complete, setting permissions on ${binPath}`);
        try {
          fs.chmodSync(binPath, 0o755);
          // Remove quarantine attribute on macOS
          if (os.platform() === 'darwin') {
            try {
              execSync(`xattr -d com.apple.quarantine "${binPath}"`);
            } catch (err) {
              // Ignore errors if the attribute doesn't exist
              if (!err.message.includes('No such xattr')) {
                console.warn(
                  `Warning: Failed to remove quarantine attribute: ${err.message}`,
                );
              }
            }
          }
        } catch (err) {
          if (err.code === 'EACCES') {
            console.error(
              `Permission denied setting permissions on: ${binPath}`,
            );
            console.error(
              'Please run the installer with sudo or set permissions manually:',
            );
            console.error(`  sudo chmod 755 ${binPath}`);
            process.exit(1);
          }
          throw err;
        }
        cb();
      });
    }
  });

  request.on('error', (err) => {
    console.error(`Download error: ${err.message}`);
    process.exit(1);
  });
}

function runBinary() {
  if (!fs.existsSync(binPath)) {
    console.error(`Binary not found at ${binPath}`);
    process.exit(1);
  }

  console.debug(`Running binary from: ${binPath}`);
  console.debug(`Arguments: ${process.argv.slice(2).join(' ')}`);

  try {
    // First verify the binary is executable
    try {
      fs.accessSync(binPath, fs.constants.X_OK);
    } catch (err) {
      console.error(`Binary is not executable: ${err.message}`);
      console.debug('Attempting to fix permissions...');
      fs.chmodSync(binPath, 0o755);
    }

    // Check if we're on macOS and if SIP is enabled
    if (os.platform() === 'darwin') {
      try {
        const sipStatus = execSync('csrutil status').toString().trim();
        if (sipStatus.includes('enabled')) {
          console.warn(
            'Warning: System Integrity Protection (SIP) is enabled on macOS.',
          );
          console.warn('This may prevent the binary from running properly.');
          console.warn(
            'You may need to run the binary from a location outside of protected directories.',
          );
          console.warn(
            'Consider installing to a different location or temporarily disabling SIP.',
          );
        }
      } catch (_err) {
        // Ignore errors checking SIP status
      }
    }

    const result = spawnSync(binPath, process.argv.slice(2), {
      stdio: 'inherit',
      env: process.env,
    });

    if (result.error) {
      console.error(`Failed to execute binary: ${result.error.message}`);
      if (result.error.code === 'ENOENT') {
        console.error('Binary not found or not executable');
      } else if (result.error.code === 'EACCES') {
        console.error('Permission denied when executing binary');
        if (os.platform() === 'darwin') {
          console.error('This may be due to macOS security restrictions.');
          console.error(
            'Try running the binary from a different location or check System Preferences > Security & Privacy.',
          );
        }
      }
      process.exit(1);
    }

    if (result.status === null) {
      console.error('Process terminated without exit code');
      process.exit(1);
    }

    process.exit(result.status);
  } catch (error) {
    console.error(`Unexpected error running binary: ${error.message}`);
    process.exit(1);
  }
}

downloadBinary(runBinary);
