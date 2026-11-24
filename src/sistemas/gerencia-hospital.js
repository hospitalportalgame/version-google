/* HOSPITAL PORTAL · Gerencia (Piso 2) */
(()=>{
'use strict';

const ORIGINAL_W = 1810;
const ORIGINAL_H = 869;
const H = 512;
const ESCALA = H / ORIGINAL_H; // ~0.589183
const ANCHO_MUNDO = Math.round(ORIGINAL_W * ESCALA); // 1066

const fondo = new Image();
fondo.src = 'assets/escenarios/hospital-gerencia.png';

const gerenteAtlas = new Image();
gerenteAtlas.src = 'assets/sprites/personajes/gerente-atlas.png';

// Capas de primer plano para oclusión realista de mobiliario inferior
const sillonIzquierdo = new Image();
sillonIzquierdo.src = 'assets/sprites/mobiliario/gerencia-sillon-izquierdo.png';

const sillonDerecho = new Image();
sillonDerecho.src = 'assets/sprites/mobiliario/gerencia-sillon-derecho.png';

const mesaCentro = new Image();
mesaCentro.src = 'assets/sprites/mobiliario/gerencia-mesa-centro.png';

let camaraX = 0;
let viaje = null;

// Parámetros y geometría del ascensor ajustado al vano vertical exacto (fondo 1810x869: x: 69, y: 174, w: 125, h: 296)
const ascensor = {
  x: Math.round(69 * ESCALA),   // 41 px
  y: Math.round(174 * ESCALA),  // 103 px
  w: Math.round(125 * ESCALA),  // 74 px
  h: Math.round(296 * ESCALA)   // 174 px
};

const entrada = {
  x: Math.round(ascensor.x + ascensor.w / 2), // 78 px (centro exacto del vano)
  y: 288                                     // En el suelo frente al umbral
};

// Gerente: ubicado correctamente frente a su despacho y escritorio ejecutivo
const gerente = {
  x: 680,
  y: 360,
  face: 'up',
  walking: false,
  distance: 0,
  espera: 3.5,
  destino: 0
};

// Recorrido adaptado a la distribución real: transita exclusivamente por zonas libres,
// sin subirse nunca al escritorio ni colisionar con sillas o mobiliario
const recorridoGerente = [
  { x: 680, y: 360, pausa: 3.5, face: 'up' },    // Frente a su escritorio
  { x: 510, y: 360, pausa: 2.5, face: 'left' },  // Pasillo central
  { x: 490, y: 310, pausa: 3, face: 'up' },      // Observando hacia el ventanal
  { x: 520, y: 360, pausa: 2, face: 'right' },   // Regresando al pasillo
  { x: 750, y: 360, pausa: 3, face: 'down' }     // Frente a la zona de estar
];

const clamp = n => Math.max(0, Math.min(1, n));

// ============================================================================
// FASE 1B: ESTADO DE ANIMACIÓN DEL GERENTE (TRANSICIÓN Y RESPIRACIÓN)
// ============================================================================
window.HP_GERENTE_TRANSICION_PARADA_ENABLED = true;
window.HP_GERENTE_RESPIRACION_ENABLED = true;

const gerenteAnimState = {
  walkingPrev: false,
  ultimoCuadroCaminata: 1,
  transicionParada: { activa: false, t: 0, duracion: 0.075, cuadro: 0 },
  tiempoReposo: 0
};

function mirarMedica(medica){
  if (!medica) return;
  gerente.walking = false;
  const dx = medica.x - gerente.x, dy = medica.y - gerente.y;
  const absX = Math.abs(dx), absY = Math.abs(dy);
  // Banda de histéresis de 6px para evitar parpadeos de orientación en diagonales
  const caraActual = gerente.face;
  const eraHorizontal = caraActual === 'left' || caraActual === 'right';
  const sesgo = eraHorizontal ? 6 : -6;
  if (absX + sesgo > absY) {
    gerente.face = dx > 0 ? 'right' : 'left';
  } else {
    gerente.face = dy > 0 ? 'down' : 'up';
  }
}

function actualizarAnimacionGerente(dt) {
  if (gerente.walking) {
    gerenteAnimState.tiempoReposo = 0;
    gerenteAnimState.transicionParada.activa = false;
    gerenteAnimState.walkingPrev = true;
    gerenteAnimState.ultimoCuadroCaminata = 1 + Math.floor(gerente.distance / 6) % 8;
  } else {
    if (gerenteAnimState.walkingPrev) {
      gerenteAnimState.walkingPrev = false;
      gerenteAnimState.tiempoReposo = 0;

      if (window.HP_GERENTE_TRANSICION_PARADA_ENABLED !== false) {
        const u = gerenteAnimState.ultimoCuadroCaminata;
        // Asentamiento visual de 8 cuadros de zancada del Gerente:
        // u=3 o 4 (extensión derecha) -> cuadro de apoyo 5 antes de neutro
        // u=7 o 8 (extensión izquierda) -> cuadro de apoyo 1 antes de neutro
        // u=2 o 6 -> cuadro 1 o 5
        let cuadroIntermedio = 0;
        if (u === 3 || u === 4) cuadroIntermedio = 5;
        else if (u === 7 || u === 8) cuadroIntermedio = 1;
        else if (u === 2) cuadroIntermedio = 1;
        else if (u === 6) cuadroIntermedio = 5;

        if (cuadroIntermedio !== 0) {
          gerenteAnimState.transicionParada = {
            activa: true,
            t: 0,
            duracion: 0.075, // 75 ms
            cuadro: cuadroIntermedio
          };
        } else {
          gerenteAnimState.transicionParada.activa = false;
        }
      } else {
        gerenteAnimState.transicionParada.activa = false;
      }
    }

    if (gerenteAnimState.transicionParada.activa) {
      gerenteAnimState.transicionParada.t += dt;
      if (gerenteAnimState.transicionParada.t >= gerenteAnimState.transicionParada.duracion) {
        gerenteAnimState.transicionParada.activa = false;
      }
    } else {
      gerenteAnimState.tiempoReposo += dt;
    }
  }
}

function actualizarGerente(dt, medica){
  gerente.walking = false;
  if (viaje) return;

  dt = Math.max(0, Math.min(dt, .05));
  if (medica && Math.hypot(medica.x - gerente.x, medica.y - gerente.y) < 80) {
    mirarMedica(medica);
    actualizarAnimacionGerente(dt);
    return;
  }

  if (gerente.espera > 0) {
    gerente.espera = Math.max(0, gerente.espera - dt);
    actualizarAnimacionGerente(dt);
    return;
  }

  const destino = recorridoGerente[gerente.destino];
  const dx = destino.x - gerente.x;
  const dy = destino.y - gerente.y;
  const distancia = Math.hypot(dx, dy);

  if (distancia < .1) {
    gerente.x = destino.x;
    gerente.y = destino.y;
    gerente.face = destino.face;
    gerente.espera = destino.pausa;
    gerente.destino = (gerente.destino + 1) % recorridoGerente.length;
    actualizarAnimacionGerente(dt);
    return;
  }

  const paso = Math.min(distancia, 32 * dt);
  const siguienteX = gerente.x + dx / distancia * paso;
  const siguienteY = gerente.y + dy / distancia * paso;

  gerente.face = Math.abs(dx) > Math.abs(dy)
    ? (dx > 0 ? 'right' : 'left')
    : (dy > 0 ? 'down' : 'up');

  // Esperar si la médica ocupa el siguiente paso
  if (
    medica &&
    Math.abs(siguienteX - medica.x) < 30 &&
    Math.abs(siguienteY - medica.y) < 18
  ) {
    actualizarAnimacionGerente(dt);
    return;
  }

  // Comprobar colisión con obstáculos (sin incluir al propio gerente)
  if (obstaculos().some(o =>
    siguienteX + 9 > o.x && siguienteX - 9 < o.x + o.w &&
    siguienteY + 5 > o.y && siguienteY - 5 < o.y + o.h
  )) {
    actualizarAnimacionGerente(dt);
    return;
  }

  gerente.x = siguienteX;
  gerente.y = siguienteY;
  gerente.distance += paso;
  gerente.walking = paso > 0;
  actualizarAnimacionGerente(dt);
}

function dibujarGerente(ctx){
  if (!gerenteAtlas.complete || !gerenteAtlas.naturalWidth) return;

  const fila = { down: 0, up: 1, left: 2, right: 3 }[gerente.face];
  let columna = 0;
  if (gerente.walking) {
    columna = 1 + Math.floor(gerente.distance / 6) % 8;
  } else if (gerenteAnimState.transicionParada.activa) {
    if (gerenteAnimState.transicionParada.t < gerenteAnimState.transicionParada.duracion * 0.55) {
      columna = gerenteAnimState.transicionParada.cuadro;
    } else {
      columna = 0;
    }
  } else {
    columna = 0;
  }

  // Escala coherente con la médica (118 px)
  const tamaño = 118;
  const factor = tamaño / 256;
  const cw = gerenteAtlas.naturalWidth / 9;
  const ch = gerenteAtlas.naturalHeight / 4;
  const baseDx = gerente.x - 128 * factor;
  const baseDy = gerente.y - 248 * factor;

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Contorno oscuro fino
  ctx.filter =
    'drop-shadow(0.6px 0 0 #16151c) ' +
    'drop-shadow(-0.6px 0 0 #16151c) ' +
    'drop-shadow(0 0.6px 0 #16151c) ' +
    'drop-shadow(0 -0.6px 0 #16151c)';

  // Micro-respiración sutil en reposo (> 1.0 s)
  const respirando = window.HP_GERENTE_RESPIRACION_ENABLED !== false &&
    !gerente.walking &&
    !gerenteAnimState.transicionParada.activa &&
    gerenteAnimState.tiempoReposo >= 1.0;

  if (respirando) {
    // Ciclo respiratorio de 3.4 segundos
    const tCiclo = (gerenteAnimState.tiempoReposo - 1.0) * (Math.PI * 2 / 3.4);
    const senRespiracion = Math.sin(tCiclo);
    // Corte anatómico exacto en la cintura/bajo de la americana del traje del Gerente
    const cyCorte = 174;
    const deltaYTorso = senRespiracion > 0 ? -Math.round(senRespiracion * factor * 1.4) : 0;

    // 1. Pantalones y zapatos (cyCorte..256): FIJOS AL SUELO, cero movimiento
    const shPiernas = 256 - cyCorte;
    ctx.drawImage(
      gerenteAtlas,
      columna * cw,
      fila * ch + cyCorte,
      cw,
      shPiernas,
      baseDx,
      baseDy + cyCorte * factor,
      tamaño,
      shPiernas * factor
    );

    // 2. Cabeza y chaqueta ejecutiva (0..cyCorte+1): elevación sutil de 1 px en inhalación
    // El +1 en sourceHeight garantiza que nunca haya separación de píxeles
    const shTorso = cyCorte + 1;
    ctx.drawImage(
      gerenteAtlas,
      columna * cw,
      fila * ch,
      cw,
      shTorso,
      baseDx,
      baseDy + deltaYTorso,
      tamaño,
      shTorso * factor
    );
  } else {
    ctx.drawImage(
      gerenteAtlas,
      columna * cw,
      fila * ch,
      cw,
      ch,
      baseDx,
      baseDy,
      tamaño, tamaño
    );
  }

  ctx.restore();
}

function obstaculos(){
  return [
    // --- LÍMITES DE LA SALA ---
    { x: 0, y: 0, w: 38, h: H },
    { x: ANCHO_MUNDO - 18, y: 0, w: 18, h: H },
    { x: 0, y: H - 8, w: ANCHO_MUNDO, h: 8 },

    // --- ESTRUCTURA SUPERIOR Y ASCENSOR ---
    // Pared sobre el vano del ascensor
    { x: 0, y: 0, w: ascensor.x + ascensor.w, h: ascensor.y },
    // Bloqueo de vano del ascensor cuando la puerta está cerrada (evita entrar a la cabina si no está en uso)
    ...(!viaje ? [{ x: ascensor.x - 2, y: ascensor.y + ascensor.h - 18, w: ascensor.w + 4, h: 18 }] : []),
    // Pared sobre la zona de reuniones (entre ascensor y ventanal)
    { x: ascensor.x + ascensor.w, y: 0, w: 460 - (ascensor.x + ascensor.w), h: 252 },
    // Planta alta junto al marco del ascensor
    { x: 138, y: 206, w: 60, h: 72 },
    // Ventanal panorámico (zócalo de pared)
    { x: 460, y: 0, w: 405, h: 250 },

    // --- ZONA DE REUNIONES (Izquierda) ---
    // Mesa redonda y base central
    { x: 275, y: 258, w: 106, h: 64 },
    // Silla izquierda
    { x: 220, y: 262, w: 58, h: 68 },
    // Silla derecha
    { x: 345, y: 262, w: 62, h: 68 },
    // Silla superior
    { x: 258, y: 228, w: 120, h: 36 },

    // --- ZONA CENTRAL Y DESPACHO EJECUTIVO (Derecha) ---
    // Planta central frente a ventanales
    { x: 468, y: 206, w: 62, h: 72 },
    // Silla ejecutiva tras el escritorio
    { x: 658, y: 194, w: 76, h: 58 },
    // Escritorio ejecutivo completo (bloque físico sólido impenetrable: ni el gerente ni la médica pueden subirse)
    { x: 550, y: 250, w: 270, h: 98 },
    // Bibliotecas en pared derecha
    { x: 865, y: 130, w: 155, h: 165 },
    // Sillón individual superior derecho
    { x: 948, y: 282, w: 90, h: 72 },
    // Lámpara de pie junto al sillón
    { x: 1012, y: 282, w: 45, h: 76 },
    // Planta inferior derecha
    { x: 975, y: 458, w: 90, h: 54 },

    // --- ZONA INFERIOR (Área de estar con sillones y mesa de centro) ---
    // Sillón izquierdo (base de apoyo / patas)
    { x: 404, y: 424, w: 115, h: 56 },
    // Mesa de centro (base de apoyo / patas)
    { x: 551, y: 436, w: 162, h: 46 },
    // Sillón derecho (base de apoyo / patas)
    { x: 734, y: 424, w: 115, h: 56 }
  ];
}

function libre(x, y){
  if (
    Math.abs(x - gerente.x) < 28 &&
    Math.abs(y - gerente.y) < 17
  ) return false;

  return Number.isFinite(x) && Number.isFinite(y) &&
    x >= 35 && x <= (ANCHO_MUNDO - 25) && y >= 240 && y <= 500 &&
    !obstaculos().some(o =>
      x + 9 > o.x && x - 9 < o.x + o.w &&
      y + 5 > o.y && y - 5 < o.y + o.h
    );
}

function interaccion(medica){
  const ascensorDisponible = {
    ...entrada,
    id: 'ascensor-gerencia',
    label: 'Usar ascensor'
  };
  const hablar = { x: gerente.x, y: gerente.y, id: 'hablar-gerente', label: 'Hablar con el gerente' };
  if (!medica) return ascensorDisponible;
  const estado = { x: 735, y: 365, id: 'estado-hospital', label: 'Consultar estado del hospital' };
  return [ascensorDisponible, hablar, estado].reduce((cercana, opcion) =>
    Math.hypot(medica.x - opcion.x, medica.y - opcion.y) <
    Math.hypot(medica.x - cercana.x, medica.y - cercana.y) ? opcion : cercana
  );
}

function iniciar(actor, alTerminar){
  if (viaje) return false;
  if (Math.hypot(actor.x - entrada.x, actor.y - entrada.y) >= 65) {
    return false;
  }

  viaje = {
    actor, alTerminar, t: 0,
    x: actor.x, y: actor.y
  };

  actor.face = 'up';
  actor.walking = false;
  return true;
}

function actualizar(dt){
  if (!viaje) return;

  const v = viaje, a = v.actor;
  v.t += Math.max(0, Math.min(dt, .05));

  const anteriorX = a.x, anteriorY = a.y;
  const interior = ascensor.y + ascensor.h - 14; // 263 px: perfectamente dentro de la cabina

  if (v.t < .45) {
    const f = clamp(v.t / .45);
    a.x = v.x + (entrada.x - v.x) * f;
    a.y = v.y + (entrada.y - v.y) * f;
  } else {
    a.x = entrada.x;
    a.y = entrada.y +
      (interior - entrada.y) * clamp((v.t - 1.05) / .85);
  }

  const distancia = Math.hypot(
    a.x - anteriorX, a.y - anteriorY
  );

  a.distance = (a.distance || 0) + distancia;
  a.walking = distancia > .001;
  a.face = 'up';

  if (v.t >= 3) {
    const callback = v.alTerminar;
    a.walking = false;
    a.y = -200;
    viaje = null;
    callback?.();
  }
}

function dibujar(ctx, dibujarMedica, medica){
  ctx.save();
  const anchoVista = ctx.canvas.width;
  camaraX = Math.max(0, Math.min(ANCHO_MUNDO - anchoVista, (medica?.x ?? (anchoVista / 2)) - anchoVista / 2));
  ctx.translate(-camaraX, 0);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  if (!fondo.complete || !fondo.naturalWidth) {
    ctx.fillStyle = '#1a1820';
    ctx.fillRect(0, 0, ANCHO_MUNDO, H);
    ctx.restore();
    dibujarMedica();
    return;
  }

  // 1. Fondo completo de la nueva Gerencia (1066 x 512, proporción exacta 1810x869)
  ctx.drawImage(fondo, 0, 0, ANCHO_MUNDO, H);

  // 1.1 Haces de luz solar volumétrica desde los ventanales panorámicos
  window.HP_EFECTOS_AMBIENTALES?.gerencia?.dibujarHaces(ctx);

  // 2. Animación de puertas del ascensor integrado en el vano vertical exacto (x: 41, y: 103, w: 74, h: 174)
  const dentro = !!viaje && viaje.t >= 1.7;

  if (viaje) {
    const t = viaje.t;
    let abierta;
    if (window.HP_TWEEN_ASCENSOR_ENABLED === false || typeof TWEEN === 'undefined') {
      abierta = Math.min(
        clamp((t - .45) / .5),
        clamp((2.9 - t) / .7)
      );
    } else {
      const u = clamp((t - .45) / .5);
      const v = clamp((2.9 - t) / .7);
      abierta = Math.min(
        TWEEN.Easing.Quadratic.InOut(u),
        TWEEN.Easing.Quadratic.InOut(v)
      );
    }

    if (abierta > 0) {
      const p = ascensor;

      ctx.save();
      ctx.beginPath();
      ctx.rect(p.x, p.y, p.w, p.h);
      ctx.clip();

      // Interior de la cabina del ascensor con iluminación superior
      ctx.fillStyle = '#0a1015';
      ctx.fillRect(p.x, p.y, p.w, p.h);

      const gradCabina = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.h);
      gradCabina.addColorStop(0, 'rgba(255, 235, 180, 0.28)');
      gradCabina.addColorStop(0.28, 'rgba(180, 160, 120, 0.08)');
      gradCabina.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
      ctx.fillStyle = gradCabina;
      ctx.fillRect(p.x, p.y, p.w, p.h);

      if (dentro) dibujarMedica();

      // Recorte pixel-perfect de las hojas desde la imagen original 1810x869
      const sx = 69;
      const sy = 174;
      const sw = 125;
      const sh = 296;
      const hojaW = Math.round(p.w / 2); // 37 px
      const desplazamiento = window.HP_TWEEN_ASCENSOR_ENABLED !== false
        ? Math.round(hojaW * abierta)
        : (hojaW * abierta);

      // Hoja izquierda corrediza
      ctx.drawImage(
        fondo, sx, sy, sw / 2, sh,
        p.x - desplazamiento, p.y, hojaW, p.h
      );

      // Hoja derecha corrediza
      ctx.drawImage(
        fondo, sx + sw / 2, sy, sw / 2, sh,
        p.x + hojaW + desplazamiento, p.y, hojaW, p.h
      );

      ctx.restore();
    }
  }

  // 3. Capas ordenadas por profundidad (Z-Sorting):
  // Permite que cuando los personajes caminen por detrás de los sillones inferiores o mesa de centro,
  // queden cubiertos naturalmente por sus respaldos/cuerpo, y cuando caminen por delante queden al frente.
  const capas = [
    {
      profundidad: gerente.y,
      dibujar: () => dibujarGerente(ctx)
    },
    // Sillón inferior izquierdo (depth en la base de apoyo: 483 px)
    {
      profundidad: 483,
      dibujar: () => {
        if (!sillonIzquierdo.complete || !sillonIzquierdo.naturalWidth) return;
        ctx.save();
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(sillonIzquierdo, 686 * ESCALA, 627 * ESCALA, 195 * ESCALA, 205 * ESCALA);
        ctx.restore();
      }
    },
    // Mesa de centro inferior (depth en la base: 495 px)
    {
      profundidad: 495,
      dibujar: () => {
        if (!mesaCentro.complete || !mesaCentro.naturalWidth) return;
        ctx.save();
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(mesaCentro, 935 * ESCALA, 658 * ESCALA, 275 * ESCALA, 192 * ESCALA);
        ctx.restore();
      }
    },
    // Sillón inferior derecho (depth en la base de apoyo: 483 px)
    {
      profundidad: 483,
      dibujar: () => {
        if (!sillonDerecho.complete || !sillonDerecho.naturalWidth) return;
        ctx.save();
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(sillonDerecho, 1245 * ESCALA, 627 * ESCALA, 195 * ESCALA, 205 * ESCALA);
        ctx.restore();
      }
    },
    // Motas de polvo solar suspendidas en el volumen de luz del despacho
    {
      profundidad: 440,
      dibujar: () => {
        if (window.HP_EFECTOS_AMBIENTALES && window.HP_EFECTOS_AMBIENTALES.gerencia) {
          window.HP_EFECTOS_AMBIENTALES.gerencia.dibujarParticulas(ctx);
        }
      }
    }
  ];

  if (!dentro) {
    capas.push({
      profundidad: medica?.y ?? 0,
      dibujar: dibujarMedica
    });
  }

  capas.sort((a, b) => a.profundidad - b.profundidad);
  capas.forEach(capa => capa.dibujar());

  ctx.restore();
}

window.HP_GERENTE_ANIM = gerenteAnimState;
window.HP_GERENCIA_ANIM = {
  get animState() { return gerenteAnimState; },
  get transicionParadaEnabled() { return window.HP_GERENTE_TRANSICION_PARADA_ENABLED !== false; },
  setTransicionParadaEnabled(val) { window.HP_GERENTE_TRANSICION_PARADA_ENABLED = !!val; },
  get respiracionEnabled() { return window.HP_GERENTE_RESPIRACION_ENABLED !== false; },
  setRespiracionEnabled(val) { window.HP_GERENTE_RESPIRACION_ENABLED = !!val; }
};
window.HP_GERENCIA = {
  get gerente() { return gerente; },
  mirarMedica,
  actualizarGerente,
  dibujar,
  actualizar,
  interaccion,
  obstaculos,
  libre,
  iniciar,
  limites: { x: 26, y: 235, w: ANCHO_MUNDO - 42, h: 270 },

  get entrada(){ return { ...entrada }; },
  get ocupado(){ return !!viaje; },
  get camaraX(){ return camaraX; },

  cancelar(){
    if (viaje) viaje.actor.walking = false;
    viaje = null;
  }
};

})();
