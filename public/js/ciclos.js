/* ciclos.js - gestión interactiva de ciclos de cultivo */
(function(){
  const state = {
    data: [], // ciclos
    filtros: { q:'', estado:'', fiDesde:'', fiHasta:'', ffDesde:'', ffHasta:'' },
  };
  const DBG = (window.__CICLOS_DEBUG = { steps:[], errors:[], t0: Date.now() });
  const log = s=>{ DBG.steps.push(s); };
  const err = e=>{ DBG.errors.push(String(e)); console.error('[ciclos]', e); };
  function qs(s,ctx=document){ return ctx.querySelector(s); }
  function qsa(s,ctx=document){ return Array.from(ctx.querySelectorAll(s)); }
  function debounce(fn,ms){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a),ms); }; }

  async function fetchCiclos(){
    try {
      const r = await fetch('/api/ciclos');
      const j = await r.json();
  if(j.ok){ state.data = (j.data||[]).map(c=>({ ...c, estado: c.estado_automatico || c.estado })); render(); computeHero(); computeMetrics(); buildCharts(); }
      else showToast('error', j.message||'Error');
    } catch(e){ err(e); showToast && showToast('error','Fallo al cargar ciclos'); }
  }

  function applyFiltros(arr){
    return arr.filter(c=>{
      if(state.filtros.q){ const q=state.filtros.q; if(!((c.nombre_ciclo||'').toLowerCase().includes(q) || (c.estado||'').includes(q))) return false; }
      if(state.filtros.estado && c.estado!==state.filtros.estado) return false;
      if(state.filtros.fiDesde && c.fecha_inicio_estimada && c.fecha_inicio_estimada < state.filtros.fiDesde) return false;
      if(state.filtros.fiHasta && c.fecha_inicio_estimada && c.fecha_inicio_estimada > state.filtros.fiHasta) return false;
      if(state.filtros.ffDesde && c.fecha_fin_estimada && c.fecha_fin_estimada < state.filtros.ffDesde) return false;
      if(state.filtros.ffHasta && c.fecha_fin_estimada && c.fecha_fin_estimada > state.filtros.ffHasta) return false;
      return true;
    });
  }

  function calcProgreso(c){
    if(!c.fecha_inicio_estimada || !c.fecha_fin_estimada) return 0;
    const start = Date.parse(c.fecha_inicio_estimada); const end = Date.parse(c.fecha_fin_estimada); const now = Date.now();
    if(isNaN(start)||isNaN(end) || end<=start) return 0;
    const p = (now - start)/(end-start);
    return Math.max(0, Math.min(1, p));
  }
  function isAtrasado(c){
    if(c.estado!=='en_progreso') return false;
    if(!c.fecha_fin_estimada) return false;
    if(c.fecha_cosecha_real) return false; // ya terminó
    const fin = Date.parse(c.fecha_fin_estimada);
    return !isNaN(fin) && Date.now()>fin;
  }

  function render(){
    const grid = qs('#ciclosGrid'); if(!grid) return;
    const filtrados = applyFiltros(state.data);
    grid.innerHTML = filtrados.map(c=> buildCard(c)).join('');
    // bind acciones
    qsa('.ciclo-card').forEach(card=>{
      card.addEventListener('click', e=>{
        if(e.target.closest('[data-edit]')|| e.target.closest('[data-del]')) return;
        openQuickView(card.dataset.id);
      });
      card.querySelector('[data-edit]')?.addEventListener('click', e=>{ e.stopPropagation(); editCiclo(card.dataset.id); });
      card.querySelector('[data-del]')?.addEventListener('click', e=>{ e.stopPropagation(); deleteCiclo(card.dataset.id); });
    });
  }

  function buildCard(c){
    const prog = calcProgreso(c);
    const atraso = isAtrasado(c);
    const dur = c.fecha_inicio_estimada && c.fecha_fin_estimada? diffDays(c.fecha_inicio_estimada, c.fecha_fin_estimada)+'d':'—';
    return `<div class="ciclo-card" data-id="${c.id_ciclo}" data-status="${c.estado}">
      <div class="card-actions">
        <button data-edit title="Editar">E</button>
        <button data-del title="Eliminar">×</button>
      </div>
      <div class="cc-head">
        <div class="cc-title">${escapeHtml(c.nombre_ciclo||'Sin nombre')}</div>
        <div class="cc-badges">
          <span class="badge ${badgeColor(c.estado)}">${c.estado.replace('_',' ')}</span>
          ${atraso? '<span class="badge red">ATRASO</span>':''}
        </div>
      </div>
      <div class="cc-body">
        <div><strong>Inicio:</strong> ${fmtDate(c.fecha_inicio_estimada)||'—'}</div>
        <div><strong>Fin Est.:</strong> ${fmtDate(c.fecha_fin_estimada)||'—'}</div>
        <div><strong>Duración:</strong> ${dur}</div>
      </div>
      <div class="cc-progress-wrap"><div class="cc-progress-bar" style="width:${Math.round(prog*100)}%"></div></div>
      <div class="cc-footer"><span>${Math.round(prog*100)}%</span><span>#${c.id_ciclo}</span></div>
    </div>`;
  }

  function badgeColor(est){
    switch(est){
      case 'en_progreso': return 'blue';
      case 'completado': return 'green';
      case 'cancelado': return 'red';
      default: return '';
    }
  }

  function diffDays(a,b){ const A=Date.parse(a), B=Date.parse(b); if(isNaN(A)||isNaN(B)) return 0; return Math.round((B-A)/86400000); }
  function fmtDate(d){ if(!d) return ''; try { return new Date(d).toISOString().slice(0,10); } catch(_e){ return ''; } }
  function escapeHtml(s){ return (s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]); }

  // Quick View ciclo
  async function openQuickView(id){
    const ciclo = state.data.find(c=> c.id_ciclo==id); if(!ciclo) return;
    const existing = qs('#quickViewOverlay'); existing && existing.remove();
    const ov=document.createElement('div'); ov.id='quickViewOverlay'; ov.className='quick-view-overlay';
    ov.innerHTML = `<div class='quick-view-panel animate-in'>
      <div class='qv-header'>
        <div class='qv-icon'>🌀</div>
        <div class='qv-titles'><h3>${escapeHtml(ciclo.nombre_ciclo)}</h3><div class='qv-sub'>Ciclo #${ciclo.id_ciclo}</div></div>
        <button class='qv-close' aria-label='Cerrar'>×</button>
      </div>
      <div class='qv-body'>
        <div class='grid gap-2 text-[12px]' id='cicloInfoPrimary'>
          <div><strong>Estado:</strong> ${ciclo.estado} ${ciclo.estado_automatico && ciclo.estado_automatico!==ciclo.estado? '(auto: '+ciclo.estado_automatico+')':''}</div>
          <div><strong>Inicio:</strong> ${fmtDate(ciclo.fecha_inicio_estimada)||'—'}</div>
          <div><strong>Fin Est.:</strong> ${fmtDate(ciclo.fecha_fin_estimada)||'—'}</div>
          <div><strong>Fin Real:</strong> ${fmtDate(ciclo.fecha_cosecha_real)||'—'}</div>
          <div><strong>Observaciones:</strong> ${(escapeHtml(ciclo.observaciones)||'—')}</div>
        </div>
        <div class='mt-4' id='cicloProgresoBlock'>
          <div class='text-[11px] opacity-60'>Calculando progreso...</div>
        </div>
        <div class='mt-4' id='cicloCultivosBlock'><div class='text-[11px] opacity-60'>Cargando cultivos...</div></div>
        <div class='mt-4' id='cicloTimelineBlock'></div>
      </div>
      <div class='qv-footer flex justify-end gap-2'>
        <button class='btn btn-outline btn-sm' data-edit-qv>Editar</button>
        <button class='btn btn-danger btn-sm' data-del-qv>Eliminar</button>
      </div>
    </div>`;
    document.body.appendChild(ov); document.body.style.overflow='hidden';
    ov.addEventListener('click', e=>{ if(e.target===ov || e.target.classList.contains('qv-close')) close(); });
    function close(){ ov.remove(); document.body.style.overflow=''; }
    ov.querySelector('[data-edit-qv]')?.addEventListener('click', ()=>{ close(); editCiclo(id); });
    ov.querySelector('[data-del-qv]')?.addEventListener('click', ()=>{ close(); deleteCiclo(id); });
    // Lazy load cultivos
    ;(async()=>{
      try {
        const r= await fetch('/api/ciclos/'+id); const j= await r.json();
        if(!j.ok){ setCultivosHtml('<div class="text-[11px] text-red-500">Error cargando cultivos</div>'); setProgresoHtml('<div class="text-[11px] text-red-500">Error cargando progreso</div>'); return; }
        const dataDet = j.data;
        const cults = dataDet.cultivos||[]; setCultivosHtml(renderCultivosList(cults)); renderTimeline(ciclo, cults);
        setProgresoHtml(renderProgresoSection(id, dataDet));
      } catch(e){ setCultivosHtml('<div class="text-[11px] text-red-500">Fallo de red</div>'); }
    })();
    function setCultivosHtml(html){ const b=ov.querySelector('#cicloCultivosBlock'); if(b) b.innerHTML = `<h4 class='font-semibold text-[12px] mb-1'>Cultivos (${html.includes('data-cultivo-item')? '' : ''})</h4>`+html; }
    function setProgresoHtml(html){ const b=ov.querySelector('#cicloProgresoBlock'); if(b) b.innerHTML = html; bindProgresoUI(id); }
  }

  function renderCultivosList(cults){
    if(!cults.length) return '<div class="text-[11px] opacity-60">Sin cultivos asociados.</div>';
    return `<div class='cultivos-list grid gap-1 text-[11px]'>${cults.map(c=>`<div class='c-lr flex justify-between items-center gap-2' data-cultivo-item>
      <span class='truncate'>${escapeHtml(c.nombre_cultivo||('Cultivo #'+c.id_cultivo))}</span>
      <span class='badge ${badgeColor(c.estado)}'>${c.estado.replace('_',' ')}</span>
    </div>`).join('')}</div>`;
  }

  function renderTimeline(ciclo, cults){
    const block = qs('#cicloTimelineBlock'); if(!block) return;
    const inicio = Date.parse(ciclo.fecha_inicio_estimada); const fin = Date.parse(ciclo.fecha_fin_estimada);
    if(isNaN(inicio)||isNaN(fin) || fin<=inicio){ block.innerHTML=''; return; }
    // Normalizar cultivos por fechas clave
    const span = fin - inicio;
    function pct(d){ const ts=Date.parse(d); if(isNaN(ts)) return null; return Math.max(0, Math.min(1,(ts - inicio)/span)); }
    const rows = cults.map(c=>{
      const ps = pct(c.fecha_siembra);
      const pf = pct(c.fecha_floracion);
      const pc = pct(c.fecha_cosecha_esperada || c.fecha_cosecha_real);
      const start = ps!=null? ps:0; const end = pc!=null? pc: ps!=null? Math.min(ps+0.05,1):0.05;
      return { nombre: c.nombre_cultivo||('Cultivo #'+c.id_cultivo), start, end, flor: pf };
    });
    block.innerHTML = `<h4 class='font-semibold text-[12px] mb-1'>Timeline</h4>
      <div class='timeline-grid'>${rows.map(r=> timelineRow(r)).join('')}</div>`;
  }
  function timelineRow(r){
    const barLeft = (r.start*100).toFixed(2)+'%'; const barWidth = ((r.end - r.start)*100).toFixed(2)+'%';
    const florMarker = r.flor!=null? `<span class='tl-marker' style='left:${(r.flor*100).toFixed(2)}%' title='Floración'></span>`:'';
    return `<div class='tl-row'>
      <div class='tl-label'>${escapeHtml(r.nombre)}</div>
      <div class='tl-track'>
        <span class='tl-bar' style='left:${barLeft};width:${barWidth};'></span>
        ${florMarker}
      </div>
    </div>`;
  }

  // ================= Progreso interactivo (hitos / manual) =================
  function renderProgresoSection(idCiclo, det){
    const pct = det.avance_pct!=null? det.avance_pct:0;
    const hitos = det.hitos||[];
    const origen = det.avance_origen||'';
    const labelOrigen = origen==='hitos'? `Hitos (${hitos.filter(h=>h.completado).length}/${hitos.length})` : origen==='manual'? 'Avance manual' : 'Derivado por fechas';
    const isCompleted = (det.estado==='completado') || (det.estado_automatico==='completado') || pct===100;
    const completeBtn = !isCompleted ? `<div class='mt-2'><button class='btn btn-xs btn-success' data-complete-ciclo='${idCiclo}'>Marcar completado</button></div>` : `<div class='mt-2 text-[10px] text-emerald-600'>Ciclo completado</div>`;
    return `<h4 class='font-semibold text-[12px] mb-1'>Progreso</h4>
      <div class='pb-2'>
        <div class='progress-outer h-2 bg-slate-200 rounded'><div class='progress-inner bg-emerald-500 h-2 rounded' style='width:${pct}%' ></div></div>
        <div class='flex justify-between text-[11px] mt-1'><span>${labelOrigen}</span><span>${pct}%</span></div>
      </div>
      ${hitos.length? renderHitosList(idCiclo, hitos) : renderManualSlider(det)}
      <div class='mt-2 text-[10px] opacity-50'>El avance usa hitos si existen, luego avance manual, o fechas.</div>
      ${completeBtn}`;
  }
  function renderHitosList(idCiclo, hitos){
    return `<div class='hitos-block'>
      <div class='flex justify-between items-center mb-1'>
        <span class='text-[11px] font-semibold'>Hitos</span>
        <button class='btn btn-xs' data-add-hito='${idCiclo}'>+ Hito</button>
      </div>
      <div class='hitos-list flex flex-col gap-1'>${hitos.map(h=> hitoRow(h)).join('')}</div>
      <div class='mt-2 hidden' data-add-hito-form>
        <input type='text' class='input-modern input-hito-titulo mb-1' placeholder='Título del hito...' />
        <div class='flex gap-2'>
          <input type='date' class='input-modern input-hito-fecha flex-1' />
          <button class='btn btn-xs btn-success' data-save-hito>Guardar</button>
          <button class='btn btn-xs' data-cancel-hito>Cancelar</button>
        </div>
      </div>
    </div>`;
  }
  function hitoRow(h){
    return `<div class='hito-row flex items-center gap-2 text-[11px]' data-hito='${h.id_hito}'>
      <input type='checkbox' data-hito-check ${h.completado? 'checked':''} />
      <span class='flex-1 truncate ${h.completado? 'line-through opacity-60':''}'>${escapeHtml(h.titulo)}</span>
      <button class='text-slate-400 hover:text-red-500' data-hito-del title='Eliminar'>✕</button>
    </div>`;
  }
  function renderManualSlider(det){
    const pct = det.avance_pct||0;
    return `<div class='manual-block'>
      <div class='flex justify-between items-center mb-1'>
        <span class='text-[11px] font-semibold'>Avance Manual</span>
      </div>
      <input type='range' min='0' max='100' value='${pct}' class='w-full' data-manual-range />
      <div class='flex justify-end mt-1'><button class='btn btn-xs btn-outline' data-save-manual>Guardar</button></div>
    </div>`;
  }
  function bindProgresoUI(idCiclo){
    const cont = document.getElementById('quickViewOverlay'); if(!cont) return;
    // Toggle add hito form
    cont.querySelector('[data-add-hito]')?.addEventListener('click', e=>{
      const form = cont.querySelector('[data-add-hito-form]'); form?.classList.remove('hidden');
      cont.querySelector('[data-add-hito]')?.classList.add('hidden');
    });
    cont.querySelector('[data-cancel-hito]')?.addEventListener('click', ()=>{
      cont.querySelector('[data-add-hito-form]')?.classList.add('hidden');
      cont.querySelector('[data-add-hito]')?.classList.remove('hidden');
    });
    cont.querySelector('[data-save-hito]')?.addEventListener('click', async ()=>{
      const titulo = cont.querySelector('.input-hito-titulo')?.value.trim();
      const fecha = cont.querySelector('.input-hito-fecha')?.value || null;
      if(!titulo) { showToast && showToast('error','Título requerido'); return; }
      try {
        const r = await fetch(`/api/ciclos/${idCiclo}/hitos`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ titulo, fecha_objetivo: fecha }) });
        const j = await r.json(); if(!j.ok) return showToast && showToast('error','Error creando hito');
        refreshQuickView(idCiclo);
      } catch(e){ showToast && showToast('error','Fallo red'); }
    });
    // Checkbox toggle
    cont.querySelectorAll('[data-hito-check]').forEach(ch=>{
      ch.addEventListener('change', async e=>{
        const row = e.target.closest('[data-hito]'); const idH = row?.dataset.hito; if(!idH) return;
        try {
          const r = await fetch(`/api/hitos/${idH}/toggle`, { method:'PATCH' });
          const j = await r.json(); if(!j.ok) return showToast && showToast('error','Error actualizando');
          refreshQuickView(idCiclo);
        } catch(_e){ showToast && showToast('error','Fallo red'); }
      });
    });
    // Delete hito
    cont.querySelectorAll('[data-hito-del]')?.forEach(btn=>{
      btn.addEventListener('click', async e=>{
        const idH = e.target.closest('[data-hito]')?.dataset.hito; if(!idH) return;
        if(!confirm('¿Eliminar hito?')) return;
        try { const r= await fetch(`/api/hitos/${idH}`, { method:'DELETE' }); const j= await r.json(); if(!j.ok) return showToast && showToast('error','Error eliminando'); refreshQuickView(idCiclo);} catch(_e){ showToast && showToast('error','Fallo red'); }
      });
    });
    // Guardar manual
    cont.querySelector('[data-save-manual]')?.addEventListener('click', async ()=>{
      const val = cont.querySelector('[data-manual-range]')?.value;
      try {
        const r = await fetch(`/api/ciclos/${idCiclo}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ avance_manual: Number(val) }) });
        const j = await r.json();
        if(!j.ok){
          showToast && showToast('error', j.message || 'Error guardando');
          return;
        }
        showToast && showToast('success','Progreso guardado');
        refreshQuickView(idCiclo);
      } catch(_e){ showToast && showToast('error','Fallo red'); }
    });
    // Completar ciclo
    cont.querySelector('[data-complete-ciclo]')?.addEventListener('click', async ()=>{
      if(!confirm('¿Marcar este ciclo como completado?')) return;
      try {
        const r = await fetch(`/api/ciclos/${idCiclo}/complete`, { method:'POST' });
        const j = await r.json();
        if(!j.ok){ showToast && showToast('error', j.message||'Error completando'); return; }
        showToast && showToast('success','Ciclo completado');
        refreshQuickView(idCiclo);
        // refrescar listado principal si está cargado
        if(typeof loadData==='function') loadData();
      } catch(_e){ showToast && showToast('error','Fallo red'); }
    });
  }
  async function refreshQuickView(id){
    const ov = document.getElementById('quickViewOverlay'); if(!ov) return;
    const progresoBlock = ov.querySelector('#cicloProgresoBlock'); if(progresoBlock) progresoBlock.innerHTML='<div class="text-[11px] opacity-60">Actualizando...</div>';
    try {
      const r = await fetch('/api/ciclos/'+id); const j = await r.json(); if(!j.ok) return;
      const det = j.data; const html = renderProgresoSection(id, det); if(progresoBlock){ progresoBlock.innerHTML = html; bindProgresoUI(id); }
    } catch(_e){ if(progresoBlock) progresoBlock.innerHTML='<div class="text-[11px] text-red-500">Fallo</div>'; }
    // también refrescar cultivos + timeline? (opcional futuramente)
  }

  // CRUD
  function openModal(data){
    const host = document.getElementById('modalHost'); host.style.display='block';
    const isEdit = !!data;
    const formId = 'formCiclo_'+Date.now();
    host.innerHTML = `<div class='modal-overlay'><div class='modal-box animate-in'>
      <button class='modal-close' data-close>×</button>
      <h3>${isEdit? 'Editar':'Nuevo'} Ciclo</h3>
      <form id='${formId}' class='modal-form flex flex-col gap-4'>
        ${fieldRow('nombre_ciclo','Nombre', 'text', data?.nombre_ciclo, true)}
        ${fieldRow('descripcion','Descripción', 'textarea', data?.descripcion)}
        <div class='grid grid-cols-2 gap-3'>
          ${fieldRow('fecha_inicio_estimada','Inicio Est.', 'date', data?.fecha_inicio_estimada)}
          ${fieldRow('fecha_fin_estimada','Fin Est.', 'date', data?.fecha_fin_estimada)}
        </div>
        <div class='grid grid-cols-2 gap-3'>
          ${fieldRow('fecha_cosecha_real','Fin Real', 'date', data?.fecha_cosecha_real)}
          ${selectRow('estado','Estado', data?.estado || 'planificado', ['planificado','en_progreso','completado','cancelado'])}
        </div>
        ${fieldRow('observaciones','Observaciones', 'textarea', data?.observaciones)}
      </form>
      <div class='flex justify-end gap-2 pt-2'>
        <button class='btn btn-outline btn-sm' data-close>Cancelar</button>
        <button class='btn btn-success btn-sm' type='submit' form='${formId}'>${isEdit? 'Actualizar':'Guardar'}</button>
      </div>
    </div></div>`;
    document.body.style.overflow='hidden';
    host.addEventListener('click', e=>{ if(e.target.matches('[data-close]') || e.target===host.querySelector('.modal-overlay')) closeModal(); });
    const form = host.querySelector('form');
    form.addEventListener('submit', async e=>{
      e.preventDefault();
      const payload = collect(form);
      if(!payload.nombre_ciclo){ shake(form.querySelector('[name=nombre_ciclo]')); return showToast && showToast('error','Nombre requerido'); }
      try {
        const method = isEdit? 'PUT':'POST';
        const url = isEdit? '/api/ciclos/'+data.id_ciclo : '/api/ciclos';
        const r = await fetch(url, { method, headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
        const j = await r.json();
        if(!j.ok){ showToast && showToast('error', j.message||'Error'); return; }
        showToast && showToast('success', isEdit? 'Actualizado':'Creado');
        closeModal();
        await fetchCiclos();
      } catch(e){ err(e); showToast && showToast('error','Fallo red'); }
    });
  }
  function closeModal(){ const host=document.getElementById('modalHost'); host.innerHTML=''; host.style.display='none'; document.body.style.overflow=''; }
  function fieldRow(name,label,type,value,required){
    if(type==='textarea') return `<div class='form-row'><label>${label}${required?' *':''}</label><textarea name='${name}' class='input-modern' rows='3'>${value||''}</textarea></div>`;
    return `<div class='form-row'><label>${label}${required?' *':''}</label><input type='${type}' name='${name}' class='input-modern' value='${value||''}' /></div>`;
  }
  function selectRow(name,label,value,opts){ return `<div class='form-row'><label>${label}</label><select name='${name}' class='input-modern'>${opts.map(o=>`<option value='${o}' ${o===value?'selected':''}>${o.replace('_',' ')}</option>`).join('')}</select></div>`; }
  function collect(form){ const o={}; form.querySelectorAll('[name]').forEach(el=> o[el.name]=el.value.trim()||null); return o; }
  function shake(el){ if(!el) return; el.classList.add('ring-2','ring-red-400'); setTimeout(()=> el.classList.remove('ring-2','ring-red-400'),1200); }
  function editCiclo(id){ const c=state.data.find(x=> x.id_ciclo==id); if(c) openModal(c); }
  async function deleteCiclo(id){ if(!confirm('¿Eliminar ciclo?')) return; try { const r= await fetch('/api/ciclos/'+id,{ method:'DELETE' }); const j= await r.json(); if(j.ok){ showToast && showToast('success','Eliminado'); fetchCiclos(); } else showToast && showToast('error', j.message||'Error'); } catch(e){ err(e); showToast && showToast('error','Fallo'); } }

  // Hero stats
  function computeHero(){
    const total = state.data.length;
    const enProg = state.data.filter(c=> c.estado==='en_progreso').length;
    const comp = state.data.filter(c=> c.estado==='completado').length;
    const atras = state.data.filter(c=> isAtrasado(c)).length;
    setHero('total', total); setHero('progreso', enProg); setHero('completado', comp); setHero('atraso', atras);
  }
  function setHero(key,val){ const el=qs(`[data-hs="${key}"]`); if(el) el.textContent=val; }

  // Métricas panel
  function computeMetrics(){
    const arr = state.data;
    const duraciones = arr.map(c=> diffDays(c.fecha_inicio_estimada, c.fecha_fin_estimada)).filter(n=> n>0);
    const promDur = duraciones.length? Math.round(duraciones.reduce((a,b)=>a+b,0)/duraciones.length): '—';
    setMx('duracionProm', `Duración prom.: ${promDur==='—'? '—': promDur+'d'}`);
    const avances = arr.map(calcProgreso).filter(p=> p>0); const promAv = avances.length? Math.round(avances.reduce((a,b)=>a+b,0)/avances.length*100): '—';
    setMx('avanceProm', `Avance prom.: ${promAv==='—'? '—': promAv+'%'}`);
    const exitoBase = arr.filter(c=> c.estado==='completado').length /(arr.length||1);
    setMx('tasaExito', `Tasa éxito: ${Math.round(exitoBase*100)}%`);
    const hoy = arr.filter(c=> c.estado==='en_progreso').length;
    setMx('progresoHoy', `En progreso hoy: ${hoy}`);
  }
  function setMx(key,text){ const el=qs(`[data-mx="${key}"]`); if(el) el.textContent=text; }

  // Charts (simple fallback si no está Chart.js)
  function buildCharts(){
    if(!window.Chart){ return; }
    buildChartEstados(); buildChartDuraciones();
  }
  function buildChartEstados(){
    const ctx = document.getElementById('chartEstados'); if(!ctx) return;
    const counts = { planificado:0, en_progreso:0, completado:0, cancelado:0 };
    state.data.forEach(c=> counts[c.estado] = (counts[c.estado]||0)+1);
    new Chart(ctx,{ type:'doughnut', data:{ labels:Object.keys(counts), datasets:[{ data:Object.values(counts), backgroundColor:['#94a3b8','#3b82f6','#16a34a','#dc2626'] }] }, options:{ plugins:{legend:{position:'bottom'}}, cutout:'55%' } });
  }
  function buildChartDuraciones(){
    const ctx = document.getElementById('chartDuraciones'); if(!ctx) return;
    const arr = state.data.map(c=> diffDays(c.fecha_inicio_estimada, c.fecha_fin_estimada)).filter(n=> n>0);
    if(!arr.length) return;
    new Chart(ctx,{ type:'bar', data:{ labels: arr.map((_,i)=> 'C'+(i+1)), datasets:[{ label:'Duración (días)', data:arr, backgroundColor:'#2563eb' }] }, options:{ plugins:{legend:{display:false}}, scales:{ y:{ beginAtZero:true } } } });
  }

  // Export CSV y PDF
  function exportCSV(){
    try { const lines=['id,nombre,estado,fecha_inicio_estimada,fecha_fin_estimada,fecha_cosecha_real,duracion_dias,avance%'];
      state.data.forEach(c=>{ const dur= diffDays(c.fecha_inicio_estimada, c.fecha_fin_estimada); const av=Math.round(calcProgreso(c)*100); lines.push([c.id_ciclo, quote(c.nombre_ciclo), c.estado, c.fecha_inicio_estimada||'', c.fecha_fin_estimada||'', c.fecha_cosecha_real||'', dur, av].join(',')); });
      const blob = new Blob([lines.join('\n')],{type:'text/csv;charset=utf-8;'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='ciclos.csv'; a.click(); URL.revokeObjectURL(a.href); showToast && showToast('success','CSV generado'); }
    catch(e){ err(e); showToast && showToast('error','Export falló'); }
  }
  function quote(s){ return '"'+(s||'').replace(/"/g,'""')+'"'; }
  // Carga perezosa/fallback de jsPDF + autotable si no están presentes
  let _loadingJsPDF = null;
  function ensureJsPDF(){
    if(window.jspdf?.jsPDF || window.jsPDF) return Promise.resolve();
    if(_loadingJsPDF) return _loadingJsPDF;
    _loadingJsPDF = new Promise((resolve,reject)=>{
      const s=document.createElement('script');
      s.src='https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js';
      s.onload=()=>{
        const p=document.createElement('script');
        p.src='https://cdn.jsdelivr.net/npm/jspdf-autotable@3.8.2/dist/jspdf.plugin.autotable.min.js';
        p.onload=()=> resolve();
        p.onerror=()=> resolve(); // continuamos aunque falle autotable -> fallback texto
        document.head.appendChild(p);
      };
      s.onerror=()=> reject(new Error('No se pudo cargar jsPDF'));
      document.head.appendChild(s);
    }).finally(()=>{ _loadingJsPDF=null; });
    return _loadingJsPDF;
  }

  async function exportPDF(){
    try {
      // Asegurar disponibilidad
      if(!(window.jspdf?.jsPDF || window.jsPDF)){
        await ensureJsPDF();
      }
      const JsPDFCtor = window.jspdf?.jsPDF || window.jsPDF;
      if(!JsPDFCtor){ showToast && showToast('error','jsPDF no cargado (verifica conexión)'); return; }
      const doc = new JsPDFCtor('p','pt');
      doc.setFontSize(14); doc.text('Reporte de Ciclos de Cultivo',40,40);
      const rows = state.data.map(c=>[
        c.id_ciclo,
        c.nombre_ciclo,
        c.estado,
        c.fecha_inicio_estimada||'',
        c.fecha_fin_estimada||'',
        (c.avance_pct!=null? c.avance_pct : Math.round(calcProgreso(c)*100))+'%',
        diffDays(c.fecha_inicio_estimada,c.fecha_fin_estimada),
        (c.hitos_completados!=null? `${c.hitos_completados}/${c.hitos_total||0}`:'')
      ]);
      if(typeof doc.autoTable==='function'){
        doc.autoTable({
          startY:60,
            head:[['ID','Nombre','Estado','Inicio','Fin Est.','Avance','Duración','Hitos']],
            body:rows,
            styles:{ fontSize:8 },
            headStyles:{ fillColor:[59,130,246] }
        });
      } else {
        let y=70; doc.setFontSize(10);
        rows.forEach(r=>{ if(y>740){ doc.addPage(); y=60; } doc.text(r.join(' | '), 40, y); y+=14; });
        showToast && showToast('info','Autotable no disponible: usando texto simple');
      }
      doc.save('ciclos_reporte.pdf');
      showToast && showToast('success','PDF generado');
    } catch(e){
      err(e);
      showToast && showToast('error','PDF falló');
    }
  }

  // Eventos UI
  function bindUI(){
    qs('[data-open-ciclo="create"]')?.addEventListener('click', ()=> openModal());
    qs('#btnExportCiclos')?.addEventListener('click', exportCSV);
    qs('#btnPdfCiclos')?.addEventListener('click', exportPDF);
    qs('#cicloSearch')?.addEventListener('input', debounce(e=>{ state.filtros.q=e.target.value.trim().toLowerCase(); render(); },200));
    qs('#cicloEstado')?.addEventListener('change', e=>{ state.filtros.estado=e.target.value; render(); });
    qs('#fiDesde')?.addEventListener('change', e=>{ state.filtros.fiDesde=e.target.value; render(); });
    qs('#fiHasta')?.addEventListener('change', e=>{ state.filtros.fiHasta=e.target.value; render(); });
    qs('#ffDesde')?.addEventListener('change', e=>{ state.filtros.ffDesde=e.target.value; render(); });
    qs('#ffHasta')?.addEventListener('change', e=>{ state.filtros.ffHasta=e.target.value; render(); });
    qs('#cicloResetFiltros')?.addEventListener('click', ()=>{ Object.assign(state.filtros,{ q:'', estado:'', fiDesde:'', fiHasta:'', ffDesde:'', ffHasta:'' }); qsa('.ciclos-filters input, .ciclos-filters select').forEach(el=> el.value=''); render(); });
  }

  // Exponer diag
  window.__ciclosDiag = function(){ return { total: state.data.length, filtros: state.filtros, steps: DBG.steps.slice(-20), errors: DBG.errors }; };

  document.addEventListener('DOMContentLoaded', ()=>{ bindUI(); fetchCiclos(); });
})();
