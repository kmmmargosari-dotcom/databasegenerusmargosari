// ══════════════════════════════════════════════════
// NAVIGATION & INIT
// ══════════════════════════════════════════════════

function mob(){ return window.innerWidth <= 768; }

var _navLocked = false;

function _onAbsenFill(){
  var pg = document.getElementById('mob-absen-page');
  if(mob() && pg && pg.classList.contains('on')) return true;
  if(!mob()){
    var body = document.getElementById('pc-absen-body');
    if(body && body.style.display === 'flex' && absenTgl) return true;
  }
  return false;
}

// Guard: kalau user masih di halaman isi absensi dengan perubahan belum
// "diselesaikan", tanyakan konfirmasi sebelum pindah (cegah data hilang).
function _nav(fn){
  if(_navLocked) return;
  if(_onAbsenFill() && _absenDirty){
    appConfirm(
      'Absensi belum diselesaikan.\n\nPerubahan di halaman ini belum disimpan final.\nTetap pindah ke menu lain?',
      function(){
        _navLocked = true;
        try { fn(); } finally { setTimeout(function(){ _navLocked = false; }, 80); }
      },
      {title:'Konfirmasi Keluar', icon:'logout', color:'amber', okText:'Ya, Keluar'}
    );
    return;
  }
  fn();
}

function goPc(name){
  _nav(function(){ goPcCall(name); });
}

var _navSwitching = false;

function goPcCall(name){
  if(_navSwitching) return;
  var current = document.querySelector('.pane.on');
  var next    = document.getElementById('pc-'+name);
  var siParent = (name==='anggota'||name==='ekspor'||name==='tentang') ? 'lainnya' : name;
  var si = document.getElementById('si-'+siParent);
  document.querySelectorAll('.si').forEach(function(b){ b.classList.remove('on'); });
  if(si) si.classList.add('on');

  function activate(){
    _navSwitching = false;
    document.querySelectorAll('.pane').forEach(function(p){ p.classList.remove('on','leaving','fade-in'); });
    if(next){ next.classList.add('on'); void next.offsetWidth; next.classList.add('fade-in'); }
    window.scrollTo(0,0);
    if(name==='home')  renderDashboard();
    if(name==='rekap') renderRekap('pc');
    if(name==='absen') showAbsenSetup();
    if(name==='kas')   renderKas();
    if(name==='anggota') renderAnggota();
    if(name==='lainnya') renderLainnya();
    if(name==='ekspor') renderEkspor();
  }

  if(!current || current === next || !next){
    activate();
  } else {
    _navSwitching = true;
    current.classList.add('leaving');
    setTimeout(activate, 180);
  }
}

function goMob(name){
  _nav(function(){ goMobCall(name); });
}

function goMobCall(name){
  if(_navSwitching) return;
  var current = document.querySelector('.mob-page.on');
  var pg      = document.getElementById('mob-'+name);
  var parent  = name==='absen-page' ? 'absen' : ((name==='anggota'||name==='ekspor'||name==='tentang') ? 'lainnya' : name);
  var bn = document.getElementById('bn-'+parent);
  document.querySelectorAll('.mob-nav-item').forEach(function(b){ b.classList.remove('on'); });
  if(bn) bn.classList.add('on');

  function activate(){
    _navSwitching = false;
    document.querySelectorAll('.mob-page').forEach(function(p){ p.classList.remove('on','leaving','fade-in'); });
    if(pg){ pg.classList.add('on'); void pg.offsetWidth; pg.classList.add('fade-in'); }
    window.scrollTo(0,0);
    if(name==='home')  renderDashboard();
    if(name==='rekap') renderRekap('mob');
    if(name==='absen') showMobAbsenHero();
    if(name==='kas')   renderKas();
    if(name==='anggota') renderAnggotaMob();
    if(name==='lainnya') renderLainnya();
    if(name==='ekspor') renderEkspor();
  }

  if(!current || current === pg || !pg){
    activate();
  } else {
    _navSwitching = true;
    current.classList.add('leaving');
    setTimeout(activate, 180);
  }
}

function initApp(){
  var today = new Date();
  var ds = today.toLocaleDateString('id-ID',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
  document.querySelectorAll('.js-date').forEach(function(el){ el.textContent = ds; });
  var dd = String(today.getDate()).padStart(2,'0');
  var mm = String(today.getMonth()+1).padStart(2,'0');
  var yy = today.getFullYear();
  ['sTgl','sTglM'].forEach(function(id){
    var el = document.getElementById(id);
    if(el) el.value = yy+'-'+mm+'-'+dd;
  });
  ['rBulan','rBulanM'].forEach(function(id){
    var el = document.getElementById(id);
    if(el) el.value = today.getMonth()+1;
  });
  ['rTahun','rTahunM'].forEach(function(id){
    var el = document.getElementById(id);
    if(el){ if(el.querySelector('option[value="'+yy+'"]')) el.value = yy; }
  });
  ['kasBulan','kasBulanM'].forEach(function(id){
    var el = document.getElementById(id);
    if(el) el.value = String(today.getMonth()+1).padStart(2,'0');
  });
  ['rGender','rGenderM','exRekapGender','exRekapGenderM'].forEach(function(id){
    var el = document.getElementById(id);
    if(el) el.value = 'S';
  });
  renderDashboard();
  try { if(typeof refreshGroupUI === 'function') refreshGroupUI(); } catch(e){}
  if(mob()) goMob('home'); else goPc('home');
}