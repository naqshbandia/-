package com.khanqahdarulfalah.app;

import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;

public class PrayerSilentService extends Service {

    public static final String EXTRA_END_MILLIS = "end_millis";
    public static final String EXTRA_SLOT_LABEL = "slot_label";
    public static final String EXTRA_SLOT_KEY = "slot_key";
    public static final int FOREGROUND_NOTIF_ID = 4488;

    private final Handler handler = new Handler(Looper.getMainLooper());
    private long targetEndMillis = 0L;
    private String activeSlotKey = "";
    private String activeSlotLabel = "نماز";
    private BroadcastReceiver screenUnlockReceiver = null;

    private final Runnable periodicGuardRunnable = new Runnable() {
        @Override
        public void run() {
            long now = System.currentTimeMillis();
            if (!PrayerSilentScheduler.isMasterEnabled(PrayerSilentService.this)
                || !PrayerSilentScheduler.hasDndPermission(PrayerSilentService.this)) {
                restoreAndStop();
                return;
            }

            if (targetEndMillis > 0L && now >= targetEndMillis) {
                PrayerSilentScheduler.ActiveWindowInfo other =
                    PrayerSilentScheduler.getOverlappingActiveWindowExcluding(
                        PrayerSilentService.this,
                        now,
                        activeSlotKey,
                        targetEndMillis
                    );
                if (other.active && other.endMillis > Math.max(now, targetEndMillis) + 60_000L) {
                    targetEndMillis = other.endMillis;
                    activeSlotKey = other.slotKey;
                    updateForegroundNotification();
                    scheduleNextCheck(now);
                    return;
                }
                restoreAndStop();
                return;
            }

            PrayerSilentScheduler.ActiveWindowInfo activeNow =
                PrayerSilentScheduler.getActiveWindowInfo(PrayerSilentService.this, now);
            if (!activeNow.active && targetEndMillis <= 0L) {
                restoreAndStop();
                return;
            }
            scheduleNextCheck(now);
        }
    };

    @Override
    public void onCreate() {
        super.onCreate();
        KhanqahNotificationHelper.ensureChannels(this);
        registerScreenUnlockReceiver();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            if (PrayerSilentScheduler.ACTION_MANUAL_EXIT_SILENT.equals(intent.getAction())) {
                restoreAndStop();
                return START_NOT_STICKY;
            }
            long endFromIntent = intent.getLongExtra(EXTRA_END_MILLIS, 0L);
            if (endFromIntent > 0L) {
                targetEndMillis = endFromIntent;
            }
            String label = intent.getStringExtra(EXTRA_SLOT_LABEL);
            if (label != null && !label.trim().isEmpty()) {
                activeSlotLabel = label.trim();
            }
            String key = intent.getStringExtra(EXTRA_SLOT_KEY);
            if (key != null) {
                activeSlotKey = key;
            }
        }

        if (targetEndMillis <= 0L) {
            PrayerSilentScheduler.ActiveWindowInfo info =
                PrayerSilentScheduler.getActiveWindowInfo(this, System.currentTimeMillis());
            if (info.active) {
                targetEndMillis = info.endMillis;
                activeSlotKey = info.slotKey;
            }
        }

        try {
            startForeground(FOREGROUND_NOTIF_ID, buildStatusNotification());
        } catch (Throwable ignored) {
        }

        long now = System.currentTimeMillis();
        if (targetEndMillis > 0L && now >= targetEndMillis) {
            restoreAndStop();
            return START_NOT_STICKY;
        }

        scheduleNextCheck(now);
        return START_STICKY;
    }

    private void scheduleNextCheck(long now) {
        handler.removeCallbacks(periodicGuardRunnable);
        long delay = 15_000L;
        if (targetEndMillis > now) {
            long remaining = targetEndMillis - now;
            delay = Math.min(20_000L, Math.max(500L, remaining + 350L));
        }
        handler.postDelayed(periodicGuardRunnable, delay);
    }

    private void restoreAndStop() {
        handler.removeCallbacks(periodicGuardRunnable);
        try {
            PrayerSilentScheduler.forceRestoreNormalDnd(getApplicationContext());
            PrayerSilentScheduler.scheduleAll(getApplicationContext());
        } catch (Exception ignored) {
        }
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                stopForeground(STOP_FOREGROUND_REMOVE);
            } else {
                stopForeground(true);
            }
        } catch (Exception ignored) {
        }
        stopSelf();
    }

    private void updateForegroundNotification() {
        try {
            NotificationManager nm =
                (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) {
                nm.notify(FOREGROUND_NOTIF_ID, buildStatusNotification());
            }
        } catch (Exception ignored) {
        }
    }

    private Notification buildStatusNotification() {
        KhanqahNotificationHelper.ensureChannels(this);

        Intent openIntent = new Intent(this, MainActivity.class);
        openIntent.setFlags(
            Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP
        );
        int piFlags = Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
            ? PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            : PendingIntent.FLAG_UPDATE_CURRENT;
        PendingIntent contentPi = PendingIntent.getActivity(this, 4481, openIntent, piFlags);

        Intent exitIntent = new Intent(this, PrayerSilentReceiver.class);
        exitIntent.setAction(PrayerSilentScheduler.ACTION_MANUAL_EXIT_SILENT);
        PendingIntent exitPi = PendingIntent.getBroadcast(this, 4482, exitIntent, piFlags);

        int iconRes = getResources().getIdentifier("ic_stat_khanqah", "drawable", getPackageName());
        if (iconRes == 0) {
            iconRes = android.R.drawable.ic_lock_silent_mode;
        }

        String endStr = formatEndTimeUrdu(targetEndMillis);
        boolean isVibrate = "vibrate".equals(PrayerSilentScheduler.getSilentMode(this));
        String title = isVibrate
            ? "📳 نماز وائبریشن موڈ فعال (" + activeSlotLabel + ")"
            : "🔕 نماز آٹو سائلنٹ فعال (" + activeSlotLabel + ")";
        String body = endStr.isEmpty()
            ? "نماز کے بعد فون خودکار نارمل ہو جائے گا"
            : endStr + " پر فون خودکار نارمل موڈ پر بحال ہو جائے گا";

        Notification.Builder builder = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
            ? new Notification.Builder(this, KhanqahNotificationHelper.CHANNEL_SILENT_ID)
            : new Notification.Builder(this);

        builder.setSmallIcon(iconRes)
            .setContentTitle(title)
            .setContentText(body)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setContentIntent(contentPi)
            .addAction(
                new Notification.Action.Builder(
                    android.R.drawable.ic_lock_silent_mode_off,
                    "🔊 ابھی نارمل کریں",
                    exitPi
                ).build()
            );

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            builder.setColor(0xFF064326);
            builder.setVisibility(Notification.VISIBILITY_PUBLIC);
        }
        return builder.build();
    }

    private String formatEndTimeUrdu(long millis) {
        if (millis <= 0L) return "";
        try {
            java.util.Calendar cal = java.util.Calendar.getInstance();
            cal.setTimeInMillis(millis);
            int h24 = cal.get(java.util.Calendar.HOUR_OF_DAY);
            int min = cal.get(java.util.Calendar.MINUTE);
            String ampm = h24 >= 12 ? "PM" : "AM";
            int h12 = h24 % 12;
            if (h12 == 0) h12 = 12;
            return String.format(java.util.Locale.US, "%d:%02d %s", h12, min, ampm);
        } catch (Exception e) {
            return "";
        }
    }

    private void registerScreenUnlockReceiver() {
        try {
            screenUnlockReceiver = new BroadcastReceiver() {
                @Override
                public void onReceive(Context context, Intent intent) {
                    long now = System.currentTimeMillis();
                    if (targetEndMillis > 0L && now >= targetEndMillis) {
                        restoreAndStop();
                    }
                }
            };
            IntentFilter filter = new IntentFilter();
            filter.addAction(Intent.ACTION_SCREEN_ON);
            filter.addAction(Intent.ACTION_USER_PRESENT);
            if (Build.VERSION.SDK_INT >= 33) {
                registerReceiver(screenUnlockReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
            } else {
                registerReceiver(screenUnlockReceiver, filter);
            }
        } catch (Exception ignored) {
        }
    }

    @Override
    public void onDestroy() {
        handler.removeCallbacks(periodicGuardRunnable);
        if (screenUnlockReceiver != null) {
            try {
                unregisterReceiver(screenUnlockReceiver);
            } catch (Exception ignored) {
            }
            screenUnlockReceiver = null;
        }
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
