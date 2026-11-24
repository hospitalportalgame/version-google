/* HOSPITAL PORTAL · Rosa: cinco decisiones aprobadas. SCT sin nota psicométrica. */
window.HepatoDay1Modules['rosa-reasoning.mjs']=(()=>{
  const ID='hcv-treatment-v1-reasoning-v2',isRosa=c=>c?.id===ID;
  const sct=[['-2','−2 · Mucho menos probable'],['-1','−1 · Menos probable'],['0','0 · No modifica de manera útil esa estimación'],['1','+1 · Más probable'],['2','+2 · Mucho más probable']].map(([id,title])=>({id,title}));
  const studies=[
    {id:'rosa-study-a',title:'Biopsia para toda paciente con ARN detectable',detail:'Establecer estadio histológico aunque la evaluación no invasiva sea concordante.',credit:0,why:'El ARN detectable confirma infección activa, pero no obliga a una biopsia. La evaluación no invasiva y clínica permite valorar la elegibilidad para una vía simplificada; una biopsia necesita una indicación adicional.'},
    {id:'rosa-study-b',title:'Genotipo y elastografía obligatorios en todos los casos',detail:'Exigirlos aunque reúna los criterios de una vía simplificada sin cirrosis.',credit:0,why:'En una paciente elegible sin cirrosis, los esquemas pangenotípicos de la vía simplificada no exigen genotipo ni elastografía de rutina. Si ya hay una elastografía, se integra su resultado sin repetirla.'},
    {id:'rosa-study-c',title:'Esperar seis meses y repetir ARN-VHC',detail:'Posponer la decisión de tratar independientemente de los antecedentes y resultados actuales.',credit:0,why:'No se justifica demorar automáticamente el tratamiento para repetir la viremia a seis meses. El contexto y el ARN actual permiten avanzar en la evaluación y ofrecer tratamiento apropiado.'},
    {id:'rosa-study-d',title:'Integrar elegibilidad, seguridad y medicación',detail:'Evaluar cirrosis, función renal y hepática, tratamientos previos, coinfecciones y medicamentos; evitar requisitos adicionales innecesarios si es elegible.',credit:1,why:'La evaluación previa establece elegibilidad y seguridad. La vía simplificada sin cirrosis permite esquemas pangenotípicos sin biopsia, genotipo ni elastografía obligatorios cuando los criterios están satisfechos. La revisión farmacológica es parte de esa evaluación.'}
  ];
  const plans=[
    {id:'rosa-plan-a',title:'Glecaprevir/pibrentasvir manteniendo simvastatina',detail:'Iniciar sin modificarla, porque los antivirales actuales tienen pocas interacciones.',plan:['daa'],credit:0,safety:'Glecaprevir/pibrentasvir con simvastatina sin resolver su interacción: riesgo de toxicidad muscular.',why:'La interacción con simvastatina es clínicamente importante. Debe resolverse antes de comenzar, mediante una estrategia compatible con el esquema elegido y el riesgo cardiovascular; no basta asumir que los antivirales tienen pocas interacciones.'},
    {id:'rosa-plan-b',title:'Sofosbuvir/velpatasvir manteniendo omeprazol sin revisión',detail:'Iniciar sin revisar dosis, indicación ni forma de administración del omeprazol.',plan:['daa'],credit:0,safety:'Omeprazol sin revisión al indicar sofosbuvir/velpatasvir: puede disminuir la exposición a velpatasvir y comprometer la eficacia.',why:'La supresión ácida puede reducir la absorción de velpatasvir. Revisa necesidad, dosis y administración del omeprazol según el esquema, además de la simvastatina y el resto de la medicación. No se debe suponer una dosis que no consta en el expediente.'},
    {id:'rosa-plan-c',title:'Esquema pangenotípico con interacciones resueltas',detail:'Elegir un esquema apropiado, comprobar ambos medicamentos y acordar ajustes, duración y adherencia antes de iniciarlo.',plan:['daa','review-meds','alarm-network'],credit:3,why:'Es la estrategia de referencia: ofrecer antivirales y resolver las interacciones antes de iniciarlos. Son aceptables distintos esquemas apropiados y ajustes compatibles. No se exige retirar permanentemente ambos medicamentos ni inventar sus dosis; la decisión depende de sus indicaciones y del antiviral seleccionado.'},
    {id:'rosa-plan-d',title:'Posponer antivirales y vigilar transaminasas',detail:'Si se normalizan, reconsiderar si todavía necesita tratamiento.',plan:['monitor-specific'],credit:0,why:'La ALT puede fluctuar o normalizarse con infección persistente. Su mejoría no elimina la indicación de ofrecer tratamiento de la infección activa.'}
  ];
  const followups=[
    {id:'rosa-follow-a',title:'Anti-VHC a las doce semanas de finalizar',detail:'Esperar que se vuelva negativo para documentar curación.',schedules:{svr:'12wk-post'},credit:0,why:'El anti-VHC puede persistir positivo después de la curación. No es la prueba de respuesta virológica sostenida; se utiliza ARN-VHC.'},
    {id:'rosa-follow-b',title:'ALT al terminar el tratamiento',detail:'Si es normal, considerar documentada la curación.',schedules:{biochemical:'3mo'},credit:0,why:'Una ALT normal no demuestra eliminación del virus. Se necesita una evaluación virológica posterior al tratamiento.'},
    {id:'rosa-follow-c',title:'ARN-VHC a las doce semanas o más de finalizar',detail:'Documentar respuesta virológica sostenida junto con la valoración clínica correspondiente.',schedules:{svr:'12wk-post'},credit:2,why:'El ARN-VHC indetectable a las doce semanas o más de finalizar documenta respuesta virológica sostenida. El seguimiento posterior se ajusta a fibrosis, otras enfermedades y riesgo de reinfección; el anticuerpo puede seguir positivo.'},
    {id:'rosa-follow-d',title:'ARN-VHC únicamente al terminar el tratamiento',detail:'Si es indetectable, omitir la evaluación virológica posterior.',schedules:{'hcv-rna-on-treatment':'3mo'},credit:0,why:'Un ARN indetectable al terminar no sustituye la confirmación posterior de respuesta virológica sostenida. El plazo se cuenta desde la finalización, no desde el inicio del tratamiento.'}
  ];
  const lookup=(xs,id)=>xs.find(x=>x.id===id);
  const dataReady=c=>c.reviewed.length>0;
  const nextStep=d=>Number.isInteger(d?.rosaStep)&&d.rosaStep>=0&&d.rosaStep<=4?d.rosaStep:0;
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
    if(kind==='studies'){d.kftStudiesChoice=id;d.interpretationChoice='hcv-active';}
    if(kind==='plan')Object.assign(d,{planChoice:id,plan:[...choice.plan],planText:''});
    if(kind==='followup')Object.assign(d,{followupChoice:id,followup:Object.keys(choice.schedules),schedules:{...choice.schedules},followupText:''});
    c.assessmentVersion=3;return true;
  }
  function restore(c,d){
    // Old closed consultations use their original decisions and assessment.
    if(!Number.isInteger(d.rosaStep))return;
    const clean=c.decisions;
    Object.assign(clean,{rosaStep:0,sctChoice:'',kftStudiesChoice:'',interpretationChoice:'',planChoice:'',plan:[],followupChoice:'',followup:[],schedules:{}});
    if(!clean.diagnosis)return;
    const wanted=nextStep(d);
    if(wanted===0)return;
    if(!dataReady(c)){clean.rosaStep=1;return;}
    clean.rosaStep=1;choose(c,'sct',d.sctChoice);
    if(wanted<2||!validStep(c,1))return;
    clean.rosaStep=2;choose(c,'studies',d.kftStudiesChoice);
    if(wanted<3||!validStep(c,2))return;
    clean.rosaStep=3;choose(c,'plan',d.planChoice);
    if(wanted<4||!validStep(c,3))return;
    clean.rosaStep=4;choose(c,'followup',d.followupChoice);
  }
  function secondaryExplanation(c){
    let text='';
    if(['profile','cbc'].every(id=>c.reviewed.includes(id)))text+=' En Rosa, el FIB-4 es aproximadamente 1,77. La evaluación de cirrosis para la vía simplificada del VHC no usa de forma automática los mismos umbrales del algoritmo de MASLD.';
    if(c.reviewed.includes('elastography'))text+=' La elastografía revisada de 7,1 kPa es concordante con ausencia de datos de cirrosis en esta evaluación.';
    else text+=' No es obligatorio solicitar elastografía si la evaluación clínica y no invasiva disponible ya permite aplicar la vía simplificada sin cirrosis.';
    return text;
  }
  function assessParts(c,parts,planCritical,followupCritical){
    const d=c.decisions,k=lookup(studies,d.kftStudiesChoice),p=lookup(plans,d.planChoice),f=lookup(followups,d.followupChoice);
    planCritical.splice(0,planCritical.length,...(p.safety?[p.safety]:[]));followupCritical.splice(0);
    for(const [id,title,choice] of [['interpretation','KFT 1 · Decisión diagnóstica',k],['plan','KFT 2 · Conducta terapéutica',p],['followup','Seguimiento y plazos',f]]){
      const part=parts.find(x=>x.id===id);
      // Preserve the existing treatment-safety evidence cap: choosing the right
      // card must never replace reviewing renal function, HBV, HIV and labs.
      const gaps=id==='plan'&&p.credit===3?[...(part.evidenceMissing||[])]:[];
      const score=id==='plan'&&gaps.length?Math.min(choice.credit,part.score):choice.credit;
      const missing=choice.credit===part.max?[]:['Revisar la decisión elegida'];
      if(gaps.length)missing.push(...gaps.map(x=>`Revisar ${x} antes de iniciar el tratamiento`));
      Object.assign(part,{title,score,missing,explanation:choice.why+(id==='interpretation'?secondaryExplanation(c):'')+(gaps.length?' Faltan resultados de seguridad realmente revisados; la selección de esta tarjeta no los sustituye.':''),notes:[],critical:id==='plan'?[...planCritical]:[],evidenceMissing:gaps});
    }
  }
  function feedback(d){
    const s=lookup(sct,d.sctChoice),k=lookup(studies,d.kftStudiesChoice),p=lookup(plans,d.planChoice),f=lookup(followups,d.followupChoice);
    const direction=s?.id==='0'?'Separaste correctamente la replicación viral de la fibrosis: la cantidad de ARN no permite estadificar la fibrosis individual.':'El ARN detectable demuestra infección activa, pero su cantidad no permite reclasificar por sí sola el riesgo individual de cirrosis. No debe usarse para aumentar o reducir de forma concluyente esa estimación.';
    return [
      {title:'SCT · Cómo actualizaste la hipótesis',text:`Elegiste ${s?.title||'sin respuesta'}. ${direction} La orientación docente es 0; no hay un panel experto real ni una nota de concordancia validada. El SCT es formativo y no suma ni resta a la nota /10.`},
      {title:'KFT 1 · Decisión diagnóstica',text:`Elegiste «${k?.title}». ${k?.why}`},
      {title:'KFT 2 · Conducta terapéutica',text:`Elegiste «${p?.title}». ${p?.why}`},
      {title:'Seguimiento · Continuidad de la atención',text:`Elegiste «${f?.title}». ${f?.why}`}
    ];
  }
  function render(c,step,catalog,esc,page){
    const d=c.decisions;
    // Cambia solo la posición visual; SCT conserva su escala ordenada.
    const displayOrder={"rosa-studies-choice":[0,1,2,3],"plan-choice":[0,1,2,3],"followup-choice":[0,1,2,3]};
    const cards=(xs,attr,selected)=>`<div class="quick-choice-grid decision-cards">${(displayOrder[attr]?displayOrder[attr].map(i=>xs[i]):xs).map(x=>`<button type="button" class="quick-choice ${selected===x.id?'selected':''}" data-${attr}="${esc(x.id)}" aria-pressed="${selected===x.id}"><span class="choice-mark">${selected===x.id?'◆':'◇'}</span><span><b>${esc(x.title)}</b>${x.detail?`<small>${esc(x.detail)}</small>`:''}</span></button>`).join('')}</div>`;
    const titles=['¿Qué diagnóstico eliges?','Razonamiento bajo incertidumbre · SCT','KFT 1 · Decisión diagnóstica','KFT 2 · Conducta terapéutica','Seguimiento'];
    let body='';
    if(step===0)body=`<p class="panel-copy">Con la información obtenida en esta consulta, ¿cuál es el diagnóstico más probable de Rosa?</p><label class="clinical-field">Tu diagnóstico<select data-field="diagnosis"><option value="">Elige tu conclusión…</option>${catalog.map(x=>`<option value="${x.id}" ${d.diagnosis===x.id?'selected':''}>${esc(x.title)}</option>`).join('')}</select></label>`;
    else if(!dataReady(c))body='<p class="clinical-note">Primero solicita y revisa el ARN-VHC. No se mostrarán resultados que aún no hayas revisado.</p>';
    else if(step===1)body=`<p class="panel-copy"><b>Hipótesis:</b> Rosa podría presentar cirrosis.</p><p class="panel-copy"><b>Dato que debes ponderar:</b> El ARN-VHC es de 1.300.000 UI/mL.</p><p class="panel-copy">Considerado por sí solo, ¿cómo modifica este resultado tu estimación de que Rosa tenga cirrosis?</p>${cards(sct,'sct-choice',d.sctChoice)}<p class="result-disclaimer">SCT formativo, separado de la nota clínica.</p>`;
    else if(step===2)body=`<p class="panel-copy">¿Qué evaluación necesitas integrar antes de elegir el tratamiento antiviral?</p>${c.reviewed.includes('elastography')?'<p class="panel-copy">La elastografía que ya revisaste informa 7,1 kPa; integra ese resultado.</p>':''}${cards(studies,'rosa-studies-choice',d.kftStudiesChoice)}`;
    else if(step===3)body=`<p class="panel-copy">Rosa quiere comenzar el tratamiento. ¿Cuál es la conducta más apropiada?</p>${cards(plans,'plan-choice',d.planChoice)}`;
    else body=`<p class="panel-copy">¿Qué control permite documentar la respuesta virológica sostenida?</p>${cards(followups,'followup-choice',d.followupChoice)}`;
    return page(`<p class="decision-progress">RESUELVE LA CONSULTA · ${step+1} / 5</p><h3 class="study-title">${titles[step]}</h3>${body}<p class="result-disclaimer">Al continuar se registra tu elección y no podrás cambiarla. Las respuestas y explicaciones se revelan al terminar la consulta.</p>`,`<button class="secondary-button" data-tab="results">Repasar resultados</button><button class="primary-button" data-action="next-decision" ${validStep(c,step)?'':'disabled'}>${['Continuar con SCT →','Decisión diagnóstica →','Elegir tratamiento →','Elegir seguimiento →','Terminar consulta →'][step]}</button>`,'decision-content');
  }
  return {ID,isRosa,sct,studies,plans,followups,lookup,dataReady,nextStep,validStep,ready,choose,restore,assessParts,feedback,render};
})();
