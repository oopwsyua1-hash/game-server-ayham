const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const JWT_SECRET = 'al-sabe-al-halabi-2026-super-secret';
mongoose.connect(process.env.MONGO_URL || 'mongodb+srv://user:pass@cluster.mongodb.net/sabe');

// Models
const User = mongoose.model('User', new mongoose.Schema({
    username: { type: String, unique: true },
    email: { type: String, unique: true },
    password: String,
    avatar: { type: String, default: 'https://i.ibb.co/7jXqZtZ/lion.jpg' },
    level: { type: Number, default: 1 }
}));

// Auth
function auth(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'غير مسجل' });
    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch (e) { res.status(401).json({ error: 'توكن خربان' }); }
}

// API
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;
    const hash = await bcrypt.hash(password, 10);
    try {
        const user = await User.create({ username, email, password: hash });
        res.json({ msg: 'تم' });
    } catch (e) { res.status(400).json({ error: 'اليوزر او الايميل موجود' }); }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user ||!await bcrypt.compare(password, user.password))
        return res.status(400).json({ error: 'خطأ بالدخول' });

    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET);
    res.json({ token, user: { id: user._id, username: user.username, avatar: user.avatar } });
});

app.get('/api/me', auth, async (req, res) => {
    const user = await User.findById(req.user.id);
    res.json({ id: user._id, username: user.username, avatar: user.avatar, level: user.level });
});

// Rooms
let rooms = {};

app.get('/api/rooms', (req, res) => {
    const list = Object.values(rooms).map(r => ({
        id: r.id, name: r.name, category: r.category, host: r.host,
        count: r.users.length, cover: r.cover
    }));
    res.json(list);
});

app.post('/api/rooms', auth, (req, res) => {
    const { name, category, cover } = req.body;
    const roomId = Date.now().toString();
    rooms[roomId] = {
        id: roomId, name, category: category || 'chat',
        cover: cover || 'https://i.ibb.co/3k6vQzG/party.jpg',
        host: req.user.username, users: [], created: new Date()
    };
    res.json({ roomId });
});

// Socket للصوت
io.on('connection', (socket) => {
    socket.on('join-room', (roomId, user) => {
        if (!rooms[roomId]) return;
        socket.join(roomId);
        rooms[roomId].users.push({...user, socketId: socket.id });
        socket.to(roomId).emit('user-joined', user.id);
        io.to(roomId).emit('room-users', rooms[roomId].users);
    });

    socket.on('offer', (roomId, userId, offer) => {
        const target = rooms[roomId]?.users.find(u => u.id === userId);
        if (target) socket.to(target.socketId).emit('offer', socket.id, offer);
    });

    socket.on('answer', (roomId, userId, answer) => {
        const target = rooms[roomId]?.users.find(u => u.id === userId);
        if (target) socket.to(target.socketId).emit('answer', socket.id, answer);
    });

    socket.on('ice-candidate', (roomId, userId, candidate) => {
        const target = rooms[roomId]?.users.find(u => u.id === userId);
        if (target) socket.to(target.socketId).emit('ice-candidate', socket.id, candidate);
    });

    socket.on('disconnect', () => {
        for (let roomId in rooms) {
            const idx = rooms[roomId].users.findIndex(u => u.socketId === socket.id);
            if (idx > -1) {
                rooms[roomId].users.splice(idx, 1);
                io.to(roomId).emit('room-users', rooms[roomId].users);
                if (rooms[roomId].users.length === 0) delete rooms[roomId];
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('السبع الحلبي شغال على', PORT));
