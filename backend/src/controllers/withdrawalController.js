const { Donation, PaymentTransaction, WithdrawalRequest, Pura, User } = require('../models');

const calculateNetPunia = (amount, paymentType) => {
  const numAmount = Number(amount);
  if (!paymentType) return numAmount;
  
  const type = paymentType.toLowerCase();
  if (type.includes('qris')) {
    return numAmount * 0.993; // 0.7% MDR
  } else if (type.includes('gopay') || type.includes('shopeepay') || type.includes('qris_gopay')) {
    return numAmount * 0.98; // 2% MDR
  } else if (type.includes('bank_transfer') || type.includes('va') || type.includes('echannel') || type.includes('bca') || type.includes('mandiri') || type.includes('bni') || type.includes('bri') || type.includes('permata')) {
    return Math.max(0, numAmount - 4000); // Rp4.000 flat VA fee
  }
  return numAmount;
};

const createWithdrawalRequest = async (req, res) => {
  try {
    const { amount, bank_name, account_number, account_name, admin_notes } = req.body;
    const admin_id = req.user.id;

    // 1. Get managed pura
    const pura = await Pura.findOne({ where: { admin_id } });
    if (!pura) {
      return res.status(404).json({ message: 'Anda belum memiliki Pura yang diverifikasi untuk mengajukan penarikan.' });
    }

    // 2. Fetch all successful donations for this pura
    const donations = await Donation.findAll({
      where: { pura_id: pura.id },
      include: [{
        model: PaymentTransaction,
        as: 'payment',
        where: { transaction_status: 'success' }
      }]
    });

    // 3. Calculate net total
    const totalNet = donations.reduce((sum, d) => {
      const payType = d.payment?.payment_type;
      return sum + calculateNetPunia(d.amount, payType);
    }, 0);

    // 4. Fetch all active withdrawal requests (pending + approved)
    const activeWithdrawals = await WithdrawalRequest.findAll({
      where: {
        pura_id: pura.id,
        status: ['pending', 'approved']
      }
    });

    const totalWithdrawn = activeWithdrawals.reduce((sum, w) => sum + Number(w.amount), 0);
    const availableBalance = totalNet - totalWithdrawn;

    // 5. Validate amount
    if (Number(amount) <= 0) {
      return res.status(400).json({ message: 'Nominal penarikan harus lebih besar dari Rp 0.' });
    }

    if (Number(amount) > availableBalance) {
      return res.status(400).json({
        message: `Saldo kas bersih tidak mencukupi. Saldo tersedia: Rp ${Math.round(availableBalance).toLocaleString('id-ID')}`
      });
    }

    // 6. Create request
    const request = await WithdrawalRequest.create({
      pura_id: pura.id,
      admin_id,
      amount: Number(amount),
      bank_name,
      account_number,
      account_name,
      admin_notes,
      status: 'pending'
    });

    res.status(201).json({
      message: 'Pengajuan penarikan dana berhasil dikirim.',
      request
    });
  } catch (error) {
    console.error('Error in createWithdrawalRequest:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getPuraWithdrawalHistory = async (req, res) => {
  try {
    const admin_id = req.user.id;
    const pura = await Pura.findOne({ where: { admin_id } });
    if (!pura) {
      return res.status(404).json({ message: 'Pura tidak ditemukan.' });
    }

    const history = await WithdrawalRequest.findAll({
      where: { pura_id: pura.id },
      order: [['createdAt', 'DESC']]
    });

    res.json(history);
  } catch (error) {
    console.error('Error in getPuraWithdrawalHistory:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getAllWithdrawalRequests = async (req, res) => {
  try {
    const requests = await WithdrawalRequest.findAll({
      include: [
        { model: Pura, as: 'pura', attributes: ['id', 'name', 'address'] },
        { model: User, as: 'admin', attributes: ['id', 'name', 'email'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(requests);
  } catch (error) {
    console.error('Error in getAllWithdrawalRequests:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const reviewWithdrawalRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, superadmin_notes } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status tidak valid. Harus approved atau rejected.' });
    }

    const request = await WithdrawalRequest.findByPk(id, {
      include: [{ model: Pura, as: 'pura', attributes: ['id', 'name'] }]
    });

    if (!request) {
      return res.status(404).json({ message: 'Pengajuan penarikan tidak ditemukan.' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Pengajuan ini sudah diproses sebelumnya.' });
    }

    await request.update({
      status,
      superadmin_notes
    });

    res.json({
      message: `Pengajuan penarikan dana untuk ${request.pura?.name || 'Pura'} telah ${status === 'approved' ? 'disetujui' : 'ditolak'}.`,
      request
    });
  } catch (error) {
    console.error('Error in reviewWithdrawalRequest:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  createWithdrawalRequest,
  getPuraWithdrawalHistory,
  getAllWithdrawalRequests,
  reviewWithdrawalRequest
};
