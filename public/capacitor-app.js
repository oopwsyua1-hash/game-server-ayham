// 📱 Capacitor App JavaScript
// تطبيق Game Server المحمول

const API_URL = 'http://localhost:3000';
let currentUser = null;
let authToken = null;

document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
  setupTabNavigation();
  checkAuthStatus();
});

function initializeApp() {
  console.log('🚀 جاري تهيئة التطبيق...');
  
  const savedToken = localStorage.getItem('authToken');
  const savedUser = localStorage.getItem('currentUser');
  
  if (savedToken && savedUser) {
    authToken = savedToken;
    currentUser = JSON.parse(savedUser);
    showMainContent();
    loadUserData();
  } else {
    showLoginModal();
  }
}

function checkAuthStatus() {
  if (!authToken) {
    showLoginModal();
  }
}

function setupTabNavigation() {
  const navTabs = document.querySelectorAll('.nav-tab');
  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      switchTab(tab.dataset.tab);
    });
  });
}

function switchTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });
  
  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.classList.remove('active');
  });
  
  document.getElementById(tabName).classList.add('active');
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
  
  if (tabName === 'rooms') {
    loadRooms();
  } else if (tabName === 'profile') {
    loadProfileData();
  }
}

function showLoginModal() {
  document.getElementById('loginModal').classList.add('active');
  document.getElementById('registerModal').classList.remove('active');
}

function showRegister() {
  document.getElementById('loginModal').classList.remove('active');
  document.getElementById('registerModal').classList.add('active');
}

function showLogin() {
  document.getElementById('loginModal').classList.add('active');
  document.getElementById('registerModal').classList.remove('active');
}

async function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  if (!email || !password) {
    alert('الرجاء ملء جميع الحقول');
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      authToken = data.token;
      currentUser = data.user;
      
      localStorage.setItem('authToken', authToken);
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      
      showMainContent();
      loadUserData();
    } else {
      alert('خطأ: ' + (data.error || 'فشل تسجيل الدخول'));
    }
  } catch (error) {
    console.error('خطأ:', error);
    alert('خطأ في الاتصال بالخادم');
  }
}

async function register() {
  const username = document.getElementById('reg_username').value;
  const lastName = document.getElementById('reg_lastName').value;
  const email = document.getElementById('reg_email').value;
  const password = document.getElementById('reg_password').value;
  
  if (!username || !email || !password) {
    alert('الرجاء ملء جميع الحقول');
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        lastName,
        email,
        password,
        country: 'Syria',
        birthDate: '2000-01-01',
        age: 24,
        gender: 'ذكر'
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      authToken = data.token;
      currentUser = data.user;
      
      localStorage.setItem('authToken', authToken);
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      
      showMainContent();
      loadUserData();
    } else {
      alert('خطأ: ' + (data.error || 'فشل إنشاء الحساب'));
    }
  } catch (error) {
    console.error('خطأ:', error);
    alert('خطأ في الاتصال بالخادم');
  }
}

function showMainContent() {
  document.getElementById('loginModal').classList.remove('active');
  document.getElementById('registerModal').classList.remove('active');
  document.querySelector('.mobile-container').style.display = 'flex';
}

function loadUserData() {
  if (currentUser) {
    document.getElementById('userName').textContent = currentUser.username;
    document.getElementById('coins').textContent = currentUser.coins || 0;
    document.getElementById('vipLevel').textContent = currentUser.vip_level || 0;
    document.getElementById('points').textContent = currentUser.supportPoints || 0;
  }
}

function loadProfileData() {
  if (currentUser) {
    document.getElementById('profileName').textContent = currentUser.username;
    document.getElementById('profileEmail').textContent = currentUser.email;
    document.getElementById('profileCountry').textContent = currentUser.country || '-';
    document.getElementById('profileAge').textContent = currentUser.age || '-';
  }
}

async function loadRooms() {
  try {
    const response = await fetch(`${API_URL}/api/rooms`);
    const rooms = await response.json();
    
    const roomsList = document.getElementById('roomsList');
    roomsList.innerHTML = '';
    
    if (rooms.length === 0) {
      roomsList.innerHTML = '<p class="loading">لا توجد غرف</p>';
      return;
    }
    
    rooms.forEach(room => {
      const roomCard = document.createElement('div');
      roomCard.className = 'room-card';
      roomCard.innerHTML = `
        <div class="room-info">
          <h3>${room.name}</h3>
          <p>👥 ${room.users ? room.users.length : 0} مستخدمين</p>
        </div>
        <div class="room-arrow">→</div>
      `;
      roomCard.addEventListener('click', () => enterRoom(room.room_id));
      roomsList.appendChild(roomCard);
    });
  } catch (error) {
    console.error('خطأ:', error);
  }
}

function enterRoom(roomId) {
  console.log('دخول الغرفة:', roomId);
  alert('سيتم الدخول للغرفة: ' + roomId);
}

function goToRooms() {
  switchTab('rooms');
}

function goToProfile() {
  switchTab('profile');
}

function logout() {
  if (confirm('هل أنت متأكد من رغبتك في تسجيل الخروج؟')) {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    
    document.querySelector('.mobile-container').style.display = 'none';
    showLoginModal();
  }
}

window.addEventListener('error', (event) => {
  console.error('خطأ:', event.error);
});

console.log('✅ تم تحميل تطبيق Capacitor بنجاح');
