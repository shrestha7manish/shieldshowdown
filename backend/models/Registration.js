const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  playerName: { type: String, required: true },
  playerUID: { type: String, required: true },
  role: { type: String, enum: ['IGL', 'Rusher', 'Sniper', 'Support'], required: true }
});

const registrationSchema = new mongoose.Schema({
  registrationId: { type: String, unique: true },
  teamName: { type: String, required: true },
  teamLeaderName: { type: String, required: true },
  email: { type: String, required: true },
  discordUsername: { type: String },
  players: {
    type: [playerSchema],
    validate: [val => val.length >= 4 && val.length <= 5, 'Tournament requires between 4 and 5 players']
  },
  youtubeProofs: { type: [String], required: true }, // array of filenames
  instagramProofs: { type: [String], required: true }, // array of filenames
  submittedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Registration', registrationSchema);
