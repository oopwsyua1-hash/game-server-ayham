const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const fs = require('fs');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

// منع الكاش للمتصفح عشان التحديثات توصل فوراً
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
});

app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

const JWT_SECRET = process.env.JWT_SECRET || 'al-sabe7-secret-2026';

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/sabe7')
.then(() => console.log('MongoDB متصل'))
.catch(err => console.log('MongoDB Error:', err));

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

const UserSchema = new mongoose.Schema({
  username: String, lastName: String, email: { type: String, unique: true }, password: String,
  country: String, birthDate: String, age: Number, gender: String, userId: { type: Number, unique: true },
  avatar: { type: String, default: '' }, cover: { type: String, default: '' },
  bio: { type: String, default: 'اهلا بالعالم' }, vip: { type: Number, default: 0 },
  followers: { type: Number, default: 0 }, following: { type: Number, default: 0 },
  friends: { type: Number, default: 0 }, wealthLevel: { type: Number, default: 0 },
  popularity: { type: Number, default: 0 }, coins: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const RoomSchema = new mongoose.Schema({
  roomId: { type: Number, unique: true },
  ownerId: Number,
  name: String,
  avatar: { type: String, default: '' },
  cover: { type: String, default: '' },
  admins: [Number],
  banned: [Number],
  micLayout: { type: String, default: '4*3' },
  mics: [{
    seat: Number, userId: Number, username: String, avatar: String,
    muted: { type: Boolean, default: false },
    locked: { type: Boolean, default: false },
    emoji: { type: String, default: '' }
  }],
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);
const Room = mongoose.model('Room', RoomSchema);

const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'غير مصرح' });
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ error: 'توكن غير صالح' });
  }
};

app.post('/api/register', async (req, res) => {
  try {
    const { username, lastName, email, password, country, birthDate, age, gender } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'الايميل مستخدم من قبل' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = Math.floor(100000 + Math.random() * 900000);
    const user = new User({ username, lastName, email, password: hashedPassword, country, birthDate, age, gender, userId });
    await user.save();
    const token = jwt.sign({ id: user._id }, JWT_SECRET);
    res.json({ token, user: { username, lastName, userId } });
  } catch (err) {
    res.status(500).json({ error: 'صار خطأ بالسيرفر' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'الايميل او كلمة السر غلط' });
    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) return res.status(400).json({ error: 'الايميل او كلمة السر غلط' });
    const token = jwt.sign({ id: user._id }, JWT_SECRET);
    res.json({ token, user: { username: user.username, lastName: user.lastName, userId: user.userId } });
  } catch (err) {
    res.status(500).json({ error: 'صار خطأ بالسيرفر' });
  }
});

app.get('/api/me', auth, async (req, res) => {
  const user = await User.findById(req.userId).select('-password');
  res.json(user);
});

app.post('/api/create-room', auth, async (req, res) => {
  const user = await User.findById(req.userId);
  const roomId = Math.floor(100000 + Math.random() * 900000);
  const [cols, rows] = '4*3'.split('*').map(Number);
  const totalMics = cols * rows;
  const mics = Array.from({ length: totalMics }, (_, i) => ({
    seat: i + 1, userId: null, username: null, avatar: null, muted: false, locked: false, emoji: ''
  }));
  const room = new Room({ roomId, ownerId: user.userId, name: `غرفة ${user.username}`, admins: [user.userId], mics });
  await room.save();
  res.json({ roomId });
});

app.post('/api/room-settings', auth, async (req, res) => {
  const { roomId, micLayout } = req.body;
  const room = await Room.findOne({ roomId: Number(roomId) });
  const user = await User.findById(req.userId);
  if (!room) return res.status(404).json({ error: 'الغرفة مو موجودة' });
  if (room.ownerId!== user.userId) return res.status(403).json({ error: 'غير مصرح' });

  room.micLayout = micLayout;
  const [cols, rows] = micLayout.split('*').map(Number);
  const totalMics = cols * rows;
  const newMics = [];
  for (let i = 1; i <= totalMics; i++) {
    const oldMic = room.mics.find(m => m.seat === i);
    newMics.push(oldMic || { seat: i, userId: null, username: null, avatar: null, muted: false, locked: false, emoji: '' });
  }
  room.mics = newMics;
  await room.save();
  io.to(`room-${roomId}`).emit('room-updated', room);
  res.json({ success: true });
});

app.get('/api/room/:id', async (req, res) => {
  const room = await Room.findOne({ roomId: Number(req.params.id) });
  if (!room) return res.status(404).json({ error: 'الغرفة مو موجودة' });
  res.json(room);
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/me', (req, res) => res.sendFile(path.join(__dirname, 'public', 'me.html')));
app.get('/room/:id', (req, res) => res.sendFile(path.join(__dirname, 'public', 'room.html')));

io.on('connection', (socket) => {
  socket.on('join-room', async ({ roomId, userId, token }) => {
    try {
      jwt.verify(token, JWT_SECRET);
      socket.join(`room-${roomId}`);
      socket.userId = userId;
      socket.roomId = Number(roomId);
      const onlineCount = io.sockets.adapter.rooms.get(`room-${roomId}`)?.size || 0;
      io.to(`room-${roomId}`).emit('online-count', onlineCount);
    } catch (e) {}
  });

  socket.on('sit-mic', async ({ roomId, seat, userId }) => {
    const room = await Room.findOne({ roomId: Number(roomId) });
    const user = await User.findOne({ userId });
    if (!room ||!user) return;
    const mic = room.mics.find(m => m.seat === seat);
    if (mic &&!mic.userId &&!mic.locked) {
      mic.userId = user.userId;
      mic.username = user.username;
      mic.avatar = user.avatar;
      await room.save();
      io.to(`room-${roomId}`).emit('mic-updated', room.mics);
    }
  });

  socket.on('leave-mic', async ({ roomId, userId }) => {
    const room = await Room.findOne({ roomId: Number(roomId) });
    if (!room) return;
    const mic = room.mics.find(m => m.userId === userId);
    if (mic) {
      mic.userId = null; mic.username = null; mic.avatar = null; mic.emoji = ''; mic.muted = false;
      await room.save();
      io.to(`room-${roomId}`).emit('mic-updated', room.mics);
    }
  });

  socket.on('send-emoji', async ({ roomId, userId, emoji }) => {
    const room = await Room.findOne({ roomId: Number(roomId) });
    if (!room) return;
    const mic = room.mics.find(m => m.userId === userId);
    if (mic) {
      mic.emoji = emoji;
      await room.save();
      io.to(`room-${roomId}`).emit('mic-updated', room.mics);
      setTimeout(async () => {
        const r = await Room.findOne({ roomId: Number(roomId) });
        const m = r.mics.find(x => x.userId === userId);
        if (m) {
          m.emoji = '';
          await r.save();
          io.to(`room-${roomId}`).emit('mic-updated', r.mics);
        }
      }, 3000);
    }
  });

  socket.on('kick-user', async ({ roomId, ownerId, targetUserId }) => {
    const room = await Room.findOne({ roomId: Number(roomId) });
    if (!room) return;
    if (room.ownerId === ownerId || room.admins.includes(ownerId)) {
      const mic = room.mics.find(m => m.userId === targetUserId);
      if (mic) {
        mic.userId = null; mic.username = null; mic.avatar = null; mic.emoji = ''; mic.muted = false;
        await room.save();
        io.to(`room-${roomId}`).emit('mic-updated', room.mics);
        io.to(`room-${roomId}`).emit('user-kicked', { userId: targetUserId });
      }
    }
  });

  socket.on('lock-mic', async ({ roomId, seat, userId }) => {
    const room = await Room.findOne({ roomId: Number(roomId) });
    if (!room) return;
    if (room.ownerId === userId || room.admins.includes(userId)) {
      const mic = room.mics.find(m => m.seat === seat);
      if (mic &&!mic.userId) {
        mic.locked =!mic.locked;
        await room.save();
        io.to(`room-${roomId}`).emit('mic-updated', room.mics);
      }
    }
  });

  socket.on('mute-user', async ({ roomId, ownerId, targetUserId }) => {
    const room = await Room.findOne({ roomId: Number(roomId) });
    if (!room) return;
    if (room.ownerId === ownerId || room.admins.includes(ownerId)) {
      const mic = room.mics.find(m => m.userId === targetUserId);
      if (mic) {
        mic.muted =!mic.muted;
        await room.save();
        io.to(`room-${roomId}`).emit('mic-updated', room.mics);
      }
    }
  });

  socket.on('make-admin', async ({ roomId, ownerId, targetUserId }) => {
    const room = await Room.findOne({ roomId: Number(roomId) });
    if (!room) return;
    if (room.ownerId === ownerId &&!room.admins.includes(targetUserId)) {
      room.admins.push(targetUserId);
      await room.save();
      io.to(`room-${roomId}`).emit('admin-added', { userId: targetUserId });
    }
  });

  socket.on('chat-message', async ({ roomId, userId, username, message }) => {
    io.to(`room-${roomId}`).emit('chat-message', { userId, username, message });
  });

  socket.on('disconnect', () => {
    if (socket.roomId) {
      const onlineCount = io.sockets.adapter.rooms.get(`room-${socket.roomId}`)?.size || 0;
      io.to(`room-${socket.roomId}`).emit('online-count', onlineCount);
    }
  });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`السبع شغال على ${PORT}`));
