const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Sabe7:sabe7@cluster0.mlmou5y.mongodb.net/sabe7_chat?retryWrites=true&w=majority&appName=Cluster0';
const OWNER_EMAIL = 'lion777788@gmail.com';
const OWNER_DATA = {
    level: "10000 TOP",
    username: "السبع الحلبي",
    entryVideo: "https://files.catbox.moe/rdyb7g.mp4"
};

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB
mongoose.connect(MONGODB_URI).then(() => console.log('✅ MongoDB Connected')).catch(err => console.error('❌ MongoDB Error:', err));

const UserSchema = new mongoose.Schema({
    username: String,
    lastName: String,
    email: { type: String, unique: true },
    password: String,
    level: { type: String, default: "مستخدم جديد" },
    vip: { type: Boolean, default: false },
    membership: { type: Boolean, default: false },
    avatar: String,
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);

let rooms = {};

// Routes
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/room', (req, res) => res.sendFile(path.join(__dirname, 'public', 'room.html')));

// Auth
app.post('/api/register', async (req, res) => {
    try {
        const { username, lastName, email, password } = req.body;
        if (!username ||!email ||!password) return res.status(400).json({ error: 'كل الحقول مطلوبة' });

        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ error: 'البريد مستخدم' });

        const hashed = await bcrypt.hash(password, 10);
        const level = email === OWNER_EMAIL? "10000 TOP" : "مستخدم جديد";
        const user = new User({ username, lastName, email, password: hashed, level });
        await user.save();

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'sabe7_secret', { expiresIn: '30d' });
        res.json({ success: true, token, user: { id: user._id, username, level } });
    } catch (err) {
        res.status(500).json({ error: 'خطأ بالسيرفر' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: 'مستخدم غير موجود' });

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(400).json({ error: 'كلمة السر غلط' });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'sabe7_secret', { expiresIn: '30d' });
        res.json({ success: true, token, user: { id: user._id, username: user.username, level: user.level } });
    } catch (err) {
        res.status(500).json({ error: 'خطأ بالسيرفر' });
    }
});

// Socket.IO
io.on('connection', (socket) => {
    console.log('🔌 اتصال جديد:', socket.id);

    socket.on('joinRoom', async ({ roomId, token }) => {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sabe7_secret');
            const user = await User.findById(decoded.id);
            if (!user) return;

            socket.join(roomId);
            socket.userData = user;
            socket.currentRoom = roomId;

            if (user.email === OWNER_EMAIL) {
                io.to(roomId).emit('ownerEntry', {
                    video: OWNER_DATA.entryVideo,
                    duration: 13,
                    text: "دخول الادارة السبع الحلبي 👑"
                });
            }

            if (!rooms[roomId]) {
                rooms[roomId] = {
                    users: [],
                    mics: Array(12).fill(null),
                    admins: [],
                    name: "غرفة السبع الحلبي",
                    desc: "مرحباً بكم في غرفة دردشة!"
                };
