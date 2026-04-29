const API_URL = 'https://game-server-ayham.onrender.com';

async function loadProfile() {
    const token = localStorage.getItem('token');
    if (!token) { window.location.href = 'login.html'; return; }

    try {
        const res = await fetch(`${API_URL}/api/user/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const user = await res.json();
        document.getElementById('username-display').innerText = user.username;
        document.getElementById('coins-count').innerText = user.coins.toLocaleString();
    } catch (err) { console.log("خطأ في تحميل البيانات"); }
}
loadProfile();
