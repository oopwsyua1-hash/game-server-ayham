const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    pingTimeout: 60000,
    pingInterval: 25000
});

const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'ayham-secret-key-2024';
const OWNER_EMAIL = 'm12341234ahmad@gmail.com';
const OWNER_DATA = {
    level: "10000 TOP",
    username: "السبع الحلبي",
    entryVideo: "https://files.catbox.moe/rdyb7g.mp4"
};

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection
const mongoURI = process.env.MONGO_URI; // عدلت من MONGODB_URI لـ MONGO_URI عشان يطابق Render
if (!mongoURI) {
    console.log('❌ MONGO_URI مو موجود بالـ Environment Variables');
    process.exit(1);
}
mongoose.connect(mongoURI)
   .then(() => console.log('✅ MongoDB Connected - السيرفر شغال'))
   .catch(err => {
        console.log('❌ MongoDB Error:', err.message);
        process.exit(1);
    });

// User Schema - نفس تبعك + اضافة level و vip
const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    country: { type: String, required: true },
    birthDate: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, required: true },
    level: { type: String, default: "مستخدم جديد" },
    vip: { type: Boolean, default: false },
    membership: { type: Boolean, default: false },
    avatar: String,
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

let rooms = {}; // لتخزين بيانات الغرف

// Register API - تبعك مع اضافة level للمالك
app.post('/api/register', async (req, res) => {
    try {
        const { username, lastName, email, password, country, birthDate, age, gender } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'الايميل مستخدم من قبل' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const level = email === OWNER_EMAIL? "10000 TOP" : "مستخدم جديد";

        const newUser = new User({
            username, lastName, email, password: hashedPassword,
            country, birthDate, age, gender, level
        });
        await newUser.save();
        const token = jwt.sign({ userId: newUser._id }, JWT_SECRET);
        res.json({ token, user: { username, lastName, email, country, age, gender, level } });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'خطأ بالسيرفر' });
    }
});

// Login API - تبعك
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'الايميل او كلمة السر غلط' });
        }
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(400).json({ error: 'الايميل او كلمة السر غلط' });
        }
        const token = jwt.sign({ userId: user._id }, JWT_SECRET);
        res.json({ token, user: {
            username: user.username, lastName: user.lastName, email: user.email,
            country: user.country, age: user.age, gender: user.gender, level: user.level
        }});
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'خطأ بالسيرفر' });
    }
});

// Profile API - تبعك
app.get('/api/profile', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'مافي توكن' });
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        if (!user) return res.status(404).json({ error: 'اليوزر مو موجود' });
        res.json({ user });
    } catch (error) {
        res.status(401).json({ error: 'توكن غلط او منتهي' });
    }
});

// Routes للصفحات
app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'index.html')); });
app.get('/login', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'login.html')); });
app.get('/me', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'me.html')); });
app.get('/room', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'room.html')); });

// Socket.IO للغرف الصوتية
io.on('connection', (socket) => {
    console.log('🔌 اتصال جديد:', socket.id);

    socket.on('joinRoom', async ({ roomId, token }) => {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            const user = await User.findById(decoded.userId);
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
                    mics: Array(4).fill(null),
                    maxMics: 4,
                    name: "غرفة السبع الحلبي",
                    desc: "مرحباً بكم!",
                    messages: []
                };
            }

            rooms[roomId].users = rooms[roomId].users.filter(u => u.userId.toString()!== user._id.toString());

            const userData = {
                socketId: socket.id,
                userId: user._id,
                username: user.username + ' ' + (user.lastName || ''),
                level: user.level,
                vip: user.vip,
                membership: user.membership,
                avatar: user.avatar || null
            };

            rooms[roomId].users.push(userData);
            io.to(roomId).emit('userJoined', { username: userData.username, avatar: userData.avatar });
            io.to(roomId).emit('roomUpdate', rooms[roomId]);
        } catch (err) {
            console.log('خطأ دخول الغرفة:', err);
        }
    });

    socket.on('takeMic', ({ roomId, micIndex }) => {
        const room = rooms[roomId];
        if (!room || room.mics[micIndex]) return;
        room.mics[micIndex] = socket.id;
        io.to(roomId).emit('roomUpdate', room);
        io.to(roomId).emit('userTookMic', { socketId: socket.id });
    });

    socket.on('leaveMic', ({ roomId }) => {
        const room = rooms[roomId];
        if (!room) return;
        room.mics = room.mics.map(m => m === socket.id? null : m);
        io.to(roomId).emit('roomUpdate', room);
    });

    socket.on('sendReaction', ({ roomId, micIndex, emoji }) => {
        io.to(roomId).emit('reaction', { micIndex, emoji });
    });

    socket.on('sendMessage', ({ roomId, message, image }) => {
        const room = rooms[roomId];
        if (!room ||!socket.userData) return;

        const msgData = {
            userId: socket.userData._id,
            username: socket.userData.username,
            avatar: socket.userData.avatar,
            message: message || null,
            image: image || null,
            timestamp: new Date()
        };

        room.messages.push(msgData);
        if (room.messages.length > 50) room.messages.shift();
        io.to(roomId).emit('newMessage', msgData);
    });

    socket.on('addMicSlot', ({ roomId }) => {
        const room = rooms[roomId];
        if (!room) return;
        const admin = room.users.find(u => u.socketId === socket.id);
        if (!admin || admin.level!== "10000 TOP") return;
        if (room.maxMics >= 20) return;
        room.maxMics++;
        room.mics.push(null);
        io.to(roomId).emit('roomUpdate', room);
    });

    socket.on('adminAction', async ({ action, targetUserId, roomId, micIndex }) => {
        const room = rooms[roomId];
        if (!room) return;
        const admin = room.users.find(u => u.socketId === socket.id);
        if (!admin || admin.level!== "10000 TOP") return;
        const targetUser = room.users.find(u => u.userId.toString() === targetUserId);
        if (!targetUser) return;

        switch(action) {
            case 'REMOVE_MIC':
                const micIdx = room.mics.indexOf(targetUser.socketId);
                if (micIdx!== -1) room.mics[micIdx] = null;
                break;
            case 'CLOSE_MIC':
                if (micIndex!== null && micIndex >= 0) room.mics[micIndex] = 'closed';
                break;
            case 'MUTE_MIC':
                io.to(targetUser.socketId).emit('muted');
                io.to(roomId).emit('userMuted', { userId: targetUserId });
                break;
            case 'FORCE_MIC':
                const emptyMic = room.mics.indexOf(null);
                if (emptyMic!== -1) {
                    room.mics[emptyMic] = targetUser.socketId;
                    io.to(targetUser.socketId).emit('forcedToMic', { micIndex: emptyMic });
                }
                break;
            case 'KICK':
                io.to(targetUser.socketId).emit('kicked');
                io.sockets.sockets.get(targetUser.socketId)?.leave(roomId);
                room.users = room.users.filter(u => u.socketId!== targetUser.socketId);
                room.mics = room.mics.map(m => m === targetUser.socketId? null : m);
                break;
            case 'MEMBERSHIP':
                await User.findByIdAndUpdate(targetUserId, { membership: true });
                io.to(targetUser.socketId).emit('membershipActivated');
                break;
        }
        io.to(roomId).emit('roomUpdate', room);
    });

    socket.on('searchUser', ({ roomId, query }) => {
        const room = rooms[roomId];
        if (!room) return;
        const results = room.users.filter(u =>
            u.userId.toString().includes(query) || u.username.includes(query)
        );
        socket.emit('searchResults', results);
    });

    socket.on('updateRoomSettings', ({ roomId, name, image, desc }) => {
        const room = rooms[roomId];
        if (!room) return;
        const admin = room.users.find(u => u.socketId === socket.id);
        if (!admin || admin.level!== "10000 TOP") return;
        if (name) room.name = name;
        if (image) room.image = image;
        if (desc) room.desc = desc;
        io.to(roomId).emit('roomSettingsUpdated', { name: room.name, image: room.image, desc: room.desc });
        io.to(roomId).emit('roomUpdate', room);
    });

    socket.on('voiceOffer', ({ to, offer }) => { io.to(to).emit('voiceOffer', { from: socket.id, offer }); });
    socket.on('voiceAnswer', ({ to, answer }) => { io.to(to).emit('voiceAnswer', { from: socket.id, answer }); });
    socket.on('iceCandidate', ({ to, candidate }) => { io.to(to).emit('iceCandidate', { from: socket.id, candidate }); });

    socket.on('disconnect', () => {
        const roomId = socket.currentRoom;
        if (roomId && rooms[roomId]) {
            rooms[roomId].users = rooms[roomId].users.filter(u => u.socketId!== socket.id);
            rooms[roomId].mics = rooms[roomId].mics.map(m => m === socket.id? null : m);
            io.to(roomId).emit('roomUpdate', rooms[roomId]);
        }
        console.log('🔌 قطع اتصال:', socket.id);
    });
});

// منع السيرفر من النوم - حل مشكلة الفصل
setInterval(() => {
    fetch(`https://game-server-ayham.onrender.com`).catch(() => {});
}, 14 * 60 * 1000);

// اي رابط غلط يرجع عالصفحة الرئيسية
app.get('*', (req, res) => { res.redirect('/'); });

server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
