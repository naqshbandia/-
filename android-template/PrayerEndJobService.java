package com.khanqahdarulfalah.app;

import android.app.job.JobParameters;
import android.app.job.JobService;

public class PrayerEndJobService extends JobService {

    @Override
    public boolean onStartJob(JobParameters params) {
        try {
            long now = System.currentTimeMillis();
            PrayerSilentScheduler.ActiveWindowInfo activeNow =
                PrayerSilentScheduler.getActiveWindowInfo(this, now);
            if (!activeNow.active) {
                PrayerSilentScheduler.forceRestoreNormalDnd(this);
            }
            PrayerSilentScheduler.reconcileAndScheduleAll(this, false);
        } catch (Exception ignored) {
        }
        return false;
    }

    @Override
    public boolean onStopJob(JobParameters params) {
        return false;
    }
}
