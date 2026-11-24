/* HOSPITAL PORTAL · Sistema Reutilizable de Efectos Ambientales (Canvas 2D Pixel Art)
 * Proporciona haces solares volumétricos, motas de polvo atmosférico y resplandores
 * calibrados para renderizado de alta fidelidad pixel art sin comprometer los FPS.
 */
(()=>{
'use strict';

const CLAMP = (v, min, max) => Math.max(min, Math.min(max, v));

/**
 * Crea un emisor y simulador de partículas y haces de luz volumétrica.
 */
function crearSistemaSolar(config) {
  const cfg = {
    nombre: config.nombre || 'escenario',
    haces: config.haces || [],
    cantidadParticulas: config.cantidadParticulas || 24,
    limites: config.limites || { xMin: 0, xMax: 768, yMin: 0, yMax: 512 },
    coloresParticulas: config.coloresParticulas || [
      'rgba(255, 255, 248, ', // Blanco cálido solar
      'rgba(255, 248, 220, ', // Crema dorado
      'rgba(255, 238, 185, ', // Ámbar suave
      'rgba(250, 228, 165, '  // Destello dorado tenue
    ],
    opacidadHaces: config.opacidadHaces ?? 0.09,
    modulacionRespiracion: config.modulacionRespiracion ?? true,
    ...config
  };

  const particulas = [];

  function reiniciarParticula(p, aleatorioInicio = false) {
    const lim = typeof cfg.limites === 'function' ? cfg.limites() : cfg.limites;
    const y = lim.yMin + Math.random() * Math.max(1, lim.yMax - lim.yMin);

    // Calcular límites horizontales interpolados si existe función de límites trapezoidales
    let minX = lim.xMin;
    let maxX = lim.xMax;
    if (typeof lim.getXMin === 'function') minX = lim.getXMin(y);
    if (typeof lim.getXMax === 'function') maxX = lim.getXMax(y);

    p.y = y;
    p.baseX = minX + Math.random() * Math.max(2, maxX - minX);
    p.x = p.baseX;

    // Tamaños nítidos de pixel art: 60% 1x1, 30% 2x2, 10% 2x1
    const rSize = Math.random();
    if (rSize < 0.60) {
      p.w = 1; p.h = 1;
    } else if (rSize < 0.90) {
      p.w = 2; p.h = 2;
    } else {
      p.w = 2; p.h = 1;
    }

    // Movimiento orgánico: 65% flotación ascendente lenta, 35% descenso suave
    const asciende = Math.random() < 0.65;
    p.vy = asciende ? -(0.8 + Math.random() * 2.2) : (0.4 + Math.random() * 1.5);
    p.vx = (Math.random() - 0.5) * 0.35;

    // Deriva horizontal sinusoidal (vibración browniana en el aire)
    p.swayAmp = 0.8 + Math.random() * 1.6;
    p.swayFreq = 0.8 + Math.random() * 1.4;
    p.swayPhase = Math.random() * Math.PI * 2;

    // Opacidad natural discreta: entre 0.30 y 0.55
    p.maxAlpha = 0.30 + Math.random() * 0.25;
    p.colorPrefix = cfg.coloresParticulas[Math.floor(Math.random() * cfg.coloresParticulas.length)];

    // Tiempo de vida entre 4 y 7.5 segundos
    p.life = 4.0 + Math.random() * 3.5;
    p.age = aleatorioInicio ? Math.random() * p.life : 0;
  }

  // Pre-instanciación de partículas (pooling para cero recolección de basura)
  for (let i = 0; i < cfg.cantidadParticulas; i++) {
    const p = {};
    reiniciarParticula(p, true);
    particulas.push(p);
  }

  let tiempoAcumulado = 0;

  function actualizar(dt) {
    if (window.HP_POLVO_SOLAR_ENABLED === false) return;
    dt = CLAMP(dt || 0.016, 0.001, 0.05);
    tiempoAcumulado += dt;

    const lim = typeof cfg.limites === 'function' ? cfg.limites() : cfg.limites;

    for (let i = 0; i < particulas.length; i++) {
      const p = particulas[i];
      p.age += dt;
      p.y += p.vy * dt;
      p.baseX += p.vx * dt;
      p.x = p.baseX + Math.sin(p.swayPhase + p.age * p.swayFreq) * p.swayAmp;

      let minX = lim.xMin;
      let maxX = lim.xMax;
      if (typeof lim.getXMin === 'function') minX = lim.getXMin(p.y);
      if (typeof lim.getXMax === 'function') maxX = lim.getXMax(p.y);

      // Reiniciar si supera vida útil o sale del haz
      if (p.age >= p.life || p.y < lim.yMin || p.y > lim.yMax || p.x < minX || p.x > maxX) {
        reiniciarParticula(p, false);
      }
    }
  }

  function dibujarHaces(ctx) {
    if (!cfg.haces || cfg.haces.length === 0) return;

    // Respiración lenta de luz: modulación sutil de intensidad (+- 8% en ciclo de 6 seg)
    const factorRespiracion = cfg.modulacionRespiracion
      ? 1 + 0.08 * Math.sin(tiempoAcumulado * 1.05)
      : 1;

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    for (let i = 0; i < cfg.haces.length; i++) {
      const h = cfg.haces[i];
      const alphaMax = (h.opacidad ?? cfg.opacidadHaces) * factorRespiracion;
      if (alphaMax <= 0.005) continue;

      const grad = ctx.createLinearGradient(
        (h.origenX1 + h.origenX2) / 2, h.origenY,
        (h.destinoX1 + h.destinoX2) / 2, h.destinoY
      );

      const colPrefix = h.colorPrefix || 'rgba(255, 246, 215, ';
      grad.addColorStop(0.00, colPrefix + (alphaMax * 0.95).toFixed(3) + ')');
      grad.addColorStop(0.25, colPrefix + (alphaMax * 0.70).toFixed(3) + ')');
      grad.addColorStop(0.70, colPrefix + (alphaMax * 0.35).toFixed(3) + ')');
      grad.addColorStop(1.00, colPrefix + '0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(h.origenX1, h.origenY);
      ctx.lineTo(h.origenX2, h.origenY);
      ctx.lineTo(h.destinoX2, h.destinoY);
      ctx.lineTo(h.destinoX1, h.destinoY);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  function dibujarParticulas(ctx) {
    if (window.HP_POLVO_SOLAR_ENABLED === false) return;

    ctx.save();
    // Coordenadas enteras y pixel art nítido sin antialiasing
    ctx.imageSmoothingEnabled = false;

    for (let i = 0; i < particulas.length; i++) {
      const p = particulas[i];
      const progreso = p.age / p.life;
      if (progreso <= 0 || progreso >= 1) continue;

      // Curva sinusoidal suave para entrada y salida de opacidad
      const alpha = Math.max(0, Math.min(0.65, p.maxAlpha * Math.sin(progreso * Math.PI)));
      if (alpha < 0.02) continue;

      ctx.fillStyle = p.colorPrefix + alpha.toFixed(3) + ')';
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.w, p.h);
    }

    ctx.restore();
  }

  function dibujar(ctx, opciones = {}) {
    const modo = opciones.modo || 'todo';
    if (modo === 'todo' || modo === 'haces') dibujarHaces(ctx);
    if (modo === 'todo' || modo === 'particulas') dibujarParticulas(ctx);
  }

  return {
    actualizar,
    dibujar,
    dibujarHaces,
    dibujarParticulas,
    get particulas(){ return particulas; }
  };
}

// ============================================================================
// CONFIGURACIONES OFICIALES PARA TODOS LOS ESCENARIOS
// ============================================================================

// 1. PISO 2 · GERENCIA (CONSERVADO EXACTAMENTE SEGÚN APROBACIÓN PREVIA)
const SISTEMA_GERENCIA = crearSistemaSolar({
  nombre: 'gerencia',
  cantidadParticulas: 26,
  opacidadHaces: 0.085,
  modulacionRespiracion: true,
  haces: [
    {
      origenX1: 470, origenX2: 565, origenY: 72,
      destinoX1: 495, destinoX2: 615, destinoY: 410,
      opacidad: 0.080,
      colorPrefix: 'rgba(255, 248, 220, '
    },
    {
      origenX1: 580, origenX2: 685, origenY: 72,
      destinoX1: 615, destinoX2: 755, destinoY: 415,
      opacidad: 0.095,
      colorPrefix: 'rgba(255, 245, 210, '
    },
    {
      origenX1: 700, origenX2: 805, origenY: 72,
      destinoX1: 745, destinoX2: 875, destinoY: 410,
      opacidad: 0.080,
      colorPrefix: 'rgba(255, 248, 218, '
    }
  ],
  limites: {
    xMin: 470,
    xMax: 875,
    yMin: 72,
    yMax: 415,
    getXMin: (y) => 470 + (25 * (y - 72)) / 343,
    getXMax: (y) => 805 + (70 * (y - 72)) / 343
  }
});

// 2. PLANTA BAJA · RECEPCIÓN / SALA DE ESPERA
// Luz natural desde el umbral de entrada vidriado inferior y claraboya superior de la sala de espera
const SISTEMA_RECEPCION = crearSistemaSolar({
  nombre: 'recepcion',
  cantidadParticulas: 20,
  opacidadHaces: 0.075,
  modulacionRespiracion: true,
  haces: [
    {
      // Haz 1: Luz solar que ingresa desde la entrada principal acristalada hacia el vestíbulo
      origenX1: 280, origenX2: 490, origenY: 260,
      destinoX1: 240, destinoX2: 530, destinoY: 505,
      opacidad: 0.080,
      colorPrefix: 'rgba(255, 248, 218, '
    },
    {
      // Haz 2: Resplandor cenital suave sobre la sala de espera y silletería izquierda
      origenX1: 100, origenX2: 240, origenY: 90,
      destinoX1: 75, destinoX2: 265, destinoY: 420,
      opacidad: 0.065,
      colorPrefix: 'rgba(255, 250, 230, '
    }
  ],
  limites: {
    xMin: 75,
    xMax: 540,
    yMin: 140,
    yMax: 490
  }
});

// 3. PISO 1 · PASILLO PRINCIPAL PANORÁMICO
// Luces cenitales arquitectónicas de hospital alineadas con las 2 lámparas de techo visibles
const SISTEMA_PASILLO = crearSistemaSolar({
  nombre: 'pasillo',
  cantidadParticulas: 20,
  opacidadHaces: 0.065,
  modulacionRespiracion: true,
  haces: [
    {
      // Haz 1: Plafón de techo izquierdo (pantalla x: 108..213, bajo luminaria nativa 329..522)
      origenX1: 108, origenX2: 213, origenY: 25,
      destinoX1: 92, destinoX2: 228, destinoY: 440,
      opacidad: 0.065,
      colorPrefix: 'rgba(255, 250, 235, '
    },
    {
      // Haz 2: Plafón de techo derecho (pantalla x: 467..572, bajo luminaria nativa 989..1181)
      origenX1: 467, origenX2: 572, origenY: 25,
      destinoX1: 450, destinoX2: 588, destinoY: 440,
      opacidad: 0.065,
      colorPrefix: 'rgba(255, 250, 235, '
    }
  ],
  limites: {
    xMin: 80,
    xMax: 600,
    yMin: 80,
    yMax: 440
  }
});

// 4. PISO 1 · PASILLO INTERIOR DE ESPECIALIDADES (CONSULTORIOS)
// Luces cenitales alineadas exclusivamente con las 3 lámparas de techo visibles (mundo 1024x512)
const SISTEMA_CONSULTORIOS = crearSistemaSolar({
  nombre: 'consultorios',
  cantidadParticulas: 24,
  opacidadHaces: 0.065,
  modulacionRespiracion: true,
  haces: [
    {
      // Haz 1: Plafón de techo izquierdo (mundo x: 205..319, bajo luminaria nativa 355..552)
      origenX1: 205, origenX2: 319, origenY: 38,
      destinoX1: 190, destinoX2: 334, destinoY: 445,
      opacidad: 0.065,
      colorPrefix: 'rgba(255, 250, 235, '
    },
    {
      // Haz 2: Plafón de techo central (mundo x: 530..641, bajo luminaria nativa 919..1110)
      origenX1: 530, origenX2: 641, origenY: 38,
      destinoX1: 515, destinoX2: 656, destinoY: 445,
      opacidad: 0.065,
      colorPrefix: 'rgba(255, 250, 235, '
    },
    {
      // Haz 3: Plafón de techo derecho (mundo x: 832..947, bajo luminaria nativa 1442..1641)
      origenX1: 832, origenX2: 947, origenY: 38,
      destinoX1: 816, destinoX2: 963, destinoY: 445,
      opacidad: 0.065,
      colorPrefix: 'rgba(255, 250, 235, '
    }
  ],
  // Límites en coordenadas de mundo (W = 1024)
  limites: {
    xMin: 180,
    xMax: 970,
    yMin: 80,
    yMax: 445
  }
});

window.HP_EFECTOS_AMBIENTALES = {
  crearSistemaSolar,
  gerencia: SISTEMA_GERENCIA,
  recepcion: SISTEMA_RECEPCION,
  pasillo: SISTEMA_PASILLO,
  consultorios: SISTEMA_CONSULTORIOS
};

})();
