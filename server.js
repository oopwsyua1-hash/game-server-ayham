const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
mongoose.connect(process.env.MONGO_URI);
const User = mongoose.model('User', { username: String, password: String });
app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body;
  if (await User.findOne({ username })) return res.status(400).json({ msg: 'المستخدم موجود' });
  await new User({ username, password: await bcrypt.hash(password, 10) }).save();
  res.json({ msg: 'تم التسجيل بنجاح' });
});
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.listen(process.env.PORT || 10000);
