const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    gender: { type: String, required: true },
    // إضافات إمبراطورية السبع V3 👑
    coins: { type: Number, default: 0 }, 
    diamonds: { type: Number, default: 0 }, 
    role: { type: String, default: 'USER' }, // USER, AGENT, OWNER
    supportPoints: { type: Number, default: 0 }, // نقاط الدعم لتسكير التارجت
    isVIP: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
