/* HOSPITAL PORTAL · Valeria: cinco decisiones aprobadas. SCT sin nota psicométrica. */
window.HepatoDay1Modules['valeria-reasoning.mjs']=(()=>{
  const ID='aih-planning-v1-reasoning-v2',isValeria=c=>c?.id===ID;
  const sct=[['-2','−2 · Mucho menos probable'],['-1','−1 · Menos probable'],['0','0 · No modifica sustancialmente esa necesidad'],['1','+1 · Más probable'],['2','+2 · Mucho más probable']].map(([id,title])=>({id,title}));
  const studies=[
    {id:'valeria-study-a',title:'Considerar suficiente el ANA positivo',detail:'No integrar los demás resultados para sostener el diagnóstico.',credit:0,why:'Un ANA positivo aislado no basta para diagnosticar hepatitis autoinmune. Se integra actividad, IgG, autoanticuerpos, histología y exclusión de causas alternativas.'},
    {id:'valeria-study-b',title:'Integrar actividad, inmunología, histología y exclusiones',detail:'Distinguir actividad inflamatoria de estadio de fibrosis para orientar el manejo.',credit:1,why:'La evaluación integrada sostiene hepatitis autoinmune activa. Actividad inflamatoria, estadio de fibrosis y función sintética son dimensiones diferentes; F2 no equivale a cirrosis ni permite ignorar la actividad.'},
    {id:'valeria-study-c',title:'Atribuir la alteración únicamente a fibrosis F2',detail:'No considerar relevante la inflamación persistente.',credit:0,why:'La fibrosis no explica por sí sola ni vuelve irrelevante la inflamación activa. La actividad debe tratarse aunque no exista cirrosis ni deterioro de síntesis.'},
    {id:'valeria-study-d',title:'Usar FIB-4 en lugar de interpretar la biopsia',detail:'Decidir la necesidad de inmunosupresión mediante el índice.',credit:0,why:'FIB-4 no sustituye la biopsia ni decide por sí solo la indicación de inmunosupresión en esta hepatitis activa. La inflamación y el contexto limitan su interpretación.'}
  ];
  const plans=[
    {id:'valeria-plan-a',title:'Corticoide y planificar azatioprina si resulta apropiada',detail:'Revisar seguridad e incorporar desde ahora anticoncepción y planificación preconcepcional.',plan:['steroids','immunosuppression','reproductive','review-meds','alarm-network'],credit:3,why:'Es la estrategia preferida para su proyecto reproductivo: tratar la actividad con corticoide y planificar azatioprina si es apropiada tras revisar seguridad hematológica y TPMT según práctica y disponibilidad. La selección, introducción y ajustes se individualizan con hepatología. La conversación reproductiva empieza ahora; no se espera a que busque embarazo.'},
    {id:'valeria-plan-b',title:'Micofenolato como única inducción, anticoncepción después',detail:'Conversar sobre prevención de embarazo solo cuando decida buscarlo.',plan:['mycophenolate'],credit:0,safety:'Micofenolato sin un plan reproductivo inmediato y como monoterapia de inducción no es una estrategia segura para este caso.',why:'Micofenolato es teratógeno y exige asesoramiento reproductivo y anticoncepción efectiva desde su uso, no cuando se quiera concebir. Tampoco se plantea aquí como único tratamiento de inducción.'},
    {id:'valeria-plan-c',title:'Micofenolato justificado, con inducción y seguridad explícitas',detail:'Asociarlo a tratamiento de inducción apropiado, explicar teratogenicidad, asegurar anticoncepción y planificar sustitución antes del embarazo.',plan:['steroids','mycophenolate','reproductive','review-meds','alarm-network'],credit:3,why:'Alternativa aceptable con crédito completo si está individualmente justificada y mantiene todas las medidas de seguridad: micofenolato puede formar parte de primera línea en pacientes no embarazadas, pero requiere inducción apropiada, explicación de teratogenicidad y anticoncepción efectiva. Para concebir debe sustituirse de forma supervisada al menos tres meses antes, según EASL 2025, manteniendo el control de la enfermedad. No se presenta como incorrecto en toda mujer no embarazada ni como opción sin riesgos.'},
    {id:'valeria-plan-d',title:'Esperar a definir la fecha del embarazo',detail:'Posponer inmunosupresión porque el INR normal permite esperar.',plan:['monitor-specific','reproductive'],credit:0,why:'La función sintética conservada no elimina la indicación de tratar la actividad persistente. Posponer la inmunosupresión hasta fijar una fecha de embarazo deja inflamación activa sin controlar.'}
  ];
  const followups=[
    {id:'valeria-follow-a',title:'Suspender al mejorar la astenia',detail:'Retirar inmunosupresión aunque aminotransferasas e IgG sigan elevadas.',schedules:{'symptom-change':'as-needed'},credit:0,safety:'Suspensión temprana por alivio sintomático pese a actividad bioquímica persistente.',why:'La mejoría de astenia no demuestra remisión bioquímica ni justifica retirar tratamiento. Se siguen aminotransferasas, IgG y evolución, además de tolerancia.'},
    {id:'valeria-follow-b',title:'Únicamente ALT dentro de tres meses',detail:'Omitir controles iniciales de seguridad.',schedules:{'aih-remission':'3mo'},credit:0,safety:'Demora de los controles iniciales de actividad y toxicidad al comenzar inmunosupresión.',why:'Se necesita una revisión inicial más cercana y controles de actividad y toxicidad adaptados al esquema. ALT aislada a tres meses no cubre IgG ni seguridad hematológica, metabólica y de otros órganos según tratamiento.'},
    {id:'valeria-follow-c',title:'Retirar todos los inmunosupresores antes de buscar embarazo',detail:'Mantenerlos solo hasta que decida concebir, para evitar cualquier exposición fetal.',schedules:{'aih-remission':'3mo'},credit:0,safety:'Retirada indiscriminada de inmunosupresión al planificar embarazo: riesgo de pérdida de control y brote.',why:'No se suspenden automáticamente todos los inmunosupresores. Se planifica un esquema compatible que mantenga remisión; azatioprina y corticoides pueden utilizarse según valoración individual. Micofenolato sí requiere un cambio anticipado por teratogenicidad.'},
    {id:'valeria-follow-d',title:'Primera revisión en 1–2 semanas y remisión sostenida',detail:'Ajustar controles de actividad y toxicidad al esquema y planificar concepción con enfermedad controlada y medicación compatible.',schedules:{'aih-remission':'2wk'},credit:2,why:'Se programa revisión inicial en 1–2 semanas y se adapta la frecuencia de aminotransferasas, IgG y controles de toxicidad al tratamiento. Se busca remisión bioquímica estable, idealmente durante al menos un año antes de concebir. Si usa micofenolato, se sustituye de forma supervisada al menos tres meses antes de la concepción, según EASL 2025, sin perder el control inflamatorio. No se suspenden fármacos solo por mejoría de síntomas.'}
  ];
  const lookup=(xs,id)=>xs.find(x=>x.id===id);
  const dataReady=c=>c.reviewed.length>0;
  const nextStep=d=>Number.isInteger(d?.valeriaStep)&&d.valeriaStep>=0&&d.valeriaStep<=4?d.valeriaStep:0;
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
    if(kind==='studies'){d.kftStudiesChoice=id;d.interpretationChoice='aih-integrated';}
    if(kind==='plan')Object.assign(d,{planChoice:id,plan:[...choice.plan],planText:''});
    if(kind==='followup')Object.assign(d,{followupChoice:id,followup:Object.keys(choice.schedules),schedules:{...choice.schedules},followupText:''});
    c.assessmentVersion=3;return true;
  }
  function restore(c,d){
    // Old closed consultations use their original decisions and assessment.
    if(!Number.isInteger(d.valeriaStep))return;
    const clean=c.decisions;
    Object.assign(clean,{valeriaStep:0,sctChoice:'',kftStudiesChoice:'',interpretationChoice:'',planChoice:'',plan:[],followupChoice:'',followup:[],schedules:{}});
    if(!clean.diagnosis)return;
    const wanted=nextStep(d);
    if(wanted===0)return;
    if(!dataReady(c)){clean.valeriaStep=1;return;}
    clean.valeriaStep=1;choose(c,'sct',d.sctChoice);
    if(wanted<2||!validStep(c,1))return;
    clean.valeriaStep=2;choose(c,'studies',d.kftStudiesChoice);
    if(wanted<3||!validStep(c,2))return;
    clean.valeriaStep=3;choose(c,'plan',d.planChoice);
    if(wanted<4||!validStep(c,3))return;
    clean.valeriaStep=4;choose(c,'followup',d.followupChoice);
  }
  function secondaryExplanation(c){
    return c.reviewed.includes('biopsy')?' La biopsia revisada informa hepatitis de interfase con infiltrado linfoplasmocitario y fibrosis F2, sin cirrosis; se integra sin repetirla de rutina.':' El informe de biopsia ya está disponible en el caso, pero todavía no lo has revisado. No se supone su contenido ni se sustituye por un índice.';
  }
  function assessParts(c,parts,planCritical,followupCritical){
    const d=c.decisions,k=lookup(studies,d.kftStudiesChoice),p=lookup(plans,d.planChoice),f=lookup(followups,d.followupChoice);
    // Preserve the existing reproductive and induction safety checks.
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
    const direction=s?.id==='0'?'Separaste la función sintética de la indicación de tratar la actividad.':'El INR y la albúmina conservados aportan información sobre gravedad, pero no eliminan la necesidad de tratar la actividad inflamatoria documentada.';
    return [
      {title:'SCT · Cómo actualizaste la hipótesis',text:`Elegiste ${s?.title||'sin respuesta'}. ${direction} Pueden modificar la urgencia frente a un cuadro con fallo de síntesis, sin anular la indicación por actividad. La orientación docente es 0, sin panel experto real ni puntuación psicométrica. El SCT es formativo y separado de /10.`},
      {title:'KFT 1 · Decisión diagnóstica',text:`Elegiste «${k?.title}». ${k?.why}`},
      {title:'KFT 2 · Conducta terapéutica',text:`Elegiste «${p?.title}». ${p?.why}`},
      {title:'Seguimiento · Continuidad de la atención',text:`Elegiste «${f?.title}». ${f?.why}`}
    ];
  }
  function render(c,step,catalog,esc,page){
    const d=c.decisions;
    // Cambia solo la posición visual; SCT conserva su escala ordenada.
    const displayOrder={"valeria-studies-choice":[0,1,2,3],"plan-choice":[0,1,2,3],"followup-choice":[0,1,2,3]};
    const cards=(xs,attr,selected)=>`<div class="quick-choice-grid decision-cards">${(displayOrder[attr]?displayOrder[attr].map(i=>xs[i]):xs).map(x=>`<button type="button" class="quick-choice ${selected===x.id?'selected':''}" data-${attr}="${esc(x.id)}" aria-pressed="${selected===x.id}"><span class="choice-mark">${selected===x.id?'◆':'◇'}</span><span><b>${esc(x.title)}</b>${x.detail?`<small>${esc(x.detail)}</small>`:''}</span></button>`).join('')}</div>`;
    const titles=['¿Qué diagnóstico eliges?','Razonamiento bajo incertidumbre · SCT','KFT 1 · Decisión diagnóstica','KFT 2 · Conducta terapéutica','Seguimiento'];
    let body='';
    if(step===0)body=`<p class="panel-copy">Con la información obtenida en esta consulta, ¿cuál es el diagnóstico más probable de Valeria?</p><label class="clinical-field">Tu diagnóstico<select data-field="diagnosis"><option value="">Elige tu conclusión…</option>${catalog.map(x=>`<option value="${x.id}" ${d.diagnosis===x.id?'selected':''}>${esc(x.title)}</option>`).join('')}</select></label>`;
    else if(!dataReady(c))body='<p class="clinical-note">Primero solicita y revisa el perfil hepático y el INR. No se mostrarán resultados que aún no hayas revisado.</p>';
    else if(step===1)body=`<p class="panel-copy"><b>Hipótesis:</b> Valeria necesita tratamiento para controlar la actividad inflamatoria hepática.</p><p class="panel-copy"><b>Dato que debes ponderar:</b> Su INR es de 1,05 y la albúmina es normal.</p><p class="panel-copy">¿Cómo modifica este dato, considerado por sí solo, la necesidad de tratar la actividad documentada?</p>${cards(sct,'sct-choice',d.sctChoice)}<p class="result-disclaimer">SCT formativo, separado de la nota clínica.</p>`;
    else if(step===2)body=`<p class="panel-copy">¿Qué razonamiento permite sostener el diagnóstico y orientar el manejo?</p>${c.reviewed.includes('biopsy')?'<p class="panel-copy">Ya revisaste la biopsia; integra su informe sin solicitar repetirla de rutina.</p>':''}${cards(studies,'valeria-studies-choice',d.kftStudiesChoice)}`;
    else if(step===3)body=`<p class="panel-copy">Valeria quiere controlar la enfermedad y preservar la posibilidad de embarazo. ¿Qué plan planteas?</p>${cards(plans,'plan-choice',d.planChoice)}`;
    else body=`<p class="panel-copy">¿Cómo organizas el seguimiento después de iniciar tratamiento?</p>${cards(followups,'followup-choice',d.followupChoice)}`;
    return page(`<p class="decision-progress">RESUELVE LA CONSULTA · ${step+1} / 5</p><h3 class="study-title">${titles[step]}</h3>${body}<p class="result-disclaimer">Al continuar se registra tu elección y no podrás cambiarla. Las respuestas y explicaciones se revelan al terminar la consulta.</p>`,`<button class="secondary-button" data-tab="results">Repasar resultados</button><button class="primary-button" data-action="next-decision" ${validStep(c,step)?'':'disabled'}>${['Continuar con SCT →','Decisión diagnóstica →','Elegir tratamiento →','Elegir seguimiento →','Terminar consulta →'][step]}</button>`,'decision-content');
  }
  return {ID,isValeria,sct,studies,plans,followups,lookup,dataReady,nextStep,validStep,ready,choose,restore,assessParts,feedback,render};
})();
