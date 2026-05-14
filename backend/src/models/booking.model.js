import { DataTypes } from 'sequelize';

export const defineBooking = (sequelize) => sequelize.define('Booking', {
  id:          { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  userId:      { type: DataTypes.UUID, allowNull: false },
  eventId:     { type: DataTypes.UUID, allowNull: false },
  quantity:         { type: DataTypes.INTEGER, allowNull: false },
  totalAmountMinor: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  currency:         { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'PKR' },
  status:      { type: DataTypes.ENUM('confirmed', 'cancelled'), allowNull: false, defaultValue: 'confirmed' },
  placedAt:    { type: DataTypes.DATE, allowNull: false },
  cancelledAt: { type: DataTypes.DATE, allowNull: true },
}, { tableName: 'bookings' });
