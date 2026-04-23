const user = JSON.parse(localStorage.getItem('user'));

if (!user) {
  window.location.href = '/index.html';
}

async function loadProfile() {
  const res = await fetch(`/user/${user.id}`);
  const data = await res.json();

  if (!res.ok) {
    alert('خطأ بجلب البيانات');
    return;
  }

  document.getElementById('fullName').textContent = `${data.firstName} ${data.lastName}`;
  document.getElementById('userUsername').textContent = `@${data.username}`;
  document.getElementById('userId').textContent = `ID: #${data._id.slice(-6).toUpperCase()}`;
  document.getElementById('infoName').textContent = `${data.firstName} ${data.lastName}`;
  document.getElementById('infoAge').textContent = data.age;
  document.getElementById('infoBirth').textContent = new Date(data.birthdate).toLocaleDateString('ar-SY');
  document.getElementById('infoGender').textContent = data.gender;
  document.getElementById('infoCountry').textContent = data.country;
  document.getElementById('infoEmail').textContent = data.email;
  document.getElementById('infoPhone').textContent = data.phone;
  document.getElementById('infoBio').textContent = data.bio || 'لا يوجد سيرة ذاتية';
  document.getElementById('infoBalance').textContent = data.balance;

  if (data.avatar) document.getElementById('userAvatar').src = data.avatar;
  if (data.cover) document.getElementById('userCover').src = data.cover;

  document.getElementById('gamesCount').textContent = '0';
  document.getElementById('winsCount').textContent = '0';
  document.getElementById('lossCount').textContent = '0';
  document.getElementById('winRate').textContent = '0%';
}

async function loadAllUsers() {
  const res = await fetch('/users');
  const users = await res.json();

  const usersDiv = document.getElementById('allUsers');

  if (!res.ok || users.length === 0) {
    usersDiv.innerHTML = '<p class="loading">لا يوجد لاعبين حالياً</p>';
    return;
  }

  usersDiv.innerHTML = '';
  users.forEach(u => {
    if (u._id === user.id) return;

    const userEl = document.createElement('div');
    userEl.className = 'user-item';
    userEl.innerHTML = `
      <img src="${u.avatar || 'icon-512.png'}" alt="${u.username}">
      <div class="user-info">
        <div class="user-name">${u.firstName} ${u.lastName}</div>
        <div class="user-country">${u.country} - @${u.username}</div>
      </div>
      <div class="user-balance">${u.balance} نقطة</div>
    `;
    usersDiv.appendChild(userEl);
  });
}

// تغيير الصورة الشخصية
document.getElementById('changeAvatar').onclick = () => {
  document.getElementById('avatarInput').click();
};

document.getElementById('avatarInput').onchange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('avatar', file);
  formData.append('userId', user.id);

  const res = await fetch('/upload/avatar', { method: 'POST', body: formData });
  const data = await res.json();
  if (res.ok) {
    document.getElementById('userAvatar').src = data.path;
    alert('تم تحديث الصورة الشخصية');
  } else {
    alert('خطأ بالرفع');
  }
};

// تغيير الغلاف
document.getElementById('changeCover').onclick = () => {
  document.getElementById('coverInput').click();
};

document.getElementById('coverInput').onchange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('cover', file);
  formData.append('userId', user.id);

  const res = await fetch('/upload/cover', { method: 'POST', body: formData });
  const data = await res.json();
  if (res.ok) {
    document.getElementById('userCover').src = data.path;
    alert('تم تحديث صورة الغلاف');
  } else {
    alert('خطأ بالرفع');
  }
};

document.getElementById('lobbyBtn').onclick = () => {
  window.location.href = '/lobby.html';
};

document.getElementById('chatBtn').onclick = () => {
  alert('قريباً: الدردشة العامة');
};

document.getElementById('logoutBtn').onclick = () => {
  localStorage.removeItem('user');
  window.location.href = '/index.html';
};

document.getElementById('editBtn').onclick = () => {
  alert('قريباً: تعديل الملف الشخصي');
};

loadProfile();
loadAllUsers();
