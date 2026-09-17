// ══════════════════════════════════════════════════
// DATA — shared state & constants
// ══════════════════════════════════════════════════

// Daftar anggota kini dimuat per-kelompok dari Firestore (groups/{groupId}/anggota/list)
// saat login / ganti kelompok — lihat fbInit() di firebase.js. Data anggota lama
// Muda-Mudi sudah tersimpan di Firestore-nya sendiri, jadi tidak perlu di-hardcode
// lagi di sini (kelompok baru pun mulai dari daftar kosong).
var members = [];

// sesiData[tgl][nama] = {status:'H'|'I'|'A', catatan:'', gender:'P'|'L'}
// gender ditulis saat pengisian (snapshot) agar riwayat tidak ikut berubah
// bila gender anggota diubah belakangan.
var sesiData = {};
// sesiKet[tgl] = kegiatan string
var sesiKet  = {};
// sesiRoster[tgl] = [{nama, gender}] — potret daftar anggota aktif tepat
// saat sesi DIBUAT. Rekap bulan lama dibangun dari roster ini (gabungan
// dengan nama-nama entri), BUKAN dari koleksi anggota terkini, sehingga
// arsip/hapus/ubah-gender tidak pernah mengubah rekap lama.
var sesiRoster = {};

// Gender anggota saat ini (untuk pengisian snapshot & migrasi).
function memberGenderNow(nama){
  var m = members.find(function(x){ return x.nama===nama; });
  return m ? m.gender : null;
}

// Kelas anggota saat ini (Caberawit saja; kelompok lain selalu '').
function memberKelasNow(nama){
  var m = members.find(function(x){ return x.nama===nama; });
  if(!m) return '';
  try { return normalizeKelas(m.kelas); } catch(e){ return m.kelas || ''; }
}

// Cek apakah nama pernah tercatat di sesi absensi mana pun.
function memberHasHistory(nama){
  return Object.keys(sesiData).some(function(t){
    return Object.prototype.hasOwnProperty.call(sesiData[t]||{}, nama);
  });
}

// Tulis snapshot gender+kelas ke satu entri bila belum ada (tidak menimpa).
function stampEntryGender(tgl, nama){
  var s = sesiData[tgl]||{};
  var e = s[nama];
  if(!e) return;
  if(!e.gender){
    var g = memberGenderNow(nama);
    if(g) e.gender = g;
  }
  if(!e.kelas){
    var k = memberKelasNow(nama);
    if(k) e.kelas = k;
  }
}

// Migrasi data lama -> snapshot (idempoten, tidak merusak data):
// - entri tanpa gender diisi dari anggota kini (tak dikenal -> '?')
// - entri tanpa kelas (caberawit) diisi dari anggota kini (kosong bila tak ada)
// - sesi tanpa roster dibangun dari nama-nama entrinya (roster bawa gender+kelas)
// Dijalankan otomatis setiap data siap; sesi tersentuh akan ikut
// tersimpan ke Firestore saat berikutnya disimpan.
function migrateLegacySnapshots(){
  Object.keys(sesiData).forEach(function(t){
    var s = sesiData[t]||{};
    Object.keys(s).forEach(function(nm){
      var e = s[nm]||{};
      if(!e.gender) e.gender = memberGenderNow(nm) || '?';
      if(!e.kelas) e.kelas = memberKelasNow(nm) || '';
    });
    if(!sesiRoster[t]){
      sesiRoster[t] = Object.keys(s).map(function(nm){
        var e = s[nm]||{};
        return {nama:nm, gender:e.gender || memberGenderNow(nm) || '?', kelas:e.kelas || memberKelasNow(nm) || ''};
      });
    } else if(Array.isArray(sesiRoster[t])){
      // Roster lama (sebelum fitur kelas) belum punya field kelas → lengkapi.
      sesiRoster[t].forEach(function(r){
        if(!r) return;
        if(!r.gender) r.gender = ((sesiData[t]||{})[r.nama]||{}).gender || memberGenderNow(r.nama) || '?';
        if(r.kelas === undefined || r.kelas === null) r.kelas = ((sesiData[t]||{})[r.nama]||{}).kelas || memberKelasNow(r.nama) || '';
      });
    }
  });
  // Normalisasi field kelas di koleksi anggota (caberawit): ejaan diseragamkan,
  // kelompok lain dibersihkan (kelas dikosongkan supaya tidak bocor antar akun).
  try {
    var cabNow = (typeof currentGroup !== 'undefined' && currentGroup === 'caberawit');
    members.forEach(function(m){
      if(!m) return;
      if(cabNow){ m.kelas = (typeof normalizeKelas === 'function') ? normalizeKelas(m.kelas) : (m.kelas||''); }
      else if(m.kelas){ m.kelas = ''; }
    });
  } catch(e){}
}

// Anggota yang berstatus aktif (tidak diarsipkan). Anggota arsip tidak
// muncul di daftar isi absensi dan tidak ikut perhitungan rekap/dashboard.
function activeMembers(){
  return members.filter(function(m){ return !m.arsip; });
}

var BULAN = ['','Januari','Februari','Maret','April','Mei','Juni',
             'Juli','Agustus','September','Oktober','November','Desember'];
var HARI  = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
var BULAN_ID = ['','Januari','Februari','Maret','April','Mei','Juni',
                'Juli','Agustus','September','Oktober','November','Desember'];

// Absensi state
var absenTgl    = '';
var absenBulan  = 0;
var absenTahun  = 0;
var absenKet    = '';
var absenGender = 'S';
var openPanel   = null;

// Kas data
var kasTransaksi  = [];
// Saldo awal Kas kini bersifat per-kelompok, disimpan di dokumen
// groups/{groupId} (field kasSaldoAwal) dan dimuat oleh fbLoadGroupProfile()
// di firebase.js — bukan konstanta tetap lagi. Muda-Mudi memakai nilai lama
// yang sudah terkunci (Rp 1.045.700); kelompok baru mulai dari Rp 0 dan
// saldo awalnya cukup dicatat sebagai transaksi pemasukan biasa oleh pengurus.
var kasSaldoAwal  = 0;

// ── Activity Log ──
var _activityLogs = [];
var _logListeners = [];

function logActivity(aksi, detail){
  var entry = {
    id: 'log-'+Date.now()+'-'+Math.random().toString(36).slice(2,6),
    waktu: Date.now(),
    user: (currentUser&&currentUser.username)||'admin',
    aksi: aksi,
    detail: detail
  };
  _activityLogs.unshift(entry);
  if(_activityLogs.length > 500) _activityLogs.length = 500;
  try { localStorage.setItem('_activityLogs', JSON.stringify(_activityLogs)); } catch(e){}
  _logListeners.forEach(function(fn){ fn(entry); });
  if(window._fbReady) fbSaveLog(entry);
}

function renderActivityLogFor(filterAksi){
  var q = (document.getElementById('logSearch')||{}).value||'';
  var qLow = q.toLowerCase();
  var fAksi = filterAksi||(document.getElementById('logFilter')||{}).value||'';
  var sortVal = (document.getElementById('logSort')||{}).value||'desc';

  var list = _activityLogs.slice();
  if(fAksi) list = list.filter(function(e){ return e.aksi===fAksi; });
  if(q) list = list.filter(function(e){
    return e.detail.toLowerCase().indexOf(qLow)>=0 || e.user.toLowerCase().indexOf(qLow)>=0;
  });
  if(sortVal==='asc') list.reverse();

  var tbody = document.getElementById('logTbody');
  var empty = document.getElementById('logEmpty');
  if(!tbody) return;
  if(!list.length){
    tbody.innerHTML = '';
    if(empty) empty.style.display = '';
    return;
  }
  if(empty) empty.style.display = 'none';

  var h = '';
  list.forEach(function(e){
    var d = new Date(e.waktu);
    var ts = d.getDate()+'/'+(d.getMonth()+1)+'/'+d.getFullYear()+' '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');

    var aksiClass = 'log-badge log-'+e.aksi;
    var aksiLabel = e.aksi.charAt(0).toUpperCase()+e.aksi.slice(1);
    h += '<tr>'+
      '<td style="white-space:nowrap;font-size:11px;color:var(--text2)">'+ts+'</td>'+
      '<td style="white-space:nowrap">'+e.user+'</td>'+
      '<td><span class="'+aksiClass+'">'+aksiLabel+'</span></td>'+
      '<td style="font-size:12px">'+escHtml(e.detail)+'</td>'+
    '</tr>';
  });
  tbody.innerHTML = h;
}

function openActivityLog(){
  var overlay = document.getElementById('log-overlay');
  var popup = document.getElementById('log-popup');
  if(_popTimers && _popTimers['log-popup']){ clearTimeout(_popTimers['log-popup']); delete _popTimers['log-popup']; }
  if(overlay){ overlay.classList.remove('pop-closing'); overlay.classList.add('show'); }
  if(popup){ popup.classList.remove('pop-closing'); popup.style.display='flex'; void popup.offsetWidth; popup.classList.add('show'); }
  renderActivityLogFor('');
}

function closeActivityLog(){
  closePop('log-overlay','log-popup');
}

function logExport(){
  var csv = 'Waktu,User,Aksi,Detail\n';
  _activityLogs.slice().reverse().forEach(function(e){
    var d = new Date(e.waktu);
    var ts = d.getDate()+'/'+(d.getMonth()+1)+'/'+d.getFullYear()+' '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
    csv += '"'+ts+'","'+e.user+'","'+e.aksi+'","'+e.detail.replace(/"/g,'""')+'"\n';
  });
  var a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,\uFEFF'+encodeURIComponent(csv);
  a.download = 'Activity_Log.csv';
  a.click();
}

// ── Offline Backup (per-kelompok, supaya tidak bocor saat ganti kelompok) ──
var _pendingCount = 0;

function _gk(key){ return key + '_' + (currentGroup || 'unknown'); }

function backupData(){
  if(!currentGroup) return;
  try {
    localStorage.setItem(_gk('_members'), JSON.stringify(members));
    localStorage.setItem(_gk('_sesiData'), JSON.stringify(sesiData));
    localStorage.setItem(_gk('_sesiKet'), JSON.stringify(sesiKet));
    localStorage.setItem(_gk('_sesiRoster'), JSON.stringify(sesiRoster));
    localStorage.setItem(_gk('_kasTransaksi'), JSON.stringify(kasTransaksi));
    localStorage.setItem(_gk('_activityLogs'), JSON.stringify(_activityLogs));
    localStorage.setItem('saved_group', currentGroup);
  } catch(e){ /* localStorage penuh */ }
}

function restoreData(){
  if(!currentGroup) return;
  var m = localStorage.getItem(_gk('_members'));
  var s = localStorage.getItem(_gk('_sesiData'));
  var k = localStorage.getItem(_gk('_sesiKet'));
  var r = localStorage.getItem(_gk('_sesiRoster'));
  var t = localStorage.getItem(_gk('_kasTransaksi'));
  var l = localStorage.getItem(_gk('_activityLogs'));
  if(m) try { members = JSON.parse(m); } catch(e){}
  if(s) try { sesiData = JSON.parse(s); } catch(e){}
  if(k) try { sesiKet  = JSON.parse(k); } catch(e){}
  if(r) try { var _sr = JSON.parse(r); if(_sr && typeof _sr==='object' && !Array.isArray(_sr)) sesiRoster = _sr; } catch(e){}
  if(t) try { kasTransaksi = JSON.parse(t); } catch(e){}
  if(l) try { _activityLogs = JSON.parse(l); } catch(e){}
}

function getPendingCount(){
  return _pendingCount;
}

function setPendingCount(n){
  _pendingCount = n;
  var badges = [
    document.getElementById('pc-sync-badge'),
    document.getElementById('mob-sync-badge')
  ];
  badges.forEach(function(el){
    if(!el) return;
    if(navigator.onLine && n === 0){
      el.className = 'sync-badge sync-ok';
      el.textContent = 'Online';
    } else if(!navigator.onLine){
      el.className = 'sync-badge sync-off';
      el.textContent = 'Offline' + (n > 0 ? ' ('+n+' pending)' : '');
    } else if(n > 0){
      el.className = 'sync-badge sync-save';
      el.textContent = n + ' pending';
    }
  });
}
