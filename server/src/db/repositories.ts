import { pool } from './pool.js';
import type { CitySearchResult, FavoriteCity, WeatherSnapshot } from '../types.js';

const toFavoriteCity = (row: any): FavoriteCity => ({
  id: Number(row.id),
  name: row.name,
  country: row.country,
  admin1: row.admin1,
  latitude: Number(row.latitude),
  longitude: Number(row.longitude),
  timezone: row.timezone,
  createdAt: row.created_at,
  lastFetchAt: row.last_fetch_at,
  lastFetchStatus: row.last_fetch_status,
  lastFetchError: row.last_fetch_error,
});

const toWeatherSnapshot = (row: any): WeatherSnapshot => ({
  id: Number(row.id),
  cityId: Number(row.city_id),
  temperature: row.temperature_2m === null ? null : Number(row.temperature_2m),
  apparentTemperature: row.apparent_temperature === null ? null : Number(row.apparent_temperature),
  humidity: row.relative_humidity_2m === null ? null : Number(row.relative_humidity_2m),
  precipitation: row.precipitation === null ? null : Number(row.precipitation),
  weatherCode: row.weather_code === null ? null : Number(row.weather_code),
  windSpeed: row.wind_speed_10m === null ? null : Number(row.wind_speed_10m),
  windDirection: row.wind_direction_10m === null ? null : Number(row.wind_direction_10m),
  pressure: row.pressure_msl === null ? null : Number(row.pressure_msl),
  sourceTime: row.source_time,
  createdAt: row.created_at,
});

export async function getFavoriteCities() {
  const result = await pool.query(`
    SELECT * FROM favorite_cities
    ORDER BY created_at ASC;
  `);

  return result.rows.map(toFavoriteCity);
}

export async function getFavoriteCityById(id: number) {
  const result = await pool.query('SELECT * FROM favorite_cities WHERE id = $1;', [id]);
  return result.rows[0] ? toFavoriteCity(result.rows[0]) : null;
}

export async function addFavoriteCity(city: CitySearchResult) {
  const result = await pool.query(
    `
      INSERT INTO favorite_cities (name, country, admin1, latitude, longitude, timezone)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (latitude, longitude)
      DO UPDATE SET
        name = EXCLUDED.name,
        country = EXCLUDED.country,
        admin1 = EXCLUDED.admin1,
        timezone = EXCLUDED.timezone
      RETURNING *;
    `,
    [city.name, city.country, city.admin1 ?? null, city.latitude, city.longitude, city.timezone ?? null],
  );

  return toFavoriteCity(result.rows[0]);
}

export async function deleteFavoriteCity(id: number) {
  const result = await pool.query('DELETE FROM favorite_cities WHERE id = $1 RETURNING id;', [id]);
  return result.rowCount > 0;
}

export async function markCityFetchOk(cityId: number) {
  await pool.query(
    `
      UPDATE favorite_cities
      SET last_fetch_at = NOW(), last_fetch_status = 'ok', last_fetch_error = NULL
      WHERE id = $1;
    `,
    [cityId],
  );
}

export async function markCityFetchError(cityId: number, message: string) {
  await pool.query(
    `
      UPDATE favorite_cities
      SET last_fetch_at = NOW(), last_fetch_status = 'error', last_fetch_error = $2
      WHERE id = $1;
    `,
    [cityId, message.slice(0, 500)],
  );
}

export async function createWeatherSnapshot(cityId: number, snapshot: Omit<WeatherSnapshot, 'id' | 'cityId' | 'createdAt'>) {
  const result = await pool.query(
    `
      INSERT INTO weather_snapshots (
        city_id,
        temperature_2m,
        apparent_temperature,
        relative_humidity_2m,
        precipitation,
        weather_code,
        wind_speed_10m,
        wind_direction_10m,
        pressure_msl,
        source_time
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;
    `,
    [
      cityId,
      snapshot.temperature,
      snapshot.apparentTemperature,
      snapshot.humidity,
      snapshot.precipitation,
      snapshot.weatherCode,
      snapshot.windSpeed,
      snapshot.windDirection,
      snapshot.pressure,
      snapshot.sourceTime,
    ],
  );

  return toWeatherSnapshot(result.rows[0]);
}

export async function getLatestSnapshotsByCityIds(cityIds: number[]) {
  if (cityIds.length === 0) return new Map<number, WeatherSnapshot>();

  const result = await pool.query(
    `
      SELECT DISTINCT ON (city_id) *
      FROM weather_snapshots
      WHERE city_id = ANY($1::int[])
      ORDER BY city_id, created_at DESC;
    `,
    [cityIds],
  );

  const map = new Map<number, WeatherSnapshot>();
  for (const row of result.rows) {
    const snapshot = toWeatherSnapshot(row);
    map.set(snapshot.cityId, snapshot);
  }

  return map;
}
