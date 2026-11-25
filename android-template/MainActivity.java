package com.khanqahdarulfalah.app;

import android.app.DownloadManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.NetworkInfo;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.Settings;
import android.webkit.DownloadListener;
import android.webkit.JavascriptInterface;
import android.webkit.URLUtil;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.Toast;

import androidx.activity.OnBackPressedCallback;

import com.getcapacitor.BridgeActivity;

import org.json.JSONObject;

import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class MainActivity extends BridgeActivity {

    private static final String DEFAULT_LIVE_WEB_URL = "https://naqshbandia.github.io/-/";
    private static final String OTA_PREFS_NAME = "kdf_ota_prefs";
    private static final String KEY_LAST_OTA_FINGERPRINT = "last_ota_fingerprint";
    private static final long OTA_CHECK_INTERVAL_MS = 10 * 60 * 1000L;

    private final ExecutorService otaExecutor = Executors.newSingleThreadExecutor();
    private volatile long lastOtaCheckAtMs = 0L;
    private volatile boolean otaCheckInFlight = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if (this.bridge != null && this.bridge.getWebView() != null) {
            WebView webView = this.bridge.getWebView();
            WebSettings settings = webView.getSettings();
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);
            settings.setJavaScriptEnabled(true);
            settings.setCacheMode(WebSettings.LOAD_DEFAULT);
            settings.setMediaPlaybackRequiresUserGesture(false);

            webView.addJavascriptInterface(new KhanqahNativeBridge(), "Android");

            webView.setDownloadListener(new DownloadListener() {
                @Override
                public void onDownloadStart(
                    String url,
                    String userAgent,
                    String contentDisposition,
                    String mimetype,
                    long contentLength
                ) {
                    if (url == null) return;
                    if (url.startsWith("http://") || url.startsWith("https://")) {
                        try {
                            DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
                            request.setMimeType(mimetype);
                            request.addRequestHeader("User-Agent", userAgent);
                            String fileName = URLUtil.guessFileName(url, contentDisposition, mimetype);
                            request.setTitle(fileName);
                            request.setDescription("Khanqah Darul Falah");
                            request.setNotificationVisibility(
                                DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED
                            );
                            request.setDestinationInExternalPublicDir(
                                Environment.DIRECTORY_DOWNLOADS,
                                fileName
                            );
                            DownloadManager dm =
                                (DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE);
                            if (dm != null) {
                                dm.enqueue(request);
                                Toast.makeText(
                                    MainActivity.this,
                                    "ڈاؤنلوڈ شروع ہو گیا: " + fileName,
                                    Toast.LENGTH_SHORT
                                ).show();
                            }
                        } catch (Exception e) {
                            try {
                                Intent viewIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                                startActivity(viewIntent);
                            } catch (Exception ignored) {
                            }
                        }
                    }
                }
            });

            // Forward Android hardware/gesture Back button into the app's step-by-step & double-back Exit system
            getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
                @Override
                public void handleOnBackPressed() {
                    WebView wv = MainActivity.this.bridge != null
                        ? MainActivity.this.bridge.getWebView()
                        : null;
                    if (wv != null) {
                        wv.evaluateJavascript(
                            "(function(){ if (typeof window.__kdfHandleNativeBack === 'function') { window.__kdfHandleNativeBack(); return 'HANDLED'; } return 'NONE'; })()",
                            result -> {
                                if (result != null && result.contains("NONE")) {
                                    finish();
                                }
                            }
                        );
                    } else {
                        finish();
                    }
                }
            });

            // Immediately sync latest live updates from GitHub Pages (falls back cleanly to offline bundle)
            checkAndLoadLiveUpdate(true);
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        // Re-arm alarms whenever user returns from Android Settings after granting DND permission
        PrayerSilentScheduler.scheduleAll(this);
        if (this.bridge != null && this.bridge.getWebView() != null) {
            this.bridge.getWebView().evaluateJavascript(
                "window.dispatchEvent(new CustomEvent('kdf-native-resume'));",
                null
            );
        }
        checkAndLoadLiveUpdate(false);
    }

    @Override
    public void onDestroy() {
        otaExecutor.shutdownNow();
        super.onDestroy();
    }

    private String getLiveWebUrl() {
        try {
            int resId = getResources().getIdentifier("kdf_live_web_url", "string", getPackageName());
            if (resId != 0) {
                String val = getString(resId);
                if (val != null && val.startsWith("https://")) {
                    return val.endsWith("/") ? val : val + "/";
                }
            }
        } catch (Exception ignored) {
        }
        return DEFAULT_LIVE_WEB_URL;
    }

    private boolean isNetworkAvailable() {
        try {
            ConnectivityManager cm =
                (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
            if (cm == null) return false;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                Network active = cm.getActiveNetwork();
                if (active == null) return false;
                NetworkCapabilities caps = cm.getNetworkCapabilities(active);
                return caps != null && caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET);
            } else {
                NetworkInfo info = cm.getActiveNetworkInfo();
                return info != null && info.isConnected();
            }
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Live Over-The-Air (OTA) Updater:
     * Checks GitHub Pages quickly in background.
     * - When online & GitHub Pages is healthy (HTTP 200), automatically loads the latest GitHub Pages build
     *   inside this WebView so customers receive every future update without reinstalling the APK.
     * - When offline or unreachable, keeps using the APK's baked-in offline bundle smoothly.
     */
    private void checkAndLoadLiveUpdate(boolean forceCheck) {
        long now = System.currentTimeMillis();
        if (otaCheckInFlight) return;
        if (!forceCheck && (now - lastOtaCheckAtMs) < OTA_CHECK_INTERVAL_MS) return;
        if (!isNetworkAvailable()) return;

        otaCheckInFlight = true;
        lastOtaCheckAtMs = now;
        final String liveUrl = getLiveWebUrl();
        final String probeUrl = liveUrl + "index.html?_kdf_ota=" + now;

        otaExecutor.execute(() -> {
            HttpURLConnection conn = null;
            try {
                URL url = new URL(probeUrl);
                conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("HEAD");
                conn.setConnectTimeout(2500);
                conn.setReadTimeout(2500);
                conn.setUseCaches(false);
                conn.setInstanceFollowRedirects(true);
                conn.setRequestProperty("Cache-Control", "no-cache");

                int code = conn.getResponseCode();
                if (code == HttpURLConnection.HTTP_BAD_METHOD || code == HttpURLConnection.HTTP_NOT_IMPLEMENTED) {
                    conn.disconnect();
                    conn = (HttpURLConnection) url.openConnection();
                    conn.setRequestMethod("GET");
                    conn.setConnectTimeout(2500);
                    conn.setReadTimeout(2500);
                    conn.setUseCaches(false);
                    code = conn.getResponseCode();
                }

                String contentType = conn.getContentType();
                if (code == HttpURLConnection.HTTP_OK &&
                    (contentType == null || contentType.toLowerCase().contains("text/html"))) {

                    String etag = conn.getHeaderField("ETag");
                    String lastMod = conn.getHeaderField("Last-Modified");
                    String contentLen = conn.getHeaderField("Content-Length");
                    final String fingerprint =
                        (etag != null ? etag : "") + "|" +
                        (lastMod != null ? lastMod : "") + "|" +
                        (contentLen != null ? contentLen : "");

                    SharedPreferences prefs = getSharedPreferences(OTA_PREFS_NAME, MODE_PRIVATE);
                    String prevFingerprint = prefs.getString(KEY_LAST_OTA_FINGERPRINT, "");
                    final boolean hasNewVersion =
                        !fingerprint.equals("||") && !fingerprint.equals(prevFingerprint);

                    if (hasNewVersion) {
                        prefs.edit().putString(KEY_LAST_OTA_FINGERPRINT, fingerprint).apply();
                    }

                    runOnUiThread(() -> {
                        if (isFinishing() || isDestroyed()) return;
                        WebView wv = MainActivity.this.bridge != null
                            ? MainActivity.this.bridge.getWebView()
                            : null;
                        if (wv == null) return;

                        String currentUrl = wv.getUrl();
                        boolean alreadyOnLive = currentUrl != null && currentUrl.startsWith(liveUrl);

                        if (!alreadyOnLive || hasNewVersion) {
                            if (hasNewVersion) {
                                wv.clearCache(false);
                            }
                            wv.loadUrl(liveUrl);
                        }
                    });
                }
            } catch (Exception ignored) {
                // Offline or slow connection: keep running seamlessly on local APK dist bundle
            } finally {
                if (conn != null) {
                    try {
                        conn.disconnect();
                    } catch (Exception ignored) {
                    }
                }
                otaCheckInFlight = false;
            }
        });
    }

    private void launchSettingsIntent(String action) {
        Intent intent = new Intent(action);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        startActivity(intent);
    }

    public class KhanqahNativeBridge {

        @JavascriptInterface
        public boolean isNativeAndroid() {
            return true;
        }

        @JavascriptInterface
        public void checkLiveUpdate() {
            checkAndLoadLiveUpdate(true);
        }

        @JavascriptInterface
        public boolean isDndPermissionGranted() {
            return PrayerSilentScheduler.hasDndPermission(MainActivity.this);
        }

        @JavascriptInterface
        public boolean hasExactAlarmPermission() {
            return PrayerSilentScheduler.hasExactAlarmPermission(MainActivity.this);
        }

        @JavascriptInterface
        public void requestDndPermission() {
            runOnUiThread(() -> {
                try {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                        Toast.makeText(
                            MainActivity.this,
                            "فہرست میں 'Khanqah Darul Falah' کو آن (Allow) کر کے واپس آئیں",
                            Toast.LENGTH_LONG
                        ).show();
                        launchSettingsIntent(Settings.ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS);
                        return;
                    }
                    launchSettingsIntent(Settings.ACTION_SOUND_SETTINGS);
                } catch (Exception e) {
                    try {
                        launchSettingsIntent(Settings.ACTION_SETTINGS);
                    } catch (Exception ignored) {
                    }
                }
            });
        }

        @JavascriptInterface
        public void requestExactAlarmPermission() {
            runOnUiThread(() -> {
                try {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                        Intent intent = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM);
                        intent.setData(Uri.parse("package:" + getPackageName()));
                        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        startActivity(intent);
                    }
                } catch (Exception ignored) {
                }
            });
        }

        @JavascriptInterface
        public String saveAutoSilentSchedule(String jsonConfig) {
            PrayerSilentScheduler.saveConfigAndSchedule(MainActivity.this, jsonConfig);
            if (!PrayerSilentScheduler.hasDndPermission(MainActivity.this)) {
                return "NO_PERMISSION";
            }
            return "OK";
        }

        @JavascriptInterface
        public String getAutoSilentStatus() {
            try {
                JSONObject obj = new JSONObject();
                obj.put("isNative", true);
                obj.put("dndGranted", PrayerSilentScheduler.hasDndPermission(MainActivity.this));
                obj.put("exactAlarmGranted", PrayerSilentScheduler.hasExactAlarmPermission(MainActivity.this));
                obj.put("enabled", PrayerSilentScheduler.isMasterEnabled(MainActivity.this));
                obj.put("activeCount", PrayerSilentScheduler.getActiveScheduledCount(MainActivity.this));
                return obj.toString();
            } catch (Exception e) {
                return "{\"isNative\":true,\"dndGranted\":false,\"exactAlarmGranted\":true,\"enabled\":false,\"activeCount\":0}";
            }
        }

        @JavascriptInterface
        public boolean setSilentNow(boolean silent) {
            return PrayerSilentScheduler.applySilentState(MainActivity.this, silent);
        }

        @JavascriptInterface
        public void openDndSettings() {
            runOnUiThread(() -> {
                try {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                        try {
                            launchSettingsIntent(Settings.ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS);
                            return;
                        } catch (Exception ignored) {
                        }
                        try {
                            launchSettingsIntent("android.settings.ZEN_MODE_SETTINGS");
                            return;
                        } catch (Exception ignored) {
                        }
                    }
                    launchSettingsIntent(Settings.ACTION_SOUND_SETTINGS);
                } catch (Exception e) {
                    try {
                        launchSettingsIntent(Settings.ACTION_SETTINGS);
                    } catch (Exception ignored) {
                    }
                }
            });
        }

        @JavascriptInterface
        public void openAutoSilentSettings() {
            openDndSettings();
        }

        @JavascriptInterface
        public void openSoundSettings() {
            runOnUiThread(() -> {
                try {
                    launchSettingsIntent(Settings.ACTION_SOUND_SETTINGS);
                } catch (Exception e) {
                    try {
                        launchSettingsIntent(Settings.ACTION_SETTINGS);
                    } catch (Exception ignored) {
                    }
                }
            });
        }

        @JavascriptInterface
        public void exitApp() {
            runOnUiThread(() -> {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    finishAndRemoveTask();
                } else {
                    finishAffinity();
                }
            });
        }
    }
}
