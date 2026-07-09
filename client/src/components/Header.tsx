import type { FavoritesMeta } from '../types';
import { formatDateTime } from '../lib/format';

type HeaderProps = {
  meta: FavoritesMeta | null;
  totalCities: number;
  onRefreshAll: () => void;
  isRefreshing: boolean;
};

export function Header({ meta, totalCities, onRefreshAll, isRefreshing }: HeaderProps) {
  const status = meta?.externalApiStatus ?? 'unknown';
  const statusText = {
    ok: 'сервис работает',
    partial: 'частичные ошибки',
    down: 'сервис не отвечает',
    unknown: 'ожидает данных',
  }[status];

  return (
    <header className="hero">
      <div className="hero__content">
        <div className="hero__eyebrow">Weather Cities</div>
        <h1 className="hero__title">Погода в избранных городах</h1>
        <p className="hero__description">
          Dashboard сохраняет города в PostgreSQL, обновляет погоду в фоне и показывает последнее значение,
          даже если внешний сервис временно недоступен.
        </p>

        <div className="hero__stats">
          <div className="stat-card">
            <span className="stat-card__label">Городов</span>
            <strong>{totalCities}</strong>
          </div>
          <div className={`stat-card stat-card--${status}`}>
            <span className="stat-card__label">Open-Meteo</span>
            <strong>{statusText}</strong>
          </div>
          <div className="stat-card">
            <span className="stat-card__label">Обновлено</span>
            <strong>{meta ? formatDateTime(meta.generatedAt) : '—'}</strong>
          </div>
        </div>
      </div>

      <button className="hero__refresh" type="button" onClick={onRefreshAll} disabled={isRefreshing}>
        {isRefreshing ? 'Обновляю...' : 'Обновить всё'}
      </button>
    </header>
  );
}
