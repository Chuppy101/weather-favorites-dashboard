import https from 'node:https';
import { config } from '../config.js';
import type { CitySearchResult, WeatherSnapshot } from '../types.js';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type NetworkError = NodeJS.ErrnoException & {
  hostname?: string;
  host?: string;
  port?: number;
  address?: string;
};

function getErrorMessage(error: unknown) {
  if (!(error instanceof Error)) return 'Unknown Open-Meteo error';

  const nodeError = error as NetworkError;
  const parts = [error.message];

  if (nodeError.code) parts.push(`code=${nodeError.code}`);
  if (nodeError.syscall) parts.push(`syscall=${nodeError.syscall}`);
  if (nodeError.hostname) parts.push(`hostname=${nodeError.hostname}`);

  const cause = (error as Error & { cause?: unknown }).cause;
  if (cause instanceof Error) parts.push(`cause=${cause.message}`);

  return parts.filter(Boolean).join(' | ');
}

function requestJsonBody(urlString: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const request = https.get(
      urlString,
      {
        family: 4,
        headers: {
          Accept: 'application/json',
          'User-Agent': 'weather-favorites-dashboard/1.0',
        },
      },
      (response) => {
        const chunks: Buffer[] = [];

        response.on('data', (chunk: Buffer) => chunks.push(chunk));
        response.on('end', () => {
          const body = Buffer.concat(chunks).toString('utf8');

          if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
            reject(new Error(`Open-Meteo returned ${response.statusCode}: ${body.slice(0, 220)}`));
            return;
          }

          resolve(body);
        });
      },
    );

    request.setTimeout(config.openMeteoTimeoutMs, () => {
      request.destroy(new Error(`Open-Meteo timeout after ${config.openMeteoTimeoutMs}ms`));
    });

    request.on('error', reject);
  });
}

async function fetchJson<T>(url: string): Promise<T> {
  const attempts = 3;
  let lastErrorMessage = 'Unknown Open-Meteo error';

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const body = await requestJsonBody(url);
      return JSON.parse(body) as T;
    } catch (error) {
      lastErrorMessage = getErrorMessage(error);
      console.error(`[open-meteo] attempt ${attempt}/${attempts} failed: ${lastErrorMessage}`);

      if (attempt < attempts) {
        await delay(700 * attempt);
      }
    }
  }

  throw new Error(lastErrorMessage);
}

export async function searchCities(query: string): Promise<CitySearchResult[]> {
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
  url.searchParams.set('name', query);
  url.searchParams.set('count', '8');
  url.searchParams.set('language', 'ru');
  url.searchParams.set('format', 'json');

  const data = await fetchJson<{ results?: Array<any> }>(url.toString());

  return (data.results ?? []).map((item) => ({
    name: String(item.name),
    country: String(item.country ?? ''),
    admin1: item.admin1 ? String(item.admin1) : null,
    latitude: Number(item.latitude),
    longitude: Number(item.longitude),
    timezone: item.timezone ? String(item.timezone) : null,
  }));
}

export async function fetchWeatherSnapshot(latitude: number, longitude: number) {
  if (config.forceWeatherApiFailure) {
    throw new Error('Open-Meteo failure is forced by OPEN_METEO_FORCE_WEATHER_FAIL');
  }

  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(latitude));
  url.searchParams.set('longitude', String(longitude));
  url.searchParams.set(
    'current',
    [
      'temperature_2m',
      'relative_humidity_2m',
      'apparent_temperature',
      'precipitation',
      'weather_code',
      'wind_speed_10m',
      'wind_direction_10m',
      'pressure_msl',
    ].join(','),
  );
  url.searchParams.set('timezone', 'auto');

  const data = await fetchJson<{ current?: Record<string, any> }>(url.toString());
  const current = data.current;

  if (!current) {
    throw new Error('Open-Meteo response does not contain current weather');
  }

  const snapshot: Omit<WeatherSnapshot, 'id' | 'cityId' | 'createdAt'> = {
    temperature: toNullableNumber(current.temperature_2m),
    apparentTemperature: toNullableNumber(current.apparent_temperature),
    humidity: toNullableNumber(current.relative_humidity_2m),
    precipitation: toNullableNumber(current.precipitation),
    weatherCode: toNullableNumber(current.weather_code),
    windSpeed: toNullableNumber(current.wind_speed_10m),
    windDirection: toNullableNumber(current.wind_direction_10m),
    pressure: toNullableNumber(current.pressure_msl),
    sourceTime: current.time ? new Date(current.time).toISOString() : null,
  };

  return snapshot;
}

function toNullableNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
