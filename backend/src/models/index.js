import { sequelize }          from '../db/index.js';
import { defineUser }          from './user.model.js';
import { defineEvent }         from './event.model.js';
import { defineApplicationFee } from './application_fee.model.js';
import { defineBooking }        from './booking.model.js';
import { defineTicket }         from './ticket.model.js';
import { defineWaitlistEntry }  from './waitlist_entry.model.js';
import { defineNotification }   from './notification.model.js';
import { defineOrganizerApplication } from './organizer_application.model.js';
import { defineNotificationPreference } from './notification_preference.model.js';

const ASSOCIATIONS = [
  { base: 'User',           ref: 'Event',          assoc: 'hasMany',   fk: 'organizerId', as: 'events'        },
  { base: 'Event',          ref: 'User',           assoc: 'belongsTo', fk: 'organizerId', as: 'organizer'      },
  { base: 'Event',          ref: 'ApplicationFee', assoc: 'hasOne',    fk: 'eventId',     as: 'applicationFee' },
  { base: 'ApplicationFee', ref: 'Event',          assoc: 'belongsTo', fk: 'eventId',     as: 'event'          },
  { base: 'ApplicationFee', ref: 'User',           assoc: 'belongsTo', fk: 'organizerId', as: 'organizer'      },

  { base: 'User',           ref: 'Booking',        assoc: 'hasMany',   fk: 'userId',      as: 'bookings'       },
  { base: 'Booking',        ref: 'User',           assoc: 'belongsTo', fk: 'userId',      as: 'user'           },
  { base: 'Event',          ref: 'Booking',        assoc: 'hasMany',   fk: 'eventId',     as: 'bookings'       },
  { base: 'Booking',        ref: 'Event',          assoc: 'belongsTo', fk: 'eventId',     as: 'event'          },

  { base: 'Booking',        ref: 'Ticket',         assoc: 'hasMany',   fk: 'bookingId',   as: 'tickets'        },
  { base: 'Ticket',         ref: 'Booking',        assoc: 'belongsTo', fk: 'bookingId',   as: 'booking'        },
  { base: 'Event',          ref: 'Ticket',         assoc: 'hasMany',   fk: 'eventId',     as: 'tickets'        },
  { base: 'Ticket',         ref: 'Event',          assoc: 'belongsTo', fk: 'eventId',     as: 'event'          },

  { base: 'User',           ref: 'WaitlistEntry',  assoc: 'hasMany',   fk: 'userId',      as: 'waitlistEntries' },
  { base: 'WaitlistEntry',  ref: 'User',           assoc: 'belongsTo', fk: 'userId',      as: 'user'            },
  { base: 'Event',          ref: 'WaitlistEntry',  assoc: 'hasMany',   fk: 'eventId',     as: 'waitlistEntries' },
  { base: 'WaitlistEntry',  ref: 'Event',          assoc: 'belongsTo', fk: 'eventId',     as: 'event'           },

  { base: 'User',           ref: 'Notification',   assoc: 'hasMany',   fk: 'userId',      as: 'notifications'   },
  { base: 'Notification',   ref: 'User',           assoc: 'belongsTo', fk: 'userId',      as: 'user'            },

  { base: 'User',                  ref: 'OrganizerApplication', assoc: 'hasMany',   fk: 'userId', as: 'organizerApplications' },
  { base: 'OrganizerApplication',  ref: 'User',                 assoc: 'belongsTo', fk: 'userId', as: 'user' },

  { base: 'User',                   ref: 'NotificationPreference', assoc: 'hasMany',   fk: 'userId', as: 'notificationPreferences' },
  { base: 'NotificationPreference', ref: 'User',                   assoc: 'belongsTo', fk: 'userId', as: 'user' },
];

function loadModels(seq) {
  const models = {
    User:           defineUser(seq),
    Event:          defineEvent(seq),
    ApplicationFee: defineApplicationFee(seq),
    Booking:        defineBooking(seq),
    Ticket:         defineTicket(seq),
    WaitlistEntry:  defineWaitlistEntry(seq),
    Notification:   defineNotification(seq),
    OrganizerApplication:   defineOrganizerApplication(seq),
    NotificationPreference: defineNotificationPreference(seq),
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
