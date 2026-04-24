const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

// Database setup
const db = new sqlite3.Database('./database.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    lastName TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    country TEXT NOT NULL,
    birthDate TEXT NOT NULL,
    age INTEGER NOT NULL,
    gender TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// Register route
app.post('/api/register', async (req, res) => {
  const { username, lastName, email, password, country, birthDate, age, gender } = req.body;

  if (!username ||!lastName ||!email ||!password ||!country ||!birthDate ||!age ||!gender) {
    return res.status(400).json({ error: 'كل الحقول مطلوبة' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    db.run(
      'INSERT INTO users (username, lastName, email, password, country, birthDate, age, gender) VALUES (?,?,?,?,?,?,?,?)',
      [username, lastName, email, hashedPassword, country, birthDate, age, gender],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE')) {
            return res.status(400).json({ error: 'الإيميل مستخدم من قبل' });
          }
          return res.status(500).json({ error: 'خطأ بالسيرفر' });
        }

        const token = jwt.sign({ userId: this.lastID }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, message: 'تم انشاء الحساب بنجاح' });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'خطأ بالسيرفر' });
  }
});

// Login route
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  if (!email ||!password) {
    return res.status(400).json({ error: 'الإيميل وكلمة السر مطلوبين' });
  }

  db.get('SELECT * FROM users WHERE email =?', [email], async (err, user) => {
    if (err) return res.status(500).json({ error: 'خطأ بالسيرفر' });
    if (!user) return res.status(400).json({ error: 'الإيميل او كلمة السر غلط' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'الإيميل او كلمة السر غلط' });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, message: 'تم تسجيل الدخول بنجاح' });
  });
});

// Get profile route
app.get('/api/profile', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'مطلوب توكن' });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'توكن غير صالح' });

    db.get('SELECT id, username, lastName, email, country, age, gender FROM users WHERE id =?', [decoded.userId], (err, user) => {
      if (err ||!user) return res.status(404).json({ error: 'المستخدم غير موجود' });
      res.json({ user });
    });
  });
});

// ===== الراوت الجديد تبع صفحة البروفايل =====
app.get('/me', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'me.html'));
});
// ===== نهاية الراوت الجديد =====

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
