const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  id: { type: String, required: true },
  author: { type: String, default: 'Usuário Anônimo' },
  text: { type: String, default: '' },
  createdAt: { type: String, default: () => new Date().toISOString() }
}, { _id: false });

const postSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  title: { type: String, default: 'Mídia Sem Título' },
  description: { type: String, default: '' },
  filename: { type: String, required: true },
  url: { type: String, required: true },
  type: { type: String, enum: ['image', 'video', 'gif'], default: 'image' },
  tags: [{ type: String }],
  uploader: { type: String, default: 'Anônimo', index: true },
  author: { type: String, default: '' },
  source: { type: String, default: '' },
  likes: { type: Number, default: 0 },
  likedBy: [{ type: String }],
  views: { type: Number, default: 0 },
  comments: [commentSchema],
  nsfw: { type: Boolean, default: false },
  banned: { type: Boolean, default: false },
  banReason: { type: String, default: null },
  bannedBy: { type: String, default: null },
  bannedAt: { type: String, default: null },
  createdAt: { type: String, default: () => new Date().toISOString() }
}, {
  timestamps: true
});

module.exports = mongoose.model('Post', postSchema);
