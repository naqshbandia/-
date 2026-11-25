package com.khanqahdarulfalah.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class PrayerSilentReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        if (context == null || intent == null) return;

        String eventType = intent.getStringExtra(PrayerSilentScheduler.EXTRA_EVENT_TYPE);
        if ("START".equals(eventType)) {
            PrayerSilentScheduler.applySilentState(context, true);
        } else if ("END".equals(eventType)) {
            PrayerSilentScheduler.applySilentState(context, false);
        }

        // Immediately schedule tomorrow's (or next Friday's) occurrence
        PrayerSilentScheduler.scheduleAll(context);
    }
}
