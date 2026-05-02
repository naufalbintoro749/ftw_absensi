var USERS_DEFAULT = [
  { id:1, username:'admin', password:'admin123', nama:'Administrator', role:'admin',    divisi:'Admin',   jamMasuk:'08:00' },
  { id:2, username:'budi',  password:'budi123',  nama:'Budi Santoso',  role:'karyawan', divisi:'Teknisi', jamMasuk:'08:00' },
  { id:3, username:'sari',  password:'sari123',  nama:'Sari Dewi',     role:'karyawan', divisi:'Kasir',   jamMasuk:'08:00' },
  { id:4, username:'andi',  password:'andi123',  nama:'Andi Pratama',  role:'karyawan', divisi:'Sales',   jamMasuk:'08:00' },
];

if (!localStorage.getItem('users')) {
  localStorage.setItem('users', JSON.stringify(USERS_DEFAULT));
}

document.getElementById('loginForm').addEventListener('submit', function(e) {
  e.preventDefault();

  var username = document.getElementById('username').value.trim();
  var password = document.getElementById('password').value;
  var errorEl  = document.getElementById('loginError');
  var errorMsg = document.getElementById('errorMsg');
  var btn      = document.getElementById('btnLogin');

  btn.style.opacity       = '0.7';
  btn.style.pointerEvents = 'none';
  btn.innerHTML = '<span>Memverifikasi...</span><i class="fas fa-spinner fa-spin"></i>';

  setTimeout(function() {
    btn.style.opacity       = '';
    btn.style.pointerEvents = '';
    btn.innerHTML = '<span>Masuk</span><i class="fas fa-arrow-right"></i>';

    var users = JSON.parse(localStorage.getItem('users') || '[]');
    var user  = null;
    for (var i = 0; i < users.length; i++) {
      if (users[i].username === username && users[i].password === password) {
        user = users[i]; break;
      }
    }

    if (!user) {
      errorMsg.textContent  = 'Username atau password salah.';
      errorEl.style.display = 'flex';
      return;
    }

    errorEl.style.display = 'none';
    localStorage.setItem('currentUser', JSON.stringify(user));
    window.location.href = user.role === 'admin' ? 'dashboard.html' : 'absensi.html';
  }, 400);
});
