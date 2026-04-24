const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 10000;
const JWT_SECRET = 'ayham-secret-key-2024';

// اعمل مجلد للصور اذا مو موجود
if (!fs.existsSync('./public/uploads')) {
  fs.mkdirSync('./public/uploads', { recursive: true });
}

// اعدادات رفع الصور
const storage = multer.diskStorage({
  destination: './public/uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI;
if (!mongoURI) {
  console.log('❌ MONGODB_URI مو موجود');
  process.exit(1);
}
mongoose.connect(mongoURI)
 .then(() => console.log('✅ MongoDB Connected'))
 .catch(err => {
    console.log('❌ MongoDB Error:', err.message);
    process.exit(1);
  });

const userSchema = new mongoose.Schema({
  userId: { type: Number, unique: true },
  username: { type: String, required: true },
  lastName: { type: String, default: '' },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  country: { type: String, default: 'غير محدد' },
  birthDate: { type: String, default: '' },
  age: { type: Number, default: 0 },
  gender: { type: String, default: 'غير محدد' },
  avatar: { type: String, default: '' }, // صورة شخصية
  cover: { type: String, default: '' }, // صورة غلاف
  coins: { type: Number, default: 0 }, // رصيد مركز الوكيل
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

// Middleware عشان نتأكد من التوكن
const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'مافي توكن' });
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'توكن غلط او منتهي' });
  }
};

app.post('/api/register', async (req, res) => {
  try {
    let { username, lastName, email, password, country, birthDate, age, gender } = req.body;
    if (!age && birthDate) age = new Date().getFullYear() - new Date(birthDate).getFullYear();
    if (!username ||!email ||!password) return res.status(400).json({ error: 'اسم المستخدم والايميل وكلمة السر مطلوبين' });
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'الايميل مستخدم من قبل' });
    const lastUser = await User.findOne().sort({ userId: -1 });
    const newId = lastUser? lastUser.userId + 1 : 100000;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ userId: newId, username, lastName: lastName || '', email, password: hashedPassword, country: country || 'غير محدد', birthDate: birthDate || '', age: age || 0, gender: gender || 'غير محدد' });
    await newUser.save();
    const token = jwt.sign({ userId: newUser._id }, JWT_SECRET);
    res.json({ success: true, msg: 'تم التسجيل بنجاح', token, user: { userId: newId, username, lastName, email, country, age, gender, avatar: '', cover: '', coins: 0 } });
  } catch (error) {
    res.status(500).json({ error: 'خطأ بالسيرفر', details: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email ||!password) return res.status(400).json({ error: 'عبي الايميل وكلمة السر' });
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'الايميل او كلمة السر غلط' });
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) return res.status(400).json({ error: 'الايميل او كلمة السر غلط' });
    const token = jwt.sign({ userId: user._id }, JWT_SECRET);
    res.json({ success: true, msg: 'تم تسجيل الدخول بنجاح', token, user: { userId: user.userId, username: user.username, lastName: user.lastName, email: user.email, country: user.country, age: user.age, gender: user.gender, avatar: user.avatar, cover: user.cover, coins: user.coins } });
  } catch (error) {
    res.status(500).json({ error: 'خطأ بالسيرفر', details: error.message });
  }
});

app.get('/api/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ error: 'اليوزر مو موجود' });
    res.json({ user });
  } catch (error) {
    res.status(401).json({ error: 'توكن غلط او منتهي' });
  }
});

// تعديل الملف الشخصي
app.put('/api/profile', auth, async (req, res) => {
  try {
    const { username, lastName, country, birthDate, gender } = req.body;
    const user = await User.findByIdAndUpdate(req.userId, { username, lastName, country, birthDate, gender }, { new: true }).select('-password');
    res.json({ success: true, msg: 'تم التعديل', user });
  } catch (error) {
    res.status(500).json({ error: 'خطأ بالتعديل' });
  }
});

// رفع صورة شخصية
app.post('/api/upload-avatar', auth, upload.single('avatar'), async (req, res) => {
  try {
    const avatarPath = '/uploads/' + req.file.filename;
    const user = await User.findByIdAndUpdate(req.userId, { avatar: avatarPath }, { new: true }).select('-password');
    res.json({ success: true, msg: 'تم رفع الصورة', avatar: avatarPath, user });
  } catch (error) {
    res.status(500).json({ error: 'خطأ برفع الصورة' });
  }
});

// رفع صورة غلاف
app.post('/api/upload-cover', auth, upload.single('cover'), async (req, res) => {
  try {
    const coverPath = '/uploads/' + req.file.filename;
    const user = await User.findByIdAndUpdate(req.userId, { cover: coverPath }, { new: true }).select('-password');
    res.json({ success: true, msg: 'تم رفع الغلاف', cover: coverPath, user });
  } catch (error) {
    res.status(500).json({ error: 'خطأ برفع الغلاف' });
  }
});

// مركز الوكيل - سحب
app.post('/api/withdraw', auth, async (req, res) => {
  try {
    const { amount } = req.body;
    const user = await User.findById(req.userId);
    if (user.coins < amount) return res.status(400).json({ error: 'رصيدك ما بيكفي' });
    user.coins -= amount;
    await user.save();
    res.json({ success: true, msg: 'تم السحب', coins: user.coins });
  } catch (error) {
    res.status(500).json({ error: 'خطأ بالسحب' });
  }
});

app.get('/api/random-user', async (req, res) => {
  try {
    const count = await User.countDocuments();
    if (count === 0) return res.json({ username: 'لا يوجد مستخدمين', userId: 0 });
    const random = Math.floor(Math.random() * count);
    const user = await User.findOne().skip(random).select('username userId');
    res.json({ username: user.username, userId: user.userId });
  } catch (error) {
    res.status(500).json({ error: 'خطأ بالسيرفر' });
  }
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/me', (req, res) => res.sendFile(path.join(__dirname, 'public', 'me.html')));
app.get('/agent', (req, res) => res.sendFile(path.join(__dirname, 'public', 'agent.html')));

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
