const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');

const app = express();

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Body:', req.body);
  next();
});

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Error:', err.message));

const User = mongoose.model('User', new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
}));

app.get('/test', (req, res) => {
  res.json({ msg: '100 شغال السيرفر' });
});

// راوت التسجيل
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ msg: 'عبي كل الحقول' });
    if (await User.findOne({ username })) return res.status(400).json({ msg: 'المستخدم موجود' });
    const hashedPassword = await bcrypt.hash(password, 10);
    await new User({ username, password: hashedPassword }).save();
    res.json({ msg: 'تم التسجيل بنجاح' });
  } catch (err) {
    console.error('REGISTER ERROR:', err);
    res.status(500).json({ msg: 'غلط سيرفر', error: err.message });
  }
});

// راوت تسجيل الدخول - هاد اللي ناقص عندك
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Login attempt:', username);
    if (!username || !password) return res.status(400).json({ msg: 'عبي كل الحقول' });
    
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ msg: 'المستخدم غير موجود' });
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'كلمة المرور غلط' });
    
    res.json({ msg: 'تم تسجيل الدخول بنجاح' });
  } catch (err) {
    console.error('LOGIN ERROR:', err);
    res.status(500).json({ msg: 'غلط سيرفر', error: err.message });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server running on ${PORT}`));
