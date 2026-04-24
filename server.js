const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

const JWT_SECRET = process.env.JWT_SECRET || 'sabe3_super_secret_key_12345';

mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('MongoDB Connected - السيرفر شغال'))
.catch(err => console.log('MongoDB Error:', err));

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    lastName: { type: String, default: '' },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    country: { type: String, default: '' },
    birthDate: { type: String, default: '' },
    age: { type: Number, default: 0 },
    gender: { type: String, default: '' },
    points: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    games: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    rank: { type: String, default: 'مبتدئ' },
    profilePic: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
    lastSeen: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

function authMiddleware(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'مافي توكن' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        res.status(401).json({ message: 'توكن غلط' });
    }
}

app.post('/api/register', async (req, res) => {
    const { username, lastName, email, password, country, birthDate, age, gender } = req.body;

    if (!username ||!email ||!password) {
        return res.status(400).json({ message: 'الاسم والإيميل وكلمة السر مطلوبين' });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'الإيميل مستخدم من قبل' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            username,
            lastName: lastName || '',
            email,
            password: hashedPassword,
            country: country || '',
            birthDate: birthDate || '',
            age: age || 0,
            gender: gender || ''
        });

        await user.save();
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, message: 'تم انشاء الحساب بنجاح' });

    } catch (error) {
        console.log('Register Error:', error);
        res.status(500).json({ message: 'خطأ بالسيرفر' });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email ||!password) {
        return res.status(400).json({ message: 'الإيميل وكلمة السر مطلوبين' });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'الإيميل او كلمة السر غلط' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ message: 'الإيميل او كلمة السر غلط' });
        }

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, message: 'تم تسجيل الدخول بنجاح' });

    } catch (error) {
        console.log('Login Error:', error);
        res.status(500).json({ message: 'خطأ بالسيرفر' });
    }
});

app.get('/api/profile', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: 'اليوزر مو موجود' });
        }

        user.lastSeen = new Date();
        await user.save();

        res.json({
            username: user.username,
            lastName: user.lastName,
            email: user.email,
            country: user.country,
            age: user.age,
            gender: user.gender,
            points: user.points,
            wins: user.wins,
            games: user.games,
            level: user.level,
            rank: user.rank,
            profilePic: user.profilePic,
            createdAt: user.createdAt,
            lastSeen: user.lastSeen
        });

    } catch (error) {
        console.log('Profile Error:', error);
        res.status(500).json({ message: 'خطأ بالسيرفر' });
    }
});

app.get('/me', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'me.html'));
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
