package com.khanqahdarulfalah.app;

import android.app.DownloadManager;
import android.content.Context;
import android.content.Intent;
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

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if (this.bridge != null && this.bridge.getWebView() != null) {
            WebView webView = this.bridge.getWebView();
            WebSettings settings = webView.getSettings();
            settings.setDomStorageEnabled(true);
            settings.setJavaScriptEnabled(true);
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
        }
    }

    private void launchSettingsIntent(String action) {
        Intent intent = new Intent(action);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        startActivity(intent);
    }

    public class KhanqahNativeBridge {

        @JavascriptInterface
        public void openDndSettings() {
            runOnUiThread(() -> {
                try {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                        try {
                            launchSettingsIntent("android.settings.ZEN_MODE_SETTINGS");
                            return;
                        } catch (Exception ignored) {
                        }
                        try {
                            launchSettingsIntent(Settings.ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS);
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
            runOnUiThread(() -> finishAffinity());
        }
    }
}
