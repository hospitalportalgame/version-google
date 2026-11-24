/* Minijuego semiológico de palpación y percusión abdominal en camilla (Paso 03).
 * Canvas ilustrado HD (560x520) integrado con la camilla y retratos reales de Hospital Portal,
 * órganos anatómicos animados, mano clínica siguiendo el cursor y verificación semiológica. */
window.HepatoDay1Modules = window.HepatoDay1Modules || {};
window.HepatoDay1Modules['exam-abdomen-minigame.mjs'] = (() => {
  const CYCLE_SECONDS = 4.2;
  const CW = 560;
  const CH = 520;

  const IMAGE_CACHE = new Map();
  function loadAsset(src) {
    if (!src) return null;
    if (IMAGE_CACHE.has(src)) return IMAGE_CACHE.get(src);
    const img = new Image();
    img.decoding = 'async';
    img.src = src;
    IMAGE_CACHE.set(src, img);
    return img;
  }

  function resolvePatientSprites(activeCase) {
    const id = String(activeCase?.id || '').toLowerCase();
    const name = String(activeCase?.patient?.name || '').toLowerCase();
    if (id.includes('masld-intro') || name.startsWith('mart')) {
      return {
        idle: 'assets/sprites/pacientes/martin/martin_sentado_frente.png',
        blink: 'assets/sprites/pacientes/martin/martin_sentado_frente_parpadeo.png',
        lying: 'assets/sprites/pacientes/martin/martin_subir_camilla.png',
        lyingCrop: { sx: 898, sy: 660, sw: 269, sh: 534 },
        lyingDw: 312,
        belly: { x: 202, w: 156, yTop: 266, yBot: 382 },
        skin: '#ec9d5c',
        skinShade: '#cc7a3f',
        skinLight: '#f8bc80',
        skinDeep: '#a95c29',
        topColor: '#577c9f',
        topShade: '#3b5978',
        topLight: '#7499bc'
      };
    }
    if (id.includes('gilbert') || name.startsWith('sof')) {
      return {
        idle: 'assets/sprites/pacientes/sofia/sofia_sentada_frente.png',
        blink: 'assets/sprites/pacientes/sofia/sofia_sentada_frente_parpadeo.png',
        lying: 'assets/sprites/pacientes/sofia/sofia_subir_camilla.png',
        lyingCrop: { sx: 890, sy: 656, sw: 283, sh: 548 },
        lyingDw: 326,
        belly: { x: 210, w: 140, yTop: 266, yBot: 380 },
        skin: '#f1a86d',
        skinShade: '#d2844b',
        skinLight: '#fac596',
        skinDeep: '#b16430',
        topColor: '#b78ee6',
        topShade: '#8c65bc',
        topLight: '#d2b1f7'
      };
    }
    if (id.includes('masld-older') || name.startsWith('elen')) {
      return {
        idle: 'assets/sprites/pacientes/elena/elena_sentada_frente.png',
        blink: 'assets/sprites/pacientes/elena/elena_sentada_frente_parpadeo.png',
        skin: '#f1ad74',
        skinShade: '#d08750',
        skinLight: '#fbca9c',
        skinDeep: '#af6936',
        topColor: '#9d81b0',
        topShade: '#775d8a',
        topLight: '#baa0cc'
      };
    }
    return null;
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[ch]));
  }

  function hexToRgb(hex) {
    const clean = String(hex || '#d9a984').replace('#', '');
    const full = clean.length === 3
      ? clean.split('').map(c => c + c).join('')
      : clean.padEnd(6, '8').slice(0, 6);
    const num = parseInt(full, 16);
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
  }

  function shiftColor(hex, amount) {
    const { r, g, b } = hexToRgb(hex);
    const clamp = v => Math.max(0, Math.min(255, Math.round(v)));
    return `rgb(${clamp(r + amount)}, ${clamp(g + amount)}, ${clamp(b + amount)})`;
  }

  function resolveAbdomenProfile(activeCase) {
    const rawExam = Array.isArray(activeCase?.exam) ? activeCase.exam[2] : null;
    const text = String(rawExam?.text || '').toLowerCase();
    const caseId = String(activeCase?.id || '').toLowerCase();

    const noHepato = /(?:sin|ni|no\s+se\s+(?:palpa|detecta))[^.;]*\b(?:hepatomegalia|h[ií]gado)\b/.test(text);
    const hepatomegaly = !noHepato && (
      /hepatomegalia|h[ií]gado\s+discretamente\s+palpable|borde\s+hep[aá]tico\s+palpable/.test(text) ||
      caseId.includes('hemochromatosis') ||
      caseId.includes('aih-planning')
    );

    const noSpleno = /(?:sin|ni|no\s+se\s+(?:palpa|detecta))[^.;]*\b(?:esplenomegalia|bazo)\b/.test(text);
    const splenomegaly = !noSpleno && (
      /bazo\s+discretamente\s+palpable|esplenomegalia\s+palpable|polo\s+espl[eé]nico/.test(text) ||
      caseId.includes('cirrhosis-compensated')
    );

    const noAscites = /(?:sin|ni|no\s+se\s+(?:detecta|palpa|evidencia))[^.;]*\b(?:ascitis|l[ií]quido\s+libre)\b/.test(text);
    const ascites = !noAscites && /\b(?:ascitis|matidez\s+desplazable)\b/.test(text);

    const sprites = resolvePatientSprites(activeCase);
    const appearance = activeCase?.patient?.appearance || {};
    const skin = sprites?.skin || appearance.skin || '#eca46b';
    const skinShade = sprites?.skinShade || appearance.skinShade || shiftColor(skin, -28);
    const skinLight = sprites?.skinLight || shiftColor(skin, 22);
    const skinDeep = sprites?.skinDeep || shiftColor(skinShade, -22);
    const top = sprites?.topColor || appearance.top || '#5d8393';
    const topShade = sprites?.topShade || appearance.topShade || shiftColor(top, -28);
    const topLight = sprites?.topLight || shiftColor(top, 22);
    const hair = appearance.hair || '#4d3e34';
    const hairLight = shiftColor(hair, 24);
    const style = appearance.style || 'short';
    const glasses = Boolean(appearance.glasses);
    const name = activeCase?.patient?.name || 'el paciente';

    const correctKey = ascites
      ? 'ascites'
      : hepatomegaly
        ? 'hepatomegaly'
        : splenomegaly
          ? 'splenomegaly'
          : 'normal';

    const quizOptions = [
      { id: 'normal', label: 'Abdomen blando, sin visceromegalias ni ascitis' },
      { id: 'hepatomegaly', label: 'Borde hepático palpable bajo reborde costal derecho' },
      { id: 'splenomegaly', label: 'Polo esplénico discretamente palpable al inspirar' }
    ];
    if (ascites) {
      quizOptions[2] = { id: 'ascites', label: 'Matidez desplazable en flancos (ascitis)' };
    }

    return {
      name,
      sprites,
      skin,
      skinShade,
      skinLight,
      skinDeep,
      top,
      topShade,
      topLight,
      hair,
      hairLight,
      style,
      glasses,
      hepatomegaly,
      splenomegaly,
      ascites,
      correctKey,
      quizOptions,
      officialTitle: rawExam?.title || 'Abdomen',
      officialText: rawExam?.text || 'Abdomen blando e indoloro. Sin ascitis ni visceromegalias palpables.',
      zones: [
        {
          id: 'hcd',
          key: '1',
          code: 'HCD',
          px: 236,
          py: 310,
          title: 'Hipocondrio derecho',
          maneuver: 'Palpación del borde hepático',
          syncRequired: true,
          tapsRequired: 1,
          abnormal: hepatomegaly,
          patientLine: hepatomegaly
            ? '«Noto una ligera presión aquí arriba, pero no me duele.»'
            : '«No me molesta ni duele nada, doctora.»',
          shortLabel: hepatomegaly ? 'Borde hepático palpable' : 'Sin hepatomegalia',
          finding: hepatomegaly
            ? 'Borde hepático discretamente palpable bajo el reborde costal derecho al inspirar; liso e indoloro.'
            : 'Sin hepatomegalia palpable ni dolor en hipocondrio derecho (signo de Murphy negativo).'
        },
        {
          id: 'hci',
          key: '2',
          code: 'HCI',
          px: 324,
          py: 310,
          title: 'Hipocondrio izquierdo',
          maneuver: 'Palpación del polo esplénico',
          syncRequired: true,
          tapsRequired: 1,
          abnormal: splenomegaly,
          patientLine: splenomegaly
            ? '«Siento un poco lleno este costado al tomar aire hondo, sin dolor.»'
            : '«Todo tranquilo por este lado, doctora.»',
          shortLabel: splenomegaly ? 'Bazo palpable' : 'Sin esplenomegalia',
          finding: splenomegaly
            ? 'Polo inferior del bazo discretamente palpable en inspiración profunda; indoloro.'
            : 'Espacio de Traube libre; no se palpa polo esplénico durante la inspiración.'
        },
        {
          id: 'flanks',
          key: '3',
          code: 'PERC',
          px: 280,
          py: 364,
          title: 'Flancos y mesogastrio',
          maneuver: 'Percusión comparativa abdominal',
          syncRequired: false,
          tapsRequired: 2,
          abnormal: ascites,
          patientLine: ascites
            ? '«Me siento algo distendido en los costados.»'
            : '«No siento distensión ni dolor al percutir.»',
          shortLabel: ascites ? 'Matidez en flancos' : 'Timpanismo conservado',
          finding: ascites
            ? 'Matidez en flancos compatible con líquido libre abdominal.'
            : 'Timpanismo abdominal conservado en flancos y mesogastrio; sin matidez desplazable ni ascitis.'
        }
      ]
    };
  }

  function playPercussionTone(ambience, dull) {
    if (!ambience?.enabled || !ambience?.unlocked || ambience?.context?.state !== 'running') return;
    try {
      const ctx = ambience.context;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(dull ? 128 : 212, now);
      osc.frequency.exponentialRampToValueAtTime(dull ? 78 : 138, now + (dull ? 0.085 : 0.135));
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(dull ? 0.14 : 0.11, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + (dull ? 0.095 : 0.15));
      osc.connect(gain);
      gain.connect(ambience.master || ctx.destination);
      osc.start(now);
      osc.stop(now + 0.16);
    } catch {}
  }

  function playBreathCue(ambience, isInhale) {
    if (!ambience?.enabled || !ambience?.unlocked || ambience?.context?.state !== 'running') return;
    try {
      const ctx = ambience.context;
      const now = ctx.currentTime;
      const dur = isInhale ? 0.65 : 0.55;
      const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
      const data = buf.getChannelData(0);
      let seed = isInhale ? 3141 : 9265;
      for (let i = 0; i < data.length; i++) {
        seed = (seed * 16807) % 2147483647;
        data[i] = (seed / 2147483647) * 2 - 1;
      }
      const src = ctx.createBufferSource();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      src.buffer = buf;
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(isInhale ? 520 : 380, now);
      filter.frequency.linearRampToValueAtTime(isInhale ? 760 : 280, now + dur);
      filter.Q.value = 1.4;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(isInhale ? 0.024 : 0.016, now + dur * 0.45);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(ambience.master || ctx.destination);
      src.start(now);
      src.stop(now + dur + 0.02);
    } catch {}
  }

  function roundRectPath(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  }

  /* =========================================================================
   * RENDERIZADOR ILUSTRADO HD (ESTILO HOSPITAL PORTAL CON SPRITES REALES)
   * ========================================================================= */
  function drawClinicFloorAndStretcher(ctx, stretcherImg) {
    // Piso cálido de baldosas del consultorio (paleta exacta de fondo.png)
    const floorGrad = ctx.createLinearGradient(0, 0, CW, CH);
    floorGrad.addColorStop(0, '#e8cfa9');
    floorGrad.addColorStop(0.55, '#cfa984');
    floorGrad.addColorStop(1, '#b88f6c');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, 0, CW, CH);

    // Cuadrícula de baldosas con suave brillo cálido
    ctx.strokeStyle = 'rgba(132, 92, 62, 0.25)';
    ctx.lineWidth = 1.5;
    for (let x = 0; x <= CW; x += 64) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CH); ctx.stroke();
    }
    for (let y = 0; y <= CH; y += 64) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CW, y); ctx.stroke();
    }

    // Rayos diagonales suaves de luz solar desde la ventana izquierda
    ctx.save();
    const sunGrad = ctx.createLinearGradient(0, 0, 260, 260);
    sunGrad.addColorStop(0, 'rgba(255, 248, 220, 0.34)');
    sunGrad.addColorStop(1, 'rgba(255, 248, 220, 0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(220, 0);
    ctx.lineTo(70, CH);
    ctx.lineTo(0, CH);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Sombra suave de la camilla
    ctx.save();
    ctx.fillStyle = 'rgba(34, 30, 28, 0.24)';
    roundRectPath(ctx, 64, 18, 444, 492, 26);
    ctx.fill();
    ctx.restore();

    // Camilla clínica real (camilla-consultorio.png) + sábana de papel clínica
    if (stretcherImg && stretcherImg.complete && stretcherImg.naturalWidth > 0) {
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      const sw = stretcherImg.naturalWidth;
      const sh = stretcherImg.naturalHeight;
      ctx.drawImage(
        stretcherImg,
        sw * 0.28, sh * 0.13, sw * 0.46, sh * 0.60,
        42, 4, 476, 514
      );
      ctx.restore();
    } else {
      // Respaldo estilizado mientras carga
      ctx.fillStyle = '#253445';
      roundRectPath(ctx, 54, 10, 452, 500, 22);
      ctx.fill();
      ctx.fillStyle = '#e7eff5';
      roundRectPath(ctx, 66, 20, 428, 480, 16);
      ctx.fill();
    }

    // Rollo de papel de camilla clínico
    ctx.save();
    const paperGrad = ctx.createLinearGradient(110, 0, 450, 0);
    paperGrad.addColorStop(0, '#e3dac8');
    paperGrad.addColorStop(0.08, '#faf6ec');
    paperGrad.addColorStop(0.92, '#f8f2e4');
    paperGrad.addColorStop(1, '#ded4c0');
    ctx.fillStyle = paperGrad;
    roundRectPath(ctx, 110, 152, 340, 352, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(138, 124, 102, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    for (const fy of [224, 314, 404, 466]) {
      ctx.strokeStyle = 'rgba(182, 168, 142, 0.28)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(118, fy); ctx.lineTo(442, fy); ctx.stroke();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.beginPath(); ctx.moveTo(118, fy + 1.5); ctx.lineTo(442, fy + 1.5); ctx.stroke();
    }
    ctx.restore();
  }

  function drawClinicPillow(ctx) {
    // Almohada amplia y mullida que sostiene cómodamente la cabeza chibi en decúbito supino
    ctx.save();
    ctx.fillStyle = 'rgba(42, 58, 74, 0.16)';
    roundRectPath(ctx, 134, 18, 292, 166, 30);
    ctx.fill();

    const pillowGrad = ctx.createLinearGradient(134, 10, 134, 178);
    pillowGrad.addColorStop(0, '#ffffff');
    pillowGrad.addColorStop(0.68, '#ebf3f8');
    pillowGrad.addColorStop(1, '#c8dae6');
    ctx.fillStyle = pillowGrad;
    roundRectPath(ctx, 134, 10, 292, 166, 28);
    ctx.fill();
    ctx.strokeStyle = '#364b5e';
    ctx.lineWidth = 2.6;
    ctx.stroke();

    // Costura interior suave de la funda de almohada
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 2;
    roundRectPath(ctx, 144, 18, 272, 150, 22);
    ctx.stroke();
    ctx.restore();
  }

  function drawExposedAbdomenWindow(ctx, profile, breath, belly) {
    const expand = breath * 3.5;
    const xL = belly.x - expand;
    const xR = belly.x + belly.w + expand;
    const yTop = belly.yTop;
    const yBot = belly.yBot;

    ctx.save();
    // Contorno del abdomen descubierto coincidiendo exactamente con el ancho del tronco del sprite
    const skinGrad = ctx.createLinearGradient(xL, 0, xR, 0);
    skinGrad.addColorStop(0, profile.skinDeep);
    skinGrad.addColorStop(0.14, profile.skinShade);
    skinGrad.addColorStop(0.38, profile.skin);
    skinGrad.addColorStop(0.52, profile.skinLight);
    skinGrad.addColorStop(0.72, profile.skin);
    skinGrad.addColorStop(0.88, profile.skinShade);
    skinGrad.addColorStop(1, profile.skinDeep);

    ctx.fillStyle = skinGrad;
    ctx.strokeStyle = '#221815';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(xL + 3, yTop);
    ctx.bezierCurveTo(xL - 3, yTop + 42, xL - 4, yBot - 36, xL + 2, yBot);
    ctx.lineTo(xR - 2, yBot);
    ctx.bezierCurveTo(xR + 4, yBot - 36, xR + 3, yTop + 42, xR - 3, yTop);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Elevación y brillo suave al inspirar profundamente
    const bellyGlow = ctx.createRadialGradient(280, (yTop + yBot) * 0.5, 6, 280, (yTop + yBot) * 0.5, 76 + breath * 12);
    bellyGlow.addColorStop(0, `rgba(255, 246, 232, ${(0.18 + breath * 0.14).toFixed(3)})`);
    bellyGlow.addColorStop(1, 'rgba(255, 246, 232, 0)');
    ctx.fillStyle = bellyGlow;
    ctx.fill();

    // Sombra suave bajo el borde inferior de la camiseta levantada
    ctx.fillStyle = 'rgba(66, 36, 22, 0.24)';
    ctx.beginPath();
    ctx.moveTo(xL + 2, yTop);
    ctx.quadraticCurveTo(280, yTop + 10, xR - 2, yTop);
    ctx.lineTo(xR - 2, yTop + 11);
    ctx.quadraticCurveTo(280, yTop + 21, xL + 2, yTop + 11);
    ctx.closePath();
    ctx.fill();

    // Doblez limpio de la camiseta recogida justo sobre el epigastrio
    const hemGrad = ctx.createLinearGradient(xL, yTop - 12, xR, yTop + 8);
    hemGrad.addColorStop(0, profile.topShade);
    hemGrad.addColorStop(0.32, profile.top);
    hemGrad.addColorStop(0.55, profile.topLight);
    hemGrad.addColorStop(0.85, profile.top);
    hemGrad.addColorStop(1, profile.topShade);
    ctx.fillStyle = hemGrad;
    ctx.strokeStyle = '#201816';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(xL - 2, yTop - 10);
    ctx.quadraticCurveTo(280, yTop - 2, xR + 2, yTop - 10);
    ctx.quadraticCurveTo(xR + 4, yTop + 2, xR, yTop + 6);
    ctx.quadraticCurveTo(280, yTop + 14, xL, yTop + 6);
    ctx.quadraticCurveTo(xL - 4, yTop + 2, xL - 2, yTop - 10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Brillo del pliegue de la tela
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(xL + 8, yTop - 3);
    ctx.quadraticCurveTo(280, yTop + 4, xR - 8, yTop - 3);
    ctx.stroke();

    // Línea alba sutil y ombligo bien ubicado en mesogastrio
    ctx.strokeStyle = 'rgba(116, 70, 44, 0.18)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(280, yTop + 16);
    ctx.lineTo(280, 340);
    ctx.stroke();

    ctx.fillStyle = profile.skinShade;
    ctx.beginPath();
    ctx.ellipse(280, 348, 6.5, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = profile.skinDeep;
    ctx.beginPath();
    ctx.ellipse(280, 347.5, 3.8, 2.7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = profile.skinLight;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.arc(280, 349.5, 4.4, 0.25, Math.PI - 0.25);
    ctx.stroke();
    ctx.restore();
  }

  function drawClinicalDrape(ctx, yTop = 382) {
    // Sábana clínica doblada sobre caderas y piernas (deja manos a los lados libres)
    ctx.save();
    ctx.fillStyle = 'rgba(32, 44, 48, 0.2)';
    ctx.beginPath();
    ctx.moveTo(164, yTop - 2);
    ctx.quadraticCurveTo(280, yTop - 12, 396, yTop - 2);
    ctx.lineTo(398, yTop + 10);
    ctx.lineTo(162, yTop + 10);
    ctx.closePath();
    ctx.fill();

    const drapeGrad = ctx.createLinearGradient(0, yTop, 0, 504);
    drapeGrad.addColorStop(0, '#eef7f5');
    drapeGrad.addColorStop(0.28, '#cfe3df');
    drapeGrad.addColorStop(1, '#9fc2bc');
    ctx.fillStyle = drapeGrad;
    ctx.strokeStyle = '#2d494c';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(162, yTop);
    ctx.quadraticCurveTo(280, yTop - 10, 398, yTop);
    ctx.lineTo(408, 504);
    ctx.lineTo(152, 504);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Doblez superior blanco de la sábana
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(168, yTop + 12);
    ctx.quadraticCurveTo(280, yTop + 3, 392, yTop + 12);
    ctx.stroke();
    ctx.restore();
  }

  function drawSupinePatientChibi(ctx, profile, breath, now, headIdleImg, headBlinkImg, lyingImg) {
    drawClinicPillow(ctx);

    // 1. PACIENTES CON SPRITE OFICIAL ACOSTADO (Martín y Sofía): usamos su sprite real en camilla
    if (profile.sprites?.lyingCrop && lyingImg?.complete && lyingImg.naturalWidth > 0) {
      const crop = profile.sprites.lyingCrop;
      const dw = profile.sprites.lyingDw || 312;
      const dh = Math.round(dw * (crop.sh / crop.sw));
      const dx = Math.round(280 - dw / 2);
      const dy = 12;

      ctx.save();
      // Sombra suave proyectada por el paciente acostado sobre la camilla
      ctx.fillStyle = 'rgba(34, 28, 22, 0.14)';
      ctx.beginPath();
      ctx.ellipse(280, 290, 118, 178, 0, 0, Math.PI * 2);
      ctx.fill();

      // Sprite oficial acostado (cuadro 5 de subir_camilla.png) con perspectiva y proporciones 100% reales
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        lyingImg,
        crop.sx, crop.sy, crop.sw, crop.sh,
        dx, dy, dw, dh
      );
      ctx.restore();

      // Abdomen descubierto perfectamente encajado en el tronco real + sábana inferior
      drawExposedAbdomenWindow(ctx, profile, breath, profile.sprites.belly);
      drawClinicalDrape(ctx, profile.sprites.belly.yBot);
      return;
    }

    // 2. ELENA Y OTROS PACIENTES: mismas proporciones chibi exactas que Martín/Sofía acostados
    const belly = { x: 204, w: 152, yTop: 266, yBot: 382 };
    const expand = breath * 3.5;

    ctx.save();
    // Sombra suave sobre la camilla
    ctx.fillStyle = 'rgba(38, 32, 24, 0.14)';
    ctx.beginPath();
    ctx.ellipse(280, 298, 114, 160, 0, 0, Math.PI * 2);
    ctx.fill();

    // Brazos y manos chibi descansando a los lados (idéntica postura al sprite acostado de Martín)
    for (const side of [-1, 1]) {
      const innerX = side < 0 ? 202 : 358;
      const outerX = side < 0 ? 164 : 396;
      const armGrad = ctx.createLinearGradient(Math.min(innerX, outerX), 0, Math.max(innerX, outerX), 0);
      armGrad.addColorStop(0, side < 0 ? profile.skinShade : profile.skinLight);
      armGrad.addColorStop(0.5, profile.skin);
      armGrad.addColorStop(1, side < 0 ? profile.skinLight : profile.skinShade);

      ctx.fillStyle = armGrad;
      ctx.strokeStyle = '#221815';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(innerX, 232);
      ctx.lineTo(outerX, 232);
      ctx.quadraticCurveTo(outerX + side * 6, 312, outerX - side * 2, 374);
      ctx.quadraticCurveTo((outerX + innerX) / 2, 392, innerX + side * 2, 374);
      ctx.quadraticCurveTo(innerX + side * 4, 312, innerX, 232);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Camisa / blusa superior chibi compacta con mangas cortas (mismo ancho relativo que Martín acostado)
    const shirtGrad = ctx.createLinearGradient(164, 188, 396, 272);
    shirtGrad.addColorStop(0, profile.topShade);
    shirtGrad.addColorStop(0.3, profile.top);
    shirtGrad.addColorStop(0.54, profile.topLight);
    shirtGrad.addColorStop(0.8, profile.top);
    shirtGrad.addColorStop(1, profile.topShade);

    ctx.fillStyle = shirtGrad;
    ctx.strokeStyle = '#221815';
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(240, 194);
    ctx.bezierCurveTo(208, 196, 178, 204, 166, 224);
    ctx.lineTo(158, 266);
    ctx.lineTo(198, 270);
    ctx.lineTo(202 - expand, 266);
    ctx.quadraticCurveTo(280, 276, 358 + expand, 266);
    ctx.lineTo(362, 270);
    ctx.lineTo(402, 266);
    ctx.lineTo(394, 224);
    ctx.bezierCurveTo(382, 204, 352, 196, 320, 194);
    ctx.quadraticCurveTo(280, 214, 240, 194);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Solapas suaves de cuello polo / blusa
    ctx.strokeStyle = 'rgba(34, 24, 21, 0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(246, 198); ctx.lineTo(266, 220); ctx.lineTo(280, 212);
    ctx.moveTo(314, 198); ctx.lineTo(294, 220); ctx.lineTo(280, 212);
    ctx.stroke();
    ctx.restore();

    // Abdomen descubierto + sábana inferior
    drawExposedAbdomenWindow(ctx, profile, breath, belly);
    drawClinicalDrape(ctx, belly.yBot);

    // Cabeza chibi grande en perspectiva supina (idéntica escala que Martín/Sofía acostados)
    const blinking = (now % 4300) > 4160;
    const activeHeadImg = (blinking && headBlinkImg?.complete && headBlinkImg.naturalWidth > 0)
      ? headBlinkImg
      : (headIdleImg?.complete && headIdleImg.naturalWidth > 0 ? headIdleImg : null);

    if (activeHeadImg) {
      // Elena: su cabeza oficial recortada limpia y escalada a la misma proporción chibi (~196px con cabello)
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(280, 108, 108, 92, 0, 0, Math.PI * 2);
      ctx.clip();
      ctx.imageSmoothingEnabled = false;
      const iw = activeHeadImg.naturalWidth;
      const ih = activeHeadImg.naturalHeight;
      ctx.drawImage(
        activeHeadImg,
        iw * 0.25, ih * 0.06, iw * 0.50, ih * 0.345,
        158, 12, 244, 198
      );
      ctx.restore();
      return;
    }

    // Resto de pacientes: cabeza chibi grande en perspectiva supina mirando hacia arriba
    const cx = 280;
    const cy = 114;
    ctx.save();
    // Cabello trasero amplio sobre la almohada
    if (profile.style === 'long' || profile.style === 'bob' || profile.style === 'curly') {
      ctx.fillStyle = profile.hair;
      ctx.strokeStyle = '#221815';
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.ellipse(cx, cy + 12, 92, profile.style === 'long' ? 84 : 72, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Cuello corto chibi bajo la barbilla
    ctx.fillStyle = profile.skinShade;
    ctx.strokeStyle = '#221815';
    ctx.lineWidth = 3;
    roundRectPath(ctx, cx - 26, cy + 56, 52, 34, 10);
    ctx.fill();
    ctx.stroke();

    // Orejas chibi
    for (const dir of [-1, 1]) {
      ctx.fillStyle = profile.skin;
      ctx.strokeStyle = '#221815';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(cx + dir * 70, cy + 8, 13, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Rostro chibi amplio en perspectiva acostada (mentón ligeramente elevado)
    const faceGrad = ctx.createRadialGradient(cx - 16, cy - 12, 12, cx, cy, 80);
    faceGrad.addColorStop(0, profile.skinLight);
    faceGrad.addColorStop(0.65, profile.skin);
    faceGrad.addColorStop(1, profile.skinShade);
    ctx.fillStyle = faceGrad;
    ctx.strokeStyle = '#221815';
    ctx.lineWidth = 3.4;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 70, 68, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Cabello superior estilo Hospital Portal
    if (profile.style !== 'bald') {
      ctx.fillStyle = profile.hair;
      ctx.beginPath();
      ctx.arc(cx, cy - 10, 72, Math.PI * 1.03, Math.PI * 1.97);
      ctx.quadraticCurveTo(cx + 32, cy - 36, cx, cy - 42);
      ctx.quadraticCurveTo(cx - 34, cy - 36, cx - 70, cy - 16);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillStyle = profile.hair;
      ctx.beginPath();
      ctx.arc(cx - 64, cy - 10, 12, 0, Math.PI * 2);
      ctx.arc(cx + 64, cy - 10, 12, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ojos grandes expresivos estilo RPG mirando ligeramente hacia arriba (perspectiva supina)
    for (const dir of [-1, 1]) {
      const ex = cx + dir * 26;
      const ey = cy - 4;
      ctx.strokeStyle = '#221815';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(ex - 14, ey - 17);
      ctx.quadraticCurveTo(ex, ey - 22, ex + 14, ey - 17);
      ctx.stroke();
      if (blinking) {
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.moveTo(ex - 12, ey);
        ctx.quadraticCurveTo(ex, ey + 5, ex + 12, ey);
        ctx.stroke();
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#221815';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.ellipse(ex, ey, 13, 11, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#4c3020';
        ctx.beginPath();
        ctx.arc(ex, ey - 1, 7.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#101216';
        ctx.beginPath();
        ctx.arc(ex, ey - 1, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(ex - 3, ey - 4, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Nariz suave mirando hacia arriba
    ctx.strokeStyle = 'rgba(110, 66, 40, 0.55)';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(cx - 5, cy + 14);
    ctx.quadraticCurveTo(cx, cy + 18, cx + 5, cy + 14);
    ctx.stroke();

    // Lentes
    if (profile.glasses) {
      ctx.strokeStyle = '#2a3440';
      ctx.lineWidth = 3;
      ctx.fillStyle = 'rgba(220, 242, 252, 0.24)';
      roundRectPath(ctx, cx - 47, cy - 18, 38, 28, 8);
      ctx.fill(); ctx.stroke();
      roundRectPath(ctx, cx + 9, cy - 18, 38, 28, 8);
      ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - 9, cy - 4); ctx.lineTo(cx + 9, cy - 4); ctx.stroke();
    }

    // Boca serena que se entreabre en inspiración profunda
    ctx.strokeStyle = '#6c3c2e';
    ctx.lineWidth = 2.8;
    if (breath > 0.62) {
      ctx.fillStyle = '#753f34';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 32, 9.5, 6.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(cx - 14, cy + 31);
      ctx.quadraticCurveTo(cx, cy + 37, cx + 14, cy + 31);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawAnatomicalOrgansHD(ctx, profile, breath, zoneState) {
    const drop = (profile.hepatomegaly || profile.splenomegaly ? 14 : 9) * breath;
    const ribLift = -2.5 * breath;

    // 1. HÍGADO ILUSTRADO ENCAJADO EN EL HIPOCONDRIO DERECHO DEL ABDOMEN EXPUESTO
    ctx.save();
    const liverDone = zoneState.hcd.done;
    ctx.globalAlpha = liverDone ? 0.9 : (0.34 + breath * 0.22);
    ctx.translate(0, drop);

    const liverGrad = ctx.createLinearGradient(204, 272, 290, 336);
    if (profile.hepatomegaly && liverDone) {
      liverGrad.addColorStop(0, '#ee9453');
      liverGrad.addColorStop(0.45, '#c95c2b');
      liverGrad.addColorStop(1, '#8c3514');
    } else {
      liverGrad.addColorStop(0, '#df7461');
      liverGrad.addColorStop(0.48, '#b44539');
      liverGrad.addColorStop(1, '#7c2924');
    }

    ctx.fillStyle = liverGrad;
    ctx.strokeStyle = liverDone ? (profile.hepatomegaly ? '#6c280d' : '#4a1b19') : 'rgba(92, 44, 38, 0.72)';
    ctx.lineWidth = liverDone ? 2.4 : 1.7;
    ctx.beginPath();
    if (profile.hepatomegaly) {
      ctx.moveTo(208, 282);
      ctx.bezierCurveTo(222, 268, 270, 268, 294, 284);
      ctx.bezierCurveTo(286, 308, 264, 330, 218, 338);
      ctx.bezierCurveTo(204, 328, 202, 302, 208, 282);
    } else {
      ctx.moveTo(210, 280);
      ctx.bezierCurveTo(224, 270, 266, 270, 286, 284);
      ctx.bezierCurveTo(276, 300, 254, 312, 218, 316);
      ctx.bezierCurveTo(206, 308, 204, 294, 210, 280);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 226, 212, 0.5)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(254, 274);
    ctx.quadraticCurveTo(252, 290, 248, profile.hepatomegaly ? 306 : 296);
    ctx.stroke();
    ctx.restore();

    // 2. BAZO ILUSTRADO ENCAJADO EN EL HIPOCONDRIO IZQUIERDO
    ctx.save();
    const spleenDone = zoneState.hci.done;
    ctx.globalAlpha = spleenDone ? 0.9 : (0.32 + breath * 0.22);
    ctx.translate(0, drop);

    const spleenGrad = ctx.createLinearGradient(324, 282, 356, 334);
    if (profile.splenomegaly && spleenDone) {
      spleenGrad.addColorStop(0, '#e89658');
      spleenGrad.addColorStop(0.55, '#be5e29');
      spleenGrad.addColorStop(1, '#7e3612');
    } else {
      spleenGrad.addColorStop(0, '#b383c4');
      spleenGrad.addColorStop(0.55, '#7e4e90');
      spleenGrad.addColorStop(1, '#4f2f5e');
    }

    ctx.fillStyle = spleenGrad;
    ctx.strokeStyle = spleenDone ? (profile.splenomegaly ? '#662b0f' : '#3a2248') : 'rgba(74, 52, 92, 0.72)';
    ctx.lineWidth = spleenDone ? 2.4 : 1.7;
    ctx.beginPath();
    if (profile.splenomegaly) {
      ctx.moveTo(350, 284);
      ctx.bezierCurveTo(360, 298, 356, 326, 332, 336);
      ctx.bezierCurveTo(320, 326, 322, 302, 334, 286);
      ctx.bezierCurveTo(340, 280, 346, 280, 350, 284);
    } else {
      ctx.moveTo(348, 284);
      ctx.bezierCurveTo(356, 294, 354, 312, 338, 316);
      ctx.bezierCurveTo(328, 308, 330, 292, 340, 282);
      ctx.closePath();
    }
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 3. REBORDE COSTAL Y REFERENCIA DE CUADRANTES ENCAJADA EN EL ABDOMEN
    ctx.save();
    ctx.strokeStyle = 'rgba(34, 62, 72, 0.78)';
    ctx.lineWidth = 2.2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(206, 318 + ribLift);
    ctx.quadraticCurveTo(238, 286 + ribLift, 280, 270 + ribLift);
    ctx.quadraticCurveTo(322, 286 + ribLift, 354, 318 + ribLift);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = 'rgba(43, 103, 119, 0.22)';
    ctx.lineWidth = 1.3;
    ctx.setLineDash([4, 5]);
    ctx.beginPath();
    ctx.moveTo(280, 272); ctx.lineTo(280, 378);
    ctx.moveTo(206, 334); ctx.lineTo(354, 334);
    ctx.stroke();
    ctx.setLineDash([]);

    if (zoneState.flanks.done) {
      ctx.strokeStyle = profile.ascites ? 'rgba(186, 106, 36, 0.55)' : 'rgba(31, 112, 72, 0.45)';
      ctx.lineWidth = 2;
      for (const fx of [234, 326]) {
        ctx.beginPath(); ctx.arc(fx, 364, 17, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(fx, 364, 9, 0, Math.PI * 2); ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawGlovedHandHD(ctx, handState, now) {
    if (!handState.visible) return;
    let dip = 0;
    let mode = handState.mode;
    if (handState.pressStart && now - handState.pressStart < handState.pressDuration * 1000) {
      const p = (now - handState.pressStart) / (handState.pressDuration * 1000);
      dip = Math.sin(p * Math.PI);
      mode = handState.pressMode || mode;
    }

    const hx = handState.x;
    const hy = handState.y + (mode === 'percuss' ? -(1 - dip) * 8 : dip * 6);

    ctx.save();
    // Hundimiento suave en piel durante palpación
    if (dip > 0.2 && mode === 'palpate') {
      const dimple = ctx.createRadialGradient(hx, hy - 4, 2, hx, hy - 4, 28);
      dimple.addColorStop(0, 'rgba(62, 34, 22, 0.26)');
      dimple.addColorStop(1, 'rgba(62, 34, 22, 0)');
      ctx.fillStyle = dimple;
      ctx.beginPath();
      ctx.arc(hx, hy - 4, 28, 0, Math.PI * 2);
      ctx.fill();
    }

    // Sombra bajo la mano enguantada
    ctx.fillStyle = 'rgba(26, 22, 18, 0.22)';
    ctx.beginPath();
    ctx.ellipse(hx + 6, hy + 14, 26, 14, 0.1, 0, Math.PI * 2);
    ctx.fill();

    const gloveGrad = ctx.createLinearGradient(hx - 22, hy - 22, hx + 22, hy + 20);
    gloveGrad.addColorStop(0, '#f4fbfe');
    gloveGrad.addColorStop(0.55, '#cfe7f1');
    gloveGrad.addColorStop(1, '#9ac0d3');
    ctx.fillStyle = gloveGrad;
    ctx.strokeStyle = '#223a4a';
    ctx.lineWidth = 2.4;

    if (mode === 'percuss') {
      // Mano plexímetro izquierda apoyada sobre el flanco
      roundRectPath(ctx, hx - 32, hy - 4, 34, 11, 5.5);
      ctx.fill(); ctx.stroke();
      // Dedo percutor derecho golpeando suavemente sobre el plexímetro
      const tapY = hy - 22 - (1 - dip) * 14;
      ctx.beginPath();
      ctx.moveTo(hx + 2, tapY + 14);
      ctx.quadraticCurveTo(hx + 12, tapY - 2, hx + 32, tapY + 4);
      ctx.lineTo(hx + 34, tapY + 16);
      ctx.quadraticCurveTo(hx + 16, tapY + 12, hx + 8, tapY + 22);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
    } else {
      // Mano plana enguantada con 4 dedos juntos apuntando hacia el reborde costal
      for (let i = 0; i < 4; i++) {
        const fx = hx - 18 + i * 10;
        const flen = i === 1 || i === 2 ? 24 : 20;
        roundRectPath(ctx, fx, hy - flen, 9.5, flen + 6, 4.5);
        ctx.fill(); ctx.stroke();
      }
      // Palma
      roundRectPath(ctx, hx - 20, hy - 3, 40, 22, 10);
      ctx.fill(); ctx.stroke();
      // Puño de bata médica blanca
      const cuffGrad = ctx.createLinearGradient(hx - 18, hy + 16, hx + 18, hy + 36);
      cuffGrad.addColorStop(0, '#ffffff');
      cuffGrad.addColorStop(1, '#d7e3ea');
      ctx.fillStyle = cuffGrad;
      roundRectPath(ctx, hx - 18, hy + 16, 36, 20, 6);
      ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  }

  function buildMarkup(profile) {
    const badgeImg = profile.sprites?.idle;
    return `
      <section class="hp-abd-stage" aria-label="Minijuego de palpación y percusión abdominal">
        <header class="hp-abd-head">
          <div class="hp-abd-head-lead">
            ${badgeImg ? `<div class="hp-exam-sprite-badge"><img src="${escapeHtml(badgeImg)}" alt="${escapeHtml(profile.name)}" /></div>` : ''}
            <div class="hp-abd-head-copy">
              <span class="hp-abd-kicker">MANIOBRA 03 · EXPLORACIÓN ABDOMINAL EN CAMILLA</span>
              <h3>Palpación y percusión de ${escapeHtml(profile.name)}</h3>
            </div>
          </div>
          <div class="hp-abd-progress-meta" id="hp-abd-progress" aria-live="polite">0 / 3 regiones</div>
        </header>

        <div class="hp-abd-grid">
          <div class="hp-abd-canvas-wrap">
            <div class="hp-abd-orient" aria-hidden="true">
              <span>DER. PACIENTE</span>
              <span>CAMILLA · DECÚBITO SUPINO</span>
              <span>IZQ. PACIENTE</span>
            </div>

            <div class="hp-abd-torso-box" id="hp-abd-torso-box">
              <canvas
                id="hp-abd-scene"
                class="hp-abd-hd-canvas"
                width="${CW}"
                height="${CH}"
                role="img"
                aria-label="Vista en camilla de ${escapeHtml(profile.name)} en decúbito supino con zonas de palpación abdominal"
              ></canvas>

              <div class="hp-abd-speech" id="hp-abd-speech" aria-live="polite">
                «Estoy listo, doctora. Respiro profundo cuando me indique.»
              </div>

              <button type="button" class="hp-abd-reticle is-hcd" data-abd-zone="hcd" aria-label="Palpar hipocondrio derecho, borde hepático. Tecla 1.">
                <span class="hp-abd-reticle-corners" aria-hidden="true"></span>
                <span class="hp-abd-reticle-tag">1 · HCD</span>
                <span class="hp-abd-reticle-sub" data-abd-sub="hcd">Hígado</span>
              </button>

              <button type="button" class="hp-abd-reticle is-hci" data-abd-zone="hci" aria-label="Palpar hipocondrio izquierdo, polo esplénico. Tecla 2.">
                <span class="hp-abd-reticle-corners" aria-hidden="true"></span>
                <span class="hp-abd-reticle-tag">2 · HCI</span>
                <span class="hp-abd-reticle-sub" data-abd-sub="hci">Bazo</span>
              </button>

              <button type="button" class="hp-abd-reticle is-flanks" data-abd-zone="flanks" aria-label="Percutir flancos y mesogastrio para descartar ascitis. Tecla 3.">
                <span class="hp-abd-reticle-corners" aria-hidden="true"></span>
                <span class="hp-abd-reticle-tag">3 · PERC</span>
                <span class="hp-abd-reticle-sub" data-abd-sub="flanks">0/2</span>
              </button>
            </div>

            <div class="hp-abd-legend" aria-hidden="true">
              <span><i class="is-liver"></i> Hígado (HCD)</span>
              <span><i class="is-spleen"></i> Bazo (HCI)</span>
              <span><i class="is-costal"></i> Reborde costal</span>
            </div>
          </div>

          <div class="hp-abd-deck">
            <div class="hp-abd-monitor-bezel" id="hp-abd-breath-card">
              <div class="hp-abd-monitor-top">
                <span class="hp-abd-monitor-title">MONITOR RESPIRATORIO</span>
                <span class="hp-abd-breath-phase" id="hp-abd-phase">↑ Inspirando</span>
              </div>
              <div class="hp-abd-crt-wrap">
                <canvas id="hp-abd-wave" class="hp-abd-wave" width="280" height="76" aria-hidden="true"></canvas>
              </div>
              <p class="hp-abd-breath-tip">
                Palpa <strong>HCD</strong> y <strong>HCI</strong> dentro de la franja verde de inspiración profunda. Percute <strong>Flancos</strong> con 2 toques.
              </p>
            </div>

            <div class="hp-abd-feedback" id="hp-abd-feedback" role="status" aria-live="polite">
              Desliza la mano sobre el abdomen y toca una retícula (o pulsa 1, 2 o 3).
            </div>

            <div class="hp-abd-quiz" id="hp-abd-quiz" hidden>
              <p class="hp-abd-quiz-title">Verificación semiológica · ¿Qué registras en el abdomen?</p>
              <div class="hp-abd-quiz-options">
                ${profile.quizOptions.map(opt => `
                  <button type="button" class="hp-abd-quiz-btn" data-abd-quiz="${opt.id}">
                    ${escapeHtml(opt.label)}
                  </button>
                `).join('')}
              </div>
            </div>

            <ul class="hp-abd-checklist" id="hp-abd-checklist">
              ${profile.zones.map(z => `
                <li class="hp-abd-check-item" data-abd-item="${z.id}">
                  <div class="hp-abd-check-top">
                    <span class="hp-abd-check-mark" aria-hidden="true">○</span>
                    <strong>${escapeHtml(z.title)}</strong>
                    <span class="hp-abd-check-state" data-abd-state="${z.id}">${z.syncRequired ? 'En inspiración' : '2 toques'}</span>
                  </div>
                  <p class="hp-abd-check-finding" data-abd-finding="${z.id}">${escapeHtml(z.maneuver)}</p>
                </li>
              `).join('')}
            </ul>
          </div>
        </div>

        <footer class="hp-abd-footer">
          <div class="hp-abd-footer-left">
            <button type="button" class="secondary-button hp-abd-btn-sm" data-abd-action="back">← Volver a la libreta</button>
            <button type="button" class="text-button hp-abd-skip-btn" data-abd-action="skip">Omitir y registrar hallazgo</button>
          </div>
          <button type="button" class="primary-button hp-abd-finish-btn" id="hp-abd-finish" data-abd-action="complete" disabled>
            Completar exploración (0/3)
          </button>
        </footer>
      </section>
    `;
  }

  function mount({ container, activeCase, ambience, onComplete, onCancel }) {
    if (!container) return { destroy() {} };

    const profile = resolveAbdomenProfile(activeCase);
    container.innerHTML = buildMarkup(profile);

    const stretcherImg = loadAsset('assets/sprites/mobiliario/camilla-consultorio.png');
    const headIdleImg = profile.sprites?.idle ? loadAsset(profile.sprites.idle) : null;
    const headBlinkImg = profile.sprites?.blink ? loadAsset(profile.sprites.blink) : null;
    const lyingImg = profile.sprites?.lying ? loadAsset(profile.sprites.lying) : null;

    const reducedMotion = Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);
    const syncThreshold = reducedMotion ? 0.34 : 0.58;
    const cycleSec = reducedMotion ? 5.6 : CYCLE_SECONDS;

    const torsoBox = container.querySelector('#hp-abd-torso-box');
    const progressEl = container.querySelector('#hp-abd-progress');
    const phaseEl = container.querySelector('#hp-abd-phase');
    const speechEl = container.querySelector('#hp-abd-speech');
    const feedbackEl = container.querySelector('#hp-abd-feedback');
    const quizBox = container.querySelector('#hp-abd-quiz');
    const breathCard = container.querySelector('#hp-abd-breath-card');
    const finishBtn = container.querySelector('#hp-abd-finish');
    const sceneCanvas = container.querySelector('#hp-abd-scene');
    const sceneCtx = sceneCanvas ? sceneCanvas.getContext('2d') : null;
    const waveCanvas = container.querySelector('#hp-abd-wave');
    const waveCtx = waveCanvas ? waveCanvas.getContext('2d') : null;

    const zoneState = Object.fromEntries(
      profile.zones.map(z => [z.id, { done: false, taps: 0 }])
    );

    const history = new Array(88).fill(0.18);
    const effects = [];
    const handState = {
      visible: true,
      x: 280,
      y: 318,
      tx: 280,
      ty: 318,
      mode: 'palpate',
      pressStart: 0,
      pressDuration: 0.48,
      pressMode: 'palpate'
    };

    let destroyed = false;
    let rafId = 0;
    let startTime = performance.now();
    let lastSampleTime = startTime;
    let currentBreath = 0.2;
    let currentInWindow = false;
    let currentPhase = 'inhale';
    let lastAudioPhase = '';
    let shakeTimer = 0;
    let quizVerified = false;
    let speechLockUntil = 0;

    function getCompletedCount() {
      return profile.zones.filter(z => zoneState[z.id].done).length;
    }

    function setSpeech(text, holdMs = 2600) {
      if (!speechEl) return;
      speechEl.textContent = text;
      speechLockUntil = performance.now() + holdMs;
    }

    function addEffect(x, y, kind, label) {
      effects.push({ x, y, kind, label, start: performance.now(), duration: 0.78 });
      if (effects.length > 8) effects.shift();
    }

    function setFeedback(text, tone = 'neutral') {
      if (!feedbackEl) return;
      feedbackEl.textContent = text;
      feedbackEl.dataset.tone = tone;
    }

    function refreshUI() {
      const doneCount = getCompletedCount();
      const total = profile.zones.length;
      const allZonesDone = doneCount >= total;

      if (progressEl) {
        progressEl.textContent = allZonesDone
          ? (quizVerified ? '✓ Semiología confirmada' : '3 / 3 · Confirma tu hallazgo')
          : `${doneCount} / ${total} regiones`;
        progressEl.classList.toggle('is-complete', allZonesDone && quizVerified);
      }

      for (const z of profile.zones) {
        const st = zoneState[z.id];
        const btn = container.querySelector(`[data-abd-zone="${z.id}"]`);
        const sub = container.querySelector(`[data-abd-sub="${z.id}"]`);
        const item = container.querySelector(`[data-abd-item="${z.id}"]`);
        const stateBadge = container.querySelector(`[data-abd-state="${z.id}"]`);
        const findingEl = container.querySelector(`[data-abd-finding="${z.id}"]`);
        const markEl = item?.querySelector('.hp-abd-check-mark');

        if (btn) {
          btn.classList.toggle('is-done', st.done);
          btn.classList.toggle('is-abnormal', st.done && z.abnormal);
          btn.setAttribute('aria-pressed', st.done ? 'true' : 'false');
        }
        if (sub) {
          if (st.done) sub.textContent = '✓ OK';
          else if (!z.syncRequired) sub.textContent = `${st.taps}/${z.tapsRequired}`;
          else sub.textContent = z.id === 'hcd' ? 'Hígado' : 'Bazo';
        }
        if (item) {
          item.classList.toggle('is-done', st.done);
          item.classList.toggle('is-abnormal', st.done && z.abnormal);
        }
        if (markEl) markEl.textContent = st.done ? '✓' : '○';
        if (stateBadge) {
          if (st.done) stateBadge.textContent = z.shortLabel;
          else if (!z.syncRequired) stateBadge.textContent = `${st.taps}/${z.tapsRequired} toques`;
          else stateBadge.textContent = 'En inspiración';
        }
        if (findingEl && st.done) findingEl.textContent = z.finding;
      }

      if (quizBox) quizBox.hidden = !allZonesDone;

      if (finishBtn) {
        finishBtn.disabled = !(allZonesDone && quizVerified);
        if (allZonesDone && quizVerified) {
          finishBtn.textContent = '✓ Registrar hallazgo abdominal en la libreta →';
        } else if (allZonesDone) {
          finishBtn.textContent = 'Confirma el hallazgo arriba ↑';
        } else {
          finishBtn.textContent = `Completar exploración (${doneCount}/${total})`;
        }
      }
    }

    function handleQuizChoice(choiceId) {
      const correct = choiceId === profile.correctKey;
      for (const btn of container.querySelectorAll('[data-abd-quiz]')) {
        const isThis = btn.dataset.abdQuiz === choiceId;
        btn.classList.toggle('is-selected', isThis);
        btn.classList.toggle('is-correct', btn.dataset.abdQuiz === profile.correctKey && (correct || isThis));
        btn.classList.toggle('is-wrong', isThis && !correct);
      }

      if (correct) {
        quizVerified = true;
        ambience?.play('stamp');
        setFeedback(`✓ Interpretación semiológica precisa. ${profile.officialText}`, 'complete');
        refreshUI();
        finishBtn?.focus({ preventScroll: true });
      } else {
        ambience?.play('beep');
        setFeedback('Revisa las 3 regiones exploradas abajo: el hallazgo real en esta camilla no coincide con esa opción. Intenta nuevamente.', 'warn');
      }
    }

    function handleZoneAction(zoneId) {
      const zone = profile.zones.find(z => z.id === zoneId);
      if (!zone) return;
      const st = zoneState[zoneId];
      const now = performance.now();

      handState.visible = true;
      handState.tx = zone.px;
      handState.ty = zone.py;
      handState.x = zone.px;
      handState.y = zone.py;

      if (st.done) {
        handState.pressStart = now;
        handState.pressDuration = 0.42;
        handState.pressMode = zone.syncRequired ? 'palpate' : 'percuss';
        setSpeech(zone.patientLine, 2200);
        setFeedback(`${zone.title}: ${zone.finding}`, 'ok');
        return;
      }

      if (zone.syncRequired) {
        handState.pressStart = now;
        handState.pressDuration = 0.5;
        handState.pressMode = 'palpate';
        if (!currentInWindow) {
          ambience?.play('beep');
          addEffect(zone.px, zone.py, 'miss', 'ESPERA ↑');
          setSpeech('«Un momento... ya tomo aire profundo.»', 1700);
          if (breathCard) {
            breathCard.classList.remove('is-nudge');
            void breathCard.offsetWidth;
            breathCard.classList.add('is-nudge');
            window.clearTimeout(shakeTimer);
            shakeTimer = window.setTimeout(() => breathCard?.classList.remove('is-nudge'), 360);
          }
          setFeedback(
            `${profile.name} está ${currentPhase === 'exhale' ? 'exhalando' : 'comenzando a inspirar'}. Espera la franja verde de inspiración profunda para palpar ${zone.code}.`,
            'warn'
          );
          return;
        }

        st.taps = 1;
        st.done = true;
        ambience?.play(zone.abnormal ? 'stamp' : 'pen');
        addEffect(zone.px, zone.py, zone.abnormal ? 'finding' : 'ok', zone.abnormal ? 'PALPABLE' : 'NORMAL');
        setSpeech(zone.patientLine, 2800);
        setFeedback(`✓ ${zone.title}: ${zone.finding}`, zone.abnormal ? 'finding' : 'ok');
      } else {
        st.taps += 1;
        const tapX = st.taps % 2 === 1 ? 234 : 326;
        const tapY = 364;
        handState.tx = tapX;
        handState.ty = tapY;
        handState.x = tapX;
        handState.y = tapY;
        handState.pressStart = now;
        handState.pressDuration = 0.44;
        handState.pressMode = 'percuss';

        playPercussionTone(ambience, profile.ascites);
        if (!ambience?.unlocked) ambience?.play('pen');
        addEffect(tapX, tapY, profile.ascites ? 'finding' : 'perc', profile.ascites ? 'MATE' : 'TIMPÁNICO');

        if (st.taps < zone.tapsRequired) {
          const soundName = profile.ascites ? 'Matidez apagada' : 'Timpanismo claro';
          setFeedback(`${soundName} en flanco derecho (${st.taps}/${zone.tapsRequired}). Percute nuevamente para comparar el flanco contralateral.`, 'neutral');
        } else {
          st.done = true;
          ambience?.play('pen');
          setSpeech(zone.patientLine, 2600);
          setFeedback(`✓ ${zone.title}: ${zone.finding}`, profile.ascites ? 'finding' : 'ok');
        }
      }

      refreshUI();

      if (getCompletedCount() >= profile.zones.length && !quizVerified) {
        ambience?.play('paper');
        setFeedback('Exploración completa. Elige abajo el resumen semiológico que corresponde a lo hallado.', 'ok');
        quizBox?.querySelector('[data-abd-quiz]')?.focus({ preventScroll: true });
      }
    }

    function drawScene(now) {
      if (!sceneCtx) return;
      drawClinicFloorAndStretcher(sceneCtx, stretcherImg);
      drawSupinePatientChibi(sceneCtx, profile, currentBreath, now, headIdleImg, headBlinkImg, lyingImg);
      drawAnatomicalOrgansHD(sceneCtx, profile, currentBreath, zoneState);

      for (let i = effects.length - 1; i >= 0; i--) {
        const fx = effects[i];
        const t = (now - fx.start) / 1000 / fx.duration;
        if (t >= 1) {
          effects.splice(i, 1);
          continue;
        }
        const palette = {
          ok: '#1f8a53',
          finding: '#cf6818',
          perc: '#1e7b91',
          miss: '#c93c30'
        }[fx.kind] || '#1f8a53';

        sceneCtx.save();
        sceneCtx.globalAlpha = Math.max(0, 1 - t);
        sceneCtx.strokeStyle = palette;
        sceneCtx.lineWidth = 3.5;
        sceneCtx.beginPath();
        sceneCtx.arc(fx.x, fx.y, 12 + t * 52, 0, Math.PI * 2);
        sceneCtx.stroke();

        if (t > 0.14) {
          sceneCtx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
          sceneCtx.lineWidth = 2;
          sceneCtx.beginPath();
          sceneCtx.arc(fx.x, fx.y, 6 + (t - 0.14) * 40, 0, Math.PI * 2);
          sceneCtx.stroke();
        }

        if (fx.label) {
          const ly = fx.y - 26 - t * 26;
          sceneCtx.font = '800 15px "JetBrains Mono", monospace';
          sceneCtx.textAlign = 'center';
          sceneCtx.lineWidth = 4;
          sceneCtx.strokeStyle = 'rgba(22, 28, 34, 0.9)';
          sceneCtx.strokeText(fx.label, fx.x, ly);
          sceneCtx.fillStyle = fx.kind === 'miss' ? '#ffd5cf' : '#fffdf4';
          sceneCtx.fillText(fx.label, fx.x, ly);
        }
        sceneCtx.restore();
      }

      drawGlovedHandHD(sceneCtx, handState, now);
    }

    function drawWave() {
      if (!waveCtx || !waveCanvas) return;
      const w = waveCanvas.width;
      const h = waveCanvas.height;
      waveCtx.clearRect(0, 0, w, h);

      waveCtx.fillStyle = '#0e1d23';
      waveCtx.fillRect(0, 0, w, h);

      waveCtx.strokeStyle = 'rgba(116, 178, 190, 0.12)';
      waveCtx.lineWidth = 1;
      for (let gx = 20; gx < w; gx += 22) {
        waveCtx.beginPath(); waveCtx.moveTo(gx, 0); waveCtx.lineTo(gx, h); waveCtx.stroke();
      }
      for (let gy = 18; gy < h; gy += 18) {
        waveCtx.beginPath(); waveCtx.moveTo(0, gy); waveCtx.lineTo(w, gy); waveCtx.stroke();
      }

      const padTop = 9;
      const padBottom = 10;
      const usableH = h - padTop - padBottom;
      const bandBottomY = padTop + (1 - syncThreshold) * usableH;

      waveCtx.fillStyle = currentInWindow ? 'rgba(65, 205, 134, 0.28)' : 'rgba(65, 205, 134, 0.13)';
      waveCtx.fillRect(0, padTop, w, Math.max(8, bandBottomY - padTop));

      waveCtx.strokeStyle = currentInWindow ? 'rgba(128, 245, 185, 0.75)' : 'rgba(116, 224, 168, 0.42)';
      waveCtx.lineWidth = 1;
      waveCtx.setLineDash([4, 4]);
      waveCtx.beginPath();
      waveCtx.moveTo(0, bandBottomY);
      waveCtx.lineTo(w, bandBottomY);
      waveCtx.stroke();
      waveCtx.setLineDash([]);

      waveCtx.fillStyle = currentInWindow ? '#c9ffdf' : '#85cca8';
      waveCtx.font = '700 9.5px "JetBrains Mono", monospace';
      waveCtx.fillText('INSPIRACIÓN PROFUNDA', 8, padTop + 10);

      const stepX = (w - 18) / (history.length - 1);
      waveCtx.beginPath();
      for (let i = 0; i < history.length; i++) {
        const x = 6 + i * stepX;
        const y = padTop + (1 - history[i]) * usableH;
        if (i === 0) waveCtx.moveTo(x, y);
        else waveCtx.lineTo(x, y);
      }
      waveCtx.strokeStyle = currentInWindow ? 'rgba(107, 240, 168, 0.35)' : 'rgba(124, 197, 212, 0.25)';
      waveCtx.lineWidth = 5;
      waveCtx.stroke();

      waveCtx.strokeStyle = currentInWindow ? '#73f5ae' : '#86d1e0';
      waveCtx.lineWidth = 2.2;
      waveCtx.lineJoin = 'round';
      waveCtx.stroke();

      const lastX = 6 + (history.length - 1) * stepX;
      const lastY = padTop + (1 - history[history.length - 1]) * usableH;
      waveCtx.fillStyle = currentInWindow ? '#d2ffe6' : '#dff6fb';
      waveCtx.beginPath();
      waveCtx.arc(lastX, lastY, currentInWindow ? 4.2 : 3.2, 0, Math.PI * 2);
      waveCtx.fill();

      waveCtx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      for (let sy = 0; sy < h; sy += 3) waveCtx.fillRect(0, sy, w, 1);
    }

    function tick(now) {
      if (destroyed) return;
      const elapsed = (now - startTime) / 1000;
      const phasePos = (elapsed % cycleSec) / cycleSec;

      let breath;
      if (phasePos < 0.44) {
        const t = phasePos / 0.44;
        breath = 0.5 - 0.5 * Math.cos(t * Math.PI);
        currentPhase = 'inhale';
      } else if (phasePos < 0.56) {
        breath = 1 - 0.04 * ((phasePos - 0.44) / 0.12);
        currentPhase = 'peak';
      } else {
        const t = (phasePos - 0.56) / 0.44;
        breath = 0.96 * (0.5 + 0.5 * Math.cos(t * Math.PI));
        currentPhase = 'exhale';
      }

      if (currentPhase !== lastAudioPhase) {
        if (currentPhase === 'inhale') playBreathCue(ambience, true);
        else if (currentPhase === 'exhale') playBreathCue(ambience, false);
        lastAudioPhase = currentPhase;
      }

      currentBreath = breath;
      currentInWindow = breath >= syncThreshold;

      handState.x += (handState.tx - handState.x) * 0.28;
      handState.y += (handState.ty - handState.y) * 0.28;

      if (now - lastSampleTime >= 36) {
        history.push(breath);
        if (history.length > 88) history.shift();
        lastSampleTime = now;
      }

      if (phaseEl) {
        if (currentInWindow) phaseEl.textContent = '● Inspiración profunda';
        else if (currentPhase === 'exhale') phaseEl.textContent = '↓ Exhalando';
        else phaseEl.textContent = '↑ Inspirando';
        phaseEl.classList.toggle('is-window', currentInWindow);
      }

      if (speechEl && now > speechLockUntil) {
        if (getCompletedCount() >= profile.zones.length) {
          speechEl.textContent = '«Gracias, doctora. ¿Cómo encontró todo?»';
        } else if (currentInWindow) {
          speechEl.textContent = '«Inhalo profundo...»';
        } else if (currentPhase === 'exhale') {
          speechEl.textContent = '«Suelto el aire despacio...»';
        } else {
          speechEl.textContent = '«Tomando aire...»';
        }
      }

      const hcdBtn = container.querySelector('[data-abd-zone="hcd"]');
      const hciBtn = container.querySelector('[data-abd-zone="hci"]');
      if (hcdBtn) hcdBtn.classList.toggle('is-window', currentInWindow && !zoneState.hcd.done);
      if (hciBtn) hciBtn.classList.toggle('is-window', currentInWindow && !zoneState.hci.done);

      drawScene(now);
      drawWave();
      rafId = window.requestAnimationFrame(tick);
    }

    function onPointerMove(event) {
      if (!torsoBox) return;
      const rect = torsoBox.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const rx = ((event.clientX - rect.left) / rect.width) * CW;
      const ry = ((event.clientY - rect.top) / rect.height) * CH;
      handState.visible = true;
      handState.tx = Math.max(150, Math.min(410, rx));
      handState.ty = Math.max(210, Math.min(420, ry));
      handState.mode = ry > 330 ? 'percuss' : 'palpate';
    }

    function onZoneHover(event) {
      const btn = event.target.closest('[data-abd-zone]');
      if (!btn) return;
      const zone = profile.zones.find(z => z.id === btn.dataset.abdZone);
      if (!zone) return;
      handState.visible = true;
      handState.tx = zone.px;
      handState.ty = zone.py;
      handState.mode = zone.syncRequired ? 'palpate' : 'percuss';
    }

    function onClick(event) {
      const zoneBtn = event.target.closest('[data-abd-zone]');
      if (zoneBtn) {
        event.preventDefault();
        event.stopPropagation();
        handleZoneAction(zoneBtn.dataset.abdZone);
        return;
      }
      const quizBtn = event.target.closest('[data-abd-quiz]');
      if (quizBtn) {
        event.preventDefault();
        event.stopPropagation();
        handleQuizChoice(quizBtn.dataset.abdQuiz);
        return;
      }
      const actionBtn = event.target.closest('[data-abd-action]');
      if (!actionBtn) return;
      event.preventDefault();
      event.stopPropagation();
      const act = actionBtn.dataset.abdAction;
      if (act === 'back') { destroy(); onCancel?.(); }
      else if (act === 'skip') { destroy(); onComplete?.({ skipped: true }); }
      else if (act === 'complete' && getCompletedCount() >= profile.zones.length && quizVerified) {
        destroy();
        onComplete?.({ skipped: false });
      }
    }

    function onKeyDown(event) {
      if (destroyed || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key === '1') { event.preventDefault(); handleZoneAction('hcd'); }
      else if (event.key === '2') { event.preventDefault(); handleZoneAction('hci'); }
      else if (event.key === '3') { event.preventDefault(); handleZoneAction('flanks'); }
    }

    torsoBox?.addEventListener('pointermove', onPointerMove);
    container.addEventListener('pointerover', onZoneHover);
    container.addEventListener('focusin', onZoneHover);
    container.addEventListener('click', onClick);
    document.addEventListener('keydown', onKeyDown);
    refreshUI();
    rafId = window.requestAnimationFrame(tick);

    function destroy() {
      if (destroyed) return;
      destroyed = true;
      if (rafId) window.cancelAnimationFrame(rafId);
      window.clearTimeout(shakeTimer);
      torsoBox?.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerover', onZoneHover);
      container.removeEventListener('focusin', onZoneHover);
      container.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKeyDown);
    }

    return { destroy };
  }

  return { mount, resolveAbdomenProfile };
})();
