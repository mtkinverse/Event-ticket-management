import { DataTypes } from 'sequelize';

export const defineOrganizerApplication = (sequelize) => sequelize.define('OrganizerApplication', {
  id:                  { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  userId:              { type: DataTypes.UUID, allowNull: false },
  businessName:        { type: DataTypes.STRING(120), allowNull: false },
  motivation:          { type: DataTypes.TEXT, allowNull: false },
  paymentSnapshotPath: { type: DataTypes.STRING(255), allowNull: false },
  paymentAmountMinor:  { type: DataTypes.INTEGER, allowNull: false },
  currency:            { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'PKR' },
  paymentReference:    { type: DataTypes.STRING(64), allowNull: false },
  status:              { type: DataTypes.ENUM('pending', 'approved', 'rejected'), allowNull: false, defaultValue: 'pending' },
  reviewedBy:          { type: DataTypes.UUID, allowNull: true },
  reviewedAt:          { type: DataTypes.DATE, allowNull: true },
  rejectionReason:     { type: DataTypes.TEXT, allowNull: true },
  submittedAt:         { type: DataTypes.DATE, allowNull: false },
}, { tableName: 'organizer_applications' });
