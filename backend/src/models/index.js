import { sequelize } from '../db/index.js';
import { defineUser } from './user.model.js';

function loadModels(seq) {
  const User = defineUser(seq);

  // Associations declared here as models are added in later phases.
  // e.g. User.hasMany(Event, { foreignKey: 'organizerId', as: 'events' });

  return { User };
}

export async function initModels() {
  const models = loadModels(sequelize);

  if (process.env.NODE_ENV === 'development' && process.env.SYNC_MODELS === 'true') {
    await sequelize.sync({ alter: true });
  }

  return { ...models, sequelize };
}
