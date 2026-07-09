const codeMap: Record<number, { icon: string; label: string }> = {
  0: { icon: '☀️', label: 'Ясно' },
  1: { icon: '🌤️', label: 'Преимущественно ясно' },
  2: { icon: '⛅', label: 'Переменная облачность' },
  3: { icon: '☁️', label: 'Пасмурно' },
  45: { icon: '🌫️', label: 'Туман' },
  48: { icon: '🌫️', label: 'Изморозь' },
  51: { icon: '🌦️', label: 'Легкая морось' },
  53: { icon: '🌦️', label: 'Морось' },
  55: { icon: '🌧️', label: 'Сильная морось' },
  61: { icon: '🌦️', label: 'Небольшой дождь' },
  63: { icon: '🌧️', label: 'Дождь' },
  65: { icon: '🌧️', label: 'Сильный дождь' },
  71: { icon: '🌨️', label: 'Небольшой снег' },
  73: { icon: '🌨️', label: 'Снег' },
  75: { icon: '❄️', label: 'Сильный снег' },
  80: { icon: '🌦️', label: 'Ливни' },
  81: { icon: '🌧️', label: 'Сильные ливни' },
  82: { icon: '⛈️', label: 'Очень сильные ливни' },
  95: { icon: '⛈️', label: 'Гроза' },
  96: { icon: '⛈️', label: 'Гроза с градом' },
  99: { icon: '⛈️', label: 'Сильная гроза с градом' },
};

export function getWeatherCodeInfo(code: number | null | undefined) {
  if (code === null || code === undefined) {
    return { icon: '🌡️', label: 'Нет данных' };
  }

  return codeMap[code] ?? { icon: '🌡️', label: `Код погоды ${code}` };
}
