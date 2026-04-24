const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  userId: { type: String, unique: true, default: () => Math.floor(1000000 + Math.random() * 9000000).toString() },
  avatar: { type: String, default: 'https://i.ibb.co/3pPYj6V/default-avatar.png' },
  bio: { type: String, default: '' },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  gender: { type: String, default: '' },
  birthDate: { type: String, default: '' },
  agency: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency', default: null },
  agencyRole: { type: String, default: null },
  followers: { type: Number, default: 0 },
  following: { type: Number, default: 0 },
  friends: { type: Number, default: 0 },
  visitors: { type: Number, default: 0 },
  vip: { type: Number, default: 0 },
  banned: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now },
  isOnline: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
