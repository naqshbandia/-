package com.khanqahdarulfalah.app;

import android.app.DownloadManager;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.net.ConnectivityManager;
import android.net.LinkProperties;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.NetworkInfo;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.PowerManager;
import android.provider.Settings;
import android.webkit.DownloadListener;
import android.webkit.JavascriptInterface;
import android.webkit.URLUtil;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.Toast;

import androidx.activity.OnBackPressedCallback;
import androidx.core.content.FileProvider;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class MainActivity extends BridgeActivity {

    private static final String DEFAULT_LIVE_WEB_URL = "https://naqshbandia.github.io/-/";
    private static final String DEFAULT_APK_VERSION_JSON_URL =
        "https://github.com/naqshbandia/-/releases/download/apk-latest/apk-version.json";
    private static final String DEFAULT_APK_DOWNLOAD_URL =
        "https://github.com/naqshbandia/-/releases/download/apk-latest/Khanqah-Darul-Falah.apk";
    private static final String LOCAL_BUNDLE_URL = "http://localhost/";
    private static final String OTA_PREFS_NAME = "kdf_ota_prefs";
    private static final String KEY_LAST_OTA_FINGERPRINT = "last_ota_fingerprint";
    private static final String KEY_NOTIF_PERM_ASKED = "notif_perm_asked";
    private static final long OTA_CHECK_INTERVAL_MS = 10 * 60 * 1000L;

    private final ExecutorService otaExecutor = Executors.newSingleThreadExecutor();
    private final ExecutorService apkUpdateExecutor = Executors.newSingleThreadExecutor();
    private volatile long lastOtaCheckAtMs = 0L;
    private volatile boolean otaCheckInFlight = false;
    private volatile boolean apkCheckInFlight = false;
    private volatile boolean apkDownloadInFlight = false;
    private volatile boolean pendingApkInstallOnResume = false;
    private volatile String pendingApkUrl = DEFAULT_APK_DOWNLOAD_URL;
    private volatile String availableApkVersionName = "";
    private volatile long availableApkVersionCode = 0L;

    private static final int REQ_CODE_POST_NOTIFICATIONS = 7001;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        KhanqahNotificationHelper.ensureChannels(this);
        requestNotificationPermissionIfNeeded();
        KhanqahNotificationHelper.schedulePeriodicChecks(this);

        if (this.bridge != null && this.bridge.getWebView() != null) {
            WebView webView = this.bridge.getWebView();
            WebSettings settings = webView.getSettings();
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);
            settings.setJavaScriptEnabled(true);
            settings.setCacheMode(WebSettings.LOAD_DEFAULT);
            settings.setMediaPlaybackRequiresUserGesture(false);

            webView.setWebViewClient(new BridgeWebViewClient(this.bridge) {
                @Override
                public void onReceivedError(
                    WebView view,
                    WebResourceRequest request,
                    WebResourceError error
                ) {
                    if (request != null && request.isForMainFrame()) {
                        String failUrl = request.getUrl() != null ? request.getUrl().toString() : "";
                        if (!failUrl.startsWith(LOCAL_BUNDLE_URL)) {
                            view.post(() -> view.loadUrl(LOCAL_BUNDLE_URL));
                            return;
                        }
                    }
                    super.onReceivedError(view, request, error);
                }

                @Override
                public void onReceivedHttpError(
                    WebView view,
                    WebResourceRequest request,
                    WebResourceResponse errorResponse
                ) {
                    if (request != null && request.isForMainFrame() && errorResponse != null
                        && errorResponse.getStatusCode() >= 400) {
                        String failUrl = request.getUrl() != null ? request.getUrl().toString() : "";
                        if (!failUrl.startsWith(LOCAL_BUNDLE_URL)) {
                            view.post(() -> view.loadUrl(LOCAL_BUNDLE_URL));
                            return;
                        }
                    }
                    super.onReceivedHttpError(view, request, errorResponse);
                }

                @Override
                public void onPageFinished(WebView view, String url) {
                    super.onPageFinished(view, url);
                    if (url != null && !url.startsWith(LOCAL_BUNDLE_URL)) {
                        String t = view.getTitle();
                        if (t != null && (t.contains("404") || t.contains("Page not found") || t.contains("Webpage not available"))) {
                            view.loadUrl(LOCAL_BUNDLE_URL);
                        }
                    }
                }
            });

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
        }
    }

    @Override
    public void onStart() {
        super.onStart();
        if (this.bridge != null && this.bridge.getWebView() != null) {
            this.bridge.getWebView().postDelayed(() -> checkAndLoadLiveUpdate(true, false), 350L);
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        // Reconcile DND state (auto-exit if prayer ended while asleep) & re-arm alarms
        PrayerSilentScheduler.reconcileAndScheduleAll(this, false);
        KhanqahNotificationHelper.ensureChannels(this);

        WebView wv = this.bridge != null ? this.bridge.getWebView() : null;
        if (wv != null) {
            String curTitle = wv.getTitle();
            String curUrl = wv.getUrl();
            boolean isBrokenPage =
                (curTitle != null && (curTitle.contains("404") || curTitle.contains("Page not found") || curTitle.contains("Webpage not available")));
            boolean offlineOnRemote =
                !isNetworkAvailable() && curUrl != null && !curUrl.startsWith(LOCAL_BUNDLE_URL);
            if (isBrokenPage || offlineOnRemote) {
                wv.loadUrl(LOCAL_BUNDLE_URL);
            }
            wv.evaluateJavascript(
                "window.dispatchEvent(new CustomEvent('kdf-native-resume'));",
                null
            );
            boolean onLive = curUrl != null && curUrl.startsWith(getLiveWebUrl());
            checkAndLoadLiveUpdate(!onLive, false);
        } else {
            checkAndLoadLiveUpdate(false, false);
        }
        KhanqahNotificationHelper.checkRemoteUpdatesAsync(this, false);
        checkApkUpdateAsync(false);

        if (pendingApkInstallOnResume) {
            pendingApkInstallOnResume = false;
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O || getPackageManager().canRequestPackageInstalls()) {
                startApkSelfDownloadAndInstall(pendingApkUrl);
            }
        } else if (!apkDownloadInFlight) {
            emitJsEvent("kdf-apk-download-progress", "{\"progress\":0,\"status\":\"idle\"}");
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQ_CODE_POST_NOTIFICATIONS) {
            boolean granted =
                grantResults != null
                    && grantResults.length > 0
                    && grantResults[0] == PackageManager.PERMISSION_GRANTED;
            if (granted) {
                KhanqahNotificationHelper.ensureChannels(this);
                KhanqahNotificationHelper.sendWelcomeNotificationOnce(this);
            }
            if (this.bridge != null && this.bridge.getWebView() != null) {
                this.bridge.getWebView().evaluateJavascript(
                    "window.dispatchEvent(new CustomEvent('kdf-native-resume'));",
                    null
                );
            }
        }
    }

    private void requestNotificationPermissionIfNeeded() {
        if (Build.VERSION.SDK_INT >= 33) {
            if (checkSelfPermission("android.permission.POST_NOTIFICATIONS")
                != PackageManager.PERMISSION_GRANTED) {
                getSharedPreferences(OTA_PREFS_NAME, MODE_PRIVATE)
                    .edit()
                    .putBoolean(KEY_NOTIF_PERM_ASKED, true)
                    .apply();
                requestPermissions(
                    new String[]{"android.permission.POST_NOTIFICATIONS"},
                    REQ_CODE_POST_NOTIFICATIONS
                );
            } else {
                KhanqahNotificationHelper.sendWelcomeNotificationOnce(this);
            }
        }
    }

    @Override
    public void onDestroy() {
        otaExecutor.shutdownNow();
        apkUpdateExecutor.shutdownNow();
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

    private String getApkVersionJsonUrl() {
        try {
            int resId = getResources().getIdentifier("kdf_apk_version_json_url", "string", getPackageName());
            if (resId != 0) {
                String val = getString(resId);
                if (val != null && val.startsWith("https://")) {
                    return val;
                }
            }
        } catch (Exception ignored) {
        }
        return DEFAULT_APK_VERSION_JSON_URL;
    }

    private String getApkDownloadUrl() {
        try {
            int resId = getResources().getIdentifier("kdf_apk_download_url", "string", getPackageName());
            if (resId != 0) {
                String val = getString(resId);
                if (val != null && val.startsWith("https://")) {
                    return val;
                }
            }
        } catch (Exception ignored) {
        }
        return DEFAULT_APK_DOWNLOAD_URL;
    }

    private long getInstalledVersionCode() {
        try {
            PackageInfo info = getPackageManager().getPackageInfo(getPackageName(), 0);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                return info.getLongVersionCode();
            }
            return info.versionCode;
        } catch (Exception e) {
            return 1L;
        }
    }

    private String getInstalledVersionName() {
        try {
            PackageInfo info = getPackageManager().getPackageInfo(getPackageName(), 0);
            return info.versionName != null ? info.versionName : "1.0";
        } catch (Exception e) {
            return "1.0";
        }
    }

    private void emitJsEvent(String eventName, String jsonDetail) {
        runOnUiThread(() -> {
            if (isFinishing() || isDestroyed()) return;
            WebView wv = this.bridge != null ? this.bridge.getWebView() : null;
            if (wv != null) {
                wv.evaluateJavascript(
                    "window.dispatchEvent(new CustomEvent('" + eventName + "', { detail: " + jsonDetail + " }));",
                    null
                );
            }
        });
    }

    private void checkApkUpdateAsync(boolean isManual) {
        if (apkCheckInFlight || !isNetworkAvailable()) return;
        apkCheckInFlight = true;
        final String versionJsonUrl = getApkVersionJsonUrl() + "?_t=" + System.currentTimeMillis();
        final long installedCode = getInstalledVersionCode();

        apkUpdateExecutor.execute(() -> {
            HttpURLConnection conn = null;
            BufferedReader reader = null;
            try {
                URL url = new URL(versionJsonUrl);
                conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("GET");
                conn.setConnectTimeout(4500);
                conn.setReadTimeout(4500);
                conn.setInstanceFollowRedirects(true);
                conn.setUseCaches(false);
                if (conn.getResponseCode() == HttpURLConnection.HTTP_OK) {
                    reader = new BufferedReader(new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8));
                    StringBuilder sb = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) {
                        sb.append(line);
                    }
                    JSONObject obj = new JSONObject(sb.toString());
                    long remoteCode = obj.optLong("versionCode", 0L);
                    String remoteName = obj.optString("versionName", "");
                    String remoteApkUrl = obj.optString("apkUrl", getApkDownloadUrl());

                    if (remoteCode > installedCode) {
                        availableApkVersionCode = remoteCode;
                        availableApkVersionName = remoteName;
                        pendingApkUrl = remoteApkUrl;

                        JSONObject detail = new JSONObject();
                        detail.put("available", true);
                        detail.put("versionCode", remoteCode);
                        detail.put("versionName", remoteName);
                        detail.put("installedVersionCode", installedCode);
                        detail.put("apkUrl", remoteApkUrl);
                        emitJsEvent("kdf-apk-update-available", detail.toString());
                    } else if (isManual) {
                        JSONObject detail = new JSONObject();
                        detail.put("available", false);
                        detail.put("installedVersionCode", installedCode);
                        emitJsEvent("kdf-apk-update-available", detail.toString());
                    }
                }
            } catch (Exception ignored) {
            } finally {
                if (reader != null) {
                    try {
                        reader.close();
                    } catch (Exception ignored) {
                    }
                }
                if (conn != null) {
                    try {
                        conn.disconnect();
                    } catch (Exception ignored) {
                    }
                }
                apkCheckInFlight = false;
            }
        });
    }

    private void startApkSelfDownloadAndInstall(String targetUrl) {
        if (apkDownloadInFlight) return;
        final String downloadUrl = (targetUrl != null && targetUrl.startsWith("https://"))
            ? targetUrl
            : getApkDownloadUrl();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && !getPackageManager().canRequestPackageInstalls()) {
            pendingApkUrl = downloadUrl;
            pendingApkInstallOnResume = true;
            runOnUiThread(() -> {
                Toast.makeText(
                    MainActivity.this,
                    "براہ کرم 'Allow from this source' آن کر کے واپس آئیں تاکہ اپڈیٹ انسٹال ہو سکے",
                    Toast.LENGTH_LONG
                ).show();
                try {
                    Intent intent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES);
                    intent.setData(Uri.parse("package:" + getPackageName()));
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(intent);
                } catch (Exception e) {
                    launchSettingsIntent(Settings.ACTION_SECURITY_SETTINGS);
                }
            });
            return;
        }

        if (!isNetworkAvailable()) {
            runOnUiThread(() ->
                Toast.makeText(MainActivity.this, "اپڈیٹ ڈاؤنلوڈ کرنے کے لیے انٹرنیٹ آن کریں", Toast.LENGTH_SHORT).show()
            );
            return;
        }

        apkDownloadInFlight = true;
        emitJsEvent("kdf-apk-download-progress", "{\"progress\":1,\"status\":\"downloading\"}");

        apkUpdateExecutor.execute(() -> {
            HttpURLConnection conn = null;
            InputStream in = null;
            FileOutputStream out = null;
            try {
                File updateDir = new File(getCacheDir(), "updates");
                if (!updateDir.exists()) updateDir.mkdirs();
                File apkFile = new File(updateDir, "Khanqah-Darul-Falah.apk");
                if (apkFile.exists()) apkFile.delete();

                // Follow GitHub release redirects cleanly
                String curUrl = downloadUrl;
                for (int hops = 0; hops < 5; hops++) {
                    URL u = new URL(curUrl);
                    conn = (HttpURLConnection) u.openConnection();
                    conn.setRequestMethod("GET");
                    conn.setConnectTimeout(15000);
                    conn.setReadTimeout(30000);
                    conn.setInstanceFollowRedirects(false);
                    int code = conn.getResponseCode();
                    if (code == HttpURLConnection.HTTP_MOVED_TEMP || code == HttpURLConnection.HTTP_MOVED_PERM || code == 307 || code == 308) {
                        String loc = conn.getHeaderField("Location");
                        conn.disconnect();
                        if (loc == null || loc.isEmpty()) break;
                        curUrl = loc;
                    } else {
                        break;
                    }
                }

                if (conn == null || conn.getResponseCode() != HttpURLConnection.HTTP_OK) {
                    throw new IllegalStateException("APK download failed");
                }

                long totalBytes = Build.VERSION.SDK_INT >= Build.VERSION_CODES.N
                    ? conn.getContentLengthLong()
                    : conn.getContentLength();
                in = conn.getInputStream();
                out = new FileOutputStream(apkFile);
                byte[] buffer = new byte[16384];
                long downloaded = 0L;
                int lastPct = 1;
                int read;
                while ((read = in.read(buffer)) != -1) {
                    out.write(buffer, 0, read);
                    downloaded += read;
                    if (totalBytes > 0) {
                        int pct = (int) Math.min(99L, (downloaded * 100L) / totalBytes);
                        if (pct >= lastPct + 5) {
                            lastPct = pct;
                            emitJsEvent("kdf-apk-download-progress", "{\"progress\":" + pct + ",\"status\":\"downloading\"}");
                        }
                    }
                }
                out.flush();
                out.close();
                out = null;

                emitJsEvent("kdf-apk-download-progress", "{\"progress\":100,\"status\":\"installing\"}");

                Uri apkUri = FileProvider.getUriForFile(
                    MainActivity.this,
                    getPackageName() + ".fileprovider",
                    apkFile
                );
                Intent installIntent = new Intent(Intent.ACTION_VIEW);
                installIntent.setDataAndType(apkUri, "application/vnd.android.package-archive");
                installIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
                runOnUiThread(() -> {
                    try {
                        startActivity(installIntent);
                    } catch (Exception e) {
                        Toast.makeText(
                            MainActivity.this,
                            "انسٹالر کھولنے میں دشواری پیش آئی۔",
                            Toast.LENGTH_SHORT
                        ).show();
                    }
                });
            } catch (Exception e) {
                emitJsEvent("kdf-apk-download-progress", "{\"progress\":0,\"status\":\"error\"}");
                runOnUiThread(() ->
                    Toast.makeText(
                        MainActivity.this,
                        "اپڈیٹ ڈاؤنلوڈ نہیں ہو سکا — براہ کرم انٹرنیٹ چیک کر کے دوبارہ کوشش کریں",
                        Toast.LENGTH_SHORT
                    ).show()
                );
            } finally {
                if (in != null) {
                    try {
                        in.close();
                    } catch (Exception ignored) {
                    }
                }
                if (out != null) {
                    try {
                        out.close();
                    } catch (Exception ignored) {
                    }
                }
                if (conn != null) {
                    try {
                        conn.disconnect();
                    } catch (Exception ignored) {
                    }
                }
                apkDownloadInFlight = false;
            }
        });
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
     * Strictly verifies HTTP 200 + real Khanqah HTML BEFORE ever navigating the WebView,
     * so the user can NEVER hit a "404 There isn't a GitHub Pages site here" screen.
     */
    private void checkAndLoadLiveUpdate(boolean forceCheck, boolean isManualRefresh) {
        long now = System.currentTimeMillis();
        if (otaCheckInFlight && !isManualRefresh) return;
        if (!forceCheck && (now - lastOtaCheckAtMs) < OTA_CHECK_INTERVAL_MS) return;

        if (!isNetworkAvailable()) {
            if (isManualRefresh) {
                runOnUiThread(() ->
                    Toast.makeText(
                        MainActivity.this,
                        "انٹرنیٹ دستیاب نہیں — آف لائن ایپ فعال ہے",
                        Toast.LENGTH_SHORT
                    ).show()
                );
            }
            return;
        }

        otaCheckInFlight = true;
        lastOtaCheckAtMs = now;
        final String liveUrl = getLiveWebUrl();
        final String probeUrl = liveUrl + "index.html?_kdf_ota=" + now;

        otaExecutor.execute(() -> {
            HttpURLConnection conn = null;
            BufferedReader reader = null;
            boolean loadedLive = false;
            try {
                URL url = new URL(probeUrl);
                conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("GET");
                conn.setConnectTimeout(3500);
                conn.setReadTimeout(3500);
                conn.setUseCaches(false);
                conn.setInstanceFollowRedirects(true);
                conn.setRequestProperty("Cache-Control", "no-cache");

                int code = conn.getResponseCode();
                String contentType = conn.getContentType();
                if (code == HttpURLConnection.HTTP_OK &&
                    (contentType == null || contentType.toLowerCase().contains("text/html"))) {

                    reader = new BufferedReader(
                        new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8)
                    );
                    StringBuilder snippet = new StringBuilder();
                    char[] buf = new char[2048];
                    int readCount = reader.read(buf, 0, buf.length);
                    if (readCount > 0) {
                        snippet.append(buf, 0, readCount);
                    }
                    String htmlHead = snippet.toString();

                    boolean isRealAppHtml =
                        htmlHead.contains("id=\"root\"")
                            || htmlHead.contains("Khanqah")
                            || htmlHead.contains("خانقاہ");
                    boolean isErrorPage =
                        htmlHead.contains("There isn't a GitHub Pages site here")
                            || htmlHead.contains("Site not found");

                    if (isRealAppHtml && !isErrorPage) {
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

                        loadedLive = true;
                        runOnUiThread(() -> {
                            if (isFinishing() || isDestroyed()) return;
                            WebView wv = MainActivity.this.bridge != null
                                ? MainActivity.this.bridge.getWebView()
                                : null;
                            if (wv == null) return;

                            String currentUrl = wv.getUrl();
                            boolean alreadyOnLive = currentUrl != null && currentUrl.startsWith(liveUrl);

                            if (!alreadyOnLive || hasNewVersion || isManualRefresh) {
                                wv.clearCache(true);
                                wv.loadUrl(liveUrl + "?_kdf_ota=" + now);
                            }
                        });
                    }
                }
            } catch (Exception ignored) {
                // Offline or unreachable: stay seamlessly on built-in APK bundle
            } finally {
                if (reader != null) {
                    try {
                        reader.close();
                    } catch (Exception ignored) {
                    }
                }
                if (conn != null) {
                    try {
                        conn.disconnect();
                    } catch (Exception ignored) {
                    }
                }
                if (isManualRefresh && !loadedLive) {
                    runOnUiThread(() -> {
                        if (isFinishing() || isDestroyed()) return;
                        WebView wv = MainActivity.this.bridge != null
                            ? MainActivity.this.bridge.getWebView()
                            : null;
                        if (wv != null) {
                            String curUrl = wv.getUrl();
                            String curTitle = wv.getTitle();
                            if ((curTitle != null && curTitle.contains("404"))
                                || (curUrl != null && !curUrl.startsWith(LOCAL_BUNDLE_URL))) {
                                wv.clearCache(true);
                                wv.loadUrl(LOCAL_BUNDLE_URL);
                            } else {
                                wv.clearCache(true);
                            }
                        }
                        Toast.makeText(
                            MainActivity.this,
                            "تازہ ترین بیانات، کتب اور اعلانات ریفریش ہو گئے ✓",
                            Toast.LENGTH_SHORT
                        ).show();
                    });
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
            checkAndLoadLiveUpdate(true, false);
            checkApkUpdateAsync(false);
        }

        @JavascriptInterface
        public void forceLiveRefresh() {
            SharedPreferences prefs = getSharedPreferences(OTA_PREFS_NAME, MODE_PRIVATE);
            prefs.edit().remove(KEY_LAST_OTA_FINGERPRINT).apply();
            KhanqahNotificationHelper.checkRemoteUpdatesAsync(MainActivity.this, true);
            checkApkUpdateAsync(true);
            checkAndLoadLiveUpdate(true, true);
        }

        @JavascriptInterface
        public long getAppVersionCode() {
            return getInstalledVersionCode();
        }

        @JavascriptInterface
        public String getAppVersionName() {
            return getInstalledVersionName();
        }

        @JavascriptInterface
        public void checkApkUpdate() {
            checkApkUpdateAsync(true);
        }

        @JavascriptInterface
        public void downloadAndInstallApkUpdate() {
            startApkSelfDownloadAndInstall(pendingApkUrl);
        }

        @JavascriptInterface
        public boolean hasNotificationPermission() {
            return KhanqahNotificationHelper.hasNotificationPermission(MainActivity.this);
        }

        @JavascriptInterface
        public void requestNotificationPermission() {
            runOnUiThread(() -> {
                if (Build.VERSION.SDK_INT >= 33) {
                    if (checkSelfPermission("android.permission.POST_NOTIFICATIONS")
                        != PackageManager.PERMISSION_GRANTED) {
                        SharedPreferences prefs = getSharedPreferences(OTA_PREFS_NAME, MODE_PRIVATE);
                        boolean alreadyAsked = prefs.getBoolean(KEY_NOTIF_PERM_ASKED, false);
                        boolean shouldShow = shouldShowRequestPermissionRationale("android.permission.POST_NOTIFICATIONS");
                        if (!alreadyAsked || shouldShow) {
                            prefs.edit().putBoolean(KEY_NOTIF_PERM_ASKED, true).apply();
                            requestPermissions(
                                new String[]{"android.permission.POST_NOTIFICATIONS"},
                                REQ_CODE_POST_NOTIFICATIONS
                            );
                            return;
                        }
                    }
                }
                Toast.makeText(
                    MainActivity.this,
                    "براہِ کرم نوٹیفکیشن (Allow Notifications) آن کر کے واپس آئیں",
                    Toast.LENGTH_LONG
                ).show();
                openNotificationSettings();
            });
        }

        @JavascriptInterface
        public void openNotificationSettings() {
            runOnUiThread(() -> {
                try {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        Intent intent = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS);
                        intent.putExtra(Settings.EXTRA_APP_PACKAGE, getPackageName());
                        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        startActivity(intent);
                        return;
                    }
                    Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                    intent.setData(Uri.parse("package:" + getPackageName()));
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(intent);
                } catch (Exception e) {
                    try {
                        launchSettingsIntent(Settings.ACTION_SETTINGS);
                    } catch (Exception ignored) {
                    }
                }
            });
        }

        @JavascriptInterface
        public boolean sendTestNotification() {
            KhanqahNotificationHelper.ensureChannels(MainActivity.this);
            if (!KhanqahNotificationHelper.hasNotificationPermission(MainActivity.this)) {
                requestNotificationPermission();
                return false;
            }
            boolean posted = KhanqahNotificationHelper.showStyledNotification(
                MainActivity.this,
                "🕌 خانقاہ دارالفلاح — نوٹیفکیشن فعال ہے",
                "ماشاءاللہ! اب جب بھی کوئی نیا اصلاحی بیان، کتاب یا پیغام اپلوڈ ہوگا تو آپ کو خوبصورت اطلاع ملے گی۔",
                "فوری ٹیسٹ کامیاب ✓",
                5099
            );
            runOnUiThread(() ->
                Toast.makeText(
                    MainActivity.this,
                    posted
                        ? "نوٹیفکیشن بھیج دیا گیا — اوپر اسٹیٹس بار میں دیکھیں ✓"
                        : "نوٹیفکیشن بھیجنے کے لیے سیٹنگز سے اجازت آن کریں",
                    Toast.LENGTH_SHORT
                ).show()
            );
            return posted;
        }

        @JavascriptInterface
        public void showUpdateNotification(String title, String body, String subText) {
            KhanqahNotificationHelper.showStyledNotification(
                MainActivity.this,
                title != null ? title : "خانقاہ دارالفلاح",
                body != null ? body : "",
                subText != null ? subText : "نئی اپڈیٹ",
                (int) (System.currentTimeMillis() % 100000L) + 5100
            );
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
        public String getAutoSilentConfigJson() {
            return PrayerSilentScheduler.getConfigJsonForJs(MainActivity.this);
        }

        @JavascriptInterface
        public String getAutoSilentStatus() {
            try {
                JSONObject obj = new JSONObject();
                obj.put("isNative", true);
                obj.put("dndGranted", PrayerSilentScheduler.hasDndPermission(MainActivity.this));
                obj.put("exactAlarmGranted", PrayerSilentScheduler.hasExactAlarmPermission(MainActivity.this));
                obj.put("batteryOptIgnored", isIgnoringBatteryOptimizations());
                obj.put("enabled", PrayerSilentScheduler.isMasterEnabled(MainActivity.this));
                obj.put("silentMode", PrayerSilentScheduler.getSilentMode(MainActivity.this));
                obj.put("activeCount", PrayerSilentScheduler.getActiveScheduledCount(MainActivity.this));
                obj.put("currentlySilent", PrayerSilentScheduler.isCurrentlySilent(MainActivity.this));
                return obj.toString();
            } catch (Exception e) {
                return "{\"isNative\":true,\"dndGranted\":false,\"exactAlarmGranted\":true,\"batteryOptIgnored\":false,\"enabled\":false,\"silentMode\":\"silent\",\"activeCount\":0,\"currentlySilent\":false}";
            }
        }

        @JavascriptInterface
        public String getSafeMobileStatus() {
            JSONObject obj = new JSONObject();
            try {
                obj.put("isNative", true);
                obj.put("sdkInt", Build.VERSION.SDK_INT);
                boolean supported = Build.VERSION.SDK_INT >= Build.VERSION_CODES.P;
                obj.put("privateDnsSupported", supported);
                boolean active = false;
                String serverName = "";
                if (supported) {
                    ConnectivityManager cm =
                        (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
                    if (cm != null) {
                        Network net = cm.getActiveNetwork();
                        if (net != null) {
                            LinkProperties lp = cm.getLinkProperties(net);
                            if (lp != null) {
                                active = lp.isPrivateDnsActive();
                                String host = lp.getPrivateDnsServerName();
                                if (host != null) {
                                    serverName = host;
                                }
                            }
                        }
                    }
                }
                obj.put("privateDnsActive", active);
                obj.put("privateDnsServer", serverName);
            } catch (Exception ignored) {
            }
            return obj.toString();
        }

        @JavascriptInterface
        public void openPrivateDnsSettings(String hostname) {
            final String dnsHost = (hostname != null && !hostname.trim().isEmpty())
                ? hostname.trim()
                : "family.adguard-dns.com";
            runOnUiThread(() -> {
                try {
                    ClipboardManager cm =
                        (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
                    if (cm != null) {
                        cm.setPrimaryClip(ClipData.newPlainText("Khanqah Safe DNS", dnsHost));
                    }
                    Toast.makeText(
                        MainActivity.this,
                        dnsHost + " کاپی ہو گیا! اب Private DNS میں جا کر پیسٹ اور Save کریں",
                        Toast.LENGTH_LONG
                    ).show();
                } catch (Exception ignored) {
                }

                try {
                    launchSettingsIntent(Settings.ACTION_WIRELESS_SETTINGS);
                    return;
                } catch (Exception ignored) {
                }
                try {
                    launchSettingsIntent(Settings.ACTION_WIFI_SETTINGS);
                    return;
                } catch (Exception ignored) {
                }
                try {
                    launchSettingsIntent(Settings.ACTION_SETTINGS);
                } catch (Exception ignored) {
                }
            });
        }

        @JavascriptInterface
        public void openExternalUrl(String targetUrl) {
            if (targetUrl == null || (!targetUrl.startsWith("https://") && !targetUrl.startsWith("http://"))) {
                return;
            }
            runOnUiThread(() -> {
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(targetUrl));
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(intent);
                } catch (Exception ignored) {
                }
            });
        }

        @JavascriptInterface
        public boolean setSilentNow(boolean silent) {
            return PrayerSilentScheduler.applySilentState(MainActivity.this, silent);
        }

        @JavascriptInterface
        public boolean isIgnoringBatteryOptimizations() {
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
                    return pm != null && pm.isIgnoringBatteryOptimizations(getPackageName());
                }
            } catch (Exception ignored) {
            }
            return true;
        }

        @JavascriptInterface
        public void requestBatteryOptimizationExemption() {
            runOnUiThread(() -> {
                try {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !isIgnoringBatteryOptimizations()) {
                        Intent intent = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                        intent.setData(Uri.parse("package:" + getPackageName()));
                        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        startActivity(intent);
                        return;
                    }
                } catch (Exception ignored) {
                }
                openAppBatterySettings();
            });
        }

        @JavascriptInterface
        public void openAppBatterySettings() {
            runOnUiThread(() -> {
                try {
                    Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                    intent.setData(Uri.parse("package:" + getPackageName()));
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(intent);
                } catch (Exception e) {
                    try {
                        launchSettingsIntent(Settings.ACTION_SETTINGS);
                    } catch (Exception ignored) {
                    }
                }
            });
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
