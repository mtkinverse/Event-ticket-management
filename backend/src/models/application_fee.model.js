import { DataTypes } from 'sequelize';

export const defineApplicationFee = (sequelize) => sequelize.define('ApplicationFee', {
  id:                     { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  organizerId:            { type: DataTypes.UUID, allowNull: false },
  eventId:                { type: DataTypes.UUID, allowNull: false },
  amount:                 { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  status:                 { type: DataTypes.ENUM('held', 'consumed', 'refunded'), allowNull: false, defaultValue: 'held' },
  gatewayPaymentIntentId: { type: DataTypes.STRING, allowNull: true },
  heldAt:                 { type: DataTypes.DATE, allowNull: false },
  resolvedAt:             { type: DataTypes.DATE, allowNull: true },
}, { tableName: 'application_fees' });
