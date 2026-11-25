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
    private static final String KEY_WELCOME_SHOWN = "welcome_notif_shown_v1";

    private static final String URL_LATEST_TXT = "https://naqshbandia.github.io/index.html/latest_update.txt";
    private static final String URL_MESSAGE_HTML = "https://naqshbandia.github.io/index.html/khanqah-message.html";
    private static final String URL_ARCHIVE_LATEST =
        "https://archive.org/advancedsearch.php?q=uploader:khanqahdarulfalah%40gmail.com&fl[]=identifier,title,mediatype,addeddate,oai_updatedate&sort[]=oai_updatedate+desc&rows=2&output=json";
    private static final String URL_BLOGGER_LATEST =
        "https://khanqahdarulfalah.blogspot.com/feeds/posts/default?alt=json&max-results=1";

    private static final int UPDATE_CHECK_REQUEST_CODE = 4401;
    private static final long MIN_CHECK_INTERVAL_MS = 10 * 60 * 1000L; // 10 minutes throttle for passive checks
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

    public static void sendWelcomeNotificationOnce(Context context) {
        if (!hasNotificationPermission(context)) return;
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        if (prefs.getBoolean(KEY_WELCOME_SHOWN, false)) return;
        prefs.edit().putBoolean(KEY_WELCOME_SHOWN, true).apply();

        showStyledNotification(
            context,
            "🕌 خانقاہ دارالفلاح — نوٹیفکیشن فعال ہو گئے",
            "اب جب بھی کوئی نیا اصلاحی بیان، کتاب، اشتہار یا خانقاہ کا پیغام اپلوڈ ہوگا تو آپ کو خوبصورت اطلاع ملے گی۔",
            "آفیشل نوٹیفکیشن آن ✓",
            5098
        );
    }

    private static int resolveSmallNotificationIcon(Context context) {
        try {
            int statIcon = context.getResources().getIdentifier(
                "ic_stat_khanqah",
                "drawable",
                context.getPackageName()
            );
            if (statIcon != 0) {
                return statIcon;
            }
        } catch (Exception ignored) {
        }
        return android.R.drawable.ic_popup_reminder;
    }

    public static boolean showStyledNotification(
        Context context,
        String title,
        String body,
        String subText,
        int notificationId
    ) {
        ensureChannels(context);
        if (!hasNotificationPermission(context)) return false;

        NotificationManager nm =
            (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return false;

        Intent openIntent = new Intent(context, MainActivity.class);
        openIntent.setFlags(
            Intent.FLAG_ACTIVITY_NEW_TASK
                | Intent.FLAG_ACTIVITY_CLEAR_TOP
                | Intent.FLAG_ACTIVITY_SINGLE_TOP
        );
        int piFlags = Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
            ? PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            : PendingIntent.FLAG_UPDATE_CURRENT;
        PendingIntent contentIntent = PendingIntent.getActivity(context, notificationId, openIntent, piFlags);

        int smallIconRes = resolveSmallNotificationIcon(context);
        Bitmap largeIcon = null;
        try {
            int mipmapIcon = context.getResources().getIdentifier(
                "ic_launcher_round",
                "mipmap",
                context.getPackageName()
            );
            if (mipmapIcon == 0) {
                mipmapIcon = context.getResources().getIdentifier(
                    "ic_launcher",
                    "mipmap",
                    context.getPackageName()
                );
            }
            if (mipmapIcon != 0) {
                largeIcon = BitmapFactory.decodeResource(context.getResources(), mipmapIcon);
            }
        } catch (Exception ignored) {
        }

        try {
            nm.notify(
                notificationId,
                buildNotification(context, smallIconRes, largeIcon, title, body, subText, contentIntent)
            );
            return true;
        } catch (Exception e) {
            try {
                nm.notify(
                    notificationId,
                    buildNotification(
                        context,
                        android.R.drawable.ic_popup_reminder,
                        largeIcon,
                        title,
                        body,
                        subText,
                        contentIntent
                    )
                );
                return true;
            } catch (Exception ignored) {
                return false;
            }
        }
    }

    private static Notification buildNotification(
        Context context,
        int smallIconRes,
        Bitmap largeIcon,
        String title,
        String body,
        String subText,
        PendingIntent contentIntent
    ) {
        Notification.Builder builder = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
            ? new Notification.Builder(context, CHANNEL_UPDATES_ID)
            : new Notification.Builder(context);

        builder.setSmallIcon(smallIconRes);
        if (largeIcon != null) {
            builder.setLargeIcon(largeIcon);
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

        return builder.build();
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
        checkRemoteUpdatesAsync(context, false);
    }

    public static void checkRemoteUpdatesAsync(Context context, boolean force) {
        final Context appCtx = context.getApplicationContext();
        bgExecutor.execute(() -> checkRemoteContentAndNotify(appCtx, force));
    }

    public static void checkRemoteContentAndNotify(Context context) {
        checkRemoteContentAndNotify(context, false);
    }

    public static void checkRemoteContentAndNotify(Context context, boolean force) {
        if (!isNetworkAvailable(context)) return;

        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        long now = System.currentTimeMillis();
        long lastCheck = prefs.getLong(KEY_LAST_CHECK_MS, 0L);
        if (!force && (now - lastCheck) < MIN_CHECK_INTERVAL_MS) return;
        prefs.edit().putLong(KEY_LAST_CHECK_MS, now).apply();

        // 1. Check Khanqah Message / Latest Update TXT
        try {
            String msgText = fetchPlainUpdateMessage();
            if (msgText != null && msgText.length() >= 4) {
                String sig = String.valueOf(msgText.hashCode()) + ":" + msgText.length();
                String prevSig = prefs.getString(KEY_LAST_MSG_SIG, "");
                if (prevSig.isEmpty()) {
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

        // 2. Check Archive.org New Bayan / Book / Poster Upload (both new folders & new files in existing folders!)
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
                        String latestStamp = extractLatestOaiStamp(top);
                        String sig = id + "|" + latestStamp;
                        String prevSig = prefs.getString(KEY_LAST_ARCHIVE_SIG, "");

                        if (!id.isEmpty()) {
                            if (prevSig.isEmpty()) {
                                prefs.edit().putString(KEY_LAST_ARCHIVE_SIG, sig).apply();
                            } else if (!prevSig.equals(sig)) {
                                prefs.edit().putString(KEY_LAST_ARCHIVE_SIG, sig).apply();
                                String fileDetail = fetchNewestArchiveFileTitle(id);
                                String displayBody = (fileDetail != null && !fileDetail.isEmpty())
                                    ? fileDetail + " — " + title
                                    : title;
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
                                showStyledNotification(context, heading, displayBody, sub, 5002);
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

    private static String extractLatestOaiStamp(JSONObject top) {
        Object oai = top.opt("oai_updatedate");
        if (oai instanceof JSONArray) {
            JSONArray arr = (JSONArray) oai;
            if (arr.length() > 0) {
                return arr.optString(arr.length() - 1, top.optString("addeddate", ""));
            }
        } else if (oai instanceof String) {
            return (String) oai;
        }
        return top.optString("addeddate", "");
    }

    private static String fetchNewestArchiveFileTitle(String identifier) {
        try {
            String raw = fetchUrl("https://archive.org/metadata/" + identifier + "/files");
            if (raw == null || raw.isEmpty()) return null;
            JSONObject obj = new JSONObject(raw);
            JSONArray result = obj.optJSONArray("result");
            if (result == null) return null;

            long bestMtime = 0L;
            String bestName = null;
            for (int i = 0; i < result.length(); i++) {
                JSONObject f = result.optJSONObject(i);
                if (f == null) continue;
                String name = f.optString("name", "");
                String lower = name.toLowerCase();
                if (!(lower.endsWith(".mp3") || lower.endsWith(".m4a") || lower.endsWith(".ogg")
                    || lower.endsWith(".pdf") || lower.endsWith(".jpg") || lower.endsWith(".jpeg")
                    || lower.endsWith(".png") || lower.endsWith(".webp"))) {
                    continue;
                }
                if (lower.contains("_thumb") || lower.contains("__ia_thumb")) continue;
                long mtime = 0L;
                try {
                    mtime = Long.parseLong(f.optString("mtime", "0"));
                } catch (Exception ignored) {
                }
                if (mtime >= bestMtime) {
                    bestMtime = mtime;
                    String title = f.optString("title", "");
                    if (title.isEmpty()) {
                        int slash = name.lastIndexOf('/');
                        String base = slash >= 0 ? name.substring(slash + 1) : name;
                        int dot = base.lastIndexOf('.');
                        title = dot > 0 ? base.substring(0, dot) : base;
                    }
                    bestName = title.replace('_', ' ').trim();
                }
            }
            return bestName;
        } catch (Exception e) {
            return null;
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
        BufferedReader reader = null;
        try {
            URL url = new URL(urlStr);
            conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(4500);
            conn.setReadTimeout(4500);
            conn.setUseCaches(false);
            conn.setInstanceFollowRedirects(true);
            conn.setRequestProperty("Cache-Control", "no-cache");
            if (conn.getResponseCode() != HttpURLConnection.HTTP_OK) {
                return null;
            }
            reader = new BufferedReader(
                new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8)
            );
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line).append('\n');
                if (sb.length() > 128_000) break;
            }
            return sb.toString();
        } catch (Exception e) {
            return null;
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
