import { DataTypes } from 'sequelize';

export const defineBooking = (sequelize) => sequelize.define('Booking', {
  id:          { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  userId:      { type: DataTypes.UUID, allowNull: false },
  eventId:     { type: DataTypes.UUID, allowNull: false },
  quantity:    { type: DataTypes.INTEGER, allowNull: false },
  totalAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  status:      { type: DataTypes.ENUM('pending', 'confirmed', 'cancelled', 'refunded'), allowNull: false, defaultValue: 'confirmed' },
  placedAt:    { type: DataTypes.DATE, allowNull: false },
}, { tableName: 'bookings' });
