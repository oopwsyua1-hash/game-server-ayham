const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

// ===== بيقرأهم من Render تلقائياً =====
const JWT_SECRET = process.env.JWT_SECRET;
const MONGO_URI = process.env.MONGO_URI;
// =====================================

mongoose.connect(MONGO_URI);

// ===== Schemas =====
const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String,
  coins: { type: Number, default: 50000 },
  targetCoins: { type: Number, default: 1000000 },
  earnedCoins: { type: Number, default: 0 },
  role: { type: String, default: 'user' }
});
const User = mongoose.model('User', UserSchema);

const RoomSchema = new mongoose.Schema({
  name: String,
  price: Number
});
const Room = mongoose.model('Room', RoomSchema);

const MessageSchema = new mongoose.Schema({
  room: String,
  username: String,
  text: String,
  time: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', MessageSchema);

// ===== انشاء الرومات الاساسية =====
async function createDefaultRooms() {
  const count = await Room.countDocuments();
  if (count === 0) {
    await Room.create([
      { name: 'مجانية', price: 0 },
      { name: 'كبار الشخصيات 100K', price: 100000 },
      { name: 'VIP 500K', price: 500000 }
    ]);
    console.log('تم انشاء الرومات');
  }
}
createDefaultRooms();

// ===== تسجيل ودخول =====
app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if(!username ||!password) return res.json({ msg: 'عبي كل البيانات' });
    if(username.includes('@')) return res.json({ msg: 'اسم المستخدم ما بصير فيه @' });
    const exists = await User.findOne({ username });
    if(exists) return res.json({ msg: 'الاسم مستخدم' });
    const hash = await bcrypt.hash(password, 10);
    await User.create({ username, password: hash });
    res.json({ msg: 'تم انشاء الحساب بنجاح' });
  } catch(e) { console.log(e); res.status(400).json({ msg: 'خطأ بالسيرفر' }); }
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if(!user) return res.json({ msg: 'المستخدم غير موجود' });
    const match = await bcrypt.compare(password, user.password);
    if(!match) return res.json({ msg: 'كلمة السر غلط' });
    const token = jwt.sign({ id: user._id }, JWT_SECRET);
    res.json({ token, user });
  } catch(e) { console.log(e); res.status(400).json({ msg: 'خطأ بالسيرفر' }); }
});

app.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if(!token) return res.status(401).json({ msg: 'مافي توكن' });
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    res.json(user);
  } catch { res.status(401).json({ msg: 'توكن غلط' }); }
});

// ===== نظام الألعاب - 6 العاب =====
app.post('/game/luck', async (req, res) => {
  try {
    const { token, bet } = req.body;
    const betAmount = parseInt(bet);
    if(!betAmount || betAmount < 100) return res.json({ msg: 'اقل رهان 100' });
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if(user.coins < betAmount) return res.json({ msg: 'رصيدك ما بيكفي' });
    user.coins -= betAmount;
    const win = Math.random() < 0.5;
    if(win) {
      const winAmount = betAmount * 2;
      user.coins += winAmount;
      user.earnedCoins += betAmount;
      if(user.coins >= 1000000) user.coins = 300000;
      await user.save();
      res.json({ msg: `مبروك ربحت ${winAmount.toLocaleString()}! 🎉`, win: true, user });
    } else {
      user.coins = 0;
      await user.save();
      res.json({ msg: `خسرت! رصيدك صفر 😢`, win: false, user });
    }
  } catch { res.status(400).json({ msg: 'خطأ' }); }
});

app.post('/game/camel', async (req, res) => {
  try {
    const { token, bet, camelId } = req.body;
    const betAmount = parseInt(bet);
    if(!betAmount || betAmount < 100) return res.json({ msg: 'اقل رهان 100' });
    if(![1,2,3].includes(camelId)) return res.json({ msg: 'اختار جمل 1-3' });
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if(user.coins < betAmount) return res.json({ msg: 'رصيدك ما بيكفي' });
    user.coins -= betAmount;
    const winner = Math.floor(Math.random() * 3) + 1;
    const win = camelId === winner;
    if(win) {
      const winAmount = betAmount * 3;
      user.coins += winAmount;
      user.earnedCoins += betAmount * 2;
      if(user.coins >= 1000000) user.coins = 300000;
      await user.save();
      res.json({ msg: `الجمل ${winner} فاز! ربحت ${winAmount.toLocaleString()} 🐪🏆`, win: true, winner, user });
    } else {
      user.coins = 0;
      await user.save();
      res.json({ msg: `الجمل ${winner} فاز! خسرت وصار رصيدك صفر 😢`, win: false, winner, user });
    }
  } catch { res.status(400).json({ msg: 'خطأ' }); }
});

app.post('/game/worldcup', async (req, res) => {
  try {
    const { token, bet, team } = req.body;
    const betAmount = parseInt(bet);
    const teams = ['brazil','argentina','germany','france'];
    if(!betAmount || betAmount < 100) return res.json({ msg: 'اقل رهان 100' });
    if(!teams.includes(team)) return res.json({ msg: 'اختار فريق' });
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if(user.coins < betAmount) return res.json({ msg: 'رصيدك ما بيكفي' });
    user.coins -= betAmount;
    const winner = teams[Math.floor(Math.random() * 4)];
    const win = team === winner;
    const flags = {brazil:'🇧🇷', argentina:'🇦🇷', germany:'🇩🇪', france:'🇫🇷'};
    if(win) {
      const winAmount = betAmount * 4;
      user.coins += winAmount;
      user.earnedCoins += betAmount * 3;
      if(user.coins >= 1000000) user.coins = 300000;
      await user.save();
      res.json({ msg: `${flags[winner]} فاز! ربحت ${winAmount.toLocaleString()} 🏆`, win: true, winner, user });
    } else {
      user.coins = 0;
      await user.save();
      res.json({ msg: `${flags[winner]} فاز! خسرت وصار رصيدك صفر 😢`, win: false, winner, user });
    }
  } catch { res.status(400).json({ msg: 'خطأ' }); }
});

app.post('/game/rps', async (req, res) => {
  try {
    const { token, bet, choice } = req.body;
    const betAmount = parseInt(bet);
    const choices = ['rock','paper','scissors'];
    if(!betAmount || betAmount < 100) return res.json({ msg: 'اقل رهان 100' });
    if(!choices.includes(choice)) return res.json({ msg: 'اختار صح' });
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if(user.coins < betAmount) return res.json({ msg: 'رصيدك ما بيكفي' });
    user.coins -= betAmount;
    const botChoice = choices[Math.floor(Math.random() * 3)];
    const rules = { rock: 'scissors', paper: 'rock', scissors: 'paper' };
    if(choice === botChoice) {
      user.coins += betAmount;
      await user.save();
      return res.json({ msg: `تعادل! رجعلك رهانك 🤝`, draw: true, botChoice, user });
    } else if(rules[choice] === botChoice) {
      const winAmount = betAmount * 2;
      user.coins += winAmount;
      user.earnedCoins += betAmount;
      if(user.coins >= 1000000) user.coins = 300000;
      await user.save();
      res.json({ msg: `ربحت! ${choice} بتغلب ${botChoice} 🎉`, win: true, botChoice, user });
    } else {
      user.coins = 0;
      await user.save();
      res.json({ msg: `خسرت! ${botChoice} بتغلب ${choice} 😢 رصيدك صفر`, win: false, botChoice, user });
    }
  } catch { res.status(400).json({ msg: 'خطأ' }); }
});

app.post('/game/wheel', async (req, res) => {
  try {
    const { token, bet } = req.body;
    const betAmount = parseInt(bet);
    if(!betAmount || betAmount < 100) return res.json({ msg: 'اقل رهان 100' });
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if(user.coins < betAmount) return res.json({ msg: 'رصيدك ما بيكفي' });
    user.coins -= betAmount;
    const multipliers = [0, 0, 0.5, 1, 2, 5];
    const result = multipliers[Math.floor(Math.random() * 6)];
    if(result === 0) {
      user.coins = 0;
      await user.save();
      res.json({ msg: `العجلة وقفت على X0! خسرت وصار رصيدك صفر 😢`, win: false, multiplier: 0, user });
    } else {
      const winAmount = Math.floor(betAmount * result);
      user.coins += winAmount;
      if(result > 1) user.earnedCoins += Math.floor(betAmount * (result - 1));
      if(user.coins >= 1000000) user.coins = 300000;
      await user.save();
      res.json({ msg: `العجلة وقفت على X${result}! ربحت ${winAmount.toLocaleString()} 🎡`, win: true, multiplier: result, user });
    }
  } catch { res.status(400).json({ msg: 'خطأ' }); }
});

app.post('/game/dice', async (req, res) => {
  try {
    const { token, bet, number } = req.body;
    const betAmount = parseInt(bet);
    const chosenNumber = parseInt(number);
    if(!betAmount || betAmount < 100) return res.json({ msg: 'اقل رهان 100' });
    if(chosenNumber < 1 || chosenNumber > 6) return res.json({ msg: 'اختار رقم 1-6' });
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if(user.coins < betAmount) return res.json({ msg: 'رصيدك ما بيكفي' });
    user.coins -= betAmount;
    const diceResult = Math.floor(Math.random() * 6) + 1;
    const win = chosenNumber === diceResult;
    if(win) {
      const winAmount = betAmount * 6;
      user.coins += winAmount;
      user.earnedCoins += betAmount * 5;
      if(user.coins >= 1000000) user.coins = 300000;
      await user.save();
      res.json({ msg: `النرد طلع ${diceResult}! ربحت ${winAmount.toLocaleString()} 🎲🏆`, win: true, diceResult, user });
    } else {
      user.coins = 0;
      await user.save();
      res.json({ msg: `النرد طلع ${diceResult}! خسرت وصار رصيدك صفر 😢`, win: false, diceResult, user });
    }
  } catch { res.status(400).json({ msg: 'خطأ' }); }
});

// ===== الرومات =====
app.get('/rooms', async (req, res) => {
  const rooms = await Room.find();
  res.json(rooms);
});

// ===== Socket.io دردشة =====
io.on('connection', (socket) => {
  socket.on('joinRoom', async ({ room, username }) => {
    socket.join(room);
    const messages = await Message.find({ room }).sort({ time: -1 }).limit(50);
    socket.emit('history', messages.reverse());
  });
  socket.on('chatMessage', async ({ room, username, text }) => {
    const msg = await Message.create({ room, username, text });
    io.to(room).emit('message', msg);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`السيرفر شغال على ${PORT} 👑`));
