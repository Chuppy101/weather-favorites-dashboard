import { config } from '../config.js';
import {
  createWeatherSnapshot,
  getFavoriteCities,
  getFavoriteCityById,
  getLatestSnapshotsByCityIds,
  markCityFetchError,
  markCityFetchOk,
} from '../db/repositories.js';
import { fetchWeatherSnapshot } from './openMeteoClient.js';
import type { FavoriteCity, FavoriteWithWeather } from '../types.js';

let isSyncing = false;

export async function syncCityWeather(city: FavoriteCity) {
  try {
    const snapshot = await fetchWeatherSnapshot(city.latitude, city.longitude);
    await createWeatherSnapshot(city.id, snapshot);
    await markCityFetchOk(city.id);
    return { ok: true as const, cityId: city.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown weather sync error';
    await markCityFetchError(city.id, message);
    return { ok: false as const, cityId: city.id, error: message };
  }
}

export async function syncCityWeatherById(cityId: number) {
  const city = await getFavoriteCityById(cityId);

  if (!city) {
    return null;
  }

  return syncCityWeather(city);
}

export async function syncAllCities() {
  if (isSyncing) {
    return { skipped: true, reason: 'Sync already in progress' };
  }

  isSyncing = true;

  try {
    const cities = await getFavoriteCities();
    const results = [];

    for (const city of cities) {
      results.push(await syncCityWeather(city));
    }

    return {
      skipped: false,
      total: cities.length,
      ok: results.filter((item) => item.ok).length,
      failed: results.filter((item) => !item.ok).length,
      results,
    };
  } finally {
    isSyncing = false;
  }
}

export async function getFavoritesWithWeather(): Promise<FavoriteWithWeather[]> {
  const cities = await getFavoriteCities();
  const latestSnapshots = await getLatestSnapshotsByCityIds(cities.map((city) => city.id));

  return cities.map((city) => {
    const weather = latestSnapshots.get(city.id) ?? null;
    const ageMinutes = weather ? minutesBetween(new Date(weather.createdAt), new Date()) : null;
    const freshness = getFreshness(ageMinutes);

    return {
      ...city,
      weather,
      freshness,
      ageMinutes,
      isExternalApiUnavailable: city.lastFetchStatus === 'error',
    };
  });
}

export function getExternalApiStatus(items: FavoriteWithWeather[]) {
  if (items.length === 0) return 'unknown';
  const failed = items.filter((item) => item.isExternalApiUnavailable).length;
  if (failed === 0) return 'ok';
  if (failed === items.length) return 'down';
  return 'partial';
}

function getFreshness(ageMinutes: number | null): 'fresh' | 'stale' | 'empty' {
  if (ageMinutes === null) return 'empty';
  return ageMinutes <= config.staleAfterMinutes ? 'fresh' : 'stale';
}

function minutesBetween(from: Date, to: Date) {
  return Math.max(0, Math.floor((to.getTime() - from.getTime()) / 60_000));
}
