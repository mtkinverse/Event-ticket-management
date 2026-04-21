import { buildApp } from './app.js';
import { config } from './configs/index.js';
import { initModels } from './models/index.js';

await initModels();

const app = await buildApp();

try {
  await app.listen({ port: config.port, host: '0.0.0.0' });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
