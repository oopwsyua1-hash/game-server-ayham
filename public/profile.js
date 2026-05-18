const API_URL = 'https://game-server-ayham.onrender.com';

// 1. دالة تحميل بيانات الملف الشخصي وعرضها بالواجهة
async function loadProfile() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const res = await fetch(`${API_URL}/api/user/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const user = await res.json();
        
        // عرض البيانات داخل العناصر
        if (document.getElementById('username-display')) {
            document.getElementById('username-display').innerText = user.username;
        }
        if (document.getElementById('coins-count')) {
            document.getElementById('coins-count').innerText = user.coins.toString();
        }
        
        // تحديث الصور الشخصية والغلاف إذا كانت قادمة من السيرفر
        if (user.avatarUrl && document.getElementById('userAvatar')) {
            document.getElementById('userAvatar').src = user.avatarUrl;
        }
        if (user.coverUrl && document.getElementById('userCover')) {
            document.getElementById('userCover').style.backgroundImage = `url('${user.coverUrl}')`;
        }

    } catch (err) {
        console.log("خطأ في تحميل البيانات");
    }
}

// 2. إعداد ميزة فتح الاستوديو والرفع المباشر فور تحميل الواجهة
document.addEventListener("DOMContentLoaded", () => {
    // تشغيل جلب البيانات أولاً
    loadProfile();

    // استهداف عناصر التعديل (أيقونة القلم للـ Avatar وزر الغلاف)
    // ملاحظة: تأكد أن المعرفات (IDs) تطابق المستخدمة في ملف edit-profile.html أو profile.html لديك
    const editAvatarBtn = document.getElementById("editAvatarBtn") || document.querySelector(".avatar-container .edit-icon");
    const editCoverBtn = document.getElementById("editCoverBtn") || document.querySelector(".cover-container .edit-icon") || document.getElementById("editCoverBtnNew");

    // إنشاء حقول اختيار ملفات مخفية ديناميكياً لتحفيز الهاتف على فتح الاستوديو
    const avatarInput = document.createElement("input");
    avatarInput.type = "file";
    avatarInput.accept = "image/*";

    const coverInput = document.createElement("input");
    coverInput.type = "file";
    coverInput.accept = "image/*";

    // عند الضغط على أيقونة تعديل الصورة الشخصية
    if (editAvatarBtn) {
        // إلغاء أي أحداث قديمة أو نوافذ منبثقة مرتبطة بالعنصر
        editAvatarBtn.removeAttribute('onclick'); 
        editAvatarBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation(); // منع تداخل النوافذ المنبثقة القديمة
            avatarInput.click();
        });
    }

    // عند الضغط على زر أو أيقونة الغلاف
    if (editCoverBtn) {
        editCoverBtn.removeAttribute('onclick');
        editCoverBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            coverInput.click();
        });
    }

    // حدث التقاط الصورة الشخصية المحددة من الاستوديو
    avatarInput.addEventListener("change", async () => {
        if (avatarInput.files.length === 0) return;
        const file = avatarInput.files[0];
        await uploadImageFile(file, 'avatarUrl');
    });

    // حدث التقاط صورة الغلاف المحددة من الاستوديو
    coverInput.addEventListener("change", async () => {
        if (coverInput.files.length === 0) return;
        const file = coverInput.files[0];
        await uploadImageFile(file, 'coverUrl');
    });
});

// 3. دالة إرسال الملف الفعلي بصيغة FormData إلى السيرفر الرئيسي
async function uploadImageFile(file, fieldName) {
    const token = localStorage.getItem("token");
    if (!token) {
        alert("الرجاء تسجيل الدخول أولاً");
        return;
    }

    // تجهيز الملف لإرساله كبيانات متعددة الأجزاء (Multipart)
    const formData = new FormData();
    formData.append(fieldName, file);

    try {
        // يتم الإرسال إلى مسار الرفع المخصص في السيرفر الخلفي لديك
        const response = await fetch(`${API_URL}/api/profile/update`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`
                // اترك المتصفح يضع الـ Content-Type والحدود تلقائياً ولا تضعها يدوياً
            },
            body: formData
        });

        const data = await response.json();

        if (response.ok && data.success) {
            alert("تم رفع الصورة وتحديثها من الاستوديو بنجاح! 🎉");
            
            // تحديث العناصر بشكل فوري بالواجهة بدون إعادة تحميل كامل الصفحة
            if (fieldName === 'avatarUrl' && document.getElementById("userAvatar")) {
                document.getElementById("userAvatar").src = data.user.avatarUrl;
            } else if (fieldName === 'coverUrl' && document.getElementById("userCover")) {
                document.getElementById("userCover").style.backgroundImage = `url('${data.user.coverUrl}')`;
            } else {
                window.location.reload(); // حل احتياطي لتأكيد التحديث المرئي
            }
        } else {
            alert(`فشل الرفع: ${data.error || "خطأ غير معروف"}`);
        }
    } catch (error) {
        console.error("خطأ الشبكة أثناء الرفع:", error);
        alert("حدث خطأ أثناء الاتصال بالسيرفر لرفع الصورة.");
    }
}
