/* HOSPITAL PORTAL · Elena: cinco decisiones aprobadas. SCT sin nota psicométrica. */
window.HepatoDay1Modules['elena-reasoning.mjs']=(()=>{
  const ID='masld-older-v1-reasoning-v2',isElena=c=>c?.id===ID;
  const sct=[['-2','−2 · Mucho menos probable'],['-1','−1 · Menos probable'],['0','0 · No modifica su probabilidad'],['1','+1 · Más probable'],['2','+2 · Mucho más probable']].map(([id,title])=>({id,title}));
  const studies=[
    {id:'elena-study-a',title:'Evaluación secundaria e integración de los resultados',detail:'Completar con elastografía o ELF; si ya se realizó, integrar el resultado y resolver posibles incertidumbres.',credit:1,why:'A los 68 años, el umbral inferior ajustado de FIB-4 es 2,0. Un valor de 2,26 requiere evaluación secundaria; no confirma cirrosis. Si la evaluación sigue indeterminada, se integra una prueba complementaria y la valoración especializada.'},
    {id:'elena-study-b',title:'Riesgo bajo porque FIB-4 es menor de 2,67',detail:'Repetirlo en dos años, sin evaluación secundaria.',credit:0,why:'2,67 no es el único umbral de acción. Elena supera el umbral inferior ajustado de 2,0 y no debe clasificarse como bajo riesgo por este argumento.'},
    {id:'elena-study-c',title:'Biopsia como siguiente paso obligatorio',detail:'Solicitarla directamente, basándose únicamente en este FIB-4.',credit:0,why:'El FIB-4 aislado no obliga a una biopsia. Una biopsia posterior puede estar justificada por pruebas indeterminadas, discordancias o sospecha de otra enfermedad; ese es un contexto distinto.'},
    {id:'elena-study-d',title:'Atribuir el resultado a la edad',detail:'Continuar únicamente con ecografía convencional anual.',credit:0,why:'La edad exige ajustar el umbral, no ignorar el resultado. La ecografía convencional no sustituye la evaluación de fibrosis.'}
  ];
  const plans=[
    {id:'elena-plan-a',title:'Iniciar manejo metabólico mientras se aclara la fibrosis',detail:'Alimentación, reducción gradual de peso, actividad con fuerza y revisión de diabetes, presión arterial y riesgo cardiovascular.',plan:['metabolic','nutrition','alarm-network'],credit:3,why:'El manejo metabólico comienza ahora y se individualiza. En una paciente de 68 años, acompaña la pérdida de peso con ejercicio de fuerza y atención a la masa muscular. Revisa el control de diabetes y riesgo cardiovascular; la estadificación no debe retrasar estas medidas.'},
    {id:'elena-plan-b',title:'Esperar fibrosis significativa para intervenir sobre hábitos',detail:'Mantener metformina y losartán; abordar peso y actividad solo si se confirma fibrosis significativa.',plan:['monitor-specific','alarm-network'],credit:0,why:'Mantener el tratamiento actual no reemplaza un plan metabólico integral. La obesidad, diabetes e hipertensión requieren intervención sin esperar a confirmar fibrosis significativa.'},
    {id:'elena-plan-c',title:'Añadir vitamina E en dosis altas',detail:'Mantener el tratamiento actual e indicar vitamina E como tratamiento hepático, sin otra caracterización.',plan:['monitor-specific'],credit:0,safety:'Vitamina E en dosis altas sin indicación individualizada ni valoración de riesgos en esta paciente con diabetes.',why:'No corresponde indicar vitamina E automáticamente por esteatosis y ALT elevada. No sustituye el manejo metabólico ni la evaluación de fibrosis, y exige una selección y valoración de riesgos que aquí no se han realizado.'},
    {id:'elena-plan-d',title:'Centrar el manejo en repetir transaminasas',detail:'Si disminuyen, considerar resuelto el problema sin completar la evaluación de fibrosis.',plan:['monitor-specific'],credit:0,why:'La disminución de ALT puede acompañar mejoría, pero no demuestra ausencia de fibrosis ni elimina la enfermedad metabólica. No debe cancelar su evaluación.'}
  ];
  const followups=[
    {id:'elena-follow-a',title:'Revisión en los próximos 1–3 meses',detail:'Integrar la evaluación de fibrosis y el avance del plan metabólico; adelantar ante alarmas y ajustar controles posteriores según resultados.',schedules:{'review-results':'3mo','liver-metabolic':'3mo'},credit:2,why:'La próxima consulta debe recuperar la evaluación de fibrosis y revisar el plan metabólico. Si la elastografía ya está disponible, se integra ahora y se acuerda cómo resolver la incertidumbre restante, sin aplazarla un año. Ajusta los controles posteriores al riesgo y evolución.'},
    {id:'elena-follow-b',title:'Repetir únicamente FIB-4 dentro de un año',detail:'Dejar sin resolver hasta entonces la evaluación secundaria.',schedules:{fibrosis:'12mo'},credit:0,why:'Esta opción deja expresamente pendiente la evaluación secundaria. No equivale a una estrategia alternativa estructurada de intervención intensiva con reevaluación acordada y criterios de escalada.'},
    {id:'elena-follow-c',title:'ALT y HbA1c a los tres meses',detail:'Si mejoran, cancelar la evaluación pendiente de fibrosis.',schedules:{'liver-metabolic':'3mo'},credit:0,why:'Revisar ALT y HbA1c es útil; el error consiste en cancelar la evaluación de fibrosis por su mejoría. Son preguntas clínicas diferentes.'},
    {id:'elena-follow-d',title:'Ecografía y AFP semestrales como seguimiento principal',detail:'Asumir cirrosis por el FIB-4 actual y organizar vigilancia de hepatocarcinoma.',schedules:{hcc:'6mo'},credit:0,why:'El FIB-4 de 2,26 no establece cirrosis. No corresponde asumirla ni sustituir la estratificación y el manejo metabólico por vigilancia de hepatocarcinoma.'}
  ];
  const missingChoice={id:'missing-evidence',title:'Información insuficiente',credit:0,maxCredit:0,why:'No se revisaron los estudios necesarios para responder esta pregunta.',plan:['nutrition'],schedules:{'symptom-change':'as-needed'},interpretation:'masld-secondary'};
  const requirements={1:['ultrasound'],2:['profile','cbc']};
  const missing=(c,step)=>(requirements[step]||[]).filter(id=>!c.reviewed.includes(id));
  const lookup=(xs,id)=>id==='missing-evidence'?missingChoice:xs.find(x=>x.id===id);
  const dataReady=c=>c.reviewed.length>0;
  const nextStep=d=>Number.isInteger(d?.elenaStep)&&d.elenaStep>=0&&d.elenaStep<=4?d.elenaStep:0;
  function validStep(c,step=nextStep(c.decisions)){
    const d=c.decisions;
    return [Boolean(d.diagnosis),(dataReady(c)||d.sctChoice==='missing-evidence')&&Boolean(lookup(sct,d.sctChoice)),Boolean(lookup(studies,d.kftStudiesChoice)),Boolean(lookup(plans,d.planChoice)),Boolean(lookup(followups,d.followupChoice))][step]===true;
  }
  const ready=c=>[0,1,2,3,4].every(step=>validStep(c,step));
  function choose(c,kind,id){
    const d=c.decisions,step={sct:1,studies:2,plan:3,followup:4}[kind];
    const xs={sct,studies,plan:plans,followup:followups}[kind],choice=xs&&lookup(xs,id);
    if(c.outcome||nextStep(d)!==step||!choice||!d.diagnosis||(!dataReady(c)&&step<=2&&id!=='missing-evidence'))return false;
    if(kind==='sct')d.sctChoice=id;
    if(kind==='studies'){d.kftStudiesChoice=id;d.interpretationChoice='masld-secondary';}
    if(kind==='plan')Object.assign(d,{planChoice:id,plan:[...choice.plan],planText:''});
    if(kind==='followup')Object.assign(d,{followupChoice:id,followup:Object.keys(choice.schedules),schedules:{...choice.schedules},followupText:''});
    c.assessmentVersion=3;return true;
  }
  function restore(c,d){
    // Old closed consultations use their original decisions and assessment.
    if(!Number.isInteger(d.elenaStep))return;
    const clean=c.decisions;
    Object.assign(clean,{elenaStep:0,sctChoice:'',kftStudiesChoice:'',interpretationChoice:'',planChoice:'',plan:[],followupChoice:'',followup:[],schedules:{}});
    if(!clean.diagnosis)return;
    const wanted=nextStep(d);
    if(wanted===0)return;
    clean.elenaStep=1;choose(c,'sct',d.sctChoice);
    if(wanted<2||!validStep(c,1))return;
    clean.elenaStep=2;choose(c,'studies',d.kftStudiesChoice);
    if(wanted<3||!validStep(c,2))return;
    clean.elenaStep=3;choose(c,'plan',d.planChoice);
    if(wanted<4||!validStep(c,3))return;
    clean.elenaStep=4;choose(c,'followup',d.followupChoice);
  }
  function secondaryExplanation(c){
    if(c.reviewed.includes('biopsy'))return ' Ya revisaste una biopsia: integra su informe histológico. La pertinencia del procedimiento se evalúa según su indicación y la secuencia de estudios registrada.';
    if(c.reviewed.includes('elastography'))return ' La elastografía revisada de 8,9 kPa queda en una zona indeterminada: no confirma cirrosis ni asigna por sí sola un estadio histológico. Integra calidad, contexto y una evaluación complementaria según disponibilidad.';
    return ' Todavía no has revisado una prueba secundaria; solicitarla y recuperar su resultado es el siguiente paso.';
  }
  function assessParts(c,parts,planCritical,followupCritical){
    const d=c.decisions,k=lookup(studies,d.kftStudiesChoice),p=lookup(plans,d.planChoice),f=lookup(followups,d.followupChoice);
    planCritical.splice(0,planCritical.length,...(p.safety?[p.safety]:[]));followupCritical.splice(0);
    for(const [id,title,choice] of [['interpretation','KFT 1 · Decisión diagnóstica',k],['plan','KFT 2 · Conducta terapéutica',p],['followup','Seguimiento y plazos',f]]){
      const part=parts.find(x=>x.id===id);
      Object.assign(part,{title,score:choice.credit,missing:choice.credit===part.max?[]:['Revisar la decisión elegida'],explanation:choice.why+(id==='interpretation'?secondaryExplanation(c):''),notes:[],critical:id==='plan'?[...planCritical]:[],evidenceMissing:[]});
    }
  }
  function feedback(d){
    const s=lookup(sct,d.sctChoice),k=lookup(studies,d.kftStudiesChoice),p=lookup(plans,d.planChoice),f=lookup(followups,d.followupChoice);
    const direction=['0','-1'].includes(s?.id)?'Tu respuesta reconoce que una ecografía sin signos avanzados no descarta fibrosis avanzada. Puede tranquilizar parcialmente, pero su capacidad para excluirla es limitada.':'Una ecografía de contornos regulares, sin esplenomegalia ni ascitis, no aumenta la sospecha de fibrosis avanzada ni permite reducirla de forma contundente. La fibrosis avanzada puede existir sin esos signos.';
    return [
      {title:'SCT · Cómo actualizaste la hipótesis',text:`Elegiste ${s?.title||'sin respuesta'}. ${direction} El matiz entre 0 y −1 se discute de forma formativa; no hay panel experto real ni nota de concordancia. El SCT no suma ni resta a la nota /10.`},
      {title:'KFT 1 · Decisión diagnóstica',text:`Elegiste «${k?.title}». ${k?.why}`},
      {title:'KFT 2 · Conducta terapéutica',text:`Elegiste «${p?.title}». ${p?.why}`},
      {title:'Seguimiento · Continuidad de la atención',text:`Elegiste «${f?.title}». ${f?.why}`}
    ];
  }
  function render(c,step,catalog,esc,page){
    const d=c.decisions;
    // Cambia solo la posición visual; SCT conserva su escala ordenada.
    const displayOrder={"elena-studies-choice":[2,0,3,1],"plan-choice":[1,2,3,0],"followup-choice":[2,1,0,3]};
    const cards=(xs,attr,selected)=>`<div class="quick-choice-grid decision-cards">${(displayOrder[attr]?displayOrder[attr].map(i=>xs[i]):xs).map(x=>`<button type="button" class="quick-choice ${selected===x.id?'selected':''}" data-${attr}="${esc(x.id)}" aria-pressed="${selected===x.id}"><span class="choice-mark">${selected===x.id?'◆':'◇'}</span><span><b>${esc(x.title)}</b>${x.detail?`<small>${esc(x.detail)}</small>`:''}</span></button>`).join('')}</div>`;
    const titles=['¿Qué diagnóstico eliges?','Razonamiento bajo incertidumbre · SCT','KFT 1 · Decisión diagnóstica','KFT 2 · Conducta terapéutica','Seguimiento'];
    let body='';
    if(step===0)body=`<p class="panel-copy">Con la información obtenida en esta consulta, ¿cuál es el diagnóstico más probable de Elena?</p><label class="clinical-field">Tu diagnóstico<select data-field="diagnosis"><option value="">Elige tu conclusión…</option>${catalog.map(x=>`<option value="${x.id}" ${d.diagnosis===x.id?'selected':''}>${esc(x.title)}</option>`).join('')}</select></label>`;
    else if(missing(c,step).length)body=`<p class="clinical-note">No tienes información suficiente para responder. Faltan resultados por solicitar o revisar: ${missing(c,step).map(id=>esc(window.HepatoDay1Modules['study-catalog.mjs']?.STUDY_CATALOG?.find(x=>x.id===id)?.title||id)).join(', ')}.</p><p class="panel-copy">Al continuar, esta pregunta se registrará como incorrecta. Puedes repasar los resultados disponibles antes de hacerlo.</p>`;
    else if(step===1)body=`<p class="panel-copy"><b>Hipótesis:</b> Elena podría presentar fibrosis hepática avanzada.</p><p class="panel-copy"><b>Dato que debes ponderar:</b> La ecografía muestra contornos hepáticos regulares, bazo normal y ausencia de ascitis.</p><p class="panel-copy">¿Cómo modifica este resultado la probabilidad de fibrosis avanzada?</p>${cards(sct,'sct-choice',d.sctChoice)}<p class="result-disclaimer">SCT formativo, separado de la nota clínica.</p>`;
    else if(step===2)body=`<p class="panel-copy">Elena tiene 68 años y FIB-4 de 2,26.${c.reviewed.includes('elastography')?' La elastografía que ya revisaste informa una rigidez de 8,9 kPa.':''}${c.reviewed.includes('biopsy')?' Integra también el informe de biopsia que ya revisaste.':''} ¿Cuál es la estrategia más apropiada para evaluar su fibrosis?</p>${cards(studies,'elena-studies-choice',d.kftStudiesChoice)}`;
    else if(step===3)body=`<p class="panel-copy">Elena pregunta: «¿Tengo que esperar a saber cuánta fibrosis tengo para empezar a tratarme?». ¿Qué le propones?</p>${cards(plans,'plan-choice',d.planChoice)}`;
    else body=`<p class="panel-copy">¿Cómo organizas la próxima revisión?</p>${cards(followups,'followup-choice',d.followupChoice)}`;
    return page(`<p class="decision-progress">RESUELVE LA CONSULTA · ${step+1} / 5</p><h3 class="study-title">${titles[step]}</h3>${body}<p class="result-disclaimer">Al continuar se registra tu elección y no podrás cambiarla. Las respuestas y explicaciones se revelan al terminar la consulta.</p>`,`<button class="secondary-button" data-tab="results">Repasar resultados</button><button class="primary-button" data-action="next-decision" ${(step>0&&missing(c,step).length)||validStep(c,step)?'':'disabled'}>${['Continuar con SCT →','Decisión diagnóstica →','Elegir tratamiento →','Elegir seguimiento →','Terminar consulta →'][step]}</button>`,'decision-content');
  }
  return {missing,ID,isElena,sct,studies,plans,followups,lookup,dataReady,nextStep,validStep,ready,choose,restore,assessParts,feedback,render};
})();
