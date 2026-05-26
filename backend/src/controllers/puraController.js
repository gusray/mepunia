const { Pura, User } = require('../models');

const getAllPuras = async (req, res) => {
  try {
    const puras = await Pura.findAll({
      include: [{ model: User, as: 'admin', attributes: ['id', 'name'] }],
    });
    res.json(puras);
  } catch (error) {
    console.error('Error fetching puras:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getPuraById = async (req, res) => {
  try {
    const pura = await Pura.findByPk(req.params.id, {
      include: [{ model: User, as: 'admin', attributes: ['id', 'name'] }],
    });
    if (!pura) {
      return res.status(404).json({ message: 'Pura not found' });
    }
    res.json(pura);
  } catch (error) {
    console.error('Error fetching pura:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createPura = async (req, res) => {
  try {
    const { name, description, address, image_url } = req.body;
    // req.user is set by auth middleware
    const admin_id = req.user.id; 

    const newPura = await Pura.create({
      admin_id,
      name,
      description,
      address,
      image_url,
    });

    res.status(201).json({ message: 'Pura created successfully', pura: newPura });
  } catch (error) {
    console.error('Error creating pura:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updatePura = async (req, res) => {
  try {
    const { name, description, address, image_url } = req.body;
    const puraId = req.params.id;

    const pura = await Pura.findByPk(puraId);
    if (!pura) {
      return res.status(404).json({ message: 'Pura not found' });
    }

    // Check if user is the admin of this pura
    if (pura.admin_id !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    await pura.update({
      name: name || pura.name,
      description: description || pura.description,
      address: address || pura.address,
      image_url: image_url || pura.image_url,
    });

    res.json({ message: 'Pura updated successfully', pura });
  } catch (error) {
    console.error('Error updating pura:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getAllPuras,
  getPuraById,
  createPura,
  updatePura,
};
