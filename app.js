const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static('public'));

// ===== اتصال قاعدة البيانات =====
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/game', {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000
}).then(() => console.log('MongoDB شغال 👑'))
  .catch(err => console.log('خطأ MongoDB:', err));

mongoose.set('strictQuery', false);

// ===== جدول اليوزر =====
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    userId: { type: String, unique: true },
    claws: { type: Number, default: 10 },
    prestige: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    vip: { type: Boolean, default: false },
    avatar: { type: String, default: 'https://i.imgur.com/default-avatar.png' },
    cover: { type: String, default: 'https://i.imgur.com/default-cover.png' },
    bio: { type: String, default: 'اهلا فيكم بملفي الشخصي 👑' },
    followers: { type: Number, default: 0 },
    following: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

// ===== جدول الغرف =====
const roomSchema = new mongoose.Schema({
    name: { type: String, required: true },
    owner: { type: String, required: true },
    ownerName: { type: String, default: 'السبع الحلبي' },
    cover: { type: String, default: 'https://i.imgur.com/party-cover.jpg' },
    isVip: { type: Boolean, default: false },
    users: [{
        userId: String,
        name: String,
        pic: { type: String, default: 'https://i.imgur.com/default-avatar.png' },
        onMic: { type: Boolean, default: false },
        speaking: { type: Boolean, default: false }
    }],
    createdAt: { type: Date, default: Date.now }
});
const Room = mongoose.model('Room', roomSchema);

// ===== الصفحة الرئيسية =====
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ===== صفحة الغرفة الصوتية =====
app.get('/room/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'room.html'));
});

// ===== صفحة البروفايل =====
app.get('/profile/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

// ===== API تسجيل حساب جديد =====
app.post('/register', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: 'قاعدة البيانات مو شغالة حالياً 💎' });
        }
        
        const { username, password } = req.body;
        
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: 'اسم المستخدم موجود مسبقاً' });
        }

        const newUserId = Math.floor(100000 + Math.random() * 900000).toString();
        
        const newUser = new User({
            username,
            password,
            userId: newUserId
        });
        
        await newUser.save();
        res.json({ success: true, userId: newUserId, claws: 10 });
    } catch (err) {
        console.log('Register Error:', err);
        res.status(500).json({ error: 'خطأ بالسيرفر' });
    }
});

// ===== API تسجيل دخول =====
app.post('/login', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: 'قاعدة البيانات مو شغالة حالياً 💎' });
        }
        
        const { username, password } = req.body;
        const user = await User.findOne({ username, password });
        
        if (!user) {
            return res.status(400).json({ error: 'اسم المستخدم او كلمة المرور غلط' });
        }
        
        res.json({ 
            success: true, 
            userId: user.userId,
            username: user.username,
            claws: user.claws,
            avatar: user.avatar
        });
    } catch (err) {
        res.status(500).json({ error: 'خطأ بالسيرفر' });
    }
});

// ===== API جلب كل الغرف =====
app.get('/api/rooms', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: 'قاعدة البيانات مو شغالة حالياً 💎' });
        }
        const rooms = await Room.find().sort({ isVip: -1, createdAt: -1 });
        res.json(rooms);
    } catch (err) {
        res.status(500).json({ error: 'خطأ بجلب الغرف' });
    }
});

// ===== API انشاء غرفة جديدة =====
app.post('/api/rooms', async (req, res) => {
    try {
        const { name, ownerId, ownerName, ownerPic } = req.body;
        
        const newRoom = new Room({
            name: name || 'غرفة السبع الحلبي',
            owner: ownerId || '000000',
            ownerName: ownerName || 'السبع الحلبي',
            users: [{ 
                userId: ownerId || '000000', 
                name: ownerName || 'السبع الحلبي', 
                pic: ownerPic || 'https://i.imgur.com/default-avatar.png',
                onMic: true, 
                speaking: false 
            }]
        });
        
        await newRoom.save();
        res.json({ success: true, roomId: newRoom._id });
    } catch (err) {
        console.log('Create Room Error:', err);
        res.status(500).json({ error: 'ما قدرنا نعمل الغرفة' });
    }
});

// ===== API جلب بيانات غرفة وحدة =====
app.get('/api/room/:id', async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);
        if (!room) return res.status(404).json({ error: 'الغرفة مو موجودة' });
        res.json(room);
    } catch (err) {
        res.status(500).json({ error: 'خطأ بجلب الغرفة' });
    }
});

// ===== API جلب بيانات يوزر =====
app.get('/api/user/:id', async (req, res) => {
    try {
        const user = await User.findOne({ userId: req.params.id });
        if (!user) return res.status(404).json({ error: 'اليوزر مو موجود' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: 'خطأ بجلب اليوزر' });
    }
});

// ===== تشغيل السيرفر =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`السيرفر شغال على بورت ${PORT} 👑`));
