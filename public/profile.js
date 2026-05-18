const API_URL = 'https://game-server-ayham.onrender.com';

// دالة جلب بيانات الحساب وعرضها فور فتح الصفحة
async function loadProfile() {
    const token = localStorage.getItem('token');
    if (!token) { 
        window.location.href = 'login.html'; 
        return; 
    }

    try {
        const res = await fetch(`${API_URL}/api/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const user = await res.json();
        
        if (user.error) {
            console.log(user.error);
            return;
        }

        // عرض اسم المستخدم والرصيد
        if (document.getElementById('username-display')) {
            document.getElementById('username-display').innerText = user.username || "مستخدم جديد";
        }
        if (document.getElementById('coins-count')) {
            document.getElementById('coins-count').innerText = user.coins !== undefined ? user.coins.toString() : "0";
        }
        
        // عرض الصورة الشخصية المباشرة
        const avatarImg = document.getElementById('avatar-img');
        if (avatarImg && user.avatarUrl) {
            avatarImg.src = user.avatarUrl;
        }
    } catch (err) { 
        console.log("خطأ في تحميل بيانات الحساب:", err); 
    }
}

// تشغيل الدالة فوراً
loadProfile();

// عند الضغط على أيقونة تعديل الصورة (تأكد أن الزر أو الأيقونة في الـ HTML تملك id="edit-avatar-btn")
document.body.addEventListener('click', function(e) {
    if (e.target && (e.target.id === 'edit-avatar-btn' || e.target.closest('#edit-avatar-btn'))) {
        e.preventDefault();
        const fileInput = document.getElementById('avatarFileInput');
        if (fileInput) {
            fileInput.click(); // يفتح الاستوديو مباشرة بدلاً من نافذة الرابط المزعجة
        }
    }
});

// معالجة الصورة المحددة من المعرض وتحويلها لـ Base64 ورفعها تلقائياً
document.body.addEventListener('change', function(e) {
    if (e.target && e.target.id === 'avatarFileInput') {
        const file = e.target.files[0];
        if (!file) return;

        // التأكد من حجم الصورة
        if (file.size > 5 * 1024 * 1024) {
            alert('حجم الصورة كبير، يرجى اختيار صورة أصغر');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = async function() {
            const base64Image = reader.result; // الصورة المباشرة جاهزة بالإحداثيات كاملة
            const token = localStorage.getItem('token');

            try {
                const res = await fetch(`${API_URL}/api/profile/update`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ avatarUrl: base64Image })
                });
                
                const data = await res.json();
                if (data.success) {
                    alert('تم تحديث صورتك الشخصية مباشرة من الاستوديو بنجاح! 🎉');
                    loadProfile(); // تحديث الصورة في الصفحة فوراً
                } else {
                    alert('فشل حفظ الصورة: ' + data.error);
                }
            } catch (err) {
                console.error(err);
                alert('حدث خطأ أثناء رفع الصورة الشخصية للسيرفر');
            }
        };
        reader.readAsDataURL(file);
    }
});
