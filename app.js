const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>وكالة السبع السوري</title>
  <link rel="manifest" href="data:application/json;base64,eyJuYW1lIjoi2YjYutiv2YrYqSDYp9mE2LPYqNmGINin2YTYudix2YjYp9mGIiwic2hvcnRfbmFtZSI6ItmI2KrZitmF2KfYqiIsInN0YXJ0X3VybCI6Ii8iLCJkaXNwbGF5Ijoic3RhbmRhbG9uZSIsImJhY2tncm91bmRfY29sb3IiOiIjMWUyOTNiIiwidGhlbWVfY29sb3IiOiIjMWUyOTNiIiwiaWNvbnMiOlt7InNyYyI6Imh0dHBzOi8vY2RuLWljb25zLXBuZy5mbGF0aWNvbi5jb20vNTEyLzU5NjgvNTk2ODc1Ni5wbmciLCJzaXplcyI6IjUxMng1MTIiLCJ0eXBlIjoiaW1hZ2UvcG5nIn1dfQ==">
  <meta name="theme-color" content="#1e293b">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; font-family:Tahoma }
    body { background:#1e293b; color:white; }
    .page { display:none; }
    #homePage { display:block; }
    input { width:100%; padding:12px; margin:8px 0; border-radius:8px; border:1px solid #ccc; background:#334155; color:white }
    button { cursor:pointer }
    .toast { position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:#16a34a; padding:12px 20px; border-radius:8px; z-index:9999 }
  </style>
</head>
<body>

  <!-- زر البروفايل -->
  <button onclick="showPage('profilePage')" style="position:fixed; top:10px; left:10px; padding:10px; border-radius:50%; background:#2196F3; color:white; border:none; font-size:20px; z-index:999">👤</button>

  <!-- الصفحة الرئيسية -->
  <div id="homePage" class="page">
    <div style="padding:20px; text-align:center">
      <h1>وكالة السبع السوري</h1>
      <div style="margin:30px 0">
        <button onclick="sit(1)" style="padding:15px 25px; margin:5px; background:#4CAF50; color:white; border:none; border-radius:8px">مقعد 1</button>
        <button onclick="sit(2)" style="padding:15px 25px; margin:5px; background:#4CAF50; color:white; border:none; border-radius:8px">مقعد 2</button>
        <button onclick="sit(3)" style="padding:15px 25px; margin:5px; background:#4CAF50; color:white; border:none; border-radius:8px">مقعد 3</button>
        <button onclick="sit(4)" style="padding:15px 25px; margin:5px; background:#4CAF50; color:white; border:none; border-radius:8px">مقعد 4</button>
      </div>
      <div id="playersList" style="background:#334155; padding:15px; border-radius:8px"></div>
    </div>
  </div>

  <!-- صفحة البروفايل -->
  <div id="profilePage" class="page">
    <div style="padding:20px; max-width:400px; margin:auto">
      <h2>👤 ملف الشخصي</h2>
      <div style="text-align:center; margin:20px 0">
        <img id="profileAvatar" src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" style="width:100px; height:100px; border-radius:50%; border:3px solid #4CAF50">
      </div>
      <label>اسمك باللعبة:</label>
      <input id="playerNameInput" type="text" placeholder="اكتب اسمك هون">
      <label>حالتك:</label>
      <input id="playerStatusInput" type="text" placeholder="اكتب حالة مثل: ملك الطاولة">
      <div style="background:#334155; padding:15px; border-radius:8px; margin:15px 0">
        <p><b>النقاط:</b> <span id="playerPoints">0</span> 🏆</p>
        <p><b>عدد الألعاب:</b> <span id="playerGames">0</span> 🎮</p>
        <p><b>نسبة الفوز:</b> <span id="playerWinRate">0%</span> 📊</p>
      </div>
      <button onclick="saveProfile()" style="width:100%; padding:14px; background:#4CAF50; color:white; border:none; border-radius:8px; font-size:16px">حفظ التغييرات 💾</button>
      <button onclick="showPage('homePage')" style="width:100%; padding:14px; background:#757575; color:white; border:none; border-radius:8px; font-size:16px; margin-top:10px">رجوع للرئيسية ⬅️</button>
    </div>
  </div>

  <script src="/socket.io/socket.io.js"></script>
  <script>
    const socket = io();
    
    // بيانات اللاعب
    let playerData = JSON.parse(localStorage.getItem('alsabeaPlayer')) || {
      name: 'زائر_' + Math.floor(Math.random() * 1000),
      status: 'لاعب جديد',
      points: 0, games: 0, wins: 0,
      avatar: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
    };

    // عرض صفحة
    function showPage(pageId) {
      document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
      document.getElementById(pageId).style.display = 'block';
      if(pageId === 'profilePage') loadProfile();
    }

    // تحميل البروفايل
    function loadProfile() {
      document.getElementById('playerNameInput').value = playerData.name;
      document.getElementById('playerStatusInput').value = playerData.status;
      document.getElementById('playerPoints').textContent = playerData.points;
      document.getElementById('playerGames').textContent = playerData.games;
      document.getElementById('playerWinRate').textContent = playerData.games ? Math.round(playerData.wins / playerData.games * 100) + '%' : '0%';
      document.getElementById('profileAvatar').src = playerData.avatar;
    }

    // حفظ البروفايل
    function saveProfile() {
      playerData.name = document.getElementById('playerNameInput').value || playerData.name;
      playerData.status = document.getElementById('playerStatusInput').value || playerData.status;
      localStorage.setItem('alsabeaPlayer', JSON.stringify(playerData));
      socket.emit('updatePlayerName', playerData.name);
      showToast('تم حفظ البروفايل بنجاح ✅');
      showPage('homePage');
    }

    // رسالة Toast
    function showToast(msg) {
      const toast = document.createElement('div');
      toast.className = 'toast';
      toast.textContent = msg;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    }

    // الجلوس على مقعد
    function sit(seat) {
      socket.emit('sit', { seat: seat, name: playerData.name });
    }

    // لما يتصل السوكيت
    socket.on('connect', () => {
      socket.emit('updatePlayerName', playerData.name);
    });

    // تحديث قائمة اللاعبين
    socket.on('playersUpdate', (players) => {
      const list = document.getElementById('playersList');
      list.innerHTML = '<h3>اللاعبين الحاليين:</h3>';
      players.forEach(p => {
        list.innerHTML += \`<p>\${p.name} - مقعد \${p.seat}</p>\`;
      });
    });

    // رسالة ترحيب
    socket.on('welcome', (msg) => {
      showToast(msg);
    });
  </script>
</body>
</html>
  `);
});

// كود السيرفر تبع السوكيت
let players = [];

io.on('connection', (socket) => {
  console.log('لاعب جديد دخل');
  
  socket.on('updatePlayerName', (name) => {
    socket.playerName = name;
  });

  socket.on('sit', (data) => {
    // شيل اللاعب من المقعد القديم اذا كان قاعد
    players = players.filter(p => p.id !== socket.id);
    // ضيفه على المقعد الجديد
    players.push({ id: socket.id, name: data.name, seat: data.seat });
    // ابعت للكل
    io.emit('playersUpdate', players);
    socket.emit('welcome', \`طلعت عالمقعد رقم \${data.seat} يا \${data.name}\`);
  });

  socket.on('disconnect', () => {
    players = players.filter(p => p.id !== socket.id);
    io.emit('playersUpdate', players);
    console.log('لاعب طلع');
  });
});

http.listen(port, () => {
  console.log(\`السيرفر شغال على بورت \${port}\`);
});
