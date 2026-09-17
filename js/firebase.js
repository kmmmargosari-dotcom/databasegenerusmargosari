// ══════════════════════════════════════════════════
// FIREBASE HELPERS — semua path Firestore melewati
// groups/{currentGroup}/... sehingga data tiap kelompok
// terisolasi secara struktural (bukan cuma filter).
// ══════════════════════════════════════════════════

var _fbReady        = false;
var _fbUnsubSesi    = null;
var _fbUnsubAnggota = null;
var _fbUnsubKas     = null;
var _fbUnsubLog     = null;

// Kelompok yang sedang aktif (diisi setelah login / saat admin ganti kelompok)
var currentGroup     = null;                 // 'caberawit' | 'praremaja' | 'remaja' | 'mudamudi'
var currentGroupInfo = { displayName: '', kasSaldoAwal: 0 };

function fsDb(){ return window._db; }

// Path helper: semua koleksi data ada di bawah groups/{currentGroup}/...
function gCol(name){ return window._fsCol(fsDb(), 'groups', currentGroup, name); }
function gDoc(name, id){ return window._fsDoc(fsDb(), 'groups', currentGroup, name, id); }

// ── SYNC STATUS BADGE ──
var _syncTimer = null;
function setSyncStatus(state){
  if(state === 'ok'){
    document.querySelectorAll('.sync-badge').forEach(function(el){
      el.className = 'sync-badge sync-ok';
      el.textContent = 'Online';
    });
  } else if(state === 'off'){
    setPendingCount(getPendingCount());
  } else if(state === 'save'){
    document.querySelectorAll('.sync-badge').forEach(function(el){
      el.className = 'sync-badge sync-save';
      el.textContent = 'Menyinkronkan…';
    });
  }
}

function _syncWrite(promise){
  setPendingCount(getPendingCount() + 1);
  if(_syncTimer) clearTimeout(_syncTimer);
  return promise.then(function(){
    setPendingCount(Math.max(0, getPendingCount() - 1));
    updateSyncFromOnline();
  }).catch(function(e){
    console.error('Firebase write error', e);
    updateSyncFromOnline();
  });
}

function updateSyncFromOnline(){
  setPendingCount(getPendingCount());
  _syncTimer = setTimeout(function(){
    if(navigator.onLine && getPendingCount() === 0){
      document.querySelectorAll('.sync-badge').forEach(function(el){
        el.className = 'sync-badge sync-ok';
        el.textContent = 'Online';
      });
    }
  }, 4000);
}

// Simpan satu sesi ke Firestore (termasuk roster snapshot)
function fbSaveSesi(key){
  if(!_fbReady) return;
  var data = { kegiatan: sesiKet[key]||'', absensi: sesiData[key]||{}, roster: sesiRoster[key]||[] };
  _syncWrite(window._fsSet(gDoc('sesi',key), data));
}

// Hapus satu sesi dari Firestore
function fbDelSesi(key){
  if(!_fbReady) return;
  _syncWrite(window._fsDel(gDoc('sesi',key)));
}

// Simpan seluruh array members ke Firestore
function fbSaveAnggota(){
  if(!_fbReady) return;
  _syncWrite(window._fsSet(gDoc('anggota','list'), { members: members }));
}

// Simpan satu transaksi kas ke Firestore
function fbSaveKas(id, data){
  if(!_fbReady) return;
  _syncWrite(window._fsSet(gDoc('kas',id), data));
}

// Hapus satu transaksi kas dari Firestore
function fbDelKas(id){
  if(!_fbReady) return;
  _syncWrite(window._fsDel(gDoc('kas',id)));
}

// Simpan activity log ke Firestore
function fbSaveLog(entry){
  if(!_fbReady) return;
  _syncWrite(window._fsSet(gDoc('log',entry.id), {
    waktu: entry.waktu,
    user: entry.user,
    aksi: entry.aksi,
    detail: entry.detail
  }));
}

// Hentikan semua listener realtime (dipakai saat admin ganti kelompok / logout)
function fbStopListeners(){
  if(_fbUnsubSesi)    { _fbUnsubSesi();    _fbUnsubSesi    = null; }
  if(_fbUnsubAnggota) { _fbUnsubAnggota(); _fbUnsubAnggota = null; }
  if(_fbUnsubKas)     { _fbUnsubKas();     _fbUnsubKas     = null; }
  if(_fbUnsubLog)     { _fbUnsubLog();     _fbUnsubLog     = null; }
  _fbReady = false;
}

// Mulai listen realtime Firestore untuk currentGroup
function fbStartListeners(){
  // --- Sesi ---
  _fbUnsubSesi = window._fsSnap(gCol('sesi'), function(snap){
    sesiData = {};
    sesiKet  = {};
    sesiRoster = {};
    snap.forEach(function(d){
      var dat = d.data();
      sesiData[d.id] = dat.absensi || {};
      sesiKet[d.id]  = dat.kegiatan || '';
      sesiRoster[d.id] = dat.roster || null;
    });
    migrateLegacySnapshots();
    backupData();
    try { renderRekap('pc'); } catch(e){}
    try { renderRekap('mob'); } catch(e){}
    try { renderDb(); renderDbMob(); } catch(e){}
    try { renderDashboard(); } catch(e){}
  }, function(e){ console.error('fbSnap sesi',e); });

  // --- Kas ---
  _fbUnsubKas = window._fsSnap(gCol('kas'), function(snap){
    kasTransaksi = [];
    snap.forEach(function(d){
      var dat = d.data();
      kasTransaksi.push({
        id: d.id,
        jenis: dat.jenis||'pemasukan',
        nominal: dat.nominal||0,
        tanggal: dat.tanggal||'',
        keterangan: dat.keterangan||'',
        createdAt: dat.createdAt||0
      });
    });
    backupData();
    try { renderKas(); } catch(e){ console.error('renderKas',e); }
  }, function(e){ console.error('fbSnap kas',e); });

  // --- Anggota ---
  _fbUnsubAnggota = window._fsSnap(gDoc('anggota','list'), function(snap){
    if(snap.exists()){
      var dat = snap.data();
      if(dat.members && dat.members.length){ members = dat.members; }
    }
    migrateLegacySnapshots();
    backupData();
    try { renderAnggota(); } catch(e){}
    try { renderAnggotaMob(); } catch(e){}
    try { renderDashboard(); } catch(e){}
  }, function(e){ console.error('fbSnap anggota',e); });

  // --- Activity Log (hanya ambil dari user lain) ---
  _fbUnsubLog = window._fsSnap(gCol('log'), function(snap){
    var myName = (currentUser&&currentUser.username)||'';
    snap.docChanges().forEach(function(change){
      if(change.type==='added'){
        var dat = change.doc.data();
        if(dat.user !== myName){
          var exists = _activityLogs.some(function(e){ return e.id===change.doc.id; });
          if(!exists){
            _activityLogs.unshift({
              id: change.doc.id,
              waktu: dat.waktu||0,
              user: dat.user||'',
              aksi: dat.aksi||'',
              detail: dat.detail||''
            });
            if(_activityLogs.length > 500) _activityLogs.length = 500;
          }
        }
      }
    });
    _activityLogs.sort(function(a,b){ return b.waktu - a.waktu; });
    if(_activityLogs.length > 500) _activityLogs.length = 500;
    backupData();
  }, function(e){ console.error('fbSnap log',e); });
}

// Ambil profil kelompok (nama tampilan & saldo awal kas) dari groups/{currentGroup}
function fbLoadGroupProfile(){
  return window._fsGetDoc(window._fsDoc(fsDb(),'groups',currentGroup)).then(function(snap){
    var dat = snap.exists() ? snap.data() : {};
    currentGroupInfo.displayName  = dat.displayName || currentGroup;
    currentGroupInfo.kasSaldoAwal = (typeof dat.kasSaldoAwal === 'number') ? dat.kasSaldoAwal : 0;
    kasSaldoAwal = currentGroupInfo.kasSaldoAwal;
    try { applyGroupBranding(currentGroupInfo.displayName); } catch(e){}
  }).catch(function(e){
    console.error('fbLoadGroupProfile error', e);
    currentGroupInfo.displayName  = currentGroup;
    currentGroupInfo.kasSaldoAwal = 0;
    kasSaldoAwal = 0;
  });
}

// Inisialisasi Firebase untuk currentGroup (dipanggil sekali per login / ganti kelompok)
function fbInit(){
  if(!window._db){ console.warn('Firebase DB belum siap'); return; }
  if(!currentGroup){ console.warn('currentGroup belum diset'); return; }
  _fbReady = true;
  setSyncStatus('save');

  fbLoadGroupProfile().then(function(){
    return window._fsGetDoc(gDoc('anggota','list'));
  }).then(function(aSnap){
    if(aSnap.exists() && aSnap.data().members && aSnap.data().members.length){
      members = aSnap.data().members;
    } else {
      members = [];
    }
    return window._fsGetDocs(gCol('sesi'));
  }).then(function(sSnap){
    sesiData = {}; sesiKet = {}; sesiRoster = {};
    sSnap.forEach(function(d){
      var dat = d.data();
      sesiData[d.id] = dat.absensi || {};
      sesiKet[d.id]  = dat.kegiatan || '';
      sesiRoster[d.id] = dat.roster || null;
    });
    migrateLegacySnapshots();
    backupData();
    fbStartListeners();
    setSyncStatus('ok');
  }).catch(function(e){
    console.error('fbInit load error', e);
    // Coba restore dari localStorage (khusus kelompok yang sama)
    restoreData();
    migrateLegacySnapshots();
    fbStartListeners();
    setPendingCount(0);
  });
}
