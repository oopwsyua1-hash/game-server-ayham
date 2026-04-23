const express = require('express')
const { createServer } = require('http')
const { Server } = require('socket.io')
const mongoose = require('mongoose')
const cors = require('cors')
const { GoogleGenerativeAI } = require('@google/generative-ai')
require('dotenv').config()

const app = express()
const httpServer = createServer(app)

// Middleware
app.use(cors())
app.use(express.json())

// MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected ✅'))
  .catch(err => console.log('MongoDB Error:', err))

// Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

// Socket.io
const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] }
})

// نخزن المستخدمين والغرف
let onlineUsers = {}
let gameRooms = {}

// Socket.io Events
io.on('connection', (socket) => {
  console.log('User connected:', socket.id)

  // 1. تسجيل دخول
  socket.on('login', (username) => {
    onlineUsers[socket.id] = username
    socket.emit('login_success', { username, id: socket.id })
    io.emit('users_update', Object.values(onlineUsers))
    console.log(`${username} دخل`)
  })

  // 2. دخول غرفة لعبة
  socket.on('join_room', (roomName) => {
    socket.join(roomName)
    if (!gameRooms[roomName]) gameRooms[roomName] = []
    gameRooms[roomName].push(onlineUsers[socket.id])
    io.to(roomName).emit('room_update', gameRooms[roomName])
  })

  // 3. ارسال رسالة للغرفة
  socket.on('send_message', ({ room, message }) => {
    io.to(room).emit('new_message', {
      user: onlineUsers[socket.id],
      message,
      time: new Date().toLocaleTimeString('ar')
    })
  })

  // 4. قطع الاتصال
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id)
    delete onlineUsers[socket.id]
    io.emit('users_update', Object.values(onlineUsers))
  })
})

// الصفحة الرئيسية - كل شي فيها
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>السبع الحلبي - LIVE</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@700;900&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Cairo', Arial, sans-serif;
          background: #0a0a0a; color: #fff; text-align: center; height: 100vh; overflow: hidden;
        }
        .neon-grid {
          position: fixed; width: 200%; height: 200%; top: -50%; left: -50%;
          background-image: linear-gradient(#ff0080 2px, transparent 2px), linear-gradient(90deg, #00ffff 2px, transparent 2px);
          background-size: 50px 50px; animation: moveGrid 4s linear infinite; opacity: 0.15; z-index: -1;
        }
        @keyframes moveGrid {
          0% { transform: perspective(500px) rotateX(60deg) translateY(0); }
          100% { transform: perspective(500px) rotateX(60deg) translateY(50px); }
        }
        .container { position: relative; z-index: 1; padding-top: 5vh; }
        h1 {
          font-size: 3.5rem; font-weight: 900;
          text-shadow: 0 0 10px #fff, 0 0 20px #ff0080, 0 0 40px #ff0080;
          animation: heartBeat 1s ease-in-out infinite; margin-bottom: 20px;
        }
        @keyframes heartBeat { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
        .box {
          background: rgba(10,10,10,0.85); backdrop-filter: blur(15px);
          display: inline-block; padding: 20px 30px; border-radius: 20px;
          border: 2px solid #ff0080; box-shadow: 0 0 20px #ff0080; margin: 10px; min-width: 300px;
        }
        input, button {
          font-family: 'Cairo'; padding: 10px; margin: 5px; border-radius: 10px; border: none;
          font-size: 1rem;
        }
        input { background: #1e293b; color: #fff; width: 70%; }
        button { background: #ff0080; color: #fff; font-weight: bold; cursor: pointer; }
        button:hover { background: #ff3399; }
        #chat { height: 200px; overflow-y: auto; text-align: right; background: #000; padding: 10px; border-radius: 10px; margin-top: 10px; }
        .msg { margin: 5px 0; }
        .msg span { color: #00ff88; }
        #musicBtn { position: fixed; top: 20px; right: 20px; z-index: 10; }
        .green { color: #00ff88; text-shadow: 0 0 15px #00ff88; }
      </style>
    </head>
    <body>
      <div class="neon-grid"></div>
      <button id="musicBtn" onclick="toggleMusic()">🎵 شغل الموسيقى</button>
      
      <div class="container">
        <h1>⚡ السبع الحلبي عم ينبض ⚡</h1>
        
        <div class="box">
          <p>Server: <span class="green">LIVE 🔥</span></p>
          <p>MongoDB: <span class="green">CONNECTED ✅</span></p>
          <p>Online: <span class="green" id="onlineCount">0</span></p>
        </div>

        <div class="box" id="loginBox">
          <h3>تسجيل دخول</h3>
          <input id="username" placeholder="اكتب اسمك يا سبع">
          <button onclick="login()">ادخل</button>
        </div>

        <div class="box" id="gameBox" style="display:none;">
          <h3>أهلاً <span id="myName"></span></h3>
          <input id="roomName" placeholder="اسم الغرفة">
          <button onclick="joinRoom()">ادخل الغرفة</button>
          <div id="chat"></div>
          <input id="msgInput" placeholder="اكتب رسالة" onkeypress="if(event.key==='Enter')sendMsg()">
          <button onclick="sendMsg()">ارسل</button>
          <br><br>
          <input id="aiPrompt" placeholder="اسأل Gemini">
          <button onclick="askGemini()">اسأل الذكاء</button>
        </div>
      </div>

      <audio id="bgMusic" loop>
        <source src="https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3" type="audio/mpeg">
      </audio>

      <script>
        const socket = io();
        let currentRoom = '';
        let myUsername = '';
        let musicPlaying = false;

        function toggleMusic() {
          const music = document.getElementById('bgMusic');
          const btn = document.getElementById('musicBtn');
          if (musicPlaying) {
            music.pause();
            btn.innerHTML = '🎵 شغل الموسيقى';
          } else {
            music.play();
            btn.innerHTML = '🔇 وقف الموسيقى';
          }
          musicPlaying = !musicPlaying;
        }

        function login() {
          myUsername = document.getElementById('username').value;
          if (!myUsername) return alert('اكتب اسمك');
          socket.emit('login', myUsername);
        }

        socket.on('login_success', (data) => {
          document.getElementById('loginBox').style.display = 'none';
          document.getElementById('gameBox').style.display = 'inline-block';
          document.getElementById('myName').innerText = data.username;
        });

        socket.on('users_update', (users) => {
          document.getElementById('onlineCount').innerText = users.length;
        });

        function joinRoom() {
          currentRoom = document.getElementById('roomName').value;
          if (!currentRoom) return alert('اكتب اسم الغرفة');
          socket.emit('join_room', currentRoom);
          addMsg('النظام', 'دخلت غرفة ' + currentRoom);
        }

        function sendMsg() {
          const msg = document.getElementById('msgInput').value;
          if (!msg || !currentRoom) return;
          socket.emit('send_message', { room: currentRoom, message: msg });
          document.getElementById('msgInput').value = '';
        }

        socket.on('new_message', (data) => {
          addMsg(data.user, data.message);
        });

        function addMsg(user, msg) {
          const chat = document.getElementById('chat');
          chat.innerHTML += '<div class="msg"><span>' + user + ':</span> ' + msg + '</div>';
          chat.scrollTop = chat.scrollHeight;
        }

        async function askGemini() {
          const prompt = document.getElementById('aiPrompt').value;
          if (!prompt) return;
          addMsg('أنت', prompt);
          addMsg('Gemini', 'عم فكر...');
          const res = await fetch('/api/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
          });
          const data = await res.json();
          document.getElementById('chat').lastChild.remove();
          addMsg('Gemini 🤖', data.text);
          document.getElementById('aiPrompt').value = '';
        }
      </script>
    </body>
    </html>
  `)
})

// API Gemini
app.post('/api/gemini', async (req, res) => {
  try {
    const { prompt } = req.body
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
    const result = await model.generateContent(prompt)
    const response = await result.response
    res.json({ text: response.text() })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    users: Object.keys(onlineUsers).length,
    time: new Date() 
  })
})

const PORT = process.env.PORT || 10000
httpServer.listen(PORT, () => {
  console.log(`Server on ${PORT}`)
})
