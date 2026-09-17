// ══════════════════════════════════════════════════
// ANGGOTA MODULE
// ══════════════════════════════════════════════════

// ── List Render ──
function anggotaHtml(listId, searchId){
  var search = (document.getElementById(searchId)||{}).value||'';
  var filterId = listId==='anggotaList' ? 'srchFilterA' : 'srchFilterAM';
  var filter = (document.getElementById(filterId)||{}).value||'';
  var qLow = search.toLowerCase();
  var cab = (typeof isCaberawit === 'function') ? isCaberawit() : false;
  var list   = members.filter(function(m){
    var hay = (m.nama+' '+(m.kelas||'')).toLowerCase();
    var okSearch = !qLow || hay.indexOf(qLow) >= 0;
    if(!okSearch) return false;
    if(filter==='Aktif') return !m.arsip;
    if(filter==='Arsip') return !!m.arsip;
    return true;
  });
  if(!members.length) return '<div class="empty">Tidak ada anggota.</div>';
  if(!list.length)    return '<div class="empty">Tidak ada anggota yang cocok.</div>';
  // ── CABERAWIT: grup URUT per kelas (PAUD → Tilawati 1..6 → Al-Quran) ──
  if(cab){
    var groups = groupByKelas(list);
    var cards = groups.map(function(g){
      var body = g.items.map(function(m){
        var avc = m.gender==='P'?'av-p':'av-l';
        return '<div class="mem-item" onclick="openMemberDetail(\''+escJsAttr(m.nama)+'\')" style="cursor:pointer">'+
          '<div class="avatar '+avc+'" style="width:34px;height:34px;font-size:11px">'+escHtml(initials(m.nama))+'</div>'+
          '<div class="mem-info"><div class="mem-name">'+escHtml(m.nama)+(m.arsip?' <span class="badge badge-arsip">Arsip</span>':'')+'</div>'+
          '<div class="mem-gender">'+glabel(m.gender)+'</div></div>'+
          '<span style="color:var(--text3);font-size:16px">›</span>'+
        '</div>';
      }).join('');
      if(!body) body = '<div class="empty">Tidak ada anggota.</div>';
      return '<div class="nd-card ang-card">'+
        '<div class="ang-card-hd"><span>'+escHtml(kelasLabel(g.kelas))+'</span><span class="ang-count">'+g.items.length+'</span></div>'+
        '<div class="ang-card-list">'+body+'</div>'+
      '</div>';
    }).join('');
    return '<div class="ang-cards ang-cards-kelas">'+cards+'</div>';
  }
  var P = list.filter(function(m){ return m.gender==='P'; });
  var L = list.filter(function(m){ return m.gender==='L'; });
  function card(label, arr, avc){
    var body = arr.map(function(m){
      return '<div class="mem-item" onclick="openMemberDetail(\''+escJsAttr(m.nama)+'\')" style="cursor:pointer">'+
        '<div class="avatar '+avc+'" style="width:34px;height:34px;font-size:11px">'+escHtml(initials(m.nama))+'</div>'+
        '<div class="mem-info"><div class="mem-name">'+escHtml(m.nama)+(m.arsip?' <span class="badge badge-arsip">Arsip</span>':'')+'</div>'+
        '<div class="mem-gender">'+glabel(m.gender)+'</div></div>'+
        '<span style="color:var(--text3);font-size:16px">›</span>'+
      '</div>';
    }).join('');
    if(!body) body = '<div class="empty">Tidak ada anggota.</div>';
    return '<div class="nd-card ang-card">'+
      '<div class="ang-card-hd"><span>'+label+'</span><span class="ang-count">'+arr.length+'</span></div>'+
      '<div class="ang-card-list">'+body+'</div>'+
    '</div>';
  }
  return '<div class="ang-cards">'+
    card('Perempuan', P, 'av-p')+
    card('Laki-laki', L, 'av-l')+
  '</div>';
}

function renderAnggota(){
  var el = document.getElementById('anggotaList');
  if(el){ el.innerHTML=skeletonHtml(4); setTimeout(function(){ el.innerHTML=anggotaHtml('anggotaList','srchA'); },120); }
}

function renderAnggotaMob(){
  var el = document.getElementById('anggotaListM');
  if(el){ el.innerHTML=skeletonHtml(4); setTimeout(function(){ el.innerHTML=anggotaHtml('anggotaListM','srchAM'); },120); }
}

function openAddAnggotaPopup(){
  document.getElementById('iNama').value   = '';
  document.getElementById('iGender').value = 'P';
  var cab = (typeof isCaberawit === 'function') ? isCaberawit() : false;
  var row = document.getElementById('iKelasRow');
  var sel = document.getElementById('iKelas');
  if(row) row.style.display = cab ? '' : 'none';
  if(sel && cab && !sel.value) sel.value = 'PAUD';
  if(typeof refreshGroupUI === 'function'){ try { refreshGroupUI(); } catch(e){} }
  openPop('add-anggota-overlay','add-anggota-popup');
  setTimeout(function(){ var el=document.getElementById('iNama'); if(el) el.focus(); }, 80);
}

function closeAddAnggotaPopup(){
  closePop('add-anggota-overlay','add-anggota-popup');
}

function submitAddAnggota(){
  var btn = document.querySelector('#add-anggota-popup .btn-p');
  if(btn && btn.disabled) return;
  var nm = document.getElementById('iNama').value.trim().toUpperCase();
  var gd = document.getElementById('iGender').value;
  var cab = (typeof isCaberawit === 'function') ? isCaberawit() : false;
  var kl = '';
  if(cab){
    var sel = document.getElementById('iKelas');
    kl = sel ? normalizeKelas(sel.value) : '';
    if(!kl){ appAlert('Pilih kelas terlebih dahulu (PAUD / Tilawati 1-6 / Al-Quran).'); return; }
  }
  if(!nm) return;
  if(members.find(function(m){ return m.nama===nm; })){ appAlert('Nama sudah terdaftar.'); return; }
  setBtnBusy(btn, true, 'Menyimpan...');
  try {
    if(cab) members.push({nama:nm, gender:gd, kelas:kl});
    else members.push({nama:nm, gender:gd});
    members.sort(function(a,b){
      if(cab) return sortByKelasNama(a,b);
      if(a.gender===b.gender) return a.nama.localeCompare(b.nama);
      return a.gender==='P' ? -1 : 1;
    });
    logActivity('anggota', 'Tambah '+nm+' ('+(gd==='P'?'Perempuan':'Laki-laki')+(cab&&kl?' • '+kl:'')+')');
    fbSaveAnggota();
    closeAddAnggotaPopup();
    renderAnggota(); renderAnggotaMob();
  } finally {
    setBtnBusy(btn, false);
  }
}

// ── Arsip Anggota ──
// Anggota yang diarsipkan tidak muncul di isi absensi dan tidak dihitung di
// rekap/dashboard, tapi datanya tetap tersimpan dan bisa diaktifkan kembali.
function arsipToggleAnggota(){
  if(!_mdetNama) return;
  var idx = members.findIndex(function(m){ return m.nama===_mdetNama; });
  if(idx<0) return;
  members[idx].arsip = !members[idx].arsip;
  fbSaveAnggota();
  logActivity('anggota', (members[idx].arsip?'Arsipkan ':'Aktifkan ')+_mdetNama);
  var btn = document.getElementById('mdet-arsip-btn');
    if(btn) btn.textContent = members[idx].arsip ? 'Aktifkan' : 'Arsipkan';
  renderAnggota(); renderAnggotaMob();
  try { renderDashboard(); } catch(e){}
  showToast(members[idx].arsip ? 'Anggota diarsipkan' : 'Anggota diaktifkan kembali');
}

// ══════════════════════════════════════════════════
// MEMBER DETAIL MODAL
// ══════════════════════════════════════════════════

var _mdetNama       = '';
var _mdetRows       = [];
var _mdetSortAsc    = true;
var _mdetActiveStatus = {H:true,I:true,A:true,X:true};

function hapusAnggotaFromDetail(){
  if(!_mdetNama) return;
  var idx = members.findIndex(function(m){ return m.nama === _mdetNama; });
  if(idx < 0) return;
  var namaHapus = _mdetNama;
  if(memberHasHistory(namaHapus)){
    appAlert('"'+namaHapus+'" sudah punya riwayat absensi sehingga tidak bisa dihapus permanen.\n\nPakai tombol "Arsipkan" supaya datanya tetap tersimpan tapi disembunyikan dari Absen.', {title:'Tidak Bisa Dihapus', icon:'info', color:'amber'});
    return;
  }
  appConfirm('Hapus '+namaHapus+' dari daftar anggota?\n\nAnggota ini belum punya riwayat absensi sama sekali.', function(){
    var idx2 = members.findIndex(function(m){ return m.nama === namaHapus; });
    if(idx2 < 0) return;
    closeMemberDetail();
    function doDelete(){
      logActivity('anggota', 'Hapus '+namaHapus);
      members.splice(idx2, 1);
      fbSaveAnggota();
      renderAnggota(); renderAnggotaMob();
    }
    var rows = [];
    ['anggotaList','anggotaListM'].forEach(function(lid){
      var listEl = document.getElementById(lid);
      if(!listEl) return;
      listEl.querySelectorAll('.mem-item').forEach(function(it){
        var nm = it.querySelector('.mem-name');
        if(nm && (nm.textContent||'').trim() === namaHapus) rows.push(it);
      });
    });
    if(rows.length){
      var n = rows.length;
      rows.forEach(function(r){ animateRemove(r, function(){ if(--n===0) doDelete(); }); });
    } else doDelete();
  }, {title:'Hapus Anggota', icon:'trash', color:'red'});
}

// Ubah/koreksi nama anggota, termasuk memindahkan seluruh riwayat
// absensi (sesiData) dari nama lama ke nama baru agar tidak terputus.
function editNamaAnggota(){
  if(!_mdetNama) return;
  var idx = members.findIndex(function(m){ return m.nama === _mdetNama; });
  if(idx < 0) return;

  var namaLama = _mdetNama;
  appPrompt('Ubah nama anggota:', namaLama, function(namaBaruRaw){
    var namaBaru = (namaBaruRaw||'').trim().toUpperCase();
    if(!namaBaru){ appAlert('Nama tidak boleh kosong.'); return; }
    if(namaBaru === namaLama) return; // tidak ada perubahan
    if(members.find(function(m){ return m.nama === namaBaru; })){
      appAlert('Nama tersebut sudah digunakan.');
      return;
    }
    var idx2 = members.findIndex(function(m){ return m.nama === namaLama; });
    if(idx2 < 0) return;

    // 1) Update daftar anggota
    members[idx2].nama = namaBaru;
    fbSaveAnggota();

    // 2) Migrasi seluruh riwayat absensi dari nama lama -> nama baru
    var touched = {};
    Object.keys(sesiData).forEach(function(tgl){
      var recSesi = sesiData[tgl];
      if(recSesi && Object.prototype.hasOwnProperty.call(recSesi, namaLama)){
        recSesi[namaBaru] = recSesi[namaLama];
        delete recSesi[namaLama];
        touched[tgl] = true;
      }
    });
    // 2b) Migrasi roster snapshot sesi (termasuk sesi yang namanya hanya
    // ada di roster tanpa entri) lalu simpan semua sesi tersentuh
    Object.keys(sesiRoster).forEach(function(tgl){
      (sesiRoster[tgl]||[]).forEach(function(r){
        if(r.nama===namaLama){ r.nama=namaBaru; touched[tgl]=true; }
      });
    });
    Object.keys(touched).forEach(function(tgl){ fbSaveSesi(tgl); });

    logActivity('anggota', 'Ubah nama '+namaLama+' → '+namaBaru);

    // 3) Refresh tampilan
    _mdetNama = namaBaru;
    document.getElementById('mdet-name').textContent = namaBaru;
    var avEl = document.getElementById('mdet-avatar');
    if(avEl) avEl.textContent = initials(namaBaru);
    _mdetRows = getMemberSessions(namaBaru);
    renderMdetTable();
    renderAnggota(); renderAnggotaMob();
  }, {title:'Ubah Nama Anggota', icon:'edit', color:'gold'});
}

// Pindahkan anggota Caberawit ke kelas lain (PAUD / Tilawati 1-6 / Al-Quran).
// Riwayat rekap lama TIDAK berubah (dibangun dari roster snapshot sesi);
// kelas baru berlaku untuk sesi yang dibuat setelah ini.
function editKelasAnggota(){
  if(!_mdetNama) return;
  if((typeof isCaberawit === 'function') && !isCaberawit()) return;
  var idx = members.findIndex(function(m){ return m.nama === _mdetNama; });
  if(idx < 0) return;
  var cur = '';
  try { cur = normalizeKelas(members[idx].kelas); } catch(e){ cur = members[idx].kelas||''; }
  appPrompt('Pindah kelas untuk '+_mdetNama+':\n\nPilihan: PAUD, Tilawati 1, Tilawati 2, Tilawati 3, Tilawati 4, Tilawati 5, Tilawati 6, Al-Quran', cur||'Tilawati 1', function(val){
    var nk = '';
    try { nk = normalizeKelas(val); } catch(e){ nk = ''; }
    if(!nk){ appAlert('Kelas tidak dikenal.\n\nPilih salah satu: PAUD, Tilawati 1-6, atau Al-Quran.'); return; }
    var i2 = members.findIndex(function(m){ return m.nama === _mdetNama; });
    if(i2 < 0) return;
    var lama = '';
    try { lama = normalizeKelas(members[i2].kelas); } catch(e){ lama = members[i2].kelas||''; }
    if(lama === nk) return;
    members[i2].kelas = nk;
    members.sort(function(a,b){ return sortByKelasNama(a,b); });
    fbSaveAnggota();
    logActivity('anggota', 'Pindah kelas '+_mdetNama+': '+(lama||'Tanpa Kelas')+' → '+nk);
    var gEl = document.getElementById('mdet-gender');
    if(gEl){
      var mm = members[i2];
      gEl.textContent = glabel(mm.gender) + ' • ' + nk;
    }
    renderAnggota(); renderAnggotaMob();
    showToast('Kelas diperbarui: '+nk);
  }, {title:'Pindah Kelas', icon:'edit', color:'gold'});
}

function getMemberSessions(nama){
  var allKeys = Object.keys(sesiData).sort();
  var rows = [];
  allKeys.forEach(function(t){
    var d       = new Date(tglDate(t)+'T00:00:00');
    var tglLabel= HARI[d.getDay()]+', '+d.getDate()+' '+BULAN[d.getMonth()+1]+' '+d.getFullYear();
    var rec     = (sesiData[t]||{})[nama]||{};
    rows.push({
      t:        t,
      dateKey:  tglDate(t),
      yearKey:  tglDate(t).slice(0,4),
      monthKey: tglDate(t).slice(5,7),
      tgl:      tglLabel,
      kegiatan: sesiKet[t]||'',
      status:   rec.status||'',
      catatan:  rec.catatan||''
    });
  });
  return rows;
}

function openMemberDetail(nama){
  _mdetNama = nama;
  _mdetSortAsc = true;
  _mdetActiveStatus = {H:true,I:true,A:true,X:true};
  var m = members.find(function(x){ return x.nama===nama; });
  if(!m) return;
  _mdetRows = getMemberSessions(nama);

  document.getElementById('mdet-f-tahun').value = '';
  document.getElementById('mdet-f-bulan').value = '';
  var sb = document.getElementById('mdet-sort-btn');
  if(sb){ sb.textContent='↑ A→Z'; sb.classList.remove('desc'); }
  ['H','I','A','X'].forEach(function(s){
    var el=document.getElementById('mdsf-'+s);
    if(el) el.classList.add('on');
  });

  var avc = m.gender==='P'?'av-p':'av-l';
  var av  = document.getElementById('mdet-avatar');
  av.className = 'avatar '+avc;
  av.style.cssText = 'width:42px;height:42px;font-size:14px;flex-shrink:0';
  av.textContent = initials(nama);
  document.getElementById('mdet-name').textContent   = nama;
  var genderTxt = glabel(m.gender);
  try {
    if((typeof isCaberawit === 'function') && isCaberawit() && m.kelas){
      genderTxt += ' • ' + m.kelas;
    }
  } catch(e){}
  document.getElementById('mdet-gender').textContent = genderTxt;
  var ab = document.getElementById('mdet-arsip-btn');
  if(ab) ab.textContent = m.arsip ? 'Aktifkan' : 'Arsipkan';
  renderMdetTable();
  openPop('mdet-overlay','mdet-modal');
}

function closeMemberDetail(){
  closePop('mdet-overlay','mdet-modal');
  _mdetNama = '';
}

function applyMdetFilter(){ renderMdetTable(); }

function toggleMdetSort(){
  _mdetSortAsc = !_mdetSortAsc;
  var btn = document.getElementById('mdet-sort-btn');
  if(_mdetSortAsc){ btn.textContent='↑ A→Z'; btn.classList.remove('desc'); }
  else             { btn.textContent='↓ Z→A'; btn.classList.add('desc'); }
  renderMdetTable();
}

function toggleMdetStatus(s){
  _mdetActiveStatus[s] = !_mdetActiveStatus[s];
  var btn = document.getElementById('mdsf-'+s);
  if(btn) btn.classList.toggle('on', _mdetActiveStatus[s]);
  renderMdetTable();
}

function resetMdetStatus(){
  ['H','I','A','X'].forEach(function(s){
    _mdetActiveStatus[s] = true;
    var el = document.getElementById('mdsf-'+s);
    if(el) el.classList.add('on');
  });
  renderMdetTable();
}

function renderMdetTable(){
  var fYear  = (document.getElementById('mdet-f-tahun')||{}).value||'';
  var fMonth = (document.getElementById('mdet-f-bulan')||{}).value||'';

  var filtered = _mdetRows.filter(function(r){
    if(fYear  && r.yearKey !==fYear)  return false;
    if(fMonth && r.monthKey!==fMonth) return false;
    var sKey = r.status||'X';
    if(!_mdetActiveStatus[sKey]) return false;
    return true;
  });

  filtered.sort(function(a,b){
    var cmp = a.t<b.t?-1:a.t>b.t?1:0;
    return _mdetSortAsc ? cmp : -cmp;
  });

  var countEl = document.getElementById('mdet-count');
  if(countEl) countEl.textContent = filtered.length?'('+filtered.length+' sesi)':'';

  var fh=0,fiz=0,fal=0;
  filtered.forEach(function(r){
    if(r.status==='H')fh++; else if(r.status==='I')fiz++; else if(r.status==='A')fal++;
  });
  var ftot=filtered.length, fpct=ftot?Math.round(fh/ftot*100):0;
  var fpc=fpct>=80?'var(--green)':fpct>=60?'var(--amber)':'var(--red)';
  var statsEl = document.getElementById('mdet-stats');
  if(statsEl){
    statsEl.innerHTML =
      mdetStat(ftot,       'Sesi',     '')+
      mdetStat(fh,         'Hadir',    'var(--green)')+
      mdetStat(fiz,        'Izin',     'var(--amber)')+
      mdetStat(fal,        'Alfa',     'var(--red)')+
      mdetStat(fpct+'%',   'Kehadiran',fpc);
  }
  renderMdetDonut(fh, fiz, fal, ftot);

  var tbody='';
  if(!filtered.length){
    var msg = _mdetRows.length?'Tidak ada data untuk filter ini.':'Belum ada data sesi.';
    tbody = '<tr><td colspan="5" class="mdet-empty">'+msg+'</td></tr>';
  } else {
    filtered.forEach(function(r,i){
      var stBadge='';
      if(r.status==='H')      stBadge='<span class="badge bh">Hadir</span>';
      else if(r.status==='I') stBadge='<span class="badge bi">Izin</span>';
      else if(r.status==='A') stBadge='<span class="badge ba">Alfa</span>';
      else                    stBadge='<span style="color:var(--text3)">—</span>';
      var ket = r.catatan?'<em style="color:var(--amber)">'+escHtml(r.catatan)+'</em>':'<span style="color:var(--text3)">—</span>';
      tbody += '<tr>'+
        '<td style="color:var(--text3);font-size:11px">'+(i+1)+'</td>'+
        '<td style="font-size:11px;white-space:nowrap">'+r.tgl+'</td>'+
        '<td style="font-size:11px;color:var(--gold-dk)">'+r.kegiatan+'</td>'+
        '<td>'+stBadge+'</td>'+
        '<td>'+ket+'</td>'+
      '</tr>';
    });
  }
  document.getElementById('mdet-tbody').innerHTML = tbody;
}

function renderMdetDonut(h, iz, al, tot){
  var arcEl = document.getElementById('mdet-donut-arcs');
  var pctEl = document.getElementById('mdet-donut-pct');
  var legEl = document.getElementById('mdet-donut-legend');
  if(!arcEl) return;
  var R=28, CX=40, CY=40, SW=14;
  var circ = 2*Math.PI*R;
  function arc(val, offset, color){
    if(!val||!tot) return '';
    var dash=(val/tot)*circ;
    return '<circle cx="'+CX+'" cy="'+CY+'" r="'+R+'" fill="none" stroke="'+color+'"'+
      ' stroke-width="'+SW+'" stroke-dasharray="'+dash.toFixed(2)+' '+circ.toFixed(2)+'"'+
      ' stroke-dashoffset="'+(-offset).toFixed(2)+'" transform="rotate(-90 '+CX+' '+CY+')"'+
      ' style="transition:stroke-dasharray .4s ease"/>';
  }
  var belum=tot-h-iz-al;
  var offH=0, offI=offH+(h/tot||0)*circ, offA=offI+(iz/tot||0)*circ, offX=offA+(al/tot||0)*circ;
  arcEl.innerHTML = arc(h,offH,'var(--green)')+arc(iz,offI,'var(--amber)')+arc(al,offA,'var(--red)')+arc(belum,offX,'var(--border)');
  var pct = tot?Math.round(h/tot*100):0;
  pctEl.textContent = tot?pct+'%':'—';
  pctEl.setAttribute('fill', pct>=80?'var(--green)':pct>=60?'var(--amber)':'var(--red)');
  function leg(lbl,val,color){
    if(!tot) return '';
    return '<div style="display:flex;align-items:center;gap:6px">'+
      '<span style="width:10px;height:10px;border-radius:2px;background:'+color+';flex-shrink:0"></span>'+
      '<span style="color:var(--text2)">'+lbl+'</span>'+
      '<span style="font-weight:600;margin-left:auto;padding-left:10px">'+val+
        ' <span style="color:var(--text3);font-weight:400;font-size:11px">('+
        (tot?Math.round(val/tot*100):0)+'%)</span></span>'+
    '</div>';
  }
  legEl.innerHTML = tot
    ? leg('Hadir',h,'var(--green)')+leg('Izin',iz,'var(--amber)')+leg('Alfa',al,'var(--red)')+(belum?leg('Belum',belum,'var(--border)'):'')
    : '<span style="color:var(--text3)">Belum ada data</span>';
}

function mdetStat(val, lbl, color){
  return '<div class="mdet-stat">'+
    '<div class="mdet-stat-val"'+(color?' style="color:'+color+'"':'')+'>'+val+'</div>'+
    '<div class="mdet-stat-lbl">'+lbl+'</div>'+
  '</div>';
}

function getFilteredMdetRows(){
  var fYear  = (document.getElementById('mdet-f-tahun')||{}).value||'';
  var fMonth = (document.getElementById('mdet-f-bulan')||{}).value||'';
  var filtered = _mdetRows.filter(function(r){
    if(fYear  && r.yearKey !==fYear)  return false;
    if(fMonth && r.monthKey!==fMonth) return false;
    var sKey = r.status||'X';
    if(!_mdetActiveStatus[sKey]) return false;
    return true;
  });
  filtered.sort(function(a,b){
    var cmp=a.t<b.t?-1:a.t>b.t?1:0;
    return _mdetSortAsc?cmp:-cmp;
  });
  return filtered;
}

function getMemberExportRows(nama){
  var m      = members.find(function(x){ return x.nama===nama; });
  var gender = m?(m.gender==='P'?'Perempuan':'Laki-laki'):'';
  var rows   = getFilteredMdetRows();
  var h=0,iz=0,al=0;
  rows.forEach(function(r){ if(r.status==='H')h++; else if(r.status==='I')iz++; else if(r.status==='A')al++; });
  var tot=rows.length, pct=tot?Math.round(h/tot*100):0;
  var fYear  = (document.getElementById('mdet-f-tahun')||{}).value||'Semua Tahun';
  var fBulanEl=document.getElementById('mdet-f-bulan');
  var fBulan = fBulanEl&&fBulanEl.selectedIndex>0?fBulanEl.options[fBulanEl.selectedIndex].text:'Semua Bulan';
  var activeS=['H','I','A','X'].filter(function(s){return _mdetActiveStatus[s];}).map(function(s){return s==='H'?'Hadir':s==='I'?'Izin':s==='A'?'Alfa':'Belum';}).join(', ');
  var sortInfo=_mdetSortAsc?'A→Z (lama ke baru)':'Z→A (baru ke lama)';
  var header=[
    ['Rekap Kehadiran: '+nama],
    ['Gender: '+gender],
    ['Filter: '+fYear+' | '+fBulan+' | Status: '+activeS+' | Urutan: '+sortInfo],
    ['Tampil '+tot+' sesi — Hadir: '+h+', Izin: '+iz+', Alfa: '+al+(tot?', % Hadir: '+pct+'%':'')],
    []
  ];
  var colHeader=[['No','Tanggal','Kegiatan','Status','Keterangan']];
  var dataRows=rows.map(function(r,i){
    var st=r.status==='H'?'Hadir':r.status==='I'?'Izin':r.status==='A'?'Alfa':'Belum';
    return [i+1,r.tgl,r.kegiatan,st,r.catatan||''];
  });
  return header.concat(colHeader).concat(dataRows);
}

function exportMemberExcel(){
  if(!_mdetNama){appAlert('Pilih anggota terlebih dahulu.');return;}
  var rows=getMemberExportRows(_mdetNama);
  var wb=XLSX.utils.book_new();
  var ws=XLSX.utils.aoa_to_sheet(rows);
  try{
    ws['!cols']=[{wch:6},{wch:14},{wch:30},{wch:12},{wch:34}];
    ws['!freeze']='A6';
  }catch(e){}
  XLSX.utils.book_append_sheet(wb,ws,'Detail');
  XLSX.writeFile(wb,'Detail_'+_mdetNama.replace(/\s+/g,'_')+'.xlsx');
}

function exportMemberCSV(){
  if(!_mdetNama){appAlert('Pilih anggota terlebih dahulu.');return;}
  var rows=getMemberExportRows(_mdetNama);
  var csv=rows.map(function(r){ return r.map(function(c){ return '"'+String(c).replace(/"/g,'""')+'"'; }).join(','); }).join('\n');
  var a=document.createElement('a');
  a.href='data:text/csv;charset=utf-8,\uFEFF'+encodeURIComponent(csv);
  a.download='Detail_'+_mdetNama.replace(/\s+/g,'_')+'.csv';
  a.click();
}

function exportMemberPrint(){
  if(!_mdetNama) return;
  var m=members.find(function(x){return x.nama===_mdetNama;});
  var gender=m?glabel(m.gender):'';
  var rows=getFilteredMdetRows();
  var h=0,iz=0,al=0;
  rows.forEach(function(r){if(r.status==='H')h++;else if(r.status==='I')iz++;else if(r.status==='A')al++;});
  var tot=rows.length,pct=tot?Math.round(h/tot*100):0;
  var fYear=(document.getElementById('mdet-f-tahun')||{}).value||'Semua Tahun';
  var fBulanEl=document.getElementById('mdet-f-bulan');
  var fBulan=fBulanEl&&fBulanEl.selectedIndex>0?fBulanEl.options[fBulanEl.selectedIndex].text:'Semua Bulan';
  var activeS=['H','I','A','X'].filter(function(s){return _mdetActiveStatus[s];}).map(function(s){return s==='H'?'Hadir':s==='I'?'Izin':s==='A'?'Alfa':'Belum';}).join(', ');
  var sortInfo=_mdetSortAsc?'A→Z':'Z→A';
  var filterDesc=fYear+' · '+fBulan+' · '+activeS+' · Urutan: '+sortInfo;
  var tableRows=rows.map(function(r,i){
    var stBadge='';
    if(r.status==='H') stBadge='<span class="badge bh">Hadir</span>';
    else if(r.status==='I') stBadge='<span class="badge bi">Izin</span>';
    else if(r.status==='A') stBadge='<span class="badge ba">Alfa</span>';
    else stBadge='<span style="color:#717973">Belum</span>';
    return '<tr><td>'+(i+1)+'</td><td>'+r.tgl+'</td><td>'+escHtml(r.kegiatan)+'</td><td>'+stBadge+'</td><td>'+escHtml(r.catatan||'—')+'</td></tr>';
  }).join('');
  var circ=2*Math.PI*28;
  function pArc(val,offset,color){
    if(!val||!tot) return '';
    var dash=(val/tot)*circ;
    return '<circle cx="60" cy="60" r="28" fill="none" stroke="'+color+'" stroke-width="14"'+' stroke-dasharray="'+dash.toFixed(2)+' '+circ.toFixed(2)+'"'+' stroke-dashoffset="'+(-offset).toFixed(2)+'" transform="rotate(-90 60 60)"/>';
  }
  var belum=tot-h-iz-al;
  var oH=0,oI=oH+(h/tot||0)*circ,oA=oI+(iz/tot||0)*circ,oX=oA+(al/tot||0)*circ;
  var pColor=pct>=80?'#2d6a4f':pct>=60?'#b45309':'#ba1a1a';
  var donutSvg=tot?'<svg width="120" height="120" viewBox="0 0 120 120"><circle cx="60" cy="60" r="28" fill="none" stroke="#e8e6df" stroke-width="14"/>'+pArc(h,oH,'#2d6a4f')+pArc(iz,oI,'#b45309')+pArc(al,oA,'#ba1a1a')+pArc(belum,oX,'#e8e6df')+'<text x="60" y="65" text-anchor="middle" font-size="14" font-weight="700" fill="'+pColor+'">'+pct+'%</text></svg>':'';
  var legendHtml=tot?'<div style="display:flex;flex-direction:column;gap:5px;font-size:12px;justify-content:center">'+
    '<div><span style="display:inline-block;width:10px;height:10px;background:#2d6a4f;border-radius:2px;margin-right:6px"></span>Hadir: <b>'+h+'</b> ('+Math.round(h/tot*100)+'%)</div>'+
    '<div><span style="display:inline-block;width:10px;height:10px;background:#b45309;border-radius:2px;margin-right:6px"></span>Izin: <b>'+iz+'</b> ('+Math.round(iz/tot*100)+'%)</div>'+
    '<div><span style="display:inline-block;width:10px;height:10px;background:#ba1a1a;border-radius:2px;margin-right:6px"></span>Alfa: <b>'+al+'</b> ('+Math.round(al/tot*100)+'%)</div>'+
    (belum?'<div><span style="display:inline-block;width:10px;height:10px;background:#e8e6df;border-radius:2px;margin-right:6px"></span>Belum: <b>'+belum+'</b> ('+Math.round(belum/tot*100)+'%)</div>':'')+
    '</div>':'';
  _printWithIframe('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Detail '+escHtml(_mdetNama)+'</title>'+
    '<link rel="preconnect" href="https://fonts.googleapis.com">'+
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'+
    '<link href="https://fonts.googleapis.com/css2?family=Zilla+Slab:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">'+
    '<style>*{box-sizing:border-box}'+
    'body{font-family:"IBM Plex Sans",system-ui,sans-serif;font-size:12px;padding:24px;color:#1f2937;background:#fbf9f6;-webkit-print-color-adjust:exact;print-color-adjust:exact}'+
    'h2{font-family:"Zilla Slab",Georgia,serif;font-weight:600;font-size:18px;margin:0 0 2px;color:#1f2937}'+
    'p{margin:0 0 4px;color:#4b5563;font-size:11px}'+
    '.print-hd{border-bottom:2px solid #1b4332;padding-bottom:10px;margin-bottom:12px}'+
    '.filter-info{font-size:10px;color:#4b5563;margin-bottom:14px;padding:6px 10px;background:#ebf5f0;border:1px solid #e8e6df;border-radius:8px}'+
    '.summary{display:flex;align-items:center;gap:24px;background:#ffffff;border:1px solid #e8e6df;border-radius:12px;box-shadow:0 1px 3px rgba(28,25,23,.07);padding:14px 18px;margin-bottom:20px}'+
    '.stats{display:flex;gap:20px;flex-wrap:wrap;align-items:center}'+
    '.stat{text-align:center}.stat-val{font-size:18px;font-weight:700;color:#1f2937}.stat-lbl{font-size:10px;color:#717973;text-transform:uppercase;letter-spacing:.4px}'+
    'table{width:100%;border-collapse:collapse;font-size:11px;border:1px solid #e8e6df;border-radius:12px;overflow:hidden}'+
    'th,td{border:1px solid #e8e6df;padding:6px 9px;text-align:left;color:#1f2937}th{background:#fbf9f6;color:#4b5563;font-weight:600;font-size:9px;letter-spacing:.3px;text-transform:uppercase}'+
    '.badge{display:inline-block;border-radius:99px;padding:1px 7px;font-size:9px;font-weight:700}'+
    '.bh{background:#ebf5f0;color:#2d6a4f}.bi{background:#fef3c7;color:#b45309}.ba{background:#fee2e2;color:#ba1a1a}'+
    '@media print{body{background:#ffffff;padding:8px}.summary{box-shadow:none}}'+
    '</style></head><body>'+
    '<div class="print-hd"><h2>Detail Kehadiran: '+escHtml(_mdetNama)+'</h2><p>'+gender+'</p></div>'+
    '<div class="filter-info">Filter: '+filterDesc+' &nbsp;·&nbsp; '+tot+' sesi ditampilkan</div>'+
    '<div class="summary">'+donutSvg+'<div>'+legendHtml+'</div>'+
    '<div class="stats" style="margin-left:auto">'+
      '<div class="stat"><div class="stat-val">'+tot+'</div><div class="stat-lbl">Total Sesi</div></div>'+
      '<div class="stat"><div class="stat-val" style="color:'+pColor+'">'+pct+'%</div><div class="stat-lbl">Kehadiran</div></div>'+
    '</div></div>'+
    '<table><thead><tr><th>No</th><th>Tanggal</th><th>Kegiatan</th><th>Status</th><th>Keterangan</th></tr></thead>'+
    '<tbody>'+tableRows+'</tbody></table>'+
    '</body></html>');
}

// ══════════════════════════════════════════════════
// EXPORT ANGGOTA MULTI (expang)
// ══════════════════════════════════════════════════

function openExpAng(){
  var listEl = document.getElementById('expang-list');
  var cab = (typeof isCaberawit === 'function') ? isCaberawit() : false;
  var arr = members.slice();
  try {
    if(cab && typeof sortByKelasNama === 'function') arr.sort(sortByKelasNama);
  } catch(e){}
  listEl.innerHTML = arr.map(function(m){
    var avc = m.gender==='P'?'av-p':'av-l';
    var extra = cab && m.kelas ? ' <span style="color:#1b4332;font-size:10px;font-weight:700;background:#ebf5f0;border-radius:99px;padding:1px 7px;margin-left:4px">'+escHtml(m.kelas)+'</span>' : '';
    return '<label class="exp-check-row">'+
      '<input type="checkbox" class="expang-cb" value="'+escHtml(m.nama)+'" checked> '+
      '<span class="avatar '+avc+'" style="width:22px;height:22px;font-size:9px;flex-shrink:0">'+escHtml(initials(m.nama))+'</span> '+
      escHtml(m.nama)+' <span style="color:var(--text3);font-size:11px">('+glabel(m.gender)+')</span>'+extra+'</label>';
  }).join('');
  openPop('expang-overlay','expang-popup');
}

function closeExpAng(){
  closePop('expang-overlay','expang-popup');
}

function expangSelAll(val){
  document.querySelectorAll('.expang-cb').forEach(function(cb){ cb.checked = val; });
}

function getExpAngSelected(){
  var sel = [];
  document.querySelectorAll('.expang-cb:checked').forEach(function(cb){ sel.push(cb.value); });
  return sel;
}

function _getMemberData(nama, fDari, fSampai){
  var rows = getMemberSessions(nama);
  var dariDate=fDari?fDari:'0000-01-01';
  var sampaiDate=fSampai?fSampai:'9999-12-31';
  if(dariDate>sampaiDate){ var tmp=dariDate;dariDate=sampaiDate;sampaiDate=tmp; }
  rows = rows.filter(function(r){ return r.dateKey>=dariDate && r.dateKey<=sampaiDate; });
  var h=0,iz=0,al=0;
  rows.forEach(function(r){ if(r.status==='H')h++; else if(r.status==='I')iz++; else if(r.status==='A')al++; });
  return {rows:rows,h:h,iz:iz,al:al,tot:rows.length};
}

function doExpAng(type){
  var sel = getExpAngSelected();
  if(!sel.length){ appAlert('Pilih minimal satu anggota.'); return; }
  var fDari = (document.getElementById('expangDari')||{}).value||'';
  var fSampai = (document.getElementById('expangSampai')||{}).value||'';
  var filterDesc=(fDari||'Awal')+' s/d '+(fSampai||'Akhir');

  if(type==='print'){
    if(typeof JSZip==='undefined'||typeof jspdf==='undefined'){
      appAlert('Library belum dimuat. Muat ulang halaman dan coba lagi.'); return;
    }
    var jsPDF = jspdf.jsPDF;
    closeExpAng();
    showToast('Membuat PDF…', 30000);
    var zip    = new JSZip();
    var folderName='Absensi_Anggota_'+(fDari||'Awal')+'_s/d_'+(fSampai||'Akhir');
    var folder = zip.folder(folderName);
    var cGreen=[26,96,69],cAmber=[138,94,16],cRed=[139,53,48],cGray=[120,120,120],cBorder=[220,216,204],cBg=[245,238,223];
    sel.forEach(function(nama){
      var m=members.find(function(x){return x.nama===nama;})||{gender:'L'};
      var data=_getMemberData(nama,fDari,fSampai);
      var tot=data.tot,h=data.h,iz=data.iz,al=data.al;
      var pct=tot?Math.round(h/tot*100):0;
      var pColor=pct>=80?cGreen:pct>=60?cAmber:cRed;
      var doc=new jsPDF({unit:'mm',format:'a4',orientation:'portrait'});
      var W=doc.internal.pageSize.getWidth(),margin=14,y=margin;
      doc.setFontSize(16);doc.setTextColor(cGreen[0],cGreen[1],cGreen[2]);doc.setFont('helvetica','bold');
      doc.text(nama,margin,y);y+=6;
      doc.setFontSize(10);doc.setTextColor(cGray[0],cGray[1],cGray[2]);doc.setFont('helvetica','normal');
      doc.text(glabel(m.gender)+'   |   '+filterDesc,margin,y);y+=8;
      doc.setFillColor(cBg[0],cBg[1],cBg[2]);doc.roundedRect(margin,y,W-margin*2,22,3,3,'F');
      var sx=margin+6;
      doc.setFontSize(9);doc.setTextColor(cGray[0],cGray[1],cGray[2]);doc.text('Total Sesi',sx,y+6);
      doc.setFontSize(14);doc.setFont('helvetica','bold');doc.setTextColor(50,50,50);doc.text(String(tot),sx,y+14);
      sx+=28;doc.setFontSize(9);doc.setFont('helvetica','normal');doc.setTextColor(cGray[0],cGray[1],cGray[2]);doc.text('Hadir',sx,y+6);
      doc.setFontSize(14);doc.setFont('helvetica','bold');doc.setTextColor(cGreen[0],cGreen[1],cGreen[2]);doc.text(String(h),sx,y+14);
      sx+=22;doc.setFontSize(9);doc.setFont('helvetica','normal');doc.setTextColor(cGray[0],cGray[1],cGray[2]);doc.text('Izin',sx,y+6);
      doc.setFontSize(14);doc.setFont('helvetica','bold');doc.setTextColor(cAmber[0],cAmber[1],cAmber[2]);doc.text(String(iz),sx,y+14);
      sx+=22;doc.setFontSize(9);doc.setFont('helvetica','normal');doc.setTextColor(cGray[0],cGray[1],cGray[2]);doc.text('Alfa',sx,y+6);
      doc.setFontSize(14);doc.setFont('helvetica','bold');doc.setTextColor(cRed[0],cRed[1],cRed[2]);doc.text(String(al),sx,y+14);
      sx+=22;doc.setFontSize(9);doc.setFont('helvetica','normal');doc.setTextColor(cGray[0],cGray[1],cGray[2]);doc.text('Kehadiran',sx,y+6);
      doc.setFontSize(14);doc.setFont('helvetica','bold');doc.setTextColor(pColor[0],pColor[1],pColor[2]);doc.text(pct+'%',sx,y+14);
      y+=28;
      var cols=['No','Tanggal','Kegiatan','Status','Keterangan'];
      var colW=[10,42,50,18,W-margin*2-10-42-50-18];
      doc.setFontSize(8);doc.setFont('helvetica','bold');doc.setFillColor(200,230,215);doc.rect(margin,y,W-margin*2,7,'F');
      doc.setTextColor(26,96,69);var cx=margin+2;
      cols.forEach(function(h2,i){doc.text(h2,cx+1,y+5);cx+=colW[i];});y+=7;
      doc.setFont('helvetica','normal');doc.setFontSize(8);
      data.rows.forEach(function(r,i){
        var rowH=7;
        if(y+rowH>doc.internal.pageSize.getHeight()-margin){doc.addPage();y=margin;}
        if(i%2===0){doc.setFillColor(248,248,248);doc.rect(margin,y,W-margin*2,rowH,'F');}
        doc.setDrawColor(cBorder[0],cBorder[1],cBorder[2]);doc.line(margin,y+rowH,margin+W-margin*2,y+rowH);
        var sv=r.status==='H'?'Hadir':r.status==='I'?'Izin':r.status==='A'?'Alfa':'Belum';
        var sc=r.status==='H'?cGreen:r.status==='I'?cAmber:r.status==='A'?cRed:cGray;
        var vals=[String(i+1),r.tgl,r.kegiatan,sv,r.catatan||'—'];
        cx=margin+2;
        vals.forEach(function(v,ci){
          if(ci===3){doc.setTextColor(sc[0],sc[1],sc[2]);doc.setFont('helvetica','bold');}
          else{doc.setTextColor(50,50,50);doc.setFont('helvetica','normal');}
          var maxW=colW[ci]-3;
          var txt=doc.splitTextToSize(v,maxW)[0]||'';
          doc.text(txt,cx+1,y+5);cx+=colW[ci];
        });
        y+=rowH;
      });
      var fname='Absensi_'+nama.replace(/[^a-zA-Z0-9]/g,'_')+'.pdf';
      folder.file(fname,doc.output('blob'));
    });
    zip.generateAsync({type:'blob'}).then(function(blob){
      var url=URL.createObjectURL(blob);
      var a=document.createElement('a');
      a.href=url;a.download=folderName+'.zip';a.click();
      showToast('ZIP berhasil diunduh.');
      setTimeout(function(){URL.revokeObjectURL(url);},3000);
    });
    return;
  }
  if(type==='excel'){
    var wb=XLSX.utils.book_new();
    sel.forEach(function(nama){
      var data=_getMemberData(nama,fDari,fSampai);
      var rows=[['No','Tanggal','Kegiatan','Status','Keterangan']];
      data.rows.forEach(function(r,i){
        rows.push([i+1,r.tgl,r.kegiatan,r.status==='H'?'Hadir':r.status==='I'?'Izin':r.status==='A'?'Alfa':'Belum',r.catatan||'']);
      });
      rows.push([]);rows.push(['','','Hadir',data.h,'']);rows.push(['','','Izin',data.iz,'']);rows.push(['','','Alfa',data.al,'']);
      rows.push(['','','% Hadir',data.tot?Math.round(data.h/data.tot*100)+'%':'—','']);
      var sheetName=nama.slice(0,28).replace(/[:\/?*\[\]]/g,'');
      var wsM=XLSX.utils.aoa_to_sheet(rows);
      try{
        wsM['!cols']=[{wch:6},{wch:14},{wch:30},{wch:12},{wch:34}];
        wsM['!autofilter']={s:{r:0,c:0},e:{r:0,c:4}};
        wsM['!freeze']='A2';
      }catch(e){}
      XLSX.utils.book_append_sheet(wb,wsM,sheetName);
    });
    XLSX.writeFile(wb,'Anggota_Multi.xlsx');
    closeExpAng(); return;
  }
  if(type==='csv'){
    var allCSV=[];
    sel.forEach(function(nama){
      var data=_getMemberData(nama,fDari,fSampai);
      allCSV.push('=== '+nama+' ('+filterDesc+') ===');
      allCSV.push('"No","Tanggal","Kegiatan","Status","Keterangan"');
      data.rows.forEach(function(r,i){
        var sv=r.status==='H'?'Hadir':r.status==='I'?'Izin':r.status==='A'?'Alfa':'Belum';
        allCSV.push('"'+(i+1)+'","'+r.tgl+'","'+r.kegiatan+'","'+sv+'","'+(r.catatan||'')+'"');
      });
      allCSV.push('"","","Hadir","'+data.h+'"');
      allCSV.push('"","","Izin","'+data.iz+'"');
      allCSV.push('"","","Alfa","'+data.al+'"');
      allCSV.push('');
    });
    var a=document.createElement('a');
    a.href='data:text/csv;charset=utf-8,\uFEFF'+encodeURIComponent(allCSV.join('\n'));
    a.download='Anggota_Multi.csv';a.click();
    closeExpAng();
  }
}

// Badge jumlah anggota aktif di menu Lainnya (PC + mobile).
function renderLainnya(){
  var n = 0;
  try { n = activeMembers().length; } catch(e){}
  ['lain-jml-pc','lain-jml-m'].forEach(function(id){ var el=document.getElementById(id); if(el) el.textContent=n+' Aktif'; });
}
