/* App global script: tema, fetch dinámico, skeletons, toasts, validación, paginación, export */
(function(){
  const root = document.documentElement;
  const THEME_KEY = 'theme';
  function applyStoredTheme(){ const t = localStorage.getItem(THEME_KEY); if(t==='dark'){ root.classList.add('dark'); } else { root.classList.remove('dark'); } }
  function toggleTheme(){ const isDark = root.classList.toggle('dark'); localStorage.setItem(THEME_KEY, isDark?'dark':'light'); syncThemeIcon(); }
  function syncThemeIcon(){ const icon = document.getElementById('themeIcon'); if(!icon) return; icon.innerHTML = root.classList.contains('dark') ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>' : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364 6.364l-1.414-1.414M8.05 8.05L6.636 6.636m0 10.728l1.414-1.414M17.95 8.05l1.414-1.414"/>'; }
  document.addEventListener('click', (e)=>{ if(e.target && (e.target.id==='toggleTheme' || e.target.closest('#toggleTheme'))){ toggleTheme(); }});
  applyStoredTheme(); syncThemeIcon();

  /* Toast system */
  const TOAST_TTL = 4000; let toastContainer;
  function ensureToastContainer(){
    if(!toastContainer){
      toastContainer = document.createElement('div');
      toastContainer.id='toastContainer';
      toastContainer.style.cssText='position:fixed;top:70px;right:18px;display:flex;flex-direction:column;gap:10px;z-index:1000;';
      document.body.appendChild(toastContainer);
    }
  }
  function showToast(type,msg){
    ensureToastContainer();
    const el = document.createElement('div');
    el.className='toast-item';
    el.style.cssText='display:flex;align-items:center;gap:8px;padding:12px 16px;border-radius:12px;font-size:.75rem;font-weight:500;box-shadow:0 4px 18px -6px rgba(0,0,0,.25);opacity:0;transform:translateY(-6px);background:#fff;color:#0f172a;transition:.4s;';
    if(type==='error'){ el.style.background='#fee2e2'; el.style.color='#7f1d1d'; }
    if(type==='success'){ el.style.background='#dcfce7'; el.style.color='#166534'; }
    el.innerHTML = '<span>'+msg+'</span>';
    toastContainer.appendChild(el);
    requestAnimationFrame(()=>{ el.style.opacity='1'; el.style.transform='translateY(0)'; });
    setTimeout(()=>{ el.style.opacity='0'; el.style.transform='translateY(-6px)'; setTimeout(()=> el.remove(), 400); }, TOAST_TTL);
  }
  window.showToast = showToast;

  /* Global error instrumentation (limpio: sólo monitoreo, sin lógica obsoleta) */
  if(!window.__GLOBAL_ERROR_MONITOR__){
    window.__GLOBAL_ERROR_MONITOR__ = true;
    window.addEventListener('error', (e)=>{
      try { console.error('[GlobalError]', e.message, e.filename+':'+e.lineno); } catch(_){}
    });
    window.addEventListener('unhandledrejection', (e)=>{
      try { console.error('[UnhandledRejection]', e.reason); } catch(_){}
    });
  }

  /* Skeleton */
  function skeletonCards(n){
    const item = `<div class=\"glass-card rounded-xl p-5 border border-slate-200/40 animate-pulse\">
      <div class=\"h-4 w-1/2 bg-slate-200 rounded mb-3\"></div>
      <div class=\"space-y-2\">
        <div class=\"h-3 w-2/3 bg-slate-200 rounded\"></div>
        <div class=\"h-3 w-1/3 bg-slate-200 rounded\"></div>
      </div>
      <div class=\"flex gap-2 mt-4\">
        <div class=\"h-7 w-14 bg-slate-200 rounded\"></div>
        <div class=\"h-7 w-14 bg-slate-200 rounded\"></div>
        <div class=\"h-7 w-14 bg-slate-200 rounded\"></div>
      </div>
    </div>`;
    return Array.from({length:n}).map(()=>item).join('');
  }
  window.skeletonCards = skeletonCards;

  /* Export CSV */
  function toCSV(rows){ if(!rows.length) return ''; const headers = Object.keys(rows[0]); const esc=v=>'"'+String(v??'').replace(/"/g,'""')+'"'; return headers.join(',')+'\n'+rows.map(r=>headers.map(h=>esc(r[h])).join(',')).join('\n'); }
  function downloadBlob(data,name,type){ const blob=new Blob([data],{type}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; document.body.appendChild(a); a.click(); a.remove(); }
  function startExportProgress(){ const bar=document.getElementById('exportProgress'); if(!bar) return; bar.classList.remove('hidden'); bar.querySelector('.bar').style.width='0%'; }
  function updateExportProgress(p){ const bar=document.getElementById('exportProgress'); if(!bar) return; bar.querySelector('.bar').style.width=p+'%'; }
  function finishExportProgress(success=true){ const bar=document.getElementById('exportProgress'); if(!bar) return; updateExportProgress(100); setTimeout(()=>bar.classList.add('hidden'), 600); if(success) showToast('success','Export listo'); }
  async function exportFincas(){
    startExportProgress();
    try {
      let all = [];
      if(window.fetchAllFincas){ all = await window.fetchAllFincas(); }
      if((!all || !all.length) && window.__fincasSnapshot){ all = window.__fincasSnapshot; }
      if(!all.length){ finishExportProgress(false); showToast('error','Nada para exportar'); return; }
      updateExportProgress(30);
      const csv=toCSV(all);
      updateExportProgress(70);
      downloadBlob(csv,'fincas.csv','text/csv;charset=utf-8;');
      finishExportProgress(true);
    } catch(e){ finishExportProgress(false); showToast('error','Error exportando'); }
  }
  async function exportLotes(){
    startExportProgress();
    try {
      const cont=document.querySelector('[data-lotes-container]'); if(!cont){ finishExportProgress(false); showToast('error','Sin contexto de lotes'); return; }
      const fincaId=cont.getAttribute('data-id-finca'); if(!fincaId){ finishExportProgress(false); showToast('error','Finca no definida'); return; }
      if(!window.fetchAllLotes){ finishExportProgress(false); showToast('error','Función no disponible'); return; }
      const lotes = await window.fetchAllLotes(fincaId);
      if(!lotes.length){ finishExportProgress(false); showToast('error','Nada para exportar'); return; }
      updateExportProgress(30);
      const csv=toCSV(lotes);
      updateExportProgress(70);
      downloadBlob(csv,'lotes_finca_'+fincaId+'.csv','text/csv;charset=utf-8;');
      finishExportProgress(true);
    } catch(e){ finishExportProgress(false); showToast('error','Error exportando'); }
  }
  /* Excel / PDF (SheetJS & jsPDF) */
  function rowsToSheet(wsData){ const ws = XLSX.utils.json_to_sheet(wsData); return ws; }
  async function exportFincasExcel(){ startExportProgress(); try { let data = []; if(window.fetchAllFincas){ data = await fetchAllFincas(); } if((!data || !data.length) && window.__fincasSnapshot){ data = window.__fincasSnapshot; } if(!data.length){ finishExportProgress(false); showToast('error','Sin datos'); return; } updateExportProgress(40); if(!window.XLSX){ finishExportProgress(false); showToast('error','XLSX no cargado'); return; } const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, rowsToSheet(data),'Fincas'); updateExportProgress(70); XLSX.writeFile(wb,'fincas.xlsx'); finishExportProgress(true); } catch(e){ finishExportProgress(false); showToast('error','Error exportando'); } }
  async function exportLotesExcel(){ startExportProgress(); try { const cont=document.querySelector('[data-lotes-container]'); if(!cont){ finishExportProgress(false); showToast('error','Sin contexto'); return; } const fincaId=cont.getAttribute('data-id-finca'); if(!fincaId){ finishExportProgress(false); showToast('error','Finca no definida'); return; } if(!window.fetchAllLotes){ finishExportProgress(false); showToast('error','Función no disponible'); return; } const data= await fetchAllLotes(fincaId); if(!data.length){ finishExportProgress(false); showToast('error','Sin datos'); return; } updateExportProgress(40); if(!window.XLSX){ finishExportProgress(false); showToast('error','XLSX no cargado'); return; } const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, rowsToSheet(data),'Lotes'); updateExportProgress(70); XLSX.writeFile(wb,'lotes_finca_'+fincaId+'.xlsx'); finishExportProgress(true); } catch(e){ finishExportProgress(false); showToast('error','Error exportando'); } }
  async function exportFincasPDF(){ startExportProgress(); try { let data = []; if(window.fetchAllFincas){ data = await fetchAllFincas(); } if((!data || !data.length) && window.__fincasSnapshot){ data = window.__fincasSnapshot; } if(!data.length){ finishExportProgress(false); showToast('error','Sin datos'); return; } updateExportProgress(30); if(!window.jspdf || !window.jspdf.jsPDF){ finishExportProgress(false); showToast('error','jsPDF no cargado'); return; } const { jsPDF } = window.jspdf; const doc = new jsPDF('l','pt','a4'); const cols = Object.keys(data[0]); const rows = data.map(r=>cols.map(c=> String(r[c] ?? ''))); updateExportProgress(60); if(!doc.autoTable){ finishExportProgress(false); showToast('error','AutoTable no cargado'); return; } doc.text('Fincas',40,40); doc.autoTable({ startY:60, head:[cols], body:rows, styles:{ fontSize:7 } }); updateExportProgress(90); doc.save('fincas.pdf'); finishExportProgress(true); } catch(e){ finishExportProgress(false); showToast('error','Error exportando'); } }
  async function exportLotesPDF(){ startExportProgress(); try { const cont=document.querySelector('[data-lotes-container]'); if(!cont){ finishExportProgress(false); showToast('error','Sin contexto'); return; } const fincaId=cont.getAttribute('data-id-finca'); if(!fincaId){ finishExportProgress(false); showToast('error','Finca no definida'); return; } if(!window.fetchAllLotes){ finishExportProgress(false); showToast('error','Función no disponible'); return; } const data= await fetchAllLotes(fincaId); if(!data.length){ finishExportProgress(false); showToast('error','Sin datos'); return; } updateExportProgress(30); if(!window.jspdf || !window.jspdf.jsPDF){ finishExportProgress(false); showToast('error','jsPDF no cargado'); return; } const { jsPDF } = window.jspdf; const doc = new jsPDF('l','pt','a4'); const cols = Object.keys(data[0]); const rows = data.map(r=>cols.map(c=> String(r[c] ?? ''))); updateExportProgress(60); if(!doc.autoTable){ finishExportProgress(false); showToast('error','AutoTable no cargado'); return; } doc.text('Lotes finca '+fincaId,40,40); doc.autoTable({ startY:60, head:[cols], body:rows, styles:{ fontSize:7 } }); updateExportProgress(90); doc.save('lotes_finca_'+fincaId+'.pdf'); finishExportProgress(true); } catch(e){ finishExportProgress(false); showToast('error','Error exportando'); } }
  window.exportFincas=exportFincas; window.exportLotes=exportLotes; window.exportFincasExcel=exportFincasExcel; window.exportLotesExcel=exportLotesExcel; window.exportFincasPDF=exportFincasPDF; window.exportLotesPDF=exportLotesPDF;

  /* Métricas */
  function colorPh(el, val){ if(!el) return; el.classList.remove('ph-acid','ph-neutral','ph-alk'); if(isNaN(val)){ el.textContent='—'; return; } if(val<6.5) el.classList.add('ph-acid'); else if(val<=7.5) el.classList.add('ph-neutral'); else el.classList.add('ph-alk'); }
  async function loadFincasMetrics(){ const elTotal=document.getElementById('metricTotalFincas'); if(!elTotal) return; try { const r= await fetch('/gestionfinca/api/fincas/metrics'); const j=await r.json(); if(j.ok){ elTotal.textContent=j.metrics.total; const aT=document.getElementById('metricAreaTotal'); aT && (aT.textContent=j.metrics.areaTotal.toFixed(2)+' ha'); const aP=document.getElementById('metricActivas'); aP && (aP.textContent=j.metrics.activasPct+'%'); } } catch(e){} }
  async function loadLotesMetrics(){ const c=document.querySelector('[data-lotes-container]'); if(!c) return; const fincaId=c.getAttribute('data-id-finca'); if(!fincaId) return; try { const r= await fetch(`/gestionfinca/api/fincas/${fincaId}/lotes/metrics`); const j=await r.json(); if(j.ok){ const area=document.getElementById('metricAreaLotes'); area && (area.textContent=j.metrics.areaTotal.toFixed(2)+' ha'); const phEl=document.getElementById('metricPh'); if(phEl){ phEl.textContent=j.metrics.phPromedio; colorPh(phEl, parseFloat(j.metrics.phPromedio)); } } } catch(e){} }

  /* Validación inline */
  function setupValidation(){
    document.querySelectorAll('form.js-validate').forEach(form=>{
      form.addEventListener('submit',evt=>{
        let ok=true; form.querySelectorAll('.field-error').forEach(e=>e.remove());
        form.querySelectorAll('[name][required]').forEach(inp=>{ if(!inp.value.trim()){ ok=false; addError(inp,'Campo requerido'); } });
        form.querySelectorAll('input[type=number]').forEach(inp=>{ if(inp.value && isNaN(parseFloat(inp.value))){ ok=false; addError(inp,'Número inválido'); } });
        const ph=form.querySelector('input[name=ph_suelo]'); if(ph && ph.value){ const v=parseFloat(ph.value); if(v<0||v>14){ ok=false; addError(ph,'pH debe 0-14'); } }
        if(!ok){ evt.preventDefault(); showToast('error','Revisa los errores'); if(navigator.vibrate) navigator.vibrate(80); }
      });
    });
  }
  function addError(input,msg){ const span=document.createElement('div'); span.className='field-error'; span.textContent=msg; span.style.cssText='color:#b91c1c;font-size:.6rem;margin-top:4px;padding-left:42px;font-weight:500;'; input.closest('.input-group')?.appendChild(span); }

  /* Auto init */
  document.addEventListener('DOMContentLoaded', ()=>{
  // Inicialización de fincas/lotes ocurre dentro de gestionfinca.js
  // (evitamos referencias a funciones inexistentes si no estamos en esa vista)
    loadFincasMetrics();
    loadLotesMetrics();
    setupValidation();
    // Cargar zonas dinámicamente si el select existe y no tiene opciones (aparte del placeholder)
    (async function initZonas(){
      const selects = document.querySelectorAll('select[name="id_zona"]');
      if(!selects.length) return;
      let needFetch = false;
      selects.forEach(s=>{ if(s.options.length<=1) needFetch = true; });
      if(!needFetch) return; // ya vienen renderizadas desde servidor
      try {
        const r = await fetch('/gestionfinca/api/zonas');
        if(!r.ok) return;
        const j = await r.json();
        if(!j.ok || !Array.isArray(j.data)) return;
        selects.forEach(sel=>{
          const currentVal = sel.getAttribute('data-selected') || sel.value;
            // limpiar dejando primer option (placeholder)
            const first = sel.querySelector('option');
            sel.innerHTML='';
            if(first && first.value==='') sel.appendChild(first); else sel.insertAdjacentHTML('beforeend','<option value="" disabled selected>Selecciona zona</option>');
            j.data.forEach(z=>{
              const opt = document.createElement('option');
              opt.value = z.id_zona;
              opt.textContent = `${z.nombre_zona} (${z.region || z.pais || ''})`;
              if(String(z.id_zona) === String(currentVal)) opt.selected = true;
              sel.appendChild(opt);
            });
        });
      } catch(e) { /* silent */ }
    })();
    document.getElementById('exportFincasBtn')?.addEventListener('click', exportFincas);
    document.getElementById('exportFincasExcelBtn')?.addEventListener('click', exportFincasExcel);
    document.getElementById('exportFincasPdfBtn')?.addEventListener('click', exportFincasPDF);
    document.getElementById('exportLotesBtn')?.addEventListener('click', exportLotes);
    document.getElementById('exportLotesExcelBtn')?.addEventListener('click', exportLotesExcel);
    document.getElementById('exportLotesPdfBtn')?.addEventListener('click', exportLotesPDF);

    // Catálogo legacy desactivado (uso de catalogo.js)
  });
})();

// --- Unified Catalog Toolbar Logic ---
function initUnifiedToolbar(){
  const grid = document.getElementById('catalogGrid');
  if(!grid) return; // not on catalog page
  const chips = document.querySelectorAll('#catalogChips .chip');
  const search = document.getElementById('catalogSearch');
  const sortSel = document.getElementById('catalogSort');
  const toggleBtn = document.getElementById('toggleViewBtn');
  const container = grid.closest('[data-catalog-mode]') || document.querySelector('[data-catalog-mode]') || (function(){
    // attach attribute to parent feed if missing
    const feed = document.querySelector('.feed'); if(feed && !feed.hasAttribute('data-catalog-mode')) feed.setAttribute('data-catalog-mode','icon'); return feed; })();
  // initial mode from storage
  const savedMode = localStorage.getItem('catalogViewMode');
  if(savedMode && container){ container.setAttribute('data-catalog-mode', savedMode); if(toggleBtn){ toggleBtn.dataset.mode = savedMode; toggleBtn.textContent = savedMode==='icon'? 'Ver Info':'Ver Íconos'; } }
  // favorites
  let favs = []; try { favs = JSON.parse(localStorage.getItem('catalogFavs')||'[]'); if(!Array.isArray(favs)) favs=[]; } catch(_e){ favs=[]; }
  function applyFavoritesVisual(){
    const tiles = grid.querySelectorAll('.catalog-tile');
    tiles.forEach(t=>{
      const id = t.getAttribute('data-entity')+':'+t.getAttribute('data-id');
      const btn = t.querySelector('[data-fav-toggle]');
      if(favs.includes(id)){ t.classList.add('favorite'); btn && btn.classList.add('active'); }
      else { t.classList.remove('favorite'); btn && btn.classList.remove('active'); }
    });
    // reorder: favorites first by order -1 via CSS order OR manual append sequence
    const favTiles = Array.from(grid.querySelectorAll('.catalog-tile.favorite'));
    favTiles.forEach(ft=> grid.prepend(ft));
  }
  function toggleFav(tile){
    const key = tile.getAttribute('data-entity')+':'+tile.getAttribute('data-id');
    if(favs.includes(key)) favs = favs.filter(x=>x!==key); else favs.push(key);
    localStorage.setItem('catalogFavs', JSON.stringify(favs));
    applyFavoritesVisual();
    try { fetch('/api/catalogo/event',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'favorite_toggle', targetKind: tile.getAttribute('data-kind'), targetId: tile.getAttribute('data-id'), meta:{ active: favs.includes(key) } }) }); } catch(_e){}
  }
  let activeKind = '';
  function apply(){
    const q = (search?.value||'').toLowerCase().trim();
    const sort = sortSel?.value || 'name_asc';
    const tiles = Array.from(grid.querySelectorAll('.catalog-tile'));
    tiles.forEach(t=>{
      const kind = t.getAttribute('data-kind');
      const name = (t.getAttribute('data-name')||'').toLowerCase();
      let show = true;
      if(activeKind && kind!==activeKind) show=false;
      if(q && !name.includes(q)) show=false;
      t.style.display = show? '' : 'none';
      // color coding base classes
      if(kind==='cultivo') t.classList.add('tile-cultivo'); else if(kind==='insumo') t.classList.add('tile-insumo');
    });
    // sorting
    const visible = tiles.filter(t=> t.style.display !== 'none');
    visible.sort((a,b)=>{
      const nameA = (a.getAttribute('data-name')||'').toLowerCase();
      const nameB = (b.getAttribute('data-name')||'').toLowerCase();
      const countA = parseInt(a.querySelector('.tile-count')?.textContent)||0;
      const countB = parseInt(b.querySelector('.tile-count')?.textContent)||0;
      switch(sort){
        case 'name_desc': return nameB.localeCompare(nameA);
        case 'count_desc': return countB - countA;
        case 'count_asc': return countA - countB;
        case 'name_asc':
        default: return nameA.localeCompare(nameB);
      }
    });
    visible.forEach(t=> grid.appendChild(t));
  }
  chips.forEach(c=>{
    c.addEventListener('click', ()=>{
      chips.forEach(o=> o.classList.remove('active'));
      c.classList.add('active');
      activeKind = c.getAttribute('data-chip')||'';
      apply();
    });
  });
  search && search.addEventListener('input', debounce(apply,250));
  sortSel && sortSel.addEventListener('change', apply);
  // toggle view
  toggleBtn && toggleBtn.addEventListener('click', async ()=>{
    const current = container.getAttribute('data-catalog-mode') || 'icon';
    const next = current === 'icon' ? 'info' : 'icon';
    container.setAttribute('data-catalog-mode', next);
    toggleBtn.dataset.mode = next;
    toggleBtn.textContent = next==='icon'? 'Ver Info':'Ver Íconos';
    localStorage.setItem('catalogViewMode', next);
    // log event (fire and forget)
    try { fetch('/api/catalogo/event',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'toggle_view', targetKind:'catalog', meta:{ mode:next } }) }); } catch(_e){ }
  });
  apply();
  // attach fav buttons
  grid.querySelectorAll('[data-fav-toggle]').forEach(btn=>{
    btn.addEventListener('click', e=>{ e.stopPropagation(); const tile = btn.closest('.catalog-tile'); if(tile) toggleFav(tile); });
  });
  applyFavoritesVisual();
  // tooltips
  const showTT = (tile)=>{
    const tt = tile.querySelector('.tile-tooltip'); if(!tt) return; tt.hidden=false;
    const name = tile.getAttribute('data-name')||'';
    const count = tile.getAttribute('data-count')||'0';
    const kind = tile.getAttribute('data-kind');
    tt.innerHTML = `<span class='tt-name'>${name}</span><span class='tt-meta'>${kind==='cultivo'? 'Tipos':'Insumos'}: ${count}</span>`;
  };
  const hideTT = (tile)=>{ const tt=tile.querySelector('.tile-tooltip'); if(tt) tt.hidden=true; };
  grid.querySelectorAll('.catalog-tile').forEach(tile=>{
    tile.addEventListener('mouseenter', ()=>{ if(document.querySelector('[data-catalog-mode]')?.getAttribute('data-catalog-mode')==='icon') showTT(tile); });
    tile.addEventListener('mouseleave', ()=> hideTT(tile));
    tile.addEventListener('focus', ()=> showTT(tile));
    tile.addEventListener('blur', ()=> hideTT(tile));
    tile.setAttribute('tabindex','0');
  });
}

// --- Utilitarian Catalog Tabs (list-based new layout) ---
/* LEGACY catalog tabs (disabled: handled by catalogo.js)
function initCatalogTabs(){
  const root = document.querySelector('.catalog-util');
  if(!window.__CATALOG_DEBUG){ window.__CATALOG_DEBUG = { steps:[], errors:[], tsStart: Date.now() }; }
  const dbg = window.__CATALOG_DEBUG;
  try { dbg.steps.push('initCatalogTabs:start'); } catch(_e){}
  if(!root){ dbg.steps.push('initCatalogTabs:no-root'); return; } // page not using new layout
  dbg.steps.push('initCatalogTabs:root-found');

  const tabs = root.querySelectorAll('.cu-tab');
  const panels = root.querySelectorAll('.cu-panel');
  const search = document.getElementById('cuSearch');
  const sortSel = document.getElementById('cuSort');

  function activate(tab){
    tabs.forEach(t=> t.classList.toggle('active', t.getAttribute('data-cu-tab')===tab));
    panels.forEach(p=>{
      const act = p.getAttribute('data-cu-panel')===tab; p.classList.toggle('active', act); if(act) p.removeAttribute('hidden'); else p.setAttribute('hidden','hidden');
    });
    localStorage.setItem('catalog.tab', tab);
    filterSort();
  }

  tabs.forEach(t=> t.addEventListener('click', ()=> activate(t.getAttribute('data-cu-tab'))));
  dbg.steps.push('initCatalogTabs:tabs-bound='+tabs.length);
  search && search.addEventListener('input', window.debounce(()=> filterSort(), 160));
  sortSel && sortSel.addEventListener('change', filterSort);
  if(search) dbg.steps.push('initCatalogTabs:search-bound');
  if(sortSel) dbg.steps.push('initCatalogTabs:sort-bound');

  function filterSort(){
  try { dbg.steps.push('filterSort:enter'); } catch(_e){}
  const panel = root.querySelector('.cu-panel.active');
    if(!panel) return;
    const q = (search?.value||'').trim().toLowerCase();
    const items = Array.from(panel.querySelectorAll('.cu-item'));
    items.forEach(it=>{
      const name = (it.dataset.name||'').toLowerCase();
      const show = !q || name.includes(q);
      it.style.display = show? '' : 'none';
    });
    const visible = items.filter(i=> i.style.display!=='none');
    const sort = sortSel?.value || 'name';
    let cmp;
    switch(sort){
      case 'count': cmp=(a,b)=> (parseInt(b.dataset.count||'0')) - (parseInt(a.dataset.count||'0')); break;
      case 'avg': cmp=(a,b)=> (parseFloat(a.dataset.avg||'0')) - (parseFloat(b.dataset.avg||'0')); break; // menor primero
      case 'name':
      default: cmp=(a,b)=> (a.dataset.name||'').localeCompare((b.dataset.name||''),'es',{sensitivity:'base'}); break;
    }
    visible.sort(cmp).forEach(n=> n.parentElement.appendChild(n));
    try { dbg.steps.push('filterSort:done visible='+visible.length); } catch(_e){}
  }

  // keyboard navigation for list rows
  root.addEventListener('keydown', e=>{
    if(!['ArrowDown','ArrowUp'].includes(e.key)) return;
    const panel = root.querySelector('.cu-panel.active'); if(!panel) return;
    const rows = Array.from(panel.querySelectorAll('.cu-item')).filter(r=> r.style.display!=='none'); if(!rows.length) return;
    const current = document.activeElement && rows.includes(document.activeElement)? document.activeElement : null;
    let idx = current? rows.indexOf(current) : -1;
    e.preventDefault();
    if(e.key==='ArrowDown') idx = (idx+1) % rows.length; else idx = (idx-1+rows.length)%rows.length;
    rows[idx].focus();
  });

  // Row click -> quick view
  root.addEventListener('click', e=>{
    // Evitar quick view si se hace click en botones de acción internos
    if(e.target.closest('.cu-col.actions') || e.target.closest('[data-edit]') || e.target.closest('[data-delete]') || e.target.closest('[data-add-tipo]') || e.target.closest('[data-add-insumo]')){
      return; // dejar que el listener delegado CRUD actúe
    }
    const row = e.target.closest('.cu-item');
    if(row){ openCatalogQuickView(row); }
  });
  try { dbg.steps.push('initCatalogTabs:delegates-set'); } catch(_e){}

  function handleRowAction(action, row){
    if(!row) return;
    const id = row.dataset.id;
    logCatalogEvent('row_action', { action, id, kind: row.dataset.kind });
    if(action==='edit'){
      // intenta encontrar botón existente de edición
      document.querySelector(`[data-edit][data-id='${id}']`)?.click();
    } else if(action==='add-child'){
      window.dispatchEvent(new CustomEvent('catalog:addChild',{ detail:{ parentId:id, kind: row.dataset.kind } }));
    } else if(action==='delete'){
      if(confirm('¿Eliminar registro?')){
        document.querySelector(`[data-delete][data-id='${id}']`)?.click();
      }
    }
  }

  function openCatalogQuickView(row){
    try { dbg.steps.push('quickView:open:'+row.dataset.id); } catch(_e){}
    const existing = document.getElementById('quickViewOverlay'); existing && existing.remove();
    const overlay = document.createElement('div'); overlay.id='quickViewOverlay'; overlay.className='quick-view-overlay';
    const name = row.dataset.name || '';
    const kind = row.dataset.kind || '';
    const avg = row.dataset.avg || '';
    const count = row.dataset.count || '';
    overlay.innerHTML = `<div class="quick-view-panel animate-in">
      <div class="qv-header">
        <div class="qv-icon">🌿</div>
        <div class="qv-titles">
          <h3>${name}</h3>
          <div class="qv-sub">${kind==='cultivo' ? 'Categoría / Tipo Cultivo' : 'Categoría / Insumo'} • ID ${row.dataset.id}</div>
        </div>
        <button type="button" class="qv-close" aria-label="Cerrar">&times;</button>
      </div>
      <div class="qv-body">
        <p class="text-[12px] leading-relaxed opacity-80">Vista rápida. (Pendiente de enriquecer con detalles específicos)</p>
        <ul class="mt-3 space-y-1 text-[11px] font-medium">
          ${count? `<li>Total relacionados: <strong>${count}</strong></li>`:''}
          ${avg? `<li>Promedio días: <strong>${avg}</strong></li>`:''}
        </ul>
      </div>
      <div class="qv-footer flex justify-end gap-2">
        <button class="btn btn-outline btn-sm" data-qv-edit>Editar</button>
        <button class="btn btn-danger btn-sm" data-qv-delete>Eliminar</button>
      </div>
    </div>`;
    document.body.appendChild(overlay); document.body.style.overflow='hidden';
    const close = ()=>{ overlay.remove(); document.body.style.overflow=''; };
    overlay.addEventListener('click', e=>{ if(e.target===overlay || e.target.classList.contains('qv-close')) close(); });
    overlay.querySelector('[data-qv-edit]')?.addEventListener('click', ()=>{ handleRowAction('edit', row); close(); });
    overlay.querySelector('[data-qv-delete]')?.addEventListener('click', ()=>{ handleRowAction('delete', row); close(); });
  }

  function logCatalogEvent(action, meta){
    try { fetch('/api/catalogo/event',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action, meta }) }); } catch(_e){}
  }

  function hydrateTabIcons(){
    const TRY_LIMIT = 8;
    let attempt = 0;
    const fallback = '🌿';
    function tryHydrate(){
      if(!window.getIconSvg || !Array.isArray(window.CATALOG_ICONS)){
        if(attempt++ < TRY_LIMIT){ return setTimeout(tryHydrate, 120 * attempt); }
        return; // desistir silenciosamente
      }
      root.querySelectorAll('.cu-icon[data-icon-key]')?.forEach(el=>{
        const key = el.getAttribute('data-icon-key');
        if(!key) return;
        const svg = window.getIconSvg(key);
        if(svg){ el.innerHTML = svg; el.dataset.hydrated='1'; }
        else if(!el.dataset.hydrated){ el.innerHTML = fallback; }
      });
      try { dbg.steps.push('hydrateTabIcons:done'); } catch(_e){}
    }
    tryHydrate();
    // Observer para rehidrataciones si se reemplaza el contenido del root
    if(!root._iconObserver){
      const obs = new MutationObserver(muts=>{
        let needs=false; muts.forEach(m=>{ if(m.addedNodes && m.addedNodes.length) needs=true; });
        if(needs) tryHydrate();
      });
      obs.observe(root,{subtree:true, childList:true});
      root._iconObserver = obs;
    }
  }

  // ---- CRUD para vista utilitaria ----
  const modalHost = document.getElementById('modalHost') || (function(){ const m=document.createElement('div'); m.id='modalHost'; document.body.appendChild(m); return m; })();

  const SCHEMAS = {
    createCategoriaCultivo: { title:'Nueva Categoría de Cultivo', endpoint:'/api/catalogo/categorias-cultivo', method:'POST', fields:[
      {name:'nombre_categoria', label:'Nombre', required:true },
      {name:'descripcion', label:'Descripción', type:'textarea'},
      {name:'icono', label:'Icono (opcional)'}
    ]},
    createTipoCultivo: { title:'Nuevo Tipo de Cultivo', endpoint:'/api/catalogo/tipos-cultivo', method:'POST', fields:[
      {name:'id_categoria', label:'Categoría', type:'select', required:true, optionsSource:'/api/catalogo/categorias-cultivo', optionLabel:'nombre_categoria', optionValue:'id_categoria'},
      {name:'nombre_tipo', label:'Nombre', required:true },
      {name:'nombre_cientifico', label:'Nombre Científico'},
      {name:'descripcion', label:'Descripción', type:'textarea'},
      {name:'temporada_optima', label:'Temporada'},
      {name:'dias_cosecha', label:'Días Cosecha', type:'number'}
    ]},
    createCategoriaInsumo: { title:'Nueva Categoría de Insumo', endpoint:'/api/catalogo/categorias-insumo', method:'POST', fields:[
      {name:'nombre_categoria', label:'Nombre', required:true },
      {name:'descripcion', label:'Descripción', type:'textarea'},
      {name:'tipo', label:'Tipo', type:'select-static', options:[
        {value:'fertilizante', label:'Fertilizante'},
        {value:'plaguicida', label:'Plaguicida'},
        {value:'semilla', label:'Semilla'},
        {value:'herramienta', label:'Herramienta'},
        {value:'equipo', label:'Equipo'},
        {value:'otro', label:'Otro'}
      ]}
    ]},
    createInsumo: { title:'Nuevo Insumo', endpoint:'/api/catalogo/insumos', method:'POST', fields:[
      {name:'id_categoria_insumo', label:'Categoría Insumo', type:'select', required:true, optionsSource:'/api/catalogo/categorias-insumo', optionLabel:'nombre_categoria', optionValue:'id_categoria_insumo'},
      {name:'nombre_insumo', label:'Nombre', required:true },
      {name:'descripcion', label:'Descripción', type:'textarea'},
      {name:'fabricante', label:'Fabricante'},
      {name:'composicion', label:'Composición', type:'textarea'},
      {name:'instrucciones_uso', label:'Instrucciones de Uso', type:'textarea'},
      {name:'precauciones', label:'Precauciones', type:'textarea'}
    ]}
  };

  function buildInput(f, value, fieldName){
    if(fieldName==='icono'){
      const current = value || '';
      return `<div class="icon-picker-wrapper relative">
        <input type="hidden" name="icono" value="${current}" />
        <button type="button" class="icon-picker-trigger" data-icon-trigger>
          <span class="icon-preview" data-icon-preview>${ current ? (window.getIconSvg? window.getIconSvg(current): current) : '🌿' }</span>
          <span>${ current || 'Elegir icono' }</span>
        </button>
      </div>`;
    }
    if(f.type==='textarea') return `<textarea name="${f.name}" class="input-modern" rows="3">${value? value: ''}</textarea>`;
    if(f.type==='number') return `<input type="number" step="any" name="${f.name}" value="${value? value: ''}" class="input-modern" />`;
    if(f.type==='select-static') return `<select name="${f.name}" class="input-modern">${f.options.map(o=>`<option value="${o.value}">${o.label}</option>`).join('')}</select>`;
    if(f.type==='select') return `<select name="${f.name}" class="input-modern"><option value="">Cargando...</option></select>`;
    return `<input type="text" name="${f.name}" value="${value? value: ''}" class="input-modern" />`;
  }

  function closeCrudModal(){ modalHost.innerHTML=''; modalHost.style.display='none'; document.body.style.overflow=''; }

  async function openCrudModal(schemaKey, data){
    const schema = SCHEMAS[schemaKey]; if(!schema) return;
    const formId='form_'+Date.now();
    modalHost.style.display='block';
    modalHost.innerHTML = `<div class="modal-overlay"><div class="modal-box animate-in"><button class="modal-close" data-close>&times;</button><h3>${data? 'Editar':''+schema.title}</h3><form id="${formId}" class="modal-form flex flex-col gap-5"></form><div class="flex justify-end gap-2 pt-2"><button class="btn btn-outline btn-sm" data-close>Cancelar</button><button class="btn btn-success btn-sm" type="submit" form="${formId}">${data? 'Actualizar':'Guardar'}</button></div></div></div>`;
    document.body.style.overflow='hidden';
    const form = modalHost.querySelector('form');
    schema.fields.forEach(f=>{
      const row=document.createElement('div'); row.className='form-row';
      row.innerHTML = `<label>${f.label}${f.required?' *':''}</label>${buildInput(f, data? data[f.name]: (data && data.prefill && data.prefill[f.name]) || null, f.name)}`;
      form.appendChild(row);
    });
    initIconPickerCrud();
    modalHost.addEventListener('click', e=>{ if(e.target.matches('[data-close]') || e.target===modalHost.querySelector('.modal-overlay')) closeCrudModal(); });
    form.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const payload={}; let valid=true;
      schema.fields.forEach(f=>{
        const el=form.querySelector(`[name="${f.name}"]`); if(!el) return; const val=el.value.trim(); if(f.required && !val){ valid=false; el.classList.add('ring-2','ring-red-400'); setTimeout(()=>el.classList.remove('ring-2','ring-red-400'),1400); } payload[f.name]= val||null; });
      if(!valid){ window.showToast && showToast('error','Completa los requeridos'); return; }
      try {
        const endpoint = data && data.__endpoint ? data.__endpoint : schema.endpoint;
        const method = data && data.__method ? data.__method : (data? 'PUT': schema.method);
        const res = await fetch(endpoint, { method, headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
        const j = await res.json(); if(!j.ok){ showToast && showToast('error', j.message||'Error'); return; }
        showToast && showToast('success', data? 'Actualizado':'Creado');
        closeCrudModal();
        // recargar solo la vista utilitaria
        reloadCatalogUtil();
      } catch(_e){ showToast && showToast('error','Fallo red'); }
    });
    // cargar selects dinámicos
    schema.fields.filter(f=>f.type==='select' && f.optionsSource).forEach(async f=>{
      const sel=form.querySelector(`[name="${f.name}"]`); if(!sel) return; sel.innerHTML='<option value="">Cargando...</option>';
      try { const r= await fetch(f.optionsSource); const j= await r.json(); if(j.ok){ sel.innerHTML='<option value="">Seleccione...</option>'+ j.data.map(o=>`<option value="${o[f.optionValue]}">${o[f.optionLabel]}</option>`).join(''); if((data && data[f.name]) || (data && data.prefill && data.prefill[f.name])) sel.value = data[f.name] || data.prefill[f.name]; } else sel.innerHTML='<option value="">Error</option>'; } catch(e){ sel.innerHTML='<option value="">Error</option>'; }
    });
  }

  function initIconPickerCrud(){
    const trigger = modalHost.querySelector('[data-icon-trigger]');
    if(!trigger || !window.CATALOG_ICONS) return;
    const wrapper = trigger.closest('.icon-picker-wrapper');
    let panel; const hidden = wrapper.querySelector('input[name=icono]'); const preview = wrapper.querySelector('[data-icon-preview]');
    function closePanel(){ panel && panel.remove(); panel=null; document.removeEventListener('click', outside); }
    function outside(e){ if(panel && !panel.contains(e.target) && !trigger.contains(e.target)) closePanel(); }
    trigger.addEventListener('click', ()=>{
      if(panel){ closePanel(); return; }
      panel = document.createElement('div'); panel.className='icon-picker-panel';
      panel.innerHTML = window.CATALOG_ICONS.map(ic=>`<div class="icon-picker-item" data-icon-value="${ic.key}"><div class="ico">${ic.svg}</div><span>${ic.label}</span></div>`).join('');
      wrapper.style.position='relative'; wrapper.appendChild(panel);
      setTimeout(()=> document.addEventListener('click', outside),10);
      panel.querySelectorAll('[data-icon-value]').forEach(item=>{
        item.addEventListener('click', ()=>{
          const val=item.getAttribute('data-icon-value');
          hidden.value=val;
          if(preview) preview.innerHTML = window.getIconSvg? (window.getIconSvg(val)||val): val;
          trigger.querySelector('span:last-child').textContent=val;
          closePanel();
        });
      });
    });
  }

  async function editEntity(entity, id){
    const map={
      'categoria-cultivo': { url:'/api/catalogo/categorias-cultivo/'+id, schema:'createCategoriaCultivo' },
      'tipo-cultivo': { url:'/api/catalogo/tipos-cultivo/'+id, schema:'createTipoCultivo' },
      'categoria-insumo': { url:'/api/catalogo/categorias-insumo/'+id, schema:'createCategoriaInsumo' },
      'insumo': { url:'/api/catalogo/insumos/'+id, schema:'createInsumo' }
    };
    const cfg=map[entity]; if(!cfg) return;
    try { const r= await fetch(cfg.url); const j= await r.json(); if(j.ok){ const data=j.data; data.__endpoint=cfg.url; data.__method='PUT'; openCrudModal(cfg.schema, data); } else showToast && showToast('error','No encontrado'); } catch(e){ showToast && showToast('error','Error cargando'); }
  }

  async function deleteEntity(entity, id){
    if(!confirm('¿Eliminar registro?')) return;
    const map={
      'categoria-cultivo': '/api/catalogo/categorias-cultivo/'+id,
      'tipo-cultivo': '/api/catalogo/tipos-cultivo/'+id,
      'categoria-insumo': '/api/catalogo/categorias-insumo/'+id,
      'insumo': '/api/catalogo/insumos/'+id
    };
    try { const r= await fetch(map[entity], { method:'DELETE' }); const j= await r.json(); if(j.ok){ showToast && showToast('success','Eliminado'); reloadCatalogUtil(); } else showToast && showToast('error', j.message||'Error'); } catch(e){ showToast && showToast('error','Fallo'); }
  }

  async function reloadCatalogUtil(){
    try {
      const r= await fetch('/catalogo'); if(!r.ok) return; const html= await r.text();
      const parser=new DOMParser(); const doc=parser.parseFromString(html,'text/html');
      const fresh = doc.getElementById('catalogUtilRoot');
      if(fresh){
        const target = document.getElementById('catalogUtilRoot');
        if(target){ target.innerHTML = fresh.innerHTML; }
        // re-bind events after refresh
        initCatalogTabs();
        hydrateTabIcons();
        showToast && showToast('success','Catálogo actualizado');
        try { dbg.steps.push('reloadCatalogUtil:success'); } catch(_e){}
      }
    } catch(_e){}
  }

  // Delegación para botones CRUD fila y cabecera
  root.addEventListener('click', e=>{
    const btn = e.target.closest('[data-edit], [data-delete], [data-add-tipo], [data-add-insumo], #cuAddPrimary');
    if(!btn) return;
    if(btn.id==='cuAddPrimary'){
      const activeTab = root.querySelector('.cu-tab.active')?.getAttribute('data-cu-tab');
      if(activeTab==='cultivos') openCrudModal('createCategoriaCultivo'); else openCrudModal('createCategoriaInsumo');
      return;
    }
    if(btn.hasAttribute('data-add-tipo')){
      const catId = btn.getAttribute('data-id');
      openCrudModal('createTipoCultivo',{ prefill:{ id_categoria: catId } });
      return;
    }
    if(btn.hasAttribute('data-add-insumo')){
      const catId = btn.getAttribute('data-id');
      openCrudModal('createInsumo',{ prefill:{ id_categoria_insumo: catId } });
      return;
    }
    if(btn.hasAttribute('data-edit')){
      editEntity(btn.getAttribute('data-edit'), btn.getAttribute('data-id'));
      return;
    }
    if(btn.hasAttribute('data-delete')){
      deleteEntity(btn.getAttribute('data-delete'), btn.getAttribute('data-id'));
      return;
    }
  });

  // Expose for debugging if needed
  window.reloadCatalogUtil = reloadCatalogUtil;
  window.openCatalogModal = openCrudModal;
  hydrateTabIcons();

  // restore last active tab or first
  const last = localStorage.getItem('catalog.tab');
  const initial = Array.from(tabs).some(t=> t.getAttribute('data-cu-tab')===last) ? last : tabs[0]?.getAttribute('data-cu-tab');
  if(initial) activate(initial); else filterSort();
  try { dbg.steps.push('initCatalogTabs:complete'); } catch(_e){}
  window.__CATALOG_DEBUG_LAST = dbg;
}
*/

// Hook new layout init
// document.addEventListener('DOMContentLoaded', ()=>{ try { initCatalogTabs(); } catch(_e){} }); // legacy disabled
