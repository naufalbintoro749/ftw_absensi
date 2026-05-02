// ===== AUTH GUARD =====
var currentUser = getSession();
if (!currentUser) { window.location.href = 'index.html'; }

// ===== HELPERS =====
function getAbsensi()     { try { return JSON.parse(localStorage.getItem('absensi') || '[]'); } catch(e){ return []; } }
function saveAbsensi(d)   { localStorage.setItem('absensi', JSON.stringify(d)); }
function todayStr()       { return new Date().toISOString().split('T')[0]; }
function nowTimeStr()     { return new Date().toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' }); }
function getTodayRecord() { return getAbsensi().find(function(a){ return a.userId === currentUser.id && a.tanggal === todayStr(); }); }
function el(id)           { return document.getElementById(id); }
function setText(id, val) { var e = el(id); if(e) e.textContent = val; }

// ===== BUTTON STATE =====
function setBtn(id, enabled) {
  var e = el(id);
  if (!e) return;
  e.disabled            = !enabled;
  e.style.opacity       = enabled ? '1' : '0.3';
  e.style.cursor        = enabled ? 'pointer' : 'not-allowed';
  e.style.pointerEvents = enabled ? 'auto' : 'none';
  if (enabled) e.style.transform = '';
}

// ===== CLOCK =====
function updateClock() {
  var now  = new Date();
  var time = now.toLocaleTimeString('id-ID');
  var date = now.toLocaleDateString('id-ID', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
  setText('navTime',    time);
  setText('jamSekarang', time);
  setText('tanggalHari', date);
}

// ===== STATUS UI =====
function updateStatusUI() {
  var rec = getTodayRecord();

  if (!rec) {
    // Belum absen sama sekali hari ini
    setText('statusAbsensiHariIni', 'Belum Absen');
    setText('jamMasukInfo',  '—');
    setText('jamKeluarInfo', '—');
    setBtn('btnMasuk',  true);
    setBtn('btnKeluar', false);

  } else if (rec.jamMasuk && !rec.jamKeluar) {
    // Sudah masuk, belum keluar
    setText('statusAbsensiHariIni', 'Sudah Masuk — ' + rec.jamMasuk);
    setText('jamMasukInfo',  rec.jamMasuk);
    setText('jamKeluarInfo', '—');
    setBtn('btnMasuk',  false);
    setBtn('btnKeluar', true);

  } else if (rec.jamMasuk && rec.jamKeluar) {
    // Sudah masuk DAN keluar — selesai
    setText('statusAbsensiHariIni', '✓ Selesai (' + rec.jamMasuk + ' – ' + rec.jamKeluar + ')');
    setText('jamMasukInfo',  rec.jamMasuk);
    setText('jamKeluarInfo', rec.jamKeluar);
    setBtn('btnMasuk',  false);
    setBtn('btnKeluar', false);

    // Tampilkan info selesai
    var msgEl = el('absensiMessage');
    if (msgEl) {
      msgEl.style.display = 'block';
      msgEl.style.background = 'rgba(34,197,94,.1)';
      msgEl.style.border = '1px solid rgba(34,197,94,.25)';
      msgEl.style.color = '#4ade80';
      msgEl.style.borderRadius = '10px';
      msgEl.style.padding = '12px 16px';
      msgEl.style.fontSize = '.85rem';
      msgEl.innerHTML = '<i class="fas fa-check-circle"></i> Absensi hari ini sudah selesai. Masuk: <b>' + rec.jamMasuk + '</b> — Keluar: <b>' + rec.jamKeluar + '</b>';
    }
  }
}

// ===== GEOLOCATION =====
var userLat = null, userLng = null, leafletMap = null;
var KANTOR_LAT = -6.200000, KANTOR_LNG = 106.816666, RADIUS_METER = 500;

function hitungJarak(lat1, lng1, lat2, lng2) {
  var R = 6371000, dLat = (lat2-lat1)*Math.PI/180, dLng = (lng2-lng1)*Math.PI/180;
  var a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)*Math.sin(dLng/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function setChip(id, text, color) {
  var e = el(id);
  if (!e) return;
  var colors = {
    green:  'background:rgba(34,197,94,.15);color:#4ade80;border:1px solid rgba(34,197,94,.25)',
    yellow: 'background:rgba(245,158,11,.15);color:#fbbf24;border:1px solid rgba(245,158,11,.25)',
    red:    'background:rgba(239,68,68,.15);color:#f87171;border:1px solid rgba(239,68,68,.25)',
  };
  e.textContent = text;
  e.style.cssText = (colors[color]||colors.yellow) + ';font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;padding:3px 10px;border-radius:20px;display:inline-block;';
}

function initMap(lat, lng) {
  if (typeof L === 'undefined') return;
  if (!leafletMap) {
    leafletMap = L.map('map').setView([lat, lng], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(leafletMap);
    L.marker([KANTOR_LAT, KANTOR_LNG]).addTo(leafletMap).bindPopup('Kantor').openPopup();
    L.circle([KANTOR_LAT, KANTOR_LNG], { radius:RADIUS_METER, color:'#ef4444', fillOpacity:.1 }).addTo(leafletMap);
  }
  L.marker([lat, lng]).addTo(leafletMap);
  leafletMap.setView([lat, lng], 15);
}

function getLocation() {
  if (!navigator.geolocation) { setText('statusLokasi', 'Tidak didukung'); return; }
  navigator.geolocation.getCurrentPosition(
    function(pos) {
      userLat = pos.coords.latitude;
      userLng = pos.coords.longitude;
      var jarak = hitungJarak(userLat, userLng, KANTOR_LAT, KANTOR_LNG);
      var jarakText = jarak < 1000 ? Math.round(jarak) + ' m' : (jarak/1000).toFixed(1) + ' km';
      setText('koordinat',    userLat.toFixed(6) + ', ' + userLng.toFixed(6));
      setText('jarakKantor',  jarakText);
      setText('statusLokasi', jarak <= RADIUS_METER ? 'Dalam Area Kantor' : 'Di Luar Area');
      setText('geoStatusText', jarak <= RADIUS_METER ? 'Dalam Area' : 'Di Luar Area');
      setChip('geoStatus', jarak <= RADIUS_METER ? 'Dalam Area' : 'Di Luar Area', jarak <= RADIUS_METER ? 'green' : 'yellow');
      fetch('https://nominatim.openstreetmap.org/reverse?lat=' + userLat + '&lon=' + userLng + '&format=json')
        .then(function(r){ return r.json(); })
        .then(function(d){ setText('alamatLokasi', d.display_name || '—'); })
        .catch(function(){});
      initMap(userLat, userLng);
    },
    function() {
      setText('statusLokasi', 'Akses ditolak');
      setText('geoStatusText', 'Ditolak');
      setChip('geoStatus', 'Ditolak', 'red');
    }
  );
}

// ===== KAMERA =====
var stream = null, capturedPhoto = null;

function startCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    setChip('faceStatus', 'Tidak Didukung', 'red'); return;
  }
  navigator.mediaDevices.getUserMedia({ video:{ facingMode:'user' } })
    .then(function(s) {
      stream = s;
      el('video').srcObject = s;
      setBtn('btnCapture', true);
      el('faceGuide').style.display = 'flex';
      setChip('faceStatus', 'Kamera Aktif', 'green');
    })
    .catch(function() { setChip('faceStatus', 'Kamera Ditolak', 'red'); });
}

function captureAndVerify() {
  var video  = el('video');
  var canvas = document.createElement('canvas');
  canvas.width  = video.videoWidth  || 320;
  canvas.height = video.videoHeight || 240;
  canvas.getContext('2d').drawImage(video, 0, 0);
  capturedPhoto = canvas.toDataURL('image/jpeg', 0.7);
  el('capturedImg').src = capturedPhoto;
  setText('capturedLabel', 'Foto diambil: ' + nowTimeStr());
  el('capturedPreview').style.display = 'block';
  el('faceGuide').style.display = 'none';
  var res = el('faceResult');
  res.style.display = 'flex';
  res.innerHTML = '<i class="fas fa-check-circle" style="color:#4ade80"></i>&nbsp;Wajah Terverifikasi';
}

// ===== ABSENSI =====
function absen(tipe) {
  var jam     = nowTimeStr();
  var tanggal = todayStr();
  var now     = new Date();
  var list    = getAbsensi();
  var rec     = list.find(function(a){ return a.userId === currentUser.id && a.tanggal === tanggal; });
  var lokasi  = (el('koordinat') && el('koordinat').textContent) || '—';
  var foto    = capturedPhoto || null;

  if (tipe === 'masuk') {
    // Hitung status: terlambat atau tepat waktu — TIDAK memblokir absen
    var jamMasukKerja = (currentUser.jamMasuk || '08:00').split(':').map(Number);
    var jh = jamMasukKerja[0], jm = jamMasukKerja[1];
    var terlambat = now.getHours() > jh || (now.getHours() === jh && now.getMinutes() > jm + 15);
    var status    = terlambat ? 'Terlambat' : 'Tepat Waktu';

    if (rec) {
      rec.jamMasuk = jam; rec.status = status;
      if (foto) rec.foto = foto;
    } else {
      list.push({ id:Date.now(), userId:currentUser.id, nama:currentUser.nama,
        divisi:currentUser.divisi, tanggal:tanggal, jamMasuk:jam, jamKeluar:null,
        status:status, lokasi:lokasi, foto:foto });
    }
    showSuccessModal('Absen Masuk ' + (terlambat ? '(Terlambat)' : 'Berhasil'), currentUser.nama + ' — ' + jam + ' — ' + status);

  } else {
    if (!rec) { alert('Belum absen masuk hari ini.'); return; }
    rec.jamKeluar = jam;
    if (foto) rec.fotoKeluar = foto;
    showSuccessModal('Absen Keluar Berhasil', currentUser.nama + ' — Keluar: ' + jam);
  }

  saveAbsensi(list);
  capturedPhoto = null;
  el('capturedPreview').style.display = 'none';
  el('faceResult').style.display = 'none';
  updateStatusUI();
  loadRiwayat();
}

// ===== RIWAYAT =====
function loadRiwayat() {
  var list = getAbsensi()
    .filter(function(a){ return a.userId === currentUser.id; })
    .sort(function(a,b){ return b.tanggal.localeCompare(a.tanggal); })
    .slice(0, 30);
  var tbody = el('bodyRiwayat');
  if (!tbody) return;

  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="td" style="text-align:center;color:rgba(255,255,255,.25);padding:28px;">Belum ada riwayat</td></tr>';
    return;
  }

  var colors = {
    'Tepat Waktu': 'background:rgba(34,197,94,.15);color:#4ade80;border:1px solid rgba(34,197,94,.25)',
    'Terlambat':   'background:rgba(245,158,11,.15);color:#fbbf24;border:1px solid rgba(245,158,11,.25)',
    'Tidak Hadir': 'background:rgba(239,68,68,.15);color:#f87171;border:1px solid rgba(239,68,68,.25)',
  };

  tbody.innerHTML = list.map(function(a) {
    var cs = colors[a.status] || colors['Tidak Hadir'];
    var tgl = new Date(a.tanggal + 'T00:00:00').toLocaleDateString('id-ID',{weekday:'short',day:'numeric',month:'short'});
    return '<tr>'
      + '<td class="td">' + tgl + '</td>'
      + '<td class="td" style="font-variant-numeric:tabular-nums;">' + (a.jamMasuk||'—') + '</td>'
      + '<td class="td" style="font-variant-numeric:tabular-nums;">' + (a.jamKeluar||'—') + '</td>'
      + '<td class="td"><span style="' + cs + ';font-size:10px;font-weight:700;text-transform:uppercase;padding:3px 10px;border-radius:20px;display:inline-block;">' + a.status + '</span></td>'
      + '<td class="td" style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + (a.lokasi||'—') + '</td>'
      + '</tr>';
  }).join('');
}

// ===== MODAL =====
function showSuccessModal(title, msg) {
  setText('modalTitle', title);
  setText('modalMsg',   msg);
  el('modalSukses').style.display = 'flex';
}
function closeModal() { el('modalSukses').style.display = 'none'; }

// ===== LOGOUT =====
function logout() {
  if (stream) stream.getTracks().forEach(function(t){ t.stop(); });
  clearSession();
  window.location.href = 'index.html';
}

// ===== INIT — tunggu DOM siap =====
window.addEventListener('DOMContentLoaded', function() {
  // Set user info
  setText('namaKaryawan', currentUser.nama);
  setText('divisiKaryawan', currentUser.divisi || 'Karyawan');
  if (currentUser.role === 'admin') {
    var wrap = el('adminMenuWrap');
    if (wrap) wrap.style.display = 'block';
  }

  // Clock
  setInterval(updateClock, 1000);
  updateClock();

  // Status tombol absen
  updateStatusUI();

  // Riwayat
  loadRiwayat();

  // GPS
  getLocation();
});
