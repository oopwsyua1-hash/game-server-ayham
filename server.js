const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'ayham-secret-key-2024';

// Middleware الشامل
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// الاتصال بقاعدة البيانات
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ إمبراطورية السبع متصلة بقاعدة البيانات'))
  .catch(err => console.log('❌ خطأ اتصال:', err));

// --- [ الموديلات المدمجة من GitHub ] ---

// 1. موديل المستخدم (User)
const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    lastName: String,
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    country: String,
    age: Number,
    gender: String,
    coins: { type: Number, default: 50000 },
    role: { type: String, default: 'user' }, // user, admin, agent
    vip: { type: Number, default: 0 },
    bio: { type: String, default: 'أهلاً بك في إمبراطورية السبع' },
    agencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency' }
});
const User = mongoose.model('User', userSchema);

// 2. موديل الوكالة (Agency) - مدمج من ملف Agency.js بالصور
const agencySchema = new mongoose.Schema({
    name: { type: String, required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    level: { type: Number, default: 1 }
});
const Agency = mongoose.model('Agency', agencySchema);

// --- [ الأكواد المدمجة (APIs) ] ---

// تسجيل ودخول (موحد لكل الصفحات)
app.post(['/api/register', '/api/auth/register'], async (req, res) => {
    try {
        const { username, password, email, lastName, country, age, gender } = req.body;
        const hash = await bcrypt.hash(password, 10);
        const user = await User.create({ username, password: hash, email, lastName, country, age, gender });
        const token = jwt.sign({ userId: user._id }, JWT_SECRET);
        res.json({ token, msg: 'تم إنشاء حساب السبع ✅' });
    } catch (e) { res.status(400).json({ error: 'الحساب موجود أو البيانات ناقصة' }); }
});

app.post(['/api/login', '/api/auth/login'], async (req, res) => {
    try {
        const { email, username, password } = req.body;
        const user = await User.findOne({ $or: [{ email }, { username }] });
        if (!user || !(await bcrypt.compare(password, user.password))) 
            return res.status(401).json({ error: 'بيانات الدخول غلط' });
        const token = jwt.sign({ userId: user._id }, JWT_SECRET);
        res.json({ token, user });
    } catch (e) { res.status(500).json({ error: 'خطأ سيرفر' }); }
});

// جلب البيانات (لصفحة me.html و profile.js)
app.get(['/api/me', '/api/profile'], async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId).populate('agencyId').select('-password');
        const userData = user.toObject();
        userData.userId = user._id.toString().slice(-6); // الـ ID اللي بتحبه الصفحة
        res.json(userData);
    } catch (e) { res.status(401).json({ error: 'غير مصرح' }); }
});

// --- [ نظام الغرف (Socket.io) ] ---
io.on('connection', (socket) => {
    console.log('👤 مستخدم دخل الإمبراطورية');
    socket.on('joinRoom', (roomId) => { socket.join(roomId); });
    socket.on('sendMessage', (data) => { io.to(data.roomId).emit('newMessage', data); });
});

// --- [ ربط الصفحات (Static Routes) ] ---
// هاد الجزء بيربط كل الملفات اللي شفتها بالصور
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.get('/agency', (req, res) => res.sendFile(path.join(__dirname, 'public', 'agency.html')));
app.get('/me', (req, res) => res.sendFile(path.join(__dirname, 'public', 'me.html')));

server.listen(PORT, () => {
    console.log(`🚀 السيرفر المدمج شغال يا أبو نمر: https://game-server-ayham.onrender.com`);
});
