const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Event = sequelize.define('Event', {
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
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  time: {
    type: DataTypes.STRING,
  },
  image_url: {
    type: DataTypes.STRING,
  },
}, {
  tableName: 'events',
  timestamps: true,
});

module.exports = Event;
