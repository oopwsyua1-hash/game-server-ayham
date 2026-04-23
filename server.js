const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('Connected to MongoDB ✅'))
.catch(err => console.error('MongoDB Error:', err));

// User Schema - كامل مع البروفايل
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  // حقول الملف الشخصي
  points: { type: Number, default: 0 },
  wins: { type: Number, default: 0 },
  games: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  profilePic: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  lastSeen: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const JWT_SECRET = process.env.JWT_SECRET || 'ayham_secret_2026';

// Middleware للتحقق من التوكن
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'مافي توكن' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'توكن غلط' });
  }
}

// Register
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username ||!email ||!password) {
      return res.status(400).json({ message: 'عبي كل الحقول' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'كلمة السر قصيرة' });
    }
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'الايميل او الاسم مستخدم' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      username,
      email,
      password: hashedPassword,
      points: 0,
      wins: 0,
      games: 0,
      level: 1
    });
    await user.save();
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ message: 'تم انشاء الحساب', token, username: user.username });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'خطأ بالسيرفر' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email ||!password) {
      return res.status(400).json({ message: 'عبي كل الحقول' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'الايميل غلط' });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'كلمة السر غلط' });
    }
    user.lastSeen = new Date();
    await user.save();
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ message: 'تم تسجيل الدخول', token, username: user.username });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'خطأ بالسيرفر' });
  }
});

// Profile Endpoint - جديد
app.get('/api/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'اليوزر مو موجود' });
    user.lastSeen = new Date();
    await user.save();
    res.json({
      username: user.username,
      email: user.email,
      points: user.points,
      wins: user.wins,
      games: user.games,
      level: user.level,
      profilePic: user.profilePic,
      createdAt: user.createdAt,
      lastSeen: user.lastSeen
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'خطأ بالسيرفر' });
  }
});

// رابط الصفحة الرئيسية
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// رابط صفحة البروفايل
app.get('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`السيرفر شغال على ${PORT}`);
});
