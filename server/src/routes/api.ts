import { Router } from 'express';
import { config } from '../config.js';
import { pool } from '../db/pool.js';
import { addFavoriteCity, deleteFavoriteCity, getFavoriteCityById } from '../db/repositories.js';
import { searchCities } from '../services/openMeteoClient.js';
import {
  getExternalApiStatus,
  getFavoritesWithWeather,
  syncAllCities,
  syncCityWeather,
  syncCityWeatherById,
} from '../services/weatherSyncService.js';
import type { CitySearchResult } from '../types.js';

export const apiRouter = Router();

apiRouter.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1;');
    res.json({ status: 'ok', database: 'ok', time: new Date().toISOString() });
  } catch (error) {
    res.status(503).json({ status: 'error', database: 'error', message: getErrorMessage(error) });
  }
});

apiRouter.get('/cities/search', async (req, res) => {
  const query = String(req.query.query ?? '').trim();

  if (query.length < 2) {
    res.status(400).json({ message: 'Введите минимум 2 символа для поиска города' });
    return;
  }

  try {
    const cities = await searchCities(query);
    res.json({ data: cities });
  } catch (error) {
    res.status(502).json({ message: 'Не удалось выполнить поиск города', details: getErrorMessage(error) });
  }
});

apiRouter.get('/favorites', async (_req, res) => {
  const favorites = await getFavoritesWithWeather();

  res.json({
    meta: {
      generatedAt: new Date().toISOString(),
      staleAfterMinutes: config.staleAfterMinutes,
      externalApiStatus: getExternalApiStatus(favorites),
    },
    data: favorites,
  });
});

apiRouter.post('/favorites', async (req, res) => {
  const validation = validateCityPayload(req.body);

  if (!validation.ok) {
    res.status(400).json({ message: validation.message });
    return;
  }

  const city = await addFavoriteCity(validation.city);
  await syncCityWeather(city);

  const created = await getFavoriteCityById(city.id);
  const favorites = await getFavoritesWithWeather();
  const item = favorites.find((favorite) => favorite.id === created?.id) ?? null;

  res.status(201).json({ data: item });
});

apiRouter.delete('/favorites/:id', async (req, res) => {
  const cityId = Number(req.params.id);

  if (!Number.isInteger(cityId)) {
    res.status(400).json({ message: 'Некорректный id города' });
    return;
  }

  const deleted = await deleteFavoriteCity(cityId);

  if (!deleted) {
    res.status(404).json({ message: 'Город не найден' });
    return;
  }

  res.status(204).send();
});

apiRouter.post('/favorites/:id/refresh', async (req, res) => {
  const cityId = Number(req.params.id);

  if (!Number.isInteger(cityId)) {
    res.status(400).json({ message: 'Некорректный id города' });
    return;
  }

  const result = await syncCityWeatherById(cityId);

  if (!result) {
    res.status(404).json({ message: 'Город не найден' });
    return;
  }

  const favorites = await getFavoritesWithWeather();
  const item = favorites.find((favorite) => favorite.id === cityId) ?? null;

  res.json({ sync: result, data: item });
});

apiRouter.post('/sync', async (_req, res) => {
  const result = await syncAllCities();
  const favorites = await getFavoritesWithWeather();

  res.json({
    sync: result,
    meta: {
      generatedAt: new Date().toISOString(),
      staleAfterMinutes: config.staleAfterMinutes,
      externalApiStatus: getExternalApiStatus(favorites),
    },
    data: favorites,
  });
});

function validateCityPayload(body: unknown): { ok: true; city: CitySearchResult } | { ok: false; message: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, message: 'Некорректное тело запроса' };
  }

  const source = body as Record<string, unknown>;
  const name = String(source.name ?? '').trim();
  const country = String(source.country ?? '').trim();
  const admin1 = source.admin1 ? String(source.admin1) : null;
  const latitude = Number(source.latitude);
  const longitude = Number(source.longitude);
  const timezone = source.timezone ? String(source.timezone) : null;

  if (!name || !country || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return { ok: false, message: 'Нужно передать name, country, latitude и longitude' };
  }

  return { ok: true, city: { name, country, admin1, latitude, longitude, timezone } };
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unknown error';
}
