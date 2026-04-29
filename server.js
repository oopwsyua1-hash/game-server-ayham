const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const http = require('http'); // إضافي لدعم السوكيت
const { Server } = require('socket.io'); // إضافي لدعم السوكيت
require('dotenv').config();

const app = express();
const server = http.createServer(app); // إنشاء السيرفر ليدعم HTTP و WebSockets
const io = new Server(server, { cors: { origin: "*" } });
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

// --- User Schema الملكي الشامل ---
const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    country: { type: String, required: true },
    birthDate: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, required: true },
    coins: { type: Number, default: 0 }, 
    diamonds: { type: Number, default: 0 }, 
    role: { type: String, default: 'USER' }, 
    isVIP: { type: Boolean, default: false },
    vipType: { type: String, default: 'none' }, 
    supportPoints: { type: Number, default: 0 }, 
    agencyId: { type: String, default: null },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// --- نظام حالة الغرف (مؤقت في الرام) ---
let roomsData = {
  'VIP-10000': {
    users: [],
    mics: Array(20).fill(null)
  }
};

// --- Socket.io Logic (التعامل المباشر مع الغرفة) ---
io.on('connection', (socket) => {
    socket.on('joinRoom', ({ roomId, token }) => {
        socket.join(roomId);
        // إضافة مستخدم للغرفة بشكل مبسط
        if(roomsData[roomId]) {
            roomsData[roomId].users.push(socket.id);
            io.to(roomId).emit('roomUpdate', roomsData[roomId]);
        }
    });

    socket.on('sendMessage', (data) => {
        // نرسل الرسالة لكل المتصلين في الغرفة
        io.to(data.roomId).emit('newMessage', {
            username: "عضو الإمبراطورية",
            text: data.text,
            level: "Lv.1",
            vip: 0
        });
    });

    socket.on('disconnect', () => {
        // تنظيف المستخدمين عند الخروج
        console.log('مستخدم غادر');
    });
});

// --- API الهدايا (المطلوب في كود الـ HTML) ---
app.get('/api/gifts', (req, res) => {
    const gifts = [
        { giftId: 'g1', name: 'أسد السبع', price: 500, animation: 'https://cdn-icons-png.flaticon.com/512/616/616412.png' },
        { giftId: 'g2', name: 'تاج ملكي', price: 1000, animation: 'https://cdn-icons-png.flaticon.com/512/2353/2353361.png' },
        { giftId: 'g3', name: 'سيارة VIP', price: 5000, animation: 'https://cdn-icons-png.flaticon.com/512/743/743007.png' }
    ];
    res.json(gifts);
});

// --- باقي الـ APIs (Register, Login, Withdraw, etc.) ---
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
    } catch (error) { res.status(500).json({ error: 'خطأ بالسيرفر' }); }
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
    } catch (error) { res.status(500).json({ error: 'خطأ بالسيرفر' }); }
});

app.post('/api/send-gift', async (req, res) => {
    try {
        const { senderId, receiverId, giftCost } = req.body;
        const sender = await User.findById(senderId);
        const receiver = await User.findById(receiverId);
        if (sender.coins < giftCost) return res.status(400).json({ error: 'الرصيد لا يكفي' });
        sender.coins -= giftCost;
        receiver.supportPoints += giftCost; 
        await sender.save();
        await receiver.save();
        res.json({ success: true, newBalance: sender.coins });
    } catch (error) { res.status(500).json({ error: 'خطأ في معالجة الهدية' }); }
});

// Routes الصفحات
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/room', (req, res) => res.sendFile(path.join(__dirname, 'public', 'room.html')));

// تشغيل السيرفر باستخدام server.listen وليس app.listen لدعم السوكيت
server.listen(PORT, () => console.log(`🚀 السيرفر الملكي شغال على بورت ${PORT}`));
