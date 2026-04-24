async function loadUser() {
  const res = await fetch(`/api/auth/me`, {
    method: 'GET',
    credentials: 'include'
  });

  if (!res.ok) {
    window.location.href = '/login.html';
    return;
  }

  const user = await res.json();
  document.getElementById('welcome').innerText = `اهلا ${user.username}`;
  document.getElementById('username').innerText = user.username;
}

async function logout() {
  await fetch(`/api/auth/logout`, {
    method: 'POST',
    credentials: 'include'
  });
  window.location.href = '/login.html';
}

window.onload = loadUser;
document.getElementById('logoutBtn')?.addEventListener('click', logout);
