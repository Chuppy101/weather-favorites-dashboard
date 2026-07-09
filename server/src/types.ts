export type CitySearchResult = {
  name: string;
  country: string;
  admin1?: string | null;
  latitude: number;
  longitude: number;
  timezone?: string | null;
};

export type FavoriteCity = CitySearchResult & {
  id: number;
  createdAt: string;
  lastFetchAt: string | null;
  lastFetchStatus: 'pending' | 'ok' | 'error';
  lastFetchError: string | null;
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

export type FavoriteWithWeather = FavoriteCity & {
  weather: WeatherSnapshot | null;
  freshness: 'fresh' | 'stale' | 'empty';
  ageMinutes: number | null;
  isExternalApiUnavailable: boolean;
};
