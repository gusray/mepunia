const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PaymentTransaction = sequelize.define('PaymentTransaction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  donation_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'donations',
      key: 'id',
    },
  },
  order_id: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true, // Midtrans order_id
  },
  transaction_status: {
    type: DataTypes.STRING, // e.g., 'pending', 'settlement', 'deny', 'expire', 'cancel'
    allowNull: false,
    defaultValue: 'pending',
  },
  payment_type: {
    type: DataTypes.STRING, // e.g., 'bank_transfer', 'qris'
  },
  gross_amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
  },
  transaction_time: {
    type: DataTypes.DATE,
  },
  settlement_time: {
    type: DataTypes.DATE,
  },
}, {
  tableName: 'payment_transactions',
  timestamps: true,
});

module.exports = PaymentTransaction;
