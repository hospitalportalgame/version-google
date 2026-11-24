/* HOSPITAL PORTAL · Sofía: cinco decisiones aprobadas. SCT sin nota psicométrica. */
window.HepatoDay1Modules['sofia-reasoning.mjs']=(()=>{
  const ID='gilbert-v1-reasoning-v2',isSofia=c=>c?.id===ID;
  const sct=[['-2','−2 · Mucho menos probable'],['-1','−1 · Menos probable'],['0','0 · No modifica su probabilidad'],['1','+1 · Más probable'],['2','+2 · Mucho más probable']].map(([id,title])=>({id,title}));
  const studies=[
    {id:'sofia-study-a',title:'Diagnóstico clínico de trabajo sin ampliar estudios de inmediato',detail:'Revisar antecedentes analíticos y reservar nuevas pruebas para dudas o hallazgos atípicos.',credit:1,why:'El patrón indirecto aislado, los controles previos y la ausencia de hemólisis permiten un diagnóstico clínico. No se necesitan pruebas adicionales rutinarias.'},
    {id:'sofia-study-b',title:'Genotipificación de UGT1A1 como requisito diagnóstico',detail:'Esperar confirmación genética antes de establecer el diagnóstico.',credit:0,why:'UGT1A1 puede ser útil ante incertidumbre o si modifica el manejo, pero no es un requisito en este patrón típico.'},
    {id:'sofia-study-c',title:'Ecografía hepatobiliar como requisito para concluir',detail:'Solicitar una imagen antes de cerrar la evaluación.',credit:0,why:'El patrón no es obstructivo y ya existe una ecografía previa normal. Otra imagen obligatoria no aporta valor en este escenario.'},
    {id:'sofia-study-d',title:'Prueba de ayuno para confirmar',detail:'Comprobar si aumenta la bilirrubina con el ayuno.',credit:0,why:'No se recomienda provocar ayuno como prueba confirmatoria rutinaria. Los antecedentes y el patrón analítico ya orientan la evaluación.'}
  ];
  const plans=[
    {id:'sofia-plan-a',title:'Explicación, comidas regulares e hidratación',detail:'Explicar benignidad, evitar ayunos prolongados y no indicar medicación específica.',plan:['reassure','alarm-network'],credit:3,why:'La tranquilidad informada y el reconocimiento de desencadenantes son el manejo indicado. No es necesario normalizar farmacológicamente la bilirrubina.'},
    {id:'sofia-plan-b',title:'Fenobarbital durante los episodios',detail:'Reducir la bilirrubina cuando aparezca ictericia.',plan:['monitor-specific'],credit:0,safety:'Fenobarbital sin indicación en este cuadro benigno: expone a sedación, interacciones y dependencia.',why:'Puede reducir la bilirrubina, pero ese efecto no justifica los riesgos del tratamiento en Sofía.'},
    {id:'sofia-plan-c',title:'Prueba terapéutica con ácido ursodesoxicólico',detail:'Indicar un período de tratamiento y valorar la respuesta.',plan:['udca'],credit:0,safety:'Ácido ursodesoxicólico sin indicación en el patrón de Sofía.',why:'No hay una enfermedad colestásica que justifique UDCA; la respuesta al fármaco no confirma Gilbert.'},
    {id:'sofia-plan-d',title:'Suspender ejercicio y reducir grasas',detail:'Mantener esas restricciones hasta normalizar la bilirrubina.',plan:['nutrition'],credit:0,why:'No está indicado suspender el ejercicio ni restringir grasas para normalizar la bilirrubina. Las recomendaciones deben centrarse en desencadenantes personales, comidas regulares e hidratación.'}
  ];
  const followups=[
    {id:'sofia-follow-a',title:'Controles habituales y reconsulta ante cambios',detail:'Sin vigilancia hepatológica específica; volver ante ictericia distinta, coluria, heces claras, dolor o fiebre.',schedules:{'symptom-change':'as-needed'},credit:2,why:'Con un patrón típico y estable no se requiere vigilancia hepática específica. Los síntomas nuevos deben evaluarse por su propia causa.'},
    {id:'sofia-follow-b',title:'Bilirrubina y hepatograma trimestrales indefinidos',detail:'Continuar aunque permanezca bien y el patrón sea el mismo.',schedules:{biochemical:'3mo'},credit:0,why:'La vigilancia trimestral indefinida no aporta beneficio en Gilbert estable y añade sobreestudios.'},
    {id:'sofia-follow-c',title:'Un control aislado y luego controles habituales',detail:'Repetir bilirrubina y hepatograma en los próximos meses; si se mantiene el patrón, controles habituales y reconsulta ante cambios.',schedules:{'review-results':'3mo','symptom-change':'as-needed'},credit:2,why:'Es una alternativa aceptable para documentar estabilidad cuando existe incertidumbre inicial. Sofía ya tiene tres controles previos estables: otro control no es imprescindible ni debe volverse vigilancia indefinida.'},
    {id:'sofia-follow-d',title:'Perfil de hemólisis en cada episodio',detail:'Repetirlo aunque sea idéntico a los episodios ya estudiados.',schedules:{biochemical:'as-needed'},credit:0,why:'No se justifica repetir hemólisis en cada episodio habitual sin nuevos indicios. Anemia, reticulocitosis u otros cambios sí obligarían a reconsiderarla.'}
  ];
  const missingChoice={id:'missing-evidence',title:'Información insuficiente',credit:0,maxCredit:0,why:'No se revisaron los estudios necesarios para responder esta pregunta.',plan:['nutrition'],schedules:{'symptom-change':'as-needed'},interpretation:'gilbert-pattern'};
  const requirements={1:['cbc','hemolysis'],2:['profile','cbc','hemolysis']};
  const missing=(c,step)=>(requirements[step]||[]).filter(id=>!c.reviewed.includes(id));
  const lookup=(xs,id)=>id==='missing-evidence'?missingChoice:xs.find(x=>x.id===id);
  const dataReady=c=>c.reviewed.length>0;
  const nextStep=d=>Number.isInteger(d?.sofiaStep)&&d.sofiaStep>=0&&d.sofiaStep<=4?d.sofiaStep:0;
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
    if(kind==='studies'){d.kftStudiesChoice=id;d.interpretationChoice='gilbert-pattern';}
    if(kind==='plan')Object.assign(d,{planChoice:id,plan:[...choice.plan],planText:''});
    if(kind==='followup')Object.assign(d,{followupChoice:id,followup:Object.keys(choice.schedules),schedules:{...choice.schedules},followupText:''});
    c.assessmentVersion=3;return true;
  }
  function restore(c,d){
    // Old closed consultations use their original decisions and assessment.
    if(!Number.isInteger(d.sofiaStep))return;
    const clean=c.decisions;
    Object.assign(clean,{sofiaStep:0,sctChoice:'',kftStudiesChoice:'',interpretationChoice:'',planChoice:'',plan:[],followupChoice:'',followup:[],schedules:{}});
    if(!clean.diagnosis)return;
    const wanted=nextStep(d);
    if(wanted===0)return;
    clean.sofiaStep=1;choose(c,'sct',d.sctChoice);
    if(wanted<2||!validStep(c,1))return;
    clean.sofiaStep=2;choose(c,'studies',d.kftStudiesChoice);
    if(wanted<3||!validStep(c,2))return;
    clean.sofiaStep=3;choose(c,'plan',d.planChoice);
    if(wanted<4||!validStep(c,3))return;
    clean.sofiaStep=4;choose(c,'followup',d.followupChoice);
  }
  function assessParts(c,parts,planCritical,followupCritical){
    const d=c.decisions,k=lookup(studies,d.kftStudiesChoice),p=lookup(plans,d.planChoice),f=lookup(followups,d.followupChoice);
    planCritical.splice(0,planCritical.length,...(p.safety?[p.safety]:[]));followupCritical.splice(0);
    for(const [id,title,choice] of [['interpretation','KFT 1 · Decisión diagnóstica',k],['plan','KFT 2 · Conducta terapéutica',p],['followup','Seguimiento y plazos',f]]){
      const part=parts.find(x=>x.id===id);
      Object.assign(part,{title,score:choice.credit,missing:choice.credit===part.max?[]:['Revisar la decisión elegida'],explanation:choice.why,notes:[],critical:id==='plan'?[...planCritical]:[],evidenceMissing:[]});
    }
  }
  function feedback(d){
    const s=lookup(sct,d.sctChoice),k=lookup(studies,d.kftStudiesChoice),p=lookup(plans,d.planChoice),f=lookup(followups,d.followupChoice);
    return [
      {title:'SCT · Cómo actualizaste la hipótesis',text:`Elegiste ${s?.title||'sin respuesta'}. ${Number(s?.id)<0?'Reconociste que los resultados reducen la probabilidad de hemólisis activa.':'La normalidad conjunta de hemoglobina, reticulocitos, LDH y haptoglobina reduce, en vez de aumentar, la probabilidad de hemólisis activa.'} No excluye cualquier hemólisis en toda circunstancia. −1 y −2 no se distinguen con una nota de concordancia sin un panel experto real; el SCT es formativo y separado de la nota /10.`},
      {title:'KFT 1 · Decisión diagnóstica',text:`Elegiste «${k?.title}». ${k?.why}`},
      {title:'KFT 2 · Conducta terapéutica',text:`Elegiste «${p?.title}». ${p?.why}`},
      {title:'Seguimiento · Continuidad de la atención',text:`Elegiste «${f?.title}». ${f?.why}`}
    ];
  }
  function render(c,step,catalog,esc,page){
    const d=c.decisions;
    // Cambia solo la posición visual; SCT conserva su escala ordenada.
    const displayOrder={"sofia-studies-choice":[1,2,3,0],"plan-choice":[0,2,1,3],"followup-choice":[1,0,3,2]};
    const cards=(xs,attr,selected)=>`<div class="quick-choice-grid decision-cards">${(displayOrder[attr]?displayOrder[attr].map(i=>xs[i]):xs).map(x=>`<button type="button" class="quick-choice ${selected===x.id?'selected':''}" data-${attr}="${esc(x.id)}" aria-pressed="${selected===x.id}"><span class="choice-mark">${selected===x.id?'◆':'◇'}</span><span><b>${esc(x.title)}</b>${x.detail?`<small>${esc(x.detail)}</small>`:''}</span></button>`).join('')}</div>`;
    const titles=['¿Qué diagnóstico eliges?','Razonamiento bajo incertidumbre · SCT','KFT 1 · Decisión diagnóstica','KFT 2 · Conducta terapéutica','Seguimiento'];
    let body='';
    if(step===0)body=`<p class="panel-copy">Con la información obtenida en esta consulta, ¿cuál es el diagnóstico más probable de Sofía?</p><label class="clinical-field">Tu diagnóstico<select data-field="diagnosis"><option value="">Elige tu conclusión…</option>${catalog.map(x=>`<option value="${x.id}" ${d.diagnosis===x.id?'selected':''}>${esc(x.title)}</option>`).join('')}</select></label>`;
    else if(missing(c,step).length)body=`<p class="clinical-note">No tienes información suficiente para responder. Faltan resultados por solicitar o revisar: ${missing(c,step).map(id=>esc(window.HepatoDay1Modules['study-catalog.mjs']?.STUDY_CATALOG?.find(x=>x.id===id)?.title||id)).join(', ')}.</p><p class="panel-copy">Al continuar, esta pregunta se registrará como incorrecta. Puedes repasar los resultados disponibles antes de hacerlo.</p>`;
    else if(step===1)body=`<p class="panel-copy"><b>Hipótesis:</b> La hemólisis podría explicar la hiperbilirrubinemia de Sofía.</p><p class="panel-copy"><b>Dato que debes ponderar:</b> El estudio disponible muestra hemoglobina, reticulocitos, LDH y haptoglobina dentro de sus rangos de referencia.</p><p class="panel-copy">¿Cómo modifica este conjunto de resultados la probabilidad de que exista hemólisis activa como explicación del cuadro?</p>${cards(sct,'sct-choice',d.sctChoice)}<p class="result-disclaimer">SCT formativo, separado de la nota clínica.</p>`;
    else if(step===2)body=`<p class="panel-copy">Ya revisaste las fracciones de bilirrubina, las enzimas hepáticas, los antecedentes farmacológicos y el estudio de hemólisis. El patrón es aislado, predominantemente indirecto y sin señales de alarma. ¿Cuál es el siguiente paso más apropiado?</p>${cards(studies,'sofia-studies-choice',d.kftStudiesChoice)}`;
    else if(step===3)body=`<p class="panel-copy">Sofía pregunta: «¿Necesito tomar algo para que deje de pasarme?». ¿Qué plan le propones?</p>${cards(plans,'plan-choice',d.planChoice)}`;
    else body=`<p class="panel-copy">Una vez establecido el diagnóstico y resueltas sus dudas, ¿qué seguimiento acuerdas con Sofía?</p>${cards(followups,'followup-choice',d.followupChoice)}`;
    return page(`<p class="decision-progress">RESUELVE LA CONSULTA · ${step+1} / 5</p><h3 class="study-title">${titles[step]}</h3>${body}<p class="result-disclaimer">Al continuar se registra tu elección y no podrás cambiarla. Las respuestas y explicaciones se revelan al terminar la consulta.</p>`,`<button class="secondary-button" data-tab="results">Repasar resultados</button><button class="primary-button" data-action="next-decision" ${(step>0&&missing(c,step).length)||validStep(c,step)?'':'disabled'}>${['Continuar con SCT →','Decisión diagnóstica →','Elegir tratamiento →','Elegir seguimiento →','Terminar consulta →'][step]}</button>`,'decision-content');
  }
  return {missing,ID,isSofia,sct,studies,plans,followups,lookup,dataReady,nextStep,validStep,ready,choose,restore,assessParts,feedback,render};
})();
