const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const puraController = require('../controllers/puraController');
const donationController = require('../controllers/donationController');
const reportController = require('../controllers/reportController');
const reminderController = require('../controllers/reminderController');
const adminApplicationController = require('../controllers/adminApplicationController');
const eventController = require('../controllers/eventController');
const withdrawalController = require('../controllers/withdrawalController');

const { authenticateToken, optionalAuthenticateToken, isAdmin, isSuperAdmin } = require('../middlewares/authMiddleware');

// --- Auth Routes ---
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);

// --- Pura Routes ---
router.get('/puras', puraController.getAllPuras);
router.get('/puras/:id', puraController.getPuraById);
router.post('/puras', authenticateToken, isAdmin, puraController.createPura);
router.put('/puras/:id', authenticateToken, isAdmin, puraController.updatePura);

// --- Upload Route ---
const upload = require('../middlewares/uploadMiddleware');
const cloudinary = require('../config/cloudinary');

router.post('/upload', authenticateToken, isAdmin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Tidak ada file yang diunggah' });
    }

    const streamUpload = (fileBuffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'mepunia' },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        stream.end(fileBuffer);
      });
    };

    const result = await streamUpload(req.file.buffer);
    res.json({
      message: 'Upload sukses',
      secure_url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    res.status(500).json({ message: 'Gagal mengunggah gambar', error: error.message });
  }
});

// --- Donation Routes ---
router.post('/donations', optionalAuthenticateToken, donationController.createDonation);
router.post('/payments/webhook', donationController.midtransWebhook); // Midtrans callback
router.get('/donations/history', authenticateToken, donationController.getUserDonationHistory);
router.get('/donations/pura/:puraId', authenticateToken, isAdmin, donationController.getPuraDonations);
router.get('/donations/public/pura/:puraId', donationController.getPublicPuraDonations);

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

// --- Admin Application Routes ---
router.post('/admin-applications', authenticateToken, adminApplicationController.submitApplication);
router.get('/admin-applications/status', authenticateToken, adminApplicationController.getApplicationStatus);

// --- Withdrawal Routes ---
router.post('/withdrawals', authenticateToken, isAdmin, withdrawalController.createWithdrawalRequest);
router.get('/withdrawals/history', authenticateToken, isAdmin, withdrawalController.getPuraWithdrawalHistory);

// --- Superadmin Routes ---
router.get('/superadmin/applications', authenticateToken, isSuperAdmin, adminApplicationController.getAdminApplications);
router.post('/superadmin/applications/:id/review', authenticateToken, isSuperAdmin, adminApplicationController.reviewApplication);
router.get('/superadmin/admins', authenticateToken, isSuperAdmin, adminApplicationController.getAdminsAndPuras);
router.get('/superadmin/transactions', authenticateToken, isSuperAdmin, adminApplicationController.getAllTransactions);
router.get('/superadmin/withdrawals', authenticateToken, isSuperAdmin, withdrawalController.getAllWithdrawalRequests);
router.post('/superadmin/withdrawals/:id/review', authenticateToken, isSuperAdmin, withdrawalController.reviewWithdrawalRequest);

module.exports = router;
