const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// الربط بقاعدة البيانات باستخدام الرابط اللي أنت حاطه بـ Render
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("تم الاتصال بخزنة السبع بنجاح 🦁"))
  .catch(err => console.log("خطأ في الاتصال: ", err));

// نموذج بيانات المستخدم (الكوينز والـ VIP)
const UserSchema = new mongoose.Schema({
    userId: String,
    name: String,
    coins: { type: Number, default: 0 },
    vip_level: { type: Number, default: 0 }
});

const User = mongoose.model('User', UserSchema);

// نقطة فحص السيرفر
app.get('/', (req, res) => {
    res.send('سيرفر إمبراطورية السبع شغال وجاهز يا أبو نمر! 🔥');
});

// دالة جلب بيانات السبع
app.get('/user/:id', async (req, res) => {
    const user = await User.findOne({ userId: req.params.id });
    res.json(user || { msg: "غير موجود" });
});

// دالة تحديث الكوينز (شحن أو خصم)
app.post('/update-coins', async (req, res) => {
    const { userId, amount } = req.body;
    const user = await User.findOneAndUpdate(
        { userId },
        { $inc: { coins: amount } },
        { new: true, upsert: true }
    );
    res.json({ status: "success", newBalance: user.coins });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`السيرفر شغال على بورت ${PORT}`));
