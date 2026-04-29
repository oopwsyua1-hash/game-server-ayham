const express = require('express');
const path = require('path');
const app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// تشغيل صفحة الدخول تلقائياً
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// مسار صفحة البروفايل
app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

// محاكاة تسجيل الدخول والتحويل للبروفايل
app.post('/api/login', (req, res) => {
    res.json({ success: true, message: "أهلاً بك يا سبع", redirect: '/profile' });
});

// محاكاة إنشاء حساب
app.post('/api/register', (req, res) => {
    res.json({ success: true, message: "تم إنشاء حسابك الملكي بنجاح" });
});

// حل مشكلة الروابط
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log('------------------------------------');
    console.log('🦁 إمبراطورية السبع V3 - جاهزة تماماً');
    console.log(`🔥 السيرفر شغال يا أبو نمر على بورت: ${PORT}`);
    console.log('------------------------------------');
});
