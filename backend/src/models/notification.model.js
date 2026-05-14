import { DataTypes } from 'sequelize';

export const defineNotification = (sequelize) => sequelize.define('Notification', {
  id:           { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  userId:       { type: DataTypes.UUID, allowNull: false },
  type:         { type: DataTypes.STRING(64), allowNull: false },
  channel:      { type: DataTypes.STRING(32), allowNull: false },
  status:       { type: DataTypes.ENUM('pending', 'sent', 'failed'), allowNull: false, defaultValue: 'pending' },
  subject:      { type: DataTypes.STRING(200), allowNull: false },
  providerId:   { type: DataTypes.STRING(128), allowNull: true },
  sentAt:       { type: DataTypes.DATE, allowNull: true },
  errorMessage: { type: DataTypes.TEXT, allowNull: true },
}, { tableName: 'notifications' });
