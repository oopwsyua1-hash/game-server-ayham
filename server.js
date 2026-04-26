const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 10000;

// ملفات ثابتة من مجلد public
app.use(express.static(path.join(__dirname, 'public')));

// تخزين الغرف بالذاكرة
let rooms = {};

// انشاء غرفة افتراضية 10000 اذا مو موجودة
const DEFAULT_ROOM = '10000';
if (!rooms[DEFAULT_ROOM]) {
    rooms[DEFAULT_ROOM] = {
        id: DEFAULT_ROOM,
        name: 'غرفة ايهم الرئيسية',
        ownerId: 'admin_ayham',
        admins: ['admin_ayham'],
        welcomeMessage: 'اهلا وسهلا فيك بغرفة ايهم 👑',
        agencyName: 'وكالة النجوم',
        onlineUsers: [],
        mics: Array(12).fill(null).map((_, i) => ({
            slot: i + 1,
            userId: null,
            username: null,
            avatar: null,
            locked: false,
            isMuted: false
        }))
    };
    console.log('✅ تم انشاء الغرفة الافتراضية 10000');
}

// صفحة الغرفة
app.get('/room/:roomId', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'room.html'));
});

// اي رابط تاني يرجع للصفحة الرئيسية
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Socket.io
io.on('connection', (socket) => {
    console.log('مستخدم جديد اتصل:', socket.id);

    // دخول غرفة
    socket.on('join-room', (data) => {
        const { roomId, userId, username } = data;

        if (!rooms[roomId]) {
            socket.emit('error', { message: 'الغرفة غير موجودة' });
            return;
        }

        socket.join(roomId);
        socket.roomId = roomId;
        socket.userId = userId || socket.id;
        socket.username = username || `ضيف_${socket.id.substring(0, 5)}`;

        // ضيفه للاونلاين اذا مو موجود
        const existingUser = rooms[roomId].onlineUsers.find(u => u.userId === socket.userId);
        if (!existingUser) {
            rooms[roomId].onlineUsers.push({
                userId: socket.userId,
                username: socket.username,
                socketId: socket.id
            });
        }

        console.log(`${socket.username} دخل غرفة ${roomId}`);

        // ابعت بيانات الغرفة كاملة
        socket.emit('room-data', {
            room: rooms[roomId],
            currentUser: {
                userId: socket.userId,
                username: socket.username
            }
        });

        // خبر الباقي انه في واحد دخل
        socket.to(roomId).emit('user-joined', {
            userId: socket.userId,
            username: socket.username
        });

        // حدث قائمة الاونلاين للكل
        io.to(roomId).emit('online-users-updated', rooms[roomId].onlineUsers);
    });

    // رسالة شات
    socket.on('chat-message', (data) => {
        const { roomId, message } = data;
        if (!rooms[roomId]) return;

        const msgData = {
            userId: socket.userId,
            username: socket.username,
            message: message,
            timestamp: Date.now()
        };

        io.to(roomId).emit('chat-message', msgData);
    });

    // طلوع مايك
    socket.on('take-mic', (data) => {
        const { roomId, slot } = data;
        if (!rooms[roomId]) return;

        // تأكد انو المايك فاضي ومو مقفول
        if (rooms[roomId].mics[slot - 1].userId === null &&!rooms[roomId].mics[slot - 1].locked) {
            // نزلو من اي مايك تاني اول
            rooms[roomId].mics = rooms[roomId].mics.map(mic => {
                if (mic.userId === socket.userId) {
                    return {...mic, userId: null, username: null, avatar: null };
                }
                return mic;
            });

            // طلعو عالمايك الجديد
            rooms[roomId].mics[slot - 1] = {
               ...rooms[roomId].mics[slot - 1],
                userId: socket.userId,
                username: socket.username,
                avatar: null
            };

            io.to(roomId).emit('mics-updated', rooms[roomId].mics);
        }
    });

    // نزول من المايك
    socket.on('leave-mic', (data) => {
        const { roomId } = data;
        if (!rooms[roomId]) return;

        rooms[roomId].mics = rooms[roomId].mics.map(mic => {
            if (mic.userId === socket.userId) {
                return {...mic, userId: null, username: null, avatar: null };
            }
            return mic;
        });

        io.to(roomId).emit('mics-updated', rooms[roomId].mics);
    });

    // فصل الاتصال
    socket.on('disconnect', () => {
        console.log('مستخدم فصل:', socket.id);
        const roomId = socket.roomId;

        if (roomId && rooms[roomId]) {
            // شيله من الاونلاين
            rooms[roomId].onlineUsers = rooms[roomId].onlineUsers.filter(u => u.userId!== socket.userId);

            // نزلو من المايك اذا كان طالع
            rooms[roomId].mics = rooms[roomId].mics.map(mic => {
                if (mic.userId === socket.userId) {
                    return {...mic, userId: null, username: null, avatar: null };
                }
                return mic;
            });

            // حدث للباقي
            io.to(roomId).emit('user-left', { userId: socket.userId });
            io.to(roomId).emit('online-users-updated', rooms[roomId].onlineUsers);
            io.to(roomId).emit('mics-updated', rooms[roomId].mics);
        }
    });
});

server.listen(PORT, () => {
    console.log(`🚀 السيرفر شغال على البورت ${PORT}`);
});
