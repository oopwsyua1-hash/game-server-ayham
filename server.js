const express = require('express');
const path = require('path');
const app = express();

// 1. إعداد المجلد العام للملفات (HTML, CSS, Images)
// تأكد أن ملف index.html موجود داخل مجلد اسمه public
app.use(express.static(path.join(__dirname, 'public')));

// 2. معالجة البيانات القادمة من الواجهة (عشان تسجيل الدخول مستقبلاً)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. المسار الرئيسي للموقع
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 4. رسالة ترحيبية عند تشغيل السيرفر (تظهر في الـ Logs عندك)
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log('====================================');
    console.log(`🚀 تم تشغيل سيرفر إمبراطورية السبع بنجاح`);
    console.log(`📍 السيرفر شغال على البورت: ${PORT}`);
    console.log('====================================');
});
