const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');

const app = express();

// 1. اطبع كل طلب بيجي عالسيرفر
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  next();
});

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 2. اتصال قاعدة البيانات مع طباعة الغلط
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected Successfully'))
  .catch(err => console.error('❌ MongoDB Error:', err.message));

const User = mongoose.model('User', new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
}));

// 3. راوت تيست عشان نشوف اذا السيرفر صاحي
app.get('/test', (req, res) => {
  console.log('Test route hit');
  res.json({ msg: 'السيرفر شغال 100%', time: new Date() });
});

// 4. تسجيل حساب مع طباعة كل الغلط
app.post('/api/auth/register', async (req, res) => {
  console.log('=== Register Request Started ===');
  try {
    const { username, password } = req.body;
    console.log('Username:', username, 'Password Length:', password?.length);
    
    if (!username || !password) {
      console.log('Error: Missing fields');
      return res.status(400).json({ msg: 'عبي كل الحقول', error: 'missing_fields' });
    }
    
    const existingUser = await User.findOne({ username });
    console.log('Existing user check:', existingUser ? 'Found' : 'Not found');
    
    if (existingUser) {
      return res.status(400).json({ msg: 'اسم المستخدم موجود', error: 'user_exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Password hashed');
    
    const user = new User({ username, password: hashedPassword });
    await user.save();
    console.log('User saved to DB:', user._id);
    
    res.json({ msg: 'تم التسجيل بنجاح', userId: user._id });
    console.log('=== Register Success ===');
    
  } catch (err) {
    console.error('❌ REGISTER CRASH:', err.message);
    console.error('Full Error:', err);
    res.status(500).json({ 
      msg: 'غلط سيرفر', 
      error: err.message, // هاد اهم شي - رح يبين بالمتصفح
      stack: err.stack 
    });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// 5. امسك اي غلط تاني ما توقعناه
app.use((err, req, res, next) => {
  console.error('❌ UNHANDLED ERROR:', err);
  res.status(500).json({ msg: 'غلط غير متوقع', error: err.message });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server running on ${PORT}`));
