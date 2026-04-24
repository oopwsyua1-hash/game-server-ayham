const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();

// 1. مهم جداً: CORS لازم هيك
app.use(cors({
  origin: true, // بقبل اي دومين، او حط دومين الفرونت تبعك
  credentials: true // هاد بخلي الكوكيز تشتغل
}));

app.use(express.json());
app.use(cookieParser());

// 2. اتصال MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.log(err));

// 3. سكيما اليوزر
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false }
});
const User = mongoose.model('User', UserSchema);

// 4. الـ Middleware تبع التوثيق
const authMiddleware = (req, res, next) => {
  console.log('التوكن اللي وصلني:', req.cookies.token); // للفحص
  
  const token = req.cookies.token;
  if (!token) {
    console.log('ما وصلني توكن ابداً');
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    console.log('التوكن غلط:', err.message);
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

// 5. راوت التسجيل
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    let user = await User.findOne({ username });
    if (user) return res.status(400).json({ msg: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({ username, password: hashedPassword });
    await user.save();

    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    // مهم جداً: اعدادات الكوكي الصح
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,       // لازم true لانو Render https
      sameSite: 'none',   // لازم none لانو الفرونت والباك منفصلين
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 ايام
    });

    res.json({ user: { id: user.id, username: user.username } });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// 6. راوت تسجيل الدخول
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    // نفس اعدادات الكوكي
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ user: { id: user.id, username: user.username } });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// 7. راوت جلب بيانات اليوزر
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// 8. راوت تسجيل الخروج
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: true,
    sameSite: 'none'
  });
  res.json({ msg: 'Logged out' });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
