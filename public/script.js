// دالة لتنظيف الأرقام من الهندي/العربي إلى الإنجليزي عشان قاعدة البيانات ما ترفضها
const fixDateNumbers = (str) => {
    if(!str) return "2006-01-01";
    let fixed = str.replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d));
    return fixed.replace(/\//g, '-');
};

const registerForm = document.getElementById('register-form') || document.querySelector('form');

if (registerForm && window.location.href.includes('register')) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // جلب كل خانات الإدخال بالترتيب لضمان عدم ضياع أي قيمة
        const inputs = registerForm.querySelectorAll('input');
        
        let username = inputs[0] ? inputs[0].value.trim() : "مستخدم جديد";
        let lastName = inputs[1] ? inputs[1].value.trim() : "السبع";
        let email = inputs[2] ? inputs[2].value.trim().toLowerCase() : "";
        let password = inputs[3] ? inputs[3].value : "";
        let birthDate = inputs[4] ? inputs[4].value : "2006-01-01";

        if (!email || !password) {
            alert('الرجاء إدخال البريد الإلكتروني وكلمة المرور بشكل صحيح');
            return;
        }

        const formData = {
            username: username || "مستخدم جديد",
            lastName: lastName || "السبع",
            email: email,
            password: password,
            country: "Syria",
            birthDate: fixDateNumbers(birthDate),
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
                alert('تم إنشاء الحساب بنجاح! 🎉');
                window.location.href = 'me.html';
            } else {
                alert(data.error || 'خطأ أثناء إنشاء الحساب');
            }
        } catch (err) {
            alert('تعذر الاتصال بالسيرفر، حاول مجدداً');
        }
    });
}

// كود تسجيل الدخول المستقر والمرن
const loginForm = document.getElementById('login-form') || (!window.location.href.includes('register') && document.querySelector('form'));
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const inputs = loginForm.querySelectorAll('input');
        const email = inputs[0] ? inputs[0].value.trim().toLowerCase() : "";
        const password = inputs[1] ? inputs[1].value : "";

        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (res.ok && data.token) {
                localStorage.setItem('token', data.token);
                window.location.href = 'me.html';
            } else { alert(data.error || 'البيانات غير صحيحة'); }
        } catch (err) { alert('خطأ في الاتصال بالسيرفر'); }
    });
}
