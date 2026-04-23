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

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('MongoDB شغال 👑'))
.catch(err => console.log('Mongo Error:', err));

const RoomSchema = new mongoose.Schema({
  name: String,
  createdBy: String,
  owner: String,
  admins: [String],
  mics: [{ userId: String, username: String, seat: Number }],
  banned: [String],
  isVip: { type: Boolean, default: false }
});
const Room = mongoose.model('Room', RoomSchema);

const MessageSchema = new mongoose.Schema({
  room: String,
  username: String,
  text: String,
  time: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', MessageSchema);

app.get('/api/rooms', async (req, res) => {
  const rooms = await Room.find().sort({ isVip: -1 });
  res.json(rooms);
});

app.post('/api/rooms', async (req, res) => {
  const room = new Room({
    name: req.body.name,
    createdBy: req.body.createdBy,
    owner: req.body.createdBy,
    admins: [req.body.createdBy],
    mics: [],
    banned: []
  });
  await room.save();
  res.json(room);
});

app.get('/api/room/:id', async (req, res) => {
  const room = await Room.findById(req.params.id);
  res.json(room);
});

let onlineUsers = {};
let roomStates = {}; // { roomId: { mics: [], users: [] } }

io.on('connection', (socket) => {

  socket.on('joinRoom', async ({ username, room }) => {
    socket.join(room);
    onlineUsers[socket.id] = { username, room, userId: socket.id };

    const roomData = await Room.findById(room);
    if (roomData.banned.includes(username)) {
      socket.emit('banned');
      socket.disconnect();
      return;
    }

    if (!roomStates[room]) roomStates[room] = { mics: roomData.mics, users: [] };
    roomStates[room].users.push({ username, userId: socket.id });

    const oldMessages = await Message.find({ room }).sort({ time: 1 }).limit(50);
    socket.emit('oldMessages', oldMessages);
    socket.emit('roomData', roomData);
    socket.emit('updateMics', roomStates[room].mics);

    io.to(room).emit('userJoined', { username, text: `${username} دخل الغرفة` });
    io.to(room).emit('updateUsers', roomStates[room].users);
  });

  // طلوع عالمايك
  socket.on('takeMic', async ({ room, seat }) => {
    const user = onlineUsers[socket.id];
    if (!user) return;

    let mics = roomStates[room].mics;
    if (mics.find(m => m.seat === seat)) return; // الكرسي محجوز
    if (mics.find(m => m.userId === socket.id)) return; // انت عالمايك اصلا

    mics.push({ userId: socket.id, username: user.username, seat });
    roomStates[room].mics = mics;
    await Room.findByIdAndUpdate(room, { mics });

    io.to(room).emit('updateMics', mics);
    io.to(room).emit('systemMsg', `${user.username} طلع مايك ${seat}`);
  });

  // نزول من المايك
  socket.on('leaveMic', async ({ room }) => {
    const user = onlineUsers[socket.id];
    let mics = roomStates[room].mics.filter(m => m.userId!== socket.id);
    roomStates[room].mics = mics;
    await Room.findByIdAndUpdate(room, { mics });

    io.to(room).emit('updateMics', mics);
    io.to(room).emit('systemMsg', `${user.username} نزل من المايك`);
  });

  // تنزيل من المايك - للمدراء
  socket.on('kickMic', async ({ room, targetUserId }) => {
    const user = onlineUsers[socket.id];
    const roomData = await Room.findById(room);
    if (!roomData.admins.includes(user.username) && roomData.owner!== user.username) return;

    let mics = roomStates[room].mics.filter(m => m.userId!== targetUserId);
    roomStates[room].mics = mics;
    await Room.findByIdAndUpdate(room, { mics });

    io.to(room).emit('updateMics', mics);
    io.to(targetUserId).emit('kickedFromMic');
  });

  // الصوت اللحظي
  socket.on('voice', ({ room, blob }) => {
    const user = onlineUsers[socket.id];
    if (!roomStates[room].mics.find(m => m.userId === socket.id)) return; // بس اللي عالمايك
    socket.to(room).emit('voice', { userId: socket.id, username: user.username, blob });
  });

  // WebRTC Signaling
  socket.on('offer', ({ room, target, offer }) => {
    io.to(target).emit('offer', { from: socket.id, offer });
  });
  socket.on('answer', ({ room, target, answer }) => {
    io.to(target).emit('answer', { from: socket.id, answer });
  });
  socket.on('ice', ({ room, target, candidate }) => {
    io.to(target).emit('ice', { from: socket.id, candidate });
  });

  socket.on('chatMessage', async ({ username, room, text }) => {
    const message = new Message({ username, room, text });
    await message.save();
    io.to(room).emit('message', { username, text, time: message.time });
  });

  socket.on('disconnect', async () => {
    const user = onlineUsers[socket.id];
    if (!user) return;
    const room = user.room;

    if (roomStates[room]) {
      roomStates[room].users = roomStates[room].users.filter(u => u.userId!== socket.id);
      roomStates[room].mics = roomStates[room].mics.filter(m => m.userId!== socket.id);
      await Room.findByIdAndUpdate(room, { mics: roomStates[room].mics });

      io.to(room).emit('updateUsers', roomStates[room].users);
      io.to(room).emit('updateMics', roomStates[room].mics);
      io.to(room).emit('systemMsg', `${user.username} طلع من الغرفة`);
    }
    delete onlineUsers[socket.id];
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

server.listen(PORT, () => {
  console.log(`السيرفر شغال على بورت ${PORT} 👑`);
});
