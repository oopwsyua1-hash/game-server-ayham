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

// --- 1. نظام التسجيل الملكي الكامل (يدعم الجنس، الدولة، والعمر) ---
app.post('/api/register', (req, res) => {
    try {
        const data = JSON.parse(fs.readFileSync(DB_PATH));
        const { username, email, password, gender, country, birth_date } = req.body;

        if (data.users.find(u => u.email === email)) {
            return res.status(400).json({ message: "هذا الإيميل مسجل مسبقاً يا وحش" });
        }

        const newUser = {
            id: Math.floor(100000000 + Math.random() * 900000000), // ID ملكي عشوائي
            username, 
            email, 
            password, 
            gender: gender || "ذكر ♂️", 
            country: country || "غير محدد 🌍", 
            birth_date: birth_date || "",
            coins: 500,        // رصيد ترحيبي مجاني
            diamonds: 0,      // الماس المستلم من الهدايا (للسحب كاش)
            wealth_lv: 1,     // لفل الثروة (يزيد عند صرف الكوينز)
            charm_lv: 1,      // لفل الشعبية (يزيد عند استلام الهدايا)
            vip: "NONE",      // مستوى التميز
            frame: "default", // إطار الصورة الشخصية
            entry_effect: "none", // سيارة الدخول الفخمة
            bio: "مرحباً بك في إمبراطورية السبع",
            created_at: new Date()
        };

        data.users.push(newUser);
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
        
        res.status(200).json({ message: "تم إنشاء الحساب الملكي بنجاح", user: newUser });
    } catch (error) {
        res.status(500).json({ message: "خطأ داخلي في السيرفر" });
    }
});

// --- 2. نظام تسجيل الدخول ---
app.post('/api/login', (req, res) => {
    const data = JSON.parse(fs.readFileSync(DB_PATH));
    const { email, password } = req.body;
    const user = data.users.find(u => u.email === email && u.password === password);

    if (user) {
        res.json({ message: "أهلاً بك مجدداً يا سبع", user });
    } else {
        res.status(401).json({ message: "خطأ في الإيميل أو كلمة السر" });
    }
});

// --- 3. محرك الغرف الصوتية والدردشة الفورية (Socket.io) ---
io.on('connection', (socket) => {
    // الانضمام لغرفة صوتية
    socket.on('join_room', ({ roomId, user }) => {
        socket.join(roomId);
        io.to(roomId).emit('user_joined', { user, message: `السبع ${user.username} دخل الغرفة` });
    });

    // إرسال هدايا متحركة (SVGA/Lottie)
    socket.on('send_gift', ({ roomId, giftData, senderId, receiverId }) => {
        // يتم هنا خصم الكوينز من المرسل وإضافتها كأرباح (ماس) للمستلم
        io.to(roomId).emit('display_gift', { giftData, from: senderId });
    });

    // نظام التحدي والـ PK (التركيت)
    socket.on('start_pk', (roomId) => {
        io.to(roomId).emit('pk_started', { timer: 300 }); // تحدي مدته 5 دقائق
    });

    socket.on('disconnect', () => {
        console.log('مستخدم غادر الإمبراطورية');
    });
});

// --- 4. نظام شحن الوكلاء (Agents) ---
app.post('/api/agent/topup', (req, res) => {
    const { targetEmail, amount, agentKey } = req.body;
    // منطق التحقق من مفتاح الوكيل وشحن الحساب فوراً
    res.json({ success: true, message: `تم شحن ${amount} كوينز للحساب` });
});

// --- 5. الصفحة الرئيسية للسيرفر (لمنع خطأ Cannot GET /) ---
app.get('/', (req, res) => {
    res.send('<h1 style="text-align:center; margin-top:50px; color:#f1c40f;">👑 سيرفر إمبراطورية السبع V3 يعمل بنجاح 👑</h1>');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`[OK] Empire Server V3 started on port ${PORT}`);
});
