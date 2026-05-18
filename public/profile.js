// الرابط الأساسي الخاص بسيرفر إمبراطورية السبع V3 على منصة Render
const API_URL = 'https://game-server-ayham.onrender.com';

// 1. دالة جلب بيانات الملف الشخصي وعرضها بالواجهة الشخصية
async function loadProfile() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        // جلب البيانات من المسار المعتمد في السيرفر
        const res = await fetch(`${API_URL}/api/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error("فشل جلب البيانات");
        
        const user = await res.json();
        
        // عرض اسم المستخدم والمعرف والعملات
        if (document.getElementById('username-display')) {
            document.getElementById('username-display').innerText = user.username;
        }
        if (document.getElementById('user-id-display')) {
            document.getElementById('user-id-display').innerText = `ID: ${user.user_id}`;
        }
        if (document.getElementById('coins-count')) {
            document.getElementById('coins-count').innerText = user.coins.toLocaleString();
        }
        
        // عرض وتحديث الصور الشخصية والغلاف إذا كانت متوفرة بقاعدة البيانات
        if (user.avatarUrl && document.getElementById('userAvatar')) {
            document.getElementById('userAvatar').src = user.avatarUrl;
        }
        if (user.coverUrl && document.getElementById('userCover')) {
            document.getElementById('userCover').style.backgroundImage = `url('${user.coverUrl}')`;
        }

    } catch (err) {
        console.error("❌ خطأ أثناء تحميل بيانات البروفايل:", err.message);
    }
}

// 2. إعداد ميزة الرفع المباشر من استوديو الهاتف فور تحميل الواجهة
document.addEventListener("DOMContentLoaded", () => {
    // تشغيل دالة جلب البيانات أولاً
    loadProfile();

    // استهداف عناصر التعديل (أيقونة القلم للـ Avatar وزر تعديل الغلاف)
    // ملاحظة: تأكد أن المعرفات (IDs) تطابق العناصر الموجودة في ملف الـ HTML لديك
    const editAvatarBtn = document.getElementById("editAvatarBtn") || document.querySelector(".avatar-container .edit-icon") || document.querySelector(".avatar-container svg");
    const editCoverBtn = document.getElementById("editCoverBtn") || document.querySelector(".cover-container .edit-icon") || document.querySelector(".cover-container button");

    // إنشاء حقول اختيار ملفات غير مرئية لتحفيز الهاتف على فتح معرض الصور
    const avatarInput = document.createElement("input");
    avatarInput.type = "file";
    avatarInput.accept = "image/*";

    const coverInput = document.createElement("input");
    coverInput.type = "file";
    coverInput.accept = "image/*";

    // عند النقر على قلم أو أيقونة الصورة الشخصية
    if (editAvatarBtn) {
        // حظر وإزالة أي وظائف نوافذ منبثقة (Prompt) قديمة مدمجة بالـ HTML
        editAvatarBtn.removeAttribute('onclick');
        
        editAvatarBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            avatarInput.click(); // فتح استوديو الهاتف
        });
    }

    // عند النقر على خيار أو زر تعديل الغلاف
    if (editCoverBtn) {
        editCoverBtn.removeAttribute('onclick');
        
        editCoverBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            coverInput.click(); // فتح استوديو الهاتف
        });
    }

    // معالجة اختيار ملف الصورة الشخصية من المعرض وتحويلها فوراً
    avatarInput.addEventListener("change", () => {
        if (avatarInput.files.length === 0) return;
        const file = avatarInput.files[0];
        
        const reader = new FileReader();
        reader.onloadend = async () => {
            // إرسال الصورة النصية (Base64) مباشرة للسيرفر
            await updateProfilePictures({ avatarUrl: reader.result });
        };
        reader.readAsDataURL(file);
    });

    // معالجة اختيار ملف الغلاف من المعرض وتحويلها فوراً
    coverInput.addEventListener("change", () => {
        if (coverInput.files.length === 0) return;
        const file = coverInput.files[0];
        
        const reader = new FileReader();
        reader.onloadend = async () => {
            // إرسال الصورة النصية (Base64) مباشرة للسيرفر
            await updateProfilePictures({ coverUrl: reader.result });
        };
        reader.readAsDataURL(file);
    });
});

// 3. دالة إرسال النص المشفر للصورة إلى مسار السيرفر المعتمد لديك
async function updateProfilePictures(payload) {
    const token = localStorage.getItem("token");
    if (!token) {
        alert("الرجاء تسجيل الدخول أولاً!");
        return;
    }

    try {
        // إرسال البيانات إلى المسار المكتوب بملف سيرفرك المدمج بالـ JSON
        const response = await fetch(`${API_URL}/api/profile/update`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok && data.success) {
            alert("تم تحديث الصورة من استوديو الهاتف بنجاح! 🎉");
            
            // تحديث مرئي وتلقائي فوري لعناصر الصفحة دون الحاجة لعمل ريفريش كامل
            if (payload.avatarUrl && document.getElementById("userAvatar")) {
                document.getElementById("userAvatar").src = data.user.avatarUrl;
            }
            if (payload.coverUrl && document.getElementById("userCover")) {
                document.getElementById("userCover").style.backgroundImage = `url('${data.user.coverUrl}')`;
            }
        } else {
            alert(`فشل تحديث الصورة: ${data.error || "خطأ غير معروف"}`);
        }
    } catch (error) {
        console.error("❌ خطأ أثناء رفع الصورة:", error);
        alert("حدث خطأ في الاتصال بالسيرفر، يرجى التحقق من لوق Render.");
    }
}
