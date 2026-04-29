const express = require('express');
const path = require('path');
const app = express();

// 1. تعريف المجلد العام (هون بنحط الصور والـ HTML)
app.use(express.static(path.join(__dirname, 'public')));

// 2. إعدادات لاستقبال البيانات (مهمة للدردشة والحسابات مستقبلاً)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. توجيه الرابط الأساسي لملف index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 4. حل مشكلة "Cannot GET" لأي صفحة فرعية
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 5. تشغيل السيرفر على البورت المطلوب
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log('------------------------------------');
    console.log('🦁 إمبراطورية السبع V3 جاهزة للعمل');
    console.log(`🔥 السيرفر شغال الآن يا أبو نمر على بورت: ${PORT}`);
    console.log('------------------------------------');
});
