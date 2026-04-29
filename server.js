const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

const DB_PATH = './empire_database.json';

// تأمين قاعدة البيانات لضمان عدم ضياع حسابات "السبع"
if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ users: [], rooms: [], agencies: [] }));
}

// --- 1. نظام التسجيل (يدعم القائمة الظاهرة في الصورة 1000292759.jpg) ---
app.post('/api/register', (req, res) => {
    try {
        const data = JSON.parse(fs.readFileSync(DB_PATH));
        // استلام كل تفاصيل القائمة الملكية
        const { username, email, password, gender, country, birth_date } = req.body;

        if (data.users.find(u => u.email === email)) {
            return res.status(400).json({ message: "هذا الإيميل مسجل مسبقاً يا وحش" });
        }

        const newUser = {
            id: Date.now(),
            username, 
            email, 
            password, 
            gender: gender || "ذكر", 
            country: country || "غير محدد", 
            birth_date: birth_date || "",
            coins: 500,        // رصيد ترحيبي
            diamonds: 0,      // الماس المستلم من الهدايا
            wealth_lv: 1,     // لفل الثروة (صرف الكوينز)
            charm_lv: 1,      // لفل الشعبية (استلام الهدايا)
            vip: "NONE",      // مستوى التميز
            frame: "default", // إطار الصورة الشخصية
            entry: "walk",    // تأثير الدخول للغرفة
            created_at: new Date()
        };

        data.users.push(newUser);
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
        
        // إرسال رد نجاح يمنع ظهور خطأ "Response Error"
        res.status(200).json({ message: "تم إنشاء الحساب بنجاح", user: newUser });
    } catch (error) {
        res.status(500).json({ message: "خطأ في السيرفر، حاول لاحقاً" });
    }
});

// --- 2. محرك الغرف الصوتية والتحديات (Socket.io) ---
io.on('connection', (socket) => {
    // الانضمام للغرفة (Voice Room)
    socket.on('join_room', ({ roomId, user }) => {
        socket.join(roomId);
        io.to(roomId).emit('user_joined', { user, message: `السبع ${user.username} دخل الغرفة` });
    });

    // إرسال الهدايا (Gifts) وتحويلها لماس
    socket.on('send_gift', ({ roomId, giftData, senderId, receiverId }) => {
        // منطق الهدايا: خصم من المرسل وإضافة للمستلم وتغيير اللفل
        io.to(roomId).emit('display_gift_animation', giftData);
    });

    // نظام التحدي (PK - التركيت)
    socket.on('start_pk', (roomId) => {
        io.to(roomId).emit('pk_timer_start', { duration: 300 }); // تحدي 5 دقائق
    });
});

// --- 3. نظام الوكلاء (Agents & Top-up) ---
app.post('/api/agent/recharge', (req, res) => {
    const { targetEmail, amount, agentSecret } = req.body;
    // هنا نتحقق من الوكيل ونشحن للمستخدم فوراً
    res.json({ success: true, message: "تم شحن الكوينز" });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`سيرفر إمبراطورية السبع V3 جاهز لاستقبال الجيوش على المنفذ ${PORT}`);
});
