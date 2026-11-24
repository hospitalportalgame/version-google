/* HOSPITAL PORTAL · Ernesto: cinco decisiones aprobadas. SCT sin nota psicométrica. */
window.HepatoDay1Modules['ernesto-reasoning.mjs']=(()=>{
  const ID='dili-cholestatic-v1-reasoning-v2',isErnesto=c=>c?.id===ID;
  const sct=[['-2','−2 · Mucho menos probable'],['-1','−1 · Menos probable'],['0','0 · No modifica su probabilidad'],['1','+1 · Más probable'],['2','+2 · Mucho más probable']].map(([id,title])=>({id,title}));
  const studies=[
    {id:'ernesto-study-a',title:'Lesión mixta porque ALT y FA están elevadas',detail:'Clasificarla como mixta por la elevación simultánea de ambas enzimas.',credit:0,why:'La elevación simultánea de ALT y FA no define un patrón mixto. Se utiliza su relación normalizada por los límites superiores del laboratorio: aquí R es aproximadamente 1,05 y el patrón es colestásico.'},
    {id:'ernesto-study-b',title:'Lesión colestásica necesariamente leve',detail:'Considerarla leve porque R es menor de 2.',credit:0,why:'R clasifica el patrón, no la gravedad. Un valor bajo no permite ignorar bilirrubina, INR, estado mental ni evolución clínica.'},
    {id:'ernesto-study-c',title:'Lesión colestásica con causa farmacológica confirmada por R',detail:'Usar el resultado para confirmar que el antibiótico es la causa.',credit:0,why:'El patrón colestásico no demuestra causalidad farmacológica. La DILI sigue siendo una hipótesis que exige integrar cronología y exclusiones, sin asumir certeza por R.'},
    {id:'ernesto-study-d',title:'Patrón colestásico; causalidad y gravedad por separado',detail:'Integrar cronología y exclusiones para causalidad; valorar evolución, bilirrubina, INR y estado clínico para gravedad.',credit:1,why:'R = (94/40) ÷ (290/130) es aproximadamente 1,05, compatible con patrón colestásico. No demuestra etiología ni gravedad. Hay que integrar cronología, exclusiones y evolución. FIB-4 no sirve para estadificar esta lesión aguda.'}
  ];
  const plans=[
    {id:'ernesto-plan-a',title:'Documentar la sospecha y evitar reexposición',detail:'Revisar otras exposiciones, ofrecer manejo sintomático del prurito y mantener vigilancia estrecha.',plan:['avoid-drug','review-meds','pruritus','alarm-network'],credit:3,why:'Aunque el antibiótico ya terminó, debe documentarse la sospecha y evitar reexposición al medicamento implicado. Revisa fármacos, suplementos y otras exposiciones, atiende el prurito y conserva un plan de vigilancia. No se debe fingir que se está retirando un fármaco que ya no toma.'},
    {id:'ernesto-plan-b',title:'Tratar el prurito y vigilar sin registrar el antibiótico',detail:'No documentarlo como sospechoso porque ya fue suspendido.',plan:['pruritus','monitor-specific','alarm-network'],credit:2,why:'Crédito parcial: atiende el síntoma y mantiene vigilancia, pero omite documentar el agente sospechoso y prevenir su reexposición. Haber terminado el tratamiento no elimina esas tareas preventivas.'},
    {id:'ernesto-plan-c',title:'Corticoides de rutina para toda DILI colestásica',detail:'Iniciarlos para acelerar la recuperación sin otra indicación específica.',plan:['steroids'],credit:0,safety:'Corticoides sin una indicación específica respaldada por este escenario.',why:'No se recomiendan corticoides de rutina para toda DILI colestásica. Su uso requiere una indicación particular que no está documentada aquí.'},
    {id:'ernesto-plan-d',title:'Reintroducir una dosis para confirmar causalidad',detail:'Administrar el antibiótico bajo observación antes de recomendar evitarlo.',plan:['antibiotic'],credit:0,safety:'Reexposición deliberada a amoxicilina/clavulánico sospechoso: riesgo de recurrencia y lesión más rápida o grave.',why:'No se debe provocar una reexposición para confirmar esta sospecha. La asociación se evalúa con cronología, exclusiones y evolución sin someter al paciente a ese riesgo.'}
  ];
  const followups=[
    {id:'ernesto-follow-a',title:'Solo ALT en un mes',detail:'Mantener el plan si ALT disminuye, aunque aumente la ictericia.',schedules:{biochemical:'1mo'},credit:0,safety:'Esperar un mes y guiarse solo por ALT puede retrasar la detección de deterioro.',why:'La mejoría de ALT no garantiza seguridad si empeoran ictericia, INR o estado clínico. En este escenario la ictericia reciente requiere control más precoz y evaluación de gravedad por separado.'},
    {id:'ernesto-follow-b',title:'Clínica, bilirrubina e INR en 48–72 horas',detail:'Adelantar valoración y reconsiderar el ámbito de atención ante deterioro, con acceso claro a reevaluación.',schedules:{'close-inr':'48-72h'},credit:2,why:'Con su estabilidad actual y acceso a control, se acuerda reevaluación clínica y analítica en 48–72 horas, incluyendo bilirrubina e INR. Confusión, sangrado, INR en ascenso, incapacidad para alimentarse o deterioro requieren valoración anticipada y reconsiderar el ámbito de atención. Este plazo corresponde al caso; no es una regla universal para toda DILI. La valoración hospitalaria es razonable si cambia la gravedad o no se garantiza seguimiento seguro.'},
    {id:'ernesto-follow-c',title:'Bilirrubina semanal e INR solo si hay sangrado',detail:'Omitir controles de INR mientras no aparezca sangrado.',schedules:{'close-inr':'2wk'},credit:0,safety:'Reservar INR para cuando aparezca sangrado retrasa la valoración de síntesis y gravedad.',why:'No debe esperarse a sangrado para revisar INR. Se necesitan controles precoces de síntesis y síntomas; la bilirrubina aislada no sustituye esa evaluación.'},
    {id:'ernesto-follow-d',title:'Esperar tres meses para repetir el perfil',detail:'Diferir controles porque la resolución de una lesión colestásica puede ser lenta.',schedules:{'close-inr':'3mo'},credit:0,safety:'Demorar tres meses el control de una ictericia reciente sin vigilancia precoz.',why:'La recuperación lenta de la colestasis no justifica esperar tres meses para detectar deterioro. Se adapta el seguimiento a gravedad y evolución actuales.'}
  ];
  const lookup=(xs,id)=>xs.find(x=>x.id===id);
  const dataReady=c=>c.reviewed.length>0;
  const nextStep=d=>Number.isInteger(d?.ernestoStep)&&d.ernestoStep>=0&&d.ernestoStep<=4?d.ernestoStep:0;
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
    if(kind==='studies'){d.kftStudiesChoice=id;d.interpretationChoice='dili-pattern';}
    if(kind==='plan')Object.assign(d,{planChoice:id,plan:[...choice.plan],planText:''});
    if(kind==='followup')Object.assign(d,{followupChoice:id,followup:Object.keys(choice.schedules),schedules:{...choice.schedules},followupText:''});
    c.assessmentVersion=3;return true;
  }
  function restore(c,d){
    // Old closed consultations use their original decisions and assessment.
    if(!Number.isInteger(d.ernestoStep))return;
    const clean=c.decisions;
    Object.assign(clean,{ernestoStep:0,sctChoice:'',kftStudiesChoice:'',interpretationChoice:'',planChoice:'',plan:[],followupChoice:'',followup:[],schedules:{}});
    if(!clean.diagnosis)return;
    const wanted=nextStep(d);
    if(wanted===0)return;
    if(!dataReady(c)){clean.ernestoStep=1;return;}
    clean.ernestoStep=1;choose(c,'sct',d.sctChoice);
    if(wanted<2||!validStep(c,1))return;
    clean.ernestoStep=2;choose(c,'studies',d.kftStudiesChoice);
    if(wanted<3||!validStep(c,2))return;
    clean.ernestoStep=3;choose(c,'plan',d.planChoice);
    if(wanted<4||!validStep(c,3))return;
    clean.ernestoStep=4;choose(c,'followup',d.followupChoice);
  }
  function secondaryExplanation(c){
    const needed=['hbv','hcv_rna','acute_virus','autoimmune','ultrasound'];
    const complete=needed.every(id=>c.reviewed.includes(id));
    return complete?' Las exclusiones etiológicas que revisaste no identifican una alternativa en esta evaluación inicial; la sospecha sigue siendo probable, no una certeza por el cálculo.':' Aún falta integrar parte de las exclusiones etiológicas; no se presupone el resultado de estudios no revisados.';
  }
  function assessParts(c,parts,planCritical,followupCritical){
    const d=c.decisions,k=lookup(studies,d.kftStudiesChoice),p=lookup(plans,d.planChoice),f=lookup(followups,d.followupChoice);
    planCritical.splice(0,planCritical.length,...(p.safety?[p.safety]:[]));
    followupCritical.splice(0,followupCritical.length,...(f.safety?[f.safety]:[]));
    const correctR=(94/40)/(290/130);
    for(const [id,title,choice] of [['interpretation','KFT 1 · Patrón, causalidad y gravedad',k],['plan','KFT 2 · Conducta terapéutica',p],['followup','Seguimiento y plazos',f]]){
      const part=parts.find(x=>x.id===id),missing=choice.credit===part.max?[]:['Revisar la decisión elegida'],notes=[];
      let score=choice.credit;
      if(id==='interpretation'&&Number.isFinite(c.calculations.r)&&Math.abs(c.calculations.r-correctR)>.02){
        score=Math.max(0,score-.5);missing.push('Comprobar el cálculo de R y los límites del laboratorio');
        notes.push('El cociente R que calculaste no coincide con los datos del informe; con esos límites es aproximadamente 1,05.');
      }
      Object.assign(part,{title,score,missing,explanation:choice.why+(id==='interpretation'?secondaryExplanation(c):''),notes,critical:id==='plan'?[...planCritical]:id==='followup'?[...followupCritical]:[],evidenceMissing:[]});
    }
  }
  function feedback(d){
    const s=lookup(sct,d.sctChoice),k=lookup(studies,d.kftStudiesChoice),p=lookup(plans,d.planChoice),f=lookup(followups,d.followupChoice);
    const direction=Number(s?.id)>0?'Reconociste que esta cronología es compatible con la presentación conocida de lesión por amoxicilina/clavulánico y apoya la sospecha.':'La aparición después de finalizar amoxicilina/clavulánico es compatible con este tipo de lesión. No debe descartarse el medicamento solo porque ya terminó.';
    return [
      {title:'SCT · Cómo actualizaste la hipótesis',text:`Elegiste ${s?.title||'sin respuesta'}. ${direction} No demuestra causalidad por sí sola. La orientación docente es positiva, con +1 como referencia; la intensidad se discute sin panel experto real ni puntuación psicométrica. El SCT es formativo y separado de /10.`},
      {title:'KFT 1 · Decisión diagnóstica',text:`Elegiste «${k?.title}». ${k?.why}`},
      {title:'KFT 2 · Conducta terapéutica',text:`Elegiste «${p?.title}». ${p?.why}`},
      {title:'Seguimiento · Continuidad de la atención',text:`Elegiste «${f?.title}». ${f?.why}`}
    ];
  }
  function render(c,step,catalog,esc,page){
    const d=c.decisions;
    // Cambia solo la posición visual; SCT conserva su escala ordenada.
    const displayOrder={"ernesto-studies-choice":[0,1,2,3],"plan-choice":[0,1,2,3],"followup-choice":[0,1,2,3]};
    const cards=(xs,attr,selected)=>`<div class="quick-choice-grid decision-cards">${(displayOrder[attr]?displayOrder[attr].map(i=>xs[i]):xs).map(x=>`<button type="button" class="quick-choice ${selected===x.id?'selected':''}" data-${attr}="${esc(x.id)}" aria-pressed="${selected===x.id}"><span class="choice-mark">${selected===x.id?'◆':'◇'}</span><span><b>${esc(x.title)}</b>${x.detail?`<small>${esc(x.detail)}</small>`:''}</span></button>`).join('')}</div>`;
    const titles=['¿Qué diagnóstico eliges?','Razonamiento bajo incertidumbre · SCT','KFT 1 · Decisión diagnóstica','KFT 2 · Conducta terapéutica','Seguimiento'];
    let body='';
    if(step===0)body=`<p class="panel-copy">Con la información obtenida en esta consulta, ¿cuál es el diagnóstico más probable de Ernesto?</p><label class="clinical-field">Tu diagnóstico<select data-field="diagnosis"><option value="">Elige tu conclusión…</option>${catalog.map(x=>`<option value="${x.id}" ${d.diagnosis===x.id?'selected':''}>${esc(x.title)}</option>`).join('')}</select></label>`;
    else if(!dataReady(c))body='<p class="clinical-note">Primero solicita y revisa el perfil hepático. No se mostrarán resultados que aún no hayas revisado.</p>';
    else if(step===1)body=`<p class="panel-copy"><b>Hipótesis:</b> La exposición a amoxicilina/clavulánico podría explicar la lesión hepática de Ernesto.</p><p class="panel-copy"><b>Dato que debes ponderar:</b> El perfil hepático previo era normal y el prurito y la ictericia aparecieron aproximadamente dos semanas después de finalizar el antibiótico.</p><p class="panel-copy">¿Cómo modifica esta cronología la probabilidad de la hipótesis?</p>${cards(sct,'sct-choice',d.sctChoice)}<p class="result-disclaimer">SCT formativo, separado de la nota clínica.</p>`;
    else if(step===2)body=`<p class="panel-copy">Con los límites del laboratorio, R = (94/40) ÷ (290/130) ≈ 1,05. ¿Qué conclusión está respaldada?</p>${cards(studies,'ernesto-studies-choice',d.kftStudiesChoice)}`;
    else if(step===3)body=`<p class="panel-copy">Ernesto ya no está tomando el antibiótico. ¿Qué conducta propones hoy?</p>${cards(plans,'plan-choice',d.planChoice)}`;
    else body=`<p class="panel-copy">Con su estabilidad actual y acceso a reevaluación, ¿qué seguimiento acuerdas?</p>${cards(followups,'followup-choice',d.followupChoice)}`;
    return page(`<p class="decision-progress">RESUELVE LA CONSULTA · ${step+1} / 5</p><h3 class="study-title">${titles[step]}</h3>${body}<p class="result-disclaimer">Al continuar se registra tu elección y no podrás cambiarla. Las respuestas y explicaciones se revelan al terminar la consulta.</p>`,`<button class="secondary-button" data-tab="results">Repasar resultados</button><button class="primary-button" data-action="next-decision" ${validStep(c,step)?'':'disabled'}>${['Continuar con SCT →','Decisión diagnóstica →','Elegir tratamiento →','Elegir seguimiento →','Terminar consulta →'][step]}</button>`,'decision-content');
  }
  return {ID,isErnesto,sct,studies,plans,followups,lookup,dataReady,nextStep,validStep,ready,choose,restore,assessParts,feedback,render};
})();
