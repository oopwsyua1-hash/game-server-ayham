// profile.js
const API_URL = 'https://game-server-ayham.onrender.com';

// جلب بيانات اليوزر بس تفتح الصفحة
async function loadUser() {
  try {
    const res = await fetch(`${API_URL}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include' // اهم سطر بالملف كلو
    });

    if (!res.ok) {
      // اذا مو مسجل دخول رجاع ع صفحة الدخول
      window.location.href = '/login.html';
      return;
    }

    const user = await res.json();
    
    // عرض اسم اليوزر بالصفحة
    document.getElementById('welcome').innerText = `اهلا ${user.username}`;
    document.getElementById('username').innerText = user.username;

  } catch (err) {
    console.error(err);
    window.location.href = '/login.html';
  }
}

// تسجيل الخروج
async function logout() {
  try {
    await fetch(`${API_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include' // مهم كمان
    });
    
    window.location.href = '/login.html';
  } catch (err) {
    console.error(err);
  }
}

// شغل الفانكشن بس تفتح الصفحة
window.onload = loadUser;

// ربط زر الخروج
document.getElementById('logoutBtn')?.addEventListener('click', logout);
