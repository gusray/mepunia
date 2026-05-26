const { Reminder } = require('../models');

const createReminder = async (req, res) => {
  try {
    const { event_name, event_date } = req.body;
    const user_id = req.user.id;

    const reminder = await Reminder.create({
      user_id,
      event_name,
      event_date,
    });

    res.status(201).json({ message: 'Reminder created successfully', reminder });
  } catch (error) {
    console.error('Error creating reminder:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getUserReminders = async (req, res) => {
  try {
    const user_id = req.user.id;
    const reminders = await Reminder.findAll({
      where: { user_id, is_active: true },
      order: [['event_date', 'ASC']],
    });
    res.json(reminders);
  } catch (error) {
    console.error('Error fetching reminders:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  createReminder,
  getUserReminders,
};
