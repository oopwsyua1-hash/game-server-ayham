const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

mongoose.connect(process.env.MONGO_URI).then(() => console.log('MongoDB شغال 👑'));

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
  isVip: Boolean,
  lock: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
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

// API الغرف
app.get('/api/rooms', async (req, res) => {
  const rooms = await Room.find().sort({ isVip: -1, createdAt: -1 });
  res.json(rooms);
});

app.post('/api/rooms', async (req, res) => {
  const room = new Room({
    name: req.body.name,
    createdBy: req.body.createdBy,
    owner: req.body.createdBy,
    admins: [req.body.createdBy],
    mods: [],
    mics: [],
    users: []
  });
  await room.save();
  res.json(room);
});

app.get('/api/room/:id', async (req, res) => {
  const room = await Room.findById(req.params.id);
  res.json(room);
});

let onlineUsers = {}; // {socketId: {username, room, userId, role}}

function getUserRole(username, room) {
  if (room.owner === username) return 'owner';
  if (room.admins.includes(username)) return 'admin';
  if (room.mods.includes(username)) return 'mod';
  return 'user';
}

io.on('connection', (socket) => {

  socket.on('joinRoom', async ({ username, room }) => {
    const roomData = await Room.findById(room);
    if (!roomData) return;

    // شيك الحظر
    if (roomData.banned.includes(username)) {
      socket.emit('banned', 'انت محظور من هاي الغرفة');
      return;
    }
    // شيك القفل
    if (roomData.lock && getUserRole(username, roomData) === 'user') {
      socket.emit('locked', 'الغرفة مقفولة');
      return;
    }

    socket.join(room);
    const role = getUserRole(username, roomData);
    onlineUsers[socket.id] = { username, room, userId: socket.id, role };

    await Room.findByIdAndUpdate(room, { $addToSet: { users: username } });

    // رسايل قديمة
    const oldMessages = await Message.find({ room }).sort({ time: 1 }).limit(100);
    socket.emit('oldMessages', oldMessages);
    socket.emit('roomData', roomData);
    socket.emit('yourRole', role);

    // اشعار دخول رسمي
    const joinMsg = new Message({
      room, username: 'النظام',
      text: `${username} انضم للغرفة`,
      type: 'join'
    });
    await joinMsg.save();
    io.to(room).emit('systemMsg', { text: `🟢 ${username} انضم للغرفة`, type: 'join' });

    const roomUsers = Object.values(onlineUsers).filter(u => u.room === room);
    io.to(room).emit('updateUsers', roomUsers);
    io.to(room).emit('updateMics', roomData.mics);
  });

  // طلوع مايك
  socket.on('takeMic', async ({ room, seat }) => {
    const user = onlineUsers[socket.id];
    const roomData = await Room.findById(room);
    if (roomData.mics.find(m => m.seat === seat)) return socket.emit('errorMsg', 'المايك محجوز');
    if (roomData.muted.includes(user.username)) return socket.emit('errorMsg', 'انت مكتوم');

    const newMic = { userId: socket.id, username: user.username, seat, muted: false };
    await Room.findByIdAndUpdate(room, { $push: { mics: newMic } });

    const msg = new Message({ room, username: 'النظام', text: `🎤 ${user.username} طلع مايك ${seat}`, type: 'mic' });
    await msg.save();
    io.to(room).emit('systemMsg', { text: `🎤 ${user.username} طلع مايك ${seat}`, type: 'mic' });
    io.to(room).emit('updateMics', (await Room.findById(room)).mics);
  });

  // نزول مايك
  socket.on('leaveMic', async ({ room }) => {
    const user = onlineUsers[socket.id];
    await Room.findByIdAndUpdate(room, { $pull: { mics: { userId: socket.id } } });
    const msg = new Message({ room, username: 'النظام', text: `⬇️ ${user.username} نزل من المايك`, type: 'mic' });
    await msg.save();
    io.to(room).emit('systemMsg', { text: `⬇️ ${user.username} نزل من المايك`, type: 'mic' });
    io.to(room).emit('updateMics', (await Room.findById(room)).mics);
  });

  // طرد من المايك - للادارة
  socket.on('kickMic', async ({ room, targetUserId }) => {
    const user = onlineUsers[socket.id];
    const roomData = await Room.findById(room);
    if (!['owner', 'admin', 'mod'].includes(user.role)) return;

    const target = roomData.mics.find(m => m.userId === targetUserId);
    if (!target) return;

    await Room.findByIdAndUpdate(room, { $pull: { mics: { userId: targetUserId } } });
    const msg = new Message({ room, username: 'النظام', text: `⛔ ${user.username} نزل ${target.username} من المايك`, type: 'kick' });
    await msg.save();
    io.to(room).emit('systemMsg', { text: `⛔ ${user.username} نزل ${target.username} من المايك`, type: 'kick' });
    io.to(targetUserId).emit('kickedFromMic');
    io.to(room).emit('updateMics', (await Room.findById(room)).mics);
  });

  // طرد من الغرفة
  socket.on('kickUser', async ({ room, targetUsername }) => {
    const user = onlineUsers[socket.id];
    if (!['owner', 'admin'].includes(user.role)) return;

    const targetSocket = Object.values(onlineUsers).find(u => u.username === targetUsername && u.room === room);
    if (targetSocket) {
      io.to(targetSocket.userId).emit('kicked', 'تم طردك من الغرفة');
      io.sockets.sockets.get(targetSocket.userId)?.disconnect();
    }
    const msg = new Message({ room, username: 'النظام', text: `🚫 ${user.username} طرد ${targetUsername}`, type: 'kick' });
    await msg.save();
    io.to(room).emit('systemMsg', { text: `🚫 ${user.username} طرد ${targetUsername}`, type: 'kick' });
  });

  // حظر
  socket.on('banUser', async ({ room, targetUsername }) => {
    const user = onlineUsers[socket.id];
    if (user.role!== 'owner') return;

    await Room.findByIdAndUpdate(room, { $addToSet: { banned: targetUsername } });
    const msg = new Message({ room, username: 'النظام', text: `🔨 ${user.username} حظر ${targetUsername}`, type: 'ban' });
    await msg.save();
    io.to(room).emit('systemMsg', { text: `🔨 ${user.username} حظر ${targetUsername}`, type: 'ban' });

    const targetSocket = Object.values(onlineUsers).find(u => u.username === targetUsername && u.room === room);
    if (targetSocket) io.sockets.sockets.get(targetSocket.userId)?.disconnect();
  });

  // رسالة شات
  socket.on('chatMessage', async ({ username, room, text }) => {
    const roomData = await Room.findById(room);
    if (roomData.muted.includes(username)) return socket.emit('errorMsg', 'انت مكتوم');

    const message = new Message({ username, room, text, type: 'message' });
    await message.save();
    io.to(room).emit('message', { username, text, time: message.time, type: 'message' });
  });

  socket.on('disconnect', async () => {
    const user = onlineUsers[socket.id];
    if (!user) return;
    const room = user.room;

    await Room.findByIdAndUpdate(room, {
      $pull: { mics: { userId: socket.id }, users: user.username }
    });

    const leaveMsg = new Message({ room, username: 'النظام', text: `${user.username} غادر الغرفة`, type: 'leave' });
    await leaveMsg.save();
    io.to(room).emit('systemMsg', { text: `🔴 ${user.username} غادر الغرفة`, type: 'leave' });

    const roomUsers = Object.values(onlineUsers).filter(u => u.room === room && u.userId!== socket.id);
    io.to(room).emit('updateUsers', roomUsers);
    io.to(room).emit('updateMics', (await Room.findById(room)).mics);

    delete onlineUsers[socket.id];
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

server.listen(PORT, () => console.log(`السيرفر الاداري شغال ${PORT} 👑`));
