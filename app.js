const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const path = require('path');

// ==========================================
// القسم 1: الاتصال بقاعدة البيانات الحقيقية
// ==========================================
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('تم الاتصال بقاعدة البيانات الفخمة ✅');
    console.log('كلشي من هون ورايح رح ينحفظ حقيقي 💎');
  })
  .catch((err) => {
    console.error('فشل الاتصال بقاعدة البيانات ❌ السبب:', err.message);
    process.exit(1);
  });

// ==========================================
// القسم 2: جدول المستخدمين Users بكل الحقول الفخمة
// ==========================================
const userSchema = new mongoose.Schema({
  userId: { type: String, unique: true, required: true },
  اسم: { type: String, required: true },
  كنية: { type: String, required: true },
  تاريخ_ميلاد: { type: Date, required: true },
  العمر: { type: Number },
  الجنس: { type: String, enum: ['ذكر', 'أنثى'], required: true },
  ايميل: { type: String, unique: true, sparse: true },
  رقم_جوال: { type: String, unique: true, sparse: true },
  صورة_البروفايل: { type: String, default: 'https://i.imgur.com/default-avatar.png' },
  صورة_الغلاف: { type: String, default: 'https://i.imgur.com/default-cover.png' },
  السيرة_الذاتية: { type: String, default: 'اهلا فيكم بملفي الشخصي 👑' },
  العنوان: { type: String, default: 'غير محدد' },
  الحالة: { type: String, enum: ['متصل', 'مخفي'], default: 'متصل' },
  المخالب: { type: Number, default: 10 },
  الهيبة: { type: Number, default: 0 },
  اللفل: { type: Number, default: 1 },
  اطار_الاسم: { type: String, default: 'عادي' },
  شارة_VIP: { type: Boolean, default: false },
  تاريخ_التسجيل: { type: Date, default: Date.now },
  اخر_ظهور: { type: Date, default: Date.now },
  عدد_المتابعين: { type: Number, default: 0 },
  عدد_اللي_بتابعهم: { type: Number, default: 0 }
});

const User = mongoose.model('User', userSchema);

// ==========================================
// القسم 3: اعداد السيرفر
// ==========================================
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ==========================================
// القسم 4: API انشاء الحساب الحقيقي 💎
// ==========================================
app.post('/api/register', async (req, res) => {
  try {
    const { اسم, كنية, تاريخ_ميلاد, الجنس } = req.body;
    
    if (!اسم || !كنية || !تاريخ_ميلاد || !الجنس) {
      return res.status(400).json({ error: 'عبي كل الحقول يا سبع 👑' });
    }
    
    const birthDate = new Date(تاريخ_ميلاد);
    const age = new Date().getFullYear() - birthDate.getFullYear();
    
    if (age < 13) {
      return res.status(400).json({ error: 'لازم عمرك فوق 13 سنة 👑' });
    }
    
    let userId;
    let userExists = true;
    while (userExists) {
      userId = Math.floor(100000 + Math.random() * 900000).toString();
      userExists = await User.findOne({ userId });
    }
    
    const newUser = new User({
      userId,
      اسم,
      كنية,
      تاريخ_ميلاد: birthDate,
      العمر: age,
      الجنس,
      المخالب: 10,
      الهيبة: 0,
    });
    
    await newUser.save();
    
    console.log(`تم انشاء حساب فخم جديد: ${اسم} ${كنية} | ID: ${userId} | مخالب: 10💎`);
    
    res.status(201).json({
      message: 'مبروك يا سبع! حسابك صار جاهز 👑',
      user: {
        userId: newUser.userId,
        اسم: newUser.اسم,
        كنية: newUser.كنية,
        المخالب: newUser.المخالب,
        الهيبة: newUser.الهيبة
      }
    });
    
  } catch (err) {
    console.error('خطأ بالتسجيل:', err);
    res.status(500).json({ error: 'صار خطأ بالسيرفر. جرب مرة تانية 💎' });
  }
});

// ==========================================
// القسم 5: Socket للشات بعدين
// ==========================================
io.on('connection', (socket) => {
  console.log('يوزر جديد شبك, ID:', socket.id);
  socket.on('disconnect', () => {
    console.log('يوزر فصل:', socket.id);
  });
});

// ==========================================
// تشغيل السيرفر
// ==========================================
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`السيرفر طاير على بورت ${PORT} 🚀`);
  console.log('جدول Users + API التسجيل جاهزين بكل الفخامة 💎👑');
});
