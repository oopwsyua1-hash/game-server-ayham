// اظهار/اخفاء فورم التسجيل
const registerBtn = document.getElementById('registerBtn');
const loginBtn = document.getElementById('loginBtn');
const registerForm = document.getElementById('registerForm');
const loginForm = document.getElementById('loginForm');
const formContainer = document.querySelector('.form-container');
const formTitle = document.getElementById('formTitle');
const errorMessage = document.getElementById('errorMessage');

registerBtn.onclick = () => {
  loginForm.style.display = 'none';
  registerForm.style.display = 'block';
  formTitle.textContent = 'انشاء حساب جديد';
  formContainer.style.display = 'block';
  errorMessage.textContent = '';
};

loginBtn.onclick = () => {
  registerForm.style.display = 'none';
  loginForm.style.display = 'block';
  formTitle.textContent = 'تسجيل الدخول';
  formContainer.style.display = 'block';
  errorMessage.textContent = '';
};

// تسجيل حساب جديد
document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const firstName = document.getElementById('firstName').value;
  const lastName = document.getElementById('lastName').value;
  const age = document.getElementById('age').value;
  const birthdate = document.getElementById('birthdate').value;
  const gender = document.getElementById('gender').value;
  const country = document.getElementById('country').value;
  const bio = document.getElementById('bio').value;
  const username = document.getElementById('username').value;
  const email = document.getElementById('email').value;
  const phone = document.getElementById('phone').value;
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  if (password !== confirmPassword) {
    errorMessage.textContent = 'كلمة المرور غير متطابقة';
    return;
  }

  try {
    const res = await fetch('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName,
        lastName,
        age,
        birthdate,
        gender,
        country,
        bio,
        username,
        email,
        phone,
        password
      })
    });

    const data = await res.json();

    if (!res.ok) {
      errorMessage.textContent = data.message;
      return;
    }

    alert('تم انشاء الحساب بنجاح! سجل دخولك هلق');
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    formTitle.textContent = 'تسجيل الدخول';
    errorMessage.textContent = '';
    document.getElementById('registerForm').reset();
  } catch (err) {
    errorMessage.textContent = 'خطأ بالاتصال بالسيرفر';
  }
});

// تسجيل الدخول
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const emailOrPhone = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  try {
    const res = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrPhone, password })
    });

    const data = await res.json();

    if (!res.ok) {
      errorMessage.textContent = data.message;
      return;
    }

    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('token', data.token);
    window.location.href = '/profile.html';
  } catch (err) {
    errorMessage.textContent = 'خطأ بالاتصال بالسيرفر';
  }
});

// حساب العمر تلقائي من تاريخ الميلاد
document.getElementById('birthdate').addEventListener('change', (e) => {
  const birthDate = new Date(e.target.value);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  document.getElementById('age').value = age;
});
