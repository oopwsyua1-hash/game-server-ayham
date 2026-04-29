const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'ayham-secret-key-2024';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection
const mongoURI = process.env.MONGODB_URI;
if (!mongoURI) {
    console.log('❌ MONGODB_URI مو موجود بالـ Environment Variables');
    process.exit(1);
}

mongoose.connect(mongoURI)
  .then(() => console.log('✅ MongoDB Connected - إمبراطورية السبع V3 شغال'))
  .catch(err => {
       console.log('❌ MongoDB Error:', err.message);
       process.exit(1);
   });

// --- User Schema المعدل ليكون ملكي ---
const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    country: { type: String, required: true },
    birthDate: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, required: true },
    
    // إضافات إمبراطورية السبع V3 👑
    coins: { type: Number, default: 0 }, 
    diamonds: { type: Number, default: 0 }, 
    role: { type: String, default: 'USER' }, // USER, AGENT, MODERATOR, ADMIN, OWNER
    isVIP: { type: Boolean, default: false },
    vipType: { type: String, default: 'none' }, // gold, silver, crown
    supportPoints: { type: Number, default: 0 }, // لتسكير التارجت
    
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// --- APIs التسجيل والدخول ---
app.post('/api/register', async (req, res) => {
    try {
        const { username, lastName, email, password, country, birthDate, age, gender } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: 'الايميل مستخدم من قبل' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, lastName, email, password: hashedPassword, country, birthDate, age, gender });
        await newUser.save();

        const token = jwt.sign({ userId: newUser._id }, JWT_SECRET);
        res.json({ token, user: newUser });
    } catch (error) {
        res.status(500).json({ error: 'خطأ بالسيرفر' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ error: 'الايميل او كلمة السر غلط' });
        }
        const token = jwt.sign({ userId: user._id }, JWT_SECRET);
        res.json({ token, user });
    } catch (error) {
        res.status(500).json({ error: 'خطأ بالسيرفر' });
    }
});

// --- نظام الاتصالات (الشب يدفع والبنت مجاني) ---
app.post('/api/call/start', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (user.gender === 'male') {
            if (user.coins < 50) return res.status(400).json({ error: 'رصيدك ما بيكفي للمكالمة' });
            user.coins -= 50; 
            await user.save();
        }
        res.json({ success: true, balance: user.coins });
    } catch (error) {
        res.status(401).json({ error: 'خطأ في التصريح' });
    }
});

// --- نظام أعلى القمة (Leaderboard) ---
app.get('/api/leaderboard', async (req, res) => {
    try {
        const topUsers = await User.find().sort({ coins: -1 }).limit(10).select('username coins gender');
        res.json({ topUsers });
    } catch (error) {
        res.status(500).json({ error: 'خطأ بجلب البيانات' });
    }
});

// --- نظام سحب الرواتب (شام كاش) ---
app.post('/api/withdraw/sham-cash', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (user.supportPoints < 100000) return res.status(400).json({ error: 'ما وصلت للتارجت المطلوب للسحب' });
        
        // منطق السحب (إرسال إشعار للمالك أبو نمر)
        res.json({ success: true, message: 'طلب السحب قيد المعالجة للتحويل عبر شام كاش' });
    } catch (error) {
        res.status(401).json({ error: 'خطأ في التصريح' });
    }
});

// Routes الصفحات
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/me', (req, res) => res.sendFile(path.join(__dirname, 'public', 'me.html')));

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
