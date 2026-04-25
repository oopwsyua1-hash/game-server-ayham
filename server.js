const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();

const JWT_SECRET = 'secret_key_12345';

app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

mongoose.connect('mongodb://localhost:27017/mychat', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const Counter = mongoose.model('Counter', new mongoose.Schema({
  _id: String,
  seq: { type: Number, default: 1000000 }
}));

async function getNextUserId() {
  const counter = await Counter.findByIdAndUpdate(
    'userId',
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
}

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: String,
  cover: String,
  bio: { type: String, maxlength: 60 },
  lastName: String,
  country: String,
  birthDate: String,
  gender: String,
  userId: { type: Number, unique: true },
  coins: { type: Number, default: 0 },
  isAdmin: { type: Boolean, default: false }
});

const User = mongoose.model('User', userSchema);

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'مطلوب تسجيل الدخول' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ error: 'توكن غير صالح' });
  }
}

app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username ||!password) return res.status(400).json({ error: 'مطلوب اسم وكلمة مرور' });
  if (await User.findOne({ username })) return res.status(400).json({ error: 'الاسم موجود' });
  const hashed = await bcrypt.hash(password, 10);
  const userId = await getNextUserId();
  const user = new User({ username, password: hashed, userId });
  await user.save();
  const token = jwt.sign({ userId: user._id }, JWT_SECRET);
  res.json({ success: true, token, user: { username, userId } });
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user ||!(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'بيانات خاطئة' });
  }
  if (!user.userId) {
    user.userId = await getNextUserId();
    await user.save();
  }
  const token = jwt.sign({ userId: user._id }, JWT_SECRET);
  res.json({ success: true, token, user: { username: user.username, userId: user.userId } });
});

app.get('/api/profile', authenticate, async (req, res) => {
  const user = await User.findById(req.userId).select('-password');
  res.json({ user });
});

app.put('/api/profile', authenticate, async (req, res) => {
  const { username, lastName, country, birthDate, gender, bio } = req.body;
  try {
    const user = await User.findById(req.userId);
    if (username) user.username = username;
    if (lastName!== undefined) user.lastName = lastName;
    if (country!== undefined) user.country = country;
    if (birthDate!== undefined) user.birthDate = birthDate;
    if (gender!== undefined) user.gender = gender;
    if (bio!== undefined) user.bio = bio.substring(0, 60);
    await user.save();
    res.json({ success: true, msg: 'تم التعديل بنجاح' });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في التحديث' });
  }
});

app.post('/api/upload-avatar', authenticate, upload.single('avatar'), async (req, res) => {
  const user = await User.findById(req.userId);
  user.avatar = '/uploads/' + req.file.filename;
  await user.save();
  res.json({ success: true, avatar: user.avatar });
});

app.post('/api/upload-cover', authenticate, upload.single('cover'), async (req, res) => {
  const user = await User.findById(req.userId);
  user.cover = '/uploads/' + req.file.filename;
  await user.save();
  res.json({ success: true, cover: user.cover });
});

app.get('/api/random-user', async (req, res) => {
  const users = await User.find({ username: { $ne: 'admin' } });
  const random = users[Math.floor(Math.random() * users.length)];
  res.json({ username: random?.username || 'مستخدم جديد' });
});

app.get('/', (req, res) => res.sendFile(__dirname + '/public/login.html'));
app.get('/me', (req, res) => res.sendFile(__dirname + '/public/me.html'));

app.listen(3000, () => console.log('Server running on port 3000'));
