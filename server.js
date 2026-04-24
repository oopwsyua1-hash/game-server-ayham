const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URL).then(() => {
    console.log('Connected to MongoDB ✅');
}).catch(err => {
    console.log('MongoDB Error:', err.message);
});

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    country: { type: String, required: true },
    birthDate: { type: Date, required: true },
    age: { type: Number, required: true },
    gender: { type: String, enum: ['male', 'female'], required: true },
    coins: { type: Number, default: 1000 },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

app.post('/api/register', async (req, res) => {
    try {
        const { username, lastName, email, password, country, birthDate, age, gender } = req.body;
        if (!username || !lastName || !email || !password || !country || !birthDate || !gender) {
            return res.status(400).json({ error: 'كل الحقول مطلوبة' });
        }
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) return res.status(400).json({ error: 'المستخدم او الإيميل موجود' });
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, lastName, email, password: hashedPassword, country, birthDate, age: parseInt(age), gender });
        await user.save();
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
        res.json({ token, user: { id: user._id, username: user.username, coins: user.coins } });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'خطأ بالسيرفر' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: 'المستخدم غير موجود' });
        const validPass = await bcrypt.compare(password, user.password);
        if (!validPass) return res.status(400).json({ error: 'كلمة السر غلط' });
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
        res.json({ token, user: { id: user._id, username: user.username, coins: user.coins } });
    } catch (error) {
        res.status(500).json({ error: 'خطأ بالسيرفر' });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`السيرفر شغال على ${PORT}`));
