import cors from 'cors';
import express from 'express';
import { config } from './config.js';
import { migrateDatabase } from './db/migrate.js';
import { closePool } from './db/pool.js';
import { apiRouter } from './routes/api.js';
import { startWeatherScheduler, stopWeatherScheduler } from './services/scheduler.js';
import { syncAllCities } from './services/weatherSyncService.js';

const app = express();

app.use(cors({ origin: config.clientOrigin }));
app.use(express.json());
app.use('/api', apiRouter);

app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

async function bootstrap() {
  await migrateDatabase();

  app.listen(config.port, () => {
    console.log(`Weather API is running on http://localhost:${config.port}`);
  });

  startWeatherScheduler();
  syncAllCities().catch((error) => console.error('[initial weather-sync] failed:', error));
}

bootstrap().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

async function shutdown() {
  stopWeatherScheduler();
  await closePool();
  process.exit(0);
}
