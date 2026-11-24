/* Embedded original source: src/jornadas/dia1/interfaz-clinica.js */
/* Módulo Día 1 original: clinical-ui.mjs. Lógica clínica conservada. */
window.HepatoDay1Modules['clinical-ui.mjs'] = (() => {
const {STUDY_CATALOG, extractRelevantFindings} = window.HepatoDay1Modules['study-catalog.mjs'];
const {DIAGNOSIS_CATALOG,PLAN_CATALOG,FOLLOWUP_CATALOG,TIMEFRAME_CATALOG,getPatientsForDay} = window.HepatoDay1Modules['simulation-cases.mjs'];
const {studyBundleState,resultFor,readyForDecisions,decisionsComplete} = window.HepatoDay1Modules['consultation.mjs'];
const {challengeFor,challengeChoicesFor,assessChallenge} = window.HepatoDay1Modules['clinical-challenges.mjs'];
const {STUDY_BUNDLES,STUDY_GROUPS,planChoicesFor,followupChoicesFor,interpretationChoicesFor} = window.HepatoDay1Modules['game-choices.mjs'];
const {historyDialogueFor} = window.HepatoDay1Modules['history-dialogue.mjs'];
const {returnVisitOfferMarkup} = window.HepatoDay1Modules['return-visit-ui.mjs'];
const {teachingFeedbackFor} = window.HepatoDay1Modules['teaching-feedback.mjs'];
const Hector=window.HepatoDay1Modules['hector-reasoning.mjs'];
const Valeria=window.HepatoDay1Modules['valeria-reasoning.mjs'];
const Ernesto=window.HepatoDay1Modules['ernesto-reasoning.mjs'];
const Lucia=window.HepatoDay1Modules['lucia-reasoning.mjs'];
const Andres=window.HepatoDay1Modules['andres-reasoning.mjs'];
const Rosa=window.HepatoDay1Modules['rosa-reasoning.mjs'];
const Diego=window.HepatoDay1Modules['diego-reasoning.mjs'];
const Elena=window.HepatoDay1Modules['elena-reasoning.mjs'];
const Sofia=window.HepatoDay1Modules['sofia-reasoning.mjs'];
const Martin=window.HepatoDay1Modules['martin-reasoning.mjs'];
const Economy=window.HepatoDay1Modules['economy.mjs'];
function escapeClinical(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
const clinicalLabel=(id,catalog)=>catalog.find(x=>x.id===id)?.title||id;
const clinicalNumber=n=>Number.isInteger(n)?String(n):n.toFixed(1).replace('.',',');
const clinicalPage=(content,actions,classes='',footerClasses='')=>`<div class="clinical-content ${classes}">${content}</div><div class="panel-actions panel-footer ${footerClasses}">${actions}</div>`;
function parseClinicalValue(value){
  if(typeof value!=='string')return NaN;
  let token=value.trim().split(/\s+/)[0];
  if(/^[+-]?\d{1,3}(?:\.\d{3})+(?:,\d+)?$/.test(token))token=token.replace(/\./g,'');
  const number=Number(token.replace(',','.'));
  return token!==''&&Number.isFinite(number)?number:NaN;
}
function getClinicalInterpretation(tool, val, age){
  if(!Number.isFinite(val))return null;
  if(tool==='fib4'){
    const lowCut=Number.isFinite(age)&&age>=65?2.0:1.30;
    const lowStr=lowCut===2.0?'2,00':'1,30';
    if(val<lowCut)return {label:`Rango inferior (< ${lowStr})`,tag:'low',detail:'Interpreta el resultado según la edad del paciente y el contexto clínico.'};
    if(val<=2.67)return {label:`Zona intermedia (${lowStr}–2,67)`,tag:'mid',detail:'Valor en rango intermedio; integra con los estudios para definir la conducta.'};
    return {label:'Rango superior (> 2,67)',tag:'high',detail:'Valor por encima del umbral superior; integra con la evaluación clínica.'};
  }
  if(tool==='r'){
    if(val>=5)return {label:'Patrón hepatocelular (R ≥ 5)',tag:'hep',detail:'Predominio de necrosis hepatocitaria con transaminasas marcadamente elevadas.'};
    if(val>2)return {label:'Patrón mixto (2 < R < 5)',tag:'mix',detail:'Afectación combinada de daño hepatocelular y colestasis.'};
    return {label:'Patrón colestásico (R ≤ 2)',tag:'col',detail:'Lesión predominantemente canalicular con elevación desproporcionada de FA.'};
  }
  if(tool==='meldNa'||tool==='meld3'){
    if(val<10)return {label:'Mortalidad estimada a 90 días baja (< 2%)',tag:'low',detail:'Reserva funcional hepática estable bajo compensación clínica.'};
    if(val<20)return {label:'Mortalidad intermedia (~6%)',tag:'mid',detail:'Disfunción moderada; requiere estrecha vigilancia ambulatoria.'};
    if(val<30)return {label:'Mortalidad significativa (~20%)',tag:'high',detail:'Disfunción hepática severa; evaluar prioridad en lista de trasplante.'};
    return {label:'Mortalidad crítica (> 50%)',tag:'crit',detail:'Fallo hepático descompensado agudo sobre crónico; soporte intensivo.'};
  }
  if(tool==='childPugh'){
    if(val<=6)return {label:'Clase A (5–6 pts) · Compensada',tag:'low',detail:'Excelente reserva funcional. Supervivencia al año ~100%.'};
    if(val<=9)return {label:'Clase B (7–9 pts) · Compromiso moderado',tag:'mid',detail:'Compromiso funcional significativo. Supervivencia al año ~80%.'};
    return {label:'Clase C (10–15 pts) · Descompensada',tag:'high',detail:'Fallo hepático avanzado. Supervivencia al año ~45%.'};
  }
  return null;
}
class ClinicalUI {
  constructor(state,caseFor){this.state=state;this.caseFor=caseFor;this.orderGroup='Sangre';this.decisionStep=Hector.isHector(caseFor())&&!state.clinical.outcome?Hector.nextStep(state.clinical.decisions):Valeria.isValeria(caseFor())&&!state.clinical.outcome?Valeria.nextStep(state.clinical.decisions):Ernesto.isErnesto(caseFor())&&!state.clinical.outcome?Ernesto.nextStep(state.clinical.decisions):Lucia.isLucia(caseFor())&&!state.clinical.outcome?Lucia.nextStep(state.clinical.decisions):Andres.isAndres(caseFor())&&!state.clinical.outcome?Andres.nextStep(state.clinical.decisions):Rosa.isRosa(caseFor())&&!state.clinical.outcome?Rosa.nextStep(state.clinical.decisions):Diego.isDiego(caseFor())&&!state.clinical.outcome?Diego.nextStep(state.clinical.decisions):Elena.isElena(caseFor())&&!state.clinical.outcome?Elena.nextStep(state.clinical.decisions):Sofia.isSofia(caseFor())&&!state.clinical.outcome?Sofia.nextStep(state.clinical.decisions):Martin.isMartin(caseFor())&&!state.clinical.outcome?Martin.nextStep(state.clinical.decisions):0;this.tool='fib4';this.toolInputs={};}
  get clinical(){return this.state.clinical;}
  get caseData(){return this.caseFor();}
  reset(){this.continuarSinEstudiosDemo=false;this.agendaDemoVisible=false;this.orderGroup='Sangre';this.decisionStep=Hector.isHector(this.caseFor())&&!this.clinical.outcome?Hector.nextStep(this.clinical.decisions):Valeria.isValeria(this.caseFor())&&!this.clinical.outcome?Valeria.nextStep(this.clinical.decisions):Ernesto.isErnesto(this.caseFor())&&!this.clinical.outcome?Ernesto.nextStep(this.clinical.decisions):Lucia.isLucia(this.caseFor())&&!this.clinical.outcome?Lucia.nextStep(this.clinical.decisions):Andres.isAndres(this.caseFor())&&!this.clinical.outcome?Andres.nextStep(this.clinical.decisions):Rosa.isRosa(this.caseFor())&&!this.clinical.outcome?Rosa.nextStep(this.clinical.decisions):Diego.isDiego(this.caseFor())&&!this.clinical.outcome?Diego.nextStep(this.clinical.decisions):Elena.isElena(this.caseFor())&&!this.clinical.outcome?Elena.nextStep(this.clinical.decisions):Sofia.isSofia(this.caseFor())&&!this.clinical.outcome?Sofia.nextStep(this.clinical.decisions):Martin.isMartin(this.caseFor())&&!this.clinical.outcome?Martin.nextStep(this.clinical.decisions):0;this.tool='fib4';this.toolInputs={};}
  locked(message,tab,label){return clinicalPage(`<p class="clinical-note">${message}</p>`,`<button class="primary-button" data-tab="${tab}">${label}</button>`);}
  historyBody(){
    const c=this.clinical,p=this.caseData;
    const dialogue=historyDialogueFor(p),selected=this.historySelectedCase===p.id?dialogue.find(t=>t.id===this.historySelectedTopic):null;
    const button=t=>`<button type="button" class="secondary-button ${c.asked.includes(t.id)?'asked':''}" data-topic="${t.id}" aria-pressed="${c.asked.includes(t.id)}" aria-label="${escapeClinical(t.question)}${c.asked.includes(t.id)?' · Ya preguntado':''}" ${c.outcome?'disabled':''}><span>${escapeClinical(t.question)}</span><span aria-hidden="true">${c.asked.includes(t.id)?'✓':'+'}</span></button>`;
    const basics=dialogue.filter(t=>!t.optional),availableProbes=dialogue.filter(t=>t.optional&&c.asked.includes(t.after));
    const response=selected?`<section class="hp-history-dialogue history-current" role="status" aria-live="polite" aria-atomic="true"><span>${escapeClinical(p.patient.name)}</span><p>«${escapeClinical(selected.voice||selected.answer)}»</p>${selected.answer&&selected.voice&&selected.answer!==selected.voice?`<details><summary>Ver detalle clínico</summary><p>${escapeClinical(selected.answer)}</p></details>`:''}</section>`:'';
    
    return clinicalPage(
      `<section class="hp-hc-card">
        <div class="hp-hc-heading">
          <h3>01 · Motivo de consulta</h3>
          <small>Relato inicial</small>
        </div>
        <p class="patient-quote">${escapeClinical(p.complaint)}</p>
      </section>

      ${response}

            <section class="hp-hc-card">
        <div class="hp-hc-heading">
          <h3>02 · Anamnesis dirigida</h3>
          <small>Preguntas al paciente</small>
        </div>
        <p class="panel-copy" id="history-hint">
          Selecciona las preguntas que consideres relevantes.
        </p>
        <div class="history-topics" aria-describedby="history-hint">
          ${basics.map(button).join('')}
        </div>
        ${availableProbes.length
          ? `<div class="history-followups">
              <h3>Preguntas de profundización</h3>
              <div class="history-topics">
                ${availableProbes.map(button).join('')}
              </div>
            </div>`
          : ''}
      </section>`,
      `<button class="primary-button"
        data-action="begin-exam"
        ${c.outcome ? 'disabled' : ''}>
        ${c.exam ? 'Repetir el examen físico' : 'Vamos al examen físico →'}
      </button>
      ${c.exam
        ? '<button class="secondary-button" data-tab="orders">Elegir estudios →</button>'
        : ''}`,
      'history-content'
    );

  }
  
  examBody(){
    const c=this.clinical;
    const p=this.caseData.patient;
    const nombre=escapeClinical(p.name);
    const renderPortrait=window.HepatoSharedModules?.['renderer.mjs']?.portraitMarkup;
    const residentSvg=renderPortrait?renderPortrait({resident:true},'noting'):'<rect width="32" height="32" fill="#c4d8e2"/>';
    const spiralRings=Array.from({length:12},()=>'<span class="hp-exam-spiral-ring"><i></i></span>').join('');

    // Antes del examen, mostrar la libreta lista para tomar apuntes en la camilla.
    if(!c.exam){
      return clinicalPage(
        `<section class="hp-exam-notebook is-pending" aria-label="Libreta de apuntes de examen físico">
          <div class="hp-exam-spiral" aria-hidden="true">${spiralRings}</div>
          <header class="hp-exam-notebook-head">
            <svg class="hp-exam-notebook-avatar" viewBox="0 0 32 32" shape-rendering="crispEdges" aria-hidden="true">${residentSvg}</svg>
            <div class="hp-exam-notebook-meta">
              <span class="hp-exam-notebook-kicker">✎ LIBRETA DE APUNTES · SEMIOLOGÍA</span>
              <h3>Exploración física de ${nombre}</h3>
              <small>${escapeClinical(p.age)} años · ${escapeClinical(p.sex)} · Camilla pendiente</small>
            </div>
            <span class="hp-exam-notebook-stamp is-pending">SIN REGISTRAR</span>
          </header>
          <div class="hp-exam-notebook-page">
            <p class="hp-exam-notebook-lead">${nombre} caminará a la camilla para que realices el examen físico y anotes los hallazgos en tu libreta.</p>
            <div class="hp-exam-empty-lines" aria-hidden="true">
              <span>01 · Inspección general y constantes vitales…</span>
              <span>02 · Exploración abdominal y hepatometría…</span>
              <span>03 · Búsqueda dirigida de estigmas hepáticos…</span>
            </div>
          </div>
        </section>`,
        '<button class="primary-button" data-action="begin-exam">Ir a la camilla →</button>',
        'exam-content'
      );
    }

    // Recuperar los hallazgos reales del caso activo.
    const hallazgos=Array.isArray(this.caseData.exam)
      ? this.caseData.exam
      : [];

    const registro=hallazgos.map((h,i)=>`
      <article class="hp-exam-note-item history-entry">
        <div class="hp-exam-note-margin" aria-hidden="true">
          <span class="hp-exam-note-num">${String(i+1).padStart(2,'0')}</span>
          <span class="hp-exam-note-tick">✓</span>
        </div>
        <div class="hp-exam-note-content">
          <h3>${String(i+1).padStart(2,'0')} · ${escapeClinical(h.title)}</h3>
          <p>${escapeClinical(h.text)}</p>
        </div>
      </article>
    `).join('');

    const acciones=c.outcome
      ? '<button class="primary-button" data-tab="decisions">Ver devolución →</button>'
      : '<button class="secondary-button" data-action="begin-exam">Repetir examen</button><button class="primary-button" data-tab="orders">Elegir estudios →</button>';

    return clinicalPage(
      `<section class="hp-exam-notebook" aria-label="Libreta de apuntes de examen físico">
        <div class="hp-exam-spiral" aria-hidden="true">${spiralRings}</div>
        <header class="hp-exam-notebook-head">
          <svg class="hp-exam-notebook-avatar" viewBox="0 0 32 32" shape-rendering="crispEdges" aria-hidden="true">${residentSvg}</svg>
          <div class="hp-exam-notebook-meta">
            <span class="hp-exam-notebook-kicker">✎ LIBRETA DE APUNTES · CAMILLA DE EXPLORACIÓN</span>
            <h3>Apuntes del examen físico · ${nombre}</h3>
            <small>${escapeClinical(p.age)} años · ${escapeClinical(p.sex)} · ${escapeClinical(p.occupation||'Paciente ambulatorio')}</small>
          </div>
          <span class="hp-exam-notebook-stamp">✓ REGISTRADO</span>
        </header>
        <div class="hp-exam-notebook-page">
          <p class="hp-exam-notebook-lead">Examen físico realizado. Los hallazgos obtenidos en la camilla quedaron anotados en tu libreta clínica:</p>
          <div class="hp-exam-notes-list">
            ${registro}
          </div>
          <footer class="hp-exam-notebook-foot">
            <span>✎ Dra. Residente · Servicio de Hepatología</span>
            <span>${hallazgos.length} apuntes semiológicos</span>
          </footer>
        </div>
      </section>`,
      acciones,
      'exam-content'
    );
  }

  agendaDemoMarkup() {
    const citas = this.state.campaign.appointments || [];
    const paciente = this.caseData;

    const miCita = citas.find(a =>
      a.caseId === paciente.id && a.day === 2
    );

    const diasNombres = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE'];
    const dias = Array.from({length: 5}, (_, i) => {
      const dia = i + 1;
      const activo = dia === 2;
      const completo = dia === 1;
      const estado = completo
        ? '2 pacientes programados'
        : activo
          ? `${1 + citas.length}/3 · Abierto`
          : 'Cerrado';

      return `
        <div class="hp-agenda-day ${activo ? 'is-active' : ''} ${completo ? 'is-done' : ''}">
          <span class="hp-agenda-weekday">${diasNombres[i]}</span>
          <strong>Día ${dia}</strong>
          <small>${estado}</small>
        </div>
      `;
    }).join('');

    const horarios = {2: '09:15', 3: '10:00'};
    const turnos = [2, 3].map(numero => {
      const reserva = citas.find(a =>
        a.day === 2 && a.slot === numero
      );

      if (reserva) {
        const esMio = reserva.caseId === paciente.id;
        return `
          <div class="hp-agenda-slot-card ${esMio ? 'is-mine' : 'is-taken'}">
            <span class="hp-agenda-slot-time">TURNO 0${numero} · ${horarios[numero]}</span>
            <strong>${esMio ? `${escapeClinical(paciente.patient.name)} · Reconsulta confirmada ✓` : 'Turno ocupado · Otro paciente'}</strong>
          </div>
        `;
      }

      if (miCita) return '';

      return `
        <button
          type="button"
          class="secondary-button hp-agenda-slot-btn"
          data-action="reservar-demo"
          data-turno="${numero}">
          <span class="hp-agenda-slot-time">TURNO 0${numero} · ${horarios[numero]}</span>
          <strong>Reservar turno ${numero} · Disponible +</strong>
        </button>
      `;
    }).join('');

    return `
      <section class="hp-hc-card hp-agenda-scheduler">
        <div class="hp-hc-heading">
          <h3>03 · Agendar próxima consulta</h3>
          <small>Agenda hospitalaria · Semana 01</small>
        </div>

        <p class="panel-copy">
          Selecciona un turno para el control de
          <strong>${escapeClinical(paciente.patient.name)}</strong>.
          Los resultados estarán disponibles en el Día 2.
        </p>

        <div class="hp-agenda-week" aria-label="Calendario semanal de consultorio">
          ${dias}
        </div>

        <div class="hp-agenda-slots-head">
          <h4>Día 2 · Turnos de consultorio 01</h4>
          <span>${3 - (1 + citas.length)} disponibles</span>
        </div>

        <div class="hp-agenda-slot-card is-taken">
          <span class="hp-agenda-slot-time">TURNO 01 · 08:30</span>
          <strong>Primera consulta programada · Reservado</strong>
        </div>

        <div class="hp-agenda-slots-grid">
          ${turnos}
        </div>

        ${miCita ? `
          <p class="clinical-note hp-agenda-confirmed" role="status">
            ✓ Reconsulta confirmada: Día 2, turno 0${miCita.slot} (${horarios[miCita.slot]} hs).
            Estudios pendientes hasta el control.
          </p>
        ` : ''}
      </section>
    `;
  }


  managerMemoMarkup(){
    const finance=this.state.campaign?.finance;
    if(!finance||!Economy)return '';
    const bal=Economy.balance(finance);
    const lastEntry=Array.isArray(finance.entries)&&finance.entries.length?finance.entries[finance.entries.length-1]:null;
    let kind='directive',mood='neutral',kicker='DIRECCIÓN ADMINISTRATIVA · CIRCULAR N.º 01',text=`El hospital inicia el turno con un fondo operativo ajustado de ${Economy.money(bal)}. Los estudios indicados están cubiertos; solicitar pruebas sin sustento clínico aplica un recargo del 50 %.`;
    if(bal<1000){
      kind='crisis';mood='critical';
      kicker='GERENCIA HOSPITALARIA · ALERTA DE CONTINGENCIA';
      text=`El fondo operativo cayó a ${Economy.money(bal)}. Mantenimiento reporta fluctuaciones en la red eléctrica del consultorio y Laboratorio restringe el uso de reactivos.`;
    }else if(lastEntry&&lastEntry.fees>0){
      kind='warning';mood='concerned';
      kicker='AUDITORÍA DE GERENCIA · OBSERVACIÓN EN RECETARIO';
      text=`En la consulta previa se descontaron −${Economy.money(lastEntry.fees)} por estudios no indicados. La Dirección solicita ajustar las órdenes estrictamente a la sospecha diagnóstica.`;
    }else if(lastEntry&&lastEntry.penalty>0){
      kind='warning';mood='concerned';
      kicker='DIRECCIÓN MÉDICA · AJUSTE PRESUPUESTARIO';
      text=`El episodio anterior registró una penalización de −${Economy.money(lastEntry.penalty)} por resolución clínica inadecuada. Revisa los algoritmos antes de cerrar el caso.`;
    }else if(lastEntry&&lastEntry.reward>0&&lastEntry.fees===0){
      kind='praise';mood='relieved';
      kicker='GERENCIA HOSPITALARIA · NOTA DE CONFORMIDAD';
      text=`Uso racional de recursos en la consulta anterior (+${Economy.money(lastEntry.reward)} acreditados, sin cargos por estudios innecesarios). El hospital recupera margen operativo.`;
    }
    const renderPortrait=window.HepatoSharedModules?.['renderer.mjs']?.portraitMarkup;
    const managerSvg=renderPortrait?renderPortrait({manager:true},mood):'<rect width="32" height="32" fill="#c8dae4"/>';
    return `<aside class="hp-manager-memo" data-memo="${kind}" aria-label="Pantalla del computador · Intranet de Gerencia">
      <div class="hp-pc-bar">
        <span class="hp-pc-dot" aria-hidden="true"></span>
        <span>🖥 MONITOR CONSULTORIO 01 · INTRANET GERENCIA</span>
        <span class="hp-pc-status">EN LÍNEA</span>
      </div>
      <div class="hp-manager-memo-screen">
        <svg class="hp-manager-portrait" viewBox="0 0 32 32" shape-rendering="crispEdges" aria-hidden="true">${managerSvg}</svg>
        <div class="hp-manager-memo-body">
          <span class="hp-manager-memo-kicker">${escapeClinical(kicker)}</span>
          <p class="hp-manager-memo-text">${escapeClinical(text)}</p>
        </div>
      </div>
    </aside>`;
  }

  ordersBody(){
    const c=this.clinical;
    if(!c.history||!c.exam||!c.seated)return this.locked('Conversa y realiza el examen físico antes de pedir estudios.','history','Volver al paciente');
    if(c.outcome)return this.locked('Esta consulta ya terminó.','decisions','Ver devolución');
    if(this.state.campaign.day===2&&(Martin.isMartin(this.caseData)||Sofia.isSofia(this.caseData)))return clinicalPage('<p class="clinical-note">La demo no dispone de otra consulta para recibir estudios nuevos. Revisa los resultados ya disponibles o continúa con la información obtenida.</p>',`<button class="secondary-button" data-tab="results">Revisar resultados</button><button class="primary-button" data-tab="decisions">Continuar con la consulta →</button>`,'orders-content');
    
const diferido = this.state.campaign.day === 1 &&
  (Martin.isMartin(this.caseData) ||
   Sofia.isSofia(this.caseData)) &&
  !c.received.length;


if (diferido && (c.orders.length || c.hypothesis || this.continuarSinEstudiosDemo)) {
  const opciones = Martin.isMartin(this.caseData)
    ? ['masld', 'hfe', 'alcohol', 'dili', 'undetermined']
    : ['gilbert', 'hemolysis', 'acute-hepatitis',
       'obstruction', 'undetermined'];

  const tarjetas = opciones.map(id => {
    const diagnostico = DIAGNOSIS_CATALOG.find(d => d.id === id);
    if (!diagnostico) return '';

    return `
      <button
        type="button"
        class="quick-choice study-bundle"
        data-impresion-choice="${id}">
        <span class="choice-mark">◇</span>
        <span><b>${escapeClinical(diagnostico.title)}</b></span>
      </button>
    `;
  }).join('');

  return clinicalPage(`
    <section class="hp-hc-card">
      <div class="hp-hc-heading">
        <h3>01 · Estudios</h3>
        <small>${c.orders.length?'Orden registrada':'Sin estudios solicitados'}</small>
      </div>
      <p class="panel-copy">
        ${c.orders.length?'Los estudios están pendientes. Los resultados se entregarán en la reconsulta.':'No se solicitaron estudios. Podrás continuar, pero las preguntas que requieran sus resultados se calificarán como incorrectas.'}
      </p>
    </section>

    <section class="hp-hc-card">
      <div class="hp-hc-heading">
        <h3>02 · Impresión diagnóstica inicial</h3>
        <small>Antes de los resultados</small>
      </div>

      ${c.hypothesis
        ? `
          <p class="clinical-note">
            Impresión registrada:
            <strong>${escapeClinical(c.hypothesis.text)}</strong>
          </p>
          ${this.agendaDemoVisible
  ? this.agendaDemoMarkup()
  : `<p class="panel-copy">
       Próximo paso: programar la reconsulta.
     </p>`}
        `
        : `
          <p class="panel-copy">
            Según la historia clínica y el examen físico,
            ¿cuál es tu principal sospecha diagnóstica?
          </p>
          <p class="panel-copy">Al seleccionar una impresión diagnóstica, quedará registrada y no podrás modificarla durante esta primera visita.</p>
          <div class="quick-choice-grid study-bundle-grid">
            ${tarjetas}
          </div>
        `}
    </section>
  `,
  `${c.hypothesis ? `
  <button
    class="primary-button"
    data-action="alternar-agenda-demo">
    ${this.agendaDemoVisible
      ? 'Ocultar agenda'
      : 'Agendar próxima consulta →'}
  </button>
` : ''}
<button class="secondary-button" data-tab="history">
  Revisar historia clínica
</button>`,
  'orders-content');
}


    const pending=c.orders.filter(id=>!c.received.includes(id));
    const bundles=STUDY_BUNDLES.filter(s=>s.group===this.orderGroup);
    return clinicalPage(`
<section class="hp-result-sheet" aria-label="Orden médica de estudios">
  <header class="hp-result-header">
    <div class="hp-result-kicker">
      HOSPITAL PORTAL · SOLICITUD DE ESTUDIOS
      <span class="hp-result-counter">BORRADOR</span>
    </div>
    <h3 class="hp-result-title">Orden de estudios complementarios</h3>
    <p class="hp-result-subtitle">
      Paciente: ${escapeClinical(this.caseData.patient.name)}
      · ${c.cart.length} ${c.cart.length===1?'prueba seleccionada':'pruebas seleccionadas'}
    </p>
  </header>
</section>
<p class="panel-copy">Selecciona los estudios clínicamente indicados. Puedes ampliar el pedido posteriormente.</p>
${Economy?.orderMarkup(this.caseData,c,this.state.campaign.finance)||''}
${pending.length?`<div class="pending-orders"><b>Tienes resultados pendientes</b><button class="primary-button" data-action="receive-results">Abrir resultados →</button></div>`:''}
${c.cart.length ? `
  <section class="hp-result-sheet" aria-label="Resumen de la orden médica">
    <div class="hp-result-header">
      <div class="hp-result-kicker">
        ESTUDIOS SELECCIONADOS
        <span class="hp-result-counter">
          ${c.cart.length} ${c.cart.length===1?'PRUEBA':'PRUEBAS'}
        </span>
      </div>
    </div>
    <div class="hp-result-report">
      ${c.cart.map(id=>`
        <p>✓ ${escapeClinical(
          STUDY_CATALOG.find(s=>s.id===id)?.title||id
        )}</p>
      `).join('')}
    </div>
  </section>
` : ''}
<div class="study-tabs compact-study-tabs">
${STUDY_GROUPS.map(g=>`<button data-order-group="${g}" class="${g===this.orderGroup?'active':''}" aria-pressed="${g===this.orderGroup}">${g}</button>`).join('')}</div><div class="quick-choice-grid study-bundle-grid">${bundles.map(s=>{
      const b=studyBundleState(c,s.id),prerequisites=s.tests.flatMap(id=>STUDY_CATALOG.find(x=>x.id===id).prerequisites||[]);
      const detail=b.ordered?b.received?'Resultados disponibles':'En el pedido':!b.available&&prerequisites.length?s.id==='biopsy'?'Primero: analítica y ecografía':'Primero: función renal':s.detail;
      return `<button class="quick-choice study-bundle ${b.selected?'selected':''} ${b.ordered?'ordered':''}" data-study-bundle="${s.id}" aria-pressed="${b.selected}" ${!b.available?'disabled':''}><span class="choice-mark" aria-hidden="true">${b.ordered?'✓':b.selected?'◆':'◇'}</span><span><b>${s.title}</b><small>${detail}</small><small class="economy-price">Valor: ${Economy?.money(Economy.total(s.tests))||'—'} · Cubierto si está indicado</small></span></button>`;
    }).join('')}</div>`,`<span class="selection-count">${c.cart.length?`${c.cart.length} pruebas en tu pedido`:'Tu pedido está vacío'}</span>${diferido&&!c.orders.length?'<button class="secondary-button" data-action="continuar-sin-estudios-demo">Continuar sin solicitar estudios</button>':''}<button class="secondary-button" data-tab="results">Resultados</button><button class="primary-button" data-action="submit-orders" ${!c.cart.length?'disabled':''}>${diferido?'Solicitar estudios →':'Solicitar y ver resultados →'}</button>`,'orders-content','order-actions');
  }
  resultsBody(){
    const c=this.clinical;
    if(!c.received.length){
      return this.locked(
        c.orders.length
          ? 'Tienes un pedido pendiente de entrega. Los informes impresos se recibirán físicamente en la bandeja en la próxima consulta.'
          : 'Todavía no solicitaste estudios complementarios.',
        'orders',
        c.orders.length ? 'Ver solicitud' : 'Ir a pedidos'
      );
    }

    const reviewedList = c.received.filter(id => c.reviewed.includes(id));
    const pendingList = c.received.filter(id => !c.reviewed.includes(id));

    // Si aún no se revisó ningún estudio en la bandeja física
    if(!reviewedList.length){
      const pendingItems = pendingList.map(id => {
        const itemTitle = clinicalLabel(id, STUDY_CATALOG);
        return `
          <div class="hp-emr-pending-row">
            <span class="hp-emr-pending-icon">○</span>
            <div class="hp-emr-pending-info">
              <strong>${escapeClinical(itemTitle)}</strong>
              <small>Informe físico entregado · Pendiente de revisión en la bandeja</small>
            </div>
            <button type="button" class="secondary-button" data-action="open-tray" data-tray-target="${id}">Revisar informe →</button>
          </div>
        `;
      }).join('');

      return clinicalPage(
        `<section class="hp-result-sheet hp-emr-tray-notice" aria-label="Aviso de informes en bandeja">
          <header class="hp-result-header">
            <div class="hp-result-kicker">HISTORIA CLÍNICA · RECEPCIÓN DE ESTUDIOS <span class="hp-result-counter">0 / ${c.received.length} REVISADOS</span></div>
            <h3 class="hp-result-title">Informes impresos disponibles en la bandeja</h3>
            <p class="hp-result-subtitle">El paciente entregó ${c.received.length} ${c.received.length === 1 ? 'estudio complementario' : 'estudios complementarios'} en su consulta.</p>
          </header>
          <div class="hp-emr-tray-body">
            <p class="clinical-note">
              Los informes completos están depositados físicamente en la <strong>Bandeja de Estudios</strong> del escritorio.
              Para preservar el rigor médico, ábrelos desde la bandeja y pulsa <em>«Marcar como revisado»</em> para incorporar sus hallazgos relevantes a esta historia clínica.
            </p>
            <div class="hp-emr-pending-list">
              ${pendingItems}
            </div>
          </div>
        </section>`,
        `<button class="secondary-button" data-tab="orders">Ver solicitudes</button><button class="primary-button" data-action="open-tray">Abrir bandeja de estudios →</button>`,
        'results-content'
      );
    }

    // Si ya hay estudios revisados: mostrar únicamente hallazgos clínicamente relevantes
    const summaryCards = reviewedList.map(id => {
      const rawRes = resultFor(c, this.caseData, id);
      const extracted = extractRelevantFindings ? extractRelevantFindings(id, rawRes, this.caseData) : { title: clinicalLabel(id, STUDY_CATALOG), group: 'Estudio', findings: [] };
      const findingsList = extracted.findings.length
        ? extracted.findings.map(f => `<li class="hp-finding-item">${f}</li>`).join('')
        : `<li class="hp-finding-item hp-finding-none">Sin alteraciones clínicamente significativas señaladas.</li>`;

      return `
        <article class="hp-reviewed-summary-card">
          <header class="hp-reviewed-card-head">
            <span class="hp-reviewed-group-tag">${escapeClinical(extracted.group)}</span>
            <h4 class="hp-reviewed-card-title">${escapeClinical(extracted.title)}</h4>
            <span class="hp-reviewed-stamp">✓ REVISADO</span>
          </header>
          <ul class="hp-reviewed-findings-list">
            ${findingsList}
          </ul>
          <footer class="hp-reviewed-card-foot">
            <small>Informe original completo archivado en bandeja de entrada.</small>
            <button type="button" class="text-button" data-action="open-tray" data-tray-target="${id}">Ver informe completo ↗</button>
          </footer>
        </article>
      `;
    }).join('');

    const pendingNotice = pendingList.length ? `
      <aside class="hp-emr-unreviewed-alert">
        <span class="alert-icon">⚠</span>
        <div class="alert-body">
          <strong>${pendingList.length} ${pendingList.length === 1 ? 'estudio pendiente' : 'estudios pendientes'} de revisión en la bandeja física:</strong>
          <span>${escapeClinical(pendingList.map(id => clinicalLabel(id, STUDY_CATALOG)).join(', '))}</span>
        </div>
        <button type="button" class="secondary-button" data-action="open-tray">Revisar en bandeja →</button>
      </aside>
    ` : '';

    return clinicalPage(
      `<section class="hp-result-sheet hp-emr-results-summary" aria-label="Resumen de estudios revisados">
        <header class="hp-result-header">
          <div class="hp-result-kicker">HISTORIA CLÍNICA · HALLAZGOS RELEVANTES <span class="hp-result-counter">${reviewedList.length} / ${c.received.length} REVISADOS</span></div>
          <h3 class="hp-result-title">Resumen de estudios complementarios</h3>
          <p class="hp-result-subtitle">Paciente: ${escapeClinical(this.caseData.patient.name)} · Registro médico digital</p>
        </header>
        ${pendingNotice}
        <div class="hp-reviewed-cards-container">
          ${summaryCards}
        </div>
      </section>`,
      `<button class="secondary-button" data-action="open-tray">Bandeja de estudios</button><button class="secondary-button" data-tab="tools">Calculadoras</button><button class="primary-button" data-tab="decisions">Continuar consulta →</button>`,
      'results-content'
    );
  }
  
  
  toolsBody(){

    // Child-Pugh: interfaz independiente
    if(this.tool==='childPugh'){
      const c=this.clinical;
      const values=this.toolInputs.childPugh||{};
      const points=c.calculations.childPugh;

      const complete=['bilirubin','albumin','inr'].every(k=>
        values[k]!==undefined&&String(values[k]).trim()!==''
      )&&!!values.ascites&&!!values.encephalopathy;

      const grade=points<=6?'A':points<=9?'B':'C';

      const numberField=(key,label,unit)=>`
        <label class="clinical-field">
          ${label}
          <input type="number" min="0" step="any"
            data-calculation-input="${key}"
            value="${escapeClinical(String(values[key]??''))}">
          <small>${unit}</small>
        </label>`;

      const selectField=(key,label,options)=>`
        <label class="clinical-field">
          ${label}
          <select data-calculation-input="${key}">
            <option value="">Selecciona según la evaluación clínica...</option>
            ${options.map(([id,text])=>`
              <option value="${id}" ${values[key]===id?'selected':''}>
                ${text}
              </option>`).join('')}
          </select>
        </label>`;

      return clinicalPage(`
        <p class="panel-copy">
          Clasificación Child-Turcotte-Pugh para pacientes con cirrosis.
        </p>

        <div class="study-tabs">
          <button data-tool="fib4">FIB-4</button>
          <button data-tool="r">Cociente R</button>
          <button data-tool="meldNa">MELD-Na</button>
          <button data-tool="meld3">MELD 3.0</button>
          <button data-tool="childPugh" class="active">Child-Pugh</button>
        </div>

        <div class="calculator-fields">
          ${numberField('bilirubin','Bilirrubina total','mg/dL')}
          ${numberField('albumin','Albúmina','g/dL')}
          ${numberField('inr','INR','')}
        </div>

        <div class="calculator-fields">
          ${selectField('ascites','Ascitis',[
            ['none','Ausente (1 punto)'],
            ['mild','Leve o controlada con diuréticos (2 puntos)'],
            ['severe','Moderada o grave pese al tratamiento (3 puntos)']
          ])}

          ${selectField('encephalopathy','Encefalopatía hepática',[
            ['none','Ausente (1 punto)'],
            ['mild','Grado I-II (2 puntos)'],
            ['severe','Grado III-IV (3 puntos)']
          ])}
        </div>

        <p class="clinical-note">
          Bilirrubina, albúmina e INR se completan al revisar sus informes.
          Ascitis y encefalopatía deben valorarse clínicamente.
        </p>

        <p class="clinical-note">
          <b>Interpretación:</b> A = 5-6; B = 7-9; C = 10-15.
          Esta clasificación valora gravedad en pacientes con cirrosis.
          No diagnostica cirrosis ni estadifica MASLD sin cirrosis.
        </p>

        ${Number.isInteger(points)&&points>=5&&points<=15&&complete?`
          <div class="calculation-output hp-calculator-lcd" role="region" aria-label="Resultado de Child-Pugh">
            <div class="hp-lcd-screen">
              <div class="hp-lcd-top">
                <span class="hp-lcd-ind">● CALC</span>
                <span class="hp-lcd-scale">CHILD-TURCOTTE-PUGH</span>
              </div>
              <div class="hp-lcd-main">
                <span class="hp-lcd-val"><strong>${points}</strong> <small>/ 15</small></span>
                <span class="hp-lcd-grade">CLASE ${grade}</span>
              </div>
              <div class="hp-lcd-interp" data-tier="${points<=6?'low':points<=9?'mid':'high'}">
                <strong>${points<=6?'Clase A (Cirrosis compensada)':points<=9?'Clase B (Compromiso funcional moderado)':'Clase C (Cirrosis descompensada)'}</strong>
                <small>${points<=6?'Excelente reserva funcional. Supervivencia al año ~100%.':points<=9?'Compromiso funcional significativo. Supervivencia al año ~80%.':'Fallo hepático avanzado. Supervivencia al año ~45%.'}</small>
              </div>
              <div class="hp-lcd-status">
                <span class="hp-lcd-registered">✓ ASENTADO EN LA FICHA DEL PACIENTE</span>
              </div>
            </div>
          </div>`:''}`,
        `<button class="secondary-button" data-tab="results">
          Volver a los resultados
        </button>
        <button class="primary-button"
          data-action="calculate-tool"
          ${c.outcome?'disabled':''}>
          Calcular
        </button>`,
        'tools-content'
      );
    }

    const c=this.clinical,tool=this.tool;
    const isFib=tool==='fib4';
    const isR=tool==='r';
    const isMeldNa=tool==='meldNa';
    const isMeld3=tool==='meld3';
    const values=this.toolInputs[tool]||{};

    const fields=isFib
      ?[['age','Edad','años'],['ast','AST','U/L'],
        ['alt','ALT','U/L'],['platelets','Plaquetas','×10⁹/L']]
      :isR
        ?[['alt','ALT','U/L'],['altLimit','Límite superior ALT','U/L'],
          ['alp','Fosfatasa alcalina','U/L'],
          ['alpLimit','Límite superior FA','U/L']]
        :[['bilirubin','Bilirrubina total','mg/dL'],
          ['inr','INR',''],
          ['creatinine','Creatinina','mg/dL'],
          ['sodium','Sodio sérico','mEq/L'],
          ...(isMeld3?[['albumin','Albúmina','g/dL']]:[])];

    const result=c.calculations[tool];

    const formula=isFib
      ?'FIB-4 = (edad × AST) / (plaquetas × √ALT)'
      :isR
        ?'R = (ALT / LSN ALT) / (FA / LSN FA)'
        :isMeldNa
          ?'MELD-Na = MELD(i) + 1,32(137−Na) − 0,033 × MELD(i)(137−Na), si MELD(i) > 11'
          :'MELD 3.0 = 1,33 × mujer + 4,56 ln(BT) + 0,82(137−Na) − 0,24(137−Na) ln(BT) + 9,09 ln(INR) + 11,14 ln(Cr) + 1,85(3,5−Alb) − 1,83(3,5−Alb) ln(Cr) + 6';

    const dialysis=isMeldNa||isMeld3?`
      <label class="clinical-field">
        ¿Diálisis en los últimos 7 días?
        <select data-calculation-input="dialysis">
          <option value="no" ${values.dialysis==='yes'?'':'selected'}>No</option>
          <option value="yes" ${values.dialysis==='yes'?'selected':''}>
            Sí: ≥ 2 sesiones o ≥ 24 h de CVVHD
          </option>
        </select>
        <small>Creatinina utilizada si cumple el criterio:
          ${isMeld3?'3,0':'4,0'} mg/dL.
        </small>
      </label>`:'';

    const sexNote=isMeld3?`
      <p class="clinical-note">
        Sexo registrado: <b>${escapeClinical(this.caseData.patient.sex)}</b>.
        MELD 3.0 incorpora este dato automáticamente
        en el cálculo para adultos.
      </p>`:'';

    const note=isMeldNa
      ?'<p class="clinical-note">MELD-Na clásico (OPTN/UNOS 2016). Creatinina 1–4 mg/dL; sodio 125–137 mEq/L para el cálculo. Puntuación de 6 a 40.</p>'
      :isMeld3
        ?'<p class="clinical-note">MELD 3.0 para adultos (OPTN 2023). Bilirrubina, INR y creatinina: mínimo 1,0; creatinina máximo 3,0; sodio entre 125 y 137; albúmina entre 1,5 y 3,5. Puntuación de 6 a 40. Interpretar según el contexto clínico.</p>'
        :'';

    return clinicalPage(
      `<p class="panel-copy">
        Elige una herramienta e interpreta el resultado
        según el contexto clínico.
      </p>
      <div class="study-tabs">
        <button data-tool="fib4" class="${isFib?'active':''}">FIB-4</button>
        <button data-tool="r" class="${isR?'active':''}">Cociente R</button>
        <button data-tool="meldNa" class="${isMeldNa?'active':''}">MELD-Na</button>
        <button data-tool="meld3" class="${isMeld3?'active':''}">MELD 3.0</button>

<button data-tool="childPugh">Child-Pugh</button>

      </div>
      <div class="calculator-fields">
        ${fields.map(([id,label,unit])=>`
          <label class="clinical-field">
            ${label}
            <input type="number" min="0" step="any"
              data-calculation-input="${id}"
              value="${escapeClinical(values[id]??'')}">
            <small>${unit}</small>
          </label>
        `).join('')}
      </div>
      ${dialysis}
      ${sexNote}
      <div class="formula">${formula}</div>
      ${note}
      ${Number.isFinite(result)?`
        <div class="calculation-output hp-calculator-lcd" role="region" aria-label="Resultado de la calculadora">
          <div class="hp-lcd-screen">
            <div class="hp-lcd-top">
              <span class="hp-lcd-ind">● CALC</span>
              <span class="hp-lcd-scale">${isFib?'FIB-4':isR?'COCIENTE R':isMeldNa?'MELD-Na (OPTN)':'MELD 3.0'}</span>
            </div>
            <div class="hp-lcd-main">
              <span class="hp-lcd-val"><strong>${isMeldNa||isMeld3?result:result.toFixed(2).replace('.',',')}</strong></span>
              <span class="hp-lcd-unit">${isFib?'PUNTOS':isR?'COCIENTE':'SCORE'}</span>
            </div>
            ${(()=>{
              const interp=getClinicalInterpretation(tool,result,this.caseData?.patient?.age);
              if(!interp)return '';
              return `<div class="hp-lcd-interp" data-tier="${interp.tag}">
                <strong>${interp.label}</strong>
                <small>${interp.detail}</small>
              </div>`;
            })()}
            <div class="hp-lcd-status">
              <span class="hp-lcd-registered">✓ ASENTADO EN LA FICHA DEL PACIENTE</span>
            </div>
          </div>
        </div>`:''}`,
      `<button class="secondary-button" data-tab="results">Volver a los resultados</button>
       <button class="primary-button" data-action="calculate-tool" ${c.outcome?'disabled':''}>Calcular</button>`,
      'tools-content'
    );
  }


  notebookDecisionBridgeMarkup(caseData,c){
    const Investigation=window.ClinicalInvestigation||window.HepatoDay1Modules['clinical-investigation.mjs'];
    if(!Investigation?.evaluateCaseNotebook)return '';
    const nb=this.state.campaign?.notebooks?.[caseData.id]||c?.notebook||{};
    const ev=Investigation.evaluateCaseNotebook(caseData,c,nb);
    if(!ev)return '';
    const main=ev.mainSuspicion;
    const currentDiag=c?.decisions?.diagnosis||'';
    const isApplied=Boolean(main&&currentDiag===main.mappedDiagnosisId);
    return `
      <aside class="hp-nb-decision-bridge" role="region" aria-label="Resumen de tu cuaderno de investigación">
        <div class="hp-nb-bridge-head">
          <div>
            <span class="hp-nb-bridge-kicker">📓 TU CUADERNO DE INVESTIGACIÓN</span>
            <h4>Evidencias y deducciones registradas</h4>
          </div>
          <button type="button" class="secondary-button hp-nb-bridge-open-btn" data-action="open-notebook">
            📖 Revisar libreta
          </button>
        </div>
        <div class="hp-nb-bridge-metrics">
          <span><b>${ev.discoveredCount}/${ev.totalClues}</b> pistas descubiertas</span>
          <span><b>${ev.pinnedCount}</b> destacadas (★)</span>
          <span><b>${ev.totalRelationsFormulated}</b> relaciones formuladas</span>
          <span><b>${ev.discardedSuspicions.length}</b> sospechas descartadas</span>
        </div>
        ${main?`
          <div class="hp-nb-bridge-main-susp ${isApplied?'is-applied':''}">
            <div class="hp-nb-bridge-susp-copy">
              <span class="hp-nb-bridge-badge">★ SOSPECHA PRIORITARIA EN TU LIBRETA</span>
              <strong>${escapeClinical(main.title)}</strong>
              <small>${main.prosCount} ${main.prosCount===1?'evidencia':'evidencias'} a favor · ${main.consCount} en contra</small>
            </div>
            ${isApplied?`
              <span class="hp-nb-bridge-applied-pill">✓ Aplicada como diagnóstico</span>
            `:`
              <button type="button" class="primary-button hp-nb-bridge-apply-btn" data-apply-nb-diagnosis="${escapeClinical(main.mappedDiagnosisId)}">
                Usar como mi diagnóstico →
              </button>
            `}
          </div>
        `:`
          <p class="hp-nb-bridge-empty">
            Aún no marcaste una <b>★ Sospecha prioritaria</b> en la pestaña <i>Sospechas</i> de tu libreta. Puedes abrir la libreta para vincular tus pistas o elegir directamente el diagnóstico abajo.
          </p>
        `}
      </aside>
    `;
  }
  notebookDebriefMarkup(caseData,c){
    const Investigation=window.ClinicalInvestigation||window.HepatoDay1Modules['clinical-investigation.mjs'];
    if(!Investigation?.evaluateCaseNotebook)return '';
    const nb=this.state.campaign?.notebooks?.[caseData.id]||c?.notebook||{};
    const ev=Investigation.evaluateCaseNotebook(caseData,c,nb);
    if(!ev)return '';
    const main=ev.mainSuspicion;
    const hasWork=Boolean(main||ev.totalRelationsFormulated>0||ev.pinnedCount>0||ev.discardedSuspicions.length>0);
    const tier=ev.mainMatchesExpected&&ev.validRelations.length>=2&&ev.flawedRelations.length===0
      ?'excellent'
      :(ev.mainMatchesExpected||ev.validRelations.length>=1)
        ?'good'
        :hasWork
          ?'review'
          :'empty';
    const badgeLabel=tier==='excellent'
      ?'★ Investigación clínica sobresaliente'
      :tier==='good'
        ?'✓ Investigación bien encaminada'
        :tier==='review'
          ?'↻ Deducciones de libreta para ajustar'
          :'○ Libreta utilizada solo como consulta';
    return `
      <section class="reasoning-record hp-nb-debrief-card is-${tier}" aria-label="Evaluación de tu libreta de investigación">
        <div class="hp-nb-debrief-head">
          <div>
            <span class="eyebrow">CUADERNO DE INVESTIGACIÓN · REVISIÓN DOCENTE</span>
            <h3>${badgeLabel}</h3>
          </div>
          <span class="hp-nb-debrief-pill">${ev.discoveredCount}/${ev.totalClues} pistas · ${ev.validRelations.length}/${ev.totalRelationsFormulated} relaciones acertadas</span>
        </div>
        <div class="hp-nb-debrief-body">
          ${main?`
            <p>
              <b>Hipótesis prioritaria en libreta:</b> Marcaste <strong>«${escapeClinical(main.title)}»</strong> con <b>${main.prosCount}</b> ${main.prosCount===1?'evidencia':'evidencias'} a favor.
              ${ev.mainMatchesExpected
                ?'✓ Coincide con el diagnóstico real del caso y respalda tu conclusión.'
                :'↻ No coincide con el diagnóstico final del escenario; revisa las evidencias que contradecían esta sospecha.'}
            </p>
          `:`
            <p><b>Hipótesis prioritaria en libreta:</b> No dejaste marcada una sospecha prioritaria (★) en la pestaña <i>Sospechas</i> antes de cerrar la consulta.</p>
          `}
          ${ev.validRelations.length?`
            <div class="hp-nb-debrief-list is-valid">
              <b>✓ Deducciones clínicas acertadas en tu libreta (${ev.validRelations.length}):</b>
              <ul>
                ${ev.validRelations.map(r=>`<li><strong>${escapeClinical(r.relationTitle)}:</strong> ${escapeClinical(r.chosenTitle)}.</li>`).join('')}
              </ul>
            </div>
          `:''}
          ${ev.flawedRelations.length?`
            <div class="hp-nb-debrief-list is-flawed">
              <b>↻ Relaciones a corregir en tu libreta (${ev.flawedRelations.length}):</b>
              <ul>
                ${ev.flawedRelations.map(r=>`<li><strong>${escapeClinical(r.relationTitle)}:</strong> elegiste <i>«${escapeClinical(r.chosenTitle)}»</i>. <b>Lectura correcta:</b> ${escapeClinical(r.expectedTitle)} (${escapeClinical(r.expectedDetail)}).</li>`).join('')}
              </ul>
            </div>
          `:''}
        </div>
      </section>
    `;
  }
  martinDecisionBody(){
    const c=this.clinical,d=c.decisions,step=this.decisionStep;
    if(c.outcome)return this.debriefBody(this.caseData,c);
    if(!readyForDecisions(c))return this.locked('Conversa, examina y revisa tus resultados antes de decidir.','results','Ver resultados');
    // Orden fijo por decisión; el crédito sigue asociado al identificador.
    const displayOrder={'martin-fibrosis-choice':[2,0,3,1],'plan-choice':[1,2,0,3],'followup-choice':[2,0,1,3]};
    const buttons=(items,attr,selected)=>`<div class="quick-choice-grid decision-cards">${(displayOrder[attr]?displayOrder[attr].map(i=>items[i]):items).map(item=>`<button type="button" class="quick-choice ${selected===item.id?'selected':''}" data-${attr}="${escapeClinical(item.id)}" aria-pressed="${selected===item.id}"><span class="choice-mark" aria-hidden="true">${selected===item.id?'◆':'◇'}</span><span><b>${escapeClinical(item.title)}</b>${item.detail?`<small>${escapeClinical(item.detail)}</small>`:''}</span></button>`).join('')}</div>`;
    const dataReady=c.reviewed.length>0;
    let body='',valid=false;
    
    if(step===0){
      const fibVal=c.calculations?.fib4;
      const fibInterp=Number.isFinite(fibVal)?getClinicalInterpretation('fib4',fibVal,this.caseData?.patient?.age):null;
      const calcReminder=fibInterp?`
        <aside class="hp-decision-calc-reminder" role="note" aria-label="Escalas registradas">
          <span class="hp-reminder-icon" aria-hidden="true">📊</span>
          <div class="hp-reminder-copy">
            <strong>FIB-4 registrado en la consulta: ${fibVal.toFixed(2).replace('.',',')}</strong>
            <span>${escapeClinical(fibInterp.label)}. ${escapeClinical(fibInterp.detail)}</span>
          </div>
        </aside>
      `:'';
      const nbBridge=this.notebookDecisionBridgeMarkup(this.caseData,c);
      body=`
        ${calcReminder}
        ${nbBridge}
        <h3 class="study-title">¿Qué diagnóstico eliges?</h3>
        <p class="panel-copy">
          Selecciona tu diagnóstico. La respuesta se registrará
          sin mostrar si es correcta.
        </p>

        <div class="hp-diagnosis-picker">
          <label for="hp-diagnosis-search">
            Buscar diagnóstico
          </label>

          <input
            id="hp-diagnosis-search"
            class="hp-diagnosis-search"
            type="search"
            placeholder="Escribe el nombre del diagnóstico…"
            autocomplete="off"
          >

          <div class="hp-diagnosis-options"
               role="group"
               aria-label="Opciones diagnósticas">
            ${DIAGNOSIS_CATALOG.map(x=>`
              <button
                type="button"
                class="hp-diagnosis-option ${d.diagnosis===x.id?'selected':''}"
                data-diagnosis-choice="${escapeClinical(x.id)}"
                aria-pressed="${d.diagnosis===x.id}"
              >
                <span class="hp-diagnosis-mark" aria-hidden="true">
                  ${d.diagnosis===x.id?'✓':'◇'}
                </span>
                <span>${escapeClinical(x.title)}</span>
              </button>
            `).join('')}
          </div>

          <p class="hp-diagnosis-empty" hidden>
            No se encontraron diagnósticos.
          </p>

          <select data-field="diagnosis"
                  hidden
                  tabindex="-1"
                  aria-hidden="true">
            <option value="">Elige tu conclusión…</option>
            ${DIAGNOSIS_CATALOG.map(x=>`
              <option value="${escapeClinical(x.id)}"
                ${d.diagnosis===x.id?'selected':''}>
                ${escapeClinical(x.title)}
              </option>
            `).join('')}
          </select>
        </div>`;
      valid=!!d.diagnosis;

    }else if(step===1){
      body=`<h3 class="study-title">Razonamiento bajo incertidumbre · SCT</h3><p class="panel-copy"><b>Hipótesis:</b> Martín podría presentar fibrosis hepática avanzada.</p>${dataReady?'<p class="panel-copy"><b>Dato nuevo:</b> FIB-4 de 1,02 en un paciente de 46 años.</p><p class="panel-copy">¿Cómo modifica este hallazgo la probabilidad de fibrosis avanzada?</p>':'<p class="clinical-note">Para responder, primero revisa el perfil hepático y el hemograma; no se mostrarán resultados que aún no hayas solicitado.</p>'}${dataReady?buttons(Martin.sct,'sct-choice',d.sctChoice):''}<p class="result-disclaimer">Esta pregunta es formativa. La explicación y la interpretación esperada aparecerán al finalizar toda la consulta.</p>`;
      valid=dataReady&&!!Martin.lookup(Martin.sct,d.sctChoice);
    }else if(step===2){
      body=`<h3 class="study-title">KFT 1 · Evaluación de fibrosis</h3><p class="panel-copy">Martín tiene esteatosis, diabetes tipo 2, aminotransferasas levemente elevadas desde hace ocho semanas y FIB-4 de 1,02. No hay signos de enfermedad hepática avanzada.</p><p class="panel-copy"><b>¿Qué estrategia es la más adecuada para estratificar su fibrosis?</b></p>${buttons(Martin.fibrosis,'martin-fibrosis-choice',d.kftFibrosisChoice)}`;
      valid=!!Martin.lookup(Martin.fibrosis,d.kftFibrosisChoice);
    }else if(step===3){
      body=`<h3 class="study-title">KFT 2 · Tratamiento</h3><p class="panel-copy">Martín tiene IMC 31,2, diabetes tipo 2, HbA1c 7,2 %, triglicéridos 215 mg/dL y toma metformina y atorvastatina. Trabaja como conductor y le cuesta organizar sus comidas.</p><p class="panel-copy"><b>¿Cuál es tu estrategia terapéutica inicial?</b></p>${buttons(Martin.plans,'plan-choice',d.planChoice)}`;
      valid=!!Martin.lookup(Martin.plans,d.planChoice);
    }else{
      body=`<h3 class="study-title">¿Cómo organizarías el seguimiento?</h3><p class="panel-copy">El paciente acepta iniciar cambios en sus hábitos. No presenta signos de enfermedad avanzada.</p>${buttons(Martin.followups,'followup-choice',d.followupChoice)}`;
      valid=!!Martin.lookup(Martin.followups,d.followupChoice);
    }
    const missing=Martin.missing(c,step);
    if(step>0&&missing.length){
      body=`<h3 class="study-title">Información insuficiente</h3><p class="clinical-note">Faltan resultados por solicitar o revisar: ${missing.map(id=>escapeClinical(STUDY_CATALOG.find(x=>x.id===id)?.title||id)).join(', ')}.</p><p class="panel-copy">Al continuar, esta pregunta se registrará como incorrecta. Puedes repasar los resultados disponibles antes de hacerlo.</p>`;
      valid=true;
    }
    const back='<button class="secondary-button" data-tab="results">Repasar resultados</button>';
    const next=['Continuar con SCT →','Decisión sobre fibrosis →','Elegir tratamiento →','Elegir seguimiento →','Terminar consulta →'][step];
    return clinicalPage(`<p class="decision-progress">RESUELVE LA CONSULTA · ${step+1} / 5</p>${body}<p class="result-disclaimer">Al continuar se registra tu elección y no podrás cambiarla. La explicación se mostrará al finalizar.</p>`,`${back}<button class="primary-button" data-action="next-decision" ${!valid?'disabled':''}>${next}</button>`,'decision-content');
  }
  decisionBody(){
    const c=this.clinical,d=c.decisions;
    if(Hector.isHector(this.caseData)){
      if(c.outcome)return this.debriefBody(this.caseData,c);
      if(!readyForDecisions(c))return this.locked('Conversa, examina y revisa tus resultados antes de decidir.','results','Ver resultados');
      this.decisionStep=Hector.nextStep(d);
      return Hector.render(c,this.decisionStep,DIAGNOSIS_CATALOG,escapeClinical,clinicalPage);
    }
    if(Valeria.isValeria(this.caseData)){
      if(c.outcome)return this.debriefBody(this.caseData,c);
      if(!readyForDecisions(c))return this.locked('Conversa, examina y revisa tus resultados antes de decidir.','results','Ver resultados');
      this.decisionStep=Valeria.nextStep(d);
      return Valeria.render(c,this.decisionStep,DIAGNOSIS_CATALOG,escapeClinical,clinicalPage);
    }
    if(Ernesto.isErnesto(this.caseData)){
      if(c.outcome)return this.debriefBody(this.caseData,c);
      if(!readyForDecisions(c))return this.locked('Conversa, examina y revisa tus resultados antes de decidir.','results','Ver resultados');
      this.decisionStep=Ernesto.nextStep(d);
      return Ernesto.render(c,this.decisionStep,DIAGNOSIS_CATALOG,escapeClinical,clinicalPage);
    }
    if(Lucia.isLucia(this.caseData)){
      if(c.outcome)return this.debriefBody(this.caseData,c);
      if(!readyForDecisions(c))return this.locked('Conversa, examina y revisa tus resultados antes de decidir.','results','Ver resultados');
      this.decisionStep=Lucia.nextStep(d);
      return Lucia.render(c,this.decisionStep,DIAGNOSIS_CATALOG,escapeClinical,clinicalPage);
    }
    if(Andres.isAndres(this.caseData)){
      if(c.outcome)return this.debriefBody(this.caseData,c);
      if(!readyForDecisions(c))return this.locked('Conversa, examina y revisa tus resultados antes de decidir.','results','Ver resultados');
      this.decisionStep=Andres.nextStep(d);
      return Andres.render(c,this.decisionStep,DIAGNOSIS_CATALOG,escapeClinical,clinicalPage);
    }
    if(Rosa.isRosa(this.caseData)){
      if(c.outcome)return this.debriefBody(this.caseData,c);
      if(!readyForDecisions(c))return this.locked('Conversa, examina y revisa tus resultados antes de decidir.','results','Ver resultados');
      this.decisionStep=Rosa.nextStep(d);
      return Rosa.render(c,this.decisionStep,DIAGNOSIS_CATALOG,escapeClinical,clinicalPage);
    }
    if(Diego.isDiego(this.caseData)){
      if(c.outcome)return this.debriefBody(this.caseData,c);
      if(!readyForDecisions(c))return this.locked('Conversa, examina y revisa tus resultados antes de decidir.','results','Ver resultados');
      this.decisionStep=Diego.nextStep(d);
      return Diego.render(c,this.decisionStep,DIAGNOSIS_CATALOG,escapeClinical,clinicalPage);
    }
    if(Elena.isElena(this.caseData)){
      if(c.outcome)return this.debriefBody(this.caseData,c);
      if(!readyForDecisions(c))return this.locked('Conversa, examina y revisa tus resultados antes de decidir.','results','Ver resultados');
      this.decisionStep=Elena.nextStep(d);
      return Elena.render(c,this.decisionStep,DIAGNOSIS_CATALOG,escapeClinical,clinicalPage);
    }
    if(Sofia.isSofia(this.caseData)){
      if(c.outcome)return this.debriefBody(this.caseData,c);
      if(!readyForDecisions(c))return this.locked('Conversa, examina y revisa tus resultados antes de decidir.','results','Ver resultados');
      this.decisionStep=Sofia.nextStep(d);
      const rendered=Sofia.render(c,this.decisionStep,DIAGNOSIS_CATALOG,escapeClinical,clinicalPage);
      return this.decisionStep===0?rendered.replace('<h3 class="study-title">',`${this.notebookDecisionBridgeMarkup(this.caseData,c)}<h3 class="study-title">`):rendered;
    }
    if(Martin.isMartin(this.caseData))return this.martinDecisionBody();
    if(c.outcome)return this.debriefBody(this.caseData,c);
    if(!readyForDecisions(c))return this.locked('Conversa, examina y revisa tus resultados antes de decidir.','results','Ver resultados');
    const step=this.decisionStep;
    let body='';
    if(step===0)body=`<h3 class="study-title">¿Qué diagnóstico eliges?</h3><p class="panel-copy">Puedes volver a los estudios cuando quieras.</p><label class="clinical-field">Tu diagnóstico<select data-field="diagnosis"><option value="">Elige tu conclusión…</option>${DIAGNOSIS_CATALOG.map(x=>`<option value="${x.id}" ${d.diagnosis===x.id?'selected':''}>${x.title}</option>`).join('')}</select></label>`;
    else{
      const kind=step===1?'interpretation':step===2?'plan':'followup';
      const choices=(step===1?interpretationChoicesFor:step===2?planChoicesFor:followupChoicesFor)(d.diagnosis,c.choiceSeed),selected=d[`${kind}Choice`];
      body=`<h3 class="study-title">${step===1?'¿Qué significan los datos?':step===2?'¿Qué haces hoy?':'¿Cuándo vuelves a verlo?'}</h3><p class="panel-copy">${step===1?'Integra lo que revisaste. Elige una lectura clínica.':'Elige una opción.'}</p><div class="quick-choice-grid decision-cards">${choices.map(x=>`<button class="quick-choice ${selected===x.id?'selected':''}" data-${kind}-choice="${x.id}" aria-pressed="${selected===x.id}"><span class="choice-mark" aria-hidden="true">${selected===x.id?'◆':'◇'}</span><span><b>${x.title}</b><small>${x.detail}</small></span></button>`).join('')}</div>${step>1&&!selected&&(step===2?d.plan.length:d.followup.length)?'<p class="result-disclaimer">Se conserva la elección de tu partida anterior. Puedes cambiarla con una tarjeta.</p>':''}`;
    }
    const canNext=step===0?!!d.diagnosis:step===1?!!d.interpretationChoice:step===2?d.plan.length>0:decisionsComplete(c);
    return clinicalPage(`<p class="decision-progress">RESUELVE LA CONSULTA · ${step+1} / 4</p>${body}`,`${step>0?'<button class="secondary-button" data-action="previous-decision">← Anterior</button>':'<button class="secondary-button" data-tab="results">Repasar resultados</button>'}<button class="primary-button" data-action="next-decision" ${!canNext?'disabled':''}>${step===0?'Interpretar datos →':step===1?'Elegir conducta →':step===2?'Elegir seguimiento →':'Terminar consulta →'}</button>`,'decision-content');
  }
  teachingBody(caseData,c){
    const t=teachingFeedbackFor(caseData,c);
    if(!t)return '';
    const article=(title,copy)=>`<article class="feedback-row good"><b>${escapeClinical(title)}</b><p>${escapeClinical(copy)}</p></article>`;
    if(!c.decisions.autoFailedByDiagnosis){
      if(Hector.isHector(caseData)&&Number.isInteger(c.decisions.hectorStep)&&c.decisions.kftStudiesChoice){
        const f=Hector.feedback(c.decisions);
        t.interpretationFeedback=f[1].text;t.planFeedback=f[2].text;t.followFeedback=f[3].text;
      }
      if(Valeria.isValeria(caseData)&&Number.isInteger(c.decisions.valeriaStep)&&c.decisions.kftStudiesChoice){
        const f=Valeria.feedback(c.decisions);
        t.interpretationFeedback=f[1].text;t.planFeedback=f[2].text;t.followFeedback=f[3].text;
      }
      if(Ernesto.isErnesto(caseData)&&Number.isInteger(c.decisions.ernestoStep)&&c.decisions.kftStudiesChoice){
        const f=Ernesto.feedback(c.decisions);
        t.interpretationFeedback=f[1].text;t.planFeedback=f[2].text;t.followFeedback=f[3].text;
      }
      if(Lucia.isLucia(caseData)&&Number.isInteger(c.decisions.luciaStep)&&c.decisions.kftStudiesChoice){
        const f=Lucia.feedback(c.decisions);
        t.interpretationFeedback=f[1].text;t.planFeedback=f[2].text;t.followFeedback=f[3].text;
      }
      if(Andres.isAndres(caseData)&&Number.isInteger(c.decisions.andresStep)&&c.decisions.kftStudiesChoice){
        const f=Andres.feedback(c.decisions);
        t.interpretationFeedback=f[1].text;t.planFeedback=f[2].text;t.followFeedback=f[3].text;
      }
      if(Rosa.isRosa(caseData)&&Number.isInteger(c.decisions.rosaStep)&&c.decisions.kftStudiesChoice){
        const f=Rosa.feedback(c.decisions);
        t.interpretationFeedback=f[1].text;t.planFeedback=f[2].text;t.followFeedback=f[3].text;
      }
      if(Diego.isDiego(caseData)&&Number.isInteger(c.decisions.diegoStep)&&c.decisions.kftStudiesChoice){
        const f=Diego.feedback(c.decisions);
        t.interpretationFeedback=f[1].text;t.planFeedback=f[2].text;t.followFeedback=f[3].text;
      }
      if(Elena.isElena(caseData)&&Number.isInteger(c.decisions.elenaStep)&&c.decisions.kftStudiesChoice){
        const f=Elena.feedback(c.decisions);
        t.interpretationFeedback=f[1].text;t.planFeedback=f[2].text;t.followFeedback=f[3].text;
      }
      if(Sofia.isSofia(caseData)&&Number.isInteger(c.decisions.sofiaStep)&&c.decisions.kftStudiesChoice){
        const f=Sofia.feedback(c.decisions);
        t.interpretationFeedback=f[1].text;t.planFeedback=f[2].text;t.followFeedback=f[3].text;
      }
    }
    const autoFailedNote=c.decisions.autoFailedByDiagnosis?article('Calificación automática de preguntas','Al seleccionar un diagnóstico principal incorrecto, las preguntas siguientes (SCT, KFT 1, KFT 2 y Seguimiento) se calificaron automáticamente como incorrectas (0 puntos).'):'';
    const hector=!c.decisions.autoFailedByDiagnosis&&Hector.isHector(caseData)&&Number.isInteger(c.decisions.hectorStep)?Hector.feedback(c.decisions).slice(0,1).map(item=>article(item.title,item.text)).join(''):'';
    const valeria=!c.decisions.autoFailedByDiagnosis&&Valeria.isValeria(caseData)&&Number.isInteger(c.decisions.valeriaStep)?Valeria.feedback(c.decisions).slice(0,1).map(item=>article(item.title,item.text)).join(''):'';
    const ernesto=!c.decisions.autoFailedByDiagnosis&&Ernesto.isErnesto(caseData)&&Number.isInteger(c.decisions.ernestoStep)?Ernesto.feedback(c.decisions).slice(0,1).map(item=>article(item.title,item.text)).join(''):'';
    const lucia=!c.decisions.autoFailedByDiagnosis&&Lucia.isLucia(caseData)&&Number.isInteger(c.decisions.luciaStep)?Lucia.feedback(c.decisions).slice(0,1).map(item=>article(item.title,item.text)).join(''):'';
    const andres=!c.decisions.autoFailedByDiagnosis&&Andres.isAndres(caseData)&&Number.isInteger(c.decisions.andresStep)?Andres.feedback(c.decisions).slice(0,1).map(item=>article(item.title,item.text)).join(''):'';
    const rosa=!c.decisions.autoFailedByDiagnosis&&Rosa.isRosa(caseData)&&Number.isInteger(c.decisions.rosaStep)?Rosa.feedback(c.decisions).slice(0,1).map(item=>article(item.title,item.text)).join(''):'';
    const diego=!c.decisions.autoFailedByDiagnosis&&Diego.isDiego(caseData)&&Number.isInteger(c.decisions.diegoStep)?Diego.feedback(c.decisions).slice(0,1).map(item=>article(item.title,item.text)).join(''):'';
    const elena=!c.decisions.autoFailedByDiagnosis&&Elena.isElena(caseData)&&Number.isInteger(c.decisions.elenaStep)?Elena.feedback(c.decisions).slice(0,1).map(item=>article(item.title,item.text)).join(''):'';
    const sofia=!c.decisions.autoFailedByDiagnosis&&Sofia.isSofia(caseData)&&Number.isInteger(c.decisions.sofiaStep)?Sofia.feedback(c.decisions).slice(0,1).map(item=>article(item.title,item.text)).join(''):'';
    const martin=!c.decisions.autoFailedByDiagnosis&&Martin.isMartin(caseData)&&c.decisions.sctChoice?Martin.feedback(c.decisions).slice(0,1).map(item=>article(item.title,item.text)).join(''):'';
    
    const grupo=(titulo,subtitulo,contenido,abierto=false)=>`
      <details class="reasoning-record hp-docente-grupo"
        ${abierto?'open':''}>
        <summary>
          ${escapeClinical(titulo)}
          <small>· ${escapeClinical(subtitulo)}</small>
        </summary>
        <div class="hp-docente-contenido">
          ${contenido}
        </div>
      </details>`;

    const evaluacion=[
      autoFailedNote,
      hector,valeria,ernesto,lucia,andres,
      rosa,diego,elena,sofia,martin,
      article('3. Tu diagnóstico',t.diagnosticFeedback),
      article('5. ¿Fueron pertinentes los estudios?',t.studiesFeedback)
    ].join('');

    const fundamentos=[
      article('1. Hallazgos que sostienen la hipótesis',t.evidence),
      article('2. ¿Por qué este diagnóstico y no sus diferenciales?',t.differential),
      article('4. Interpretación de los resultados: ¿qué significa?',t.interpretationFeedback)
    ].join('');

    const tratamiento=[
      article('6. Conducta elegida: por qué sí o por qué no',t.planFeedback),
      article('7. Seguimiento elegido: qué vigilar y cuándo',t.followFeedback),
      t.safetyFeedback&&c.outcome.critical.length
        ?article('8. Seguridad clínica: errores de riesgo',t.safetyFeedback)
        :'',
      t.pivot
        ?article('¿Qué hallazgo cambiaría tu plan?',t.pivot)
        :''
    ].join('');

    const aprendizajes=article(
      'Idea clínica para recordar',
      t.key
    );

    return `
      <section class="hp-teaching-feedback"
        aria-label="Devolución docente del caso">

        <h3>Razonamiento clínico explicado</h3>

        <p class="panel-copy">
          Esta devolución aparece únicamente después de cerrar
          la consulta y compara tu manejo con la evidencia
          de este paciente.
        </p>

        ${grupo(
          '01 · Evaluación de tus decisiones',
          'SCT, KFT y decisiones registradas',
          evaluacion,
          true
        )}

        ${grupo(
          '02 · Fundamento del diagnóstico',
          'Hallazgos, diferenciales e interpretación',
          fundamentos
        )}

        ${grupo(
          '03 · Tratamiento y seguimiento',
          'Conducta, seguridad y próximos controles',
          tratamiento
        )}

        ${grupo(
          '04 · Aprendizajes del caso',
          'Idea clínica para recordar',
          aprendizajes
        )}

      </section>`;

  }
  debriefBody(caseData,c,archived=false){
    const o=c.outcome,d=c.decisions;
    const isHector=Hector.isHector(caseData)&&Number.isInteger(d.hectorStep);
    const isValeria=Valeria.isValeria(caseData)&&Number.isInteger(d.valeriaStep);
    const isErnesto=Ernesto.isErnesto(caseData)&&Number.isInteger(d.ernestoStep);
    const isLucia=Lucia.isLucia(caseData)&&Number.isInteger(d.luciaStep);
    const isAndres=Andres.isAndres(caseData)&&Number.isInteger(d.andresStep);
    const isRosa=Rosa.isRosa(caseData)&&Number.isInteger(d.rosaStep);
    const isDiego=Diego.isDiego(caseData)&&Number.isInteger(d.diegoStep);
    const isElena=Elena.isElena(caseData)&&Number.isInteger(d.elenaStep);
    const isSofia=Sofia.isSofia(caseData)&&Number.isInteger(d.sofiaStep);
    const isPilot=isHector||isValeria||isErnesto||isLucia||isAndres||isRosa||isDiego||isElena||isSofia||Martin.isMartin(caseData)&&Boolean(d.sctChoice);
    const Pilot=isHector?{...Hector,fibrosis:Hector.studies}:isValeria?{...Valeria,fibrosis:Valeria.studies}:isErnesto?{...Ernesto,fibrosis:Ernesto.studies}:isLucia?{...Lucia,fibrosis:Lucia.studies}:isAndres?{...Andres,fibrosis:Andres.studies}:isRosa?{...Rosa,fibrosis:Rosa.studies}:isDiego?{...Diego,fibrosis:Diego.studies}:isElena?{...Elena,fibrosis:Elena.studies}:isSofia?{...Sofia,fibrosis:Sofia.studies}:Martin;
    const plan=isPilot?Pilot.lookup(Pilot.plans,d.planChoice):planChoicesFor(d.diagnosis).find(x=>x.id===d.planChoice),follow=isPilot?Pilot.lookup(Pilot.followups,d.followupChoice):followupChoicesFor(d.diagnosis).find(x=>x.id===d.followupChoice),interpretation=isPilot?Pilot.lookup(Pilot.fibrosis,(isHector||isValeria||isErnesto||isLucia||isAndres||isRosa||isDiego||isElena||isSofia)?d.kftStudiesChoice:d.kftFibrosisChoice):interpretationChoicesFor(d.diagnosis).find(x=>x.id===d.interpretationChoice);
    const dayTotal=getPatientsForDay(this.state.campaign.day||1).length;
return clinicalPage(`<div class="outcome-hero"><div class="outcome-score">${clinicalNumber(o.score)}/10</div><div><h3>${o.title}</h3><p>${o.summary}</p></div></div>${Economy?.receiptMarkup(this.state.campaign.finance,caseData.id)||''}${returnVisitOfferMarkup(c,caseData,archived)}<div class="diagnosis-reveal"><small>DIAGNÓSTICO DEL ESCENARIO</small><h3>${o.expectedDiagnosis}</h3><p><b>Elegiste:</b> ${clinicalLabel(d.diagnosis,DIAGNOSIS_CATALOG)}</p></div><div class="score-chips">${o.parts.map(p=>`<span class="score-chip ${p.score===p.max&&!p.missing.length?'good':''}">${p.score===p.max&&!p.missing.length?'✓':'↻'} ${p.title}<b>${p.max===0?`${clinicalNumber(p.score)} pts`:`${clinicalNumber(p.score)}/${p.max}`}</b></span>`).join('')}</div>${o.critical.length?`<div class="critical-feedback"><b>Hay que ajustar esta decisión</b>${o.critical.map(x=>`<p>${escapeClinical(x)}</p>`).join('')}</div>`:''}${this.notebookDebriefMarkup(caseData,c)}${this.teachingBody(caseData,c)}${this.challengeBody(caseData,c,archived)}<details class="reasoning-record debrief-details" open><summary>¿Por qué? Ver la explicación del caso</summary>${o.parts.map(p=>`<article class="feedback-row ${p.score===p.max&&!p.missing.length?'good':'bad'}"><b>${p.title}</b><p>${p.explanation}</p>${p.missing.length?`<p><strong>Para repasar:</strong> ${p.missing.map(escapeClinical).join('; ')}.</p>`:''}${p.unnecessary?.length?`<p><strong>Pedidos de bajo valor:</strong> ${p.unnecessary.map(escapeClinical).join('; ')}.</p>`:''}${p.notes?.map(x=>`<p>${x}</p>`).join('')||''}</article>`).join('')}<div class="source-links">${caseData.sources.map(s=>`<a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.label} ↗</a>`).join('')}</div></details><details class="reasoning-record played-record"><summary>Tus elecciones y estudios</summary><p><b>Interpretación:</b> ${d.autoFailedByDiagnosis?'Calificada como incorrecta (0 pts) por diagnóstico erróneo':interpretation?escapeClinical(interpretation.title):'No registrada en la versión anterior'}</p><p><b>Conducta:</b> ${d.autoFailedByDiagnosis?'Calificada como incorrecta (0 pts) por diagnóstico erróneo':plan?`${escapeClinical(plan.title)} · ${escapeClinical(plan.detail)}`:d.plan.map(id=>clinicalLabel(id,PLAN_CATALOG)).join('; ')}</p><p><b>Seguimiento:</b> ${d.autoFailedByDiagnosis?'Calificado como incorrecto (0 pts) por diagnóstico erróneo':follow?`${escapeClinical(follow.title)} · ${escapeClinical(follow.detail)}`:d.followup.map(id=>`${clinicalLabel(id,FOLLOWUP_CATALOG)} (${clinicalLabel(d.schedules[id],TIMEFRAME_CATALOG)})`).join('; ')}</p>${c.orderLog.map(log=>`<p><b>Pedido ${log.batch}:</b> ${log.tests.map(id=>clinicalLabel(id,STUDY_CATALOG)).join(', ')}.</p>`).join('')}${c.hypothesis?`<details><summary>Notas de la versión anterior</summary><p>${escapeClinical(c.hypothesis.text)}</p><p>${escapeClinical(c.hypothesis.rationale)}</p><p>${escapeClinical(d.diagnosisText)}</p><p>${escapeClinical(d.planText)}</p><p>${escapeClinical(d.followupText)}</p></details>`:''}</details>`,`${archived?'<button class="primary-button" data-action="agenda">Volver a la agenda</button>':`<button class="secondary-button" data-action="close">Volver al consultorio</button><button class="primary-button" data-action="next-patient">${this.state.campaign.index>=dayTotal-1?'Despedir y terminar la ronda →':'Siguiente paciente →'}</button>`}`,'debrief-content');
  }
  challengeBody(caseData,c,archived=false){
    if(!c.outcome||archived&&!c.challenge)return '';
    const challenge=challengeFor(caseData.id);if(!challenge)return '';
    const answer=c.challenge?assessChallenge(caseData.id,c.challenge.choiceId):null;
    const choices=challengeChoicesFor(caseData.id,c.choiceSeed);
    return `<details class="reasoning-record challenge-card" ${answer?'open':''}><summary>Reto extra · ${answer?`${answer.correct?'1':'0'}/1 punto`:'opcional'}</summary><p class="panel-copy">${escapeClinical(challenge.prompt)}</p><p class="result-disclaimer">Una pregunta extra. Puedes continuar sin jugarla; tu nota clínica se conserva. Cuenta tu primera elección.</p><div class="quick-choice-grid challenge-cards">${choices.map(choice=>`<button class="quick-choice ${answer?.choiceId===choice.id?'selected':''} ${answer?.correctChoiceId===choice.id?'challenge-correct':''} ${answer&&!answer.correct&&answer.choiceId===choice.id?'challenge-incorrect':''}" data-challenge-choice="${choice.id}" aria-pressed="${answer?.choiceId===choice.id}" ${answer||archived?'disabled':''}><span><b>${escapeClinical(choice.title)}</b>${choice.detail?`<small>${escapeClinical(choice.detail)}</small>`:''}</span></button>`).join('')}</div>${answer?`<div class="challenge-feedback" role="status"><b>${answer.correct?'Reto resuelto · +1 punto extra':'Una idea para llevarte'}</b><p>${escapeClinical(answer.explanation)}</p></div>`:''}</details>`;
  }
}

ClinicalUI.getClinicalInterpretation = getClinicalInterpretation;
return {escapeClinical,parseClinicalValue,ClinicalUI,getClinicalInterpretation};
})();

