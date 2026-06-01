const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const puraController = require('../controllers/puraController');
const donationController = require('../controllers/donationController');
const reportController = require('../controllers/reportController');
const reminderController = require('../controllers/reminderController');
const eventController = require('../controllers/eventController');

const { authenticateToken, optionalAuthenticateToken, isAdmin } = require('../middlewares/authMiddleware');

// --- Auth Routes ---
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);

// --- Pura Routes ---
router.get('/puras', puraController.getAllPuras);
router.get('/puras/:id', puraController.getPuraById);
router.post('/puras', authenticateToken, isAdmin, puraController.createPura);
router.put('/puras/:id', authenticateToken, isAdmin, puraController.updatePura);

// --- Donation Routes ---
router.post('/donations', optionalAuthenticateToken, donationController.createDonation);
router.post('/payments/webhook', donationController.midtransWebhook); // Midtrans callback
router.get('/donations/history', authenticateToken, donationController.getUserDonationHistory);
router.get('/donations/pura/:puraId', authenticateToken, isAdmin, donationController.getPuraDonations);

// --- Report Routes ---
router.post('/reports', authenticateToken, isAdmin, reportController.createReport);
router.get('/reports/pura/:puraId', reportController.getPuraReports); // Publicly accessible

// --- Reminder Routes ---
router.post('/reminders', authenticateToken, reminderController.createReminder);
router.get('/reminders', authenticateToken, reminderController.getUserReminders);

// --- Event Routes ---
router.post('/events', authenticateToken, isAdmin, eventController.createEvent);
router.put('/events/:id', authenticateToken, isAdmin, eventController.updateEvent);
router.delete('/events/:id', authenticateToken, isAdmin, eventController.deleteEvent);
router.get('/events/pura/:puraId', eventController.getPuraEvents);
router.get('/events', eventController.getAllEvents);

module.exports = router;

