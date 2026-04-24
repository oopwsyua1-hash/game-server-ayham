// script.js - نسخة الفحص الكامل
async function register() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  
  // تأكد انو الحقول مو فاضية
  if (!username || !password) {
    alert('عبي الاسم وكلمة المرور');
    return;
  }

  try {
    console.log('بداية الطلب...');
    
    const res = await fetch(`/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password })
    });

    console.log('حالة الرد:', res.status);
    const data = await res.json();
    console.log('الداتا:', data);
    
    if (res.ok) {
      alert('تم التسجيل بنجاح');
      window.location.href = '/profile.html';
    } else {
      alert('خطأ من السيرفر: ' + data.msg);
    }
  } catch (err) {
    console.error('الغلط الكامل:', err);
    alert('خطأ بالاتصال. السبب: ' + err.message);
  }
}

async function login() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  
  if (!username || !password) {
    alert('عبي الاسم وكلمة المرور');
    return;
  }

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
    alert('خطأ بالاتصال. السبب: ' + err.message);
  }
}

document.getElementById('loginBtn')?.addEventListener('click', login);
document.getElementById('registerBtn')?.addEventListener('click', register);
