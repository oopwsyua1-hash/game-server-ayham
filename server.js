const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// MongoDB Connection - حطيت الباسوورد الجديد Nmr1234567890
mongoose.connect('mongodb+srv://ayham:Nmr1234567890@cluster0.oad1i3x.mongodb.net/sab3?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => console.log('Connected to MongoDB ✅'))
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Register
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'كل الحقول مطلوبة' });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'اليوزر أو الإيميل موجود مسبقاً' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();

    const token = jwt.sign({ userId: user._id }, 'sab3_secret_key_2024', { expiresIn: '7d' });
    res.status(201).json({ token, username: user.username });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'خطأ بالسيرفر', error: error.message });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'الإيميل والباسوورد مطلوبين' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'الإيميل أو الباسوورد غلط' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'الإيميل أو الباسوورد غلط' });
    }

    const token = jwt.sign({ userId: user._id }, 'sab3_secret_key_2024', { expiresIn: '7d' });
    res.json({ token, username: user.username });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'خطأ بالسيرفر', error: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`السبع الحلبي شغال على ${PORT}`);
});
