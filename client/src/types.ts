export type CitySearchResult = {
  name: string;
  country: string;
  admin1?: string | null;
  latitude: number;
  longitude: number;
  timezone?: string | null;
};

export type WeatherSnapshot = {
  id: number;
  cityId: number;
  temperature: number | null;
  apparentTemperature: number | null;
  humidity: number | null;
  precipitation: number | null;
  weatherCode: number | null;
  windSpeed: number | null;
  windDirection: number | null;
  pressure: number | null;
  sourceTime: string | null;
  createdAt: string;
};

export type FavoriteCity = CitySearchResult & {
  id: number;
  createdAt: string;
  lastFetchAt: string | null;
  lastFetchStatus: 'pending' | 'ok' | 'error';
  lastFetchError: string | null;
  weather: WeatherSnapshot | null;
  freshness: 'fresh' | 'stale' | 'empty';
  ageMinutes: number | null;
  isExternalApiUnavailable: boolean;
};

export type FavoritesMeta = {
  generatedAt: string;
  staleAfterMinutes: number;
  externalApiStatus: 'ok' | 'partial' | 'down' | 'unknown';
};

export type FavoritesResponse = {
  meta: FavoritesMeta;
  data: FavoriteCity[];
};
