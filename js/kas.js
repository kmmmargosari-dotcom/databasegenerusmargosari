// ══════════════════════════════════════════════════
// KAS / KEUANGAN MODULE
// ══════════════════════════════════════════════════

// ── Sort & Running Saldo ──
function kasSorted(){
  return kasTransaksi.slice().sort(function(a,b){
    if(a.tanggal<b.tanggal) return -1;
    if(a.tanggal>b.tanggal) return  1;
    return (a.createdAt||0)-(b.createdAt||0);
  });
}

function kasCalcRunning(){
  var sorted = kasSorted();
  var saldo  = kasSaldoAwal;
  return sorted.map(function(trx){
    if(trx.jenis==='pemasukan') saldo += trx.nominal;
    else                        saldo -= trx.nominal;
    return {trx:trx, saldo:saldo};
  });
}

// ── Filter Helpers ──
function kasGetBulan(){
  var v = '';
  if(mob()){
    var elM = document.getElementById('kasBulanM');
    if(elM) v = elM.value;
  } else {
    var el = document.getElementById('kasBulan');
    if(el) v = el.value;
  }
  return v || String(new Date().getMonth()+1).padStart(2,'0');
}

function kasGetTahun(){
  var v = '';
  if(mob()){
    var elM = document.getElementById('kasTahunM');
    if(elM) v = elM.value;
  } else {
    var el = document.getElementById('kasTahun');
    if(el) v = el.value;
  }
  return v || String(new Date().getFullYear());
}

// ── Main Render ──
function renderKas(){
  var bulan = kasGetBulan();
  var tahun = kasGetTahun();
  ['kasBulan','kasBulanM'].forEach(function(id){ var el=document.getElementById(id); if(el) el.value=bulan; });
  ['kasTahun','kasTahunM'].forEach(function(id){ var el=document.getElementById(id); if(el) el.value=tahun; });

  var bulanNum = parseInt(bulan,10);
  var tahunNum = parseInt(tahun,10);
  var prefix   = tahun+'-'+bulan;
  var allRun   = kasCalcRunning();

  var saldoAwal = kasSaldoAwal;
  for(var i=0;i<allRun.length;i++){
    var t  = allRun[i].trx.tanggal;
    var tp = t.split('-');
    if(tp[0]<tahun||(tp[0]===tahun&&parseInt(tp[1])<bulanNum)){
      saldoAwal = allRun[i].saldo;
    }
  }

  var periodItems = allRun.filter(function(item){ return item.trx.tanggal.startsWith(prefix); });
  var totalMasuk=0, totalKeluar=0;
  periodItems.forEach(function(item){
    if(item.trx.jenis==='pemasukan') totalMasuk  += item.trx.nominal;
    else                             totalKeluar += item.trx.nominal;
  });
  var selisih    = totalMasuk - totalKeluar;
  var saldoAkhir = saldoAwal + selisih;
  var saldoTotal = allRun.length>0 ? allRun[allRun.length-1].saldo : kasSaldoAwal;

  var now        = new Date();
  var nowBulan   = String(now.getMonth()+1).padStart(2,'0');
  var nowTahun   = String(now.getFullYear());
  var isCurrent  = (bulan===nowBulan && tahun===nowTahun);
  var periodeLabel= BULAN_ID[bulanNum]+' '+tahun;
  var subLabel   = isCurrent?'Bulan Ini':periodeLabel;

  setText('ks-saldo',  fmtRp(saldoTotal));
  setText('ks-masuk',  fmtRp(totalMasuk));
  setText('ks-keluar', fmtRp(totalKeluar));
  var selVal = document.getElementById('ks-selisih');
  if(selVal){ selVal.textContent=fmtRp(Math.abs(selisih)); selVal.style.color=selisih>=0?'var(--green)':'var(--red)'; }
  setText('ks-masuk-sub',  subLabel);
  setText('ks-keluar-sub', subLabel);
  var selSub = document.getElementById('ks-selisih-sub');
  if(selSub){ selSub.textContent=selisih>=0?'Surplus':'Defisit'; selSub.style.color=selisih>=0?'var(--amber)':'var(--red)'; }

  setText('cf-saldo-awal',   fmtRp(saldoAwal));
  setText('cf-pemasukan',    fmtRp(totalMasuk));
  setText('cf-pengeluaran',  fmtRp(totalKeluar));
  var cfSel = document.getElementById('cf-selisih');
  if(cfSel){ cfSel.textContent=(selisih<0?'-':'')+fmtRp(Math.abs(selisih)); cfSel.style.color=selisih>=0?'#2d6a4f':'#ba1a1a'; }
  setText('cf-saldo-akhir', fmtRp(saldoAkhir));
  setText('kasCfPeriodeLabel',  periodeLabel);
  setText('kasCfPeriodeLabelM', periodeLabel);

  var titleEl = document.getElementById('kasTblTitle');
  if(titleEl) titleEl.textContent = 'TRANSAKSI PERIODE '+BULAN_ID[bulanNum].toUpperCase()+' '+tahun;
  var tbody = document.getElementById('kasTblBody');
  if(tbody){
    var html='<div class="swipe-content kas-tbl-row kas-tbl-row-static"><span class="c-tgl">—</span><span class="c-ket">Saldo Awal Periode</span><span class="r">—</span><span class="r">—</span><span class="r c-saldo" id="kasTblSaldoAwalVal">'+fmtRp(saldoAwal)+'</span></div>';
    if(periodItems.length===0){
      html+='<div style="text-align:center;color:var(--text3);padding:24px;font-style:italic;font-size:12.5px">Belum ada transaksi periode ini.</div>';
    } else {
      periodItems.forEach(function(item){
        var trx=item.trx;
        var masukStr  = trx.jenis==='pemasukan'   ?'<span class="kas-masuk">'+fmtRp(trx.nominal)+'</span>':'<span style="color:#9ca3af">—</span>';
        var keluarStr = trx.jenis==='pengeluaran' ?'<span class="kas-keluar">'+fmtRp(trx.nominal)+'</span>':'<span style="color:#9ca3af">—</span>';
        html+='<div class="swipe-row" data-key="'+trx.id+'">';
        html+='<div class="swipe-reveal"><span>Buang</span></div>';
        html+='<div class="swipe-content kas-tbl-row" onclick="kasEditTrx(\''+trx.id+'\')" title="Klik untuk edit" style="cursor:pointer">';
        html+='<span class="c-tgl">'+fmtTglShort(trx.tanggal)+'</span>';
        html+='<span class="c-ket">'+escHtml(trx.keterangan||'')+'</span>';
        html+='<span class="r">'+masukStr+'</span>';
        html+='<span class="r">'+keluarStr+'</span>';
        html+='<span class="r c-saldo">'+fmtRp(item.saldo)+'</span>';
        html+='</div>';
        html+='</div>';
      });
    }
    html+='<div class="kas-total-row">';
    html+='<span style="letter-spacing:.3px">TOTAL</span><span></span>';
    html+='<span class="r kas-masuk">'+fmtRp(totalMasuk)+'</span>';
    html+='<span class="r kas-keluar">'+fmtRp(totalKeluar)+'</span>';
    html+='<span class="r" style="color:#ba1a1a">'+fmtRp(saldoAkhir)+'</span>';
    html+='</div>';
    tbody.innerHTML=html;
    initSwipeRows(tbody, function(r){ return r.getAttribute('data-key'); }, function(k){ kasDelTrx(k); });
  }

  setText('mks-saldo',  fmtRp(saldoTotal));
  setText('mks-masuk',  fmtRp(totalMasuk));
  setText('mks-keluar', fmtRp(totalKeluar));
  var mSelVal = document.getElementById('mks-selisih');
  if(mSelVal){ mSelVal.textContent=fmtRp(Math.abs(selisih)); mSelVal.style.color=selisih>=0?'var(--green)':'var(--red)'; }
  setText('mks-masuk-sub',  subLabel);
  setText('mks-keluar-sub', subLabel);
  var mSelSub = document.getElementById('mks-selisih-sub');
  if(mSelSub){ mSelSub.textContent=selisih>=0?'Surplus':'Defisit'; mSelSub.style.color=selisih>=0?'var(--amber)':'var(--red)'; }

  setText('mcf-saldo-awal',  fmtRp(saldoAwal));
  setText('mcf-pemasukan',   fmtRp(totalMasuk));
  setText('mcf-pengeluaran', fmtRp(totalKeluar));
  var mcfSel = document.getElementById('mcf-selisih');
  if(mcfSel){ mcfSel.textContent=(selisih<0?'-':'')+fmtRp(Math.abs(selisih)); mcfSel.style.color=selisih>=0?'#2d6a4f':'#ba1a1a'; }
  setText('mcf-saldo-akhir', fmtRp(saldoAkhir));

  var mTitle = document.getElementById('kasMobTblTitle');
  if(mTitle) mTitle.textContent='TRANSAKSI PERIODE '+BULAN_ID[bulanNum].toUpperCase()+' '+tahun;
  var mBody = document.getElementById('kasMobTblBody');
  if(mBody){
    if(periodItems.length===0){
      mBody.innerHTML='<div class="empty">Belum ada transaksi periode ini.</div>';
    } else {
      var mHtml='<div class="kas-mob-trx-card">';
      periodItems.forEach(function(item){
        var trx=item.trx;
        var isPemasukan=trx.jenis==='pemasukan';
        var dotColor=isPemasukan?'#2d6a4f':'#ba1a1a';
        var nominalStr=(isPemasukan?'+':'-')+fmtRp(trx.nominal);
        var nominalColor=isPemasukan?'#2d6a4f':'#ba1a1a';
        mHtml+='<div class="swipe-row" data-key="'+trx.id+'">';
        mHtml+='<div class="swipe-reveal"><span>Buang</span></div>';
        mHtml+='<div class="swipe-content kas-mob-trx-item" onclick="kasEditTrx(\''+trx.id+'\')" style="cursor:pointer">';
        mHtml+='<div class="kas-mob-trx-dot" style="background:'+dotColor+'"></div>';
        mHtml+='<div class="kas-mob-trx-info"><div class="kas-mob-trx-date">'+fmtTglShort(trx.tanggal)+'</div><div class="kas-mob-trx-ket">'+escHtml(trx.keterangan||'')+'</div></div>';
        mHtml+='<div class="kas-mob-trx-right"><div class="kas-mob-trx-nominal" style="color:'+nominalColor+'">'+nominalStr+'</div><div class="kas-mob-trx-saldo">'+fmtRp(item.saldo)+'</div></div>';
        mHtml+='</div>';
        mHtml+='</div>';
      });
      mHtml+='</div>';
      mHtml+='<div class="kas-mob-total-row" style="margin-top:8px;border-radius:var(--rl)">';
      mHtml+='<span class="kas-mob-total-lbl">Masuk: <span class="kas-masuk">'+fmtRp(totalMasuk)+'</span> &nbsp;·&nbsp; Keluar: <span class="kas-keluar">'+fmtRp(totalKeluar)+'</span></span>';
      mHtml+='<span class="kas-mob-total-val" style="color:#ba1a1a">'+fmtRp(saldoAkhir)+'</span>';
      mHtml+='</div>';
      mBody.innerHTML = mHtml;
      initSwipeRows(mBody, function(r){ return r.getAttribute('data-key'); }, function(k){ kasDelTrx(k); });
    }
  }

  renderKasDonut(totalMasuk, totalKeluar);
  renderKasLineChart(tahun);
  try { if(typeof animateBars==='function') animateBars(); } catch(e){}
}

// ── Donut Chart ──
function renderKasDonut(totalMasuk, totalKeluar){
  var targets=[{svg:'kasDonutSvg',leg:'kasDonutLegend'},{svg:'kasDonutSvgM',leg:'kasDonutLegendM'}];
  var total=totalMasuk+totalKeluar;
  var selisih=totalMasuk-totalKeluar;
  var cColor=selisih>=0?'#2d6a4f':'#ba1a1a';
  targets.forEach(function(t){
    var svgEl=document.getElementById(t.svg);
    var legEl=document.getElementById(t.leg);
    if(!svgEl) return;
    var isMob=t.svg==='kasDonutSvgM';
    var r=50,cx=68,cy=68,W=136,stroke=26;
    if(isMob){r=42;cx=54;cy=54;W=108;stroke=22;}
    var circ=2*Math.PI*r;
    var svgHtml='<svg width="'+W+'" height="'+W+'" viewBox="0 0 '+W+' '+W+'" style="overflow:visible">';
    svgHtml+='<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="none" stroke="#e8e6df" stroke-width="'+stroke+'"/>';
    if(total>0){
      var pM=totalMasuk/total,pK=totalKeluar/total;
      if(totalMasuk>0){
        svgHtml+='<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="none" stroke="#2d6a4f" stroke-width="'+stroke+'"'+
          ' stroke-dasharray="'+(circ*pM)+' '+(circ*(1-pM))+'"'+
          ' stroke-dashoffset="'+(circ*0.25)+'"'+
          ' style="transition:stroke-dasharray .35s"/>';
      }
      if(totalKeluar>0){
        svgHtml+='<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="none" stroke="#ba1a1a" stroke-width="'+stroke+'"'+
          ' stroke-dasharray="'+(circ*pK)+' '+(circ*(1-pK))+'"'+
          ' stroke-dashoffset="'+(circ*(0.25-pM))+'"'+
          ' style="transition:stroke-dasharray .35s"/>';
      }
    }
    var fs1=isMob?'8':'9',fs2=isMob?'9.5':'10.5';
    svgHtml+='<text x="'+cx+'" y="'+(cy-7)+'" text-anchor="middle" font-size="'+fs1+'" fill="#717973" font-family="sans-serif">Selisih</text>';
    svgHtml+='<text x="'+cx+'" y="'+(cy+8)+'" text-anchor="middle" font-size="'+fs2+'" font-weight="700" fill="'+cColor+'" font-family="sans-serif">'+fmtRp(Math.abs(selisih))+'</text>';
    svgHtml+='</svg>';
    svgEl.innerHTML=svgHtml;
    if(legEl){
      if(total===0){
        legEl.innerHTML='<div style="color:var(--text3);font-size:11px;padding:4px 0">Belum ada transaksi</div>';
      } else {
        legEl.innerHTML='<div class="kas-donut-legend">'+
          '<div class="kas-donut-leg-item"><span class="kas-donut-dot" style="background:#2d6a4f"></span><span class="kas-donut-leg-lbl">Masuk</span><span class="kas-donut-leg-val" style="color:#2d6a4f">'+fmtRp(totalMasuk)+'</span></div>'+
          '<div class="kas-donut-leg-item"><span class="kas-donut-dot" style="background:#ba1a1a"></span><span class="kas-donut-leg-lbl">Keluar</span><span class="kas-donut-leg-val" style="color:#ba1a1a">'+fmtRp(totalKeluar)+'</span></div>'+
          '</div>';
      }
    }
  });
}

// ── Line Chart Tahunan ──
function renderKasLineChart(tahun){
  var BULAN=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agt','Sep','Okt','Nov','Des'];
  var masuk=[0,0,0,0,0,0,0,0,0,0,0,0];
  var keluar=[0,0,0,0,0,0,0,0,0,0,0,0];
  kasTransaksi.forEach(function(trx){
    if(!trx.tanggal) return;
    var parts=trx.tanggal.split('-');
    if(parts[0]!==tahun) return;
    var m=parseInt(parts[1],10)-1;
    if(m<0||m>11) return;
    if(trx.jenis==='pemasukan') masuk[m]+=trx.nominal;
    else keluar[m]+=trx.nominal;
  });

  function fmtK(n){
    if(n>=1000000000) return (n/1000000000).toFixed(1).replace(/\.0$/,'')+'M';
    if(n>=1000000)    return (n/1000000).toFixed(1).replace(/\.0$/,'')+'jt';
    if(n>=1000)       return Math.round(n/1000)+'k';
    return String(n);
  }

  function buildSvg(isMob){
    var W=isMob?340:560,H=isMob?130:158;
    var padL=isMob?44:50,padR=14,padT=20,padB=isMob?26:30;
    var cW=W-padL-padR,cH=H-padT-padB;
    var maxVal=Math.max.apply(null,masuk.concat(keluar).concat([1]));
    var mag=Math.pow(10,Math.floor(Math.log10(maxVal)));
    maxVal=Math.ceil(maxVal/mag)*mag;

    function xP(i){ return padL+i*(cW/11); }
    function yP(v){ return padT+cH-(v/maxVal)*cH; }

    var fs=isMob?7.5:9;
    var svg='<svg width="100%" viewBox="0 0 '+W+' '+H+'" xmlns="http://www.w3.org/2000/svg" style="display:block;overflow:visible">';

    // horizontal grid lines
    [0,0.5,1].forEach(function(frac){
      var v=maxVal*frac;
      var y=yP(v).toFixed(1);
      svg+='<line x1="'+padL+'" y1="'+y+'" x2="'+(W-padR)+'" y2="'+y+'" stroke="var(--border)" stroke-width="0.8" stroke-dasharray="3 3"/>';
      svg+='<text x="'+(padL-5)+'" y="'+(parseFloat(y)+3.5).toFixed(1)+'" text-anchor="end" font-size="'+fs+'" fill="var(--text3)" font-family="sans-serif">'+fmtK(v)+'</text>';
    });

    // vertical lines (subtle)
    for(var i=0;i<12;i++){
      var xv=xP(i).toFixed(1);
      svg+='<line x1="'+xv+'" y1="'+padT+'" x2="'+xv+'" y2="'+(padT+cH)+'" stroke="var(--border)" stroke-width="0.5" opacity="0.5"/>';
    }

    // area fills (smooth top edge)
    function area(data,color){
      var pts=[];
      data.forEach(function(v,i){ pts.push([xP(i), yP(v)]); });
      var d=smoothLinePath(pts);
      if(!d) return '';
      d+='L '+(W-padR).toFixed(2)+' '+(padT+cH).toFixed(2)+' L '+padL+' '+(padT+cH).toFixed(2)+' Z';
      return '<path d="'+d+'" fill="'+color+'" opacity="0.08"/>';
    }
    svg+=area(masuk,'#2d6a4f');
    svg+=area(keluar,'#ba1a1a');

    // lines (smooth curve)
    function line(data,color){
      var pts=[];
      data.forEach(function(v,i){ pts.push([xP(i), yP(v)]); });
      var d=smoothLinePath(pts);
      if(!d) return '';
      return '<path d="'+d+'" fill="none" stroke="'+color+'" stroke-width="'+(isMob?1.8:2.2)+'" stroke-linejoin="round" stroke-linecap="round"/>';
    }
    svg+=line(masuk,'#2d6a4f');
    svg+=line(keluar,'#ba1a1a');

    // dots + value labels for non-zero
    function dots(data,color){
      var s='';
      data.forEach(function(v,i){
        var x=xP(i).toFixed(1),y=yP(v).toFixed(1),r=isMob?2.8:3.2;
        s+='<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+color+'" stroke="var(--bg)" stroke-width="1.5"/>';
        if(v>0){
          var ly=(parseFloat(y)-(isMob?7:9)).toFixed(1);
          s+='<text x="'+x+'" y="'+ly+'" text-anchor="middle" font-size="'+(isMob?7:8)+'" fill="'+color+'" font-family="sans-serif" font-weight="600">'+fmtK(v)+'</text>';
        }
      });
      return s;
    }
    svg+=dots(masuk,'#2d6a4f');
    svg+=dots(keluar,'#ba1a1a');

    // x-axis month labels
    BULAN.forEach(function(lbl,i){
      svg+='<text x="'+xP(i).toFixed(1)+'" y="'+(H-4)+'" text-anchor="middle" font-size="'+fs+'" fill="var(--text3)" font-family="sans-serif">'+lbl+'</text>';
    });

    svg+='</svg>';
    return svg;
  }

  // PC
  var elPc=document.getElementById('kasLineChart');
  var elYr=document.getElementById('kasLineYear');
  if(elPc){ elPc.innerHTML=buildSvg(false); }
  if(elYr){ elYr.textContent=tahun; }

  // Mobile
  var elMob=document.getElementById('kasLineChartM');
  var elYrM=document.getElementById('kasLineYearM');
  if(elMob){ elMob.innerHTML=buildSvg(true); }
  if(elYrM){ elYrM.textContent=tahun; }
}

// ── Tambah / Edit Popup ──
function openKasTambah(editData){
  var isEdit=editData&&editData.id;
  setText('kasTambahTitle',isEdit?'Edit Transaksi':'Tambah Transaksi');
  document.getElementById('kasEditId').value = isEdit?editData.id:'';
  setKasJenis(isEdit?editData.jenis:'pemasukan');
  document.getElementById('kasNominal').value    = isEdit?editData.nominal:'';
  document.getElementById('kasTanggal').value    = isEdit?editData.tanggal:kasDefaultTgl();
  document.getElementById('kasKeterangan').value = isEdit?(editData.keterangan||''):'';
  showPopup('kas-tambah-overlay','kas-tambah-popup');
}

function closeKasTambah(){ hidePopup('kas-tambah-overlay','kas-tambah-popup'); }

function kasDefaultTgl(){
  var d=new Date();
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}

function setKasJenis(jenis){
  document.getElementById('kasJenis').value = jenis;
  document.getElementById('kasJenisP').classList.toggle('on',jenis==='pemasukan');
  document.getElementById('kasJenisK').classList.toggle('on',jenis==='pengeluaran');
}

function submitKasTambah(){
  var btn = document.querySelector('#kas-tambah-popup .btn-p');
  if(btn && btn.disabled) return;
  var jenis  = document.getElementById('kasJenis').value;
  var nominal= parseFloat(document.getElementById('kasNominal').value);
  var tanggal= document.getElementById('kasTanggal').value;
  var ket    = document.getElementById('kasKeterangan').value.trim();
  var editId = document.getElementById('kasEditId').value;
  if(!tanggal){ showToast('Isi tanggal transaksi'); return; }
  if(isNaN(nominal)||nominal<=0){ showToast('Nominal harus lebih dari 0'); return; }
  setBtnBusy(btn, true, 'Menyimpan...');
  try {
    var id     = editId||('kas-'+Date.now()+'-'+Math.random().toString(36).slice(2,7));
    var originalCreatedAt = editId ? (kasTransaksi.find(function(k){return k.id===editId})||{}).createdAt : null;
    var record = {id:id,jenis:jenis,nominal:nominal,tanggal:tanggal,keterangan:ket,createdAt:originalCreatedAt||Date.now()};
    var idx = kasTransaksi.findIndex(function(k){ return k.id===id; });
    if(idx>=0) kasTransaksi[idx]=record; else kasTransaksi.push(record);
    fbSaveKas(id,{jenis:record.jenis,nominal:record.nominal,tanggal:record.tanggal,keterangan:record.keterangan,createdAt:record.createdAt});
    var jn = jenis==='pemasukan'?'Pemasukan':'Pengeluaran';
    logActivity('kas', (editId?'Edit ':'+ ')+jn+' Rp'+Math.round(nominal).toLocaleString('id-ID')+(ket?' ('+ket+')':''));
    closeKasTambah();
    renderKas();
    showToast(editId?'Transaksi diperbarui':'Transaksi ditambahkan');
  } finally {
    setBtnBusy(btn, false);
  }
}

function kasEditTrx(id){
  var trx=kasTransaksi.find(function(k){return k.id===id;});
  if(trx) openKasTambah(trx);
}

function kasDelTrx(id){
  var trx0 = kasTransaksi.find(function(k){return k.id===id;});
  var info0 = trx0 ? (trx0.jenis==='pemasukan'?'Pemasukan':'Pengeluaran')+' '+fmtRp(trx0.nominal||0)+(trx0.keterangan?' ('+trx0.keterangan+')':'') : 'transaksi ini';
  appConfirm('Buang '+info0+'?\nData yang dibuang tidak bisa dikembalikan.', function(){
    function doDelete(){
      kasTransaksi=kasTransaksi.filter(function(k){return k.id!==id;});
      fbDelKas(id);
      logActivity('kas', 'Buang '+info0);
      renderKas();
      showToast('Transaksi dibuang');
    }
    var rows = document.querySelectorAll('#kasMobTblBody .swipe-row[data-key="'+id+'"], #kasTblBody .swipe-row[data-key="'+id+'"]');
    if(rows.length){
      var n = rows.length;
      rows.forEach(function(r){ animateRemove(r, function(){ if(--n===0) doDelete(); }); });
    } else doDelete();
  }, {title:'Buang Transaksi?', icon:'trash', color:'red', okText:'Ya, Buang'});
}

// ── Saldo Awal (starting point April 2026: terkunci, read-only) ──

// ── Fragment cetak Kas (dipakai ulang) ──
// Bagian tengah laporan kas: kartu Cash Flow + Donut Komposisi + tabel
// Detail Transaksi. Dipakai oleh kasExport('print') dan oleh export gabungan
// Rekap+Kas di rekap.js supaya desainnya sama persis.
// Parameter ke-7 (opsional, hanya dipakai export gabungan): teks catatan
// musyawarah. Bila diisi, tabel Detail Transaksi + kartu catatan tampil
// berdampingan (kiri-kanan); bila kosong, tabel tampil full seperti biasa.
function kasPrintSectionHtml(periodItems, saldoAwal, totalMasuk, totalKeluar, selisih, saldoAkhir, catatan){
  var donutR=54,donutCx=70,donutCy=70,donutW=14;
  var donutTotal=totalMasuk+totalKeluar;
  var donutSvg='';
  if(donutTotal>0){
    var pctMasuk=totalMasuk/donutTotal,pctKeluar=totalKeluar/donutTotal;
    var circ=2*Math.PI*donutR;
    var dashM=pctMasuk*circ,gapM=circ-dashM,dashK=pctKeluar*circ,gapK=circ-dashK,rotateK=-90+pctMasuk*360;
    donutSvg='<svg width="140" height="140" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">'+
      '<circle cx="'+donutCx+'" cy="'+donutCy+'" r="'+donutR+'" fill="none" stroke="#e8e6df" stroke-width="'+donutW+'"/>'+
      '<circle cx="'+donutCx+'" cy="'+donutCy+'" r="'+donutR+'" fill="none" stroke="#2d6a4f" stroke-width="'+donutW+'" stroke-dasharray="'+dashM+' '+gapM+'" transform="rotate(-90 '+donutCx+' '+donutCy+')" stroke-linecap="round"/>'+
      (totalKeluar>0?'<circle cx="'+donutCx+'" cy="'+donutCy+'" r="'+donutR+'" fill="none" stroke="#ba1a1a" stroke-width="'+donutW+'" stroke-dasharray="'+dashK+' '+gapK+'" transform="rotate('+rotateK+' '+donutCx+' '+donutCy+')" stroke-linecap="round"/>':'')+
      '<text x="'+donutCx+'" y="'+(donutCy-5)+'" text-anchor="middle" font-size="13" font-weight="700" fill="#1f2937">'+Math.round(pctMasuk*100)+'%</text>'+
      '<text x="'+donutCx+'" y="'+(donutCy+10)+'" text-anchor="middle" font-size="9" fill="#717973">Masuk</text>'+
      '</svg>';
  } else {
    donutSvg='<svg width="140" height="140" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg"><circle cx="70" cy="70" r="54" fill="none" stroke="#e8e6df" stroke-width="14"/><text x="70" y="75" text-anchor="middle" font-size="11" fill="#717973">Kosong</text></svg>';
  }
  var rows='',rowNo=1;
  rows+='<tr class="saldo-awal-row"><td colspan="2" style="font-style:italic;color:#4b5563;font-size:10.5px">Saldo Awal Periode</td><td></td><td></td><td class="num bold" style="color:#b45309">'+fmtRp(saldoAwal)+'</td></tr>';
  periodItems.forEach(function(item){
    var trx=item.trx;
    var masuk =trx.jenis==='pemasukan'   ?fmtRp(trx.nominal):'-';
    var keluar=trx.jenis==='pengeluaran' ?fmtRp(trx.nominal):'-';
    var shade=rowNo%2===0?'background:#fbf9f6':'';
    rows+='<tr style="'+shade+'"><td style="white-space:nowrap;font-size:10.5px">'+fmtTglShort(trx.tanggal)+'</td><td style="font-size:10.5px">'+escHtml(trx.keterangan||'')+'</td><td class="num green" style="font-size:10.5px">'+masuk+'</td><td class="num red" style="font-size:10.5px">'+keluar+'</td><td class="num bold" style="font-size:10.5px">'+fmtRp(item.saldo)+'</td></tr>';
    rowNo++;
  });
  return '<div class="cf-donut-row"><div class="cf-box"><div class="cf-box-title">Cash Flow Periode</div>'+
    '<div class="cf-row"><div class="cf-icon" style="background:#e8e6df;color:#4b5563">●</div><span class="cf-lbl">Saldo Awal</span><span class="cf-val" style="color:#1f2937">'+fmtRp(saldoAwal)+'</span></div>'+
    '<div class="cf-row"><div class="cf-icon" style="background:#ebf5f0;color:#2d6a4f">▲</div><span class="cf-lbl">Total Pemasukan</span><span class="cf-val" style="color:#2d6a4f">'+fmtRp(totalMasuk)+'</span></div>'+
    '<div class="cf-row"><div class="cf-icon" style="background:#fee2e2;color:#ba1a1a">▼</div><span class="cf-lbl">Total Pengeluaran</span><span class="cf-val" style="color:#ba1a1a">'+fmtRp(totalKeluar)+'</span></div>'+
    '<div class="cf-row"><div class="cf-icon" style="background:#fef3c7;color:#b45309">＝</div><span class="cf-lbl">Selisih</span><span class="cf-val" style="color:'+(selisih>=0?'#2d6a4f':'#ba1a1a')+'">'+fmtRp(selisih)+'</span></div>'+
    '<div class="cf-saldo-akhir"><span class="cf-sa-lbl">Saldo Akhir</span><span class="cf-sa-val">'+fmtRp(saldoAkhir)+'</span></div></div>'+
    '<div class="donut-box"><div class="donut-box-title">Komposisi</div>'+donutSvg+
    '<div class="donut-legend">'+
    (totalMasuk>0?'<div class="donut-leg-row"><div class="donut-dot" style="background:#2d6a4f"></div><span class="donut-leg-lbl">Pemasukan</span><span class="donut-leg-val" style="color:#2d6a4f">'+fmtRp(totalMasuk)+'</span></div>':'')+
    (totalKeluar>0?'<div class="donut-leg-row"><div class="donut-dot" style="background:#ba1a1a"></div><span class="donut-leg-lbl">Pengeluaran</span><span class="donut-leg-val" style="color:#ba1a1a">'+fmtRp(totalKeluar)+'</span></div>':'')+
    '<div class="cf-saldo-akhir"><span class="cf-sa-lbl">Saldo Akhir</span><span class="cf-sa-val">'+fmtRp(saldoAkhir)+'</span></div></div>'+
    '<div class="donut-box"><div class="donut-box-title">Komposisi</div>'+donutSvg+
    '<div class="donut-legend">'+
    (totalMasuk>0?'<div class="donut-leg-row"><div class="donut-dot" style="background:#2d6a4f"></div><span class="donut-leg-lbl">Pemasukan</span><span class="donut-leg-val" style="color:#2d6a4f">'+fmtRp(totalMasuk)+'</span></div>':'')+
    (totalKeluar>0?'<div class="donut-leg-row"><div class="donut-dot" style="background:#ba1a1a"></div><span class="donut-leg-lbl">Pengeluaran</span><span class="donut-leg-val" style="color:#ba1a1a">'+fmtRp(totalKeluar)+'</span></div>':'')+
    '</div></div></div>'+
    kasDetailTableHtml(rows, totalMasuk, totalKeluar, saldoAkhir, catatan||'');
}

function kasDetailTableHtml(rows, totalMasuk, totalKeluar, saldoAkhir, catatan){
  var tableHtml='<div class="section-title">Detail Transaksi</div>'+
    '<table><thead><tr><th>Tanggal</th><th>Keterangan</th><th style="text-align:right">Masuk (Rp)</th><th style="text-align:right">Keluar (Rp)</th><th style="text-align:right">Saldo (Rp)</th></tr></thead>'+
    '<tbody>'+rows+
    '<tr class="total-row"><td colspan="2">TOTAL PERIODE</td><td class="num green">'+fmtRp(totalMasuk)+'</td><td class="num red">'+fmtRp(totalKeluar)+'</td><td class="num bold">'+fmtRp(saldoAkhir)+'</td></tr>'+
    '</tbody></table>';
  if(!catatan) return tableHtml;
  var _ct=escHtml(catatan).replace(/\r\n/g,'\n').replace(/\n/g,'<br>');
  return '<div class="kas-detail-row">'+
    '<div class="kas-detail-main">'+tableHtml+'</div>'+
    '<div class="kas-detail-side"><div class="section-title">Catatan / Hasil Musyawarah</div>'+
    '<div class="tbl-card catatan-card-side"><div class="catatan-text">'+_ct+'</div></div></div>'+
  '</div>';
}

// ── Export ──
function kasExport(type){
  var _rg=(typeof resolveExRange==='function')?resolveExRange('kas')
    :{dari:_exVal('exKasDari','exKasDariM'),sampai:_exVal('exKasSampai','exKasSampaiM')};
  var cDari=_rg.dari||'', cSampai=_rg.sampai||'';
  var dariDate=cDari?cDari:'0000-01-01';
  var sampaiDate=cSampai?cSampai:'9999-12-31';
  if(dariDate>sampaiDate){ var tmp=dariDate;dariDate=sampaiDate;sampaiDate=tmp; }
  var allRun  = kasCalcRunning();
  var saldoAwal=0;
  for(var i=0;i<allRun.length;i++){
    if(allRun[i].trx.tanggal<dariDate) saldoAwal=allRun[i].saldo;
  }
  var periodItems=allRun.filter(function(item){
    var tg=item.trx.tanggal;
    return tg>=dariDate && tg<=sampaiDate;
  });
  var totalMasuk=0,totalKeluar=0;
  periodItems.forEach(function(item){
    if(item.trx.jenis==='pemasukan') totalMasuk+=item.trx.nominal; else totalKeluar+=item.trx.nominal;
  });
  var selisih=totalMasuk-totalKeluar;
  var saldoAkhir=saldoAwal+selisih;
  var periodeLabel=(cDari||'Awal')+' s/d '+(cSampai||'Akhir');

  if(type==='print'){
    var kasSection=kasPrintSectionHtml(periodItems,saldoAwal,totalMasuk,totalKeluar,selisih,saldoAkhir);
    var printedAt=new Date().toLocaleString('id-ID',{dateStyle:'long',timeStyle:'short'});
var grpNama = (currentGroupInfo && currentGroupInfo.displayName) || 'Muda-Mudi';
var html='<!DOCTYPE html><html><head><meta charset="UTF-8">'+
      '<title>Laporan Keuangan '+grpNama+' Margosari — '+periodeLabel+'</title>'+
      '<link rel="preconnect" href="https://fonts.googleapis.com">'+
      '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'+
      '<link href="https://fonts.googleapis.com/css2?family=Zilla+Slab:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">'+
      '<style>*{box-sizing:border-box;margin:0;padding:0}'+
      'body{font-family:"IBM Plex Sans",system-ui,sans-serif;font-size:11px;color:#1f2937;background:#fbf9f6;padding:24px 28px;-webkit-print-color-adjust:exact;print-color-adjust:exact}'+
      '.print-header{display:flex;align-items:center;justify-content:space-between;padding-bottom:14px;margin-bottom:18px;border-bottom:2px solid #1b4332}'+
      '.ph-left{display:flex;align-items:center;gap:14px}.ph-icon{width:46px;height:46px;background:#ebf5f0;border:1.5px solid #1b4332;border-radius:12px;display:flex;align-items:center;justify-content:center}'+
      '.ph-sub{font-size:9.5px;color:#1b4332;letter-spacing:.6px;font-weight:700;text-transform:uppercase;margin-bottom:3px}.ph-title{font-family:"Zilla Slab",Georgia,serif;font-weight:600;font-size:19px;color:#1f2937}'+
      '.ph-right{text-align:right}.ph-period-lbl{font-size:9px;color:#717973;letter-spacing:.3px;text-transform:uppercase;margin-bottom:3px}.ph-period-val{font-size:15px;font-weight:700;color:#1f2937}'+
      '.ph-badge{display:inline-block;margin-top:4px;background:#ebf5f0;border:1px solid #1b4332;color:#1b4332;font-size:9px;font-weight:700;padding:2px 10px;border-radius:20px;letter-spacing:.3px}'+
      '.cf-donut-row{display:flex;gap:12px;margin-bottom:16px;align-items:stretch}.cf-box,.donut-box{background:#ffffff;box-shadow:0 1px 3px rgba(28,25,23,.07)}'+
      '.cf-box{flex:1;border:1px solid #e8e6df;border-radius:12px;overflow:hidden}'+
      '.cf-box-title{font-size:9.5px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:#4b5563;padding:10px 12px;border-bottom:1px solid #e8e6df;background:#fbf9f6}'+
      '.cf-row{display:flex;align-items:center;padding:9px 12px;border-bottom:1px solid #e8e6df;gap:10px;font-size:10.5px}.cf-row:last-child{border-bottom:none}'+
      '.cf-icon{width:22px;height:22px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:11px;flex-shrink:0}.cf-lbl{flex:1;color:#4b5563}.cf-val{font-weight:600}'+
      '.cf-saldo-akhir{display:flex;align-items:center;justify-content:space-between;padding:11px 12px;background:#ebf5f0;border-top:2px solid #1b4332}.cf-sa-lbl{font-size:11px;font-weight:700;color:#1b4332}.cf-sa-val{font-size:15px;font-weight:700;color:#1b4332}'+
      '.donut-box{width:184px;flex-shrink:0;border:1px solid #e8e6df;border-radius:12px;display:flex;flex-direction:column;align-items:center;padding:12px;gap:8px}'+
      '.donut-box-title{font-size:9.5px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:#4b5563;align-self:flex-start;margin-bottom:4px}.donut-legend{width:100%;font-size:10px}'+
      '.donut-leg-row{display:flex;align-items:center;gap:6px;margin-bottom:5px}.donut-dot{width:9px;height:9px;border-radius:2px;flex-shrink:0}.donut-leg-lbl{flex:1;color:#4b5563}.donut-leg-val{font-weight:700;font-size:10px}'+
      '.section-title{font-size:10px;font-weight:700;color:#1f2937;text-transform:uppercase;letter-spacing:.6px;margin-bottom:6px;display:flex;align-items:center;gap:8px}.section-title::after{content:"";flex:1;height:1px;background:#e8e6df}'+
      'table{width:100%;border-collapse:collapse;border:1px solid #e8e6df;border-radius:12px;overflow:hidden}thead tr{background:#fbf9f6}th{padding:7px 9px;font-size:9px;font-weight:700;color:#4b5563;letter-spacing:.3px;text-align:left;text-transform:uppercase;border-bottom:2px solid #1b4332}'+
      'td{padding:6px 9px;border-bottom:1px solid #e8e6df;vertical-align:top}.num{text-align:right}.bold{font-weight:700}.green{color:#2d6a4f}.red{color:#ba1a1a}'+
      '.saldo-awal-row td{background:#ebf5f0}.total-row td{background:#ebf5f0;font-weight:700;border-top:2px solid #1b4332}'+
      '.footer{margin-top:16px;padding-top:10px;border-top:2px solid #1b4332;display:flex;justify-content:space-between;align-items:flex-end}.footer-left{font-size:9px;color:#717973}'+
      '.sign-box{text-align:center;font-size:9.5px}.sign-line{width:130px;border-top:1px solid #717973;margin:28px auto 4px}'+
      '@media print{body{background:#ffffff;padding:12px 16px}.no-print{display:none!important}.cf-box,.donut-box{box-shadow:none}}'+
      '</style></head><body>'+
      '<div class="print-header"><div class="ph-left"><div class="ph-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1b4332" stroke-width="1.8"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/></svg></div>'+
      '<div><div class="ph-sub">Laporan Keuangan</div><div class="ph-title">'+grpNama+' Margosari</div></div></div>'+
      '<div class="ph-right"><div class="ph-period-lbl">Periode Aktif</div><div class="ph-period-val">'+periodeLabel+'</div><div class="ph-badge">Kas &amp; Keuangan</div></div></div>'+
      kasSection+
      '<div class="footer"><div class="footer-left">Dicetak: '+printedAt+'<br>Sistem Rekap Absensi '+grpNama+' Margosari</div>'+
      '<div class="sign-box"><div class="sign-line"></div>Bendahara / Penanggung Jawab</div></div>'+
      '</body></html>';
    _printWithIframe(html);
  } else if(type==='excel'){
    var wb=XLSX.utils.book_new();
    var wsData=[['Tanggal','Keterangan','Masuk','Keluar','Saldo']];
    wsData.push(['Saldo Awal','','','',saldoAwal]);
    periodItems.forEach(function(item){
      var trx=item.trx;
      wsData.push([fmtTglShort(trx.tanggal),trx.keterangan||'',trx.jenis==='pemasukan'?trx.nominal:'',trx.jenis==='pengeluaran'?trx.nominal:'',item.saldo]);
    });
    wsData.push(['TOTAL','',totalMasuk,totalKeluar,saldoAkhir]);
    var ws=XLSX.utils.aoa_to_sheet(wsData);
    try{
      ws['!cols']=[{wch:14},{wch:34},{wch:14},{wch:14},{wch:14}];
      ws['!autofilter']={s:{r:0,c:0},e:{r:0,c:4}};
      ws['!freeze']='A2';
    }catch(e){}
    XLSX.utils.book_append_sheet(wb,ws,'Kas '+periodeLabel);
    XLSX.writeFile(wb,'Laporan_Kas_'+periodeLabel.replace(/\s+/g,'_')+'.xlsx');
  } else if(type==='csv'){
    var lines=['Tanggal,Keterangan,Masuk,Keluar,Saldo'];
    lines.push('"Saldo Awal","","","",'+saldoAwal);
    periodItems.forEach(function(item){
      var trx=item.trx;
      lines.push('"'+fmtTglShort(trx.tanggal)+'","'+(trx.keterangan||'')+'","'+(trx.jenis==='pemasukan'?trx.nominal:'')+'","'+(trx.jenis==='pengeluaran'?trx.nominal:'')+'",'+item.saldo);
    });
    lines.push('"TOTAL","",'+totalMasuk+','+totalKeluar+','+saldoAkhir);
    var a=document.createElement('a');
    a.href='data:text/csv;charset=utf-8,\uFEFF'+encodeURIComponent(lines.join('\n'));
    a.download='Laporan_Kas_'+periodeLabel.replace(/\s+/g,'_')+'.csv';
    a.click();
  }
}
