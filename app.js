const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
const session = require('express-session');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const SUPABASE_URL = 'https://wqrnxlhhwoebmqtfirdr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indxcm54bGhod29lYm1xdGZpcmRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2MTgyNTcsImV4cCI6MjA5MjE5NDI1N30.9kZ-7fStYAKrYG5cFUyXUxLTncH8cJjmwP3OnDW8PJE';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'bigo-secret-ayham-2026',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    secure: false,
    httpOnly: true
  }
}));

app.use(express.static('public'));

function checkAuth(req, res, next) {
  if (req.session.userId) return next();
  res.redirect('/login.html');
}

app.get('/', checkAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/room', checkAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'room.html'));
});

app.post('/register', async (req, res) => {
  const { email, username, password } = req.body;
  if (!email ||!username ||!password) {
    return res.json({ success: false, message: 'عبي كل الحقول' });
  }
  if (password.length < 6) {
    return res.json({ success: false, message: 'كلمة السر لازم 6 احرف على الاقل' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const { data, error } = await supabase
  .from('users')
  .insert([{ email, username, password: hashedPassword }])
  .select();

    if (error) {
      return res.json({ success: false, message: 'الايميل مستخدم مسبقاً' });
    }

    req.session.userId = data[0].id;
    req.session.username = data[0].username;
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, message: 'خطأ بالسيرفر' });
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('email', email)
  .single();

    if (error ||!data) {
      return res.json({ success: false, message: 'الايميل غير موجود' });
    }

    const match = await bcrypt.compare(password, data.password);
    if (!match) {
      return res.json({ success: false, message: 'كلمة السر غلط' });
    }

    req.session.userId = data.id;
    req.session.username = data.username;
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, message: 'خطأ بالسيرفر' });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login.html');
});

app.get('/me', checkAuth, (req, res) => {
  res.json({ username: req.session.username, userId: req.session.userId });
});

io.on('connection', (socket) => {
  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).emit('user-connected', userId);

    socket.on('disconnect', () => {
      socket.to(roomId).emit('user-disconnected', userId);
    });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on ${PORT}`));
