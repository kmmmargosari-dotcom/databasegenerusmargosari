// ══════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════

function renderDashboard(){
  var now      = new Date();
  var curMonth = String(now.getMonth()+1).padStart(2,'0');
  var curYear  = String(now.getFullYear());
  var prefix   = curYear+'-'+curMonth;

  var monthKeys = Object.keys(sesiData).filter(function(k){ return k.startsWith(prefix); }).sort();

  var totalGenerus     = activeMembers().length;
  var kegiatanBulanIni = monthKeys.length;
  var totalHadir=0, totalIzin=0, totalAlpa=0;

  var sesiStats = [];
  monthKeys.forEach(function(key){
    var ab = sesiData[key]||{};
    var sH=0,sI=0,sA=0;
    Object.keys(ab).forEach(function(mid){
      var rec = ab[mid];
      var s   = (rec && typeof rec==='object') ? (rec.status||'') : (rec||'');
      if(s==='H'){ totalHadir++; sH++; }
      else if(s==='I'){ totalIzin++; sI++; }
      else if(s==='A'){ totalAlpa++; sA++; }
    });
    var datePart = key.split('_')[0];
    var day  = parseInt((datePart.split('-')[2])||'1', 10);
    var ket  = sesiKet[key]||'';
    // Label sumbu-X memakai tanggal singkat; nama kegiatan lengkap ditampilkan
    // via tooltip (tap/hover titik & label grafik).
    var label = ket ? (ket+' ('+day+')') : String(day);
    sesiStats.push({label:label, day:day, ket:ket, H:sH, I:sI, A:sA});
  });

  var totalPossible = kegiatanBulanIni * (totalGenerus||1);
  var persen = kegiatanBulanIni>0 ? Math.round((totalHadir/totalPossible)*100) : 0;

  // Sapaan welcome card berdasar jam (pagi/siang/sore/malam)
  var jam = new Date().getHours();
  var sapaan = jam<4 ? 'Selamat Malam' : jam<11 ? 'Selamat Pagi' : jam<15 ? 'Selamat Siang' : jam<18 ? 'Selamat Sore' : 'Selamat Malam';

  function setTxt(id,v){ var el=document.getElementById(id); if(el) el.textContent=v; }
  setTxt('dash-welcome-greet', sapaan);
  setTxt('dash-welcome-greet-mob', sapaan);
  // Greeting + nama akun: "Selamat Malam, Admin Caberawit 👋" (nama ikut akun login)
  var accName = 'Admin';
  try { if(typeof currentUser!=='undefined' && currentUser && currentUser.nama) accName = currentUser.nama; } catch(e){}
  setTxt('dash-welcome-name', accName + ' \uD83D\uDC4B');
  setTxt('dash-welcome-name-mob', accName + ' \uD83D\uDC4B');
  setTxt('dash-generus-pc',  totalGenerus);
  setTxt('dash-kegiatan-pc', kegiatanBulanIni);
  setTxt('dash-persen-pc',   persen+'%');
  setTxt('dash-hadir-pc',    totalHadir);
  setTxt('dash-generus-mob', totalGenerus);
  setTxt('dash-kegiatan-mob',kegiatanBulanIni);
  setTxt('dash-persen-mob',  persen+'%');
  setTxt('dash-hadir-mob',   totalHadir);

  var chartSvg = buildDashChart(sesiStats);
  ['dash-chart-pc','dash-chart-mob'].forEach(function(id){
    var el = document.getElementById(id);
    if(el) el.innerHTML = chartSvg;
  });

  var recentKeys = monthKeys.slice().reverse().slice(0,3);
  var MBLN = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];
  function sesiCount(key){
    var ab = sesiData[key]||{}; var h=0,i=0,a=0;
    Object.keys(ab).forEach(function(mid){
      var rec = ab[mid];
      var s   = (rec && typeof rec==='object') ? (rec.status||'') : (rec||'');
      if(s==='H') h++; else if(s==='I') i++; else if(s==='A') a++;
    });
    return {h:h,i:i,a:a,tot:h+i+a};
  }
  function fmtDateKey(key){
    var dp = key.split('_')[0]; var parts = dp.split('-');
    return {dp:dp, fDate: parts[2]+' '+(MBLN[parseInt(parts[1],10)-1]||'')+' '+parts[0]};
  }
  // — Builder item luxury (PC lengkap, mobile ringkas ala acuan) —
  function luxItemHtml(key, compact){
    var ket = sesiKet[key]||key.split('_').slice(1).join(' ')||'Kelompok';
    var f = fmtDateKey(key);
    var c = sesiCount(key);
    var tot = c.tot||1;
    var pH = Math.round(c.h/tot*1000)/10, pI = Math.round(c.i/tot*1000)/10, pA = Math.round((100-pH-pI)*10)/10;
    var hadirPct = tot ? Math.round(c.h/tot*100) : 0;
    var stats = compact
      ? '<div class="lux-recent-stats"><span class="lux-rs-h">'+c.h+' Hadir</span><br>'+
        '<span class="lux-rs-i">'+c.i+' Izin</span> • <span class="lux-rs-a">'+c.a+' Alpa</span></div>'
      : '<div class="lux-recent-stats"><span class="lux-rs-h">'+c.h+' Hadir</span><br>'+
        '<span class="lux-rs-i">'+c.i+' Izin</span><br>'+
        '<span class="lux-rs-a">'+c.a+' Alpa</span></div>';
    return '<div class="lux-recent">'+
      '<div class="lux-recent-main">'+
        '<div class="lux-recent-left">'+
          '<div class="lux-recent-ic"><span class="msym" style="font-size:20px">menu_book</span></div>'+
          '<div><div class="lux-recent-name">'+escHtml(ket)+' <span class="lux-sesi-pill">Sesi '+(monthKeys.indexOf(key)+1)+'</span></div>'+
          '<div class="lux-recent-date"><span class="msym" style="font-size:13px;vertical-align:-2px">schedule</span> '+f.fDate+' • 19:30 WIB</div></div>'+
        '</div>'+ stats +
      '</div>'+
      '<div class="lux-bar"><div class="lux-bar-h" style="width:'+pH+'%"></div>'+
      '<div class="lux-bar-i" style="width:'+pI+'%"></div>'+
      '<div class="lux-bar-a" style="width:'+pA+'%"></div></div>'+
      '<div class="lux-bar-lbl">'+hadirPct+'% hadir</div>'+
    '</div>';
  }
  function luxItemPc(k){ return luxItemHtml(k,false); }
  function luxItemMob(k){ return luxItemHtml(k,true); }
  var elPc = document.getElementById('dash-recent-pc');
  if(elPc) elPc.innerHTML = recentKeys.length ? recentKeys.map(luxItemPc).join('') : '<div class="ndash-empty">Belum ada kegiatan bulan ini</div>';
  var elMob = document.getElementById('dash-recent-mob');
  if(elMob) elMob.innerHTML = recentKeys.length ? recentKeys.map(luxItemMob).join('') : '<div class="ndash-empty">Belum ada kegiatan bulan ini</div>';

  // — Pengayaan luxury PC + mobile —
  try {
    var act = activeMembers();
    var nL = act.filter(function(m){return m.gender==='L';}).length;
    var nP = act.filter(function(m){return m.gender==='P';}).length;
    var gbHtml = '<span><span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#3b82f6;margin-right:4px"></span>'+nL+' Putra</span>'+
      '<span><span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#ec4899;margin-right:4px"></span>'+nP+' Putri</span>';
    ['lux-gender-break','lux-gender-break-pc'].forEach(function(id){ var e=document.getElementById(id); if(e) e.innerHTML=gbHtml; });
    var bl = document.getElementById('lux-bulan-lbl');
    if(bl) bl.textContent = (BULAN[parseInt(curMonth,10)]||'')+' '+curYear;
    var blPc = document.getElementById('lux-bulan-pc');
    if(blPc) blPc.textContent = '('+(BULAN[parseInt(curMonth,10)]||'')+' '+curYear+')';
    var avg = kegiatanBulanIni>0 ? (totalHadir/kegiatanBulanIni) : 0;
    var avgTxt = (Math.round(avg*10)/10)+' org / sesi';
    ['lux-avg-mob','lux-avg-pc'].forEach(function(id){ var e=document.getElementById(id); if(e) e.textContent=avgTxt; });
    var kapTxt = totalHadir+' / '+totalPossible+' kapasitas';
    ['lux-kapas-mob','lux-kapas-pc'].forEach(function(id){ var e=document.getElementById(id); if(e) e.textContent=kapTxt; });
    ['lux-progress-mob','lux-progress-pc'].forEach(function(id){ var e=document.getElementById(id); if(e) e.style.width=Math.min(100,persen)+'%'; });
    [['lux-leg-h',totalHadir],['lux-leg-h-pc',totalHadir],['lux-leg-i',totalIzin],['lux-leg-i-pc',totalIzin],['lux-leg-a',totalAlpa],['lux-leg-a-pc',totalAlpa]].forEach(function(p){ var e=document.getElementById(p[0]); if(e) e.textContent=p[1]; });
    var subTxt = sesiStats.length ? ('Analisis tren '+sesiStats.length+' sesi bulan ini') : 'Belum ada sesi bulan ini';
    ['lux-chart-sub','lux-chart-sub-pc'].forEach(function(id){ var e=document.getElementById(id); if(e) e.textContent=subTxt; });
    // Catatan kaki grafik: sesi dengan Hadir tertinggi
    var noteTxt;
    if(sesiStats.length){
      var bi=0; sesiStats.forEach(function(s,i){ if(s.H>sesiStats[bi].H) bi=i; });
      noteTxt = 'Kehadiran tertinggi pada <strong>Sesi '+(bi+1)+' ('+sesiStats[bi].H+' Hadir)</strong>. Rata-rata izin '+(kegiatanBulanIni?Math.round(totalIzin/kegiatanBulanIni*10)/10:0)+' org/sesi.';
    } else noteTxt = 'Data grafik akan muncul setelah ada sesi bulan ini.';
    ['lux-chart-note','lux-chart-note-pc'].forEach(function(id){ var e=document.getElementById(id); if(e) e.innerHTML='<span class="msym" style="font-size:14px;vertical-align:-2px;color:#2d6a4f">info</span> '+noteTxt; });
    // Tren vs bulan lalu
    var prevD = new Date(now.getFullYear(), now.getMonth()-1, 1);
    var prevPrefix = prevD.getFullYear()+'-'+String(prevD.getMonth()+1).padStart(2,'0');
    var prevH=0, prevTot=0;
    Object.keys(sesiData).filter(function(k){return k.startsWith(prevPrefix);}).forEach(function(k){
      var ab=sesiData[k]||{};
      Object.keys(ab).forEach(function(mid){
        var rec=ab[mid]; var s=(rec&&typeof rec==='object')?(rec.status||''):(rec||'');
        if(s==='H') prevH++;
        if(s==='H'||s==='I'||s==='A') prevTot++;
      });
    });
    var prevP = prevTot?Math.round(prevH/prevTot*100):null;
    var trTxt = (prevP===null) ? 'Baru' : ((persen-prevP>=0?'+':'')+(persen-prevP)+'%');
    var trHtml = (prevP===null) ? trTxt : ('<span class="msym" style="font-size:12px;vertical-align:-2px">trending_up</span> '+trTxt);
    ['lux-tren-mob','lux-tren-pc'].forEach(function(id){ var e=document.getElementById(id); if(e) e.innerHTML=trHtml; });
    // Agenda berikutnya: sesi terakhir bulan ini (PC + mobile)
    var nxTxt = 'Belum ada sesi', nxTitle = '';
    if(recentKeys.length){
      var lk = recentKeys[0];
      var lket = sesiKet[lk]||'Kegiatan';
      nxTxt = fmtDateKey(lk).fDate+' ('+lket+')';
      nxTitle = lket;
    }
    ['lux-next-mob','lux-next-pc'].forEach(function(id){ var e=document.getElementById(id); if(e){ e.innerHTML='<span class="msym" style="font-size:14px;vertical-align:-2px;color:#b45309">upcoming</span> '+escHtml(nxTxt); e.title=nxTitle; } });
    var ksTxt = 'Keuangan kas periode '+(BULAN[parseInt(curMonth,10)]||'')+' '+curYear;
    var kse = document.getElementById('lux-kas-sub-pc'); if(kse) kse.textContent = ksTxt;
  } catch(e){}

  try { if(typeof animateBars==='function') animateBars(); } catch(e){}
  renderDashKasSummary();
}

// Ringkasan Kas di Dashboard: saldo akhir terkini + pemasukan/pengeluaran bulan berjalan
function renderDashKasSummary(){
  var emptyHtml = '<div class="ndash-empty">Belum ada transaksi kas</div>';
  var saldoAkhir = (typeof kasSaldoAwal!=='undefined') ? kasSaldoAwal : 0;
  var masukBulan = 0, keluarBulan = 0;
  var hasData = (typeof kasTransaksi!=='undefined' && kasTransaksi.length);
  if(hasData){
    try {
      var running = kasCalcRunning();
      saldoAkhir = running.length ? running[running.length-1].saldo : kasSaldoAwal;
    } catch(e){}
    var now2 = new Date();
    var prefix = now2.getFullYear()+'-'+String(now2.getMonth()+1).padStart(2,'0');
    kasTransaksi.forEach(function(t){
      if((t.tanggal||'').indexOf(prefix)===0){
        if(t.jenis==='pemasukan') masukBulan += t.nominal;
        else                      keluarBulan += t.nominal;
      }
    });
  }
  // Luxury 3 blok (PC grid via CSS, mobile stack) — sama persis acuan
  var kasLux = emptyHtml;
  if(hasData){
    kasLux =
      '<div class="lux-kas">'+
        '<div class="lux-kas-saldo"><div><small>Saldo Kas Saat Ini</small><strong>'+fmtRp(saldoAkhir)+'</strong>'+
        '<span>Kondisi kas terkini</span></div>'+
        '<div class="lux-kas-ic" style="background:#c1ecd4;color:#1b4332"><span class="msym" style="font-size:24px">account_balance</span></div></div>'+
        '<div class="lux-kas-row lux-kas-in"><div class="lux-kas-ic" style="background:#ebf5f0;color:#2d6a4f;width:36px;height:36px"><span class="msym" style="font-size:22px">arrow_downward</span></div>'+
        '<div><small>Pemasukan Bulan Ini</small><strong>+'+fmtRp(masukBulan)+'</strong><span>Total pemasukan periode ini</span></div></div>'+
        '<div class="lux-kas-row lux-kas-out"><div class="lux-kas-ic" style="background:#fee2e2;color:#ba1a1a;width:36px;height:36px"><span class="msym" style="font-size:22px">arrow_upward</span></div>'+
        '<div><small>Pengeluaran Bulan Ini</small><strong>-'+fmtRp(keluarBulan)+'</strong><span>Total pengeluaran periode ini</span></div></div>'+
      '</div>';
  }
  var elPc = document.getElementById('dash-kas-pc');
  if(elPc) elPc.innerHTML = kasLux;
  var elMob = document.getElementById('dash-kas-mob');
  if(elMob) elMob.innerHTML = kasLux;
  // Hero micro-status (PC + mobile)
  var kasTxt = hasData ? fmtRp(saldoAkhir).replace(/\u202f/g,' ') : '—';
  ['lux-kas-mob','lux-kas-pc'].forEach(function(id){ var e=document.getElementById(id); if(e) e.textContent=kasTxt; });
  var hs = document.getElementById('lux-sesi-mob');
  var sesiTxt = 'Belum ada sesi';
  try {
    var keys = Object.keys(sesiData||{});
    if(keys.length){
      var last = keys.sort().reverse()[0];
      var ket = (typeof sesiKet!=='undefined' && sesiKet[last]) ? sesiKet[last] : last;
      sesiTxt = 'Presensi terakhir: '+ket;
    }
  } catch(e){ sesiTxt = '—'; }
  if(hs) hs.textContent = sesiTxt;
  var hsPc = document.getElementById('lux-sesi-pc');
  if(hsPc) hsPc.textContent = sesiTxt;
}

// Grafik dashboard persis acuan: area gradien + garis tebal + marker putih + label "Sesi N".
function buildDashChart(sesiStats){
  if(!sesiStats||!sesiStats.length){
    return '<div style="overflow-x:auto"><svg viewBox="0 0 500 190" xmlns="http://www.w3.org/2000/svg" style="width:100%;min-width:300px;height:auto;display:block">'+
      '<text x="250" y="100" text-anchor="middle" font-size="12" fill="#9ca3af">Belum ada sesi bulan ini</text></svg></div>';
  }
  var H_arr = sesiStats.map(function(s){ return s.H; });
  var I_arr = sesiStats.map(function(s){ return s.I; });
  var A_arr = sesiStats.map(function(s){ return s.A; });
  var n     = sesiStats.length;

  var rawMax = 0;
  [H_arr,I_arr,A_arr].forEach(function(arr){
    arr.forEach(function(v){ if(v>rawMax) rawMax=v; });
  });
  var step = 5;
  var maxVal = Math.ceil(rawMax/step)*step || step;
  while(maxVal/step > 5){ step += 5; maxVal = Math.ceil(rawMax/step)*step; }

  var pL=38,pR=20,pT=20,pB=28;
  var minSpacing = 90;
  var cW = Math.max(560-pL-pR, n*minSpacing);
  var W  = Math.round(cW+pL+pR);
  var H_ = 250, baseY = H_-pB, cH = baseY-pT;

  function tx(i){ return n===1 ? pL+cW/2 : pL+(i/(n-1))*cW; }
  function ty(v){ return pT+cH-(Math.min(v,maxVal)/maxVal)*cH; }
  function fullStatLabel(s){ return s.ket ? (s.ket+(s.day?' ('+s.day+')':'')) : (s.label||''); }

  function linePath(vals){
    var pts = vals.map(function(v,i){ return [tx(i), ty(Math.min(v,maxVal))]; });
    return smoothLinePath(pts);
  }
  function areaPath(vals){
    var pts = vals.map(function(v,i){ return [tx(i), ty(Math.min(v,maxVal))]; });
    if(!pts.length) return '';
    var d = smoothLinePath(pts);
    d += ' L '+pts[pts.length-1][0].toFixed(1)+' '+baseY+' L '+pts[0][0].toFixed(1)+' '+baseY+' Z';
    return d;
  }
  var SERIES = [
    {vals:A_arr, color:'#ba1a1a', grad:'dashGradA', op:'0.18', name:'Alpa'},
    {vals:H_arr, color:'#2d6a4f', grad:'dashGradH', op:'0.22', name:'Hadir'},
    {vals:I_arr, color:'#b45309', grad:'dashGradI', op:'0.18', name:'Izin'}
  ];
  var defs = '<defs>'+ SERIES.map(function(s){
    return '<linearGradient id="'+s.grad+'" x1="0" x2="0" y1="0" y2="1">'+
      '<stop offset="0%" stop-color="'+s.color+'" stop-opacity="'+s.op+'"></stop>'+
      '<stop offset="100%" stop-color="'+s.color+'" stop-opacity="0.0"></stop></linearGradient>';
  }).join('') +'</defs>';

  var grid = '';
  for(var val=0; val<=maxVal; val+=step){
    var yy = ty(val);
    var isBase = (val===0);
    grid += '<line x1="'+pL+'" y1="'+yy.toFixed(1)+'" x2="'+(W-pR)+'" y2="'+yy.toFixed(1)+'" stroke="'+(isBase?'#e8e6df':'#e8e6df')+'" '+(isBase?'stroke-width="1.2"':'stroke-dasharray="3 3" stroke-width="1"')+'/>';
    grid += '<text x="'+(pL-10)+'" y="'+(yy+4).toFixed(1)+'" text-anchor="end" font-size="11" font-weight="'+(isBase?'600':'500')+'" fill="#9ca3af" font-family="\'Plus Jakarta Sans\',sans-serif">'+val+'</text>';
  }

  var xlbls = sesiStats.map(function(s,i){
    var x = tx(i).toFixed(1);
    return '<line x1="'+x+'" y1="'+pT+'" x2="'+x+'" y2="'+baseY+'" stroke="#e8e6df" stroke-width="1"/>'+
      '<text x="'+x+'" y="'+(H_-8)+'" text-anchor="middle" font-size="11" font-weight="600" fill="#4b5563" font-family="\'Plus Jakarta Sans\',sans-serif">'+
      '<title>'+escHtml(fullStatLabel(s))+'</title>Sesi '+(i+1)+'</text>';
  }).join('');

  var areas = SERIES.map(function(s){ return '<path d="'+areaPath(s.vals)+'" fill="url(#'+s.grad+')"></path>'; }).join('');
  var lines = SERIES.map(function(s){ return '<path d="'+linePath(s.vals)+'" fill="none" stroke="'+s.color+'" stroke-linecap="round" stroke-width="3"></path>'; }).join('');
  var dots = SERIES.map(function(s){
    return s.vals.map(function(v,i){
      var t = 'Sesi '+(i+1)+': '+s.name+' '+v+' Generus';
      return '<circle class="chart-marker" cx="'+tx(i).toFixed(1)+'" cy="'+ty(v).toFixed(1)+'" fill="#ffffff" r="5" stroke="'+s.color+'" stroke-width="2.5"><title>'+escHtml(t)+'</title></circle>';
    }).join('');
  }).join('');

  return '<div style="overflow-x:auto;-webkit-overflow-scrolling:touch">'+
    '<svg viewBox="0 0 '+W+' '+H_+'" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Grafik Kehadiran" style="width:100%;min-width:420px;height:auto;display:block;overflow:visible">'+
    defs+grid+xlbls+areas+lines+dots+
    '</svg></div>';
}
