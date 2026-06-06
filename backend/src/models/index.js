const { sequelize } = require('../config/database');
const User = require('./user');
const Pura = require('./pura');
const Donation = require('./donation');
const PaymentTransaction = require('./paymentTransaction');
const Report = require('./report');
const Reminder = require('./reminder');
const Event = require('./event');
const AdminApplication = require('./adminApplication');

// Define Associations

// User has one AdminApplication
User.hasOne(AdminApplication, { foreignKey: 'user_id', as: 'adminApplication', onDelete: 'CASCADE' });
AdminApplication.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User (Admin) has many Puras
User.hasMany(Pura, { foreignKey: 'admin_id', as: 'managedPuras' });
Pura.belongsTo(User, { foreignKey: 'admin_id', as: 'admin' });

// User (Donatur) has many Donations
User.hasMany(Donation, { foreignKey: 'user_id', as: 'donations' });
Donation.belongsTo(User, { foreignKey: 'user_id', as: 'donatur' });

// Pura has many Donations
Pura.hasMany(Donation, { foreignKey: 'pura_id', as: 'donations' });
Donation.belongsTo(Pura, { foreignKey: 'pura_id', as: 'pura' });

// Donation has one PaymentTransaction
Donation.hasOne(PaymentTransaction, { foreignKey: 'donation_id', as: 'payment' });
PaymentTransaction.belongsTo(Donation, { foreignKey: 'donation_id', as: 'donation' });

// Pura has many Reports
Pura.hasMany(Report, { foreignKey: 'pura_id', as: 'reports' });
Report.belongsTo(Pura, { foreignKey: 'pura_id', as: 'pura' });

// User has many Reminders
User.hasMany(Reminder, { foreignKey: 'user_id', as: 'reminders' });
Reminder.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Pura has many Events
Pura.hasMany(Event, { foreignKey: 'pura_id', as: 'events', onDelete: 'CASCADE' });
Event.belongsTo(Pura, { foreignKey: 'pura_id', as: 'pura' });

module.exports = {
  sequelize,
  User,
  Pura,
  Donation,
  PaymentTransaction,
  Report,
  Reminder,
  Event,
  AdminApplication,
};

