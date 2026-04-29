const express = require('express');
const path = require('path');
const app = express();

// إعداد المجلد العام للملفات
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// مسار تشغيل صفحة تسجيل الدخول (index.html)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// التعامل مع بيانات تسجيل الدخول
app.post('/api/login', (req, res) => {
    res.json({ success: true, message: "أهلاً بك يا سبع في إمبراطوريتك" });
});

// التعامل مع بيانات إنشاء الحساب
app.post('/api/register', (req, res) => {
    res.json({ success: true, message: "تم تأسيس حسابك الملكي بنجاح" });
});

// ضمان عدم ظهور خطأ Cannot GET
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log('------------------------------------');
    console.log('🦁 إمبراطورية السبع V3 جاهزة للعمل');
    console.log(`🔥 السيرفر شغال الآن يا أبو نمر على بورت: ${PORT}`);
    console.log('------------------------------------');
});
