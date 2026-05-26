const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Donation = sequelize.define('Donation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: true, // Can be anonymous
    references: {
      model: 'users',
      key: 'id',
    },
  },
  pura_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'puras',
      key: 'id',
    },
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
  },
  is_anonymous: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  is_monthly_auto: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'donations',
  timestamps: true,
});

module.exports = Donation;
