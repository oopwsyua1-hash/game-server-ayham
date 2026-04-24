// script.js - النسخة اللي فيها فحص اخطاء
async function register() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  try {
    console.log('عم جرب سجل...'); // للفحص
    
    const res = await fetch(`/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password })
    });

    console.log('الرد من السيرفر:', res.status); // للفحص

    const data = await res.json();
    
    if (res.ok) {
      alert('تم التسجيل بنجاح');
      window.location.href = '/profile.html';
    } else {
      alert('خطأ: ' + data.msg);
    }
  } catch (err) {
    console.error('الغلط الكامل:', err);
    alert('خطأ بالاتصال بالسيرفر. تأكد انو النت شغال');
  }
}

async function login() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  try {
    const res = await fetch(`/api/auth/login`, {
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
      alert('خطأ: ' + data.msg);
    }
  } catch (err) {
    console.error('الغلط الكامل:', err);
    alert('خطأ بالاتصال بالسيرفر');
  }
}

document.getElementById('loginBtn')?.addEventListener('click', login);
document.getElementById('registerBtn')?.addEventListener('click', register);
