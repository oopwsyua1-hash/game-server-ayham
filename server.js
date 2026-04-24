const express = require('express'); 
const mongoose = require('mongoose'); 
const cors = require('cors'); 
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken'); 
const path = require('path'); 

const app = express(); 
const PORT = process.env.PORT || 10000; 
const JWT_SECRET = 'ayham-secret-key-2024'; 

// Middleware
app.use(cors()); 
app.use(express.json()); 
app.use(express.static(path.join(__dirname, 'public'))); 

// اطبع كل طلب عشان نعرف اذا وصل او لا
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Body:', req.body);
  next();
});

// MongoDB Connection
const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI; 
if (!mongoURI) { 
  console.log('❌ MONGODB_URI مو موجود'); 
  process.exit(1); 
} 
mongoose.connect(mongoURI) 
  .then(() => console.log('✅ MongoDB Connected')) 
  .catch(err => { 
    console.log('❌ MongoDB Error:', err.message); 
    process.exit(1); 
  }); 

// User Schema
const userSchema = new mongoose.Schema({ 
  username: { type: String, required: true }, 
  lastName: { type: String, required: true }, 
  email: { type: String, required: true, unique: true }, 
  password: { type: String, required: true }, 
  country: { type: String, required: true }, 
  birthDate: { type: String, required: true }, 
  age: { type: Number, required: true }, 
  gender: { type: String, required: true }, 
  createdAt: { type: Date, default: Date.now } 
}); 
const User = mongoose.model('User', userSchema); 

// Register API
app.post('/api/register', async (req, res) => { 
  try { 
    const { username, lastName, email, password, country, birthDate, age, gender } = req.body; 
    
    if (!username || !lastName || !email || !password || !country || !birthDate || !age || !gender) {
      return res.status(400).json({ error: 'عبي كل الحقول المطلوبة' });
    }
    
    const existingUser = await User.findOne({ email }); 
    if (existingUser) { 
      return res.status(400).json({ error: 'الايميل مستخدم من قبل' }); 
    } 
    
    const hashedPassword = await bcrypt.hash(password, 10); 
    const newUser = new User({ username, lastName, email, password: hashedPassword, country, birthDate, age, gender }); 
    await newUser.save(); 
    
    const token = jwt.sign({ userId: newUser._id }, JWT_SECRET); 
    console.log('User registered:', email);
    res.json({ token, user: { username, lastName, email, country, age, gender } }); 
  } catch (error) { 
    console.log('REGISTER ERROR:', error.message); 
    res.status(500).json({ error: 'خطأ بالسيرفر', details: error.message }); 
  } 
}); 

// Login API
app.post('/api/login', async (req, res) => { 
  try { 
    const { email, password } = req.body; 
    if (!email || !password) return res.status(400).json({ error: 'عبي الايميل وكلمة السر' });
    
    const user = await User.findOne({ email }); 
    if (!user) return res.status(400).json({ error: 'الايميل او كلمة السر غلط' }); 
    
    const isValidPassword = await bcrypt.compare(password, user.password); 
    if (!isValidPassword) return res.status(400).json({ error: 'الايميل او كلمة السر غلط' }); 
    
    const token = jwt.sign({ userId: user._id }, JWT_SECRET); 
    console.log('User logged in:', email);
    res.json({ token, user: { username: user.username, lastName: user.lastName, email: user.email, country: user.country, age: user.age, gender: user.gender } }); 
  } catch (error) { 
    console.log('LOGIN ERROR:', error.message);
    res.status(500).json({ error: 'خطأ بالسيرفر', details: error.message }); 
  } 
}); 

// Profile API
app.get('/api/profile', async (req, res) => { 
  try { 
    const token = req.headers.authorization?.split(' ')[1]; 
    if (!token) return res.status(401).json({ error: 'مافي توكن' }); 
    const decoded = jwt.verify(token, JWT_SECRET); 
    const user = await User.findById(decoded.userId).select('-password'); 
    if (!user) return res.status(404).json({ error: 'اليوزر مو موجود' }); 
    res.json({ user }); 
  } catch (error) { 
    res.status(401).json({ error: 'توكن غلط او منتهي' }); 
  } 
}); 

// Routes للصفحات
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html'))); 
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html'))); 
app.get('/me', (req, res) => res.sendFile(path.join(__dirname, 'public', 'me.html'))); 

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
