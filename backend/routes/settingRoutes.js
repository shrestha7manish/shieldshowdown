const express = require('express');
const router = express.Router();
const Setting = require('../models/Setting');

const upload = require('../config/multer');

// Upload logo to Cloudinary
router.post('/upload-logo', upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }
    res.status(200).json({ url: req.file.path });
  } catch (error) {
    console.error('Error uploading logo:', error);
    res.status(500).json({ message: 'Error uploading logo.' });
  }
});

// Get setting by key
router.get('/:key', async (req, res) => {
  try {
    let setting = await Setting.findOne({ key: req.params.key });
    if (!setting) {
      // Return dynamic default settings if not exists in DB yet
      if (req.params.key === 'timer') {
        const defaultTimer = {
          targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
          isEnabled: true,
          title: 'Registration Closes In'
        };
        return res.status(200).json({ key: 'timer', value: defaultTimer });
      }
      if (req.params.key === 'invited_teams') {
        return res.status(200).json({ key: 'invited_teams', value: [] });
      }
      return res.status(404).json({ message: 'Setting not found' });
    }
    res.status(200).json(setting);
  } catch (error) {
    console.error('Error fetching setting:', error);
    res.status(500).json({ message: 'Error retrieving settings config.' });
  }
});

// Update or Upsert setting by key
router.post('/:key', async (req, res) => {
  try {
    const { value } = req.body;
    if (value === undefined) {
      return res.status(400).json({ message: 'Value payload is required.' });
    }
    const setting = await Setting.findOneAndUpdate(
      { key: req.params.key },
      { value },
      { new: true, upsert: true }
    );
    res.status(200).json(setting);
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({ message: 'Error updating settings config.' });
  }
});

module.exports = router;
