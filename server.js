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

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/room', (req, res) => res.sendFile(path.join(__dirname, 'public', 'room.html')));

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
                    mics: Array(4).fill(null),
                    admins: [],
                    maxMics: 4,
                    name: "غرفة السبع الحلبي",
                    desc: "مرحباً بكم في غرفة دردشة!",
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

            io.to(roomId).emit('userJoined', {
                username: userData.username,
                avatar: userData.avatar
            });

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
                if (micIndex!== null && micIndex >= 0) {
                    room.mics[micIndex] = 'closed';
                }
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
            u.userId.toString().includes(query) ||
            u.username.includes(query)
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

    socket.on('getReports', ({ roomId }) => {
        socket.emit('reportsList', []);
    });

    socket.on('voiceOffer', ({ to, offer }) => {
        io.to(to).emit('voiceOffer', { from: socket.id, offer });
    });

    socket.on('voiceAnswer', ({ to, answer }) => {
        io.to(to).emit('voiceAnswer', { from: socket.id, answer });
    });

    socket.on('iceCandidate', ({ to, candidate }) => {
        io.to(to).emit('iceCandidate', { from: socket.id, candidate });
    });

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

server.listen(PORT, () => {
    console.log(`🚀 السيرفر شغال على بورت ${PORT}`);
});
