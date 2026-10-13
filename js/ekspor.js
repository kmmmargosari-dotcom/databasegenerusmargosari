// ══════════════════════════════════════════════════
// EKSPOR — halaman terpusat (menu Lainnya > Ekspor)
// Reuse fungsi export yang sudah ada di tiap modul tanpa duplikasi logic.
// ══════════════════════════════════════════════════

function renderEkspor(){}

function _exVal(pcId, mobId){
  if(mob()){
    var m = document.getElementById(mobId);
    if(m && m.value) return m.value;
  }
  var p = document.getElementById(pcId);
  if(p && p.value) return p.value;
  var m2 = document.getElementById(mobId);
  if(m2 && m2.value) return m2.value;
  return '';
}

function _exSet(ids, val){
  ids.forEach(function(id){
    var el = document.getElementById(id);
    if(el) el.value = val||'';
  });
}

// ── Periode export ──
// 'bulan'  → bulan & tahun sesuai pemilih (default: bulan berjalan)
// 'tahun'  → Jan–Des sesuai pemilih tahun
// 'custom' → pakai input tanggal Dari–Sampai
// 'semua'  → tanpa batas
function resolveExRange(kind){
  var isRekap = kind==='rekap';
  var pfx = isRekap?'exRekap':'exKas';
  var mode = _exVal(pfx+'Periode', pfx+'PeriodeM') || 'bulan';
  var now = new Date();
  var y = _exVal(pfx+'Tahun', pfx+'TahunM') || String(now.getFullYear());
  var mm = _exVal(pfx+'Bulan', pfx+'BulanM') || String(now.getMonth()+1).padStart(2,'0');
  if(mode==='bulan'){
    var last = new Date(parseInt(y,10), parseInt(mm,10), 0).getDate();
    return {dari: y+'-'+mm+'-01', sampai: y+'-'+mm+'-'+String(last).padStart(2,'0')};
  }
  if(mode==='tahun') return {dari: y+'-01-01', sampai: y+'-12-31'};
  if(mode==='semua') return {dari: '', sampai: ''};
  return {dari:  _exVal(pfx+'Dari', pfx+'DariM'),
          sampai:_exVal(pfx+'Sampai', pfx+'SampaiM')};
}

// Dropdown periode berubah: sinkronkan PC ↔ mobile + tampilkan pemilih
// yang sesuai (bulan+tahun / tahun saja / tanggal custom / tidak ada).
function exPeriodeChanged(kind){
  var isRekap = kind==='rekap';
  var pfx = isRekap?'exRekap':'exKas';
  var pcId = pfx+'Periode', mId = pcId+'M';
  var srcEl = mob() ? document.getElementById(mId) : document.getElementById(pcId);
  if(!srcEl) srcEl = document.getElementById(pcId) || document.getElementById(mId);
  var v = srcEl ? srcEl.value : 'bulan';
  [pcId, mId].forEach(function(id){ var el=document.getElementById(id); if(el) el.value=v; });
  [[pfx+'BulanRow', v==='bulan'||v==='tahun'],
   [pfx+'BulanWrap', v==='bulan'],
   [pfx+'Custom', v==='custom']].forEach(function(pair){
    [pair[0], pair[0]+'M'].forEach(function(id){
      var el=document.getElementById(id);
      if(el) el.style.display = pair[1] ? '' : 'none';
    });
  });
}

// Default pemilih bulan & tahun = bulan berjalan. Dijalankan langsung
// (script ada di akhir body sehingga DOM sudah tersedia).
function initExPeriodeDefaults(){
  var now = new Date();
  var mm = String(now.getMonth()+1).padStart(2,'0');
  var yy = String(now.getFullYear());
  ['exRekapBulan','exRekapBulanM','exKasBulan','exKasBulanM','exGabBulan'].forEach(function(id){
    var el=document.getElementById(id); if(el) el.value=mm;
  });
  ['exRekapTahun','exRekapTahunM','exKasTahun','exKasTahunM','exGabTahun'].forEach(function(id){
    var el=document.getElementById(id);
    if(!el||!el.options) return;
    var ada=false;
    for(var i=0;i<el.options.length;i++){ if(el.options[i].value===yy){ ada=true; break; } }
    if(!ada){
      var op=document.createElement('option'); op.value=yy; op.textContent=yy;
      el.insertBefore(op, el.firstChild);
    }
    el.value=yy;
  });
  try{ exPeriodeChanged('rekap'); exPeriodeChanged('kas'); }catch(e){}
}
initExPeriodeDefaults();

// Opsi export rekap: dibaca oleh exportExcel/CSV/Print di rekap.js.
function getRekapExportOpts(){
  return {insight:true, kas:false};
}

// ── POPUP EXPORT GABUNGAN (Rekap Absensi + Kas) ──
function openExGab(){
  try{ exGabPeriodeChanged(); }catch(e){}
  showPopup('exgab-overlay','exgab-popup');
}
function closeExGab(){ hidePopup('exgab-overlay','exgab-popup'); }

function exGabPeriodeChanged(){
  var sel=document.getElementById('exGabPeriode');
  var v=sel?sel.value:'bulan';
  var row=document.getElementById('exGabBulanRow');
  var wrap=document.getElementById('exGabBulanWrap');
  var custom=document.getElementById('exGabCustom');
  if(row) row.style.display=(v==='bulan'||v==='tahun')?'':'none';
  if(wrap) wrap.style.display=(v==='bulan')?'':'none';
  if(custom) custom.style.display=(v==='custom')?'':'none';
}

function resolveGabRange(){
  var sel=document.getElementById('exGabPeriode');
  var mode=sel?sel.value:'bulan';
  var now=new Date();
  var yEl=document.getElementById('exGabTahun');
  var mEl=document.getElementById('exGabBulan');
  var y=(yEl&&yEl.value)||String(now.getFullYear());
  var mm=(mEl&&mEl.value)||String(now.getMonth()+1).padStart(2,'0');
  if(mode==='bulan'){
    var last=new Date(parseInt(y,10),parseInt(mm,10),0).getDate();
    return {dari:y+'-'+mm+'-01', sampai:y+'-'+mm+'-'+String(last).padStart(2,'0')};
  }
  if(mode==='tahun') return {dari:y+'-01-01', sampai:y+'-12-31'};
  if(mode==='semua') return {dari:'', sampai:''};
  var dEl=document.getElementById('exGabDari'), sEl=document.getElementById('exGabSampai');
  return {dari:(dEl&&dEl.value)||'', sampai:(sEl&&sEl.value)||''};
}

function getGabData(){
  var r=resolveGabRange();
  var dari=r.dari||'0000-01-01', sampai=r.sampai||'9999-12-31';
  if(dari>sampai){ var tmp=dari;dari=sampai;sampai=tmp; }
  var sL=Object.keys(sesiData).filter(function(t){
    var dk=tglDate(t);
    return dk>=dari && dk<=sampai;
  }).sort();
  var gEl=document.getElementById('exGabGender');
  var rg=gEl?gEl.value:'S';
  var _rr=rekapRoster(sL);
  var mAll=rg==='S'?_rr.P.concat(_rr.L).concat(_rr.X):(rg==='P'?_rr.P:_rr.L);
  var cEl=document.getElementById('exGabCatatan');
  var catatan=cEl?(cEl.value||'').trim():'';
  return {sL:sL, mAll:mAll, rg:rg, customDari:r.dari||'', customSampai:r.sampai||'', catatan:catatan};
}

function eksporGabungan(type){
  var d=getGabData();
  if(!d.sL.length){ appAlert('Belum ada data untuk periode ini.'); return; }
  if(type==='excel') gabunganExcel(d);
  else if(type==='csv') gabunganCSV(d);
  else gabunganPrint(d);
}

// Rekap Absensi Bulanan — salin filter ke rekap lalu export.
function eksporRekap(type){
  _exSet(['rGender','rGenderM'], _exVal('exRekapGender','exRekapGenderM'));
  try { renderRekap('pc'); } catch(e){}
  if(type==='excel') exportExcel();
  else if(type==='csv') exportCSV();
  else exportPrint();
}

// Laporan Kas — salin filter ke kas lalu export (kasExport).
function eksporKas(type){
  kasExport(type);
}

// ══════════════════════════════════════════════════
// EKSPOR SEMUA KELOMPOK (1 PDF) — khusus role 'admin'.
// Mengambil data keempat kelompok via getDocs terpisah ke objek lokal,
// lalu merender memakai fungsi rekap/kas yang sudah ada lewat pola
// swap-global sementara (withGroupData). TIDAK memanggil fbInit /
// switchGroup / menulis Firestore, sehingga kelompok aktif admin,
// listener realtime, dan dropdown tidak terganggu.
// ══════════════════════════════════════════════════

// Tukar global satu-kelompok (members, sesiData, sesiKet, sesiRoster,
// kasTransaksi, kasSaldoAwal, currentGroup, currentGroupInfo) dengan data
// lokal, jalankan fn SINKRON, kembalikan di finally.
function withGroupData(gdata, fn){
  var saved = {
    members: members, sesiData: sesiData, sesiKet: sesiKet,
    sesiRoster: sesiRoster, kasTransaksi: kasTransaksi,
    kasSaldoAwal: (typeof kasSaldoAwal !== 'undefined') ? kasSaldoAwal : 0,
    currentGroup: (typeof currentGroup !== 'undefined') ? currentGroup : null,
    currentGroupInfo: (typeof currentGroupInfo !== 'undefined') ? currentGroupInfo : null
  };
  members = gdata.members; sesiData = gdata.sesiData; sesiKet = gdata.sesiKet;
  sesiRoster = gdata.sesiRoster; kasTransaksi = gdata.kasTransaksi;
  kasSaldoAwal = gdata.kasSaldoAwal;
  try { currentGroup = gdata.gid; } catch(e){}
  try { currentGroupInfo = { displayName: gdata.displayName, kasSaldoAwal: gdata.kasSaldoAwal }; } catch(e){}
  try {
    return fn();
  } finally {
    members = saved.members; sesiData = saved.sesiData; sesiKet = saved.sesiKet;
    sesiRoster = saved.sesiRoster; kasTransaksi = saved.kasTransaksi;
    kasSaldoAwal = saved.kasSaldoAwal;
    try { currentGroup = saved.currentGroup; } catch(e){}
    try { currentGroupInfo = saved.currentGroupInfo; } catch(e){}
  }
}

// Ambil seluruh data satu kelompok (read-only). Mengembalikan objek lokal
// {gid, displayName, members, sesiData, sesiKet, sesiRoster, kasTransaksi, kasSaldoAwal}.
function loadGroupData(gid){
  var db = (typeof fsDb === 'function') ? fsDb() : window._db;
  var col = window._fsCol, fdoc = window._fsDoc;
  var getDocs = window._fsGetDocs, getDoc = window._fsGetDoc;
  function pSesi(){
    return getDocs(col(db, 'groups', gid, 'sesi')).then(function(snap){
      var sd = {}, sk = {}, sr = {};
      snap.forEach(function(d){
        var dat = d.data() || {};
        sd[d.id] = dat.absensi || {};
        sk[d.id] = dat.kegiatan || '';
        sr[d.id] = dat.roster || null;
      });
      return { sd: sd, sk: sk, sr: sr };
    });
  }
  function pAnggota(){
    return getDoc(fdoc(db, 'groups', gid, 'anggota', 'list')).then(function(snap){
      if(snap.exists() && snap.data() && snap.data().members) return snap.data().members;
      return [];
    }).catch(function(){ return []; });
  }
  function pKas(){
    return getDocs(col(db, 'groups', gid, 'kas')).then(function(snap){
      var arr = [];
      snap.forEach(function(d){
        var dat = d.data() || {};
        arr.push({
          id: d.id,
          jenis: dat.jenis || 'pemasukan',
          nominal: dat.nominal || 0,
          tanggal: dat.tanggal || '',
          keterangan: dat.keterangan || '',
          createdAt: dat.createdAt || 0
        });
      });
      return arr;
    }).catch(function(){ return []; });
  }
  function pProfil(){
    return getDoc(fdoc(db, 'groups', gid)).then(function(snap){
      var dat = snap.exists() ? (snap.data() || {}) : {};
      var label = null;
      try {
        var g = GROUPS_LIST.find(function(x){ return x.id === gid; });
        label = g ? g.label : gid;
      } catch(e){ label = gid; }
      return {
        displayName: dat.displayName || label,
        kasSaldoAwal: (typeof dat.kasSaldoAwal === 'number') ? dat.kasSaldoAwal : 0
      };
    }).catch(function(){
      var label = gid;
      try {
        var g = GROUPS_LIST.find(function(x){ return x.id === gid; });
        if(g) label = g.label;
      } catch(e){}
      return { displayName: label, kasSaldoAwal: 0 };
    });
  }
  return Promise.all([pSesi(), pAnggota(), pKas(), pProfil()]).then(function(r){
    return {
      gid: gid, displayName: r[3].displayName, kasSaldoAwal: r[3].kasSaldoAwal,
      members: r[1], sesiData: r[0].sd, sesiKet: r[0].sk, sesiRoster: r[0].sr,
      kasTransaksi: r[2]
    };
  });
}

// Saring sesi per rentang tanggal + roster anggota per gender.
// Cerminan getExportData/getGabData, tapi murni dari gdata (tanpa global).
function exAllGroupSlice(gdata, dariDate, sampaiDate, rg){
  return withGroupData(gdata, function(){
    var sL = Object.keys(sesiData).filter(function(t){
      var dk = tglDate(t);
      return dk >= dariDate && dk <= sampaiDate;
    }).sort();
    var rr = rekapRoster(sL);
    var mAll = rg === 'S' ? rr.P.concat(rr.L).concat(rr.X) : (rg === 'P' ? rr.P : rr.L);
    return { sL: sL, mAll: mAll, rg: rg };
  });
}

// Statistik + tren satu kelompok untuk tabel ringkasan perbandingan.
function exAllGroupSummary(gdata, dariDate, sampaiDate, rg){
  var sl = exAllGroupSlice(gdata, dariDate, sampaiDate, rg);
  var stats = withGroupData(gdata, function(){
    var st = rekapComputeStats(sl.sL, sl.mAll);
    var tr = rekapTrendForRange(sl.sL, st.avg);
    return { st: st, trend: tr.trend };
  });
  return {
    gid: gdata.gid, displayName: gdata.displayName,
    nGenerus: stats.st.nGenerus, nSesi: stats.st.nSesi,
    h: stats.st.h, iz: stats.st.iz, al: stats.st.al,
    avg: stats.st.avg, trend: stats.trend
  };
}

// Section HTML satu kelompok (ringkasan + grafik + tabel + kas opsional).
function exAllGroupSectionHtml(gdata, dariDate, sampaiDate, rg, o, newPage, customDari, customSampai){
  var sl = exAllGroupSlice(gdata, dariDate, sampaiDate, rg);
  var d = { sL: sl.sL, mAll: sl.mAll, rg: sl.rg, customDari: customDari, customSampai: customSampai, catatan: '' };
  var html = withGroupData(gdata, function(){
    return buildRekapGroupSectionHtml(d, { insight: true, kas: !!o.kas, chart: !!o.chart, emptyNote: true }, gdata.displayName);
  });
  var cls = newPage ? 'grp-newpage' : 'grp-continue';
  return '<div class="grp-section ' + cls + '">' + html + '</div>';
}

// Tabel ringkasan perbandingan 4 kelompok (1 halaman).
function exAllSummaryHtml(summaries, periodLabel){
  var rows = summaries.map(function(s){
    var trenTxt = '—', trenColor = '#717973';
    if(s.nSesi && s.trend){
      if(s.trend.dir === 'naik'){ trenTxt = '↑ +' + s.trend.delta + '%'; trenColor = '#2d6a4f'; }
      else if(s.trend.dir === 'turun'){ trenTxt = '↓ ' + s.trend.delta + '%'; trenColor = '#ba1a1a'; }
      else { trenTxt = '＝ Stabil'; trenColor = '#4b5563'; }
    } else if(!s.nSesi){ trenTxt = 'Belum ada data'; }
    var avgColor = s.avg >= 80 ? '#2d6a4f' : s.avg >= 60 ? '#b45309' : '#ba1a1a';
    return '<tr><td class="tl"><b>' + escHtml(s.displayName) + '</b></td>' +
      '<td>' + s.nGenerus + '</td><td>' + s.nSesi + '</td>' +
      '<td style="color:#2d6a4f">' + s.h + '</td><td style="color:#b45309">' + s.iz + '</td>' +
      '<td style="color:#ba1a1a">' + s.al + '</td>' +
      '<td style="color:' + avgColor + ';font-weight:700">' + (s.nSesi ? s.avg + '%' : '—') + '</td>' +
      '<td style="color:' + trenColor + ';font-weight:700">' + trenTxt + '</td></tr>';
  }).join('');
  return '<div class="tbl-card" style="padding:12px 14px;page-break-inside:avoid">' +
    '<h3 style="margin-top:0">Ringkasan Perbandingan 4 Kelompok</h3>' +
    '<div class="subtitle" style="margin-bottom:8px">' + escHtml(periodLabel) + '</div>' +
    '<table class="sum-table"><thead><tr><th style="text-align:left">Kelompok</th><th>Generus</th><th>Sesi</th>' +
    '<th>H</th><th>I</th><th>A</th><th>% Hadir</th><th>Tren</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
}

// ── Popup Export Semua Kelompok ──
function isAdminLogin(){
  try { return !!(typeof currentUser !== 'undefined' && currentUser && currentUser.role === 'admin'); }
  catch(e){ return false; }
}
function openExAll(){
  if(!isAdminLogin()){
    appAlert('Fitur ini hanya untuk Admin Pusat.');
    return;
  }
  try { exAllPeriodeChanged(); } catch(e){}
  try {
    var _now = new Date();
    var _mm = String(_now.getMonth() + 1).padStart(2, '0');
    var _yy = String(_now.getFullYear());
    var _b = document.getElementById('exAllBulan'); if(_b) _b.value = _mm;
    var _t = document.getElementById('exAllTahun');
    if(_t){
      var _ada = false;
      for(var _i = 0; _i < _t.options.length; _i++){ if(_t.options[_i].value === _yy){ _ada = true; break; } }
      if(!_ada){ var _op = document.createElement('option'); _op.value = _yy; _op.textContent = _yy; _t.insertBefore(_op, _t.firstChild); }
      _t.value = _yy;
    }
  } catch(e){}
  var g = document.getElementById('exAllGender');
  if(g && !g.value) g.value = 'S';
  showPopup('exall-overlay', 'exall-popup');
}
function closeExAll(){ hidePopup('exall-overlay', 'exall-popup'); }

function exAllPeriodeChanged(){
  var sel = document.getElementById('exAllPeriode');
  var v = sel ? sel.value : 'bulan';
  var row = document.getElementById('exAllBulanRow');
  var wrap = document.getElementById('exAllBulanWrap');
  var custom = document.getElementById('exAllCustom');
  if(row) row.style.display = (v === 'bulan' || v === 'tahun') ? '' : 'none';
  if(wrap) wrap.style.display = (v === 'bulan') ? '' : 'none';
  if(custom) custom.style.display = (v === 'custom') ? '' : 'none';
}

function resolveAllRange(){
  var sel = document.getElementById('exAllPeriode');
  var mode = sel ? sel.value : 'bulan';
  var now = new Date();
  var yEl = document.getElementById('exAllTahun');
  var mEl = document.getElementById('exAllBulan');
  var y = (yEl && yEl.value) || String(now.getFullYear());
  var mm = (mEl && mEl.value) || String(now.getMonth() + 1).padStart(2, '0');
  if(mode === 'bulan'){
    var last = new Date(parseInt(y, 10), parseInt(mm, 10), 0).getDate();
    return { dari: y + '-' + mm + '-01', sampai: y + '-' + mm + '-' + String(last).padStart(2, '0') };
  }
  if(mode === 'tahun') return { dari: y + '-01-01', sampai: y + '-12-31' };
  if(mode === 'semua') return { dari: '', sampai: '' };
  var dEl = document.getElementById('exAllDari'), sEl = document.getElementById('exAllSampai');
  return { dari: (dEl && dEl.value) || '', sampai: (sEl && sEl.value) || '' };
}

function exAllSetBusy(busy, label){
  ['exAllBuatBtn', 'exAllBuatBtnM'].forEach(function(id){
    var el = document.getElementById(id);
    if(!el) return;
    if(busy){ el.disabled = true; el.setAttribute('data-label', el.innerHTML); el.innerHTML = label || 'Mengambil data…'; }
    else { el.disabled = false; var l = el.getAttribute('data-label'); if(l) el.innerHTML = l; }
  });
}

// Buat SATU PDF berisi kelompok yang dipilih. Gagal di satu kelompok tidak
// menghentikan yang lain: tawarkan lanjut tanpa kelompok itu atau batal.
function eksporSemuaKelompok(){
  if(!isAdminLogin()){
    appAlert('Fitur ini hanya untuk Admin Pusat.');
    return;
  }
  var r = resolveAllRange();
  var dariDate = r.dari || '0000-01-01', sampaiDate = r.sampai || '9999-12-31';
  if(dariDate > sampaiDate){ var t = dariDate; dariDate = sampaiDate; sampaiDate = t; }
  var customDari = r.dari || '', customSampai = r.sampai || '';
  var periodLabel = (customDari || 'Awal') + ' s/d ' + (customSampai || 'Akhir');
  var gEl = document.getElementById('exAllGender');
  var rg = gEl ? (gEl.value || 'S') : 'S';
  function checked(id){ var el = document.getElementById(id); return !!(el && el.checked); }
  var o = {
    summary: checked('exAllSum') || checked('exAllSumM'),
    chart: checked('exAllChart') || checked('exAllChartM'),
    kas: checked('exAllKas') || checked('exAllKasM'),
    hemat: checked('exAllHemat') || checked('exAllHematM')
  };
  // Cek kategori yang dipilih
  var selectedGroups = [];
  if(checked('exAllCatCaberawit')) selectedGroups.push('caberawit');
  if(checked('exAllCatPraRemaja')) selectedGroups.push('praremaja');
  if(checked('exAllCatRemaja')) selectedGroups.push('remaja');
  if(checked('exAllCatMudaMudi')) selectedGroups.push('mudamudi');
  
  if(selectedGroups.length === 0){
    appAlert('Pilih minimal satu kelompok untuk diekspor.');
    return;
  }
  
  var gids = selectedGroups;
  exAllSetBusy(true, 'Mengambil data ' + selectedGroups.length + ' kelompok…');
  showToast('Mengambil data ' + selectedGroups.length + ' kelompok…', 30000);
  var promises = gids.map(function(gid){
    return loadGroupData(gid).then(function(gdata){
      return { ok: true, gdata: gdata };
    }).catch(function(err){
      console.error('loadGroupData gagal:', gid, err);
      return { ok: false, gid: gid, err: err };
    });
  });
  Promise.all(promises).then(function(results){
    exAllSetBusy(false);
    var failed = results.filter(function(x){ return !x.ok; });
    function buildDoc(okResults){
      var summaries = okResults.map(function(x){
        return exAllGroupSummary(x.gdata, dariDate, sampaiDate, rg);
      });
      var parts = [];
      var printedAt = new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' });
      var selectedLabels = okResults.map(function(x){
        try {
          var g = GROUPS_LIST.find(function(gg){ return gg.id === x.gdata.gid; });
          return g ? g.label : x.gdata.gid;
        } catch(e){ return x.gdata.gid; }
      }).join(', ');
      // Header utama dihapus - setiap kelompok sudah punya header sendiri di buildRekapGroupSectionHtml
      if(o.summary) parts.push(exAllSummaryHtml(summaries, periodLabel));
      okResults.forEach(function(x, i){
        parts.push(exAllGroupSectionHtml(x.gdata, dariDate, sampaiDate, rg, o, (!o.hemat && (i > 0 || o.summary)), customDari, customSampai));
      });
      if(failed.length){
        var names = failed.map(function(f){
          try {
            var g = GROUPS_LIST.find(function(gg){ return gg.id === f.gid; });
            return g ? g.label : f.gid;
          } catch(e){ return f.gid; }
        }).join(', ');
        parts.push('<div class="tbl-card" style="padding:10px 14px;color:#ba1a1a">Kelompok yang tidak ikut (gagal dimuat): ' + escHtml(names) + '.</div>');
      }
      _printWithIframe(
        rekapDocHeadHtml('Rekap Absensi — ' + periodLabel) +
        parts.join('') +
        '</body></html>'
      );
      try { if(typeof showToast === 'function') showToast('Dokumen siap dicetak.'); } catch(e){}
    }
    if(!failed.length){ buildDoc(results); return; }
    var names = failed.map(function(f){
      try {
        var g = GROUPS_LIST.find(function(gg){ return gg.id === f.gid; });
        return g ? g.label : f.gid;
      } catch(e){ return f.gid; }
    }).join(', ');
    appConfirm('Gagal memuat: ' + names + '.\n\nLanjut tanpa kelompok itu?',
      function(){ buildDoc(results.filter(function(x){ return x.ok; })); },
      { title: 'Sebagian Gagal Dimuat', icon: 'info', color: 'amber', okText: 'Ya, Lanjut' });
  }).catch(function(err){
    exAllSetBusy(false);
    console.error('eksporSemuaKelompok gagal', err);
    appAlert('Gagal membuat dokumen. Periksa koneksi lalu coba lagi.');
  });
}
