const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 10000;

// تشغيل الملفات الثابتة (HTML, CSS, JS) من مجلد public
app.use(express.static(path.join(__dirname, 'public')));

// مسارات الصفحات الأساسية
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get('/chat', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/chat.html'));
});

app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/profile.html'));
});

// نظام الدردشة المباشر (Socket.io)
io.on('connection', (socket) => {
    console.log('مستخدم جديد دخل الإمبراطورية 🦁');

    // استقبال وإرسال الرسائل
    socket.on('chat message', (msg) => {
        io.emit('chat message', msg);
    });

    // استقبال وإرسال الصور
    socket.on('send image', (imageData) => {
        io.emit('receive image', imageData);
    });

    socket.on('disconnect', () => {
        console.log('مستخدم غادر الإمبراطورية');
    });
});

// بدء تشغيل السيرفر
server.listen(PORT, () => {
    console.log('------------------------------------');
    console.log(`جاهزة تماماً - V3 - إمبراطورية السبع 🦁`);
    console.log(`السيرفر شغال يا أبو نمر على بورت : ${PORT} 🔥`);
    console.log('------------------------------------');
});
