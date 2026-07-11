const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  username: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin', 'dev'], default: 'user' },
  avatarUrl: { type: String, default: '' },
  bio: { type: String, default: 'Olá! Sou um membro ativo do PrismShare.' },
  bannerUrl: { type: String, default: '' },
  privacy: {
    showLikes: { type: Boolean, default: true },
    showPosts: { type: Boolean, default: true },
    allowComments: { type: Boolean, default: true }
  },
  followers: { type: [String], default: [] },
  following: { type: [String], default: [] },
  falseReportsCount: { type: Number, default: 0 },
  reportBanned: { type: Boolean, default: false },
  ageVerified: { type: Boolean, default: false },
  birthDate: { type: String, default: null },
  contentPreference: { type: String, enum: ['hide_mature', 'show_all', 'blur'], default: 'blur' },
  createdAt: { type: String, default: () => new Date().toISOString() }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);

