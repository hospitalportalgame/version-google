/* HOSPITAL PORTAL · Andrés: cinco decisiones aprobadas. SCT sin nota psicométrica. */
window.HepatoDay1Modules['andres-reasoning.mjs']=(()=>{
  const ID='hemochromatosis-v1-reasoning-v2',isAndres=c=>c?.id===ID;
  const sct=[['-2','−2 · Mucho menos probable'],['-1','−1 · Menos probable'],['0','0 · No modifica su probabilidad'],['1','+1 · Más probable'],['2','+2 · Mucho más probable']].map(([id,title])=>({id,title}));
  const studies=[
    {id:'andres-study-a',title:'Biopsia obligatoria por ferritina fuera de rango',detail:'Solicitarla aunque la evaluación no invasiva sea concordante.',credit:0,why:'Superar el límite normal de ferritina no obliga por sí solo a una biopsia. Puede considerarse posteriormente ante una pregunta no resuelta, discordancias o incertidumbre, pero no como requisito automático.'},
    {id:'andres-study-b',title:'Evaluar fibrosis y manifestaciones extrahepáticas',detail:'Integrar los estudios disponibles y reservar pruebas adicionales para preguntas concretas.',credit:1,why:'El genotipo y la sobrecarga bioquímica son concordantes; ahora debe evaluarse fibrosis y posible daño extrahepático. La cuantificación de hierro por RM no es un requisito universal para reconocer esta etiología en un homocigoto C282Y con este patrón.'},
    {id:'andres-study-c',title:'Considerar confirmada cirrosis',detail:'Asumirla por hepatomegalia e hiperferritinemia e iniciar su manejo sin otra valoración.',credit:0,why:'Ni la hepatomegalia ni la ferritina elevada establecen cirrosis. Se requiere integrar la evaluación de fibrosis y los demás hallazgos.'},
    {id:'andres-study-d',title:'Omitir la evaluación de fibrosis',detail:'La ferritina menor de 1.000 ng/mL permite prescindir de ella.',credit:0,why:'Una ferritina menor de 1.000 ng/mL puede reducir la preocupación en ciertos contextos, pero no cancela la valoración de fibrosis. Andrés presenta además aminotransferasas elevadas.'}
  ];
  const plans=[
    {id:'andres-plan-a',title:'Flebotomías supervisadas e individualizadas',detail:'Ajustar volumen y frecuencia según tolerancia, hemoglobina y evolución de la ferritina.',plan:['phlebotomy','stage-fibrosis','nutrition','alarm-network'],credit:3,why:'Con sobrecarga documentada y hemoglobina adecuada, la flebotomía es el tratamiento habitual. Se individualizan volumen y frecuencia y se integra la evaluación de fibrosis y otros órganos. La dieta no reemplaza la depleción terapéutica; no se promete que la artropatía desaparezca con la normalización del hierro.'},
    {id:'andres-plan-b',title:'Restricciones dietéticas como único tratamiento',detail:'Decidir sobre flebotomías únicamente si no mejora el cansancio.',plan:['nutrition','stage-fibrosis'],credit:0,why:'La dieta no sustituye la extracción terapéutica del exceso de hierro. La decisión no debe depender únicamente del cansancio ni de su respuesta a cambios alimentarios.'},
    {id:'andres-plan-c',title:'Quelación como primera opción aunque tolere flebotomías',detail:'Elegir quelantes para evitar las extracciones.',plan:['iron-chelation'],credit:0,safety:'Quelación sin una indicación que justifique preferirla a flebotomías: añade riesgos y controles innecesarios en este escenario.',why:'La quelación se reserva para situaciones seleccionadas, como imposibilidad o intolerancia a alternativas apropiadas. No es la primera elección habitual de este paciente que puede tolerar flebotomías.'},
    {id:'andres-plan-d',title:'Esperar cirrosis o daño cardíaco antes de reducir hierro',detail:'Mantener observación mientras no se demuestre daño orgánico avanzado.',plan:['monitor-specific','stage-fibrosis'],credit:0,why:'No debe esperarse a daño avanzado para tratar la sobrecarga. La reducción del hierro busca prevenir complicaciones y se acompaña de la evaluación de órganos afectados.'}
  ];
  const followups=[
    {id:'andres-follow-a',title:'Perseguir la normalización de la saturación',detail:'Controlar hemoglobina y mantener flebotomías intensivas hasta normalizar saturación, aunque la ferritina ya sea baja.',schedules:{'iron-monitor':'2wk'},credit:0,safety:'Mantener flebotomías intensivas con ferritina baja para normalizar saturación puede provocar ferropenia.',why:'La saturación puede permanecer elevada y no debe perseguirse su normalización a costa de provocar ferropenia. Se utilizan ferritina, hemoglobina y tolerancia para ajustar la depleción y el mantenimiento.'},
    {id:'andres-follow-b',title:'Ferritina periódica y hemoglobina solo si hay síntomas',detail:'Ajustar extracciones por ferritina y reservar hemoglobina para sospecha sintomática de anemia.',schedules:{'iron-monitor':'1mo'},credit:0,safety:'Omitir el control de hemoglobina antes de las flebotomías compromete la seguridad del tratamiento.',why:'La hemoglobina debe comprobarse antes de cada sesión; los síntomas pueden aparecer después de una caída relevante. La ferritina se controla periódicamente y no sustituye esa comprobación de seguridad.'},
    {id:'andres-follow-c',title:'Suspender definitivamente al llegar al objetivo',detail:'No controlar reacumulación y estudiar familiares solo si presentan síntomas.',schedules:{none:'as-needed'},credit:0,why:'Al alcanzar el objetivo se pasa a mantenimiento individualizado y se vigila reacumulación, en lugar de dar un alta definitiva. La evaluación de familiares adultos de primer grado no depende de que desarrollen síntomas.'},
    {id:'andres-follow-d',title:'Seguridad por sesión, ferritina periódica y mantenimiento',detail:'Hemoglobina antes de cada flebotomía, ajuste o pausa según seguridad y evaluación de familiares adultos de primer grado.',schedules:{'iron-monitor':'2wk','family-screen':'1mo'},credit:2,why:'Se comprueba hemoglobina antes de cada sesión y ferritina periódicamente, ajustando o pausando por seguridad. La meta orientativa de ferritina es alrededor de 50 ng/mL en inducción, evitando ferropenia, y habitualmente 50–100 ng/mL en mantenimiento, individualizando tolerancia. Hemoglobina y ferritina no requieren idéntica frecuencia. Se ofrece evaluación a familiares adultos de primer grado y se individualiza vigilancia de hepatocarcinoma según fibrosis, no por el genotipo aislado.'}
  ];
  const lookup=(xs,id)=>xs.find(x=>x.id===id);
  const dataReady=c=>c.reviewed.length>0;
  const nextStep=d=>Number.isInteger(d?.andresStep)&&d.andresStep>=0&&d.andresStep<=4?d.andresStep:0;
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
    if(kind==='studies'){d.kftStudiesChoice=id;d.interpretationChoice='iron-integrated';}
    if(kind==='plan')Object.assign(d,{planChoice:id,plan:[...choice.plan],planText:''});
    if(kind==='followup')Object.assign(d,{followupChoice:id,followup:Object.keys(choice.schedules),schedules:{...choice.schedules},followupText:''});
    c.assessmentVersion=3;return true;
  }
  function restore(c,d){
    // Old closed consultations use their original decisions and assessment.
    if(!Number.isInteger(d.andresStep))return;
    const clean=c.decisions;
    Object.assign(clean,{andresStep:0,sctChoice:'',kftStudiesChoice:'',interpretationChoice:'',planChoice:'',plan:[],followupChoice:'',followup:[],schedules:{}});
    if(!clean.diagnosis)return;
    const wanted=nextStep(d);
    if(wanted===0)return;
    if(!dataReady(c)){clean.andresStep=1;return;}
    clean.andresStep=1;choose(c,'sct',d.sctChoice);
    if(wanted<2||!validStep(c,1))return;
    clean.andresStep=2;choose(c,'studies',d.kftStudiesChoice);
    if(wanted<3||!validStep(c,2))return;
    clean.andresStep=3;choose(c,'plan',d.planChoice);
    if(wanted<4||!validStep(c,3))return;
    clean.andresStep=4;choose(c,'followup',d.followupChoice);
  }
  function secondaryExplanation(c){
    let text='';
    if(c.reviewed.includes('iron_mri'))text+=' La RM revisada documenta hierro hepático aumentado; cuantificar hierro y estadificar fibrosis son preguntas diferentes.';
    if(c.reviewed.includes('elastography'))text+=' La elastografía revisada de 5,6 kPa es tranquilizadora respecto a fibrosis avanzada, pero debe integrarse con sus limitaciones y el contexto.';
    else text+=' Si la valoración de fibrosis sigue pendiente, complétala sin exigir una nueva RM para establecer la etiología.';
    return text;
  }
  function assessParts(c,parts,planCritical,followupCritical){
    const d=c.decisions,k=lookup(studies,d.kftStudiesChoice),p=lookup(plans,d.planChoice),f=lookup(followups,d.followupChoice);
    planCritical.splice(0,planCritical.length,...(p.safety?[p.safety]:[]));followupCritical.splice(0,followupCritical.length,...(f.safety?[f.safety]:[]));
    for(const [id,title,choice] of [['interpretation','KFT 1 · Decisión diagnóstica',k],['plan','KFT 2 · Conducta terapéutica',p],['followup','Seguimiento y plazos',f]]){
      const part=parts.find(x=>x.id===id);
      // Preserve the existing treatment-safety evidence cap: choosing the right
      // card must never replace reviewing the hemogram and diagnostic iron/HFE evidence.
      const gaps=id==='plan'&&p.credit===3?[...(part.evidenceMissing||[])]:[];
      const score=id==='plan'&&gaps.length?Math.min(choice.credit,part.score):choice.credit;
      const missing=choice.credit===part.max?[]:['Revisar la decisión elegida'];
      if(gaps.length)missing.push(...gaps.map(x=>`Revisar ${x} antes de iniciar el tratamiento`));
      Object.assign(part,{title,score,missing,explanation:choice.why+(id==='interpretation'?secondaryExplanation(c):'')+(gaps.length?' Faltan resultados de seguridad realmente revisados; la selección de esta tarjeta no los sustituye.':''),notes:[],critical:id==='plan'?[...planCritical]:id==='followup'?[...followupCritical]:[],evidenceMissing:gaps});
    }
  }
  function feedback(d){
    const s=lookup(sct,d.sctChoice),k=lookup(studies,d.kftStudiesChoice),p=lookup(plans,d.planChoice),f=lookup(followups,d.followupChoice);
    const direction=Number(s?.id)<0?'Reconociste que la saturación persistentemente elevada debilita la explicación exclusivamente inflamatoria de la hiperferritinemia.':'Una saturación del 76 % elevada en dos determinaciones hace menos probable que la ferritina se deba únicamente a inflamación sin sobrecarga.';
    return [
      {title:'SCT · Cómo actualizaste la hipótesis',text:`Elegiste ${s?.title||'sin respuesta'}. ${direction} No excluye inflamación coexistente. La dirección docente es negativa; no se diferencia −1 de −2 con una nota de concordancia sin un panel experto real. El SCT es formativo y no suma ni resta a /10.`},
      {title:'KFT 1 · Decisión diagnóstica',text:`Elegiste «${k?.title}». ${k?.why}`},
      {title:'KFT 2 · Conducta terapéutica',text:`Elegiste «${p?.title}». ${p?.why}`},
      {title:'Seguimiento · Continuidad de la atención',text:`Elegiste «${f?.title}». ${f?.why}`}
    ];
  }
  function render(c,step,catalog,esc,page){
    const d=c.decisions;
    // Cambia solo la posición visual; SCT conserva su escala ordenada.
    const displayOrder={"andres-studies-choice":[0,1,2,3],"plan-choice":[0,1,2,3],"followup-choice":[0,1,2,3]};
    const cards=(xs,attr,selected)=>`<div class="quick-choice-grid decision-cards">${(displayOrder[attr]?displayOrder[attr].map(i=>xs[i]):xs).map(x=>`<button type="button" class="quick-choice ${selected===x.id?'selected':''}" data-${attr}="${esc(x.id)}" aria-pressed="${selected===x.id}"><span class="choice-mark">${selected===x.id?'◆':'◇'}</span><span><b>${esc(x.title)}</b>${x.detail?`<small>${esc(x.detail)}</small>`:''}</span></button>`).join('')}</div>`;
    const titles=['¿Qué diagnóstico eliges?','Razonamiento bajo incertidumbre · SCT','KFT 1 · Decisión diagnóstica','KFT 2 · Conducta terapéutica','Seguimiento'];
    let body='';
    if(step===0)body=`<p class="panel-copy">Con la información obtenida en esta consulta, ¿cuál es el diagnóstico más probable de Andrés?</p><label class="clinical-field">Tu diagnóstico<select data-field="diagnosis"><option value="">Elige tu conclusión…</option>${catalog.map(x=>`<option value="${x.id}" ${d.diagnosis===x.id?'selected':''}>${esc(x.title)}</option>`).join('')}</select></label>`;
    else if(!dataReady(c))body='<p class="clinical-note">Primero solicita y revisa el perfil de hierro y el estudio HFE. No se mostrarán resultados que aún no hayas revisado.</p>';
    else if(step===1)body=`<p class="panel-copy"><b>Hipótesis:</b> La ferritina elevada de Andrés podría explicarse únicamente por inflamación, sin sobrecarga de hierro.</p><p class="panel-copy"><b>Dato que debes ponderar:</b> La saturación de transferrina es del 76 %, elevada en dos determinaciones.</p><p class="panel-copy">¿Cómo modifica este hallazgo la probabilidad de la hipótesis?</p>${cards(sct,'sct-choice',d.sctChoice)}<p class="result-disclaimer">SCT formativo, separado de la nota clínica.</p>`;
    else if(step===2)body=`<p class="panel-copy">Con saturación del 76 %, ferritina de 860 ng/mL y homocigosis C282Y, ¿qué evaluación necesitas integrar ahora?</p>${c.reviewed.includes('iron_mri')?'<p class="panel-copy">Ya revisaste la RM de cuantificación de hierro; integra su resultado.</p>':''}${c.reviewed.includes('elastography')?'<p class="panel-copy">La elastografía que ya revisaste informa 5,6 kPa; integra ese resultado.</p>':''}${cards(studies,'andres-studies-choice',d.kftStudiesChoice)}`;
    else if(step===3)body=`<p class="panel-copy">${c.reviewed.includes('cbc')?'Andrés tiene hemoglobina de 15,1 g/dL y no presenta una contraindicación documentada para extraer sangre. ':'Integra la seguridad hematológica disponible. '}¿Qué tratamiento propones?</p>${cards(plans,'plan-choice',d.planChoice)}`;
    else body=`<p class="panel-copy">¿Cómo organizas los controles durante el tratamiento y después de alcanzar el objetivo?</p>${cards(followups,'followup-choice',d.followupChoice)}`;
    return page(`<p class="decision-progress">RESUELVE LA CONSULTA · ${step+1} / 5</p><h3 class="study-title">${titles[step]}</h3>${body}<p class="result-disclaimer">Al continuar se registra tu elección y no podrás cambiarla. Las respuestas y explicaciones se revelan al terminar la consulta.</p>`,`<button class="secondary-button" data-tab="results">Repasar resultados</button><button class="primary-button" data-action="next-decision" ${validStep(c,step)?'':'disabled'}>${['Continuar con SCT →','Decisión diagnóstica →','Elegir tratamiento →','Elegir seguimiento →','Terminar consulta →'][step]}</button>`,'decision-content');
  }
  return {ID,isAndres,sct,studies,plans,followups,lookup,dataReady,nextStep,validStep,ready,choose,restore,assessParts,feedback,render};
})();
