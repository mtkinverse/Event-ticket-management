import { Sequelize } from 'sequelize';
import { config } from '../configs/index.js';

// Module-level singleton — Node.js module cache guarantees one instance per process.
export const sequelize = new Sequelize(config.databaseUrl, {
  dialect: 'postgres',
  logging: config.nodeEnv === 'development' ? (sql) => console.log('[SQL]', sql) : false,
  define: { underscored: true, timestamps: true },
  pool: {
    max: 10,   // max connections in pool
    min: 2,    // min idle connections kept alive
    acquire: 30_000,  // ms before "unable to acquire" error
    idle:    10_000,  // ms a connection can sit idle before release
  },
});
