/* HOSPITAL PORTAL · Vestíbulo del piso. Sin dependencias ni ventanas nativas. */
(()=>{
'use strict';
const W=768,H=512;
const fondo=new Image();
fondo.src='assets/escenarios/hospital-pasillo-nuevo.png';
let viaje=null;
const clamp=n=>Math.max(0,Math.min(1,n));
// Coordenadas de las hojas en la imagen de 1672 × 941.
const puertas={
  ascensor:{x:238/1672,y:234/941,w:225/1672,h:306/941},
  consultorios:{x:1135/1672,y:249/941,w:349/1672,h:294/941}
};
function geometria(){
 const s=Math.max(W/1672,H/941),w=1672*s,h=941*s;
 return {s,x:(W-w)/2,y:(H-h)/2,w,h};
}
function puerta(id){
 const g=geometria(),p=puertas[id];
 return {x:g.x+p.x*g.w,y:g.y+p.y*g.h,w:p.w*g.w,h:p.h*g.h};
}
function punto(id){const p=puerta(id);return {x:p.x+p.w/2,y:Math.ceil(p.y+p.h+32)};}
function obstaculos(){
 const g=geometria(),y=Math.ceil(g.y+550/941*g.h);
 const base=(x1,y1,x2,y2)=>({x:g.x+x1*g.s,y:g.y+y1*g.s,w:(x2-x1)*g.s,h:(y2-y1)*g.s});
 return [
  {x:-1000,y:0,w:3000,h:y},
  {x:-1000,y:0,w:1000+(g.x+25),h:H},
  {x:g.x+g.w-25,y:0,w:1000,h:H},
  {x:-1000,y:H-24,w:3000,h:30},
  base(47,520,127,562),
  base(530,520,766,562),
  base(916,518,985,562),
  base(998,518,1062,562),
  base(1550,518,1652,562)
 ];
}
function dibujarInterior(ctx,p,tipo){
 ctx.save();ctx.translate(p.x,p.y);ctx.scale(p.w,p.h);
 const pared=ctx.createLinearGradient(0,0,1,0);
 if(tipo==='ascensor'){
  pared.addColorStop(0,'#263f49');pared.addColorStop(.18,'#667f80');pared.addColorStop(.5,'#a6b2a5');pared.addColorStop(.82,'#667f80');pared.addColorStop(1,'#263f49');
 }else{
  pared.addColorStop(0,'#284e56');pared.addColorStop(.18,'#8bb3a9');pared.addColorStop(.5,'#c9d9c7');pared.addColorStop(.82,'#8bb3a9');pared.addColorStop(1,'#284e56');
 }
 ctx.fillStyle=pared;ctx.fillRect(0,0,1,1);
 ctx.fillStyle=tipo==='ascensor'?'#4c666a':'#70958f';ctx.fillRect(.12,.12,.76,.67);
 ctx.fillStyle=tipo==='ascensor'?'#8da09a':'#b8cdc0';ctx.fillRect(.15,.15,.7,.61);
 ctx.fillStyle='#dbe1cb';ctx.fillRect(.31,.08,.38,.025);
 ctx.fillStyle='#425d60';ctx.fillRect(0,.79,1,.018);
 ctx.fillStyle=tipo==='ascensor'?'#71827b':'#91a9a1';ctx.beginPath();ctx.moveTo(.12,.81);ctx.lineTo(.88,.81);ctx.lineTo(1,1);ctx.lineTo(0,1);ctx.fill();
 ctx.strokeStyle='#718680';ctx.lineWidth=.007;ctx.beginPath();ctx.moveTo(.5,.81);ctx.lineTo(.5,1);ctx.moveTo(.02,.9);ctx.lineTo(.98,.9);ctx.stroke();
 ctx.restore();
}
function libre(x,y){
  if(!Number.isFinite(x)||!Number.isFinite(y))return false;

  // Colisión con los visitantes, alrededor de los pies.
  if(visitantes.some(p=>{
  if(!p.visible)return false;

  return Math.abs(x-p.x)<(p.tipo==='silla'?46:30)&&
         Math.abs(y-p.y)<(p.tipo==='silla'?22:18);
}))return false;

  const g=geometria();
  const minX=g.x+28;
  const maxX=g.x+g.w-28;

  return x>=minX&&x<=maxX&&y>=265&&y<=487&&
    !obstaculos().some(o=>
      x+9>o.x&&
      x-9<o.x+o.w&&
      y+5>o.y&&
      y-5<o.y+o.h
    );
}
function interaccion(actor){
 const a={
  ...punto('ascensor'),
  id:'volver-recepcion',
  label:'Usar ascensor'
};
 const b={...punto('consultorios'),id:'paso-consultorios',label:'Pasar a consultorios'};
 return Math.hypot(actor.x-a.x,actor.y-a.y)<Math.hypot(actor.x-b.x,actor.y-b.y)?a:b;
}
function iniciar(id,actor,alTerminar){
 if(viaje||!['volver-recepcion','paso-consultorios'].includes(id))return false;
 const tipo=id==='volver-recepcion'?'ascensor':'consultorios';
 const destino=punto(tipo);
 if(Math.hypot(actor.x-destino.x,actor.y-destino.y)>=65)return false;
 viaje={tipo,t:0,x:actor.x,y:actor.y,actor,alTerminar};
 actor.face='up';actor.walking=false;
 return true;
}
function actualizar(dt){
 if(!viaje)return;
 const v=viaje,p=puerta(v.tipo),a=v.actor;
 v.t+=Math.max(0,Math.min(dt,.05));
 const anteriorX=a.x,anteriorY=a.y;
 const entrada=punto(v.tipo),interior=p.y+p.h-8;
 if(v.t<.45){const f=clamp(v.t/.45);a.x=v.x+(entrada.x-v.x)*f;a.y=v.y+(entrada.y-v.y)*f;}
 else if(v.t<1.05){a.x=entrada.x;a.y=entrada.y;}
 else {a.x=entrada.x;a.y=entrada.y+(interior-entrada.y)*clamp((v.t-1.05)/.85);}
 const d=Math.hypot(a.x-anteriorX,a.y-anteriorY);
 a.distance+=d;a.walking=d>.001;a.face='up';
 if(v.t>=3){
  const callback=v.alTerminar;
  // Dejar una posición válida incluso si aún no existe el próximo escenario.
  a.x=entrada.x;
  a.y=entrada.y;
  a.walking=false;

  // Ocultarla durante la transición a recepción.
  if(v.tipo==='ascensor'||v.tipo==='consultorios'){
    a.y=-200;
  }
  viaje=null;
  callback?.(v.tipo);
 }
}

if (typeof window !== 'undefined') {
  if (typeof window.HP_LETRERO_CONSULTORIOS_ANIM_ENABLED === 'undefined') {
    window.HP_LETRERO_CONSULTORIOS_ANIM_ENABLED = true;
  }
  if (typeof window.HP_ASCENSOR_INDICADORES_ANIM_ENABLED === 'undefined') {
    window.HP_ASCENSOR_INDICADORES_ANIM_ENABLED = true;
  }
}

function dibujarLetreroConsultorios(ctx, g) {
  // Letrero «CONSULTORIOS» sobre el dintel de consultorios
  // Bounding box en textura nativa (1672x941): x: 1133, y: 164, w: 355, h: 95
  const lx = g.x + 1133 * g.s;
  const ly = g.y + 164 * g.s;
  const lw = 355 * g.s;
  const lh = 95 * g.s;

  const t = (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;
  // Ciclo senoidal continuo de 3.8 segundos (respiración suave claramente distinguible a escala normal)
  const ciclo = 0.5 + 0.5 * Math.sin(t * (Math.PI * 2 / 3.8));
  const alpha = 0.09 + 0.14 * ciclo; // Rango claramente visible entre 0.09 y 0.23

  ctx.save();
  ctx.beginPath();
  // Interior de la placa en la imagen original: x 1175–1449, y 171–203.
  ctx.rect(g.x + 1175 * g.s, g.y + 171 * g.s, 274 * g.s, 32 * g.s);
  ctx.clip();

  ctx.globalCompositeOperation = 'screen';

  // 1. Capa difusa base que cubre uniformemente toda la superficie del letrero
  ctx.fillStyle = `rgba(180, 235, 255, ${alpha * 0.75})`;
  ctx.fillRect(lx, ly, lw, lh);

  // 2. Resplandor interno que realza el texto blanco institucional y la caja de luz
  const grad = ctx.createLinearGradient(lx, ly, lx, ly + lh);
  grad.addColorStop(0, `rgba(235, 250, 255, ${alpha * 0.9})`);
  grad.addColorStop(0.5, `rgba(255, 255, 255, ${alpha * 1.35})`);
  grad.addColorStop(1, `rgba(170, 230, 250, ${alpha * 0.8})`);

  ctx.fillStyle = grad;
  ctx.fillRect(lx, ly, lw, lh);
  ctx.restore();
}

function dibujarIndicadoresAscensor(ctx, g, viajeActual) {
  // Panel display digital sobre el ascensor en textura nativa (1672x941):
  // x: 320, y: 192, w: 66, h: 25
  const px = g.x + 320 * g.s;
  const py = g.y + 192 * g.s;
  const pw = 66 * g.s;
  const ph = 25 * g.s;

  // Botón pulsador de llamada en pared derecha:
  // x: 472, y: 355, w: 12, h: 18
  const bx = g.x + 472 * g.s;
  const by = g.y + 355 * g.s;
  const bw = 12 * g.s;
  const bh = 18 * g.s;

  const esAscensor = viajeActual && viajeActual.tipo === 'ascensor';

  if (!esAscensor) {
    // 1. ESTADO REPOSO:
    // Standby tenue: indicadores perceptibles tras cristal ahumado suave, botón apagado
    ctx.save();
    ctx.beginPath();
    ctx.rect(px, py, pw, ph);
    ctx.clip();
    ctx.fillStyle = 'rgba(12, 18, 24, 0.40)';
    ctx.fillRect(px, py, pw, ph);
    ctx.restore();
  } else if (viajeActual.t < 0.45) {
    // 2. ESTADO LLAMADO:
    // Botonera de llamada intensamente iluminada en ámbar cálido con halo visible
    ctx.save();
    ctx.fillStyle = 'rgba(255, 185, 30, 0.95)';
    ctx.shadowColor = 'rgba(255, 170, 0, 0.9)';
    ctx.shadowBlur = 8 * g.s;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(bx, by, bw, bh, 3 * g.s);
    else ctx.rect(bx, by, bw, bh);
    ctx.fill();
    ctx.restore();

    // Display superior respondiendo con pulso luminoso ámbar
    ctx.save();
    ctx.beginPath();
    ctx.rect(px, py, pw, ph);
    ctx.clip();
    ctx.globalCompositeOperation = 'screen';
    const pulso = 0.45 + 0.35 * Math.sin(viajeActual.t * 16);
    ctx.fillStyle = `rgba(255, 205, 50, ${pulso})`;
    ctx.fillRect(px, py, pw, ph);
    ctx.restore();
  } else if (viajeActual.t < 1.05) {
    // 3. ESTADO LLEGADA / APERTURA:
    // Confirmación nítida con resplandor institucional verde esmeralda brillante
    ctx.save();
    ctx.beginPath();
    ctx.rect(px, py, pw, ph);
    ctx.clip();
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = 'rgba(50, 255, 170, 0.70)';
    ctx.shadowColor = 'rgba(50, 255, 170, 0.8)';
    ctx.shadowBlur = 6 * g.s;
    ctx.fillRect(px, py, pw, ph);
    ctx.restore();
  } else {
    // 4. ESTADO ABORDAJE / CIERRE / VIAJE A RECEPCIÓN:
    // Indicador en marcha activo con resplandor dorado
    ctx.save();
    ctx.beginPath();
    ctx.rect(px, py, pw, ph);
    ctx.clip();
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = 'rgba(255, 180, 50, 0.60)';
    ctx.fillRect(px, py, pw, ph);
    ctx.restore();
  }
}

function dibujar(ctx,dibujarMedica,dibujarVisitante,medica){
 ctx.save();
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 if(!fondo.complete||!fondo.naturalWidth){
  ctx.fillStyle='#eef1ef';ctx.fillRect(0,0,W,H);
  ctx.fillStyle='#254f5b';ctx.font='16px sans-serif';ctx.textAlign='center';
  ctx.fillText('Cargando pasillo…',W/2,H/2);ctx.restore();dibujarMedica();return;
 }
 const g=geometria();

 // Extensiones laterales continuas y coherentes para pantallas ultra-panorámicas
 const canvasW=ctx.canvas?.width||W;
 const offsetX=(canvasW-768)/2;
 const visLeft=-offsetX;
 const visRight=768+offsetX;

 if(visLeft<g.x){
  // Tira limpia del lateral izquierdo (pared, franja turquesa, rodapié y líneas del suelo sin muebles ni puertas)
  ctx.drawImage(fondo,1,0,2,fondo.naturalHeight,visLeft-1,g.y,(g.x-visLeft)+2,g.h);
 }
 if(visRight>g.x+g.w){
  // Tira limpia del lateral derecho (pared, franja turquesa, rodapié y líneas del suelo sin muebles ni puertas)
  ctx.drawImage(fondo,fondo.naturalWidth-3,0,2,fondo.naturalHeight,g.x+g.w-1,g.y,(visRight-(g.x+g.w))+2,g.h);
 }

 ctx.drawImage(fondo,g.x,g.y,g.w,g.h);
 if(window.HP_EFECTOS_AMBIENTALES?.pasillo){
  window.HP_EFECTOS_AMBIENTALES.pasillo.dibujarHaces(ctx);
 }

 if(window.HP_LETRERO_CONSULTORIOS_ANIM_ENABLED !== false){
  dibujarLetreroConsultorios(ctx, g);
 }
 if(window.HP_ASCENSOR_INDICADORES_ANIM_ENABLED !== false){
  dibujarIndicadoresAscensor(ctx, g, viaje);
 }

 let dentro=false;
 if(viaje){
  const v=viaje,p=puerta(v.tipo);
  let abierta;
  if (window.HP_TWEEN_ASCENSOR_ENABLED === false || typeof TWEEN === 'undefined') {
    abierta=Math.min(clamp((v.t-.45)/.5),clamp((2.9-v.t)/.7));
  } else {
    const u = clamp((v.t - .45) / .5);
    const w = clamp((2.9 - v.t) / .7);
    abierta = Math.min(
      TWEEN.Easing.Quadratic.InOut(u),
      TWEEN.Easing.Quadratic.InOut(w)
    );
  }
  dentro=v.t>=1.7;
  if(abierta>0){
   ctx.save();ctx.beginPath();ctx.rect(p.x,p.y,p.w,p.h);ctx.clip();
   dibujarInterior(ctx,p,v.tipo);
   if(dentro)dibujarMedica();
   const src=puertas[v.tipo];
   const sx=src.x*fondo.naturalWidth,sy=src.y*fondo.naturalHeight;
   const sw=src.w*fondo.naturalWidth,sh=src.h*fondo.naturalHeight;
   const desplazamiento = window.HP_TWEEN_ASCENSOR_ENABLED !== false ? Math.round(p.w / 2 * abierta) : (p.w / 2 * abierta);
   ctx.drawImage(fondo,sx,sy,sw/2,sh,p.x-desplazamiento,p.y,p.w/2,p.h);
   ctx.drawImage(fondo,sx+sw/2,sy,sw/2,sh,p.x+p.w/2+desplazamiento,p.y,p.w/2,p.h);
   ctx.restore();
  }
 }
 ctx.restore();
 const capas=[];

if(dibujarVisitante){
  for(const p of visitantes){
    if(p.visible){
      capas.push({
        profundidad:p.y,
        dibujar:()=>dibujarVisitante(p)
      });
    }
  }
}

if(!dentro){
  capas.push({
    profundidad:medica?.y??0,
    dibujar:dibujarMedica
  });
}

if(window.HP_EFECTOS_AMBIENTALES?.pasillo){
  capas.push({
    profundidad:440,
    dibujar:()=>window.HP_EFECTOS_AMBIENTALES.pasillo.dibujarParticulas(ctx)
  });
}

capas.sort((a,b)=>a.profundidad-b.profundidad);
capas.forEach(capa=>capa.dibujar());
}
function margenesSalida(){
  let lateralExtra=120;
  if(typeof window!=='undefined'&&window.innerWidth&&window.innerHeight){
    const aspect=window.innerWidth/window.innerHeight;
    const targetW=Math.max(910,Math.ceil(512*aspect));
    lateralExtra=Math.max(71,(targetW-768)/2);
  }
  const minX=Math.round(-lateralExtra-140);
  const maxX=Math.round(768+lateralExtra+140);
  return {minX,maxX};
}

const visitantes=[
  {
    tipo:'anciano',
    carril:'superior',
    x:-220,
    y:370,
    face:'right',
    velocidad:32,
    esperaInicial:0.5,
    espera:0.5,
    distance:0,
    walking:false,
    visible:false,
    completado:false
  },
  {
    tipo:'medico',
    carril:'inferior',
    x:980,
    y:436,
    face:'left',
    velocidad:40,
    esperaInicial:2.0,
    espera:2.0,
    distance:0,
    walking:false,
    visible:false,
    completado:false
  },
  {
    tipo:'silla',
    carril:'superior',
    x:-220,
    y:370,
    face:'right',
    velocidad:30,
    esperaInicial:10.0,
    espera:10.0,
    distance:0,
    walking:false,
    visible:false,
    completado:false
  },
  {
    tipo:'visitante',
    carril:'inferior',
    x:980,
    y:436,
    face:'left',
    velocidad:38,
    esperaInicial:12.5,
    espera:12.5,
    distance:0,
    walking:false,
    visible:false,
    completado:false
  }
];

let visitaActiva=false;

function reiniciarVisita(){
  const m=margenesSalida();
  for(const p of visitantes){
    p.completado=false;
    p.walking=false;
    p.distance=0;
    p.visible=false;
    p.espera=p.esperaInicial;
    if(p.carril==='superior'){
      p.x=m.minX;
      p.y=370;
      p.face='right';
    }else{
      p.x=m.maxX;
      p.y=436;
      p.face='left';
    }
  }
  visitaActiva=true;
}

function actualizarVisitantes(dt,medica){
  if(window.HP_EFECTOS_AMBIENTALES?.pasillo){
    window.HP_EFECTOS_AMBIENTALES.pasillo.actualizar(dt);
  }
  if(!visitaActiva){
    reiniciarVisita();
  }

  const m=margenesSalida();

  for(const p of visitantes){
    p.walking=false;

    // Si ya completó su único recorrido, permanece desactivado
    if(p.completado){
      p.visible=false;
      continue;
    }

    // Espera inicial escalonada
    if(p.espera>0){
      p.espera=Math.max(0,p.espera-dt);
      if(p.espera>0)continue;
      // Spawn limpio fuera de la pantalla visible
      p.visible=true;
      p.distance=0;
      if(p.face==='right'){
        p.x=m.minX;
        p.y=370;
      }else{
        p.x=m.maxX;
        p.y=436;
      }
    }

    if(!p.visible)continue;

    // Detección de médica delante en el carril
    let bloqueaMedica=false;
    if(medica){
      if(p.face==='right'){
        bloqueaMedica=medica.x>p.x&&(medica.x-p.x)<46&&Math.abs(medica.y-p.y)<26;
      }else{
        bloqueaMedica=medica.x<p.x&&(p.x-medica.x)<46&&Math.abs(medica.y-p.y)<26;
      }
    }

    // Detección de otro NPC delante en el mismo carril
    const bloqueaOtro=visitantes.some(otro=>{
      if(otro===p||!otro.visible||otro.completado||otro.carril!==p.carril)return false;
      if(p.face==='right'){
        return otro.x>p.x&&(otro.x-p.x)<56;
      }else{
        return otro.x<p.x&&(p.x-otro.x)<56;
      }
    });

    if(bloqueaMedica||bloqueaOtro){
      p.walking=false;
      continue;
    }

    const paso=p.velocidad*dt;
    if(p.face==='right'){
      p.x+=paso;
      p.distance+=paso;
      p.walking=true;
      p.y=370;

      // Salida completa por el extremo derecho panorámico
      if(p.x>=m.maxX){
        p.visible=false;
        p.walking=false;
        p.completado=true;
      }
    }else{
      p.x-=paso;
      p.distance+=paso;
      p.walking=true;
      p.y=436;

      // Salida completa por el extremo izquierdo panorámico
      if(p.x<=m.minX){
        p.visible=false;
        p.walking=false;
        p.completado=true;
      }
    }
  }
}
window.HP_PASILLO={
  visitantes,
  actualizarVisitantes,
  reiniciarVisitantes:reiniciarVisita,
  dibujar,actualizar,interaccion,obstaculos,libre,iniciar,
  cancelar(){if(viaje)viaje.actor.walking=false;viaje=null;},
  get ocupado(){return !!viaje;},
  get tipoViaje(){return viaje?.tipo||null;},
  get entrada(){return punto('ascensor');},
  get entradaConsultorios(){return punto('consultorios');},
  get limites(){
    const g=geometria();
    return {
      x:Math.round(g.x+28),
      y:255,
      w:Math.round(g.w-56),
      h:240
    };
  }
};
})();
