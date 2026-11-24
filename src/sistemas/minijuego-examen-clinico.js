/* Minijuegos semiológicos en camilla para los Pasos 01 (Signos vitales + Asterixis)
 * y 02 (Inspección con linterna clínica). Canvas ilustrado HD (560x470) integrado con
 * la estética cálida y sprites oficiales de Hospital Portal. */
window.HepatoDay1Modules = window.HepatoDay1Modules || {};
window.HepatoDay1Modules['exam-clinical-minigames.mjs'] = (() => {
  const CW = 560;
  const CH = 470;

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
        topColor: '#567896'
      };
    }
    if (id.includes('gilbert') || name.startsWith('sof')) {
      return {
        idle: 'assets/sprites/pacientes/sofia/sofia_sentada_frente.png',
        blink: 'assets/sprites/pacientes/sofia/sofia_sentada_frente_parpadeo.png',
        topColor: '#a682d4'
      };
    }
    if (id.includes('masld-older') || name.startsWith('elen')) {
      return {
        idle: 'assets/sprites/pacientes/elena/elena_sentada_frente.png',
        blink: 'assets/sprites/pacientes/elena/elena_sentada_frente_parpadeo.png',
        topColor: '#9b82ae'
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

  function roundRectPath(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  }

  /* =========================================================================
   * PASO 01 · SIGNOS VITALES (TENSIÓMETRO ANEROIDE HD + ASTERIXIS)
   * ========================================================================= */
  function resolveVitalsProfile(activeCase) {
    const rawExam = Array.isArray(activeCase?.exam) ? activeCase.exam[0] : null;
    const text = String(rawExam?.text || '');
    const lower = text.toLowerCase();
    const p = activeCase?.patient || {};
    const appearance = p.appearance || {};
    const sprites = resolvePatientSprites(activeCase);

    const bpMatch = text.match(/PA\s*(\d{2,3}\s*\/\s*\d{2,3})\s*mmHg/i);
    const bp = bpMatch ? bpMatch[1].replace(/\s+/g, '') : '120/76';
    const [sysStr, diaStr] = bp.split('/');
    const sys = Number(sysStr) || 120;
    const dia = Number(diaStr) || 76;

    const fcMatch = text.match(/FC\s*(\d{2,3})\s*\/min/i);
    const hr = fcMatch ? Number(fcMatch[1]) : 74;

    const bmiVal = Number.isFinite(p.bmi) ? String(p.bmi).replace('.', ',') : null;
    const checkAsterixis = /asterixis/.test(lower);
    const skin = appearance.skin || '#e2a97e';
    const skinShade = appearance.skinShade || shiftColor(skin, -28);
    const skinLight = shiftColor(skin, 22);
    const top = sprites?.topColor || appearance.top || '#5d8393';
    const topShade = shiftColor(top, -28);

    return {
      name: p.name || 'el paciente',
      sprites,
      bp,
      sys,
      dia,
      hr,
      bmiVal,
      checkAsterixis,
      skin,
      skinShade,
      skinLight,
      top,
      topShade,
      officialTitle: rawExam?.title || 'Signos vitales',
      officialText: text || `PA ${bp} mmHg. Paciente lúcido, afebril y estable.`
    };
  }

  function playKorotkoffTick(ambience, strong = false) {
    if (!ambience?.enabled || !ambience?.unlocked || ambience?.context?.state !== 'running') return;
    try {
      const ctx = ambience.context;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(strong ? 96 : 74, now);
      osc.frequency.exponentialRampToValueAtTime(42, now + 0.08);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(strong ? 0.16 : 0.09, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
      osc.connect(gain);
      gain.connect(ambience.master || ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    } catch {}
  }

  function mountVitals({ container, activeCase, ambience, onComplete, onCancel }) {
    if (!container) return { destroy() {} };

    const profile = resolveVitalsProfile(activeCase);
    const reducedMotion = Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);
    const badgeImg = profile.sprites?.idle;

    const secondTaskTitle = profile.checkAsterixis
      ? 'Prueba de asterixis (flapping)'
      : 'Estado general y antropometría';
    const secondTaskAction = profile.checkAsterixis
      ? 'Evaluar dorsiflexión de muñecas (Tecla 2)'
      : 'Registrar temperatura, IMC y lucidez (Tecla 2)';

    container.innerHTML = `
      <section class="hp-abd-stage" aria-label="Minijuego de signos vitales en camilla">
        <header class="hp-abd-head">
          <div class="hp-abd-head-lead">
            ${badgeImg ? `<div class="hp-exam-sprite-badge"><img src="${escapeHtml(badgeImg)}" alt="${escapeHtml(profile.name)}" /></div>` : ''}
            <div class="hp-abd-head-copy">
              <span class="hp-abd-kicker">MANIOBRA 01 · SIGNOS VITALES Y CONTROL NEUROLÓGICO</span>
              <h3>Control basal de ${escapeHtml(profile.name)}</h3>
            </div>
          </div>
          <div class="hp-abd-progress-meta" id="hp-vit-progress" aria-live="polite">0 / 2 controles</div>
        </header>

        <div class="hp-abd-grid">
          <div class="hp-abd-canvas-wrap">
            <div class="hp-abd-orient" aria-hidden="true">
              <span>ESFIGMOMANÓMETRO ANEROIDE</span>
              <span>${profile.checkAsterixis ? 'BRAZO + MUÑECAS' : 'BRAZO + CONTROL BASAL'}</span>
            </div>
            <div class="hp-abd-torso-box hp-vit-box">
              <canvas id="hp-vit-scene" class="hp-abd-hd-canvas" width="${CW}" height="${CH}" role="img" aria-label="Tensiómetro clínico ilustrado para medir la presión arterial de ${escapeHtml(profile.name)}"></canvas>
            </div>
            <div class="hp-vit-controls">
              <button type="button" class="primary-button hp-vit-action-btn" id="hp-vit-bp-btn" data-vit-action="bp">
                🩺 Captar presión arterial (Espacio / 1)
              </button>
              <button type="button" class="secondary-button hp-vit-action-btn" id="hp-vit-sec-btn" data-vit-action="secondary">
                ${profile.checkAsterixis ? '✋' : '📋'} ${secondTaskAction}
              </button>
            </div>
          </div>

          <div class="hp-abd-deck">
            <div class="hp-abd-monitor-bezel" id="hp-vit-bezel">
              <div class="hp-abd-monitor-top">
                <span class="hp-abd-monitor-title">AUSCULTACIÓN KOROTKOFF</span>
                <span class="hp-abd-breath-phase" id="hp-vit-phase">Esperando lectura</span>
              </div>
              <div class="hp-vit-readout-grid">
                <div class="hp-vit-metric">
                  <span>PRESIÓN ARTERIAL</span>
                  <strong id="hp-vit-bp-val">--- / ---</strong>
                  <small>mmHg</small>
                </div>
                <div class="hp-vit-metric">
                  <span>${profile.checkAsterixis ? 'ASTERIXIS' : 'IMC / ESTADO'}</span>
                  <strong id="hp-vit-sec-val">Pendiente</strong>
                  <small>${profile.checkAsterixis ? 'Dorsiflexión' : (profile.bmiVal ? 'kg/m²' : 'Estado general')}</small>
                </div>
              </div>
              <p class="hp-abd-breath-tip">
                Pulsa <strong>Captar presión arterial</strong> cuando la aguja del manómetro pase por la <strong>franja verde</strong> de ruidos de Korotkoff.
              </p>
            </div>

            <div class="hp-abd-feedback" id="hp-vit-feedback" role="status" aria-live="polite">
              Observa la aguja del tensiómetro y capta el pulso arterial en la zona verde.
            </div>

            <ul class="hp-abd-checklist">
              <li class="hp-abd-check-item" id="hp-vit-item-bp">
                <div class="hp-abd-check-top">
                  <span class="hp-abd-check-mark" aria-hidden="true">○</span>
                  <strong>Presión arterial y pulso</strong>
                  <span class="hp-abd-check-state" id="hp-vit-state-bp">En zona verde</span>
                </div>
                <p class="hp-abd-check-finding" id="hp-vit-find-bp">Auscultar arteria braquial durante el desinflado del manguito.</p>
              </li>
              <li class="hp-abd-check-item" id="hp-vit-item-sec">
                <div class="hp-abd-check-top">
                  <span class="hp-abd-check-mark" aria-hidden="true">○</span>
                  <strong>${escapeHtml(secondTaskTitle)}</strong>
                  <span class="hp-abd-check-state" id="hp-vit-state-sec">Pendiente</span>
                </div>
                <p class="hp-abd-check-finding" id="hp-vit-find-sec">${profile.checkAsterixis ? 'Solicitar extensión de muñecas y dedos para descartar aleteo (flapping).' : 'Comprobar orientación, hidratación, temperatura e IMC.'}</p>
              </li>
            </ul>
          </div>
        </div>

        <footer class="hp-abd-footer">
          <div class="hp-abd-footer-left">
            <button type="button" class="secondary-button hp-abd-btn-sm" data-vit-action="back">← Volver a la libreta</button>
            <button type="button" class="text-button hp-abd-skip-btn" data-vit-action="skip">Omitir y registrar hallazgo</button>
          </div>
          <button type="button" class="primary-button hp-abd-finish-btn" id="hp-vit-finish" data-vit-action="complete" disabled>
            Completar control (0/2)
          </button>
        </footer>
      </section>
    `;

    const sceneCanvas = container.querySelector('#hp-vit-scene');
    const ctx = sceneCanvas?.getContext('2d');

    const progressEl = container.querySelector('#hp-vit-progress');
    const phaseEl = container.querySelector('#hp-vit-phase');
    const bpValEl = container.querySelector('#hp-vit-bp-val');
    const secValEl = container.querySelector('#hp-vit-sec-val');
    const feedbackEl = container.querySelector('#hp-vit-feedback');
    const bezelEl = container.querySelector('#hp-vit-bezel');
    const bpBtn = container.querySelector('#hp-vit-bp-btn');
    const secBtn = container.querySelector('#hp-vit-sec-btn');
    const finishBtn = container.querySelector('#hp-vit-finish');

    let bpDone = false;
    let secDone = false;
    let secTesting = false;
    let secTestStart = 0;
    let destroyed = false;
    let rafId = 0;
    let startTime = performance.now();
    let needlePos = 0.2;
    let inZone = false;
    let lastPulseTick = 0;
    let shakeTimer = 0;

    const zoneMin = reducedMotion ? 0.32 : 0.44;
    const zoneMax = reducedMotion ? 0.78 : 0.70;
    const speed = reducedMotion ? 0.45 : 0.75;

    function setFeedback(text, tone = 'neutral') {
      if (!feedbackEl) return;
      feedbackEl.textContent = text;
      feedbackEl.dataset.tone = tone;
    }

    function refreshUI() {
      const done = (bpDone ? 1 : 0) + (secDone ? 1 : 0);
      if (progressEl) {
        progressEl.textContent = done >= 2 ? '✓ 2 / 2 controles completos' : `${done} / 2 controles`;
        progressEl.classList.toggle('is-complete', done >= 2);
      }
      if (bpBtn) {
        bpBtn.disabled = bpDone;
        bpBtn.textContent = bpDone ? `✓ PA ${profile.bp} mmHg registrada` : '🩺 Captar presión arterial (Espacio / 1)';
      }
      if (secBtn) {
        secBtn.disabled = secDone || secTesting;
        if (secDone) secBtn.textContent = profile.checkAsterixis ? '✓ Asterixis ausente' : '✓ Estado basal registrado';
        else if (secTesting) secBtn.textContent = 'Observando muñecas (sin flapping)...';
      }
      const itemBp = container.querySelector('#hp-vit-item-bp');
      const itemSec = container.querySelector('#hp-vit-item-sec');
      if (itemBp && bpDone) {
        itemBp.classList.add('is-done');
        itemBp.querySelector('.hp-abd-check-mark').textContent = '✓';
        container.querySelector('#hp-vit-state-bp').textContent = `${profile.bp} mmHg`;
        container.querySelector('#hp-vit-find-bp').textContent = `PA ${profile.bp} mmHg · FC ${profile.hr}/min regular.`;
      }
      if (itemSec && secDone) {
        itemSec.classList.add('is-done');
        itemSec.querySelector('.hp-abd-check-mark').textContent = '✓';
        container.querySelector('#hp-vit-state-sec').textContent = profile.checkAsterixis ? 'Sin asterixis' : (profile.bmiVal ? `IMC ${profile.bmiVal}` : 'Estable');
        container.querySelector('#hp-vit-find-sec').textContent = profile.officialText;
      }
      if (finishBtn) {
        finishBtn.disabled = done < 2;
        finishBtn.textContent = done >= 2
          ? '✓ Registrar signos vitales en la libreta →'
          : `Completar control (${done}/2)`;
      }
    }

    function captureBP() {
      if (bpDone) return;
      if (!inZone) {
        ambience?.play('beep');
        if (bezelEl) {
          bezelEl.classList.remove('is-nudge');
          void bezelEl.offsetWidth;
          bezelEl.classList.add('is-nudge');
          window.clearTimeout(shakeTimer);
          shakeTimer = window.setTimeout(() => bezelEl?.classList.remove('is-nudge'), 340);
        }
        setFeedback('Aún no se ausculta el pulso claro: espera a que la aguja entre en la franja verde.', 'warn');
        return;
      }
      bpDone = true;
      ambience?.play('stamp');
      if (bpValEl) bpValEl.textContent = profile.bp;
      setFeedback(`✓ Lectura captada: PA ${profile.bp} mmHg, pulso ${profile.hr}/min regular.`, 'ok');
      refreshUI();
      if (bpDone && secDone) {
        setFeedback(`Control basal completo. ${profile.officialText}`, 'complete');
        finishBtn?.focus({ preventScroll: true });
      }
    }

    function runSecondary() {
      if (secDone || secTesting) return;
      ambience?.play('pen');
      if (profile.checkAsterixis) {
        secTesting = true;
        secTestStart = performance.now();
        setFeedback(`${profile.name} mantiene las muñecas en dorsiflexión... observa si hay caída brusca (flapping).`, 'neutral');
        refreshUI();
      } else {
        secDone = true;
        if (secValEl) secValEl.textContent = profile.bmiVal ? `IMC ${profile.bmiVal}` : 'Afebril';
        setFeedback(`✓ Estado general verificado: ${profile.officialText}`, 'ok');
        refreshUI();
        if (bpDone && secDone) finishBtn?.focus({ preventScroll: true });
      }
    }

    function drawVitalsSceneHD(now) {
      if (!ctx) return;

      // Mesa clínica de madera cálida y sábana superior
      const bgGrad = ctx.createLinearGradient(0, 0, CW, CH);
      bgGrad.addColorStop(0, '#e5d6bd');
      bgGrad.addColorStop(1, '#c8b191');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, CW, CH);

      // Textura suave de madera en mesa inferior
      const woodGrad = ctx.createLinearGradient(0, 332, 0, CH);
      woodGrad.addColorStop(0, '#b5946d');
      woodGrad.addColorStop(1, '#93734f');
      ctx.fillStyle = woodGrad;
      ctx.fillRect(0, 336, CW, CH - 336);
      ctx.fillStyle = '#5c4631';
      ctx.fillRect(0, 334, CW, 4);

      // Colchoneta clínica izquierda para el brazo del paciente
      ctx.save();
      ctx.fillStyle = 'rgba(42, 34, 24, 0.18)';
      roundRectPath(ctx, 26, 26, 224, 286, 16);
      ctx.fill();

      const padGrad = ctx.createLinearGradient(22, 20, 246, 306);
      padGrad.addColorStop(0, '#f8fbfd');
      padGrad.addColorStop(1, '#dbe8f0');
      ctx.fillStyle = padGrad;
      ctx.strokeStyle = '#33485c';
      ctx.lineWidth = 3;
      roundRectPath(ctx, 22, 20, 224, 286, 16);
      ctx.fill();
      ctx.stroke();

      // Manga de ropa del paciente
      const sleeveGrad = ctx.createLinearGradient(58, 28, 152, 118);
      sleeveGrad.addColorStop(0, profile.top);
      sleeveGrad.addColorStop(1, profile.topShade);
      ctx.fillStyle = sleeveGrad;
      ctx.strokeStyle = '#25323e';
      ctx.lineWidth = 3;
      roundRectPath(ctx, 56, 26, 98, 94, 16);
      ctx.fill();
      ctx.stroke();

      // Brazo y antebrazo anatómico con sombreado cilíndrico
      const armGrad = ctx.createLinearGradient(68, 0, 142, 0);
      armGrad.addColorStop(0, profile.skinShade);
      armGrad.addColorStop(0.35, profile.skinLight);
      armGrad.addColorStop(0.7, profile.skin);
      armGrad.addColorStop(1, profile.skinShade);
      ctx.fillStyle = armGrad;
      ctx.strokeStyle = '#36251d';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(68, 108);
      ctx.lineTo(142, 108);
      ctx.quadraticCurveTo(144, 210, 134, 294);
      ctx.lineTo(78, 294);
      ctx.quadraticCurveTo(66, 210, 68, 108);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Manguito acolchado azul marino del esfigmomanómetro (expande suavemente)
      const inflate = bpDone ? 0 : Math.sin(needlePos * Math.PI) * 4;
      const cuffGrad = ctx.createLinearGradient(54, 132, 156, 208);
      cuffGrad.addColorStop(0, '#466f8f');
      cuffGrad.addColorStop(0.45, '#2b4a63');
      cuffGrad.addColorStop(1, '#1c3244');
      ctx.fillStyle = cuffGrad;
      ctx.strokeStyle = '#152430';
      ctx.lineWidth = 3;
      roundRectPath(ctx, 54 - inflate, 130, 102 + inflate * 2, 76, 12);
      ctx.fill();
      ctx.stroke();

      // Costuras, etiqueta blanca y hebilla metálica del manguito
      ctx.strokeStyle = 'rgba(202, 226, 242, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      roundRectPath(ctx, 60 - inflate, 136, 90 + inflate * 2, 64, 8);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#edf5f8';
      roundRectPath(ctx, 82, 152, 46, 24, 4);
      ctx.fill();
      ctx.fillStyle = '#294860';
      ctx.font = '800 9px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('ARTERY', 105, 167);

      // Tubo flexible oscuro conectando manguito con manómetro + pera insufladora
      ctx.strokeStyle = '#1e272e';
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(156, 178);
      ctx.bezierCurveTo(220, 180, 224, 280, 326, 272);
      ctx.stroke();
      ctx.strokeStyle = '#3b4a56';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Pera de goma negra clásica
      const bulbGrad = ctx.createRadialGradient(284, 274, 4, 290, 282, 26);
      bulbGrad.addColorStop(0, '#5a6872');
      bulbGrad.addColorStop(0.6, '#273038');
      bulbGrad.addColorStop(1, '#12181d');
      ctx.fillStyle = bulbGrad;
      ctx.strokeStyle = '#0d1216';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(292, 282, 24, 17, -0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Campana metálica del estetoscopio en fosa antecubital + pulso visual
      if (inZone && !bpDone) {
        const pulseR = 24 + ((now % 650) / 650) * 20;
        const pulseA = 1 - ((now % 650) / 650);
        ctx.strokeStyle = `rgba(32, 184, 108, ${(pulseA * 0.75).toFixed(3)})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(106, 246, pulseR, 0, Math.PI * 2);
        ctx.stroke();
      }
      const stethGrad = ctx.createRadialGradient(100, 240, 2, 106, 246, 22);
      stethGrad.addColorStop(0, '#ffffff');
      stethGrad.addColorStop(0.6, '#b8cad6');
      stethGrad.addColorStop(1, '#587082');
      ctx.fillStyle = stethGrad;
      ctx.strokeStyle = '#243542';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(106, 246, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#2b6777';
      ctx.beginPath();
      ctx.arc(106, 246, 7, 0, Math.PI * 2);
      ctx.fill();

      // MANÓMETRO ANEROIDE CLÍNICO HD (DERECHA)
      const gx = 408;
      const gy = 166;
      const radius = 114;

      // Sombra y bisel cromado
      ctx.fillStyle = 'rgba(28, 22, 16, 0.28)';
      ctx.beginPath();
      ctx.arc(gx + 5, gy + 8, radius + 12, 0, Math.PI * 2);
      ctx.fill();

      const rimGrad = ctx.createLinearGradient(gx - radius, gy - radius, gx + radius, gy + radius);
      rimGrad.addColorStop(0, '#dce7ef');
      rimGrad.addColorStop(0.45, '#8399ab');
      rimGrad.addColorStop(0.85, '#3b4e5e');
      rimGrad.addColorStop(1, '#c5d6e2');
      ctx.fillStyle = rimGrad;
      ctx.strokeStyle = '#1b2833';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(gx, gy, radius + 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Esfera crema de precisión
      const faceGrad = ctx.createRadialGradient(gx - 22, gy - 26, 12, gx, gy, radius);
      faceGrad.addColorStop(0, '#fffdf7');
      faceGrad.addColorStop(0.75, '#f4ecd8');
      faceGrad.addColorStop(1, '#ddd0b3');
      ctx.fillStyle = faceGrad;
      ctx.beginPath();
      ctx.arc(gx, gy, radius - 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#73654e';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Franja verde de auscultación Korotkoff
      const startAng = Math.PI * 0.78;
      const endAng = Math.PI * 2.22;
      const span = endAng - startAng;

      ctx.strokeStyle = inZone && !bpDone ? 'rgba(32, 178, 102, 0.52)' : 'rgba(36, 152, 92, 0.28)';
      ctx.lineWidth = 18;
      ctx.beginPath();
      ctx.arc(gx, gy, radius - 24, startAng + zoneMin * span, startAng + zoneMax * span);
      ctx.stroke();

      // Marcas graduadas 0–300 mmHg
      for (let i = 0; i <= 30; i++) {
        const t = i / 30;
        const a = startAng + t * span;
        const major = i % 5 === 0;
        const r1 = radius - 10;
        const r2 = major ? radius - 26 : radius - 18;
        ctx.strokeStyle = (t >= zoneMin && t <= zoneMax) ? '#177544' : '#3d362c';
        ctx.lineWidth = major ? 2.6 : 1.3;
        ctx.beginPath();
        ctx.moveTo(gx + Math.cos(a) * r1, gy + Math.sin(a) * r1);
        ctx.lineTo(gx + Math.cos(a) * r2, gy + Math.sin(a) * r2);
        ctx.stroke();

        if (major) {
          const val = i * 10;
          const lr = radius - 40;
          ctx.fillStyle = '#332c22';
          ctx.font = '700 11px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(val), gx + Math.cos(a) * lr, gy + Math.sin(a) * lr);
        }
      }

      ctx.fillStyle = '#6c5c46';
      ctx.font = '700 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('mmHg', gx, gy + 44);
      if (bpDone) {
        ctx.fillStyle = '#18683d';
        ctx.font = '800 15px "JetBrains Mono", monospace';
        ctx.fillText(profile.bp, gx, gy + 66);
      }

      // Aguja indicadora animada con sombra
      const angle = startAng + (bpDone ? 0.56 : needlePos) * span;
      ctx.save();
      ctx.translate(gx, gy);
      ctx.rotate(angle);
      ctx.fillStyle = 'rgba(20, 16, 12, 0.2)';
      ctx.beginPath();
      ctx.moveTo(-16, 4); ctx.lineTo(radius - 20, 2); ctx.lineTo(-16, -2);
      ctx.fill();

      ctx.fillStyle = bpDone ? '#197544' : '#c8392b';
      ctx.beginPath();
      ctx.moveTo(-18, -4);
      ctx.lineTo(radius - 18, 0);
      ctx.lineTo(-18, 4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Capuchón central metálico
      const capGrad = ctx.createRadialGradient(gx - 3, gy - 3, 2, gx, gy, 13);
      capGrad.addColorStop(0, '#eef5fa');
      capGrad.addColorStop(0.6, '#4d6475');
      capGrad.addColorStop(1, '#1d2b36');
      ctx.fillStyle = capGrad;
      ctx.beginPath();
      ctx.arc(gx, gy, 12, 0, Math.PI * 2);
      ctx.fill();

      // Reflejo de cristal curvo sobre el dial
      ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.beginPath();
      ctx.ellipse(gx - 28, gy - 44, 58, 26, -0.45, 0, Math.PI * 2);
      ctx.fill();

      // BANDEJA INFERIOR: Prueba de asterixis o termómetro clínico HD
      ctx.fillStyle = '#253440';
      roundRectPath(ctx, 22, 352, 516, 98, 12);
      ctx.fill();
      const trayGrad = ctx.createLinearGradient(22, 354, 22, 448);
      trayGrad.addColorStop(0, '#f9f3e4');
      trayGrad.addColorStop(1, '#e8dcc3');
      ctx.fillStyle = trayGrad;
      roundRectPath(ctx, 26, 356, 508, 90, 9);
      ctx.fill();

      if (profile.checkAsterixis) {
        const micro = secTesting ? Math.sin(now / 110) * 1.4 : 0;
        const progress = secTesting ? Math.min(1, (now - secTestStart) / 1350) : (secDone ? 1 : 0);

        // Línea horizontal de referencia neurológica
        ctx.strokeStyle = 'rgba(43, 103, 119, 0.35)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 5]);
        ctx.beginPath();
        ctx.moveTo(46, 386); ctx.lineTo(356, 386);
        ctx.stroke();
        ctx.setLineDash([]);

        // Dos antebrazos y manos en dorsiflexión estable (sin flapping)
        for (const hx of [68, 222]) {
          ctx.fillStyle = profile.skin;
          ctx.strokeStyle = '#36261d';
          ctx.lineWidth = 2.6;
          roundRectPath(ctx, hx, 404, 72, 20, 9);
          ctx.fill(); ctx.stroke();

          ctx.save();
          ctx.translate(hx + 66, 412);
          ctx.rotate((-0.78 + micro * 0.02));
          roundRectPath(ctx, -4, -10, 40, 20, 9);
          ctx.fill(); ctx.stroke();
          ctx.restore();
        }

        // Indicador derecho
        ctx.fillStyle = secDone ? '#19663e' : '#3d3326';
        ctx.font = '800 13px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(secDone ? '✓ SIN ASTERIXIS' : (secTesting ? 'OBSERVANDO...' : 'DORSIFLEXIÓN'), 374, 392);
        ctx.fillStyle = '#5c4e3c';
        ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(secDone ? 'Muñecas firmes sin caída' : 'Mantener extensión 2 s', 374, 410);

        // Barra de observación
        ctx.fillStyle = '#d3c5aa';
        roundRectPath(ctx, 374, 420, 140, 10, 5);
        ctx.fill();
        ctx.fillStyle = secDone ? '#1e804c' : '#2b6777';
        roundRectPath(ctx, 374, 420, Math.max(6, 140 * progress), 10, 5);
        ctx.fill();
      } else {
        // Termómetro clínico ilustrado + ficha basal
        ctx.fillStyle = '#d8e6ee';
        ctx.strokeStyle = '#2b4252';
        ctx.lineWidth = 2.6;
        roundRectPath(ctx, 48, 386, 224, 30, 15);
        ctx.fill(); ctx.stroke();

        // Punta metálica izquierda
        ctx.fillStyle = '#8fa6b5';
        roundRectPath(ctx, 48, 390, 28, 22, 10);
        ctx.fill(); ctx.stroke();

        // Pantalla digital del termómetro
        ctx.fillStyle = '#182c32';
        roundRectPath(ctx, 96, 392, 114, 18, 4);
        ctx.fill();
        ctx.fillStyle = secDone ? '#78f5b2' : '#85c3d1';
        ctx.font = '700 12px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(secDone ? '36.6 °C' : '--.- °C', 153, 405);

        ctx.fillStyle = secDone ? '#19663e' : '#3d3326';
        ctx.font = '800 13px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(secDone ? (profile.bmiVal ? `AFEBRIL · IMC ${profile.bmiVal}` : 'AFEBRIL · LÚCIDO') : 'CONTROL BASAL', 294, 396);
        ctx.fillStyle = '#5c4e3c';
        ctx.font = '600 11.5px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(secDone ? 'Orientación e hidratación conservadas' : 'Temperatura, IMC y estado general', 294, 416);
      }

      ctx.restore();
    }

    function tick(now) {
      if (destroyed) return;
      const t = (now - startTime) / 1000;
      needlePos = 0.5 + 0.45 * Math.sin(t * speed * Math.PI);
      inZone = needlePos >= zoneMin && needlePos <= zoneMax;

      if (inZone && !bpDone && now - lastPulseTick > 460) {
        lastPulseTick = now;
        playKorotkoffTick(ambience, true);
      }

      if (secTesting && now - secTestStart >= 1350) {
        secTesting = false;
        secDone = true;
        ambience?.play('stamp');
        if (secValEl) secValEl.textContent = 'Ausente';
        setFeedback(`✓ Muñecas estables sin flapping (asterixis ausente). ${profile.officialText}`, 'ok');
        refreshUI();
        if (bpDone && secDone) finishBtn?.focus({ preventScroll: true });
      }

      if (phaseEl) {
        if (bpDone) {
          phaseEl.textContent = `✓ PA ${profile.bp}`;
          phaseEl.classList.add('is-window');
        } else if (inZone) {
          phaseEl.textContent = '● Pulso claro · Captar ahora';
          phaseEl.classList.add('is-window');
        } else {
          phaseEl.textContent = 'Desinflando manguito...';
          phaseEl.classList.remove('is-window');
        }
      }

      drawVitalsSceneHD(now);
      rafId = window.requestAnimationFrame(tick);
    }

    function onClick(event) {
      const btn = event.target.closest('[data-vit-action]');
      if (!btn) return;
      event.preventDefault();
      event.stopPropagation();
      const act = btn.dataset.vitAction;
      if (act === 'bp') captureBP();
      else if (act === 'secondary') runSecondary();
      else if (act === 'back') { destroy(); onCancel?.(); }
      else if (act === 'skip') { destroy(); onComplete?.({ skipped: true }); }
      else if (act === 'complete' && bpDone && secDone) { destroy(); onComplete?.({ skipped: false }); }
    }

    function onKeyDown(event) {
      if (destroyed || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key === '1' || event.key === ' ') {
        if (!bpDone) { event.preventDefault(); captureBP(); }
      } else if (event.key === '2') {
        if (!secDone) { event.preventDefault(); runSecondary(); }
      }
    }

    container.addEventListener('click', onClick);
    document.addEventListener('keydown', onKeyDown);
    refreshUI();
    rafId = window.requestAnimationFrame(tick);

    function destroy() {
      if (destroyed) return;
      destroyed = true;
      if (rafId) window.cancelAnimationFrame(rafId);
      window.clearTimeout(shakeTimer);
      container.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKeyDown);
    }

    return { destroy };
  }

  /* =========================================================================
   * PASO 02 · INSPECCIÓN CON LINTERNA CLÍNICA HD
   * ========================================================================= */
  function resolveInspectionProfile(activeCase) {
    const rawExam = Array.isArray(activeCase?.exam) ? activeCase.exam[1] : null;
    const text = String(rawExam?.text || '');
    const lower = text.toLowerCase();
    const p = activeCase?.patient || {};
    const appearance = p.appearance || {};
    const sprites = resolvePatientSprites(activeCase);

    const noJaundice = /(?:sin|no\s+hay)[^.;]*\b(?:ictericia|tinte\s+escleral)\b/.test(lower);
    const jaundice = !noJaundice && /\b(?:ictericia|tinte\s+escleral)\b/.test(lower);

    const excoriations = /\bexcoriaciones\b/.test(lower);
    const knucklesPigment = /\b(?:hiperpigmentaci[oó]n|nudillos)\b/.test(lower);

    const skin = appearance.skin || '#e2a97e';
    const skinShade = appearance.skinShade || shiftColor(skin, -28);
    const skinLight = shiftColor(skin, 22);
    const hair = appearance.hair || '#4d3e34';

    const correctKey = jaundice && excoriations
      ? 'jaundice_excoriations'
      : jaundice
        ? 'jaundice'
        : excoriations
          ? 'excoriations'
          : knucklesPigment
            ? 'knuckles'
            : 'normal';

    const quizOptions = [
      { id: 'normal', label: 'Sin ictericia, lesiones cutáneas ni edemas' },
      { id: 'jaundice', label: 'Leve tinte ictérico escleral' },
      {
        id: knucklesPigment ? 'knuckles' : (jaundice && excoriations ? 'jaundice_excoriations' : 'excoriations'),
        label: knucklesPigment
          ? 'Leve hiperpigmentación y molestias en 2.º–3.º nudillos'
          : (jaundice && excoriations
              ? 'Leve ictericia escleral y excoriaciones por rascado'
              : 'Excoriaciones por rascado sin lesión cutánea primaria')
      }
    ];

    return {
      name: p.name || 'el paciente',
      sprites,
      skin,
      skinShade,
      skinLight,
      hair,
      jaundice,
      excoriations,
      knucklesPigment,
      correctKey,
      quizOptions,
      officialTitle: rawExam?.title || 'Inspección',
      officialText: text || 'Sin ictericia, palidez, edema ni estigmas de hepatopatía crónica.',
      zones: [
        {
          id: 'eyes',
          key: '1',
          code: 'OJOS',
          px: 280,
          py: 120,
          title: 'Escleras y conjuntivas',
          abnormal: jaundice,
          shortLabel: jaundice ? 'Tinte escleral leve' : 'Escleras anictéricas',
          finding: jaundice
            ? 'Leve tinte amarillento en escleras visible bajo luz clínica; sin palidez conjuntival.'
            : 'Escleras blancas (anictéricas) y conjuntivas bien perfundidas.'
        },
        {
          id: 'hands',
          key: '2',
          code: 'PIEL',
          px: 152,
          py: 340,
          title: 'Manos, nudillos y piel',
          abnormal: excoriations || knucklesPigment,
          shortLabel: knucklesPigment
            ? 'Hiperpigmentación / nudillos'
            : (excoriations ? 'Excoriaciones' : 'Sin estigmas'),
          finding: knucklesPigment
            ? 'Leve hiperpigmentación cutánea y sensibilidad en 2.º y 3.º nudillos metacarpofalángicos.'
            : (excoriations
                ? 'Excoriaciones lineales por rascado en antebrazo/dorso, sin lesión dermatológica primaria.'
                : 'Sin eritema palmar, arañas vasculares ni excoriaciones.')
        },
        {
          id: 'ankles',
          key: '3',
          code: 'EDEMA',
          px: 408,
          py: 340,
          title: 'Tobillos y zona pretibial',
          abnormal: false,
          shortLabel: 'Sin edemas',
          finding: 'Sin edema maleolar ni signo de la fóvea; hidratación conservada.'
        }
      ]
    };
  }

  function mountInspection({ container, activeCase, ambience, onComplete, onCancel }) {
    if (!container) return { destroy() {} };

    const profile = resolveInspectionProfile(activeCase);
    const badgeImg = profile.sprites?.idle;

    container.innerHTML = `
      <section class="hp-abd-stage" aria-label="Minijuego de inspección con linterna clínica">
        <header class="hp-abd-head">
          <div class="hp-abd-head-lead">
            ${badgeImg ? `<div class="hp-exam-sprite-badge"><img src="${escapeHtml(badgeImg)}" alt="${escapeHtml(profile.name)}" /></div>` : ''}
            <div class="hp-abd-head-copy">
              <span class="hp-abd-kicker">MANIOBRA 02 · INSPECCIÓN CON LINTERNA CLÍNICA</span>
              <h3>Escleras, piel y mucosas de ${escapeHtml(profile.name)}</h3>
            </div>
          </div>
          <div class="hp-abd-progress-meta" id="hp-ins-progress" aria-live="polite">0 / 3 áreas</div>
        </header>

        <div class="hp-abd-grid">
          <div class="hp-abd-canvas-wrap">
            <div class="hp-abd-orient" aria-hidden="true">
              <span>LINTERNA CLÍNICA ACTIVA</span>
              <span>MUEVE EL HAZ Y TOCA CADA ZONA</span>
            </div>
            <div class="hp-abd-torso-box hp-ins-box" id="hp-ins-box">
              <canvas id="hp-ins-scene" class="hp-abd-hd-canvas" width="${CW}" height="${CH}" role="img" aria-label="Lámina de inspección clínica ilustrada de ojos, manos y tobillos de ${escapeHtml(profile.name)}"></canvas>

              <button type="button" class="hp-abd-reticle hp-ins-r-eyes" data-ins-zone="eyes" aria-label="Inspeccionar escleras y conjuntivas. Tecla 1.">
                <span class="hp-abd-reticle-corners" aria-hidden="true"></span>
                <span class="hp-abd-reticle-tag">1 · ESCLERAS</span>
                <span class="hp-abd-reticle-sub" data-ins-sub="eyes">Iluminar</span>
              </button>

              <button type="button" class="hp-abd-reticle hp-ins-r-hands" data-ins-zone="hands" aria-label="Inspeccionar manos, nudillos y piel. Tecla 2.">
                <span class="hp-abd-reticle-corners" aria-hidden="true"></span>
                <span class="hp-abd-reticle-tag">2 · MANOS/PIEL</span>
                <span class="hp-abd-reticle-sub" data-ins-sub="hands">Iluminar</span>
              </button>

              <button type="button" class="hp-abd-reticle hp-ins-r-ankles" data-ins-zone="ankles" aria-label="Inspeccionar tobillos para descartar edemas. Tecla 3.">
                <span class="hp-abd-reticle-corners" aria-hidden="true"></span>
                <span class="hp-abd-reticle-tag">3 · TOBILLOS</span>
                <span class="hp-abd-reticle-sub" data-ins-sub="ankles">Iluminar</span>
              </button>
            </div>
          </div>

          <div class="hp-abd-deck">
            <div class="hp-abd-feedback" id="hp-ins-feedback" role="status" aria-live="polite">
              Desliza la linterna sobre ojos, manos y tobillos y toca cada recuadro (o pulsa 1, 2 o 3) para inspeccionar.
            </div>

            <div class="hp-abd-quiz" id="hp-ins-quiz" hidden>
              <p class="hp-abd-quiz-title">Verificación clínica · ¿Qué observaste en la inspección?</p>
              <div class="hp-abd-quiz-options">
                ${profile.quizOptions.map(opt => `
                  <button type="button" class="hp-abd-quiz-btn" data-ins-quiz="${opt.id}">
                    ${escapeHtml(opt.label)}
                  </button>
                `).join('')}
              </div>
            </div>

            <ul class="hp-abd-checklist">
              ${profile.zones.map(z => `
                <li class="hp-abd-check-item" data-ins-item="${z.id}">
                  <div class="hp-abd-check-top">
                    <span class="hp-abd-check-mark" aria-hidden="true">○</span>
                    <strong>${escapeHtml(z.title)}</strong>
                    <span class="hp-abd-check-state" data-ins-state="${z.id}">Sin iluminar</span>
                  </div>
                  <p class="hp-abd-check-finding" data-ins-finding="${z.id}">Dirige la linterna clínica hacia esta zona.</p>
                </li>
              `).join('')}
            </ul>
          </div>
        </div>

        <footer class="hp-abd-footer">
          <div class="hp-abd-footer-left">
            <button type="button" class="secondary-button hp-abd-btn-sm" data-ins-action="back">← Volver a la libreta</button>
            <button type="button" class="text-button hp-abd-skip-btn" data-ins-action="skip">Omitir y registrar hallazgo</button>
          </div>
          <button type="button" class="primary-button hp-abd-finish-btn" id="hp-ins-finish" data-ins-action="complete" disabled>
            Completar inspección (0/3)
          </button>
        </footer>
      </section>
    `;

    const box = container.querySelector('#hp-ins-box');
    const canvas = container.querySelector('#hp-ins-scene');
    const ctx = canvas?.getContext('2d');

    const progressEl = container.querySelector('#hp-ins-progress');
    const feedbackEl = container.querySelector('#hp-ins-feedback');
    const quizBox = container.querySelector('#hp-ins-quiz');
    const finishBtn = container.querySelector('#hp-ins-finish');

    const zoneState = Object.fromEntries(profile.zones.map(z => [z.id, { done: false }]));
    const light = { x: 280, y: 120, tx: 280, ty: 120, flashUntil: 0 };
    let quizVerified = false;
    let destroyed = false;
    let rafId = 0;

    function getDoneCount() {
      return profile.zones.filter(z => zoneState[z.id].done).length;
    }

    function setFeedback(text, tone = 'neutral') {
      if (!feedbackEl) return;
      feedbackEl.textContent = text;
      feedbackEl.dataset.tone = tone;
    }

    function refreshUI() {
      const done = getDoneCount();
      const allDone = done >= profile.zones.length;
      if (progressEl) {
        progressEl.textContent = allDone
          ? (quizVerified ? '✓ Inspección confirmada' : '3 / 3 · Confirma lo observado')
          : `${done} / 3 áreas`;
        progressEl.classList.toggle('is-complete', allDone && quizVerified);
      }

      for (const z of profile.zones) {
        const st = zoneState[z.id];
        const btn = container.querySelector(`[data-ins-zone="${z.id}"]`);
        const sub = container.querySelector(`[data-ins-sub="${z.id}"]`);
        const item = container.querySelector(`[data-ins-item="${z.id}"]`);
        const stateBadge = container.querySelector(`[data-ins-state="${z.id}"]`);
        const findingEl = container.querySelector(`[data-ins-finding="${z.id}"]`);
        const markEl = item?.querySelector('.hp-abd-check-mark');

        if (btn) {
          btn.classList.toggle('is-done', st.done);
          btn.classList.toggle('is-abnormal', st.done && z.abnormal);
        }
        if (sub) sub.textContent = st.done ? '✓ Visto' : 'Iluminar';
        if (item) {
          item.classList.toggle('is-done', st.done);
          item.classList.toggle('is-abnormal', st.done && z.abnormal);
        }
        if (markEl) markEl.textContent = st.done ? '✓' : '○';
        if (stateBadge) stateBadge.textContent = st.done ? z.shortLabel : 'Sin iluminar';
        if (findingEl && st.done) findingEl.textContent = z.finding;
      }

      if (quizBox) quizBox.hidden = !allDone;
      if (finishBtn) {
        finishBtn.disabled = !(allDone && quizVerified);
        if (allDone && quizVerified) finishBtn.textContent = '✓ Registrar inspección en la libreta →';
        else if (allDone) finishBtn.textContent = 'Confirma lo observado arriba ↑';
        else finishBtn.textContent = `Completar inspección (${done}/3)`;
      }
    }

    function inspectZone(zoneId) {
      const zone = profile.zones.find(z => z.id === zoneId);
      if (!zone) return;
      light.tx = zone.px;
      light.ty = zone.py;
      light.flashUntil = performance.now() + 280;

      if (!zoneState[zoneId].done) {
        zoneState[zoneId].done = true;
        ambience?.play(zone.abnormal ? 'stamp' : 'pen');
      } else {
        ambience?.play('paper');
      }
      setFeedback(`✓ ${zone.title}: ${zone.finding}`, zone.abnormal ? 'finding' : 'ok');
      refreshUI();

      if (getDoneCount() >= profile.zones.length && !quizVerified) {
        setFeedback('Inspección completa. Selecciona arriba el hallazgo principal que observaste.', 'ok');
        quizBox?.querySelector('[data-ins-quiz]')?.focus({ preventScroll: true });
      }
    }

    function handleQuiz(choiceId) {
      const correct = choiceId === profile.correctKey;
      for (const btn of container.querySelectorAll('[data-ins-quiz]')) {
        const isThis = btn.dataset.insQuiz === choiceId;
        btn.classList.toggle('is-selected', isThis);
        btn.classList.toggle('is-correct', btn.dataset.insQuiz === profile.correctKey && (correct || isThis));
        btn.classList.toggle('is-wrong', isThis && !correct);
      }
      if (correct) {
        quizVerified = true;
        ambience?.play('stamp');
        setFeedback(`✓ Observación clínica precisa. ${profile.officialText}`, 'complete');
        refreshUI();
        finishBtn?.focus({ preventScroll: true });
      } else {
        ambience?.play('beep');
        setFeedback('Vuelve a mirar las zonas iluminadas: el signo principal observado no coincide con esa opción.', 'warn');
      }
    }

    function drawInspectionSceneHD(now) {
      if (!ctx) return;

      // Marco clínico oscuro elegante
      ctx.fillStyle = '#1b2832';
      ctx.fillRect(0, 0, CW, CH);

      /* -------- 1. PANEL SUPERIOR: PRIMER PLANO DE ESCLERAS Y OJOS -------- */
      ctx.save();
      roundRectPath(ctx, 18, 18, 524, 198, 12);
      ctx.clip();

      const faceBg = ctx.createLinearGradient(18, 18, 542, 216);
      faceBg.addColorStop(0, profile.skinShade);
      faceBg.addColorStop(0.22, profile.skin);
      faceBg.addColorStop(0.5, profile.skinLight);
      faceBg.addColorStop(0.78, profile.skin);
      faceBg.addColorStop(1, profile.skinShade);
      ctx.fillStyle = faceBg;
      ctx.fillRect(18, 18, 524, 198);

      // Sombra anatómica del puente nasal y cuencas orbitarias
      const noseGrad = ctx.createLinearGradient(252, 60, 308, 60);
      noseGrad.addColorStop(0, 'rgba(98, 58, 38, 0.22)');
      noseGrad.addColorStop(0.5, 'rgba(255, 240, 224, 0.34)');
      noseGrad.addColorStop(1, 'rgba(98, 58, 38, 0.22)');
      ctx.fillStyle = noseGrad;
      ctx.fillRect(252, 68, 56, 148);

      const scleraMain = profile.jaundice ? '#f3dd74' : '#fbfdfb';
      const scleraEdge = profile.jaundice ? '#d3b242' : '#d5e0e4';
      const blinking = (now % 4600) > 4480;

      // Helper para trazar la apertura exacta del ojo (evita recortar el iris)
      function traceEyeAperture(ex, ey) {
        ctx.beginPath();
        ctx.moveTo(ex - 64, ey + 3);
        ctx.bezierCurveTo(ex - 36, ey - 32, ex + 36, ey - 32, ex + 64, ey + 3);
        ctx.bezierCurveTo(ex + 34, ey + 30, ex - 34, ey + 30, ex - 64, ey + 3);
        ctx.closePath();
      }

      // Sombra orbital superior y mejillas para dar volumen real al rostro
      for (const side of [-1, 1]) {
        const ex = 280 + side * 122;
        const ey = 122;

        // Sombra suave del arco superciliar y ojera anatómica
        const orbGrad = ctx.createRadialGradient(ex, ey + 4, 24, ex, ey + 4, 86);
        orbGrad.addColorStop(0, 'rgba(116, 72, 50, 0.24)');
        orbGrad.addColorStop(0.65, 'rgba(116, 72, 50, 0.08)');
        orbGrad.addColorStop(1, 'rgba(116, 72, 50, 0)');
        ctx.fillStyle = orbGrad;
        ctx.beginPath();
        ctx.ellipse(ex, ey + 4, 86, 56, 0, 0, Math.PI * 2);
        ctx.fill();

        // Ceja anatómica con arco natural y terminación afinada
        ctx.fillStyle = profile.hair;
        ctx.beginPath();
        ctx.moveTo(ex - side * 66, ey - 42);
        ctx.bezierCurveTo(ex - side * 26, ey - 58, ex + side * 24, ey - 60, ex + side * 68, ey - 36);
        ctx.bezierCurveTo(ex + side * 24, ey - 46, ex - side * 24, ey - 44, ex - side * 64, ey - 30);
        ctx.closePath();
        ctx.fill();

        // Pliegue del párpado superior
        ctx.strokeStyle = 'rgba(84, 48, 34, 0.5)';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(ex - 66, ey - 16);
        ctx.bezierCurveTo(ex - 26, ey - 40, ex + 26, ey - 40, ex + 66, ey - 16);
        ctx.stroke();

        if (blinking) {
          ctx.strokeStyle = '#251914';
          ctx.lineWidth = 4;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(ex - 62, ey + 2);
          ctx.quadraticCurveTo(ex, ey + 15, ex + 62, ey + 2);
          ctx.stroke();
        } else {
          // 1. Esclera con gradiente volumétrico
          const scGrad = ctx.createRadialGradient(ex, ey + 2, 14, ex, ey + 2, 66);
          scGrad.addColorStop(0, scleraMain);
          scGrad.addColorStop(0.72, scleraMain);
          scGrad.addColorStop(1, scleraEdge);
          ctx.fillStyle = scGrad;
          traceEyeAperture(ex, ey);
          ctx.fill();

          // 2. Contenido interno recortado estrictamente a la apertura ocular
          ctx.save();
          traceEyeAperture(ex, ey);
          ctx.clip();

          // Carúncula lagrimal medial realista
          const carX = ex - side * 58;
          ctx.fillStyle = '#d98880';
          ctx.beginPath();
          ctx.ellipse(carX, ey + 3, 8, 6, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(255, 224, 220, 0.55)';
          ctx.beginPath();
          ctx.arc(carX + side * 1.5, ey + 2, 2.2, 0, Math.PI * 2);
          ctx.fill();

          // Micro-sombra en comisuras laterales para dar esfericidad al globo
          const cornerShade = ctx.createRadialGradient(ex, ey, 36, ex, ey, 68);
          cornerShade.addColorStop(0, 'rgba(0, 0, 0, 0)');
          cornerShade.addColorStop(1, profile.jaundice ? 'rgba(154, 114, 24, 0.28)' : 'rgba(92, 108, 124, 0.22)');
          ctx.fillStyle = cornerShade;
          ctx.fillRect(ex - 70, ey - 40, 140, 80);

          // Reflejo pupilar real al acercar la linterna clínica a los ojos
          const distToLight = Math.hypot(light.x - ex, light.y - ey);
          const lightResponse = Math.max(0, Math.min(1, 1 - (distToLight - 25) / 145));
          const pupilR = 10.6 - lightResponse * 3.8;
          const gazeX = Math.max(-4.5, Math.min(4.5, (light.x - ex) * 0.02));
          const gazeY = Math.max(-3, Math.min(3, (light.y - ey) * 0.018));
          const ix = ex + gazeX;
          const iy = ey + 1 + gazeY;

          // Anillo limbal oscuro exterior del iris
          ctx.fillStyle = '#201612';
          ctx.beginPath();
          ctx.arc(ix, iy, 25.5, 0, Math.PI * 2);
          ctx.fill();

          // Iris detallado con tonos avellana/castaño y textura radial
          const irisGrad = ctx.createRadialGradient(ix - 3, iy - 3, 4, ix, iy, 24);
          irisGrad.addColorStop(0, '#9c6f46');
          irisGrad.addColorStop(0.45, '#6e492e');
          irisGrad.addColorStop(0.82, '#432a1a');
          irisGrad.addColorStop(1, '#241710');
          ctx.fillStyle = irisGrad;
          ctx.beginPath();
          ctx.arc(ix, iy, 23.5, 0, Math.PI * 2);
          ctx.fill();

          // Fibras radiales sutiles del estroma del iris
          ctx.strokeStyle = 'rgba(218, 168, 112, 0.28)';
          ctx.lineWidth = 1.1;
          for (let a = 0; a < 24; a++) {
            const ang = (a / 24) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(ix + Math.cos(ang) * (pupilR + 2), iy + Math.sin(ang) * (pupilR + 2));
            ctx.lineTo(ix + Math.cos(ang) * 21.5, iy + Math.sin(ang) * 21.5);
            ctx.stroke();
          }

          // Collarete cálido alrededor de la pupila
          ctx.strokeStyle = 'rgba(202, 148, 86, 0.48)';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.arc(ix, iy, pupilR + 3.2, 0, Math.PI * 2);
          ctx.stroke();

          // Pupila negra nítida y bien definida
          ctx.fillStyle = '#0c0f14';
          ctx.beginPath();
          ctx.arc(ix, iy, pupilR, 0, Math.PI * 2);
          ctx.fill();

          // Sombra proyectada por el párpado superior sobre la parte alta del globo y el iris
          const lidShadow = ctx.createLinearGradient(ex, ey - 32, ex, ey - 4);
          lidShadow.addColorStop(0, 'rgba(32, 22, 18, 0.44)');
          lidShadow.addColorStop(0.6, 'rgba(32, 22, 18, 0.14)');
          lidShadow.addColorStop(1, 'rgba(32, 22, 18, 0)');
          ctx.fillStyle = lidShadow;
          ctx.fillRect(ex - 68, ey - 34, 136, 32);

          // Brillo corneal especular (reacciona suavemente a la posición de la linterna)
          const glX = ix - 7 + gazeX * 0.45;
          const glY = iy - 7 + gazeY * 0.45;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
          ctx.beginPath();
          ctx.ellipse(glX, glY, 5.2, 4.2, -0.35, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
          ctx.beginPath();
          ctx.arc(ix + 8, iy + 6, 2.3, 0, Math.PI * 2);
          ctx.fill();

          // Película lagrimal sutil en el borde inferior
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.48)';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(ex - 42, ey + 17);
          ctx.quadraticCurveTo(ex, ey + 26, ex + 42, ey + 17);
          ctx.stroke();

          ctx.restore();

          // 3. Línea de pestañas superiores e inferiores bien dibujadas
          ctx.strokeStyle = '#201511';
          ctx.lineWidth = 4.2;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(ex - 64, ey + 3);
          ctx.bezierCurveTo(ex - 36, ey - 32, ex + 36, ey - 32, ex + 64, ey + 3);
          ctx.stroke();

          // Pestañas exteriores sutiles
          ctx.lineWidth = 2;
          for (let l = 0; l < 4; l++) {
            const lx = ex + side * (36 + l * 7);
            const ly = ey - 16 + l * 4.5;
            ctx.beginPath();
            ctx.moveTo(lx, ly);
            ctx.quadraticCurveTo(lx + side * 6, ly - 5, lx + side * 11, ly - 8 + l * 2);
            ctx.stroke();
          }

          // Borde palpebral inferior suave
          ctx.lineWidth = 1.9;
          ctx.strokeStyle = 'rgba(84, 52, 40, 0.65)';
          ctx.beginPath();
          ctx.moveTo(ex - 58, ey + 5);
          ctx.bezierCurveTo(ex - 30, ey + 30, ex + 30, ey + 30, ex + 58, ey + 5);
          ctx.stroke();
        }
      }
      ctx.restore();

      ctx.strokeStyle = '#475f6f';
      ctx.lineWidth = 2.5;
      roundRectPath(ctx, 18, 18, 524, 198, 12);
      ctx.stroke();

      /* -------- 2. PANEL INFERIOR IZQUIERDO: DORSO DE MANO ANATÓMICO, NUDILLOS Y PIEL -------- */
      ctx.save();
      roundRectPath(ctx, 18, 232, 254, 220, 12);
      ctx.clip();

      const linenL = ctx.createLinearGradient(18, 232, 272, 452);
      linenL.addColorStop(0, '#eef5f8');
      linenL.addColorStop(0.6, '#dde9f0');
      linenL.addColorStop(1, '#c8dae4');
      ctx.fillStyle = linenL;
      ctx.fillRect(18, 232, 254, 220);

      // Pliegues suaves de la sábana clínica
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(18, 286); ctx.quadraticCurveTo(145, 276, 272, 294);
      ctx.moveTo(18, 392); ctx.quadraticCurveTo(145, 382, 272, 402);
      ctx.stroke();

      const handBase = profile.knucklesPigment ? shiftColor(profile.skin, -20) : profile.skin;
      const handDark = profile.knucklesPigment ? shiftColor(profile.skinShade, -18) : profile.skinShade;
      const handHi = profile.knucklesPigment ? shiftColor(profile.skinLight, -12) : profile.skinLight;

      // Helper para dibujar la silueta continua anatómica de muñeca, dorso y 5 dedos naturales
      function traceAnatomicalHand(ox, oy) {
        ctx.beginPath();
        // Muñeca izquierda -> base del pulgar
        ctx.moveTo(ox + 92, oy + 226);
        ctx.bezierCurveTo(ox + 90, oy + 190, ox + 84, oy + 170, ox + 72, oy + 150);
        // Pulgar abducido con perfil natural
        ctx.bezierCurveTo(ox + 56, oy + 136, ox + 38, oy + 122, ox + 36, oy + 108);
        ctx.bezierCurveTo(ox + 35, oy + 96, ox + 47, oy + 93, ox + 56, oy + 102);
        ctx.bezierCurveTo(ox + 68, oy + 114, ox + 78, oy + 120, ox + 84, oy + 112);
        // Espacio interdigital -> Dedo índice
        ctx.bezierCurveTo(ox + 84, oy + 86, ox + 82, oy + 52, ox + 86, oy + 36);
        ctx.bezierCurveTo(ox + 89, oy + 25, ox + 103, oy + 25, ox + 105, oy + 38);
        ctx.bezierCurveTo(ox + 107, oy + 56, ox + 107, oy + 80, ox + 111, oy + 90);
        // Dedo medio (el más largo)
        ctx.bezierCurveTo(ox + 113, oy + 62, ox + 115, oy + 32, ox + 119, oy + 20);
        ctx.bezierCurveTo(ox + 123, oy + 10, ox + 136, oy + 11, ox + 138, oy + 23);
        ctx.bezierCurveTo(ox + 139, oy + 44, ox + 138, oy + 76, ox + 141, oy + 90);
        // Dedo anular
        ctx.bezierCurveTo(ox + 145, oy + 66, ox + 149, oy + 40, ox + 154, oy + 29);
        ctx.bezierCurveTo(ox + 158, oy + 20, ox + 170, oy + 23, ox + 170, oy + 35);
        ctx.bezierCurveTo(ox + 169, oy + 56, ox + 165, oy + 82, ox + 166, oy + 96);
        // Dedo meñique
        ctx.bezierCurveTo(ox + 172, oy + 78, ox + 179, oy + 58, ox + 185, oy + 50);
        ctx.bezierCurveTo(ox + 190, oy + 43, ox + 200, oy + 48, ox + 198, oy + 59);
        ctx.bezierCurveTo(ox + 194, oy + 78, ox + 188, oy + 100, ox + 185, oy + 122);
        // Borde cubital de la palma y antebrazo derecho
        ctx.bezierCurveTo(ox + 184, oy + 152, ox + 174, oy + 182, ox + 172, oy + 226);
        ctx.closePath();
      }

      // Sombra de contacto realista bajo la mano
      ctx.save();
      ctx.fillStyle = 'rgba(34, 52, 66, 0.17)';
      traceAnatomicalHand(26, 240);
      ctx.fill();
      ctx.restore();

      // Relleno volumétrico de piel del dorso de la mano
      const hGrad = ctx.createLinearGradient(58, 250, 212, 444);
      hGrad.addColorStop(0, handHi);
      hGrad.addColorStop(0.45, handBase);
      hGrad.addColorStop(1, handDark);
      ctx.fillStyle = hGrad;
      ctx.strokeStyle = '#3c2920';
      ctx.lineWidth = 2.4;
      ctx.lineJoin = 'round';
      traceAnatomicalHand(18, 232);
      ctx.fill();
      ctx.stroke();

      // Recorte al contorno de la mano para sombras suaves, tendones, uñas y hallazgos
      ctx.save();
      traceAnatomicalHand(18, 232);
      ctx.clip();

      // Luz central suave sobre el dorso metacarpiano
      const dorsumGlow = ctx.createRadialGradient(142, 362, 10, 146, 368, 72);
      dorsumGlow.addColorStop(0, 'rgba(255, 242, 230, 0.28)');
      dorsumGlow.addColorStop(1, 'rgba(255, 242, 230, 0)');
      ctx.fillStyle = dorsumGlow;
      ctx.fillRect(40, 240, 210, 215);

      // Tendones extensores sutiles convergiendo hacia la muñeca
      ctx.strokeStyle = 'rgba(255, 244, 234, 0.34)';
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      const tendons = [
        [114, 342, 134, 412],
        [144, 336, 146, 414],
        [170, 342, 158, 414],
        [192, 354, 168, 412]
      ];
      for (const [x1, y1, x2, y2] of tendons) {
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      }

      // Uñas anatómicas con lúnula pálida y leve brillo
      const nails = [
        { x: 62, y: 336, rx: 5.5, ry: 7.5, rot: -0.68 },
        { x: 113, y: 268, rx: 6.2, ry: 8.5, rot: -0.05 },
        { x: 146, y: 252, rx: 6.6, ry: 9, rot: 0.02 },
        { x: 180, y: 263, rx: 6, ry: 8.4, rot: 0.14 },
        { x: 209, y: 286, rx: 5, ry: 7, rot: 0.24 }
      ];
      for (const n of nails) {
        ctx.save();
        ctx.translate(n.x, n.y);
        ctx.rotate(n.rot);
        ctx.fillStyle = 'rgba(248, 224, 214, 0.85)';
        ctx.strokeStyle = 'rgba(128, 86, 72, 0.5)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(0, 0, n.rx, n.ry, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Lúnula sutil en base de la uña
        ctx.fillStyle = 'rgba(255, 250, 246, 0.72)';
        ctx.beginPath();
        ctx.arc(0, n.ry * 0.55, n.rx * 0.58, Math.PI, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Pliegues interfalángicos sutiles en los 4 dedos largos
      ctx.strokeStyle = 'rgba(104, 64, 46, 0.34)';
      ctx.lineWidth = 1.4;
      const jointCreases = [
        [106, 294, 120, 294], [107, 314, 122, 314],
        [137, 282, 152, 282], [137, 306, 153, 306],
        [169, 292, 183, 294], [167, 314, 181, 316],
        [197, 310, 209, 313], [193, 328, 205, 331]
      ];
      for (const [x1, y1, x2, y2] of jointCreases) {
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      }

      // Nudillos metacarpofalángicos (en Andrés: eritema y leve engrosamiento en 2º y 3º nudillos)
      const mcpKnuckles = [
        { x: 114, y: 338 },
        { x: 144, y: 334 },
        { x: 171, y: 341 },
        { x: 194, y: 353 }
      ];
      mcpKnuckles.forEach((k, idx) => {
        if (profile.knucklesPigment && (idx === 0 || idx === 1)) {
          const knGlow = ctx.createRadialGradient(k.x, k.y, 2, k.x, k.y, 17);
          knGlow.addColorStop(0, 'rgba(196, 78, 46, 0.76)');
          knGlow.addColorStop(0.6, 'rgba(182, 82, 50, 0.32)');
          knGlow.addColorStop(1, 'rgba(182, 82, 50, 0)');
          ctx.fillStyle = knGlow;
          ctx.beginPath();
          ctx.arc(k.x, k.y, 17, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = 'rgba(255, 240, 228, 0.28)';
        ctx.beginPath();
        ctx.ellipse(k.x, k.y - 1, 7.5, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(104, 64, 46, 0.34)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(k.x, k.y, 8, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();
      });

      // Excoriaciones lineales realistas por rascado (Lucía y Ernesto)
      if (profile.excoriations) {
        const scratches = [
          [110, 364, 166, 355],
          [104, 384, 178, 372],
          [116, 404, 182, 396],
          [122, 424, 170, 417]
        ];
        for (const [x1, y1, x2, y2] of scratches) {
          ctx.strokeStyle = 'rgba(204, 86, 78, 0.38)';
          ctx.lineWidth = 5.5;
          ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
          ctx.strokeStyle = '#9c322c';
          ctx.lineWidth = 1.9;
          ctx.beginPath(); ctx.moveTo(x1 + 3, y1); ctx.lineTo(x2 - 3, y2); ctx.stroke();
        }
      }
      ctx.restore();
      ctx.restore();

      ctx.strokeStyle = '#475f6f';
      ctx.lineWidth = 2.5;
      roundRectPath(ctx, 18, 232, 254, 220, 12);
      ctx.stroke();

      /* -------- 3. PANEL INFERIOR DERECHO: PERFIL ANATÓMICO DE TOBILLO Y PIE -------- */
      ctx.save();
      roundRectPath(ctx, 288, 232, 254, 220, 12);
      ctx.clip();

      const linenR = ctx.createLinearGradient(288, 232, 542, 452);
      linenR.addColorStop(0, '#eef5f8');
      linenR.addColorStop(0.6, '#dde9f0');
      linenR.addColorStop(1, '#c8dae4');
      ctx.fillStyle = linenR;
      ctx.fillRect(288, 232, 254, 220);

      // Pliegues suaves de la sábana en la camilla
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(288, 396); ctx.quadraticCurveTo(415, 388, 542, 402);
      ctx.stroke();

      // Sombra de contacto realista bajo el talón y la planta del pie
      ctx.fillStyle = 'rgba(34, 52, 66, 0.18)';
      ctx.beginPath();
      ctx.ellipse(424, 422, 92, 13, 0, 0, Math.PI * 2);
      ctx.fill();

      function traceAnatomicalAnkle() {
        ctx.beginPath();
        // Parte posterior de pantorrilla -> concavidad del tendón de Aquiles -> talón
        ctx.moveTo(352, 234);
        ctx.bezierCurveTo(356, 272, 366, 308, 364, 344);
        ctx.bezierCurveTo(362, 366, 344, 384, 344, 402);
        ctx.bezierCurveTo(344, 418, 362, 424, 388, 422);
        // Arco plantar sutil -> antepié -> dedo gordo del pie
        ctx.bezierCurveTo(416, 419, 434, 415, 456, 420);
        ctx.bezierCurveTo(482, 424, 508, 423, 514, 411);
        ctx.bezierCurveTo(518, 401, 506, 392, 490, 390);
        // Empeine suave -> cuello anterior del tobillo -> cresta tibial anterior
        ctx.bezierCurveTo(466, 384, 444, 366, 428, 344);
        ctx.bezierCurveTo(418, 326, 420, 286, 424, 234);
        ctx.closePath();
      }

      const legGrad = ctx.createLinearGradient(344, 240, 498, 414);
      legGrad.addColorStop(0, profile.skinShade);
      legGrad.addColorStop(0.32, profile.skin);
      legGrad.addColorStop(0.62, profile.skinLight);
      legGrad.addColorStop(1, profile.skin);
      ctx.fillStyle = legGrad;
      ctx.strokeStyle = '#3c2920';
      ctx.lineWidth = 2.4;
      ctx.lineJoin = 'round';
      traceAnatomicalAnkle();
      ctx.fill();
      ctx.stroke();

      // Detalles anatómicos internos recortados al tobillo/pie
      ctx.save();
      traceAnatomicalAnkle();
      ctx.clip();

      // Brillo suave a lo largo de la cresta tibial (sin fóvea ni edema pretibial)
      const shinHi = ctx.createLinearGradient(402, 242, 426, 344);
      shinHi.addColorStop(0, 'rgba(255, 246, 236, 0.34)');
      shinHi.addColorStop(1, 'rgba(255, 246, 236, 0)');
      ctx.fillStyle = shinHi;
      ctx.beginPath();
      ctx.ellipse(412, 294, 10, 56, -0.05, 0, Math.PI * 2);
      ctx.fill();

      // Surco retromaleolar limpio (clave clínica de ausencia de edema)
      ctx.strokeStyle = 'rgba(112, 68, 48, 0.28)';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(372, 318);
      ctx.quadraticCurveTo(376, 350, 368, 380);
      ctx.stroke();

      // Maléolo bien perfilado con volumen óseo y sombra inferior suave
      const malShadow = ctx.createRadialGradient(392, 368, 3, 392, 368, 17);
      malShadow.addColorStop(0, 'rgba(108, 64, 46, 0.34)');
      malShadow.addColorStop(1, 'rgba(108, 64, 46, 0)');
      ctx.fillStyle = malShadow;
      ctx.beginPath();
      ctx.arc(392, 368, 17, 0, Math.PI * 2);
      ctx.fill();

      const malGrad = ctx.createRadialGradient(393, 360, 2, 394, 363, 13);
      malGrad.addColorStop(0, profile.skinLight);
      malGrad.addColorStop(0.75, profile.skin);
      malGrad.addColorStop(1, 'rgba(128, 82, 58, 0.18)');
      ctx.fillStyle = malGrad;
      ctx.beginPath();
      ctx.ellipse(394, 363, 12.5, 10.5, -0.15, 0, Math.PI * 2);
      ctx.fill();

      // Sombra plantar sutil bajo el borde inferior del pie
      ctx.fillStyle = 'rgba(98, 58, 42, 0.24)';
      ctx.fillRect(340, 412, 180, 16);

      // Uña del primer dedo y separación sutil de dedos menores
      ctx.fillStyle = 'rgba(248, 224, 214, 0.85)';
      ctx.strokeStyle = 'rgba(128, 86, 72, 0.5)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(503, 399, 6.5, 3.6, 0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = 'rgba(104, 64, 46, 0.36)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(476, 404);
      ctx.quadraticCurveTo(486, 405, 496, 411);
      ctx.stroke();

      ctx.restore();

      // Borde doblado del pantalón / prenda recogida en la parte superior de la pierna
      const cuffGrad = ctx.createLinearGradient(342, 232, 434, 256);
      cuffGrad.addColorStop(0, '#36485a');
      cuffGrad.addColorStop(0.5, '#526a82');
      cuffGrad.addColorStop(1, '#314252');
      ctx.fillStyle = cuffGrad;
      ctx.strokeStyle = '#1f2b36';
      ctx.lineWidth = 2.4;
      roundRectPath(ctx, 340, 226, 94, 28, 10);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      ctx.strokeStyle = '#475f6f';
      ctx.lineWidth = 2.5;
      roundRectPath(ctx, 288, 232, 254, 220, 12);
      ctx.stroke();

      /* -------- 4. HAZ VOLUMÉTRICO DE LA LINTERNA CLÍNICA -------- */
      const flashing = now < light.flashUntil;
      const radius = flashing ? 154 : 118;
      ctx.save();
      const grad = ctx.createRadialGradient(light.x, light.y, 24, light.x, light.y, radius + 72);
      grad.addColorStop(0, flashing ? 'rgba(255, 252, 224, 0.22)' : 'rgba(255, 250, 222, 0.06)');
      grad.addColorStop(0.55, 'rgba(16, 26, 34, 0.14)');
      grad.addColorStop(1, 'rgba(10, 18, 24, 0.66)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CW, CH);

      // Aro óptico sutil de la linterna
      ctx.strokeStyle = flashing ? 'rgba(255, 248, 194, 0.92)' : 'rgba(244, 236, 186, 0.52)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(light.x, light.y, flashing ? 48 : 38, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    function tick(now) {
      if (destroyed) return;
      light.x += (light.tx - light.x) * 0.25;
      light.y += (light.ty - light.y) * 0.25;
      drawInspectionSceneHD(now);
      rafId = window.requestAnimationFrame(tick);
    }

    function onPointerMove(event) {
      if (!box) return;
      const rect = box.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      light.tx = Math.max(36, Math.min(CW - 36, ((event.clientX - rect.left) / rect.width) * CW));
      light.ty = Math.max(36, Math.min(CH - 36, ((event.clientY - rect.top) / rect.height) * CH));
    }

    function onZoneHover(event) {
      const btn = event.target.closest('[data-ins-zone]');
      if (!btn) return;
      const z = profile.zones.find(item => item.id === btn.dataset.insZone);
      if (!z) return;
      light.tx = z.px;
      light.ty = z.py;
    }

    function onClick(event) {
      const zoneBtn = event.target.closest('[data-ins-zone]');
      if (zoneBtn) {
        event.preventDefault();
        event.stopPropagation();
        inspectZone(zoneBtn.dataset.insZone);
        return;
      }
      const quizBtn = event.target.closest('[data-ins-quiz]');
      if (quizBtn) {
        event.preventDefault();
        event.stopPropagation();
        handleQuiz(quizBtn.dataset.insQuiz);
        return;
      }
      const actBtn = event.target.closest('[data-ins-action]');
      if (!actBtn) return;
      event.preventDefault();
      event.stopPropagation();
      const act = actBtn.dataset.insAction;
      if (act === 'back') { destroy(); onCancel?.(); }
      else if (act === 'skip') { destroy(); onComplete?.({ skipped: true }); }
      else if (act === 'complete' && getDoneCount() >= profile.zones.length && quizVerified) {
        destroy();
        onComplete?.({ skipped: false });
      }
    }

    function onKeyDown(event) {
      if (destroyed || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key === '1') { event.preventDefault(); inspectZone('eyes'); }
      else if (event.key === '2') { event.preventDefault(); inspectZone('hands'); }
      else if (event.key === '3') { event.preventDefault(); inspectZone('ankles'); }
    }

    box?.addEventListener('pointermove', onPointerMove);
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
      box?.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerover', onZoneHover);
      container.removeEventListener('focusin', onZoneHover);
      container.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKeyDown);
    }

    return { destroy };
  }

  return {
    mountVitals,
    mountInspection,
    resolveVitalsProfile,
    resolveInspectionProfile
  };
})();
