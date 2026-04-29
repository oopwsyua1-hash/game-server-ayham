const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());
app.use(express.static('public')); // هذا السطر يربط كل ملفات الـ HTML والـ JS تلقائياً

// إعدادات البيئة
const JWT_SECRET = process.env.JWT_SECRET || 'lion_secret_key';
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(() => console.log('اتصلنا بقاعدة بيانات السبع 🔥'))
  .catch(err => console.error('فشل الاتصال:', err));

// موديل المستخدم (يدعم كل البيانات اللي في صفحتك)
const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  email: String,
  lastName: String,
  country: String,
  age: Number,
  gender: String,
  coins: { type: Number, default: 50000 },
  role: { type: String, default: 'user' }
});
const User = mongoose.model('User', UserSchema);

// ===== ميكانيكية الربط الذكي لكل المسارات =====

// دعم مسار التسجيل (سواء بـ /api أو بدونها ليرتبط بكل النسخ)
const handleRegister = async (req, res) => {
  try {
    const { username, password, email, lastName, country, age, gender } = req.body;
    const exists = await User.findOne({ username });
    if(exists) return res.status(400).json({ msg: 'الاسم محجوز' });
    
    const hash = await bcrypt.hash(password, 10);
    const newUser = await User.create({ username, password: hash, email, lastName, country, age, gender });
    
    const token = jwt.sign({ id: newUser._id }, JWT_SECRET);
    res.json({ msg: 'تم إنشاء الحساب بنجاح ✅', token });
  } catch(e) { res.status(500).json({ msg: 'خطأ بالسيرفر' }); }
};

app.post('/register', handleRegister);
app.post('/api/register', handleRegister); // دعم طلبات صفحة الـ HTML القديمة والجديدة

// دعم مسار تسجيل الدخول (Username أو Email)
const handleLogin = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const identifier = username || email; // يربط مع أي حقل إدخال
    const user = await User.findOne({ $or: [{ username: identifier }, { email: identifier }] });
    
    if(!user) return res.status(404).json({ msg: 'المستخدم غير موجود' });
    const match = await bcrypt.compare(password, user.password);
    if(!match) return res.status(401).json({ msg: 'كلمة السر غلط' });
    
    const token = jwt.sign({ id: user._id }, JWT_SECRET);
    res.json({ token, user, msg: 'أهلاً بك في إمبراطورية السبع' });
  } catch(e) { res.status(500).json({ msg: 'خطأ في الدخول' }); }
};

app.post('/login', handleLogin);
app.post('/api/login', handleLogin);

// مسار جلب البيانات للبروفايل والرومات
app.get(['/api/user/profile', '/profile-data'], async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    res.json(user);
  } catch (e) { res.status(401).json({ msg: 'سجل دخول' }); }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`السيرفر جاهز للربط على منفذ ${PORT} 👑`));
