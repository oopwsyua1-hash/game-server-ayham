const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const { Server } = require('socket.io');
const http = require('http');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/alsebaa');

const UserSchema = new mongoose.Schema({
    userId: { type: Number, unique: true },
    username: String,
    lastName: String,
    email: { type: String, unique: true },
    password: String,
    country: String,
    birthDate: Date,
    age: Number,
    gender: String,
    bio: { type: String, default: '', maxlength: 60 },
    avatar: { type: String, default: '' },
    cover: { type: String, default: '' },
    coins: { type: Number, default: 0 },
    followers: { type: Number, default: 0 },
    following: { type: Number, default: 0 },
    friends: { type: Number, default: 0 },
    vip: { type: Number, default: 0 },
    wealthLevel: { type: Number, default: 0 },
    popularity: { type: Number, default: 0 },
    gmailLinked: { type: Boolean, default: false }
});

const CounterSchema = new mongoose.Schema({
    _id: String,
    seq: Number
});

const User = mongoose.model('User', UserSchema);
const Counter = mongoose.model('Counter', CounterSchema);

async function getNextUserId() {
    const counter = await Counter.findByIdAndUpdate(
        'userId',
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );
    return 100000 + counter.seq;
}

const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

const auth = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'ممنوع' });
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
        req.user = await User.findById(decoded.id);
        next();
    } catch {
        res.status(401).json({ error: 'توكن غلط' });
    }
};

app.post('/api/register', async (req, res) => {
    try {
        const { username, lastName, email, password, country, birthDate, age, gender } = req.body;
        if (await User.findOne({ email })) return res.status(400).json({ error: 'الايميل مستخدم' });
        
        const userId = await getNextUserId();
        const hashed = await bcrypt.hash(password, 10);
        
        const user = await User.create({
            userId, username, lastName, email, password: hashed,
            country, birthDate, age, gender
        });
        
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret123');
        res.json({ token, user });
    } catch (e) {
        res.status(500).json({ error: 'خطأ بالسيرفر' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !await bcrypt.compare(password, user.password)) {
            return res.status(400).json({ error: 'الايميل او كلمة السر غلط' });
        }
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret123');
        res.json({ token, user });
    } catch {
        res.status(500).json({ error: 'خطأ بالسيرفر' });
    }
});

app.get('/api/me', auth, (req, res) => {
    res.json(req.user);
});

app.put('/api/me', auth, async (req, res) => {
    const { username, lastName, country, birthDate, gender, bio } = req.body;
    const user = await User.findByIdAndUpdate(
        req.user._id,
        { username, lastName, country, birthDate, gender, bio },
        { new: true }
    );
    res.json(user);
});

app.post('/api/upload/avatar', auth, upload.single('file'), async (req, res) => {
    const user = await User.findByIdAndUpdate(req.user._id, { avatar: `/uploads/${req.file.filename}` }, { new: true });
    res.json(user);
});

app.post('/api/upload/cover', auth, upload.single('file'), async (req, res) => {
    const user = await User.findByIdAndUpdate(req.user._id, { cover: `/uploads/${req.file.filename}` }, { new: true });
    res.json(user);
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/me', (req, res) => res.sendFile(path.join(__dirname, 'public', 'me.html')));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`السبع شغال على ${PORT}`));
