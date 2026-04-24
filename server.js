const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => console.log('❌ MongoDB Error:', err));

// User Schema الجديد كامل مع كل الحقول
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    lastName: { type: String, default: '' },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    country: { type: String, default: '' },
    birthDate: { type: String, default: '' },
    age: { type: Number, default: 0 },
    gender: { type: String, default: '' },

    // احصائيات Bigo - كلها صفر بالبداية
    followers: { type: Number, default: 0 },
    following: { type: Number, default: 0 },
    friends: { type: Number, default: 0 },
    visitors: { type: Number, default: 0 },
    coins: { type: Number, default: 0 },
    beans: { type: Number, default: 0 },
    vipLevel: { type: Number, default: 0 },
    wealthLevel: { type: Number, default: 0 },
    profilePercent: { type: Number, default: 0 },

    // صور ومعلومات
    profilePic: { type: String, default: '' },
    coverPic: { type: String, default: '' },
    bio: { type: String, default: '' },
    clubName: { type: String, default: '' },
    location: { type: String, default: '' },
    isOnline: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },

    // احصائيات اللعبة القديمة
    points: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    games: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    rank: { type: String, default: 'مبتدئ' },
    createdAt: { type: Date, default: Date.now },
    lastSeen: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Auth Middleware
function authMiddleware(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'ما في توكن' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'التوكن غلط' });
        }
        req.userId = decoded.userId;
        next();
    });
}

// Register
app.post('/api/register', async (req, res) => {
    try {
        const { username, lastName, email, password, country, birthDate, age, gender } = req.body;

        if (!username ||!email ||!password) {
            return res.status(400).json({ message: 'املأ كل الحقول المطلوبة' });
        }

        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ message: 'الايميل او اسم المستخدم موجود' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            username,
            lastName,
            email,
            password: hashedPassword,
            country,
            birthDate,
            age,
            gender
        });

        await newUser.save();

        const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            message: 'تم التسجيل بنجاح',
            token,
            user: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email
            }
        });

    } catch (error) {
        console.log('Register Error:', error);
        res.status(500).json({ message: 'خطأ بالسيرفر' });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email ||!password) {
            return res.status(400).json({ message: 'املأ كل الحقول' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'الايميل غلط' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'كلمة السر غلط' });
        }

        user.lastSeen = new Date();
        await user.save();

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({
            message: 'تم تسجيل الدخول',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });

    } catch (error) {
        console.log('Login Error:', error);
        res.status(500).json({ message: 'خطأ بالسيرفر' });
    }
});

// Get Profile
app.get('/api/profile', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ message: 'اليوزر مو موجود' });

        user.lastSeen = new Date();
        await user.save();

        res.json(user);

    } catch (error) {
        console.log('Profile Error:', error);
        res.status(500).json({ message: 'خطأ بالسيرفر' });
    }
});

// Update Profile - عشان صفحة التعديل
app.put('/api/update-profile', authMiddleware, async (req, res) => {
    try {
        const { bio, location, clubName } = req.body;

        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ message: 'اليوزر مو موجود' });

        if (bio!== undefined) user.bio = bio;
        if (location!== undefined) user.location = location;
        if (clubName!== undefined) user.clubName = clubName;

        // حساب نسبة اكتمال البروفايل
        let percent = 0;
        if (user.username) percent += 20;
        if (user.profilePic) percent += 20;
        if (user.coverPic) percent += 20;
        if (user.bio) percent += 20;
        if (user.location) percent += 20;
        user.profilePercent = percent;

        await user.save();
        res.json({ message: 'تم التحديث', user });

    } catch (error) {
        console.log('Update Error:', error);
        res.status(500).json({ message: 'خطأ بالسيرفر' });
    }
});

// Routes للصفحات
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.get('/me', (req, res) => {
    res.sendFile(__dirname + '/public/me.html');
});

app.get('/edit-profile', (req, res) => {
    res.sendFile(__dirname + '/public/edit-profile.html');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
