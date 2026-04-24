require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const User = require('./models/User');
const Agency = require('./models/Agency');

const app = express();
app.use(express.json());
app.use(express.static('public'));

// MongoDB
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => console.log('❌ MongoDB Error:', err));

// Auth Middleware
const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// صفحات
app.get('/me', (req, res) => res.sendFile(path.join(__dirname, 'public', 'me.html')));
app.get('/edit-profile', (req, res) => res.sendFile(path.join(__dirname, 'public', 'edit-profile.html')));
app.get('/agency', (req, res) => res.sendFile(path.join(__dirname, 'public', 'agency.html')));

// API تسجيل
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hashedPassword });
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ message: 'Error' });
  }
});

// API دخول
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: 'اليوزر غير موجود' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'كلمة السر غلط' });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ message: 'Error' });
  }
});

// API بيانات اليوزر
app.get('/api/user/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('agency');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Error' });
  }
});

// API تحديث اليوزر
app.post('/api/user/update', auth, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.userId, req.body, { new: true });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Error' });
  }
});

// API انشاء وكالة
app.post('/api/agency/create', auth, async (req, res) => {
  try {
    const { name } = req.body;
    const agency = await Agency.create({
      name,
      owner: req.userId,
      members: [{ user: req.userId, role: 'owner' }]
    });
    await User.findByIdAndUpdate(req.userId, { agency: agency._id, agencyRole: 'owner' });
    res.json(agency);
  } catch (err) {
    res.status(500).json({ message: 'Error' });
  }
});

// API انضمام لوكالة
app.post('/api/agency/join', auth, async (req, res) => {
  try {
    const { agencyId } = req.body;
    const agency = await Agency.findOne({ agencyId });
    if (!agency) return res.status(404).json({ message: 'الوكالة غير موجودة' });

    const isMember = agency.members.some(m => m.user.toString() === req.userId);
    if (isMember) return res.status(400).json({ message: 'انت عضو بالفعل' });

    agency.members.push({ user: req.userId, role: 'member' });
    await agency.save();
    await User.findByIdAndUpdate(req.userId, { agency: agency._id, agencyRole: 'member' });
    res.json(agency);
  } catch (err) {
    res.status(500).json({ message: 'Error' });
  }
});

// API بيانات الوكالة
app.get('/api/agency/my', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate({
      path: 'agency',
      populate: { path: 'members.user', select: 'username avatar userId' }
    });
    if (!user.agency) return res.status(404).json({ message: 'لا يوجد وكالة' });
    res.json({ agency: user.agency, role: user.agencyRole });
  } catch (err) {
    res.status(500).json({ message: 'Error' });
  }
});

// API خروج من الوكالة
app.post('/api/agency/leave', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user.agency) return res.status(400).json({ message: 'لست في وكالة' });

    await Agency.updateOne(
      { _id: user.agency },
      { $pull: { members: { user: req.userId } } }
    );
    await User.findByIdAndUpdate(req.userId, { agency: null, agencyRole: null });
    res.json({ message: 'تم الخروج' });
  } catch (err) {
    res.status(500).json({ message: 'Error' });
  }
});

// تحديث بيانات الوكالة - للمالك والمشرف فقط
app.post('/api/agency/update', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user.agency || (user.agencyRole!== 'owner' && user.agencyRole!== 'admin')) {
      return res.status(403).json({ message: 'غير مصرح' });
    }
    await Agency.findByIdAndUpdate(user.agency, req.body);
    res.json({ message: 'تم التحديث' });
  } catch (err) {
    res.status(500).json({ message: 'Error' });
  }
});

// طرد عضو
app.post('/api/agency/kick', auth, async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(req.userId);
    if (!user.agency || (user.agencyRole!== 'owner' && user.agencyRole!== 'admin')) {
      return res.status(403).json({ message: 'غير مصرح' });
    }
    await Agency.updateOne(
      { _id: user.agency },
      { $pull: { members: { user: userId } } }
    );
    await User.findByIdAndUpdate(userId, { agency: null, agencyRole: null });
    res.json({ message: 'تم الطرد' });
  } catch (err) {
    res.status(500).json({ message: 'Error' });
  }
});

// ترقية عضو لمشرف
app.post('/api/agency/promote', auth, async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(req.userId);
    if (!user.agency || user.agencyRole!== 'owner') {
      return res.status(403).json({ message: 'المالك فقط يقدر يرقي' });
    }
    await Agency.updateOne(
      { _id: user.agency, 'members.user': userId },
      { $set: { 'members.$.role': 'admin' } }
    );
    await User.findByIdAndUpdate(userId, { agencyRole: 'admin' });
    res.json({ message: 'تمت الترقية' });
  } catch (err) {
    res.status(500).json({ message: 'Error' });
  }
});

// متابعة الوكالة
app.post('/api/agency/follow', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user.agency) return res.status(400).json({ message: 'لست في وكالة' });

    const agency = await Agency.findById(user.agency);
    if (!agency.followers.includes(req.userId)) {
      agency.followers.push(req.userId);
      await agency.save();
    }
    res.json({ message: 'تمت المتابعة' });
  } catch (err) {
    res.status(500).json({ message: 'Error' });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
