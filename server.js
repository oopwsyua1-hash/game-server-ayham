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
const io = new Server(server, {
  cors: { origin: "*" }
});

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

// --- Agent Schema للـ Sham Cash ---
const agentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  shamcash_number: { type: String, required: true },
  active: { type: Boolean, default: true }
});
const Agent = mongoose.model('Agent', agentSchema);

// --- TopUp Request Schema ---
const topupSchema = new mongoose.Schema({
  userId: String,
  coins: Number,
  price_try: Number,
  agent_id: String,
  status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});
const TopUpRequest = mongoose.model('TopUpRequest', topupSchema);

// اضافة وكيل ابو محمد تلقائي اذا القاعدة فاضية
Agent.countDocuments().then(count => {
  if (count === 0) {
    new Agent({
      name: 'ابو محمد',
      phone: '0999123456',
      shamcash_number: '0999123456'
    }).save();
    console.log('✅ تم اضافة الوكيل ابو محمد');
  }
});

// --- نظام حالة الغرف ---
let roomsData = {
  'VIP-10000': { users: [], mics: Array(20).fill(null) }
};

// --- Socket.io Logic ---
io.on('connection', (socket) => {
  console.log('مستخدم جديد اتصل:', socket.id);

  socket.on('joinRoom', ({ roomId, token }) => {
    socket.join(roomId);
    if(roomsData[roomId]) {
      roomsData[roomId].users.push(socket.id);
      io.to(roomId).emit('roomUpdate', roomsData[roomId]);
    }
  });

  socket.on('sendMessage', (data) => {
    io.to(data.roomId).emit('newMessage', {
      username: "عضو الإمبراطورية",
      text: data.text,
      level: "Lv.1",
      vip: 0
    });
  });

  socket.on('send_gift', (data) => {
    io.to(data.roomId).emit('gift_animation', data);
  });

  socket.on('disconnect', () => {
    console.log('مستخدم غادر:', socket.id);
    // تنظيف المستخدم من كل الغرف
    for (let roomId in roomsData) {
      roomsData[roomId].users = roomsData[roomId].users.filter(id => id!== socket.id);
      io.to(roomId).emit('roomUpdate', roomsData[roomId]);
    }
  });
});

// --- APIs الهدايا ---
app.get('/api/gifts', (req, res) => {
  const gifts = [
    { giftId: 'g1', name: 'أسد السبع', price: 500, animation: 'https://cdn-icons-png.flaticon.com/512/616/616412.png' },
    { giftId: 'g2', name: 'تاج ملكي', price: 1000, animation: 'https://cdn-icons-png.flaticon.com/512/2353/2353361.png' },
    { giftId: 'g3', name: 'سيارة VIP', price: 5000, animation: 'https://cdn-icons-png.flaticon.com/512/743/743007.png' }
  ];
  res.json(gifts);
});

// --- API جلب الوكلاء ---
app.get('/agents', async (req, res) => {
  try {
    const agents = await Agent.find({ active: true });
    res.json(agents);
  } catch (error) {
    res.status(500).json({ error: 'خطأ بجلب الوكلاء' });
  }
});

// --- APIs المستخدمين ---
app.post('/api/register', async (req, res) => {
  try {
    const { username, lastName, email, password, country, birthDate, age, gender } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'الايميل مستخدم من قبل' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username, lastName, email, password: hashedPassword,
      country, birthDate, age, gender
    });
    await newUser.save();

    const token = jwt.sign({ userId: newUser._id }, JWT_SECRET);
    res.json({ token, user: newUser });
  } catch (error) {
    res.status(500).json({ error: 'خطأ بالسيرفر' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user ||!(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ error: 'الايميل او كلمة السر غلط' });
    }
    const token = jwt.sign({ userId: user._id }, JWT_SECRET);
    res.json({ token, user });
  } catch (error) {
    res.status(500).json({ error: 'خطأ بالسيرفر' });
  }
});

// --- API ارسال هدية ---
app.post('/api/send-gift', async (req, res) => {
  try {
    const { senderId, receiverId, giftCost } = req.body;
    const sender = await User.findById(senderId);
    const receiver = await User.findById(receiverId);

    if (!sender ||!receiver) return res.status(400).json({ error: 'المستخدم غير موجود' });
    if (sender.coins < giftCost) return res.status(400).json({ error: 'الرصيد لا يكفي' });

    sender.coins -= giftCost;
    receiver.supportPoints += giftCost;

    // ترقية VIP تلقائي
    if (receiver.supportPoints >= 1000 && receiver.vipType === 'none') {
      receiver.vipType = 'bronze';
      receiver.isVIP = true;
    }

    await sender.save();
    await receiver.save();

    res.json({ success: true, newBalance: sender.coins, receiver: receiver });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في معالجة الهدية' });
  }
});

// --- API طلب شحن Sham Cash ---
app.post('/request_topup', async (req, res) => {
  try {
    const { userId, coins, agent_id } = req.body;
    const price_try = coins / 100; // كل 100 كوين = 1 ليرة تركي

    const agent = await Agent.findById(agent_id);
    if (!agent) return res.status(400).json({ error: 'الوكيل غير موجود' });

    const newRequest = new TopUpRequest({ userId, coins, price_try, agent_id });
    await newRequest.save();

    res.json({
      success: true,
      price_try,
      requestId: newRequest._id,
      shamcash_number: agent.shamcash_number,
      agent_name: agent.name
    });
  } catch (error) {
    res.status(500).json({ error: 'خطأ بطلب الشحن' });
  }
});

// --- API تأكيد الشحن من الوكيل ---
app.post('/agent/confirm', async (req, res) => {
  try {
    const { requestId } = req.body;
    const request = await TopUpRequest.findById(requestId);
    if (!request || request.status!== 'pending') {
      return res.status(400).json({ error: 'الطلب غير موجود او مكتمل' });
    }

    const user = await User.findById(request.userId);
    user.coins += request.coins;
    user.supportPoints += request.coins;

    // ترقية VIP تلقائي
    if (user.supportPoints >= 1000 && user.vipType === 'none') {
      user.vipType = 'bronze';
      user.isVIP = true;
    }

    request.status = 'completed';
    await user.save();
    await request.save();

    // ابعت اشعار للعميل عبر السوكيت
    io.emit('topup_success_' + user._id, {
      newCoins: user.coins,
      newVip: user.vipType,
      newPoints: user.supportPoints
    });

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: 'خطأ بتأكيد الشحن' });
  }
});

// --- Routes الصفحات ---
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/room', (req, res) => res.sendFile(path.join(__dirname, 'public', 'room.html')));

// تشغيل السيرفر
server.listen(PORT, () => console.log(`🚀 السيرفر الملكي شغال على بورت ${PORT}`));
