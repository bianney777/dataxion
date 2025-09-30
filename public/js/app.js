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

  /* Debounce util */
  function debounce(fn,wait){ let t; return function(...a){ clearTimeout(t); t=setTimeout(()=>fn.apply(this,a),wait); }; }
  window.debounce = debounce;

  /* Estados de paginación */
  const fincaPagination = { page:1, limit:6, pages:1, total:0 };
  const lotePagination = { page:1, limit:6, pages:1, total:0 };
  const cacheStore = { fincas:new Map(), lotes:new Map() };

  /* Fetch fincas */
  function cacheKey(obj){ return Object.entries(obj).sort().map(([k,v])=>k+'='+v).join('&'); }
  async function fetchFincas(params={}){
    try {
      const qs = new URLSearchParams(params).toString();
      const res = await fetch('/gestionfinca/api/fincas'+(qs?'?'+qs:''));
      if(!res.ok){ showToast('error','Error cargando fincas'); return []; }
      const json = await res.json();
      if(json.pagination){
        fincaPagination.pages = json.pagination.pages;
        fincaPagination.total = json.pagination.total;
        fincaPagination.page = json.pagination.page;
      }
      return json.data || json.fincas || [];
    } catch (e){
      showToast('error','Fallo de red fincas');
      return [];
    }
  }
  window.fetchFincas = fetchFincas;

  function renderFincaCard(f){
    return `<div class=\"glass-card rounded-xl p-5 flex flex-col gap-3 group relative border border-slate-200/60 hover:border-blue-400/60 transition\">
      <div class=\"flex justify-between items-start\">
        <div>
          <h4 class=\"font-semibold text-slate-800 group-hover:text-blue-700 transition\">${f.nombre_finca}</h4>
          <p class=\"text-[11px] font-medium uppercase tracking-wider text-slate-500 mt-1 flex flex-wrap gap-2\">
            <span class=\"metric-chip\">Área: ${f.area_total} ha</span>
            ${f.ubicacion? `<span class=\\"metric-chip\\">Ubicación: ${f.ubicacion}</span>`:''}
          </p>
        </div>
        <span class=\"status-badge status-${f.estado}\">${f.estado.replace('_',' ')}</span>
      </div>
      <div class=\"flex gap-2 mt-auto pt-1\">
        <a href=\"/gestionfinca/${f.id_finca}/lotes\" class=\"btn btn-outline btn-xs\">Lotes</a>
        <a href=\"/gestionfinca/${f.id_finca}/edit\" class=\"btn btn-warning btn-xs\">Editar</a>
        <form action=\"/gestionfinca/${f.id_finca}/delete\" method=\"POST\" onsubmit=\"return confirm('¿Eliminar finca?');\" style=\"margin:0;\">
          <button type=\"submit\" class=\"btn btn-danger btn-xs\">Eliminar</button>
        </form>
      </div>
    </div>`;
  }

  function renderPagination(state, selector, onChange){
    const wrap = document.querySelector(selector);
    if(!wrap) return;
    if(state.pages <= 1){ wrap.innerHTML=''; return; }
    let html='<div class="pagination flex items-center gap-2 text-[11px] font-medium">';
    html += `<button data-page="prev" class="px-2 py-1 rounded border ${state.page===1?'opacity-40 cursor-not-allowed':'hover:bg-slate-100'}">Prev</button>`;
    const span = Math.min(state.pages,5);
    const start = Math.max(1, Math.min(state.page-2, state.pages-span+1));
    for(let p=start; p<start+span; p++){
      html += `<button data-page="${p}" class="px-2 py-1 rounded border ${p===state.page?'bg-blue-600 text-white border-blue-600':'hover:bg-slate-100'}">${p}</button>`;
    }
    html += `<button data-page="next" class="px-2 py-1 rounded border ${state.page===state.pages?'opacity-40 cursor-not-allowed':'hover:bg-slate-100'}">Next</button>`;
    html += `<span class="ml-2 opacity-60">${state.page}/${state.pages}</span>`;
    html+='</div>';
    wrap.innerHTML=html;
    wrap.querySelectorAll('button[data-page]').forEach(b=>{
      b.addEventListener('click',()=>{
        const v=b.getAttribute('data-page');
        if(v==='prev' && state.page>1){ state.page--; onChange(); }
        else if(v==='next' && state.page<state.pages){ state.page++; onChange(); }
        else if(!isNaN(parseInt(v))){ state.page=parseInt(v); onChange(); }
      });
    });
  }

  function mountFincasDynamic(){
    const container = document.querySelector('[data-fincas-container]');
    if(!container) return;
    const searchInput = document.getElementById('globalSearch');
    const estadoFilter = document.getElementById('filterEstado');
    async function load(){
      container.innerHTML = skeletonCards(6);
      const params = { q: searchInput?.value || '', estado: estadoFilter?.value || '', page:fincaPagination.page, limit:fincaPagination.limit };
      const key = cacheKey(params);
      if(cacheStore.fincas.has(key)){
        container.innerHTML = cacheStore.fincas.get(key).map(renderFincaCard).join('');
      }
      const fincas = await fetchFincas(params);
      cacheStore.fincas.set(key, fincas);
      if(!fincas.length){ container.innerHTML = '<div class="text-center text-xs text-slate-500 col-span-full">Sin resultados</div>'; renderPagination(fincaPagination,'[data-fincas-pagination]',load); return; }
      container.innerHTML = fincas.map(renderFincaCard).join('');
      renderPagination(fincaPagination,'[data-fincas-pagination]',load);
    }
    const debounced = debounce(load,400);
    searchInput && searchInput.addEventListener('input', debounced);
    estadoFilter && estadoFilter.addEventListener('change', ()=>{ fincaPagination.page=1; load(); });
    load();
  }
  window.mountFincasDynamic = mountFincasDynamic;

  /* LOTES dinámicos */
  async function fetchLotes(id_finca, params={}){
    try {
      const qs = new URLSearchParams(params).toString();
      const res = await fetch(`/gestionfinca/api/fincas/${id_finca}/lotes`+(qs?'?'+qs:''));
      if(!res.ok){ showToast('error','Error cargando lotes'); return []; }
      const json = await res.json();
      if(json.pagination){
        lotePagination.pages = json.pagination.pages;
        lotePagination.total = json.pagination.total;
        lotePagination.page = json.pagination.page;
      }
      return json.data || [];
    } catch(e){ showToast('error','Fallo de red lotes'); return []; }
  }
  function renderLoteCard(l){
    return `<div class=\"glass-card rounded-xl p-5 flex flex-col gap-3 group relative border border-slate-200/60 hover:border-green-500/60 transition\">
      <div class=\"flex justify-between items-start\">
        <div>
          <h4 class=\"font-semibold text-slate-800 group-hover:text-green-700 transition\">${l.nombre_lote}</h4>
          <p class=\"text-[11px] font-medium uppercase tracking-wider text-slate-500 mt-1 flex flex-wrap gap-2\">
            <span class=\"metric-chip\">Área: ${l.area} ha</span>
            <span class=\"metric-chip\">Suelo: ${l.tipo_suelo}</span>
            ${l.ph_suelo ? `<span class=\\"metric-chip\\">pH: ${l.ph_suelo}</span>`:''}
          </p>
        </div>
      </div>
      <div class=\"flex gap-2 mt-auto pt-1\">
        <a href=\"/gestionfinca/lotes/${l.id_lote}/edit\" class=\"btn btn-warning btn-xs\">Editar</a>
        <form action=\"/gestionfinca/lotes/${l.id_lote}/delete\" method=\"POST\" onsubmit=\"return confirm('¿Eliminar lote?');\" style=\"margin:0;\">
          <button type=\"submit\" class=\"btn btn-danger btn-xs\">Eliminar</button>
        </form>
      </div>
    </div>`;
  }
  function mountLotesDynamic(){
    const container = document.querySelector('[data-lotes-container]');
    if(!container) return;
    const fincaId = container.getAttribute('data-id-finca');
    if(!fincaId) return;
    const sueloFilter = document.getElementById('filterSuelo');
    const searchInput = document.getElementById('globalSearch');
    async function load(){
      container.innerHTML = skeletonCards(6);
      const params = { q: searchInput?.value || '', tipo_suelo: sueloFilter?.value || '', page:lotePagination.page, limit:lotePagination.limit };
      const key = fincaId+':'+cacheKey(params);
      if(cacheStore.lotes.has(key)){
        container.innerHTML = cacheStore.lotes.get(key).map(renderLoteCard).join('');
      }
      const lotes = await fetchLotes(fincaId, params);
      cacheStore.lotes.set(key, lotes);
      if(!lotes.length){ container.innerHTML = '<div class="text-center text-xs text-slate-500 col-span-full">Sin lotes</div>'; renderPagination(lotePagination,'[data-lotes-pagination]',load); return; }
      container.innerHTML = lotes.map(renderLoteCard).join('');
      renderPagination(lotePagination,'[data-lotes-pagination]',load);
    }
    const debounced = debounce(load,400);
    searchInput && searchInput.addEventListener('input', debounced);
    sueloFilter && sueloFilter.addEventListener('change', ()=>{ lotePagination.page=1; load(); });
    load();
  }
  window.mountLotesDynamic = mountLotesDynamic;

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
  async function exportFincas(){ startExportProgress(); const all = await fetchFincas({ limit:1000 }); if(!all.length){ finishExportProgress(false); showToast('error','Nada para exportar'); return; } updateExportProgress(30); const csv=toCSV(all); updateExportProgress(70); downloadBlob(csv,'fincas.csv','text/csv;charset=utf-8;'); finishExportProgress(true); }
  async function exportLotes(){ startExportProgress(); const cont=document.querySelector('[data-lotes-container]'); if(!cont){ finishExportProgress(false); showToast('error','Sin contexto de lotes'); return; } const fincaId=cont.getAttribute('data-id-finca'); const lotes = await fetchLotes(fincaId,{ limit:1000 }); if(!lotes.length){ finishExportProgress(false); showToast('error','Nada para exportar'); return; } updateExportProgress(30); const csv=toCSV(lotes); updateExportProgress(70); downloadBlob(csv,'lotes_finca_'+fincaId+'.csv','text/csv;charset=utf-8;'); finishExportProgress(true); }
  /* Excel / PDF (SheetJS & jsPDF) */
  function rowsToSheet(wsData){ const ws = XLSX.utils.json_to_sheet(wsData); return ws; }
  async function exportFincasExcel(){ startExportProgress(); const data= await fetchFincas({ limit:2000 }); if(!data.length){ finishExportProgress(false); showToast('error','Sin datos'); return; } updateExportProgress(40); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, rowsToSheet(data),'Fincas'); updateExportProgress(70); XLSX.writeFile(wb,'fincas.xlsx'); finishExportProgress(true); }
  async function exportLotesExcel(){ startExportProgress(); const cont=document.querySelector('[data-lotes-container]'); if(!cont){ finishExportProgress(false); showToast('error','Sin contexto'); return; } const fincaId=cont.getAttribute('data-id-finca'); const data= await fetchLotes(fincaId,{ limit:2000 }); if(!data.length){ finishExportProgress(false); showToast('error','Sin datos'); return; } updateExportProgress(40); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, rowsToSheet(data),'Lotes'); updateExportProgress(70); XLSX.writeFile(wb,'lotes_finca_'+fincaId+'.xlsx'); finishExportProgress(true); }
  async function exportFincasPDF(){ startExportProgress(); const data= await fetchFincas({ limit:1000 }); if(!data.length){ finishExportProgress(false); showToast('error','Sin datos'); return; } updateExportProgress(30); const { jsPDF } = window.jspdf; const doc = new jsPDF('l','pt','a4'); const cols = Object.keys(data[0]); const rows = data.map(r=>cols.map(c=> String(r[c] ?? ''))); updateExportProgress(60); doc.text('Fincas',40,40); doc.autoTable({ startY:60, head:[cols], body:rows, styles:{ fontSize:7 } }); updateExportProgress(90); doc.save('fincas.pdf'); finishExportProgress(true); }
  async function exportLotesPDF(){ startExportProgress(); const cont=document.querySelector('[data-lotes-container]'); if(!cont){ finishExportProgress(false); showToast('error','Sin contexto'); return; } const fincaId=cont.getAttribute('data-id-finca'); const data= await fetchLotes(fincaId,{ limit:2000 }); if(!data.length){ finishExportProgress(false); showToast('error','Sin datos'); return; } updateExportProgress(30); const { jsPDF } = window.jspdf; const doc = new jsPDF('l','pt','a4'); const cols = Object.keys(data[0]); const rows = data.map(r=>cols.map(c=> String(r[c] ?? ''))); updateExportProgress(60); doc.text('Lotes finca '+fincaId,40,40); doc.autoTable({ startY:60, head:[cols], body:rows, styles:{ fontSize:7 } }); updateExportProgress(90); doc.save('lotes_finca_'+fincaId+'.pdf'); finishExportProgress(true); }
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
    mountFincasDynamic();
    mountLotesDynamic();
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

    // Catálogo agrícola (si existe la página)
    (function catalogInit(){
      const search = document.getElementById('catalogSearch');
      const filter = document.getElementById('catalogFilter');
      if(!search && !filter) return; // no estamos en catálogo
      const cards = Array.from(document.querySelectorAll('[data-kind][data-name]'));
      function apply(){
        const q = (search?.value||'').toLowerCase();
        const kind = filter?.value || '';
        cards.forEach(c=>{
          const name = (c.getAttribute('data-name')||'').toLowerCase();
          const k = c.getAttribute('data-kind');
          const matchQ = !q || name.includes(q);
          const matchK = !kind || k===kind;
          c.style.display = (matchQ && matchK) ? '' : 'none';
        });
      }
      search && search.addEventListener('input', debounce(apply,300));
      filter && filter.addEventListener('change', apply);
      document.getElementById('expandAllBtn')?.addEventListener('click',()=>{
        // Placeholder para futuro: si se agregan secciones colapsables
        showToast('success','Todo expandido (placeholder)');
      });
      document.getElementById('collapseAllBtn')?.addEventListener('click',()=>{
        showToast('success','Todo colapsado (placeholder)');
      });
      apply();

      /* --- CRUD dinámico catálogo --- */
      const modalHost = document.getElementById('modalHost');
      function closeModal(){ modalHost.innerHTML=''; modalHost.style.display='none'; document.body.style.overflow=''; }
      function openModal(key, data){
        const schemas = {
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
          createVariedadCultivo: { title:'Nueva Variedad', endpoint:'/api/catalogo/variedades-cultivo', method:'POST', fields:[
            {name:'id_tipo_cultivo', label:'Tipo Cultivo', type:'select', required:true, optionsSource:'/api/catalogo/tipos-cultivo', optionLabel:'nombre_tipo', optionValue:'id_tipo_cultivo'},
            {name:'nombre_variedad', label:'Nombre', required:true },
            {name:'caracteristicas', label:'Características', type:'textarea'},
            {name:'resistencia_enfermedades', label:'Resist. Enfermedades', type:'textarea'},
            {name:'rendimiento_esperado', label:'Rendimiento Esperado', type:'number'}
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
        const schema = schemas[key]; if(!schema) return;
        const formId='form_'+Date.now();
        modalHost.style.display='block';
        modalHost.innerHTML = `<div class="modal-overlay"><div class="modal-box animate-in"><button class="modal-close" data-close>&times;</button><h3>${schema.title}</h3><form id="${formId}" class="modal-form flex flex-col gap-5"></form><div class="flex justify-end gap-2 pt-2"><button class="btn btn-outline btn-sm" data-close>Cancelar</button><button class="btn btn-success btn-sm" type="submit" form="${formId}">Guardar</button></div></div></div>`;
        document.body.style.overflow='hidden';
        const form = modalHost.querySelector('form');
        schema.fields.forEach(f=>{
          const row=document.createElement('div'); row.className='form-row';
          row.innerHTML = `<label>${f.label}${f.required?' *':''}</label>${buildInput(f, data? data[f.name]: null)}`;
          form.appendChild(row);
        });
        modalHost.addEventListener('click', e=>{ if(e.target.matches('[data-close]') || e.target===modalHost.querySelector('.modal-overlay')) closeModal(); });
        form.addEventListener('submit', async (e)=>{
          e.preventDefault();
          const payload={}; let valid=true;
          schema.fields.forEach(f=>{
            const el=form.querySelector(`[name="${f.name}"]`); if(!el) return; const val=el.value.trim(); if(f.required && !val){ valid=false; el.classList.add('ring-2','ring-red-400'); setTimeout(()=>el.classList.remove('ring-2','ring-red-400'),1500); } payload[f.name]= val || null; });
          if(!valid){ showToast('error','Completa campos requeridos'); return; }
          try {
            const res = await fetch(schema.endpoint, { method:schema.method, headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
            const j= await res.json();
            if(!j.ok){ showToast('error', j.message||'Error'); return; }
            showToast('success','Guardado');
            closeModal();
            reloadCatalogPartial();
          } catch(err){ showToast('error','Fallo red'); }
        });
        // Cargar selects dinámicos
        schema.fields.filter(f=>f.type==='select' && f.optionsSource).forEach(async f=>{
          const sel=form.querySelector(`[name="${f.name}"]`); if(!sel) return; sel.innerHTML='<option value="">Cargando...</option>';
            try { const r= await fetch(f.optionsSource); const j= await r.json(); if(j.ok){ sel.innerHTML='<option value="">Seleccione...</option>'+ j.data.map(o=>`<option value="${o[f.optionValue]}">${o[f.optionLabel]}</option>`).join(''); if(data && data[f.name]) sel.value=data[f.name]; } else sel.innerHTML='<option value="">Error</option>'; } catch(e){ sel.innerHTML='<option value="">Error</option>'; }
        });
      }
      function buildInput(f, value){
        if(f.type==='textarea') return `<textarea name="${f.name}" class="input-modern" rows="3">${value? value: ''}</textarea>`;
        if(f.type==='number') return `<input type="number" step="any" name="${f.name}" value="${value? value: ''}" class="input-modern" />`;
        if(f.type==='select-static') return `<select name="${f.name}" class="input-modern">${f.options.map(o=>`<option value="${o.value}">${o.label}</option>`).join('')}</select>`;
        if(f.type==='select') return `<select name="${f.name}" class="input-modern"><option value="">Cargando...</option></select>`;
        return `<input type="text" name="${f.name}" value="${value? value: ''}" class="input-modern" />`;
      }
      async function reloadCatalogPartial(){
        try {
          const r= await fetch('/catalogo'); if(!r.ok) return; const html= await r.text();
          const parser=new DOMParser(); const doc=parser.parseFromString(html,'text/html');
          const newCultivosGrid=doc.getElementById('cultivosGrid');
          const newInsumosGrid=doc.getElementById('insumosGrid');
          if(newCultivosGrid) document.getElementById('cultivosGrid').innerHTML=newCultivosGrid.innerHTML;
          if(newInsumosGrid) document.getElementById('insumosGrid').innerHTML=newInsumosGrid.innerHTML;
          showToast('success','Catálogo actualizado');
        } catch(e){ /* silent */ }
      }
      document.querySelectorAll('[data-open-modal]').forEach(btn=>{
        btn.addEventListener('click', ()=> openModal(btn.getAttribute('data-open-modal')));
      });
    })();
  });
})();
