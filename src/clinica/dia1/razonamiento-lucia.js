/* HOSPITAL PORTAL · Lucía: cinco decisiones aprobadas. SCT sin nota psicométrica. */
window.HepatoDay1Modules['lucia-reasoning.mjs']=(()=>{
  const ID='pbc-v1-reasoning-v2',isLucia=c=>c?.id===ID;
  const sct=[['-2','−2 · Mucho menos probable'],['-1','−1 · Menos probable'],['0','0 · No modifica su probabilidad'],['1','+1 · Más probable'],['2','+2 · Mucho más probable']].map(([id,title])=>({id,title}));
  const studies=[
    {id:'lucia-study-a',title:'Diagnóstico con el conjunto disponible y evaluación de fibrosis',detail:'Reservar biopsia para dudas, discordancias o sospecha de enfermedad asociada.',credit:1,why:'La colestasis persistente, el AMA-M2 positivo y la evaluación que no muestra obstrucción permiten establecer el diagnóstico en este patrón típico. La biopsia no es rutinaria, pero puede estar indicada ante dudas, discordancias o sospecha de enfermedad asociada.'},
    {id:'lucia-study-b',title:'Biopsia obligatoria antes de tratar',detail:'Exigirla aunque el patrón clínico y serológico sea típico.',credit:0,why:'No se exige biopsia antes de tratar una CBP con presentación típica y criterios suficientes. Debe responder a una pregunta clínica adicional.'},
    {id:'lucia-study-c',title:'Repetir AMA hasta comprobar que aumentan',detail:'Usar el aumento del título como requisito para confirmar enfermedad activa.',credit:0,why:'Los títulos seriados de AMA no son la medida de actividad ni un requisito para iniciar tratamiento. El diagnóstico integra colestasis y serología en su contexto.'},
    {id:'lucia-study-d',title:'CPRE de rutina como siguiente estudio',detail:'Solicitarla aunque no haya una sospecha obstructiva concreta.',credit:0,why:'La CPRE no es el siguiente estudio rutinario sin una sospecha obstructiva o indicación terapéutica concreta. Una ecografía sin obstrucción se interpreta con el contexto y no justifica por sí sola un procedimiento invasivo.'}
  ];
  const plans=[
    {id:'lucia-plan-a',title:'Solo UDCA y esperar antes de tratar el prurito',detail:'Valorar primero su respuesta y atender después el síntoma.',plan:['udca','alarm-network'],credit:2,why:'Crédito parcial: iniciar UDCA es adecuado, pero deja sin atender el prurito que altera el sueño. El alivio del síntoma requiere un plan propio y no debe aplazarse a la espera de la respuesta bioquímica.'},
    {id:'lucia-plan-b',title:'Colestiramina y posponer UDCA',detail:'Tratar el prurito y esperar a ver si disminuye la fosfatasa alcalina antes de tratar la enfermedad.',plan:['pruritus','alarm-network'],credit:0,why:'Atender el prurito es necesario, pero no sustituye UDCA. La respuesta sintomática a colestiramina no evalúa ni trata por sí sola el curso de la enfermedad.'},
    {id:'lucia-plan-c',title:'Corticoides por AMA positivo y tiroiditis',detail:'Asumir superposición con hepatitis autoinmune e iniciar inmunosupresión.',plan:['steroids'],credit:0,safety:'Inmunosupresión sin datos suficientes que respalden superposición con hepatitis autoinmune.',why:'AMA positivo y tiroiditis no bastan para diagnosticar superposición. En Lucía no hay un componente hepatítico intenso ni IgG elevada que justifique asumirla e iniciar corticoides.'},
    {id:'lucia-plan-d',title:'UDCA y un plan específico para el prurito',detail:'UDCA 13–15 mg/kg/día; si se usa colestiramina, separar su administración de UDCA, levotiroxina y otros medicamentos.',plan:['udca','pruritus','review-meds','alarm-network'],credit:3,why:'Se trata la enfermedad con UDCA y se atiende por separado el prurito. No se calcula una dosis total sin conocer el peso. Si se usa colestiramina, hay que organizar intervalos apropiados respecto de UDCA, levotiroxina y otros medicamentos, porque puede reducir su absorción. La mejoría del prurito no demuestra respuesta hepática.'}
  ];
  const followups=[
    {id:'lucia-follow-a',title:'Primera revisión recién a los doce meses',detail:'Esperar al año porque antes no puede evaluarse ningún aspecto útil del tratamiento.',schedules:{biochemical:'12mo'},credit:0,why:'La evaluación formal de respuesta a los doce meses no significa esperar un año para el primer control. Antes se revisan tolerancia, adherencia, síntomas y evolución bioquímica.'},
    {id:'lucia-follow-b',title:'Control inicial y respuesta formal a los doce meses',detail:'Revisar tolerancia, adherencia, prurito y bioquímica alrededor de tres meses; individualizar riesgo y controles posteriores.',schedules:{biochemical:'3mo'},credit:2,why:'Se separa el control inicial de la evaluación formal de respuesta a UDCA a los doce meses. FA y bilirrubina son centrales; se integran fibrosis, necesidades de salud ósea y otros riesgos. El prurito que sigue afectando el sueño merece contacto y ajuste más tempranos, sin esperar al control bioquímico programado.'},
    {id:'lucia-follow-c',title:'Ajustar mediante títulos seriados de AMA',detail:'Guiarse principalmente por AMA aunque FA y bilirrubina no mejoren.',schedules:{biochemical:'3mo'},credit:0,why:'Los títulos de AMA no sustituyen la respuesta bioquímica ni guían por sí solos los ajustes. Se evalúan FA, bilirrubina, adherencia, dosis y riesgo clínico.'},
    {id:'lucia-follow-d',title:'Seguimiento solo hasta que desaparezca el prurito',detail:'Si duerme bien, considerar controlada la enfermedad hepática.',schedules:{'symptom-change':'as-needed'},credit:0,why:'El alivio del prurito no demuestra control de la enfermedad ni elimina la necesidad de seguimiento bioquímico y valoración de riesgo.'}
  ];
  const lookup=(xs,id)=>xs.find(x=>x.id===id);
  const dataReady=c=>c.reviewed.length>0;
  const nextStep=d=>Number.isInteger(d?.luciaStep)&&d.luciaStep>=0&&d.luciaStep<=4?d.luciaStep:0;
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
    if(kind==='studies'){d.kftStudiesChoice=id;d.interpretationChoice='pbc-integrated';}
    if(kind==='plan')Object.assign(d,{planChoice:id,plan:[...choice.plan],planText:''});
    if(kind==='followup')Object.assign(d,{followupChoice:id,followup:Object.keys(choice.schedules),schedules:{...choice.schedules},followupText:''});
    c.assessmentVersion=3;return true;
  }
  function restore(c,d){
    // Old closed consultations use their original decisions and assessment.
    if(!Number.isInteger(d.luciaStep))return;
    const clean=c.decisions;
    Object.assign(clean,{luciaStep:0,sctChoice:'',kftStudiesChoice:'',interpretationChoice:'',planChoice:'',plan:[],followupChoice:'',followup:[],schedules:{}});
    if(!clean.diagnosis)return;
    const wanted=nextStep(d);
    if(wanted===0)return;
    if(!dataReady(c)){clean.luciaStep=1;return;}
    clean.luciaStep=1;choose(c,'sct',d.sctChoice);
    if(wanted<2||!validStep(c,1))return;
    clean.luciaStep=2;choose(c,'studies',d.kftStudiesChoice);
    if(wanted<3||!validStep(c,2))return;
    clean.luciaStep=3;choose(c,'plan',d.planChoice);
    if(wanted<4||!validStep(c,3))return;
    clean.luciaStep=4;choose(c,'followup',d.followupChoice);
  }
  function secondaryExplanation(c){
    return c.reviewed.includes('elastography')?' La elastografía revisada de 6,5 kPa se integra a la valoración de fibrosis; no es necesario repetirla de rutina.':' La evaluación de fibrosis se organiza por separado; establecer el diagnóstico no significa asignar un estadio histológico.';
  }
  function assessParts(c,parts,planCritical,followupCritical){
    const d=c.decisions,k=lookup(studies,d.kftStudiesChoice),p=lookup(plans,d.planChoice),f=lookup(followups,d.followupChoice);
    planCritical.splice(0,planCritical.length,...(p.safety?[p.safety]:[]));followupCritical.splice(0,followupCritical.length,...(f.safety?[f.safety]:[]));
    for(const [id,title,choice] of [['interpretation','KFT 1 · Decisión diagnóstica',k],['plan','KFT 2 · Conducta terapéutica',p],['followup','Seguimiento y plazos',f]]){
      const part=parts.find(x=>x.id===id);
      // Preserve the existing treatment-safety evidence cap: choosing the right
      // card must never replace reviewing the profile, autoimmunity and biliary imaging.
      const gaps=id==='plan'&&p.plan.includes('udca')?[...(part.evidenceMissing||[])]:[];
      const score=id==='plan'&&gaps.length?Math.min(choice.credit,part.score):choice.credit;
      const missing=choice.credit===part.max?[]:['Revisar la decisión elegida'];
      if(gaps.length)missing.push(...gaps.map(x=>`Revisar ${x} antes de iniciar el tratamiento`));
      Object.assign(part,{title,score,missing,explanation:choice.why+(id==='interpretation'?secondaryExplanation(c):'')+(gaps.length?' Faltan resultados de seguridad realmente revisados; la selección de esta tarjeta no los sustituye.':''),notes:[],critical:id==='plan'?[...planCritical]:id==='followup'?[...followupCritical]:[],evidenceMissing:gaps});
    }
  }
  function feedback(d){
    const s=lookup(sct,d.sctChoice),k=lookup(studies,d.kftStudiesChoice),p=lookup(plans,d.planChoice),f=lookup(followups,d.followupChoice);
    const direction=Number(s?.id)<0?'Reconociste que una ecografía sin dilatación, cálculos obstructivos ni masas reduce la sospecha de obstrucción biliar extrahepática.':'El resultado ecográfico reduce, en vez de aumentar, la sospecha de obstrucción biliar extrahepática en este contexto.';
    return [
      {title:'SCT · Cómo actualizaste la hipótesis',text:`Elegiste ${s?.title||'sin respuesta'}. ${direction} No excluye toda obstrucción en cualquier circunstancia: síntomas nuevos o discordancias pueden exigir ampliar estudios. No se puntúa la intensidad −1 frente a −2 sin un panel experto real. El SCT es formativo y separado de /10.`},
      {title:'KFT 1 · Decisión diagnóstica',text:`Elegiste «${k?.title}». ${k?.why}`},
      {title:'KFT 2 · Conducta terapéutica',text:`Elegiste «${p?.title}». ${p?.why}`},
      {title:'Seguimiento · Continuidad de la atención',text:`Elegiste «${f?.title}». ${f?.why}`}
    ];
  }
  function render(c,step,catalog,esc,page){
    const d=c.decisions;
    // Cambia solo la posición visual; SCT conserva su escala ordenada.
    const displayOrder={"lucia-studies-choice":[0,1,2,3],"plan-choice":[0,1,2,3],"followup-choice":[0,1,2,3]};
    const cards=(xs,attr,selected)=>`<div class="quick-choice-grid decision-cards">${(displayOrder[attr]?displayOrder[attr].map(i=>xs[i]):xs).map(x=>`<button type="button" class="quick-choice ${selected===x.id?'selected':''}" data-${attr}="${esc(x.id)}" aria-pressed="${selected===x.id}"><span class="choice-mark">${selected===x.id?'◆':'◇'}</span><span><b>${esc(x.title)}</b>${x.detail?`<small>${esc(x.detail)}</small>`:''}</span></button>`).join('')}</div>`;
    const titles=['¿Qué diagnóstico eliges?','Razonamiento bajo incertidumbre · SCT','KFT 1 · Decisión diagnóstica','KFT 2 · Conducta terapéutica','Seguimiento'];
    let body='';
    if(step===0)body=`<p class="panel-copy">Con la información obtenida en esta consulta, ¿cuál es el diagnóstico más probable de Lucía?</p><label class="clinical-field">Tu diagnóstico<select data-field="diagnosis"><option value="">Elige tu conclusión…</option>${catalog.map(x=>`<option value="${x.id}" ${d.diagnosis===x.id?'selected':''}>${esc(x.title)}</option>`).join('')}</select></label>`;
    else if(!dataReady(c))body='<p class="clinical-note">Primero solicita y revisa el perfil hepático, la autoinmunidad y la ecografía abdominal. No se mostrarán resultados que aún no hayas revisado.</p>';
    else if(step===1)body=`<p class="panel-copy"><b>Hipótesis:</b> Una obstrucción biliar extrahepática podría explicar la colestasis de Lucía.</p><p class="panel-copy"><b>Dato que debes ponderar:</b> La ecografía muestra vías biliares no dilatadas, sin cálculos obstructivos ni masas.</p><p class="panel-copy">¿Cómo modifica este resultado la probabilidad de la hipótesis?</p>${cards(sct,'sct-choice',d.sctChoice)}<p class="result-disclaimer">SCT formativo, separado de la nota clínica.</p>`;
    else if(step===2)body=`<p class="panel-copy">Con colestasis persistente, AMA-M2 positivo y ausencia de obstrucción en la evaluación disponible, ¿cuál es el siguiente paso más apropiado?</p>${c.reviewed.includes('elastography')?'<p class="panel-copy">La elastografía que ya revisaste informa 6,5 kPa; integra ese resultado.</p>':''}${cards(studies,'lucia-studies-choice',d.kftStudiesChoice)}`;
    else if(step===3)body=`<p class="panel-copy">Lucía dice: «Lo que más necesito es volver a dormir». ¿Qué tratamiento inicial propones?</p>${cards(plans,'plan-choice',d.planChoice)}`;
    else body=`<p class="panel-copy">¿Cómo organizas el seguimiento después de iniciar el tratamiento?</p>${cards(followups,'followup-choice',d.followupChoice)}`;
    return page(`<p class="decision-progress">RESUELVE LA CONSULTA · ${step+1} / 5</p><h3 class="study-title">${titles[step]}</h3>${body}<p class="result-disclaimer">Al continuar se registra tu elección y no podrás cambiarla. Las respuestas y explicaciones se revelan al terminar la consulta.</p>`,`<button class="secondary-button" data-tab="results">Repasar resultados</button><button class="primary-button" data-action="next-decision" ${validStep(c,step)?'':'disabled'}>${['Continuar con SCT →','Decisión diagnóstica →','Elegir tratamiento →','Elegir seguimiento →','Terminar consulta →'][step]}</button>`,'decision-content');
  }
  return {ID,isLucia,sct,studies,plans,followups,lookup,dataReady,nextStep,validStep,ready,choose,restore,assessParts,feedback,render};
})();
