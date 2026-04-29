const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const http = require('http');
const path = require('path'); // إضافة مكتبة المسارات
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

// ===== إضافة الربط مع المجلد العام وواجهة المستخدم =====
app.use(express.static('public')); // ليتمكن السيرفر من قراءة ملفات الـ HTML والـ CSS

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html')); // فتح صفحة الدخول تلقائياً عند تشغيل الرابط
});
// ===============================================

// ===== بيقرأهم من Render تلقائياً =====
const JWT_SECRET = process.env.JWT_SECRET;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI);

// ===== Schemas =====
const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String,
  coins: { type: Number, default: 50000 },
  targetCoins: { type: Number, default: 1000000 },
  earnedCoins: { type: Number, default: 0 },
  role: { type: String, default: 'user' }
});
const User = mongoose.model('User', UserSchema);

const RoomSchema = new mongoose.Schema({
  name: String,
  price: Number
});
const Room = mongoose.model('Room', RoomSchema);

const MessageSchema = new mongoose.Schema({
  room: String,
  username: String,
  text: String,
  time: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', MessageSchema);

// ===== انشاء الرومات الاساسية =====
async function createDefaultRooms() {
  const count = await Room.countDocuments();
  if (count === 0) {
    await Room.create([
      { name: 'مجانية', price: 0 },
      { name: 'كبار الشخصيات 100K', price: 100000 },
      { name: 'VIP 500K', price: 500000 }
    ]);
    console.log('تم انشاء الرومات');
  }
}
createDefaultRooms();

// ===== تسجيل ودخول =====
app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if(!username ||!password) return res.json({ msg: 'عبي كل البيانات' });
    if(username.includes('@')) return res.json({ msg: 'اسم المستخدم ما بصير فيه @' });
    const exists = await User.findOne({ username });
    if(exists) return res.json({ msg: 'الاسم مستخدم' });
    const hash = await bcrypt.hash(password, 10);
    await User.create({ username, password: hash });
    res.json({ msg: 'تم انشاء الحساب بنجاح' });
  } catch(e) { console.log(e); res.status(400).json({ msg: 'خطأ بالسيرفر' }); }
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if(!user) return res.json({ msg: 'المستخدم غير موجود' });
    const match = await bcrypt.compare(password, user.password);
    if(!match) return res.json({ msg: 'كلمة السر غلط' });
    const token = jwt.sign({ id: user._id }, JWT_SECRET);
    res.json({ token, user });
  } catch(e) { console.log(e); res.status(400).json({ msg: 'خطأ بالسيرفر' }); }
});

app.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if(!token) return res.status(401).json({ msg: 'مافي توكن' });
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    res.json(user);
  } catch { res.status(401).json({ msg: 'توكن غلط' }); }
});

// ===== نظام الألعاب - 6 العاب =====
// تم الإبقاء على كود الألعاب كما هو لضمان عمل "إمبراطورية السبع"
app.post('/game/luck', async (req, res) => {
  try {
    const { token, bet } = req.body;
    const betAmount = parseInt(bet);
    if(!betAmount || betAmount < 100) return res.json({ msg: 'اقل رهان 100' });
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if(user.coins < betAmount) return res.json({ msg: 'رصيدك ما بيكفي' });
    user.coins -= betAmount;
    const win = Math.random() < 0.5;
    if(win) {
      const winAmount = betAmount * 2;
      user.coins += winAmount;
      user.earnedCoins += betAmount;
      if(user.coins >= 1000000) user.coins = 300000;
      await user.save();
      res.json({ msg: `مبروك ربحت ${winAmount.toLocaleString()}! 🎉`, win: true, user });
    } else {
      user.coins = 0;
      await user.save();
      res.json({ msg: `خسرت! رصيدك صفر 😢`, win: false, user });
    }
  } catch { res.status(400).json({ msg: 'خطأ' }); }
});

// ... باقي الألعاب (Camel, WorldCup, RPS, Wheel, Dice) تبقى كما هي في الكود الأصلي ...

// ===== الرومات =====
app.get('/rooms', async (req, res) => {
  const rooms = await Room.find();
  res.json(rooms);
});

// ===== Socket.io دردشة =====
io.on('connection', (socket) => {
  socket.on('joinRoom', async ({ room, username }) => {
    socket.join(room);
    const messages = await Message.find({ room }).sort({ time: -1 }).limit(50);
    socket.emit('history', messages.reverse());
  });
  socket.on('chatMessage', async ({ room, username, text }) => {
    const msg = await Message.create({ room, username, text });
    io.to(room).emit('message', msg);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`السيرفر شغال على ${PORT} 👑`));
