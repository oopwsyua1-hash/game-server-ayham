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
  email: String, password: String, name: String, lastName: String,
  country: String, birthDate: String, age: Number, gender: String,
  userId: { type: Number, unique: true },
  coins: { type: Number, default: 1000 },
  vipLevel: { type: Number, default: 0 },
  isOwner: { type: Boolean, default: false },
  isBanned: { type: Boolean, default: false },
  animatedName: String,
  targetCoins: { type: Number, default: 0 },
  earnedCoins: { type: Number, default: 0 }
});

const User = mongoose.model('User', UserSchema);
const OWNER_EMAIL = 'm12341234ahmad@gmail.com';
const OWNER_PHONE = '0997461512';

app.post('/register', async (req, res) => {
  try {
    const { email, password, name, lastName, country, birthDate, gender } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const userId = Math.floor(10000 + Math.random() * 90000);
    const age = new Date().getFullYear() - new Date(birthDate).getFullYear();
    
    const user = new User({
      email, password: hashed, name, lastName, country, birthDate, age, gender, userId,
      animatedName: `← ${name} ${lastName} ←`
    });
    
    if(email === OWNER_EMAIL) {
      user.isOwner = true; user.vipLevel = 10; user.coins = 10000000;
      user.name = 'ABU NMR'; user.lastName = 'ALHLEBI';
    }
    
    await user.save();
    res.json({ msg: 'تم التسجيل', userId });
  } catch (e) { res.status(400).json({ msg: 'الايميل مستخدم' }); }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || user.isBanned) return res.status(400).json({ msg: 'حساب محظور' });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ msg: 'كلمة سر غلط' });
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
  res.json({ token, user });
});

app.get('/', (req, res) => {
  res.send('سيرفر السبع الحلبي شغال 👑');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`شغال على ${PORT}`));
