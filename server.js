const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const http = require('http'); // مضاف للمكالمات
const { Server } = require('socket.io'); // مضاف للدردشة الفورية
require('dotenv').config();

const app = express();
const server = http.createServer(app); // تحويل السيرفر ليدعم Socket
const io = new Server(server);

// تعديل البورت ليتوافق مع Render (10000)
const PORT = process.env.PORT || 10000; 
const JWT_SECRET = process.env.JWT_SECRET || 'ayham-secret-key-2024';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection
const mongoURI = process.env.MONGODB_URI;

if (!mongoURI) {
    console.log('❌ MONGODB_URI مو موجود بالـ Environment Variables');
    process.exit(1);
}

mongoose.connect(mongoURI)
  .then(() => console.log('✅ MongoDB Connected - الإمبراطورية متصلة بالقاعدة'))
  .catch(err => {
       console.log('❌ MongoDB Error:', err.message);
   });

// User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    country: { type: String, required: true },
    birthDate: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// --- APIs التسجيل والدخول (شغالة تمام) ---
app.post('/api/register', async (req, res) => {
    try {
        const { username, lastName, email, password, country, birthDate, age, gender } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: 'الايميل مستخدم من قبل' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, lastName, email, password: hashedPassword, country, birthDate, age, gender });
        await newUser.save();

        const token = jwt.sign({ userId: newUser._id }, JWT_SECRET);
        res.json({ token, user: { username, lastName, email, country, age, gender } });
    } catch (error) { res.status(500).json({ error: 'خطأ بالسيرفر' }); }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ error: 'الايميل او كلمة السر غلط' });
        }
        const token = jwt.sign({ userId: user._id }, JWT_SECRET);
        res.json({ token, user: { username: user.username, email: user.email, gender: user.gender } });
    } catch (error) { res.status(500).json({ error: 'خطأ بالسيرفر' }); }
});

app.get('/api/profile', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'مافي توكن' });
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        res.json({ user });
    } catch (error) { res.status(401).json({ error: 'توكن منتهي' }); }
});

// --- إضافة نظام الدردشة المباشر (Socket.io) ---
io.on('connection', (socket) => {
    socket.on('send_msg', (data) => {
        io.emit('receive_msg', data); // إرسال الرسالة لكل الإمبراطورية
    });
});

// --- Routes الصفحات (تأكد من وجود الملفات بمجلد public) ---
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public/index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public/login.html')));
app.get('/me', (req, res) => res.sendFile(path.join(__dirname, 'public/me.html')));
app.get('/chat', (req, res) => res.sendFile(path.join(__dirname, 'public/chat.html'))); // صفحة الشات

// تشغيل السيرفر
server.listen(PORT, () => {
    console.log('------------------------------------');
    console.log(`🦁 إمبراطورية السبع V3 - جاهزة تماماً`);
    console.log(`🚀 السيرفر شغال على بورت ${PORT}`);
    console.log('------------------------------------');
});
