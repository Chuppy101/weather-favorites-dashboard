import { config } from '../config.js';
import { syncAllCities } from './weatherSyncService.js';

let timer: NodeJS.Timeout | null = null;

export function startWeatherScheduler() {
  if (timer) return;

  timer = setInterval(() => {
    syncAllCities().catch((error) => {
      console.error('[weather-sync] failed:', error);
    });
  }, config.weatherRefreshIntervalMs);

  timer.unref();
}

export function stopWeatherScheduler() {
  if (!timer) return;
  clearInterval(timer);
  timer = null;
}
