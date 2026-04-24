// script.js
const API_URL = 'https://game-server-ayham.onrender.com';

// تسجيل حساب جديد
async function register() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  try {
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include', // مهم جداً
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    
    if (res.ok) {
      alert('تم التسجيل بنجاح');
      window.location.href = '/profile.html';
    } else {
      alert(data.msg || 'صار خطأ بالتسجيل');
    }
  } catch (err) {
    console.error(err);
    alert('السيرفر مو شغال');
  }
}

// تسجيل الدخول
async function login() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  try {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include', // مهم جداً
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    
    if (res.ok) {
      alert('تم تسجيل الدخول');
      window.location.href = '/profile.html';
    } else {
      alert(data.msg || 'اسم المستخدم او كلمة المرور غلط');
    }
  } catch (err) {
    console.error(err);
    alert('السيرفر مو شغال');
  }
}

// ربط الازرار
document.getElementById('loginBtn')?.addEventListener('click', login);
document.getElementById('registerBtn')?.addEventListener('click', register);
