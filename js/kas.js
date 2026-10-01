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
// ── SECTION LAPORAN KAS UNTUK CETAK ──
// Dipakai export kas standalone (portrait) MAUPUN tertanam di dokumen
// rekap landscape (gabungan + semua kelompok): markup fleksibel (wrap)
// sehingga rapi di keduanya. Struktur: ringkasan 5 kartu (Saldo Akhir
// ditonjolkan SEKALI) + donat komposisi tunggal + tabel detail +
// catatan full-width di bawah tabel. Perhitungan tidak diubah.
function kasPrintSectionHtml(periodItems, saldoAwal, totalMasuk, totalKeluar, selisih, saldoAkhir, catatan){
  function mini(title, val, color, bg, bd){
    return '<div class="ks-mini" style="background:'+bg+';border:1px solid '+bd+'">'+
      '<div class="ks-mini-t">'+title+'</div>'+
      '<div class="ks-mini-v" style="color:'+color+'">'+val+'</div></div>';
  }
  var sumHtml='<div class="ks-sum">'+
    mini('Saldo Awal', fmtRp(saldoAwal), '#1f2937', '#fbf9f6', '#e8e6df')+
    mini('Total Pemasukan', '+'+fmtRp(totalMasuk), '#2d6a4f', '#ebf5f0', '#c1ecd4')+
    mini('Total Pengeluaran', '−'+fmtRp(totalKeluar), '#ba1a1a', '#fff1f2', '#ffdad6')+
    mini('Selisih', (selisih<0?'−':'+')+fmtRp(Math.abs(selisih)), selisih>=0?'#2d6a4f':'#ba1a1a', '#fbf9f6', '#e8e6df')+
    '<div class="ks-mini ks-hero" style="background:#ebf5f0;border:1px solid #1b4332">'+
      '<div class="ks-mini-t" style="color:#1b4332">Saldo Akhir</div>'+
      '<div class="ks-mini-v" style="color:#1b4332">'+fmtRp(saldoAkhir)+'</div></div>'+
  '</div>';
  var donutR=54,donutCx=70,donutCy=70,donutW=14;
  var donutTotal=totalMasuk+totalKeluar;
  var donutHtml='';
  if(donutTotal>0){
    var pctMasuk=totalMasuk/donutTotal,pctKeluar=totalKeluar/donutTotal;
    var circ=2*Math.PI*donutR;
    var dashM=pctMasuk*circ,gapM=circ-dashM,dashK=pctKeluar*circ,gapK=circ-dashK,rotateK=-90+pctMasuk*360;
    donutHtml='<div class="ks-donut"><div class="ks-donut-ttl">Komposisi Periode</div>'+
      '<svg width="120" height="120" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">'+
      '<circle cx="'+donutCx+'" cy="'+donutCy+'" r="'+donutR+'" fill="none" stroke="#e8e6df" stroke-width="'+donutW+'"/>'+
      '<circle cx="'+donutCx+'" cy="'+donutCy+'" r="'+donutR+'" fill="none" stroke="#2d6a4f" stroke-width="'+donutW+'" stroke-dasharray="'+dashM+' '+gapM+'" transform="rotate(-90 '+donutCx+' '+donutCy+')" stroke-linecap="round"/>'+
      (totalKeluar>0?'<circle cx="'+donutCx+'" cy="'+donutCy+'" r="'+donutR+'" fill="none" stroke="#ba1a1a" stroke-width="'+donutW+'" stroke-dasharray="'+dashK+' '+gapK+'" transform="rotate('+rotateK+' '+donutCx+' '+donutCy+')" stroke-linecap="round"/>':'')+
      '<text x="'+donutCx+'" y="'+(donutCy-2)+'" text-anchor="middle" font-size="13" font-weight="700" fill="#1f2937">'+Math.round(pctMasuk*100)+'%</text>'+
      '<text x="'+donutCx+'" y="'+(donutCy+13)+'" text-anchor="middle" font-size="9" fill="#717973">Masuk</text>'+
      '</svg>'+
      '<div class="ks-donut-legend">'+
      (totalMasuk>0?'<div class="donut-leg-row"><div class="donut-dot" style="background:#2d6a4f"></div><span class="donut-leg-lbl">Pemasukan (+)</span><span class="donut-leg-val" style="color:#2d6a4f">'+fmtRp(totalMasuk)+'</span></div>':'')+
      (totalKeluar>0?'<div class="donut-leg-row"><div class="donut-dot" style="background:#ba1a1a"></div><span class="donut-leg-lbl">Pengeluaran (−)</span><span class="donut-leg-val" style="color:#ba1a1a">'+fmtRp(totalKeluar)+'</span></div>':'')+
      '</div></div>';
  }
  var rows='',rowNo=1;
  rows+='<tr class="saldo-awal-row"><td colspan="2" style="font-style:italic;color:#4b5563;font-size:10.5px">Saldo Awal Periode</td><td></td><td></td><td class="num bold" style="color:#b45309">'+fmtRp(saldoAwal)+'</td></tr>';
  periodItems.forEach(function(item){
    var trx=item.trx;
    var masuk =trx.jenis==='pemasukan'   ?'+'+fmtRp(trx.nominal):'-';
    var keluar=trx.jenis==='pengeluaran' ?'−'+fmtRp(trx.nominal):'-';
    var shade=rowNo%2===0?'background:#fbf9f6':'';
    rows+='<tr style="'+shade+'"><td style="white-space:nowrap;font-size:10.5px">'+fmtTglShort(trx.tanggal)+'</td><td class="ks-ket">'+escHtml(trx.keterangan||'')+'</td><td class="num green" style="font-size:10.5px">'+masuk+'</td><td class="num red" style="font-size:10.5px">'+keluar+'</td><td class="num bold" style="font-size:10.5px">'+fmtRp(item.saldo)+'</td></tr>';
    rowNo++;
  });
  var tableHtml='<div class="section-title">Detail Transaksi</div>'+
    '<table class="ks-table"><thead><tr><th>Tanggal</th><th>Keterangan</th><th style="text-align:right">Masuk (Rp)</th><th style="text-align:right">Keluar (Rp)</th><th style="text-align:right">Saldo (Rp)</th></tr></thead>'+
    '<tbody>'+rows+
    '<tr class="total-row"><td colspan="2">TOTAL PERIODE</td><td class="num green">+'+fmtRp(totalMasuk)+'</td><td class="num red">−'+fmtRp(totalKeluar)+'</td><td class="num bold">'+fmtRp(saldoAkhir)+'</td></tr>'+
    '</tbody></table>';
  var noteHtml='';
  if(catatan){
    var _ct=escHtml(catatan).replace(/\r\n/g,'\n').replace(/\n/g,'<br>');
    noteHtml='<div class="section-title">Catatan / Hasil Musyawarah</div>'+
      '<div class="tbl-card ks-note"><div class="catatan-text">'+_ct+'</div></div>';
  }
  return sumHtml+donutHtml+tableHtml+noteHtml;
}

// ── LAPORAN KAS MODEL STITCH (A4 landscape) ──
// Khusus kasExport 'print'. Seluruh angka berasal dari parameter (perhitungan
// kasExport/kasCalcRunning yang tidak diubah). Tanpa Tailwind/CDN, tanpa
// media-query responsif: layout tetap flex/grid persen agar aman di iframe
// print dan pagination (>1 halaman: tabel lanjut lebar penuh).
function kasBuildLaporanHtml(o){
  var periodItems = o.periodItems || [];
  var saldoAwal = o.saldoAwal || 0, totalMasuk = o.totalMasuk || 0;
  var totalKeluar = o.totalKeluar || 0, selisih = o.selisih || 0;
  var saldoAkhir = o.saldoAkhir || 0, catatan = o.catatan || '';
  var grpNama = o.grpNama || 'Muda-Mudi';
  var periodeLabel = o.periodeLabel || '';
  var printedAt = o.printedAt || '';
  var tglAkhirLbl = o.tglAkhirLbl || '';
  var nMasuk = 0, nKeluar = 0, maxItem = null;
  periodItems.forEach(function(it){
    if(it.trx.jenis === 'pemasukan'){ nMasuk++; } else { nKeluar++; }
    if(!maxItem || it.trx.nominal > maxItem.trx.nominal) maxItem = it;
  });
  var isSurplus = selisih >= 0;
  var donutTotal = totalMasuk + totalKeluar;
  var pctMasuk = donutTotal > 0 ? Math.round(totalMasuk / donutTotal * 100) : 0;
  // Donat: track + busur keluar (offset 0) + busur masuk (offset -lenKeluar).
  var dR = 54, dC = 70, dCirc = 2 * Math.PI * dR;
  var lenK = donutTotal > 0 ? totalKeluar / donutTotal * dCirc : 0;
  var lenM = donutTotal > 0 ? totalMasuk / donutTotal * dCirc : 0;
  var donutSvg = '<svg width="132" height="132" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">' +
    '<circle cx="' + dC + '" cy="' + dC + '" r="' + dR + '" fill="none" stroke="#e8e6df" stroke-width="14"/>';
  if(donutTotal > 0){
    if(totalKeluar > 0) donutSvg += '<circle cx="' + dC + '" cy="' + dC + '" r="' + dR + '" fill="none" stroke="#ba1a1a" stroke-width="14" stroke-dasharray="' + lenK + ' ' + dCirc + '" stroke-dashoffset="0" transform="rotate(-90 ' + dC + ' ' + dC + ')" stroke-linecap="round"/>';
    if(totalMasuk > 0) donutSvg += '<circle cx="' + dC + '" cy="' + dC + '" r="' + dR + '" fill="none" stroke="#2d6a4f" stroke-width="14" stroke-dasharray="' + lenM + ' ' + dCirc + '" stroke-dashoffset="' + (-lenK) + '" transform="rotate(-90 ' + dC + ' ' + dC + ')" stroke-linecap="round"/>';
    donutSvg += '<text x="' + dC + '" y="' + (dC - 1) + '" text-anchor="middle" font-size="16" font-weight="800" fill="#1f2937">' + pctMasuk + '%</text>' +
      '<text x="' + dC + '" y="' + (dC + 15) + '" text-anchor="middle" font-size="9" font-weight="600" fill="#717973">MASUK</text>';
  } else {
    donutSvg += '<text x="' + dC + '" y="' + (dC + 4) + '" text-anchor="middle" font-size="11" fill="#717973">Kosong</text>';
  }
  donutSvg += '</svg>';
  function kpi(title, val, sub, bg, bd, tColor, vColor){
    return '<div style="background:' + bg + ';border:1px solid ' + bd + ';border-radius:10px;padding:9px 11px;min-width:0">' +
      '<div style="font-size:8.5px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:' + tColor + '">' + title + '</div>' +
      '<div style="margin-top:3px;font-size:14px;font-weight:800;color:' + vColor + ';font-family:\'IBM Plex Mono\',monospace;font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + val + '</div>' +
      '<div style="font-size:9px;color:' + tColor + ';margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + sub + '</div></div>';
  }
  var kpiHtml = '<div style="display:grid;grid-template-columns:1.1fr 1.2fr 1.2fr 1.2fr 1.3fr;gap:8px;margin:12px 0;break-inside:avoid;page-break-inside:avoid">' +
    kpi('Saldo Awal', fmtRp(saldoAwal), 'Bawaan periode sebelumnya', '#fbf9f6', '#e8e6df', '#717973', '#1f2937') +
    kpi('Total Pemasukan', '+' + fmtRp(totalMasuk), nMasuk + ' transaksi pemasukan', '#ebf5f0', '#c1ecd4', '#2d6a4f', '#2d6a4f') +
    kpi('Total Pengeluaran', '−' + fmtRp(totalKeluar), nKeluar + ' transaksi pengeluaran', '#fff1f2', '#ffdad6', '#ba1a1a', '#ba1a1a') +
    kpi('Arus Kas Bersih', (isSurplus ? '+' : '−') + fmtRp(Math.abs(selisih)), isSurplus ? 'Surplus periode ini' : 'Defisit periode ini', '#fef3c7', '#ffdcbd', '#b45309', isSurplus ? '#2d6a4f' : '#ba1a1a') +
    '<div style="background:#1b4332;border:1px solid #1b4332;border-radius:10px;padding:9px 11px;min-width:0">' +
      '<div style="font-size:8.5px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:#a7d7c5">Saldo Akhir</div>' +
      '<div style="margin-top:3px;font-size:15px;font-weight:800;color:#ffffff;font-family:\'IBM Plex Mono\',monospace;font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + fmtRp(saldoAkhir) + '</div>' +
      '<div style="font-size:9px;color:#a7d7c5;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Posisi per ' + escHtml(tglAkhirLbl) + '</div></div>' +
  '</div>';
  var legendHtml = '<div style="font-size:10.5px">' +
    (totalMasuk > 0 ? '<div style="display:flex;align-items:center;gap:7px;margin-bottom:6px"><span style="width:10px;height:10px;border-radius:50%;background:#2d6a4f;flex-shrink:0"></span><span style="color:#4b5563;flex:1">Pemasukan</span><span style="font-weight:700;font-family:\'IBM Plex Mono\',monospace">' + fmtRp(totalMasuk) + '</span></div>' : '') +
    (totalKeluar > 0 ? '<div style="display:flex;align-items:center;gap:7px"><span style="width:10px;height:10px;border-radius:50%;background:#ba1a1a;flex-shrink:0"></span><span style="color:#4b5563;flex:1">Pengeluaran</span><span style="font-weight:700;font-family:\'IBM Plex Mono\',monospace">' + fmtRp(totalKeluar) + '</span></div>' : '') +
    ((totalMasuk <= 0 && totalKeluar <= 0) ? '<div style="color:#717973">Belum ada transaksi.</div>' : '') +
  '</div>';
  var noteInner = '';
  if(catatan){
    noteInner = escHtml(catatan).replace(/\r\n/g, '\n').replace(/\n/g, '<br>');
  } else if(maxItem){
    noteInner = 'Transaksi terbesar: <b>' + escHtml(maxItem.trx.keterangan || 'Tanpa keterangan') + '</b> — ' +
      fmtRp(maxItem.trx.nominal) + ' (' + (maxItem.trx.jenis === 'pemasukan' ? 'pemasukan' : 'pengeluaran') + '). ' +
      'Total ' + periodItems.length + ' catatan (' + nMasuk + ' masuk, ' + nKeluar + ' keluar).';
  }
  // Kolom kiri ala Stitch: kartu komposisi (donat + legenda + sorotan saldo)
  // + kartu catatan. Kolom kanan: judul + tabel penuh.
  var asideHtml = '<div style="min-width:0">' +
    '<div style="border:1px solid #e8e6df;border-radius:12px;background:#fbf9f6;padding:12px 14px;break-inside:avoid;page-break-inside:avoid">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;padding-bottom:8px;margin-bottom:8px;border-bottom:1px solid #e8e6df">' +
        '<span style="font-size:9.5px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:#4b5563">Komposisi Kas</span>' +
        '<span style="font-size:9px;font-weight:700;color:#4b5563;background:#e8e6df;border-radius:99px;padding:2px 9px">Rasio</span></div>' +
      '<div style="display:flex;justify-content:center;padding:4px 0 8px">' + donutSvg + '</div>' +
      '<div style="border-top:1px solid #e8e6df;padding-top:8px">' + legendHtml + '</div>' +
      '<div style="margin-top:8px;background:#ebf5f0;border:1px solid #c1ecd4;border-radius:8px;padding:8px 10px;display:flex;align-items:center;justify-content:space-between;gap:8px">' +
        '<div style="min-width:0"><div style="font-size:8.5px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:#2d6a4f">Saldo Akhir</div>' +
        '<div style="font-size:13px;font-weight:800;color:#1b4332;font-family:\'IBM Plex Mono\',monospace;font-variant-numeric:tabular-nums">' + fmtRp(saldoAkhir) + '</div></div>' +
        '<span style="width:24px;height:24px;border-radius:50%;background:#c1ecd4;color:#1b4332;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0">✓</span></div>' +
    '</div>' +
    (noteInner ? '<div style="margin-top:10px;border:1px solid #e8e6df;border-radius:12px;background:#ffffff;padding:12px 14px;break-inside:avoid;page-break-inside:avoid">' +
      '<div style="font-size:9.5px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:#1f2937;margin-bottom:6px">Catatan Arus Dana</div>' +
      '<div style="font-size:10.5px;line-height:1.7;color:#4b5563;overflow-wrap:break-word;word-break:break-word">' + noteInner + '</div></div>' : '') +
  '</div>';
  var rowsHtml = '<tr style="background:#ebf5f0"><td style="text-align:center;color:#717973">−</td><td style="color:#717973">−</td>' +
    '<td style="font-weight:600">Saldo Awal Periode</td>' +
    '<td style="text-align:right;color:#717973">−</td><td style="text-align:right;color:#717973">−</td>' +
    '<td style="text-align:right;font-weight:700;color:#b45309">' + fmtRp(saldoAwal) + '</td></tr>';
  periodItems.forEach(function(item, i){
    var trx = item.trx;
    var zebra = (i % 2 === 1) ? 'background:#fbf9f6' : '';
    rowsHtml += '<tr style="' + zebra + '"><td style="text-align:center;color:#717973">' + (i + 1) + '</td>' +
      '<td style="white-space:nowrap">' + fmtTglShort(trx.tanggal) + '</td>' +
      '<td style="font-weight:500">' + escHtml(trx.keterangan || '') + '</td>' +
      '<td style="text-align:right;color:' + (trx.jenis === 'pemasukan' ? '#2d6a4f;font-weight:600' : '#d1d5db') + '">' + (trx.jenis === 'pemasukan' ? '+' + fmtRp(trx.nominal) : '−') + '</td>' +
      '<td style="text-align:right;color:' + (trx.jenis === 'pengeluaran' ? '#ba1a1a;font-weight:600' : '#d1d5db') + '">' + (trx.jenis === 'pengeluaran' ? '−' + fmtRp(trx.nominal) : '−') + '</td>' +
      '<td style="text-align:right;font-weight:700">' + fmtRp(item.saldo) + '</td></tr>';
  });
  // Grid 2 kolom ala Stitch: kiri donat+catatan (±28%), kanan tabel (±72%).
  // Catatan: halaman lanjutan (>1 halaman) tabel tetap di kolom kanan —
  // area kiri yang kosong di halaman lanjutan adalah konsekuensi layout ini.
  var tableHtml = '<div style="display:flex;align-items:center;gap:8px;margin:2px 0 8px;break-after:avoid;page-break-after:avoid">' +
      '<span style="width:4px;height:16px;background:#1b4332;border-radius:2px;flex-shrink:0"></span>' +
      '<span style="font-size:11px;font-weight:700;letter-spacing:.6px;text-transform:uppercase">Buku Kas &amp; Detail Transaksi</span>' +
      '<span style="margin-left:auto;font-size:10px;color:#717973">Total ' + periodItems.length + ' catatan pembukuan</span></div>' +
    '<table style="width:100%;border-collapse:collapse;font-size:10.5px">' +
    '<thead><tr>' +
      '<th style="width:34px">No</th><th style="width:78px">Tanggal</th><th>Keterangan Transaksi</th>' +
      '<th style="text-align:right;width:110px">Masuk (Rp)</th><th style="text-align:right;width:110px">Keluar (Rp)</th><th style="text-align:right;width:120px">Saldo (Rp)</th>' +
    '</tr></thead>' +
    '<tbody>' + rowsHtml + '</tbody>' +
    '<tfoot><tr>' +
      '<td colspan="3" style="font-size:9.5px;font-weight:700;letter-spacing:.5px;text-transform:uppercase">Total Periode</td>' +
      '<td style="text-align:right;font-weight:800;color:#2d6a4f">+' + fmtRp(totalMasuk) + '</td>' +
      '<td style="text-align:right;font-weight:800;color:#ba1a1a">−' + fmtRp(totalKeluar) + '</td>' +
      '<td style="text-align:right;font-weight:800;background:#ebf5f0">' + fmtRp(saldoAkhir) + '</td>' +
    '</tr></tfoot></table>';
  // Grid 2 kolom ala Stitch: kiri donat+catatan (±292px), kanan tabel.
  // Halaman lanjutan: tabel tetap di kolom kanan (area kiri kosong di
  // halaman lanjutan — konsekuensi layout Stitch ini).
  var body2col = '<div style="display:grid;grid-template-columns:292px minmax(0,1fr);gap:12px;align-items:start">' +
    asideHtml +
    '<div style="min-width:0">' + tableHtml + '</div>' +
  '</div>';
  return '<!DOCTYPE html><html><head><meta charset="UTF-8">' +
    '<title>Laporan Keuangan ' + escHtml(grpNama) + ' Margosari — ' + escHtml(periodeLabel) + '</title>' +
    '<link rel="preconnect" href="https://fonts.googleapis.com">' +
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
    '<link href="https://fonts.googleapis.com/css2?family=Zilla+Slab:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">' +
    '<style>@page{size:A4 landscape;margin:8mm}' +
    '*{box-sizing:border-box;margin:0;padding:0}' +
    'body{font-family:"IBM Plex Sans",system-ui,sans-serif;font-size:11px;color:#1f2937;background:#ffffff;padding:7mm 9mm;-webkit-print-color-adjust:exact;print-color-adjust:exact}' +
    '.kophd{display:flex;justify-content:space-between;gap:16px;padding-bottom:10px;margin-bottom:4px;border-bottom:3px solid #1b4332;break-inside:avoid;page-break-inside:avoid}' +
    '.kop-l{display:flex;gap:12px;align-items:flex-start;min-width:0}' +
    '.kop-ic{width:52px;height:52px;border-radius:14px;background:#ebf5f0;border:1px solid #c1ecd4;display:flex;align-items:center;justify-content:center;flex-shrink:0}' +
    '.kop-badge{display:inline-block;font-size:9px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:#1b4332;background:#ebf5f0;border:1px solid #c1ecd4;border-radius:99px;padding:2px 10px}' +
    '.kop-h1{font-family:"Zilla Slab",Georgia,serif;font-weight:700;font-size:24px;color:#1f2937;margin-top:2px}' +
    '.kop-sub{font-size:11px;color:#717973;margin-top:1px}' +
    '.kop-r{text-align:right;flex-shrink:0}' +
    '.kop-pl{font-size:9px;font-weight:600;letter-spacing:.6px;text-transform:uppercase;color:#717973}' +
    '.kop-per{font-size:14px;font-weight:700;font-family:"IBM Plex Mono",monospace;font-variant-numeric:tabular-nums;margin-top:2px}' +
    '.kop-tag{display:inline-block;font-size:9.5px;font-weight:700;color:#ffffff;background:#1b4332;border-radius:99px;padding:2px 11px;margin-top:5px}' +
    'table thead{display:table-header-group}' +
    'table thead th{background:#1b4332;color:#ffffff;font-size:8.5px;font-weight:700;letter-spacing:.4px;text-transform:uppercase;padding:7px 9px;text-align:left;border:1px solid #1b4332}' +
    'table thead th:last-child{border-right:1px solid #1b4332}' +
    'table tbody td{padding:6px 9px;border:1px solid #e8e6df;vertical-align:top;font-size:10.5px;overflow-wrap:break-word;word-break:break-word}' +
    'table tbody td.num,table td.num{text-align:right;font-family:"IBM Plex Mono",monospace;font-variant-numeric:tabular-nums}' +
    'table tbody tr{break-inside:avoid;page-break-inside:avoid}' +
    'table tfoot{display:table-row-group}' +
    'table tfoot td{padding:8px 9px;border:1px solid #e8e6df;border-top:2px solid #1b4332;background:#fbf9f6;font-family:"IBM Plex Mono",monospace;font-variant-numeric:tabular-nums;font-size:10.5px}' +
    '.sig{margin-top:14px;padding-top:10px;border-top:1px solid #e8e6df;display:flex;gap:16px;align-items:flex-end;break-inside:avoid;page-break-inside:avoid;break-before:avoid;page-break-before:avoid}' +
    '.sig-meta{flex:1;min-width:0;font-size:9.5px;color:#717973;line-height:1.7}' +
    '.sig-cols{display:grid;grid-template-columns:1fr 1fr;gap:28px;width:360px;flex-shrink:0;text-align:center}' +
    '.sig-role{font-size:10.5px;color:#4b5563}' +
    '.sig-space{height:56px}' +
    '.sig-name{border-top:1px solid #717973;padding-top:5px;font-size:10.5px;font-weight:700;text-transform:uppercase}' +
    '.sig-sub{font-size:9px;color:#717973;margin-top:1px}' +
    '@media print{body{background:#ffffff}}' +
    '</style></head><body>' +
    '<div class="kophd"><div class="kop-l"><div class="kop-ic">' +
      '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1b4332" stroke-width="1.8"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/></svg></div>' +
      '<div><span class="kop-badge">Laporan Rekapitulasi Keuangan</span>' +
      '<div class="kop-h1">' + escHtml(grpNama) + ' Margosari</div>' +
      '<div class="kop-sub">Laporan Arus Kas Periode Berjalan</div></div></div>' +
    '<div class="kop-r"><div class="kop-pl">Periode Aktif Pembukuan</div>' +
      '<div class="kop-per">' + escHtml(periodeLabel) + '</div>' +
      '<span class="kop-tag">Kas &amp; Keuangan</span></div></div>' +
    kpiHtml + body2col +
    '<div class="sig"><div class="sig-meta">Dicetak: ' + escHtml(printedAt) + '<br>Sistem Rekap Absensi ' + escHtml(grpNama) + ' Margosari</div>' +
    '<div class="sig-cols"><div><div class="sig-role">Bendahara Keuangan,</div><div class="sig-space"></div>' +
      '<div class="sig-name">Bendahara ' + escHtml(grpNama) + '</div><div class="sig-sub">Pengelola Kas Margosari</div></div>' +
    '<div><div class="sig-role">Mengetahui &amp; Menyetujui,</div><div class="sig-space"></div>' +
      '<div class="sig-name">Ketua / Penanggung Jawab</div><div class="sig-sub">' + escHtml(grpNama) + ' Margosari</div></div></div></div>' +
    '</body></html>';
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
    var printedAt=new Date().toLocaleString('id-ID',{dateStyle:'long',timeStyle:'short'});
    var grpNama=(currentGroupInfo && currentGroupInfo.displayName) || 'Muda-Mudi';
    var _today=new Date();
    var _todayIso=_today.getFullYear()+'-'+String(_today.getMonth()+1).padStart(2,'0')+'-'+String(_today.getDate()).padStart(2,'0');
    _printWithIframe(kasBuildLaporanHtml({
      periodItems: periodItems, saldoAwal: saldoAwal, totalMasuk: totalMasuk,
      totalKeluar: totalKeluar, selisih: selisih, saldoAkhir: saldoAkhir,
      catatan: '', grpNama: grpNama, periodeLabel: periodeLabel,
      printedAt: printedAt, tglAkhirLbl: cSampai ? fmtTglShort(cSampai) : fmtTglShort(_todayIso)
    }));
  } else if(type==='excel'){
    var wb=XLSX.utils.book_new();
    var printedAtXls=new Date().toLocaleString('id-ID',{dateStyle:'long',timeStyle:'short'});
    var grpNamaXls=(currentGroupInfo && currentGroupInfo.displayName) || 'Muda-Mudi';
    // SheetJS Community Edition tidak mendukung styling sel (tebal/warna/
    // number-format/wrap): yang didukung hanya nilai, !cols, !autofilter,
    // !freeze. Angka dibiarkan numerik agar bisa dijumlah di Excel/Sheets.
    var wsData=[
      ['Laporan Keuangan '+grpNamaXls+' Margosari'],
      ['Periode: '+periodeLabel],
      ['Dicetak: '+printedAtXls],
      [],
      ['Tanggal','Keterangan','Masuk','Keluar','Saldo']
    ];
    wsData.push(['Saldo Awal','','','',saldoAwal]);
    periodItems.forEach(function(item){
      var trx=item.trx;
      wsData.push([fmtTglShort(trx.tanggal),trx.keterangan||'',trx.jenis==='pemasukan'?trx.nominal:'',trx.jenis==='pengeluaran'?trx.nominal:'',item.saldo]);
    });
    wsData.push(['TOTAL','',totalMasuk,totalKeluar,saldoAkhir]);
    wsData.push([]);
    wsData.push(['RINGKASAN']);
    wsData.push(['Saldo Awal',saldoAwal]);
    wsData.push(['Total Pemasukan',totalMasuk]);
    wsData.push(['Total Pengeluaran',totalKeluar]);
    wsData.push(['Selisih',selisih]);
    wsData.push(['Saldo Akhir',saldoAkhir]);
    var ws=XLSX.utils.aoa_to_sheet(wsData);
    try{
      ws['!cols']=[{wch:14},{wch:40},{wch:16},{wch:16},{wch:16}];
      ws['!autofilter']={s:{r:4,c:0},e:{r:4,c:4}};
      ws['!freeze']='A6';
    }catch(e){}
    XLSX.utils.book_append_sheet(wb,ws,'Kas '+periodeLabel);
    XLSX.writeFile(wb,'Laporan_Kas_'+periodeLabel.replace(/\s+/g,'_')+'.xlsx');
  } else if(type==='csv'){
    var lines=['Tanggal,Keterangan,Masuk,Keluar,Saldo'];
    lines.push('"Saldo Awal","","","",'+saldoAwal);
    periodItems.forEach(function(item){
      var trx=item.trx;
      lines.push('"'+fmtTglShort(trx.tanggal)+'","'+csvEsc(trx.keterangan||'')+'","'+(trx.jenis==='pemasukan'?trx.nominal:'')+'","'+(trx.jenis==='pengeluaran'?trx.nominal:'')+'",'+item.saldo);
    });
    lines.push('"TOTAL","",'+totalMasuk+','+totalKeluar+','+saldoAkhir);
    var a=document.createElement('a');
    a.href='data:text/csv;charset=utf-8,\uFEFF'+encodeURIComponent(lines.join('\n'));
    a.download='Laporan_Kas_'+periodeLabel.replace(/\s+/g,'_')+'.csv';
    a.click();
  }
}

// Escape CSV: gandakan kutip (") di dalam field ber-kutip. BOM UTF-8
// tetap dipakai saat unduh agar Excel Windows membaca non-ASCII benar.
function csvEsc(s){
  return String(s == null ? '' : s).replace(/"/g, '""');
}
