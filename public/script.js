const API_URL = 'https://game-server-ayham.onrender.com';

async function register() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    try {
        const res = await fetch(`${API_URL}/register`, { // تم حذف api/auth لتطابق السيرفر
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        alert(data.msg);
    } catch (err) { console.error("خطأ في الاتصال:", err); }
}

async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    try {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (data.token) {
            localStorage.setItem('token', data.token);
            window.location.href = 'profile.html'; // الانتقال للبروفايل بعد النجاح
        } else { alert(data.msg); }
    } catch (err) { console.error("خطأ في الدخول:", err); }
}
