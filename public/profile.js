const API_URL = 'https://game-server-ayham.onrender.com';

// 1. جلب بيانات الحساب وعرضها داخل عناصر الـ HTML المعدلة
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

        // ربط البيانات مع الـ IDs المضافة حديثاً في ملف الـ HTML
        if (document.getElementById('username-display')) {
            document.getElementById('username-display').innerText = user.username ? `${user.username} ☀️` : "مستخدم جديد ☀️";
        }
        if (document.getElementById('user-id-display')) {
            document.getElementById('user-id-display').innerText = `ID: ${user.user_id || user.userId || '0000000'}`;
        }
        
        // عرض الصورة الشخصية الحقيقية من قاعدة البيانات بدل الصورة العشوائية
        const avatarImg = document.getElementById('avatar-img');
        if (avatarImg && user.avatarUrl) {
            avatarImg.src = user.avatarUrl;
        }
    } catch (err) { 
        console.log("خطأ في تحميل بيانات الحساب:", err); 
    }
}

// تشغيل جلب البيانات تلقائياً عند فتح الصفحة
loadProfile();

// 2. التنصت على الضغط على أيقونة القلم (تعديل الصورة) لفتح الاستوديو مباشرة
document.body.addEventListener('click', function(e) {
    if (e.target && (e.target.id === 'edit-avatar-btn' || e.target.closest('#edit-avatar-btn'))) {
        e.preventDefault();
        const fileInput = document.getElementById('avatarFileInput');
        if (fileInput) {
            fileInput.click(); // يفتح معرض الاستوديو في الهاتف فوراً وبشكل صامت
        }
    }
});

// 3. معالجة تحويل الصورة المحددة إلى كود باينري مباشر (Base64) ورفعها للسيرفر
document.body.addEventListener('change', function(e) {
    if (e.target && e.target.id === 'avatarFileInput') {
        const file = e.target.files[0];
        if (!file) return;

        // التحقق من أن حجم الصورة معقول لتفادي مشاكل الشبكة (أقل من 8 ميجا)
        if (file.size > 8 * 1024 * 1024) {
            alert('حجم الصورة كبير بعض الشيء، يرجى اختيار صورة أخرى');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = async function() {
            const base64Image = reader.result; // البيانات الثنائية المباشرة للصورة
            const token = localStorage.getItem('token');

            try {
                // إرسال طلب التحديث إلى السيرفر المستقر
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
                    alert('تم تحديث صورتك الشخصية مباشرة من المعرض بنجاح! 🎉');
                    loadProfile(); // إعادة تحميل الواجهة لعرض الصورة الجديدة فوراً
                } else {
                    alert('فشل حفظ الصورة في السيرفر: ' + data.error);
                }
            } catch (err) {
                console.error(err);
                alert('حدث خطأ أثناء رفع الصورة، تأكد من اتصالك بالإنترنت');
            }
        };
        reader.readAsDataURL(file);
    }
});
