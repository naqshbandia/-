package com.khanqahdarulfalah.app;

import android.app.AlarmManager;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.media.AudioManager;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Calendar;

public class PrayerSilentScheduler {

    public static final String PREFS_NAME = "kdf_auto_silent_prefs";
    public static final String KEY_ENABLED = "master_enabled";
    public static final String KEY_SLOTS_JSON = "slots_json";
    public static final String KEY_IS_SILENCED = "is_currently_silenced";
    public static final String KEY_SILENCED_UNTIL_MS = "silenced_until_ms";
    public static final String KEY_LAST_ENTERED_WINDOW_ID = "last_entered_window_id";
    public static final String KEY_PREV_FILTER = "prev_interruption_filter";
    public static final String KEY_PREV_RINGER = "prev_ringer_mode";
    public static final String KEY_PREV_RING_VOL = "prev_ring_volume";
    public static final String KEY_PENDING_END_VERIFY = "pending_end_verify";
    public static final String KEY_END_VERIFY_AT_MS = "end_verify_at_ms";
    public static final String KEY_SILENT_MODE = "silent_mode"; // "vibrate" | "silent"

    public static final String ACTION_SILENT_TRIGGER = "com.khanqahdarulfalah.app.ACTION_PRAYER_SILENT";
    public static final String ACTION_MANUAL_EXIT_SILENT = "com.khanqahdarulfalah.app.ACTION_MANUAL_EXIT_SILENT";
    public static final String EXTRA_EVENT_TYPE = "event_type"; // "START" | "END" | "SAFETY_END"
    public static final String EXTRA_SLOT_KEY = "slot_key";
    public static final String EXTRA_SLOT_LABEL = "slot_label";
    public static final String EXTRA_END_MILLIS = "end_millis";
    public static final String EXTRA_WINDOW_ID = "window_id";

    private static final int BASE_REQUEST_CODE = 2000;
    private static final int SAFETY_END_REQUEST_CODE = 2999;
    private static final int SAFETY_END_2_REQUEST_CODE = 2998;
    private static final int SAFETY_END_3_REQUEST_CODE = 2997;
    private static final int MAX_SLOTS = 8;

    public static class ActiveWindowInfo {
        public final boolean active;
        public final long endMillis;
        public final String windowId;
        public final String slotKey;
        public final String slotLabel;

        public ActiveWindowInfo(
            boolean active,
            long endMillis,
            String windowId,
            String slotKey,
            String slotLabel
        ) {
            this.active = active;
            this.endMillis = endMillis;
            this.windowId = windowId;
            this.slotKey = slotKey;
            this.slotLabel = slotLabel;
        }
    }

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

    public static String getSilentMode(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String mode = prefs.getString(KEY_SILENT_MODE, "silent");
        return "vibrate".equalsIgnoreCase(mode) ? "vibrate" : "silent";
    }

    public static boolean isCurrentlySilent(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                NotificationManager nm =
                    (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
                if (nm != null) {
                    int filter = nm.getCurrentInterruptionFilter();
                    if (filter != NotificationManager.INTERRUPTION_FILTER_ALL &&
                        filter != NotificationManager.INTERRUPTION_FILTER_UNKNOWN) {
                        return true;
                    }
                }
            }
            AudioManager am = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
            if (am != null) {
                int ringer = am.getRingerMode();
                if (ringer == AudioManager.RINGER_MODE_SILENT) {
                    return true;
                }
                if (ringer == AudioManager.RINGER_MODE_VIBRATE && prefs.getBoolean(KEY_IS_SILENCED, false)) {
                    return true;
                }
            }
        } catch (Exception ignored) {
        }
        return prefs.getBoolean(KEY_IS_SILENCED, false);
    }

    public static void saveConfigAndSchedule(Context context, String jsonConfig) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        try {
            JSONObject obj = new JSONObject(jsonConfig);
            boolean enabled = obj.optBoolean("enabled", true);
            String silentMode = "vibrate".equalsIgnoreCase(obj.optString("silentMode", "silent"))
                ? "vibrate"
                : "silent";
            JSONArray slots = obj.optJSONArray("slots");
            String nextSlotsJson = slots != null ? slots.toString() : null;
            String prevSlotsJson = prefs.getString(KEY_SLOTS_JSON, "");
            SharedPreferences.Editor editor = prefs.edit();
            editor.putBoolean(KEY_ENABLED, enabled);
            editor.putString(KEY_SILENT_MODE, silentMode);
            if (nextSlotsJson != null) {
                editor.putString(KEY_SLOTS_JSON, nextSlotsJson);
                if (!nextSlotsJson.equals(prevSlotsJson)) {
                    editor.remove(KEY_LAST_ENTERED_WINDOW_ID);
                }
            }
            editor.apply();
        } catch (Exception ignored) {
        }
        reconcileAndScheduleAll(context, true);
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
        reconcileAndScheduleAll(context, false);
    }

    public static void reconcileAndScheduleAll(Context context, boolean applyIfInsideActiveWindow) {
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;

        // Cancel all previously armed prayer alarms (START, END, and SAFETY_END)
        for (int i = 0; i < MAX_SLOTS; i++) {
            cancelAlarm(context, am, BASE_REQUEST_CODE + (i * 2), "START", i);
            cancelAlarm(context, am, BASE_REQUEST_CODE + (i * 2) + 1, "END", i);
        }
        cancelAlarm(context, am, SAFETY_END_REQUEST_CODE, "SAFETY_END", 99);
        cancelAlarm(context, am, SAFETY_END_2_REQUEST_CODE, "SAFETY_END", 98);
        cancelAlarm(context, am, SAFETY_END_3_REQUEST_CODE, "SAFETY_END", 97);

        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        boolean enabled = prefs.getBoolean(KEY_ENABLED, false);

        if (!enabled || !hasDndPermission(context)) {
            // If Auto-Silent was turned OFF while currently silenced by the app, exit DND immediately
            if (!enabled && prefs.getBoolean(KEY_IS_SILENCED, false)) {
                applySilentState(context, false);
            } else {
                stopSilentMonitorService(context);
            }
            return;
        }

        long now = System.currentTimeMillis();
        ActiveWindowInfo activeNow = getActiveWindowInfo(context, now);
        boolean currentlyMarkedSilenced = prefs.getBoolean(KEY_IS_SILENCED, false);
        boolean pendingEndVerify = prefs.getBoolean(KEY_PENDING_END_VERIFY, false);
        long endVerifyAt = prefs.getLong(KEY_END_VERIFY_AT_MS, 0L);

        if (!activeNow.active && (currentlyMarkedSilenced || (pendingEndVerify && (now - endVerifyAt) > 2500L))) {
            // Self-heal: prayer window already ended while phone was asleep/off -> immediately restore normal sound
            applySilentState(context, false);
            currentlyMarkedSilenced = false;
        } else if (activeNow.active && applyIfInsideActiveWindow && !currentlyMarkedSilenced) {
            String lastWindow = prefs.getString(KEY_LAST_ENTERED_WINDOW_ID, "");
            if (!activeNow.windowId.equals(lastWindow)) {
                prefs.edit()
                    .putString(KEY_LAST_ENTERED_WINDOW_ID, activeNow.windowId)
                    .putLong(KEY_SILENCED_UNTIL_MS, activeNow.endMillis)
                    .putBoolean(KEY_PENDING_END_VERIFY, false)
                    .commit();
                applySilentState(context, true);
                currentlyMarkedSilenced = true;
            }
        } else if (activeNow.active && currentlyMarkedSilenced) {
            startSilentMonitorService(context, activeNow.endMillis, activeNow.slotKey, activeNow.slotLabel);
        }

        String raw = prefs.getString(KEY_SLOTS_JSON, "[]");
        try {
            JSONArray arr = new JSONArray(raw);
            int limit = Math.min(arr.length(), MAX_SLOTS);

            long soonestStartMillis = Long.MAX_VALUE;
            long soonestEndMillis = Long.MAX_VALUE;
            for (int i = 0; i < limit; i++) {
                JSONObject slot = arr.optJSONObject(i);
                if (slot == null || !slot.optBoolean("enabled", true)) continue;
                String key = slot.optString("key", "Prayer" + i);
                boolean isFridayOnly = "Jummah".equalsIgnoreCase(key);
                int[] startParts = parseTimeParts(slot.optString("start", ""));
                int[] endParts = parseTimeParts(slot.optString("end", ""));
                if (startParts == null || endParts == null) continue;
                long candidateStart = computeNextTriggerMillis(startParts, isFridayOnly, now);
                if (candidateStart > now && candidateStart < soonestStartMillis) {
                    soonestStartMillis = candidateStart;
                }
                long activeEnd = findActiveSlotEndMillis(startParts, endParts, isFridayOnly, now);
                long candidateEnd = activeEnd > 0
                    ? activeEnd
                    : computeNextEndMillis(startParts, endParts, isFridayOnly, now);
                if (candidateEnd > now && candidateEnd < soonestEndMillis) {
                    soonestEndMillis = candidateEnd;
                }
            }

            for (int i = 0; i < limit; i++) {
                JSONObject slot = arr.optJSONObject(i);
                if (slot == null || !slot.optBoolean("enabled", true)) continue;

                String key = slot.optString("key", "Prayer" + i);
                String label = slot.optString("labelUrdu", key);
                String start = slot.optString("start", "");
                String end = slot.optString("end", "");
                boolean isFridayOnly = "Jummah".equalsIgnoreCase(key);

                int[] startParts = parseTimeParts(start);
                int[] endParts = parseTimeParts(end);
                if (startParts == null || endParts == null) continue;

                int startMinutes = startParts[0] * 60 + startParts[1];
                int endMinutes = endParts[0] * 60 + endParts[1];
                if (startMinutes == endMinutes) continue;

                long activeSlotEnd = findActiveSlotEndMillis(startParts, endParts, isFridayOnly, now);
                long nextStartMillis = computeNextTriggerMillis(startParts, isFridayOnly, now);
                long nextEndMillis = activeSlotEnd > 0
                    ? activeSlotEnd
                    : computeNextEndMillis(startParts, endParts, isFridayOnly, now);

                if (nextStartMillis > now) {
                    boolean isSoonestStart = (nextStartMillis == soonestStartMillis);
                    armAlarm(
                        context,
                        am,
                        BASE_REQUEST_CODE + (i * 2),
                        nextStartMillis,
                        "START",
                        key,
                        label,
                        i,
                        nextEndMillis,
                        isSoonestStart
                    );
                }

                if (nextEndMillis > now) {
                    // Always use highest-priority AlarmClock for active slot END or soonest upcoming END
                    boolean preferAlarmClock = (activeSlotEnd > 0) || currentlyMarkedSilenced || (nextEndMillis == soonestEndMillis);
                    armAlarm(
                        context,
                        am,
                        BASE_REQUEST_CODE + (i * 2) + 1,
                        nextEndMillis,
                        "END",
                        key,
                        label,
                        i,
                        nextEndMillis,
                        preferAlarmClock
                    );
                }
            }

            // Always arm three safety verification END alarms (+30s, +120s, +300s) so Doze/OEM never leaves DND stuck
            boolean stillSilencedOrPending =
                prefs.getBoolean(KEY_IS_SILENCED, false) || prefs.getBoolean(KEY_PENDING_END_VERIFY, false);
            if (activeNow.active || stillSilencedOrPending) {
                long baseEnd = activeNow.active ? activeNow.endMillis : now;
                long safetyTarget = baseEnd + 30_000L;
                long safetyTarget2 = baseEnd + 120_000L;
                long safetyTarget3 = baseEnd + 300_000L;
                if (safetyTarget > now) {
                    armAlarm(
                        context,
                        am,
                        SAFETY_END_REQUEST_CODE,
                        safetyTarget,
                        "SAFETY_END",
                        "SafetyEnd",
                        "واپس نارمل موڈ",
                        99,
                        safetyTarget,
                        true
                    );
                }
                if (safetyTarget2 > now) {
                    armAlarm(
                        context,
                        am,
                        SAFETY_END_2_REQUEST_CODE,
                        safetyTarget2,
                        "SAFETY_END",
                        "SafetyEnd2",
                        "واپس نارمل موڈ",
                        98,
                        safetyTarget2,
                        true
                    );
                }
                if (safetyTarget3 > now) {
                    armAlarm(
                        context,
                        am,
                        SAFETY_END_3_REQUEST_CODE,
                        safetyTarget3,
                        "SAFETY_END",
                        "SafetyEnd3",
                        "واپس نارمل موڈ",
                        97,
                        safetyTarget3,
                        true
                    );
                }
            }
        } catch (Exception ignored) {
        }
    }

    public static ActiveWindowInfo getActiveWindowInfo(Context context, long nowMillis) {
        return getOverlappingActiveWindowExcluding(context, nowMillis, null, 0L);
    }

    public static ActiveWindowInfo getOverlappingActiveWindowExcluding(
        Context context,
        long nowMillis,
        String excludeSlotKey,
        long excludeEndMillis
    ) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        if (!prefs.getBoolean(KEY_ENABLED, false)) {
            return new ActiveWindowInfo(false, 0L, "", "", "");
        }
        String raw = prefs.getString(KEY_SLOTS_JSON, "[]");
        boolean anyActive = false;
        long maxEndMillis = 0L;
        String activeWindowId = "";
        String activeSlotKey = "";
        String activeSlotLabel = "";

        try {
            JSONArray arr = new JSONArray(raw);
            int limit = Math.min(arr.length(), MAX_SLOTS);
            for (int i = 0; i < limit; i++) {
                JSONObject slot = arr.optJSONObject(i);
                if (slot == null || !slot.optBoolean("enabled", true)) continue;

                String key = slot.optString("key", "Prayer" + i);
                String label = slot.optString("labelUrdu", key);
                if (excludeSlotKey != null && !excludeSlotKey.isEmpty() && excludeSlotKey.equals(key)) {
                    continue;
                }
                boolean isFridayOnly = "Jummah".equalsIgnoreCase(key);
                int[] startParts = parseTimeParts(slot.optString("start", ""));
                int[] endParts = parseTimeParts(slot.optString("end", ""));
                if (startParts == null || endParts == null) continue;

                long slotEnd = findActiveSlotEndMillis(startParts, endParts, isFridayOnly, nowMillis);
                if (slotEnd > 0 && nowMillis < slotEnd) {
                    if (excludeEndMillis > 0L && slotEnd <= excludeEndMillis + 60_000L) {
                        continue;
                    }
                    anyActive = true;
                    if (slotEnd > maxEndMillis) {
                        maxEndMillis = slotEnd;
                        activeWindowId = key + "_" + slotEnd;
                        activeSlotKey = key;
                        activeSlotLabel = label;
                    }
                }
            }
        } catch (Exception ignored) {
        }

        return new ActiveWindowInfo(anyActive, maxEndMillis, activeWindowId, activeSlotKey, activeSlotLabel);
    }

    private static int[] parseTimeParts(String hhmm) {
        if (hhmm == null || !hhmm.contains(":")) return null;
        String[] parts = hhmm.trim().split(":");
        if (parts.length < 2) return null;
        try {
            int hour = Integer.parseInt(parts[0].trim());
            int minute = Integer.parseInt(parts[1].trim());
            if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
            return new int[]{hour, minute};
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /**
     * Checks if nowMillis falls inside [start, end) (tolerating up to 15s early alarm wake-up edge),
     * handling both same-day slots and midnight-crossing slots + Friday-only Jummah.
     */
    private static long findActiveSlotEndMillis(
        int[] startParts,
        int[] endParts,
        boolean isFridayOnly,
        long nowMillis
    ) {
        int startMins = startParts[0] * 60 + startParts[1];
        int endMins = endParts[0] * 60 + endParts[1];
        if (startMins == endMins) return -1L;

        Calendar base = Calendar.getInstance();
        base.setTimeInMillis(nowMillis);
        base.set(Calendar.SECOND, 0);
        base.set(Calendar.MILLISECOND, 0);

        if (endMins > startMins) {
            if (isFridayOnly && base.get(Calendar.DAY_OF_WEEK) != Calendar.FRIDAY) {
                return -1L;
            }
            Calendar startCal = (Calendar) base.clone();
            startCal.set(Calendar.HOUR_OF_DAY, startParts[0]);
            startCal.set(Calendar.MINUTE, startParts[1]);

            Calendar endCal = (Calendar) base.clone();
            endCal.set(Calendar.HOUR_OF_DAY, endParts[0]);
            endCal.set(Calendar.MINUTE, endParts[1]);

            long s = startCal.getTimeInMillis();
            long e = endCal.getTimeInMillis();
            if (nowMillis >= (s - 10_000L) && nowMillis < (e - 2_000L)) {
                return e;
            }
            return -1L;
        } else {
            // Midnight-spanning window (e.g. 23:50 -> 00:20)
            // Check window that started TODAY
            Calendar todayStart = (Calendar) base.clone();
            todayStart.set(Calendar.HOUR_OF_DAY, startParts[0]);
            todayStart.set(Calendar.MINUTE, startParts[1]);
            Calendar tomorrowEnd = (Calendar) base.clone();
            tomorrowEnd.add(Calendar.DAY_OF_YEAR, 1);
            tomorrowEnd.set(Calendar.HOUR_OF_DAY, endParts[0]);
            tomorrowEnd.set(Calendar.MINUTE, endParts[1]);

            boolean todayOk = !isFridayOnly || todayStart.get(Calendar.DAY_OF_WEEK) == Calendar.FRIDAY;
            if (todayOk && nowMillis >= (todayStart.getTimeInMillis() - 10_000L)
                && nowMillis < (tomorrowEnd.getTimeInMillis() - 2_000L)) {
                return tomorrowEnd.getTimeInMillis();
            }

            // Check window that started YESTERDAY
            Calendar yesterdayStart = (Calendar) base.clone();
            yesterdayStart.add(Calendar.DAY_OF_YEAR, -1);
            yesterdayStart.set(Calendar.HOUR_OF_DAY, startParts[0]);
            yesterdayStart.set(Calendar.MINUTE, startParts[1]);
            Calendar todayEnd = (Calendar) base.clone();
            todayEnd.set(Calendar.HOUR_OF_DAY, endParts[0]);
            todayEnd.set(Calendar.MINUTE, endParts[1]);

            boolean yesterdayOk = !isFridayOnly || yesterdayStart.get(Calendar.DAY_OF_WEEK) == Calendar.FRIDAY;
            if (yesterdayOk && nowMillis >= (yesterdayStart.getTimeInMillis() - 10_000L)
                && nowMillis < (todayEnd.getTimeInMillis() - 2_000L)) {
                return todayEnd.getTimeInMillis();
            }

            return -1L;
        }
    }

    private static long computeNextTriggerMillis(int[] timeParts, boolean isFridayOnly, long nowMillis) {
        Calendar cal = Calendar.getInstance();
        cal.setTimeInMillis(nowMillis);
        cal.set(Calendar.HOUR_OF_DAY, timeParts[0]);
        cal.set(Calendar.MINUTE, timeParts[1]);
        cal.set(Calendar.SECOND, 0);
        cal.set(Calendar.MILLISECOND, 0);

        if (isFridayOnly) {
            while (cal.get(Calendar.DAY_OF_WEEK) != Calendar.FRIDAY) {
                cal.add(Calendar.DAY_OF_YEAR, 1);
            }
            if (cal.getTimeInMillis() <= nowMillis + 2_000L) {
                cal.add(Calendar.DAY_OF_YEAR, 7);
            }
        } else {
            if (cal.getTimeInMillis() <= nowMillis + 2_000L) {
                cal.add(Calendar.DAY_OF_YEAR, 1);
            }
        }

        return cal.getTimeInMillis();
    }

    private static long computeNextEndMillis(
        int[] startParts,
        int[] endParts,
        boolean isFridayOnly,
        long nowMillis
    ) {
        long nextStart = computeNextTriggerMillis(startParts, isFridayOnly, nowMillis);
        long nextEndSameCycle = computeNextTriggerMillis(endParts, isFridayOnly, nowMillis);
        int startMins = startParts[0] * 60 + startParts[1];
        int endMins = endParts[0] * 60 + endParts[1];
        if (endMins < startMins && nextEndSameCycle <= nextStart) {
            // Next end for midnight-crossing slot is 1 day after that start
            Calendar cal = Calendar.getInstance();
            cal.setTimeInMillis(nextStart);
            cal.add(Calendar.DAY_OF_YEAR, 1);
            cal.set(Calendar.HOUR_OF_DAY, endParts[0]);
            cal.set(Calendar.MINUTE, endParts[1]);
            cal.set(Calendar.SECOND, 0);
            cal.set(Calendar.MILLISECOND, 0);
            return cal.getTimeInMillis();
        }
        return nextEndSameCycle;
    }

    private static Uri buildAlarmDataUri(String eventType, int slotIndex, int requestCode) {
        return Uri.parse("kdf://prayer-silent/" + eventType + "/" + slotIndex + "/" + requestCode);
    }

    private static void cancelAlarm(
        Context context,
        AlarmManager am,
        int requestCode,
        String eventType,
        int slotIndex
    ) {
        // Cancel both URI-tagged and legacy no-URI PendingIntents cleanly
        for (Uri dataUri : new Uri[]{buildAlarmDataUri(eventType, slotIndex, requestCode), null}) {
            Intent intent = new Intent(context, PrayerSilentReceiver.class);
            intent.setAction(ACTION_SILENT_TRIGGER);
            if (dataUri != null) {
                intent.setData(dataUri);
            }
            int flags = Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
                ? PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE
                : PendingIntent.FLAG_NO_CREATE;
            PendingIntent existing = PendingIntent.getBroadcast(context, requestCode, intent, flags);
            if (existing != null) {
                am.cancel(existing);
                existing.cancel();
            }
        }
    }

    private static void armAlarm(
        Context context,
        AlarmManager am,
        int requestCode,
        long triggerAtMillis,
        String eventType,
        String slotKey,
        String slotLabel,
        int slotIndex,
        long endMillis,
        boolean preferAlarmClock
    ) {
        Intent intent = new Intent(context, PrayerSilentReceiver.class);
        intent.setAction(ACTION_SILENT_TRIGGER);
        intent.addFlags(Intent.FLAG_RECEIVER_FOREGROUND);
        intent.setData(buildAlarmDataUri(eventType, slotIndex, requestCode));
        intent.putExtra(EXTRA_EVENT_TYPE, eventType);
        intent.putExtra(EXTRA_SLOT_KEY, slotKey);
        intent.putExtra(EXTRA_SLOT_LABEL, slotLabel);
        intent.putExtra(EXTRA_END_MILLIS, endMillis);
        intent.putExtra(EXTRA_WINDOW_ID, slotKey + "_" + endMillis);

        int flags = Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
            ? PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            : PendingIntent.FLAG_UPDATE_CURRENT;
        PendingIntent pi = PendingIntent.getBroadcast(context, requestCode, intent, flags);

        boolean canExact = Build.VERSION.SDK_INT < Build.VERSION_CODES.S || am.canScheduleExactAlarms();

        try {
            if (preferAlarmClock && canExact && Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                Intent showIntent = new Intent(context, MainActivity.class);
                showIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
                PendingIntent showPi = PendingIntent.getActivity(context, 9001, showIntent, flags);
                AlarmManager.AlarmClockInfo info = new AlarmManager.AlarmClockInfo(triggerAtMillis, showPi);
                am.setAlarmClock(info, pi);
            } else if (!canExact) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, pi);
                } else {
                    am.set(AlarmManager.RTC_WAKEUP, triggerAtMillis, pi);
                }
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, pi);
            } else {
                am.setExact(AlarmManager.RTC_WAKEUP, triggerAtMillis, pi);
            }
        } catch (SecurityException se) {
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, pi);
                } else {
                    am.set(AlarmManager.RTC_WAKEUP, triggerAtMillis, pi);
                }
            } catch (Exception ignored) {
            }
        }
    }

    public static void startSilentMonitorService(
        Context context,
        long endMillis,
        String slotKey,
        String slotLabel
    ) {
        try {
            Intent svc = new Intent(context, PrayerSilentService.class);
            if (endMillis > 0L) {
                svc.putExtra(PrayerSilentService.EXTRA_END_MILLIS, endMillis);
            }
            if (slotKey != null) {
                svc.putExtra(PrayerSilentService.EXTRA_SLOT_KEY, slotKey);
            }
            if (slotLabel != null) {
                svc.putExtra(PrayerSilentService.EXTRA_SLOT_LABEL, slotLabel);
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(svc);
            } else {
                context.startService(svc);
            }
        } catch (Throwable ignored) {
        }
    }

    public static void stopSilentMonitorService(Context context) {
        try {
            Intent svc = new Intent(context, PrayerSilentService.class);
            context.stopService(svc);
        } catch (Throwable ignored) {
        }
    }

    public static void forceRestoreNormalDnd(Context context) {
        stopSilentMonitorService(context);
        if (!hasDndPermission(context)) return;

        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        boolean isVibrateMode = "vibrate".equals(getSilentMode(context));
        int prevRinger = prefs.getInt(KEY_PREV_RINGER, AudioManager.RINGER_MODE_NORMAL);
        final int targetRinger = (!isVibrateMode && prevRinger == AudioManager.RINGER_MODE_VIBRATE)
            ? AudioManager.RINGER_MODE_VIBRATE
            : AudioManager.RINGER_MODE_NORMAL;

        prefs.edit()
            .putBoolean(KEY_IS_SILENCED, false)
            .putLong(KEY_SILENCED_UNTIL_MS, 0L)
            .putBoolean(KEY_PENDING_END_VERIFY, true)
            .putLong(KEY_END_VERIFY_AT_MS, System.currentTimeMillis())
            .commit();

        applyNormalSoundPass(context, targetRinger);

        // OEM (Transsion HiOS/XOS, Xiaomi MIUI / HyperOS & Samsung OneUI) race verification:
        // Some OEMs reset or delay DND/Vibrate change right after ringer transition; enforce NORMAL again cleanly.
        final Context appCtx = context.getApplicationContext();
        Handler mainHandler = new Handler(Looper.getMainLooper());
        mainHandler.postDelayed(() -> verifyAndClearDnd(appCtx, targetRinger, false), 250L);
        mainHandler.postDelayed(() -> verifyAndClearDnd(appCtx, targetRinger, false), 800L);
        mainHandler.postDelayed(() -> verifyAndClearDnd(appCtx, targetRinger, true), 1500L);
    }

    private static boolean applyNormalSoundPass(Context context, int targetRinger) {
        NotificationManager nm =
            (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        AudioManager am =
            (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && nm != null) {
                nm.setInterruptionFilter(NotificationManager.INTERRUPTION_FILTER_ALL);
            }
        } catch (Exception ignored) {
        }

        try {
            if (am != null) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && targetRinger == AudioManager.RINGER_MODE_NORMAL) {
                    try {
                        am.adjustStreamVolume(AudioManager.STREAM_RING, AudioManager.ADJUST_UNMUTE, 0);
                    } catch (Exception ignored) {
                    }
                }
                am.setRingerMode(targetRinger);

                // Android / Transsion HiOS reverts RINGER_MODE_NORMAL back to VIBRATE if STREAM_RING volume is 0
                if (targetRinger == AudioManager.RINGER_MODE_NORMAL) {
                    int curVol = am.getStreamVolume(AudioManager.STREAM_RING);
                    if (curVol <= 0) {
                        int maxVol = Math.max(1, am.getStreamMaxVolume(AudioManager.STREAM_RING));
                        int fallbackVol = Math.max(1, (maxVol * 2) / 3);
                        int savedVol = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                            .getInt(KEY_PREV_RING_VOL, fallbackVol);
                        if (savedVol <= 0) savedVol = fallbackVol;
                        am.setStreamVolume(AudioManager.STREAM_RING, Math.min(savedVol, maxVol), 0);
                    }
                    if (am.getRingerMode() != AudioManager.RINGER_MODE_NORMAL) {
                        am.setRingerMode(AudioManager.RINGER_MODE_NORMAL);
                    }
                }
            }
        } catch (SecurityException ignored) {
        } catch (Exception ignored) {
        }

        // Second pass on NotificationManager immediately after setRingerMode (HiOS/MIUI sync)
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && nm != null) {
                if (nm.getCurrentInterruptionFilter() != NotificationManager.INTERRUPTION_FILTER_ALL) {
                    nm.setInterruptionFilter(NotificationManager.INTERRUPTION_FILTER_ALL);
                }
            }
        } catch (Exception ignored) {
        }

        boolean filterClear = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && nm != null) {
            int f = nm.getCurrentInterruptionFilter();
            filterClear = (f == NotificationManager.INTERRUPTION_FILTER_ALL
                || f == NotificationManager.INTERRUPTION_FILTER_UNKNOWN);
        }
        boolean ringerClear = am == null || (targetRinger == AudioManager.RINGER_MODE_NORMAL
            ? am.getRingerMode() == AudioManager.RINGER_MODE_NORMAL
            : am.getRingerMode() != AudioManager.RINGER_MODE_SILENT);
        return filterClear && ringerClear;
    }

    private static void verifyAndClearDnd(Context context, int targetRinger, boolean markDoneIfClear) {
        try {
            if (!hasDndPermission(context)) return;
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            if (prefs.getBoolean(KEY_IS_SILENCED, false)) return;

            boolean isClear = applyNormalSoundPass(context, targetRinger);
            if (isClear && markDoneIfClear) {
                prefs.edit()
                    .putBoolean(KEY_PENDING_END_VERIFY, false)
                    .putLong(KEY_END_VERIFY_AT_MS, 0L)
                    .commit();
            }
        } catch (Exception ignored) {
        }
    }

    public static void completePendingEndVerification(Context context) {
        stopSilentMonitorService(context);
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        AudioManager am = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
        boolean stillVibrateWhilePending = prefs.getBoolean(KEY_PENDING_END_VERIFY, false)
            && am != null && am.getRingerMode() != AudioManager.RINGER_MODE_NORMAL;
        if (!prefs.getBoolean(KEY_PENDING_END_VERIFY, false)
            && !prefs.getBoolean(KEY_IS_SILENCED, false)
            && !stillVibrateWhilePending) {
            return;
        }
        boolean isVibrateMode = "vibrate".equals(getSilentMode(context));
        int prevRinger = prefs.getInt(KEY_PREV_RINGER, AudioManager.RINGER_MODE_NORMAL);
        int targetRinger = (!isVibrateMode && prevRinger == AudioManager.RINGER_MODE_VIBRATE)
            ? AudioManager.RINGER_MODE_VIBRATE
            : AudioManager.RINGER_MODE_NORMAL;
        applyNormalSoundPass(context, targetRinger);
        prefs.edit()
            .putBoolean(KEY_IS_SILENCED, false)
            .putLong(KEY_SILENCED_UNTIL_MS, 0L)
            .putBoolean(KEY_PENDING_END_VERIFY, false)
            .putLong(KEY_END_VERIFY_AT_MS, 0L)
            .commit();
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
                boolean useVibrateMode = "vibrate".equals(getSilentMode(context));

                if (!prefs.getBoolean(KEY_IS_SILENCED, false)) {
                    int currentRinger = am != null
                        ? am.getRingerMode()
                        : AudioManager.RINGER_MODE_NORMAL;
                    if (currentRinger == AudioManager.RINGER_MODE_SILENT
                        || (useVibrateMode && currentRinger == AudioManager.RINGER_MODE_VIBRATE)) {
                        currentRinger = AudioManager.RINGER_MODE_NORMAL;
                    }
                    SharedPreferences.Editor ed = prefs.edit()
                        .putBoolean(KEY_IS_SILENCED, true)
                        .putBoolean(KEY_PENDING_END_VERIFY, false)
                        .putLong(KEY_END_VERIFY_AT_MS, 0L)
                        .putInt(KEY_PREV_FILTER, NotificationManager.INTERRUPTION_FILTER_ALL)
                        .putInt(KEY_PREV_RINGER, currentRinger);
                    if (am != null) {
                        int ringVol = am.getStreamVolume(AudioManager.STREAM_RING);
                        if (ringVol > 0) {
                            ed.putInt(KEY_PREV_RING_VOL, ringVol);
                        }
                    }
                    ed.commit();
                } else {
                    prefs.edit().putBoolean(KEY_PENDING_END_VERIFY, false).commit();
                }

                if (useVibrateMode) {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                        nm.setInterruptionFilter(NotificationManager.INTERRUPTION_FILTER_ALL);
                    }
                    if (am != null) {
                        try {
                            am.setRingerMode(AudioManager.RINGER_MODE_VIBRATE);
                        } catch (SecurityException ignored) {
                        }
                    }
                } else {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                        nm.setInterruptionFilter(NotificationManager.INTERRUPTION_FILTER_ALARMS);
                    } else if (am != null) {
                        try {
                            am.setRingerMode(AudioManager.RINGER_MODE_SILENT);
                        } catch (SecurityException ignored) {
                        }
                    }
                }

                ActiveWindowInfo active = getActiveWindowInfo(context, System.currentTimeMillis());
                if (active.active) {
                    startSilentMonitorService(context, active.endMillis, active.slotKey, active.slotLabel);
                }
            } else {
                forceRestoreNormalDnd(context);
            }
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
