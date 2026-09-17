// ══════════════════════════════════════════════════
// AUTH — login & logout via Firebase Authentication
// 5 akun: admin (semua kelompok) + 4 akun kelompok
// (caberawit, praremaja, remaja, mudamudi), masing2
// dipetakan ke 1 email Firebase Auth sendiri.
// ══════════════════════════════════════════════════

var currentUser = null;

// Daftar kelompok yang didukung aplikasi (urutan tampil di dropdown admin).
// "label" dipakai sebagai fallback nama tampilan bila dokumen groups/{id}
// di Firestore belum diisi displayName.
var GROUPS_LIST = [
  { id:'caberawit', label:'Caberawit' },
  { id:'praremaja', label:'Pra Remaja' },
  { id:'remaja',    label:'Remaja' },
  { id:'mudamudi',  label:'Muda-Mudi' }
];

// Peta username -> email Firebase Auth.
// GANTI email di bawah ini sesuai akun yang benar-benar dibuat di
// Firebase Console (Authentication > Users). Tiap username butuh SATU
// akun Firebase Auth sendiri (email boleh alias "+", lihat SETUP_GUIDE.md).
var USERNAME_MAP = {
  'admin':     'kmmmargosari@gmail.com',
  'caberawit': 'kmmmargosari+caberawit@gmail.com',
  'praremaja': 'kmmmargosari+praremaja@gmail.com',
  'remaja':    'kmmmargosari+remaja@gmail.com',
  'mudamudi':  'kmmmargosari+mudamudi@gmail.com'
};

// Nama tampilan akun: "Admin Pusat" untuk admin,
// "Admin <Kelompok>" untuk akun kelompok (Caberawit, Pra Remaja, ...).
// Dipakai di greeting dashboard & info pengguna (bukan username login).
function accountDisplayName(username, groupId){
  var u = String(username||'').toLowerCase();
  if(u === 'admin') return 'Admin Pusat';
  var gid = groupId || u;
  var g = GROUPS_LIST.find(function(x){ return x.id===gid; });
  var label = g ? g.label : gid;
  return 'Admin ' + label;
}

function doLogin(){
  var username = document.getElementById('loginUser').value.trim().toLowerCase();
  var password = document.getElementById('loginPass').value;
  var err      = document.getElementById('loginErr');

  // Validasi username sebelum menyentuh Firebase
  var email = USERNAME_MAP[username];
  if(!email){
    err.textContent = 'Username tidak ditemukan.';
    document.getElementById('loginPass').value = '';
    var btn = document.querySelector('#pg-login .btn-p');
    if(btn){ btn.classList.add('shake'); setTimeout(function(){ btn.classList.remove('shake'); }, 400); }
    return;
  }

  err.textContent = '';
  var btn = document.querySelector('#pg-login .btn-p');
  setBtnBusy(btn, true, 'Masuk...');

  window._fbSignIn(window._auth, email, password)
    .then(function(credential){
      var remember = document.getElementById('rememberMe');
      if(remember && remember.checked){
        localStorage.setItem('saved_user', username);
      } else {
        localStorage.removeItem('saved_user');
      }
      document.getElementById('loginPass').value = '';
      return resolveUserProfileAndEnter(credential.user.uid, username);
    })
    .catch(function(e){
      var msg = 'Username atau password salah.';
      if(e.code === 'auth/network-request-failed') msg = 'Tidak ada koneksi internet. Coba lagi nanti.';
      else if(e.code === 'auth/invalid-credential') msg = 'Username atau password salah.';
      else if(e && e.message === 'AKUN_BELUM_DIKONFIGURASI') msg = 'Akun belum dikonfigurasi (hubungi admin).';
      err.textContent = msg;
      if(typeof flashError==='function') flashError(err);
      document.getElementById('loginPass').value = '';
      if(btn){ btn.classList.add('shake'); setTimeout(function(){ btn.classList.remove('shake'); }, 400); }
    })
    .finally(function(){
      setBtnBusy(btn, false);
    });
}

// Ambil dokumen users/{uid} untuk tahu role & groupId, lalu masuk ke app.
// Dokumen ini yang harus dibuat manual di Firestore untuk tiap akun
// (lihat SETUP_GUIDE.md): { role:'admin' } atau { role:'group', groupId:'caberawit' }.
function resolveUserProfileAndEnter(uid, username){
  return window._fsGetDoc(window._fsDoc(fsDb(), 'users', uid)).then(function(snap){
    if(!snap.exists()){
      window._fbSignOut(window._auth);
      return Promise.reject(new Error('AKUN_BELUM_DIKONFIGURASI'));
    }
    var dat = snap.data();
    if(dat.role === 'admin'){
      currentUser = { username: username, nama: accountDisplayName(username, null), role: 'admin', groupId: null };
      var lastGroup = localStorage.getItem('admin_last_group');
      var initialGroup = (lastGroup && GROUPS_LIST.some(function(g){ return g.id===lastGroup; }))
        ? lastGroup : GROUPS_LIST[0].id;
      return enterAppWithGroup(initialGroup);
    } else {
      currentUser = { username: username, nama: accountDisplayName(username, dat.groupId), role: 'group', groupId: dat.groupId };
      return enterAppWithGroup(dat.groupId);
    }
  });
}

// Set kelompok aktif, muat datanya, lalu tampilkan aplikasi.
function enterAppWithGroup(groupId){
  currentGroup = groupId;
  try { if(typeof refreshGroupUI === 'function') refreshGroupUI(); } catch(e){}
  masukApp();     // tampilkan shell app + terapkan role/branding dasar
  fbInit();        // muat profil kelompok + data (sesi/anggota/kas/log)
}

// Dipanggil dari dropdown switcher (hanya admin yang bisa lihat dropdown ini)
function switchGroup(newGroupId){
  if(!currentUser || currentUser.role !== 'admin') return;
  if(!newGroupId || newGroupId === currentGroup) return;
  fbStopListeners();
  localStorage.setItem('admin_last_group', newGroupId);
  currentGroup = newGroupId;
  setSyncStatus('save');
  try { if(typeof refreshGroupUI === 'function') refreshGroupUI(); } catch(e){}
  fbInit();
  try {
    // Samakan posisi dropdown PC & mobile dengan kelompok baru
    var _sw1 = document.getElementById('pc-group-switcher');  if(_sw1) _sw1.value = newGroupId;
    var _sw2 = document.getElementById('mob-group-switcher'); if(_sw2) _sw2.value = newGroupId;
  } catch(e){}
  try {
    // Kembali ke Dashboard supaya tidak nyangkut di state absensi kelompok lama
    if(typeof mob === 'function' && mob()){
      if(typeof goMobCall === 'function') goMobCall('home');
    } else if(typeof goPcCall === 'function') goPcCall('home');
  } catch(e){}
}

var _appStarted = false;
function masukApp(){
  if(_appStarted) return;
  _appStarted = true;
  document.getElementById('pg-login').style.display = 'none';
  document.getElementById('pg-app').style.display   = '';
  applyRole();
  initApp();
}

function loginEnter(e){ if(e.key==='Enter') doLogin(); }

function toggleLoginPass(){
  var inp = document.getElementById('loginPass');
  var eye = document.getElementById('loginEye');
  if(!inp) return;
  var show = inp.type === 'password';
  inp.type = show ? 'text' : 'password';
  if(eye) eye.textContent = show ? 'visibility_off' : 'visibility';
  inp.focus();
}

function doLogout(){
  appConfirm('Yakin mau keluar?', function(){
    _doLogoutConfirmed();
  }, {title:'Keluar', icon:'logout', color:'amber', okText:'Ya, Keluar'});
}

function _doLogoutConfirmed(){
  fbStopListeners();
  window._fbSignOut(window._auth).then(function(){
    // Bersihkan cache offline milik kelompok yang baru saja dipakai
    if(currentGroup){
      ['_members','_sesiData','_sesiKet','_sesiRoster','_kasTransaksi','_activityLogs'].forEach(function(k){
        localStorage.removeItem(k+'_'+currentGroup);
      });
    }
    currentUser = null;
    currentGroup = null;
    _appStarted = false;
    localStorage.removeItem('saved_user');
    document.getElementById('pg-app').style.display   = 'none';
    document.getElementById('pg-login').style.display = '';
    document.getElementById('loginUser').value = '';
    document.getElementById('loginPass').value = '';
    document.getElementById('loginErr').textContent   = '';
  }).catch(function(e){
    console.error('Logout error', e);
  });
}

// Tampilkan branding nama kelompok aktif di seluruh elemen .js-grpname
// (dipanggil oleh firebase.js setelah profil kelompok dimuat).
function applyGroupBranding(displayName){
  document.querySelectorAll('.js-grpname').forEach(function(el){ el.textContent = displayName; });
  document.querySelectorAll('.js-grpname-lc').forEach(function(el){ el.textContent = String(displayName).toLowerCase(); });
  try { if(typeof refreshGroupUI === 'function') refreshGroupUI(); } catch(e){}
}

function applyRole(){
  var nama = currentUser ? currentUser.nama : 'Administrator';
  document.querySelectorAll('.js-uname').forEach(function(el){ el.textContent = nama; });
  document.querySelectorAll('.js-uinit').forEach(function(el){ el.textContent = nama[0]; });
  // Semua pengguna (admin & kelompok) mendapat akses penuh ke fitur di kelompoknya
  document.querySelectorAll('.need-absen').forEach(function(el){ el.style.display = ''; });
  document.querySelectorAll('.need-admin').forEach(function(el){ el.style.display = ''; });
  window._canDelete = true;

  var roleEls   = document.querySelectorAll('.js-urole');
  var switcher  = document.getElementById('pc-group-switcher');
  var switcherM = document.getElementById('mob-group-switcher');
  if(currentUser && currentUser.role === 'admin'){
    roleEls.forEach(function(el){ el.textContent = 'Admin Pusat'; });
    var _opts = GROUPS_LIST.map(function(g){
      return '<option value="'+g.id+'"'+(g.id===currentGroup?' selected':'')+'>'+g.label+'</option>';
    }).join('');
    if(switcher){
      switcher.style.display = '';
      switcher.innerHTML = _opts;
    }
    if(switcherM){
      switcherM.style.display = '';
      switcherM.innerHTML = _opts;
    }
    var wrapM = document.getElementById('mob-group-switch-wrap');
    if(wrapM) wrapM.style.display = '';
  } else {
    var groupLabel = (GROUPS_LIST.find(function(g){ return g.id===currentGroup; })||{}).label || currentGroup;
    roleEls.forEach(function(el){ el.textContent = groupLabel; });
    if(switcher) switcher.style.display = 'none';
    if(switcherM) switcherM.style.display = 'none';
    var wrapM2 = document.getElementById('mob-group-switch-wrap');
    if(wrapM2) wrapM2.style.display = 'none';
  }
}
