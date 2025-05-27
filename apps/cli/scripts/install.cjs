#!/usr/bin/env node

// @biome-ignore file
// @ts-nocheck
const os = require('node:os');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
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
const cacheDir = path.join(os.homedir(), `.${cliName}/bin`);
const binPath = path.join(cacheDir, binName);

function downloadBinary(cb) {
  if (fs.existsSync(binPath)) return cb();

  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }

  const file = fs.createWriteStream(binPath);
  console.debug(`Downloading ${url}`);

  const request = https.get(url, (res) => {
    if (res.statusCode === 302 || res.statusCode === 301) {
      // Follow redirect
      const redirectUrl = res.headers.location;
      console.debug(`Following redirect to ${redirectUrl}`);
      https
        .get(redirectUrl, (redirectRes) => {
          if (redirectRes.statusCode !== 200) {
            console.error(`Download failed: ${redirectRes.statusCode}`);
            process.exit(1);
          }
          redirectRes.pipe(file);
          file.on('finish', () => {
            file.close();
            fs.chmodSync(binPath, 0o755);
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
        fs.chmodSync(binPath, 0o755);
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

  const result = spawnSync(binPath, process.argv.slice(2), {
    stdio: 'inherit',
  });
  process.exit(result.status ?? 1);
}

downloadBinary(runBinary);
