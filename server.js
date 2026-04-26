const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'sabe7_secret_123456789';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/alsabe7';

// منع الكاش
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
});
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// DB
mongoose.connect(MONGO_URI).then(() => console.log('✅ MongoDB Connected')).catch(e => console.log('❌ MongoDB Error:', e));

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  level: { type: String, default: 'مستخدم' },
  vip: { type: Number, default: 0 },
  coins: { type: Number, default: 1000 }
});
const User = mongoose.model('User', UserSchema);

// Auth
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: 'الايميل موجود' });
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, password: hashed });
    const token = jwt.sign({ userId: user._id }, JWT_SECRET);
    res.json({ token, user: { _id: user._id, username, email, level: user.level, vip: user.vip, coins: user.coins } });
  } catch (e) { res.status(500).json({ error: 'خطأ بالسيرفر' }); }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'المستخدم غير موجود' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: 'كلمة السر غلط' });
    const token = jwt.sign({ userId: user._id }, JWT_SECRET);
    res.json({ token, user: { _id: user._id, username: user.username, email, level: user.level, vip: user.vip, coins: user.coins } });
  } catch (e) { res.status(500).json({ error: 'خطأ بالسيرفر' }); }
});

app.post('/api/owner-login', async (req, res) => {
  try {
    let user = await User.findOne({ email: 'm1234ahmad@gmail.com' });
    if (!user) {
      const hashed = await bcrypt.hash('123456', 10);
      user = await User.create({ username: 'السبع الحلبي', email: 'm1234ahmad@gmail.com', password: hashed, level: '10000 TOP', vip: 10000, coins: 999999 });
    }
    const token = jwt.sign({ userId: user._id }, JWT_SECRET);
    res.json({ token, user: { _id: user._id, username: user.username, email: user.email, level: user.level, vip: user.vip, coins: user.coins } });
  } catch (e) { res.status(500).json({ error: 'خطأ بالسيرفر' }); }
});

const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'مافي توكن' });
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = await User.findById(decoded.userId);
    next();
  } catch (e) { res.status(401).json({ error: 'توكن غلط' }); }
};

app.get('/api/me', auth, (req, res) => {
  res.json({ _id: req.user._id, username: req.user.username, email: req.user.email, level: req.user.level, vip: req.user.vip, coins: req.user.coins });
});

// Socket.io
const rooms = new Map();

io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);

  socket.on('joinRoom', async ({ roomId, token }) => {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.userId);
      if (!user) return;

      if (!rooms.has(roomId)) {
        rooms.set(roomId, { id: roomId, users: [], mics: Array(20).fill(null), owner: user.email === 'm1234ahmad@gmail.com'? socket.id : null });
      }
      const room = rooms.get(roomId);

      if (user.email === 'm1234ahmad@gmail.com') {
        socket.emit('ownerEntry', {
          video: 'https://cdn.pixabay.com/video/2022/07/24/125314-733046618_large.mp4',
          text: '👑 دخل المالك - السبع الحلبي',
          duration: 5
        });
      }

      room.users.push({ socketId: socket.id, userId: user._id.toString(), username: user.username, level: user.level, vip: user.vip });
      socket.join(roomId);
      io.to(roomId).emit('roomUpdate', room);
    } catch (e) { console.log('Join error:', e); }
  });

  socket.on('takeMic', ({ roomId, micIndex }) => {
    const room = rooms.get(roomId);
    if (!room || room.mics[micIndex]) return;
    room.mics[micIndex] = socket.id;
    io.to(roomId).emit('roomUpdate', room);
  });

  socket.on('leaveMic', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    const idx = room.mics.indexOf(socket.id);
    if (idx >= 0) room.mics[idx] = null;
    io.to(roomId).emit('roomUpdate', room);
  });

  socket.on('adminAction', async ({ action, targetUserId, roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    const admin = room.users.find(u => u.socketId === socket.id);
    const adminUser = await User.findById(admin?.userId);
    if (adminUser?.email!== 'm1234ahmad@gmail.com') return;

    const target = room.users.find(u => u.userId === targetUserId);
    if (!target) return;

    if (action === 'KICK') {
      io.to(target.socketId).emit('kicked');
      room.users = room.users.filter(u => u.userId!== targetUserId);
      const micIdx = room.mics.indexOf(target.socketId);
      if (micIdx >= 0) room.mics[micIdx] = null;
    } else if (action === 'CLOSE_MIC') {
      const micIdx = room.mics.indexOf(target.socketId);
      if (micIdx >= 0) room.mics[micIdx] = 'closed';
    }
    io.to(roomId).emit('roomUpdate', room);
  });

  socket.on('sendReaction', ({ roomId, micIndex, emoji }) => {
    io.to(roomId).emit('reaction', { micIndex, emoji });
  });

  socket.on('disconnect', () => {
    rooms.forEach((room, roomId) => {
      const userIdx = room.users.findIndex(u => u.socketId === socket.id);
      if (userIdx >= 0) {
        room.users.splice(userIdx, 1);
        const micIdx = room.mics.indexOf(socket.id);
        if (micIdx >= 0) room.mics[micIdx] = null;
        io.to(roomId).emit('roomUpdate', room);
      }
    });
  });
});

server.listen(PORT, () => console.log(`🔥 al-sabe7-alhalabi شغال على ${PORT}`));
