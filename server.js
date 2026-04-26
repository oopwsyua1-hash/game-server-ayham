const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI);

const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: String,
  name: String,
  lastName: String,
  country: String,
  birthDate: String,
  age: Number,
  gender: String,
  userId: { type: Number, unique: true },
  coins: { type: Number, default: 1000 },
  vipLevel: { type: Number, default: 0 },
  isOwner: { type: Boolean, default: false },
  isBanned: { type: Boolean, default: false },
  targetCoins: { type: Number, default: 0 },
  earnedCoins: { type: Number, default: 0 }
});

const User = mongoose.model('User', UserSchema);
const OWNER_EMAIL = 'm12341234ahmad@gmail.com';

// تسجيل حساب جديد
app.post('/register', async (req, res) => {
  try {
    const { email, password, name, lastName, country, birthDate, gender } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const userId = Math.floor(10000 + Math.random() * 90000);
    const age = new Date().getFullYear() - new Date(birthDate).getFullYear();
    
    const user = new User({
      email, password: hashed, name, lastName, country, birthDate, age, gender, userId
    });
    
    if(email === OWNER_EMAIL) {
      user.isOwner = true; 
      user.vipLevel = 10; 
      user.coins = 10000000;
      user.name = 'ABU NMR'; 
      user.lastName = 'ALHLEBI';
    }
    
    await user.save();
    res.json({ msg: 'تم التسجيل بنجاح', userId });
  } catch (e) { 
    res.status(400).json({ msg: 'الايميل مستخدم من قبل' }); 
  }
});

// تسجيل دخول
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ msg: 'حساب غير موجود' });
  if (user.isBanned) return res.status(400).json({ msg: 'حسابك محظور' });
  
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ msg: 'كلمة السر غلط' });
  
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
  res.json({ token, user });
});

// جلب بياناتي
app.post('/me', async (req, res) => {
  try {
    const { token } = req.body;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    res.json({ user });
  } catch { 
    res.status(400).json({ msg: 'جلسة منتهية سجل دخول مرة تانية' }); 
  }
});

// شراء VIP
app.post('/buyvip', async (req, res) => {
  try {
    const { token, vipLevel } = req.body;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    const prices = {1:5000, 3:25000, 8:1000000, 10:5000000};
    const price = prices[vipLevel];
    
    if(user.coins < price) return res.json({ msg: 'كوينزاتك ما بتكفي' });
    if(user.vipLevel >= vipLevel) return res.json({ msg: 'عندك VIP اعلى او نفسه' });
    
    user.coins -= price;
    user.vipLevel = vipLevel;
    await user.save();
    res.json({ msg: `مبروك صرت VIP ${vipLevel}`, user });
  } catch { 
    res.status(400).json({ msg: 'خطأ بالسيرفر' }); 
  }
});

// لوحة المالك - اضافة كوينزات
app.post('/owner/addcoins', async (req, res) => {
  try {
    const { token, userId, coins } = req.body;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const owner = await User.findById(decoded.id);
    if(!owner.isOwner) return res.status(403).json({ msg: 'انت مو المالك' });
    
    const target = await User.findOne({ userId: userId });
    if(!target) return res.json({ msg: 'ID المستخدم غلط' });
    
    target.coins += parseInt(coins);
    await target.save();
    res.json({ msg: `تم اضافة ${coins} كوينز لـ ${target.name}` });
  } catch { 
    res.status(400).json({ msg: 'خطأ بالسيرفر' }); 
  }
});

// لوحة المالك - حظر مستخدم
app.post('/owner/ban', async (req, res) => {
  try {
    const { token, userId } = req.body;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const owner = await User.findById(decoded.id);
    if(!owner.isOwner) return res.status(403).json({ msg: 'انت مو المالك' });
    
    const target = await User.findOne({ userId: userId });
    if(!target) return res.json({ msg: 'ID المستخدم غلط' });
    
    target.isBanned = true;
    await target.save();
    res.json({ msg: `تم حظر ${target.name}` });
  } catch { 
    res.status(400).json({ msg: 'خطأ بالسيرفر' }); 
  }
});

app.get('/', (req, res) => res.send('سيرفر السبع الحلبي شغال 👑'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`السيرفر شغال على ${PORT}`));
