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

const JWT_SECRET = process.env.JWT_SECRET || 'al-sabe7-secret-2026';

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/sabe7')
.then(() => console.log('MongoDB متصل'))
.catch(err => console.log('MongoDB Error:', err));

const UserSchema = new mongoose.Schema({
  username: String,
  lastName: String,
  email: { type: String, unique: true },
  password: String,
  country: String,
  birthDate: String,
  age: Number,
  gender: String,
  userId: { type: Number, unique: true },
  avatar: { type: String, default: '' },
  cover: { type: String, default: '' },
  bio: { type: String, default: 'اهلا بالعالم' },
  vip: { type: Number, default: 0 },
  followers: { type: Number, default: 0 },
  following: { type: Number, default: 0 },
  friends: { type: Number, default: 0 },
  wealthLevel: { type: Number, default: 0 },
  popularity: { type: Number, default: 0 },
  coins: { type: Number, default: 1000 },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);

// تسجيل حساب جديد
app.post('/api/register', async (req, res) => {
  try {
    const { username, lastName, email, password, country, birthDate, age, gender } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'الايميل مستخدم من قبل' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = Math.floor(100000 + Math.random() * 900000);

    const user = new User({ username, lastName, email, password: hashedPassword, country, birthDate, age, gender, userId });
    await user.save();

    const token = jwt.sign({ id: user._id }, JWT_SECRET);
    res.json({ token, user: { username, lastName, userId } });
  } catch (err) {
    res.status(500).json({ error: 'صار خطأ بالسيرفر' });
  }
});

// تسجيل دخول
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'الايميل او كلمة السر غلط' });

    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) return res.status(400).json({ error: 'الايميل او كلمة السر غلط' });

    const token = jwt.sign({ id: user._id }, JWT_SECRET);
    res.json({ token, user: { username: user.username, lastName: user.lastName, userId: user.userId } });
  } catch (err) {
    res.status(500).json({ error: 'صار خطأ بالسيرفر' });
  }
});

// جلب بيانات المستخدم
app.get('/api/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'غير مصرح' });

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(401).json({ error: 'توكن غير صالح' });
  }
});

// الصفحات
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/me', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'me.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`السبع شغال على ${PORT}`));
