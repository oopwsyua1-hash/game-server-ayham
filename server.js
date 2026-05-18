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
const io = new Server(server, { cors: { origin: "*" } });

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'ayham-secret-key-2024';

// تفعيل الميدل وير بالترتيب الصحيح وحماية السيرفر
app.use(cors({ origin: '*' }));
app.use(express.json());

// دالة أمان ملوكية لمنع السيرفر من التوقف المفاجئ (الكراش) عند حدوث أي خطأ غير متوقع
process.on('uncaughtException', (err) => {
    console.error('⚠️ حدث خطأ غير متوقع في السيرفر ولكن تم احتواؤه بنجاح:', err);
});

// تشغيل وتمرير مجلد public تلقائياً لتفادي خطأ الكاش داخل التطبيق
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection
const mongoURI = process.env.MONGODB_URI;
if (!mongoURI) {
  console.log('❌ MONGODB_URI مو موجود في متغيرات البيئة!');
  process.exit(1);
}
mongoose.connect(mongoURI)
.then(() => console.log('✅ MongoDB Connected - إمبراطورية السبع V3 شغال بكفاءة'))
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

// ميدل وير التحقق من التوكن (معدل ليتوافق مع الـ Schema)
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'مافي توكن، الرجاء تسجيل الدخول' });
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.user_id;
    next();
  } catch (error) {
    res.status(401).json({ error: 'توكن منتهي أو خاطئ' });
  }
};

// --- User Schema المطور الشامل (تمت إضافة روابط الصور افتراضياً هنا لضمان عمل الواجهة) ---
const userSchema = new mongoose.Schema({
  user_id: { type: Number, unique: true, required: true },
  username: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  country: { type: String, required: true },
  birthDate: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, required: true },
  coins: { type: Number, default: 1000 }, // يبدأ بـ 1000 ذهبة ملوكية كترحيب
  diamonds: { type: Number, default: 0 },
  vip_level: { type: Number, default: 0 },
  vipType: { type: String, default: 'none' },
  isVIP: { type: Boolean, default: false },
  supportPoints: { type: Number, default: 0 },
  agencyId: { type: String, default: "إمبراطورية السبع العامة" },
  role: { type: String, default: 'USER' },
  avatarUrl: { type: String, default: "" }, // رابط الصورة الشخصية بقاعدة البيانات
  coverUrl: { type: String, default: "" },  // رابط صورة الغلاف بقاعدة البيانات
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

// اضافة ابو محمد + تصفير الدعم اليومي
Agent.countDocuments().then(async count => {
  if (count === 0) {
    await new Agent({ name: 'ابو محمد', phone: '0999123456', shamcash_number: '0999123456' }).save();
    console.log('✅ تم اضافة الوكيل ابو محمد');
  }
});
setInterval(async () => {
  await Room.updateMany({}, { top_gifts_today: 0, last_reset: new Date() });
  console.log('✅ تم تصفير دعم الغرف اليومي');
}, 24 * 60 * 60 * 1000);

// --- قائمة الهدايا 25 هدية مع SVGA ---
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
  console.log('مستخدم جديد اتصل بغرف الصوت:', socket.id);
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
    const user = await User.findOne({ user_id: currentUserId });
    if (!user) return;
    io.to(room_id.toString()).emit('newMessage', {
      user_id: user.user_id, username: user.username, text, vip_level: user.vip_level, level: `Lv.${user.vip_level}`, avatarUrl: user.avatarUrl
    });
  });

  socket.on('sitOnMic', async ({ room_id, micIndex }) => {
    const room = await Room.findOne({ room_id });
    if (!room || room.mics[micIndex]!== null) return;
    room.mics[micIndex] = currentUserId;
    await room.save();
    io.to(room_id.toString()).emit('micUpdate', room.mics);
  });

  socket.on('leaveMic', async ({ room_id, micIndex }) => {
    const room = await Room.findOne({ room_id });
    if (!room || room.mics[micIndex]!== currentUserId) return;
    room.mics[micIndex] = null;
    await room.save();
    io.to(room_id.toString()).emit('micUpdate', room.mics);
  });

  socket.on('disconnect', async () => {
    if (currentRoomId && currentUserId) {
      const room = await Room.findOne({ room_id: currentRoomId });
      if (room) {
        room.users = room.users.filter(id => id!== currentUserId);
        room.mics = room.mics.map(mic => mic === currentUserId? null : mic);
        await room.save();
        io.to(currentRoomId.toString()).emit('roomUpdate', room);
      }
    }
    console.log('مستخدم غادر الغرفة الصوتية:', socket.id);
  });
});

// --- APIs ---
app.get('/api/gifts', (req, res) => res.json(GIFTS_LIST));

app.get('/agents', async (req, res) => {
  try {
    const agents = await Agent.find({ active: true });
    res.json(agents);
  } catch (error) {
    res.status(500).json({ error: 'خطأ بجلب الوكلاء' });
  }
});

// --- 1. نقطة إنشاء الحساب (معدلة ومربوطة لحل خطأ السيرفر السابق) ---
app.post('/api/register', async (req, res) => {
  try {
    const { username, lastName, email, password, country, birthDate, age, gender } = req.body;
    
    if (!username || !lastName || !email || !password || !country || !birthDate || !gender) {
        return res.status(400).json({ error: 'الرجاء تعبئة كل الحقول المطلوبة للتسجيل' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) return res.status(400).json({ error: 'الايميل مستخدم من قبل، جرب بريد آخر' });
    
    let user_id;
    do { user_id = generateUniqueId(); } while (await User.findOne({ user_id }));
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = new User({ 
        user_id, 
        username, 
        lastName, 
        email: email.toLowerCase(), 
        password: hashedPassword, 
        country, 
        birthDate, 
        age: parseInt(age) || 20, 
        gender 
    });
    
    await newUser.save();
    
    const token = jwt.sign({ user_id: newUser.user_id }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: newUser });
  } catch (error) {
    console.error('Register Error Log:', error);
    res.status(500).json({ error: 'خطأ بالسيرفر أثناء حفظ الحساب الجديد' });
  }
});

// --- 2. نقطة تسجيل الدخول الملوكي ---
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'الرجاء كتابة البريد وكلمة المرور' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ error: 'الايميل او كلمة السر غلط' });
    }
    const token = jwt.sign({ user_id: user.user_id }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user });
  } catch (error) {
    res.status(500).json({ error: 'خطأ بالسيرفر عند محاولة الدخول' });
  }
});

// --- 3. نقطة جلب البروفايل عبر التوكن (معدلة لترسل الحساب بالكامل مع روابط الصور) ---
app.get('/api/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ user_id: req.userId }).select('-password');
    if (!user) return res.status(404).json({ error: 'اليوزر غير موجود بقاعدة البيانات' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'خطأ بالسيرفر أثناء جلب بيانات البروفايل' });
  }
});

// --- 4. ميزة جديدة ملوكية: نقطة تحديث الصور وحفظها في قاعدة البيانات (PUT) ---
app.put('/api/profile/update', authMiddleware, async (req, res) => {
    try {
        const { avatarUrl, coverUrl } = req.body;
        const updateFields = {};
        
        if (avatarUrl !== undefined) updateFields.avatarUrl = avatarUrl;
        if (coverUrl !== undefined) updateFields.coverUrl = coverUrl;
        
        const updatedUser = await User.findOneAndUpdate(
            { user_id: req.userId },
            { $set: updateFields },
            { new: true }
        ).select('-password');
        
        if (!updatedUser) return res.status(404).json({ error: 'المستخدم غير موجود' });
        res.json({ success: true, user: updatedUser });
    } catch (error) {
        res.status(500).json({ error: 'فشل حفظ الصور في السيرفر' });
    }
});

// --- بقية الـ APIs الأساسية للغرف والهديا والشحن ---
app.post('/api/send-gift', authMiddleware, async (req, res) => {
  try {
    const { receiver_id, giftId, room_id } = req.body;
    const gift = GIFTS_LIST.find(g => g.giftId === giftId);
    if (!gift) return res.status(400).json({ error: 'الهدية غير موجودة' });
    const sender = await User.findOne({ user_id: req.userId });
    const receiver = await User.findOne({ user_id: receiver_id });
    if (!sender ||!receiver) return res.status(400).json({ error: 'المستخدم غير موجود' });
    if (sender.user_id === receiver_id) return res.status(400).json({ error: 'ما فيك تهدي حالك' });
    if (sender.coins < gift.price) return res.status(400).json({ error: 'الرصيد لا يكفي' });
    if (gift.vipOnly && sender.vip_level === 0) return res.status(400).json({ error: 'هدية VIP فقط' });
    
    sender.coins -= gift.price;
    let pointsToAdd = gift.price >= 1000? Math.floor(gift.price * 1.2) : gift.price;
    receiver.supportPoints += pointsToAdd;
    const newVipLevel = calculateVipLevel(receiver.supportPoints);
    if (newVipLevel > receiver.vip_level) {
      receiver.vip_level = newVipLevel;
      receiver.isVIP = true;
      receiver.vipType = `VIP${newVipLevel}`;
    }
    await sender.save();
    await receiver.save();
    if (room_id) {
      await Room.updateOne({ room_id }, { $inc: { top_gifts_today: gift.price } });
      io.to(room_id.toString()).emit('gift_animation', { senderName: sender.username, senderId: sender.user_id, receiverName: receiver.username, receiverId: receiver.user_id, gift: gift, newReceiverPoints: receiver.supportPoints, newReceiverVip: receiver.vip_level });
    }
    res.json({ success: true, newBalance: sender.coins, receiver: { user_id: receiver.user_id, supportPoints: receiver.supportPoints, vip_level: receiver.vip_level } });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في معالجة الهدية' });
  }
});

app.post('/request_topup', authMiddleware, async (req, res) => {
  try {
    const { coins, agent_id } = req.body;
    const price_try = coins / 100;
    const agent = await Agent.findById(agent_id);
    if (!agent) return res.status(400).json({ error: 'الوكيل غير موجود' });
    const newRequest = new TopUpRequest({ user_id: req.userId, coins, price_try, agent_id });
    await newRequest.save();
    res.json({ success: true, price_try, requestId: newRequest._id, shamcash_number: agent.shamcash_number, agent_name: agent.name });
  } catch (error) {
    res.status(500).json({ error: 'خطأ بطلب الشحن' });
  }
});

app.post('/agent/confirm', async (req, res) => {
  try {
    const { requestId } = req.body;
    const request = await TopUpRequest.findById(requestId);
    if (!request || request.status!== 'pending') {
      return res.status(400).json({ error: 'الطلب غير موجود او مكتمل' });
    }
    const user = await User.findOne({ user_id: request.user_id });
    user.coins += request.coins;
    user.supportPoints += request.coins;
    const newVipLevel = calculateVipLevel(user.supportPoints);
    if (newVipLevel > user.vip_level) {
      user.vip_level = newVipLevel;
      user.isVIP = true;
      user.vipType = `VIP${newVipLevel}`;
    }
    request.status = 'completed';
    await user.save();
    await request.save();
    io.emit(`topup_success_${user.user_id}`, { newCoins: user.coins, newVip: user.vip_level, newPoints: user.supportPoints });
    res.json({ success: true, user: { user_id: user.user_id, coins: user.coins, vip_level: user.vip_level } });
  } catch (error) {
    res.status(500).json({ error: 'خطأ بتأكيد الشحن' });
  }
});

app.post('/api/create-room', authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    let room_id;
    do { room_id = generateUniqueId(); } while (await Room.findOne({ room_id }));
    const newRoom = new Room({ room_id, owner_id: req.userId, name: name || `غرفة ${req.userId}`, users: [req.userId] });
    await newRoom.save();
    res.json({ success: true, room: newRoom });
  } catch (error) {
    res.status(500).json({ error: 'خطأ بإنشاء الغرفة' });
  }
});

app.get('/api/rooms', async (req, res) => {
  try {
    const rooms = await Room.find().select('room_id name users');
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: 'خطأ بجلب الغرف' });
  }
});

app.get('/api/room-support/:room_id', async (req, res) => {
  try {
    const room = await Room.findOne({ room_id: req.params.room_id });
    if (!room) return res.status(404).json({ error: 'الغرفة غير موجودة' });
    const topUsers = await User.find({ user_id: { $in: room.users } }).sort({ supportPoints: -1 }).limit(3).select('user_id username supportPoints vip_level avatarUrl');
    res.json({ top_gifts_today: room.top_gifts_today, top_supporters: topUsers });
  } catch (error) {
    res.status(500).json({ error: 'خطأ بجلب الدعم' });
  }
});

// توجيه روابط الصفحات وعرض الـ index.html بشكل افتراضي وتلقائي
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/room', (req, res) => res.sendFile(path.join(__dirname, 'public', 'room.html')));

// تشغيل السيرفر المدمج عبر HTTP لتفعيل الـ WebSockets (Socket.io)
server.listen(PORT, () => console.log(`🚀 السيرفر الملوكي المدمج شغال على بورت ${PORT}`));
