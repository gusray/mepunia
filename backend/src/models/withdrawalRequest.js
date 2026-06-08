const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const WithdrawalRequest = sequelize.define('WithdrawalRequest', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  pura_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'puras',
      key: 'id',
    },
  },
  admin_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
  },
  bank_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  account_number: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  account_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'pending', // pending, approved, rejected
  },
  admin_notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  superadmin_notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'withdrawal_requests',
  timestamps: true,
});

module.exports = WithdrawalRequest;
