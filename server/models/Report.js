const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  targetId: { type: String, required: true, index: true },
  targetTitle: { type: String, default: 'Mídia Sem Título' },
  reportedBy: { type: String, required: true, index: true },
  reason: { 
    type: String, 
    enum: ['nsfw_unmarked', 'spam', 'copyright', 'harassment', 'bot', 'other'],
    required: true 
  },
  details: { type: String, default: '' },
  status: { 
    type: String, 
    enum: ['pending', 'resolved_ban', 'dismissed', 'dismissed_abuse'], 
    default: 'pending',
    index: true 
  },
  resolvedBy: { type: String, default: null },
  resolvedAt: { type: String, default: null },
  createdAt: { type: String, default: () => new Date().toISOString() }
}, {
  timestamps: true
});

module.exports = mongoose.model('Report', reportSchema);
