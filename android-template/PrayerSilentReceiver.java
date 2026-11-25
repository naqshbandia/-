package com.khanqahdarulfalah.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Handler;
import android.os.Looper;
import android.os.PowerManager;

public class PrayerSilentReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        if (context == null || intent == null) return;

        final Context appCtx = context.getApplicationContext();
        final PendingResult pendingResult = goAsync();
        PowerManager pm = (PowerManager) appCtx.getSystemService(Context.POWER_SERVICE);
        final PowerManager.WakeLock wakeLock = pm != null
            ? pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "KhanqahDarulFalah:PrayerSilentLock")
            : null;

        if (wakeLock != null) {
            try {
                wakeLock.acquire(5000L);
            } catch (Exception ignored) {
            }
        }

        boolean needsDelayedFinish = false;

        try {
            String eventType = intent.getStringExtra(PrayerSilentScheduler.EXTRA_EVENT_TYPE);
            String windowId = intent.getStringExtra(PrayerSilentScheduler.EXTRA_WINDOW_ID);
            long endMillis = intent.getLongExtra(PrayerSilentScheduler.EXTRA_END_MILLIS, 0L);

            if ("START".equals(eventType)) {
                SharedPreferences prefs = appCtx.getSharedPreferences(
                    PrayerSilentScheduler.PREFS_NAME,
                    Context.MODE_PRIVATE
                );
                if (PrayerSilentScheduler.isMasterEnabled(appCtx)) {
                    SharedPreferences.Editor editor = prefs.edit();
                    if (windowId != null && !windowId.isEmpty()) {
                        editor.putString(PrayerSilentScheduler.KEY_LAST_ENTERED_WINDOW_ID, windowId);
                    }
                    if (endMillis > System.currentTimeMillis()) {
                        editor.putLong(PrayerSilentScheduler.KEY_SILENCED_UNTIL_MS, endMillis);
                    }
                    editor.putBoolean(PrayerSilentScheduler.KEY_PENDING_END_VERIFY, false);
                    editor.commit();
                    PrayerSilentScheduler.applySilentState(appCtx, true);
                }
                PrayerSilentScheduler.scheduleAll(appCtx);
            } else if ("END".equals(eventType) || "SAFETY_END".equals(eventType)) {
                long now = System.currentTimeMillis();
                // Check if another overlapping prayer window (e.g. Friday Jummah continuing past Dhuhr) is still active
                PrayerSilentScheduler.ActiveWindowInfo activeInfo =
                    PrayerSilentScheduler.getActiveWindowInfo(appCtx, now);

                if (activeInfo.active && activeInfo.endMillis > now + 5000L) {
                    // Stay silently inside the overlapping prayer until that window ends
                    SharedPreferences prefs = appCtx.getSharedPreferences(
                        PrayerSilentScheduler.PREFS_NAME,
                        Context.MODE_PRIVATE
                    );
                    prefs.edit()
                        .putLong(PrayerSilentScheduler.KEY_SILENCED_UNTIL_MS, activeInfo.endMillis)
                        .commit();
                    PrayerSilentScheduler.scheduleAll(appCtx);
                } else if ("SAFETY_END".equals(eventType)) {
                    // Final +30s safety pass: ensure DND & silent mode are 100% cleared, then clear pending flag
                    PrayerSilentScheduler.completePendingEndVerification(appCtx);
                    PrayerSilentScheduler.scheduleAll(appCtx);
                } else {
                    // Primary END trigger: restore Normal sound, schedule verification checks & +30s SAFETY_END
                    PrayerSilentScheduler.applySilentState(appCtx, false);
                    PrayerSilentScheduler.scheduleAll(appCtx);
                    needsDelayedFinish = true;
                }
            } else {
                PrayerSilentScheduler.reconcileAndScheduleAll(appCtx, false);
            }
        } finally {
            if (needsDelayedFinish) {
                // Keep WakeLock & BroadcastReceiver alive ~1700ms so OEM DND-clearing verification passes complete
                new Handler(Looper.getMainLooper()).postDelayed(() -> {
                    try {
                        if (wakeLock != null && wakeLock.isHeld()) {
                            wakeLock.release();
                        }
                    } catch (Exception ignored) {
                    }
                    try {
                        pendingResult.finish();
                    } catch (Exception ignored) {
                    }
                }, 1700L);
            } else {
                try {
                    if (wakeLock != null && wakeLock.isHeld()) {
                        wakeLock.release();
                    }
                } catch (Exception ignored) {
                }
                try {
                    pendingResult.finish();
                } catch (Exception ignored) {
                }
            }
        }
    }
}
