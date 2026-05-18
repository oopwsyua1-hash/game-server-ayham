// كود معالجة تسجيل الحساب الجديد متوافق مع سيرفر إمبراطورية السبع
const registerForm = document.getElementById('register-form') || document.querySelector('form');

if (registerForm && window.location.href.includes('register')) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const usernameInput = document.getElementById('username') || document.querySelector('input[type="text"]');
        const emailInput = document.getElementById('email') || document.querySelector('input[type="email"]');
        const passwordInput = document.getElementById('password') || document.querySelector('input[type="password"]');

        if (!emailInput || !passwordInput || !emailInput.value || !passwordInput.value) {
            alert('الرجاء إدخال البريد الإلكتروني وكلمة المرور بشكل صحيح');
            return;
        }

        const formData = {
            username: usernameInput ? usernameInput.value.trim() : "مستخدم جديد",
            lastName: "السبع",
            email: emailInput.value.toLowerCase().trim(),
            password: passwordInput.value,
            country: "Syria",
            birthDate: "2006-01-01",
            age: 20,
            gender: "ذكر"
        };

        try {
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (res.ok && data.token) {
                localStorage.setItem('token', data.token);
                alert('تم إنشاء الحساب بنجاح! أهلاً بك 🎉');
                window.location.href = 'me.html'; // التوجيه لبروفايلك الجديد المباشر
            } else {
                alert(data.error || 'خطأ أثناء إنشاء الحساب');
            }
        } catch (err) {
            alert('تعذر الاتصال بالسيرفر، حاول مجدداً');
        }
    });
}

// كود تسجيل الدخول
const loginForm = document.getElementById('login-form') || (!window.location.href.includes('register') && document.querySelector('form'));

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const emailInput = document.getElementById('email') || document.querySelector('input[type="email"]');
        const passwordInput = document.getElementById('password') || document.querySelector('input[type="password"]');

        if (!emailInput || !passwordInput || !emailInput.value || !passwordInput.value) {
            alert('يرجى إدخال الحقول المطلوبة');
            return;
        }

        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: emailInput.value.toLowerCase().trim(),
                    password: passwordInput.value
                })
            });

            const data = await res.json();

            if (res.ok && data.token) {
                localStorage.setItem('token', data.token);
                window.location.href = 'me.html';
            } else {
                alert(data.error || 'البريد الإلكتروني أو كلمة المرور غير صحيحة');
            }
        } catch (err) {
            alert('حدث خطأ أثناء تسجيل الدخول');
        }
    });
}
