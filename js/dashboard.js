// ===== AUTH GUARD =====
var currentUser = getSession();
if (!currentUser || currentUser.role !== 'admin') { window.location.href = 'index.html'; }

function logout() { localStorage.removeItem('currentUser'); window.location.href = 'index.html'; }

// ===== HELPERS =====
function getUsers()   {
  try {
    var s = localStorage.getItem('users');
    if (s) {
      sessionStorage.setItem('users_backup', s); // backup
      return JSON.parse(s);
    }
    // Coba restore dari backup
    var backup = sessionStorage.getItem('users_backup');
    if (backup) {
      localStorage.setItem('users', backup);
      return JSON.parse(backup);
    }
    return [];
  } catch(e) { return []; }
}
function saveUsers(u) {
  var json = JSON.stringify(u);
  localStorage.setItem('users', json);
  sessionStorage.setItem('users_backup', json); // selalu backup
}
function getAbsensi() { try { return JSON.parse(localStorage.getItem('absensi') || '[]'); } catch(e) { return []; } }
function todayStr()   { return new Date().toISOString().split('T')[0]; }

// ===== CHIP =====
function statusChip(status) {
  var map = {
    'Tepat Waktu': 'background:rgba(34,197,94,.15);color:#4ade80;border:1px solid rgba(34,197,94,.25)',
    'Terlambat':   'background:rgba(245,158,11,.15);color:#fbbf24;border:1px solid rgba(245,158,11,.25)',
    'Tidak Hadir': 'background:rgba(239,68,68,.15);color:#f87171;border:1px solid rgba(239,68,68,.25)',
  };
  var s = map[status] || 'background:rgba(255,255,255,.1);color:rgba(255,255,255,.6);border:1px solid rgba(255,255,255,.15)';
  return '<span style="' + s + ';font-size:10px;font-weight:700;text-transform:uppercase;padding:3px 10px;border-radius:20px;display:inline-block;">' + status + '</span>';
}

// ===== CLOCK =====
function updateClock() {
  var el = document.getElementById('navTimeDash');
  if (el) el.textContent = new Date().toLocaleTimeString('id-ID');
}
setInterval(updateClock, 1000);

// ===== SUMMARY =====
function loadSummary() {
  var users = getUsers().filter(function(u){ return u.role === 'karyawan'; });
  var today = getAbsensi().filter(function(a){ return a.tanggal === todayStr(); });
  document.getElementById('totalKaryawan').textContent    = users.length;
  document.getElementById('hadirHariIni').textContent     = today.filter(function(a){ return a.jamMasuk; }).length;
  document.getElementById('terlambatHariIni').textContent = today.filter(function(a){ return a.status === 'Terlambat'; }).length;
  document.getElementById('absenHariIni').textContent     = users.length - today.filter(function(a){ return a.jamMasuk; }).length;
}

// ===== TABEL ABSENSI =====
function loadAbsensiAdmin() {
  var filterEl = document.getElementById('filterTanggal');
  var tanggal  = filterEl.value || todayStr();
  filterEl.value = tanggal;

  var absensi = getAbsensi().filter(function(a){ return a.tanggal === tanggal; });
  var users   = getUsers().filter(function(u){ return u.role === 'karyawan'; });
  var tbody   = document.getElementById('bodyAdmin');

  tbody.innerHTML = users.map(function(u, i) {
    var rec = absensi.find(function(a){ return a.userId === u.id; });
    var st  = rec ? rec.status : 'Tidak Hadir';
    var foto = rec && rec.foto
      ? '<img src="' + rec.foto + '" onclick="showFoto(\'' + rec.foto + '\',\'' + u.nama + '\')" style="width:36px;height:36px;object-fit:cover;border-radius:8px;border:1px solid rgba(239,68,68,.2);cursor:pointer;">'
      : '<span style="color:rgba(255,255,255,.2);">—</span>';
    return '<tr>'
      + '<td class="td" style="color:rgba(255,255,255,.25);">' + (i+1) + '</td>'
      + '<td class="td" style="font-weight:600;color:rgba(255,255,255,.9);">' + u.nama + '</td>'
      + '<td class="td">' + u.divisi + '</td>'
      + '<td class="td">' + (rec && rec.jamMasuk ? rec.jamMasuk : '—') + '</td>'
      + '<td class="td">' + (rec && rec.jamKeluar ? rec.jamKeluar : '—') + '</td>'
      + '<td class="td">' + statusChip(st) + '</td>'
      + '<td class="td" style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + (rec && rec.lokasi ? rec.lokasi : '—') + '</td>'
      + '<td class="td">' + foto + '</td>'
      + '</tr>';
  }).join('');

  if (!users.length) tbody.innerHTML = '<tr><td colspan="8" class="td" style="text-align:center;color:rgba(255,255,255,.25);padding:28px;">Tidak ada data</td></tr>';
}

// ===== KARYAWAN =====
function loadKaryawan() {
  var users = getUsers().filter(function(u){ return u.role === 'karyawan'; });
  var tbody = document.getElementById('bodyKaryawan');
  if (!users.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="td" style="text-align:center;color:rgba(255,255,255,.25);padding:28px;">Belum ada karyawan</td></tr>';
    return;
  }
  tbody.innerHTML = users.map(function(u) {
    return '<tr>'
      + '<td class="td" style="font-weight:600;color:rgba(255,255,255,.9);">' + u.nama + '</td>'
      + '<td class="td">' + u.divisi + '</td>'
      + '<td class="td" style="color:rgba(255,255,255,.35);">' + u.username + '</td>'
      + '<td class="td">'
      + '<button onclick="editKaryawan(' + u.id + ')" style="background:rgba(59,130,246,.12);color:#60a5fa;border:none;padding:5px 10px;border-radius:7px;font-size:.75rem;cursor:pointer;margin-right:4px;" onmouseover="this.style.background=\'rgba(59,130,246,.25)\';" onmouseout="this.style.background=\'rgba(59,130,246,.12)\';"><i class="fas fa-edit"></i></button>'
      + '<button onclick="hapusKaryawan(' + u.id + ')" style="background:rgba(239,68,68,.12);color:#f87171;border:none;padding:5px 10px;border-radius:7px;font-size:.75rem;cursor:pointer;" onmouseover="this.style.background=\'rgba(239,68,68,.25)\';" onmouseout="this.style.background=\'rgba(239,68,68,.12)\';"><i class="fas fa-trash"></i></button>'
      + '</td></tr>';
  }).join('');
}

function showFormKaryawan(id) {
  id = id || null;
  document.getElementById('fId').value       = id || '';
  document.getElementById('fNama').value     = '';
  document.getElementById('fUsername').value = '';
  document.getElementById('fPassword').value = '';
  document.getElementById('fDivisi').value   = 'Teknisi';
  document.getElementById('fJamMasuk').value = '08:00';
  document.getElementById('modalKaryawanTitle').textContent = id ? 'Edit Karyawan' : 'Tambah Karyawan';
  if (id) {
    var u = getUsers().find(function(u){ return u.id === id; });
    if (u) {
      document.getElementById('fNama').value     = u.nama;
      document.getElementById('fUsername').value = u.username;
      document.getElementById('fDivisi').value   = u.divisi;
      document.getElementById('fJamMasuk').value = u.jamMasuk || '08:00';
    }
  }
  document.getElementById('modalKaryawan').style.display = 'flex';
}

function editKaryawan(id) { showFormKaryawan(id); }

function hapusKaryawan(id) {
  if (!confirm('Hapus karyawan ini?')) return;
  saveUsers(getUsers().filter(function(u){ return u.id !== id; }));
  loadKaryawan(); loadSummary();
}

function closeModalKaryawan() { document.getElementById('modalKaryawan').style.display = 'none'; }

function simpanKaryawan(e) {
  e.preventDefault();
  var id       = document.getElementById('fId').value;
  var nama     = document.getElementById('fNama').value.trim();
  var username = document.getElementById('fUsername').value.trim();
  var password = document.getElementById('fPassword').value;
  var divisi   = document.getElementById('fDivisi').value;
  var jamMasuk = document.getElementById('fJamMasuk').value;
  var users    = getUsers();

  if (id) {
    users = users.map(function(u) {
      if (u.id === parseInt(id)) {
        var updated = { id:u.id, username:username, nama:nama, role:u.role, divisi:divisi, jamMasuk:jamMasuk, password:u.password };
        if (password) updated.password = password;
        return updated;
      }
      return u;
    });
  } else {
    if (!password) { alert('Password wajib diisi.'); return; }
    var newId = Math.max.apply(null, users.map(function(u){ return u.id; }).concat([0])) + 1;
    users.push({ id:newId, username:username, password:password, nama:nama, role:'karyawan', divisi:divisi, jamMasuk:jamMasuk });
  }
  saveUsers(users);
  closeModalKaryawan();
  loadKaryawan(); loadSummary();
}

// ===== REKAP BULANAN =====
function loadRekapBulanan() {
  var bulan   = document.getElementById('filterBulan').value;
  var absensi = getAbsensi().filter(function(a){ return a.tanggal.startsWith(bulan); });
  var users   = getUsers().filter(function(u){ return u.role === 'karyawan'; });
  var el      = document.getElementById('rekapBulanan');

  if (!users.length) { el.innerHTML = '<p style="text-align:center;color:rgba(255,255,255,.25);padding:20px;font-size:.85rem;">Belum ada karyawan</p>'; return; }

  el.innerHTML = users.map(function(u) {
    var rec       = absensi.filter(function(a){ return a.userId === u.id; });
    var hadir     = rec.filter(function(a){ return a.jamMasuk; }).length;
    var terlambat = rec.filter(function(a){ return a.status === 'Terlambat'; }).length;
    return '<div style="display:flex;align-items:center;justify-content:space-between;padding:11px 6px;border-bottom:1px solid rgba(255,255,255,.04);">'
      + '<div><p style="font-size:.85rem;font-weight:600;color:rgba(255,255,255,.8);">' + u.nama + '</p>'
      + '<p style="font-size:.72rem;color:rgba(255,255,255,.3);margin-top:2px;">' + u.divisi + '</p></div>'
      + '<div style="display:flex;gap:6px;">'
      + '<span style="background:rgba(34,197,94,.15);color:#4ade80;border:1px solid rgba(34,197,94,.25);font-size:10px;font-weight:700;padding:3px 10px;border-radius:20px;">' + hadir + ' Hadir</span>'
      + '<span style="background:rgba(245,158,11,.15);color:#fbbf24;border:1px solid rgba(245,158,11,.25);font-size:10px;font-weight:700;padding:3px 10px;border-radius:20px;">' + terlambat + ' Terlambat</span>'
      + '</div></div>';
  }).join('');
}

function initFilterBulan() {
  var sel = document.getElementById('filterBulan');
  var now = new Date();
  for (var i = 0; i < 6; i++) {
    var d   = new Date(now.getFullYear(), now.getMonth() - i, 1);
    var val = d.toISOString().slice(0, 7);
    var opt = document.createElement('option');
    opt.value = val;
    opt.textContent = d.toLocaleDateString('id-ID', { month:'long', year:'numeric' });
    sel.appendChild(opt);
  }
  loadRekapBulanan();
}

// ===== FOTO MODAL =====
function showFoto(src, nama) {
  document.getElementById('fotoAbsensi').src = src;
  document.getElementById('fotoCaption').textContent = nama;
  document.getElementById('modalFoto').style.display = 'flex';
}
function closeModalFoto() { document.getElementById('modalFoto').style.display = 'none'; }

// ===== EXPORT CSV =====
function exportCSV() {
  var tanggal = document.getElementById('filterTanggal').value || todayStr();
  var absensi = getAbsensi().filter(function(a){ return a.tanggal === tanggal; });
  var users   = getUsers().filter(function(u){ return u.role === 'karyawan'; });
  var csv = 'No,Nama,Divisi,Jam Masuk,Jam Keluar,Status,Lokasi\n';
  users.forEach(function(u, i) {
    var r = absensi.find(function(a){ return a.userId === u.id; });
    csv += (i+1) + ',"' + u.nama + '","' + u.divisi + '","' + (r&&r.jamMasuk?r.jamMasuk:'-') + '","' + (r&&r.jamKeluar?r.jamKeluar:'-') + '","' + (r?r.status:'Tidak Hadir') + '","' + (r&&r.lokasi?r.lokasi:'-') + '"\n';
  });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type:'text/csv' }));
  a.download = 'absensi_' + tanggal + '.csv';
  a.click();
}

// ===== INIT =====
window.addEventListener('DOMContentLoaded', function() {
  document.getElementById('adminName').textContent = currentUser.nama;
  updateClock();
  loadSummary();
  loadAbsensiAdmin();
  loadKaryawan();
  initFilterBulan();
});
