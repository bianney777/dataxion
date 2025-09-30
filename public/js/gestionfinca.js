// public/js/gestionfinca.js
// Modularización de la gestión de fincas y lotes (similar a catalogo.js)
(function(){
  const DEBUG = window.__FINCAS_DEBUG = window.__FINCAS_DEBUG || [];
  const state = {
    fincas: [],
    lotes: [],
    pageFincas: 1,
    limitFincas: 9,
    totalFincas: 0,
    qFincas: '',
    estadoFilter: '',
    loadingFincas: false,
    loadingLotes: false,
    activeFinca: null,
    pageLotes: 1,
    limitLotes: 9,
    totalLotes: 0,
    qLotes: ''
  };

  function log(step, extra){ DEBUG.push({ t: Date.now(), step, extra }); }
  function qs(sel, ctx=document){ return ctx.querySelector(sel); }
  function qsa(sel, ctx=document){ return Array.from(ctx.querySelectorAll(sel)); }

  function skeletonCards(n){
    let html='';
    for(let i=0;i<n;i++){
      html += `<div class="finca-card skeleton animate-pulse rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex flex-col gap-3">
        <div class="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
        <div class="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
        <div class="mt-auto flex gap-2">
          <div class="h-7 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
          <div class="h-7 w-10 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>
      </div>`;
    }
    return html;
  }

  function fincaCardTemplate(f){
    const estadoClass = 'status-'+(f.estado||'activa');
    return `<div class="finca-card glass-card rounded-xl flex flex-col border border-slate-200 dark:border-slate-700" data-id="${f.id_finca}">
      <div class="p-4 pb-2 flex flex-col gap-2 flex-1">
      <div class="flex items-start justify-between gap-2">
        <div class="flex flex-col">
          <h4 class="font-semibold text-slate-700 dark:text-slate-100 text-sm leading-tight">${escapeHtml(f.nombre_finca||'—')}</h4>
          <span class="status-badge ${estadoClass} mt-1">${(f.estado||'').replace('_',' ')||'—'}</span>
        </div>
        <button class="btn-icon text-slate-500 hover:text-slate-700 dark:hover:text-slate-200" data-action="expand" title="Ver lotes" aria-label="Ver lotes de ${escapeHtml(f.nombre_finca||'finca')}">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        </button>
      </div>
      <div class="text-[12px] text-slate-500 dark:text-slate-400 flex flex-col gap-1">
        <span>Área: <strong>${formatNum(f.area_total)} ha</strong></span>
        <span>Zona: <strong>${escapeHtml(f.zona|| f.id_zona || '—')}</strong></span>
        <span>Ubicación: <strong>${escapeHtml(f.ubicacion||'—')}</strong></span>
      </div>
      </div>
      <div class="action-footer px-4 pb-4 pt-2 mt-auto">
        <div class="flex gap-2 flex-wrap">
          <a href="/gestionfinca/${f.id_finca}/lotes" class="btn btn-xs btn-outline" title="Ir a lotes">Lotes</a>
          <a href="/gestionfinca/${f.id_finca}/edit" class="btn btn-xs" title="Editar finca">Editar</a>
          <form action="/gestionfinca/${f.id_finca}/delete" method="POST" onsubmit="return confirm('¿Eliminar finca?');">
            <button type="submit" class="btn btn-xs btn-danger" title="Eliminar finca">Eliminar</button>
          </form>
        </div>
        <div class="expand-area hidden pt-3" data-expand-area></div>
      </div>
    </div>`;
  }

  function loteCardTemplate(l){
    return `<div class="lote-card glass-card rounded-lg flex flex-col border border-slate-200 dark:border-slate-700" data-id="${l.id_lote}">
      <div class="p-3 pb-1">
        <div class="flex items-center justify-between gap-2 mb-1">
          <h5 class="font-medium text-slate-700 dark:text-slate-100 text-[13px]">${escapeHtml(l.nombre_lote||'—')}</h5>
          <span class="text-[10px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200">${escapeHtml(l.tipo_suelo||'—')}</span>
        </div>
        <div class="text-[11px] text-slate-500 dark:text-slate-400 flex flex-col">
          <span>Área: <strong>${formatNum(l.area)} ha</strong></span>
          <span>pH: <strong>${l.ph_suelo!=null? l.ph_suelo : '—'}</strong></span>
        </div>
      </div>
      <div class="px-3 pb-3 pt-1 mt-auto">
        <div class="flex gap-2 flex-wrap">
          <a href="/gestionfinca/lotes/${l.id_lote}/edit" class="btn btn-xxs" title="Editar lote">Editar</a>
          <form action="/gestionfinca/lotes/${l.id_lote}/delete" method="POST" onsubmit="return confirm('¿Eliminar lote?');">
            <button type="submit" class="btn btn-xxs btn-danger" title="Eliminar lote">Eliminar</button>
          </form>
        </div>
      </div>
    </div>`;
  }

  // Escapado seguro básico para prevenir inyección en templates
  function escapeHtml(str){ return String(str ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'
  }[c] || c)); }
  function formatNum(n){ const v=parseFloat(n); if(isNaN(v)) return '0'; return v%1===0? v: v.toFixed(2); }

  async function fetchFincas(){
    state.loadingFincas = true; updateFincasUI();
    const params = new URLSearchParams({ page: state.pageFincas, limit: state.limitFincas });
    if(state.qFincas) params.append('q', state.qFincas);
    if(state.estadoFilter) params.append('estado', state.estadoFilter);
    try {
      const r = await fetch('/gestionfinca/api/fincas?'+params.toString());
      const j = await r.json();
      if(j && j.ok){
        state.fincas = j.data || [];
        state.totalFincas = (j.pagination && j.pagination.total) || state.fincas.length;
      } else if(Array.isArray(j)) {
        state.fincas = j; state.totalFincas = j.length;
      }
    } catch(e){ log('error_fetchFincas', e.message); showToast && showToast('error','Error cargando fincas'); }
    finally { state.loadingFincas = false; updateFincasUI(); refreshFincasMetrics(); window.__fincasSnapshot = [...state.fincas]; }
  }

  async function fetchLotes(fincaId){
    state.loadingLotes = true; renderLotesSkeleton(fincaId);
    const params = new URLSearchParams({ page: state.pageLotes, limit: state.limitLotes });
    if(state.qLotes) params.append('q', state.qLotes);
    try {
      const r = await fetch(`/gestionfinca/api/fincas/${fincaId}/lotes?`+params.toString());
      const j = await r.json();
      if(j && j.ok){
        state.lotes = j.data || [];
        state.totalLotes = (j.pagination && j.pagination.total) || state.lotes.length;
      } else if(Array.isArray(j)) {
        state.lotes = j; state.totalLotes = j.length;
      }
    } catch(e){ log('error_fetchLotes', e.message); showToast && showToast('error','Error cargando lotes'); }
    finally { state.loadingLotes = false; renderLotesExpanded(fincaId); refreshLotesMetrics(fincaId); }
  }

  async function refreshFincasMetrics(){
    try { const r= await fetch('/gestionfinca/api/fincas/metrics'); const j=await r.json(); if(j.ok){
      const t = qs('#metricTotalFincas'); t && (t.textContent=j.metrics.total);
      const at= qs('#metricAreaTotal'); at && (at.textContent=j.metrics.areaTotal.toFixed(2)+' ha');
      const ap= qs('#metricActivas'); ap && (ap.textContent=j.metrics.activasPct+'%');
    }} catch(e){ log('error_metrics_fincas', e.message); }
  }
  async function refreshLotesMetrics(fincaId){
    if(!fincaId) return;
    try { const r= await fetch(`/gestionfinca/api/fincas/${fincaId}/lotes/metrics`); const j=await r.json(); if(j.ok){
      const ph= qs('#metricPh'); ph && (ph.textContent=j.metrics.phPromedio);
      const areaL= qs('#metricAreaLotes'); areaL && (areaL.textContent=j.metrics.areaTotal.toFixed(2)+' ha');
    }} catch(e){ log('error_metrics_lotes', e.message); }
  }

  function updateFincasUI(){
    const cont = qs('[data-fincas-container]'); if(!cont) return;
    if(state.loadingFincas){ cont.innerHTML = skeletonCards(6); return; }
    if(!state.fincas.length){ cont.innerHTML = `<div class="col-span-full text-center text-sm text-slate-500 py-6">Sin fincas. Crea la primera.</div>`; return; }
    cont.innerHTML = state.fincas.map(fincaCardTemplate).join('');
  }

  function renderLotesSkeleton(fincaId){
    const card = qs(`.finca-card[data-id='${fincaId}']`);
    if(!card) return;
    const area = qs('[data-expand-area]', card);
    area.classList.remove('hidden');
    area.innerHTML = '<div class="grid grid-cols-2 md:grid-cols-3 gap-3 w-full pt-3">'+ skeletonCards(3) +'</div>';
  }

  function renderLotesExpanded(fincaId){
    const card = qs(`.finca-card[data-id='${fincaId}']`);
    if(!card) return;
    const area = qs('[data-expand-area]', card);
    area.classList.remove('hidden');
    if(state.loadingLotes){ renderLotesSkeleton(fincaId); return; }
    // Construir grilla + formulario inline para nuevo lote asociado a esta finca
    const gridHtml = state.lotes.length
      ? `<div class="grid grid-cols-2 md:grid-cols-3 gap-3 w-full pt-3">${state.lotes.map(loteCardTemplate).join('')}</div>`
      : '<div class="text-xs text-slate-500 py-2">Sin lotes registrados.</div>';
    const formHtml = `<form class="inline-new-lote mt-4 p-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50/70 dark:bg-slate-700/30 flex flex-col gap-3" data-new-lote-form data-id-finca="${fincaId}">
        <div class="text-[11px] font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-2">
          <span>Nuevo lote</span>
          <span class="text-[10px] font-normal text-slate-400">(Finca ${fincaId})</span>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <input name="nombre_lote" required placeholder="Nombre" class="input-modern text-[11px] px-2 py-1 rounded border border-slate-300 dark:border-slate-500 bg-white/70 dark:bg-slate-800/60" />
          <input name="area" type="number" step="0.0001" required placeholder="Área (ha)" class="input-modern text-[11px] px-2 py-1 rounded border border-slate-300 dark:border-slate-500 bg-white/70 dark:bg-slate-800/60" />
          <input name="tipo_suelo" placeholder="Tipo suelo" class="input-modern text-[11px] px-2 py-1 rounded border border-slate-300 dark:border-slate-500 bg-white/70 dark:bg-slate-800/60 col-span-2" />
          <input name="ph_suelo" type="number" step="0.1" placeholder="pH" class="input-modern text-[11px] px-2 py-1 rounded border border-slate-300 dark:border-slate-500 bg-white/70 dark:bg-slate-800/60" />
          <input name="capacidad_agua" type="number" step="0.01" placeholder="Cap. agua" class="input-modern text-[11px] px-2 py-1 rounded border border-slate-300 dark:border-slate-500 bg-white/70 dark:bg-slate-800/60" />
          <input name="coordenadas" placeholder="Coordenadas" class="input-modern text-[11px] px-2 py-1 rounded border border-slate-300 dark:border-slate-500 bg-white/70 dark:bg-slate-800/60 col-span-2" />
        </div>
        <textarea name="descripcion" rows="2" placeholder="Descripción" class="input-modern text-[11px] px-2 py-1 rounded border border-slate-300 dark:border-slate-500 bg-white/70 dark:bg-slate-800/60"></textarea>
        <div class="flex justify-end gap-2">
          <button type="submit" class="btn btn-xxs btn-success">Guardar lote</button>
        </div>
      </form>`;
    area.innerHTML = gridHtml + formHtml;
    const form = area.querySelector('[data-new-lote-form]');
    if(form){
      form.addEventListener('submit', async (ev)=>{
        ev.preventDefault();
        const fd = new FormData(form);
        const payload = { id_finca: fincaId };
        ['nombre_lote','area','tipo_suelo','ph_suelo','capacidad_agua','coordenadas','descripcion'].forEach(k=>{ const v=fd.get(k); if(v!==null && v!=='') payload[k]= v; });
        // Validación mínima
        if(!payload.nombre_lote || !payload.area){ showToast && showToast('error','Nombre y área requeridos'); return; }
        try {
          form.querySelector('button[type=submit]').disabled = true;
          const r = await fetch('/gestionfinca/lotes/create', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
          const j = await r.json().catch(()=>({ ok:false }));
          if(j && j.ok){ showToast && showToast('success','Lote creado'); fetchLotes(fincaId); }
          else { showToast && showToast('error', j.message||'Error creando lote'); }
        } catch(e){ showToast && showToast('error','Fallo red'); }
        finally { form.querySelector('button[type=submit]').disabled = false; }
      });
    }
  }

  function onFincasContainerClick(e){
    const btn = e.target.closest('[data-action="expand"]');
    if(btn){
      const card = btn.closest('.finca-card');
      const id = card.getAttribute('data-id');
      if(state.activeFinca === id){ // collapse
        state.activeFinca = null; qs('[data-expand-area]', card).classList.add('hidden');
      } else {
        state.activeFinca = id; fetchLotes(id);
      }
    }
  }

  function bindEvents(){
    const cont = qs('[data-fincas-container]'); cont && cont.addEventListener('click', onFincasContainerClick);
    const filterEstado = qs('#filterEstado'); filterEstado && filterEstado.addEventListener('change', ()=>{ state.estadoFilter = filterEstado.value; state.pageFincas=1; fetchFincas(); });
    const globalSearch = qs('#globalSearch'); globalSearch && globalSearch.addEventListener('input', debounce(()=>{ state.qFincas = globalSearch.value.trim(); state.pageFincas=1; fetchFincas(); },350));
  }

  function debounce(fn,ms){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a),ms); }; }

  function init(){
    log('init');
    bindEvents();
  fetchFincas();
    refreshFincasMetrics();
    window.__reloadFincas = fetchFincas; // utilidad externa
    // Utilidades para exportaciones globales (tomarán todos los registros ignorando paginación iterando pages)
    window.fetchAllFincas = async function(){
      const accum = [];
      let page = 1; const limit = 200; let total = 0; let pages = 1;
      do {
        const r = await fetch(`/gestionfinca/api/fincas?page=${page}&limit=${limit}&q=${encodeURIComponent(state.qFincas||'')}&estado=${encodeURIComponent(state.estadoFilter||'')}`);
        const j = await r.json();
        if(j.ok){
          accum.push(...(j.data||[]));
          total = j.pagination.total; pages = j.pagination.pages; page++;
        } else break;
      } while(page <= pages);
      if(!accum.length && window.__fincasSnapshot && window.__fincasSnapshot.length){ return [...window.__fincasSnapshot]; }
      return accum;
    };
    window.fetchAllLotes = async function(fincaId){
      const accum = []; let page=1; const limit=300; let pages=1;
      do {
        const r = await fetch(`/gestionfinca/api/fincas/${fincaId}/lotes?page=${page}&limit=${limit}&q=${encodeURIComponent(state.qLotes||'')}`);
        const j = await r.json();
        if(j.ok){ accum.push(...(j.data||[])); pages = j.pagination.pages; page++; } else break;
      } while(page<=pages);
      return accum;
    };
  }

  if(document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
