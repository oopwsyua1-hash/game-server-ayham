const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// ربط المتغيرات البيئية (Environment Variables) كما في إعداداتك
const PORT = process.env.PORT || 10000; 
const JWT_SECRET = process.env.JWT_SECRET || 'ayham_game_2026';
const mongoURI = process.env.MONGO_URI; // تم تعديل الاسم ليطابق صورتك في Render

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// الاتصال بقاعدة البيانات
if (!mongoURI) {
    console.log('❌ خطأ: MONGO_URI غير موجود في إعدادات Render');
} else {
    mongoose.connect(mongoURI)
      .then(() => console.log('✅ MongoDB Connected - إمبراطورية السبع متصلة'))
      .catch(err => console.log('❌ خطأ في الاتصال:', err.message));
}

// نموذج المستخدم المطور (مع الكونزات والـ VIP)
const userSchema = new mongoose.Schema({
    username: String,
    email: { type: String, unique: true },
    password: String,
    gender: String,
    coins: { type: Number, default: 0 }, // نظام الكونزات
    vipLevel: { type: String, default: 'none' }, // نظام VIP
    isOnline: { type: Boolean, default: false }
});

const User = mongoose.model('User', userSchema);

// --- نظام الدردشة المباشر (Socket.io) ---
io.on('connection', (socket) => {
    console.log('مستخدم دخل الدردشة 🦁');
    
    socket.on('send_msg', (data) => {
        io.emit('receive_msg', data);
    });

    socket.on('disconnect', () => {
        console.log('مستخدم غادر');
    });
});

// --- المسارات (Routes) ---
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public/index.html')));
app.get('/chat', (req, res) => res.sendFile(path.join(__dirname, 'public/chat.html')));
app.get('/me', (req, res) => res.sendFile(path.join(__dirname, 'public/me.html')));

// تشغيل السيرفر
server.listen(PORT, () => {
    console.log('------------------------------------');
    console.log(`🦁 إمبراطورية السبع - V3 - جاهزة تماماً`);
    console.log(`🔥 السيرفر شغال يا أبو نمر على بورت : ${PORT}`);
    console.log('------------------------------------');
});
