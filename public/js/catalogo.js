/* catalogo.js - módulo catálogo agrícola (vista tabulada utilitaria)
 * Responsabilidades:
 *  - Inicializar tabs, búsqueda, orden.
 *  - Lazy load de tipos e insumos detallados para quick view.
 *  - CRUD modal reutilizando endpoints existentes.
 *  - Hidratación de iconos.
 *  - Accesibilidad (roles/ARIA) + focus management.
 */
(function(){
  window.__CATALOGO_LOADED__ = (window.__CATALOGO_LOADED__||0) + 1;
  const DBG = (window.__CATALOG_DEBUG = { steps:[], errors:[], t0: Date.now() });
  const log = (s)=>{ DBG.steps.push(s); }; const err=(e)=>{ DBG.errors.push(String(e)); console.error('[catalogo]',e); };
  console.log('[catalogo] script loaded');

  // Util local (evitamos depender de app.js)
  function debounce(fn, ms){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), ms); }; }

  function showToastSafe(type,msg){ if(window.showToast) window.showToast(type,msg); }

  function qs(sel, ctx=document){ return ctx.querySelector(sel); }
  function qsa(sel, ctx=document){ return Array.from(ctx.querySelectorAll(sel)); }

  function init(){
    const root = qs('.catalog-util'); if(!root){ log('no-root'); return; }
    log('init:start');
    const tabButtons = qsa('.cu-tab', root);
    const panels = qsa('.cu-panel', root);
    const search = qs('#cuSearch');
    const sortSel = qs('#cuSort');
    const advDiasMin = qs('#fDiasMin');
    const advDiasMax = qs('#fDiasMax');
    const advTipoInsumo = qs('#fTipoInsumo');
    const advSoloFav = qs('#fSoloFavoritos');
    const advReset = qs('#fReset');
    const viewToggle = qs('#cuViewToggle');
    const exportBtn = qs('#cuExportCSV');
    const metricsBar = qs('#cuMetricsBar');
    const addPrimary = qs('#cuAddPrimary');
    const listCultivos = qs('#cuListCultivos');
    const listInsumos = qs('#cuListInsumos');

    // Estado en memoria
    const state = {
      favorites: new Set(JSON.parse(localStorage.getItem('catalog.favorites')||'[]')),
      view: localStorage.getItem('catalog.view')||'grid',
    };
    if(state.view==='list'){ root.setAttribute('data-view','list'); viewToggle && (viewToggle.dataset.mode='list', viewToggle.textContent='Vista Grid'); }

    function persistFav(){ localStorage.setItem('catalog.favorites', JSON.stringify(Array.from(state.favorites))); }
    function toggleFav(id){ if(state.favorites.has(id)) state.favorites.delete(id); else state.favorites.add(id); persistFav(); paintFavorites(); filterSort(); }
    function paintFavorites(){ qsa('.cu-item').forEach(it=>{ const btn=it.querySelector('[data-fav-toggle]'); if(btn){ const key = it.dataset.entity+':'+it.dataset.id; btn.classList.toggle('active', state.favorites.has(key)); } }); }

    // Badge NUEVO (últimos 7 días) si existe data-created ISO
    (function markNew(){ const now=Date.now(); qsa('.cu-item').forEach(it=>{ const c=it.dataset.created; if(!c) return; const ts= Date.parse(c); if(!isNaN(ts) && (now - ts) < 7*24*3600*1000){ it.setAttribute('data-badge','new'); } }); })();

    /* ----------- Filtering / Sorting ----------- */
    function activate(tab){
      tabButtons.forEach(b=>{
        const active = b.getAttribute('data-cu-tab')===tab;
        b.classList.toggle('active', active); b.setAttribute('aria-selected', active?'true':'false');
      });
      panels.forEach(p=>{ const active= p.getAttribute('data-cu-panel')===tab; p.classList.toggle('active',active); active? p.removeAttribute('hidden'): p.setAttribute('hidden','hidden'); });
      localStorage.setItem('catalog.tab', tab);
      filterSort();
    }

    tabButtons.forEach(b=> b.addEventListener('click', ()=> activate(b.getAttribute('data-cu-tab'))));

    function filterSort(){
      const activePanel = qs('.cu-panel.active', root); if(!activePanel) return;
      const q = (search?.value||'').trim().toLowerCase();
      const sort = sortSel?.value || 'name_asc';
      const items = qsa('.cu-item', activePanel);
      items.forEach(it=>{
        const name = (it.dataset.name||'').toLowerCase();
        let visible = !q || name.includes(q);
        // Filtros avanzados
        if(visible && advDiasMin && advDiasMin.value){ const min=parseInt(advDiasMin.value)||0; const avg=parseInt(it.dataset.avg||'0'); if(!avg || avg < min) visible=false; }
        if(visible && advDiasMax && advDiasMax.value){ const max=parseInt(advDiasMax.value)||0; const avg=parseInt(it.dataset.avg||'0'); if(avg && avg > max) visible=false; }
        if(visible && advTipoInsumo && advTipoInsumo.value && it.dataset.kind==='insumo'){ const ti=it.dataset.tipo||''; if(ti!==advTipoInsumo.value) visible=false; }
        if(visible && advSoloFav && advSoloFav.checked){ const key = it.dataset.entity+':'+it.dataset.id; if(!state.favorites.has(key)) visible=false; }
        it.style.display = visible? '' : 'none';
      });
      const visible = items.filter(i=> i.style.display!=='none');
      const sortFns = {
        name_asc:(a,b)=> (a.dataset.name||'').localeCompare(b.dataset.name||'', 'es',{sensitivity:'base'}),
        name_desc:(a,b)=> (b.dataset.name||'').localeCompare(a.dataset.name||'', 'es',{sensitivity:'base'}),
        count_desc:(a,b)=> (parseInt(b.dataset.count||'0')) - (parseInt(a.dataset.count||'0')),
        count_asc:(a,b)=> (parseInt(a.dataset.count||'0')) - (parseInt(b.dataset.count||'0')),
        dias_desc:(a,b)=> (parseInt(b.dataset.avg||'0')) - (parseInt(a.dataset.avg||'0')),
        dias_asc:(a,b)=> (parseInt(a.dataset.avg||'0')) - (parseInt(b.dataset.avg||'0'))
      };
      (sortFns[sort]||sortFns.name_asc) && visible.sort(sortFns[sort]||sortFns.name_asc).forEach(n=> n.parentElement.appendChild(n));
      computeMetrics();
    }
    search && search.addEventListener('input', debounce(filterSort,180));
    sortSel && sortSel.addEventListener('change', filterSort);
    advDiasMin && advDiasMin.addEventListener('input', debounce(filterSort,250));
    advDiasMax && advDiasMax.addEventListener('input', debounce(filterSort,250));
    advTipoInsumo && advTipoInsumo.addEventListener('change', filterSort);
    advSoloFav && advSoloFav.addEventListener('change', filterSort);
    advReset && advReset.addEventListener('click', ()=>{ advDiasMin.value=''; advDiasMax.value=''; advTipoInsumo.value=''; advSoloFav.checked=false; filterSort(); });

    viewToggle && viewToggle.addEventListener('click', ()=>{
      const next = root.getAttribute('data-view')==='list'? 'grid':'list';
      if(next==='list'){ root.setAttribute('data-view','list'); viewToggle.textContent='Vista Grid'; viewToggle.dataset.mode='list'; }
      else { root.removeAttribute('data-view'); viewToggle.textContent='Vista Lista'; viewToggle.dataset.mode='grid'; }
      localStorage.setItem('catalog.view', next==='list'? 'list':'grid');
    });

    exportBtn && exportBtn.addEventListener('click', exportHierarchyCSV);

    /* ----------- Keyboard Navigation ----------- */
    root.addEventListener('keydown', e=>{
      if(!['ArrowDown','ArrowUp'].includes(e.key)) return; const panel = qs('.cu-panel.active', root); if(!panel) return;
      const rows = qsa('.cu-item', panel).filter(r=> r.style.display!=='none'); if(!rows.length) return;
      const current = document.activeElement && rows.includes(document.activeElement)? document.activeElement : null;
      let idx = current? rows.indexOf(current): -1; e.preventDefault();
      if(e.key==='ArrowDown') idx=(idx+1)%rows.length; else idx=(idx-1+rows.length)%rows.length;
      rows[idx].focus();
    });

    /* ----------- Quick View (lazy load detail) ----------- */
    async function fetchTipos(idCategoria){
      try { const r= await fetch('/api/catalogo/tipos-cultivo?id_categoria='+idCategoria); const j= await r.json(); return j.ok? j.data: []; } catch(e){ err(e); return []; }
    }
    async function fetchInsumosCat(idCat){
      try { const r= await fetch('/api/catalogo/insumos?id_categoria_insumo='+idCat); const j= await r.json(); return j.ok? j.data: []; } catch(e){ err(e); return []; }
    }
    function buildListDetalle(arr, kind){
      if(!arr.length) return '<div class="text-[11px] opacity-60">Sin registros.</div>';
      return '<ul class="qv-list">'+ arr.map(x=>{
        if(kind==='tipo') return `<li><strong>${x.nombre_tipo||x.nombre}</strong>${x.dias_cosecha? ' · '+x.dias_cosecha+' d':''}${x.temporada_optima? ' · '+x.temporada_optima:''}</li>`;
        return `<li><strong>${x.nombre_insumo||x.nombre}</strong>${x.fabricante? ' · '+x.fabricante:''}${x.tipo? ' · '+x.tipo:''}</li>`;
      }).join('')+'</ul>';
    }
    async function openQuickView(row){
      const existing = qs('#quickViewOverlay'); existing && existing.remove();
      const overlay = document.createElement('div'); overlay.id='quickViewOverlay'; overlay.className='quick-view-overlay';
      const kind = row.dataset.kind; const name = row.dataset.name; const avg=row.dataset.avg; const count=row.dataset.count; const id=row.dataset.id;
      overlay.innerHTML = `<div class="quick-view-panel animate-in" role="dialog" aria-label="Detalle ${name}">
        <div class="qv-header">
          <div class="qv-icon">${ kind==='cultivo'? (row.querySelector('.cu-icon')?.innerHTML || '🌿') : '📦' }</div>
          <div class="qv-titles">
            <h3>${name}</h3>
            <div class="qv-sub">${kind==='cultivo'? 'Categoría de Cultivo':'Categoría de Insumo'} • ID ${id}</div>
          </div>
          <button type="button" class="qv-close" aria-label="Cerrar">×</button>
        </div>
        <div class="qv-body"><div class="qv-loading">Cargando detalle...</div></div>
        <div class="qv-footer flex flex-wrap justify-between gap-2">
          <div class="flex gap-2">
            <button class="btn btn-outline btn-sm" data-qv-edit>Editar</button>
            <button class="btn btn-danger btn-sm" data-qv-delete>Eliminar</button>
          </div>
          <div class="flex gap-2" data-qv-extra></div>
        </div>
      </div>`;
      document.body.appendChild(overlay); document.body.style.overflow='hidden';
      overlay.addEventListener('click', e=>{ if(e.target===overlay || e.target.classList.contains('qv-close')) close(); });
      function close(){ overlay.remove(); document.body.style.overflow=''; }
      overlay.querySelector('[data-qv-edit]')?.addEventListener('click', ()=>{ triggerEdit(row); close(); });
      overlay.querySelector('[data-qv-delete]')?.addEventListener('click', ()=>{ triggerDelete(row); close(); });
      // lazy fetch content
      (async()=>{
        let data=[]; if(kind==='cultivo') data = await fetchTipos(id); else data = await fetchInsumosCat(id);
        if(kind==='cultivo'){
          // Para cada tipo, intentar traer variedades (silencioso si falla)
          const tiposDet = [];
          for(const t of data){
            let variedades=[]; try { const r= await fetch('/api/catalogo/variedades-cultivo?id_tipo_cultivo='+t.id_tipo_cultivo); const j=await r.json(); if(j.ok) variedades=j.data; } catch(_e){}
            tiposDet.push({ tipo: t, variedades });
          }
          overlay.querySelector('.qv-body').innerHTML = `<div class="qv-metrics mb-3 flex flex-wrap gap-2">${count? `<span class='metric-box'>Tipos: ${count}</span>`:''}${avg? `<span class='metric-box'>Prom. días: ${avg}</span>`:''}</div>`+
            (tiposDet.length? `<div class='qv-section'>${tiposDet.map(td=>`<div class='qv-block' data-entity="tipo-cultivo" data-id="${td.tipo.id_tipo_cultivo}">
              <div class='qb-head flex items-center justify-between gap-2'>
                <strong>${td.tipo.nombre_tipo}</strong>
                <div class='flex gap-1'>
                  <button class='btn btn-xxs btn-outline' data-edit-tipo data-id="${td.tipo.id_tipo_cultivo}">Editar</button>
                  <button class='btn btn-xxs btn-outline' data-add-variedad data-id="${td.tipo.id_tipo_cultivo}">+ Variedad</button>
                </div>
              </div>
              <div class='qb-meta text-[11px] opacity-70 mb-1'>${td.tipo.dias_cosecha? td.tipo.dias_cosecha+' días · ':''}${td.tipo.temporada_optima||''}</div>
              ${(td.variedades && td.variedades.length)? `<ul class='qv-sublist'>${td.variedades.map(v=>`<li data-entity="variedad-cultivo" data-id="${v.id_variedad}"><span>${v.nombre_variedad}</span><span class='actions'><button class='btn btn-xxs' data-edit-variedad data-id='${v.id_variedad}'>Editar</button></span></li>`).join('')}</ul>`: '<div class="text-[10px] italic opacity-60">Sin variedades</div>'}
            </div>`).join('')}</div>` : '<div class="text-[11px] opacity-60">Sin tipos.</div>');
        } else {
          overlay.querySelector('.qv-body').innerHTML = `<div class="qv-metrics mb-3 flex flex-wrap gap-2">${count? `<span class='metric-box'>Insumos: ${count}</span>`:''}</div>${buildListDetalle(data,'insumo')}`;
        }
        injectQuickViewExtraActions(kind, id, overlay);
        bindQuickViewInnerActions(overlay, kind, id);
      })();
    }

    function injectQuickViewExtraActions(kind, id, overlay){
      const box = overlay.querySelector('[data-qv-extra]'); if(!box) return;
      if(kind==='cultivo'){
        box.innerHTML = `<button class='btn btn-sm btn-outline' data-add-tipo data-id='${id}'>+ Tipo</button>`;
      } else {
        box.innerHTML = `<button class='btn btn-sm btn-outline' data-add-insumo data-id='${id}'>+ Insumo</button>`;
      }
    }

    function bindQuickViewInnerActions(overlay, kind, catId){
      // Editar tipo
      overlay.querySelectorAll('[data-edit-tipo]').forEach(b=> b.addEventListener('click', e=>{ e.stopPropagation(); openModal('createTipoCultivo',{ prefill:{ id_categoria: catId }, __endpoint:'/api/catalogo/tipos-cultivo/'+b.getAttribute('data-id'), __method:'PUT' }); }));
      // Añadir variedad
      overlay.querySelectorAll('[data-add-variedad]').forEach(b=> b.addEventListener('click', e=>{ e.stopPropagation(); openModal('createVariedadCultivo',{ prefill:{ id_tipo_cultivo: b.getAttribute('data-id') } }); }));
      // Editar variedad
      overlay.querySelectorAll('[data-edit-variedad]').forEach(b=> b.addEventListener('click', async (e)=>{ e.stopPropagation(); const vid=b.getAttribute('data-id'); try { const r= await fetch('/api/catalogo/variedades-cultivo/'+vid); const j=await r.json(); if(j.ok){ const d=j.data; d.__endpoint='/api/catalogo/variedades-cultivo/'+vid; d.__method='PUT'; openModal('createVariedadCultivo', d); } else showToastSafe('error','No encontrada'); } catch(_e){ showToastSafe('error','Error'); } }));
      // Editar insumo directo desde lista (si se quisiera extender)
      overlay.querySelectorAll('.qv-list li').forEach(li=>{
        li.addEventListener('dblclick', ()=>{
          if(kind==='insumo'){ const name=li.textContent.trim(); /* necesitaríamos id, extender HTML futuro */ }
        });
      });
    }

    root.addEventListener('click', e=>{
      const actionBtn = e.target.closest('[data-edit],[data-delete],[data-add-tipo],[data-add-insumo],#cuAddPrimary');
      if(actionBtn){ log('crud:btn'); handleCrudButton(actionBtn); return; }
      const row = e.target.closest('.cu-item');
      if(row && !e.target.closest('.cu-col.actions')) { log('qv:delegate:'+row.dataset.id); openQuickView(row); }
      const favBtn = e.target.closest('[data-fav-toggle]');
      if(favBtn){ e.stopPropagation(); const it=favBtn.closest('.cu-item'); if(it){ const key=it.dataset.entity+':'+it.dataset.id; toggleFav(key); } }
    });
    qsa('.cu-item', root).forEach(li=>{
      if(li.__bound) return; li.__bound=true;
      li.addEventListener('click', ev=>{ if(ev.target.closest('.cu-col.actions')) return; log('qv:direct:'+li.dataset.id); openQuickView(li); });
      li.addEventListener('keydown', ev=>{ if(ev.key==='Enter' || ev.key===' '){ ev.preventDefault(); log('qv:keydown:'+li.dataset.id); openQuickView(li); }});
    });

    /* Hero / global create buttons fuera del root (.catalog-util) */
    qsa('[data-open-modal]').forEach(btn=>{
      if(btn.__cuBound) return; btn.__cuBound=true;
      btn.addEventListener('click', ()=>{
        const key = btn.getAttribute('data-open-modal');
        log('open-modal:'+key);
        if(!SCHEMAS[key]){ showToastSafe('error','Acción no soportada'); return; }
        openModal(key);
      });
    });

    /* ----------- CRUD ----------- */
    const modalHost = document.getElementById('modalHost') || (function(){ const m=document.createElement('div'); m.id='modalHost'; document.body.appendChild(m); return m; })();
    const SCHEMAS = {
      createCategoriaCultivo: { title:'Nueva Categoría de Cultivo', endpoint:'/api/catalogo/categorias-cultivo', method:'POST', fields:[
        {name:'nombre_categoria', label:'Nombre', required:true },
        {name:'descripcion', label:'Descripción', type:'textarea'}, {name:'icono', label:'Icono'} ]},
      createTipoCultivo: { title:'Nuevo Tipo de Cultivo', endpoint:'/api/catalogo/tipos-cultivo', method:'POST', fields:[
        {name:'id_categoria', label:'Categoría', type:'select', required:true, optionsSource:'/api/catalogo/categorias-cultivo', optionLabel:'nombre_categoria', optionValue:'id_categoria'},
        {name:'nombre_tipo', label:'Nombre', required:true }, {name:'nombre_cientifico', label:'Nombre Científico'}, {name:'descripcion', label:'Descripción', type:'textarea'}, {name:'temporada_optima', label:'Temporada'}, {name:'dias_cosecha', label:'Días Cosecha', type:'number'} ]},
      createVariedadCultivo: { title:'Nueva Variedad', endpoint:'/api/catalogo/variedades-cultivo', method:'POST', fields:[
        {name:'id_tipo_cultivo', label:'Tipo de Cultivo', type:'select', required:true, optionsSource:'/api/catalogo/tipos-cultivo', optionLabel:'nombre_tipo', optionValue:'id_tipo_cultivo'},
        {name:'nombre_variedad', label:'Nombre', required:true },
        {name:'caracteristicas', label:'Características', type:'textarea'},
        {name:'resistencia_enfermedades', label:'Resist. Enfermedades', type:'textarea'},
        {name:'rendimiento_esperado', label:'Rendimiento Esperado', type:'number'}
      ]},
      createCategoriaInsumo: { title:'Nueva Categoría de Insumo', endpoint:'/api/catalogo/categorias-insumo', method:'POST', fields:[
        {name:'nombre_categoria', label:'Nombre', required:true }, {name:'descripcion', label:'Descripción', type:'textarea'}, {name:'tipo', label:'Tipo', type:'select-static', options:[
          {value:'fertilizante', label:'Fertilizante'},{value:'plaguicida', label:'Plaguicida'},{value:'semilla', label:'Semilla'},{value:'herramienta', label:'Herramienta'},{value:'equipo', label:'Equipo'},{value:'otro', label:'Otro'} ]} ]},
      createInsumo: { title:'Nuevo Insumo', endpoint:'/api/catalogo/insumos', method:'POST', fields:[
        {name:'id_categoria_insumo', label:'Categoría Insumo', type:'select', required:true, optionsSource:'/api/catalogo/categorias-insumo', optionLabel:'nombre_categoria', optionValue:'id_categoria_insumo'},
        {name:'nombre_insumo', label:'Nombre', required:true }, {name:'descripcion', label:'Descripción', type:'textarea'}, {name:'fabricante', label:'Fabricante'}, {name:'composicion', label:'Composición', type:'textarea'}, {name:'instrucciones_uso', label:'Instrucciones de Uso', type:'textarea'}, {name:'precauciones', label:'Precauciones', type:'textarea'} ]}
    };

    function buildInput(f, value, fieldName){
      if(fieldName==='icono') return `<div class="icon-picker-wrapper"><input type="hidden" name="icono" value="${value||''}" /><button type="button" class="icon-picker-trigger" data-icon-trigger><span class="icon-preview" data-icon-preview>${ value ? (window.getIconSvg? window.getIconSvg(value): value): '🌿' }</span><span>${ value || 'Elegir icono' }</span></button></div>`;
      if(f.type==='textarea') return `<textarea name="${f.name}" class="input-modern" rows="3">${value||''}</textarea>`;
      if(f.type==='number') return `<input type="number" name="${f.name}" value="${value||''}" class="input-modern" />`;
      if(f.type==='select-static') return `<select name="${f.name}" class="input-modern">${f.options.map(o=>`<option value="${o.value}">${o.label}</option>`).join('')}</select>`;
      if(f.type==='select') return `<select name="${f.name}" class="input-modern"><option value="">Cargando...</option></select>`;
      return `<input type="text" name="${f.name}" value="${value||''}" class="input-modern" />`;
    }

    function openModal(schemaKey, data){
      const schema = SCHEMAS[schemaKey]; if(!schema) return;
      const formId = 'form_'+Date.now(); modalHost.style.display='block';
      modalHost.innerHTML = `<div class="modal-overlay"><div class="modal-box animate-in"><button class="modal-close" data-close>×</button><h3>${data? 'Editar':'Crear'} ${schema.title.replace('Nuevo ','').replace('Nueva ','')}</h3><form id="${formId}" class="modal-form flex flex-col gap-5"></form><div class="flex justify-end gap-2 pt-2"><button class="btn btn-outline btn-sm" data-close>Cancelar</button><button class="btn btn-success btn-sm" type="submit" form="${formId}">${data? 'Actualizar':'Guardar'}</button></div></div></div>`;
      document.body.style.overflow='hidden';
      const form = modalHost.querySelector('form');
      schema.fields.forEach(f=>{ const row=document.createElement('div'); row.className='form-row'; row.innerHTML = `<label>${f.label}${f.required?' *':''}</label>${buildInput(f, data? data[f.name]: (data && data.prefill && data.prefill[f.name]) || null, f.name)}`; form.appendChild(row); });
      modalHost.addEventListener('click', e=>{ if(e.target.matches('[data-close]') || e.target===modalHost.querySelector('.modal-overlay')) closeModal(); });
      form.addEventListener('submit', async e=>{
        e.preventDefault(); const payload={}; let valid=true;
        schema.fields.forEach(f=>{ const el=form.querySelector(`[name="${f.name}"]`); if(!el) return; const val=el.value.trim(); if(f.required && !val){ valid=false; el.classList.add('ring-2','ring-red-400'); setTimeout(()=>el.classList.remove('ring-2','ring-red-400'),1400);} payload[f.name]= val||null; });
        if(!valid){ showToastSafe('error','Completa requeridos'); return; }
        try {
          const endpoint = data && data.__endpoint ? data.__endpoint : schema.endpoint;
          const method = data && data.__method ? data.__method : (data? 'PUT' : schema.method);
          const res = await fetch(endpoint, { method, headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
          const j = await res.json(); if(!j.ok){ showToastSafe('error', j.message||'Error'); return; }
          showToastSafe('success', data? 'Actualizado':'Creado');
          closeModal(); refreshPartial();
        } catch(e){ showToastSafe('error','Fallo red'); }
      });
      if(schema.fields.some(f=> f.type==='select' && f.optionsSource)) loadDynamicSelects(schema, form, data);
      initIconPicker(form);
    }
  function closeModal(){ modalHost.innerHTML=''; modalHost.style.display='none'; document.body.style.overflow=''; }

    async function loadDynamicSelects(schema, form, data){
      await Promise.all(schema.fields.filter(f=> f.type==='select' && f.optionsSource).map(async f=>{
        const sel=form.querySelector(`[name="${f.name}"]`); if(!sel) return;
        try { const r= await fetch(f.optionsSource); const j= await r.json(); if(j.ok){ sel.innerHTML='<option value="">Seleccione...</option>'+j.data.map(o=>`<option value="${o[f.optionValue]}">${o[f.optionLabel]}</option>`).join(''); if(data && (data[f.name]|| (data.prefill && data.prefill[f.name]))) sel.value = data[f.name] || data.prefill[f.name]; } else sel.innerHTML='<option value="">Error</option>'; }
        catch(e){ sel.innerHTML='<option value="">Error</option>'; }
      }));
    }

    function initIconPicker(ctx){ const trigger = ctx.querySelector('[data-icon-trigger]'); if(!trigger || !window.CATALOG_ICONS) return; let panel; const wrapper=trigger.closest('.icon-picker-wrapper'); const hidden=wrapper.querySelector('input[name=icono]'); const preview=wrapper.querySelector('[data-icon-preview]'); function close(){ panel && panel.remove(); panel=null; document.removeEventListener('click', outside);} function outside(e){ if(panel && !panel.contains(e.target) && !trigger.contains(e.target)) close(); }
      trigger.addEventListener('click', ()=>{ if(panel){ close(); return; } panel=document.createElement('div'); panel.className='icon-picker-panel'; panel.innerHTML= window.CATALOG_ICONS.map(ic=>`<div class="icon-picker-item" data-icon-value="${ic.key}"><div class="ico">${ic.svg}</div><span>${ic.label}</span></div>`).join(''); wrapper.appendChild(panel); setTimeout(()=> document.addEventListener('click', outside),10); panel.querySelectorAll('[data-icon-value]').forEach(it=> it.addEventListener('click', ()=>{ const val=it.getAttribute('data-icon-value'); hidden.value=val; preview.innerHTML = window.getIconSvg? window.getIconSvg(val)||val:val; trigger.querySelector('span:last-child').textContent=val; close(); })); }); }

    async function triggerEdit(row){ const entity = row.getAttribute('data-kind')==='cultivo'? 'categoria-cultivo':'categoria-insumo'; await editEntity(entity, row.dataset.id); }
    async function triggerDelete(row){ const entity = row.getAttribute('data-kind')==='cultivo'? 'categoria-cultivo':'categoria-insumo'; await deleteEntity(entity, row.dataset.id); }

    async function editEntity(entity, id){
      const map={
        'categoria-cultivo':{ url:'/api/catalogo/categorias-cultivo/'+id, schema:'createCategoriaCultivo' },
        'categoria-insumo':{ url:'/api/catalogo/categorias-insumo/'+id, schema:'createCategoriaInsumo' },
        'tipo-cultivo':{ url:'/api/catalogo/tipos-cultivo/'+id, schema:'createTipoCultivo' },
        'variedad-cultivo':{ url:'/api/catalogo/variedades-cultivo/'+id, schema:'createVariedadCultivo' },
        'insumo':{ url:'/api/catalogo/insumos/'+id, schema:'createInsumo' }
      };
      const cfg=map[entity]; if(!cfg) return;
      try { const r= await fetch(cfg.url); const j= await r.json(); if(j.ok){ const data=j.data; data.__endpoint=cfg.url; data.__method='PUT'; openModal(cfg.schema, data); } else showToastSafe('error','No encontrado'); }
      catch(e){ showToastSafe('error','Error'); }
    }
    async function deleteEntity(entity, id){ if(!confirm('¿Eliminar registro?')) return; const map={ 'categoria-cultivo':'/api/catalogo/categorias-cultivo/'+id, 'categoria-insumo':'/api/catalogo/categorias-insumo/'+id }; try { const r= await fetch(map[entity], { method:'DELETE' }); const j= await r.json(); if(j.ok){ showToastSafe('success','Eliminado'); refreshPartial(); } else showToastSafe('error', j.message||'Error'); } catch(e){ showToastSafe('error','Fallo'); } }

    function handleCrudButton(btn){
      if(btn.id==='cuAddPrimary'){ const active = qs('.cu-tab.active')?.getAttribute('data-cu-tab'); if(active==='cultivos') openModal('createCategoriaCultivo'); else openModal('createCategoriaInsumo'); return; }
      if(btn.hasAttribute('data-add-tipo')){ openModal('createTipoCultivo',{ prefill:{ id_categoria: btn.getAttribute('data-id') } }); return; }
      if(btn.hasAttribute('data-add-insumo')){ openModal('createInsumo',{ prefill:{ id_categoria_insumo: btn.getAttribute('data-id') } }); return; }
      if(btn.hasAttribute('data-edit')){ const id=btn.getAttribute('data-id'); const entity=btn.getAttribute('data-edit'); editEntity(entity, id); return; }
      if(btn.hasAttribute('data-delete')){ const id=btn.getAttribute('data-id'); const entity=btn.getAttribute('data-delete'); deleteEntity(entity,id); return; }
    }

    async function refreshPartial(){
      try {
        const r= await fetch('/catalogo'); if(!r.ok) return; const html= await r.text();
        const doc=new DOMParser().parseFromString(html,'text/html');
        const fresh= doc.getElementById('catalogUtilRoot');
        const current = qs('#catalogUtilRoot');
        if(fresh && current){ current.replaceWith(fresh); showToastSafe('success','Catálogo actualizado'); setTimeout(()=> init(),40); }
      } catch(e){ err(e); }
    }
    window.refreshCatalogPartial = refreshPartial; // exposición para debug/manual

    /* ----------- Icon Hydration ----------- */
    function hydrateIcons(){
      if(!window.getIconSvg){ return setTimeout(hydrateIcons,120); }
      qsa('.cu-icon[data-icon-key]', root).forEach(el=>{ const k=el.getAttribute('data-icon-key'); if(k){ const svg=window.getIconSvg(k); if(svg) el.innerHTML=svg; } });
    }

    function computeMetrics(){
      if(!metricsBar) return;
      // Promedio global días (visibles cultivos)
      const cultivosVisible = qsa('.cu-panel[data-cu-panel="cultivos"] .cu-item').filter(it=> it.style.display!== 'none');
      const diasVals = cultivosVisible.map(c=> parseInt(c.dataset.avg||'')).filter(v=> !isNaN(v) && v>0);
      const promDias = diasVals.length? Math.round(diasVals.reduce((a,b)=>a+b,0)/diasVals.length): '—';
      metricsBar.querySelector('[data-mx="promDias"]').textContent = 'Prom. días: '+promDias;
      // Variedad top (placeholder - requiere endpoint variedades agregadas). Usaremos mayor avg como proxy.
      const top = diasVals.length? Math.max(...diasVals): null; metricsBar.querySelector('[data-mx="variedadTop"]').textContent = 'Variedad top: '+(top||'—');
      // Categorías con tipos (proxy: count>0)
      const catActivas = cultivosVisible.filter(c=> parseInt(c.dataset.count||'0')>0).length + '/' + cultivosVisible.length;
      metricsBar.querySelector('[data-mx="catActivas"]').textContent = 'Cat. con tipos: '+catActivas;
      // Categoría insumo top (# insumos visible)
      const insCatsVisible = qsa('.cu-panel[data-cu-panel="insumos"] .cu-item').filter(it=> it.style.display!=='none');
      let topInsumoCat='—'; let maxIn= -1; insCatsVisible.forEach(c=>{ const n=parseInt(c.dataset.count||'0'); if(n>maxIn){ maxIn=n; topInsumoCat=c.dataset.name; } });
      metricsBar.querySelector('[data-mx="insumoTop"]').textContent = 'Cat. insumo top: '+topInsumoCat;
    }

    function exportHierarchyCSV(){
      try {
        const lines = ['tipo_raiz,tipo,id,nombre,meta,count,avg_dias'];
        // Cultivos
        qsa('#cuListCultivos .cu-item').forEach(c=>{
          const base = ['cultivo','categoria-cultivo', c.dataset.id, '"'+(c.dataset.name||'')+'"','', c.dataset.count||'0', c.dataset.avg||''];
          lines.push(base.join(','));
        });
        // Insumos
        qsa('#cuListInsumos .cu-item').forEach(c=>{
          const base = ['insumo','categoria-insumo', c.dataset.id, '"'+(c.dataset.name||'')+'"', (c.dataset.tipo||''), c.dataset.count||'0',''];
          lines.push(base.join(','));
        });
        const blob = new Blob([lines.join('\n')], { type:'text/csv;charset=utf-8;' });
        const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='catalogo_hierarquia.csv'; a.click(); URL.revokeObjectURL(a.href);
        showToastSafe('success','CSV generado');
      } catch(e){ err(e); showToastSafe('error','Export falló'); }
    }

    paintFavorites();

    const last = localStorage.getItem('catalog.tab');
    const initial = tabButtons.some(b=> b.getAttribute('data-cu-tab')===last) ? last : (tabButtons[0] && tabButtons[0].getAttribute('data-cu-tab'));
    if(initial) activate(initial);
    hydrateIcons();
    filterSort();
  computeMetrics();
    log('init:complete');
    window.__CATALOGO_HEALTH__ = { t: Date.now(), items: qsa('.cu-item').length };
    window.__catalogDiag = function(){
      const data = {
        loadedCounter: window.__CATALOGO_LOADED__,
        health: window.__CATALOGO_HEALTH__,
        items: qsa('.cu-item').length,
        modalHost: !!document.getElementById('modalHost'),
        haveListeners: !!qsa('.cu-item')[0]?.__bound,
        steps: DBG.steps.slice(-15),
        errors: DBG.errors,
        schemas: Object.keys(SCHEMAS)
      };
      console.table(data);
      return data;
    };
    if(!qsa('.cu-item').length){ console.warn('[catalogo] cero items en init'); }
  }

  document.addEventListener('DOMContentLoaded', ()=>{ try { init(); } catch(e){ err(e); } });
  setTimeout(()=>{ try { if(!window.__CATALOGO_HEALTH__ || window.__CATALOGO_HEALTH__.items===0){ console.warn('[catalogo] fallback reinit'); init(); } } catch(_e){} },2000);
})();
