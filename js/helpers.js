// ══════════════════════════════════════════════════
// HELPERS — utility functions shared across modules
// ══════════════════════════════════════════════════

function initials(nama){
  return nama.split(' ').slice(0,2).map(function(w){ return w[0]; }).join('');
}
function eid(nama){ return nama.replace(/[^a-zA-Z0-9]/g,'_'); }
function glabel(g){ return g==='P'?'Perempuan':'Laki-laki'; }

function filteredM(g){
  if(!g||g==='S') return activeMembers();
  return activeMembers().filter(function(m){ return m.gender===g; });
}

// ══════════════════════════════════════════════════
// KELAS CABERAWIT — hanya dipakai saat currentGroup === 'caberawit'.
// Urutan tampil resmi: PAUD → Tilawati 1..6 → Al-Quran → (Tanpa Kelas).
// Kelompok lain TIDAK memakai kelas (tetap grup Perempuan/Laki-laki).
// ══════════════════════════════════════════════════
var CAB_KELAS = ['PAUD','Tilawati 1','Tilawati 2','Tilawati 3','Tilawati 4','Tilawati 5','Tilawati 6','Al-Quran'];

function isCaberawit(){
  try { return (typeof currentGroup !== 'undefined' && currentGroup === 'caberawit'); }
  catch(e){ return false; }
}

// Normalisasi isian kelas (toleran kapital/spasi/strip). Kembalian '' bila kosong.
function normalizeKelas(k){
  if(k === null || k === undefined) return '';
  var s = String(k).trim().replace(/\s+/g,' ');
  if(!s) return '';
  var low = s.toLowerCase().replace(/[-_]+/g,' ').replace(/\s+/g,' ').trim();
  if(low === 'paud' || low === 'pa ud') return 'PAUD';
  if(low === 'alquran' || low === 'al quran' || low === 'al qur an' ||
     low === 'alqur an' || low === 'al-quran' || low === 'al quran') return 'Al-Quran';
  var m = low.match(/^tilawati\s*(\d)$/);
  if(m){
    var n = parseInt(m[1],10);
    if(n >= 1 && n <= 6) return 'Tilawati '+n;
  }
  // Cocokkan persis (case-insensitive) ke daftar resmi
  for(var i=0;i<CAB_KELAS.length;i++){
    if(CAB_KELAS[i].toLowerCase() === low) return CAB_KELAS[i];
  }
  return '';
}

function kelasIndex(k){
  var nk = normalizeKelas(k);
  var i = CAB_KELAS.indexOf(nk);
  return i === -1 ? CAB_KELAS.length : i; // tanpa kelas selalu paling bawah
}

function memberKelas(m){
  if(!m) return '';
  return normalizeKelas(m.kelas);
}

function kelasLabel(k){
  var nk = normalizeKelas(k);
  return nk || 'Tanpa Kelas';
}

// Urut: kelas (sesuai CAB_KELAS) lalu nama A→Z.
function sortByKelasNama(a, b){
  var ka = kelasIndex(memberKelas(a)), kb = kelasIndex(memberKelas(b));
  if(ka !== kb) return ka - kb;
  return String(a.nama||'').localeCompare(String(b.nama||''));
}

// Kelompokkan list member aktif menjadi [{kelas, items}] terurut resmi.
// List yang masuk sebaiknya SUDAH difilter (cari/status/gender).
function groupByKelas(list){
  var buckets = {};
  (list||[]).forEach(function(m){
    var k = memberKelas(m) || '';
    if(!buckets[k]) buckets[k] = [];
    buckets[k].push(m);
  });
  var keys = Object.keys(buckets).sort(function(a,b){
    var ia = kelasIndex(a), ib = kelasIndex(b);
    if(ia !== ib) return ia - ib;
    return a.localeCompare(b);
  });
  // Pastikan urutan resmi muncul walau bucket kosong dilewati (tidak dibuat).
  return keys.map(function(k){
    var items = buckets[k].sort(function(a,b){ return String(a.nama||'').localeCompare(String(b.nama||'')); });
    return {kelas: k, items: items};
  });
}

// Tampilkan/sembunyikan UI khusus Caberawit (dipanggil tiap ganti kelompok / render).
// Aman dipanggil kapan saja (cek elemen satu per satu, tidak throw).
function refreshGroupUI(){
  var cab = isCaberawit();
  var kr = document.getElementById('iKelasRow');
  if(kr) kr.style.display = cab ? '' : 'none';
  var kb = document.getElementById('mdet-kelas-btn');
  if(kb) kb.style.display = cab ? '' : 'none';
  // Segmen gender tetap ada (jadi filter di dalam tiap kelas), tidak disembunyikan
  // supaya tidak membingungkan pengguna lama.
}

function setText(id, val){
  var el = document.getElementById(id);
  if(el) el.textContent = val;
}

function escHtml(s){
  return String(s)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

// Aman dipakai untuk menyisipkan string ke dalam onclick="...('...')":
// escape dulu untuk konteks string JS (kutip tunggal + backslash),
// baru escape untuk konteks atribut HTML.
function escJsAttr(s){
  var js = String(s).replace(/\\/g,'\\\\').replace(/'/g,"\\'");
  return escHtml(js);
}

function showToast(msg, duration){
  var t = document.getElementById('app-toast');
  if(!t) return;
  t.textContent = msg;
  t.classList.remove('toast-hide');
  void t.offsetWidth;
  t.style.display = 'flex';
  if(window._toastTimer) clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(function(){
    t.classList.add('toast-hide');
    setTimeout(function(){ if(t.classList.contains('toast-hide')) t.style.display = 'none'; }, 220);
  }, duration||2200);
}

// Putuskan apakah section kas harus lompat ke halaman baru: hanya bila
// konten sebelumnya sudah melebihi satu halaman cetak. Murni fungsi data
// (mudah di-unit-test); pengukuran offsetTop dilakukan pemanggil.
function kasBreakDecision(preKasTop, pageH){
  return preKasTop > pageH;
}

function _printWithIframe(html){
  var old = document.getElementById('_print_frame');
  if(old) old.remove();
  var f = document.createElement('iframe');
  f.id = '_print_frame';
  // Lebar disamakan dengan lebar konten cetak A4 landscape (297-20mm)
  // supaya pengukuran tinggi mendekati hasil cetak sebenarnya.
  f.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1047px;height:1123px;border:none';
  document.body.appendChild(f);
  f.contentDocument.open();
  f.contentDocument.write(html);
  f.contentDocument.close();
  f.contentWindow.focus();
  setTimeout(function(){
    try{
      // Ukur tinggi AKTUAL hasil render: bila semua konten sebelum kas
      // masih muat satu halaman, batalkan lompatan halaman paksa supaya
      // tidak ada setengah halaman kosong. Dokumen panjang tetap
      // menaruh kas di halaman baru seperti semula.
      var doc=f.contentDocument;
      var kasEl=doc.querySelector('.kas-print-page');
      if(kasEl){
        var pageH=(210-20)/25.4*96; // area cetak A4 landscape (px)
        var top=0, el=kasEl;
        while(el){ top+=el.offsetTop||0; el=el.offsetParent; }
        if(!kasBreakDecision(top, pageH)) kasEl.classList.add('no-break');
      }
    }catch(e){}
    f.contentWindow.print();
  }, 900);
}

function fmtRp(n){
  return 'Rp\u202f'+Math.round(n||0).toLocaleString('id-ID');
}

function fmtTglShort(tgl){
  if(!tgl) return '—';
  var parts = tgl.split('-');
  if(parts.length<3) return tgl;
  var MBLN=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];
  return parts[2]+' '+(MBLN[parseInt(parts[1],10)-1]||'')+'\''+String(parts[0]).slice(2);
}

// ── App Popup — pengganti alert()/confirm()/prompt() bawaan browser ──
// Dipakai supaya semua konfirmasi/isian pakai tampilan popup aplikasi sendiri
// (bukan popup native browser), dan tidak memblokir/mereset layar.
var _apOnOk    = null;
var _apType    = 'confirm';
var _apColors  = {
  red:   {bg:'var(--red-lt)',   fg:'var(--red)'},
  amber: {bg:'var(--amber-lt)', fg:'var(--amber)'},
  green: {bg:'var(--green-lt)', fg:'var(--green)'},
  gold:  {bg:'var(--gold-xlt)', fg:'var(--gold-dk)'}
};

function _showAppPopup(cfg){
  _apOnOk = cfg.onOk || null;
  _apType = cfg.type;
  var col = _apColors[cfg.color||'amber'] || _apColors.amber;
  var icoEl  = document.getElementById('app-popup-icon');
  var useEl  = document.getElementById('app-popup-icon-use');
  var titleEl= document.getElementById('app-popup-title');
  var msgEl  = document.getElementById('app-popup-msg');
  var inputEl= document.getElementById('app-popup-input');
  var okEl   = document.getElementById('app-popup-ok');
  var cancelEl=document.getElementById('app-popup-cancel');
  if(icoEl){ icoEl.style.background = col.bg; icoEl.style.color = col.fg; }
  if(useEl) useEl.setAttribute('href', '#ico-'+(cfg.icon||'q'));
  if(titleEl){ titleEl.textContent = cfg.title||'Konfirmasi'; titleEl.style.color = col.fg; }
  if(msgEl) msgEl.textContent = cfg.message||'';
  if(inputEl){
    if(cfg.type==='prompt'){
      inputEl.style.display = 'block';
      inputEl.value = cfg.defaultValue||'';
      inputEl.placeholder = cfg.placeholder||'';
    } else {
      inputEl.style.display = 'none';
      inputEl.value = '';
    }
  }
  if(okEl){ okEl.textContent = cfg.okText||'Ya, Lanjutkan'; okEl.style.background = (cfg.color==='red')?'var(--red)':''; okEl.style.borderColor = (cfg.color==='red')?'var(--red-dk)':''; }
  if(cancelEl) cancelEl.style.display = (cfg.type==='alert') ? 'none' : '';
  showPopup('app-popup-overlay','app-popup');
  if(cfg.type==='prompt') setTimeout(function(){ inputEl.focus(); inputEl.select(); }, 80);
}

function closeAppPopup(){
  hidePopup('app-popup-overlay','app-popup');
  _apOnOk = null;
}

function _appPopupSubmit(){
  var type = _apType, cb = _apOnOk;
  if(type==='prompt'){
    var val = document.getElementById('app-popup-input').value;
    closeAppPopup();
    if(cb) cb(val);
  } else {
    closeAppPopup();
    if(cb) cb();
  }
}

// Pengganti alert(msg) — popup informasi dengan satu tombol OK.
function appAlert(message, opts){
  opts = opts || {};
  _showAppPopup({
    type: 'alert', icon: opts.icon||'q', color: opts.color||'amber',
    title: opts.title||'Pemberitahuan', message: message,
    okText: opts.okText||'OK', onOk: opts.onOk||null
  });
}

// Pengganti confirm(msg) — onConfirm dipanggil hanya jika user menekan tombol Ya/lanjut.
function appConfirm(message, onConfirm, opts){
  opts = opts || {};
  _showAppPopup({
    type: 'confirm', icon: opts.icon||'q', color: opts.color||'red',
    title: opts.title||'Konfirmasi', message: message,
    okText: opts.okText||'Ya, Lanjutkan', onOk: onConfirm
  });
}

// Pengganti prompt(msg, def) — onSubmit(value) dipanggil hanya jika user menekan Simpan.
function appPrompt(message, defaultValue, onSubmit, opts){
  opts = opts || {};
  _showAppPopup({
    type: 'prompt', icon: opts.icon||'edit', color: opts.color||'gold',
    title: opts.title||'Isi Data', message: message, defaultValue: defaultValue||'',
    placeholder: opts.placeholder||'', okText: opts.okText||'Simpan', onOk: onSubmit
  });
}

var _popTimers = {};

// Buka popup dengan animasi masuk (fade + scale kecil). Aman dipanggil
// berulang — timer tutup yang masih berjalan dibatalkan.
function openPop(ovId, popId){
  if(_popTimers[popId]){ clearTimeout(_popTimers[popId]); delete _popTimers[popId]; }
  var ov = document.getElementById(ovId);
  var pp = document.getElementById(popId);
  if(ov){ ov.classList.remove('pop-closing'); ov.classList.add('show'); }
  if(pp){
    pp.classList.remove('pop-closing');
    pp.style.display = '';
    void pp.offsetWidth;
    pp.classList.add('show');
  }
}

// Tutup popup dengan fade-out singkat (~150ms). Selama fade, pointer-events
// dimatikan supaya tidak ada aksi ganda (mis. klik ganda tombol Simpan).
function closePop(ovId, popId){
  if(_popTimers[popId]) clearTimeout(_popTimers[popId]);
  var ov = document.getElementById(ovId);
  var pp = document.getElementById(popId);
  if(ov) ov.classList.add('pop-closing');
  if(pp) pp.classList.add('pop-closing');
  _popTimers[popId] = setTimeout(function(){
    if(ov) ov.classList.remove('show','pop-closing');
    if(pp){ pp.classList.remove('show','pop-closing'); pp.style.display='none'; }
    delete _popTimers[popId];
  }, 150);
}

function showPopup(ovId, popId){ openPop(ovId, popId); }

function hidePopup(ovId, popId){ closePop(ovId, popId); }

// Busy state untuk tombol — mencegah double-click dan memberi feedback.
function setBtnBusy(btn, busy, busyText){
  if(!btn) return;
  if(busy){
    if(btn.dataset._origHtml === undefined) btn.dataset._origHtml = btn.innerHTML;
    btn.disabled = true;
    if(busyText) btn.innerHTML = busyText+' <span class="btn-spinner"></span>';
    btn.classList.add('is-busy');
  } else {
    btn.disabled = false;
    if(btn.dataset._origHtml !== undefined) btn.innerHTML = btn.dataset._origHtml;
    btn.classList.remove('is-busy');
  }
}

// ── UPDATE NOTIFICATION ──
// Popup ini hanya muncul jika memang ada pembaruan aplikasi yang membutuhkan
// refresh. Hubungkan showUpdateNotification() ke mekanisme pengecekan update
// yang dimiliki project (mis. membandingkan versi cache vs server, atau
// metadata di service worker). Jangan dipanggil di setiap pembukaan halaman.
function showUpdateNotification(){
  showPopup('update-overlay','update-popup');
}

function closeUpdateNotification(){
  hidePopup('update-overlay','update-popup');
}

// Reload halaman — data lokal (indexedDB / cache) tidak hilang.
function refreshNow(){
  location.reload();
}

function skeletonHtml(count){
  var h='';
  for(var i=0;i<(count||5);i++){
    h+='<div class="sk-item">'+
      '<div class="sk-av"></div>'+
      '<div class="sk-lines">'+
        '<div class="sk-line"></div>'+
        '<div class="sk-line short"></div>'+
      '</div>'+
      '<div class="sk-badge"></div>'+
    '</div>';
  }
  return h;
}

// Buat path SVG garis halus (Catmull-Rom -> Bezier) dari array titik [x,y]
function smoothLinePath(pts){
  if(!pts || pts.length < 2) return '';
  if(pts.length === 2){
    return 'M '+pts[0][0]+' '+pts[0][1]+' L '+pts[1][0]+' '+pts[1][1];
  }
  var d = 'M '+pts[0][0].toFixed(2)+' '+pts[0][1].toFixed(2)+' ';
  for(var i=0;i<pts.length-1;i++){
    var p0=pts[Math.max(0,i-1)], p1=pts[i], p2=pts[i+1], p3=pts[Math.min(pts.length-1,i+2)];
    var c1x=p1[0]+(p2[0]-p0[0])/6, c1y=p1[1]+(p2[1]-p0[1])/6;
    var c2x=p2[0]-(p3[0]-p1[0])/6, c2y=p2[1]-(p3[1]-p1[1])/6;
    d+='C '+c1x.toFixed(2)+' '+c1y.toFixed(2)+', '+c2x.toFixed(2)+' '+c2y.toFixed(2)+', '+
       p2[0].toFixed(2)+' '+p2[1].toFixed(2)+' ';
  }
  return d;
}

// ══════════════════════════════════════════════════
// SWIPE TO DELETE
// Struktur item: <div class="swipe-row" data-key="...">
//   <div class="swipe-reveal">Hapus</div>
//   <div class="swipe-content" onclick="...">...</div>
// </div>
// Geser kiri sampai penuh → panggil onConfirm() (biasanya membuka konfirmasi
// hapus). Geser sebagian → kembali tertutup. Tap biasa tetap berjalan.
// ══════════════════════════════════════════════════
function attachSwipeDelete(el, onConfirm){
  if(!el || el._swipeBound) return;
  el._swipeBound = true;
  var content = el.querySelector('.swipe-content');
  var reveal  = el.querySelector('.swipe-reveal');
  var openW = (reveal && reveal.offsetWidth) || 84;
  var startX=0, curX=0, dragging=false, pointerId=null, suppressed=false;

  function setX(x){ if(content) content.style.transform='translateX('+x+'px)'; }
  function setReveal(x){ if(reveal) reveal.style.opacity = x<-8 ? '1' : '0'; }
  function closeAnim(){
    setReveal(0);
    if(content){ content.style.transition='transform .22s ease'; setX(0); setTimeout(function(){ if(content) content.style.transition=''; },240); }
  }

  el.addEventListener('pointerdown', function(e){
    if(e.pointerType==='mouse' && e.button!==0) return;
    pointerId = e.pointerId;
    startX = e.clientX; curX=0; dragging=true; suppressed=false;
    if(content) content.style.transition='';
    if(e.pointerType!=='touch' && el.setPointerCapture){ try{ el.setPointerCapture(pointerId); }catch(err){} }
  });
  el.addEventListener('pointermove', function(e){
    if(!dragging || e.pointerId!==pointerId) return;
    var dx = e.clientX - startX;
    if(dx > 0) dx = 0; // hanya geser ke kiri
    curX = dx;
    setX(dx);
    setReveal(dx);
    if(dx < -6) suppressed = true;
  });
  function endDrag(e){
    if(!dragging || (e && e.pointerId!==pointerId)) return;
    dragging=false; pointerId=null;
    if(curX <= -openW){
      setX(0);
      setReveal(0);
      suppressed = true;
      setTimeout(function(){ if(onConfirm) onConfirm(); }, 140);
    } else {
      closeAnim();
    }
  }
  el.addEventListener('pointerup', endDrag);
  el.addEventListener('pointercancel', endDrag);
  el.addEventListener('click', function(e){
    if(suppressed){ suppressed=false; e.preventDefault(); e.stopPropagation(); return; }
    // Dengan pointer capture (mouse), klik ditargetkan ke baris, bukan ke
    // .swipe-content — teruskan ke onclick konten agar tetap jalan.
    var c = el.querySelector('.swipe-content');
    if(c && !c.contains(e.target) && typeof c.onclick === 'function'){
      c.onclick.call(c, e);
    }
  }, true);
}

// Bind swipe ke semua .swipe-row di dalam container. keyFn(row) membaca data-key.
function initSwipeRows(container, keyFn, onConfirm){
  if(!container) return;
  container.querySelectorAll('.swipe-row').forEach(function(row){
    if(row._swipeRowInit) return;
    row._swipeRowInit = true;
    attachSwipeDelete(row, function(){ onConfirm(keyFn(row)); });
  });
}

// Animasi hapus item sebelum list dirender ulang: tinggi dicairkan ke 0
// + fade, supaya baris yang dihapus "ciut" halus, bukan hilang instan.
function animateRemove(el, done){
  if(!el || !el.parentNode){ if(done) done(); return; }
  el.style.height = el.offsetHeight+'px';
  void el.offsetHeight;
  el.classList.add('collapsing');
  el.style.height = '0px';
  el.style.marginBottom = '0px';
  el.style.paddingTop = '0px';
  el.style.paddingBottom = '0px';
  setTimeout(function(){ if(done) done(); }, 260);
}

// Animasikan pengisian bar (kas & kehadiran) dari 0 ke nilai akhir saat
// pertama kali tampil. Elemen yang dirender ulang via innerHTML tidak
// mentransisi sendiri, jadi diforsir: simpan target, nol-kan, kembalikan
// di frame berikutnya (CSS transition di theme.css yang menganimasikan).
function animateBars(scope){
  try{
    if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var root = scope || document;
    var els = root.querySelectorAll('.lux-bar-h,.lux-bar-i,.lux-bar-a,#lux-progress-mob,#lux-progress-pc');
    var items = [];
    els.forEach(function(el){
      var w = el.style.width;
      if(w && w !== '0%' && w !== '0px') items.push({el:el, w:w});
    });
    if(!items.length) return;
    items.forEach(function(o){ o.el.style.width = '0%'; });
    void document.body.offsetWidth;
    requestAnimationFrame(function(){ requestAnimationFrame(function(){
      items.forEach(function(o){ if(o.el.isConnected) o.el.style.width = o.w; });
    }); });
  }catch(e){}
}

// Error message muncul fade/slide-down halus: paksa ulang animasi CSS
// .err-show setiap kali teks diganti (bukan "jedag" instan).
function flashError(el){
  if(!el) return;
  try{
    el.classList.remove('err-show');
    void el.offsetWidth;
    el.classList.add('err-show');
  }catch(e){}
}
