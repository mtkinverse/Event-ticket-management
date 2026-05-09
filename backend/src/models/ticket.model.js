import { DataTypes } from 'sequelize';

export const defineTicket = (sequelize) => sequelize.define('Ticket', {
  id:           { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  bookingId:    { type: DataTypes.UUID, allowNull: false },
  eventId:      { type: DataTypes.UUID, allowNull: false },
  ticketNumber: { type: DataTypes.STRING(64), allowNull: false, unique: true },
  qrCode:       { type: DataTypes.TEXT, allowNull: false },
  scannedAt:    { type: DataTypes.DATE, allowNull: true },
}, { tableName: 'tickets' });
