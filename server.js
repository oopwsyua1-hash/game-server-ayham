const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.get('/me.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'me.html'));
});
app.use(express.static('public'));

// اتصال قاعدة البيانات
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('متصل بقاعدة البيانات'))
.catch(err => console.log('خطأ بقاعدة البيانات:', err));

// موديل المستخدم
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    country: { type: String, required: true },
    birthDate: { type: Date, required: true },
    age: { type: Number, required: true },
    gender: { type: String, required: true },
    followers: { type: Number, default: 0 },
    following: { type: Number, default: 0 },
    friends: { type: Number, default: 0 },
    isLinked: { type: Boolean, default: false },
    linkedGmail: String,
    linkedPhone: String,
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);

// Middleware التحقق من التوكن
const auth = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'غير مصرح' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch {
        res.status(401).json({ error: 'توكن غير صالح' });
    }
};

// ========== API Routes ==========

// تسجيل حساب جديد
app.post('/api/register', async (req, res) => {
    try {
        const { username, lastName, email, password, country, birthDate, age, gender } = req.body;

        // تحقق اذا المستخدم موجود
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ error: 'المستخدم او الايميل موجود' });
        }

        // تشفير كلمة السر
        const hashedPassword = await bcrypt.hash(password, 10);

        // انشاء مستخدم جديد
        const user = new User({
            username,
            lastName,
            email,
            password: hashedPassword,
            country,
            birthDate,
            age,
            gender
        });

        await user.save();

        // انشاء توكن
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

        res.json({
            token,
            user: {
                _id: user._id,
                username: user.username,
                lastName: user.lastName,
                email: user.email
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'خطأ بالسيرفر' });
    }
});

// تسجيل دخول
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // البحث عن المستخدم
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'الإيميل او كلمة السر غلط' });
        }

        // تحقق كلمة السر
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ error: 'الإيميل او كلمة السر غلط' });
        }

        // انشاء توكن
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

        res.json({
            token,
            user: {
                _id: user._id,
                username: user.username,
                lastName: user.lastName,
                email: user.email
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'خطأ بالسيرفر' });
    }
});

// جلب بيانات المستخدم الحالي
app.get('/api/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'خطأ بالسيرفر' });
    }
});

// تحديث البروفايل
app.put('/api/update-profile', auth, async (req, res) => {
    try {
        const { username, lastName, country } = req.body;
        const user = await User.findByIdAndUpdate(
            req.userId,
            { username, lastName, country },
            { new: true }
        ).select('-password');
        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ error: 'خطأ بالسيرفر' });
    }
});

// صفحة البداية
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// تشغيل السيرفر
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`السيرفر شغال على بورت ${PORT}`);
});
