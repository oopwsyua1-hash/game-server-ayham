# تطبيق Hani Jar Clone - دليل التشغيل السريع

## 🚀 البدء السريع (5 دقائق)

### المتطلبات:
- Node.js مثبت
- Java 8+ (لـ Android)
- MongoDB URI جاهز

---

## 1️⃣ تشغيل Backend

```bash
# في المجلد الرئيسي
npm install

# إنشء ملف .env
echo 'PORT=3000' > .env
echo 'MONGODB_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/hanijar' >> .env
echo 'JWT_SECRET=your-secret-key-2024' >> .env

# تشغيل السيرفر
node server.js
```

**يجب ترى رسالة:** ✅ MongoDB Connected - إمبراطورية السبع شغال بكفاءة

---

## 2️⃣ تشغيل تطبيق Android

### الطريقة 1: عبر Android Studio
```bash
cd android
# افتح في Android Studio: File → Open → اختر مجلد android
# اضغط Run (Shift + F10)
```

### الطريقة 2: عبر Gradle
```bash
cd android
./gradlew installDebug
```

**ملاحظة مهمة:** تأكد من تحديث `BASE_URL` في:
`android/app/src/main/kotlin/com/ayham/hanijar/data/api/RetrofitClient.kt`

```kotlin
private const val BASE_URL = "http://your-server-ip:3000/"
```

---

## 3️⃣ تشغيل لوحة التحكم

```bash
cd admin
npm install
npm start
```

**ستفتح على:** http://localhost:3000

---

## 📱 اختبر التطبيق فوراً

### بيانات الاختبار:

**حساب المسؤول (Admin Dashboard):**
```
Email: test@example.com
Password: test123
```

**حساب مستخدم عادي (Android App):**
```
Email: user@example.com
Password: user123
```

### الخطوات:
1. سجل دخول في التطبيق
2. ستشوف قائمة الغرف الموجودة
3. اختر غرفة أو أنشئ غرفة جديدة
4. أرسل هدايا وشوف التأثيرات
5. شوف ملفك الشخصي

---

## 🔗 Endpoints المتاحة

### Authentication
```
POST /api/register     - إنشاء حساب
POST /api/login        - تسجيل دخول
GET /api/profile       - جلب البيانات الشخصية
PUT /api/profile/update - تحديث البيانات
```

### Rooms
```
GET /api/rooms         - قائمة الغرف
POST /api/create-room  - إنشاء غرفة
GET /api/room-support/:room_id - إحصائيات الغرفة
```

### Gifts
```
GET /api/gifts         - قائمة الهدايا
POST /api/send-gift    - إرسال هدية
```

### WebSocket
```
socket.on('joinRoom')      - الدخول للغرفة
socket.on('sendMessage')   - إرسال رسالة
socket.on('sitOnMic')      - الجلوس على مايك
socket.on('disconnect')    - قطع الاتصال
```

---

## 🆘 حل المشاكل الشائعة

### مشكلة: "Cannot connect to server"
**الحل:**
- تأكد من تشغيل Backend
- تحقق من الـ IP address
- تأكد من فتح البورت 3000

### مشكلة: "MongoDB Connection Error"
**الحل:**
- تحقق من `MONGODB_URI` صحيح
- تأكد من الإنترنت
- جرب الاتصال من MongoDB Atlas

### مشكلة: "Android App keeps crashing"
**الحل:**
- تحقق من `BASE_URL` في RetrofitClient
- تأكد من الأندرويد 5.0+
- جرب `./gradlew clean` ثم build مرة أخرى

### مشكلة: "Admin Dashboard not loading"
**الحل:**
- امسح localStorage: `localStorage.clear()`
- جرب Incognito Mode
- تحقق من npm version

---

## 📊 معلومات المشروع

| المكون | التكنولوجيا | الحالة |
|--------|-----------|--------|
| Backend | Node.js + Express | ✅ جاهز |
| Database | MongoDB | ✅ جاهز |
| Android | Kotlin + Retrofit | ✅ جاهز |
| Admin | React + Material-UI | ✅ جاهز |
| Real-time | Socket.io | ✅ جاهز |

---

## 🎯 الميزات المتوفرة حالياً

✅ التسجيل والدخول
✅ قائمة الغرف
✅ إنشاء غرف جديدة
✅ نظام الهدايا (25 هدية)
✅ نظام VIP والنقاط
✅ الترتيبات والإحصائيات
✅ الملف الشخصي
✅ التواصل الفوري (Socket.io)
✅ لوحة تحكم كاملة
✅ إدارة المستخدمين والهدايا

---

## 🔄 التحديثات القادمة

- [ ] نظام الصوت المباشر
- [ ] نظام الفيديو المباشر
- [ ] نظام الإشعارات
- [ ] نظام الدفع
- [ ] تطبيق ويب
- [ ] نسخة iOS

---

## 📞 للمساعدة

إذا واجهت مشكلة:
1. افحص الـ Console للأخطاء
2. تحقق من الاتصال بالـ Server
3. اقرأ الـ README في كل مجلد
4. جرب إعادة تشغيل كل شيء

---

**تطبيق Hani Jar Clone - جاهز للعمل! 🚀**
