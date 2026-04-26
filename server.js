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
  isMusleh: { type: Boolean, default: false },
  isBanned: { type: Boolean, default: false },
  targetCoins: { type: Number, default: 0 },
  earnedCoins: { type: Number, default: 0 }
});

const RoomSchema = new mongoose.Schema({
  roomId: { type: Number, unique: true },
  name: String,
  maxPlayers: { type: Number, default: 4 },
  players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isActive: { type: Boolean, default: true }
});

const MessageSchema = new mongoose.Schema({
  roomId: Number,
  userId: Number,
  name: String,
  vipLevel: Number,
  text: String,
  timestamp: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);
const Room = mongoose.model('Room', RoomSchema);
const Message = mongoose.model('Message', MessageSchema);
const OWNER_EMAIL = 'm12341234ahmad@gmail.com';

// انشاء رومات افتراضية
async function createDefaultRooms() {
  const count = await Room.countDocuments();
  if(count === 0) {
    await Room.create({ roomId: 1, name: 'روم السبع 1', maxPlayers: 4, players: [] });
    await Room.create({ roomId: 2, name: 'روم السبع 2', maxPlayers: 4, players: [] });
    await Room.create({ roomId: 3, name: 'روم VIP 👑', maxPlayers: 4, players: [] });
  }
}
createDefaultRooms();
// ===== نظام الألعاب - 6 العاب كاملة =====

// 1. ضربة حظ 50/50
app.post('/game/luck', async (req, res) => {
  try {
    const { token, bet } = req.body;
    const betAmount = parseInt(bet);
    if(!betAmount || betAmount < 100) return res.json({ msg: 'اقل رهان 100' });
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
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

// 2. سباق جمال - 3 جمال
app.post('/game/camel', async (req, res) => {
  try {
    const { token, bet, camelId } = req.body;
    const betAmount = parseInt(bet);
    if(!betAmount || betAmount < 100) return res.json({ msg: 'اقل رهان 100' });
    if(![1,2,3].includes(camelId)) return res.json({ msg: 'اختار جمل 1-3' });
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
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

// 3. كاس العالم - 4 فرق
app.post('/game/worldcup', async (req, res) => {
  try {
    const { token, bet, team } = req.body;
    const betAmount = parseInt(bet);
    const teams = ['brazil','argentina','germany','france'];
    if(!betAmount || betAmount < 100) return res.json({ msg: 'اقل رهان 100' });
    if(!teams.includes(team)) return res.json({ msg: 'اختار فريق' });
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
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

// 4. حجر ورقة مقص
app.post('/game/rps', async (req, res) => {
  try {
    const { token, bet, choice } = req.body;
    const betAmount = parseInt(bet);
    const choices = ['rock','paper','scissors'];
    if(!betAmount || betAmount < 100) return res.json({ msg: 'اقل رهان 100' });
    if(!choices.includes(choice)) return res.json({ msg: 'اختار صح' });
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
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

// 5. عجلة الحظ - 6 خانات
app.post('/game/wheel', async (req, res) => {
  try {
    const { token, bet } = req.body;
    const betAmount = parseInt(bet);
    if(!betAmount || betAmount < 100) return res.json({ msg: 'اقل رهان 100' });
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
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

// 6. نرد الحظ - اختار رقم 1-6
app.post('/game/dice', async (req, res) => {
  try {
    const { token, bet, number } = req.body;
    const betAmount = parseInt(bet);
    const chosenNumber = parseInt(number);
    if(!betAmount || betAmount < 100) return res.json({ msg: 'اقل رهان 100' });
    if(chosenNumber < 1 || chosenNumber > 6) return res.json({ msg: 'اختار رقم 1-6' });
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
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
  if (user.isBanned) return res.status(400).json({ msg: 'حسابك محظور تواصل مع المالك' });

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

// جلب كل الرومات
app.post('/rooms', async (req, res) => {
  try {
    const rooms = await Room.find({ isActive: true }).populate('players', 'name lastName vipLevel userId');
    res.json({ rooms });
  } catch {
    res.status(400).json({ msg: 'خطأ بالسيرفر' });
  }
});

// دخول روم
app.post('/joinroom', async (req, res) => {
  try {
    const { token, roomId } = req.body;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    const room = await Room.findOne({ roomId: roomId });

    if(!room) return res.json({ msg: 'الروم مو موجود' });
    
    await Room.updateMany({ players: user._id }, { $pull: { players: user._id } });

    if(room.players.length >= room.maxPlayers && user.vipLevel < 8) {
      return res.json({ msg: 'الروم ممتلئ. بس VIP 8+ بيقدر يدخل' });
    }

    room.players.push(user._id);
    await room.save();
    
    const updatedRoom = await Room.findOne({ roomId }).populate('players', 'name lastName vipLevel userId');
    res.json({ msg: `دخلت ${room.name}`, room: updatedRoom });
  } catch {
    res.status(400).json({ msg: 'خطأ بالسيرفر' });
  }
});

// طلوع من الروم
app.post('/leaveroom', async (req, res) => {
  try {
    const { token } = req.body;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    await Room.updateMany({ players: user._id }, { $pull: { players: user._id } });
    res.json({ msg: 'طلعت من الروم' });
  } catch {
    res.status(400).json({ msg: 'خطأ بالسيرفر' });
  }
});

// ارسال رسالة بالشات
app.post('/sendmessage', async (req, res) => {
  try {
    const { token, roomId, text } = req.body;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    const msg = new Message({
      roomId, userId: user.userId, name: user.name + ' ' + user.lastName,
      vipLevel: user.vipLevel, text
    });
    await msg.save();
    res.json({ msg: 'تم الارسال' });
  } catch {
    res.status(400).json({ msg: 'خطأ بالسيرفر' });
  }
});

// جلب رسائل الروم
app.post('/getmessages', async (req, res) => {
  try {
    const { roomId } = req.body;
    const messages = await Message.find({ roomId }).sort({ timestamp: -1 }).limit(50);
    res.json({ messages: messages.reverse() });
  } catch {
    res.status(400).json({ msg: 'خطأ بالسيرفر' });
  }
});

// طلب سحب ارباح التارجت على شام كاش
app.post('/requestwithdraw', async (req, res) => {
  try {
    const { token, shamCashNumber } = req.body;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if(user.earnedCoins < user.targetCoins) {
      return res.json({ msg: `لسا ما وصلت للتارجت. باقيلك ${(user.targetCoins - user.earnedCoins).toLocaleString()} كوينز` });
    }
    
    if(user.earnedCoins < 10000) {
      return res.json({ msg: 'اقل مبلغ للسحب 10,000 كوينز' });
    }

    const withdrawAmount = user.earnedCoins;
    user.earnedCoins = 0;
    user.targetCoins = 0;
    await user.save();
    
    res.json({ 
      msg: `تم ارسال طلب سحب ${withdrawAmount.toLocaleString()} كوينز على رقم شام كاش: ${shamCashNumber}\nرح يوصلك التحويل خلال 24 ساعة من المالك`, 
      user 
    });
  } catch {
    res.status(400).json({ msg: 'خطأ بالسيرفر' });
  }
});

// تحويل كوينزات بين اليوزرات
app.post('/transfer', async (req, res) => {
  try {
    const { token, toUserId, amount } = req.body;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const fromUser = await User.findById(decoded.id);
    const toUser = await User.findOne({ userId: toUserId });
    const transferAmount = parseInt(amount);

    if(!toUser) return res.json({ msg: 'ID المستلم غلط' });
    if(fromUser.userId == toUserId) return res.json({ msg: 'ما فيك تحول لنفسك' });
    if(fromUser.coins < transferAmount) return res.json({ msg: 'رصيدك ما بيكفي' });
    if(transferAmount <= 0) return res.json({ msg: 'المبلغ غلط' });

    fromUser.coins -= transferAmount;
    toUser.coins += transferAmount;
    toUser.earnedCoins += transferAmount;

    await fromUser.save();
    await toUser.save();
    res.json({ msg: `تم تحويل ${transferAmount.toLocaleString()} لـ ${toUser.name}`, user: fromUser });
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
    target.earnedCoins += parseInt(coins);
    await target.save();
    res.json({ msg: `تم اضافة ${coins} كوينز لـ ${target.name}` });
  } catch {
    res.status(400).json({ msg: 'خطأ بالسيرفر' });
  }
});

// لوحة المالك - تحديد تارجت
app.post('/owner/settarget', async (req, res) => {
  try {
    const { token, userId, targetCoins } = req.body;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const owner = await User.findById(decoded.id);
    if(!owner.isOwner) return res.status(403).json({ msg: 'انت مو المالك' });

    const target = await User.findOne({ userId: userId });
    if(!target) return res.json({ msg: 'ID المستخدم غلط' });

    target.targetCoins = parseInt(targetCoins);
    target.earnedCoins = 0;
    await target.save();
    res.json({ msg: `تم تحديد تارجت ${targetCoins} لـ ${target.name}` });
  } catch {
    res.status(400).json({ msg: 'خطأ بالسيرفر' });
  }
});

// لوحة المالك - تعيين مُصلِح
app.post('/owner/setmusleh', async (req, res) => {
  try {
    const { token, userId } = req.body;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const owner = await User.findById(decoded.id);
    if(!owner.isOwner) return res.status(403).json({ msg: 'انت مو المالك' });

    const target = await User.findOne({ userId: userId });
    if(!target) return res.json({ msg: 'ID المستخدم غلط' });

    target.isMusleh = true;
    await target.save();
    res.json({ msg: `تم تعيين ${target.name} مُصلِح` });
  } catch {
    res.status(400).json({ msg: 'خطأ بالسيرفر' });
  }
});

// لوحة المالك - ازالة مُصلِح
app.post('/owner/removemusleh', async (req, res) => {
  try {
    const { token, userId } = req.body;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const owner = await User.findById(decoded.id);
    if(!owner.isOwner) return res.status(403).json({ msg: 'انت مو المالك' });

    const target = await User.findOne({ userId: userId });
    if(!target) return res.json({ msg: 'ID المستخدم غلط' });

    target.isMusleh = false;
    await target.save();
    res.json({ msg: `تم ازالة ${target.name} من المُصلِحين` });
  } catch {
    res.status(400).json({ msg: 'خطأ بالسيرفر' });
  }
});

// لوحة المالك - عرض كل التارجتات
app.post('/owner/gettargets', async (req, res) => {
  try {
    const { token } = req.body;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const owner = await User.findById(decoded.id);
    if(!owner.isOwner) return res.status(403).json({ msg: 'انت مو المالك' });

    const users = await User.find({ targetCoins: { $gt: 0 } }).select('name userId targetCoins earnedCoins');
    res.json({ users });
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

// لوحة المالك - فك حظر
app.post('/owner/unban', async (req, res) => {
  try {
    const { token, userId } = req.body;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const owner = await User.findById(decoded.id);
    if(!owner.isOwner) return res.status(403).json({ msg: 'انت مو المالك' });

    const target = await User.findOne({ userId: userId });
    if(!target) return res.json({ msg: 'ID المستخدم غلط' });

    target.isBanned = false;
    await target.save();
    res.json({ msg: `تم فك حظر ${target.name}` });
  } catch {
    res.status(400).json({ msg: 'خطأ بالسيرفر' });
  }
});

// المُصلِح - تصليح كلمة سر
app.post('/musleh/resetpassword', async (req, res) => {
  try {
    const { token, userId, newPassword } = req.body;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const musleh = await User.findById(decoded.id);
    if(!musleh.isMusleh &&!musleh.isOwner) return res.status(403).json({ msg: 'انت مو مُصلِح' });

    const target = await User.findOne({ userId: userId });
    if(!target) return res.json({ msg: 'ID المستخدم غلط' });

    const hashed = await bcrypt.hash(newPassword, 10);
    target.password = hashed;
    await target.save();
    res.json({ msg: `تم تغيير كلمة سر ${target.name}` });
  } catch {
    res.status(400).json({ msg: 'خطأ بالسيرفر' });
  }
});

// المُصلِح - تصفير كوينزات
app.post('/musleh/zerocoins', async (req, res) => {
  try {
    const { token, userId } = req.body;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const musleh = await User.findById(decoded.id);
    if(!musleh.isMusleh &&!musleh.isOwner) return res.status(403).json({ msg: 'انت مو مُصلِح' });

    const target = await User.findOne({ userId: userId });
    if(!target) return res.json({ msg: 'ID المستخدم غلط' });

    target.coins = 0;
    await target.save();
    res.json({ msg: `تم تصفير كوينزات ${target.name}` });
  } catch {
    res.status(400).json({ msg: 'خطأ بالسيرفر' });
  }
});

// المُصلِح - فك حظر
app.post('/musleh/unban', async (req, res) => {
  try {
    const { token, userId } = req.body;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const musleh = await User.findById(decoded.id);
    if(!musleh.isMusleh &&!musleh.isOwner) return res.status(403).json({ msg: 'انت مو مُصلِح' });

    const target = await User.findOne({ userId: userId });
    if(!target) return res.json({ msg: 'ID المستخدم غلط' });

    target.isBanned = false;
    await target.save();
    res.json({ msg: `تم فك حظر ${target.name}` });
  } catch {
    res.status(400).json({ msg: 'خطأ بالسيرفر' });
  }
});

app.get('/', (req, res) => res.send('سيرفر السبع الحلبي شغال 👑'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`السيرفر شغال على ${PORT}`));
