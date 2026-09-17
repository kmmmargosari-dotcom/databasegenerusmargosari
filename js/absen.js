// ══════════════════════════════════════════════════
// ABSENSI MODULE
// ══════════════════════════════════════════════════

// ── State ──
var _smNama = '', _smCtx = '';
var _smTimer = null;
var _izinNama = '', _izinCtx = '';
var _bulkMode = false;
var _bulkSelected = {};
var _absenDirty = false;

// ── Setup / Body toggle ──
// Landing halaman Absensi: tampilkan HERO dulu; "Mulai Absensi" membuka tahap
// pilih tanggal+nama kegiatan (dan riwayat sesi di bawahnya); lalu mengisi.
function showAbsenSetup(){
  var setup = document.getElementById('pc-absen-setup');
  var body  = document.getElementById('pc-absen-body');
  var btnS  = document.getElementById('pc-btn-selesai');
  if(setup) setup.style.display = 'flex';
  if(body)  { body.style.display = 'none'; body.style.flexDirection = ''; }
  if(btnS)  btnS.style.display = 'none';
  showAbsenHero();
}

function showAbsenHero(){
  var hero = document.getElementById('pc-stage-hero');
  var main = document.getElementById('pc-stage-main');
  if(hero) hero.style.display = '';
  if(main) main.style.display = 'none';
  renderDb();
}

function showAbsenMain(){
  var hero = document.getElementById('pc-stage-hero');
  var main = document.getElementById('pc-stage-main');
  if(hero) hero.style.display = 'none';
  if(main) main.style.display = '';
}

function showMobAbsenHero(){
  var hero = document.getElementById('mob-stage-hero');
  var main = document.getElementById('mob-stage-main');
  if(hero) hero.style.display = '';
  if(main) main.style.display = 'none';
  renderDbMob();
}

function showMobAbsenMain(){
  var hero = document.getElementById('mob-stage-hero');
  var main = document.getElementById('mob-stage-main');
  if(hero) hero.style.display = 'none';
  if(main) main.style.display = '';
}

function showAbsenBody(){
  var setup = document.getElementById('pc-absen-setup');
  var body  = document.getElementById('pc-absen-body');
  var btnS  = document.getElementById('pc-btn-selesai');
  if(setup) setup.style.display = 'none';
  if(body)  { body.style.display = 'flex'; body.style.flexDirection = 'column'; }
  if(btnS)  btnS.style.display = '';
}

function resetAbsenForm(){
  ['sTgl','sTglM'].forEach(function(id){ var el=document.getElementById(id); if(el) el.value=''; });
  ['sKet','sKetM'].forEach(function(id){ var el=document.getElementById(id); if(el) el.value=''; });
}

function selesaiSummary(){
  var sesi = sesiData[absenTgl]||{};
  var filled=0, blm=0;
  activeMembers().forEach(function(m){
    var v=(sesi[m.nama]||{}).status||'';
    if(v) filled++; else blm++;
  });
  return filled+' sudah diisi · '+blm+' belum — dari '+activeMembers().length+' anggota aktif';
}

function _selesaiSave(){
  if(absenTgl){
    sesiKet[absenTgl] = absenKet;
    if(!sesiRoster[absenTgl]){
      var _ss = sesiData[absenTgl]||{};
      sesiRoster[absenTgl] = Object.keys(_ss).map(function(nm){
        var _e = _ss[nm]||{};
        return {nama:nm, gender:_e.gender || memberGenderNow(nm) || '?', kelas:_e.kelas || memberKelasNow(nm) || ''};
      });
    }
    fbSaveSesi(absenTgl);
  }
  _absenDirty = false;
  syncRekapFilter();
  resetAbsenForm();
  absenTgl = '';
  renderDb();
  renderDbMob();
}

function selesaiAbsensi(){
  var info = selesaiSummary();
  appConfirm('Selesai mengisi absensi?\n\n'+info+'\n\nSesi akan disimpan & ditutup.', function(){
    _selesaiSave();
    showAbsenSetup();
  }, {title:'Selesai', icon:'check', color:'green', okText:'Ya, Simpan'});
}

function selesaiAbsensiMob(){
  var info = selesaiSummary();
  appConfirm('Selesai mengisi absensi?\n\n'+info+'\n\nSesi akan disimpan & ditutup.', function(){
    _selesaiSave();
    goMob('absen');
  }, {title:'Selesai', icon:'check', color:'green', okText:'Ya, Simpan'});
}

function syncRekapFilter(){
  if(!absenTgl) return;
  var parts = tglDate(absenTgl).split('-');
  var th = parts[0], bl = String(parseInt(parts[1]));
  ['rBulan','rBulanM'].forEach(function(id){ var el=document.getElementById(id); if(el) el.value=bl; });
  ['rTahun','rTahunM'].forEach(function(id){ var el=document.getElementById(id); if(el) el.value=th; });
}

// ── Setup helpers ──
function tglDate(key){ return key.split('_')[0]; }
function sesiLabel(key){
  var d    = new Date(tglDate(key)+'T00:00:00');
  var base = HARI[d.getDay()]+', '+d.getDate()+' '+BULAN[d.getMonth()+1]+' '+d.getFullYear();
  var parts= key.split('_');
  return parts.length>1 ? base+' (Sesi '+parts[1]+')' : base;
}

function mulaiAbsensi(isMob){
  var suf = isMob ? 'M' : '';
  var tgl = document.getElementById('sTgl'+suf).value;
  if(!tgl){ appAlert('Pilih tanggal dahulu.'); return; }
  var parts  = tgl.split('-');
  var tahun  = parseInt(parts[0]);
  var bulan  = parseInt(parts[1]);
  var ket    = document.getElementById('sKet'+suf).value.trim();
  if(sesiData[tgl]){
    var existingKet = sesiKet[tgl]||'(tanpa nama)';
    appConfirm('Tanggal ini sudah memiliki sesi:\n"'+existingKet+'"\n\nBuat sesi baru untuk hari yang sama?', function(){
      var n=2;
      while(sesiData[tgl+'_'+n]) n++;
      _mulaiAbsensiFinish(tgl+'_'+n, bulan, tahun, ket);
    }, {title:'Sesi Sudah Ada', color:'amber'});
    return;
  }
  _mulaiAbsensiFinish(tgl, bulan, tahun, ket);
}

function _mulaiAbsensiFinish(sessionKey, bulan, tahun, ket){
  absenTgl=sessionKey; absenBulan=bulan; absenTahun=tahun; absenKet=ket;
  _absenDirty=false;
  if(!sesiData[sessionKey]) sesiData[sessionKey]={};
  if(!sesiRoster[sessionKey]){
    sesiRoster[sessionKey] = activeMembers().map(function(m){ return {nama:m.nama, gender:m.gender, kelas:(m.kelas||'')}; });
  }
  sesiKet[sessionKey] = ket;
  fbSaveSesi(sessionKey);
  absenGender='S'; openPanel=null;
  if(mob()){
    goMob('absen-page');
    renderAbsenMob();
  } else {
    showAbsenBody();
    renderAbsenPc();
  }
}

// ── Build ──
function selesaiInfo(){
  var sesi = sesiData[absenTgl]||{};
  var h=0, tot=activeMembers().length, blm=0;
  activeMembers().forEach(function(m){
    var v = (sesi[m.nama]||{}).status||'';
    if(v==='H') h++; else if(!v) blm++;
  });
  if(blm===0) return '<span style="color:var(--green);font-weight:500">✓ Semua terisi</span>';
  return '<span style="color:var(--text2)">'+blm+' belum diisi dari '+tot+' anggota</span>';
}

function counterHtml(){
  var sesi = sesiData[absenTgl]||{};
  var h=0,iz=0,al=0,blm=0;
  activeMembers().forEach(function(m){
    var v = (sesi[m.nama]||{}).status||'';
    if(v==='H') h++; else if(v==='I') iz++; else if(v==='A') al++; else blm++;
  });
  return '<span class="ci"><span class="dot dh"></span><span style="color:var(--green)">'+h+' Hadir</span></span>'+
    '<span class="ci"><span class="dot di"></span><span style="color:var(--amber)">'+iz+' Izin</span></span>'+
    '<span class="ci"><span class="dot da"></span><span style="color:var(--red)">'+al+' Alfa</span></span>'+
    '<span class="ci"><span class="dot dx"></span><span style="color:var(--text3)">'+blm+' Belum</span></span>';
}

function pillHtml(nama, ctx, readonly){
  var v = ((sesiData[absenTgl]||{})[nama]||{}).status||'';
  if(readonly){
    if(v==='H') return '<span class="sp sp-h" style="pointer-events:none">✓ Hadir</span>';
    if(v==='I') return '<span class="sp sp-i" style="pointer-events:none">? Izin</span>';
    if(v==='A') return '<span class="sp sp-a" style="pointer-events:none">✕ Alfa</span>';
    return '<span class="sp sp-x" style="pointer-events:none">Belum diisi</span>';
  }
  if(v==='H') return '<button class="sp sp-h" onclick="openStatusMenu(this,\''+escJsAttr(nama)+'\',\''+ctx+'\')">✓ Hadir</button>';
  if(v==='I') return '<button class="sp sp-i" onclick="openStatusMenu(this,\''+escJsAttr(nama)+'\',\''+ctx+'\')">? Izin</button>';
  if(v==='A') return '<button class="sp sp-a" onclick="openStatusMenu(this,\''+escJsAttr(nama)+'\',\''+ctx+'\')">✕ Alfa</button>';
  return '<button class="sp sp-x" onclick="openStatusMenu(this,\''+escJsAttr(nama)+'\',\''+ctx+'\')">Isi status</button>';
}

function buildItem(m, ctx){
  var key  = eid(m.nama);
  var rec  = (sesiData[absenTgl]||{})[m.nama]||{};
  var note = rec.catatan||'';
  var avc  = m.gender==='P'?'av-p':'av-l';
  var checked = _bulkSelected[m.nama] ? ' checked' : '';
  var cab = (typeof isCaberawit === 'function') ? isCaberawit() : false;
  var kelasBadge = (cab && m.kelas) ? ' <span class="kelas-pill">'+escHtml(m.kelas)+'</span>' : '';
  var html = '<div class="ab-item" id="abitem-'+ctx+'-'+key+'" data-nama="'+escJsAttr(m.nama)+'"'+(m.arsip?'': '')+'>';
  if(_bulkMode){
    html += '<div class="ab-row" style="cursor:pointer" onclick="toggleBulkItem(\''+escJsAttr(m.nama)+'\')">';
    html += '<input type="checkbox" class="bulk-chk"'+checked+' onclick="event.stopPropagation();toggleBulkItem(\''+escJsAttr(m.nama)+'\')" style="width:18px;height:18px;flex-shrink:0;margin-right:2px">';
  } else {
    html += '<div class="ab-row">';
  }
  html += '<div class="avatar '+avc+'">'+escHtml(initials(m.nama))+'</div>';
  html += '<div class="ab-info"><div class="ab-name">'+escHtml(m.nama)+kelasBadge+'</div>';
  var subTxt = (rec.status==='I' && note) ? '<em style="color:var(--amber)">✎ '+escHtml(note)+'</em>' : '&nbsp;';
  html += '<div class="ab-sub">'+subTxt+'</div></div>';
  if(_bulkMode){
    html += '<div class="ab-right">'+pillHtml(m.nama,ctx,true)+'</div>';
  } else {
    html += '<div class="ab-right">'+pillHtml(m.nama,ctx);
    html += '<button class="more-btn" onclick="openStatusMenu(this,\''+escJsAttr(m.nama)+'\',\''+ctx+'\')">···</button>';
    html += '</div>';
  }
  html += '</div>';
  html += '</div>';
  return html;
}

// ── Floating Status Menu ──
function openStatusMenu(btn, nama, ctx){
  _smNama = nama; _smCtx = ctx;
  if(_smTimer){ clearTimeout(_smTimer); _smTimer = null; }
  var rec = (sesiData[absenTgl]||{})[nama]||{};
  var s   = rec.status||'';
  var items = '';
  if(s!=='H') items += smBtn('✓','ig','Hadir','smSet(\'H\')');
  if(s!=='I') items += smBtn('?','iamb','Izin','smIzin()');
  if(s!=='A') items += smBtn('✕','ir','Alfa (Tanpa Ket.)','smSet(\'A\')');
  if(s){
    items += '<div class="sm-sep"></div>';
    items += smBtn('↺','igr','Hapus Status','smClear()');
  }
  document.getElementById('status-menu-items').innerHTML = items;
  var menu = document.getElementById('status-menu');
  menu.style.display = 'block';
  menu.classList.remove('show','pop-closing');
  var r   = btn.getBoundingClientRect();
  var mw  = 200;
  var left= r.right - mw;
  if(left < 6) left = 6;
  var top = r.bottom + 4;
  if(top + menu.offsetHeight > window.innerHeight) top = r.top - 4 - menu.offsetHeight;
  menu.style.left = left+'px';
  menu.style.top  = top+'px';
  void menu.offsetWidth;
  menu.classList.add('show');
  var so = document.getElementById('status-menu-overlay');
  if(so){ so.classList.remove('pop-closing'); so.classList.add('show'); }
}

function smBtn(icon, ic, label, action){
  return '<button class="sm-btn" onclick="'+action+'">'+
    '<span class="sm-icon '+ic+'">'+icon+'</span>'+label+'</button>';
}

function closeStatusMenu(){
  var menu = document.getElementById('status-menu');
  var so = document.getElementById('status-menu-overlay');
  if(menu){ menu.classList.add('pop-closing'); }
  if(so){ so.classList.add('pop-closing'); }
  _smTimer = setTimeout(function(){
    if(menu){ menu.classList.remove('show','pop-closing'); menu.style.display=''; }
    if(so){ so.classList.remove('show','pop-closing'); }
    _smTimer = null;
  }, 150);
  _smNama=''; _smCtx='';
}

function smSet(s){ var nama=_smNama, ctx=_smCtx; closeStatusMenu(); setStatus(nama,s,ctx); }
function smIzin(){ var nama=_smNama, ctx=_smCtx; closeStatusMenu(); openIzinPopup(nama,ctx); }
function smClear(){ var nama=_smNama, ctx=_smCtx; closeStatusMenu(); clearStatus(nama,ctx); }

// ── Izin Popup ──
function openIzinPopup(nama, ctx){
  _izinNama = nama; _izinCtx = ctx;
  openPanel = null; redraw(ctx);
  var rec = (sesiData[absenTgl]||{})[nama]||{};
  document.getElementById('izin-popup-name').textContent = nama;
  var noteEl = document.getElementById('izin-popup-note');
  noteEl.value = rec.catatan||'';
  openPop('izin-overlay','izin-popup');
  setTimeout(function(){ noteEl.focus(); }, 80);
}

function closeIzinPopup(){
  closePop('izin-overlay','izin-popup');
  _izinNama = ''; _izinCtx = '';
}

function fillIzinPopup(val){
  var el = document.getElementById('izin-popup-note');
  if(el){ el.value = val; el.focus(); }
}

function saveIzinPopup(){
  if(!_izinNama) return;
  var val = document.getElementById('izin-popup-note').value.trim();
  if(!sesiData[absenTgl]) sesiData[absenTgl]={};
  if(!sesiData[absenTgl][_izinNama]) sesiData[absenTgl][_izinNama]={};
  sesiData[absenTgl][_izinNama].status  = 'I';
  sesiData[absenTgl][_izinNama].catatan = val;
  stampEntryGender(absenTgl, _izinNama);
  _absenDirty = true;
  logActivity('absen', 'Izin '+_izinNama+(val?' ('+val+')':'')+(absenKet?' ['+absenKet+']':''));
  fbSaveSesi(absenTgl);
  var ctx = _izinCtx;
  closeIzinPopup();
  redraw(ctx);
}

// ── Status Mutation ──
function setStatus(nama, s, ctx){
  if(!sesiData[absenTgl]) sesiData[absenTgl]={};
  if(!sesiData[absenTgl][nama]) sesiData[absenTgl][nama]={};
  sesiData[absenTgl][nama].status = s;
  stampEntryGender(absenTgl, nama);
  if(s!=='I') delete sesiData[absenTgl][nama].catatan;
  _absenDirty = true;
  var sl = s==='H'?'Hadir':s==='I'?'Izin':'Alfa';
  logActivity('absen', nama+' → '+sl+(absenKet?' ('+absenKet+')':''));
  fbSaveSesi(absenTgl);
  openPanel=null; redraw(ctx);
  setTimeout(function(){
    var key     = eid(nama);
    var wrapper = document.getElementById('abitem-'+ctx+'-'+key);
    if(wrapper){
      var btn = wrapper.querySelector('.sp');
      if(btn){ btn.classList.remove('sp-pop'); void btn.offsetWidth; btn.classList.add('sp-pop'); }
    }
  }, 30);
}

function clearStatus(nama, ctx){
  if(sesiData[absenTgl]&&sesiData[absenTgl][nama]){
    delete sesiData[absenTgl][nama].status;
    delete sesiData[absenTgl][nama].catatan;
  }
  _absenDirty = true;
  logActivity('absen', 'Hapus status '+nama+(absenKet?' ('+absenKet+')':''));
  fbSaveSesi(absenTgl);
  openPanel=null; redraw(ctx);
}

function redraw(ctx){
  if(ctx==='mob'||ctx==='mob-p'||ctx==='mob-l') renderAbsenMob();
  else renderAbsenPc();
}

// ── Bulk Select (isi status untuk beberapa anggota sekaligus) ──
function toggleBulkMode(){
  _bulkMode = !_bulkMode;
  _bulkSelected = {};
  openPanel = null;
  if(mob()) renderAbsenMob(); else renderAbsenPc();
}

function toggleBulkItem(nama){
  if(_bulkSelected[nama]) delete _bulkSelected[nama];
  else _bulkSelected[nama] = true;
  // Jika semua sudah dibatalkan pilih, otomatis keluar dari mode pilih banyak.
  if(_bulkMode && Object.keys(_bulkSelected).length === 0){
    _bulkMode = false;
    openPanel = null;
    if(mob()) renderAbsenMob(); else renderAbsenPc();
    return;
  }
  var checked = !!_bulkSelected[nama];
  var key = eid(nama);
  ['pc-p','pc-l','mob'].forEach(function(ctx){
    var wrapper = document.getElementById('abitem-'+ctx+'-'+key);
    if(!wrapper) return;
    var chk = wrapper.querySelector('.bulk-chk');
    if(chk) chk.checked = checked;
  });
  updateBulkBar();
}

function updateBulkBar(){
  var n = Object.keys(_bulkSelected).length;
  ['pc','mob'].forEach(function(p){
    var bar = document.getElementById(p+'-bulk-bar');
    var cnt = document.getElementById(p+'-bulk-count');
    if(bar) bar.style.display = (_bulkMode && n>0) ? 'flex' : 'none';
    if(cnt) cnt.textContent = n+' dipilih';
  });
}

function _doApplyBulk(status, names, ket){
  var sl = status==='H'?'Hadir':status==='I'?'Izin':'Alfa';
  if(!sesiData[absenTgl]) sesiData[absenTgl]={};
  names.forEach(function(nama){
    if(!sesiData[absenTgl][nama]) sesiData[absenTgl][nama]={};
    sesiData[absenTgl][nama].status = status;
    stampEntryGender(absenTgl, nama);
    if(status==='I') sesiData[absenTgl][nama].catatan = ket;
    else delete sesiData[absenTgl][nama].catatan;
  });
  _absenDirty = true;
  logActivity('absen', 'Isi massal '+sl+' untuk '+names.length+' orang'+(absenKet?' ('+absenKet+')':''));
  fbSaveSesi(absenTgl);
  _bulkMode = false;
  _bulkSelected = {};
  if(mob()) renderAbsenMob(); else renderAbsenPc();
}

function applyBulkStatus(status){
  var names = Object.keys(_bulkSelected);
  if(!names.length) return;
  var sl = status==='H'?'Hadir':status==='I'?'Izin':'Alfa';
  appConfirm('Set status "'+sl+'" untuk '+names.length+' orang terpilih?', function(){
    if(status==='I'){
      appPrompt('Keterangan izin untuk '+names.length+' anggota terpilih (berlaku sama untuk semuanya):', '', function(ket){
        _doApplyBulk(status, names, (ket||'').trim());
      }, {title:'Keterangan Izin', icon:'note', color:'amber', okText:'Simpan'});
    } else {
      _doApplyBulk(status, names, '');
    }
  }, {title:'Isi Massal', color:'green'});
}

// ── PC render ──
function absenKelasSectionHtml(kelas, items, ctx){
  var h = '<div class="kelas-sep"><span class="kelas-sep-name">'+escHtml(kelasLabel(kelas))+'</span><span class="kelas-sep-count">'+items.length+' anak</span></div>';
  items.forEach(function(m){ h += buildItem(m, ctx); });
  return h;
}

function renderAbsenPc(){
  var d = new Date(tglDate(absenTgl)+'T00:00:00');
  var s = HARI[d.getDay()]+', '+d.getDate()+' '+BULAN[absenBulan]+' '+absenTahun;
  if(absenKet) s += ' · '+absenKet;
  var dateEl = document.getElementById('pc-absen-date'); if(dateEl) dateEl.textContent=s;
  var cEl    = document.getElementById('pc-absen-ctr');  if(cEl)    cEl.innerHTML=counterHtml();
  var siEl   = document.getElementById('pc-selesai-info'); if(siEl) siEl.innerHTML=selesaiInfo();

  var aktif = activeMembers();
  var cab = (typeof isCaberawit === 'function') ? isCaberawit() : false;
  var cp = document.getElementById('pc-col-p'); var cl = document.getElementById('pc-col-l');
  var wrap = null;
  try { wrap = document.querySelector('#pc-absen-body .pc-2col'); } catch(e){}
  // ── CABERAWIT (PC): satu kolom, URUT per kelas ──
  if(cab){
    if(wrap) wrap.style.gridTemplateColumns = '1fr';
    var groups = groupByKelas(aktif);
    var html = '';
    groups.forEach(function(g){ html += absenKelasSectionHtml(g.kelas, g.items, 'pc-p'); });
    if(cp) cp.innerHTML = html || '<div class="empty">Belum ada anggota Caberawit. Tambahkan dulu di menu Anggota.</div>';
    if(cl) cl.innerHTML = '';
    if(cp) attachHoldBulk(cp);
    updateBulkBar();
    return;
  }
  if(wrap) wrap.style.gridTemplateColumns = '';
  var P = aktif.filter(function(m){ return m.gender==='P'; });
  var L = aktif.filter(function(m){ return m.gender==='L'; });
  var hp=''; P.forEach(function(m){ hp+=buildItem(m,'pc-p'); });
  var hl=''; L.forEach(function(m){ hl+=buildItem(m,'pc-l'); });
  var cp = document.getElementById('pc-col-p'); if(cp) cp.innerHTML=hp||'<div class="empty">-</div>';
  var cl = document.getElementById('pc-col-l'); if(cl) cl.innerHTML=hl||'<div class="empty">-</div>';
  if(cp) attachHoldBulk(cp);
  if(cl) attachHoldBulk(cl);
  updateBulkBar();
}

// Hold (tekan lama) pada salah satu anggota masuk ke mode pilih banyak.
var _holdFiredAt = 0, _holdFiredNama = '';
function attachHoldBulk(container){
  if(!container) return;
  if(!container._holdDelg){
    container._holdDelg = true;
    container.addEventListener('click', function(e){
      if(!_holdFiredAt || Date.now()-_holdFiredAt>450) return;
      var it = e.target && e.target.closest ? e.target.closest('.ab-item') : null;
      if(it && it.getAttribute('data-nama')===_holdFiredNama){
        e.stopImmediatePropagation(); e.preventDefault();
        _holdFiredAt = 0; _holdFiredNama = '';
      }
    }, true);
  }
  container.querySelectorAll('.ab-item').forEach(function(item){
    if(item._holdAttached) return;
    item._holdAttached = true;
    var nama = item.getAttribute('data-nama');
    var timer=null, startXY=null, moved=false;

    function onDown(e){
      if(e.pointerType==='mouse' && e.button!==0) return;
      startXY=[e.clientX,e.clientY]; moved=false;
      timer=setTimeout(function(){
        if(moved||_navLocked||nama==null) return;
        _holdFiredAt = Date.now(); _holdFiredNama = nama;
        if(!_bulkMode){
          _bulkMode = true;
          _bulkSelected[nama] = true;
        } else {
          toggleBulkItem(nama);
          return;
        }
        if(mob()) renderAbsenMob(); else renderAbsenPc();
      }, 550);
    }
    function onMove(e){
      if(!startXY) return;
      if(Math.abs(e.clientX-startXY[0])>8||Math.abs(e.clientY-startXY[1])>8) moved=true;
      if(moved&&timer){ clearTimeout(timer); timer=null; }
    }
    function onUp(){ if(timer){ clearTimeout(timer); timer=null; } startXY=null; }
    item.addEventListener('pointerdown', onDown);
    item.addEventListener('pointermove', onMove);
    item.addEventListener('pointerup', onUp);
    item.addEventListener('pointercancel', onUp);
  });
}

// ── Mobile render ──
function setAbsenGender(g){
  absenGender=g; openPanel=null;
  document.querySelectorAll('.mseg').forEach(function(b){ b.classList.remove('on'); });
  var el = document.getElementById('mseg-'+g); if(el) el.classList.add('on');
  renderAbsenMob();
}

function renderAbsenMob(){
  var listEl = document.getElementById('mob-absen-list');
  if(listEl && !listEl.dataset.loaded){ listEl.innerHTML=skeletonHtml(6); }
  if(listEl) listEl.dataset.loaded='1';
  var cEl   = document.getElementById('mob-absen-ctr');   if(cEl)   cEl.innerHTML=counterHtml();
  var d     = new Date(tglDate(absenTgl)+'T00:00:00');
  var s     = HARI[d.getDay()]+', '+d.getDate()+' '+BULAN[absenBulan]+' '+absenTahun;
  if(absenKet) s += ' · '+absenKet;
  var dEl   = document.getElementById('mob-absen-date');  if(dEl)   dEl.textContent=s;
  var titleEl=document.getElementById('mob-absen-title'); if(titleEl) titleEl.textContent=absenKet||'Absensi';
  var siEl  = document.getElementById('mob-selesai-info'); if(siEl)  siEl.innerHTML=selesaiInfo();
  var cab = (typeof isCaberawit === 'function') ? isCaberawit() : false;
  var list  = filteredM(absenGender);
  var html  = '';
  // ── CABERAWIT (mobile): URUT per kelas, hormati filter gender ──
  if(cab){
    var groups = groupByKelas(list);
    if(!groups.length) html = '';
    groups.forEach(function(g){
      html += '<div class="kelas-sep"><span class="kelas-sep-name">'+escHtml(kelasLabel(g.kelas))+'</span><span class="kelas-sep-count">'+g.items.length+' anak</span></div>';
      g.items.forEach(function(m){ html += buildItem(m,'mob'); });
    });
  }
  else if(absenGender==='S'){
    var P = list.filter(function(m){ return m.gender==='P'; });
    var L = list.filter(function(m){ return m.gender==='L'; });
    if(P.length){ html+='<div class="sec-title">'+glabel('P')+'</div>'; P.forEach(function(m){ html+=buildItem(m,'mob'); }); }
    if(L.length){ html+='<div class="sec-title">'+glabel('L')+'</div>'; L.forEach(function(m){ html+=buildItem(m,'mob'); }); }
  } else {
    if(list.length) html+='<div class="sec-title">'+glabel(absenGender)+'</div>';
    list.forEach(function(m){ html+=buildItem(m,'mob'); });
  }
  var el = document.getElementById('mob-absen-list');
  if(el) el.innerHTML=html||'<div class="empty">Tidak ada.</div>';
  if(el) attachHoldBulk(el);
  updateBulkBar();
}
