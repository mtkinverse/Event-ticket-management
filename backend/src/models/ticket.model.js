import { DataTypes } from 'sequelize';

export const defineTicket = (sequelize) => sequelize.define('Ticket', {
  id:        { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  eventId:   { type: DataTypes.UUID, allowNull: false },
  bookingId: { type: DataTypes.UUID, allowNull: false },
  userId:    { type: DataTypes.UUID, allowNull: false },
  qrCode:    { type: DataTypes.TEXT, allowNull: false },
  status:    { type: DataTypes.ENUM('valid', 'used', 'refunded'), allowNull: false, defaultValue: 'valid' },
  issuedAt:  { type: DataTypes.DATE, allowNull: false },
}, { tableName: 'tickets' });
