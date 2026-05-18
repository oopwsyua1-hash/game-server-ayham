const API_URL = 'https://game-server-ayham.onrender.com';

// 1. دالة جلب بيانات الملف الشخصي وعرضها بالواجهة الأساسية لـ إمبراطورية السبع V3
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
        
        // عرض اسم المستخدم والرصيد
        if (document.getElementById('username-display')) {
            document.getElementById('username-display').innerText = user.username;
        }
        if (document.getElementById('coins-count')) {
            document.getElementById('coins-count').innerText = user.coins.toString();
        }
        
        // عرض الصورة الشخصية وصورة الغلاف المحدثة
        if (user.avatarUrl && document.getElementById('userAvatar')) {
            document.getElementById('userAvatar').src = user.avatarUrl;
        }
        if (user.coverUrl && document.getElementById('userCover')) {
            document.getElementById('userCover').style.backgroundImage = `url('${user.coverUrl}')`;
        }

    } catch (err) {
        console.log("خطأ في تحميل البيانات الشخصية للمستخدم");
    }
}

// 2. إعداد مستمعات الأحداث لربط استوديو الهاتف عند النقر على القلم
document.addEventListener("DOMContentLoaded", () => {
    // تشغيل جلب البيانات فور تحميل الصفحة
    loadProfile();

    // استهداف عناصر التعديل (أيقونة القلم وأزرار التعديل)
    const editAvatarBtn = document.getElementById("editAvatarBtn") || document.querySelector(".avatar-container .edit-icon") || document.querySelector(".avatar-container svg");
    const editCoverBtn = document.getElementById("editCoverBtn") || document.querySelector(".cover-container .edit-icon") || document.querySelector(".cover-container button");

    // بناء حقول اختيار ملفات من المعرض بشكل ديناميكي مخفي
    const avatarInput = document.createElement("input");
    avatarInput.type = "file";
    avatarInput.accept = "image/*";

    const coverInput = document.createElement("input");
    coverInput.type = "file";
    coverInput.accept = "image/*";

    // تفعيل ضغطة الصورة الشخصية
    if (editAvatarBtn) {
        // حظر أي وظائف منبثقة (Prompt) قديمة مدمجة
        if(editAvatarBtn.getAttribute('onclick')) editAvatarBtn.removeAttribute('onclick');
        
        editAvatarBtn.addEventListener("click", (e) => {
            e.preventDefault();
            avatarInput.click();
        });
    }

    // تفعيل ضغطة الغلاف
    if (editCoverBtn) {
        if(editCoverBtn.getAttribute('onclick')) editCoverBtn.removeAttribute('onclick');
        
        editCoverBtn.addEventListener("click", (e) => {
            e.preventDefault();
            coverInput.click();
        });
    }

    // معالجة واختيار الصورة الشخصية الجديدة من المعرض
    avatarInput.addEventListener("change", () => {
        if (avatarInput.files.length === 0) return;
        const file = avatarInput.files[0];
        
        const reader = new FileReader();
        reader.onloadend = async () => {
            await sendProfileData({ avatarUrl: reader.result });
        };
        reader.readAsDataURL(file); // تحويل الصورة لكود نصي آمن وسريع
    });

    // معالجة واختيار صورة الغلاف الجديدة من المعرض
    coverInput.addEventListener("change", () => {
        if (coverInput.files.length === 0) return;
        const file = coverInput.files[0];
        
        const reader = new FileReader();
        reader.onloadend = async () => {
            await sendProfileData({ coverUrl: reader.result });
        };
        reader.readAsDataURL(file);
    });
});

// 3. دالة إرسال التحديثات مباشرة إلى السيرفر الرئيسي
async function sendProfileData(payload) {
    const token = localStorage.getItem("token");
    if (!token) {
        alert("انتهت الجلسة، يرجى إعادة تسجيل الدخول.");
        return;
    }

    try {
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
            alert("تم تحديث صورتك بنجاح من الاستوديو! 🎉");
            
            // تحديث مرئي فوري لعناصر الصفحة بدون ريفريش كامل
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
        console.error(error);
        alert("حدث خطأ أثناء الاتصال بالسيرفر، تأكد من عمل السيرفر بشكل طبيعي.");
    }
}
