const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());
const PORT = process.env.PORT || 10000;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

let rooms = {
  1: { id: 1, name: 'غرفة دردشة عامة', users: [] },
  2: { id: 2, name: 'غرفة ألعاب', users: [] }
};

app.get('/', (req, res) => {
  res.send('Game Server Ayham Shaghal 🔥🎮 + Gemini + Voice Ready');
});

app.get('/api/rooms', (req, res) => {
  res.json({ rooms: Object.values(rooms) });
});

app.post('/api/ai', async (req, res) => {
  try {
    const { prompt } = req.body;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    res.json({ reply: response.text() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// شات صوتي حقيقي
io.on('connection', (socket) => {
  console.log('user connected:', socket.id);

  socket.on('join-room', (roomId, username) => {
    socket.join(roomId);
    rooms[roomId].users.push({ id: socket.id, name: username });

    // خبر الكل انه في شخص جديد فات
    socket.to(roomId).emit('user-joined', { id: socket.id, name: username });

    // بعتله كل الناس الموجودين
    socket.emit('all-users', rooms[roomId].users.filter(u => u.id!== socket.id));

    // حدّث عدد الناس للكل
    io.emit('rooms-updated', Object.values(rooms));
  });

  // استقبال وارسال الصوت
  socket.on('voice', (data) => {
    socket.to(data.room).emit('voice', {
      audio: data.audio,
      userId: socket.id
    });
  });

  socket.on('disconnect', () => {
    for (let roomId in rooms) {
      rooms[roomId].users = rooms[roomId].users.filter(u => u.id!== socket.id);
      socket.to(roomId).emit('user-left', socket.id);
    }
    io.emit('rooms-updated', Object.values(rooms));
  });
});

server.listen(PORT, () => {
  console.log(`Server on ${PORT}`);
});
