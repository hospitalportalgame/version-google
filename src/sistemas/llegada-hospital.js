/* HOSPITAL PORTAL · Recorrido inicial independiente de la evaluación clínica. */
(()=>{
'use strict';
const KEY='hospital-portal-solo-dia1-v1',W=768,H=512;
let saved;try{saved=JSON.parse(localStorage.getItem(KEY)||'null');}catch{}
const oldProgress=!!(saved?.campaign?.completed?.length||saved?.asked?.length||saved?.exam||saved?.orders?.length||saved?.outcome||saved?.seated);
const prior=saved?.hospitalArrival;
const places=[
  'exterior',
  'recepcion',
  'pasillo',
  'consultorios',
  'consultorio',
  'gerencia'
];
const data={place:places.includes(prior?.place)?prior.place:oldProgress?'consultorio':'exterior',x:384,y:440,firstPatientPending:prior?prior.firstPatientPending===true:!oldProgress,elenaReception:saved?.elenaWrongPhase==='done' && ['esperar','endoscopia'].includes(saved?.elenaWrongChoice) && ['pending','line0','line1','complete','rescue','cinema1','cinema2'].includes(prior?.elenaReception) ? prior.elenaReception : null};
data.receptionWelcomed=prior?.receptionWelcomed===true||oldProgress;
data.managerBriefed=prior?.managerBriefed===true||oldProgress;
if(prior&&Number.isFinite(prior.x)&&Number.isFinite(prior.y)){data.x=prior.x;data.y=prior.y;}
const actor={x:data.x,y:data.y,face:'up',distance:0,walking:false,resident:true};
const elenaReceptionImage=new Image();elenaReceptionImage.src='assets/sprites/pacientes/elena/elena_emergencia_9x3.png';
const emergencyCenter={x:420,y:285};
// Final alternativo de Elena: personal de rescate y regreso al ascensor.
// La secuencia no debe arrancar al cargar una partida en el pasillo.
// Los estados antiguos incompletos se convierten en una emergencia pendiente:
// la médica deberá llegar a recepción y acercarse a Elena.
if (
  (data.elenaReception==='complete' &&
    saved?.elenaRescuePhase!=='complete') ||
  (data.place!=='recepcion' &&
    ['rescue','cinema1','cinema2'].includes(data.elenaReception))
) data.elenaReception='pending';
let rescateRecepcion=data.place==='recepcion' && data.elenaReception==='rescue' ? {
  fase:'abrir',tiempo:0,x:613,y:162,distancia:0,
  caminando:false,conElena:false,direccion:'down',tramo:0
} : null;
if(rescateRecepcion && prior?.rescateRecepcion){
  const r=prior.rescateRecepcion;
  if(['abrir','salir','cargar','regresar','entrar'].includes(r.fase) &&
     ['x','y','tiempo','distancia'].every(k=>Number.isFinite(r[k])) &&
     r.x>=0&&r.x<=W&&r.y>=0&&r.y<=H&&r.tiempo>=0&&r.distancia>=0&&
     Number.isInteger(r.tramo)&&r.tramo>=0&&r.tramo<=1&&
     ['up','down','left','right'].includes(r.direccion)){
    Object.assign(rescateRecepcion,{fase:r.fase,x:r.x,y:r.y,tiempo:r.tiempo,
      distancia:r.distancia,tramo:r.tramo,direccion:r.direccion,
      conElena:r.conElena===true,caminando:false});
  }
}

function receptionEmergencyActive(){return data.place==='recepcion' && !!data.elenaReception;}
let running=false,transition=null,target=null,route=[],afterWalk=null,clock=0,last=0,saveClock=0,modal=false;
let tutorialOfrecido=false,tutorialMovimiento=null;
const keys=new Set();
const clinicMenu=document.createElement('button');clinicMenu.id='hospital-walk-menu';clinicMenu.className='secondary-button';clinicMenu.textContent='Menú principal';clinicMenu.onclick=()=>window.HP_SHOW_HOME?.();document.getElementById('world').parentElement?.append(clinicMenu);
const layer=document.createElement('section');layer.id='hp-arrival';layer.hidden=true;layer.setAttribute('aria-label','Recorrido por el hospital');
layer.innerHTML='<canvas id="hp-arrival-world" width="768" height="512" tabindex="0" aria-label="Hospital pixel art. Flechas o WASD para caminar; E para interactuar. También puedes tocar el suelo."></canvas><div class="arrival-top"><b id="arrival-place">HOSPITAL PORTAL</b><div class="arrival-actions"><button id="arrival-sound-btn" class="secondary-button" aria-pressed="true" aria-label="Silenciar sonido del hospital" title="Pasos, puertas y música">Sonido: activo</button><button id="arrival-menu" class="secondary-button">Menú principal</button></div></div><div class="arrival-bottom"><span id="arrival-hint" role="status"></span><button id="arrival-interact" class="primary-button">E · Interactuar</button></div><div class="arrival-pad" aria-label="Controles táctiles"><div class="hp-joy-base" id="arrival-joystick" role="application" aria-label="Joystick analógico de movimiento"><div class="hp-joy-ring"></div><div class="hp-joy-ticks"><span class="t-n" data-t="n"></span><span class="t-s" data-t="s"></span><span class="t-w" data-t="w"></span><span class="t-e" data-t="e"></span></div><div class="hp-joy-knob"></div></div></div><div id="arrival-dialog" hidden role="dialog" aria-modal="true" aria-labelledby="arrival-dialog-title"><h2 id="arrival-dialog-title"></h2><p id="arrival-dialog-text"></p><div id="arrival-dialog-buttons"></div></div>';
document.body.append(layer);
const $=id=>document.getElementById(id),canvas=$('hp-arrival-world'),ctx=canvas.getContext('2d');
const transitionOverlay=document.createElement('div');
transitionOverlay.className='arrival-transition-overlay';
transitionOverlay.setAttribute('aria-hidden','true');
canvas.after(transitionOverlay);
const Economy=window.HepatoDay1Modules['economy.mjs'];
const funds=document.createElement('div');funds.id='hp-funds';funds.setAttribute('aria-label','Fondos del hospital');
funds.innerHTML='<span class="funds-coin" aria-hidden="true">◆</span><span><small>FONDOS DEL HOSPITAL</small><strong></strong><em class="funds-status"></em></span>';
document.body.append(funds);
const clinicFunds=funds.cloneNode(true);clinicFunds.id='hp-clinic-funds';document.querySelector('#hp-day1 .room-preferences')?.append(clinicFunds);
let lastFundsAmount=null,fundsTweenGroup=null,activeFundsTween=null,fundsAnimFrame=0;
function stopFundsTween(){if(activeFundsTween){activeFundsTween.stop();fundsTweenGroup?.remove(activeFundsTween);activeFundsTween=null;}if(fundsAnimFrame){cancelAnimationFrame(fundsAnimFrame);fundsAnimFrame=0;}}
function setFundsBadgesText(text){for(const badge of [funds,clinicFunds]){const el=badge.querySelector('strong');if(el&&el.textContent!==text)el.textContent=text;}}
window.HP_FUNDS={update(finance){const amount=Economy.balance(finance||Economy.initial()),value=Economy.money(amount),tier=amount<1000?'crisis':amount<1800?'strained':amount>2200?'surplus':'normal',statusLabel=amount<0?'DÉFICIT CRÍTICO':amount<1000?'CONTINGENCIA':amount<1800?'AUSTERIDAD':amount>2200?'SOLVENCIA ALTA':'OPERATIVO';document.body.dataset.economyTier=tier;for(const badge of [funds,clinicFunds]){const st=badge.querySelector('.funds-status');if(st&&st.textContent!==statusLabel)st.textContent=statusLabel;badge.dataset.economyTier=tier;badge.classList.toggle('funds-negative',amount<0);}if(activeFundsTween&&lastFundsAmount===amount)return;const reducedMotion=!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;if(lastFundsAmount===null||lastFundsAmount===amount||reducedMotion||typeof TWEEN==='undefined'||!TWEEN.Group){stopFundsTween();lastFundsAmount=amount;setFundsBadgesText(value);return;}const startVal=lastFundsAmount;lastFundsAmount=amount;stopFundsTween();if(!fundsTweenGroup)fundsTweenGroup=new TWEEN.Group();const stateObj={val:startVal};const tween=new TWEEN.Tween(stateObj,fundsTweenGroup).to({val:amount},380).easing(TWEEN.Easing.Quadratic.Out).onUpdate(()=>{setFundsBadgesText(Economy.money(Math.round(stateObj.val)));}).onComplete(()=>{fundsTweenGroup?.remove(tween);if(activeFundsTween===tween)activeFundsTween=null;if(fundsAnimFrame){cancelAnimationFrame(fundsAnimFrame);fundsAnimFrame=0;}setFundsBadgesText(value);});activeFundsTween=tween;tween.start();const tickFunds=now=>{if(activeFundsTween!==tween)return;fundsTweenGroup.update(now);if(activeFundsTween===tween&&tween.isPlaying()){fundsAnimFrame=requestAnimationFrame(tickFunds);}else{fundsAnimFrame=0;}};fundsAnimFrame=requestAnimationFrame(tickFunds);}};
window.HP_FUNDS.update();
// El epílogo de Elena lo reproduce exclusivamente el módulo clínico original.
// No se crea una segunda pantalla ni se duplican imágenes o diálogos.
const images={};for(const [key,path] of Object.entries({exterior:'assets/escenarios/hospital-exterior-panoramico.png',recepcion:'assets/escenarios/hospital-recepcion-propuesta-laterales-v2.png',ascensor:'assets/escenarios/ascensor.png',secretaria:'assets/sprites/personajes/secretaria-atlas.png',computador:'assets/sprites/mobiliario/computador-recepcion.png',tapeteSalida:'assets/sprites/mobiliario/tapete-salida.png',maquinaCafe:'assets/sprites/mobiliario/maquina-cafe.png',dispensadorTurnos:'assets/sprites/mobiliario/dispensador-turnos.png',pantallaTurnos:'assets/sprites/mobiliario/pantalla-turnos.png',alfombraHospital:'assets/sprites/mobiliario/alfombra-hospital.png',medica:'assets/sprites/personajes/medica-atlas.png',visitanteSilla:'assets/sprites/personajes/visitante-silla-atlas.png',embarazada:'assets/sprites/personajes/embarazada-atlas.png',chair:'assets/sprites/mobiliario/silla-paciente.png'})){const image=new Image();image.src=path;images[key]=image;}
const visitanteSprites=Object.fromEntries(
  ['south','north','west','east'].map(direccion=>{
    const quieta=new Image();
    quieta.src=`assets/sprites/personajes/visitante/Idle/rotations/${direccion}.png`;
    const caminata=Array.from({length:8},(_,i)=>{
      const cuadro=new Image();
      cuadro.src=`assets/sprites/personajes/visitante/Idle/animations/Walking/${direccion}/frame_${String(i).padStart(3,'0')}.png`;
      return cuadro;
    });
    return [direccion,{quieta,caminata}];
  })
);
const ancianoSprites=Object.fromEntries(
  ['south','north','west','east'].map(direccion=>{
    const quieta=new Image();
    quieta.src=`assets/sprites/personajes/anciano-pixellab/Idle/rotations/${direccion}.png`;
    const caminata=Array.from({length:8},(_,i)=>{
      const imagen=new Image();
      imagen.src=`assets/sprites/personajes/anciano-pixellab/Idle/animations/Walking/${direccion}/frame_${String(i).padStart(3,'0')}.png`;
      return imagen;
    });
    return [direccion,{quieta,caminata}];
  })
);
const medicoAncianoSprites=Object.fromEntries(
  ['south','north','east','west'].map(direccion=>{
    const quieta=new Image();
    quieta.src=`assets/sprites/personajes/medico-anciano-pixellab/Idle/rotations/${direccion}.png`;
    const caminata=Array.from({length:8},(_,i)=>{
      const imagen=new Image();
      imagen.src=`assets/sprites/personajes/medico-anciano-pixellab/Idle/animations/Walking/${direccion}/frame_${String(i).padStart(3,'0')}.png`;
      return imagen;
    });
    return [direccion,{quieta,caminata}];
  })
);
// Rescate de Elena: fotogramas aprobados en assets/sprites/rescate/.
// Este recurso se usa SOLO en recepción. El camillero del pasillo no cambia.
const rescateFrames=Object.fromEntries(
  ['east','west','north','south'].map(direccion=>[
    direccion,
    Array.from({length:8},(_,i)=>{
      const imagen=new Image();
      imagen.src=`assets/sprites/rescate/rescate-${direccion}-${String(i).padStart(3,'0')}.png`;
      return imagen;
    })
  ])
);
const RESCATE_TAMANO_RECEPCION=128;
function dibujarSpriteRescateRecepcion(r){
  const direccion={up:'north',down:'south',left:'west',right:'east'}[r.direccion]||'south';
  const lista=rescateFrames[direccion];
  const cuadro=r.caminando ? Math.floor(r.distancia/12)%lista.length : 0;
  const imagen=lista[cuadro];
  if(!imagen.complete||!imagen.naturalWidth)return;
  const tamano=RESCATE_TAMANO_RECEPCION;
  ctx.save();
  ctx.imageSmoothingEnabled=false;
  ctx.filter='none';
  ctx.drawImage(imagen,
    Math.round(r.x-tamano/2),
    Math.round(r.y-tamano*248/256),
    tamano,tamano);
  ctx.restore();
}
function snapshot(){return {...data,x:actor.x,y:actor.y,martinCafe:guardarMartinCafe(),keivin:{...keivin},rescateRecepcion:rescateRecepcion?{...rescateRecepcion}:null};}
function persist(){try{const current=JSON.parse(localStorage.getItem(KEY)||'{}');current.hospitalArrival=snapshot();localStorage.setItem(KEY,JSON.stringify(current));}catch{}}
function rect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),w,h);}
// Corrección visual por silueta, exclusiva de recepción y anclada a los pies.
function scaleReceptionActor(x,y,scale){
  if(data.place!=='recepcion')return;
  ctx.translate(x,y);ctx.scale(scale,scale);ctx.translate(-x,-y);
}
function img(key,x,y,w,h){const image=images[key];if(image.complete&&image.naturalWidth)ctx.drawImage(image,x,y,w,h);}
function panoramicBackground(key){
  const image=images[key];
  if(!image.complete||!image.naturalWidth||!image.naturalHeight)return;
  const coreWidth=image.naturalHeight*W/H;
  const wingWidth=(image.naturalWidth-coreWidth)/2;
  // Centro y alas usan exactamente el mismo corte; solo se adaptan las alas decorativas.
  if(wingWidth>0){
    layer.style.setProperty('--panorama-wing-size',`${image.naturalWidth/wingWidth*100}%`);
    ctx.drawImage(image,wingWidth,0,coreWidth,image.naturalHeight,0,0,W,H);
  }else{
    ctx.drawImage(image,0,0,image.naturalWidth,image.naturalHeight,0,0,W,H);
  }
}
const chairs=[{x:55,y:300},{x:120,y:300},{x:185,y:300},{x:55,y:405},{x:120,y:405}];
const keivinFrames=Object.fromEntries(['south','north','east','west'].map(direction=>[
  direction,Array.from({length:8},(_,i)=>{
    const image=new Image();image.src=`assets/sprites/personajes/keivin/Idle/animations/Walking/${direction}/frame_${String(i).padStart(3,'0')}.png`;return image;
  })
]));
const keivinInitial=()=>({x:384,y:620,step:0,time:0,distance:0,face:'north',walking:false,done:false});
const keivin=keivinInitial();
const keivinRoute=[
  {x:384,y:440},{x:590,y:440},{x:625,y:350,wait:3,face:'east'},
  {x:625,y:220},{x:225,y:220},{x:225,y:205},{x:97,y:198,wait:3,face:'north'},
  {x:225,y:205},{x:225,y:325},{x:250,y:440},{x:384,y:440},{x:384,y:620}
];
if(prior?.keivin){
  const p=prior.keivin;
  if(Number.isFinite(p.x)&&p.x>=36&&p.x<=732&&Number.isFinite(p.y)&&p.y>=190&&p.y<=620&&
     Number.isInteger(p.step)&&p.step>=0&&p.step<=keivinRoute.length&&
     Number.isFinite(p.distance)&&p.distance>=0&&Number.isFinite(p.time)&&p.time>=0&&
     ['south','north','east','west'].includes(p.face)){
    Object.assign(keivin,p,{walking:false,done:p.done===true});
  }
}
function updateKeivin(dt){
  keivin.walking=false;
  if(keivin.done||modal||transition||receptionEmergencyActive()||data.place!=='recepcion')return;
  if(!Object.values(keivinFrames).every(frames=>frames.every(image=>image.complete&&image.naturalWidth)))return;
  const target=keivinRoute[keivin.step];
  if(!target){keivin.done=true;persist();return;}
  const dx=target.x-keivin.x,dy=target.y-keivin.y,d=Math.hypot(dx,dy);
  if(d<.01){
    keivin.face=target.face||keivin.face;keivin.time+=dt;
    if(keivin.time>=(target.wait||0)){keivin.step++;keivin.time=0;persist();}
    return;
  }
  const step=Math.min(d,52*dt),x=keivin.x+dx/d*step,y=keivin.y+dy/d*step;
  // Entrada/salida por el borde inferior; dentro de la sala se respetan obstáculos.
  if(y<=490&&!free(x,y,true))return;
  if(Math.hypot(x-actor.x,y-actor.y)<28)return;
  if([visitante,anciano,visitanteSilla].some(npc=>npc.visible&&!npc.enCabina&&Math.abs(x-npc.x)<28&&Math.abs(y-npc.y)<19))return;
  keivin.x=x;keivin.y=y;keivin.distance+=step;keivin.walking=true;
  keivin.face=Math.abs(dx)>Math.abs(dy)?dx>0?'east':'west':dy>0?'south':'north';
}
function drawKeivin(){
  if(keivin.done||receptionEmergencyActive())return;
  const image=keivinFrames[keivin.face][keivin.walking?Math.floor(keivin.distance/7)%8:0];
  if(!image.complete||!image.naturalWidth)return;
  const size=112;
  ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='low';
  ctx.drawImage(image,Math.round(keivin.x-size/2),Math.round(keivin.y-size*248/256),size,size);
  ctx.restore();
}
function obstacles(){
  if(data.place==='gerencia'){
    return window.HP_GERENCIA ? window.HP_GERENCIA.obstaculos() : [];
  }
  if(data.place==='consultorios'){
  return window.HP_CONSULTORIOS.obstaculos();
}if(data.place==='pasillo'){
  return window.HP_PASILLO.obstaculos();
}if(data.place==='exterior')return [{x:0,y:0,w:768,h:280},{x:0,y:280,w:120,h:232},{x:648,y:280,w:120,h:232}];if(data.place==='recepcion')return [
  {x:0,y:0,w:768,h:175},
    // Base de la máquina de café.
  {x:63,y:175,w:61,h:13},
    // Base del dispensador de turnos.
  {x:680,y:445,w:55,h:32},
  // Embarazada: colisión alrededor de los pies.
...(receptionEmergencyActive()?[]:[{x:613,y:445,w:24,h:14}]),
  // Base del televisor.
{x:680,y:364,w:46,h:28},

  // Bases de las cinco sillas: los pasillos entre filas quedan libres.
  ...chairs.map(c=>({x:c.x-26,y:c.y-29,w:52,h:32}))
];return [];}
function free(x,y,ignorarVisitante=false){
  if(!ignorarVisitante&&data.place==='recepcion'&&!receptionEmergencyActive()&&!keivin.done&&Math.abs(x-keivin.x)<22&&Math.abs(y-keivin.y)<15)return false;
  if(receptionEmergencyActive() && [{x:420,y:285,rx:43,ry:14},{x:350,y:270,rx:20,ry:13},{x:430,y:235,rx:20,ry:13}].some(p=>Math.abs(x-p.x)<p.rx&&Math.abs(y-p.y)<p.ry))return false;
  if(data.place==='gerencia'){
    return window.HP_GERENCIA ? window.HP_GERENCIA.libre(x,y) : true;
  }

  if(data.place==='consultorios'){
    return window.HP_CONSULTORIOS.libre(x,y);
  }
  if(data.place==='pasillo'){
  return window.HP_PASILLO.libre(x,y);
}
  if(
  !ignorarVisitante&&!receptionEmergencyActive()&&
  data.place==='recepcion'&&
  visitanteSilla.visible&&
  Math.abs(x-visitanteSilla.x)<34&&
  Math.abs(y-visitanteSilla.y)<23
)return false;
  if(data.place==='exterior'){
    if(y<292||y>490)return false;

    // Plaza nueva: dejar fuera de recorrido el banco y los jardines izquierdos
    // y el cartel, las bicicletas y los jardines derechos. El centro sigue libre.
    const avance=(y-292)/(512-292);
    const limiteIzquierdo=188+(134-188)*avance;
    const limiteDerecho=582+(632-582)*avance;

    // Margen para que los pies permanezcan dentro del camino.
    const margen=14;
    return x>=limiteIzquierdo+margen&&
           x<=limiteDerecho-margen;
  }
// Martín ocupa espacio mientras camina o utiliza la cafetera.
if(data.place==='recepcion'&&martinCafe.visible&&!martinEstaSentado()&&
   Math.abs(x-martinCafe.x)<20&&Math.abs(y-martinCafe.y)<13)return false;
// Evitar que la médica atraviese al visitante.
if(!ignorarVisitante && data.place==='recepcion' && !receptionEmergencyActive() && anciano.visible && !anciano.enCabina){
  const distancia=(px,py)=>Math.max(Math.abs(px-anciano.x)/22,Math.abs(py-anciano.y)/14);
  const anterior=distancia(actor.x,actor.y), siguiente=distancia(x,y);
  if(siguiente<1 && (anterior>=1 || siguiente<=anterior))return false;
}
if(
  !ignorarVisitante&&!receptionEmergencyActive()&&
data.place==='recepcion'&&
visitante.visible&&
  Math.abs(x-visitante.x)<22&&
  Math.abs(y-visitante.y)<14
)return false;
  return x>=36&&x<=732&&y>=125&&y<=490&&
    !obstacles().some(o=>
      x+9>o.x&&x-9<o.x+o.w&&
      y+5>o.y&&y-5<o.y+o.h
    );
}
function walkRoute(x,y){
 const top=data.place==='exterior'
  ?292
  :data.place==='gerencia'
    ?210
    :['pasillo','consultorios'].includes(data.place)
      ?260
      :125;
 const roomBounds=data.place==='pasillo'?(window.HP_PASILLO?.limites||{x:-45,y:255,w:860,h:240}):data.place==='consultorios'?window.HP_CONSULTORIOS.limites:data.place==='gerencia'?(window.HP_GERENCIA?.limites||{x:26,y:235,w:1024,h:270}):{x:27,y:top-5,w:714,h:500-top};
 const room={bounds:roomBounds,obstacles:obstacles().map(o=>({x:o.x-3,y:o.y-1,w:o.w+6,h:o.h+2}))};
 route=window.HepatoSharedModules['engine.mjs'].findPath(actor,{x,y},room);target=route.shift()||null;
}
function interaction(){
  if(data.place==='gerencia'){
    return window.HP_GERENCIA.interaccion(actor);
  }

  if(data.place==='consultorios'){
    return window.HP_CONSULTORIOS.interaccion(actor);
  }
  if(data.place==='exterior'){
    return {
      x:384,y:296,
      label:'Entrar al hospital',
      id:'entrada'
    };
  }

    if(data.place==='pasillo'){
  return window.HP_PASILLO.interaccion(actor);
}

  const opciones=[
        {
      x:94,y:205,
      label:'Usar máquina de café',
      id:'cafe'
    },
    {
      x:384,y:455,
      label:'Salir del hospital',
      id:'salida'
    },
    {
      x:345,y:175,
      label:'Hablar con recepción',
      id:'secretaria'
    },
    {
      x:613,y:190,
      label:'Usar ascensor',
      id:'ascensor'
    }
  ];

  return opciones.reduce((cercana,opcion)=>
    Math.hypot(actor.x-opcion.x,actor.y-opcion.y)<
    Math.hypot(actor.x-cercana.x,actor.y-cercana.y)
      ?opcion
      :cercana
  );
}
function near(i){return Math.hypot(actor.x-i.x,actor.y-i.y)<65;}
function dialog(title,body,choices){$('management-report')?.remove();$('elevator-board')?.remove();$('arrival-dialog-text').hidden=false;modal=true;keys.clear();target=null;actor.walking=false;$('arrival-dialog').removeAttribute('data-variant');$('arrival-dialog-title').textContent=title;$('arrival-dialog-text').textContent=body;const buttons=$('arrival-dialog-buttons');buttons.replaceChildren();for(const [label,action] of choices){const b=document.createElement('button');b.className='primary-button';b.textContent=label;b.onclick=()=>{modal=false;$('arrival-dialog').hidden=true;action?.();if(!modal)canvas.focus();};buttons.append(b);}$('arrival-dialog').hidden=false;buttons.firstChild?.focus();}
function receptionDialog(text,choices,title='Recepcionista'){
  dialog(title,text,choices);
  $('arrival-dialog').dataset.variant='reception';
}
function mostrarPlanesHospital(volver){
  mostrarEstadoHospital('ampliaciones',volver);
}
function iconoGerencia(tipo){
  const trazos={hospital:'M6 1h4v4h4v4h-4v4H6V9H2V5h4z',consultas:'M3 1h10v14H3z M6 5h4 M6 8h4 M6 11h3',fondos:'M5 1h6l4 4v6l-4 4H5l-4-4V5z M10 5H6v3h4v3H6 M8 3v10',salas:'M2 2h5v5H2z M9 2h5v5H9z M2 9h5v5H2z M9 9h5v5H9z',terapia:'M1 8h3l2-5 4 10 2-5h3',estudios:'M3 2h10v12H3z M6 5h4 M6 8h4 M6 11h2'};
  return '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="'+(trazos[tipo]||trazos.hospital)+'"/></svg>';
}
function mostrarEstadoHospital(seccion='resumen',volver){
  let partida;try{partida=JSON.parse(localStorage.getItem(KEY)||'null');}catch{}
  const campana=partida?.campaign;
  const dia=Number.isInteger(campana?.day)&&campana.day>0?campana.day:1;
  const atendidos=Array.isArray(campana?.completed)?campana.completed.length:0;
  const finance=campana?.finance||Economy.initial();
  const origen=document.activeElement;
  dialog('Estado del hospital','',[]);
  const panel=$('arrival-dialog');panel.dataset.variant='management';
  const informe=document.createElement('div');informe.id='management-report';
  informe.innerHTML='<header class="management-header"><span class="management-brand">'+iconoGerencia('hospital')+' HOSPITAL PORTAL <span>GERENCIA · INFORME DE GESTIÓN</span></span><span class="management-day">Jornada '+dia+'</span><button class="management-close" aria-label="Cerrar informe">×</button></header><nav class="management-tabs" role="tablist" aria-label="Secciones del informe"></nav><section class="management-content" id="management-content" role="tabpanel" tabindex="0"></section><footer class="management-footer"><span>La atención de hoy sostiene el hospital de mañana.</span></footer>';
  $('arrival-dialog-text').hidden=true;
  $('arrival-dialog-text').before(informe);
  const cerrar=()=>{modal=false;panel.hidden=true;if(origen?.isConnected&&origen!==canvas&&origen.getClientRects().length)origen.focus();else canvas.focus();};
  informe.querySelector('.management-close').onclick=cerrar;
  if(volver){const b=document.createElement('button');b.textContent='← Volver al gerente';b.onclick=()=>{modal=false;panel.hidden=true;volver();};informe.querySelector('footer').append(b);}
  const contenido=informe.querySelector('.management-content');
  const pestanas=[['resumen','Resumen'],['finanzas','Finanzas'],['ampliaciones','Ampliaciones']];
  const renderizar=(id)=>{
    for(const b of informe.querySelectorAll('[role="tab"]')){const activa=b.dataset.section===id;b.setAttribute('aria-selected',String(activa));b.tabIndex=activa?0:-1;}
    contenido.setAttribute('aria-labelledby','management-tab-'+id);
    const bal=Economy.balance(finance);
    const tier=bal<1000?'crisis':bal<1800?'strained':bal>2200?'surplus':'normal';
    const statusLabel=bal<0?'DÉFICIT CRÍTICO':bal<1000?'CONTINGENCIA':bal<1800?'AUSTERIDAD':bal>2200?'SOLVENCIA ALTA':'OPERATIVO';
    const mgrMood=bal<1000?'critical':bal<1800?'concerned':bal>2200?'relieved':'neutral';
    const renderPortrait=window.HepatoSharedModules?.['renderer.mjs']?.portraitMarkup;
    const mgrSvg=renderPortrait?renderPortrait({manager:true},mgrMood):'<rect width="32" height="32" fill="#203949"/>';
    if(id==='resumen'){
      contenido.innerHTML='<div class="management-intro"><div class="management-hero-row"><svg class="management-portrait" viewBox="0 0 32 32" shape-rendering="crispEdges" aria-hidden="true">'+mgrSvg+'</svg><div><span class="management-kicker">PANORAMA GENERAL · <em class="management-status-pill" data-tier="'+tier+'">'+statusLabel+'</em></span><h3>Cuidar el presente. Construir el futuro.</h3><p>Cada consulta es una oportunidad para cuidar a nuestros pacientes y fortalecer el hospital.</p></div></div></div><div class="management-metrics"><article>'+iconoGerencia('consultas')+'<span>Consultas finalizadas hoy</span><strong>'+atendidos+'</strong><small>Jornada '+dia+'</small></article><article>'+iconoGerencia('salas')+'<span>Atención disponible</span><strong>01</strong><small>Consultorio habilitado</small></article></div><div class="management-note"><span class="management-dot"></span><div><strong>Orientación de la residente</strong><p>'+(data.managerBriefed?'Completada · Ya puedes comenzar tu jornada.':'Pendiente · Habla con el gerente antes de comenzar.')+'</p></div></div>';
    }else if(id==='finanzas'){
      const ingresos=finance.entries.reduce((s,e)=>s+e.reward,0),gastos=finance.entries.reduce((s,e)=>s+e.penalty+e.fees+(e.compensation||0),0);
      const movesHtml=finance.entries.length
        ? '<div class="management-moves-wrap">'+finance.entries.slice().reverse().map(e=>{
            const pName=window.HepatoDay1Modules['simulation-cases.mjs'].PATIENT_CATALOG[e.caseId]?.patient?.name||'Consulta';
            return '<div class="management-move-item"><b>'+pName+' · '+Economy.signed(e.net)+'</b><span>Día '+e.day+' · Ingreso: +'+Economy.money(e.reward)+(e.fees?' · Innecesarios: −'+Economy.money(e.fees):'')+(e.penalty?' · Ajuste: −'+Economy.money(e.penalty):'')+(e.compensation?' · Indemnización: −'+Economy.money(e.compensation):'')+'</span></div>';
          }).join('')+'</div>'
        : '<p class="management-no-moves">Aún no hay episodios liquidados en esta jornada.</p>';
      contenido.innerHTML='<div class="management-intro"><span class="management-kicker">RECURSOS DEL HOSPITAL · <em class="management-status-pill" data-tier="'+tier+'">'+statusLabel+'</em></span><h3>'+Economy.money(bal)+'</h3><p>Fondos disponibles · Capital inicial: '+Economy.money(finance.opening)+'. Moneda ficticia del juego.</p></div><div class="management-metrics"><article>'+iconoGerencia('fondos')+'<span>Ingresos por atención</span><strong>+'+Economy.money(ingresos)+'</strong><small>Liquidaciones aprobadas</small></article><article>'+iconoGerencia('hospital')+'<span>Gastos y ajustes</span><strong>−'+Economy.money(gastos)+'</strong><small>Innecesarios e indemnizaciones</small></article></div><div class="management-finance-list"><h4>Últimos movimientos</h4>'+movesHtml+'</div><p class="management-caption">Los estudios indicados están cubiertos por el presupuesto hospitalario. Los pedidos innecesarios conllevan recargo. La liquidación de cada episodio se realiza al resolver la consulta. '+(finance.closed?'El hospital ha cerrado sus puertas.':finance.elena?.status==='pending'?'El resultado económico de Elena está pendiente hasta finalizar su epílogo.':'El saldo negativo no bloquea la atención médica.')+'</p>';
    }else{
      contenido.innerHTML='<div class="management-intro"><span class="management-kicker">PLANES DE CRECIMIENTO</span><h3>El hospital que podemos construir.</h3><p>Las futuras ganancias permitirán ampliar la atención y acercar más recursos a nuestros pacientes.</p></div><div class="management-projects">'+[
        ['salas','Consultorios y especialidades','Más espacios para nuevas áreas de atención.'],
        ['terapia','Terapia intensiva','Cuidados especializados para pacientes críticos.'],
        ['hospital','Guardia y emergencias','Un servicio preparado para responder a las urgencias.'],
        ['estudios','Estudios propios','Más herramientas diagnósticas dentro del hospital.']
      ].map(([icono,titulo,descripcion])=>'<article>'+iconoGerencia(icono)+'<span class="management-badge">EN PLANIFICACIÓN</span><h4>'+titulo+'</h4><p>'+descripcion+'</p></article>').join('')+'</div>';
    }
    contenido.scrollTop=0;
    requestAnimationFrame(()=>{contenido.scrollTop=0;});
  };
  for(const [id,nombre] of pestanas){
    const b=document.createElement('button');b.id='management-tab-'+id;b.dataset.section=id;b.textContent=nombre;b.setAttribute('role','tab');b.setAttribute('aria-controls','management-content');
    b.onclick=()=>renderizar(id);
    b.onkeydown=e=>{const indice=pestanas.findIndex(([clave])=>clave===id);let siguiente;if(e.key==='ArrowRight')siguiente=(indice+1)%3;else if(e.key==='ArrowLeft')siguiente=(indice+2)%3;else if(e.key==='Home')siguiente=0;else if(e.key==='End')siguiente=2;else return;e.preventDefault();const clave=pestanas[siguiente][0];renderizar(clave);informe.querySelector('#management-tab-'+clave).focus();};
    informe.querySelector('nav').append(b);
  }
  informe.onkeydown=e=>{if(e.key==='Escape'){e.preventDefault();cerrar();}else if(e.key==='Tab'){const elementos=[...informe.querySelectorAll('button:not([tabindex="-1"]),[role="tabpanel"]')].filter(e=>e.getClientRects().length);const primero=elementos[0],ultimo=elementos[elementos.length-1];if(e.shiftKey&&document.activeElement===primero){e.preventDefault();ultimo.focus();}else if(!e.shiftKey&&document.activeElement===ultimo){e.preventDefault();primero.focus();}}};
  renderizar(pestanas.some(([id])=>id===seccion)?seccion:'resumen');
  informe.querySelector('[aria-selected="true"]').focus();
}
const receptionLines=[
  {speaker:'RECEPCIONISTA',text:'¡Doctora, aquí! Se desplomó hace unos instantes. No responde'},
  {speaker:'MÉDICA',text:'¡Necesitamos ayuda aquí inmediatamente!'}
];
let receptionTyping=null;
// Los espectadores, la médica y los muebles no cambian de posición durante el rescate.
function iniciarRescateElenaRecepcion(){
  // Únicamente después de pedir ayuda JUNTO a Elena en recepción.
  if(data.place!=='recepcion'||data.elenaReception!=='line1'||
     Math.hypot(actor.x-emergencyCenter.x,actor.y-emergencyCenter.y)>=75)return;
  data.elenaReception='rescue';
  receptionTyping=null;
  rescateRecepcion={fase:'abrir',tiempo:0,x:613,y:162,
    distancia:0,caminando:false,conElena:false,direccion:'down',tramo:0};
  route=[];target=null;afterWalk=null;keys.clear();actor.walking=false;
  persist();
}
// Ritmo más moderado, con trayecto fijo por un pasillo ya despejado.
const VELOCIDAD_CAMILLERO_IDA=128;
const VELOCIDAD_CAMILLERO_VUELTA=118;
function moverRescateHacia(rescate,objetivo,dt,velocidad){
  const dx=objetivo.x-rescate.x,dy=objetivo.y-rescate.y;
  const distancia=Math.hypot(dx,dy);
  if(distancia<=.5){
    rescate.x=objetivo.x;rescate.y=objetivo.y;
    rescate.caminando=false;
    return true;
  }
  rescate.direccion=Math.abs(dx)>Math.abs(dy)
    ?(dx>0?'right':'left')
    :(dy>0?'down':'up');
  const paso=Math.min(distancia,velocidad*dt);
  rescate.x+=dx/distancia*paso;
  rescate.y+=dy/distancia*paso;
  rescate.distancia+=paso;
  rescate.caminando=paso>.001;
  return paso>=distancia;
}
function actualizarRescateElenaRecepcion(dt){
  const r=rescateRecepcion;
  if(!r||data.place!=='recepcion')return;
  r.tiempo+=dt;r.caminando=false;
  if(r.fase==='abrir'){
    // Sin desplazar a la médica ni a ninguno de los espectadores.
    if(r.tiempo>=.75){r.fase='salir';r.tiempo=0;r.tramo=0;}
  }else if(r.fase==='salir'){
    // Recorrido EXACTO según el plan marcado: salir del ascensor,
    // bajar por la derecha, girar a la izquierda por la parte alta
    // de la escena y detenerse a la derecha de Elena, sin pisarla.
    const trayecto=[
  {x:613,y:270},
  {x:470,y:270}
];
    if(moverRescateHacia(r,trayecto[r.tramo],dt,VELOCIDAD_CAMILLERO_IDA)){
      if(++r.tramo===trayecto.length){
  r.fase='cargar';
  r.tiempo=0;
  r.caminando=false;
  r.conElena=true;
}
    }
  }else if(r.fase==='cargar'){
    r.direccion='left';
    // Elena no se borra hasta el momento de cargarla.
    if(r.tiempo>=1.05){
      r.conElena=true;r.fase='regresar';r.tramo=0;r.tiempo=0;
    }
  }else if(r.fase==='regresar'){
    // Regresar exactamente por el mismo trazado superior,
    // sin atravesar la posición de Elena.
    const trayecto=[
  {x:613,y:270},
  {x:613,y:190}
];
    if(moverRescateHacia(r,trayecto[r.tramo],dt,VELOCIDAD_CAMILLERO_VUELTA)){
      if(++r.tramo===trayecto.length){
        r.fase='entrar';r.tiempo=0;r.direccion='up';
      }
    }
  }else if(r.fase==='entrar'){
    // Igual que los demás NPC: caminar hacia el interior de la cabina.
    // Sin reducir de tamaño y sin desaparecer por transparencia.
    r.direccion='up';
    const progreso=Math.min(1,r.tiempo/1.3);
    const nuevoY=190+(139-190)*progreso;
    const desplazamiento=Math.abs(nuevoY-r.y);
    r.distancia+=desplazamiento;
    r.caminando=desplazamiento>.001;
    r.y=nuevoY;
    if(r.tiempo>=2.1){
  activarEpilogoOriginal();
}
  }
}
function aperturaAscensorRescate(){
  const r=rescateRecepcion;
  if(!r)return 0;
  if(r.fase==='abrir')return Math.min(1,r.tiempo/.7);
  if(r.fase==='salir'){
  if(r.tramo===0)return 1;
  return Math.max(0,Math.min(1,(r.x-470)/50));
}
  if(r.fase==='regresar')return Math.max(0,Math.min(1,(r.x-535)/70));
  if(r.fase==='entrar')return Math.max(0,Math.min(1,(2.1-r.tiempo)/.7));
  return 0;
}
function dibujarRescateEnRecepcion(){
  const r=rescateRecepcion;
  if(!r)return;
  // Solo fotogramas aprobados en assets/sprites/rescate/.
  // Elena se oculta de la CAMILLA cuando el camillero está de espaldas.
  dibujarSpriteRescateRecepcion(r);
  if(r.conElena&&r.direccion!=='up'&&elenaReceptionImage.complete&&
     elenaReceptionImage.naturalWidth===2304&&elenaReceptionImage.naturalHeight===768){
    ctx.save();
    ctx.imageSmoothingEnabled=false;
    const sx=8*256+18,sy=2*256+158,sw=219,sh=92;
    // Interpolación ligera solo para Elena, sin alterar los sprites de rescate.
    ctx.imageSmoothingEnabled=true;
    ctx.imageSmoothingQuality='low';
    if(r.direccion==='down'){
      // Solo se muestra la paciente en la vista frontal.
      ctx.translate(Math.round(r.x),Math.round(r.y-78));
      ctx.rotate(Math.PI/2);
      ctx.drawImage(elenaReceptionImage,sx,sy,sw,sh,-38,-14,76,28);
    }else{
  // Elena sobre el colchón real del sprite de 128 px.
  // Mismo recorte y escala que Elena en el suelo, apoyada en el colchón.
  const ancho=sw*103.4/256,alto=sh*103.4/256;
  const x=Math.round(r.x-30-ancho/2);
  const y=Math.round(r.y-48-alto);

  if(r.direccion==='right'){
    // El colchón queda a la derecha: reflejar también a Elena.
    ctx.translate(Math.round(2*r.x),0);
    ctx.scale(-1,1);
  }

  ctx.drawImage(
    elenaReceptionImage,
    sx,sy,sw,sh,
    x,y,ancho,alto
  );
}
    ctx.restore();
  }
}
function showReceptionEmergencyLine(index){
  const line=receptionLines[index];if(!line)return;
  data.elenaReception='line'+index;persist();
  dialog(line.speaker,'',[['Continuar →',()=>{
    if(index===0)showReceptionEmergencyLine(1);
    else iniciarRescateElenaRecepcion();
  }]]);
  receptionTyping={text:line.text,time:0};
  const button=$('arrival-dialog-buttons').querySelector('button');if(button)button.disabled=true;
}
function updateReceptionEmergency(dt){
  if(receptionTyping && modal && !$('arrival-dialog').hidden){
    receptionTyping.time+=dt;
    const n=Math.min(receptionTyping.text.length,Math.max(0,Math.floor((receptionTyping.time-.25)*36)));
    $('arrival-dialog-text').textContent='«'+receptionTyping.text.slice(0,n)+(n===receptionTyping.text.length?'»':'');
    const button=$('arrival-dialog-buttons').querySelector('button');if(button)button.disabled=n<receptionTyping.text.length;
  }
  if(data.place!=='recepcion' ||
     !['pending','line0','line1'].includes(data.elenaReception) || modal || transition)return;
  if(Math.hypot(actor.x-emergencyCenter.x,actor.y-emergencyCenter.y)<75){
    const index=data.elenaReception==='line1'?1:0;
    route=[];target=null;afterWalk=null;showReceptionEmergencyLine(index);
  }
}
window.HP_TWEEN_TRANSICIONES_ENABLED = true;

function calcularCurvaFade(progreso){
  const p = Math.max(0, Math.min(1, progreso));
  if(window.HP_TWEEN_TRANSICIONES_ENABLED !== false && typeof TWEEN !== 'undefined' && TWEEN.Easing?.Quadratic?.InOut){
    return TWEEN.Easing.Quadratic.InOut(p);
  }
  return p * p * (3 - 2 * p);
}

function calcularAlphaTransicion(t){
  if(!t) return 0;
  if(t.kind === 'fade'){
    if(t.at < 0.25){
      return calcularCurvaFade(t.at / 0.25);
    } else {
      return calcularCurvaFade(Math.max(0, 1 - (t.at - 0.25) / 0.25));
    }
  }
  if(t.kind === 'door'){
    return calcularCurvaFade(Math.max(0, Math.min(1, (t.at - 1.75) / 0.3)));
  }
  return 0;
}

function fadeTo(place,x,y,ocultarMedica=false){window.HP_AMBIENCE?.play('door');transition={kind:'fade',at:0,next:place,x,y,changed:false,ocultarMedica};keys.clear();target=null;}
function viajarEnAscensor(destino){
  const origen=data.place;
  if(destino===origen)return;

  route=[];
  target=null;
  afterWalk=null;
  keys.clear();
  actor.walking=false;

  const llegar=()=>{
    const entrada=destino==='recepcion'
      ?{x:613,y:190}
      :destino==='gerencia'
        ?window.HP_GERENCIA.entrada
        :window.HP_PASILLO.entrada;

    fadeTo(destino,entrada.x,entrada.y);
  };

  if(origen==='recepcion'){
    actor.face='up';
    transition={
      kind:'elevator',
      at:0,
      startX:actor.x,
      startY:actor.y,
      destino
    };
  }else if(origen==='gerencia'){
    window.HP_GERENCIA.iniciar(actor,llegar);
  }else if(origen==='pasillo'){
    window.HP_PASILLO.iniciar(
      'volver-recepcion',
      actor,
      llegar
    );
  }
}

function sonidoBotonAscensor(tipo='piso'){
  if(!sonidoJuego)return;
  activarAmbiente();
  if(!ambienteAudio)return;
  const audio=ambienteAudio;
  audio.resume().then(()=>{
    const t0=audio.currentTime;
    const osc=audio.createOscillator();
    const gain=audio.createGain();
    osc.type=tipo==='alarma'?'sawtooth':'sine';
    if(tipo==='alarma'){
      osc.frequency.setValueAtTime(520,t0);
      osc.frequency.setValueAtTime(440,t0+0.09);
      gain.gain.setValueAtTime(0.08,t0);
      gain.gain.exponentialRampToValueAtTime(0.001,t0+0.22);
      osc.connect(gain);gain.connect(audio.destination);
      osc.onended=()=>{osc.disconnect();gain.disconnect();};
      osc.start(t0);osc.stop(t0+0.23);
      return;
    }
    osc.frequency.setValueAtTime(740,t0);
    osc.frequency.setValueAtTime(987.77,t0+0.075);
    gain.gain.setValueAtTime(0.09,t0);
    gain.gain.exponentialRampToValueAtTime(0.001,t0+0.32);
    osc.connect(gain);gain.connect(audio.destination);
    osc.onended=()=>{osc.disconnect();gain.disconnect();};
    osc.start(t0);osc.stop(t0+0.33);
  }).catch(()=>{});
}

function menuAscensor(){
  route=[];
  target=null;
  afterWalk=null;
  keys.clear();
  actor.walking=false;

  // Orden físico de un tablero de ascensor real (de arriba hacia abajo: Piso 2 -> Piso 1 -> PB)
  const pisos=[
    {id:'gerencia',nivel:2,codigo:'2',display:'02',braille:'⠇',titulo:'PISO 2 · GERENCIA',detalle:'Dirección Médica · Finanzas',atajo:'2'},
    {id:'pasillo',nivel:1,codigo:'1',display:'01',braille:'⠁',titulo:'PISO 1 · CONSULTORIOS',detalle:'Hepatología · Consultorio 01',atajo:'1'},
    {id:'recepcion',nivel:0,codigo:'PB',display:'PB',braille:'⠏',titulo:'PLANTA BAJA · RECEPCIÓN',detalle:'Admisión · Sala de Espera · Salida',atajo:'0'}
  ];

  const pisoActual=pisos.find(p=>p.id===data.place)||pisos[2];
  dialog('Ascensor','',[]);
  const panel=$('arrival-dialog');
  panel.dataset.variant='elevator';
  $('arrival-dialog-text').hidden=true;

  const tablero=document.createElement('div');
  tablero.id='elevator-board';
  tablero.innerHTML=`
    <span class="elevator-screw tl" aria-hidden="true"></span>
    <span class="elevator-screw tr" aria-hidden="true"></span>
    <span class="elevator-screw bl" aria-hidden="true"></span>
    <span class="elevator-screw br" aria-hidden="true"></span>

    <header class="elevator-brand-plate">
      <div class="elevator-brand-top">
        <span>HOSPITAL PORTAL · ELEVADOR CENTRAL</span>
        <small>CABINA 01</small>
      </div>
      <div class="elevator-brand-sub">CARGA MÁX. 1000 KG · 13 PERSONAS · USO HOSPITALARIO</div>
    </header>

    <div class="elevator-led-display" role="status" aria-live="polite">
      <div class="elevator-led-arrows" aria-hidden="true">
        <span class="elevator-arrow-up">▲</span>
        <span class="elevator-arrow-down">▼</span>
      </div>
      <div class="elevator-led-digits">${pisoActual.display}</div>
      <div class="elevator-led-meta">
        <span class="elevator-led-status">CABINA EN PLANTA</span>
        <strong class="elevator-led-label">${pisoActual.titulo}</strong>
      </div>
    </div>

    <div class="elevator-floor-list" role="group" aria-label="Botones de pisos"></div>

    <footer class="elevator-aux-controls">
      <button type="button" class="elevator-aux-btn is-door-open" data-elevator-close>
        <span class="elevator-aux-cap" aria-hidden="true">◄│►</span>
        <span class="elevator-aux-text">
          <b>ABRIR PUERTAS</b>
          <small>Salir del panel [ESC]</small>
        </span>
      </button>
      <button type="button" class="elevator-aux-btn is-alarm" data-elevator-alarm aria-label="Botón de alarma de cabina">
        <span class="elevator-aux-cap" aria-hidden="true">🔔</span>
        <span class="elevator-aux-text">
          <b>ALARMA</b>
          <small>Emergencia</small>
        </span>
      </button>
    </footer>
  `;

  $('arrival-dialog-text').before(tablero);

  const lista=tablero.querySelector('.elevator-floor-list');
  const ledDigits=tablero.querySelector('.elevator-led-digits');
  const ledStatus=tablero.querySelector('.elevator-led-status');
  const ledLabel=tablero.querySelector('.elevator-led-label');
  const arrowUp=tablero.querySelector('.elevator-arrow-up');
  const arrowDown=tablero.querySelector('.elevator-arrow-down');

  const restaurarVisor=()=>{
    ledDigits.textContent=pisoActual.display;
    ledStatus.textContent='CABINA EN PLANTA';
    ledLabel.textContent=pisoActual.titulo;
    arrowUp.classList.remove('is-active');
    arrowDown.classList.remove('is-active');
    tablero.querySelector('.elevator-led-display').classList.remove('is-alert');
  };

  const previsualizarPiso=(p)=>{
    if(p.id===data.place){
      restaurarVisor();
      return;
    }
    tablero.querySelector('.elevator-led-display').classList.remove('is-alert');
    ledDigits.textContent=pisoActual.display;
    ledStatus.textContent=p.nivel>pisoActual.nivel?'SUBIR A PLANTA ['+p.display+']':'BAJAR A PLANTA ['+p.display+']';
    ledLabel.textContent=p.titulo;
    arrowUp.classList.toggle('is-active',p.nivel>pisoActual.nivel);
    arrowDown.classList.toggle('is-active',p.nivel<pisoActual.nivel);
  };

  const cerrarTablero=()=>{
    modal=false;
    panel.hidden=true;
    tablero.remove();
    canvas.focus();
  };

  let viajando=false;
  const activarPiso=(p,boton)=>{
    if(viajando||p.id===data.place)return;
    viajando=true;
    sonidoBotonAscensor('piso');
    boton.classList.add('is-pressed');
    ledDigits.textContent=p.display;
    ledStatus.textContent='LLAMADA REGISTRADA';
    ledLabel.textContent='EN MARCHA → '+p.titulo;
    arrowUp.classList.toggle('is-active',p.nivel>pisoActual.nivel);
    arrowDown.classList.toggle('is-active',p.nivel<pisoActual.nivel);
    setTimeout(()=>{
      modal=false;
      panel.hidden=true;
      tablero.remove();
      viajarEnAscensor(p.id);
    },190);
  };

  pisos.forEach(p=>{
    const esActual=p.id===data.place;
    const btn=document.createElement('button');
    btn.type='button';
    btn.className='elevator-floor-row'+(esActual?' is-current':'');
    btn.disabled=esActual;
    btn.dataset.floorId=p.id;
    btn.dataset.shortcut=p.atajo;
    btn.innerHTML=`
      <span class="elevator-push-bezel" aria-hidden="true">
        <span class="elevator-push-cap">
          <b class="elevator-push-code">${p.codigo}</b>
          <small class="elevator-push-braille">${p.braille}</small>
        </span>
      </span>
      <span class="elevator-dir-plate">
        <span class="elevator-dir-head">
          <b class="elevator-dir-title">${p.titulo}</b>
          <em class="elevator-dir-lamp">${esActual?'● PLANTA ACTUAL':'○ PULSAR ['+p.codigo+']'}</em>
        </span>
        <small class="elevator-dir-sub">${p.detalle}</small>
      </span>
    `;
    btn.addEventListener('pointerenter',()=>previsualizarPiso(p));
    btn.addEventListener('pointerleave',restaurarVisor);
    btn.addEventListener('focus',()=>previsualizarPiso(p));
    btn.addEventListener('blur',restaurarVisor);
    btn.onclick=()=>activarPiso(p,btn);
    lista.append(btn);
  });

  tablero.querySelector('[data-elevator-close]').onclick=cerrarTablero;
  tablero.querySelector('[data-elevator-alarm]').onclick=()=>{
    if(viajando)return;
    sonidoBotonAscensor('alarma');
    const visor=tablero.querySelector('.elevator-led-display');
    visor.classList.add('is-alert');
    ledStatus.textContent='INTERFONO DE CABINA';
    ledLabel.textContent='CABINA OPERATIVA · SIN EMERGENCIA';
  };

  tablero.onkeydown=e=>{
    if(viajando)return;
    if(e.key==='Escape'){
      e.preventDefault();
      cerrarTablero();
      return;
    }
    const k=e.key.toLowerCase();
    if(['0','1','2','b'].includes(k)){
      const atajo=k==='b'?'0':k;
      const p=pisos.find(item=>item.atajo===atajo);
      const btn=tablero.querySelector(`[data-shortcut="${atajo}"]`);
      if(p&&btn&&!btn.disabled){
        e.preventDefault();
        btn.focus();
        activarPiso(p,btn);
      }
      return;
    }
    if(e.key==='ArrowDown'||e.key==='ArrowUp'){
      const habilitados=[...tablero.querySelectorAll('button:not(:disabled)')];
      const idx=habilitados.indexOf(document.activeElement);
      if(idx!==-1){
        e.preventDefault();
        const sig=e.key==='ArrowDown'?(idx+1)%habilitados.length:(idx-1+habilitados.length)%habilitados.length;
        habilitados[sig].focus();
      }
    }
  };

  const primerBoton=lista.querySelector('button:not(:disabled)')||tablero.querySelector('[data-elevator-close]');
  primerBoton?.focus();
}
function use(){if(!running||modal||transition||(data.place==='recepcion'&&(rescateRecepcion||['cinema1','cinema2'].includes(data.elenaReception))))return;const i=interaction();if(!near(i)){$('arrival-hint').textContent='Acércate para '+i.label.toLowerCase()+'.';return;}keys.clear();target=null;
 if(i.id==='entrada'){actor.face='up';transition={kind:'door',at:0,startY:actor.y,startX:actor.x};}
  else if(i.id==='salida'){
   fadeTo('exterior',384,330);
 }
 else if(i.id==='cafe'){
  if(martinCafe.visible&&martinCafe.phase==='preparando'){
    dialog('Máquina de café','Martín está preparando su café. En unos segundos queda libre.',[['Esperar']]);
    return;
  }
  route=[];
  afterWalk=null;
  actor.face='up';

  dialog(
    'Máquina de café',
    'Un café antes de continuar la jornada.',
    [
      ['Preparar café',()=>{
        sonidoCafe();
        vaporCafe.preparandoJugador = 3.5;
        dialog(
          'Máquina de café',
          'La máquina prepara su café. Un pequeño descanso antes de seguir.',
          [['Tomar café y continuar']]
        );
      }],
      ['Ahora no']
    ]
  );
}
 else if(i.id==='secretaria'){
  route=[];
  afterWalk=null;
  actor.face='up';
  const savedCampaign=readCachedSave()?.campaign;
  const currentDay=savedCampaign?.day||1;
  const day1Done=currentDay===1&&Boolean(savedCampaign?.demoDay1Complete||savedCampaign?.finished);

  if(!data.receptionWelcomed&&!data.elenaReception){
    receptionDialog(
      'Buenos días, doctora. Bienvenida al Hospital Portal. El gerente la está esperando en gerencia para darle la bienvenida y explicarle cómo será su jornada como médica residente. Tome el ascensor de la derecha y seleccione el piso 2 · Gerencia.',
      [['Gracias, iré a gerencia',()=>{data.receptionWelcomed=true;persist();}]]
    );
    return;
  }
  receptionDialog(
    currentDay>=2
      ?'Buenos días, doctora. Ya están disponibles en el sistema los resultados de Martín y Sofía para sus controles de hoy, y agregamos a la agenda a Elena, que aguarda su primera consulta. ¿En qué puedo ayudarla?'
      :(data.managerBriefed?'Buenos días, doctora. ¿En qué puedo ayudarla?':'El gerente la espera en el segundo piso. Él le explicará cómo comenzar su jornada.'),
    [
      ['¿Cómo está la sala?',()=>{
        receptionDialog(
          currentDay>=2
            ?'Martín y Sofía regresaron para revisar sus estudios, y Elena ya está en la sala de espera. Puede subir directamente al consultorio 01 cuando guste.'
            :day1Done
              ?'Martín y Sofía ya completaron sus consultas de hoy y dejaron agendados sus controles para mañana. La sala de espera está despejada, doctora.'
              :data.firstPatientPending
                ?'Su primer paciente ya está anunciado y la espera en el primer piso para cuando suba al consultorio.'
                :'Su siguiente paciente de turno ya la aguarda en la sala de espera del primer piso, doctora.',
          [['Continuar']]
        );
      }],
      ['¿Dónde está mi consultorio?',()=>{
        receptionDialog(
          data.managerBriefed?'Su consultorio es el 01, en el primer piso. Puede subir por el ascensor de la derecha.':'Antes de comenzar, pase por gerencia, en el piso 2. El gerente le dará las indicaciones para su primera jornada.',
          [['Gracias']]
        );
      }],
      ['Hasta luego']
    ]
  );
}
 else if(i.id==='estado-hospital'){
  route=[];afterWalk=null;target=null;actor.face='up';
  mostrarEstadoHospital();
 }
 else if(i.id==='hablar-gerente'){
  route=[];afterWalk=null;target=null;
  window.HP_GERENCIA.mirarMedica(actor);
  const dx=i.x-actor.x,dy=i.y-actor.y;
  actor.face=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');
  const cerrarOrientacion=()=>receptionDialog(
      'Detrás de cada paciente hay una historia. Tómese el tiempo para comprenderla y, si surge una urgencia, pida ayuda. Cuando esté lista, tome el ascensor al primer piso y diríjase a los consultorios.',
      [['Comenzar mi jornada',()=>{data.managerBriefed=true;data.receptionWelcomed=true;persist();}]],'Gerente'
  );
  const explicarCrecimiento=()=>receptionDialog(
    'Si logramos recuperarnos, podremos reinvertir las ganancias en el hospital: abrir más consultorios y nuevas especialidades, una unidad de terapia intensiva y un servicio de guardia y emergencias. También queremos incorporar más estudios aquí mismo, para tenerlos a mano cuando los pacientes los necesiten. Cada buena atención nos acercará a ese futuro.',
    [['Continuar →',cerrarOrientacion]],'Gerente'
  );
  const explicarEconomia=()=>receptionDialog(
    'También debo hablarle con franqueza: el hospital atraviesa una crisis económica. Nuestros recursos son limitados. Solicite los estudios que cada paciente necesite y evite los pedidos que no aporten a su atención. Ahorrar nunca debe significar dejar de hacer algo necesario.',
    [['Continuar →',()=>receptionDialog(
      'Cada consulta bien resuelta ayudará a generar ingresos para sostener el hospital. Las decisiones equivocadas y los pedidos innecesarios supondrán pérdidas. Sus decisiones serán importantes para mantener nuestras puertas abiertas. Contamos con usted y con todo el equipo.',
      [['Continuar →',explicarCrecimiento]],'Gerente'
    )]],'Gerente'
  );
  const explicarConsulta=()=>receptionDialog(
    'Hoy atenderá en el consultorio 01 del primer piso. Escuche a cada paciente, explore sus síntomas y solicite los estudios que considere necesarios antes de decidir una conducta.',
    [['Continuar →',explicarEconomia]],'Gerente'
  );
  if(data.managerBriefed){
    receptionDialog('¿En qué puedo ayudarla, doctora? Podemos revisar la situación del hospital o conversar sobre nuestros próximos pasos.',[
      ['Estado del hospital',mostrarEstadoHospital],
      ['Situación económica',()=>receptionDialog('El hospital atraviesa una crisis económica. Necesitamos utilizar nuestros recursos con criterio, evitando pedidos innecesarios sin dejar de hacer lo que cada paciente necesita.',[['Volver',()=>use()]],'Gerente')],
      ['Planes de crecimiento',()=>mostrarPlanesHospital(()=>use())],
      ['Repasar indicaciones',explicarConsulta],['Hasta luego']
    ],'Gerente');
  }else{
    receptionDialog('Bienvenida al Hospital Portal, doctora. Me alegra que se incorpore como médica residente. Trabajará junto a nuestro equipo y conocerá pacientes con necesidades e historias muy distintas.',[['Continuar →',explicarConsulta]],'Gerente');
  }
 }
 else if(i.id==='ascensor'){
  if(
  visitanteSilla.visible&&
  visitanteSilla.etapa>=recorridoSilla.length&&
  !visitanteSilla.ascensorTerminado
)return;
  if(
  anciano.visible&&
  anciano.etapa>=recorridoAnciano.length&&
    !anciano.ascensorTerminado
)return;

  menuAscensor();
}
  else if(i.id==='ascensor-gerencia'){
  if(window.HP_GERENCIA.ocupado)return;

  menuAscensor();
}
else if(i.id==='volver-recepcion'){
  if(window.HP_PASILLO.ocupado)return;

  menuAscensor();
}
else if(i.id==='entrar-hepatologia'){
  if(window.HP_CONSULTORIOS.ocupado)return;

  route=[];
  afterWalk=null;
  target=null;
  keys.clear();

  window.HP_CONSULTORIOS.iniciarEntrada(actor,()=>{
    enterClinic();
  });
}
else if(i.id==='volver-pasillo'){
  if(window.HP_CONSULTORIOS.ocupado)return;
  route=[];afterWalk=null;target=null;keys.clear();
  window.HP_CONSULTORIOS.iniciarSalida(actor,()=>{
    const entrada=window.HP_PASILLO.entradaConsultorios;
    fadeTo('pasillo',entrada.x,entrada.y);
  });
}
 else if(i.id==='paso-consultorios'){
  if(window.HP_PASILLO.ocupado)return;

  route=[];
  afterWalk=null;
  target=null;
  keys.clear();

  window.HP_PASILLO.iniciar(i.id,actor,()=>{
  const entrada=window.HP_CONSULTORIOS.entrada;
  fadeTo('consultorios',entrada.x,entrada.y);
});
}
}
window.HP_VOLVER_AL_PASILLO=function(){
  keys.clear();
  route=[];
  target=null;
  afterWalk=null;
  transition=null;
  modal=false;

  $('arrival-dialog').hidden=true;

  data.place='consultorios';

  const entradaClinica=window.HP_CONSULTORIOS.entradaClinica;
  actor.x=entradaClinica.x;
  actor.y=entradaClinica.y;
  actor.face='down';
  actor.walking=false;

  data.x=actor.x;
  data.y=actor.y;

  persist();
  start();

  transition={
    kind:'fade',
    at:.25,
    changed:true
  };
};
function enterClinic(){
  window.HP_AMBIENCE?.play('door');
  data.place='consultorio';
  persist();
  window.HP_SINGLE_VIEW='game';
  $('hp-day1').hidden=false;
  window.HepatoDay1Modules['app.mjs'].enterFromHospital();

  if(window.HP_TWEEN_TRANSICIONES_ENABLED===false){
    running=false;
    layer.hidden=true;
    document.body.classList.remove('hospital-arrival');
    return;
  }

  layer.style.pointerEvents='none';
  layer.style.transition='opacity 0.25s ease-out';
  layer.style.opacity='0';
  setTimeout(()=>{
    running=false;
    layer.hidden=true;
    layer.style.pointerEvents='';
    layer.style.transition='';
    layer.style.opacity='';
    document.body.classList.remove('hospital-arrival');
  },260);
}

// Martín: una salida breve a la cafetera mientras espera su primera consulta.
const martinCaminaImagen = new Image();
martinCaminaImagen.src = 'assets/sprites/pacientes/martin/martin_spritesheet.png';
const MARTIN_CAFE_ID = 'masld-intro-v1-reasoning-v2';
const MARTIN_CAFE_IDA = [{x:55,y:325},{x:225,y:325},{x:225,y:205},{x:97,y:205},{x:97,y:198}];
const MARTIN_CAFE_VUELTA=[{x:97,y:205},{x:225,y:205},{x:225,y:325},{x:55,y:325},{x:55,y:300}];
function estadoInicialMartinCafe(){
  return {phase:'sentado',x:55,y:300,face:'down',distance:0,step:0,timer:0,visible:false,walking:false};
}

// Fase 1B: Estado de animación, transición walk-to-idle y reposo de Martín
const martinAnimState = {
  walkingPrev: false,
  ultimoCuadroCaminata: 0,
  transicionParada: 0,
  tiempoReposo: 0,
  cuadroTransicion: 0
};
if (typeof window !== 'undefined') {
  window.HP_MARTIN_ANIM = martinAnimState;
}
const martinCafe = estadoInicialMartinCafe();
if (typeof window !== 'undefined') { window.HP_MARTIN_CAFE = martinCafe; }
const martinPrevio = prior?.martinCafe;
if(martinPrevio&&['sentado','levantando','ida','preparando','regreso','terminado'].includes(martinPrevio.phase)&&
   Number.isFinite(martinPrevio.x)&&martinPrevio.x>=36&&martinPrevio.x<=235&&
   Number.isFinite(martinPrevio.y)&&martinPrevio.y>=190&&martinPrevio.y<=335&&
   Number.isInteger(martinPrevio.step)&&martinPrevio.step>=0&&martinPrevio.step<=4){
  Object.assign(martinCafe,{
    phase:martinPrevio.phase,x:martinPrevio.x,y:martinPrevio.y,
    face:['up','down','left','right'].includes(martinPrevio.face)?martinPrevio.face:'right',
    distance:Number.isFinite(martinPrevio.distance)?Math.max(0,Math.min(1000000,martinPrevio.distance)):0,
    step:martinPrevio.step,
    timer:Number.isFinite(martinPrevio.timer)?Math.max(0,Math.min(30,martinPrevio.timer)):0
  });
  if(martinPrevio.layoutVersion!==3){
    Object.assign(martinCafe,estadoInicialMartinCafe(),{
      phase:martinPrevio.phase==='terminado'?'terminado':'sentado'
    });
  }
}
let martinRevision = 0;
let martinSonido = false;
function guardarMartinCafe(){
  const m=martinCafe;
  return {layoutVersion:3,phase:m.phase,x:m.x,y:m.y,face:m.face,distance:m.distance,step:m.step,timer:m.timer};
}
function martinEstaSentado(){return ['sentado','terminado'].includes(martinCafe.phase);}
let _cachedSaveRaw=undefined,_cachedSaveParsed=null,_cachedSaveAt=-Infinity;
function readCachedSave(force=false){
  const now=performance.now();
  if(!force&&now-_cachedSaveAt<250)return _cachedSaveParsed;
  _cachedSaveAt=now;
  let raw=null;
  try{raw=localStorage.getItem(KEY);}catch{raw=null;}
  if(raw!==_cachedSaveRaw){
    _cachedSaveRaw=raw;
    try{_cachedSaveParsed=JSON.parse(raw||'null');}catch{_cachedSaveParsed=null;}
  }
  return _cachedSaveParsed;
}
function revisarEsperaMartin(){
  const partida=readCachedSave();
  const day=partida?.campaign?.day||1;
  const yaAtendido=partida?.campaign?.completed?.some(r=>r.caseId===MARTIN_CAFE_ID)||
    partida?.campaign?.archives?.some(a=>a.completed?.some(r=>r.caseId===MARTIN_CAFE_ID));
  martinCafe.visible=day===1&&data.firstPatientPending&&!yaAtendido;
  martinSonido=partida?.settings?.sound!==false;
}
function libreParaMartin(x,y,excluirSuSilla=false){
  if(x<36||x>732||y<190||y>490)return false;
  // El bloque reservado a la médica se sustituye por las bases de cada silla.
  const own=chairs[0];
  const obstaculos=obstacles().filter(o=>!(excluirSuSilla&&o.x===own.x-26&&o.y===own.y-29));
  if(obstaculos.some(o=>x+9>o.x&&x-9<o.x+o.w&&y+5>o.y&&y-5<o.y+o.h))return false;
  if(Math.abs(x-actor.x)<20&&Math.abs(y-actor.y)<13)return false;
  for(const npc of [visitante,anciano,visitanteSilla]){
    if(npc.visible&&!npc.enCabina&&Math.abs(x-npc.x)<24&&Math.abs(y-npc.y)<16)return false;
  }
  return true;
}
function cambiarEtapaMartin(phase){
  martinCafe.phase=phase;
  martinCafe.timer=0;
  martinCafe.step=0;
  martinCafe.walking=false;
  persist();
}
function actualizarMartinCafe(dt){
  const m=martinCafe;
  m.walking=false;
  if(data.place!=='recepcion'||modal||transition)return;
  martinRevision-=dt;
  if(martinRevision<=0){revisarEsperaMartin();martinRevision=.25;}
  if(!m.visible)return;

  if(m.phase==='sentado'){
    // No cambia de dibujo hasta que sus dos recursos estén disponibles.
    if(!martinCaminaImagen.complete||martinCaminaImagen.naturalWidth!==2304||
       martinCaminaImagen.naturalHeight!==1024||!martinRecepcionImagen.complete||
       !martinRecepcionImagen.naturalWidth)return;
    m.timer+=dt;
    if(m.timer>=6.5){
      // Deja pasar a quien esté junto a la silla antes de levantarse.
      if(!libreParaMartin(m.x,m.y,true)||!libreParaMartin(55,325,true))return;
      m.x=55;
m.y=325;
m.face='down';
cambiarEtapaMartin('levantando');
    }
    return;
  }
  if(m.phase==='levantando'){
    m.timer+=dt;
    martinAnimState.walkingPrev = false;
    martinAnimState.tiempoReposo += dt;
    if(m.timer>=.4)cambiarEtapaMartin('ida');
    return;
  }
  if(m.phase==='preparando'){
    m.face='up';
    m.timer+=dt;
    martinAnimState.walkingPrev = false;
    if (martinAnimState.transicionParada > 0) {
      martinAnimState.transicionParada -= dt;
      if (martinAnimState.transicionParada <= 0) martinAnimState.transicionParada = 0;
    } else {
      martinAnimState.tiempoReposo += dt;
    }
    if(m.timer>=2.6)cambiarEtapaMartin('regreso');
    return;
  }
  if(m.phase==='terminado')return;
  // Al regresar, cambiar a la pose sentada desde delante del asiento,
  // sin hacer caminar el sprite de pie a través de la silla.
  if(m.phase==='regreso'&&m.step===MARTIN_CAFE_VUELTA.length-1){
    m.x=chairs[0].x;m.y=chairs[0].y;m.face='down';
    cambiarEtapaMartin('terminado');return;
  }

  const ruta=m.phase==='ida'?MARTIN_CAFE_IDA:MARTIN_CAFE_VUELTA;
  const destino=ruta[m.step];
  const dx=destino.x-m.x,dy=destino.y-m.y;
  const distancia=Math.hypot(dx,dy);
  if(distancia<.001){
    m.x=destino.x;m.y=destino.y;
    if(m.step<ruta.length-1){m.step++;persist();}
    else if(m.phase==='ida'){
      m.face='up';cambiarEtapaMartin('preparando');
      if(martinSonido)sonidoCafe();
    }else{
      m.face='right';cambiarEtapaMartin('terminado');
    }
    return;
  }
  const paso=Math.min(distancia,42*Math.min(dt,.05));
  const segmentos=Math.max(1,Math.ceil(paso/1.5));
  const ignorarSuSilla=(m.phase==='ida'&&m.step===0)||(m.phase==='regreso'&&m.step===MARTIN_CAFE_VUELTA.length-1);
  let recorrido=0;
  for(let i=0;i<segmentos;i++){
    const avance=paso/segmentos;
    const nx=m.x+dx/distancia*avance,ny=m.y+dy/distancia*avance;
    if(!libreParaMartin(nx,ny,ignorarSuSilla))break;
    m.x=nx;m.y=ny;recorrido+=avance;
  }
  m.distance+=recorrido;
  m.walking=recorrido>.001;
  if(m.walking)m.face=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');

  // Fase 1B: Actualización del estado de animación de Martín
  if (m.walking) {
    martinAnimState.walkingPrev = true;
    martinAnimState.ultimoCuadroCaminata = 1 + Math.floor(m.distance / 6) % 8;
    martinAnimState.transicionParada = 0;
    martinAnimState.tiempoReposo = 0;
  } else {
    if (martinAnimState.walkingPrev) {
      martinAnimState.walkingPrev = false;
      martinAnimState.transicionParada = 0.075; // 75 ms duración natural
      const u = martinAnimState.ultimoCuadroCaminata;
      martinAnimState.cuadroTransicion = (u >= 1 && u <= 4) ? 5 : 1;
    }
    if (martinAnimState.transicionParada > 0) {
      martinAnimState.transicionParada -= dt;
      if (martinAnimState.transicionParada <= 0) {
        martinAnimState.transicionParada = 0;
      }
    } else {
      martinAnimState.tiempoReposo += dt;
    }
  }
}
function dibujarMartinCafe(){
  const m=martinCafe;
  if(!m.visible||martinEstaSentado()||!martinCaminaImagen.complete||!martinCaminaImagen.naturalWidth)return;
  const fila={down:0,up:1,left:2,right:3}[m.face];

  // Fase 1B: Determinación de columna con transición suave walk-to-idle
  let columna = 0;
  if (m.walking) {
    columna = 1 + Math.floor(m.distance / 6) % 8;
  } else if (martinAnimState.transicionParada > 0) {
    columna = martinAnimState.transicionParada > 0.035 ? martinAnimState.cuadroTransicion : 0;
  } else {
    columna = 0;
  }

  const tamano = 110, factor = tamano / 256;
  const destX = Math.round(m.x - 128 * factor);
  const destY = Math.round(m.y - 248 * factor);

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.filter = 'none';

  // Fase 1B: Micro-respiración sutil en reposo prolongado (>= 1.0 s) o preparando café
  // Pies / zapatillas 100% inmóviles en el suelo usando partición anatómica en cyCorte = 166
  const enPausa = !m.walking && martinAnimState.transicionParada <= 0;
  const enReposoLargo = (martinAnimState.tiempoReposo >= 1.0 || m.phase === 'preparando');

  if (enPausa && enReposoLargo && columna === 0) {
    const ciclo = 3.6; // Ciclo natural calmado de 3.6 s
    const fase = (martinAnimState.tiempoReposo % ciclo) / ciclo;
    // Elevación sutil de 1 px durante inhalación
    const respiracionOffset = Math.sin(fase * Math.PI * 2) > 0.3 ? 1 : 0;

    // Corte anatómico: sudadera / cintura en cy = 166 (base pies cy = 247)
    const cyCorte = 166;
    const corteDestY = Math.round(cyCorte * factor);

    // Parte inferior (pantalones y zapatillas): completamente fija al suelo
    ctx.drawImage(
      martinCaminaImagen,
      columna * 256, fila * 256 + cyCorte, 256, 256 - cyCorte,
      destX, destY + corteDestY, tamano, tamano - corteDestY
    );

    // Parte superior (torso, sudadera, cabeza): micro-elevación de 1 px
    ctx.drawImage(
      martinCaminaImagen,
      columna * 256, fila * 256, 256, cyCorte,
      destX, destY - respiracionOffset, tamano, corteDestY
    );
  } else {
    ctx.drawImage(martinCaminaImagen, columna * 256, fila * 256, 256, 256,
      destX, destY, tamano, tamano);
  }

  if(m.phase==='preparando'){
    // Indica el uso de la máquina sin inventar una animación de brazos.
    const bx=Math.round(m.x-34),by=Math.round(m.y-116);
    ctx.fillStyle='#f0e5cb';ctx.fillRect(bx,by,68,17);
    ctx.fillStyle='#344b58';ctx.font='bold 9px monospace';ctx.textAlign='center';
    ctx.fillText('CAFÉ...',Math.round(m.x),by+10);
    ctx.fillStyle='#8c613c';ctx.fillRect(bx+4,by+13,Math.round(60*Math.min(1,m.timer/2.6)),2);
  }
  ctx.restore();
}
// Sofía sentada en recepción.
const sofiaRecepcionImagen = new Image();
sofiaRecepcionImagen.src =
  'assets/sprites/pacientes/sofia/sofia_sentada_frente.png';
const martinRecepcionImagen = new Image();
martinRecepcionImagen.src =
  'assets/sprites/pacientes/martin/martin_sentado_frente.png';

const elenaRecepcionImagen = new Image();
elenaRecepcionImagen.src =
  'assets/sprites/pacientes/elena/elena_sentada_frente.png';

function waitingPatient(x,y,index){
  const campaign=readCachedSave()?.campaign;
  const day=campaign?.day||1,current=campaign?.index||0;
  if(day>2||index>2)return;
  if(index===0&&(!data.firstPatientPending||(day===1&&(!martinCafe.visible||!martinEstaSentado()))))return;
  if(index===1&&current>=1)return;
  if(index===2&&(day!==2||current>=2||campaign?.finished))return;
  const image=[martinRecepcionImagen,sofiaRecepcionImagen,elenaRecepcionImagen][index];
  if(!image.complete||!image.naturalWidth)return;
  // Recortes propios de los recursos frontales, sin modificar sus PNG.
  const crop=[[398,160,460,960],[398,120,455,1035],[380,100,485,1080]][index];
  const [sx,sy,sw,sh]=crop.map(v=>v*image.naturalWidth/1254);
  // Sofía necesita una escala algo mayor para equilibrar su silueta con Martín.
  // Alinear la cadera con el cojín; los recortes tienen posturas distintas.
  const height=index===1?104:98,width=height*sw/sh;
  const hip=[.76,.70,.78][index];
  const top=y-22-height*hip;
  ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='low';
  ctx.drawImage(image,sx,sy,sw,sh,Math.round(x-width/2),Math.round(top),width,height);
  ctx.restore();
}
const musicaRecepcion=new Audio('assets/audio/recepcion.mp3'); 
musicaRecepcion.loop=true;
musicaRecepcion.volume=0;
musicaRecepcion.preload='none';

// Un controlador compartido mantiene las pistas y su posición entre escenas.
const musicaTension=new Audio('assets/audio/Triage_Protocol.mp3');
musicaTension.loop=true; musicaTension.preload='none'; musicaTension.volume=0;
const musicaEsperanza=new Audio('assets/audio/The_First_Held_Hand.mp3');
const musicaDuelo=new Audio('assets/audio/Small_Hands_in_the_Hallway.mp3');
musicaDuelo.preload='none';musicaDuelo.volume=0;
let posicionDuelo=0;
musicaDuelo.addEventListener('loadedmetadata',()=>{
  musicaDuelo.currentTime=Number.isFinite(musicaDuelo.duration)&&musicaDuelo.duration>0?Math.min(posicionDuelo,musicaDuelo.duration):0;
});
musicaEsperanza.preload='none'; musicaEsperanza.volume=0;
// Bucle con un único reproductor: el controlador desvanece ambos extremos.
musicaEsperanza.addEventListener('ended',()=>{musicaEsperanza.currentTime=0;});
const ambienteExterior=new Audio('assets/audio/exterior.mp3');
ambienteExterior.loop=true; ambienteExterior.volume=0; ambienteExterior.preload='none';
let modoJuego='calm', sonidoJuego=saved?.settings?.sound!==false, juegoPausado=false;
const bloqueados=new WeakSet(), pendientes=new WeakSet();
function reproducir(pista){
  if (!pista.paused || bloqueados.has(pista) || pendientes.has(pista)) return;
  try {
    const resultado=pista.play();
    if(resultado?.then){
      pendientes.add(pista);
      resultado.catch(()=>bloqueados.add(pista)).finally(()=>pendientes.delete(pista));
    }
  } catch { bloqueados.add(pista); }
}
function desbloquearMusica(){
  for(const pista of [musicaRecepcion,musicaTension,musicaEsperanza,musicaDuelo,ambienteExterior]) bloqueados.delete(pista);
  actualizarMusica(0);
}
window.HP_MUSIC={
  beginSorrow(time=0){
    posicionDuelo=Math.max(0,time);
    if(musicaDuelo.readyState)musicaDuelo.currentTime=Math.min(posicionDuelo,musicaDuelo.duration);
    // Una sola instancia; la pista anterior termina antes de comenzar el duelo.
    for(const pista of [musicaRecepcion,musicaTension,musicaEsperanza,ambienteExterior]){pista.pause();pista.volume=0;}
  },
  sorrowStatus(){return {time:musicaDuelo.currentTime,duration:musicaDuelo.duration,playing:!musicaDuelo.paused,ended:musicaDuelo.ended};},
  setGameState(mode,enabled,paused){
    const cambio=modoJuego!==mode || sonidoJuego!==!!enabled || juegoPausado!==!!paused;
    modoJuego=mode; sonidoJuego=!!enabled; juegoPausado=!!paused;
    if(cambio){actualizarMusica(0);syncAmbienteAudioState(sonidoJuego);}
  },
  unlock:desbloquearMusica
};
function actualizarMusica(dt=0){
  const vista=window.HP_SINGLE_VIEW, visible=!document.hidden;
  const enRecorrido=running&&vista==='arrival';
  const enJuego=vista==='game';
  const interior=visible&&sonidoJuego&&((enJuego&&!juegoPausado)||
    (enRecorrido&&['recepcion','pasillo','consultorios','gerencia'].includes(data.place)));
  const exterior=visible&&sonidoJuego&&enRecorrido&&data.place==='exterior';
  const tension=interior&&modoJuego==='tension'&&(enJuego || enRecorrido && !!data.elenaReception);
  const esperanza=interior&&enJuego&&modoJuego==='hope';
  const duelo=interior&&enJuego&&modoJuego==='sorrow';
  const calm=interior&&!tension&&!esperanza&&!duelo&&modoJuego!=='silence';
  // El bucle atenúa el final y el comienzo sin crear otra reproducción.
  const restante=Number.isFinite(musicaEsperanza.duration) ? musicaEsperanza.duration-musicaEsperanza.currentTime : Infinity;
  const envolvente=Math.max(0,Math.min(1,musicaEsperanza.currentTime/1,restante/1));
  const objetivos=[[musicaRecepcion,calm && musicaTension.volume<.001 && musicaEsperanza.volume<.001 ? .18 : 0,.4,.18],
    [musicaTension,tension ? .23 : 0,esperanza ? 1.2 : .4,.23],
    [musicaEsperanza,esperanza ? .20*envolvente : 0,esperanza ? 1.2 : .7,.20],
    [musicaDuelo,duelo ? .22*Math.max(0,Math.min(1,musicaDuelo.currentTime/1.5,(Number.isFinite(musicaDuelo.duration)?musicaDuelo.duration-musicaDuelo.currentTime:2)/2)) : 0,1,.22],
    [ambienteExterior,exterior ? .25 : 0,.4,.25]];
  for(const [pista,objetivo,duracion,nivel] of objetivos){
    if(!visible || (enJuego&&juegoPausado)) {pista.pause(); continue;}
    // Arrancar incluso con envolvente inicial cero, dentro del gesto del usuario.
    if(objetivo>0 || pista===musicaEsperanza && esperanza || pista===musicaDuelo && duelo&&!musicaDuelo.ended) reproducir(pista);
    const paso=dt/duracion*nivel;
    pista.volume=Math.max(0,Math.min(1,pista.volume+Math.max(-paso,Math.min(paso,objetivo-pista.volume))));
    if(objetivo===0 && pista.volume<=.001 && !(pista===musicaEsperanza && esperanza) && !(pista===musicaDuelo&&duelo)){
      pista.volume=0; pista.pause();
      if(pista===musicaEsperanza && !enJuego && pista.currentTime) pista.currentTime=0;
    }
  }
}
let ambienteAudio=null;
let proximoTecleo=0;

function syncAmbienteAudioState(enabled){
  if(!ambienteAudio)return;
  if(!enabled&&ambienteAudio.state==='running'){
    ambienteAudio.suspend().catch(()=>{});
  }else if(enabled&&ambienteAudio.state==='suspended'&&running){
    ambienteAudio.resume().catch(()=>{});
  }
}

function activarAmbiente(){
  desbloquearMusica();
  window.HP_AMBIENCE?.unlock();
  if(!sonidoJuego)return;
  const Audio=window.AudioContext||window.webkitAudioContext;
  if(!Audio)return;

  ambienteAudio??=new Audio();
  if(ambienteAudio.state==='suspended'){
    ambienteAudio.resume().catch(()=>{});
  }
}

canvas.addEventListener('pointerdown',activarAmbiente);

let proximoMurmullo=0;

function sonidoSala(){
  if(
    !sonidoJuego||data.place!=='recepcion'||modal||transition||
    !ambienteAudio||ambienteAudio.state!=='running'
  )return;

  if(clock<proximoMurmullo)return;
  proximoMurmullo=clock+7+Math.random()*9;

  const audio=ambienteAudio;
  const inicio=audio.currentTime;
  const duracion=1.8+Math.random()*1.2;
  const buffer=audio.createBuffer(
    1,
    Math.ceil(audio.sampleRate*duracion),
    audio.sampleRate
  );

  const muestras=buffer.getChannelData(0);
  let suave=0;

  for(let j=0;j<muestras.length;j++){
    suave=suave*0.94+(Math.random()*2-1)*0.06;
    muestras[j]=suave;
  }

  const fuente=audio.createBufferSource();
  const filtro=audio.createBiquadFilter();
  const volumen=audio.createGain();

  fuente.buffer=buffer;
  filtro.type='bandpass';
  filtro.Q.value=1.2;

  volumen.gain.setValueAtTime(0,inicio);

  // Variaciones suaves, semejantes a voces lejanas.
  for(let t=0.18;t<duracion;t+=0.18){
    filtro.frequency.linearRampToValueAtTime(
      350+Math.random()*450,inicio+t
    );

    const borde=Math.min(1,t/0.3,(duracion-t)/0.4);
    volumen.gain.linearRampToValueAtTime(
      Math.max(0,borde)*(0.025+Math.random()*0.035),
      inicio+t
    );
  }

  volumen.gain.linearRampToValueAtTime(0,inicio+duracion);

  fuente.connect(filtro);
  filtro.connect(volumen);
  volumen.connect(audio.destination);
  fuente.onended=()=>{fuente.disconnect();filtro.disconnect();volumen.disconnect();};
  fuente.start(inicio);
}
function sonidoCafe(){
  if(!sonidoJuego)return;
  activarAmbiente();
  if(!ambienteAudio)return;

  const audio=ambienteAudio;

  audio.resume().then(()=>{
    const duracion=2.4;
    const inicio=audio.currentTime;
    const buffer=audio.createBuffer(
      1,
      Math.ceil(audio.sampleRate*duracion),
      audio.sampleRate
    );

    const muestras=buffer.getChannelData(0);
    let suave=0;

    for(let j=0;j<muestras.length;j++){
      suave=suave*0.8+(Math.random()*2-1)*0.2;
      const tiempo=j/audio.sampleRate;
      const pulso=0.75+0.25*Math.sin(tiempo*32);
      muestras[j]=suave*pulso;
    }

    const fuente=audio.createBufferSource();
    const filtro=audio.createBiquadFilter();
    const volumen=audio.createGain();

    fuente.buffer=buffer;
    filtro.type='lowpass';
    filtro.frequency.setValueAtTime(900,inicio);
    filtro.frequency.linearRampToValueAtTime(
      1800,inicio+1.8
    );

    volumen.gain.setValueAtTime(0,inicio);
    volumen.gain.linearRampToValueAtTime(0.25,inicio+0.2);
    volumen.gain.setValueAtTime(0.25,inicio+1.9);
    volumen.gain.linearRampToValueAtTime(0,inicio+duracion);

    fuente.connect(filtro);
    filtro.connect(volumen);
    volumen.connect(audio.destination);
    fuente.onended=()=>{fuente.disconnect();filtro.disconnect();volumen.disconnect();};
    fuente.start(inicio);
  }).catch(()=>{});
}

// MEJORA GRÁFICA: Vapor ambiental sutil en la máquina de café de recepción.
window.HP_VAPOR_CAFE_ENABLED = true;
const vaporCafe = {
  particulas: [],
  tiempoSpawn: 0,
  preparandoJugador: 0
};

window.HP_VAPOR_CAFE_INFO = {
  get enabled() { return window.HP_VAPOR_CAFE_ENABLED !== false; },
  get count() { return vaporCafe.particulas.length; },
  get preparing() { return (martinCafe.visible && martinCafe.phase === 'preparando') || (vaporCafe.preparandoJugador > 0); },
  get particles() {
    return vaporCafe.particulas.map(p => ({
      x: Number(p.x.toFixed(2)),
      y: Number(p.y.toFixed(2)),
      size: p.tamano,
      life: p.vida,
      maxLife: p.vidaMax,
      alpha: Number(p.opacidadMax.toFixed(3))
    }));
  },
  simularPreparando(duracion = 4.0) {
    vaporCafe.preparandoJugador = duracion;
  }
};

function actualizarVaporCafe(dt){
  if(data.place!=='recepcion' || window.HP_VAPOR_CAFE_ENABLED===false){
    if(vaporCafe.particulas.length) vaporCafe.particulas=[];
    vaporCafe.preparandoJugador=0;
    return;
  }
  if(vaporCafe.preparandoJugador>0){
    vaporCafe.preparandoJugador=Math.max(0, vaporCafe.preparandoJugador - dt);
  }
  const estaPreparando=(martinCafe.visible && martinCafe.phase==='preparando') || (vaporCafe.preparandoJugador>0);
  // AJUSTE: +50-100% partículas para visibilidad clara a simple vista (11 pasivas, 18 preparando)
  const maxParticulas=estaPreparando ? 18 : 11;
  const intervaloSpawn=estaPreparando ? 0.09 : 0.13;

  vaporCafe.tiempoSpawn += dt;
  if(vaporCafe.tiempoSpawn >= intervaloSpawn && vaporCafe.particulas.length < maxParticulas){
    vaporCafe.tiempoSpawn = 0;
    // Origen de la salida / taza medido con precisión pixel art: x=91.5, y=123.5.
    const px = 91.5 + (Math.random() - 0.5) * 3.5;
    const py = 123.5 + (Math.random() - 0.5) * 1.5;
    // AJUSTE: mayor altura de ascenso antes de disiparse
    const vidaMax = estaPreparando ? (2.5 + Math.random() * 0.7) : (2.2 + Math.random() * 0.5);
    const colorTipo = Math.random() < 0.65 ? 'blanco' : 'calido';
    vaporCafe.particulas.push({
      x: px,
      y: py,
      baseX: px,
      vx: (Math.random() - 0.5) * 1.8,
      // Mayor velocidad de elevación para que el vapor ascienda y se lea claramente
      vy: estaPreparando ? (-14.0 - Math.random() * 4.5) : (-10.5 - Math.random() * 3.0),
      fase: Math.random() * Math.PI * 2,
      amplitud: 1.2 + Math.random() * 1.6,
      tamano: Math.random() < 0.45 ? 2.5 : 2.0,
      vidaMax,
      vida: 0,
      colorTipo,
      // AJUSTE: opacidad incrementada para legibilidad inmediata sin perder sutileza ambiental
      opacidadMax: estaPreparando ? (0.64 + Math.random() * 0.10) : (0.46 + Math.random() * 0.08)
    });
  }

  for(let i=vaporCafe.particulas.length - 1; i>=0; i--){
    const p = vaporCafe.particulas[i];
    p.vida += dt;
    if(p.vida >= p.vidaMax){
      vaporCafe.particulas.splice(i, 1);
      continue;
    }
    p.y += p.vy * dt;
    p.x = p.baseX + p.vx * p.vida + Math.sin(p.fase + p.vida * 2.4) * p.amplitud;
  }
}

function dibujarVaporCafe(){
  if(data.place!=='recepcion' || window.HP_VAPOR_CAFE_ENABLED===false || !vaporCafe.particulas.length) return;
  ctx.save();
  ctx.imageSmoothingEnabled = false;

  for(const p of vaporCafe.particulas){
    const progreso = p.vida / p.vidaMax;
    // Curva de opacidad: subida rápida inicial y desvanecimiento suave gradual
    const factorAlpha = progreso < 0.18 
      ? (progreso / 0.18) 
      : Math.max(0, Math.sin(Math.PI * (1 - progreso * 0.85)));
    const alpha = Math.max(0, Math.min(0.85, p.opacidadMax * factorAlpha));
    if(alpha <= 0.02) continue;

    // Expansión gradual al ascender formando volutas de vapor suaves
    const expansion = Math.floor(progreso * 1.8);
    const w = Math.round(p.tamano + expansion);
    const h = Math.round(p.tamano + expansion);
    const rx = Math.round(p.x - w / 2);
    const ry = Math.round(p.y);

    // Vapor cálido pixel art con alternancia de blanco luminoso y matiz crema institucional
    const rgb = p.colorTipo === 'blanco' ? '255, 255, 255' : '238, 248, 244';
    ctx.fillStyle = `rgba(${rgb}, ${alpha.toFixed(3)})`;
    ctx.fillRect(rx, ry, w, h);

    // Micro-detalle pixel art: píxel secundario disperso al elevarse para mayor textura
    if(w >= 2 && alpha > 0.15){
      ctx.fillStyle = `rgba(245, 252, 250, ${(alpha * 0.55).toFixed(3)})`;
      ctx.fillRect(rx + (Math.sin(p.fase) > 0 ? 1 : -1), ry - 1, 1, 1);
    }
  }

  ctx.restore();
}

// ============================================================================
// FASE 3B-1: ANIMACIONES AMBIENTALES DE RECEPCIÓN
// ============================================================================
if (typeof window.HP_PANTALLA_TURNOS_ANIM_ENABLED === 'undefined') {
  window.HP_PANTALLA_TURNOS_ANIM_ENABLED = true;
}
if (typeof window.HP_COMPUTADOR_LED_ENABLED === 'undefined') {
  window.HP_COMPUTADOR_LED_ENABLED = true;
}

function dibujarComputadorRecepcion(){
  img('computador', 330, 87, 60, 52);
  if(window.HP_COMPUTADOR_LED_ENABLED === false) return;

  // Indicador luminoso sutil de actividad en marco inferior derecho del monitor (2x1 px)
  const ahora = performance.now();
  const ciclo = ahora % 3600;
  let alpha = 0.22;
  if((ciclo >= 0 && ciclo < 70) || (ciclo >= 130 && ciclo < 200) || (ciclo >= 300 && ciclo < 360)){
    alpha = 0.85;
  }

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = `rgba(74, 222, 128, ${alpha})`;
  ctx.fillRect(368, 114, 2, 1);
  ctx.restore();
}

function dibujarPantallaTurnos(){
  img('pantallaTurnos', 655, 200, 105, 200);
  if(window.HP_PANTALLA_TURNOS_ANIM_ENABLED === false) return;

  const ahora = performance.now();

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  // Máscara poligonal estricta del panel interior luminoso útil de la pantalla
  // Delimita con precisión el área visual del monitor sin invadir marco turquesa, bordes ni soporte
  // Coordenadas absolutas en canvas (x: 655 + offset_rel, y: 200 + offset_rel)
  ctx.beginPath();
  ctx.moveTo(673, 241); // Vértice superior izquierdo interno
  ctx.lineTo(741, 249); // Vértice superior derecho interno
  ctx.lineTo(741, 317); // Vértice inferior derecho interno
  ctx.lineTo(703, 317); // Vértice inferior centro-izquierdo interno
  ctx.lineTo(673, 302); // Vértice inferior izquierdo interno
  ctx.closePath();
  ctx.clip();

  // Pulso armónico suave y continuo sobre toda la superficie interna del monitor
  // Oscilación senoidal suave (período ~2.8s) que da vida a toda la pantalla sin parpadeos agresivos
  const pulso = 0.5 + 0.5 * Math.sin(ahora * 0.0022);
  const alphaPulso = 0.03 + 0.05 * pulso; // rango [0.030, 0.080]

  ctx.fillStyle = `rgba(56, 189, 248, ${alphaPulso.toFixed(3)})`;
  ctx.fillRect(665, 235, 85, 90);

  // Micro-refresco institucional muy sutil que recorre suavemente la pantalla útil
  const barrido = (ahora * 0.035) % 80;
  const yScan = Math.round(242 + barrido);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
  ctx.fillRect(665, yScan, 85, 2);

  ctx.restore();
}

function sonidoTeclado(){
  if(
    !sonidoJuego||data.place!=='recepcion'||modal||transition||
    !ambienteAudio||ambienteAudio.state!=='running'
  )return;

  if(clock<proximoTecleo)return;
  proximoTecleo=clock+2+Math.random()*5;

  const inicio=ambienteAudio.currentTime;
  const cantidad=3+Math.floor(Math.random()*5);

  for(let n=0;n<cantidad;n++){
  const instante=inicio+n*0.09+Math.random()*0.04;
  const duracion=0.035;
  const buffer=ambienteAudio.createBuffer(
    1,
    Math.ceil(ambienteAudio.sampleRate*duracion),
    ambienteAudio.sampleRate
  );

  const muestras=buffer.getChannelData(0);
  for(let j=0;j<muestras.length;j++){
    muestras[j]=(Math.random()*2-1)*
      Math.exp(-j/(ambienteAudio.sampleRate*0.006));
  }

  const tecla=ambienteAudio.createBufferSource();
  const filtro=ambienteAudio.createBiquadFilter();
  const volumen=ambienteAudio.createGain();

  tecla.buffer=buffer;
  tecla.playbackRate.value=0.85+Math.random()*0.3;

  filtro.type='bandpass';
  filtro.frequency.value=1400+Math.random()*900;
  filtro.Q.value=0.7;
  volumen.gain.value=0.15;

  tecla.connect(filtro);
  filtro.connect(volumen);
  volumen.connect(ambienteAudio.destination);
  tecla.onended=()=>{tecla.disconnect();filtro.disconnect();volumen.disconnect();};
  tecla.start(instante);
}
}
function secretary(){
  const image=images.secretaria;
  if(!image.complete||!image.naturalWidth)return;

  const cerrados=clock%4.3>4.18;
  const escalaX=image.naturalWidth/1774;
  const escalaY=image.naturalHeight/887;

  const x=303;
  const y=58;
  const ancho=40;
  const alto=63;

  function dibujarPose(cerrada){
    ctx.drawImage(
      image,
      (cerrada?964:335)*escalaX,
      (cerrada?114:115)*escalaY,
      (cerrada?467:466)*escalaX,
      (cerrada?730:729)*escalaY,
      x,y,ancho,alto
    );
  }

  ctx.save();
  ctx.imageSmoothingEnabled=true;
ctx.imageSmoothingQuality='high';

  // Corte justo en la línea del mostrador.
  ctx.beginPath();
  ctx.rect(285,0,80,120);
  ctx.clip();

  dibujarPose(false);

  if(cerrados){
    ctx.save();

    // Solo cambian los ojos; el cuerpo queda quieto.
    ctx.beginPath();
    ctx.rect(x+9,y+20,23,8);
    ctx.clip();

    dibujarPose(true);
    ctx.restore();
  }

  ctx.restore();
}
const visitante={
  x:420,y:550,
  face:'up',
  distance:0,
  walking:false,
  visible:false,
  etapa:0,
  espera:3
};

// Recorrido por el espacio libre de la recepción.
const recorridoVisitante=[
  {x:420,y:440},
  {x:420,y:230},
  {x:345,y:200},
  {x:420,y:230},
  {x:420,y:440},
  {x:420,y:550}
];

function actualizarVisitante(dt){
  if(data.place!=='recepcion'||modal||transition)return;

  const v=visitante;
  v.walking=false;

  if(v.espera>0){
    v.espera=Math.max(0,v.espera-dt);
    if (!v.animState) {
      v.animState = { walkingPrev: false, ultimoCuadro: 0, transicionParada: 0, tiempoReposo: 0, cuadroTransicion: 0 };
    }
    const vst = v.animState;
    vst.walkingPrev = false;
    if (vst.transicionParada > 0) {
      vst.transicionParada -= dt;
      if (vst.transicionParada <= 0) vst.transicionParada = 0;
    } else {
      vst.tiempoReposo += dt;
    }
    return;
  }

  if(!v.visible){
    v.visible=true;
    v.x=420;
    v.y=550;
    v.etapa=0;
    v.face='up';
    v.distance=0;
  }

  const destino=recorridoVisitante[v.etapa];
  const dx=destino.x-v.x;
  const dy=destino.y-v.y;
  const distancia=Math.hypot(dx,dy);
  const paso=Math.min(distancia,65*dt);

  if(distancia<0.5){
    v.x=destino.x;
    v.y=destino.y;
    v.etapa++;

    if(v.etapa===3){
      v.face='up';
      v.espera=6;
    }

    if(v.etapa===recorridoVisitante.length){
      v.visible=false;
      v.espera=15+Math.random()*10;
    }

    return;
  }

  const siguienteX=v.x+dx/distancia*paso;
  const siguienteY=v.y+dy/distancia*paso;

  // FASE 2B: Detección preventiva direccional reutilizando la lógica probada de pasillo.
  // Si la médica ocupa la trayectoria inmediata del visitante, este se detiene a distancia visual respetuosa.
  const toMedX = actor.x - v.x;
  const toMedY = actor.y - v.y;
  const ux = dx / distancia;
  const uy = dy / distancia;
  const proyAdelante = toMedX * ux + toMedY * uy;
  const desvLateral = Math.abs(toMedX * (-uy) + toMedY * ux);
  const distMedica = Math.hypot(toMedX, toMedY);

  const umbralAdelante = v.bloqueadoMedica ? 54 : 46;
  const bloqueaMedica = !receptionEmergencyActive() && (
    (proyAdelante > 0 && proyAdelante < umbralAdelante && desvLateral < 26) ||
    distMedica < 34
  );
  v.bloqueadoMedica = bloqueaMedica;

  if (bloqueaMedica) {
    v.walking = false;
    v.face = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
  } else if (siguienteY <= 490 && !free(siguienteX, siguienteY, true)) {
    v.walking = false;
  } else {
    v.x = siguienteX;
    v.y = siguienteY;
    v.distance += paso;
    v.walking = true;
    v.face = Math.abs(dx) > Math.abs(dy)
      ? dx > 0 ? 'right' : 'left'
      : dy > 0 ? 'down' : 'up';
  }

  // Fase 1C: Control de animación y transición walk-to-idle del Visitante
  if (!v.animState) {
    v.animState = { walkingPrev: false, ultimoCuadro: 0, transicionParada: 0, tiempoReposo: 0, cuadroTransicion: 0 };
  }
  const vst = v.animState;
  if (v.walking) {
    vst.walkingPrev = true;
    vst.ultimoCuadro = Math.floor((v.distance || 0) / 7) % 8;
    vst.transicionParada = 0;
    vst.tiempoReposo = 0;
  } else {
    if (vst.walkingPrev) {
      vst.walkingPrev = false;
      vst.transicionParada = 0.075; // 75 ms amortiguación natural
      const u = vst.ultimoCuadro;
      vst.cuadroTransicion = (u >= 1 && u <= 3) ? 4 : 0;
    }
    if (vst.transicionParada > 0) {
      vst.transicionParada -= dt;
      if (vst.transicionParada <= 0) vst.transicionParada = 0;
    } else {
      vst.tiempoReposo += dt;
    }
  }
}
const anciano={
  x:470,y:550,
  face:'up',
  distance:0,
  walking:false,
  visible:false,
  espera:8,
  etapa:0
};

const recorridoAnciano=[
  {x:470,y:440},
  {x:470,y:230},
  {x:613,y:230},
  {x:613,y:190}
];

function actualizarAnciano(dt){
  const p=anciano;
  p.walking=false;

  if(data.place!=='recepcion'||modal||transition)return;

  if(p.espera>0){
    p.espera=Math.max(0,p.espera-dt);
    return;
  }

  // Al terminar el recorrido, abrir, entrar y cerrar.
if(p.etapa>=recorridoAnciano.length){
  if(p.ascensorTerminado)return;

  p.tAscensor=(p.tAscensor||0)+dt;
  const t=p.tAscensor;

  p.face='up';

  // Espera a que las puertas estén abiertas.
  if(t>=0.7&&t<2){
    const siguienteY=Math.max(136,p.y-48*dt);
    p.distance+=p.y-siguienteY;
    p.walking=siguienteY<p.y;
    p.y=siguienteY;
  }

  // Ya dentro, permanece detrás de las puertas.
  p.enCabina=p.y<=145;

  if(t>=3){
    p.visible=false;
    p.enCabina=false;
    p.ascensorTerminado=true;
  }

  return;
}

p.visible=true;

const destino=recorridoAnciano[p.etapa];

  const dx=destino.x-p.x;
  const dy=destino.y-p.y;
  const distancia=Math.hypot(dx,dy);

  if(distancia<0.5){
    p.x=destino.x;
    p.y=destino.y;
    p.etapa++;

    if(p.etapa===recorridoAnciano.length){
      p.face='up';
    }
    return;
  }

  const paso=Math.min(distancia,48*dt);
  const siguienteX=p.x+dx/distancia*paso;
  const siguienteY=p.y+dy/distancia*paso;

  if(Math.hypot(siguienteX-actor.x,siguienteY-actor.y)<24)return;

  if(
    visitante.visible&&
    Math.hypot(siguienteX-visitante.x,siguienteY-visitante.y)<24
  )return;

  if(siguienteY<=490&&!free(siguienteX,siguienteY,true))return;

  p.x=siguienteX;
  p.y=siguienteY;
  p.distance+=paso;
  p.walking=true;
  p.face=Math.abs(dx)>Math.abs(dy)
    ?(dx>0?'right':'left')
    :(dy>0?'down':'up');
}
function dibujarEmbarazada(x=625,y=455){
  const imagen=images.embarazada;
  if(!imagen.complete||!imagen.naturalWidth)return;

  // Parpadeo de 140 milisegundos cada 4 segundos.
  const cerrados=clock%4>3.86;

  // Recortes alineados: ambos cuadros conservan los pies.
  const escalaX=imagen.naturalWidth/1536;
  const escalaY=imagen.naturalHeight/1024;
  const origenX=221;

  const ancho=40;
  const alto=78;

  ctx.save();
  scaleReceptionActor(x,y,1.16);
  ctx.imageSmoothingEnabled=false;
  ctx.filter=`
  drop-shadow(1px 0 0 #000)
  drop-shadow(-1px 0 0 #000)
  drop-shadow(0 1px 0 #000)
  drop-shadow(0 -1px 0 #000)
`;

  ctx.drawImage(
    imagen,
    origenX*escalaX,51*escalaY,
    413*escalaX,918*escalaY,
    Math.round(x-ancho/2),
    Math.round(y-alto),
    ancho,alto
  );
  if(cerrados){
  ctx.filter='none';

  // Superponer únicamente el ojo cerrado.
  ctx.drawImage(
    imagen,
    1134*escalaX,250*escalaY,
    90*escalaX,80*escalaY,
    x-ancho/2+(1134-871)/413*ancho,
    y-alto+(250-51)/918*alto,
    90/413*ancho,
    80/918*alto
  );
}

  ctx.restore();
}
const visitanteSilla={
  x:470,y:550,
  face:'up',
  distance:0,
  walking:false,
  visible:false,
  espera:5,
  etapa:0
};

const recorridoSilla=[
  {x:470,y:440},
  {x:470,y:230},
  {x:613,y:230},
  {x:613,y:190}
];

function actualizarVisitanteSilla(dt){
  const p=visitanteSilla;
  p.walking=false;

  if(data.place!=='recepcion'||modal||transition)return;

  // Esperar a que el anciano termine de usar el ascensor.
  if(!anciano.ascensorTerminado)return;

  if(p.espera>0){
    p.espera=Math.max(0,p.espera-dt);
    return;
  }

  if(p.etapa>=recorridoSilla.length){
  if(p.ascensorTerminado)return;

  p.tAscensor=(p.tAscensor||0)+dt;
  const t=p.tAscensor;

  p.face='up';

  if(t>=0.7&&t<2.2){
    const siguienteY=Math.max(136,p.y-42*dt);

    p.distance+=p.y-siguienteY;
    p.walking=siguienteY<p.y;
    p.y=siguienteY;
  }

  p.enCabina=p.y<=145;

  if(t>=3.2){
    p.visible=false;
    p.enCabina=false;
    p.ascensorTerminado=true;
  }

  return;
}

p.visible=true;

const destino=recorridoSilla[p.etapa];

  const dx=destino.x-p.x;
  const dy=destino.y-p.y;
  const distancia=Math.hypot(dx,dy);

  if(distancia<0.5){
    p.x=destino.x;
    p.y=destino.y;
    p.etapa++;

    if(p.etapa===recorridoSilla.length)p.face='up';
    return;
  }

  const paso=Math.min(distancia,42*dt);
  const siguienteX=p.x+dx/distancia*paso;
  const siguienteY=p.y+dy/distancia*paso;

  // Detenerse si hay otra persona delante.
  const bloqueadoPorPersona=(persona)=>{
    return persona.visible&&
      Math.abs(siguienteX-persona.x)<34&&
      Math.abs(siguienteY-persona.y)<23;
  };

  if(
    Math.abs(siguienteX-actor.x)<34&&
    Math.abs(siguienteY-actor.y)<23
  )return;

  if(bloqueadoPorPersona(visitante))return;
  if(bloqueadoPorPersona(anciano))return;

  // Comprobar también los muebles y límites del suelo.
  if(siguienteY<=490&&!free(siguienteX,siguienteY,true))return;

  p.x=siguienteX;
  p.y=siguienteY;
  p.distance+=paso;
  p.walking=true;
  p.face=Math.abs(dx)>Math.abs(dy)?'right':'up';
}

function dibujarVisitanteSilla(persona=visitanteSilla){
  const imagen=images.visitanteSilla;
  if(!imagen.complete||!imagen.naturalWidth)return;

  const p=persona;
  const columna=p.walking
    ?Math.floor(p.distance/8)%4
    :0;

  const escalaX=imagen.naturalWidth/1536;
  const escalaY=imagen.naturalHeight/1024;

  const lateral=p.face==='right'||p.face==='left';
  const flip=p.face==='left';

  // Igual escala del dibujo en las dos orientaciones.
  const factorX=66/344;
  const factorY=89/462;

  const sx=(lateral?38:60)+columna*384;
  const sy=lateral?515:35;
  const sw=lateral?344:264;
  const sh=lateral?462:450;

  const ancho=sw*factorX;
  const alto=sh*factorY;

  ctx.save();
  scaleReceptionActor(p.x,p.y,1.12);
  ctx.imageSmoothingEnabled=true;
  ctx.imageSmoothingQuality='high';

  // Fase 1C: Alineación del eje de giro de las ruedas (evita saltos espaciales al cambiar up <-> lateral)
  // En vista lateral, el centro de masa de la silla está desplazado al 44.4% del ancho en vez del 50%
  const pivotOffsetX = lateral ? Math.round(ancho * (152.7 / 344 - 0.5)) : 0;

  if(flip){
    ctx.translate(p.x,0);
    ctx.scale(-1,1);
    ctx.translate(-p.x,0);
  }

  ctx.drawImage(
    imagen,
    sx*escalaX,sy*escalaY,
    sw*escalaX,sh*escalaY,
    Math.round(p.x-ancho/2 - (flip ? -pivotOffsetX : pivotOffsetX)),
    Math.round(p.y-alto),
    ancho,alto
  );

  ctx.restore();
}

if (typeof window !== 'undefined') {
  window.HP_VISITANTE_OBJ = visitante;
  window.HP_SILLA_OBJ = visitanteSilla;
  window.HP_ANCIANO_OBJ = anciano;
}
function dibujarMedicoPasillo(persona){
  const direccion={down:'south',up:'north',left:'west',right:'east'}[persona.face]||'south';
  const conjunto=medicoAncianoSprites[direccion];
  const indice=persona.walking?Math.floor(persona.distance/10)%8:0;
  const imagen=persona.walking?conjunto.caminata[indice]:conjunto.quieta;
  if(!imagen.complete||!imagen.naturalWidth)return;
  const piesQuieto={south:228,north:234,east:235,west:235};
  const piesCaminando={south:[233,229,226,226,234,231,227,225],north:[232,231,231,231,232,232,231,231],east:[233,234,233,234,234,232,230,232],west:[233,234,233,234,234,232,230,232]};
  const pie=persona.walking?piesCaminando[direccion][indice]:piesQuieto[direccion];
  const tamano=182.4,factor=tamano/256;
  ctx.save();
  ctx.imageSmoothingEnabled=false;
  ctx.drawImage(imagen,0,0,256,256,Math.round(persona.x-128*factor),Math.round(persona.y-pie*factor),tamano,tamano);
  ctx.restore();
}
function dibujarAnciano(persona=anciano){
  {
    const direccion={down:'south',up:'north',left:'west',right:'east'}[persona.face]||'south';
    const conjunto=ancianoSprites[direccion];
    const indice=persona.walking?Math.floor(persona.distance/9)%8:0;
    const imagen=persona.walking?conjunto.caminata[indice]:conjunto.quieta;
    if(!imagen.complete||!imagen.naturalWidth)return;
    const piesQuieto={south:225,north:225,east:224,west:224};
    const piesCaminando={south:[228,225,223,224,228,227,225,224],north:[223,224,224,224,224,224,224,224],east:[224,224,221,220,220,224,224,224],west:[224,224,221,220,220,224,224,224]};
    const pie=persona.walking?piesCaminando[direccion][indice]:piesQuieto[direccion];
    const tamano=persona===anciano?110.4:92*1.10,factor=tamano/256;
    ctx.save();
    scaleReceptionActor(persona.x,persona.y,1.2);
    ctx.imageSmoothingEnabled=false;
    ctx.drawImage(imagen,0,0,256,256,Math.round(persona.x-128*factor),Math.round(persona.y-pie*factor),tamano,tamano);
    ctx.restore();
    return;
  }
}
function dibujarVisitante(persona){
  const direccion={
    down:'south',
    up:'north',
    left:'west',
    right:'east',
    south:'south',
    north:'north',
    west:'west',
    east:'east'
  }[persona.face]||'south';
  const conjunto=visitanteSprites[direccion];
  if(!conjunto)return;

  // Fase 1C: Transición suave Walk-to-Idle de 75 ms
  if (!persona.animState) {
    persona.animState = { walkingPrev: false, ultimoCuadro: 0, transicionParada: 0, tiempoReposo: 0, cuadroTransicion: 0 };
  }
  const vst = persona.animState;
  const caminando = Boolean(persona.walking);
  let imagen = null;

  if (caminando) {
    const indice = Math.floor((persona.distance || 0) / 7) % 8;
    imagen = (conjunto.caminata[indice]?.complete && conjunto.caminata[indice]?.naturalWidth)
      ? conjunto.caminata[indice]
      : conjunto.quieta;
  } else if (vst && vst.transicionParada > 0.035) {
    // Pose de apoyo amortiguada (38 ms iniciales de deceleración)
    const idx = vst.cuadroTransicion;
    imagen = (conjunto.caminata[idx]?.complete && conjunto.caminata[idx]?.naturalWidth)
      ? conjunto.caminata[idx]
      : conjunto.quieta;
  } else {
    imagen = conjunto.quieta;
  }
  if (!imagen?.complete || !imagen.naturalWidth) return;

  // Anclaje en la base de los zapatos sobre el lienzo de 256×256 y eje central X=128.
  const pieY = caminando
    ? (direccion === 'south' ? 224 : 225)
    : ({ south: 221, north: 222, west: 226, east: 226 }[direccion] || 224);
  const tamano = 98 * (persona === visitante ? 1.10 : 1);
  const factor = tamano / 256;

  ctx.save();
  scaleReceptionActor(persona.x, persona.y, 1.2);
  ctx.imageSmoothingEnabled = false;

  const destX = Math.round(persona.x - 128 * factor);
  const destY = Math.round(persona.y - pieY * factor);

  // Fase 1C: Micro-respiración sutil en reposo prolongado (>= 1.0 s) con pies inmóviles
  const enReposoLargo = vst && !caminando && vst.transicionParada <= 0 && vst.tiempoReposo >= 1.0;
  if (enReposoLargo && imagen === conjunto.quieta) {
    const ciclo = 3.6;
    const fase = (vst.tiempoReposo % ciclo) / ciclo;
    const respiracionOffset = Math.sin(fase * Math.PI * 2) > 0.3 ? 1 : 0;

    // Corte anatómico: cintura / chaqueta en cy = 148 (zapatos firmes en pieY)
    const cyCorte = 148;
    const corteDestY = Math.round(cyCorte * factor);

    // Parte inferior (pantalones y zapatos): 100% inmóvil en el suelo
    ctx.drawImage(
      imagen,
      0, cyCorte, 256, 256 - cyCorte,
      destX, destY + corteDestY, tamano, tamano - corteDestY
    );

    // Parte superior (torso, chaqueta, cabeza): micro-elevación de 1 px
    ctx.drawImage(
      imagen,
      0, 0, 256, cyCorte,
      destX, destY - respiracionOffset, tamano, corteDestY
    );
  } else {
    ctx.drawImage(
      imagen,
      0, 0, 256, 256,
      destX, destY,
      tamano, tamano
    );
  }

  ctx.restore();
}
// ============================================================================
// FASE 1A: OPTIMIZACIÓN DE LA ANIMACIÓN DE LA MÉDICA (TRANSICIÓN Y RESPIRACIÓN)
// ============================================================================
window.HP_MEDICA_TRANSICION_PARADA_ENABLED = true;
window.HP_MEDICA_RESPIRACION_ENABLED = true;

const medicaAnimState = {
  walkingPrev: false,
  ultimoCuadroCaminata: 1,
  transicionParada: { activa: false, t: 0, duracion: 0.075, cuadro: 0 },
  tiempoReposo: 0
};

function actualizarAnimacionMedica(dt) {
  dt = Math.max(0.001, Math.min(dt, 0.05));
  if (actor.walking) {
    medicaAnimState.tiempoReposo = 0;
    medicaAnimState.transicionParada.activa = false;
    medicaAnimState.walkingPrev = true;
    medicaAnimState.ultimoCuadroCaminata = 1 + Math.floor((actor.distance || 0) / 10) % 6;
  } else {
    if (medicaAnimState.walkingPrev) {
      medicaAnimState.walkingPrev = false;
      medicaAnimState.tiempoReposo = 0;

      if (window.HP_MEDICA_TRANSICION_PARADA_ENABLED !== false) {
        const u = medicaAnimState.ultimoCuadroCaminata;
        // Asentamiento visual según fase de zancada previa:
        // u=3 o 5 (apoyo extendido) -> cuadro intermedio 4 de apoyo inicial antes de neutro
        // u=6 o 2 (apoyo extendido opuesto) -> cuadro intermedio 1 de apoyo inicial antes de neutro
        // u=1 o 4 (pies ya en contacto) -> neutro directo
        let cuadroIntermedio = 0;
        if (u === 3 || u === 5) cuadroIntermedio = 4;
        else if (u === 6 || u === 2) cuadroIntermedio = 1;

        if (cuadroIntermedio !== 0) {
          medicaAnimState.transicionParada = {
            activa: true,
            t: 0,
            duracion: 0.075, // 75 ms (rango 60-90 ms solicitado)
            cuadro: cuadroIntermedio
          };
        } else {
          medicaAnimState.transicionParada.activa = false;
        }
      } else {
        medicaAnimState.transicionParada.activa = false;
      }
    }

    if (medicaAnimState.transicionParada.activa) {
      medicaAnimState.transicionParada.t += dt;
      if (medicaAnimState.transicionParada.t >= medicaAnimState.transicionParada.duracion) {
        medicaAnimState.transicionParada.activa = false;
      }
    } else {
      medicaAnimState.tiempoReposo += dt;
    }
  }
}

function doctor(){
  const imagen=images.medica;
  if(!imagen.complete||!imagen.naturalWidth)return;

  const fila={down:0,up:1,left:2,right:3}[actor.face];
  if(fila===undefined)return;

  let columna = 0;
  if (actor.walking) {
    columna = 1 + Math.floor((actor.distance || 0) / 10) % 6;
  } else if (medicaAnimState.transicionParada.activa) {
    // Primera mitad de la transición (0..40ms): cuadro de apoyo previo
    // Segunda mitad (40..75ms): asentamiento a neutro (0)
    if (medicaAnimState.transicionParada.t < medicaAnimState.transicionParada.duracion * 0.55) {
      columna = medicaAnimState.transicionParada.cuadro;
    } else {
      columna = 0;
    }
  } else {
    columna = 0;
  }

  const escala=data.place==='gerencia'
  ?1.82
  :['pasillo','consultorios'].includes(data.place)
    ?2.2
    :data.place==='exterior'
      ?1.43
      :data.place==='recepcion'
        ?1.55
        :1;

  const anchoCelda=imagen.naturalWidth/7;
  const altoCelda=imagen.naturalHeight/4;

  // Apoyo inferior medido en cada cuadro original.
  const pies=[
    [237,237,240,239,237,240,240],
    [234,234,238,236,232,237,234],
    [237,237,238,238,238,235,237],
    [237,237,238,238,238,235,237]
  ];

  // Centro del cuerpo, independiente del volumen del cabello.
  const centroX=[128,128,124,132];
  const tamaño=71.4*escala;
  const factor=tamaño/256;

  const baseDx = actor.x - centroX[fila] * factor;
  const baseDy = actor.y - pies[fila][columna] * factor;

  ctx.save();
  ctx.imageSmoothingEnabled=true;
  ctx.imageSmoothingQuality='high';

  // Micro-animación de respiración:
  // Se activa ÚNICAMENTE tras ~1 segundo de reposo continuo, con médica quieta y fuera de transición.
  const respirando = window.HP_MEDICA_RESPIRACION_ENABLED !== false &&
    !actor.walking &&
    !medicaAnimState.transicionParada.activa &&
    medicaAnimState.tiempoReposo >= 1.0;

  if (respirando) {
    // Ciclo respiratorio lento y natural: 3.2 segundos por ciclo (inspiración/espiración)
    const tCiclo = (medicaAnimState.tiempoReposo - 1.0) * (Math.PI * 2 / 3.2);
    const senRespiracion = Math.sin(tCiclo);

    // Elevación extremadamente discreta del torso superior:
    // Solo cuando inhala (sen > 0), con desplazamiento máximo de 1 píxel visual
    // Los pies y piernas (cy = 186..256) permanecen 100% inmóviles en el suelo (anclaje fijo).
    const cyCorte = 186; // Borde inferior de la bata sobre los pantalones
    const deltaYTorso = senRespiracion > 0 ? -Math.round(senRespiracion * factor * 1.5) : 0;

    // 1. Piernas y pies (cyCorte..256): FIJOS AL SUELO, cero movimiento
    const shPiernas = 256 - cyCorte;
    ctx.drawImage(
      imagen,
      columna * anchoCelda,
      fila * altoCelda + cyCorte,
      anchoCelda,
      shPiernas,
      baseDx,
      baseDy + cyCorte * factor,
      tamaño,
      shPiernas * factor
    );

    // 2. Cabeza y torso (0..cyCorte+1): elevación sutil de 1 px en inhalación
    // El +1 en sourceHeight garantiza que nunca haya separación de píxeles entre torso y piernas.
    const shTorso = cyCorte + 1;
    ctx.drawImage(
      imagen,
      columna * anchoCelda,
      fila * altoCelda,
      anchoCelda,
      shTorso,
      baseDx,
      baseDy + deltaYTorso,
      tamaño,
      shTorso * factor
    );
  } else {
    // Renderizado estándar de pieza completa durante caminata y transiciones
    ctx.drawImage(
      imagen,
      columna*anchoCelda,
      fila*altoCelda,
      anchoCelda,
      altoCelda,
      baseDx,
      baseDy,
      tamaño,
      tamaño
    );
  }

  ctx.restore();
}
function floor(){rect(0,0,W,H,'#b7d0cf');rect(24,115,720,380,'#e4dfcf');for(let y=115;y<500;y+=32)for(let x=24;x<744;x+=32){rect(x,y,31,31,(x+y)%64?'#dedbce':'#e8e4d7');}rect(24,100,720,15,'#6b8d91');rect(0,0,24,H,'#607f86');rect(744,0,24,H,'#607f86');rect(0,495,W,17,'#607f86');}
// ============================================================================
// MEJORA GRÁFICA 3: ANIMACIÓN DE PUERTAS CORREDIZAS CON TWEEN.JS
// ============================================================================
window.HP_TWEEN_PUERTAS_ENABLED = true;

window.HP_TWEEN_PUERTAS_CONFIG = {
  duracionMs: 400, // Duración exacta original: 0.40s (de t.at=0.65 a t.at=1.05)
  curvaApertura: 'Quadratic.InOut', // Transición mecánica suave, natural y sin rebote
  curvaCierre: 'Quadratic.InOut'
};

const tweenPuertas = {
  apertura: 0,        // 0.0 (cerrada) a 1.0 (abierta)
  objetivo: 0,        // 0.0 o 1.0
  estado: 'cerrada',  // 'cerrada', 'abriendo', 'abierta', 'cerrando'
  modoManual: false,  // Permite diagnósticos y pruebas manuales sin sobreescritura de frame
  tween: null,
  simTime: 0,
  grupo: typeof TWEEN !== 'undefined' ? new TWEEN.Group() : null
};

function asegurarGrupoTweenPuertas() {
  if (!tweenPuertas.grupo && typeof TWEEN !== 'undefined') {
    tweenPuertas.grupo = new TWEEN.Group();
  }
  return tweenPuertas.grupo;
}

function resolverCurvaTween(tipo) {
  if (typeof TWEEN === 'undefined') return null;
  const nombre = tipo === 'cierre'
    ? window.HP_TWEEN_PUERTAS_CONFIG.curvaCierre
    : window.HP_TWEEN_PUERTAS_CONFIG.curvaApertura;
  const partes = (nombre || '').split('.');
  if (partes.length === 2 && TWEEN.Easing?.[partes[0]]?.[partes[1]]) {
    return TWEEN.Easing[partes[0]][partes[1]];
  }
  return TWEEN.Easing.Quadratic.InOut;
}

function solicitarAperturaPuerta(objetivoDeseado) {
  if (tweenPuertas.objetivo === objetivoDeseado) return;
  tweenPuertas.objetivo = objetivoDeseado;

  const grupo = asegurarGrupoTweenPuertas();
  if (!grupo || typeof TWEEN === 'undefined') {
    tweenPuertas.apertura = objetivoDeseado;
    tweenPuertas.estado = objetivoDeseado === 1 ? 'abierta' : 'cerrada';
    return;
  }

  if (tweenPuertas.tween) {
    tweenPuertas.tween.stop();
    grupo.remove(tweenPuertas.tween);
    tweenPuertas.tween = null;
  }

  const distanciaRestante = Math.abs(objetivoDeseado - tweenPuertas.apertura);
  if (distanciaRestante < 0.001) {
    tweenPuertas.apertura = objetivoDeseado;
    tweenPuertas.estado = objetivoDeseado === 1 ? 'abierta' : 'cerrada';
    return;
  }

  // Duración proporcional a la distancia restante: mantiene la velocidad original
  // y previene cualquier salto o aceleración irreal si se interrumpe a mitad de camino.
  const duracionTotal = window.HP_TWEEN_PUERTAS_CONFIG.duracionMs || 400;
  const duracion = Math.max(20, Math.round(duracionTotal * distanciaRestante));
  const curva = resolverCurvaTween(objetivoDeseado === 0 ? 'cierre' : 'apertura');

  tweenPuertas.estado = objetivoDeseado === 1 ? 'abriendo' : 'cerrando';

  const estadoInterpolable = { open: tweenPuertas.apertura };
  tweenPuertas.tween = new TWEEN.Tween(estadoInterpolable, grupo)
    .to({ open: objetivoDeseado }, duracion)
    .easing(curva)
    .onUpdate(() => {
      tweenPuertas.apertura = Math.max(0, Math.min(1, estadoInterpolable.open));
    })
    .onComplete(() => {
      tweenPuertas.apertura = objetivoDeseado;
      tweenPuertas.estado = objetivoDeseado === 1 ? 'abierta' : 'cerrada';
      tweenPuertas.tween = null;
    })
    .start(tweenPuertas.simTime);
}

function actualizarPuertasExterior(dt) {
  if (data.place !== 'exterior') {
    if (tweenPuertas.apertura !== 0 || tweenPuertas.objetivo !== 0) {
      if (tweenPuertas.tween) {
        tweenPuertas.tween.stop();
        tweenPuertas.grupo?.remove(tweenPuertas.tween);
        tweenPuertas.tween = null;
      }
      tweenPuertas.apertura = 0;
      tweenPuertas.objetivo = 0;
      tweenPuertas.estado = 'cerrada';
    }
    return;
  }

  // Tiempo de simulación sincronizado con el delta del motor de llegada
  tweenPuertas.simTime += dt * 1000;
  asegurarGrupoTweenPuertas()?.update(tweenPuertas.simTime);

  // Si hay transición activa de puerta, el motor del juego tiene prioridad y desactiva modo manual
  if (transition?.kind === 'door') {
    tweenPuertas.modoManual = false;
  }

  // Apertura automática activada durante la fase de apertura de la transición de entrada
  if (!tweenPuertas.modoManual) {
    const enApertura = transition?.kind === 'door' && transition.at >= 0.65;
    solicitarAperturaPuerta(enApertura ? 1 : 0);
  }
}

window.HP_PUERTAS_CONTROLLER = {
  get apertura() { return tweenPuertas.apertura; },
  get objetivo() { return tweenPuertas.objetivo; },
  get estado() { return tweenPuertas.estado; },
  get enabled() { return window.HP_TWEEN_PUERTAS_ENABLED !== false; },
  abrir(duracionMs) {
    tweenPuertas.modoManual = true;
    if (duracionMs != null) window.HP_TWEEN_PUERTAS_CONFIG.duracionMs = duracionMs;
    solicitarAperturaPuerta(1);
  },
  cerrar(duracionMs) {
    tweenPuertas.modoManual = true;
    if (duracionMs != null) window.HP_TWEEN_PUERTAS_CONFIG.duracionMs = duracionMs;
    solicitarAperturaPuerta(0);
  },
  reset() {
    tweenPuertas.modoManual = false;
    if (tweenPuertas.tween) {
      tweenPuertas.tween.stop();
      tweenPuertas.grupo?.remove(tweenPuertas.tween);
      tweenPuertas.tween = null;
    }
    tweenPuertas.apertura = 0;
    tweenPuertas.objetivo = 0;
    tweenPuertas.estado = 'cerrada';
    window.HP_TWEEN_PUERTAS_CONFIG.duracionMs = 400;
  }
};

// ============================================================================
// MEJORA GRÁFICA 4: ANIMACIÓN DE PUERTAS DEL ASCENSOR CON TWEEN.JS
// ============================================================================
window.HP_TWEEN_ASCENSOR_ENABLED = true;

window.HP_TWEEN_ASCENSOR_CONFIG = {
  duracionAperturaMs: 500, // Duración nominal de apertura original: 0.50s (de t.at=0.65 a 1.15)
  duracionCierreMs: 600,   // Duración nominal de cierre original: 0.60s (de t.at=2.00 a 2.60)
  curvaApertura: 'Quadratic.InOut', // Aceleración y desaceleración suaves y mecánicas sin rebote
  curvaCierre: 'Quadratic.InOut',
  indicadorLuminoso: true   // Acompañamiento sutil de luminosidad en visor y botonera
};

const tweenAscensor = {
  apertura: 0,        // 0.0 (cerrada) a 1.0 (abierta)
  objetivo: 0,        // 0.0 o 1.0
  estado: 'cerrada',  // 'cerrada', 'abriendo', 'abierta', 'cerrando'
  modoManual: false,
  luminosidad: 0,     // 0.0 a 1.0
  tween: null,
  simTime: 0,
  grupo: typeof TWEEN !== 'undefined' ? new TWEEN.Group() : null
};

function asegurarGrupoTweenAscensor() {
  if (!tweenAscensor.grupo && typeof TWEEN !== 'undefined') {
    tweenAscensor.grupo = new TWEEN.Group();
  }
  return tweenAscensor.grupo;
}

function resolverCurvaTweenAscensor(tipo) {
  if (typeof TWEEN === 'undefined') return null;
  const nombre = tipo === 'cierre'
    ? window.HP_TWEEN_ASCENSOR_CONFIG.curvaCierre
    : window.HP_TWEEN_ASCENSOR_CONFIG.curvaApertura;
  const partes = (nombre || '').split('.');
  if (partes.length === 2 && TWEEN.Easing?.[partes[0]]?.[partes[1]]) {
    return TWEEN.Easing[partes[0]][partes[1]];
  }
  return TWEEN.Easing.Quadratic.InOut;
}

function solicitarAperturaAscensor(objetivoDeseado, duracionMs) {
  if (tweenAscensor.objetivo === objetivoDeseado) return;
  tweenAscensor.objetivo = objetivoDeseado;

  const grupo = asegurarGrupoTweenAscensor();
  if (!grupo || typeof TWEEN === 'undefined') {
    tweenAscensor.apertura = objetivoDeseado;
    tweenAscensor.luminosidad = objetivoDeseado;
    tweenAscensor.estado = objetivoDeseado === 1 ? 'abierta' : 'cerrada';
    return;
  }

  if (tweenAscensor.tween) {
    tweenAscensor.tween.stop();
    grupo.remove(tweenAscensor.tween);
    tweenAscensor.tween = null;
  }

  const distanciaRestante = Math.abs(objetivoDeseado - tweenAscensor.apertura);
  if (distanciaRestante < 0.001) {
    tweenAscensor.apertura = objetivoDeseado;
    tweenAscensor.luminosidad = objetivoDeseado;
    tweenAscensor.estado = objetivoDeseado === 1 ? 'abierta' : 'cerrada';
    return;
  }

  const duracionTotal = duracionMs || (objetivoDeseado === 1
    ? (window.HP_TWEEN_ASCENSOR_CONFIG.duracionAperturaMs || 500)
    : (window.HP_TWEEN_ASCENSOR_CONFIG.duracionCierreMs || 600));

  const duracion = Math.max(20, Math.round(duracionTotal * distanciaRestante));
  const curva = resolverCurvaTweenAscensor(objetivoDeseado === 0 ? 'cierre' : 'apertura');

  tweenAscensor.estado = objetivoDeseado === 1 ? 'abriendo' : 'cerrando';

  const estadoInterpolable = {
    open: tweenAscensor.apertura,
    luz: tweenAscensor.luminosidad
  };

  tweenAscensor.tween = new TWEEN.Tween(estadoInterpolable, grupo)
    .to({ open: objetivoDeseado, luz: objetivoDeseado }, duracion)
    .easing(curva)
    .onUpdate(() => {
      tweenAscensor.apertura = Math.max(0, Math.min(1, estadoInterpolable.open));
      tweenAscensor.luminosidad = Math.max(0, Math.min(1, estadoInterpolable.luz));
    })
    .onComplete(() => {
      tweenAscensor.apertura = objetivoDeseado;
      tweenAscensor.luminosidad = objetivoDeseado;
      tweenAscensor.estado = objetivoDeseado === 1 ? 'abierta' : 'cerrada';
      tweenAscensor.tween = null;
    })
    .start(tweenAscensor.simTime);
}

function actualizarAscensorRecepcion(dt) {
  if (data.place !== 'recepcion') {
    if (tweenAscensor.apertura !== 0 || tweenAscensor.objetivo !== 0) {
      if (tweenAscensor.tween) {
        tweenAscensor.tween.stop();
        tweenAscensor.grupo?.remove(tweenAscensor.tween);
        tweenAscensor.tween = null;
      }
      tweenAscensor.apertura = 0;
      tweenAscensor.objetivo = 0;
      tweenAscensor.luminosidad = 0;
      tweenAscensor.estado = 'cerrada';
    }
    return;
  }

  tweenAscensor.simTime += dt * 1000;
  asegurarGrupoTweenAscensor()?.update(tweenAscensor.simTime);

  if (transition?.kind === 'elevator') {
    tweenAscensor.modoManual = false;
  }

  if (!tweenAscensor.modoManual) {
    const viajeJugador = transition?.kind === 'elevator';
    const jugadorAbre = viajeJugador && transition.at >= 0.65 && transition.at < 2.0;

    const tAnciano = anciano.tAscensor || 0;
    const ancianoEnUso = anciano.visible && anciano.etapa >= recorridoAnciano.length && !anciano.ascensorTerminado;
    const ancianoAbre = ancianoEnUso && tAnciano >= 0 && tAnciano < 2.3;

    const tSilla = visitanteSilla.tAscensor || 0;
    const sillaEnUso = visitanteSilla.visible && visitanteSilla.etapa >= recorridoSilla.length && !visitanteSilla.ascensorTerminado;
    const sillaAbre = sillaEnUso && tSilla >= 0 && tSilla < 2.5;

    const rescateAbre = !!rescateRecepcion && (
      rescateRecepcion.fase === 'abrir' ||
      rescateRecepcion.fase === 'salir' ||
      rescateRecepcion.fase === 'regresar'
    );

    const debeAbrir = jugadorAbre || ancianoAbre || sillaAbre || rescateAbre;
    const objetivo = debeAbrir ? 1 : 0;

    const duracion = objetivo === 1
      ? (viajeJugador ? (window.HP_TWEEN_ASCENSOR_CONFIG.duracionAperturaMs || 500) : 600)
      : (viajeJugador ? (window.HP_TWEEN_ASCENSOR_CONFIG.duracionCierreMs || 600) : 700);

    solicitarAperturaAscensor(objetivo, duracion);
  }
}

window.HP_ASCENSOR_CONTROLLER = {
  get apertura() { return tweenAscensor.apertura; },
  get objetivo() { return tweenAscensor.objetivo; },
  get estado() { return tweenAscensor.estado; },
  get luminosidad() { return tweenAscensor.luminosidad; },
  get enabled() { return window.HP_TWEEN_ASCENSOR_ENABLED !== false; },
  abrir(duracionMs) {
    tweenAscensor.modoManual = true;
    if (duracionMs != null) window.HP_TWEEN_ASCENSOR_CONFIG.duracionAperturaMs = duracionMs;
    solicitarAperturaAscensor(1, duracionMs);
  },
  cerrar(duracionMs) {
    tweenAscensor.modoManual = true;
    if (duracionMs != null) window.HP_TWEEN_ASCENSOR_CONFIG.duracionCierreMs = duracionMs;
    solicitarAperturaAscensor(0, duracionMs);
  },
  reset() {
    tweenAscensor.modoManual = false;
    if (tweenAscensor.tween) {
      tweenAscensor.tween.stop();
      tweenAscensor.grupo?.remove(tweenAscensor.tween);
      tweenAscensor.tween = null;
    }
    tweenAscensor.apertura = 0;
    tweenAscensor.objetivo = 0;
    tweenAscensor.luminosidad = 0;
    tweenAscensor.estado = 'cerrada';
    window.HP_TWEEN_ASCENSOR_CONFIG.duracionAperturaMs = 500;
    window.HP_TWEEN_ASCENSOR_CONFIG.duracionCierreMs = 600;
  }
};

function doorLeaves(open){
  const x=310,y=164,w=148,h=108;
  const mitad=w/2;
  const desplazamiento=window.HP_TWEEN_PUERTAS_ENABLED!==false ? Math.round(mitad*open) : (mitad*open);

  ctx.save();
    ctx.imageSmoothingEnabled=false;

  // Recorta las hojas al marco de la puerta.
  ctx.beginPath();
  ctx.rect(x,y,w,h);
  ctx.clip();

  // Interior oscuro que aparece al abrirse.
  rect(x,y,w,h,'#080c10');

  for(let lado=0;lado<2;lado++){
    const hojaX=x+lado*mitad+
      (lado===0?-desplazamiento:desplazamiento);

    // Puertas opacas en azul petróleo.
    rect(hojaX,y,mitad,h,'#355b66');
    rect(hojaX+5,y+5,mitad-10,h-10,'#426e79');

    // Bordes y tiradores.
    rect(hojaX,y,3,h,'#243e48');
    rect(hojaX+mitad-3,y,3,h,'#243e48');

    const tiradorX=lado===0
      ?hojaX+mitad-12
      :hojaX+8;

    rect(tiradorX,y+43,4,24,'#d0d9d5');
  }

  ctx.restore();
}
function receptionElevator(
  open,
  inside,
  ancianoDentro=false,
  sillaDentro=false,
  rescateDentro=false
){
  const image=images.ascensor;
  if(!image.complete||!image.naturalWidth)return;

  const x=538,y=15,w=150,h=145;

  // Marco, indicador y botones permanecen quietos.
  img('ascensor',x,y,w,h);

  if(open<=0)return;

  // Zona de las hojas dentro de la imagen.
  const sx=image.naturalWidth*0.171;
  const sy=image.naturalHeight*0.191;
  const sw=image.naturalWidth*0.652;
  const sh=image.naturalHeight*0.699;

  const dx=x+w*0.171;
  const dy=y+h*0.191;
  const dw=w*0.652;
  const dh=h*0.699;

  ctx.save();
  ctx.beginPath();
  ctx.rect(dx,dy,dw,dh);
  ctx.clip();

  rect(dx,dy,dw,dh,'#05080b');

  // Dentro de la cabina, queda detrás de las puertas.
  if(inside)doctor();
  if(ancianoDentro)dibujarAnciano();
  if(sillaDentro)dibujarVisitanteSilla();
  // El camillero y Elena se dibujan DENTRO de la cabina y DETRÁS de las hojas.
  if(rescateDentro)dibujarRescateEnRecepcion();

  const desplazamiento = window.HP_TWEEN_ASCENSOR_ENABLED !== false
    ? Math.round((dw / 2) * open)
    : ((dw / 2) * open);

  ctx.drawImage(
    image,
    sx,sy,sw/2,sh,
    dx-desplazamiento,dy,dw/2,dh
  );

  ctx.drawImage(
    image,
    sx+sw/2,sy,sw/2,sh,
    dx+dw/2+desplazamiento,dy,dw/2,dh
  );

  ctx.restore();

  // Acompañamiento sutil de luminosidad en el indicador superior y botonera de llamada
  if (
    window.HP_TWEEN_ASCENSOR_ENABLED !== false &&
    window.HP_TWEEN_ASCENSOR_CONFIG.indicadorLuminoso &&
    tweenAscensor.luminosidad > 0.001
  ) {
    const alphaLuz = Math.min(0.25, tweenAscensor.luminosidad * 0.25);
    ctx.save();
    // Resplandor cálido sutil en el indicador superior de piso/dirección
    ctx.fillStyle = `rgba(255, 235, 170, ${alphaLuz})`;
    ctx.fillRect(600, 31, 26, 8);
    // Pequeño indicador de llamada en la botonera lateral
    ctx.fillStyle = `rgba(255, 215, 120, ${alphaLuz * 0.9})`;
    ctx.fillRect(673, 72, 4, 5);
    ctx.restore();
  }
}
function draw(){const padEl=layer.querySelector('.arrival-pad');if(padEl){padEl.hidden=Boolean(modal||transition||(data.place==='recepcion'&&(rescateRecepcion||['cinema1','cinema2'].includes(data.elenaReception))));}layer.classList.toggle('arrival-exterior',data.place==='exterior');layer.classList.toggle('arrival-reception',data.place==='recepcion');layer.classList.toggle('arrival-corridor',['pasillo','consultorios','gerencia'].includes(data.place));layer.classList.toggle('arrival-specialties',data.place==='consultorios');layer.classList.toggle('arrival-management',data.place==='gerencia');
 const isCorridor=['pasillo','consultorios','gerencia'].includes(data.place);
 if(isCorridor){
  const targetAspect=(window.innerWidth||1600)/(window.innerHeight||900);
  const targetW=data.place==='gerencia'?Math.min(1066,Math.max(768,Math.ceil(512*targetAspect))):data.place==='consultorios'?Math.min(1024,Math.max(768,Math.ceil(512*targetAspect))):Math.max(910,Math.ceil(512*targetAspect));
  if(canvas.width!==targetW||canvas.height!==512){
   canvas.width=targetW;
   canvas.height=512;
   layer.style.setProperty('--corridor-aspect',(targetW/512).toFixed(4));
  }
 }else{
  if(canvas.width!==768||canvas.height!==512){
   canvas.width=768;
   canvas.height=512;
   layer.style.removeProperty('--corridor-aspect');
  }
 }
 const offsetX=data.place==='pasillo'?(canvas.width-768)/2:0;
 ctx.imageSmoothingEnabled=false;
 ctx.clearRect(0,0,canvas.width,canvas.height);
 if(offsetX>0){ctx.save();ctx.translate(offsetX,0);}
 if(data.place==='exterior'){
  panoramicBackground('exterior');
  let open;
  if (window.HP_TWEEN_PUERTAS_ENABLED === false || typeof TWEEN === 'undefined') {
    open = transition?.kind === 'door' ? Math.max(0, Math.min(1, (transition.at - .65) / .4)) : 0;
  } else {
    open = tweenPuertas.apertura;
  }
  doorLeaves(open);
ctx.save();

// Al entrar, el marco oculta lo que queda sobre la abertura.
if(transition?.kind==='door'){
  ctx.beginPath();
  ctx.rect(0,164,W,H-164);
  ctx.clip();
}

doctor();
ctx.restore();  
}else{
  if(data.place==='recepcion'&&(!images.recepcion.complete||!images.recepcion.naturalWidth))floor();
    if(data.place==='recepcion'){
   // El panorámico conserva la escala del núcleo 3:2: no comprimir el mobiliario.
   panoramicBackground('recepcion');
   img('alfombraHospital',200,240,360,170);
      secretary();
         // Tapete de salida sobre el piso.
   img('tapeteSalida',256,418,256,88);

   // Umbral en el borde de la sala.
         dibujarComputadorRecepcion();
            
   // Haces de luz solar volumétrica en la recepción
   if(window.HP_EFECTOS_AMBIENTALES?.recepcion){
     window.HP_EFECTOS_AMBIENTALES.recepcion.dibujarHaces(ctx);
   }

   const viaje=transition?.kind==='elevator';
   const tiempo=viaje?transition.at:0;

   const apertura=viaje
     ?Math.max(0,Math.min(
       1,
       (tiempo-0.65)/0.5,
       (2.6-tiempo)/0.6
     ))
     :0;

   const dentro=viaje&&tiempo>=1.85;

   const tAnciano=anciano.tAscensor||0;

const aperturaAnciano=
  anciano.visible&&
  anciano.etapa>=recorridoAnciano.length
    ?Math.max(0,Math.min(
      1,
      tAnciano/0.6,
      (3-tAnciano)/0.7
    ))
    :0;

const tSilla=visitanteSilla.tAscensor||0;

const aperturaSilla=
  visitanteSilla.visible&&
  visitanteSilla.etapa>=recorridoSilla.length
    ?Math.max(0,Math.min(
      1,
      tSilla/0.6,
      (3.2-tSilla)/0.7
    ))
    :0;

const rescateDentro=!!rescateRecepcion && (
  rescateRecepcion.fase==='abrir' ||
  (['salir','regresar','entrar'].includes(rescateRecepcion.fase) &&
    Math.abs(rescateRecepcion.x-613)<4 &&
    rescateRecepcion.y<270)
);

let aperturaElevator;
if (window.HP_TWEEN_ASCENSOR_ENABLED === false || typeof TWEEN === 'undefined') {
  aperturaElevator = Math.max(apertura, aperturaAnciano, aperturaSilla, aperturaAscensorRescate());
} else {
  aperturaElevator = tweenAscensor.apertura;
}

receptionElevator(
  aperturaElevator,
  dentro,
  anciano.visible&&anciano.enCabina,
  visitanteSilla.visible&&visitanteSilla.enCabina,
  rescateDentro
);

   const cambiandoAlPasillo=
     transition?.kind==='fade'&&!transition.changed&&transition.ocultarMedica;

   const capas=[];
   if(!keivin.done&&!receptionEmergencyActive())capas.push({profundidad:keivin.y,dibujar:drawKeivin});
   if(!receptionEmergencyActive()&&visitanteSilla.visible&&!visitanteSilla.enCabina){
  capas.push({
    profundidad:visitanteSilla.y,
    dibujar:()=>dibujarVisitanteSilla()
  });
}
   if(!receptionEmergencyActive()) capas.push({
  profundidad:455,
  dibujar:()=>dibujarEmbarazada()
});
   if(!receptionEmergencyActive() && anciano.visible&&!anciano.enCabina){
  capas.push({
    profundidad:anciano.y,
    dibujar:()=>dibujarAnciano()
  });
}
   if(!receptionEmergencyActive() && visitante.visible){
  capas.push({
    profundidad:visitante.y,
    dibujar:()=>dibujarVisitante(visitante)
  });
}
   capas.push({
  profundidad:378,
  dibujar:dibujarPantallaTurnos
});
      capas.push({
     profundidad:475,
     dibujar:()=>img('dispensadorTurnos',640,400,130,80)
   });
      capas.push({
          profundidad:185,
     dibujar:()=>img('maquinaCafe',17,70,150,120)
   });
      capas.push({
          profundidad:186,
     dibujar:dibujarVaporCafe
   });

   if(martinCafe.visible&&!martinEstaSentado()){
     capas.push({profundidad:martinCafe.y,dibujar:dibujarMartinCafe});
   }
   if(window.HP_EFECTOS_AMBIENTALES?.recepcion){
     capas.push({
       profundidad: 440,
       dibujar: () => window.HP_EFECTOS_AMBIENTALES.recepcion.dibujarParticulas(ctx)
     });
   }
   chairs.forEach((chair,index)=>{
     capas.push({profundidad:chair.y,dibujar:()=>{
       // Silla frontal ya existente, recortada de su lienzo transparente.
       if(images.chair.complete&&images.chair.naturalWidth){
         ctx.drawImage(images.chair,405,370,445,575,chair.x-26,chair.y-68,52,68);
       }
       waitingPatient(chair.x,chair.y,index);
       // Los apoyabrazos quedan delante del cuerpo, sin cubrir manos ni piernas.
       if(images.chair.complete&&images.chair.naturalWidth){
         ctx.save();ctx.beginPath();
         ctx.rect(chair.x-26,chair.y-43,6,13);
         ctx.rect(chair.x+20,chair.y-43,6,13);
         ctx.clip();
         ctx.drawImage(images.chair,405,370,445,575,chair.x-26,chair.y-68,52,68);
         ctx.restore();
       }
     }});
   });

   if(receptionEmergencyActive()){
     // Último fotograma original (columna 9, fila 3), con el mismo recorte de caída.
     if(
  !['cinema1','cinema2'].includes(data.elenaReception) &&
  !rescateRecepcion?.conElena &&
  elenaReceptionImage.complete &&
  elenaReceptionImage.naturalWidth===2304 &&
  elenaReceptionImage.naturalHeight===768
){
       capas.push({profundidad:emergencyCenter.y,dibujar:()=>{
         const escala=103.4/256, izq=18,arriba=158,sw=219,sh=92;
         ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='low';ctx.filter='none';
         ctx.drawImage(elenaReceptionImage,8*256+izq,2*256+arriba,sw,sh,
           Math.round(emergencyCenter.x+(izq-128)*escala),Math.round(emergencyCenter.y+(arriba-248)*escala),sw*escala,sh*escala);
         ctx.restore();
       }});
     }
      // La parte del camillero FUERA del ascensor se recorta en el umbral.
      // La mitad dentro de la cabina ya se dibujó detrás de sus puertas.
      if(rescateRecepcion && rescateRecepcion.fase!=='abrir'){
  capas.push({profundidad:rescateRecepcion.y+1,dibujar:()=>{
    ctx.save();
    ctx.beginPath();
    ctx.rect(0,144,W,H-144);
    ctx.clip();
    dibujarRescateEnRecepcion();
    ctx.restore();
  }});
}
      // Espectadores intactos: mismas posiciones y mismos sprites.
      // Se quita solamente el médico NPC que estaba a la derecha de Elena.
      capas.push({profundidad:270,dibujar:()=>dibujarEmbarazada(350,270)});
      capas.push({profundidad:235,dibujar:()=>dibujarVisitante({
        x:430,y:235,face:'down',walking:false,distance:0
      })});
   }
   if(!dentro&&!cambiandoAlPasillo){
     capas.push({
       profundidad:actor.y,
       dibujar:doctor
     });
   }

   capas.sort((a,b)=>a.profundidad-b.profundidad);
capas.forEach(capa=>capa.dibujar());

  }else{
    if(data.place==='consultorios'){
  window.HP_CONSULTORIOS.actorX=actor.x;
  window.HP_CONSULTORIOS.dibujar(ctx,doctor);
}else if(data.place==='gerencia'){
  window.HP_GERENCIA.dibujar(ctx,doctor,actor);
}else{
   window.HP_PASILLO.dibujar(
  ctx,
  doctor,
  persona=>{
    if(persona.tipo==='medico'){
  dibujarMedicoPasillo(persona);
  return;
}
    // Aumentar los visitantes para la escala del pasillo (silla con reducción de ~14% para proporción visual)
    const escala = persona.tipo === 'silla' ? (2.2 / 1.3) * 0.86 : (2.2 / 1.3);

    ctx.save();
    ctx.translate(persona.x,persona.y);
    ctx.scale(escala,escala);
    ctx.translate(-persona.x,-persona.y);

    if(persona.tipo==='anciano'){
  dibujarAnciano(persona);
}else if(persona.tipo==='silla'){
  dibujarVisitanteSilla(persona);
}else{
  dibujarVisitante(persona);
}

    ctx.restore();
  },
  actor
);
}
  }
 }
 transitionOverlay.style.opacity=calcularAlphaTransicion(transition);
 if(offsetX>0){ctx.restore();}
}
function update(dt){
  if(modal && receptionTyping){updateReceptionEmergency(dt);return;}
  if(data.place==='recepcion'&&window.HP_EFECTOS_AMBIENTALES?.recepcion){
    window.HP_EFECTOS_AMBIENTALES.recepcion.actualizar(dt);
  }
  if(data.place==='gerencia'&&!modal){
    window.HP_EFECTOS_AMBIENTALES?.gerencia?.actualizar(dt);
    window.HP_GERENCIA.actualizarGerente(dt,actor);
  }
  if(data.place==='gerencia'&&window.HP_GERENCIA.ocupado){
    keys.clear();
    target=null;
    route=[];

    window.HP_GERENCIA.actualizar(dt);

    $('arrival-hint').textContent='Usando el ascensor…';
    $('arrival-interact').disabled=true;
    return;
  }

  if(data.place==='pasillo'){
    window.HP_PASILLO.actualizarVisitantes(dt,actor);
  }
  if(data.place==='consultorios'&&window.HP_EFECTOS_AMBIENTALES?.consultorios){
    window.HP_EFECTOS_AMBIENTALES.consultorios.actualizar(dt);
  }
  clock+=dt;
  if(modal)return;
  if(rescateRecepcion && data.place==='recepcion'){
    keys.clear();route=[];target=null;afterWalk=null;actor.walking=false;
    actualizarRescateElenaRecepcion(dt);
    saveClock+=dt;if(saveClock>.5){saveClock=0;persist();}
    $('arrival-hint').textContent='El equipo traslada a Elena de urgencia…';
    $('arrival-interact').disabled=true;
    return;
  }
  // Las cinemáticas guardadas se restauran desde start() mediante el epílogo original.
  if(
  data.place==='consultorios'&&
  window.HP_CONSULTORIOS.ocupado
){
  if(window.HP_CONSULTORIOS.tipoAcceso==='salida'&&(keys.has('s')||keys.has('arrowdown'))&&window.HP_CONSULTORIOS.cancelarSalida())return;
  keys.clear();
  target=null;
  route=[];

  window.HP_CONSULTORIOS.actualizar(dt);

  $('arrival-hint').textContent=window.HP_CONSULTORIOS.tipoAcceso==='salida'?'Volviendo al pasillo principal…':'Entrando a Hepatología…';
  $('arrival-interact').disabled=true;
  return;
}
if(data.place==='consultorios'&&!window.HP_CONSULTORIOS.ocupado){
  window.HP_CONSULTORIOS.actualizarSensor?.(actor,dt,()=>{
    route=[];afterWalk=null;target=null;keys.clear();
    window.HP_CONSULTORIOS.iniciarSalida(actor,()=>{
      const entrada=window.HP_PASILLO.entradaConsultorios;
      fadeTo('pasillo',entrada.x,entrada.y);
    });
  });
}
  if(data.place==='pasillo'&&window.HP_PASILLO.ocupado){
  keys.clear();
  target=null;
  route=[];

  window.HP_PASILLO.actualizar(dt);

  $('arrival-hint').textContent=window.HP_PASILLO.tipoViaje==='consultorios'?'Ingresando a los consultorios…':'Usando el ascensor…';
  $('arrival-interact').disabled=true;
  return;
}
  sonidoTeclado();
  sonidoSala();
  actualizarMartinCafe(dt);
  actualizarVaporCafe(dt);
  updateKeivin(dt);
  if(!receptionEmergencyActive()){actualizarVisitante(dt);actualizarAnciano(dt);} 
  if(!receptionEmergencyActive())actualizarVisitanteSilla(dt);
     if(transition?.kind==='elevator'){
   const t=transition;
   t.at+=dt;

   const anteriorX=actor.x;
   const anteriorY=actor.y;
   const limitar=v=>Math.max(0,Math.min(1,v));

   if(t.at<0.65){
     // Acercarse al centro del ascensor.
     const avance=limitar(t.at/0.65);
     actor.x=t.startX+(613-t.startX)*avance;
     actor.y=t.startY+(190-t.startY)*avance;
   }else{
     actor.x=613;

     // Esperar la apertura y entrar.
     const avance=limitar((t.at-1.15)/0.85);
     actor.y=190+(136-190)*avance;
   }

   const distancia=Math.hypot(
     actor.x-anteriorX,
     actor.y-anteriorY
   );

   actor.distance+=distancia;
   actor.walking=distancia>0.01;
   actor.face='up';

   $('arrival-hint').textContent=
     t.at<0.65?'Acercándose al ascensor…':
     t.at<1.15?'Abriendo puertas…':
     t.at<2?'Entrando al ascensor…':
     'Cerrando puertas…';

   $('arrival-interact').disabled=true;

   if(t.at>=2.85){
  actor.walking=false;

  const destino=t.destino||'pasillo';

  const entrada=destino==='gerencia'
    ?window.HP_GERENCIA.entrada
    :window.HP_PASILLO.entrada;

  fadeTo(destino,entrada.x,entrada.y,true);
}

   return;
 }
 if(transition){const t=transition;t.at+=dt;if(t.kind==='fade'){
  if(t.at>=.25&&!t.changed){t.changed=true;const origen=data.place;data.place=t.next;if(origen==='consultorios'&&t.next==='pasillo')window.HP_CONSULTORIOS.finalizarSalida();actor.x=t.x;actor.y=t.y;actor.face='down';persist();}
  if(t.at>=.5)transition=null;
 }else{const approach=296,inside=230;const before=actor.y;actor.x=t.startX+(384-t.startX)*Math.min(1,t.at/.65);
  if(t.at<.65)actor.y=t.startY+(approach-t.startY)*Math.min(1,t.at/.65);
  else if(t.at<1.05)actor.y=approach;
  else if(t.at<1.75)actor.y=approach+(inside-approach)*Math.min(1,(t.at-1.05)/.7);
  actor.distance+=Math.abs(actor.y-before);actor.walking=Math.abs(actor.y-before)>.01;actor.face='up';
  if(t.at>=2.05){data.place='recepcion';actor.x=384;actor.y=455;actor.face='up';transition={kind:'fade',at:.25,changed:true};persist();}
 }return;}
 let dx=0,dy=0;for(const k of keys){if(k==='w'||k==='arrowup')dy--;if(k==='s'||k==='arrowdown')dy++;if(k==='a'||k==='arrowleft')dx--;if(k==='d'||k==='arrowright')dx++;}
 if(!dx&&!dy&&target){const distance=Math.hypot(target.x-actor.x,target.y-actor.y);if(distance<3){target=route.shift()||null;if(!target&&afterWalk){afterWalk=false;use();}}else{dx=(target.x-actor.x)/distance;dy=(target.y-actor.y)/distance;}}
 const length=Math.hypot(dx,dy);actor.walking=false;if(length){dx=dx/length*96*dt;dy=dy/length*96*dt;const before={x:actor.x,y:actor.y};if(free(actor.x+dx,actor.y))actor.x+=dx;if(free(actor.x,actor.y+dy))actor.y+=dy;const distance=Math.hypot(actor.x-before.x,actor.y-before.y);actor.distance+=distance;actor.walking=distance>0;actor.face=Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up';if(!distance&&target){target=null;afterWalk=false;}}
 actualizarAnimacionMedica(dt);
 window.HP_AMBIENCE?.step([actor],dt);
 updateReceptionEmergency(dt);
 const i=interaction(),disponible=near(i);
$('arrival-hint').textContent=data.place==='exterior'?'Entra al Hospital Portal.':data.place==='recepcion'?(data.elenaReception==='pending'?'Acércate a Elena.':!data.receptionWelcomed?'Preséntate en recepción.':!data.managerBriefed?'Toma el ascensor al piso 2 · Gerencia.':data.firstPatientPending?'Toma el ascensor al primer piso · Consultorio 01.':'Acércate a recepción o utiliza el ascensor.'):data.place==='gerencia'?(data.managerBriefed?'Toma el ascensor al primer piso · Consultorio 01.':'Acércate al gerente y habla con él.'):data.place==='pasillo'?'Dirígete a los consultorios.':'Acércate a la puerta del consultorio 01.';
 $('arrival-interact').textContent='E · '+i.label;
 $('arrival-interact').disabled=!disponible;
 data.x=actor.x;data.y=actor.y;saveClock+=dt;if(saveClock>.5){saveClock=0;persist();}
}
document.addEventListener('visibilitychange',()=>{last=performance.now();actualizarMusica(0);});
function frame(now){if(document.hidden){last=now;requestAnimationFrame(frame);return;}const dt=Math.min((now-last)/1000||0,.05);actualizarMusica(dt);last=now;if(running&&window.HP_SINGLE_VIEW==='arrival'){update(dt);actualizarPuertasExterior(dt);actualizarAscensorRecepcion(dt);draw();$('arrival-place').textContent=data.place==='exterior'?'HOSPITAL PORTAL · EXTERIOR':data.place==='recepcion'?'PLANTA BAJA · RECEPCIÓN':data.place==='gerencia'?'PISO 2 · GERENCIA':data.place==='pasillo'?'PISO 1 · PASILLO':'PISO 1 · CONSULTORIOS';if(tutorialMovimiento&&!modal&&!transition&&data.place==='exterior'&&Math.hypot(actor.x-tutorialMovimiento.x,actor.y-tutorialMovimiento.y)>=24){tutorialMovimiento=null;dialog('Tutorial · Interactuar','Muy bien. Acércate a la entrada del hospital y pulsa E o el botón «Interactuar». También puedes tocar la puerta cuando estés cerca.',[['Continuar',()=>{}]]);}}requestAnimationFrame(frame);}
function start(){
  if(data.place==='consultorio')return false;
  readCachedSave(true);

  // Compatibilidad con partidas guardadas en las escenas antiguas.
  if(
    data.place==='recepcion' &&
    ['cinema1','cinema2','complete'].includes(data.elenaReception)
  ){
    return activarEpilogoOriginal(
      data.elenaReception==='cinema2' ? 'scene2' : 'scene1'
    );
  }

  running=true;window.HP_SINGLE_VIEW='arrival';$('hp-home').hidden=true;$('hp-day1').hidden=true;layer.style.pointerEvents='';layer.style.transition='';layer.style.opacity='';layer.hidden=false;document.body.classList.add('hospital-arrival');actor.x=data.x;actor.y=data.y;if(!free(actor.x,actor.y)){actor.x=384;actor.y=440;}canvas.focus();actualizarBotonSonidoLlegada(sonidoJuego);
  if(!tutorialOfrecido&&!window.HP_SAVED_BEFORE_BOOT&&data.place==='exterior'){
    tutorialOfrecido=true;
    dialog('Tutorial opcional','¿Quieres aprender los controles básicos antes de entrar al hospital?',[
      ['Aprender',()=>dialog('Tutorial · Movimiento','Usa las flechas o WASD para caminar. En celular, usa el joystick de la pantalla o toca el suelo. Cuando cierres este mensaje, prueba a moverte.',[['Entendido',()=>{tutorialMovimiento={x:actor.x,y:actor.y};}]])],
      ['Ahora no',()=>{}]
    ]);
  }
  persist();return true;}
function stop(){running=false;keys.clear();actor.walking=false;persist();layer.style.pointerEvents='';layer.style.transition='';layer.style.opacity='';layer.hidden=true;document.body.classList.remove('hospital-arrival');}
function activarEpilogoOriginal(escena = 'scene1') {
  const iniciar =
    window.HepatoDay1Modules?.['app.mjs']
      ?.iniciarEpilogoRecepcion;

  if (typeof iniciar !== 'function') {
    $('arrival-hint').textContent =
      'No se encontró el epílogo original de Elena.';
    return false;
  }

  // Activar primero el motor original: si falla, no perdemos el rescate.
  if (iniciar(escena) !== true) {
    $('arrival-hint').textContent = 'No se pudo iniciar el epílogo original.';
    return false;
  }
  rescateRecepcion = null;
  data.elenaReception = 'complete';

  // Persistir el punto de continuidad sin alterar la ruta del camillero.
  data.place = 'consultorio';
  persist();
  stop();
  return true;
}
window.addEventListener('keydown',e=>{if(!running||window.HP_SINGLE_VIEW!=='arrival')return;if(modal||(data.place==='recepcion'&&(rescateRecepcion||['cinema1','cinema2'].includes(data.elenaReception))))return;if(e.ctrlKey||e.metaKey||e.altKey)return;const k=e.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','e'].includes(k)){e.preventDefault();e.stopImmediatePropagation();activarAmbiente();
if(k==='e'){if(!e.repeat)use();}else if(!transition){keys.add(k);target=null;}}},true);
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>{keys.clear();actor.walking=false;persist();});document.addEventListener('visibilitychange',()=>{keys.clear();actor.walking=false;if(document.hidden)persist();});
function obtenerDestinoClicLibre(x,y){
  if(free(x,y))return {x,y};
  // FASE 2B: Proyección de destino autorizada EXCLUSIVAMENTE para la calzada exterior.
  // En todos los demás escenarios se conserva estrictamente el comportamiento original (ignorar si !free).
  if(data.place==='exterior'){
    const clampedY=Math.max(292,Math.min(490,y));
    const avance=(clampedY-292)/(512-292);
    const limiteIzq=188+(134-188)*avance+14;
    const limiteDer=582+(632-582)*avance-14;
    const clampedX=Math.max(limiteIzq,Math.min(limiteDer,x));
    if(Math.hypot(x-clampedX,y-clampedY)<=85&&free(clampedX,clampedY)){
      return {x:clampedX,y:clampedY};
    }
  }
  return null;
}
canvas.addEventListener('pointerdown',e=>{if(modal||transition||(data.place==='recepcion'&&(rescateRecepcion||['cinema1','cinema2'].includes(data.elenaReception))))return;e.preventDefault();canvas.focus();const b=canvas.getBoundingClientRect(),offsetX=(data.place==='pasillo')?(canvas.width-768)/2:0,x=((e.clientX-b.left)/b.width*canvas.width)-offsetX+(data.place==='consultorios'?window.HP_CONSULTORIOS.camaraX:(data.place==='gerencia'?(window.HP_GERENCIA.camaraX||0):0)),y=(e.clientY-b.top)/b.height*canvas.height;const i=interaction();if(Math.hypot(x-i.x,y-i.y)<70&&near(i)){use();return;}const dest=obtenerDestinoClicLibre(x,y);if(dest){walkRoute(dest.x,dest.y);afterWalk=false;keys.clear();}});
const bindArrivalJoy = window.HepatoDay1Modules?.['engine.mjs']?.bindAnalogJoystick;
if (bindArrivalJoy) {
  bindArrivalJoy(layer.querySelector('#arrival-joystick'), {
    keysSet: keys,
    canMove: () => !(modal || transition || (data.place === 'recepcion' && (rescateRecepcion || ['cinema1', 'cinema2'].includes(data.elenaReception)))),
    onMoveStart: () => { target = null; },
    onAudioUnlock: () => { desbloquearMusica(); }
  });
}
$('arrival-interact').onclick=use;$('arrival-menu').onclick=()=>{if(transition)return;stop();window.HP_SHOW_HOME();};
function actualizarBotonSonidoLlegada(estado = sonidoJuego){
  const btn=$('arrival-sound-btn');
  if(!btn)return;
  btn.textContent=estado?'Sonido: activo':'Sonido: apagado';
  btn.setAttribute('aria-pressed',String(estado));
  btn.setAttribute('aria-label',estado?'Silenciar sonido del hospital':'Activar sonido del hospital');
}
window.HP_UPDATE_ARRIVAL_SOUND_BTN=actualizarBotonSonidoLlegada;
const arrivalSoundBtn=$('arrival-sound-btn');
if(arrivalSoundBtn){
  actualizarBotonSonidoLlegada(sonidoJuego);
  arrivalSoundBtn.onclick=async(e)=>{
    if(e){e.stopPropagation();e.preventDefault();}
    const nuevoEstado=!sonidoJuego;
    sonidoJuego=nuevoEstado;
    actualizarBotonSonidoLlegada(nuevoEstado);
    try{
      const raw=JSON.parse(localStorage.getItem(KEY)||'{}');
      raw.settings=Object.assign({},raw.settings,{sound:nuevoEstado});
      localStorage.setItem(KEY,JSON.stringify(raw));
      readCachedSave(true);
    }catch{}
    window.HP_SYNC_SOUND?.(nuevoEstado);
    actualizarMusica(0);
    syncAmbienteAudioState(nuevoEstado);
    window.HP_AMBIENCE?.setEnabled(nuevoEstado);
    if(nuevoEstado){
      desbloquearMusica();
      await window.HP_AMBIENCE?.unlock();
    }
  };
  arrivalSoundBtn.onpointerdown=e=>e.stopPropagation();
}
window.HP_MEDICA = {
  get animState() { return medicaAnimState; },
  get transicionParadaEnabled() { return window.HP_MEDICA_TRANSICION_PARADA_ENABLED !== false; },
  setTransicionParadaEnabled(val) { window.HP_MEDICA_TRANSICION_PARADA_ENABLED = !!val; },
  get respiracionEnabled() { return window.HP_MEDICA_RESPIRACION_ENABLED !== false; },
  setRespiracionEnabled(val) { window.HP_MEDICA_RESPIRACION_ENABLED = !!val; }
};
window.HP_ARRIVAL={start,stop,snapshot,setPlace:(p,x,y)=>{data.place=p;if(x!=null)actor.x=x;if(y!=null)actor.y=y;persist();},getTransiciones:()=>({
    enabled:window.HP_TWEEN_TRANSICIONES_ENABLED!==false,
    transition:transition?{kind:transition.kind,at:transition.at,changed:!!transition.changed,next:transition.next}:null
  }),
  setTransicionesEnabled:(enabled)=>{
    window.HP_TWEEN_TRANSICIONES_ENABLED=!!enabled;
  },
  getPuertasExterior:()=>({apertura:tweenPuertas.apertura,objetivo:tweenPuertas.objetivo,estado:tweenPuertas.estado,enabled:window.HP_TWEEN_PUERTAS_ENABLED}),getAscensorRecepcion:()=>({apertura:tweenAscensor.apertura,objetivo:tweenAscensor.objetivo,estado:tweenAscensor.estado,luminosidad:tweenAscensor.luminosidad,enabled:window.HP_TWEEN_ASCENSOR_ENABLED}),getVaporCafe:()=>({count:vaporCafe.particulas.length,preparando:vaporCafe.preparandoJugador,enabled:window.HP_VAPOR_CAFE_ENABLED}),setPreparandoCafe:(s)=>{vaporCafe.preparandoJugador=s;},prepareElenaEmergency(){if(!data.elenaReception){data.elenaReception='pending';persist();}},clearElenaEmergency(){data.elenaReception=null;receptionTyping=null;rescateRecepcion=null;persist();},useImported(){data.place='consultorio';data.firstPatientPending=false;data.elenaReception=null;rescateRecepcion=null;persist();},startNextDay(){window.HP_PUERTAS_CONTROLLER?.reset();window.HP_ASCENSOR_CONTROLLER?.reset();data.receptionWelcomed=true;data.managerBriefed=true;Object.assign(keivin,keivinInitial());data.elenaReception=null;receptionTyping=null;rescateRecepcion=null;Object.assign(martinCafe,estadoInicialMartinCafe());martinRevision=0;data.place='exterior';data.x=384;data.y=440;data.firstPatientPending=true;actor.x=384;actor.y=440;actor.face='up';transition=null;target=null;tutorialOfrecido=true;readCachedSave(true);persist();start();},restart(){window.HP_PUERTAS_CONTROLLER?.reset();window.HP_ASCENSOR_CONTROLLER?.reset();data.managerBriefed=false;data.receptionWelcomed=false;Object.assign(keivin,keivinInitial());data.elenaReception=null;receptionTyping=null;rescateRecepcion=null;Object.assign(martinCafe,estadoInicialMartinCafe());martinRevision=0;data.place='exterior';data.x=384;data.y=440;data.firstPatientPending=true;actor.x=384;actor.y=440;actor.face='up';transition=null;target=null;readCachedSave(true);start();},get pendingFirstPatient(){return data.firstPatientPending;},patientCalled(){data.firstPatientPending=false;martinCafe.visible=false;readCachedSave(true);persist();}};
requestAnimationFrame(frame);
})();
