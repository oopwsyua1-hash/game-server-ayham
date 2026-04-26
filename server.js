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
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'ayham-secret-key-2024';

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
   .then(() => console.log('✅ MongoDB Connected - السيرفر شغال'))
   .catch(err => {
        console.log('❌ MongoDB Error:', err.message);
        process.exit(1);
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

// ===== كود الغرف الجديد =====
let rooms = {};
const DEFAULT_ROOM = '10000';
if (!rooms[DEFAULT_ROOM]) {
    rooms[DEFAULT_ROOM] = {
        id: DEFAULT_ROOM,
        name: 'غرفة ايهم الرئيسية',
        ownerId: 'admin_ayham',
        admins: ['admin_ayham'],
        welcomeMessage: 'اهلا وسهلا فيك بغرفة ايهم 👑',
        agencyName: 'وكالة النجوم',
        onlineUsers: [],
        mics: Array(12).fill(null).map((_, i) => ({
            slot: i + 1,
            userId: null,
            username: null,
            avatar: null,
            locked: false,
            isMuted: false
        }))
    };
    console.log('✅ تم انشاء الغرفة الافتراضية 10000');
}
// ===== نهاية كود الغرف =====

// Register API
app.post('/api/register', async (req, res) => {
    try {
        const { username, lastName, email, password, country, birthDate, age, gender } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'الايميل مستخدم من قبل' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, lastName, email, password: hashedPassword, country, birthDate, age, gender });
        await newUser.save();
        const token = jwt.sign({ userId: newUser._id }, JWT_SECRET);
        res.json({ token, user: { username, lastName, email, country, age, gender } });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'خطأ بالسيرفر' });
    }
});

// Login API
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
        res.json({
            token,
            user: { username: user.username, lastName: user.lastName, email: user.email, country: user.country, age: user.age, gender: user.gender },
            redirectUrl: '/room/10000' // ضفت هاد السطر عشان يحول عالغرفة بعد تسجيل الدخول
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'خطأ بالسيرفر' });
    }
});

// Profile API
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
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/me', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'me.html'));
});

// صفحة الغرفة - جديد
app.get('/room/:roomId', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'room.html'));
});

// ===== Socket.io للغرفة =====
io.on('connection', (socket) => {
    console.log('مستخدم جديد اتصل:', socket.id);

    socket.on('join-room', (data) => {
        const { roomId, userId, username } = data;
        if (!rooms[roomId]) {
            socket.emit('error', { message: 'الغرفة غير موجودة' });
            return;
        }

        socket.join(roomId);
        socket.roomId = roomId;
        socket.userId = userId || socket.id;
        socket.username = username || `ضيف_${socket.id.substring(0, 5)}`;

        const existingUser = rooms[roomId].onlineUsers.find(u => u.userId === socket.userId);
        if (!existingUser) {
            rooms[roomId].onlineUsers.push({
                userId: socket.userId,
                username: socket.username,
                socketId: socket.id
            });
        }

        socket.emit('room-data', {
            room: rooms[roomId],
            currentUser: { userId: socket.userId, username: socket.username }
        });

        socket.to(roomId).emit('user-joined', { userId: socket.userId, username: socket.username });
        io.to(roomId).emit('online-users-updated', rooms[roomId].onlineUsers);
    });

    socket.on('chat-message', (data) => {
        const { roomId, message } = data;
        if (!rooms[roomId]) return;
        io.to(roomId).emit('chat-message', {
            userId: socket.userId,
            username: socket.username,
            message: message,
            timestamp: Date.now()
        });
    });

    socket.on('take-mic', (data) => {
        const { roomId, slot } = data;
        if (!rooms[roomId]) return;
        if (rooms[roomId].mics[slot - 1].userId === null &&!rooms[roomId].mics[slot - 1].locked) {
            rooms[roomId].mics = rooms[roomId].mics.map(mic => {
                if (mic.userId === socket.userId) return {...mic, userId: null, username: null, avatar: null };
                return mic;
            });
            rooms[roomId].mics[slot - 1] = {...rooms[roomId].mics[slot - 1], userId: socket.userId, username: socket.username};
            io.to(roomId).emit('mics-updated', rooms[roomId].mics);
        }
    });

    socket.on('leave-mic', (data) => {
        const { roomId } = data;
        if (!rooms[roomId]) return;
        rooms[roomId].mics = rooms[roomId].mics.map(mic => {
            if (mic.userId === socket.userId) return {...mic, userId: null, username: null, avatar: null };
            return mic;
        });
        io.to(roomId).emit('mics-updated', rooms[roomId].mics);
    });

    socket.on('disconnect', () => {
        const roomId = socket.roomId;
        if (roomId && rooms[roomId]) {
            rooms[roomId].onlineUsers = rooms[roomId].onlineUsers.filter(u => u.userId!== socket.userId);
            rooms[roomId].mics = rooms[roomId].mics.map(mic => {
                if (mic.userId === socket.userId) return {...mic, userId: null, username: null, avatar: null };
                return mic;
            });
            io.to(roomId).emit('user-left', { userId: socket.userId });
            io.to(roomId).emit('online-users-updated', rooms[roomId].onlineUsers);
            io.to(roomId).emit('mics-updated', rooms[roomId].mics);
        }
    });
});
// ===== نهاية Socket.io =====

server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
