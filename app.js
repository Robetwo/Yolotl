/* YOLOTL — interfaz demostrativa, sin afiliaciones ni pasaportes canjeables. */
(() => {
  'use strict';
  const estados = Array.isArray(window.YOLOTL_ESTADOS) ? window.YOLOTL_ESTADOS : [];
  const byId = new Map(estados.map(e => [e.id, e]));
  const byName = new Map(estados.map(e => [norm(e.nombre), e]));
  const select = document.getElementById('estado-select');
  const mapSvg = document.getElementById('mexico-map');
  const mapBase = window.YOLOTL_MAPA_BASE || {outline:[],points:{}};
  const mapCurrent = document.getElementById('map-current');
  const selectedSummary = document.getElementById('selected-summary');
  const dishesGrid = document.getElementById('dishes-grid');
  const restaurantsGrid = document.getElementById('restaurants-grid');
  const dishesTitle = document.getElementById('dishes-title');
  const resultTag = document.getElementById('result-tag');
  const spendInput = document.getElementById('consumo');
  const passportCode = document.getElementById('passport-code');
  const discountEl = document.getElementById('discount');
  const passportResult = document.getElementById('passport-result');
  let currentId = '14';
  let currentCode = 'YOLOTL-DEMO';
  const MAP_WIDTH = 1050, MAP_HEIGHT = 600;
  const MAP_BOUNDS = {west:-118,east:-86,south:14,north:33};
  let view = {x:0,y:0,w:MAP_WIDTH,h:MAP_HEIGHT};
  let mapLoaded = false;
  let markersLayer, statesLayer;

  function norm(s) { return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,''); }
  function clean(s) { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function emojiForDish(name) {
    const t = norm(name);
    if (/pescado|camaron|marisco|langosta|almeja|ceviche|aguachile|jaiba|caracol|pejelagarto|chilpachole|mantarraya|ostion/.test(t)) return '🐟';
    if (/tamal|corunda|uchepo|pibipollo|zacahuil|ximb|mixiote/.test(t)) return '🫔';
    if (/mole|enchilada|caldillo|birria|asado|chile|cochinita|barbacoa|chilorio|cecina/.test(t)) return '🥘';
    if (/taco|torta|panucho|tlacoyo|memela|sopito|sope|cemita|bocol|burrito|tlayuda|gordita|itacate|picada/.test(t)) return '🌮';
    if (/dulce|cajeta|gloria|jericalla|ate|coyota|pan de pulque/.test(t)) return '🍮';
    return '🌽';
  }
  function selectState(id, scroll = false) {
    const estado = byId.get(id);
    if (!estado) return;
    currentId = id;
    select.value = id;
    selectedSummary.innerHTML = `<span class="big-emoji" aria-hidden="true">${estado.emoji}</span><span class="location-chip">📍 ${clean(estado.ciudad)}, México</span><h3>${clean(estado.nombre)}</h3><p>${clean(estado.descripcion)}</p>`;
    dishesTitle.textContent = `5 sabores de ${estado.nombre}`;
    resultTag.textContent = '5 platillos · selección editorial';
    dishesGrid.innerHTML = estado.platillos.map((d, i) => `<article class="dish-card"><div class="dish-card-visual"><span class="dish-index">0${i+1} / 05</span><span class="dish-emoji" aria-hidden="true">${emojiForDish(d.nombre)}</span></div><div class="dish-card-body"><h4>${clean(d.nombre)}</h4><p>${clean(d.descripcion)}</p></div></article>`).join('');
    restaurantsGrid.innerHTML = estado.restaurantes.map((r,i) => `<article class="restaurant-card"><div class="restaurant-icon" aria-hidden="true">⌂</div><div><small>ESPACIO ${i+1} / 3 · DEMOSTRACIÓN</small><h4>${clean(r.nombre)}</h4><p>${clean(r.zona)} · ${clean(r.estado)}</p></div></article>`).join('');
    mapSvg.querySelectorAll('path[data-state]').forEach(path => {
      const active=path.dataset.state===id;
      path.classList.toggle('is-active',active);
      path.setAttribute('aria-pressed',String(active));
    });
    mapSvg.querySelectorAll('.map-marker[data-state]').forEach(marker => marker.classList.toggle('is-active',marker.dataset.state === id));
    mapCurrent.textContent = `${estado.emoji} ${estado.nombre} seleccionado`;
    if(scroll) document.getElementById('dishes-title').scrollIntoView({behavior:'smooth',block:'start'});
  }
  // Usamos las mismas coordenadas para contorno local y límites descargados.
  function xy(pt) {
    const scale = Math.min((MAP_WIDTH - 72) / (MAP_BOUNDS.east-MAP_BOUNDS.west),
                           (MAP_HEIGHT - 48) / (MAP_BOUNDS.north-MAP_BOUNDS.south));
    const left = (MAP_WIDTH-scale*(MAP_BOUNDS.east-MAP_BOUNDS.west))/2;
    const top = (MAP_HEIGHT-scale*(MAP_BOUNDS.north-MAP_BOUNDS.south))/2;
    return [left+(pt[0]-MAP_BOUNDS.west)*scale, top+(MAP_BOUNDS.north-pt[1])*scale];
  }
  const ns = 'http://www.w3.org/2000/svg';
  function svgEl(tag, attributes = {}) {
    const el = document.createElementNS(ns, tag);
    for (const [key,val] of Object.entries(attributes)) el.setAttribute(key, String(val));
    return el;
  }
  function polygonPath(geometry) {
    const {type,coordinates} = geometry;
    const polygons=type === 'Polygon' ? [coordinates] : type === 'MultiPolygon' ? coordinates : [];
    const seg=[];
    for(const poly of polygons) for(const ring of poly) {
      if(!ring || ring.length<3) continue;
      const str=ring.map((pt,i)=>{
        const [x,y]=xy(pt);
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
      }).join(' ');
      seg.push(str+' Z');
    }
    return seg.join(' ');
  }
  function activateState(el,id) {
    const state = byId.get(id);
    el.setAttribute('data-state',id);
    el.setAttribute('tabindex','0');
    el.setAttribute('role','button');
    el.setAttribute('aria-label',`Seleccionar ${state.nombre}`);
    el.addEventListener('click',()=>selectState(id));
    el.addEventListener('keydown',evt=>{
      if(evt.key==='Enter'||evt.key===' '){evt.preventDefault();selectState(id);}
    });
    const title=svgEl('title');title.textContent=state.nombre;el.appendChild(title);
  }
  function initStaticMap() {
    mapSvg.replaceChildren();
    const backgroundLayer=svgEl('g',{'class':'map-background'});
    for(const polygon of mapBase.outline||[]) {
      const path=svgEl('path',{'class':'map-country','d':polygonPath({type:'Polygon',coordinates:[polygon]})});
      backgroundLayer.appendChild(path);
    }
    mapSvg.appendChild(backgroundLayer);
    statesLayer=svgEl('g',{'class':'map-state-layer'});
    mapSvg.appendChild(statesLayer);
    markersLayer=svgEl('g',{'class':'map-marker-layer'});
    for(const estado of estados){
      const pt = mapBase.points && mapBase.points[estado.id];
      if(!pt) continue;
      const [x,y]=xy(pt);
      const marker=svgEl('g',{'class':'map-marker','transform':`translate(${x.toFixed(2)} ${y.toFixed(2)})`});
      const hit=svgEl('circle',{'class':'marker-hit','r':21});
      const outer=svgEl('circle',{'class':'marker-outer','r':12});
      const core=svgEl('circle',{'class':'marker-core','r':4});
      marker.append(hit,outer,core);
      activateState(marker,estado.id);
      markersLayer.appendChild(marker);
    }
    mapSvg.appendChild(markersLayer);
    selectState(currentId);
    updateView();
  }
  function stateIdForFeature(feature) {
    const p=feature.properties||{};
    const candidates=[p.name,p.NAME,p.NOM_ENT,p.nom_ent,p.estado,p.State,p.admin,p.NAME_1];
    const aliases={
      'mexico':'15','estadodemexico':'15','stateofmexico':'15','mexicostate':'15','mexicodf':'09',
      'distritofederal':'09','mexicocity':'09','ciudaddemexico':'09','cdmx':'09',
      'michoacandeocampo':'16','michoacan':'16','coahuiladezaragoza':'05','coahuila':'05',
      'veracruzdeignaciodelallave':'30','veracruz':'30','queretarodearteaga':'22',
      'sanluispotosi':'24','nuevoleon':'19','bajacaliforniasur':'03','bajacalifornia':'02'
    };
    for(const name of candidates) {
      const key=norm(name);
      if(!key) continue;
      if(aliases[key]) return aliases[key];
      if(byName.has(key)) return byName.get(key).id;
    }
    const code=p.CVE_ENT||p.cve_ent;
    if(code && byId.has(String(code).padStart(2,'0'))) return String(code).padStart(2,'0');
    return null;
  }
  function renderGeoMap(geo) {
    if(!geo || geo.type!=='FeatureCollection' || !Array.isArray(geo.features)) throw new Error('Formato GeoJSON no compatible');
    const fragment=document.createDocumentFragment();
    const covered=new Set();
    for(const feat of geo.features) {
      const id=stateIdForFeature(feat);
      if(!id || !feat.geometry) continue;
      const d=polygonPath(feat.geometry);
      if(!d) continue;
      const path=svgEl('path',{'d':d,'fill-rule':'evenodd'});
      activateState(path,id);
      fragment.appendChild(path);covered.add(id);
    }
    if(covered.size < 27) throw new Error(`Solo se reconocieron ${covered.size} entidades`);
    statesLayer.replaceChildren(fragment);
    // Los puntos se mantienen para estados pequeños: especialmente útil al tocar con los dedos.
    mapLoaded=true;
    mapSvg.classList.add('state-borders-ready');
    selectState(currentId);
  }
  async function initMap() {
    // El contorno base y los 32 botones del mapa siempre están locales.
    // Las fronteras exactas se añaden progresivamente si se dispone del GeoJSON.
    const endpoint='https://raw.githubusercontent.com/louquillio/map-data/master/boundaries/mx/admin1.geojson';
    try {
      const controller=new AbortController();
      const t=setTimeout(()=>controller.abort(),6500);
      let response;
      try { response=await fetch(endpoint,{signal:controller.signal,cache:'force-cache'}); }
      finally {clearTimeout(t);}
      if(!response.ok) throw new Error(`HTTP ${response.status}`);
      renderGeoMap(await response.json());
    } catch(e) {
      // El mapa sigue visible y usable sin conexión a terceros.
      console.info('Modo sin fronteras estatales: puntos de 32 entidades disponibles.',e.message);
      document.getElementById('map-help').textContent='✦ Toca un punto para elegir un estado · Usa + para acercar';
    }
  }
  const minZoom=1, maxZoom=7;
  function zoomLevel() {return MAP_WIDTH/view.w;}
  function updateView(nextView=view) {
    const z=Math.max(minZoom,Math.min(maxZoom,MAP_WIDTH/nextView.w));
    const w=MAP_WIDTH/z,h=MAP_HEIGHT/z;
    view={x:Math.max(0,Math.min(MAP_WIDTH-w,nextView.x)),y:Math.max(0,Math.min(MAP_HEIGHT-h,nextView.y)),w,h};
    mapSvg.setAttribute('viewBox',`${view.x.toFixed(2)} ${view.y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)}`);
    document.getElementById('map-zoom-out').disabled=z <= 1.001;
    document.getElementById('map-zoom-in').disabled=z >= maxZoom-.001;
  }
  function clientToMap(clientX,clientY) {
    const pt=mapSvg.createSVGPoint();pt.x=clientX;pt.y=clientY;
    const matrix=mapSvg.getScreenCTM();
    return matrix ? pt.matrixTransform(matrix.inverse()) : {x:view.x+view.w/2,y:view.y+view.h/2};
  }
  function zoomAt(factor,clientX,clientY) {
    const z=Math.max(minZoom,Math.min(maxZoom,zoomLevel()*factor));
    const newW=MAP_WIDTH/z,newH=MAP_HEIGHT/z;
    const p=clientToMap(clientX,clientY);
    const fx=(p.x-view.x)/view.w,fy=(p.y-view.y)/view.h;
    updateView({x:p.x-fx*newW,y:p.y-fy*newH,w:newW,h:newH});
  }
  function zoomCenter(factor) {
    const r=mapSvg.getBoundingClientRect();
    zoomAt(factor,r.left+r.width/2,r.top+r.height/2);
  }
  function resetMap() {updateView({x:0,y:0,w:MAP_WIDTH,h:MAP_HEIGHT});}
  function moveMap(dx,dy) {
    const matrix=mapSvg.getScreenCTM();
    const scale=matrix ? Math.abs(matrix.a) : 1;
    updateView({x:view.x-dx/scale,y:view.y-dy/scale,w:view.w,h:view.h});
  }
  function initMapControls() {
    document.getElementById('map-zoom-in').addEventListener('click',()=>zoomCenter(1.5));
    document.getElementById('map-zoom-out').addEventListener('click',()=>zoomCenter(1/1.5));
    document.getElementById('map-reset').addEventListener('click',resetMap);
    mapSvg.addEventListener('wheel', e=>{
      e.preventDefault();
      zoomAt(e.deltaY<0 ? 1.16 : 1/1.16,e.clientX,e.clientY);
    },{passive:false});
    mapSvg.addEventListener('dblclick',e=>{e.preventDefault();zoomAt(1.7,e.clientX,e.clientY);});
    mapSvg.addEventListener('keydown',e=>{
      const key=e.key;
      if(key==='+'||key==='='){e.preventDefault();zoomCenter(1.4);}
      if(key==='-'||key==='_'){e.preventDefault();zoomCenter(1/1.4);}
      if(key==='0'){e.preventDefault();resetMap();}
      const dir={ArrowLeft:[42,0],ArrowRight:[-42,0],ArrowUp:[0,42],ArrowDown:[0,-42]}[key];
      if(dir){e.preventDefault();moveMap(...dir);}
    });
    const pointers=new Map();
    let lastMid=null,lastDist=null,wasDragged=false,suppressClick=false;
    mapSvg.addEventListener('pointerdown',e=>{
      if(e.button!==0 && e.pointerType==='mouse') return;
      pointers.set(e.pointerId,{x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY});
      if(pointers.size>1){
        const [a,b]=[...pointers.values()];
        lastMid={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
        lastDist=Math.hypot(a.x-b.x,a.y-b.y);wasDragged=true;
      }
      // No capturamos el puntero en un toque simple: así conserva su click en el estado.
    });
    mapSvg.addEventListener('pointermove',e=>{
      const prev=pointers.get(e.pointerId);
      if(!prev) return;
      const dx=e.clientX-prev.x,dy=e.clientY-prev.y;
      pointers.set(e.pointerId,{...prev,x:e.clientX,y:e.clientY});
      if(pointers.size>=2){
        const [a,b]=[...pointers.values()];
        const mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
        const dist=Math.max(1,Math.hypot(a.x-b.x,a.y-b.y));
        if(lastDist && lastMid){
          zoomAt(dist/lastDist,mid.x,mid.y);
          moveMap(mid.x-lastMid.x,mid.y-lastMid.y);
        }
        lastMid=mid;lastDist=dist;wasDragged=true;
      } else if(Math.hypot(e.clientX-prev.startX,e.clientY-prev.startY)>7) {
        if(!wasDragged){try{mapSvg.setPointerCapture(e.pointerId);}catch(_){}}
        wasDragged=true;moveMap(dx,dy);
      }
      if(wasDragged) mapSvg.classList.add('is-dragging');
    });
    function endPointer(e){
      if(!pointers.has(e.pointerId)) return;
      pointers.delete(e.pointerId);
      if(wasDragged){suppressClick=true;setTimeout(()=>{suppressClick=false;},80);}
      if(pointers.size<2){lastMid=null;lastDist=null;}
      if(pointers.size===0){wasDragged=false;mapSvg.classList.remove('is-dragging');}
    }
    mapSvg.addEventListener('pointerup',endPointer);
    mapSvg.addEventListener('pointercancel',endPointer);
    mapSvg.addEventListener('click',e=>{
      if(suppressClick){e.stopImmediatePropagation();e.preventDefault();suppressClick=false;}
    },true);
  }
  function savingsFormat(num) {return new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:2}).format(num);}
  function updateDiscount() {
    const total=Math.max(0,Math.min(Number(spendInput.value)||0,100000));
    const rate=total>=500?10:5;
    discountEl.textContent=`${rate}%`;
    passportResult.textContent=`Ejemplo: consumo ${savingsFormat(total)} · descuento ${rate}% · ahorro simulado ${savingsFormat(total*rate/100)}. No canjeable.`;
  }
  function makePassport() {
    const bytes=new Uint8Array(4);
    if(window.crypto && window.crypto.getRandomValues)window.crypto.getRandomValues(bytes);
    else for(let i=0;i<bytes.length;i++)bytes[i]=Math.floor(Math.random()*256);
    const code=[...bytes].map(n=>n.toString(16).padStart(2,'0')).join('').toUpperCase();
    currentCode=`YLT-DEMO-${code}`;
    passportCode.textContent=currentCode;
    updateDiscount();
  }
  async function copyPassport() {
    try {
      if(!navigator.clipboard) throw new Error('No disponible');
      await navigator.clipboard.writeText(currentCode);
      const btn=document.getElementById('copy-passport');
      const before=btn.textContent;btn.textContent='Código copiado';
      setTimeout(()=>btn.textContent=before,1800);
    } catch(e) {passportResult.textContent=`Código: ${currentCode}. Selecciónalo en la tarjeta para copiarlo. No canjeable.`;}
  }
  if(!estados.length){document.getElementById('map-area').textContent='No se pudieron cargar los datos de estados.';return;}
  for(const e of estados){const opt=document.createElement('option');opt.value=e.id;opt.textContent=e.nombre;select.appendChild(opt);}
  select.addEventListener('change',()=>selectState(select.value));
  spendInput.addEventListener('input',updateDiscount);
  document.getElementById('new-passport').addEventListener('click',makePassport);
  document.getElementById('copy-passport').addEventListener('click',copyPassport);
  document.getElementById('print-passport').addEventListener('click',()=>window.print());
  initStaticMap();initMapControls();updateDiscount();initMap();
})();
