var USERS_DEFAULT = [
  { id:1, username:'admin', password:'admin123', nama:'Administrator', role:'admin',    divisi:'Admin',   jamMasuk:'08:00' },
  { id:2, username:'naufal',  password:'02102022',  nama:'muhammad naufal bintoro',  role:'karyawan', divisi:'Teknisi', jamMasuk:'08:00' },
  { id:3, username:'dwi',  password:'rahmat123',  nama:'dwi rahmat wijaya',     role:'karyawan', divisi:'Teknisi',   jamMasuk:'08:00' },
  { id:4, username:'aziz',  password:'azz123',  nama:'aziz farizqy',  role:'karyawan', divisi:'helper',   jamMasuk:'08:00' },
];

// Hanya set sekali saat pertama kali — setelah itu localStorage adalah sumber kebenaran
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
