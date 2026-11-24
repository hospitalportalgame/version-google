/* HOSPITAL PORTAL · Héctor: cinco decisiones aprobadas. SCT sin nota psicométrica. */
window.HepatoDay1Modules['hector-reasoning.mjs']=(()=>{
  const ID='cirrhosis-compensated-v1-reasoning-v2',isHector=c=>c?.id===ID;
  const sct=[['-2','−2 · Mucho menos probable'],['-1','−1 · Menos probable'],['0','0 · No modifica su probabilidad'],['1','+1 · Más probable'],['2','+2 · Mucho más probable']].map(([id,title])=>({id,title}));
  const studies=[
    {id:'hector-study-a',title:'Exigir medición invasiva del gradiente portal',detail:'No considerar tratamiento hasta medirlo en todos los casos.',credit:0,why:'La evidencia clínica e imagenológica de este escenario permite plantear prevención sin exigir una medición invasiva del gradiente portal en todos los casos.'},
    {id:'hector-study-b',title:'Integrar evidencia portal y evaluar seguridad',detail:'Comprobar presión, pulso, función renal y contraindicaciones; reservar pruebas adicionales para preguntas concretas.',credit:1,why:'Las colaterales portosistémicas documentadas aportan evidencia de hipertensión portal significativa. Antes de tratar se revisan presión arterial, pulso, función renal y contraindicaciones. No se exige gradiente invasivo, várices grandes ni elastografía repetida para plantear prevención.'},
    {id:'hector-study-c',title:'Esperar endoscopia con várices grandes',detail:'No considerar ninguna prevención farmacológica antes de ese hallazgo.',credit:0,why:'La prevención de descompensación en cirrosis compensada con hipertensión portal significativa no se limita a pacientes con várices grandes. La endoscopia no es un requisito universal antes de plantear un betabloqueante no selectivo.'},
    {id:'hector-study-d',title:'Repetir elastografía hasta obtener dos valores mayores de 25 kPa',detail:'Exigir confirmación duplicada aunque ya existan colaterales portosistémicas.',credit:0,why:'No se justifica exigir dos elastografías de rutina cuando la evidencia disponible ya permite reconocer hipertensión portal significativa. Las colaterales no deben ignorarse.'}
  ];
  const plans=[
    {id:'hector-plan-a',title:'Diuréticos para evitar que aparezca ascitis',detail:'Iniciarlos aunque no haya retención de líquido.',plan:['diuretics'],credit:0,safety:'Diuréticos sin ascitis ni edema: exposición innecesaria a hipotensión, trastornos electrolíticos y lesión renal.',why:'Los diuréticos no se indican automáticamente para prevenir una primera ascitis en ausencia de retención de líquido.'},
    {id:'hector-plan-b',title:'Solo hábitos y vigilancia hasta la primera descompensación',detail:'Posponer la prevención portal mientras se sienta bien.',plan:['metabolic','nutrition'],credit:0,why:'El manejo metabólico y nutricional es necesario, pero no sustituye la oportunidad de prevenir descompensación en un paciente elegible con hipertensión portal significativa.'},
    {id:'hector-plan-c',title:'Plantear carvedilol con inicio y ajuste prudentes',detail:'Confirmar elegibilidad y tolerancia, junto con manejo metabólico, nutrición y educación sobre alarmas.',plan:['carvedilol','metabolic','nutrition','review-meds','alarm-network'],credit:3,why:'Es la estrategia de referencia si se confirma elegibilidad: carvedilol puede prevenir descompensación en cirrosis compensada con hipertensión portal significativa. Se individualizan inicio y ajuste según presión, pulso, función renal, contraindicaciones y tolerancia; no se prescribe una dosis automática sin esa valoración. Se acompaña de manejo metabólico y nutricional.'},
    {id:'hector-plan-d',title:'Lactulosa rutinaria para prevenir un primer episodio de encefalopatía',detail:'Añadirla sin otra indicación clínica.',plan:['monitor-specific'],credit:0,safety:'Lactulosa preventiva de rutina sin encefalopatía previa ni otra indicación en este escenario.',why:'No se añade lactulosa automáticamente para prevenir un primer episodio de encefalopatía en este caso. La indicación debe responder al contexto, no solo a la presencia de cirrosis.'}
  ];
  const followups=[
    {id:'hector-follow-a',title:'Tolerancia en 1–2 semanas y vigilancia semestral',detail:'Revisar antes si hay síntomas: presión, pulso y función renal según evolución; ecografía y AFP cada seis meses y alarmas de descompensación.',schedules:{portal:'2wk',hcc:'6mo'},credit:2,why:'Se separan dos objetivos: revisión temprana de tolerancia al carvedilol y vigilancia de hepatocarcinoma con ecografía y AFP cada seis meses. El control de 1–2 semanas se adapta al paciente; mareo importante, síncope, hipotensión, bradicardia sintomática o deterioro renal requieren valoración anticipada y revisión del tratamiento. Si la imagen no tiene calidad suficiente, se individualiza una estrategia alternativa de vigilancia.'},
    {id:'hector-follow-b',title:'Primera comprobación de tolerancia junto al control de seis meses',detail:'Programar ecografía y AFP semestrales y esperar hasta esa consulta para revisar carvedilol.',schedules:{portal:'6mo',hcc:'6mo'},credit:1,safety:'Retrasar seis meses la primera revisión de tolerancia después de iniciar carvedilol puede omitir hipotensión o deterioro renal.',why:'Crédito parcial: mantiene la vigilancia de hepatocarcinoma, pero la comprobación inicial de seguridad no debe esperar seis meses.'},
    {id:'hector-follow-c',title:'Revisar pronto presión y pulso, omitir imagen si AFP es normal',detail:'Suspender la imagen de vigilancia mientras no aumente AFP.',schedules:{portal:'2wk'},credit:1,why:'Crédito parcial: conserva una revisión temprana de tolerancia, aunque debe integrar función renal según evolución. La AFP normal no sustituye la imagen ni justifica suspender la vigilancia de hepatocarcinoma.'},
    {id:'hector-follow-d',title:'Solo transaminasas anuales y consulta si aparece dolor',detail:'No organizar otros controles mientras se encuentre bien.',schedules:{biochemical:'12mo'},credit:0,why:'La cirrosis compensada exige prevención y vigilancia aunque no haya síntomas. Las transaminasas y el dolor no sustituyen controlar tolerancia, reconocer descompensación y vigilar hepatocarcinoma.'}
  ];
  const lookup=(xs,id)=>xs.find(x=>x.id===id);
  const dataReady=c=>c.reviewed.length>0;
  const nextStep=d=>Number.isInteger(d?.hectorStep)&&d.hectorStep>=0&&d.hectorStep<=4?d.hectorStep:0;
  function validStep(c,step=nextStep(c.decisions)){
    const d=c.decisions;
    return [Boolean(d.diagnosis),dataReady(c)&&Boolean(lookup(sct,d.sctChoice)),Boolean(lookup(studies,d.kftStudiesChoice)),Boolean(lookup(plans,d.planChoice)),Boolean(lookup(followups,d.followupChoice))][step]===true;
  }
  const ready=c=>[0,1,2,3,4].every(step=>validStep(c,step));
  function choose(c,kind,id){
    const d=c.decisions,step={sct:1,studies:2,plan:3,followup:4}[kind];
    const xs={sct,studies,plan:plans,followup:followups}[kind],choice=xs&&lookup(xs,id);
    if(c.outcome||nextStep(d)!==step||!choice||!d.diagnosis||!dataReady(c))return false;
    if(kind==='sct')d.sctChoice=id;
    if(kind==='studies'){d.kftStudiesChoice=id;d.interpretationChoice='portal-integrated';}
    if(kind==='plan')Object.assign(d,{planChoice:id,plan:[...choice.plan],planText:''});
    if(kind==='followup')Object.assign(d,{followupChoice:id,followup:Object.keys(choice.schedules),schedules:{...choice.schedules},followupText:''});
    c.assessmentVersion=3;return true;
  }
  function restore(c,d){
    // Old closed consultations use their original decisions and assessment.
    if(!Number.isInteger(d.hectorStep))return;
    const clean=c.decisions;
    Object.assign(clean,{hectorStep:0,sctChoice:'',kftStudiesChoice:'',interpretationChoice:'',planChoice:'',plan:[],followupChoice:'',followup:[],schedules:{}});
    if(!clean.diagnosis)return;
    const wanted=nextStep(d);
    if(wanted===0)return;
    if(!dataReady(c)){clean.hectorStep=1;return;}
    clean.hectorStep=1;choose(c,'sct',d.sctChoice);
    if(wanted<2||!validStep(c,1))return;
    clean.hectorStep=2;choose(c,'studies',d.kftStudiesChoice);
    if(wanted<3||!validStep(c,2))return;
    clean.hectorStep=3;choose(c,'plan',d.planChoice);
    if(wanted<4||!validStep(c,3))return;
    clean.hectorStep=4;choose(c,'followup',d.followupChoice);
  }
  function secondaryExplanation(c){
    let text=c.reviewed.includes('elastography')?' La elastografía revisada de 27,5 kPa es concordante con la evidencia de hipertensión portal significativa.':' No es obligatorio añadir elastografía para aceptar la evidencia de colaterales ya revisada.';
    text+=' Si recibe y tolera un betabloqueante no selectivo para prevenir descompensación, la endoscopia de cribado no es obligatoria cuando no cambiaría el manejo. Si no puede recibirlo, debe definirse la evaluación endoscópica y prevención variceal correspondiente.';
    return text;
  }
  function assessParts(c,parts,planCritical,followupCritical){
    const d=c.decisions,k=lookup(studies,d.kftStudiesChoice),p=lookup(plans,d.planChoice),f=lookup(followups,d.followupChoice);
    // Preserve the existing medication-safety and evidence checks.
    if(p.safety&&!planCritical.includes(p.safety))planCritical.push(p.safety);
    followupCritical.splice(0,followupCritical.length,...(f.safety?[f.safety]:[]));
    for(const [id,title,choice] of [['interpretation','KFT 1 · Integración diagnóstica',k],['plan','KFT 2 · Conducta terapéutica',p],['followup','Seguimiento y plazos',f]]){
      const part=parts.find(x=>x.id===id);
      const gaps=id==='plan'&&p.credit===3?[...(part.evidenceMissing||[])]:[];
      const score=id==='plan'&&p.credit===3?Math.min(choice.credit,part.score):choice.credit;
      const missing=choice.credit===part.max?[]:['Revisar la decisión elegida'];
      if(gaps.length)missing.push(...gaps.map(x=>`Revisar ${x} antes de iniciar el tratamiento`));
      Object.assign(part,{title,score,missing,explanation:choice.why+(id==='interpretation'?secondaryExplanation(c):'')+(gaps.length?' La elección de una tarjeta adecuada no sustituye revisar las exclusiones y resultados de seguridad pendientes.':''),notes:[],critical:id==='plan'?[...planCritical]:id==='followup'?[...followupCritical]:[],evidenceMissing:gaps});
    }
  }
  function feedback(d){
    const s=lookup(sct,d.sctChoice),k=lookup(studies,d.kftStudiesChoice),p=lookup(plans,d.planChoice),f=lookup(followups,d.followupChoice);
    const direction=Number(s?.id)>0?'Reconociste que las colaterales portosistémicas aportan evidencia importante de hipertensión portal clínicamente significativa.':'Las colaterales portosistémicas aumentan la probabilidad de hipertensión portal clínicamente significativa; no deben interpretarse como un hallazgo tranquilizador.';
    return [
      {title:'SCT · Cómo actualizaste la hipótesis',text:`Elegiste ${s?.title||'sin respuesta'}. ${direction} La dirección docente es positiva; +1 y +2 se discuten sin adjudicar una concordancia numérica inventada. Sin panel experto real, el SCT es formativo y separado de /10.`},
      {title:'KFT 1 · Decisión diagnóstica',text:`Elegiste «${k?.title}». ${k?.why}`},
      {title:'KFT 2 · Conducta terapéutica',text:`Elegiste «${p?.title}». ${p?.why}`},
      {title:'Seguimiento · Continuidad de la atención',text:`Elegiste «${f?.title}». ${f?.why}`}
    ];
  }
  function render(c,step,catalog,esc,page){
    const d=c.decisions;
    // Cambia solo la posición visual; SCT conserva su escala ordenada.
    const displayOrder={"hector-studies-choice":[0,1,2,3],"plan-choice":[0,1,2,3],"followup-choice":[0,1,2,3]};
    const cards=(xs,attr,selected)=>`<div class="quick-choice-grid decision-cards">${(displayOrder[attr]?displayOrder[attr].map(i=>xs[i]):xs).map(x=>`<button type="button" class="quick-choice ${selected===x.id?'selected':''}" data-${attr}="${esc(x.id)}" aria-pressed="${selected===x.id}"><span class="choice-mark">${selected===x.id?'◆':'◇'}</span><span><b>${esc(x.title)}</b>${x.detail?`<small>${esc(x.detail)}</small>`:''}</span></button>`).join('')}</div>`;
    const titles=['¿Qué diagnóstico eliges?','Razonamiento bajo incertidumbre · SCT','KFT 1 · Decisión diagnóstica','KFT 2 · Conducta terapéutica','Seguimiento'];
    let body='';
    if(step===0)body=`<p class="panel-copy">Con la información obtenida en esta consulta, ¿cuál es el diagnóstico más probable de Héctor?</p><label class="clinical-field">Tu diagnóstico<select data-field="diagnosis"><option value="">Elige tu conclusión…</option>${catalog.map(x=>`<option value="${x.id}" ${d.diagnosis===x.id?'selected':''}>${esc(x.title)}</option>`).join('')}</select></label>`;
    else if(!dataReady(c))body='<p class="clinical-note">Primero solicita y revisa la ecografía abdominal. No se mostrarán resultados que aún no hayas revisado.</p>';
    else if(step===1)body=`<p class="panel-copy"><b>Hipótesis:</b> Héctor presenta hipertensión portal clínicamente significativa.</p><p class="panel-copy"><b>Dato que debes ponderar:</b> La imagen muestra colaterales portosistémicas.</p><p class="panel-copy">¿Cómo modifica este hallazgo la probabilidad de la hipótesis?</p>${cards(sct,'sct-choice',d.sctChoice)}<p class="result-disclaimer">SCT formativo, separado de la nota clínica.</p>`;
    else if(step===2)body=`<p class="panel-copy">Con cirrosis y colaterales portosistémicas documentadas, ¿qué evaluación necesitas antes de plantear prevención con un betabloqueante no selectivo?</p>${c.reviewed.includes('elastography')?'<p class="panel-copy">La elastografía que ya revisaste informa 27,5 kPa; integra ese resultado.</p>':''}${cards(studies,'hector-studies-choice',d.kftStudiesChoice)}`;
    else if(step===3)body=`<p class="panel-copy">Héctor se siente bien y pregunta si necesita tratamiento preventivo. ¿Qué propones?</p>${cards(plans,'plan-choice',d.planChoice)}`;
    else body=`<p class="panel-copy">Si inicia carvedilol, ¿cómo organizas los controles?</p>${cards(followups,'followup-choice',d.followupChoice)}`;
    return page(`<p class="decision-progress">RESUELVE LA CONSULTA · ${step+1} / 5</p><h3 class="study-title">${titles[step]}</h3>${body}<p class="result-disclaimer">Al continuar se registra tu elección y no podrás cambiarla. Las respuestas y explicaciones se revelan al terminar la consulta.</p>`,`<button class="secondary-button" data-tab="results">Repasar resultados</button><button class="primary-button" data-action="next-decision" ${validStep(c,step)?'':'disabled'}>${['Continuar con SCT →','Decisión diagnóstica →','Elegir tratamiento →','Elegir seguimiento →','Terminar consulta →'][step]}</button>`,'decision-content');
  }
  return {ID,isHector,sct,studies,plans,followups,lookup,dataReady,nextStep,validStep,ready,choose,restore,assessParts,feedback,render};
})();
