const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer'); // إضافة مكتبة رفع الصور
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'ayham-secret-key-2024';

// تفعيل الميدل وير بالترتيب الصحيح وحماية السيرفر
app.use(cors({ origin: '*' }));
app.use(express.json());

// منع السيرفر من التوقف المفاجئ عند حدوث أي خطأ
process.on('uncaughtException', (err) => {
    console.error('⚠️ خطأ تم احتواؤه في السيرفر بنجاح:', err);
});

// تشغيل وتمرير مجلد public تلقائياً لتفادي خطأ الكاش
app.use(express.static(path.join(__dirname, 'public')));

// إعدادات حفظ الصور المرفوعة من الاستوديو
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/'); // سيتم حفظ الصور هنا
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// MongoDB Connection
const mongoURI = process.env.MONGODB_URI;
if (!mongoURI) {
  console.log('❌ MONGODB_URI مو موجود في متغيرات البيئة!');
  process.exit(1);
}
mongoose.connect(mongoURI)
.then(() => console.log('✅ MongoDB Connected - إمبراطورية السبع شغال بكفاءة'))
.catch(err => { console.log('❌ MongoDB Error:', err.message); process.exit(1); });

const generateUniqueId = () => Math.floor(100000 + Math.random() * 900000);

const calculateVipLevel = (points) => {
  if (points >= 200000) return 10;
  if (points >= 120000) return 9;
  if (points >= 80000) return 8;
  if (points >= 50000) return 7;
  if (points >= 35000) return 6;
  if (points >= 20000) return 5;
  if (points >= 10000) return 4;
  if (points >= 6000) return 3;
  if (points >= 3000) return 2;
  if (points >= 1000) return 1;
  return 0;
};

// ميدل وير التحقق من التوكن
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'مرحباً! الرجاء تسجيل الدخول أولاً' });
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.user_id;
    next();
  } catch (error) {
    res.status(401).json({ error: 'جلسة العمل منتهية، يرجى إعادة تسجيل الدخول' });
  }
};

// --- User Schema الشامل والآمن للبيانات المرسلة ---
const userSchema = new mongoose.Schema({
  user_id: { type: Number, unique: true, required: true },
  userId: { type: Number, default: function() { return this.user_id; } }, 
  username: { type: String, required: true },
  lastName: { type: String, default: "" }, 
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  country: { type: String, default: "Syria" }, 
  birthDate: { type: String, default: "2006-01-01" },
  age: { type: Number, default: 20 }, 
  gender: { type: String, default: "ذكر" },
  coins: { type: Number, default: 1000 }, 
  diamonds: { type: Number, default: 0 },
  vip_level: { type: Number, default: 0 },
  vipType: { type: String, default: 'none' },
  isVIP: { type: Boolean, default: false },
  supportPoints: { type: Number, default: 0 },
  agencyId: { type: String, default: null },
  role: { type: String, default: 'USER' },
  avatarUrl: { type: String, default: "" }, 
  coverUrl: { type: String, default: "" },  
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

// --- Agent Schema ---
const agentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  shamcash_number: { type: String, required: true },
  active: { type: Boolean, default: true }
});
const Agent = mongoose.model('Agent', agentSchema);

// --- TopUp Request Schema ---
const topupSchema = new mongoose.Schema({
  user_id: Number,
  coins: Number,
  price_try: Number,
  agent_id: String,
  status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});
const TopUpRequest = mongoose.model('TopUpRequest', topupSchema);

// --- Room Schema ---
const roomSchema = new mongoose.Schema({
  room_id: { type: Number, unique: true, required: true },
  owner_id: Number,
  name: String,
  users: [Number],
  mics: { type: Array, default: Array(9).fill(null) },
  top_gifts_today: { type: Number, default: 0 },
  last_reset: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});
const Room = mongoose.model('Room', roomSchema);

// اضافة الوكيل الافتراضي وتصفير الدعم اليومي
Agent.countDocuments().then(async count => {
  if (count === 0) {
    await new Agent({ name: 'ابو محمد', phone: '0999123456', shamcash_number: '0999123456' }).save();
    console.log('✅ تم اضافة الوكيل السبع الحلبي');
  }
});
setInterval(async () => {
  await Room.updateMany({}, { top_gifts_today: 0, last_reset: new Date() });
  console.log('✅ تم تصفير دعم الغرف اليومي');
}, 24 * 60 * 60 * 1000);

// --- قائمة الهدايا ---
const GIFTS_LIST = [
  { giftId: 'g1', name: 'وردة حمرا', price: 10, animation: 'https://cdn-icons-png.flaticon.com/512/833/833472.png', svgaUrl: '', category: 'love', vipOnly: false, isHot: true },
  { giftId: 'g2', name: 'قلب بينبض', price: 20, animation: 'https://cdn-icons-png.flaticon.com/512/833/833472.png', svgaUrl: '', category: 'love', vipOnly: false, isHot: true },
  { giftId: 'g3', name: 'عسل', price: 30, animation: 'https://cdn-icons-png.flaticon.com/512/3081/3081840.png', svgaUrl: '', category: 'love', vipOnly: false, isHot: false },
  { giftId: 'g4', name: 'بوسة طايرة', price: 50, animation: 'https://cdn-icons-png.flaticon.com/512/742/742751.png', svgaUrl: '', category: 'love', vipOnly: false, isHot: false },
  { giftId: 'g5', name: 'شوكولا', price: 80, animation: 'https://cdn-icons-png.flaticon.com/512/3081/3081993.png', svgaUrl: '', category: 'love', vipOnly: false, isHot: false },
  { giftId: 'g6', name: 'دبدوب', price: 150, animation: 'https://cdn-icons-png.flaticon.com/512/3468/3468377.png', svgaUrl: '', category: 'love', vipOnly: false, isHot: false },
  { giftId: 'g7', name: 'خاتم حب', price: 200, animation: 'https://cdn-icons-png.flaticon.com/512/1018/1018161.png', svgaUrl: '', category: 'love', vipOnly: false, isHot: false },
  { giftId: 'g8', name: 'بالون', price: 300, animation: 'https://cdn-icons-png.flaticon.com/512/2372/2372123.png', svgaUrl: '', category: 'fun', vipOnly: false, isHot: false },
  { giftId: 'g9', name: 'سيارة سبورت', price: 500, animation: 'https://cdn-icons-png.flaticon.com/512/743/743007.png', svgaUrl: '', category: 'luxury', vipOnly: false, isHot: true },
  { giftId: 'g10', name: 'يخت صغير', price: 800, animation: 'https://cdn-icons-png.flaticon.com/512/4144/4144785.png', svgaUrl: '', category: 'luxury', vipOnly: false, isHot: false },
  { giftId: 'g11', name: 'تاج فضي', price: 1000, animation: 'https://cdn-icons-png.flaticon.com/512/2353/2353361.png', svgaUrl: '', category: 'luxury', vipOnly: false, isHot: true },
  { giftId: 'g12', name: 'طيارة دهب', price: 1500, animation: 'https://cdn-icons-png.flaticon.com/512/3125/3125713.png', svgaUrl: '', category: 'luxury', vipOnly: false, isHot: false },
  { giftId: 'g13', name: 'قلعة', price: 2000, animation: 'https://cdn-icons-png.flaticon.com/512/2306/2306073.png', svgaUrl: '', category: 'luxury', vipOnly: false, isHot: false },
  { giftId: 'g14', name: 'اسد ملكي', price: 5000, animation: 'https://cdn-icons-png.flaticon.com/512/616/616412.png', svgaUrl: 'https://github.com/svga/SVGA-Samples/raw/master/lion.svga', category: 'vip', vipOnly: false, isHot: true },
  { giftId: 'g15', name: 'فيراري', price: 8000, animation: 'https://cdn-icons-png.flaticon.com/512/741/741407.png', svgaUrl: 'https://github.com/svga/SVGA-Samples/raw/master/car.svga', category: 'vip', vipOnly: false, isHot: true },
  { giftId: 'g16', name: 'طيارة خاصة', price: 10000, animation: 'https://cdn-icons-png.flaticon.com/512/3233/3233474.png', svgaUrl: 'https://github.com/svga/SVGA-Samples/raw/master/plane.svga', category: 'vip', vipOnly: false, isHot: true },
  { giftId: 'g17', name: 'قصر', price: 20000, animation: 'https://cdn-icons-png.flaticon.com/512/7725/7725067.png', svgaUrl: '', category: 'vip', vipOnly: false, isHot: false },
  { giftId: 'g18', name: 'تنين نار', price: 30000, animation: 'https://cdn-icons-png.flaticon.com/512/2291/2291932.png', svgaUrl: 'https://github.com/svga/SVGA-Samples/raw/master/dragon.svga', category: 'vip', vipOnly: true, isHot: true },
  { giftId: 'g19', name: 'كوكب', price: 50000, animation: 'https://cdn-icons-png.flaticon.com/512/3617/3617069.png', svgaUrl: 'https://github.com/svga/SVGA-Samples/raw/master/planet.svga', category: 'vip', vipOnly: true, isHot: true },
  { giftId: 'g20', name: 'ماسة', price: 2500, animation: 'https://cdn-icons-png.flaticon.com/512/2165/2165507.png', svgaUrl: '', category: 'luxury', vipOnly: false, isHot: false },
  { giftId: 'g21', name: 'تاج ماسي', price: 15000, animation: 'https://cdn-icons-png.flaticon.com/512/2583/2583344.png', svgaUrl: '', category: 'vip', vipOnly: true, isHot: false },
  { giftId: 'g22', name: 'صاروخ', price: 12000, animation: 'https://cdn-icons-png.flaticon.com/512/4794/4794943.png', svgaUrl: 'https://github.com/svga/SVGA-Samples/raw/master/rocket.svga', category: 'vip', vipOnly: false, isHot: false },
  { giftId: 'g23', name: 'برج خليفة', price: 25000, animation: 'https://cdn-icons-png.flaticon.com/512/2942/2942076.png', svgaUrl: '', category: 'vip', vipOnly: true, isHot: false },
  { giftId: 'g24', name: 'ورد جوري', price: 15, animation: 'https://cdn-icons-png.flaticon.com/512/873/873107.png', svgaUrl: '', category: 'love', vipOnly: false, isHot: false },
  { giftId: 'g25', name: 'قهوة', price: 25, animation: 'https://cdn-icons-png.flaticon.com/512/2936/2936886.png', svgaUrl: '', category: 'love', vipOnly: false, isHot: false }
];

// --- Socket.io Logic ---
io.on('connection', (socket) => {
  let currentUserId = null;
  let currentRoomId = null;

  socket.on('joinRoom', async ({ room_id, token }) => {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      currentUserId = decoded.user_id;
      currentRoomId = room_id;
      const room = await Room.findOne({ room_id });
      if (!room) return;
      socket.join(room_id.toString());
      if (!room.users.includes(currentUserId)) {
        room.users.push(currentUserId);
        await room.save();
      }
      const usersData = await User.find({ user_id: { $in: room.users } }).select('user_id username vip_level avatarUrl');
      io.to(room_id.toString()).emit('roomUpdate', {...room.toObject(), usersData });
    } catch (e) { console.log('Join Room Error:', e.message); }
  });

  socket.on('sendMessage', async ({ room_id, text }) => {
    try {
      const user = await User.findOne({ user_id: currentUserId });
      if (!user) return;
      io.to(room_id.toString()).emit('newMessage', {
        user_id: user.user_id, username: user.username, text, vip_level: user.vip_level, level: `Lv.${user.vip_level}`, avatarUrl: user.avatarUrl
      });
    } catch (e) { console.log(e.message); }
  });

  socket.on('sitOnMic', async ({ room_id, micIndex }) => {
    const room = await Room.findOne({ room_id });
    if (!room || room.mics[micIndex] !== null) return;
    room.mics[micIndex] = currentUserId;
    await room.save();
    io.to(room_id.toString()).emit('micUpdate', room.mics);
  });

  socket.on('leaveMic', async ({ room_id, micIndex }) => {
    const room = await Room.findOne({ room_id });
    if (!room || room.mics[micIndex] !== currentUserId) return;
    room.mics[micIndex] = null;
    await room.save();
    io.to(room_id.toString()).emit('micUpdate', room.mics);
  });

  socket.on('disconnect', async () => {
    if (currentRoomId && currentUserId) {
      const room = await Room.findOne({ room_id: currentRoomId });
      if (room) {
        room.users = room.users.filter(id => id !== currentUserId);
        room.mics = room.mics.map(mic => mic === currentUserId ? null : mic);
        await room.save();
        io.to(currentRoomId.toString()).emit('roomUpdate', room);
      }
    }
  });
});

// --- APIs المحدثة ---

app.get('/api/gifts', (req, res) => res.json(GIFTS_LIST));
app.get('/agents', async (req, res) => {
  try { res.json(await Agent.find({ active: true })); } catch (e) { res.status(500).json({ error: e.message }); }
});

// دالة التسجيل
app.post('/api/register', async (req, res) => {
  try {
    const { username, lastName, email, password, country, birthDate, age, gender } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: 'يرجى إدخال البريد الإلكتروني وكلمة المرور بشكل صحيح' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) return res.status(400).json({ error: 'هذا البريد الإلكتروني مسجل بالفعل' });
    
    let user_id;
    do { user_id = generateUniqueId(); } while (await User.findOne({ user_id }));
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = new User({ 
        user_id, 
        userId: user_id, 
        username: username || "مستخدم جديد", 
        lastName: lastName || "السبع", 
        email: cleanEmail, 
        password: hashedPassword, 
        country: country || "Syria", 
        birthDate: birthDate || "2006-01-01", 
        age: parseInt(age) || 20, 
        gender: gender || "ذكر" 
    });
    
    await newUser.save();
    
    const token = jwt.sign({ user_id: newUser.user_id }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: newUser });
  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ error: 'فشل حفظ الحساب، تأكد من صحة الحقول' });
  }
});

// دالة تسجيل الدخول
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'الحقول المطلوبة ناقصة' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    }
    
    const token = jwt.sign({ user_id: user.user_id }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user });
  } catch (error) {
    res.status(500).json({ error: 'خطأ داخلي أثناء تسجيل الدخول' });
  }
});

app.get('/api/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ user_id: req.userId }).select('-password');
    if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });
    res.json(user);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// تعديل الدالة لاستقبال ملف الصورة المباشر من الاستوديو وتخزينها
app.put('/api/profile/update', authMiddleware, upload.fields([{ name: 'avatarUrl' }, { name: 'coverUrl' }]), async (req, res) => {
    try {
        const updateFields = {};
        
        // التحقق مما إذا كان المرفق ملف صورة أم رابط نصي قديم لضمان عدم توقف أي ميزة
        if (req.files && req.files['avatarUrl']) {
            updateFields.avatarUrl = `${req.protocol}://${req.get('host')}/uploads/${req.files['avatarUrl'][0].filename}`;
        } else if (req.body.avatarUrl !== undefined) {
            updateFields.avatarUrl = req.body.avatarUrl;
        }

        if (req.files && req.files['coverUrl']) {
            updateFields.coverUrl = `${req.protocol}://${req.get('host')}/uploads/${req.files['coverUrl'][0].filename}`;
        } else if (req.body.coverUrl !== undefined) {
            updateFields.coverUrl = req.body.coverUrl;
        }
        
        const updatedUser = await User.findOneAndUpdate(
            { user_id: req.userId }, { $set: updateFields }, { new: true }
        ).select('-password');
        res.json({ success: true, user: updatedUser });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/send-gift', authMiddleware, async (req, res) => {
  try {
    const { receiver_id, giftId, room_id } = req.body;
    const gift = GIFTS_LIST.find(g => g.giftId === giftId);
    if (!gift) return res.status(400).json({ error: 'الهدية غير موجودة' });
    const sender = await User.findOne({ user_id: req.userId });
    const receiver = await User.findOne({ user_id: receiver_id });
    if (!sender || !receiver || sender.user_id === receiver_id || sender.coins < gift.price) {
        return res.status(400).json({ error: 'لا يمكن إتمام العملية، تحقق من الرصيد والمعرف' });
    }
    
    sender.coins -= gift.price;
    let pointsToAdd = gift.price >= 1000 ? Math.floor(gift.price * 1.2) : gift.price;
    receiver.supportPoints += pointsToAdd;
    receiver.vip_level = calculateVipLevel(receiver.supportPoints);
    
    await sender.save();
    await receiver.save();
    
    if (room_id) {
      await Room.updateOne({ room_id }, { $inc: { top_gifts_today: gift.price } });
      io.to(room_id.toString()).emit('gift_animation', { senderName: sender.username, senderId: sender.user_id, receiverName: receiver.username, receiverId: receiver.user_id, gift, newReceiverPoints: receiver.supportPoints, newReceiverVip: receiver.vip_level });
    }
    res.json({ success: true, newBalance: sender.coins, receiver });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/request_topup', authMiddleware, async (req, res) => {
  try {
    const { coins, agent_id } = req.body;
    const agent = await Agent.findById(agent_id);
    if (!agent) return res.status(400).json({ error: 'الوكيل غير موجود' });
    const newRequest = new TopUpRequest({ user_id: req.userId, coins, price_try: coins / 100, agent_id });
    await newRequest.save();
    res.json({ success: true, price_try: coins / 100, requestId: newRequest._id, shamcash_number: agent.shamcash_number, agent_name: agent.name });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/agent/confirm', async (req, res) => {
  try {
    const { requestId } = req.body;
    const request = await TopUpRequest.findById(requestId);
    if (!request || request.status !== 'pending') return res.status(400).json({ error: 'الطلب غير صالح' });
    const user = await User.findOne({ user_id: request.user_id });
    user.coins += request.coins;
    user.supportPoints += request.coins;
    user.vip_level = calculateVipLevel(user.supportPoints);
    request.status = 'completed';
    await user.save();
    await request.save();
    io.emit(`topup_success_${user.user_id}`, { newCoins: user.coins, newVip: user.vip_level, newPoints: user.supportPoints });
    res.json({ success: true, user });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/create-room', authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    let room_id;
    do { room_id = generateUniqueId(); } while (await Room.findOne({ room_id }));
    const newRoom = new Room({ room_id, owner_id: req.userId, name: name || `غرفة ${req.userId}`, users: [req.userId] });
    await newRoom.save();
    res.json({ success: true, room: newRoom });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/rooms', async (req, res) => {
  try { res.json(await Room.find().select('room_id name users')); } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/room-support/:room_id', async (req, res) => {
  try {
    const room = await Room.findOne({ room_id: req.params.room_id });
    if (!room) return res.status(404).json({ error: 'الغرفة غير موجودة' });
    const topUsers = await User.find({ user_id: { $in: room.users } }).sort({ supportPoints: -1 }).limit(3).select('user_id username supportPoints vip_level avatarUrl');
    res.json({ top_gifts_today: room.top_gifts_today, top_supporters: topUsers });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/room', (req, res) => res.sendFile(path.join(__dirname, 'public', 'room.html')));

server.listen(PORT, () => console.log(`🚀 السيرفر المدمج مستقر تماماً ويعمل على بورت ${PORT}`));
