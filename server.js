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
const JWT_SECRET = process.env.JWT_SECRET || 'sabe7_live_2026';
const MONGO_URI = process.env.MONGO_URI;

app.use(cors());
app.use(express.json());
app.use(express.static('public')); // عشان ملفات html

mongoose.connect(MONGO_URI).then(() => console.log('✅ MongoDB Connected'));

// 1. موديل المستخدم
const UserSchema = new mongoose.Schema({
  username: String,
  email: { type: String, unique: true },
  password: String,
  avatar: { type: String, default: 'https://i.imgur.com/8QJZQxG.png' },
  vip: { type: Number, default: 0 },
  level: { type: String, default: 'مستخدم' },
  coins: { type: Number, default: 1000 },
  diamonds: { type: Number, default: 0 },
  beans: { type: Number, default: 0 },
  frame: String,
  entrance: String
});

// 2. موديل الغرفة
const RoomSchema = new mongoose.Schema({
  roomId: { type: String, unique: true },
  name: String,
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  mics: { type: Number, default: 20 },
  entryVideo: String,
  entryText: String,
  locked: { type: Boolean, default: false }
});

// 3. موديل الهدايا
const GiftSchema = new mongoose.Schema({
  giftId: String,
  name: String,
  price: Number,
  animation: String
});

const User = mongoose.model('User', UserSchema);
const Room = mongoose.model('Room', RoomSchema);
const Gift = mongoose.model('Gift', GiftSchema);

// انشاء الهدايا تلقائي
const initGifts = async () => {
  const gifts = [
    { giftId: 'rose', name: 'وردة', price: 1, animation: 'https://files.catbox.moe/rose.gif' },
    { giftId: 'heart', name: 'قلب', price: 10, animation: 'https://files.catbox.moe/heart.gif' },
    { giftId: 'lion', name: 'اسد', price: 100, animation: 'https://files.catbox.moe/lion.gif' },
    { giftId: 'car', name: 'سيارة', price: 500, animation: 'https://files.catbox.moe/car.gif' },
    { giftId: 'castle', name: 'قصر', price: 1000, animation: 'https://files.catbox.moe/castle.gif' }
  ];
  for (let g of gifts) await Gift.findOneAndUpdate({ giftId: g.giftId }, g, { upsert: true });
};
initGifts();

// 4. تسجيل دخول المالك
app.post('/api/owner-login', async (req, res) => {
  let user = await User.findOne({ email: 'm1234ahmad@gmail.com' });
  if (!user) {
    const hashed = await bcrypt.hash('123456', 10);
    user = await User.create({
      username: 'السبع الحلبي',
      email: 'm1234ahmad@gmail.com',
      password: hashed,
      vip: 10000,
      level: '10000 TOP',
      coins: 999999,
      diamonds: 999999,
      beans: 999999,
      frame: 'gold',
      entrance: 'https://files.catbox.moe/ue0s54.mp4'
    });
  }
  const token = jwt.sign({ userId: user._id }, JWT_SECRET);
  res.json({ token, user });
});

// 5. جلب الهدايا
app.get('/api/gifts', async (req, res) => {
  const gifts = await Gift.find();
  res.json(gifts);
});

// 6. Socket.io الغرف
const rooms = new Map();

io.on('connection', (socket) => {
  console.log('User:', socket.id);

  socket.on('joinRoom', async ({ roomId, token }) => {
    try {
      const user = await User.findById(jwt.verify(token, JWT_SECRET).userId);
      if (!user) return;

      if (!rooms.has(roomId)) {
        let dbRoom = await Room.findOne({ roomId });
        if (!dbRoom) {
          dbRoom = await Room.create({
            roomId,
            name: 'غرفة السبع الرسمية',
            owner: user._id,
            entryVideo: user.entrance || 'https://files.catbox.moe/ue0s54.mp4',
            entryText: '👑 دخل المالك - السبع الحلبي'
          });
        }
        rooms.set(roomId, {
       ...dbRoom.toObject(),
          users: [],
          mics: Array(20).fill(null),
          messages: []
        });
      }

      const room = rooms.get(roomId);

      // دخول VIP
      if (user.vip >= 1000) {
        io.to(roomId).emit('vipEntry', {
          video: user.entrance || room.entryVideo,
          text: `👑 دخل ${user.level} - ${user.username}`,
          duration: 7
        });
      }

      room.users.push({
        socketId: socket.id,
        userId: user._id.toString(),
        username: user.username,
        avatar: user.avatar,
        vip: user.vip,
        level: user.level
      });

      socket.join(roomId);
      io.to(roomId).emit('roomUpdate', sanitizeRoom(room));
    } catch (e) { console.log(e); }
  });

  socket.on('takeMic', ({ roomId, micIndex }) => {
    const room = rooms.get(roomId);
    if (!room || room.mics[micIndex] || room.locked) return;
    room.mics[micIndex] = socket.id;
    io.to(roomId).emit('roomUpdate', sanitizeRoom(room));
  });

  socket.on('leaveMic', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    const idx = room.mics.indexOf(socket.id);
    if (idx >= 0) room.mics[idx] = null;
    io.to(roomId).emit('roomUpdate', sanitizeRoom(room));
  });

  socket.on('sendGift', async ({ roomId, toUserId, giftId }) => {
    const room = rooms.get(roomId);
    const sender = room.users.find(u => u.socketId === socket.id);
    const senderUser = await User.findById(sender.userId);
    const gift = await Gift.findOne({ giftId });
    const toUser = await User.findById(toUserId);

    if (!gift || senderUser.coins < gift.price) return;
    senderUser.coins -= gift.price;
    toUser.beans += gift.price;
    await senderUser.save();
    await toUser.save();

    io.to(roomId).emit('giftAnimation', {
      from: { username: sender.username, avatar: sender.avatar },
      to: { username: toUser.username },
      gift: gift
    });
  });

  socket.on('sendMessage', ({ roomId, text }) => {
    const room = rooms.get(roomId);
    const user = room.users.find(u => u.socketId === socket.id);
    const msg = {
      username: user.username,
      avatar: user.avatar,
      text, vip: user.vip, level: user.level, time: Date.now()
    };
    room.messages.push(msg);
    if (room.messages.length > 100) room.messages.shift();
    io.to(roomId).emit('newMessage', msg);
  });

  socket.on('disconnect', () => {
    rooms.forEach((room, roomId) => {
      const userIdx = room.users.findIndex(u => u.socketId === socket.id);
      if (userIdx >= 0) {
        room.users.splice(userIdx, 1);
        const micIdx = room.mics.indexOf(socket.id);
        if (micIdx >= 0) room.mics[micIdx] = null;
        io.to(roomId).emit('roomUpdate', sanitizeRoom(room));
      }
    });
  });
});

function sanitizeRoom(room) {
  return {
    roomId: room.roomId,
    name: room.name,
    users: room.users,
    mics: room.mics.map(socketId => {
      if (!socketId) return null;
      if (socketId === 'closed') return 'closed';
      return room.users.find(u => u.socketId === socketId);
    })
  };
}

server.listen(PORT, () => console.log(`🔥 السبع لايف شغال على ${PORT}`));
