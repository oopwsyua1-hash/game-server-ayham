const API_URL = ''; // فاضي لانو نفس الدومين

async function register() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  const res = await fetch(`/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();
  
  if (res.ok) {
    alert('تم التسجيل');
    window.location.href = '/profile.html';
  } else {
    alert(data.msg);
  }
}

async function login() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

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
    alert(data.msg);
  }
}

document.getElementById('loginBtn')?.addEventListener('click', login);
document.getElementById('registerBtn')?.addEventListener('click', register);
