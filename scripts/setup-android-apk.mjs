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

// 1. Copy all Java files (MainActivity + Auto-Silent Scheduler & Boot Receivers)
const targetJavaDir = path.join(
  appDir,
  'src',
  'main',
  'java',
  'com',
  'khanqahdarulfalah',
  'app'
);
fs.mkdirSync(targetJavaDir, { recursive: true });

for (const javaFile of [
  'MainActivity.java',
  'PrayerSilentScheduler.java',
  'PrayerSilentReceiver.java',
  'BootReceiver.java',
]) {
  const srcPath = path.join(rootDir, 'android-template', javaFile);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, path.join(targetJavaDir, javaFile));
    console.log(`✓ Installed ${javaFile}`);
  }
}

// 2. Patch AndroidManifest.xml with permissions, cleartext traffic & PrayerSilent receivers
const manifestPath = path.join(appDir, 'src', 'main', 'AndroidManifest.xml');
if (fs.existsSync(manifestPath)) {
  let manifest = fs.readFileSync(manifestPath, 'utf8');

  const requiredPermissions = [
    'android.permission.ACCESS_NETWORK_STATE',
    'android.permission.ACCESS_NOTIFICATION_POLICY',
    'android.permission.RECEIVE_BOOT_COMPLETED',
    'android.permission.SCHEDULE_EXACT_ALARM',
    'android.permission.USE_EXACT_ALARM',
    'android.permission.WAKE_LOCK',
  ];

  const missingPerms = requiredPermissions.filter((perm) => !manifest.includes(perm));
  if (missingPerms.length > 0) {
    const permTags = missingPerms
      .map((perm) => `    <uses-permission android:name="${perm}" />`)
      .join('\n');
    manifest = manifest.replace(
      '<uses-permission android:name="android.permission.INTERNET" />',
      `<uses-permission android:name="android.permission.INTERNET" />\n${permTags}`
    );
  }

  if (!manifest.includes('android:usesCleartextTraffic')) {
    manifest = manifest.replace(
      '<application',
      '<application\n        android:usesCleartextTraffic="true"'
    );
  }

  if (!manifest.includes('PrayerSilentReceiver')) {
    const receiversXml = `
        <receiver
            android:name=".PrayerSilentReceiver"
            android:enabled="true"
            android:exported="false" />

        <receiver
            android:name=".BootReceiver"
            android:enabled="true"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.BOOT_COMPLETED" />
                <action android:name="android.intent.action.QUICKBOOT_POWERON" />
                <action android:name="android.intent.action.MY_PACKAGE_REPLACED" />
                <action android:name="android.intent.action.TIME_SET" />
                <action android:name="android.intent.action.TIMEZONE_CHANGED" />
            </intent-filter>
        </receiver>
    </application>`;
    manifest = manifest.replace('</application>', receiversXml);
  }

  fs.writeFileSync(manifestPath, manifest, 'utf8');
  console.log('✓ Updated AndroidManifest.xml with DND, Exact Alarm & Boot receivers');
}

// 3. Configure Live Over-The-Air (OTA) GitHub Pages URL for automatic customer updates inside APK
const liveWebUrl = (
  process.env.KDF_LIVE_WEB_URL || 'https://naqshbandia.github.io/-/'
).trim();
const escapedLiveUrl = liveWebUrl
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');
const valuesDir = path.join(resDir, 'values');
fs.mkdirSync(valuesDir, { recursive: true });
fs.writeFileSync(
  path.join(valuesDir, 'kdf_ota.xml'),
  `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="kdf_live_web_url" translatable="false">${escapedLiveUrl}</string>
</resources>
`,
  'utf8'
);
console.log(`✓ Configured Live OTA Web URL: ${liveWebUrl}`);

// 4. Build bright, vivid, zoomed & larger Adaptive + Legacy Launcher Icons
const icon512 = path.join(rootDir, 'public', 'kdf-icon-512-v4.png');
const icon192 = path.join(rootDir, 'public', 'kdf-icon-192-v4.png');
const sourceIcon = fs.existsSync(icon512) ? icon512 : icon192;

if (fs.existsSync(sourceIcon)) {
  fs.writeFileSync(
    path.join(valuesDir, 'ic_launcher_background.xml'),
    `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#06542E</color>
</resources>
`,
    'utf8'
  );

  // Adaptive icon XMLs (Android 8+) so launchers render the emblem BIG & bright instead of shrinking into a tiny circle
  const anydpiDir = path.join(resDir, 'mipmap-anydpi-v26');
  fs.mkdirSync(anydpiDir, { recursive: true });
  const adaptiveXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
`;
  fs.writeFileSync(path.join(anydpiDir, 'ic_launcher.xml'), adaptiveXml, 'utf8');
  fs.writeFileSync(path.join(anydpiDir, 'ic_launcher_round.xml'), adaptiveXml, 'utf8');

  let hasConvert = false;
  try {
    execSync('which convert', { stdio: 'ignore' });
    hasConvert = true;
  } catch {
    hasConvert = false;
  }

  // Pre-enhance source image: brighten, boost contrast & golden vibrancy, sharpen, and crop out dark outer border
  const enhancedMaster = path.join(rootDir, 'android', 'kdf-icon-vivid.png');
  if (hasConvert) {
    execSync(
      `convert "${sourceIcon}" -gravity center -crop 88%x88%+0+0 +repage -modulate 118,130,100 -level 2%,95% -sharpen 0x1.5 -resize 512x512! "${enhancedMaster}"`
    );
  } else {
    fs.copyFileSync(sourceIcon, enhancedMaster);
  }

  // Legacy densities (48..192) & Adaptive foreground densities (108..432)
  const densities = [
    ['mipmap-mdpi', 48, 108],
    ['mipmap-hdpi', 72, 162],
    ['mipmap-xhdpi', 96, 216],
    ['mipmap-xxhdpi', 144, 324],
    ['mipmap-xxxhdpi', 192, 432],
  ];

  for (const [folder, legacySize, fgCanvasSize] of densities) {
    const outFolder = path.join(resDir, folder);
    fs.mkdirSync(outFolder, { recursive: true });

    for (const fileName of ['ic_launcher.png', 'ic_launcher_round.png']) {
      const destFile = path.join(outFolder, fileName);
      if (hasConvert) {
        execSync(`convert "${enhancedMaster}" -resize ${legacySize}x${legacySize}! "${destFile}"`);
      } else {
        fs.copyFileSync(enhancedMaster, destFile);
      }
    }

    // Place enhanced emblem cleanly at 72% of adaptive 108dp canvas (~78dp) so it fills the launcher mask boldly
    const fgFile = path.join(outFolder, 'ic_launcher_foreground.png');
    if (hasConvert) {
      const innerSize = Math.round(fgCanvasSize * 0.72);
      execSync(
        `convert "${enhancedMaster}" -resize ${innerSize}x${innerSize}! -gravity center -background none -extent ${fgCanvasSize}x${fgCanvasSize} "${fgFile}"`
      );
    } else {
      fs.copyFileSync(enhancedMaster, fgFile);
    }
  }

  if (fs.existsSync(enhancedMaster)) {
    fs.unlinkSync(enhancedMaster);
  }
  console.log('✓ Applied brighter, sharper, larger Adaptive + Legacy Khanqah Darul Falah icons');
}
