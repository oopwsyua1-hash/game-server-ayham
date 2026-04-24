// script.js - نسخة كشف الغلط الحقيقي
async function register() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  try {
    // استخدم الرابط الكامل بدل النسبي عشان نلغي مشاكل الموبايل
    const res = await fetch(`https://game-server-ayham.onrender.com/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    
    if (res.ok) {
      alert('تم التسجيل بنجاح');
      window.location.href = '/profile.html';
    } else {
      alert('رد السيرفر: ' + data.msg); // رح يعطيك الغلط الحقيقي
    }
  } catch (err) {
    // هون رح نعرف الغلط الحقيقي
    console.error('Fetch Error:', err);
    alert('فشل الطلب. السبب: ' + err.message); 
  }
}

async function login() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  try {
    const res = await fetch(`https://game-server-ayham.onrender.com/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    
    if (res.ok) {
      alert('تم الدخول');
      window.location.href = '/profile.html';
    } else {
      alert('رد السيرفر: ' + data.msg);
    }
  } catch (err) {
    console.error('Fetch Error:', err);
    alert('فشل الطلب. السبب: ' + err.message);
  }
}

document.getElementById('loginBtn')?.addEventListener('click', login);
document.getElementById('registerBtn')?.addEventListener('click', register);
