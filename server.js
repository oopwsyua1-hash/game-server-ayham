const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');

const app = express();

// اهم سطر عشان الموبايل يشتغل
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// اتصال قاعدة البيانات
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.log('MongoDB Error:', err));

// موديل المستخدم
const User = mongoose.model('User', new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
}));

// Middleware للتحقق من التوكن
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ msg: 'No token' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token invalid' });
  }
};

// تسجيل حساب جديد
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ msg: 'عبي كل الحقول' });
    
    if (await User.findOne({ username })) return res.status(400).json({ msg: 'اسم المستخدم موجود' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();

    const token = jwt.sign({ user: { id: user.id } }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, msg: 'تم التسجيل بنجاح' });
  } catch (err) {
    res.status(500).json({ msg: 'خطأ سيرفر: ' + err.message });
  }
});

// تسجيل دخول
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ msg: 'بيانات الدخول غلط' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'بيانات الدخول غلط' });

    const token = jwt.sign({ user: { id: user.id } }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, msg: 'تم الدخول بنجاح' });
  } catch (err) {
    res.status(500).json({ msg: 'خطأ سيرفر: ' + err.message });
  }
});

// جلب بيانات المستخدم
app.get('/api/auth/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: 'خطأ سيرفر' });
  }
});

// الصفحة الرئيسية
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server running on ${PORT}`));
