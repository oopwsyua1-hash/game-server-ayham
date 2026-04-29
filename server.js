const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const http = require('http');
const path = require('path'); 
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());
app.use(express.static('public')); 

// ===== الاتصال بقاعدة البيانات =====
const JWT_SECRET = process.env.JWT_SECRET;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(() => console.log('تم الاتصال بـ MongoDB بنجاح 🔥'))
  .catch(err => console.error('خطأ في الاتصال بقاعدة البيانات:', err));

// ===== الموديلات (Schemas) =====
const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String,
  coins: { type: Number, default: 50000 },
  targetCoins: { type: Number, default: 1000000 },
  earnedCoins: { type: Number, default: 0 },
  role: { type: String, default: 'user' },
  agency: { type: String, default: 'لا يوجد' }
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

// ===== إنشاء الرومات الأساسية =====
async function createDefaultRooms() {
  const count = await Room.countDocuments();
  if (count === 0) {
    await Room.create([
      { name: 'مجانية', price: 0 },
      { name: 'كبار الشخصيات 100K', price: 100000 },
      { name: 'VIP 500K', price: 500000 }
    ]);
    console.log('تم إنشاء الرومات الأساسية');
  }
}
createDefaultRooms();

// ===== مسارات تسجيل الدخول (مربوطة بـ script.js) =====
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if(!username || !password) return res.json({ msg: 'عبي كل البيانات' });
    const exists = await User.findOne({ username });
    if(exists) return res.json({ msg: 'الاسم مستخدم مسبقاً' });
    const hash = await bcrypt.hash(password, 10);
    await User.create({ username, password: hash });
    res.json({ msg: 'تم إنشاء الحساب بنجاح ✅' });
  } catch(e) { res.status(400).json({ msg: 'خطأ بالسيرفر' }); }
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if(!user) return res.json({ msg: 'المستخدم غير موجود' });
    const match = await bcrypt.compare(password, user.password);
    if(!match) return res.json({ msg: 'كلمة السر غير صحيحة' });
    const token = jwt.sign({ id: user._id }, JWT_SECRET);
    res.json({ token, user });
  } catch(e) { res.status(400).json({ msg: 'خطأ بالسيرفر' }); }
});

// ===== مسارات جلب البيانات (للربط مع باقي ملفات الـ JS) =====

// جلب بيانات البروفايل (مربوط مع profile.js)
app.get('/api/user/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    res.json(user);
  } catch (e) { res.status(401).json({ msg: 'انتهت الجلسة، سجل دخول مجدداً' }); }
});

// جلب قائمة المتصدرين (مربوط مع lobbies.html و script.js)
app.get('/api/leaderboard', async (req, res) => {
  try {
    const topUsers = await User.find().sort({ coins: -1 }).limit(10);
    res.json(topUsers);
  } catch (e) { res.json([]); }
});

// جلب الرومات
app.get('/rooms', async (req, res) => {
  const rooms = await Room.find();
  res.json(rooms);
});

// ===== نظام الألعاب والدردشة (Socket.io) =====
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
server.listen(PORT, () => console.log(`السيرفر شغال على المنفذ ${PORT} 👑`));
