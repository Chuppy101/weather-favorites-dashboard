export function formatTemperature(value: number | null | undefined) {
  if (value === null || value === undefined) return '—';
  return `${Math.round(value)}°`;
}

export function formatNumber(value: number | null | undefined, suffix = '') {
  if (value === null || value === undefined) return '—';
  return `${Math.round(value)}${suffix}`;
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return 'нет данных';

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function formatAge(ageMinutes: number | null) {
  if (ageMinutes === null) return 'нет данных';
  if (ageMinutes < 1) return 'только что';
  if (ageMinutes < 60) return `${ageMinutes} мин назад`;

  const hours = Math.floor(ageMinutes / 60);
  const minutes = ageMinutes % 60;

  if (minutes === 0) return `${hours} ч назад`;
  return `${hours} ч ${minutes} мин назад`;
}
