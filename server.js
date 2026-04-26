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
const io = new Server(server, { cors: { origin: "*" } });

const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'ayham-secret-key-2024';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection - يقبل MONGO_URI او MONGODB_URI
const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI;
if (!mongoURI) {
  console.log('❌ MONGO_URI او MONGODB_URI مو موجود بالـ Environment Variables');
  process.exit(1);
}
mongoose.connect(mongoURI)
.then(() => console.log('✅ MongoDB Connected - السيرفر شغال'))
.catch(err => {
    console.log('❌ MongoDB Error:', err.message);
    process.exit(1);
  });

// User Schema - مع الايديات الفخمة والدخولية الذهبية
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  country: { type: String, required: true },
  birthDate: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, required: true },
  // الاضافات الجديدة للوكالة
  vipId: { type: Number, unique: true, default: () => Math.floor(100 + Math.random() * 900) },
  displayName: { type: String, default: function() { return this.username + ' ' + this.lastName; } },
  bio: { type: String, default: 'مرحبا بالكل في وكالتي الخاصة' },
  avatar: { type: String, default: '/uploads/default.png' },
  agencyBg: { type: String, default: '/uploads/bg.jpg' },
  agencyDecor: { type: String, default: '' },
  coins: { type: Number, default: 0 },
  vip: { type: Number, default: 0 },
  wealthLevel: { type: Number, default: 0 },
  popularity: { type: Number, default: 0 },
  followers: { type: Number, default: 0 },
  following: { type: Number, default: 0 },
  friends: { type: Number, default: 0 },
  ownerGoldenEntry: { type: Boolean, default: false }, // الك بس يا سبع
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Register API - نفس تبعك
app.post('/api/register', async (req, res) => {
  try {
    const { username, lastName, email, password, country, birthDate, age, gender } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'الايميل مستخدم من قبل' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username, lastName, email, password: hashedPassword,
      country, birthDate, age, gender,
      displayName: username + ' ' + lastName
    });
    await newUser.save();
    const token = jwt.sign({ userId: newUser._id }, JWT_SECRET);
    res.json({
      token,
      user: {
        username, lastName, email, country, age, gender,
        vipId: newUser.vipId, displayName: newUser.displayName, _id: newUser._id
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'خطأ بالسيرفر' });
  }
});

// Login API - نفس تبعك
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
      user: {
        username: user.username,
        lastName: user.lastName,
        email: user.email,
        country: user.country,
        age: user.age,
        gender: user.gender,
        vipId: user.vipId,
        displayName: user.displayName,
        _id: user._id
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'خطأ بالسيرفر' });
  }
});

// API جديد عشان me.html
app.get('/api/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'مافي توكن' });
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) return res.status(404).json({ error: 'اليوزر مو موجود' });
    res.json(user);
  } catch (error) {
    res.status(401).json({ error: 'توكن غلط او منتهي' });
  }
});

// Routes للصفحات - نفس تبعك
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/me', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'me.html'));
});

// راوت جديد للغرفة
app.get('/room', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'room.html'));
});

// ============ Socket.io للوكالة ============
const liveRooms = new Map();

io.on('connection', (socket) => {
  // انشاء غرفة
  socket.on('create-room', async ({userId}) => {
    const user = await User.findById(userId);
    const roomId = `room_${userId}`;

    if(!liveRooms.has(roomId)) {
      liveRooms.set(roomId, {
        owner: userId,
        ownerData: user,
        seats: 4,
        agencyOpen: false,
        agencyRunning: false,
        allowMic: false,
        members: new Map([[userId, user]]),
        banned: new Set(),
        admins: new Set([userId]),
        chat: []
      });
    }
    socket.join(roomId);
    // دخولية ذهبية 13 ثانية للمالك
    if(user.ownerGoldenEntry || user.vipId === 777) {
      io.to(roomId).emit('golden-entry', {userId, duration: 13000});
    }
    socket.emit('room-data', liveRooms.get(roomId));
  });

  // دخول غرفة
  socket.on('join-room', async ({roomId, userId}) => {
    const room = liveRooms.get(roomId);
    const user = await User.findById(userId);
    if(room &&!room.banned.has(userId) && room.agencyOpen) {
      socket.join(roomId);
      room.members.set(userId, user);
      io.to(roomId).emit('room-update', room);
    }
  });

  // تحديث اعدادات
  socket.on('update-room', ({roomId, userId, updates}) => {
    const room = liveRooms.get(roomId);
    if(room && room.owner === userId) {
      Object.assign(room, updates);
      io.to(roomId).emit('room-update', room);
    }
  });

  // تفاعل 3D كبير - ستيكرات
  socket.on('big-reaction', ({roomId, userId, reaction}) => {
    io.to(roomId).emit('show-reaction', {userId, reaction, time: Date.now()});
  });

  // شات الوكالة
  socket.on('agency-msg', ({roomId, userId, msg}) => {
    const room = liveRooms.get(roomId);
    const user = room.members.get(userId);
    const msgData = {userId, vipId: user.vipId, name: user.displayName, msg, time: Date.now()};
    room.chat.push(msgData);
    io.to(roomId).emit('new-msg', msgData);
  });

  // طرد
  socket.on('kick-member', ({roomId, ownerId, targetId}) => {
    const room = liveRooms.get(roomId);
    if(room && room.owner === ownerId) {
      room.banned.add(targetId);
      room.members.delete(targetId);
      io.to(roomId).emit('member-kicked', targetId);
      io.to(roomId).emit('room-update', room);
    }
  });

  // اعطاء ادمن
  socket.on('make-admin', ({roomId, ownerId, targetId}) => {
    const room = liveRooms.get(roomId);
    if(room && room.owner === ownerId) {
      room.admins.add(targetId);
      io.to(roomId).emit('room-update', room);
    }
  });
});

// شغل السيرفر
server.listen(PORT, () => {
  console.log(`🚀 Server + Socket شغال على بورت ${PORT}`);
});
