const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const targetCacheDir = path.resolve(__dirname, '../.cache/puppeteer');
process.env.PUPPETEER_CACHE_DIR = targetCacheDir;

// Potential cache paths that may hold incomplete/corrupted downloads from earlier Render builds
const pathsToClean = [
  '/opt/render/.cache/puppeteer',
  targetCacheDir,
  path.join(process.env.HOME || '/root', '.cache/puppeteer')
];

for (const basePath of pathsToClean) {
  try {
    const chromeDir = path.join(basePath, 'chrome');
    if (fs.existsSync(chromeDir)) {
      const entries = fs.readdirSync(chromeDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const versionDir = path.join(chromeDir, entry.name);
          const execLinux = path.join(versionDir, 'chrome-linux64', 'chrome');
          const execWin = path.join(versionDir, 'chrome-win64', 'chrome.exe');
          const execDirect = path.join(versionDir, 'chrome');
          if (!fs.existsSync(execLinux) && !fs.existsSync(execWin) && !fs.existsSync(execDirect)) {
            console.log(`[Chrome Install] Purging incomplete/corrupted browser cache: ${versionDir}`);
            try {
              fs.rmSync(versionDir, { recursive: true, force: true });
            } catch (e) {
              // ignore cleanup errors
            }
          }
        }
      }
    }
  } catch (err) {
    // non-fatal
  }
}

try {
  fs.mkdirSync(targetCacheDir, { recursive: true });
} catch (e) {
  // ignore
}

// Skip download if a valid Chrome executable is already installed in targetCacheDir
let alreadyInstalled = false;
try {
  const chromeDir = path.join(targetCacheDir, 'chrome');
  if (fs.existsSync(chromeDir)) {
    const entries = fs.readdirSync(chromeDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const versionDir = path.join(chromeDir, entry.name);
        const execLinux = path.join(versionDir, 'chrome-linux64', 'chrome');
        const execWin = path.join(versionDir, 'chrome-win64', 'chrome.exe');
        if (fs.existsSync(execLinux) || fs.existsSync(execWin)) {
          console.log(`[Chrome Install] Valid Chrome already exists at: ${versionDir}`);
          alreadyInstalled = true;
          break;
        }
      }
    }
  }
} catch (e) {
  // ignore
}

if (alreadyInstalled) {
  console.log('[Chrome Install] Chrome is ready. Skipping download.');
  process.exit(0);
}

const cliPath = path.resolve(__dirname, '../node_modules/puppeteer/lib/cjs/puppeteer/node/cli.js');

if (fs.existsSync(cliPath)) {
  console.log(`[Chrome Install] Installing Chrome to: ${targetCacheDir}...`);
  try {
    execFileSync(process.execPath, [cliPath, 'browsers', 'install', 'chrome'], {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'inherit',
      timeout: 300000,
      env: {
        ...process.env,
        PUPPETEER_CACHE_DIR: targetCacheDir
      }
    });
    console.log('[Chrome Install] Chrome installed successfully into project cache.');
  } catch (err) {
    console.warn('[Chrome Install Notice] Chrome download skipped or encountered issue:', err.message);
    console.warn('[Chrome Install Notice] Server will still deploy cleanly; WPPConnect will run in queue mode if Chrome is unavailable.');
  }
} else {
  console.log('[Chrome Install Notice] Puppeteer CLI not found yet. Skipping browser download.');
}

// Always exit 0 so Render npm install never aborts deployment
process.exit(0);
