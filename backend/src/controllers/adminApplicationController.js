const { AdminApplication, User, Pura, Donation, PaymentTransaction, sequelize } = require('../models');

// Submit Admin Application (User Only)
const submitApplication = async (req, res) => {
  try {
    const user_id = req.user.id;
    const {
      full_name,
      phone,
      email,
      jabatan,
      pura_name,
      pura_address,
      pura_desa,
      pura_kecamatan,
      pura_kabupaten,
      pura_provinsi,
      pura_description,
      pura_established_year,
      sk_document_type,
      sk_document_url,
      identity_type,
      identity_document_url,
    } = req.body;

    // Check if user is already an admin
    if (req.user.role === 'admin' || req.user.role === 'superadmin') {
      return res.status(400).json({ message: 'Anda sudah memiliki akses sebagai pengurus atau superadmin' });
    }

    // Check if there is an existing approved application
    const existingApproved = await AdminApplication.findOne({ where: { user_id, status: 'approved' } });
    if (existingApproved) {
      return res.status(400).json({ message: 'Pendaftaran Anda sudah disetujui sebelumnya' });
    }

    // Check if there is an existing pending application
    const existingPending = await AdminApplication.findOne({ where: { user_id, status: 'pending' } });
    if (existingPending) {
      // Overwrite the pending application with new data
      await existingPending.update({
        full_name,
        phone,
        email,
        jabatan,
        pura_name,
        pura_address,
        pura_desa,
        pura_kecamatan,
        pura_kabupaten,
        pura_provinsi,
        pura_description,
        pura_established_year: pura_established_year || null,
        sk_document_type,
        sk_document_url,
        identity_type,
        identity_document_url,
      });
      return res.status(200).json({ message: 'Pendaftaran admin diperbarui', application: existingPending });
    }

    // Create a new application
    const newApplication = await AdminApplication.create({
      user_id,
      full_name,
      phone,
      email,
      jabatan,
      pura_name,
      pura_address,
      pura_desa,
      pura_kecamatan,
      pura_kabupaten,
      pura_provinsi,
      pura_description,
      pura_established_year: pura_established_year || null,
      sk_document_type,
      sk_document_url,
      identity_type,
      identity_document_url,
      status: 'pending',
    });

    res.status(201).json({ message: 'Pendaftaran admin berhasil dikirim', application: newApplication });
  } catch (error) {
    console.error('Error submitting admin application:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get Current User's Application Status
const getApplicationStatus = async (req, res) => {
  try {
    const user_id = req.user.id;
    const application = await AdminApplication.findOne({ where: { user_id } });
    res.json(application);
  } catch (error) {
    console.error('Error fetching application status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get All Admin Applications (Superadmin Only)
const getAdminApplications = async (req, res) => {
  try {
    const applications = await AdminApplication.findAll({
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
      order: [
        // Show pending first, then by date (newest first)
        [
          sequelize.literal("CASE WHEN status = 'pending' THEN 1 WHEN status = 'rejected' THEN 2 ELSE 3 END"),
          'ASC',
        ],
        ['createdAt', 'DESC'],
      ],
    });
    res.json(applications);
  } catch (error) {
    console.error('Error fetching admin applications:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Approve or Reject Admin Application (Superadmin Only)
const reviewApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status tidak valid' });
    }

    const application = await AdminApplication.findByPk(id);
    if (!application) {
      return res.status(404).json({ message: 'Pendaftaran tidak ditemukan' });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({ message: 'Pendaftaran ini sudah ditinjau sebelumnya' });
    }

    if (status === 'approved') {
      // 1. Update user role to admin
      const user = await User.findByPk(application.user_id);
      if (!user) {
        return res.status(404).json({ message: 'User pengaju tidak ditemukan' });
      }
      user.role = 'admin';
      await user.save();

      // 2. Automatically create Pura for the admin (enforces 1 admin - 1 Pura)
      const existingPura = await Pura.findOne({ where: { admin_id: user.id } });
      if (!existingPura) {
        const fullAddress = `${application.pura_address}, Desa ${application.pura_desa}, Kec. ${application.pura_kecamatan}, ${application.pura_kabupaten}, ${application.pura_provinsi}`;
        await Pura.create({
          admin_id: user.id,
          name: application.pura_name,
          address: fullAddress,
          description: application.pura_description,
          image_url: 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?auto=format&fit=crop&q=80&w=600', // standard fallback Pura image
          is_verified: true,
        });
      }

      application.status = 'approved';
      await application.save();

      return res.json({ message: 'Pendaftaran disetujui, user dipromosikan menjadi Admin dan Pura berhasil didaftarkan.', application });
    } else {
      application.status = 'rejected';
      await application.save();

      return res.json({ message: 'Pendaftaran berhasil ditolak.', application });
    }
  } catch (error) {
    console.error('Error reviewing application:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get List of Admins & their managed Puras (Superadmin Only)
const getAdminsAndPuras = async (req, res) => {
  try {
    const admins = await User.findAll({
      where: { role: 'admin' },
      attributes: ['id', 'name', 'email', 'createdAt'],
      include: [{ model: Pura, as: 'managedPuras', attributes: ['id', 'name', 'address', 'is_verified'] }],
      order: [['createdAt', 'DESC']],
    });
    res.json(admins);
  } catch (error) {
    console.error('Error fetching admins and puras:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get All System Transactions (Superadmin Only)
const getAllTransactions = async (req, res) => {
  try {
    const donations = await Donation.findAll({
      include: [
        { model: Pura, as: 'pura', attributes: ['id', 'name'] },
        { model: User, as: 'donatur', attributes: ['id', 'name', 'email'] },
        { model: PaymentTransaction, as: 'payment' },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(donations);
  } catch (error) {
    console.error('Error fetching all transactions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  submitApplication,
  getApplicationStatus,
  getAdminApplications,
  reviewApplication,
  getAdminsAndPuras,
  getAllTransactions,
};
