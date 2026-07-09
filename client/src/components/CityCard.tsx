import type { FavoriteCity } from '../types';
import { formatAge, formatDateTime, formatNumber, formatTemperature } from '../lib/format';
import { getWeatherCodeInfo } from '../lib/weatherCodes';

type CityCardProps = {
  city: FavoriteCity;
  onDelete: (id: number) => Promise<void>;
  onRefresh: (id: number) => Promise<void>;
  isBusy: boolean;
};

export function CityCard({ city, onDelete, onRefresh, isBusy }: CityCardProps) {
  const weatherInfo = getWeatherCodeInfo(city.weather?.weatherCode);
  const statusLabel = getStatusLabel(city);

  return (
    <article className={`city-card city-card--${city.freshness}`}>
      <div className="city-card__header">
        <div>
          <h3>{city.name}</h3>
          <p>{[city.admin1, city.country].filter(Boolean).join(', ')}</p>
        </div>
        <div className="city-card__icon" aria-hidden="true">
          {weatherInfo.icon}
        </div>
      </div>

      <div className="city-card__main">
        <div>
          <div className="city-card__temp">{formatTemperature(city.weather?.temperature)}</div>
          <div className="city-card__condition">{weatherInfo.label}</div>
        </div>
        <span className={`status-pill status-pill--${city.freshness}`}>{statusLabel}</span>
      </div>

      {city.isExternalApiUnavailable && (
        <div className="city-card__warning">
          Сервис погоды не отвечает. Показано последнее значение из БД.
          {city.lastFetchError && <small>{city.lastFetchError}</small>}
        </div>
      )}

      <div className="metrics-grid">
        <Metric label="Ощущается" value={formatTemperature(city.weather?.apparentTemperature)} />
        <Metric label="Влажность" value={formatNumber(city.weather?.humidity, '%')} />
        <Metric label="Ветер" value={formatNumber(city.weather?.windSpeed, ' км/ч')} />
        <Metric label="Давление" value={formatNumber(city.weather?.pressure, ' гПа')} />
      </div>

      <div className="city-card__footer">
        <span>Снимок: {formatDateTime(city.weather?.createdAt)}</span>
        <span>{formatAge(city.ageMinutes)}</span>
      </div>

      <div className="city-card__actions">
        <button type="button" onClick={() => onRefresh(city.id)} disabled={isBusy}>
          {isBusy ? 'Обновляю...' : 'Обновить'}
        </button>
        <button className="button-danger" type="button" onClick={() => onDelete(city.id)} disabled={isBusy}>
          Удалить
        </button>
      </div>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function getStatusLabel(city: FavoriteCity) {
  if (city.freshness === 'empty') return 'нет данных';
  if (city.isExternalApiUnavailable) return 'API недоступен';
  if (city.freshness === 'stale') return 'устарело';
  return 'актуально';
}
