const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// ===== بيانات المالك 10000 TOP =====
const OWNER_EMAIL = "m1234ahmad@gmail.com";
const OWNER_DATA = {
    passport: "Nmr1234567890",
    username: "صاحب التطبيق ادارة عامة",
    level: "10000 TOP",
    wealthLevel: 10000,
    vip: 10,
    verified: true,
    entryVideo: "https://files.catbox.moe/ue0s54.mp4",
    followers: 999999,
    following: 0,
    friends: 999999,
    country: "سوريا"
};

// ===== اتصال قاعدة البيانات =====
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/alsabe7');

// ===== سكيما المستخدم =====
const userSchema = new mongoose.Schema({
    username: String,
    lastName: String,
    email: { type: String, unique: true },
    password: String,
    country: String,
    birthDate: String,
    age: Number,
    gender: String,
    level: { type: String, default: "LV1" },
    vip: { type: Number, default: 0 },
    wealthLevel: { type: Number, default: 0 },
    followers: { type: Number, default: 0 },
    following: { type: Number, default: 0 },
    friends: { type: Number, default: 0 },
    roomId: { type: String, default: null },
    verified: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// ===== الغرف - 20 مايك =====
const rooms = {
    '10000': {
        users: [],
        mics: Array(20).fill(null),
        admins: [],
        name: "غرفة السبع الحلبي"
    }
};

// ===== Middleware التحقق من التوكن =====
const auth = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'مافي توكن' });
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sabe7_secret');
        req.user = await User.findById(decoded.id);
        if (!req.user) return res.status(401).json({ error: 'المستخدم مو موجود' });
        next();
    } catch (err) {
        res.status(401).json({ error: 'توكن غلط' });
    }
};

// ===== API: تسجيل حساب جديد =====
app.post('/api/register', async (req, res) => {
    try {
        const { username, lastName, email, password, country, birthDate, age, gender } = req.body;

        if (!username ||!email ||!password) {
            return res.json({ error: 'عبي كل الحقول المطلوبة' });
        }

        const exists = await User.findOne({ email });
        if (exists) return res.json({ error: 'الايميل مستخدم من قبل' });

        const hashed = await bcrypt.hash(password, 10);
        let userData = { username, lastName, email, password: hashed, country, birthDate, age, gender };

        // اذا ايميل المالك، اعطيه صلاحيات TOP
        if (email === OWNER_EMAIL) {
            userData = {...userData,...OWNER_DATA, password: hashed };
        }

        const user = await User.create(userData);
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'sabe7_secret');
        res.json({ token, user });
    } catch (err) {
        console.log(err);
        res.json({ error: 'خطأ بالسيرفر' });
    }
});

// ===== API: تسجيل دخول =====
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.json({ error: 'الايميل غلط' });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.json({ error: 'كلمة السر غلط' });

        // اذا ايميل المالك، حدث بياناته
        if (email === OWNER_EMAIL) {
            Object.assign(user, OWNER_DATA);
            await user.save();
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'sabe7_secret');
        res.json({ token, user });
    } catch (err) {
        console.log(err);
        res.json({ error: 'خطأ بالسيرفر' });
    }
});

// ===== API: دخول المالك التلقائي - جديد =====
app.post('/api/auto-login', async (req, res) => {
    try {
        const email = OWNER_EMAIL;
        let user = await User.findOne({ email });

        if (!user) {
            const hashed = await bcrypt.hash('123456', 10);
            user = await User.create({
               ...OWNER_DATA,
                email: email,
                password: hashed,
                lastName: "الحلبي",
                country: "سوريا",
                age: 25,
                gender: "ذكر",
                birthDate: "2000-01-01"
            });
        } else {
            Object.assign(user, OWNER_DATA);
            await user.save();
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'sabe7_secret');
        res.json({ token, user });
    } catch (err) {
        console.log(err);
        res.json({ error: 'خطأ بالسيرفر' });
    }
});

// ===== API: جلب بيانات المستخدم =====
app.get('/api/me', auth, (req, res) => res.json(req.user));

// ===== API: انشاء غرفة =====
app.post('/api/create-room', auth, async (req, res) => {
    try {
        const user = req.user;
        if (user.roomId) return res.json({ error: 'عندك غرفة من قبل' });
        user.roomId = '10000';
        await user.save();
        res.json({ success: true, roomId: '10000' });
    } catch (err) {
        res.json({ error: 'خطأ' });
    }
});

// ===== Socket.IO - الغرف الصوتية =====
io.on('connection', (socket) => {
    console.log('مستخدم جديد متصل:', socket.id);

    // دخول الغرفة
    socket.on('joinRoom', async ({ roomId, token }) => {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sabe7_secret');
            const user = await User.findById(decoded.id);
            if (!user) return;

            socket.join(roomId);
            socket.userData = user;
            socket.currentRoom = roomId;

            // اذا المالك دخل، شغل الدخولية للكل
            if (user.email === OWNER_EMAIL) {
                io.to(roomId).emit('ownerEntry', {
                    video: OWNER_DATA.entryVideo,
                    duration: 13,
                    text: "انتبااااه وصل 10000 TOP 👑"
                });
            }

            if (!rooms[roomId]) {
                rooms[roomId] = { users: [], mics: Array(20).fill(null), admins: [] };
            }

            // احذف اليوزر اذا كان موجود من قبل
            rooms[roomId].users = rooms[roomId].users.filter(u => u.userId.toString()!== user._id.toString());

            rooms[roomId].users.push({
                socketId: socket.id,
                userId: user._id,
                username: user.username + ' ' + (user.lastName || ''),
                level: user.level,
                vip: user.vip
            });

            io.to(roomId).emit('roomUpdate', rooms[roomId]);
        } catch (err) {
            console.log('خطأ دخول الغرفة:', err);
        }
    });

    // طلوع على المايك
    socket.on('takeMic', ({ roomId, micIndex }) => {
        if (rooms[roomId] && rooms[roomId].mics[micIndex] === null) {
            rooms[roomId].mics[micIndex] = socket.id;
            io.to(roomId).emit('roomUpdate', rooms[roomId]);
        }
    });

    // نزول من المايك
    socket.on('leaveMic', ({ roomId }) => {
        if (rooms[roomId]) {
            rooms[roomId].mics = rooms[roomId].mics.map(m => m === socket.id? null : m);
            io.to(roomId).emit('roomUpdate', rooms[roomId]);
        }
    });

    // صلاحيات الادمن - بس للمالك
    socket.on('adminAction', async ({ action, targetUserId, roomId }) => {
        const isOwner = socket.userData?.email === OWNER_EMAIL;
        if (!isOwner) return;

        if (!rooms[roomId]) return;

        if (action === 'KICK') {
            const target = rooms[roomId].users.find(u => u.userId.toString() === targetUserId.toString());
            if (target) {
                io.sockets.sockets.get(target.socketId)?.disconnect();
            }
        }

        if (action === 'CLOSE_MIC') {
            const idx = rooms[roomId].mics.findIndex(m => {
                if (!m || m === 'closed') return false;
                const userOnMic = rooms[roomId].users.find(u => u.socketId === m);
                return userOnMic && userOnMic.userId.toString() === targetUserId.toString();
            });
            if (idx!== -1) {
                rooms[roomId].mics[idx] = 'closed';
                io.to(roomId).emit('roomUpdate', rooms[roomId]);
            }
        }

        if (action === 'OPEN_MIC') {
            const idx = rooms[roomId].mics.findIndex(m => m === 'closed');
            if (idx!== -1) {
                rooms[roomId].mics[idx] = null;
                io.to(roomId).emit('roomUpdate', rooms[roomId]);
            }
        }
    });

    // قطع الاتصال
    socket.on('disconnect', () => {
        console.log('مستخدم قطع:', socket.id);
        for (let roomId in rooms) {
            rooms[roomId].users = rooms[roomId].users.filter(u => u.socketId!== socket.id);
            rooms[roomId].mics = rooms[roomId].mics.map(m => m === socket.id? null : m);
            io.to(roomId).emit('roomUpdate', rooms[roomId]);
        }
    });
});

// ===== Routes الصفحات =====
app.get('/me', (req, res) => res.sendFile(path.join(__dirname, 'public', 'me.html')));
app.get('/room', (req, res) => res.sendFile(path.join(__dirname, 'public', 'room.html')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// ===== تشغيل السيرفر =====
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🔥 al-sabe7-alhalabi شغال على ${PORT}`));
