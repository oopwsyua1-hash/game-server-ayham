const express = require('express')
const { createServer } = require('http')
const { Server } = require('socket.io')
const mongoose = require('mongoose')
const cors = require('cors')
require('dotenv').config()

const app = express()
const httpServer = createServer(app)

app.use(cors())
app.use(express.json())

// MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/test')
  .then(() => console.log('MongoDB Connected ✅'))
  .catch(err => console.log('MongoDB Error - بس بكمل شغل'))

// Socket.io
const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] }
})

let onlineUsers = {}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id)

  socket.on('login', (username) => {
    onlineUsers[socket.id] = username || 'زائر'
    socket.emit('login_success', { username: onlineUsers[socket.id] })
    io.emit('users_count', Object.keys(onlineUsers).length)
  })

  socket.on('join_room', (roomName) => {
    socket.join(roomName)
    console.log(`${onlineUsers[socket.id]} دخل غرفة ${roomName}`)
  })

  socket.on('send_message', ({ room, message }) => {
    io.to(room).emit('new_message', {
      user: onlineUsers[socket.id] || 'مجهول',
      message,
      time: new Date().toLocaleTimeString('ar')
    })
  })

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id)
    delete onlineUsers[socket.id]
    io.emit('users_count', Object.keys(onlineUsers).length)
  })
})

// ملف manifest.json للتطبيق - كامل للـ APK
app.get('/manifest.json', (req, res) => {
  res.json({
    "name": "وكالة السبع السوري",
    "short_name": "السبع السوري",
    "description": "غرف دردشة صوتية وحفلات لايف ومنشورات - Honey Jar العربي",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#0f0f1e",
    "theme_color": "#ff0080",
    "orientation": "portrait",
    "categories": ["social", "entertainment"],
    "icons": [
      {
        "src": "https://i.imgur.com/8QfQZ8z.png",
        "sizes": "192x192",
        "type": "image/png",
        "purpose": "any"
      },
      {
        "src": "https://i.imgur.com/8QfQZ8z.png",
        "sizes": "512x512",
        "type": "image/png",
        "purpose": "any maskable"
      }
    ]
  })
})

// قسم الغلاف = الصفحة الرئيسية
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html dir="rtl">
    <head>
      <title>وكالة السبع السوري</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="manifest" href="/manifest.json">
      <meta name="theme-color" content="#ff0080">
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
          background: linear-gradient(45deg, #ff0080, #8a2be2);
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
          background: #333;
        }
        .title-gold {
          background: linear-gradient(45deg, #FFD700, #FFA500);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          font-size: 2rem; font-weight: 900; margin: 10px 0;
        }
        .mic-seats {
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 15px; padding: 20px; max-width: 500px; margin: 20px auto;
        }
        .seat {
          background: linear-gradient(145deg, #d4af37, #b8860b);
          border-radius: 15px; padding: 15px; text-align: center;
          border: 2px solid #FFD700; cursor: pointer;
        }
        .seat.locked { opacity: 0.4; }
        .seat .plus { font-size: 2rem; }
        .bottom-nav {
          position: fixed; bottom: 0; width: 100%; background: #1a1a2e;
          display: flex; justify-content: space-around; padding: 12px 0;
          border-top: 1px solid #333; z-index: 100;
        }
        .nav-item { text-align: center; color: #888; font-size: 0.8rem; cursor: pointer; }
        .nav-item.active { color: #ff0080; }
        .nav-item .icon { font-size: 1.5rem; display: block; }
        .chat-box {
          background: rgba(0,0,0,0.6); margin: 20px; padding: 15px;
          border-radius: 15px; max-height: 180px; overflow-y: auto;
        }
        .msg { margin: 8px 0; text-align: right; }
        .msg .user { color: #00ff88; font-weight: bold; }
        input, button {
          font-family: 'Cairo'; padding: 12px; margin: 5px; border-radius: 10px; border: none;
        }
        input { background: #1e293b; color: #fff; width: 65%; }
        button { background: #ff0080; color: #fff; font-weight: bold; cursor: pointer; }
        .online { position: absolute; top: 20px; left: 20px; background: rgba(0,0,0,0.6); padding: 8px 15px; border-radius: 20px; }
      </style>
    </head>
    <body>
      <div class="online">👥 <span id="onlineCount">0</span> أونلاين</div>
      <div class="cover-bg"><div class="cover-overlay"></div></div>
      
      <div class="profile-main">
        <img src="https://i.pravatar.cc/150?img=12" class="profile-pic">
        <h1 class="title-gold">وكالة السبع السوري</h1>
        <p>مرحباً بكم في غرفة دردشة Honey Jar! 🎉</p>
      </div>

      <div class="mic-seats" id="seats"></div>

      <div class="chat-box" id="chatBox">
        <div class="msg"><span class="user">النظام:</span> أهلاً فيك بغرفة السبع الحلبي 🔥</div>
      </div>

      <div style="text-align:center; padding:0 20px 20px;">
        <input id="msgInput" placeholder="اكتب رسالة..." onkeypress="if(event.key==='Enter')sendMsg()">
        <button onclick="sendMsg()">ارسال</button>
      </div>

      <div class="bottom-nav">
        <div class="nav-item" onclick="location.href='/profile'">
          <span class="icon">👤</span>ملفي
        </div>
        <div class="nav-item" onclick="location.href='/chat'">
          <span class="icon">💬</span>الدردشة
        </div>
        <div class="nav-item active">
          <span class="icon">🎤</span>الغرفة
        </div>
        <div class="nav-item" onclick="location.href='/party'">
          <span class="icon">🎉</span>الحفلات
        </div>
        <div class="nav-item" onclick="location.href='/posts'">
          <span class="icon">🏠</span>المنشورات
        </div>
      </div>

      <script>
        const socket = io();
        let myUsername = 'زائر_' + Math.floor(Math.random() * 1000);
        
        socket.emit('login', myUsername);
        socket.emit('join_room', 'main');

        socket.on('users_count', (count) => {
          document.getElementById('onlineCount').innerText = count;
        });

        const seatsDiv = document.getElementById('seats');
        for(let i=1; i<=12; i++) {
          seatsDiv.innerHTML += \`
            <div class="seat \${i > 6 ? 'locked' : ''}" onclick="takeSeat(\${i})">
              <div class="plus">\${i > 6 ? '🔒' : '+'}</div>
              <div style="font-size:0.8rem;">مقعد \${i}</div>
            </div>\`;
        }

        function takeSeat(num) {
          if(num > 6) return alert('المقعد مقفل 🔒');
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

// قسم المنشورات
app.get('/posts', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html dir="rtl">
    <head>
      <title>المنشورات - السبع السوري</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="manifest" href="/manifest.json">
      <meta name="theme-color" content="#ff0080">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Cairo', sans-serif;
          background: #0f0f1e; color: #fff; padding-bottom: 80px;
        }
        .header {
          background: #1a1a2e; padding: 15px; text-align: center;
          font-size: 1.5rem; font-weight: 900; border-bottom: 1px solid #333;
        }
        .new-post {
          background: #1a1a2e; margin: 15px; padding: 15px; border-radius: 15px;
        }
        .post {
          background: #1a1a2e; margin: 15px; padding: 15px; border-radius: 15px;
        }
        .post-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
        .post-pic { width: 45px; height: 45px; border-radius: 50%; }
        .post-actions { display: flex; gap: 20px; margin-top: 10px; color: #888; }
        .post-actions span { cursor: pointer; }
        .bottom-nav {
          position: fixed; bottom: 0; width: 100%; background: #1a1a2e;
          display: flex; justify-content: space-around; padding: 12px 0;
          border-top: 1px solid #333;
        }
        .nav-item { text-align: center; color: #888; font-size: 0.8rem; cursor: pointer; }
        .nav-item.active { color: #ff0080; }
        .nav-item .icon { font-size: 1.5rem; display: block; }
        input, textarea, button {
          font-family: 'Cairo'; padding: 12px; margin: 5px 0; border-radius: 10px; border: none;
          width: 100%; background: #0f0f1e; color: #fff;
        }
        button { background: #ff0080; color: #fff; font-weight: bold; cursor: pointer; }
      </style>
    </head>
    <body>
      <div class="header">🏠 المنشورات</div>

      <div class="new-post">
        <textarea id="postText" rows="3" placeholder="شو عم تفكر يا سبع؟"></textarea>
        <button onclick="addPost()">انشر</button>
      </div>

      <div id="postsContainer">
        <div class="post">
          <div class="post-header">
            <img src="https://i.pravatar.cc/150?img=5" class="post-pic">
            <div>
              <div style="font-weight:bold;">أحمد الحلبي</div>
              <div style="font-size:0.8rem; color:#888;">منذ 5 دقائق</div>
            </div>
          </div>
          <p>يا جماعة وكالة السبع السوري ولعت 🔥 مين جاهز للحفلة اليوم؟</p>
          <div class="post-actions">
            <span onclick="like(this)">❤️ 12</span>
            <span>💬 3 تعليقات</span>
            <span>🔄 مشاركة</span>
          </div>
        </div>
      </div>

      <div class="bottom-nav">
        <div class="nav-item" onclick="location.href='/profile'">
          <span class="icon">👤</span>ملفي
        </div>
        <div class="nav-item" onclick="location.href='/chat'">
          <span class="icon">💬</span>الدردشة
        </div>
        <div class="nav-item" onclick="location.href='/'">
          <span class="icon">🎤</span>الغرفة
        </div>
        <div class="nav-item" onclick="location.href='/party'">
          <span class="icon">🎉</span>الحفلات
        </div>
        <div class="nav-item active">
          <span class="icon">🏠</span>المنشورات
        </div>
      </div>

      <script>
        function addPost() {
          const text = document.getElementById('postText').value;
          if(!text) return alert('اكتب شي اول');
          
          const postsDiv = document.getElementById('postsContainer');
          const newPost = \`
            <div class="post">
              <div class="post-header">
                <img src="https://i.pravatar.cc/150?img=12" class="post-pic">
                <div>
                  <div style="font-weight:bold;">أنت</div>
                  <div style="font-size:0.8rem; color:#888;">الآن</div>
                </div>
              </div>
              <p>\${text}</p>
              <div class="post-actions">
                <span onclick="like(this)">❤️ 0</span>
                <span>💬 0 تعليقات</span>
                <span>🔄 مشاركة</span>
              </div>
            </div>
          \`;
          postsDiv.innerHTML = newPost + postsDiv.innerHTML;
          document.getElementById('postText').value = '';
        }

        function like(el) {
          let count = parseInt(el.innerText.split(' ')[1]);
          el.innerHTML = '❤️ ' + (count + 1);
          el.style.color = '#ff0080';
        }
      </script>
    </body>
    </html>
  `)
})

// قسم الحفلات
app.get('/party', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html dir="rtl">
    <head>
      <title>الحفلات - السبع السوري</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="manifest" href="/manifest.json">
      <meta name="theme-color" content="#ff0080">
      <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Cairo', sans-serif;
          background: #0a0a0a; color: #fff; min-height: 100vh; 
          padding-bottom: 80px; overflow-x: hidden;
        }
        .live-header {
          background: linear-gradient(45deg, #ff0080, #8a2be2);
          padding: 20px; text-align: center; position: relative;
        }
        .live-badge {
          background: #ff0000; padding: 5px 15px; border-radius: 20px;
          font-weight: 900; animation: blink 1s infinite;
        }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.5} }
        .host-pic {
          width: 100px; height: 100px; border-radius: 50%;
          border: 4px solid #FFD700; box-shadow: 0 0 30px #FFD700;
          margin: 15px auto;
        }
        .title-gold {
          background: linear-gradient(45deg, #FFD700, #FFA500);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          font-size: 1.8rem; font-weight: 900;
        }
        .viewers { background: rgba(0,0,0,0.5); padding: 8px 15px; border-radius: 20px; display: inline-block; margin-top: 10px; }
        .gifts-bar {
          position: fixed; bottom: 80px; width: 100%; background: rgba(26,26,46,0.95);
          display: flex; justify-content: space-around; padding: 10px; z-index: 50;
        }
        .gift-btn {
          background: linear-gradient(145deg, #ff0080, #c2006b);
          border: none; border-radius: 15px; padding: 10px; color: #fff;
          font-size: 1.5rem; cursor: pointer; min-width: 60px;
        }
        .gift-btn:active { transform: scale(0.9); }
        .chat-box {
          background: rgba(0,0,0,0.4); margin: 15px; padding: 15px;
          border-radius: 15px; max-height: 250px; overflow-y: auto;
        }
        .msg { margin: 8px 0; text-align: right; }
        .msg .user { color: #00ff88; font-weight: bold; }
        .gift-animation {
          position: fixed; font-size: 3rem; z-index: 100;
          animation: flyUp 3s ease-out forwards; pointer-events: none;
        }
        @keyframes flyUp {
          0% { bottom: 100px; opacity: 1; transform: translateX(0) scale(1); }
          100% { bottom: 100vh; opacity: 0; transform: translateX(100px) scale(1.5); }
        }
        .bottom-nav {
          position: fixed; bottom: 0; width: 100%; background: #1a1a2e;
          display: flex; justify-content: space-around; padding: 12px 0;
          border-top: 1px solid #333; z-index: 100;
        }
        .nav-item { text-align: center; color: #888; font-size: 0.8rem; cursor: pointer; }
        .nav-item.active { color: #ff0080; }
        .nav-item .icon { font-size: 1.5rem; display: block; }
        input {
          font-family: 'Cairo'; padding: 12px; margin: 5px; border-radius: 10px; border: none;
          background: #1e293b; color: #fff; width: 70%;
        }
        button { background: #ff0080; color: #fff; font-weight: bold; cursor: pointer; border: none; padding: 12px; border-radius: 10px; }
      </style>
    </head>
    <body>
      <div class="live-header">
        <div class="live-badge">🔴 LIVE</div>
        <img src="https://i.pravatar.cc/150?img=32" class="host-pic">
        <h1 class="title-gold">حفلة السبع السوري</h1>
        <div class="viewers">👥 <span id="viewerCount">0</span> مشاهد</div>
      </div>

      <div class="chat-box" id="chatBox">
        <div class="msg"><span class="user">النظام:</span> أهلاً فيك بحفلة السبع 🔥</div>
      </div>

      <div style="text-align:center; padding:0 20px;">
        <input id="msgInput" placeholder="اكتب رسالة..." onkeypress="if(event.key==='Enter')sendMsg()">
        <button onclick="sendMsg()">ارسال</button>
      </div>

      <div class="gifts-bar">
        <button class="gift-btn" onclick="sendGift('🌹', 10)">🌹<br><small>10</small></button>
        <button class="gift-btn" onclick="sendGift('🚀', 50)">🚀<br><small>50</small></button>
        <button class="gift-btn" onclick="sendGift('👑', 100)">👑<br><small>100</small></button>
        <button class="gift-btn" onclick="sendGift('💎', 500)">💎<br><small>500</small></button>
        <button class="gift-btn" onclick="sendGift('🏆', 1000)">🏆<br><small>1000</small></button>
      </div>

      <div class="bottom-nav">
        <div class="nav-item" onclick="location.href='/profile'">
          <span class="icon">👤</span>ملفي
        </div>
        <div class="nav-item" onclick="location.href='/chat'">
          <span class="icon">💬</span>الدردشة
        </div>
        <div class="nav-item" onclick="location.href='/'">
          <span class="icon">🎤</span>الغرفة
        </div>
        <div class="nav-item active">
          <span class="icon">🎉</span>الحفلات
        </div>
        <div class="nav-item" onclick="location.href='/posts'">
          <span class="icon">🏠</span>المنشورات
        </div>
      </div>

      <script>
        const socket = io();
        let myUsername = 'زائر_' + Math.floor(Math.random() * 1000);
        
        socket.emit('login', myUsername);
        socket.emit('join_room', 'party');

        socket.on('users_count', (count) => {
          document.getElementById('viewerCount').innerText = count;
        });

        function sendMsg() {
          const msg = document.getElementById('msgInput').value;
          if(!msg) return;
          socket.emit('send_message', { room: 'party', message: msg });
          document.getElementById('msgInput').value = '';
        }

        function sendGift(emoji, points) {
          socket.emit('send_message', { 
            room: 'party', 
            message: \`أرسل هدية \${emoji} بقيمة \${points} نقطة\` 
          });
          showGiftAnimation(emoji);
        }

        function showGiftAnimation(emoji) {
          const gift = document.createElement('div');
          gift.className = 'gift-animation';
          gift.style.left = Math.random() * 80 + 10 + '%';
          gift.innerText = emoji;
          document.body.appendChild(gift);
          setTimeout(() => gift.remove(), 3000);
        }

        socket.on('new_message', (data) => {
          const chatBox = document.getElementById('chatBox');
          chatBox.innerHTML += \`<div class="msg"><span class="user">\${data.user}:</span> \${data.message}</div>\`;
          chatBox.scrollTop = chatBox.scrollHeight;
          
          if(data.message.includes('هدية')) {
            const emoji = data.message.match(/🌹|🚀|👑|💎|🏆/);
            if(emoji) showGiftAnimation(emoji[0]);
          }
        });
      </script>
    </body>
    </html>
  `)
})

// باقي الأقسام قريباً
app.get('/chat', (req, res) => res.send('<h1 style="color:white;background:#0f0f1e;padding:50px;text-align:center;font-family:Cairo;">قسم الدردشة - قريباً 💬</h1>'))
app.get('/profile', (req, res) => res.send('<h1 style="color:white;background:#0f0f1e;padding:50px;text-align:center;font-family:Cairo;">ملف الشخصي - قريباً 👤</h1>'))

app.get('/health', (req, res) => {
  res.json({ status: 'ok', users: Object.keys(onlineUsers).length, time: new Date() })
})

const PORT = process.env.PORT || 10000
httpServer.listen(PORT, () => console.log('Server on ' + PORT))
