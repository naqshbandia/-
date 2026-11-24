import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const rootDir = process.cwd();
const androidDir = path.join(rootDir, 'android');
const appDir = path.join(androidDir, 'app');
const resDir = path.join(appDir, 'src', 'main', 'res');

if (!fs.existsSync(appDir)) {
  console.error('Android project folder not found. Run `npx cap add android` first.');
  process.exit(1);
}

// 1. Copy custom MainActivity.java with native DND Settings & Exit bridge
const targetMainActivity = path.join(
  appDir,
  'src',
  'main',
  'java',
  'com',
  'khanqahdarulfalah',
  'app',
  'MainActivity.java'
);
fs.mkdirSync(path.dirname(targetMainActivity), { recursive: true });
fs.copyFileSync(path.join(rootDir, 'android-template', 'MainActivity.java'), targetMainActivity);
console.log('✓ Installed custom MainActivity.java (DND Settings + Exit + DownloadManager)');

// 2. Patch AndroidManifest.xml with cleartext traffic & DND policy access permission
const manifestPath = path.join(appDir, 'src', 'main', 'AndroidManifest.xml');
if (fs.existsSync(manifestPath)) {
  let manifest = fs.readFileSync(manifestPath, 'utf8');
  if (!manifest.includes('ACCESS_NOTIFICATION_POLICY')) {
    manifest = manifest.replace(
      '<uses-permission android:name="android.permission.INTERNET" />',
      '<uses-permission android:name="android.permission.INTERNET" />\n    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />\n    <uses-permission android:name="android.permission.ACCESS_NOTIFICATION_POLICY" />'
    );
  }
  if (!manifest.includes('android:usesCleartextTraffic')) {
    manifest = manifest.replace(
      '<application',
      '<application\n        android:usesCleartextTraffic="true"'
    );
  }
  fs.writeFileSync(manifestPath, manifest, 'utf8');
  console.log('✓ Updated AndroidManifest.xml permissions');
}

// 3. Install official Khanqah Darul Falah launcher icon across mipmap folders
const icon512 = path.join(rootDir, 'public', 'kdf-icon-512-v4.png');
const icon192 = path.join(rootDir, 'public', 'kdf-icon-192-v4.png');
const sourceIcon = fs.existsSync(icon512) ? icon512 : icon192;

if (fs.existsSync(sourceIcon)) {
  const densities = [
    ['mipmap-mdpi', 48],
    ['mipmap-hdpi', 72],
    ['mipmap-xhdpi', 96],
    ['mipmap-xxhdpi', 144],
    ['mipmap-xxxhdpi', 192],
  ];

  // Remove adaptive XML icon wrappers so the full official Khanqah emblem shows cleanly
  const anydpiDir = path.join(resDir, 'mipmap-anydpi-v26');
  if (fs.existsSync(anydpiDir)) {
    fs.rmSync(anydpiDir, { recursive: true, force: true });
  }

  let hasConvert = false;
  try {
    execSync('which convert', { stdio: 'ignore' });
    hasConvert = true;
  } catch {
    hasConvert = false;
  }

  for (const [folder, size] of densities) {
    const outFolder = path.join(resDir, folder);
    fs.mkdirSync(outFolder, { recursive: true });
    for (const fileName of ['ic_launcher.png', 'ic_launcher_round.png']) {
      const destFile = path.join(outFolder, fileName);
      if (hasConvert) {
        execSync(`convert "${sourceIcon}" -resize ${size}x${size} "${destFile}"`);
      } else {
        fs.copyFileSync(sourceIcon, destFile);
      }
    }
  }
  console.log('✓ Applied official Khanqah Darul Falah launcher icons');
}
