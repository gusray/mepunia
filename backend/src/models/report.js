const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Report = sequelize.define('Report', {
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
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  amount_used: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
  },
  document_url: {
    type: DataTypes.STRING, // URL to image/pdf
  },
}, {
  tableName: 'reports',
  timestamps: true,
});

module.exports = Report;
