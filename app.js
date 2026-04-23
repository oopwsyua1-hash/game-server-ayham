const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// مهم جداً: هذا السطر بشغل مجلد public والواجهة تبعك
app.use(express.static('public'));

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('MongoDB شغال 👑'))
.catch(err => console.log('Mongo Error:', err));

const MessageSchema = new mongoose.Schema({
  room: String,
  username: String,
  text: String,
  time: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', MessageSchema);

const RoomSchema = new mongoose.Schema({
  name: { type: String, unique: true },
  createdBy: String,
  users: [String]
});
const Room = mongoose.model('Room', RoomSchema);

app.get('/api/rooms', async (req, res) => {
  const rooms = await Room.find();
  res.json(rooms);
});

app.get('/api/messages/:room', async (req, res) => {
  const messages = await Message.find({ room: req.params.room }).sort({ time: 1 }).limit(100);
  res.json(messages);
});

let onlineUsers = {};

io.on('connection', (socket) => {
  console.log('مستخدم جديد:', socket.id);

  socket.on('joinRoom', async ({ username, room }) => {
    socket.join(room);
    onlineUsers[socket.id] = { username, room };

    await Room.findOneAndUpdate(
      { name: room },
      { $addToSet: { users: username } },
      { upsert: true }
    );

    const oldMessages = await Message.find({ room }).sort({ time: 1 }).limit(50);
    socket.emit('oldMessages', oldMessages);

    socket.to(room).emit('userJoined', { username, text: `${username} دخل الغرفة` });

    const roomUsers = Object.values(onlineUsers).filter(u => u.room === room);
    io.to(room).emit('roomUsers', roomUsers);
  });

  socket.on('chatMessage', async ({ username, room, text }) => {
    const message = new Message({ username, room, text });
    await message.save();

    io.to(room).emit('message', {
      username,
      text,
      time: message.time
    });
  });

  socket.on('disconnect', () => {
    const user = onlineUsers[socket.id];
    if (user) {
      socket.to(user.room).emit('userLeft', { username: user.username, text: `${user.username} طلع من الغرفة` });
      delete onlineUsers[socket.id];

      const roomUsers = Object.values(onlineUsers).filter(u => u.room === user.room);
      io.to(user.room).emit('roomUsers', roomUsers);
    }
  });
});

// اي رابط مو موجود روح على index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

server.listen(PORT, () => {
  console.log(`السيرفر شغال على بورت ${PORT} 👑`);
});
