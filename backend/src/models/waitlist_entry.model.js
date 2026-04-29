import { DataTypes } from 'sequelize';

export const defineWaitlistEntry = (sequelize) => sequelize.define('WaitlistEntry', {
  id:             { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  userId:         { type: DataTypes.UUID, allowNull: false },
  eventId:        { type: DataTypes.UUID, allowNull: false },
  status:         { type: DataTypes.ENUM('waiting', 'held', 'expired', 'consumed'), allowNull: false, defaultValue: 'waiting' },
  holdExpiresAt:  { type: DataTypes.DATE, allowNull: true },
  joinedAt:       { type: DataTypes.DATE, allowNull: false },
}, { tableName: 'waitlist_entries' });
