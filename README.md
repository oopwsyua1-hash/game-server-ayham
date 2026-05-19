# 🎬 Hani Jar Clone - منصة بث مباشر متكاملة

**تطبيق متكامل لإنشاء منصة بث مباشر احترافية مثل Hani Jar و Take**

---

## 📋 محتويات المشروع

### 1️⃣ **Backend (الخادم الأساسي)**
📁 المجلد: `./` (الملفات الرئيسية في الجذر)

**الملفات:**
- `server.js` - السيرفر الرئيسي مع كل الـ APIs
- `package.json` - المكتبات والتبعيات
- `.env` - متغيرات البيئة (ضع `MONGODB_URI` و `JWT_SECRET`)

**الميزات:**
- ✅ نظام التسجيل والدخول
- ✅ نظام الهدايا (25 هدية)
- ✅ نظام الغرف الصوتية
- ✅ Socket.io للتواصل الفوري
- ✅ نظام VIP والنقاط
- ✅ نظام الوكلاء والشامكاش

**كيفية التشغيل:**
```bash
npm install
node server.js
```

---

### 2️⃣ **تطبيق Android**
📁 المجلد: `./android/`

**التكنولوجيا:** Kotlin + Jetpack

**الملفات الرئيسية:**
```
android/
├── app/
│   ├── src/main/
│   │   ├── kotlin/com/ayham/hanijar/
│   │   │   ├── data/
│   │   │   │   ├── api/         👈 اتصالات الـ API
│   │   │   │   ├── models/      👈 نماذج البيانات
│   │   │   │   └── local/       👈 التخزين المحلي
│   │   │   └── ui/
│   │   │       ├── splash/      👈 شاشة البداية
│   │   │       ├── auth/        👈 التسجيل والدخول
│   │   │       ├── main/        👈 الشاشة الرئيسية
│   │   │       ├── room/        👈 شاشة الغرفة
│   │   │       └── profile/     👈 الملف الشخصي
│   │   └── res/
│   │       ├── layout/          👈 واجهات XML
│   │       ├── values/          👈 النصوص والألوان
│   │       └── drawable/        👈 الصور والأشكال
│   └── build.gradle.kts         👈 إعدادات المشروع
├── settings.gradle.kts
└── README.md
```

**الشاشات المتوفرة:**
1. **SplashActivity** - شاشة البداية (splash screen)
2. **LoginActivity** - تسجيل الدخول
3. **RegisterActivity** - إنشاء حساب
4. **MainActivity** - قائمة الغرف
5. **RoomActivity** - داخل الغرفة (إرسال الهدايا والرسائل)
6. **ProfileActivity** - الملف الشخصي

**كيفية التشغيل:**
```bash
cd android
./gradlew build      # بناء المشروع
./gradlew run        # تشغيل على الجهاز
```

---

### 3️⃣ **لوحة التحكم الإدارية (Admin Dashboard)**
📁 المجلد: `./admin/`

**التكنولوجيا:** React + Material-UI

**الملفات الرئيسية:**
```
admin/
├── src/
│   ├── components/
│   │   ├── Navbar.js            👈 شريط العنوان
│   │   └── Sidebar.js           👈 القائمة الجانبية
│   ├── pages/
│   │   ├── Login.js             👈 صفحة الدخول
│   │   ├── Dashboard.js         👈 لوحة المعلومات
│   │   ├── Users.js             👈 إدارة المستخدمين
│   │   ├── Gifts.js             👈 إدارة الهدايا
│   │   ├── Rooms.js             👈 إدارة الغرف
│   │   ├── Agents.js            👈 إدارة الوكلاء
│   │   └── Reports.js           👈 التقارير والإحصائيات
│   ├── utils/
│   │   └── api.js               👈 اتصالات API
│   ├── App.js                   👈 المكون الرئيسي
│   └── index.js                 👈 نقطة الدخول
├── package.json
└── README.md
```

**الصفحات المتوفرة:**
1. **Login** - صفحة تسجيل الدخول
2. **Dashboard** - إحصائيات وتقارير رسوم بيانية
3. **Users** - قائمة المستخدمين مع البحث
4. **Gifts** - إدارة الهدايا وإضافة جديدة
5. **Rooms** - قائمة الغرف والمستخدمين
6. **Agents** - إدارة الوكلاء والشامكاش
7. **Reports** - تقارير مفصلة وإحصائيات

**كيفية التشغيل:**
```bash
cd admin
npm install
npm start
```

---

## 🔌 الاتصال بين المكونات

### Backend ↔ Android
```
Base URL: https://game-server-ayham.onrender.com

Endpoints المستخدمة:
- POST /api/register          - إنشاء حساب
- POST /api/login            - تسجيل الدخول
- GET /api/profile           - جلب الملف الشخصي
- GET /api/rooms             - قائمة الغرف
- GET /api/gifts             - قائمة الهدايا
- POST /api/send-gift        - إرسال هدية
- POST /api/create-room      - إنشاء غرفة
- WebSocket: Socket.io       - التواصل الفوري
```

### Backend ↔ Admin Dashboard
```
Base URL: https://game-server-ayham.onrender.com

Endpoints المستخدمة:
- GET /api/rooms             - قائمة الغرف
- GET /api/gifts             - قائمة الهدايا
- GET /agents                - قائمة الوكلاء
```

---

## 🔐 متغيرات البيئة (.env)

ضع ملف `.env` في الجذر:

```env
PORT=3000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
JWT_SECRET=your-secret-key-here
```

---

## 📱 خطوات التحميل والتشغيل

### 1️⃣ **تحميل المشروع**
```bash
git clone https://github.com/oopwsyua1-hash/game-server-ayham.git
cd game-server-ayham
```

### 2️⃣ **تشغيل Backend**
```bash
npm install
node server.js
```

### 3️⃣ **بناء تطبيق Android**
```bash
cd android
./gradlew build
# أو افتح في Android Studio وشغل مباشرة
```

### 4️⃣ **تشغيل لوحة التحكم**
```bash
cd admin
npm install
npm start
# ستفتح على http://localhost:3000
```

---

## 🌳 هيكل المستودع الكامل

```
game-server-ayham/
├── server.js                 👈 Backend الرئيسي
├── package.json              👈 تبعيات Backend
├── .env                      👈 متغيرات البيئة
├── models/                   👈 مجلد فارغ (يمكن استخدامه لاحقاً)
├── public/                   👈 ملفات ثابتة
│
├── android/                  👈 تطبيق Android 🔴
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── kotlin/com/ayham/hanijar/
│   │   │   │   ├── data/
│   │   │   │   │   ├── api/
│   │   │   │   │   │   ├── RetrofitClient.kt
│   │   │   │   │   │   └── ApiService.kt
│   │   │   │   │   ├── models/
│   │   │   │   │   │   ├── User.kt
│   │   │   │   │   │   ├── Room.kt
│   │   │   │   │   │   └── Gift.kt
│   │   │   │   │   └── local/
│   │   │   │   │       └── SharedPreferencesManager.kt
│   │   │   │   └── ui/
│   │   │   │       ├── splash/SplashActivity.kt
│   │   │   │       ├── auth/
│   │   │   │       │   ├── LoginActivity.kt
│   │   │   │       │   └── RegisterActivity.kt
│   │   │   │       ├── main/
│   │   │   │       │   ├── MainActivity.kt
│   │   │   │       │   └── RoomAdapter.kt
│   │   │   │       ├── room/
│   │   │   │       │   ├── RoomActivity.kt
│   │   │   │       │   └── GiftAdapter.kt
│   │   │   │       └── profile/ProfileActivity.kt
│   │   │   └── res/
│   │   │       ├── layout/
│   │   │       │   ├── activity_splash.xml
│   │   │       │   ├── activity_login.xml
│   │   │       │   ├── activity_register.xml
│   │   │       │   ├── activity_main.xml
│   │   │       │   ├── activity_room.xml
│   │   │       │   ├── activity_profile.xml
│   │   │       │   ├── item_room.xml
│   │   │       │   └── item_gift.xml
│   │   │       ├── values/
│   │   │       │   ├── strings.xml
│   │   │       │   ├── colors.xml
│   │   │       │   └── themes.xml
│   │   │       └── drawable/
│   │   │           └── edit_text_background.xml
│   │   └── AndroidManifest.xml
│   ├── settings.gradle.kts
│   └── build.gradle.kts
│
├── admin/                    👈 لوحة التحكم 🎛️
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.js
│   │   │   └── Sidebar.js
│   │   ├── pages/
│   │   │   ├── Login.js
│   │   │   ├── Dashboard.js
│   │   │   ├── Users.js
│   │   │   ├── Gifts.js
│   │   │   ├── Rooms.js
│   │   │   ├── Agents.js
│   │   │   └── Reports.js
│   │   ├── utils/
│   │   │   └── api.js
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── index.js
│   │   └── index.css
│   ├── package.json
│   └── README.md
│
└── README.md                 👈 هذا الملف
```

---

## 🔑 بيانات اعتماد تجريبية

**للدخول للـ Admin Dashboard:**
```
Email: admin@example.com
Password: admin123
```

**للدخول للتطبيق:**
```
Email: user@example.com
Password: user123
```

---

## 🚀 التحديثات القادمة

- ✨ نظام الصوت المباشر (Agora SDK)
- ✨ نظام الفيديو المباشر
- ✨ نوتيفيكيشنز والتنبيهات
- ✨ نظام الاشتراكات المدفوعة
- ✨ تطبيق ويب (Web Version)
- ✨ نظام المراسلة الخاصة

---

## 📞 التواصل والدعم

في حالة وجود مشاكل أو استفسارات:

1. **تحقق من ملف `.env`** - تأكد من وجود `MONGODB_URI`
2. **تحقق من الإنترنت** - تأكد من الاتصال بالإنترنت
3. **تحقق من أرقام البورت** - Backend على 3000، Admin على 3000

---

## 📄 الترخيص

هذا المشروع مرخص تحت MIT License

---

## ✅ ملخص المشروع

| المكون | اللغة/التكنولوجيا | الحالة | المجلد |
|--------|------------------|--------|--------|
| Backend | Node.js + Express | ✅ جاهز | `./` |
| Android App | Kotlin | ✅ جاهز | `./android/` |
| Admin Dashboard | React | ✅ جاهز | `./admin/` |
| Docs | Markdown | ✅ جاهز | `./README.md` |

---

**تم إنشاء المشروع بواسطة GitHub Copilot** 🤖

**آخر تحديث:** 19 مايو 2026
