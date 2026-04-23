const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');

const app = express();
app.use(express.json());
app.use(express.static('public'));

// اتصال قاعدة البيانات - حط الرابط تبعك من MongoDB
mongoose.connect('mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/gameDB')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

// الصفحة الرئيسية
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// تسجيل الدخول
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  const user = await User.findOne({ 
    $or: [{ username: username }, { email: username }, { phone: username }] 
  });
  
  if (!user) {
    return res.status(400).json({ message: 'الحساب غير موجود' });
  }
  
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: 'كلمة السر غلط' });
  }
  
  res.json({ 
    message: 'تم تسجيل الدخول',
    user: {
      id: user._id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      balance: user.balance,
      avatar: user.avatar
    }
  });
});

// انشاء حساب
app.post('/register', async (req, res) => {
  const { firstName, lastName, age, birthdate, gender, country, bio, username, email, phone, password } = req.body;
  
  const exists = await User.findOne({ $or: [{ username }, { email }, { phone }] });
  if (exists) {
    return res.status(400).json({ message: 'اسم المستخدم او الايميل او الرقم موجود مسبقاً' });
  }
  
  const hashedPass = await bcrypt.hash(password, 10);
  
  const newUser = new User({
    firstName, lastName, age, birthdate, gender, country, bio,
    username, email, phone, password: hashedPass
  });
  
  await newUser.save();
  res.json({ message: 'تم انشاء الحساب بنجاح' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
