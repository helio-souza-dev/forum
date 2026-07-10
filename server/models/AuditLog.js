const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  action: { type: String, required: true },
  targetId: { type: String, default: '' },
  targetTitle: { type: String, default: '' },
  performedBy: { type: String, default: 'Sistema' },
  reason: { type: String, default: '' },
  createdAt: { type: String, default: () => new Date().toISOString() }
}, {
  timestamps: true
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
