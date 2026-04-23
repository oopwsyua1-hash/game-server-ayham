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

const storage = multer.diskStorage({
  destination: './public/uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });
app.use('/uploads', express.static('public/uploads'));

mongoose.connect('mongodb+srv://ayham:ZcgeeHmqNncajhGk@cluster0.oad1i3x.mongodb.net/sab3?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

app.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, age, birthdate, gender, country, bio, username, email, phone, password } = req.body;
    const existingUser = await User.findOne({ $or: [{ username }, { email }, { phone }] });
    if (existingUser) {
      return res.status(400).json({ message: 'اسم المستخدم او الايميل او الرقم مستخدم من قبل' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      firstName, lastName, age, birthdate, gender, country, bio, username, email, phone, password: hashedPassword
    });
    await user.save();
    res.status(201).json({ message: 'تم انشاء الحساب بنجاح' });
  } catch (err) {
    res.status(500).json({ message: 'خطأ بالسيرفر', error: err.message });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;
    const user = await User.findOne({
      $or: [{ email: emailOrPhone }, { phone: emailOrPhone }]
    });
    if (!user) return res.status(400).json({ message: 'الحساب غير موجود' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'كلمة المرور غلط' });
    const token = jwt.sign({ userId: user._id }, 'sab3_secret_key', { expiresIn: '7d' });
    res.json({
      message: 'تم تسجيل الدخول',
      token,
      user: { id: user._id, firstName: user.firstName, lastName: user.lastName, username: user.username, balance: user.balance }
    });
  } catch (err) {
    res.status(500).json({ message: 'خطأ بالسيرفر', error: err.message });
  }
});

app.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password -email -phone').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'خطأ بالسيرفر' });
  }
});

app.get('/user/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'المستخدم غير موجود' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'خطأ بالسيرفر' });
  }
});

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
  console.log(`السبع الحلبي شغال على ${PORT}`);
});
