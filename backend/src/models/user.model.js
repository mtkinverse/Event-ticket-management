import { DataTypes } from 'sequelize';

export const defineUser = (sequelize) => sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('customer', 'organizer', 'admin'),
    allowNull: false,
    defaultValue: 'customer',
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
}, { tableName: 'users' });
