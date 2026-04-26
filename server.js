const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" },
    pingTimeout: 60000,
    pingInterval: 25000
});

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const OWNER_EMAIL = process.env.OWNER_EMAIL || 'ايميلك@gmail.com';
const OWNER_ENTRY_VIDEO = 'https://files.catbox.moe/v0ec0k.mp4';
const JWT_SECRET = process.env.JWT_SECRET || 'sabaa-gold-secret-2024';

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/sabaa');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    bio: { type: String, maxlength: 60, default: '' },
    profilePic: { type: String, default: '' },
    coverPic: { type: String, default: '' },
    points: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    games: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    vip: { type: Number, default: 0 },
    banned: { type: Boolean, default: false },
    banReason: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
    lastSeen: { type: Date, default: Date.now }
});

const roomSchema = new mongoose.Schema({
    roomId: { type: String, unique: true },
    name: { type: String, default: 'وكالة السبع السوري' },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    agencyPic: { type: String, default: '' },
    agencyCover: { type: String, default: '' },
    maxMics: { type: Number, default: 20 },
    bannedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdAt: { type: Date, default: Date.now }
});

const reportSchema = new mongoose.Schema({
    reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reportedId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: String,
    roomId: String,
    createdAt: { type: Date, default: Date.now },
    status: { type: String, default: 'pending' }
});

const User = mongoose.model('User', userSchema);
const Room = mongoose.model('Room', roomSchema);
const Report = mongoose.model('Report', reportSchema);

function authMiddleware(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'مافي توكن' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        res.status(401).json({ message: 'توكن غلط' });
    }
}

async function isOwner(userId) {
    const user = await User.findById(userId);
    return user && user.email === OWNER_EMAIL;
}

app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) return res.status(400).json({ message: 'الايميل او الاسم مستخدم' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const isOwnerAccount = email === OWNER_EMAIL;

        const user = new User({
            username,
            email,
            password: hashedPassword,
            level: isOwnerAccount? 10000 : 1,
            vip: isOwnerAccount? 10 : 0
        });
        await user.save();

        const token = jwt.sign({ userId: user._id }, JWT_SECRET);
        res.json({ token, user: { username: user.username, email: user.email, level: user.level, vip: user.vip } });
    } catch (error) {
        res.status(500).json({ message: 'خطأ بالسيرفر' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'الحساب مو موجود' });
        if (user.banned) return res.status(403).json({ message: 'حسابك مبند: ' + user.banReason });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ message: 'كلمة السر غلط' });

        user.lastSeen = new Date();
        await user.save();

        const token = jwt.sign({ userId: user._id }, JWT_SECRET);
        res.json({ token, user: { username: user.username, email: user.email, level: user.level, vip: user.vip } });
    } catch (error) {
        res.status(500).json({ message: 'خطأ بالسيرفر' });
    }
});

app.get('/api/profile', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ message: 'اليوزر مو موجود' });
        user.lastSeen = new Date();
        await user.save();
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'خطأ بالسيرفر' });
    }
});

app.post('/api/profile/update', authMiddleware, async (req, res) => {
    try {
        const { bio, profilePic, coverPic } = req.body;
        const user = await User.findById(req.userId);
        if (bio!== undefined) user.bio = bio.substring(0, 60);
        if (profilePic!== undefined) user.profilePic = profilePic;
        if (coverPic!== undefined) user.coverPic = coverPic;
        await user.save();
        res.json({ message: 'تم التحديث', user });
    } catch (error) {
        res.status(500).json({ message: 'خطأ بالسيرفر' });
    }
});

app.post('/api/admin/ban', authMiddleware, async (req, res) => {
    try {
        if (!await isOwner(req.userId)) return res.status(403).json({ message: 'ماعندك صلاحية' });
        const { targetUserId, reason } = req.body;
        await User.findByIdAndUpdate(targetUserId, { banned: true, banReason: reason });
        io.emit('userBanned', { userId: targetUserId });
        res.json({ message: 'تم تبنيد الحساب' });
    } catch (error) {
        res.status(500).json({ message: 'خطأ بالسيرفر' });
    }
});

app.get('/api/admin/reports', authMiddleware, async (req, res) => {
    try {
        if (!await isOwner(req.userId)) return res.status(403).json({ message: 'ماعندك صلاحية' });
        const reports = await Report.find().populate('reporterId reportedId').sort({ createdAt: -1 });
        res.json(reports);
    } catch (error) {
        res.status(500).json({ message: 'خطأ بالسيرفر' });
    }
});

// خلي /me يفتح me.html عشان ما يطلع Cannot GET /me
app.get('/me', (req, res) => {
    res.sendFile(__dirname + '/public/me.html');
});

app.get('/room', (req, res) => {
    res.sendFile(__dirname + '/public/room.html');
});

const rooms = {};

io.on('connection', (socket) => {
    socket.on('joinRoom', async ({ roomId, token }) => {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            const user = await User.findById(decoded.userId);
            if (!user || user.banned) return socket.emit('kicked');

            socket.join(roomId);
            socket.userId = user._id.toString();
            socket.roomId = roomId;

            if (!rooms[roomId]) {
                let room = await Room.findOne({ roomId });
                if (!room) {
                    room = new Room({ roomId, ownerId: user._id });
                    await room.save();
                }
                rooms[roomId] = {
                    users: [],
                    mics: Array(20).fill(null),
                    maxMics: 20,
                    dbId: room._id
                };
            }

            const userData = {
                userId: user._id,
                username: user.username,
                level: user.level,
                vip: user.vip,
                socketId: socket.id,
                bio: user.bio,
                profilePic: user.profilePic,
                isOwner: user.email === OWNER_EMAIL
            };

            rooms[roomId].users.push(userData);

            if (user.email === OWNER_EMAIL) {
                io.to(roomId).emit('ownerEntry', {
                    video: OWNER_ENTRY_VIDEO,
                    duration: 13,
                    text: '👑 دخول حساب الادارة الرسمي 👑',
                    username: user.username
                });

                io.to(roomId).emit('newMessage', {
                    username: 'النظام',
                    message: `👑 ${user.username} - دخول حساب الادارة الرسمي 👑`
                });
            }

            io.to(roomId).emit('roomUpdate', rooms[roomId]);
        } catch (error) {
            console.log('Join room error:', error);
        }
    });

    socket.on('takeMic', async ({ roomId, micIndex }) => {
        const room = rooms[roomId];
        const user = room.users.find(u => u.socketId === socket.id);
        if (!room ||!user) return;
        if (user.email!== OWNER_EMAIL) return socket.emit('error', { message: 'لازم اذن من صاحب الوكالة' });
        room.mics[micIndex] = socket.id;
        io.to(roomId).emit('roomUpdate', room);
    });

    socket.on('sendMessage', ({ roomId, message }) => {
        const room = rooms[roomId];
        const user = room.users.find(u => u.socketId === socket.id);
        if (!user) return;
        io.to(roomId).emit('newMessage', { username: user.username, message, userId: user.userId });
    });

    socket.on('sendReaction', ({ roomId, micIndex, emoji }) => {
        io.to(roomId).emit('reaction', { micIndex, emoji });
    });

    socket.on('disconnect', () => {
        for (const roomId in rooms) {
            const room = rooms[roomId];
            const userIndex = room.users.findIndex(u => u.socketId === socket.id);
            if (userIndex!== -1) {
                const micIndex = room.mics.indexOf(socket.id);
                if (micIndex!== -1) room.mics[micIndex] = null;
                room.users.splice(userIndex, 1);
                io.to(roomId).emit('roomUpdate', room);
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
