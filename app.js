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
  // معلومات التسجيل
  userId: { type: String, unique: true, required: true }, // ID مميز 6 ارقام
  اسم: { type: String, required: true },
  كنية: { type: String, required: true },
  تاريخ_ميلاد: { type: Date, required: true },
  العمر: { type: Number },
  الجنس: { type: String, enum: ['ذكر', 'أنثى'], required: true },
  ايميل: { type: String, unique: true, sparse: true },
  رقم_جوال: { type: String, unique: true, sparse: true },

  // الملف الشخصي
  صورة_البروفايل: { type: String, default: 'https://i.imgur.com/default-avatar.png' },
  صورة_الغلاف: { type: String, default: 'https://i.imgur.com/default-cover.png' },
  السيرة_الذاتية: { type: String, default: 'اهلا فيكم بملفي الشخصي 👑' },
  العنوان: { type: String, default: 'غير محدد' },
  الحالة: { type: String, enum: ['متصل', 'مخفي'], default: 'متصل' },

  // نظام الفخامة
  المخالب: { type: Number, default: 10 }, // 💎 هدية ترحيبية
  الهيبة: { type: Number, default: 0 }, // 👑
  اللفل: { type: Number, default: 1 },
  اطار_الاسم: { type: String, default: 'عادي' },
  شارة_VIP: { type: Boolean, default: false },

  // الإحصائيات
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

// الصفحة الرئيسية - مؤقتاً
app.get('/', (req, res) => {
  res.send('السيرفر الفخم شغال ✅ جدول Users جاهز بكل الحقول 💎');
});

// ==========================================
// القسم 4: Socket للشات بعدين
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
  console.log('جدول Users جاهز بكل الحقول: اسم، كنية، صورة، غلاف، مخالب 💎، هيبة 👑');
});
