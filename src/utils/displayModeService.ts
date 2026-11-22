export type DisplayModePreference = 'auto' | 'light' | 'dark';

export const DISPLAY_MODE_STORAGE_KEY = 'khanqah_display_mode_v1';

// Illuminance threshold in lux: bright outdoor / daylight >= 260 lux -> Light (Normal) mode
export const OUTDOOR_LUX_THRESHOLD = 260;

export function loadDisplayModePreference(): DisplayModePreference {
  try {
    const saved = localStorage.getItem(DISPLAY_MODE_STORAGE_KEY);
    if (saved === 'auto' || saved === 'light' || saved === 'dark') {
      return saved;
    }
  } catch {}
  return 'auto';
}

export function saveDisplayModePreference(mode: DisplayModePreference): void {
  try {
    localStorage.setItem(DISPLAY_MODE_STORAGE_KEY, mode);
  } catch {}
}

/**
 * Resolves whether dark mode should be active in 'auto' mode:
 * 1. If a real AmbientLightSensor reading (lux) is available, bright outdoors (>= 260 lux) uses Light/Normal mode,
 *    while dim rooms / darkness (< 260 lux) uses Dark mode.
 * 2. Otherwise falls back to daytime hours (06:30 - 17:45 = Light/Normal outdoor-readable mode;
 *    17:45 - 06:30 = Dark mode for evening/night).
 */
export function resolveIsDarkForMode(
  mode: DisplayModePreference,
  ambientLux: number | null = null,
  now: Date = new Date()
): boolean {
  if (mode === 'dark') return true;
  if (mode === 'light') return false;

  if (ambientLux !== null && !Number.isNaN(ambientLux)) {
    return ambientLux < OUTDOOR_LUX_THRESHOLD;
  }

  const minutes = now.getHours() * 60 + now.getMinutes();
  const sunriseMinutes = 6 * 60 + 30; // 06:30 AM
  const sunsetMinutes = 17 * 60 + 45; // 05:45 PM
  const isDaytime = minutes >= sunriseMinutes && minutes < sunsetMinutes;
  return !isDaytime;
}

export interface AmbientLightHandle {
  stop: () => void;
}

/**
 * Best-effort AmbientLightSensor watcher for Android Chrome devices when available.
 * Never throws if sensor is unsupported or blocked by browser permissions policy.
 */
export function startAmbientLightWatcher(
  onReading: (lux: number) => void
): AmbientLightHandle | null {
  try {
    const SensorCtor = (
      window as unknown as {
        AmbientLightSensor?: new (opts?: { frequency?: number }) => {
          illuminance?: number;
          addEventListener: (ev: string, cb: () => void) => void;
          start: () => void;
          stop: () => void;
        };
      }
    ).AmbientLightSensor;

    if (!SensorCtor) return null;

    const sensor = new SensorCtor({ frequency: 1 });
    sensor.addEventListener('reading', () => {
      if (typeof sensor.illuminance === 'number') {
        onReading(sensor.illuminance);
      }
    });
    sensor.addEventListener('error', () => {
      // Silently ignore permission/availability errors and rely on time fallback
    });
    sensor.start();
    return {
      stop: () => {
        try {
          sensor.stop();
        } catch {}
      },
    };
  } catch {
    return null;
  }
}
