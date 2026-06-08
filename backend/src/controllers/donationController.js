const { Donation, PaymentTransaction, Pura, User } = require('../models');
const { snap } = require('../config/midtrans');
const { v4: uuidv4 } = require('uuid');

const createDonation = async (req, res) => {
  try {
    const { pura_id, amount, message, is_anonymous } = req.body;
    const user_id = req.user ? req.user.id : null; // User might be optional if anonymous is fully unauthenticated, but here we assume logged in

    // Fetch user and pura for Midtrans customer details
    const user = user_id ? await User.findByPk(user_id) : null;
    const pura = await Pura.findByPk(pura_id);

    if (!pura) {
      return res.status(404).json({ message: 'Pura not found' });
    }

    // Generate unique order ID for Midtrans
    const order_id = `DONATION-${uuidv4()}`;

    // Create Donation record
    const donation = await Donation.create({
      user_id,
      pura_id,
      amount,
      message,
      is_anonymous,
    });

    // Create Initial Payment Transaction record
    await PaymentTransaction.create({
      donation_id: donation.id,
      order_id: order_id,
      transaction_status: 'pending',
      gross_amount: amount,
    });

    // Create Midtrans Transaction parameters
    const parameter = {
      transaction_details: {
        order_id: order_id,
        gross_amount: Math.round(amount),
      },
      credit_card: {
        secure: true,
      },
      customer_details: {
        first_name: is_anonymous ? 'Hamba' : (user ? user.name : 'Hamba'),
        last_name: is_anonymous ? 'Tuhan' : '',
        email: user ? user.email : 'anonymous@mepunia.com',
      },
      item_details: [{
        id: pura.id.substring(0, 10),
        price: Math.round(amount),
        quantity: 1,
        name: `Dana Punia ke ${pura.name}`,
      }],
    };

    // Get Snap Token
    const transaction = await snap.createTransaction(parameter);

    res.status(201).json({
      message: 'Donation created successfully',
      token: transaction.token,
      redirect_url: transaction.redirect_url,
      donation,
    });
  } catch (error) {
    console.error('Error creating donation:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const midtransWebhook = async (req, res) => {
  try {
    const notificationJson = req.body;

    const statusResponse = await snap.transaction.notification(notificationJson);
    const { order_id, transaction_status, fraud_status, payment_type, transaction_time, settlement_time } = statusResponse;

    const paymentTx = await PaymentTransaction.findOne({ where: { order_id } });

    if (!paymentTx) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    let finalStatus = transaction_status;

    if (transaction_status === 'capture') {
      if (fraud_status === 'challenge') {
        finalStatus = 'challenge';
      } else if (fraud_status === 'accept') {
        finalStatus = 'success';
      }
    } else if (transaction_status === 'settlement') {
      finalStatus = 'success';
    } else if (transaction_status === 'cancel' || transaction_status === 'deny' || transaction_status === 'expire') {
      finalStatus = 'failed';
    } else if (transaction_status === 'pending') {
      finalStatus = 'pending';
    }

    await paymentTx.update({
      transaction_status: finalStatus,
      payment_type,
      transaction_time,
      settlement_time,
    });

    res.status(200).json({ message: 'Webhook received' });
  } catch (error) {
    console.error('Error in Midtrans webhook:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getUserDonationHistory = async (req, res) => {
  try {
    const user_id = req.user.id;
    const donations = await Donation.findAll({
      where: { user_id },
      include: [
        { model: Pura, as: 'pura', attributes: ['id', 'name'] },
        { model: PaymentTransaction, as: 'payment', attributes: ['transaction_status', 'payment_type', 'transaction_time'] }
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(donations);
  } catch (error) {
    console.error('Error fetching user history:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getPuraDonations = async (req, res) => {
  try {
    const pura_id = req.params.puraId;
    
    // Validate if the requester is the admin of this pura
    const pura = await Pura.findByPk(pura_id);
    if (!pura) return res.status(404).json({ message: 'Pura not found' });
    if (pura.admin_id !== req.user.id) return res.status(403).json({ message: 'Forbidden' });

    const donations = await Donation.findAll({
      where: { pura_id },
      include: [
        { model: User, as: 'donatur', attributes: ['id', 'name'] },
        { model: PaymentTransaction, as: 'payment', where: { transaction_status: 'success' }, attributes: ['gross_amount', 'transaction_time', 'payment_type', 'transaction_status'] }
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(donations);
  } catch (error) {
    console.error('Error fetching pura donations:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getPublicPuraDonations = async (req, res) => {
  try {
    const pura_id = req.params.puraId;
    
    const donations = await Donation.findAll({
      where: { pura_id },
      include: [
        { model: User, as: 'donatur', attributes: ['id', 'name'] },
        { 
          model: PaymentTransaction, 
          as: 'payment', 
          where: { transaction_status: 'success' }, 
          attributes: ['gross_amount', 'transaction_time', 'payment_type', 'transaction_status'] 
        }
      ],
      order: [['createdAt', 'DESC']],
    });

    const sanitized = donations.map(d => {
      const donationObj = d.toJSON();
      if (donationObj.is_anonymous || !donationObj.donatur) {
        donationObj.donatur = { name: 'Anonim' };
      }
      return donationObj;
    });

    res.json(sanitized);
  } catch (error) {
    console.error('Error fetching public pura donations:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  createDonation,
  midtransWebhook,
  getUserDonationHistory,
  getPuraDonations,
  getPublicPuraDonations,
};

