const { Report, Pura } = require('../models');

const createReport = async (req, res) => {
  try {
    const { pura_id, title, description, amount_used, document_url } = req.body;

    const pura = await Pura.findByPk(pura_id);
    if (!pura) return res.status(404).json({ message: 'Pura not found' });
    if (pura.admin_id !== req.user.id) return res.status(403).json({ message: 'Forbidden' });

    const report = await Report.create({
      pura_id,
      title,
      description,
      amount_used,
      document_url,
    });

    res.status(201).json({ message: 'Report created successfully', report });
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getPuraReports = async (req, res) => {
  try {
    const pura_id = req.params.puraId;
    const reports = await Report.findAll({
      where: { pura_id },
      order: [['createdAt', 'DESC']],
    });
    res.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  createReport,
  getPuraReports,
};
