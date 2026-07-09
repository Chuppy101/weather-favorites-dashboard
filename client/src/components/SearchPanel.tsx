import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import type { CitySearchResult } from '../types';

type SearchPanelProps = {
  onAddCity: (city: CitySearchResult) => Promise<void>;
  existingKeys: string[];
};

export function SearchPanel({ onAddCity, existingKeys }: SearchPanelProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CitySearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addingKey, setAddingKey] = useState<string | null>(null);

  const normalizedExistingKeys = useMemo(() => new Set(existingKeys), [existingKeys]);

  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < 2) {
      setResults([]);
      setError(null);
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        setIsSearching(true);
        setError(null);
        const response = await api.searchCities(trimmed);
        setResults(response.data);
      } catch (searchError) {
        setResults([]);
        setError(searchError instanceof Error ? searchError.message : 'Не удалось найти города');
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [query]);

  const handleAdd = async (city: CitySearchResult) => {
    const key = getCityKey(city);

    try {
      setAddingKey(key);
      await onAddCity(city);
      setQuery('');
      setResults([]);
    } finally {
      setAddingKey(null);
    }
  };

  return (
    <section className="search-panel">
      <div className="search-panel__top">
        <div>
          <h2>Добавить город</h2>
          <p>Введите название и выберите подходящий город из результатов.</p>
        </div>
      </div>

      <div className="search-box">
        <span className="search-box__icon">⌕</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Например: Санкт-Петербург, Москва, Berlin"
        />
        {isSearching && <span className="search-box__loader" />}
      </div>

      {error && <div className="inline-error">{error}</div>}

      {results.length > 0 && (
        <div className="search-results">
          {results.map((city) => {
            const key = getCityKey(city);
            const alreadyAdded = normalizedExistingKeys.has(key);

            return (
              <button
                className="search-result"
                type="button"
                key={key}
                onClick={() => handleAdd(city)}
                disabled={alreadyAdded || addingKey === key}
              >
                <span>
                  <strong>{city.name}</strong>
                  <small>
                    {[city.admin1, city.country].filter(Boolean).join(', ')} · {city.latitude.toFixed(2)}, {city.longitude.toFixed(2)}
                  </small>
                </span>
                <em>{alreadyAdded ? 'Добавлен' : addingKey === key ? 'Добавляю...' : '+ Добавить'}</em>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

function getCityKey(city: CitySearchResult) {
  return `${city.latitude.toFixed(4)}:${city.longitude.toFixed(4)}`;
}
