const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  avatar: { type: String, default: 'https://i.ibb.co/3pPYj6V/default-avatar.png' },
  bio: { type: String, default: '' },
  gender: { type: String, default: '' },
  birthDate: { type: String, default: '' },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  agency: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency', default: null },
  agencyRole: { type: String, enum: ['owner', 'admin', 'member', null], default: null },
  visitors: { type: Number, default: 0 },
  followers: { type: Number, default: 0 },
  following: { type: Number, default: 0 },
  friends: { type: Number, default: 0 },
  coins: { type: Number, default: 0 },
  diamonds: { type: Number, default: 0 },
  vip: { type: Number, default: 0 },
  userId: { type: String, unique: true },
  createdAt: { type: Date, default: Date.now }
});

// توليد ID تلقائي
UserSchema.pre('save', function(next) {
  if (!this.userId) {
    this.userId = Math.floor(1000000 + Math.random() * 9000000).toString();
  }
  next();
});

module.exports = mongoose.model('User', UserSchema);
