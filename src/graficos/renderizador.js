/* Embedded original source: src/graficos/renderizador.js */

/* HEPATO-2 — Renderizador compartido */
window.HepatoSharedModules['renderer.mjs'] = (() => {

const {ROOM,FOOT,nearestInteraction,isFree} =
  window.HepatoSharedModules['engine.mjs'];
const {pixelLabel} =
  window.HepatoSharedModules['pixel-art.mjs'];
const {paintClinic} =
  window.HepatoSharedModules['room-art.mjs'];
const {
  drawActor,spritePortrait,frameForActor,
  spritePalette,SPRITE_CELL
} = window.HepatoSharedModules['character-sprites.mjs'];
const {SPRITE_ART} =
  window.HepatoSharedModules['character-art.mjs'];
const {paintBedLinen} =
  window.HepatoSharedModules['bed-linen.mjs'];
const {furniturePixelIsSolid,FURNITURE_MASKS} =
  window.HepatoSharedModules['furniture-masks.mjs'];

const roomLayers = new WeakMap();
const breathPatches = new WeakMap();
const seatStates = new WeakMap();

// ============================================================================
// FASE 3B-2: INTERRUPTORES DE SEGURIDAD (MONITORES DEL CONSULTORIO)
// ============================================================================
if (typeof window.HP_MONITOR_ESCRITORIO_ANIM_ENABLED === 'undefined') {
  window.HP_MONITOR_ESCRITORIO_ANIM_ENABLED = true;
}
if (typeof window.HP_ECOGRAFO_STANDBY_ENABLED === 'undefined') {
  window.HP_ECOGRAFO_STANDBY_ENABLED = true;
}

// RECURSOS GRAFICOS
function loadSprite(path) {
  const img = new Image();
  img.src = path;
  return img;
}
const medicaAtlas =
  loadSprite("assets/sprites/personajes/medica-atlas.png");
const martinAtlas =
  loadSprite("assets/sprites/pacientes/martin/martin_spritesheet.png");
  const sofiaAtlas =
  loadSprite("assets/sprites/pacientes/sofia/sofia-atlas.png");
  const sofiaSentadaFrente =
  loadSprite("assets/sprites/pacientes/sofia/sofia_sentada_frente.png");
  const sofiaCamilla =
  loadSprite("assets/sprites/pacientes/sofia/sofia_subir_camilla.png");
  const martinSentado =
  loadSprite("assets/sprites/pacientes/martin/martin_sentado_frente.png");
  const martinCamilla =
  loadSprite("assets/sprites/pacientes/martin/martin_subir_camilla.png");

function dibujarSofiaCamilla(ctx, actor) {
  if (actor.resident || !loaded(sofiaCamilla)) return false;

  const sofia = window.HepatoDay1Modules
    ?.['simulation-cases.mjs']
    ?.PATIENT_CATALOG
    ?.['gilbert-v1-reasoning-v2'];

  if (!sofia || actor.appearance !== sofia.patient.appearance) {
    return false;
  }

  const accion = actor.animation?.action;
  const subiendo = accion === 'mount';
  const bajando = accion === 'dismount';

  if (!subiendo && !bajando && actor.pose !== 'lying') {
    return false;
  }

  // Hoja de 3 columnas × 2 filas.
  const celdaW = sofiaCamilla.naturalWidth / 3;
  const celdaH = sofiaCamilla.naturalHeight / 2;

  let cuadro = 5;

  if (subiendo || bajando) {
    const progreso = Math.max(
      0,
      Math.min(1, actor.animation.progress ?? 0)
    );

    cuadro = Math.min(5, Math.floor(progreso * 6));
    if (bajando) cuadro = 5 - cuadro;
  }

  // Límites visibles medidos en la hoja aprobada de Sofía.
  const limites = [
    [82, 61, 366, 611],
    [31, 78, 372, 619],
    [51, 83, 367, 567],
    [81, 25, 397, 552],
    [50, 32, 364, 558],
    [54, 29, 337, 577]
  ];

  const [izq, arriba, der, abajo] = limites[cuadro];
  const escalaX = celdaW / 418;
  const escalaY = celdaH / 627;

  const anchoOrigen = (der - izq) * escalaX;
  const altoOrigen = (abajo - arriba) * escalaY;

  // Escala equivalente a la aprobada para Sofía.
  const factor = 48 / (550 * escalaY);
  const ancho = anchoOrigen * factor;
  const alto = altoOrigen * factor;

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  ctx.drawImage(
    sofiaCamilla,
    (cuadro % 3) * celdaW + izq * escalaX,
    Math.floor(cuadro / 3) * celdaH + arriba * escalaY,
    anchoOrigen,
    altoOrigen,
    Math.round(
      actor.x - ancho / 2 + [3, 8, 5, 2, 0, 0][cuadro]
    ),
    Math.round(actor.y - alto),
    ancho,
    alto
  );

  ctx.restore();
  return true;
}

function dibujarMartinCamilla(ctx, actor) {
  if (actor.resident || !loaded(martinCamilla)) return false;

  const martin = window.HepatoDay1Modules
    ?.['simulation-cases.mjs']
    ?.PATIENT_CATALOG
    ?.['masld-intro-v1-reasoning-v2'];

  if (!martin || actor.appearance !== martin.patient.appearance) {
    return false;
  }

  const accion = actor.animation?.action;
  const subiendo = accion === 'mount';
  const bajando = accion === 'dismount';

  if (!subiendo && !bajando && actor.pose !== 'lying') {
    return false;
  }

  // La hoja contiene tres columnas y dos filas.
  const celdaW = martinCamilla.naturalWidth / 3;
  const celdaH = martinCamilla.naturalHeight / 2;

  let cuadro = 5;

  if (subiendo || bajando) {
    const progreso = Math.max(
      0,
      Math.min(1, actor.animation.progress ?? 0)
    );

    cuadro = Math.min(5, Math.floor(progreso * 6));
    if (bajando) cuadro = 5 - cuadro;
  }

  // Límites visibles medidos en la imagen original de 1254 × 1254.
  const limites = [
    [69, 70, 374, 609],
    [32, 79, 384, 612],
    [39, 79, 364, 560],
    [81, 31, 399, 545],
    [61, 33, 358, 550],
    [62, 33, 331, 567]
  ];

  const [izq, arriba, der, abajo] = limites[cuadro];
  const escalaX = celdaW / 418;
  const escalaY = celdaH / 627;
  const anchoOrigen = (der - izq) * escalaX;
  const altoOrigen = (abajo - arriba) * escalaY;

  // Una escala común conserva las proporciones entre poses.
  const factor = 48.6 / (539 * escalaY);
  const ancho = anchoOrigen * factor;
  const alto = altoOrigen * factor;

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  ctx.drawImage(
    martinCamilla,
    (cuadro % 3) * celdaW + izq * escalaX,
    Math.floor(cuadro / 3) * celdaH + arriba * escalaY,
    anchoOrigen,
    altoOrigen,
    Math.round(
  actor.x - ancho / 2 + [3, 8, 5, 2, 0, 0][cuadro]
),
    Math.round(actor.y - alto),
    ancho,
    alto
  );

  ctx.restore();
  return true;
}
const doctoraSillaSecuencia =
  loadSprite("assets/sprites/personajes/doctora-silla-secuencia.png");
const escritorioImagen =
  loadSprite("assets/sprites/mobiliario/escritorio.png");
const sillaPacienteImagen =
  loadSprite("assets/sprites/mobiliario/silla-paciente.png");
const medicaExamenImagen =
  loadSprite("assets/sprites/personajes/medica-examen.png");

const lavamanosMonitorImagen =
  loadSprite("assets/sprites/mobiliario/lavamanos-monitor.png");

const plantaConsultorioImagen =
  loadSprite("assets/sprites/mobiliario/planta-consultorio.png");

const ecografoConsultorioImagen =
  loadSprite("assets/sprites/mobiliario/ecografo-consultorio.png");

const camillaConsultorioImagen =
  loadSprite("assets/sprites/mobiliario/camilla-consultorio.png");

const paredFondoImagen =
  loadSprite("assets/sprites/mobiliario/pared-fondo.png");

const gabinetesImagen =
  loadSprite("assets/sprites/mobiliario/gabinetes.png");

const loaded = img => img.complete && img.naturalWidth > 0;

function dibujarMedicaExamen(ctx, actor, time) {
  if (
    !actor.resident ||
    !loaded(medicaExamenImagen) ||
    actor.seated
  ) return false;

  const examinando =
    actor.pose === 'examining' ||
    actor.animation?.action === 'examine';

  if (!examinando) return false;

  // Recortes corregidos: todos mantienen
  // los pies en el mismo punto de apoyo.
  const cuadros = [
    {sx:484,  sy:0,   dy:0},
    {sx:893,  sy:0,   dy:0},
    {sx:1335, sy:0,   dy:0},
    {sx:444,  sy:362, dy:2},
    {sx:904,  sy:362, dy:2},
    {sx:1360, sy:362, dy:2}
  ];

  // Sincronizar con la animacion real del examen.
  let indice;

  if (
    actor.animation?.action === 'examine' &&
    Number.isInteger(actor.animation.frame)
  ) {
    indice = Math.max(
      0, Math.min(5, actor.animation.frame)
    );
  } else {
    indice = Math.floor(
      Math.max(0, time) * 6
    ) % cuadros.length;
  }

  const f = cuadros[indice];

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  ctx.drawImage(
    medicaExamenImagen,
    f.sx, f.sy,
    360, 362,
    Math.round(actor.x) - 23,
    Math.round(actor.y) - 54 + f.dy,
    46, 56
  );

  ctx.restore();
  return true;
}
// MEDICA DE PIE Y CAMINANDO

function dibujarMedicaAtlas(ctx, actor, time){
  if(
    !actor.resident||!loaded(medicaAtlas)||
    actor.seated||actor.pose==='lying'
  )return false;

  const frame=frameForActor(actor,time);

  const examinando=
    actor.pose==='examining'||
    actor.animation?.action==='examine'||
    frame.action==='examine';

  if(!examinando&&!['idle','walk'].includes(frame.action)){
    return false;
  }

  const face=examinando
    ?(actor.animation?.face||actor.face||'right')
    :frame.face;

  const fila={down:0,up:1,left:2,right:3}[face];
  if(fila===undefined)return false;

  const caminando=!examinando&&frame.action==='walk';

  const columna=caminando
    ?1+Math.floor((actor.distance||0)/10)%6
    :0;

  const anchoCelda=medicaAtlas.naturalWidth/7;
  const altoCelda=medicaAtlas.naturalHeight/4;

  const pies=[
    [237,237,240,239,237,240,240],
    [234,234,238,236,232,237,234],
    [237,237,238,238,238,235,237],
    [237,237,238,238,238,235,237]
  ];

  const centroX=[128,128,124,132];

  // Tamaño independiente para el consultorio.
  const tamaño=56.55;
  const factor=tamaño/256;

  ctx.save();
  ctx.imageSmoothingEnabled=true;
  ctx.imageSmoothingQuality='high';

  ctx.drawImage(
    medicaAtlas,
    columna*anchoCelda,
    fila*altoCelda,
    anchoCelda,
    altoCelda,
    actor.x-centroX[fila]*factor,
    actor.y-pies[fila][columna]*factor,
    tamaño,
    tamaño
  );

  ctx.restore();
  return true;
}

// CONTROL DE ANIMACION DE SENTARSE
function seatVisualState(ctx,actor,time) {
  let state = seatStates.get(ctx);

  if(!state) {
    state = {
      seated:!!actor.seated,
      transition:null
    };
    seatStates.set(ctx,state);
  }

  const nativeAction =
    ['sit','stand'].includes(actor.animation?.action)
      ? actor.animation.action
      : null;

  if(state.seated !== !!actor.seated) {
    state.seated = !!actor.seated;
    state.transition = nativeAction
      ? null
      : {
          action:actor.seated ? 'sit' : 'stand',
          start:time
        };
  }

  if(nativeAction) {
    state.transition = null;
    return {
      action:nativeAction,
      progress:Math.max(0,Math.min(
        1,actor.animation.progress||0
      ))
    };
  }

  if(state.transition) {
    const progress = Math.max(0,Math.min(
      1,(time-state.transition.start)/0.8
    ));

    const result = {
      action:state.transition.action,
      progress
    };

    if(progress >= 1) state.transition = null;
    return result;
  }

  return null;
}

// SILLA Y MEDICA SENTADA
function dibujarSillaYMedica(ctx,actor,transition) {
  if(!actor.resident ||
     !loaded(doctoraSillaSecuencia)) return false;

  const seat = ROOM.seat;
  const close = Math.hypot(
    actor.x-seat.x,
    actor.y-seat.y
  ) < 14;

  if(!close ||
     actor.pose === 'examining' ||
     actor.pose === 'lying') return false;

  if(!actor.seated && !transition) return false;

  // Fotogramas del atlas de 4 columnas x 3 filas.
  // Ajustes individuales para reducir saltos de posicion.
  const frames = [
    {row:1,col:0,dx:-3,dy:-10},
    {row:1,col:1,dx:-3,dy:-5},
    {row:1,col:2,dx:-3,dy:-5},
    {row:1,col:3,dx:-3,dy:-5},
    {row:2,col:3,dx:0,dy:0}
  ];

  let index = frames.length-1;

  if(transition) {
    const step = Math.min(
      frames.length-1,
      Math.floor(transition.progress*frames.length)
    );

    index = transition.action === 'stand'
      ? frames.length-1-step
      : step;
  }

  const f = frames[index];

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  ctx.drawImage(
    doctoraSillaSecuencia,
    f.col*362,f.row*362,362,362, 
Math.round(seat.x)-31+f.dx,
Math.round(seat.y)-60+f.dy,
62,62
  );

  ctx.restore();
  return true;
}

// RESPIRACION Y PARPADEO DE PERSONAJES ORIGINALES
const materialAt = (rows,x,y) =>
  SPRITE_ART.palette[rows[y]?.charCodeAt(x)-0xe000];

function breathingPatch(rows,palette,landmarks) {
  let palettes = breathPatches.get(rows);
  if(!palettes) {
    palettes = new WeakMap();
    breathPatches.set(rows,palettes);
  }
  if(palettes.has(palette)) return palettes.get(palette);

  const patch = new Map();
  const top = landmarks.reclining
    ? landmarks.shoulders.y+2
    : landmarks.crown+15;
  const bottom = Math.min(top+8,landmarks.pelvis.y-3);

  for(let y=top;y<bottom;y++) {
    for(let x=18;x<=30;x++) {
      const from = materialAt(rows,x,y);
      const to = materialAt(rows,x,y+1);
      if(!from || !to) continue;

      const fabric = from.material?.startsWith('coat')
        ? 'coat'
        : from.material?.startsWith('top')
          ? 'top' : null;

      if(!fabric ||
         !to.material?.startsWith(fabric) ||
         to.material===from.material) continue;

      patch.set(
        y*SPRITE_CELL.width+x,
        palette[rows[y+1][x]]
      );
    }
  }

  if(!landmarks.reclining &&
     ['left','right'].includes(landmarks.face)) {
    const left = landmarks.face==='left';
    const cloth = p => p && (
      p.material==='ink' ||
      p.material?.startsWith('top') ||
      p.material?.startsWith('coat')
    );

    for(let y=landmarks.crown+16;
        y<Math.min(landmarks.crown+22,
                   landmarks.pelvis.y-4);y++) {
      const occupied = [...rows[y]]
        .map((c,x)=>palette[c]?x:null)
        .filter(x=>x!==null);

      const edge = left
        ? occupied[0]
        : occupied[occupied.length-1];

      if(!Number.isFinite(edge) ||
         !cloth(materialAt(
           rows,edge+(left?1:-1),y
         ))) continue;

      const start = left
        ? edge-1 : Math.max(24,edge-5);
      const end = left
        ? Math.min(24,edge+5) : edge+1;

      for(let x=start;x<=end;x++) {
        const from = materialAt(rows,x,y);
        const sourceX = x+(left?1:-1);
        const to = materialAt(rows,sourceX,y);

        if((from &&
            from.material!==undefined &&
            !cloth(from)) ||
           !cloth(to)) continue;

        patch.set(
          y*SPRITE_CELL.width+x,
          palette[rows[y][sourceX]]
        );
      }
    }
  }

  palettes.set(palette,patch);
  return patch;
}

// Martín: atlas original de 9 columnas y 4 filas.
// La primera columna es reposo; las ocho siguientes son caminata.
function dibujarMartinAtlas(ctx, actor) {
  if (actor.resident || actor.visible === false || !loaded(martinAtlas)) {
    return false;
  }

  const catalogo = window.HepatoDay1Modules?.['simulation-cases.mjs']?.PATIENT_CATALOG;
  const martin = catalogo?.['masld-intro-v1-reasoning-v2'];

  // El actor conserva la referencia de apariencia del caso que lo creó.
  // Evita aplicar el sprite a otros pacientes con ropa o colores parecidos.
  if (!martin || actor.appearance !== martin.patient.appearance) return false;

  const accion = actor.animation?.action;

  if (
    ['lying', 'examining'].includes(actor.pose) ||
    (accion && !['sit', 'stand'].includes(accion))
  ) return false;

  if (actor.seated) {
    if (!loaded(martinSentado)) return false;

    // Recorta el margen transparente de la imagen aprobada.
    const w = martinSentado.naturalWidth;
    const h = martinSentado.naturalHeight;
    const sx = w * 400 / 1254;
    const sy = h * 164 / 1254;
    const sw = w * 455 / 1254;
    const sh = h * 956 / 1254;

    const alto = 48.6;
    const ancho = alto * sw / sh;

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      martinSentado,
      sx, sy, sw, sh,
      Math.round(actor.x - ancho / 2),
      Math.round(actor.y - alto - 5),
      ancho, alto
    );
    ctx.restore();
    return true;
  }

  if (martinAtlas.naturalWidth !== 2304 || martinAtlas.naturalHeight !== 1024) {
    return false;
  }

  const fila = {down:0, up:1, left:2, right:3}[actor.face || 'down'];
  if (fila === undefined) return false;

  // La fase avanza con la distancia real; al detenerse usa la vista quieta.
  const distancia = Number.isFinite(actor.distance) ? Math.max(0, actor.distance) : 0;
  const columna = actor.walking ? 1 + Math.floor(distancia / 4) % 8 : 0;
  const celda = 256;
  const tamaño = 54;
  const factor = tamaño / celda;
  const apoyoX = 128;
  const apoyoY = 248;

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    martinAtlas,
    columna * celda, fila * celda, celda, celda,
    Math.round(actor.x - apoyoX * factor),
    Math.round(actor.y - apoyoY * factor),
    tamaño, tamaño
  );
  ctx.restore();
  return true;
}
// =====================================================
// SOFÍA — ATLAS PERSONALIZADO 4 FILAS × 9 COLUMNAS
// =====================================================


function dibujarSofiaAtlas(ctx, actor) {
  if (
    actor.resident ||
    actor.visible === false ||
    !loaded(sofiaAtlas)
  ) return false;

  const sofia = window.HepatoDay1Modules
    ?.['simulation-cases.mjs']
    ?.PATIENT_CATALOG
    ?.['gilbert-v1-reasoning-v2'];

  if (
    !sofia ||
    actor.appearance !== sofia.patient.appearance
  ) return false;

  const accion = actor.animation?.action;

  // Cuando Sofía está sentada en la silla del consultorio,
  // usar el sprite frontal aprobado.
  if (actor.seated) {
    if (!loaded(sofiaSentadaFrente)) return false;

    const w = sofiaSentadaFrente.naturalWidth;
    const h = sofiaSentadaFrente.naturalHeight;

    // Recorte útil del PNG.
    const sx = w * 403 / 1254;
    const sy = h * 124 / 1254;
    const sw = w * 437 / 1254;
    const sh = h * 1022 / 1254;

    const alto = 55;
    const ancho = alto * sw / sh;

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      sofiaSentadaFrente,
      sx, sy, sw, sh,
      Math.round(actor.x - ancho / 2),
      Math.round(actor.y - alto + 1),
      ancho,
      alto
    );
    ctx.restore();
    return true;
  }

  // La camilla ya la dibuja dibujarSofiaCamilla().
  if (
    ['lying', 'examining'].includes(actor.pose) ||
    (accion && !['walk', 'sit', 'stand'].includes(accion))
  ) return false;

  const filas = {
    right: 0,
    left: 1,
    down: 2,
    up: 3
  };

  const direccion =
    actor.animation?.face || actor.face || 'down';

  const fila = filas[direccion];
  if (fila === undefined) return false;

  const distancia = Number.isFinite(actor.distance)
    ? Math.max(0, actor.distance)
    : 0;

  const caminando =
    actor.walking || accion === 'walk';

  const columna = caminando
    ? 1 + Math.floor(distancia / 4) % 8
    : 0;

  // SOFÍA — Atlas original aprobado.
const celda = 256;
const tamaño = 60;
const escala = tamaño / celda;

ctx.save();
ctx.imageSmoothingEnabled = false;

ctx.drawImage(
  sofiaAtlas,
  columna * celda,
  fila * celda,
  celda,
  celda,
  Math.round(actor.x - 128 * escala),
  Math.round(actor.y - 246 * escala),
  tamaño,
  tamaño
);

ctx.restore();
  return true;
}

// DIBUJADO DE PERSONAJES
function drawLivingActor(
  ctx,r,actor,time,animate,seatTransition=null
) {
  if (dibujarMartinCamilla(ctx, actor)) return;
if (dibujarSofiaCamilla(ctx, actor)) return;
if (dibujarMartinAtlas(ctx, actor)) return;

if (dibujarSofiaAtlas(ctx, actor)) return;

// ELENA — Atlas personalizado de 4 filas x 9 columnas.
const elenaAtlas = drawLivingActor.elenaAtlas ??=
  loadSprite('assets/sprites/pacientes/elena/elena-atlas.png');

const elena = window.HepatoDay1Modules
  ?.['simulation-cases.mjs']
  ?.PATIENT_CATALOG
  ?.['masld-older-v1-reasoning-v2'];
// ELENA — Sentada de frente en el consultorio.
if (
  !actor.resident &&
  actor.visible !== false &&
  elena &&
  actor.appearance === elena.patient.appearance &&
  actor.seated &&
  !['lying', 'examining'].includes(actor.pose)
) {
  const elenaSentada = drawLivingActor.elenaSentada ??=
    loadSprite('assets/sprites/pacientes/elena/elena_sentada_frente.png');

  if (loaded(elenaSentada)) {

    const w = elenaSentada.naturalWidth;
    const h = elenaSentada.naturalHeight;

    // Recortar los márgenes transparentes del PNG.
    const sx = w * 383 / 1254;
    const sy = h * 103 / 1254;
    const sw = w * 476 / 1254;
    const sh = h * 1078 / 1254;

    // Elena sentada: tamaño ajustado al consultorio.
const alto = 50;
const ancho = alto * sw / sh;

ctx.save();
ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      elenaSentada,
      sx, sy, sw, sh,
      Math.round(actor.x - ancho / 2),
      Math.round(actor.y - alto -4),
      ancho,
      alto
    );

    ctx.restore();
    return;
  }
}
if (
  !actor.resident &&
  actor.visible !== false &&
  elena &&
  actor.appearance === elena.patient.appearance &&
  !actor.seated &&
  !['lying', 'examining'].includes(actor.pose) &&
  loaded(elenaAtlas) &&
  elenaAtlas.naturalWidth === 2304 &&
  elenaAtlas.naturalHeight === 1024
) {
  const filas = {
    down: 0,
    up: 1,
    left: 2,
    right: 3
  };

  const direccion =
    actor.animation?.face || actor.face || 'down';

  const fila = filas[direccion];

  if (fila !== undefined) {
    const caminando =
      actor.walking ||
      actor.animation?.action === 'walk';

    const distancia = Number.isFinite(actor.distance)
      ? Math.max(0, actor.distance)
      : 0;

    const columna = caminando
      ? 1 + Math.floor(distancia / 4) % 8
      : 0;

    // ELENA — Atlas original con renderizado de alta calidad.
const celda = 256;

// Escala uniforme, igual que en la emergencia.
const escala = 55 / 232;

// Recorte conservador que mantiene la misma
// referencia de posición en todos los fotogramas.
const izq = 50;
const arriba = 5;
const sw = 156;
const sh = 247;

const dx = Math.round(
  actor.x + (izq - 128) * escala
);

const dy = Math.round(
  actor.y + (arriba - 246) * escala
);

ctx.save();

ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = 'high';

ctx.drawImage(
  elenaAtlas,
  columna * celda + izq,
  fila * celda + arriba,
  sw,
  sh,
  dx,
  dy,
  sw * escala,
  sh * escala
);

ctx.restore();
    return;
  }
}

  if(actor.resident) {
  if(dibujarSillaYMedica(
    ctx,actor,seatTransition
  )) return;

  if(dibujarMedicaExamen(ctx,actor,time)) return;

  if(dibujarMedicaAtlas(ctx,actor,time)) return;
}

  if(!animate ||
     actor.walking ||
     actor.animation ||
     !Number.isFinite(time)) {
    drawActor(r,actor,time);
    return;
  }

  const frame = frameForActor(actor,time);
  const {rows,face,landmarks} = frame;

  if(!landmarks ||
     !['idle','sit','lie'].includes(frame.action)) {
    drawActor(r,actor,time);
    return;
  }

  const palette = spritePalette(
    actor.appearance,actor.resident
  );
  const patch = new Map();

  const identity =
    String(actor.appearance?.style||'short')+
    String(actor.appearance?.hair||'');

  const seed = [...identity].reduce(
    (n,c)=>(n+c.charCodeAt(0))%97,0
  );

  const offset = actor.resident ? 1.73 : seed/97;
  const period = actor.resident ? 4.9 : 5.4;
  const phase = (Math.max(0,time)+offset)%period;
  const blink = phase>period-.15;

  if(blink && face!=='up' && !landmarks.reclining) {
    for(const eye of landmarks.eyes||[]) {
      for(let y=eye.y;y<=eye.y+1;y++) {
        for(let x=eye.x-1;x<=eye.x+1;x++) {
          if(materialAt(rows,x,y)?.material!=='eye')
            continue;

          patch.set(
            y*SPRITE_CELL.width+x,
            y===eye.y
              ? palette.skin
              : palette.skinShade
          );
        }
      }
    }
  }

  const breath = (Math.max(0,time)+offset)%4.2;
  if(breath>1.2 && breath<2.9) {
    for(const [key,color] of breathingPatch(
      rows,palette,landmarks
    )) patch.set(key,color);
  }

  if(!patch.size) {
    drawActor(r,actor,time);
    return;
  }

  const ox = Math.round(actor.x)-SPRITE_CELL.anchorX;
  const oy = Math.round(actor.y)-SPRITE_CELL.anchorY;

  drawActor((x,y,w,h,color)=>{
    const localX = x-ox;
    const localY = y-oy;

    const replacement = w===1 && h===1 &&
      patch.get(
        localY*SPRITE_CELL.width+localX
      );

    r(x,y,w,h,replacement||color);
  },actor,time);

  for(const [key,color] of patch) {
    const x = key%SPRITE_CELL.width;
    const y = Math.floor(key/SPRITE_CELL.width);

    if(!palette[rows[y]?.[x]])
      r(ox+x,oy+y,1,1,color);
  }
}

// CAPAS DEL CONSULTORIO
function createArtCanvas(ctx,w,h) {
  const c = ctx.canvas.ownerDocument
    ? ctx.canvas.ownerDocument.createElement('canvas')
    : new ctx.canvas.constructor(w,h);

  c.width=w;
  c.height=h;
  return c;
}

function getRoomLayers(ctx,room) {
  const cached = roomLayers.get(ctx);
  const paredLista = loaded(paredFondoImagen);
const gabinetesListos = loaded(gabinetesImagen);
const lavamanosMonitorListo = loaded(lavamanosMonitorImagen);
const plantaConsultorioLista = loaded(plantaConsultorioImagen);
const ecografoConsultorioListo = loaded(ecografoConsultorioImagen);
const camillaConsultorioLista = loaded(camillaConsultorioImagen);

if (
  cached?.model === room.walls &&
  cached.paredLista === paredLista &&
  cached.gabinetesListos === gabinetesListos &&
  cached.lavamanosMonitorListo === lavamanosMonitorListo &&
  cached.plantaConsultorioLista === plantaConsultorioLista &&
  cached.ecografoConsultorioListo === ecografoConsultorioListo &&
  cached.camillaConsultorioLista === camillaConsultorioLista
) return cached;

  const c = createArtCanvas(
    ctx,room.width,room.height
  );
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;

  paintClinic((x,y,w,h,color)=>{
    g.fillStyle=color;
    g.fillRect(x,y,w,h);
  });

  const pixels = g.getImageData(
    0,0,room.width,room.height
  );

  c.width=room.width;
g.putImageData(pixels,0,0);

// HEPATO-2: retirar la arquitectura antigua.
// Conservamos el piso y el zócalo inferior.

g.clearRect(
  0, 0,
  room.width,
  room.floor.y
);

// Retirar los laterales antiguos.
g.clearRect(
  0,
  room.floor.y,
  room.floor.x,
  room.floor.h
);

g.clearRect(
  room.floor.x + room.floor.w,
  room.floor.y,
  room.width - room.floor.x - room.floor.w,
  room.floor.h
);

  const foreground = new Map();

  for(const id of Object.keys(FURNITURE_MASKS)) {
    const points = FURNITURE_MASKS[id]
      .polygons.flat();

    const left = Math.max(0,Math.floor(
      Math.min(...points.map(p=>p[0]))
    ));
    const top = Math.max(0,Math.floor(
      Math.min(...points.map(p=>p[1]))
    ));
    const right = Math.min(room.width,Math.ceil(
      Math.max(...points.map(p=>p[0]))
    ));
    const bottom = Math.min(room.height,Math.ceil(
      Math.max(...points.map(p=>p[1]))
    ));

    const width=right-left;
    const height=bottom-top;

    const mask=createArtCanvas(ctx,width,height);
    const mg=mask.getContext('2d');
    const data=mg.createImageData(width,height);

    for(let y=top;y<bottom;y++) {
      for(let x=left;x<right;x++) {
        const i=(y*room.width+x)*4;
        if(furniturePixelIsSolid(id,x,y)) {
          data.data.set(
            pixels.data.subarray(i,i+4),
            ((y-top)*width+x-left)*4
          );
        }
      }
    }

    mg.putImageData(data,0,0);
    foreground.set(id,{canvas:mask,x:left,y:top});
  }

  // GABINETES Y MESADA PNG
  // Reemplaza la mascara del mobiliario antiguo.
  // Conserva sus capas y su ubicacion original.

  if (gabinetesListos) {

  foreground.set('wall-cabinets', {
    canvas: gabinetesImagen,
    x: 209,
    y: 8,
    w: 118,
    h: 76
  });

}
if (lavamanosMonitorListo) {

  foreground.set('sink', {
    canvas: lavamanosMonitorImagen,
    x: 18,
    y: 86,
    w: 96,
    h: 72
  });

}
if (plantaConsultorioLista) {

  foreground.set('plant', {
    canvas: plantaConsultorioImagen,
    x: 312,
    y: 158,
    w: 52,
    h: 60
  });

}
if (ecografoConsultorioListo) {

  foreground.set('equipment', {
    canvas: ecografoConsultorioImagen,
    x: 315,
    y: 75,
    w: 48,
    h: 88
  });

}
if (camillaConsultorioLista) {

  // Recortar los margenes transparentes del PNG original.
  // Conservar los detalles en alta resolucion.

  const cCamilla = createArtCanvas(ctx, 441, 976);
  const gCamilla = cCamilla.getContext('2d');

  gCamilla.imageSmoothingEnabled = false;

  gCamilla.drawImage(
    camillaConsultorioImagen,
    335, 220, 441, 976,
    0, 0, 441, 976
  );

  foreground.set('couch', {
  canvas: cCamilla,
  x: 283,
  y: 81,
  w: 38,
  h: 102
});

}
  // Piso continuo, detras del mobiliario.
  // Piso ampliado visualmente hasta los bordes interiores.
// No modifica las colisiones ni las zonas caminables.

// Piso ampliado hacia arriba y hacia los lados.
// Solo cambia el dibujo, no las colisiones.

const {
  x:sueloX,
  y:sueloY,
  w:sueloW,
  h:sueloH
}=room.floor;

const fx=sueloX-16;
const fw=sueloW+32;

const fy=sueloY-16;
const fh=sueloH+16;

  for(let y=fy;y<fy+fh;y+=16) {
    for(let x=fx;x<fx+fw;x+=16) {
      const alternate=(
        Math.floor((x-sueloX)/16)+
        Math.floor((y-sueloY)/16)
      )%4===0;

      g.fillStyle=alternate
        ? '#b9c8d2'
        : '#b6c4cf';

      g.fillRect(
        x,y,
        Math.min(16,fx+fw-x),
        Math.min(16,fy+fh-y)
      );
    }
  }

  g.fillStyle='#a5b7c7';

  for(let x=fx+16;x<fx+fw;x+=16)
    g.fillRect(x,fy,1,fh);

  for(let y=fy+16;y<fy+fh;y+=16)
    g.fillRect(fx,y,fw,1);

  // NUEVA PARED PNG
// Se dibuja sobre la arquitectura original,
// despues del piso y antes de reponer los muebles.
if (paredLista) {
  g.imageSmoothingEnabled = false;

  g.drawImage(
    paredFondoImagen,
    0, -18,
    room.width,
    room.height
  );
}

const retired=new Set([
    'stool',
    'chair',
    'patient-chair',
    'chair-front',
    'patient-chair-front',
    'desk'
  ]);
  if (ecografoConsultorioListo) {
  retired.add('equipment');
}
if (gabinetesListos) {
  retired.add('wall-cabinets');
}
if (lavamanosMonitorListo) {
  retired.add('sink');
}
if (plantaConsultorioLista) {
  retired.add('plant');
}
if (camillaConsultorioLista) {
  retired.add('couch');
}
  for(const [id,asset] of foreground) {
    if(!retired.has(id))
      g.drawImage(asset.canvas,asset.x,asset.y);
  }

  const result={
    model:room.walls,
    paredLista,
    gabinetesListos,
    lavamanosMonitorListo,
    plantaConsultorioLista,
    ecografoConsultorioListo,
    camillaConsultorioLista,
    canvas:c,
    foreground
  };

  roomLayers.set(ctx,result);
  return result;
}

// PUERTA DEL CONSULTORIO
// PUERTA DEL CONSULTORIO
// Apertura alineada con el nuevo PNG.

function drawOpenDoor(ctx,r,background,amount) {

  const open = Math.max(
    0,
    Math.min(1,amount || 0)
  );

  if(open === 0) return;

  // Interior de la puerta nueva.
  // La pared PNG esta desplazada -18 px.
  const doorX = 74;
  const doorY = 12;
  const doorW = 33;
  const doorH = 62;

  // Hueco oscuro dentro del marco.
  r(doorX,doorY,doorW,doorH,'#1d324d');

  r(
    doorX+1,
    doorY+1,
    doorW-2,
    doorH-2,
    '#314a62'
  );

  // Detalles del marco interior.
  r(doorX+1,doorY+1,doorW-2,2,'#52697a');

  r(
    doorX+1,
    doorY+doorH-3,
    doorW-2,
    3,
    '#10253e'
  );

  // La hoja se estrecha al abrirse.
  const leafWidth = Math.max(
    5,
    Math.round(doorW-(doorW-5)*open)
  );

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  ctx.drawImage(
    background,
    doorX,doorY,doorW,doorH,
    doorX,doorY,leafWidth,doorH
  );

  // Canto visible de la puerta.
  r(
    doorX+leafWidth-1,
    doorY+1,
    1,
    doorH-2,
    '#91654b'
  );

  ctx.restore();
}

// ============================================================================
// MEJORA GRÁFICA 2: PARTÍCULAS DE POLVO EN LOS RAYOS SOLARES DEL CONSULTORIO
// ============================================================================
if (typeof window.HP_POLVO_SOLAR_ENABLED === 'undefined') {
  window.HP_POLVO_SOLAR_ENABLED = true;
}

// Configuración para Tercera Persona (Consultorio 01)
const POLVO_SOLAR_CONFIG = {
  CANTIDAD: 24, // AJUSTE: 24 partículas activas (rango solicitado: 18–28)
  Y_MIN: 92,
  Y_MAX: 175,
  // Haz solar principal delimitado por los vértices (126,91) -> (197,91) -> (238,176) -> (146,176)
  getXMin: (y) => 126 + (20 * (y - 91)) / 85,
  getXMax: (y) => 197 + (41 * (y - 91)) / 85,
  COLORES: [
    'rgba(255, 255, 248, ', // Blanco cálido brillante
    'rgba(255, 250, 222, ', // Crema luminoso
    'rgba(255, 242, 190, ', // Amarillo dorado suave
    'rgba(255, 236, 172, '  // Ámbar sol radiante
  ]
};

function reiniciarParticulaPolvo(p, stagger = false) {
  const y = POLVO_SOLAR_CONFIG.Y_MIN + Math.random() * (POLVO_SOLAR_CONFIG.Y_MAX - POLVO_SOLAR_CONFIG.Y_MIN);
  const t = (y - 91) / 85;
  const minX = 126 + 20 * t + 1.5;
  const maxX = 197 + 41 * t - 2.5;
  p.y = y;
  p.baseX = minX + Math.random() * Math.max(2, maxX - minX);
  p.x = p.baseX;

  // Variación de tamaños pixel art: 55% 1x1, 35% 2x2, 10% 2x1/3x2 px para profundidad
  const rSize = Math.random();
  if (rSize < 0.55) {
    p.w = 1; p.h = 1; p.size = 1;
  } else if (rSize < 0.90) {
    p.w = 2; p.h = 2; p.size = 2;
  } else {
    p.w = 3; p.h = 2; p.size = 2;
  }

  // Movimiento lento y orgánico: 65% asciende suave, 35% desciende suave
  const asciende = Math.random() < 0.65;
  p.vy = asciende ? -(1.1 + Math.random() * 2.4) : (0.5 + Math.random() * 1.6);
  p.vx = (Math.random() - 0.5) * 0.45;

  // Suave oscilación horizontal sinusoidal
  p.swayAmp = 0.9 + Math.random() * 1.5;
  p.swayFreq = 1.0 + Math.random() * 1.5;
  p.swayPhase = Math.random() * Math.PI * 2;

  // AJUSTE: Opacidad aumentada para legibilidad inmediata sin buscar el efecto (0.38 - 0.62)
  p.maxAlpha = 0.38 + Math.random() * 0.24;
  p.colorPrefix = POLVO_SOLAR_CONFIG.COLORES[Math.floor(Math.random() * POLVO_SOLAR_CONFIG.COLORES.length)];

  // Duración de vida entre 4.0s y 7.0s
  p.life = 4.0 + Math.random() * 3.0;
  p.age = stagger ? Math.random() * p.life : 0;
}

const particulasPolvoSolar = [];
for (let i = 0; i < POLVO_SOLAR_CONFIG.CANTIDAD; i++) {
  const p = {};
  reiniciarParticulaPolvo(p, true);
  particulasPolvoSolar.push(p);
}
let ultimoTiempoPolvoSolar = 0;
let cachedDeskViewElem = null;

function actualizarYRenderizarPolvoSolar(ctx, time, animate) {
  if (window.HP_POLVO_SOLAR_ENABLED === false) return;

  // No renderizar en el canvas 3P si la vista en primera persona (escritorio POV) está visible
  if (!cachedDeskViewElem || !cachedDeskViewElem.isConnected) {
    cachedDeskViewElem = document.querySelector('.hp-desk-view');
  }
  if (cachedDeskViewElem && !cachedDeskViewElem.hidden) return;

  const dt = (ultimoTiempoPolvoSolar > 0 && time > ultimoTiempoPolvoSolar)
    ? Math.min(0.05, Math.max(0.001, time - ultimoTiempoPolvoSolar))
    : 0.016;
  ultimoTiempoPolvoSolar = time;

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  for (let i = 0; i < particulasPolvoSolar.length; i++) {
    const p = particulasPolvoSolar[i];

    if (animate) {
      p.age += dt;
      p.y += p.vy * dt;
      p.baseX += p.vx * dt;
      p.x = p.baseX + Math.sin(p.swayPhase + p.age * p.swayFreq) * p.swayAmp;

      const t = (p.y - 91) / 85;
      const minX = 126 + 20 * t + 1;
      const maxX = 197 + 41 * t - 2;

      if (p.age >= p.life || p.y < POLVO_SOLAR_CONFIG.Y_MIN || p.y > POLVO_SOLAR_CONFIG.Y_MAX || p.x < minX || p.x > maxX) {
        reiniciarParticulaPolvo(p, false);
      }
    }

    const progress = p.age / p.life;
    if (progress <= 0 || progress >= 1) continue;

    // Curva sinusoidal de opacidad con pico reforzado
    const alpha = Math.max(0, Math.min(0.68, p.maxAlpha * Math.sin(progress * Math.PI)));
    if (alpha < 0.02) continue;

    ctx.fillStyle = p.colorPrefix + alpha.toFixed(3) + ')';
    ctx.fillRect(Math.round(p.x), Math.round(p.y), p.w || p.size, p.h || p.size);
  }

  ctx.restore();
}

// ============================================================================
// POLVO SOLAR EN PRIMERA PERSONA (POV / ESCRITORIO DEL CONSULTORIO)
// ============================================================================
const POLVO_SOLAR_POV_CONFIG = {
  CANTIDAD: 18, // Rango solicitado: 14–22 partículas en primera persona
  Y_MIN: 25,
  Y_MAX: 320,
  // Haz diagonal proveniente de la ventana norte-oeste del consultorio
  getXMin: (y) => 25 + (30 * (y - 25)) / 295,
  getXMax: (y) => 270 + (90 * (y - 25)) / 295,
  COLORES: [
    'rgba(255, 255, 246, ', // Blanco cálido solar brillante
    'rgba(255, 248, 220, ', // Crema luminoso
    'rgba(255, 240, 188, ', // Dorado translúcido
    'rgba(250, 232, 172, '  // Ámbar luz ventana
  ]
};

function reiniciarParticulaPolvoPOV(p, stagger = false) {
  const y = POLVO_SOLAR_POV_CONFIG.Y_MIN + Math.random() * (POLVO_SOLAR_POV_CONFIG.Y_MAX - POLVO_SOLAR_POV_CONFIG.Y_MIN);
  const t = (y - 25) / 295;
  const minX = 25 + 30 * t + 3;
  const maxX = 270 + 90 * t - 5;
  p.y = y;
  p.baseX = minX + Math.random() * Math.max(3, maxX - minX);
  p.x = p.baseX;

  // Tamaños en primera persona adaptados a la proximidad del fondo (1–3 px)
  const rSize = Math.random();
  if (rSize < 0.25) {
    p.w = 1; p.h = 1; p.size = 1;
  } else if (rSize < 0.70) {
    p.w = 2; p.h = 2; p.size = 2;
  } else {
    p.w = 3; p.h = 2; p.size = 3;
  }

  // Movimiento ambiental lento y suave
  const asciende = Math.random() < 0.65;
  p.vy = asciende ? -(2.0 + Math.random() * 3.5) : (1.0 + Math.random() * 2.2);
  p.vx = (Math.random() - 0.5) * 0.6;

  // Deriva horizontal sinusoidal relajada
  p.swayAmp = 1.2 + Math.random() * 1.8;
  p.swayFreq = 0.8 + Math.random() * 1.2;
  p.swayPhase = Math.random() * Math.PI * 2;

  // Opacidad visualmente presente pero sin estorbar la lectura del fondo (pico entre 0.48 y 0.72)
  p.maxAlpha = 0.48 + Math.random() * 0.24;
  p.colorPrefix = POLVO_SOLAR_POV_CONFIG.COLORES[Math.floor(Math.random() * POLVO_SOLAR_POV_CONFIG.COLORES.length)];

  p.life = 4.5 + Math.random() * 3.0;
  p.age = stagger ? Math.random() * p.life : 0;
}

const particulasPolvoPOV = [];
for (let i = 0; i < POLVO_SOLAR_POV_CONFIG.CANTIDAD; i++) {
  const p = {};
  reiniciarParticulaPolvoPOV(p, true);
  particulasPolvoPOV.push(p);
}

function actualizarYRenderizarPolvoPOV(ctx, dt = 0.016, animate = true) {
  if (!ctx || !ctx.canvas) return;
  if (window.HP_POLVO_SOLAR_ENABLED === false) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    return;
  }

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.save();
  ctx.imageSmoothingEnabled = false;

  for (let i = 0; i < particulasPolvoPOV.length; i++) {
    const p = particulasPolvoPOV[i];

    if (animate) {
      p.age += dt;
      p.y += p.vy * dt;
      p.baseX += p.vx * dt;
      p.x = p.baseX + Math.sin(p.swayPhase + p.age * p.swayFreq) * p.swayAmp;

      const t = (p.y - 25) / 295;
      const minX = 25 + 30 * t + 1;
      const maxX = 270 + 90 * t - 2;

      if (p.age >= p.life || p.y < POLVO_SOLAR_POV_CONFIG.Y_MIN || p.y > POLVO_SOLAR_POV_CONFIG.Y_MAX || p.x < minX || p.x > maxX) {
        reiniciarParticulaPolvoPOV(p, false);
      }
    }

    const progress = p.age / p.life;
    if (progress <= 0 || progress >= 1) continue;

    const alpha = Math.max(0, Math.min(0.75, p.maxAlpha * Math.sin(progress * Math.PI)));
    if (alpha < 0.02) continue;

    ctx.fillStyle = p.colorPrefix + alpha.toFixed(3) + ')';
    ctx.fillRect(Math.round(p.x), Math.round(p.y), p.w || p.size, p.h || p.size);
  }

  ctx.restore();
}

window.HP_POLVO_SOLAR_INFO = {
  get count3P() { return particulasPolvoSolar.length; },
  get count1P() { return particulasPolvoPOV.length; },
  get count() { return particulasPolvoSolar.length; },
  get particles3P() {
    return particulasPolvoSolar.map(p => ({
      x: Math.round(p.x),
      y: Math.round(p.y),
      w: p.w || p.size,
      h: p.h || p.size,
      size: p.size,
      age: p.age,
      life: p.life,
      alpha: Math.max(0, p.maxAlpha * Math.sin((p.age / p.life) * Math.PI))
    }));
  },
  get particles1P() {
    return particulasPolvoPOV.map(p => ({
      x: Math.round(p.x),
      y: Math.round(p.y),
      w: p.w || p.size,
      h: p.h || p.size,
      size: p.size,
      age: p.age,
      life: p.life,
      alpha: Math.max(0, p.maxAlpha * Math.sin((p.age / p.life) * Math.PI))
    }));
  },
  get particles() { return this.particles3P; },
  get enabled() { return window.HP_POLVO_SOLAR_ENABLED !== false; }
};

// RENDER PRINCIPAL
function render(ctx,p,{
  time=0,
  debug=false,
  paused=false,
  patient=null,
  room=ROOM,
  animate=true,
  clickPulse=null,
  showPatientCue=false,
  emergencyElena=null,
  rescueOrderly=null,
  rescueElena=null,
  rescueBlack=false,
  phoneRinging=false,
  economyState=null
}={}) {
  if(!ctx.canvas.ownerDocument)
    ctx.canvas.width=ctx.canvas.width;

  ctx.save();
  ctx.imageSmoothingEnabled=false;
  ctx.scale(
    ctx.canvas.width/room.width,
    ctx.canvas.height/room.height
  );
  ctx.clearRect(0,0,room.width,room.height);

  const r=(x,y,w,h,color)=>{
    ctx.fillStyle=color;
    ctx.fillRect(
      Math.round(x),Math.round(y),
      Math.round(w),Math.round(h)
    );
  };

  const roomArt=getRoomLayers(ctx,room);
  const background=roomArt.canvas;
  ctx.drawImage(background,0,0);
  // HEPATO-2: iluminacion natural desde la ventana.
// Version mas visible y marcada sobre el piso.

ctx.save();

// Haz principal de luz.
ctx.fillStyle = 'rgba(220,238,255,0.18)';

ctx.beginPath();
ctx.moveTo(126,91);
ctx.lineTo(197,91);
ctx.lineTo(238,176);
ctx.lineTo(146,176);
ctx.closePath();
ctx.fill();

// Haz secundario, mas concentrado.
ctx.fillStyle = 'rgba(235,246,255,0.12)';

ctx.beginPath();
ctx.moveTo(145,94);
ctx.lineTo(183,94);
ctx.lineTo(214,165);
ctx.lineTo(165,165);
ctx.closePath();
ctx.fill();

// Reflejo central.
ctx.fillStyle = 'rgba(255,255,255,0.07)';

ctx.beginPath();
ctx.moveTo(158,97);
ctx.lineTo(177,97);
ctx.lineTo(199,151);
ctx.lineTo(173,151);
ctx.closePath();
ctx.fill();

ctx.restore();

// MEJORA GRÁFICA 2: Partículas de polvo dentro de los rayos solares del consultorio
if (!rescueBlack && !emergencyElena && (!room || !room.id || room.id === 'consultorio')) {
  actualizarYRenderizarPolvoSolar(ctx, time, animate && !paused);
}

  // HEPATO-2: sombras de contacto del escritorio.
// Se dibujan sobre el piso, detrás de muebles y personajes.

ctx.save();

ctx.fillStyle = 'rgba(31,47,63,0.21)';

// Sombras debajo de las patas.
ctx.fillRect(146,198,21,3);
ctx.fillRect(215,198,21,3);

// Extensión suave de las sombras.
ctx.fillStyle = 'rgba(31,47,63,0.09)';

ctx.fillRect(143,201,27,2);
ctx.fillRect(212,201,27,2);
// Sombra de contacto del ecografo.
ctx.fillStyle = 'rgba(31,47,63,0.18)';
ctx.fillRect(321,160,37,3);

// Sombra de contacto de la planta.
ctx.fillStyle = 'rgba(31,47,63,0.20)';
ctx.fillRect(324,214,28,3);

// Sombra de contacto del lavamanos.
ctx.fillStyle = 'rgba(31,47,63,0.14)';
ctx.fillRect(31,150,78,2);

// Borde suave de la sombra.
ctx.fillStyle = 'rgba(31,47,63,0.06)';
ctx.fillRect(28,152,84,2);
// Sombra inferior de gabinetes y mesada.
ctx.fillStyle = 'rgba(31,47,63,0.12)';
ctx.fillRect(216,84,106,2);

// Transicion suave hacia el piso.
ctx.fillStyle = 'rgba(31,47,63,0.05)';
ctx.fillRect(212,86,114,2);
ctx.fillRect(321,217,34,2);
ctx.fillRect(318,163,43,2);
ctx.restore();

  const guest=patient||{
    ...room.patientSeat,
    seated:true,
    pose:'seated',
    visible:true
  };

  const actors=[];

  drawOpenDoor(ctx,r,background,guest.doorOpen);

  if(guest.visible!==false) actors.push(guest);
  if(p.visible!==false)
    actors.push({...p,resident:true});

  const seatTransition=seatVisualState(
    ctx,{...p,resident:true},time
  );

  const bed=room.furniture.find(
    f=>f.kind==='bed'
  );

  const layers=actors.map(actor=>{
    const besideBed=
      bed &&
      !actor.seated &&
      actor.x+FOOT.halfWidth<=bed.body.x &&
      bed.body.x-actor.x-FOOT.halfWidth<=24 &&
      actor.y>=bed.body.y &&
      actor.y<=bed.body.y+bed.body.h &&
      isFree(actor.x,actor.y,room);

    const onBed=
      actor.pose==='lying' ||
      actor.pose==='examining' ||
      ['mount','dismount','examine']
        .includes(actor.animation?.action);

    const bedDepth=bed
      ? bed.body.y+bed.body.h+1
      : 0;

    const recumbent=
      actor.pose==='lying' &&
      !['mount','dismount']
        .includes(actor.animation?.action);

    const martin = window.HepatoDay1Modules
  ?.['simulation-cases.mjs']
  ?.PATIENT_CATALOG
  ?.['masld-intro-v1-reasoning-v2'];

const martinJuntoCamilla =
  bed &&
  !actor.resident &&
  !actor.seated &&
  (
  (martin && actor.appearance === martin.patient.appearance) ||
  actor.appearance === window.HepatoDay1Modules
    ?.['simulation-cases.mjs']
    ?.PATIENT_CATALOG
    ?.['gilbert-v1-reasoning-v2']
    ?.patient.appearance
) &&
  actor.x >= bed.body.x - 48 &&
  actor.x <= bed.body.x + bed.body.w + 48 &&
  actor.y >= bed.body.y &&
  actor.y <= bed.body.y + bed.body.h;

const profundidad = bed && (onBed || besideBed)
  ? bedDepth + (recumbent ? 1 : actor.y / 1000)
  : actor.y;

return {
  depth: martinJuntoCamilla
    ? Math.max(profundidad, bedDepth + 2)
    : profundidad,
  draw:()=>{
        ctx.save();

        if(actor.portalTravel) {
  const clip = room.doorway.clip;
  const bordeSuperior = 14;

  ctx.beginPath();
  ctx.rect(
    clip.x,
    bordeSuperior,
    clip.w,
    clip.y + clip.h - bordeSuperior
  );
  ctx.clip();
}

        ctx.globalAlpha=actor.opacity??1;

        drawLivingActor(
          ctx,r,actor,time,animate,
          actor.resident?seatTransition:null
        );

        paintBedLinen(r,room,actor);
        ctx.restore();
      }
    };
  });
// ELENA — Capa de emergencia integrada al consultorio.
// Orden: silla → Elena → escritorio → médica.
if (
  emergencyElena &&
  Number.isInteger(emergencyElena.frame) &&
  emergencyElena.frame >= 0 &&
  emergencyElena.frame < 27 &&
  emergencyElena.image?.complete &&
  emergencyElena.image.naturalWidth === 2304 &&
  emergencyElena.image.naturalHeight === 768
) {
  layers.push({
    // La silla está en patientSeat.y - 2.
    // Elena se dibuja inmediatamente delante.
    depth: room.patientSeat.y - 1,

    draw: () => {
      const cuadro = emergencyElena.frame;

// Límites de los 27 fotogramas originales.
const limites = [
  [76,16,178,248],
  [76,17,178,248],
  [77,29,178,248],
  [77,16,178,248],
  [57,41,198,247],
  [72,46,182,247],
  [78,50,176,250],
  [78,46,176,252],
  [73,43,178,252],

  [79,13,163,248],
  [78,16,179,247],
  [81,13,165,245],
  [82,11,165,245],
  [82,13,167,245],
  [81,16,181,246],
  [81,14,177,247],
  [82,11,165,247],
  [82,12,165,247],

  [77,16,178,248],
  [68,19,186,248],
  [61,20,190,248],
  [72,20,184,246],
  [77,25,199,243],
  [29,103,205,243],
  [18,158,237,248],
  [18,158,237,249],
  [18,158,237,250]
];

const [izq, arriba, der, abajo] = limites[cuadro];

const sw = der - izq;
const sh = abajo - arriba;

// Escala uniforme: conserva las proporciones.
const escala = 55 / 232;

// Mantener el punto de apoyo original.
const dx = Math.round(
  emergencyElena.x + (izq - 128) * escala
);

const dy = Math.round(
  emergencyElena.y + (arriba - 248) * escala
);

const ancho = sw * escala;
const alto = sh * escala;

ctx.save();
ctx.globalAlpha = emergencyElena.opacity ?? 1;

ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = 'high';

ctx.drawImage(
  emergencyElena.image,
  (cuadro % 9) * 256 + izq,
  Math.floor(cuadro / 9) * 256 + arriba,
  sw,
  sh,
  dx,
  dy,
  ancho,
  alto
);

ctx.restore();
    }
  });
}
  // El camillero y la camilla permanecen unidos en el sprite original.
  if (rescueOrderly && loaded(rescueOrderly.image)) {
    layers.push({depth: rescueOrderly.y, draw: () => {
      ctx.save();
      ctx.globalAlpha = rescueOrderly.opacity;
      if (rescueOrderly.portal) {
        const clip = room.doorway.clip;
        ctx.beginPath(); ctx.rect(clip.x, 14, clip.w, room.height - 14); ctx.clip();
      }
      ctx.imageSmoothingEnabled = false;
      const escala = 0.92;
      const x = rescueOrderly.x + 90 * (1 - escala) / 2;
      const y = rescueOrderly.y - 90 * escala;
      ctx.translate(x, y);
      ctx.scale(escala, escala);
      ctx.drawImage(rescueOrderly.image, 0, 0, 90, 90);
      if (rescueOrderly.patient && loaded(rescueElena)) {
        // Elena queda visible sobre el colchón durante el traslado lateral.
        ctx.drawImage(rescueElena, 6*256+18, 2*256+158, 219, 92, 8, 34, 52, 22);
      }
      ctx.restore();
    }});
  }
  // Mobiliario con profundidad.
  
for(const f of room.furniture) {

  // Silla de oficina desocupada.
  if(f.id === 'chair') {

    if(
      loaded(doctoraSillaSecuencia) &&
      !p.seated &&
      !seatTransition
    ) {
      layers.push({
        depth: room.seat.y - 1,
        draw: () => {
          ctx.save();
          ctx.imageSmoothingEnabled = false;

          // Primera fila, tercera columna:
          // silla sola vista desde atrás.
          ctx.drawImage(
  doctoraSillaSecuencia,
  724, 0, 362, 362,
  Math.round(room.seat.x) - 29,
  Math.round(room.seat.y) - 60,
  56, 56
);

          ctx.restore();
        }
      });
    }

    continue;
  }
      if(f.id==='patient-chair') {
      if(loaded(sillaPacienteImagen)) {
        layers.push({
          depth: room.patientSeat.y - 2,
          draw: () => {
            ctx.save();
            ctx.imageSmoothingEnabled = false;

            const escalaSilla = 1.2;

ctx.drawImage(
  sillaPacienteImagen,
  Math.round(room.patientSeat.x - 32 * escalaSilla),
  Math.round(room.patientSeat.y + 14 - 64 * escalaSilla),
  64 * escalaSilla,
  64 * escalaSilla
);
            ctx.restore();
          }
        });
      }
      continue;
    }
    if(f.id==='desk') {
      if(loaded(escritorioImagen)) {
        layers.push({
          depth:f.body.y+f.body.h,
          draw:()=>{
            ctx.save();
            ctx.imageSmoothingEnabled=false;
            ctx.drawImage(
              escritorioImagen,
              70,155,1404,747,
              141,149,94,50
            );
            ctx.restore();
          }
        });
      }
      continue;
    }

    if(['stool','chair','patient-chair']
        .includes(f.id)) continue;

    const mask=roomArt.foreground.get(f.id);

    if(mask) {
      layers.push({
        depth:f.body.y+f.body.h,
        draw:()=>ctx.drawImage(
  mask.canvas,
  mask.x,
  mask.y,
  mask.w ?? mask.canvas.width,
  mask.h ?? mask.canvas.height
)
      });
    }
  }

  // Teléfono fijo sobre el escritorio; solo vibra durante la llamada.
  const phone = render.phoneImage ??= loadSprite('assets/sprites/mobiliario/telefono-consultorio.png');
  if (loaded(phone)) layers.push({depth:201, draw:()=>{
    const shake=phoneRinging && animate ? Math.round(Math.sin(time*24)) : 0;
    ctx.save();ctx.imageSmoothingEnabled=false;
    ctx.drawImage(phone, 0, 0, phone.naturalWidth, phone.naturalHeight, 160+shake, 155, 15, 15);
    ctx.restore();
  }});

  // ============================================================================
  // FASE 3B-2: ANIMACIONES DISCRETAS DE MONITORES EN CONSULTORIO
  // ============================================================================
  // 1. Monitor clínico de escritorio: cursor parpadeante a 1 Hz en el prompt de edición
  // Pantalla útil del monitor: x: 162..205, y: 105..139. Profundidad base en pared: 139.
  if (window.HP_MONITOR_ESCRITORIO_ANIM_ENABLED !== false && animate && !paused) {
    layers.push({
      depth: 139,
      draw: () => {
        // Parpadeo exacto a 1 Hz (500ms visible, 500ms apagado)
        const visible = Math.floor(time * 2) % 2 === 0;
        if (!visible) return;
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        // Cursor clínico blanco luminoso de 1x3 px en la línea de edición inferior
        ctx.fillStyle = '#d2e9e7';
        ctx.fillRect(166, 132, 1, 3);
        ctx.restore();
      }
    });
  }

  // 2. Ecógrafo clínico: indicador luminoso discreto de espera (standby) en chasis
  // La pantalla del ecógrafo permanece en su estado de reposo institucional aprobado.
  if (window.HP_ECOGRAFO_STANDBY_ENABLED !== false && animate && !paused) {
    layers.push({
      depth: 164, // Justo sobre el equipo (y: 75 + h: 88 = 163)
      draw: () => {
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        // Micro-LED de standby verde tenue (1x1 px) en el panel frontal del ecógrafo
        ctx.fillStyle = 'rgba(74, 222, 128, 0.55)';
        ctx.fillRect(329, 107, 1, 1);
        ctx.restore();
      }
    });
  }

  layers.sort((a,b)=>a.depth-b.depth)
    .forEach(layer=>layer.draw());

  // PILAR 5: Parpadeo sutil de tubo fluorescente cuando el hospital atraviesa crisis económica.
  if (economyState?.tier === 'crisis' && animate && !paused && !rescueBlack) {
    const dip = Math.sin(time * 2.9) > 0.91 && Math.sin(time * 31) > 0;
    if (dip) {
      ctx.fillStyle = 'rgba(11, 20, 32, 0.14)';
      ctx.fillRect(0, 0, room.width, room.height);
    }
  }

  if (rescueBlack) { ctx.fillStyle='#000'; ctx.fillRect(0,0,room.width,room.height); }

  // Confirmación de clic sobre el suelo: pulso pixelado breve. No afecta
  // la trayectoria, colisiones ni velocidad de los personajes.
  if(clickPulse&&clickPulse.age>=0&&clickPulse.age<.72&&!paused){
    const t=clickPulse,phase=t.age/.72,spread=2+Math.round(phase*5);
    ctx.save();ctx.globalAlpha=Math.max(0,.85-phase*.85);
    for(const [dx,dy] of [[-1,-1],[1,-1],[-1,1],[1,1]]){
      const x=Math.round(t.x+dx*spread),y=Math.round(t.y+dy*spread);
      r(x-1,y,3,1,'#28465b');r(x,y,1,2,'#b8d8c1');
    }
    ctx.restore();
  }
  if(p.path.length) {
    const t=p.path[p.path.length-1];
    const wobble=animate?Math.round((Math.sin(time*6)+1)*.5):0;
    for(const [dx,dy] of [
      [-5-wobble,-3],[3+wobble,-3],[-5-wobble,3],[3+wobble,3]
    ]) {
      r(t.x+dx,t.y+dy,3,1,'#405d75');
    }
  }

  // Una señal discreta de diálogo sobre el paciente al comienzo de la visita.
  if(showPatientCue&&guest.visible!==false&&guest.seated&&!paused){
    const x=Math.round(guest.x+17),y=Math.round(guest.y-75+(animate?Math.sin(time*2.5)>0?1:0:0));
    r(x-9,y,18,12,'#3e6070');
    r(x-8,y+1,16,10,'#f0f5f2');
    r(x-5,y+11,3,2,'#3e6070');
    for(let i=0;i<3;i++)r(x-5+i*5,y+5,2,2,'#5c7c72');
  }

  // Indicadores de interaccion.
  const near=nearestInteraction(p,room);
  if(near&&!paused) {
    const i=room.interactions.find(
      x=>x.id===near.id
    );

    if(i) {
      const pacienteEnCamilla =
  i.id === 'patient' &&
  guest.pose === 'lying';
      const xx = pacienteEnCamilla
  ? 245
  : i.id === 'door'
    ? room.hitAreas.door.x - 9
    : i.id === 'computer' ? 173 : i.x;

const yy = pacienteEnCamilla
  ? 89
  : i.id === 'door'
    ? room.hitAreas.door.y + 18
    : i.id === 'computer' ? 125 : i.y - 65;

      const hop=animate?Math.round(Math.sin(time*3.5)*.6):0;
      r(xx-7,yy+hop,15,14,'#25334c');
      r(xx-6,yy+1+hop,13,11,'#e6edf1');
      r(xx-1,yy+12+hop,3,2,'#25334c');
      pixelLabel(r,'E',xx-1,yy+4+hop,'#25334c');
    }
  }

  if(debug) {
    ctx.strokeStyle='#ef7868';
    ctx.lineWidth=1;

    for(const o of room.obstacles)
      ctx.strokeRect(o.x+.5,o.y+.5,o.w,o.h);

    ctx.strokeStyle='#79c1cc';
    ctx.strokeRect(
      p.x-FOOT.halfWidth,
      p.y-FOOT.halfHeight,
      FOOT.halfWidth*2,
      FOOT.halfHeight*2
    );
  }

  ctx.restore();
}

function portraitMoodOverlay(mood) {
  if (mood === 'critical') {
    return `
      <rect width="32" height="32" fill="#e4f0f6" opacity="0.25"/>
      <rect x="0" y="0" width="32" height="2" fill="#8b323c" opacity="0.55"/>
      <rect x="0" y="31" width="32" height="1" fill="#9a3540"/>
      <g class="hp-portrait-sweat">
        <rect x="23" y="9" width="1" height="2" fill="#7ec8e3"/>
        <rect x="23" y="11" width="1" height="1" fill="#e2f7fd"/>
        <rect x="25" y="12" width="1" height="2" fill="#6ab9d8"/>
      </g>
    `;
  }
  if (mood === 'concerned') {
    return `
      <rect width="32" height="4" fill="#30485e" opacity="0.16"/>
      <rect x="0" y="31" width="32" height="1" fill="#8a6838"/>
      <g class="hp-portrait-tension">
        <rect x="13" y="10" width="2" height="1" fill="#3a2a28" opacity="0.35"/>
        <rect x="17" y="10" width="2" height="1" fill="#3a2a28" opacity="0.35"/>
        <rect x="26" y="3" width="2" height="4" fill="#b87d2e"/>
        <rect x="26" y="8" width="2" height="1" fill="#b87d2e"/>
      </g>
    `;
  }
  if (mood === 'speaking') {
    return `
      <rect x="0" y="31" width="32" height="1" fill="#48758e"/>
      <g class="hp-portrait-speech">
        <rect x="25" y="4" width="4" height="1" fill="#48758e"/>
        <rect x="26" y="6" width="3" height="1" fill="#6492ab"/>
      </g>
    `;
  }
  if (mood === 'relieved') {
    return `
      <rect width="32" height="32" fill="#eefaf4" opacity="0.12"/>
      <rect x="0" y="31" width="32" height="1" fill="#3d7860"/>
      <g class="hp-portrait-relief">
        <rect x="25" y="4" width="1" height="2" fill="#3d7860"/>
        <rect x="26" y="5" width="1" height="2" fill="#3d7860"/>
        <rect x="27" y="4" width="1" height="2" fill="#3d7860"/>
        <rect x="28" y="3" width="1" height="2" fill="#3d7860"/>
      </g>
    `;
  }
  if (mood === 'noting') {
    return `
      <rect x="0" y="31" width="32" height="1" fill="#3a6b7e"/>
      <g class="hp-portrait-notebook">
        <rect x="20" y="21" width="10" height="9" fill="#8c6239"/>
        <rect x="21" y="22" width="8" height="7" fill="#fbf7ee"/>
        <rect x="22" y="24" width="6" height="1" fill="#496a80"/>
        <rect x="22" y="26" width="5" height="1" fill="#496a80"/>
        <rect x="18" y="21" width="2" height="6" fill="#1d4f6e"/>
        <rect x="17" y="27" width="1" height="1" fill="#0d2b3e"/>
      </g>
    `;
  }
  return '<rect x="0" y="31" width="32" height="1" fill="#60778e"/>';
}

function portraitMarkup(appearance, mood = 'neutral') {
  const bg = mood === 'critical'
    ? '#b8c6d2'
    : mood === 'concerned'
      ? '#bfcedb'
      : mood === 'relieved'
        ? '#c7e0d8'
        : '#c8dae4';

  if (appearance?.resident === true) {
    return `
      <rect width="32" height="32" fill="#c4d8e2"/>
      <svg
        x="0" y="0"
        width="32" height="32"
        viewBox="68 8 120 120"
        overflow="hidden"
      >
        <image
          href="assets/sprites/personajes/medica-atlas.png"
          x="0" y="0"
          width="1792" height="1024"
        />
      </svg>
      ${portraitMoodOverlay(mood)}
    `;
  }

  if (appearance?.manager === true) {
    return `
      <rect width="32" height="32" fill="${bg}"/>
      <svg
        x="0" y="0"
        width="32" height="32"
        viewBox="68 8 120 120"
        overflow="hidden"
      >
        <image
          href="assets/sprites/personajes/gerente-atlas.png"
          x="0" y="0"
          width="2304" height="1024"
        />
      </svg>
      ${portraitMoodOverlay(mood)}
    `;
  }

  const martin = window.HepatoDay1Modules?.['simulation-cases.mjs']
    ?.PATIENT_CATALOG?.['masld-intro-v1-reasoning-v2'];

  if (martin && appearance === martin.patient.appearance) {
    return `
      <rect width="32" height="32" fill="${bg}"/>
      <svg
        x="0" y="0"
        width="32" height="32"
        viewBox="72 0 112 112"
        overflow="hidden"
      >
        <image
          href="assets/sprites/pacientes/martin/martin_spritesheet.png"
          x="0" y="0"
          width="2304" height="1024"
        />
      </svg>
      ${portraitMoodOverlay(mood)}
    `;
  }

  const sofia = window.HepatoDay1Modules?.['simulation-cases.mjs']
    ?.PATIENT_CATALOG?.['gilbert-v1-reasoning-v2'];

  if (sofia && appearance === sofia.patient.appearance) {
    return `
      <rect width="32" height="32" fill="${bg}"/>
      <svg
        x="0" y="0"
        width="32" height="32"
        viewBox="76 528 104 104"
        overflow="hidden"
      >
        <image
          href="assets/sprites/pacientes/sofia/sofia-atlas.png"
          x="0" y="0"
          width="2304" height="1024"
        />
      </svg>
      ${portraitMoodOverlay(mood)}
    `;
  }
// Retrato personalizado de Elena para la interfaz clínica.
const elenaRetrato = window.HepatoDay1Modules
  ?.['simulation-cases.mjs']
  ?.PATIENT_CATALOG
  ?.['masld-older-v1-reasoning-v2'];

if (
  elenaRetrato &&
  appearance === elenaRetrato.patient.appearance
) {
  return `
    <rect width="32" height="32" fill="${bg}"/>
    <svg
      x="0" y="0"
      width="32" height="32"
      viewBox="375 100 500 500"
      overflow="hidden"
    >
      <image
        href="assets/sprites/pacientes/elena/elena_sentada_frente.png"
        x="0" y="0"
        width="1254" height="1254"
      />
    </svg>
    ${portraitMoodOverlay(mood)}
  `;
}
  return spritePortrait(appearance, mood);
}

return {render,portraitMarkup,drawLivingActor,actualizarYRenderizarPolvoPOV};

})();
