import { pool } from './pool.js';

export async function migrateDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS favorite_cities (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      country TEXT NOT NULL,
      admin1 TEXT,
      latitude NUMERIC(9, 6) NOT NULL,
      longitude NUMERIC(9, 6) NOT NULL,
      timezone TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_fetch_at TIMESTAMPTZ,
      last_fetch_status TEXT NOT NULL DEFAULT 'pending',
      last_fetch_error TEXT,
      CONSTRAINT favorite_cities_coordinates_unique UNIQUE (latitude, longitude)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS weather_snapshots (
      id SERIAL PRIMARY KEY,
      city_id INTEGER NOT NULL REFERENCES favorite_cities(id) ON DELETE CASCADE,
      temperature_2m NUMERIC(6, 2),
      apparent_temperature NUMERIC(6, 2),
      relative_humidity_2m INTEGER,
      precipitation NUMERIC(7, 2),
      weather_code INTEGER,
      wind_speed_10m NUMERIC(7, 2),
      wind_direction_10m INTEGER,
      pressure_msl NUMERIC(8, 2),
      source_time TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS weather_snapshots_city_created_idx
    ON weather_snapshots(city_id, created_at DESC);
  `);
}
