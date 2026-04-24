// script.js - نسخة localStorage بدون كوكيز
async function register() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  try {
    const res = await fetch(`https://game-server-ayham.onrender.com/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    
    if (res.ok) {
      localStorage.setItem('token', data.token); // خزن التوكن
      alert('تم التسجيل بنجاح');
      window.location.href = '/profile.html';
    } else {
      alert('خطأ: ' + data.msg);
    }
  } catch (err) {
    alert('فشل الطلب: ' + err.message);
  }
}

async function login() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  try {
    const res = await fetch(`https://game-server-ayham.onrender.com/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    
    if (res.ok) {
      localStorage.setItem('token', data.token); // خزن التوكن
      alert('تم الدخول');
      window.location.href = '/profile.html';
    } else {
      alert('خطأ: ' + data.msg);
    }
  } catch (err) {
    alert('فشل الطلب: ' + err.message);
  }
}

// مثال كيف تجيب بيانات اليوزر بعدين
async function getMe() {
  const token = localStorage.getItem('token');
  const res = await fetch(`https://game-server-ayham.onrender.com/api/auth/me`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await res.json();
  console.log(data);
}

document.getElementById('loginBtn')?.addEventListener('click', login);
document.getElementById('registerBtn')?.addEventListener('click', register);
