// ══════════════════════════════════════════════════
// REKAP MODULE
// ══════════════════════════════════════════════════


function renderRekap(source){
  var bEl, tEl, gEl;
  if(source==='mob'){
    bEl = document.getElementById('rBulanM');
    tEl = document.getElementById('rTahunM');
    gEl = document.getElementById('rGenderM');
    var bPc=document.getElementById('rBulan');   if(bPc) bPc.value=bEl.value;
    var tPc=document.getElementById('rTahun');   if(tPc) tPc.value=tEl.value;
    var gPc=document.getElementById('rGender');  if(gPc) gPc.value=gEl?gEl.value:'S';
    var sPc=document.getElementById('rSort');    if(sPc) sPc.value=(document.getElementById('rSortM')||{}).value||'asc';
  } else {
    bEl = document.getElementById('rBulan');
    tEl = document.getElementById('rTahun');
    gEl = document.getElementById('rGender');
    var bMob=document.getElementById('rBulanM'); if(bMob) bMob.value=bEl.value;
    var tMob=document.getElementById('rTahunM'); if(tMob) tMob.value=tEl.value;
    var gMob=document.getElementById('rGenderM');if(gMob) gMob.value=gEl?gEl.value:'S';
    var sMob=document.getElementById('rSortM');  if(sMob) sMob.value=(document.getElementById('rSort')||{}).value||'asc';
  }
  if(!bEl||!tEl) return;
  var bulan=parseInt(bEl.value), tahun=parseInt(tEl.value), rg=gEl?gEl.value:'S';

  var sortVal = source==='mob'
    ? ((document.getElementById('rSortM')||{}).value||'asc')
    : ((document.getElementById('rSort')||{}).value||'asc');

  var prefix = tahun+'-'+String(bulan).padStart(2,'0');
  var sL     = Object.keys(sesiData).filter(function(t){ return t.startsWith(prefix); }).sort();
  // Fallback: bila periode terpilih kosong, pakai periode terakhir yang ADA datanya
  // supaya 5 kartu tidak kosong — filter ikut disesuaikan.
  if(!sL.length){
    var allKeys = Object.keys(sesiData).sort();
    if(allKeys.length){
      var lk = allKeys[allKeys.length-1].split('_')[0].split('-');
      tahun = parseInt(lk[0],10); bulan = parseInt(lk[1],10);
      prefix = tahun+'-'+String(bulan).padStart(2,'0');
      sL = Object.keys(sesiData).filter(function(t){ return t.startsWith(prefix); }).sort();
      ['rBulan','rBulanM'].forEach(function(id){ var el=document.getElementById(id); if(el) el.value=bulan; });
      ['rTahun','rTahunM'].forEach(function(id){ var el=document.getElementById(id); if(el){ var o=el.querySelector('option[value="'+tahun+'"]'); if(o) el.value=tahun; } });
    }
  }
  if(sortVal==='desc') sL.reverse();

  // Daftar anggota dari roster snapshot + entri sesi (anti join ke
  // koleksi terkini): arsip/hapus/ubah-gender tak mengubah rekap lama.
  var _rr  = rekapRoster(sL);
  var mP   = _rr.P;
  var mL   = _rr.L;
  var mX   = _rr.X;
  var mAll = rg==='S' ? mP.concat(mL).concat(mX) : (rg==='P' ? mP : mL);

  // Stats dihitung dari SELURUH roster (tidak ikut filter cari) —
  // pakai sumber tunggal supaya sama persis dengan export/print.
  var _st = rekapComputeStats(sL, mAll);
  var _rsH=_st.h, _rsI=_st.iz, _rsA=_st.al, _rsTot=_st.tot, _rsAvg=_st.avg;

  // Search filter (nama generus) — hanya untuk tabel matriks.
  // Kartu statistik & grafik tetap memakai roster penuh.
  var mFull = mAll;
  var qEl = document.getElementById(source==='mob'?'rSearchM':'rSearch');
  var q = qEl ? qEl.value.trim().toLowerCase() : '';
  if(q) mAll = mAll.filter(function(m){ return m.nama.toLowerCase().indexOf(q)>=0; });
  // ── Insight: trend vs bulan lalu (roster penuh) ──
  var _insight = buildRekapInsight(bulan, tahun, sL, mFull);
  var _pm = prevMonthPrefix(bulan, tahun);
  var bulanLbl = BULAN[bulan]+' '+tahun;
  [{id:'rekapStats',mob:false},{id:'rekapStatsM',mob:true}].forEach(function(o){
    var el = document.getElementById(o.id); if(!el) return;
    if(!sL.length){ el.innerHTML='<div class="ndash-empty">Belum ada sesi absensi sama sekali.</div>'; return; }
    el.innerHTML = rekapCardsHtml(_rsAvg, sL.length, _rsH, _rsI, _rsA, bulanLbl, o.mob, _insight.trend, _pm);
  });

  // Label periode + pil sesi + footer matriks
  var perEl = document.getElementById('rekap-periode-lbl');
  if(perEl) perEl.textContent = sL.length ? ('Bulan '+BULAN[bulan]+' - Berjalan') : 'Belum Ada Data';
  ['rekap-sesi-pill','rekap-sesi-pill-m'].forEach(function(id){
    var el=document.getElementById(id); if(el) el.textContent = sL.length+' Sesi';
  });
  var footTxt = sL.length ? ('Menampilkan <b>'+mAll.length+'</b> Generus Terdaftar') : 'Belum ada data pada periode ini';
  var fp=document.getElementById('rekap-foot-pc'); if(fp) fp.innerHTML=footTxt;
  var fm=document.getElementById('rekap-foot-m');
  if(fm) fm.innerHTML = sL.length
    ? '<span class="rekap-tag rekap-tag-grey">Menampilkan <b>'+mAll.length+'</b> Generus</span>'
    : footTxt;
  // Sinkron segmen gender + sort visible
  syncRekapSeg(rg);
  var sv=document.getElementById('rSortV'); if(sv) sv.value=sortVal;

  // Table header + body — dibangun dari builder murni (sumber tunggal
  // dengan exportPrint) sehingga selalu sinkron dengan sL/mAll yang dipakai.
  ['theadRekap','theadRekapM'].forEach(function(id){
    var el = document.getElementById(id); if(!el) return;
    el.innerHTML = sL.length ? rekapTheadHtml(sL) : '';
  });
  ['tbodyRekap','tbodyRekapM'].forEach(function(id){
    var el = document.getElementById(id); if(!el) return;
    el.innerHTML = rekapTbodyHtml(sL, mAll, rg);
  });

  // Chart (roster penuh, tidak ikut filter cari)
  renderRekapChart(sL, mFull, bulan, tahun);

  // Section Keterangan Izin dihapus — alasan izin tampil inline di sel
  // tabel (di bawah badge kuning). Container dikosongkan (CSS :empty
  // menyembunyikannya otomatis).
  ['izinSheet','izinSheetM'].forEach(function(id){
    var el = document.getElementById(id); if(!el) return;
    el.innerHTML = '';
  });
}

// Ambil alasan izin anggota di satu sesi ('' bila tidak ada / sama dengan
// nama kegiatan — sama aturan mainnya dengan section izin yang lama).
function rekapNote(nama, t){
  var rec = ((sesiData[t]||{})[nama]||{});
  var note = rec.catatan || '';
  if(note === (sesiKet[t]||'')) note = '';
  return note;
}

// ── BUILDER TABEL & IZIN (sumber tunggal layar + print) ──
// Fungsi murni dari (sL, mAll, rg): dipakai renderRekap untuk layar dan
// exportPrint untuk cetak, sehingga hasil print selalu sinkron dengan
// periode yang dipilih di Export (bukan filter halaman Rekap).
// ── % BULAN LALU + PANAH TREN (per anggota, di samping kolom %) ──
// prevKeys diturunkan dari sesi pertama sL (bulan kalender sebelumnya),
// konsisten dengan rekapTrendForRange. Denominator = jumlah sesi bulan lalu
// (sama cara hitungnya dengan % bulan berjalan = h/sL.length).
function prevKeysFor(sL){
  try {
    if(!sL || !sL.length) return [];
    var dk = tglDate(sL[0]);
    var y = parseInt(dk.slice(0, 4), 10), m = parseInt(dk.slice(5, 7), 10);
    var pm = prevMonthPrefix(m, y);
    return Object.keys(sesiData).filter(function(t){ return t.startsWith(pm.prefix); }).sort();
  } catch(e){ return []; }
}
// null = tidak ada data bulan lalu (anggota baru / bulan lalu kosong).
function memberPrevPct(nama, prevKeys){
  if(!prevKeys || !prevKeys.length) return null;
  var hasAny = prevKeys.some(function(t){
    if(((sesiData[t] || {})[nama])) return true;
    var rs = sesiRoster[t] || [];
    for(var i = 0; i < rs.length; i++){ if(rs[i] && rs[i].nama === nama) return true; }
    return false;
  });
  if(!hasAny) return null;
  var h = 0;
  prevKeys.forEach(function(t){
    var v = (((sesiData[t] || {})[nama] || {}).status || '');
    if(v === 'H') h++;
  });
  return Math.round(h / prevKeys.length * 100);
}
// Sel "bulan lalu": angka % polos (panah tren ada di kolom % berjalan).
function laluCellHtml(prev){
  if(prev === null || prev === undefined)
    return '<td style="color:var(--text3)">—</td>';
  return '<td style="font-weight:500" title="Bulan lalu ' + prev + '%">' + prev + '%</td>';
}
// Panah kecil di samping % berjalan: ▲ hijau naik, ▼ merah turun (vs bulan lalu).
function trenArrowHtml(prev, cur){
  if(prev === null || prev === undefined) return '';
  var d = cur - prev, arrow, color, title;
  if(d > 0){ arrow = '▲'; color = 'var(--green)'; title = 'Naik +' + d + '% vs bulan lalu (' + prev + '%)'; }
  else if(d < 0){ arrow = '▼'; color = 'var(--red)'; title = 'Turun ' + d + '% vs bulan lalu (' + prev + '%)'; }
  else return '';
  return ' <span style="color:' + color + ';font-size:9px" title="' + title + '">' + arrow + '</span>';
}

function rekapTheadHtml(sL){
  if(!sL.length) return '';
  var hd='<tr><th class="rx-no">No</th><th class="rx-nama">Nama</th>';
  sL.forEach(function(t){
    var d=new Date(tglDate(t)+'T00:00:00');
    var tip=d.getDate()+'/'+(d.getMonth()+1)+'/'+d.getFullYear()+' • '+HARI[d.getDay()]+(sesiKet[t]?' • '+sesiKet[t]:'');
    hd+='<th title="'+escHtml(tip)+'">'+d.getDate()+'</th>';
  });
  hd+='<th>H</th><th>I</th><th>A</th><th>%</th><th title="Persentase bulan lalu (panah tren ada di kolom %)">Bulan Lalu</th></tr>';
  var kg='<tr style="background:var(--gold-xlt)"><td style="font-size:9px;color:var(--text3);font-weight:500;letter-spacing:.3px;text-transform:uppercase">Keg.</td><td style="text-align:left;font-size:9px;color:var(--text3)">—</td>';
  sL.forEach(function(t){
    var ket=sesiKet[t]||'';
    kg+='<td style="font-size:9px;color:var(--gold-dk);font-weight:500;max-width:80px;overflow:hidden;text-overflow:ellipsis" title="'+ket.replace(/"/g,'&quot;')+'">'+
      (ket.length>8?ket.substring(0,7)+'…':ket||'—')+'</td>';
  });
  kg+='<td colspan="5" style="background:var(--gold-xlt)"></td></tr>';
  return hd+kg;
}

function rekapTbodyHtml(sL, mAll, rg){
  if(!sL.length) return '<tr><td colspan="'+(7+sL.length)+'" class="empty">Belum ada data.</td></tr>';
  var bd='';
  var noCount=0;
  var cab = (typeof isCaberawit === 'function') ? isCaberawit() : false;
  var _prevKeys = prevKeysFor(sL);
  function rowHtml(m){
    noCount++;
    var h=0,iz=0,al=0,cells='';
    sL.forEach(function(t){
      var v=((sesiData[t]||{})[m.nama]||{}).status||'';
      if(v==='H'){     cells+='<td><span class="badge bh">H</span></td>'; h++;  }
      else if(v==='I'){
        var _nt=rekapNote(m.nama, t);
        cells+='<td><span class="badge bi">I</span>'+
          (_nt?'<div class="iz-alasan" title="'+escHtml(_nt)+'">'+escHtml(_nt)+'</div>':'')+'</td>';
        iz++;
      }
      else if(v==='A'){cells+='<td><span class="badge ba">A</span></td>'; al++; }
      else cells+='<td style="color:var(--border)">—</td>';
    });
    var pct=sL.length?Math.round(h/sL.length*100):0;
    var pc=pct>=80?'var(--green)':pct>=60?'var(--amber)':'var(--red)';
    var namaCell = escHtml(m.nama);
    var _prev = memberPrevPct(m.nama, _prevKeys);
    return '<tr><td>'+noCount+'</td><td class="tl">'+namaCell+'</td>'+cells+
      '<td style="color:var(--green);font-weight:500">'+h+'</td>'+
      '<td style="color:var(--amber)">'+iz+'</td><td style="color:var(--red)">'+al+'</td>'+
      '<td style="color:'+pc+';font-weight:500">'+pct+'%'+trenArrowHtml(_prev, pct)+'</td>'+
      laluCellHtml(_prev)+'</tr>';
  }
  // ── CABERAWIT: URUT per kelas (PAUD → Tilawati 1..6 → Al-Quran) ──
  // Filter gender (rg) tetap dihormati di dalam tiap kelas.
  if(cab){
    var groups = groupByKelas(mAll);
    groups.forEach(function(g){
      bd += '<tr class="gender-sep kelas-sep-row"><td colspan="'+(7+sL.length)+'">'+escHtml(kelasLabel(g.kelas))+' • '+g.items.length+' anak</td></tr>';
      g.items.forEach(function(m){ bd += rowHtml(m); });
    });
    return bd;
  }
  function renderRows(arr, genderLabel, sepClass){
    if(!arr.length) return;
    if(rg==='S'){
      var _sepLbl = genderLabel==='P' ? 'Perempuan' : genderLabel==='L' ? 'Laki-laki' : 'Data Lama';
      bd+='<tr class="gender-sep '+sepClass+'"><td colspan="'+(7+sL.length)+'">'+_sepLbl+'</td></tr>';
    }
    arr.forEach(function(m){
      noCount++;
      var h=0,iz=0,al=0,cells='';
      sL.forEach(function(t){
        var v=((sesiData[t]||{})[m.nama]||{}).status||'';
        if(v==='H'){     cells+='<td><span class="badge bh">H</span></td>'; h++;  }
        else if(v==='I'){
          var _nt=rekapNote(m.nama, t);
          cells+='<td><span class="badge bi">I</span>'+
            (_nt?'<div class="iz-alasan" title="'+escHtml(_nt)+'">'+escHtml(_nt)+'</div>':'')+'</td>';
          iz++;
        }
        else if(v==='A'){cells+='<td><span class="badge ba">A</span></td>'; al++; }
        else cells+='<td style="color:var(--border)">—</td>';
      });
      var pct=sL.length?Math.round(h/sL.length*100):0;
      var pc=pct>=80?'var(--green)':pct>=60?'var(--amber)':'var(--red)';
      var _prev2 = memberPrevPct(m.nama, _prevKeys);
      bd+='<tr><td>'+noCount+'</td><td class="tl">'+escHtml(m.nama)+'</td>'+cells+
        '<td style="color:var(--green);font-weight:500">'+h+'</td>'+
        '<td style="color:var(--amber)">'+iz+'</td><td style="color:var(--red)">'+al+'</td>'+
        '<td style="color:'+pc+';font-weight:500">'+pct+'%'+trenArrowHtml(_prev2, pct)+'</td>'+
        laluCellHtml(_prev2)+'</tr>';
    });
  }
  if(rg==='S'){
    renderRows(mAll.filter(function(m){return m.gender==='P';}),'P','gender-sep-p');
    renderRows(mAll.filter(function(m){return m.gender==='L';}),'L','gender-sep-l');
    renderRows(mAll.filter(function(m){return m.gender!=='P'&&m.gender!=='L';}),'X','gender-sep-x');
  } else {
    renderRows(mAll, rg, rg==='P'?'gender-sep-p':'gender-sep-l');
  }
  return bd;
}

// ── SUMBER TUNGGAL ANGKA REKAP (web = excel/csv/print) ──
// Semua tampilan & export WAJIB pakai helper ini supaya angka selalu sama.
// Stats dihitung dari roster penuh (tidak ikut filter cari nama).
function rekapComputeStats(sL, mAll){
  var h=0, iz=0, al=0;
  mAll.forEach(function(m){ sL.forEach(function(t){
    var v=((sesiData[t]||{})[m.nama]||{}).status||'';
    if(v==='H')h++; else if(v==='I')iz++; else if(v==='A')al++;
  });});
  var tot=mAll.length*sL.length;
  return {nSesi:sL.length, nGenerus:mAll.length, h:h, iz:iz, al:al,
    tot:tot, avg: tot?Math.round(h/tot*100):0};
}

// Trend untuk rentang custom (export): bandingkan avg rentang vs
// bulan kalender sebelum sesi pertama. Kembalian {trend, pm, prev}.
function rekapTrendForRange(sL, avg){
  try{
    if(!sL.length) return {trend:null, pm:null, prev:null};
    var f=sL[0].split('_')[0].split('-');
    var pm=prevMonthPrefix(parseInt(f[1],10), parseInt(f[0],10));
    var prev=calcMonthAvg(pm.prefix);
    if(!prev.nSesi) return {trend:null, pm:pm, prev:prev};
    var delta=avg-prev.avg;
    return {trend:{avg:prev.avg, delta:delta,
      dir:delta>0?'naik':delta<0?'turun':'stabil'}, pm:pm, prev:prev};
  }catch(e){ return {trend:null, pm:null, prev:null}; }
}
// Daftar anggota untuk satu rentang sesi TANPA join ke koleksi terkini:
// gabungan roster snapshot sesi + nama-nama entri (arsip/hapus/ubah-gender
// tetap muncul apa adanya). Gender: roster > snapshot entri > anggota kini.
// Kelas (Caberawit): roster > snapshot entri > anggota kini, dinormalisasi.
function rekapRoster(sL){
  var map = {};
  function put(nama, gender, kelas){
    if(!nama) return;
    if(!map[nama]) map[nama] = {gender: gender || '?', kelas: kelas || ''};
    else {
      if((!map[nama].gender || map[nama].gender === '?') && gender) map[nama].gender = gender;
      if(!map[nama].kelas && kelas) map[nama].kelas = kelas;
    }
  }
  sL.forEach(function(t){
    (sesiRoster[t]||[]).forEach(function(r){ put(r.nama, r.gender, (r.kelas||'')); });
    var s = sesiData[t]||{};
    Object.keys(s).forEach(function(nm){ put(nm, (s[nm]||{}).gender || memberGenderNow(nm), (s[nm]||{}).kelas || memberKelasNow(nm)); });
  });
  function arr(g){
    return Object.keys(map).filter(function(n){ return map[n].gender===g; })
      .sort(function(a,b){
        try {
          if((typeof isCaberawit === 'function') && isCaberawit()){
            var ka = kelasIndex(map[a].kelas), kb = kelasIndex(map[b].kelas);
            if(ka !== kb) return ka - kb;
          }
        } catch(e){}
        return a.localeCompare(b);
      })
      .map(function(n){ return {nama:n, gender:g, kelas:map[n].kelas||''}; });
  }
  return {P:arr('P'), L:arr('L'), X:arr('?')};
}

// Rata-rata kehadiran satu bulan (prefix 'YYYY-MM') untuk trend vs bulan lalu.
// Roster bulan itu dibangun sendiri (anti join) — tidak memakai mAll bulan lain.
function calcMonthAvg(prefix){
  var keys = Object.keys(sesiData).filter(function(t){ return t.startsWith(prefix); });
  var rr = rekapRoster(keys);
  var mAll = rr.P.concat(rr.L).concat(rr.X);
  if(!keys.length || !mAll.length) return {avg:0, h:0, tot:0, nSesi:keys.length};
  var h=0, tot=mAll.length*keys.length;
  mAll.forEach(function(m){ keys.forEach(function(t){
    var v=((sesiData[t]||{})[m.nama]||{}).status||'';
    if(v==='H') h++;
  });});
  return {avg: tot?Math.round(h/tot*100):0, h:h, tot:tot, nSesi:keys.length};
}

function prevMonthPrefix(bulan, tahun){
  var b=bulan-1, t=tahun;
  if(b<1){ b=12; t--; }
  return {prefix: t+'-'+String(b).padStart(2,'0'), bulan:b, tahun:t};
}

function buildRekapInsight(bulan, tahun, sL, mAll){
  if(!sL.length || !mAll.length) return {html:'', trend:null, avg:0};
  var tot=mAll.length*sL.length, hTot=0;
  mAll.forEach(function(m){ sL.forEach(function(t){
    if((((sesiData[t]||{})[m.nama]||{}).status||'')==='H') hTot++;
  });});
  var avg=tot?Math.round(hTot/tot*100):0;
  var pm=prevMonthPrefix(bulan, tahun);
  var prev=calcMonthAvg(pm.prefix);
  var trend=null;
  if(prev.nSesi>0){
    var delta=avg-prev.avg;
    trend={avg:prev.avg, delta:delta, dir:delta>0?'naik':delta<0?'turun':'stabil'};
  }
  return {html: insightHtml(trend, pm, avg, BULAN[bulan]), trend:trend, avg:avg};
}


// Layout ala mockup: 1 kartu sorotan besar (kiri) + 4 mini card (kanan).
// trend: {avg, delta, dir} atau null bila bulan lalu belum ada data.
function rekapCardsHtml(avg, nSesi, h, iz, al, bulanLbl, isMob, trend, pm){
  var trendBadge, prevLbl;
  if(!trend){
    trendBadge = '<span class="rk-delta rk-delta-none">Data bulan pertama</span>';
    prevLbl = 'Belum ada data bulan lalu';
  } else if(trend.dir==='naik'){
    trendBadge = '<span class="rk-delta rk-delta-up">↑ +'+trend.delta+'% Naik</span>';
    prevLbl = 'Bulan lalu: '+trend.avg+'%';
  } else if(trend.dir==='turun'){
    trendBadge = '<span class="rk-delta rk-delta-down">↓ '+trend.delta+'% Turun</span>';
    prevLbl = 'Bulan lalu: '+trend.avg+'%';
  } else {
    trendBadge = '<span class="rk-delta rk-delta-flat">＝ Stabil</span>';
    prevLbl = 'Bulan lalu: '+trend.avg+'%';
  }
  function mini(tone, icon, title, num, numCls, pill, sub){
    return '<div class="rk-mini '+tone+'">'+
      '<div class="rk-mini-top"><span class="rk-mini-title">'+title+'</span>'+
      '<span class="rk-mini-ic"><span class="msym" style="font-size:16px">'+icon+'</span></span></div>'+
      '<div class="rk-mini-main"><span class="rk-mini-num '+numCls+'">'+num+'</span>'+
      '<span class="rk-pill '+tone+'">'+pill+'</span></div>'+
      '<p class="rk-mini-sub">'+sub+'</p></div>';
  }
  return '<div class="rk-summary">'+
    '<div class="rk-hero">'+
      '<div><span class="rk-spot"><i></i>Sorotan Utama</span>'+
      '<h3 class="rk-hero-lbl">Rasio Kehadiran Generus</h3></div>'+
      '<div class="rk-hero-big"><span class="rk-hero-num">'+avg+'%</span>'+
      '<span class="rk-hero-side">'+trendBadge+'<span class="rk-hero-prev">'+prevLbl+'</span></span></div>'+
      '<div class="rk-hero-foot"><span class="rk-hero-month"><i></i>'+escHtml(bulanLbl)+'</span>'+
      '<span class="rk-hero-note">Evaluasi kehadiran</span></div>'+
    '</div>'+
    '<div class="rk-minis">'+
      mini('tone-stone','calendar_month','Total Pertemuan', nSesi,'', nSesi+' Sesi Berjalan','Kegiatan tuntas')+
      mini('tone-green','check','Total Hadir (H)', h,'green', h+' Orang-Sesi','Presensi tepat waktu')+
      mini('tone-amber','info','Total Izin (I)', iz,'amber', iz+' Tercatat','Sesi terkonfirmasi')+
      mini('tone-red','close','Total Alfa (A)', al,'red', al+' Perlu Tindak','Tanpa konfirmasi')+
    '</div>'+
  '</div>';
}

function insightHtml(trend, pm, avg, curLbl){
  var right, mid;
  if(!trend){
    mid = 'Belum ada data bulan lalu untuk perbandingan.';
    right = '';
  } else {
    var naik = trend.dir==='naik', turun = trend.dir==='turun';
    var dlbl = (trend.delta>0?'+':'')+trend.delta+'%';
    var dic = naik?'trending_up':turun?'trending_down':'remove';
    mid = 'Rasio Kehadiran generus '+(naik?'naik':turun?'turun':'stabil')+' dibanding bulan lalu: '+
      '<span class="rekap-delta'+(turun?' down':'')+'">↓ '+dlbl+'</span>';
    right = BULAN[pm.bulan]+': <b>'+trend.avg+'%</b> → '+escHtml(curLbl)+': <b>'+avg+'%</b>';
  }
  var ic = (!trend||trend.dir==='turun') ? 'trending_down' : (trend.dir==='naik' ? 'trending_up' : 'remove');
  var icBg = (!trend||trend.dir==='turun') ? '#fee2e2' : '#ebf5f0';
  var icFg = (!trend||trend.dir==='turun') ? '#ba1a1a' : '#2d6a4f';
  return '<div class="rekap-insight">'+
    '<span class="rekap-insight-ic" style="background:'+icBg+';color:'+icFg+'"><span class="msym" style="font-size:17px">'+ic+'</span></span>'+
    '<span class="rekap-insight-title">Insight Bulan Ini</span>'+
    '<span>'+mid+'</span>'+
    (right?'<span class="rekap-prev">'+right+'</span>':'')+
  '</div>';
}

// Segmen gender (tombol) <-> select tersembunyi.
function rekapSetGender(which, g){
  var id = which==='mob' ? 'rGenderM' : 'rGender';
  var el = document.getElementById(id);
  if(el) el.value = g;
  renderRekap(which);
}
function syncRekapSeg(rg){
  ['rSegPc','rSegM'].forEach(function(id){
    var seg = document.getElementById(id); if(!seg) return;
    var btns = seg.querySelectorAll('button');
    btns.forEach(function(b){
      if(b.classList) b.classList.toggle('on', b.getAttribute('data-g')===rg);
    });
  });
}


function renderRekapChart(sL, mAll, bulan, tahun){
  var perSesi = buildPerSesi(sL, mAll);
  if(!perSesi.length){
    ['rekapChart','rekapChartM'].forEach(function(id){
      var el = document.getElementById(id);
      if(el) el.innerHTML = '';
    });
    return;
  }
  var svg = buildBarSvg(perSesi, mAll.length);
  ['rekapChart','rekapChartM'].forEach(function(id,i){
    var el = document.getElementById(id);
    if(!el){
      el = document.createElement('div');
      el.id = id;
      el.className = 'rekap-chart-card-lux';
      var ref = document.getElementById(i===0?'rekapStats':'rekapStatsM');
      if(ref && ref.parentNode) ref.parentNode.insertBefore(el, ref.nextSibling);
    }
    el.className = 'rekap-chart-card-lux';
    el.innerHTML = '<div class="rekap-chart-hd-lux"><div><h3>GRAFIK KEHADIRAN PER PERTEMUAN</h3>'+
      '<p>Komparasi jumlah Hadir, Izin, dan Alfa pada '+perSesi.length+' sesi kegiatan bulan '+BULAN[bulan]+'</p></div>'+
      '<div class="rekap-legend-pills"><span><i style="background:#2d6a4f"></i>Hadir</span><span><i style="background:#b45309"></i>Izin</span><span><i style="background:#ba1a1a"></i>Alfa</span></div></div>'+
      '<div class="rekap-chart-body" style="padding:14px 16px 6px;overflow-x:auto">'+svg+'</div>'+
      '<div class="rc-legend-row" style="padding:8px 16px 14px;border-top:1px solid #e8e6df;margin-top:4px">'+
        '<span class="rc-axis">↑ Jumlah Presensi Generus</span>'+
        '<span class="rc-axis" style="margin-left:auto">→ Tanggal Pertemuan Kegiatan ('+BULAN[bulan]+' '+tahun+')</span>'+
      '</div>';
  });
}

// Baris keterangan grafik (arah sumbu + warna) — satu baris rapi di BAWAH grafik,
// dipakai bareng oleh tampilan layar (renderRekapChart) & cetak (exportPrint).
function chartLegendHtml(){
  return '<div class="rc-legend-row">'+
    '<span class="rc-axis">↑ Jumlah</span>'+
    '<span class="rc-axis">→ Tanggal Kegiatan</span>'+
    '<span class="rc-legend">'+
      '<span class="rc-dot" style="background:#2d6a4f"></span>Hadir'+
      '<span class="rc-dot" style="background:#b45309"></span>Izin'+
      '<span class="rc-dot" style="background:#ba1a1a"></span>Alfa'+
    '</span>'+
  '</div>';
}

// Hitung data per-sesi (jumlah Hadir/Izin/Alfa tiap pertemuan) untuk grafik.
// Dipakai bareng oleh tampilan layar (renderRekapChart) & cetak (exportPrint).
function buildPerSesi(sL, mAll){
  return sL.map(function(t){
    var h = 0, iz = 0, al = 0;
    mAll.forEach(function(m){
      var v = ((sesiData[t]||{})[m.nama]||{}).status||'';
      if(v==='H') h++; else if(v==='I') iz++; else if(v==='A') al++;
    });
    var dt = tglDate(t).split('-');
    var day = parseInt(dt[2],10) || 0;
    var ket = sesiKet[t]||'';
    return { day:day, ket:ket, label: ket ? ket.substring(0,8) : String(day), h:h, iz:iz, al:al };
  });
}


function buildBarSvg(perSesi, totalMembers){
  var n=perSesi.length;
  var barW=16, gap=3, groupGap=26;
  var groupW=barW*3+gap*2+groupGap;
  var padL=30, padR=12, padT=16, padB=30;
  var W=padL+n*groupW+padR;
  var H=padT+90+padB;
  var chartH=H-padT-padB;
  var rawMax=Math.max(1, totalMembers);
  perSesi.forEach(function(s){ rawMax=Math.max(rawMax, s.h, s.iz, s.al); });

  // Sumbu jumlah (atas) hanya pakai kelipatan 5 (0, 5, 10, 15, ...)
  var step=5;
  var maxVal=Math.ceil(rawMax/step)*step || step;
  while(maxVal/step > 6){ step+=5; maxVal=Math.ceil(rawMax/step)*step; }

  var yLines='', bars='', labels='';
  for(var v=0; v<=maxVal; v+=step){
    var y=padT+chartH*(1-v/maxVal);
    yLines+='<line x1="'+padL+'" y1="'+y.toFixed(1)+'" x2="'+(W-padR)+'" y2="'+y.toFixed(1)+'" stroke="#e8e6df" stroke-width="0.8" stroke-dasharray="2 3"/>';
    yLines+='<text x="'+(padL-5)+'" y="'+(y+3.5).toFixed(1)+'" text-anchor="end" font-size="8" fill="#717973">'+v+'</text>';
  }
  perSesi.forEach(function(s,i){
    var gx=padL+i*groupW;
    var cx=gx+groupW/2;
    var vals=[s.h,s.iz,s.al];
    var cols=['#2d6a4f','#b45309','#ba1a1a'];
    var totalBarW=barW*3+gap*2;
    var startX=gx+(groupW-totalBarW)/2;
    vals.forEach(function(v,ki){
      if(!v) return;
      var bh=Math.max(3,(v/maxVal)*chartH);
      var by=padT+chartH-bh;
      var bx=startX+ki*(barW+gap);
      bars+='<rect x="'+bx.toFixed(1)+'" y="'+by.toFixed(1)+'" width="'+barW+'" height="'+bh.toFixed(1)+'" fill="'+cols[ki]+'" rx="3"/>';
      bars+='<text x="'+(bx+barW/2).toFixed(1)+'" y="'+(by-4).toFixed(1)+'" text-anchor="middle" font-size="8" fill="'+cols[ki]+'" font-weight="600">'+v+'</text>';
    });
    labels+='<text x="'+cx.toFixed(1)+'" y="'+(H-9)+'" text-anchor="middle" font-size="9" fill="#4b5563">'+
      '<title>'+(s.ket?escHtml(s.ket):('Sesi '+(i+1)))+' · '+s.day+'</title>'+(s.day? s.day : 'P'+ (i+1))+'</text>';
  });
  // Ukuran fiks (bukan diregangkan ke lebar container) & mulai dari kiri,
  // supaya rapi walau datanya sedikit (mis. cuma 3 pertemuan).
  return '<svg width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'" style="display:block">'+
    yLines+bars+labels+'</svg>';
}

function getExportData(){
  var gEl=document.getElementById('rGender')||document.getElementById('rGenderM');
  var rg=gEl?gEl.value:'S';
  var _rg=(typeof resolveExRange==='function')?resolveExRange('rekap')
    :{dari:_exVal('exRekapDari','exRekapDariM'),sampai:_exVal('exRekapSampai','exRekapSampaiM')};
  var cDari=_rg.dari||'', cSampai=_rg.sampai||'';
  var dariDate=cDari?cDari:'0000-01-01';
  var sampaiDate=cSampai?cSampai:'9999-12-31';
  if(dariDate>sampaiDate){ var tmp=dariDate;dariDate=sampaiDate;sampaiDate=tmp; }
  var sL=Object.keys(sesiData).filter(function(t){
    var dk=tglDate(t);
    return dk>=dariDate && dk<=sampaiDate;
  }).sort();
  var sVal=((document.getElementById('rSort')||{}).value||'' ) || ((document.getElementById('rSortM')||{}).value||'asc');
  if(sVal==='desc') sL.reverse();
  var _rr=rekapRoster(sL);
  var mAll=rg==='S'?_rr.P.concat(_rr.L).concat(_rr.X):(rg==='P'?_rr.P:_rr.L);
  return {sL:sL,mAll:mAll,rg:rg,customDari:cDari,customSampai:cSampai};
}

function buildRekapRows(sL, mAll){
  var cab = (typeof isCaberawit === 'function') ? isCaberawit() : false;
  // Urutan baris export = urutan tampil di layar (per kelas utk Caberawit).
  var ordered = mAll.slice();
  try {
    if(cab && typeof sortByKelasNama === 'function'){
      ordered.sort(function(a,b){
        var ka = kelasIndex(a.kelas), kb = kelasIndex(b.kelas);
        if(ka !== kb) return ka - kb;
        return String(a.nama||'').localeCompare(String(b.nama||''));
      });
    }
  } catch(e){}
  var thirdCol = cab ? 'Kelas' : 'Gender';
  var _prevKeys = prevKeysFor(sL);
  var ketRow=['','Kegiatan',''].concat(sL.map(function(t){ return sesiKet[t]||''; })).concat(['','','','','']);
  if(cab) ketRow = ['','Kegiatan',''].concat(sL.map(function(t){ return sesiKet[t]||''; })).concat(['','','','','']);
  var hdrs=['No','Nama',thirdCol].concat(sL.map(function(t){
    var d=new Date(tglDate(t)+'T00:00:00');
    return d.getDate()+'/'+(d.getMonth()+1)+'/'+d.getFullYear();
  })).concat(['Hadir','Izin','Alfa','% Hadir','% Bulan Lalu']);
  var rows=[ketRow,hdrs];
  var lastKelas = null;
  ordered.forEach(function(m,i){
    var h=0,iz=0,al=0;
    var cells=sL.map(function(t){
      var v=((sesiData[t]||{})[m.nama]||{}).status||'';
      if(v==='H') h++; else if(v==='I') iz++; else if(v==='A') al++;
      if(v==='I'){
        var _nt=rekapNote(m.nama, t);
        return _nt?('I ('+_nt+')'):'I';
      }
      return v||'-';
    });
    var pct=sL.length?Math.round(h/sL.length*100):0;
    var prev=memberPrevPct(m.nama, _prevKeys);
    var prevTxt=(prev===null||prev===undefined)?'-':(prev+'%'+(prev<pct?' (naik)':prev>pct?' (turun)':' (stabil)'));
    var third = cab ? (m.kelas||'Tanpa Kelas') : (m.gender==='P'?'Perempuan':m.gender==='L'?'Laki-laki':'Riwayat');
    if(cab){
      var kk = m.kelas || '';
      if(kk !== lastKelas){
        lastKelas = kk;
        rows.push(['', ('KELAS: ' + kelasLabel(kk)).toUpperCase(), ''].concat(sL.map(function(){return '';})).concat(['','','','','']));
      }
    }
    rows.push([rows.length - 1,m.nama,third].concat(cells).concat([h,iz,al,pct+'%',prevTxt]));
  });
  // Nomor ulang (baris separator kelas tidak dihitung)
  var no = 0;
  rows.forEach(function(r){
    if(r.length >= 4 && typeof r[0] === 'number'){ no++; r[0] = no; }
  });
  return rows;
}

// ── DATA KAS PER RENTANG (untuk export gabungan rekap+kas) ──
// Menghitung saldo awal/akhir + total masuk/keluar dari kasTransaksi
// memakai rentang tanggal yang sama dengan export rekap.
function getKasPeriodData(dariDate, sampaiDate){
  var run = (typeof kasCalcRunning==='function') ? kasCalcRunning() : [];
  var saldoAwal = (typeof kasSaldoAwal!=='undefined') ? kasSaldoAwal : 0;
  for(var i=0;i<run.length;i++){
    if(run[i].trx.tanggal<dariDate) saldoAwal=run[i].saldo;
  }
  var items = run.filter(function(it){ return it.trx.tanggal>=dariDate && it.trx.tanggal<=sampaiDate; });
  var masuk=0, keluar=0;
  items.forEach(function(it){
    if(it.trx.jenis==='pemasukan') masuk+=it.trx.nominal; else keluar+=it.trx.nominal;
  });
  return {items:items, masuk:masuk, keluar:keluar,
    selisih: masuk-keluar, saldoAwal:saldoAwal, saldoAkhir:saldoAwal+(masuk-keluar)};
}

function buildKasRows(kas){
  var rows=[['Tanggal','Keterangan','Masuk','Keluar','Saldo']];
  rows.push(['Saldo Awal','','','',kas.saldoAwal]);
  kas.items.forEach(function(it){
    var trx=it.trx;
    rows.push([trx.tanggal, trx.keterangan||'',
      trx.jenis==='pemasukan'?trx.nominal:'',
      trx.jenis==='pengeluaran'?trx.nominal:'', it.saldo]);
  });
  rows.push(['TOTAL','',kas.masuk,kas.keluar,kas.saldoAkhir]);
  return rows;
}

// ── BARIS STATISTIK untuk Excel/CSV — label disamakan dengan kotak web ──
function buildInsightRows(sL, mAll){
  var rows=[['RINGKASAN KEHADIRAN (sama dengan tampilan web)']];
  if(!sL.length) return rows;
  var st=rekapComputeStats(sL, mAll);
  rows.push(['Rasio Kehadiran Generus', st.avg+'%']);
  rows.push(['Total Pertemuan', st.nSesi+' Sesi']);
  rows.push(['Total Hadir (H)', st.h+' Orang-Sesi']);
  rows.push(['Total Izin (I)', st.iz+' Tercatat']);
  rows.push(['Total Alfa (A)', st.al+' Perlu Tindak']);
  rows.push(['Generus Terdaftar', st.nGenerus]);
  // Trend vs bulan kalender sebelum sesi pertama (sama dengan print)
  var tr=rekapTrendForRange(sL, st.avg);
  if(tr.trend){
    var arah=tr.trend.dir==='naik'?'Naik':tr.trend.dir==='turun'?'Turun':'Stabil';
    rows.push(['Bulan lalu ('+BULAN[tr.pm.bulan]+' '+tr.pm.tahun+')', tr.trend.avg+'%']);
    rows.push(['Selisih vs bulan lalu', (tr.trend.delta>0?'+':'')+tr.trend.delta+'% ('+arah+')']);
  } else {
    rows.push(['Bulan lalu', 'Belum ada data']);
  }
  return rows;
}

function xlNeat(ws, widths, headerRow){
  try{
    ws['!cols']=widths.map(function(w){ return {wch:w}; });
    if(headerRow!=null){
      var last=widths.length-1;
      ws['!autofilter']={s:{r:headerRow,c:0},e:{r:headerRow,c:last}};
      ws['!freeze']='A'+(headerRow+2);
    }
  }catch(e){}
  return ws;
}

function writeRekapExcel(d, o, fname){
  var wb=XLSX.utils.book_new();
  var wsR=XLSX.utils.aoa_to_sheet(buildRekapRows(d.sL,d.mAll));
  xlNeat(wsR, [6,24,12].concat(d.sL.map(function(){return 12;})).concat([8,8,8,10,12]), 1);
  XLSX.utils.book_append_sheet(wb,wsR,'Rekap');
  if(o.stat)
    XLSX.utils.book_append_sheet(wb,xlNeat(XLSX.utils.aoa_to_sheet(buildInsightRows(d.sL,d.mAll)),[28,22]),'Ringkasan');
  if(o.kas){
    var dari=d.customDari||'0000-01-01', sampai=d.customSampai||'9999-12-31';
    XLSX.utils.book_append_sheet(wb,xlNeat(XLSX.utils.aoa_to_sheet(buildKasRows(getKasPeriodData(dari,sampai))),[14,34,14,14,14],0),'Kas');
    if(d.catatan)
      XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([['CATATAN / HASIL MUSYAWARAH'],[d.catatan]]),'Catatan');
  }
  XLSX.writeFile(wb,fname);
}

function exportExcel(){
  var d=getExportData();
  if(!d.sL.length){ appAlert('Belum ada data untuk rentang ini.'); return; }
  var opts=(typeof getRekapExportOpts==='function')?getRekapExportOpts():{insight:true,izin:true};
  writeRekapExcel(d,{stat:opts.insight,kas:!!opts.kas},
    'Rekap_'+(d.customDari||'Awal')+'_s/d_'+(d.customSampai||'Akhir')+'.xlsx');
}

// Export gabungan Rekap Absensi + Kas (data dari popup, via getGabData).
function gabunganExcel(d){
  writeRekapExcel(d,{stat:true,izin:true,kas:true},
    'Gabungan_'+(d.customDari||'Awal')+'_s/d_'+(d.customSampai||'Akhir')+'.xlsx');
}

function buildRekapCSVText(d, o){
  function toCSV(rows){
    return rows.map(function(r){
      return r.map(function(c){ return '"'+String(c).replace(/"/g,'""')+'"'; }).join(',');
    }).join('\n');
  }
  var full=toCSV(buildRekapRows(d.sL,d.mAll));
  if(o.stat) full+='\n\n\nRingkasan Kehadiran (sama dengan tampilan web)\n'+toCSV(buildInsightRows(d.sL,d.mAll));
  if(o.kas){
    var dari=d.customDari||'0000-01-01', sampai=d.customSampai||'9999-12-31';
    full+='\n\n\nRekap Kas ('+(d.customDari||'Awal')+' s/d '+(d.customSampai||'Akhir')+')\n'+toCSV(buildKasRows(getKasPeriodData(dari,sampai)));
    if(d.catatan) full+='\n\n\nCatatan / Hasil Musyawarah\n"'+String(d.catatan).replace(/"/g,'""')+'"';
  }
  return full;
}

function downloadCSVText(full, fname){
  var a=document.createElement('a');
  a.href='data:text/csv;charset=utf-8,\uFEFF'+encodeURIComponent(full);
  a.download=fname;
  a.click();
}

function exportCSV(){
  var d=getExportData();
  if(!d.sL.length){ appAlert('Belum ada data untuk rentang ini.'); return; }
  var opts=(typeof getRekapExportOpts==='function')?getRekapExportOpts():{insight:true,izin:true};
  downloadCSVText(buildRekapCSVText(d,{stat:opts.insight,kas:!!opts.kas}),
    'Rekap_'+(d.customDari||'Awal')+'_s/d_'+(d.customSampai||'Akhir')+'.csv');
}

function gabunganCSV(d){
  downloadCSVText(buildRekapCSVText(d,{stat:true,izin:true,kas:true}),
    'Gabungan_'+(d.customDari||'Awal')+'_s/d_'+(d.customSampai||'Akhir')+'.csv');
}

function exportPrint(){
  var d=getExportData();
  if(!d.sL.length){ appAlert('Belum ada data untuk rentang ini.'); return; }
  var opts=(typeof getRekapExportOpts==='function')?getRekapExportOpts():{insight:true,izin:true};
  printRekapDoc(d,{insight:opts.insight,kas:!!opts.kas});
}

function gabunganPrint(d){
  printRekapDoc(d,{insight:true,izin:true,kas:true});
}

function printRekapDoc(d, o){
  // Tabel & izin DIBANGUN dari data periode export (bukan comot innerHTML
  // layar) supaya sinkron dengan tanggal yang dipilih.
  var tableHtml='<div class="tbl-card"><table><thead>'+rekapTheadHtml(d.sL)+'</thead><tbody>'+rekapTbodyHtml(d.sL,d.mAll,d.rg)+'</tbody></table></div>';
  var periodLabel=(d.customDari||'Awal')+' s/d '+(d.customSampai||'Akhir');

  var st=rekapComputeStats(d.sL, d.mAll);
  var tH=st.h, tI=st.iz, tA=st.al, tot=st.tot, avg=st.avg;
  var avgClr=avg>=80?'#2d6a4f':avg>=60?'#b45309':'#ba1a1a';
  var perSesi=buildPerSesi(d.sL, d.mAll);
  var chartHtml=perSesi.length
    ? '<div class="tbl-card chart-card">'+
        '<div class="chart-card-hd">Grafik Kehadiran per Pertemuan</div>'+
        buildBarSvg(perSesi, d.mAll.length)+
        chartLegendHtml()+
      '</div>'
    : '';
  // ── Ringkasan print = cermin kotak web (hero + 4 mini) ──
  var _tr=rekapTrendForRange(d.sL, avg);
  var _trend=_tr.trend;
  var _badge='Belum ada data bulan lalu', _badgeBg='#f5f3f0', _badgeFg='#717973', _badgeBd='#e8e6df';
  if(_trend){
    if(_trend.dir==='naik'){ _badge='↑ +'+_trend.delta+'% Naik'; _badgeBg='#ebf5f0'; _badgeFg='#1b4332'; _badgeBd='#c1ecd4'; }
    else if(_trend.dir==='turun'){ _badge='↓ '+_trend.delta+'% Turun'; _badgeBg='#fee2e2'; _badgeFg='#ba1a1a'; _badgeBd='#ffdad6'; }
    else { _badge='＝ Stabil'; _badgeBg='#f5f3f0'; _badgeFg='#4b5563'; _badgeBd='#e8e6df'; }
  }
  var _prevLbl=_trend?('Bulan lalu: '+_trend.avg+'%'):'Belum ada data bulan lalu';
  function _pMini(title, num, color, bg, bd, pill){
    return '<div style="background:'+bg+';border:1px solid '+bd+';border-radius:10px;padding:10px 12px;flex:1;min-width:120px">'+
      '<div style="font-size:8px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:#717973">'+title+'</div>'+
      '<div style="display:flex;align-items:baseline;gap:7px;margin-top:6px;flex-wrap:wrap">'+
      '<span style="font-size:22px;font-weight:800;color:'+color+'">'+num+'</span>'+
      '<span style="font-size:8.5px;font-weight:700;background:#ffffff;border:1px solid '+bd+';border-radius:99px;padding:2px 8px;color:'+color+'">'+pill+'</span></div></div>';
  }
  var statHtml=
    '<div class="tbl-card" style="padding:12px 14px;page-break-inside:avoid">'+
      '<div style="display:flex;gap:12px;align-items:stretch;flex-wrap:wrap">'+
        '<div style="flex:1.1;min-width:200px;background:linear-gradient(135deg,#ebf5f0,#fbf9f6);border:1px solid #a5d0b9;border-radius:10px;padding:12px 14px;display:flex;flex-direction:column;justify-content:space-between;gap:8px">'+
          '<div><span style="display:inline-block;background:rgba(167,243,208,.55);color:#1b4332;font-size:8.5px;font-weight:800;border-radius:99px;padding:3px 10px">● Sorotan Utama</span>'+
          '<div style="font-size:8.5px;font-weight:800;letter-spacing:.6px;color:#717973;margin-top:8px">RASIO KEHADIRAN GENERUS</div></div>'+
          '<div style="display:flex;align-items:flex-end;gap:10px;flex-wrap:wrap">'+
            '<span style="font-size:34px;font-weight:800;color:#1b1c1a;line-height:1">'+avg+'%</span>'+
            '<span style="display:flex;flex-direction:column;gap:3px;padding-bottom:3px">'+
              '<span style="font-size:9px;font-weight:800;background:'+_badgeBg+';color:'+_badgeFg+';border:1px solid '+_badgeBd+';border-radius:99px;padding:2px 9px">'+_badge+'</span>'+
              '<span style="font-size:8.5px;color:#9ca3af">'+_prevLbl+'</span>'+
            '</span></div>'+
          '<div style="border-top:1px solid rgba(6,95,70,.2);padding-top:8px;display:flex;justify-content:space-between;font-size:8.5px;color:#717973"><b style="color:#414844">● '+periodLabel+'</b><span>Evaluasi kehadiran</span></div>'+
        '</div>'+
        '<div style="flex:1.6;min-width:260px;display:grid;grid-template-columns:1fr 1fr;gap:8px">'+
          _pMini('Total Pertemuan', d.sL.length, '#1f2937', '#fbf9f6', '#e8e6df', d.sL.length+' Sesi Berjalan')+
          _pMini('Total Hadir (H)', tH, '#2d6a4f', '#ebf5f0', '#c1ecd4', tH+' Orang-Sesi')+
          _pMini('Total Izin (I)', tI, '#b45309', '#fef3c7', '#ffdcbd', tI+' Tercatat')+
          _pMini('Total Alfa (A)', tA, '#ba1a1a', '#fff1f2', '#ffdad6', tA+' Perlu Tindak')+
        '</div>'+
      '</div>'+
    '</div>';
  // ── Insight print sudah menyatu di hero (badge trend) — tidak ada strip terpisah ──
  var insightPrintHtml='';
  // ── Rekap kas print (di bawah rekap) — desain sama persis dengan
  // export kas (kasPrintSectionHtml di kas.js). Catatan musyawarah (bila
  // diisi) tampil di samping kanan tabel, bukan di bawahnya.
  var kasPrintHtml='';
  if(o.kas && typeof kasPrintSectionHtml==='function'){
    var _dari=d.customDari||'0000-01-01', _sampai=d.customSampai||'9999-12-31';
    var _kas=getKasPeriodData(_dari,_sampai);
    kasPrintHtml='<div class="kas-print-page"><h3>Rekap Kas ('+periodLabel+')</h3>'+
      kasPrintSectionHtml(_kas.items,_kas.saldoAwal,_kas.masuk,_kas.keluar,_kas.selisih,_kas.saldoAkhir,d.catatan||'')+'</div>';
  }

  _printWithIframe(
    '<!DOCTYPE html><html><head><meta charset="UTF-8">'+
    '<title>Rekap '+periodLabel+'</title>'+
    '<link rel="preconnect" href="https://fonts.googleapis.com">'+
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'+
    '<link href="https://fonts.googleapis.com/css2?family=Zilla+Slab:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">'+
    '<style>'+
      '*{box-sizing:border-box}'+
      ':root{--green:#2d6a4f;--amber:#b45309;--red:#ba1a1a;--text:#1f2937;--text2:#4b5563;--text3:#717973;--gold:#1b4332;--gold-dk:#1b4332;--gold-lt:#ebf5f0;--gold-xlt:#ebf5f0;--border:#e8e6df}'+
      'body{font-family:"IBM Plex Sans",system-ui,sans-serif;font-size:10.5px;padding:20px;color:#1f2937;background:#fbf9f6;-webkit-print-color-adjust:exact;print-color-adjust:exact}'+
      'h2{font-family:"Zilla Slab",Georgia,serif;font-weight:600;font-size:16px;color:#1f2937;margin:0}'+
      '.subtitle{color:#717973;font-size:10.5px;margin:2px 0 0}'+
      '.print-hd{border-bottom:2px solid #1b4332;padding-bottom:8px;margin-bottom:8px}'+
      'h3{font-family:"Zilla Slab",Georgia,serif;font-weight:600;font-size:13px;color:#1f2937;margin:12px 0 5px;break-after:avoid;page-break-after:avoid}'+
      '.tbl-card{background:#ffffff;border:1px solid #e8e6df;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(28,25,23,.07);margin:0 0 8px;page-break-inside:auto}'+
      '.chart-card{padding:8px 14px 2px;page-break-inside:avoid}'+
      '.chart-card-hd{font-size:10px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:#4b5563;margin-bottom:8px}'+
      '.chart-card svg{display:block;max-width:100%;height:auto}'+
      '.rc-legend-row{display:flex;align-items:center;flex-wrap:wrap;gap:6px 14px;padding:8px 0 10px}'+
      '.rc-axis{font-size:9.5px;color:#717973;font-weight:500}'+
      '.rc-legend{display:flex;align-items:center;gap:4px;font-size:9.5px;color:#4b5563;flex-wrap:wrap;margin-left:auto}'+
      '.rc-legend .rc-dot{width:8px;height:8px;border-radius:2px;display:inline-block;flex-shrink:0;margin-left:8px}'+
      '.rc-legend .rc-dot:first-child{margin-left:0}'+
      '.num{text-align:right}.bold{font-weight:700}.green{color:#2d6a4f}.red{color:#ba1a1a}'+
      '.saldo-awal-row td{background:#ebf5f0}.total-row td{background:#ebf5f0;font-weight:700;border-top:2px solid #1b4332}'+
      '.cf-donut-row{display:flex;gap:12px;margin-bottom:10px;align-items:stretch}.cf-box,.donut-box{background:#ffffff;box-shadow:0 1px 3px rgba(28,25,23,.07)}'+
      '.cf-box{flex:1;border:1px solid #e8e6df;border-radius:12px;overflow:hidden}'+
      '.cf-box-title{font-size:9.5px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:#4b5563;padding:10px 12px;border-bottom:1px solid #e8e6df;background:#fbf9f6}'+
      '.cf-row{display:flex;align-items:center;padding:9px 12px;border-bottom:1px solid #e8e6df;gap:10px;font-size:10.5px}.cf-row:last-child{border-bottom:none}'+
      '.cf-icon{width:22px;height:22px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:11px;flex-shrink:0}.cf-lbl{flex:1;color:#4b5563}.cf-val{font-weight:600}'+
      '.cf-saldo-akhir{display:flex;align-items:center;justify-content:space-between;padding:11px 12px;background:#ebf5f0;border-top:2px solid #1b4332}.cf-sa-lbl{font-size:11px;font-weight:700;color:#1b4332}.cf-sa-val{font-size:15px;font-weight:700;color:#1b4332}'+
      '.donut-box{width:184px;flex-shrink:0;border:1px solid #e8e6df;border-radius:12px;display:flex;flex-direction:column;align-items:center;padding:12px;gap:8px}'+
      '.donut-box-title{font-size:9.5px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:#4b5563;align-self:flex-start;margin-bottom:4px}.donut-legend{width:100%;font-size:10px}'+
      '.donut-leg-row{display:flex;align-items:center;gap:6px;margin-bottom:5px}.donut-dot{width:9px;height:9px;border-radius:2px;flex-shrink:0}.donut-leg-lbl{flex:1;color:#4b5563}.donut-leg-val{font-weight:700;font-size:10px}'+
      '.section-title{font-size:10px;font-weight:700;color:#1f2937;text-transform:uppercase;letter-spacing:.6px;margin-bottom:6px;display:flex;align-items:center;gap:8px}.section-title::after{content:"";flex:1;height:1px;background:#e8e6df}'+
      '.kas-print-page{page-break-before:always;break-before:page}'+
      '.kas-print-page.no-break{page-break-before:auto;break-before:auto}'+
      '.kas-detail-row{display:flex;gap:12px;align-items:stretch}'+
      '.kas-detail-main{flex:1.45;min-width:0}'+
      '.kas-detail-side{flex:1;min-width:0;display:flex;flex-direction:column}'+
      '.catatan-card-side{padding:12px 14px;flex:1}'+
      '.catatan-text{font-size:10.5px;line-height:1.7}'+
      'table{width:100%;border-collapse:collapse;font-size:8.5px}'+
      'th,td{border:1px solid #e8e6df;padding:4px 6px;text-align:center;color:#1f2937;overflow-wrap:break-word}'+
      'th{background:#fbf9f6;color:#4b5563;font-weight:600;font-size:8px;letter-spacing:.2px;text-transform:uppercase}'+
      'td.tl{text-align:left}'+
      'tr.gender-sep td{background:#fbf9f6;color:#4b5563;font-weight:700;text-align:left;font-size:9px;letter-spacing:.5px;text-transform:uppercase}'+
      '.badge{display:inline-block;border-radius:99px;padding:1px 6px;font-size:9px;font-weight:700}'+
      '.bh{background:#ebf5f0;color:#2d6a4f}.bi{background:#fef3c7;color:#b45309}.ba{background:#fee2e2;color:#ba1a1a}'+
      '.iz-alasan{font-size:7px;color:#b45309;line-height:1.25;max-width:60px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin:1px auto 0;font-style:italic}'+
      '@page{size:A4 landscape;margin:10mm}'+
      '@media print{body{background:#ffffff}.tbl-card,.chart-card{box-shadow:none}}'+
    '</style></head><body>'+
    '<div class="print-hd"><h2>Rekap Absensi '+((currentGroupInfo && currentGroupInfo.displayName) || 'Muda-Mudi')+' Margosari</h2><div class="subtitle">'+periodLabel+'</div></div>'+
    statHtml+insightPrintHtml+chartHtml+'<h3>Tabel Rekap</h3>'+tableHtml+kasPrintHtml+
    '</body></html>'
  );
}
