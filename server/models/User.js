const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  username: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin', 'dev'], default: 'user' },
  createdAt: { type: String, default: () => new Date().toISOString() }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
