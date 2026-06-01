const { Event, Pura } = require('../models');

// Create Event (Admin Only)
const createEvent = async (req, res) => {
  try {
    const { pura_id, name, description, date, time, image_url } = req.body;

    // Validate that the temple exists
    const pura = await Pura.findByPk(pura_id);
    if (!pura) {
      return res.status(404).json({ message: 'Pura tidak ditemukan' });
    }

    // Verify if current user is the administrator of this temple
    if (pura.admin_id !== req.user.id) {
      return res.status(403).json({ message: 'Anda tidak memiliki akses ke Pura ini' });
    }

    // Create the event
    const event = await Event.create({
      pura_id,
      name,
      description,
      date,
      time,
      image_url,
    });

    res.status(201).json({ message: 'Acara berhasil ditambahkan', event });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ message: 'Gagal menambahkan acara', error: error.message });
  }
};

// Update Event (Admin Only)
const updateEvent = async (req, res) => {
  try {
    const { name, description, date, time, image_url } = req.body;
    const eventId = req.params.id;

    // Check if the event exists
    const event = await Event.findByPk(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Acara tidak ditemukan' });
    }

    // Check if user is the administrator of the temple associated with this event
    const pura = await Pura.findByPk(event.pura_id);
    if (!pura || pura.admin_id !== req.user.id) {
      return res.status(403).json({ message: 'Anda tidak memiliki akses ke acara Pura ini' });
    }

    // Update the event fields
    await event.update({
      name: name !== undefined ? name : event.name,
      description: description !== undefined ? description : event.description,
      date: date !== undefined ? date : event.date,
      time: time !== undefined ? time : event.time,
      image_url: image_url !== undefined ? image_url : event.image_url,
    });

    res.json({ message: 'Acara berhasil diperbarui', event });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ message: 'Gagal memperbarui acara', error: error.message });
  }
};

// Delete Event (Admin Only)
const deleteEvent = async (req, res) => {
  try {
    const eventId = req.params.id;

    // Check if event exists
    const event = await Event.findByPk(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Acara tidak ditemukan' });
    }

    // Check if user is the administrator of the temple associated with this event
    const pura = await Pura.findByPk(event.pura_id);
    if (!pura || pura.admin_id !== req.user.id) {
      return res.status(403).json({ message: 'Anda tidak memiliki akses ke acara Pura ini' });
    }

    // Delete the event
    await event.destroy();

    res.json({ message: 'Acara berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Gagal menghapus acara', error: error.message });
  }
};

// Get all events of a specific Pura (Public)
const getPuraEvents = async (req, res) => {
  try {
    const { puraId } = req.params;
    const events = await Event.findAll({
      where: { pura_id: puraId },
      order: [['date', 'ASC']],
    });
    res.json(events);
  } catch (error) {
    console.error('Error fetching pura events:', error);
    res.status(500).json({ message: 'Gagal mengambil data acara Pura', error: error.message });
  }
};

// Get all events across all temples (Public)
const getAllEvents = async (req, res) => {
  try {
    const events = await Event.findAll({
      include: [{
        model: Pura,
        as: 'pura',
        attributes: ['id', 'name', 'address', 'image_url'],
      }],
      order: [['date', 'ASC']],
    });
    res.json(events);
  } catch (error) {
    console.error('Error fetching all events:', error);
    res.status(500).json({ message: 'Gagal mengambil seluruh data acara', error: error.message });
  }
};

module.exports = {
  createEvent,
  updateEvent,
  deleteEvent,
  getPuraEvents,
  getAllEvents,
};
