import { sequelize }          from '../db/index.js';
import { defineUser }          from './user.model.js';
import { defineEvent }         from './event.model.js';
import { defineApplicationFee } from './application_fee.model.js';

const ASSOCIATIONS = [
  { base: 'User',           ref: 'Event',          assoc: 'hasMany',   fk: 'organizerId', as: 'events'        },
  { base: 'Event',          ref: 'User',           assoc: 'belongsTo', fk: 'organizerId', as: 'organizer'      },
  { base: 'Event',          ref: 'ApplicationFee', assoc: 'hasOne',    fk: 'eventId',     as: 'applicationFee' },
  { base: 'ApplicationFee', ref: 'Event',          assoc: 'belongsTo', fk: 'eventId',     as: 'event'          },
  { base: 'ApplicationFee', ref: 'User',           assoc: 'belongsTo', fk: 'organizerId', as: 'organizer'      },
];

function loadModels(seq) {
  const models = {
    User:           defineUser(seq),
    Event:          defineEvent(seq),
    ApplicationFee: defineApplicationFee(seq),
  };

  ASSOCIATIONS.forEach(({ base, ref, assoc, fk, as }) =>
    models[base][assoc](models[ref], { foreignKey: fk, as })
  );

  return models;
}

export async function initModels() {
  const models = loadModels(sequelize);

  if (process.env.NODE_ENV === 'development' && process.env.SYNC_MODELS === 'true') {
    await sequelize.sync({ alter: true });
  }

  return { ...models, sequelize };
}
