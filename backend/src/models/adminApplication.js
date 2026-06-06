const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AdminApplication = sequelize.define('AdminApplication', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  full_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  jabatan: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  pura_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  pura_address: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  pura_desa: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  pura_kecamatan: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  pura_kabupaten: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  pura_provinsi: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  pura_description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  pura_established_year: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  sk_document_type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  sk_document_url: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  identity_type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  identity_document_url: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending',
  },
}, {
  tableName: 'admin_applications',
  timestamps: true,
});

module.exports = AdminApplication;
