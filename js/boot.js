// ══════════════════════════════════════════════════
// BOOT — DOMContentLoaded + auto-login via Firebase Auth
// ══════════════════════════════════════════════════

if('serviceWorker' in navigator && /^https?:$/.test(location.protocol)){
  window.addEventListener('load', function(){
    navigator.serviceWorker.register('sw.js').catch(function(){});
  });
}

window.addEventListener('DOMContentLoaded', function(){
  document.getElementById('pg-login').style.display = 'none';
  document.getElementById('pg-app').style.display   = 'none';

  // Animasi loading ~4,6 detik: kunci durasi minimal loading supaya
  // sempat terlihat penuh. Kalau Firebase lama, tidak menambah tunggu.
  var _bootStart = Date.now();
  var LS_MIN = 4600;
  function lsDelay(){
    return Math.max(400, LS_MIN - (Date.now() - _bootStart));
  }

  function removeLoader(){
    var l = document.getElementById('loading-screen');
    if(l && l.parentNode) l.parentNode.removeChild(l);
  }

  function showLogin(){
    dismissLoader(function(){
      document.getElementById('pg-login').style.display = '';
      // Isi username dari localStorage bila ada
      var savedU = localStorage.getItem('saved_user');
      if(savedU){
        var uEl = document.getElementById('loginUser');
        if(uEl) uEl.value = savedU;
      }
    });
  }

  function hideLoaderThen(fn){
    dismissLoader(fn);
  }

  // Copot loading HANYA setelah animasi progress mencapai 100% (+ tahan
  // "Selesai!" sebentar) — ada pengaman 4,5 dtk bila animasi macet.
  function waitLsComplete(cb){
    var waited = 0;
    (function poll(){
      var pct = 0;
      try { pct = window._lsPct || 0; } catch(e){}
      if(pct >= 100){ setTimeout(cb, 600); return; }
      if(waited > 4500){ cb(); return; }
      waited += 150;
      setTimeout(poll, 150);
    })();
  }

  function dismissLoader(then){
    setTimeout(function(){
      waitLsComplete(function(){
        var ls = document.getElementById('loading-screen');
        if(ls){ ls.classList.add('fade-out'); setTimeout(removeLoader, 900); }
        if(then) setTimeout(then, 350);
      });
    }, lsDelay());
  }

  // Session Firebase Auth ditemukan (auto-login) → cari tahu kelompoknya lalu masuk.
  function showApp(fbUser){
    hideLoaderThen(function(){
      var savedU = localStorage.getItem('saved_user') || 'admin';
      resolveUserProfileAndEnter(fbUser.uid, savedU).catch(function(e){
        console.error('Auto-login resolve error', e);
        window._fbSignOut(window._auth);
        showLogin();
      });
    });
  }

  var _fbStarted = false;
  function startAppOnce(){
    if(_fbStarted) return;
    _fbStarted = true;
    startAppWithFirebase();
  }

  function startAppWithFirebase(){
    try {
      window._fbAuthStateChanged(window._auth, function(fbUser){
      if(fbUser){
        showApp(fbUser);
      } else {
        // Firebase Auth aktif dan memastikan TIDAK ada sesi login.
        showLogin();
      }
      });
    } catch(err){
      console.error('Firebase Auth init gagal', err);
      showLogin();
      return;
    }

    // Fallback jika Firebase gagal total (mis. offline saat pertama buka):
    // coba pulihkan dari cache lokal kelompok terakhir yang dipakai di device ini.
    setTimeout(function(){
      if(!_fbReady && !_appStarted){
        console.warn('Firebase timeout.');
        setSyncStatus('off');
        var savedU     = localStorage.getItem('saved_user');
        var savedGroup = localStorage.getItem('saved_group');
        if(savedU && savedGroup && localStorage.getItem('_members_'+savedGroup)){
          currentGroup = savedGroup;
          restoreData();
          currentUser = { username: savedU, nama: (typeof accountDisplayName==='function'?accountDisplayName(savedU, savedGroup):'Admin'), role:(savedU==='admin'?'admin':'group'), groupId: savedGroup };
          masukApp();
        } else {
          showLogin();
        }
      }
    }, 5000);
  }

  function waitForFirebase(){
    // Pengaman absolut: loading tidak boleh nyangkut selamanya.
    // Kalau 15 detik aplikasi belum mulai (mis. modul/CDN Firebase gagal
    // dimuat sehingga 'firebase-ready' tidak pernah datang), paksa tampil
    // halaman login supaya user tidak stuck di loading.
    setTimeout(function(){
      if(_appStarted) return;
      if(!document.getElementById('loading-screen')) return;
      try { window._firebaseReady ? startAppOnce() : showLogin(); }
      catch(e){ try { showLogin(); } catch(_){} }
    }, 15000);
    if(window._firebaseReady){
      startAppOnce();
    } else {
      document.addEventListener('firebase-ready', function(){
        startAppOnce();
      }, {once:true});
    }
  }

  window.addEventListener('online',  function(){ setPendingCount(getPendingCount()); });
  window.addEventListener('offline', function(){ setPendingCount(getPendingCount()); });

  setTimeout(waitForFirebase, 800);
});
