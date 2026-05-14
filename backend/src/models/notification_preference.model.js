import { DataTypes } from 'sequelize';

export const defineNotificationPreference = (sequelize) => sequelize.define('NotificationPreference', {
  id:     { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  userId: { type: DataTypes.UUID, allowNull: false },
  type:   { type: DataTypes.STRING(64), allowNull: false },
  muted:  { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, {
  tableName: 'notification_preferences',
  indexes: [{ unique: true, fields: ['user_id', 'type'] }],
});
