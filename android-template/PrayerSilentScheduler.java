package com.khanqahdarulfalah.app;

import android.app.AlarmManager;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.media.AudioManager;
import android.os.Build;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Calendar;

public class PrayerSilentScheduler {

    public static final String PREFS_NAME = "kdf_auto_silent_prefs";
    public static final String KEY_ENABLED = "master_enabled";
    public static final String KEY_SLOTS_JSON = "slots_json";
    public static final String KEY_IS_SILENCED = "is_currently_silenced";
    public static final String KEY_PREV_FILTER = "prev_interruption_filter";
    public static final String KEY_PREV_RINGER = "prev_ringer_mode";

    public static final String ACTION_SILENT_TRIGGER = "com.khanqahdarulfalah.app.ACTION_PRAYER_SILENT";
    public static final String EXTRA_EVENT_TYPE = "event_type"; // "START" or "END"
    public static final String EXTRA_SLOT_KEY = "slot_key";
    public static final String EXTRA_SLOT_LABEL = "slot_label";

    private static final int BASE_REQUEST_CODE = 2000;
    private static final int MAX_SLOTS = 8;

    public static boolean hasDndPermission(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            NotificationManager nm =
                (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            return nm != null && nm.isNotificationPolicyAccessGranted();
        }
        return true;
    }

    public static boolean hasExactAlarmPermission(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            return am == null || am.canScheduleExactAlarms();
        }
        return true;
    }

    public static void saveConfigAndSchedule(Context context, String jsonConfig) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        try {
            JSONObject obj = new JSONObject(jsonConfig);
            boolean enabled = obj.optBoolean("enabled", true);
            JSONArray slots = obj.optJSONArray("slots");
            SharedPreferences.Editor editor = prefs.edit();
            editor.putBoolean(KEY_ENABLED, enabled);
            if (slots != null) {
                editor.putString(KEY_SLOTS_JSON, slots.toString());
            }
            editor.apply();
        } catch (Exception ignored) {
        }
        scheduleAll(context);
    }

    public static int getActiveScheduledCount(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        if (!prefs.getBoolean(KEY_ENABLED, false)) return 0;
        String raw = prefs.getString(KEY_SLOTS_JSON, "[]");
        int count = 0;
        try {
            JSONArray arr = new JSONArray(raw);
            for (int i = 0; i < arr.length(); i++) {
                JSONObject item = arr.optJSONObject(i);
                if (item != null && item.optBoolean("enabled", true)) {
                    count++;
                }
            }
        } catch (Exception ignored) {
        }
        return count;
    }

    public static boolean isMasterEnabled(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        return prefs.getBoolean(KEY_ENABLED, false);
    }

    public static void scheduleAll(Context context) {
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;

        // Cancel any previously armed prayer alarms first
        for (int i = 0; i < MAX_SLOTS; i++) {
            cancelAlarm(context, am, BASE_REQUEST_CODE + (i * 2));
            cancelAlarm(context, am, BASE_REQUEST_CODE + (i * 2) + 1);
        }

        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        boolean enabled = prefs.getBoolean(KEY_ENABLED, false);
        if (!enabled || !hasDndPermission(context)) {
            return;
        }

        String raw = prefs.getString(KEY_SLOTS_JSON, "[]");
        try {
            JSONArray arr = new JSONArray(raw);
            int limit = Math.min(arr.length(), MAX_SLOTS);
            long now = System.currentTimeMillis();

            for (int i = 0; i < limit; i++) {
                JSONObject slot = arr.optJSONObject(i);
                if (slot == null || !slot.optBoolean("enabled", true)) continue;

                String key = slot.optString("key", "Prayer" + i);
                String label = slot.optString("labelUrdu", key);
                String start = slot.optString("start", "");
                String end = slot.optString("end", "");
                boolean isFridayOnly = "Jummah".equalsIgnoreCase(key);

                long startMillis = computeNextTriggerMillis(start, isFridayOnly, now);
                long endMillis = computeNextTriggerMillis(end, isFridayOnly, now);

                if (startMillis > 0) {
                    armAlarm(
                        context,
                        am,
                        BASE_REQUEST_CODE + (i * 2),
                        startMillis,
                        "START",
                        key,
                        label
                    );
                }
                if (endMillis > 0) {
                    armAlarm(
                        context,
                        am,
                        BASE_REQUEST_CODE + (i * 2) + 1,
                        endMillis,
                        "END",
                        key,
                        label
                    );
                }
            }
        } catch (Exception ignored) {
        }
    }

    private static void cancelAlarm(Context context, AlarmManager am, int requestCode) {
        Intent intent = new Intent(context, PrayerSilentReceiver.class);
        intent.setAction(ACTION_SILENT_TRIGGER);
        int flags = Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
            ? PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE
            : PendingIntent.FLAG_NO_CREATE;
        PendingIntent existing = PendingIntent.getBroadcast(context, requestCode, intent, flags);
        if (existing != null) {
            am.cancel(existing);
            existing.cancel();
        }
    }

    private static void armAlarm(
        Context context,
        AlarmManager am,
        int requestCode,
        long triggerAtMillis,
        String eventType,
        String slotKey,
        String slotLabel
    ) {
        Intent intent = new Intent(context, PrayerSilentReceiver.class);
        intent.setAction(ACTION_SILENT_TRIGGER);
        intent.putExtra(EXTRA_EVENT_TYPE, eventType);
        intent.putExtra(EXTRA_SLOT_KEY, slotKey);
        intent.putExtra(EXTRA_SLOT_LABEL, slotLabel);

        int flags = Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
            ? PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            : PendingIntent.FLAG_UPDATE_CURRENT;
        PendingIntent pi = PendingIntent.getBroadcast(context, requestCode, intent, flags);

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !am.canScheduleExactAlarms()) {
                am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, pi);
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, pi);
            } else {
                am.setExact(AlarmManager.RTC_WAKEUP, triggerAtMillis, pi);
            }
        } catch (SecurityException se) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, pi);
            } else {
                am.set(AlarmManager.RTC_WAKEUP, triggerAtMillis, pi);
            }
        }
    }

    private static long computeNextTriggerMillis(String hhmm, boolean isFridayOnly, long nowMillis) {
        if (hhmm == null || !hhmm.contains(":")) return -1L;
        String[] parts = hhmm.trim().split(":");
        if (parts.length < 2) return -1L;
        int hour;
        int minute;
        try {
            hour = Integer.parseInt(parts[0].trim());
            minute = Integer.parseInt(parts[1].trim());
        } catch (NumberFormatException e) {
            return -1L;
        }
        if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return -1L;

        Calendar cal = Calendar.getInstance();
        cal.setTimeInMillis(nowMillis);
        cal.set(Calendar.HOUR_OF_DAY, hour);
        cal.set(Calendar.MINUTE, minute);
        cal.set(Calendar.SECOND, 0);
        cal.set(Calendar.MILLISECOND, 0);

        if (isFridayOnly) {
            while (cal.get(Calendar.DAY_OF_WEEK) != Calendar.FRIDAY) {
                cal.add(Calendar.DAY_OF_YEAR, 1);
            }
            if (cal.getTimeInMillis() <= nowMillis + 1500L) {
                cal.add(Calendar.DAY_OF_YEAR, 7);
            }
        } else {
            if (cal.getTimeInMillis() <= nowMillis + 1500L) {
                cal.add(Calendar.DAY_OF_YEAR, 1);
            }
        }

        return cal.getTimeInMillis();
    }

    public static boolean applySilentState(Context context, boolean enableSilent) {
        if (!hasDndPermission(context)) return false;

        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        NotificationManager nm =
            (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        AudioManager am =
            (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);

        if (nm == null) return false;

        try {
            if (enableSilent) {
                if (!prefs.getBoolean(KEY_IS_SILENCED, false)) {
                    int currentFilter = Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
                        ? nm.getCurrentInterruptionFilter()
                        : NotificationManager.INTERRUPTION_FILTER_ALL;
                    int currentRinger = am != null
                        ? am.getRingerMode()
                        : AudioManager.RINGER_MODE_NORMAL;
                    prefs.edit()
                        .putBoolean(KEY_IS_SILENCED, true)
                        .putInt(KEY_PREV_FILTER, currentFilter)
                        .putInt(KEY_PREV_RINGER, currentRinger)
                        .apply();
                }

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    nm.setInterruptionFilter(NotificationManager.INTERRUPTION_FILTER_ALARMS);
                }
                if (am != null) {
                    try {
                        am.setRingerMode(AudioManager.RINGER_MODE_SILENT);
                    } catch (SecurityException ignored) {
                    }
                }
            } else {
                int prevFilter = prefs.getInt(KEY_PREV_FILTER, NotificationManager.INTERRUPTION_FILTER_ALL);
                int prevRinger = prefs.getInt(KEY_PREV_RINGER, AudioManager.RINGER_MODE_NORMAL);

                if (prevFilter <= 0 || prevFilter == NotificationManager.INTERRUPTION_FILTER_NONE
                    || prevFilter == NotificationManager.INTERRUPTION_FILTER_ALARMS) {
                    prevFilter = NotificationManager.INTERRUPTION_FILTER_ALL;
                }
                if (prevRinger < 0 || prevRinger == AudioManager.RINGER_MODE_SILENT) {
                    prevRinger = AudioManager.RINGER_MODE_NORMAL;
                }

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    nm.setInterruptionFilter(prevFilter);
                }
                if (am != null) {
                    try {
                        am.setRingerMode(prevRinger);
                    } catch (SecurityException ignored) {
                    }
                }
                prefs.edit().putBoolean(KEY_IS_SILENCED, false).apply();
            }
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
