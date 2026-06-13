const Registration = require('../models/Registration');
const Counter = require('../models/Counter');
const fs = require('fs');
const path = require('path');

// Helper to get formatted registration ID (TSS-0001, TSS-0002, etc.)
const getNextSequenceValue = async (sequenceName) => {
  const sequenceDocument = await Counter.findOneAndUpdate(
    { id: sequenceName },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  const seqNum = sequenceDocument.seq;
  return `TSS-${String(seqNum).padStart(4, '0')}`;
};

// Create a new registration
exports.createRegistration = async (req, res) => {
  const cleanUploadedFiles = (files) => {
    if (files) {
      if (files.youtubeProofs) {
        files.youtubeProofs.forEach(f => {
          if (f.path) fs.unlink(f.path, () => {});
        });
      }
      if (files.instagramProofs) {
        files.instagramProofs.forEach(f => {
          if (f.path) fs.unlink(f.path, () => {});
        });
      }
    }
  };

  try {
    // If files are missing, clean up any uploaded files and return error
    if (!req.files || !req.files.youtubeProofs || !req.files.instagramProofs) {
      cleanUploadedFiles(req.files);
      return res.status(400).json({ message: 'Both YouTube and Instagram follow screenshots are required.' });
    }

    const { teamName, teamLeaderName, teamLeaderUID, discordUsername, players } = req.body;

    // Parse players
    let parsedPlayers = [];
    try {
      parsedPlayers = typeof players === 'string' ? JSON.parse(players) : players;
    } catch (e) {
      cleanUploadedFiles(req.files);
      return res.status(400).json({ message: 'Invalid players data format. Must be JSON array.' });
    }

    if (!Array.isArray(parsedPlayers) || parsedPlayers.length < 4 || parsedPlayers.length > 5) {
      cleanUploadedFiles(req.files);
      return res.status(400).json({ message: 'Between 4 and 5 players are required.' });
    }

    // Handle optional Player 5
    if (parsedPlayers.length === 5) {
      const p5 = parsedPlayers[4];
      const isP5Empty = !p5.playerName && !p5.playerUID && !p5.role;
      if (isP5Empty) {
        parsedPlayers = parsedPlayers.slice(0, 4);
      } else {
        // If partially filled, validate it
        if (!p5.playerName || !p5.playerUID || !p5.role) {
          cleanUploadedFiles(req.files);
          return res.status(400).json({ message: 'Player 5 is incomplete. Please fill all fields (Name, UID, and Role) or leave them completely blank.' });
        }
      }
    }

    // Validate required players (1 to 4)
    for (let i = 0; i < parsedPlayers.length; i++) {
      const p = parsedPlayers[i];
      if (!p.playerName || !p.playerUID || !p.role) {
        cleanUploadedFiles(req.files);
        return res.status(400).json({ message: `Player ${i + 1} is missing required fields (Name, UID, and Role).` });
      }
    }

    // Validate dynamic proof count matches player count
    const requiredCount = parsedPlayers.length;
    if (req.files.youtubeProofs.length !== requiredCount || req.files.instagramProofs.length !== requiredCount) {
      cleanUploadedFiles(req.files);
      return res.status(400).json({
        message: `Dynamic upload mismatch: You have inputted details for ${requiredCount} team members. Therefore, you must upload exactly ${requiredCount} YouTube follow screenshots and exactly ${requiredCount} Instagram follow screenshots (one screenshot per member).`
      });
    }

    // Auto-generate sequential ID
    const registrationId = await getNextSequenceValue('registrationId');

    const registration = new Registration({
      registrationId,
      teamName,
      teamLeaderName,
      teamLeaderUID,
      discordUsername,
      players: parsedPlayers,
      youtubeProofs: req.files.youtubeProofs.map(f => f.filename),
      instagramProofs: req.files.instagramProofs.map(f => f.filename)
    });

    const saved = await registration.save();
    res.status(201).json({
      success: true,
      message: 'Registration Submitted Successfully',
      registrationId: saved.registrationId,
      data: saved
    });
  } catch (error) {
    cleanUploadedFiles(req.files);
    console.error('Registration error:', error);
    res.status(500).json({ message: error.message || 'Server error occurred during registration.' });
  }
};

// Get all registrations with optional search
exports.getRegistrations = async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query = {
        $or: [
          { registrationId: searchRegex },
          { teamName: searchRegex },
          { teamLeaderName: searchRegex }
        ]
      };
    }

    const registrations = await Registration.find(query).sort({ submittedAt: -1 });
    res.status(200).json(registrations);
  } catch (error) {
    console.error('Fetch error:', error);
    res.status(500).json({ message: 'Error retrieving registrations.' });
  }
};

// Get registration statistics
exports.getStats = async (req, res) => {
  try {
    const totalRegistrations = await Registration.countDocuments();
    
    // Start of today in server local time
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const registrationsToday = await Registration.countDocuments({
      submittedAt: { $gte: startOfToday }
    });

    // Find count of unique team names (case-insensitive group check or simple distinct group)
    const uniqueTeamsResult = await Registration.aggregate([
      { $group: { _id: { $toLower: '$teamName' } } },
      { $count: 'count' }
    ]);
    const totalTeams = uniqueTeamsResult.length > 0 ? uniqueTeamsResult[0].count : 0;

    res.status(200).json({
      totalRegistrations,
      registrationsToday,
      totalTeams
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ message: 'Error generating statistics.' });
  }
};

// Get single registration by MongoDB ID or custom ID
exports.getRegistrationById = async (req, res) => {
  try {
    const { id } = req.params;
    let registration;

    // Check if ID matches MongoDB ObjectId type
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      registration = await Registration.findById(id);
    } else {
      registration = await Registration.findOne({ registrationId: id });
    }

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    res.status(200).json(registration);
  } catch (error) {
    console.error('Fetch by ID error:', error);
    res.status(500).json({ message: 'Error retrieving registration details.' });
  }
};

// Delete registration (and clean files from server storage)
exports.deleteRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const registration = await Registration.findById(id);

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    // Delete static screenshot files if they exist
    const uploadsDir = path.join(__dirname, '../uploads');
    
    if (Array.isArray(registration.youtubeProofs)) {
      registration.youtubeProofs.forEach(filename => {
        const filePath = path.join(uploadsDir, filename);
        if (fs.existsSync(filePath)) {
          fs.unlink(filePath, (err) => {
            if (err) console.error('Error deleting youtube screenshot file:', err);
          });
        }
      });
    }

    if (Array.isArray(registration.instagramProofs)) {
      registration.instagramProofs.forEach(filename => {
        const filePath = path.join(uploadsDir, filename);
        if (fs.existsSync(filePath)) {
          fs.unlink(filePath, (err) => {
            if (err) console.error('Error deleting instagram screenshot file:', err);
          });
        }
      });
    }

    await Registration.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Registration and file proofs deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: 'Error deleting registration.' });
  }
};
