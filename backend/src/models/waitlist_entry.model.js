import { DataTypes } from 'sequelize';

export const defineWaitlistEntry = (sequelize) => sequelize.define('WaitlistEntry', {
  id:             { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  userId:         { type: DataTypes.UUID, allowNull: false },
  eventId:        { type: DataTypes.UUID, allowNull: false },
  position:       { type: DataTypes.INTEGER, allowNull: false },
  status:         { type: DataTypes.ENUM('queued', 'held', 'converted', 'expired'), allowNull: false, defaultValue: 'queued' },
  holdExpiresAt:  { type: DataTypes.DATE, allowNull: true },
  notifiedAt:     { type: DataTypes.DATE, allowNull: true },
}, { tableName: 'waitlist_entries' });
