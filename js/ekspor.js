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
