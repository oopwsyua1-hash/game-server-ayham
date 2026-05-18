const API_URL = 'https://game-server-ayham.onrender.com';

// ====== أولاً: كود إنشاء حساب جديد (Register) ======
const registerForm = document.getElementById('register-form') || document.querySelector('form');

if (registerForm && window.location.href.includes('register')) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // جلب الحقول من الواجهة بناءً على عناصر الإدخال بالتطبيق
        const usernameInput = document.getElementById('username') || document.querySelector('input[placeholder*="عمران"]') || document.querySelector('input[type="text"]');
        const lastNameInput = document.getElementById('lastName') || document.querySelector('input[placeholder*="سبع"]');
        const emailInput = document.getElementById('email') || document.querySelector('input[type="email"]');
        const passwordInput = document.getElementById('password') || document.querySelector('input[type="password"]');
        const countryInput = document.getElementById('country') || { value: "سوريا" };
        const birthDateInput = document.getElementById('birthDate') || { value: "2006-01-01" };
        const genderInput = document.getElementById('gender') || { value: "ذكر" };

        if (!emailInput || !passwordInput || !emailInput.value || !passwordInput.value) {
            alert('يرجى ملء الحقول الأساسية (البريد الإلكتروني وكلمة المرور)');
            return;
        }

        // تجهيز البيانات بشكل سليم 100% للسيرفر لتفادي أي حقل ناقص
        const formData = {
            username: usernameInput ? usernameInput.value.trim() : "مستخدم جديد",
            lastName: lastNameInput ? lastNameInput.value.trim() : "سبع",
            email: emailInput.value.trim(),
            password: passwordInput.value,
            country: countryInput.value || "سوريا",
            birthDate: birthDateInput.value || "2006-01-01",
            age: 20,
            gender: genderInput.value || "ذكر"
        };

        try {
            // إرسال الطلب للمسار الشامل بالسيرفر
            const res = await fetch(`${API_URL}/api/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (res.ok && data.success) {
                localStorage.setItem('token', data.token);
                alert('تم إنشاء الحساب بنجاح! أهلاً بك في إمبراطورية السبع 🎉');
                window.location.href = 'profile.html'; // الانتقال للملف الشخصي فوراً
            } else {
                alert(data.error || 'خطأ غير معروف أثناء إنشاء الحساب');
            }
        } catch (err) {
            console.error(err);
            alert('تعذر الاتصال بالسيرفر، يرجى المحاولة مرة أخرى لاحقاً');
        }
    });
}

// ====== ثانياً: كود تسجيل الدخول (Login) ======
const loginForm = document.getElementById('login-form') || (!window.location.href.includes('register') && document.querySelector('form'));

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const emailInput = document.getElementById('email') || document.querySelector('input[type="email"]');
        const passwordInput = document.getElementById('password') || document.querySelector('input[type="password"]');

        if (!emailInput || !passwordInput || !emailInput.value || !passwordInput.value) {
            alert('يرجى إدخال البريد الإلكتروني وكلمة المرور');
            return;
        }

        try {
            const res = await fetch(`${API_URL}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: emailInput.value.trim(),
                    password: passwordInput.value
                })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                localStorage.setItem('token', data.token);
                window.location.href = 'profile.html';
            } else {
                alert(data.error || 'البريد الإلكتروني أو كلمة المرور غير صحيحة');
            }
        } catch (err) {
            console.error(err);
            alert('حدث خطأ أثناء الاتصال بالسيرفر لتسجيل الدخول');
        }
    });
}
