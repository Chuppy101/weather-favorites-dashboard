# Погода в избранных городах

Приложение **“Погода в избранных городах”**: пользователь добавляет города в избранное, backend периодически получает актуальную погоду из Open-Meteo, сохраняет погодные снимки в PostgreSQL, а frontend отображает данные через внутренний API.

Frontend **не обращается напрямую** к Open-Meteo. Все внешние запросы выполняет backend.

Если внешний погодный API временно недоступен, приложение продолжает показывать последнее успешно сохраненное значение из PostgreSQL с пометкой, что данные устарели или погодный сервис не отвечает.

---
<img width="1618" height="1263" alt="image" src="https://github.com/user-attachments/assets/615b95e6-4215-40d4-881b-7788163f467f" />

## Запуск проекта

Достаточно:

1. Склонировать репозиторий.
2. Выполнить `npm install`.
3. Выполнить `docker compose up --build`.
4. Во втором терминале выполнить `npm run dev --workspace client`.
5. Открыть `http://localhost:5173`.

Frontend не требует доступа к внешнему Open-Meteo API напрямую. Вся работа с внешним погодным сервисом происходит на backend.

---

## Что реализовано

- Поиск городов через backend.
- Добавление городов в избранное.
- Удаление городов из избранного.
- Хранение городов в PostgreSQL.
- Хранение истории погодных снимков в PostgreSQL.
- Первичная загрузка погоды после добавления города.
- Фоновое обновление погоды по расписанию.
- Ручное обновление одного города.
- Ручное обновление всех городов.
- Fallback на последнее сохраненное значение при ошибке Open-Meteo.
- Отображение статуса внешнего API.
- Отображение свежести данных: `актуально`, `устарело`, `нет данных`.
- Сортировка карточек по названию, температуре и свежести.
- Responsive dashboard с современным легким интерфейсом.

---

## Стек

### Frontend

- React
- TypeScript
- Vite
- CSS

### Backend

- Node.js
- Express
- TypeScript
- node-postgres

### Database

- PostgreSQL 16

### Infrastructure

- Docker
- Docker Compose

### External API

- Open-Meteo Geocoding API
- Open-Meteo Forecast API

---

## Переменные окружения

Для backend переменные окружения передаются через `docker-compose.yml`.

Основные значения:

```env
PORT=4000
DATABASE_URL=postgres://weather_user:weather_password@postgres:5432/weather_dashboard
CLIENT_ORIGIN=http://localhost:5173
WEATHER_REFRESH_INTERVAL_MS=600000
STALE_AFTER_MINUTES=30
OPEN_METEO_TIMEOUT_MS=20000
OPEN_METEO_FORCE_WEATHER_FAIL=false
```

Для локального запуска backend без Docker можно использовать файл:

```text
server/.env.example
```

и создать на его основе:

```text
server/.env
```

Но основной рекомендуемый способ запуска для проверки — через Docker Compose.

---

## API backend

### Healthcheck

```http
GET /api/health
```

Проверяет состояние backend и подключение к PostgreSQL.

---

### Поиск города

```http
GET /api/cities/search?query=Москва
```

Ищет города через Open-Meteo Geocoding API.

---

### Получение избранных городов

```http
GET /api/favorites
```

Возвращает список избранных городов и последний сохраненный погодный снимок.

---

### Добавление города

```http
POST /api/favorites
```

Добавляет город в избранное, сохраняет его в PostgreSQL и запускает первичное получение погоды.

---

### Удаление города

```http
DELETE /api/favorites/:id
```

Удаляет город из избранного.

---

### Обновление одного города

```http
POST /api/favorites/:id/refresh
```

Запускает ручное обновление погоды для одного города.

Пример для PowerShell:

```powershell
Invoke-RestMethod -Method Post "http://localhost:4000/api/favorites/1/refresh" | ConvertTo-Json -Depth 10
```

---

### Обновление всех городов

```http
POST /api/sync
```

Запускает ручную синхронизацию погоды для всех избранных городов.

---

## Структура проекта

```text
weather-favorites-dashboard/
├── client/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── api.ts
│   │   ├── types.ts
│   │   ├── styles.css
│   │   └── vite-env.d.ts
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── db/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── config.ts
│   │   └── index.ts
│   ├── Dockerfile
│   ├── .env.example
│   └── package.json
│
├── docker-compose.yml
├── package.json
├── package-lock.json
└── README.md
```