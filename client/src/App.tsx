import { useEffect, useMemo, useState } from 'react';
import { api } from './api';
import { CityCard } from './components/CityCard';
import { EmptyState } from './components/EmptyState';
import { Header } from './components/Header';
import { SearchPanel } from './components/SearchPanel';
import { SkeletonGrid } from './components/SkeletonGrid';
import type { CitySearchResult, FavoriteCity, FavoritesMeta } from './types';

type SortMode = 'created' | 'name' | 'temperature' | 'freshness';

function App() {
  const [cities, setCities] = useState<FavoriteCity[]>([]);
  const [meta, setMeta] = useState<FavoritesMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshingAll, setIsRefreshingAll] = useState(false);
  const [busyCityId, setBusyCityId] = useState<number | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('created');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadFavorites = async () => {
    const response = await api.getFavorites();
    setCities(response.data);
    setMeta(response.meta);
  };

  useEffect(() => {
    loadFavorites()
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Не удалось загрузить города'))
      .finally(() => setIsLoading(false));
  }, []);

  const sortedCities = useMemo(() => {
    const copy = [...cities];

    if (sortMode === 'name') {
      return copy.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
    }

    if (sortMode === 'temperature') {
      return copy.sort((a, b) => (b.weather?.temperature ?? -999) - (a.weather?.temperature ?? -999));
    }

    if (sortMode === 'freshness') {
      return copy.sort((a, b) => (a.ageMinutes ?? 999_999) - (b.ageMinutes ?? 999_999));
    }

    return copy;
  }, [cities, sortMode]);

  const existingKeys = useMemo(
    () => cities.map((city) => `${city.latitude.toFixed(4)}:${city.longitude.toFixed(4)}`),
    [cities],
  );

  const handleAddCity = async (city: CitySearchResult) => {
    try {
      setError(null);
      const response = await api.addFavorite(city);

      if (response.data) {
        setCities((current) => {
          const withoutDuplicate = current.filter((item) => item.id !== response.data.id);
          return [...withoutDuplicate, response.data];
        });
        setMessage(`${city.name} добавлен в избранное`);
      }

      await loadFavorites();
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : 'Не удалось добавить город');
    }
  };

  const handleDeleteCity = async (id: number) => {
    try {
      setBusyCityId(id);
      await api.deleteFavorite(id);
      setCities((current) => current.filter((city) => city.id !== id));
      setMessage('Город удален из избранного');
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Не удалось удалить город');
    } finally {
      setBusyCityId(null);
    }
  };

  const handleRefreshCity = async (id: number) => {
    try {
      setBusyCityId(id);
      const response = await api.refreshFavorite(id);

      if (response.data) {
        setCities((current) => current.map((city) => (city.id === id ? response.data : city)));
      }

      setMessage('Город обновлен');
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : 'Не удалось обновить город');
    } finally {
      setBusyCityId(null);
    }
  };

  const handleRefreshAll = async () => {
    try {
      setIsRefreshingAll(true);
      setError(null);
      const response = await api.syncAll();
      setCities(response.data);
      setMeta(response.meta);
      setMessage('Все города обновлены');
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : 'Не удалось обновить города');
    } finally {
      setIsRefreshingAll(false);
    }
  };

  useEffect(() => {
    if (!message && !error) return;

    const timeoutId = window.setTimeout(() => {
      setMessage(null);
      setError(null);
    }, 4500);

    return () => window.clearTimeout(timeoutId);
  }, [message, error]);

  const showApiWarning = meta?.externalApiStatus === 'down' || meta?.externalApiStatus === 'partial';

  return (
    <div className="app-shell">
      <div className="background-orb background-orb--one" />
      <div className="background-orb background-orb--two" />

      <Header meta={meta} totalCities={cities.length} onRefreshAll={handleRefreshAll} isRefreshing={isRefreshingAll} />

      <main className="dashboard">
        <SearchPanel onAddCity={handleAddCity} existingKeys={existingKeys} />

        {showApiWarning && (
          <div className="service-alert">
            <strong>Внешний погодный API отвечает нестабильно.</strong>
            <span>Dashboard продолжает показывать последние сохраненные снимки из PostgreSQL.</span>
          </div>
        )}

        <section className="toolbar">
          <div>
            <h2>Избранные города</h2>
            <p>Frontend читает только внутренний API, а backend сам управляет синхронизацией.</p>
          </div>

          <label className="sort-select">
            <span>Сортировка</span>
            <select value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)}>
              <option value="created">по добавлению</option>
              <option value="name">по названию</option>
              <option value="temperature">по температуре</option>
              <option value="freshness">по свежести</option>
            </select>
          </label>
        </section>

        {isLoading ? (
          <SkeletonGrid />
        ) : cities.length === 0 ? (
          <EmptyState />
        ) : (
          <section className="cards-grid">
            {sortedCities.map((city) => (
              <CityCard
                key={city.id}
                city={city}
                onDelete={handleDeleteCity}
                onRefresh={handleRefreshCity}
                isBusy={busyCityId === city.id}
              />
            ))}
          </section>
        )}
      </main>

      {(message || error) && <div className={`toast ${error ? 'toast--error' : ''}`}>{error ?? message}</div>}
    </div>
  );
}

export default App;
