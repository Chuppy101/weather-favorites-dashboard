import 'dotenv/config';

const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const config = {
  port: toNumber(process.env.PORT, 4000),
  databaseUrl:
    process.env.DATABASE_URL ??
    'postgres://weather_user:weather_password@localhost:5432/weather_dashboard',
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
  weatherRefreshIntervalMs: toNumber(process.env.WEATHER_REFRESH_INTERVAL_MS, 10 * 60 * 1000),
  staleAfterMinutes: toNumber(process.env.STALE_AFTER_MINUTES, 30),
  openMeteoTimeoutMs: toNumber(process.env.OPEN_METEO_TIMEOUT_MS, 8000),
  forceWeatherApiFailure: process.env.OPEN_METEO_FORCE_WEATHER_FAIL === 'true',
};
