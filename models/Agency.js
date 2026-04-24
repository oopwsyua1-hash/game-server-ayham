const mongoose = require('mongoose');

const AgencySchema = new mongoose.Schema({
  name: { type: String, required: true },
  roomImage: { type: String, default: 'https://i.ibb.co/3pPYj6V/agency-default.png' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['owner', 'admin', 'member'], default: 'member' },
    joinedAt: { type: Date, default: Date.now }
  }],
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  agencyId: { type: String, unique: true },
  createdAt: { type: Date, default: Date.now }
});

AgencySchema.pre('save', function(next) {
  if (!this.agencyId) {
    this.agencyId = 'AG' + Math.floor(100000 + Math.random() * 900000);
  }
  next();
});

module.exports = mongoose.model('Agency', AgencySchema);
