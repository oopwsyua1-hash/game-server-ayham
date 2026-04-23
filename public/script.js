var x = document.getElementById("login");
var y = document.getElementById("register");
var z = document.getElementById("btn");

function register() {
  x.style.display = "none";
  y.style.display = "block";
  z.style.right = "50%";
}

function login() {
  x.style.display = "block";
  y.style.display = "none";
  z.style.right = "0";
}

// تسجيل الدخول
document.getElementById('login').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('loginUser').value;
  const password = document.getElementById('loginPass').value;

  const res = await fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  
  const data = await res.json();
  alert(data.message);
  
  if (res.ok) {
    localStorage.setItem('user', JSON.stringify(data.user));
    window.location.href = '/lobby.html';
  }
});

// انشاء حساب
document.getElementById('register').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const userData = {
    firstName: document.getElementById('firstName').value,
    lastName: document.getElementById('lastName').value,
    age: document.getElementById('age').value,
    birthdate: document.getElementById('birthdate').value,
    gender: document.getElementById('gender').value,
    country: document.getElementById('country').value,
    bio: document.getElementById('bio').value,
    username: document.getElementById('regUser').value,
    email: document.getElementById('regEmail').value,
    phone: document.getElementById('regPhone').value,
    password: document.getElementById('regPass').value
  };

  const res = await fetch('/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  
  const data = await res.json();
  alert(data.message);
  
  if (res.ok) {
    login(); // رجعه عتسجيل الدخول
  }
});
