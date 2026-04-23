const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const User = require('./models/User');

const app = express();
app.use(express.json());
app.use(express.static('public'));

// اعداد رفع الصور
const storage = multer.diskStorage({
  destination: './public/uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });
app.use('/uploads', express.static('public/uploads'));

// الاتصال بقاعدة البيانات
mongoose.connect('mongodb+srv://sabonggaming1_db_user:nfMuSWdCbzn4Zk7A@cluster0.iwqejsw.mongodb.net/sab3?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// تسجيل حساب جديد
app.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, age, birthdate, gender, country, bio, username, email, phone, password } = req.body;

    // التحقق من التكرار
    const existingUser = await User.findOne({ $or: [{ username }, { email }, { phone }] });
    if (existingUser) {
      return res.status(400).json({ message: 'اسم المستخدم او الايميل او الرقم مستخدم من قبل' });
    }

    // تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash(password, 10);

    // انشاء المستخدم
    const user = new User({
      firstName,
      lastName,
      age,
      birthdate,
      gender,
      country,
      bio,
      username,
      email,
      phone,
      password: hashedPassword
    });

    await user.save();
    res.status(201).json({ message: 'تم انشاء الحساب بنجاح' });
  } catch (err) {
    res.status(500).json({ message: 'خطأ بالسيرفر', error: err.message });
  }
});

// تسجيل الدخول
app.post('/login', async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;

    // البحث بالايميل او الرقم
    const user = await User.findOne({
      $or: [{ email: emailOrPhone }, { phone: emailOrPhone }]
    });

    if (!user) {
      return res.status(400).json({ message: 'الحساب غير موجود' });
    }

    // التحقق من كلمة المرور
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'كلمة المرور غلط' });
    }

    // انشاء توكن
    const token = jwt.sign({ userId: user._id }, 'sab3_secret_key', { expiresIn: '7d' });

    res.json({
      message: 'تم تسجيل الدخول',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        balance: user.balance
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'خطأ بالسيرفر', error: err.message });
  }
});

// جلب كل المستخدمين - بدون ايميل او رقم او باسوورد
app.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password -email -phone').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'خطأ بالسيرفر' });
  }
});

// جلب بيانات مستخدم واحد
app.get('/user/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'المستخدم غير موجود' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'خطأ بالسيرفر' });
  }
});

// رفع صورة شخصية
app.post('/upload/avatar', upload.single('avatar'), async (req, res) => {
  try {
    const userId = req.body.userId;
    if (!req.file) return res.status(400).json({ message: 'لم يتم اختيار صورة' });

    const avatarPath = '/uploads/' + req.file.filename;
    await User.findByIdAndUpdate(userId, { avatar: avatarPath });
    res.json({ message: 'تم تحديث الصورة', path: avatarPath });
  } catch (err) {
    res.status(500).json({ message: 'خطأ بالرفع' });
  }
});

// رفع صورة غلاف
app.post('/upload/cover', upload.single('cover'), async (req, res) => {
  try {
    const userId = req.body.userId;
    if (!req.file) return res.status(400).json({ message: 'لم يتم اختيار صورة' });

    const coverPath = '/uploads/' + req.file.filename;
    await User.findByIdAndUpdate(userId, { cover: coverPath });
    res.json({ message: 'تم تحديث الغلاف', path: coverPath });
  } catch (err) {
    res.status(500).json({ message: 'خطأ بالرفع' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
