const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const path = require('path');

// 1. الاتصال بقاعدة البيانات الحقيقية - اذا فشل بيوقف كلشي
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('تم الاتصال بقاعدة البيانات الفخمة ✅');
    console.log('كلشي من هون ورايح رح ينحفظ حقيقي 💎');
  })
  .catch((err) => {
    console.error('فشل الاتصال بقاعدة البيانات ❌ السبب:', err.message);
    process.exit(1);
  });

// 2. اعداد السيرفر
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// 3. نخلي السيرفر يقرأ ملفات الواجهة من مجلد public
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// 4. الصفحة الرئيسية - هلق رح نعملها بعدين
app.get('/', (req, res) => {
  res.send('السيرفر الفخم شغال ✅ جاهزين نبني نظام الحسابات والمخالب 💎');
});

// 5. لما يتصل يوزر جديد
io.on('connection', (socket) => {
  console.log('يوزر جديد شبك, ID:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('يوزر فصل:', socket.id);
  });
});

// 6. شغل السيرفر
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`السيرفر طاير على بورت ${PORT} 🚀`);
});
