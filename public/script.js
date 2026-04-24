const API_URL = 'https://game-server-ayham.onrender.com';
const msgDiv = document.getElementById('msg');

async function register() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  
  msgDiv.innerText = 'جاري انشاء الحساب...';

  try {
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    
    if (res.ok) {
      localStorage.setItem('token', data.token);
      msgDiv.innerText = data.msg + ' ✅';
    } else {
      msgDiv.innerText = 'خطأ: ' + data.msg;
    }
  } catch (err) {
    msgDiv.innerText = 'فشل الاتصال: ' + err.message;
  }
}

async function login() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  
  msgDiv.innerText = 'جاري تسجيل الدخول...';

  try {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    
    if (res.ok) {
      localStorage.setItem('token', data.token);
      msgDiv.innerText = data.msg + ' ✅';
    } else {
      msgDiv.innerText = 'خطأ: ' + data.msg;
    }
  } catch (err) {
    msgDiv.innerText = 'فشل الاتصال: ' + err.message;
  }
}

document.getElementById('loginBtn').addEventListener('click', login);
document.getElementById('registerBtn').addEventListener('click', register);
