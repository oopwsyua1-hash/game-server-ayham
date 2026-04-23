const express = require('express')
const { createServer } = require('http')
const { Server } = require('socket.io')
const mongoose = require('mongoose')
const cors = require('cors')
const { GoogleGenerativeAI } = require('@google/generative-ai')
require('dotenv').config()

const app = express()
const httpServer = createServer(app)

app.use(cors())
app.use(express.json())

mongoose.connect(process.env.MONGO_URI)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

const io = new Server(httpServer, { cors: { origin: "*" } })

let onlineUsers = {}
let rooms = {}
let posts = []

// الصفحة الرئيسية = قسم الغلاف تبع الغرفة
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html dir="rtl">
    <head>
      <title>وكالة السبع السوري</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Cairo', sans-serif;
          background: linear-gradient(180deg, #1a1a2e 0%, #0f0f1e 100%);
          color: #fff; min-height: 100vh; padding-bottom: 80px;
        }
        .cover-bg {
          background: url('https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800') center/cover;
          height: 250px; position: relative;
        }
        .cover-overlay {
          background: linear-gradient(180deg, transparent 0%, #0f0f1e 100%);
          position: absolute; bottom: 0; width: 100%; height: 100px;
        }
        .profile-main {
          text-align: center; margin-top: -60px; position: relative; z-index: 2;
        }
        .profile-pic {
          width: 120px; height: 120px; border-radius: 50%;
          border: 4px solid #ff0080; box-shadow: 0 0 30px #ff0080;
        }
        .title-gold {
          background: linear-gradient(45deg, #FFD700, #FFA500);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          font-size: 2rem; font-weight: 900; margin: 10px 0;
          text-shadow: 0 0 20px rgba(255,215,0,0.5);
        }
        .mic-seats {
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 15px; padding: 20px; max-width: 500px; margin: 20px auto;
        }
        .seat {
          background: linear-gradient(145deg, #d4af37, #b8860b);
          border-radius: 15px; padding: 10px; text-align: center;
          border: 2px solid #FFD700; box-shadow: 0 5px 15px rgba(0,0,0,0.5);
          position: relative; cursor: pointer;
        }
        .seat.locked { opacity: 0.5; }
        .seat img { width: 50px; height: 50px; border-radius: 50%; }
        .seat .plus {
          font-size: 2rem; color: #fff; text-shadow: 0 0 10px #fff;
        }
        .bottom-nav {
          position: fixed; bottom: 0; width: 100%; background: #1a1a2e;
          display: flex; justify-content: space-around; padding: 10px 0;
          border-top: 1px solid #333; z-index: 100;
        }
        .nav-item { text-align: center; color: #888; font-size: 0.8rem; cursor: pointer; }
        .nav-item.active { color: #ff0080; }
        .nav-item .icon { font-size: 1.5rem; }
        .chat-box {
          background: rgba(0,0,0,0.6); margin: 20px; padding: 15px;
          border-radius: 15px; max-height: 200px; overflow-y: auto;
        }
        .msg { margin: 8px 0; text-align: right; }
        .msg .user { color: #00ff88; font-weight: bold; }
        input, button {
          font-family: 'Cairo'; padding: 12px; margin: 5px; border-radius: 10px; border: none;
        }
        button { background: #ff0080; color: #fff; font-weight: bold; cursor: pointer; }
      </style>
    </head>
    <body>
      <div class="cover-bg">
        <div class="cover-overlay"></div>
      </div>
      
      <div class="profile-main">
        <img src="https://i.pravatar.cc/150?img=12" class="profile-pic">
        <h1 class="title-gold">وكالة السبع السوري</h1>
        <p>مرحباً بكم في غرفة دردشة Honey Jar! 🎉</p>
      </div>

      <div class="mic-seats" id="seats"></div>

      <div class="chat-box" id="chatBox">
        <div class="msg"><span class="user">النظام:</span> أهلاً فيك بغرفة السبع الحلبي 🔥</div>
      </div>

      <div style="text-align:center; padding:20px;">
        <input id="msgInput" placeholder="اكتب رسالة..." style="width:60%;">
        <button onclick="sendMsg()">ارسال</button>
      </div>

      <div class="bottom-nav">
        <div class="nav-item" onclick="location.href='/profile'">
          <div class="icon">👤</div>ملفي
        </div>
        <div class="nav-item" onclick="location.href='/chat'">
          <div class="icon">💬</div>الدردشة
        </div>
        <div class="nav-item active">
          <div class="icon">🎤</div>الغرفة
        </div>
        <div class="nav-item" onclick="location.href='/party'">
          <div class="icon">🎉</div>الحفلات
        </div>
        <div class="nav-item" onclick="location.href='/posts'">
          <div class="icon">🏠</div>المنشورات
        </div>
      </div>

      <script>
        const socket = io();
        let myUsername = 'زائر_' + Math.floor(Math.random() * 1000);
        socket.emit('login', myUsername);
        socket.emit('join_room', 'main');

        // رسم المقاعد الـ 12
        const seatsDiv = document.getElementById('seats');
        for(let i=1; i<=12; i++) {
          seatsDiv.innerHTML += \`
            <div class="seat \${i > 4 ? 'locked' : ''}" onclick="takeSeat(\${i})">
              <div class="plus">\${i > 4 ? '🔒' : '+'}</div>
              <div>مقعد \${i}</div>
            </div>\`;
        }

        function takeSeat(num) {
          alert('طلعت عالمقعد رقم ' + num + ' يا ' + myUsername);
        }

        function sendMsg() {
          const msg = document.getElementById('msgInput').value;
          if(!msg) return;
          socket.emit('send_message', { room: 'main', message: msg });
          document.getElementById('msgInput').value = '';
        }

        socket.on('new_message', (data) => {
          const chatBox = document.getElementById('chatBox');
          chatBox.innerHTML += \`<div class="msg"><span class="user">\${data.user}:</span> \${data.message}</div>\`;
          chatBox.scrollTop = chatBox.scrollHeight;
        });
      </script>
    </body>
    </html>
  `)
})

// باقي الأقسام رح نضيفها بعدين
app.get('/posts', (req, res) => res.send('<h1>قسم المنشورات - قريباً</h1>'))
app.get('/party', (req, res) => res.send('<h1>قسم الحفلات - قريباً</h1>'))
app.get('/chat', (req, res) => res.send('<h1>قسم الدردشة - قريباً</h1>'))
app.get('/profile', (req, res) => res.send('<h1>ملف الشخصي - قريباً</h1>'))

const PORT = process.env.PORT || 10000
httpServer.listen(PORT, () => console.log('Server on ' + PORT))
