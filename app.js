const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

mongoose.connect(process.env.MONGO_URI).then(() => console.log('MongoDB شغال 👑'));

const UserSchema = new mongoose.Schema({
  username: String,
  coins: { type: Number, default: 0 },
  vip: { type: Number, default: 0 }, // 0=عادي 1=فضي 2=ذهبي
  diamonds: { type: Number, default: 0 }
});
const User = mongoose.model('User', UserSchema);

const RoomSchema = new mongoose.Schema({
  name: String,
  createdBy: String,
  owner: String,
  admins: [String],
  mods: [String],
  mics: [{ userId: String, username: String, seat: Number, muted: Boolean }],
  banned: [String],
  muted: [String],
  users: [String],
  lock: Boolean,
  entryFee: { type: Number, default: 0 },
  totalGifts: { type: Number, default: 0 }
});
const Room = mongoose.model('Room', RoomSchema);

const MessageSchema = new mongoose.Schema({
  room: String,
  username: String,
  text: String,
  type: String, // message, join, leave, mic, kick, ban, gift
  time: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', MessageSchema);

const GiftSchema = new mongoose.Schema({
  room: String,
  from: String,
  to: String,
  giftName: String,
  giftValue: Number,
  time: { type: Date, default: Date.now }
});
const Gift = mongoose.model('Gift', GiftSchema);

let onlineUsers = {}; // {socketId: {username, room, userId, role}}

function getUserRole(username, room) {
  if (room.owner === username) return 'owner';
  if (room.admins.includes(username)) return 'admin';
  if (room.mods.includes(username)) return 'mod';
  return 'user';
}

app.get('/api/rooms', async (req, res) => {
  const rooms = await Room.find().sort({ totalGifts: -1 });
  res.json(rooms);
});

app.post('/api/rooms', async (req, res) => {
  const room = new Room({
    name: req.body.name,
    createdBy: req.body.createdBy,
    owner: req.body.createdBy,
    admins: [req.body.createdBy]
  });
  await room.save();
  res.json(room);
});

// API الشحن - لازم تربطها بـ PayPal/Stripe بعدين
app.post('/api/recharge', async (req, res) => {
  // هون بتحط كود PayPal/Stripe
  // حاليا رح نزيد رصيد وهمي للتجربة
  await User.findOneAndUpdate(
    { username: req.body.username },
    { $inc: { coins: req.body.amount } },
    { upsert: true }
  );
  res.json({ success: true, msg: 'تم الشحن' });
});

io.on('connection', (socket) => {

  socket.on('joinRoom', async ({ username, room }) => {
    const roomData = await Room.findById(room);
    if (!roomData) return;
    if (roomData.banned.includes(username)) return socket.emit('errorMsg', 'محظور');
    if (roomData.lock && getUserRole(username, roomData) === 'user') return socket.emit('errorMsg', 'الغرفة مقفولة');

    socket.join(room);
    const role = getUserRole(username, roomData);
    onlineUsers[socket.id] = { username, room, userId: socket.id, role };

    await Room.findByIdAndUpdate(room, { $addToSet: { users: username } });

    const joinMsg = new Message({ room, username: 'النظام', text: `${username} انضم للغرفة`, type: 'join' });
    await joinMsg.save();
    io.to(room).emit('systemMsg', { text: `🟢 ${username} انضم للغرفة`, type: 'join' });

    socket.emit('roomData', roomData);
    socket.emit('yourRole', role);
    io.to(room).emit('updateMics', roomData.mics);
    io.to(room).emit('updateUsers', Object.values(onlineUsers).filter(u => u.room === room));
  });

  // ارسال هدية
  socket.on('sendGift', async ({ room, toUsername, giftName, giftValue }) => {
    const fromUser = onlineUsers[socket.id];
    const user = await User.findOne({ username: fromUser.username });
    if (!user || user.coins < giftValue) return socket.emit('errorMsg', 'رصيدك ما بكفي');

    await User.findOneAndUpdate({ username: fromUser.username }, { $inc: { coins: -giftValue } });
    await Room.findByIdAndUpdate(room, { $inc: { totalGifts: giftValue } });

    const gift = new Gift({ room, from: fromUser.username, to: toUsername, giftName, giftValue });
    await gift.save();

    const msg = new Message({ room, username: 'النظام', text: `🎁 ${fromUser.username} اهدى ${giftName} لـ ${toUsername}`, type: 'gift' });
    await msg.save();
    io.to(room).emit('giftAnimation', { from: fromUser.username, to: toUsername, giftName, giftValue });
    io.to(room).emit('systemMsg', { text: `🎁 ${fromUser.username} اهدى ${giftName} لـ ${toUsername}`, type: 'gift' });
  });

  // باقي اكواد الطرد والحظر والمايك نفس اللي فوق بس كاملين
});

server.listen(PORT, () => console.log(`السيرفر الاداري شغال ${PORT} 👑`));
