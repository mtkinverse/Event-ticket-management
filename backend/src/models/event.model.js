import { DataTypes } from 'sequelize';

export const defineEvent = (sequelize) => sequelize.define('Event', {
  id:               { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  organizerId:      { type: DataTypes.UUID, allowNull: false },
  title:            { type: DataTypes.STRING(200), allowNull: false },
  description:      { type: DataTypes.TEXT, allowNull: false },
  category:         { type: DataTypes.STRING(100), allowNull: false },
  location:         { type: DataTypes.STRING(200), allowNull: false },
  startsAt:         { type: DataTypes.DATE, allowNull: false },
  endsAt:           { type: DataTypes.DATE, allowNull: false },
  capacity:         { type: DataTypes.INTEGER, allowNull: false },
  remaining:        { type: DataTypes.INTEGER, allowNull: false },
  ticketPrice:      { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  imageUrl:         { type: DataTypes.STRING, allowNull: true },
  status:           { type: DataTypes.ENUM('pending', 'active', 'cancelled', 'completed'), allowNull: false, defaultValue: 'pending' },
  refundDeadline:   { type: DataTypes.DATE, allowNull: true },
  rejectionReason:  { type: DataTypes.TEXT, allowNull: true },
  registrationOpen: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, { tableName: 'events' });
