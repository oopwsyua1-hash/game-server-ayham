const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { MongoClient } = require('mongodb');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');

const app = express();
app.use(express.json());
app.use(express.static('public'));

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Multer config
const storage = multer.memoryStorage();
const upload = multer({ storage });

// MongoDB
const client = new MongoClient(process.env.MONGODB_URI);
let db;
client.connect().then(() => {
  db = client.db('gameDB');
  console.log('MongoDB connected');
});

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'secret123';

// Middleware للتحقق من التوكن
const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'مطلوب تسجيل دخول' });
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ error: 'توكن غير صالح' });
  }
};

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/me', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'me.html'));
});

// تسجيل حساب جديد
app.post('/api/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    const exists = await db.collection('users').findOne({ username });
    if (exists) return res.status(400).json({ error: 'اسم المستخدم موجود' });

    const hashed = await bcrypt.hash(password, 10);
    const userId = Date.now().toString().slice(-7);
    const user = {
      username,
      password: hashed,
      email,
      userId,
      coins: 0,
      createdAt: new Date()
    };

    await db.collection('users').insertOne(user);
    const token = jwt.sign({ userId: user.userId }, JWT_SECRET);
    res.json({ success: true, token, user: { username, userId, coins: 0 } });
  } catch (err) {
    res.status(500).json({ error: 'خطأ بالسيرفر' });
  }
});

// تسجيل دخول
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await db.collection('users').findOne({ username });
    if (!user) return res.status(400).json({ error: 'المستخدم غير موجود' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: 'كلمة السر غلط' });

    const token = jwt.sign({ userId: user.userId }, JWT_SECRET);
    res.json({ success: true, token, user: { username: user.username, userId: user.userId, coins: user.coins } });
  } catch (err) {
    res.status(500).json({ error: 'خطأ بالسيرفر' });
  }
});

// جلب بيانات البروفايل
app.get('/api/profile', auth, async (req, res) => {
  try {
    const user = await db.collection('users').findOne({ userId: req.userId });
    if (!user) return res.status(404).json({ error: 'مستخدم غير موجود' });
    delete user.password;
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'خطأ بالسيرفر' });
  }
});

// تعديل البروفايل
app.put('/api/profile', auth, async (req, res) => {
  try {
    const { username, lastName, country, birthDate, gender, bio } = req.body;
    await db.collection('users').updateOne(
      { userId: req.userId },
      { $set: { username, lastName, country, birthDate, gender, bio } }
    );
    res.json({ success: true, msg: 'تم التحديث' });
  } catch (err) {
    res.status(500).json({ error: 'خطأ بالسيرفر' });
  }
});

// رفع صورة البروفايل
app.post('/api/upload-avatar', auth, upload.single('avatar'), async (req, res) => {
  try {
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream({ folder: 'avatars' }, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }).end(req.file.buffer);
    });
    await db.collection('users').updateOne({ userId: req.userId }, { $set: { avatar: result.secure_url } });
    res.json({ success: true, url: result.secure_url });
  } catch (err) {
    res.status(500).json({ error: 'فشل الرفع' });
  }
});

// رفع صورة الغلاف
app.post('/api/upload-cover', auth, upload.single('cover'), async (req, res) => {
  try {
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream({ folder: 'covers' }, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }).end(req.file.buffer);
    });
    await db.collection('users').updateOne({ userId: req.userId }, { $set: { cover: result.secure_url } });
    res.json({ success: true, url: result.secure_url });
  } catch (err) {
    res.status(500).json({ error: 'فشل الرفع' });
  }
});

// مستخدم عشوائي
app.get('/api/random-user', async (req, res) => {
  try {
    const count = await db.collection('users').countDocuments();
    const random = Math.floor(Math.random() * count);
    const user = await db.collection('users').findOne({}, { skip: random });
    res.json({ username: user?.username || 'مستخدم مميز' });
  } catch {
    res.json({ username: 'مستخدم مميز' });
  }
});

// انشاء وكالة
app.post('/api/create-agency', auth, async (req, res) => {
  try {
    const { agencyName } = req.body;
    await db.collection('users').updateOne(
      { userId: req.userId },
      { $set: { agencyName, isAgencyOwner: true } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'خطأ بالسيرفر' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
