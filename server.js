const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// الاتصال بـ MongoDB - مربوط على MONGO_URL تبعك ✅
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log('Connected to MongoDB ✅'))
  .catch(err => console.error('MongoDB Error:', err));

// سكيما المستخدم
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  points: { type: Number, default: 0 },
  wins: { type: Number, default: 0 },
  games: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now },
  lastSeen: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);

// Middleware التحقق من التوكن
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'مطلوب تسجيل دخول' });
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: 'المستخدم غير موجود' });
    
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'توكن غير صالح' });
  }
};

// API: تسجيل حساب جديد
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'عبي كل الحقول' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ message: 'كلمة السر قصيرة' });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'الإيميل أو اسم المستخدم موجود' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    
    res.status(201).json({
      token,
      username: user.username,
      message: 'تم انشاء الحساب'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'خطأ بالسيرفر' });
  }
});

// API: تسجيل دخول
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'الإيميل أو كلمة السر غلط' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'الإيميل أو كلمة السر غلط' });
    }

    user.lastSeen = new Date();
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    
    res.json({
      token,
      username: user.username,
      message: 'تم تسجيل الدخول'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'خطأ بالسيرفر' });
  }
});

// API: جلب بيانات البروفايل
app.get('/api/profile', auth, async (req, res) => {
  try {
    const user = req.user;
    res.json({
      username: user.username,
      email: user.email,
      points: user.points,
      wins: user.wins,
      games: user.games,
      level: user.level,
      memberSince: user.createdAt,
      lastSeen: user.lastSeen
    });
  } catch (error) {
    res.status(500).json({ message: 'خطأ بالسيرفر' });
  }
});

// API: تحديث النقاط بعد اللعب
app.post('/api/update-stats', auth, async (req, res) => {
  try {
    const { points, won } = req.body;
    const user = req.user;
    
    user.points += points || 0;
    user.games += 1;
    if (won) user.wins += 1;
    user.level = Math.floor(user.points / 100) + 1;
    
    await user.save();
    
    res.json({
      points: user.points,
      wins: user.wins,
      games: user.games,
      level: user.level
    });
  } catch (error) {
    res.status(500).json({ message: 'خطأ بالسيرفر' });
  }
});

// صفحة البروفايل
app.get('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

// الصفحة الرئيسية
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`السيرفر شغال على ${PORT}`);
});
