import type { CitySearchResult, FavoriteCity, FavoritesResponse } from './types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => null);
    throw new Error(errorPayload?.message ?? 'Ошибка запроса к API');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  searchCities(query: string) {
    return request<{ data: CitySearchResult[] }>(`/cities/search?query=${encodeURIComponent(query)}`);
  },

  getFavorites() {
    return request<FavoritesResponse>('/favorites');
  },

  addFavorite(city: CitySearchResult) {
    return request<{ data: FavoriteCity }>('/favorites', {
      method: 'POST',
      body: JSON.stringify(city),
    });
  },

  deleteFavorite(id: number) {
    return request<void>(`/favorites/${id}`, { method: 'DELETE' });
  },

  refreshFavorite(id: number) {
    return request<{ data: FavoriteCity }>(`/favorites/${id}/refresh`, { method: 'POST' });
  },

  syncAll() {
    return request<FavoritesResponse>('/sync', { method: 'POST' });
  },
};
