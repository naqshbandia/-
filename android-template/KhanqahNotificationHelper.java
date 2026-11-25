package com.khanqahdarulfalah.app;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.NetworkInfo;
import android.net.Uri;
import android.os.Build;
import android.os.SystemClock;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class KhanqahNotificationHelper {

    public static final String CHANNEL_UPDATES_ID = "kdf_updates_channel";
    public static final String CHANNEL_UPDATES_NAME = "نئے بیانات، کتب اور خانقاہ پیغامات";
    public static final String CHANNEL_SILENT_ID = "kdf_prayer_status_channel";
    public static final String CHANNEL_SILENT_NAME = "نماز آٹو سائلنٹ اطلاع";

    private static final String PREFS_NAME = "kdf_notif_state_prefs";
    private static final String KEY_LAST_MSG_SIG = "last_msg_sig";
    private static final String KEY_LAST_ARCHIVE_SIG = "last_archive_sig";
    private static final String KEY_LAST_BLOGGER_SIG = "last_blogger_sig";
    private static final String KEY_LAST_CHECK_MS = "last_check_ms";

    private static final String URL_LATEST_TXT = "https://naqshbandia.github.io/index.html/latest_update.txt";
    private static final String URL_MESSAGE_HTML = "https://naqshbandia.github.io/index.html/khanqah-message.html";
    private static final String URL_ARCHIVE_LATEST =
        "https://archive.org/advancedsearch.php?q=uploader:khanqahdarulfalah%40gmail.com&fl[]=identifier,title,mediatype,addeddate&sort[]=addeddate+desc&rows=2&output=json";
    private static final String URL_BLOGGER_LATEST =
        "https://khanqahdarulfalah.blogspot.com/feeds/posts/default?alt=json&max-results=1";

    private static final int UPDATE_CHECK_REQUEST_CODE = 4401;
    private static final long MIN_CHECK_INTERVAL_MS = 10 * 60 * 1000L; // 10 minutes throttle
    private static final ExecutorService bgExecutor = Executors.newSingleThreadExecutor();

    public static void ensureChannels(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager nm =
                (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm == null) return;

            if (nm.getNotificationChannel(CHANNEL_UPDATES_ID) == null) {
                NotificationChannel updatesChannel = new NotificationChannel(
                    CHANNEL_UPDATES_ID,
                    CHANNEL_UPDATES_NAME,
                    NotificationManager.IMPORTANCE_HIGH
                );
                updatesChannel.setDescription("نئے اصلاحی بیانات، اسلامی کتب، اعلانات اور خانقاہ کے پیغامات کی فوری اطلاع");
                updatesChannel.enableLights(true);
                updatesChannel.setLightColor(Color.rgb(212, 175, 55));
                updatesChannel.enableVibration(true);
                updatesChannel.setShowBadge(true);
                updatesChannel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
                Uri soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
                AudioAttributes attrs = new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build();
                updatesChannel.setSound(soundUri, attrs);
                nm.createNotificationChannel(updatesChannel);
            }

            if (nm.getNotificationChannel(CHANNEL_SILENT_ID) == null) {
                NotificationChannel silentChannel = new NotificationChannel(
                    CHANNEL_SILENT_ID,
                    CHANNEL_SILENT_NAME,
                    NotificationManager.IMPORTANCE_DEFAULT
                );
                silentChannel.setDescription("نماز کے دوران آٹو سائلنٹ کی حالت");
                silentChannel.setSound(null, null);
                silentChannel.enableVibration(false);
                nm.createNotificationChannel(silentChannel);
            }
        }
    }

    public static boolean hasNotificationPermission(Context context) {
        NotificationManager nm =
            (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N && nm != null) {
            if (!nm.areNotificationsEnabled()) {
                return false;
            }
        }
        if (Build.VERSION.SDK_INT >= 33) {
            return context.checkSelfPermission("android.permission.POST_NOTIFICATIONS")
                == PackageManager.PERMISSION_GRANTED;
        }
        return true;
    }

    public static void showStyledNotification(
        Context context,
        String title,
        String body,
        String subText,
        int notificationId
    ) {
        ensureChannels(context);
        if (!hasNotificationPermission(context)) return;

        NotificationManager nm =
            (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;

        Intent openIntent = new Intent(context, MainActivity.class);
        openIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        int piFlags = Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
            ? PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            : PendingIntent.FLAG_UPDATE_CURRENT;
        PendingIntent contentIntent = PendingIntent.getActivity(context, notificationId, openIntent, piFlags);

        Notification.Builder builder = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
            ? new Notification.Builder(context, CHANNEL_UPDATES_ID)
            : new Notification.Builder(context);

        int iconRes = context.getApplicationInfo().icon;
        if (iconRes == 0) {
            iconRes = android.R.drawable.ic_dialog_info;
        }

        builder.setSmallIcon(iconRes);
        try {
            Bitmap largeIcon = BitmapFactory.decodeResource(context.getResources(), iconRes);
            if (largeIcon != null) {
                builder.setLargeIcon(largeIcon);
            }
        } catch (Exception ignored) {
        }

        builder.setContentTitle(title)
            .setContentText(body)
            .setSubText(subText != null && !subText.isEmpty() ? subText : "خانقاہ دارالفلاح")
            .setAutoCancel(true)
            .setContentIntent(contentIntent)
            .setStyle(
                new Notification.BigTextStyle()
                    .bigText(body)
                    .setBigContentTitle(title)
                    .setSummaryText("خانقاہ دارالفلاح — آفیشل اطلاع")
            );

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            builder.setColor(0xFF064326);
            builder.setVisibility(Notification.VISIBILITY_PUBLIC);
        }
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            builder.setPriority(Notification.PRIORITY_HIGH);
            builder.setDefaults(Notification.DEFAULT_ALL);
        }

        nm.notify(notificationId, builder.build());
    }

    public static void schedulePeriodicChecks(Context context) {
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;

        Intent intent = new Intent(context, UpdateCheckReceiver.class);
        int flags = Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
            ? PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            : PendingIntent.FLAG_UPDATE_CURRENT;
        PendingIntent pi = PendingIntent.getBroadcast(context, UPDATE_CHECK_REQUEST_CODE, intent, flags);

        long firstTrigger = SystemClock.elapsedRealtime() + (15 * 60 * 1000L);
        am.setInexactRepeating(
            AlarmManager.ELAPSED_REALTIME_WAKEUP,
            firstTrigger,
            AlarmManager.INTERVAL_HOUR,
            pi
        );
    }

    public static void checkRemoteUpdatesAsync(Context context) {
        final Context appCtx = context.getApplicationContext();
        bgExecutor.execute(() -> checkRemoteContentAndNotify(appCtx));
    }

    public static void checkRemoteContentAndNotify(Context context) {
        if (!isNetworkAvailable(context)) return;

        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        long now = System.currentTimeMillis();
        long lastCheck = prefs.getLong(KEY_LAST_CHECK_MS, 0L);
        if ((now - lastCheck) < MIN_CHECK_INTERVAL_MS) return;
        prefs.edit().putLong(KEY_LAST_CHECK_MS, now).apply();

        // 1. Check Khanqah Message / Latest Update TXT
        try {
            String msgText = fetchPlainUpdateMessage();
            if (msgText != null && msgText.length() >= 4) {
                String sig = String.valueOf(msgText.hashCode()) + ":" + msgText.length();
                String prevSig = prefs.getString(KEY_LAST_MSG_SIG, "");
                if (prevSig.isEmpty()) {
                    // Save baseline silently on first run
                    prefs.edit().putString(KEY_LAST_MSG_SIG, sig).apply();
                } else if (!prevSig.equals(sig)) {
                    prefs.edit().putString(KEY_LAST_MSG_SIG, sig).apply();
                    showStyledNotification(
                        context,
                        "📢 خانقاہ دارالفلاح — نیا پیغام",
                        msgText,
                        "اہم اعلان و پیغام",
                        5001
                    );
                }
            }
        } catch (Exception ignored) {
        }

        // 2. Check Archive.org New Bayan / Book / Poster Upload
        try {
            String rawJson = fetchUrl(URL_ARCHIVE_LATEST + "&_t=" + now);
            if (rawJson != null && !rawJson.isEmpty()) {
                JSONObject root = new JSONObject(rawJson);
                JSONObject resp = root.optJSONObject("response");
                JSONArray docs = resp != null ? resp.optJSONArray("docs") : null;
                if (docs != null && docs.length() > 0) {
                    JSONObject top = docs.optJSONObject(0);
                    if (top != null) {
                        String id = top.optString("identifier", "");
                        String title = top.optString("title", id);
                        String mediatype = top.optString("mediatype", "");
                        String added = top.optString("addeddate", "");
                        String sig = id + "|" + added;
                        String prevSig = prefs.getString(KEY_LAST_ARCHIVE_SIG, "");
                        if (!id.isEmpty()) {
                            if (prevSig.isEmpty()) {
                                prefs.edit().putString(KEY_LAST_ARCHIVE_SIG, sig).apply();
                            } else if (!prevSig.equals(sig)) {
                                prefs.edit().putString(KEY_LAST_ARCHIVE_SIG, sig).apply();
                                String heading;
                                String sub;
                                if ("audio".equalsIgnoreCase(mediatype)) {
                                    heading = "🎙️ نیا اصلاحی بیان اپلوڈ ہو گیا";
                                    sub = "آڈیو بیان لائبریری";
                                } else if ("texts".equalsIgnoreCase(mediatype)) {
                                    heading = "📚 نئی اسلامی کتاب اپلوڈ ہو گئی";
                                    sub = "اردو کتب خانہ";
                                } else {
                                    heading = "🖼️ نیا اشتہار / اپڈیٹ شامل ہو گیا";
                                    sub = "تازہ ترین اپڈیٹ";
                                }
                                showStyledNotification(context, heading, title, sub, 5002);
                            }
                        }
                    }
                }
            }
        } catch (Exception ignored) {
        }

        // 3. Check Blogger Latest Post
        try {
            String rawBlog = fetchUrl(URL_BLOGGER_LATEST + "&_t=" + now);
            if (rawBlog != null && !rawBlog.isEmpty()) {
                JSONObject root = new JSONObject(rawBlog);
                JSONObject feed = root.optJSONObject("feed");
                JSONArray entries = feed != null ? feed.optJSONArray("entry") : null;
                if (entries != null && entries.length() > 0) {
                    JSONObject entry = entries.optJSONObject(0);
                    if (entry != null) {
                        JSONObject idObj = entry.optJSONObject("id");
                        JSONObject titleObj = entry.optJSONObject("title");
                        String id = idObj != null ? idObj.optString("$t", "") : "";
                        String title = titleObj != null ? titleObj.optString("$t", "نئی تحریر / اعلان") : "نئی تحریر / اعلان";
                        if (!id.isEmpty()) {
                            String prevSig = prefs.getString(KEY_LAST_BLOGGER_SIG, "");
                            if (prevSig.isEmpty()) {
                                prefs.edit().putString(KEY_LAST_BLOGGER_SIG, id).apply();
                            } else if (!prevSig.equals(id)) {
                                prefs.edit().putString(KEY_LAST_BLOGGER_SIG, id).apply();
                                showStyledNotification(
                                    context,
                                    "🕌 خانقاہ دارالفلاح — نئی اپڈیٹ",
                                    title,
                                    "نئی پوسٹ شائع ہوئی ہے",
                                    5003
                                );
                            }
                        }
                    }
                }
            }
        } catch (Exception ignored) {
        }
    }

    private static String fetchPlainUpdateMessage() {
        String txt = fetchUrl(URL_LATEST_TXT + "?_t=" + System.currentTimeMillis());
        if (txt != null) {
            String clean = txt.trim();
            if (!clean.isEmpty() && !clean.startsWith("<")) {
                return clean;
            }
        }
        String html = fetchUrl(URL_MESSAGE_HTML + "?_t=" + System.currentTimeMillis());
        if (html == null || html.isEmpty()) return null;

        int idx = html.indexOf("class=\"message\"");
        if (idx < 0) idx = html.indexOf("id=\"khanqah-message\"");
        if (idx < 0) return null;

        int gt = html.indexOf('>', idx);
        if (gt < 0) return null;
        int endDiv = html.indexOf("</div>", gt);
        if (endDiv < 0) return null;

        String inner = html.substring(gt + 1, endDiv)
            .replaceAll("<[^>]+>", " ")
            .replaceAll("\\s+", " ")
            .trim();
        return inner.isEmpty() ? null : inner;
    }

    private static String fetchUrl(String urlStr) {
        HttpURLConnection conn = null;
        try {
            URL url = new URL(urlStr);
            conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(4000);
            conn.setReadTimeout(4000);
            conn.setUseCaches(false);
            conn.setRequestProperty("Cache-Control", "no-cache");
            if (conn.getResponseCode() != HttpURLConnection.HTTP_OK) {
                return null;
            }
            BufferedReader reader = new BufferedReader(
                new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8)
            );
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line).append('\n');
                if (sb.length() > 64_000) break;
            }
            reader.close();
            return sb.toString();
        } catch (Exception e) {
            return null;
        } finally {
            if (conn != null) {
                try {
                    conn.disconnect();
                } catch (Exception ignored) {
                }
            }
        }
    }

    private static boolean isNetworkAvailable(Context context) {
        try {
            ConnectivityManager cm =
                (ConnectivityManager) context.getSystemService(Context.CONNECTIVITY_SERVICE);
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
}
