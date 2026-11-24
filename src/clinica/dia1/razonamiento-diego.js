/* HOSPITAL PORTAL · Diego: cinco decisiones aprobadas. SCT sin nota psicométrica. */
window.HepatoDay1Modules['diego-reasoning.mjs']=(()=>{
  const ID='hbv-monitor-v1-reasoning-v2',isDiego=c=>c?.id===ID;
  const sct=[['-2','−2 · Mucho menos probable'],['-1','−1 · Menos probable'],['0','0 · No modifica su probabilidad'],['1','+1 · Más probable'],['2','+2 · Mucho más probable']].map(([id,title])=>({id,title}));
  const studies=[
    {id:'diego-study-a',title:'Integrar actividad, fibrosis y circunstancias especiales',detail:'Revisar ALT y ADN-VHB seriados, fibrosis, coinfecciones y situaciones que modifiquen la indicación; aprovechar resultados disponibles.',credit:1,why:'La decisión no depende de una cifra aislada. Debe integrar actividad seriada, fibrosis, coinfecciones y situaciones especiales. No se requieren pruebas repetidas si sus resultados ya están disponibles y son suficientes.'},
    {id:'diego-study-b',title:'Biopsia obligatoria por HBsAg persistente',detail:'Solicitarla en todos los casos, aunque los demás resultados sean concordantes.',credit:0,why:'La persistencia del HBsAg establece cronicidad, pero no obliga a biopsiar. La biopsia se reserva para una pregunta clínica que no se resuelva de manera suficiente con la evaluación disponible.'},
    {id:'diego-study-c',title:'Decidir exclusivamente por el ADN-VHB actual',detail:'Un valor menor de 2.000 UI/mL permite prescindir de evaluar fibrosis.',credit:0,why:'Un ADN-VHB bajo no excluye fibrosis ni reemplaza la revisión de otros factores que pueden cambiar la indicación de tratamiento.'},
    {id:'diego-study-d',title:'Exigir ADN-VHB indetectable para no tratar',detail:'No considerar seguimiento sin antiviral mientras exista ADN detectable.',credit:0,why:'La viremia baja puede ser compatible con seguimiento sin antiviral cuando la evaluación integral lo respalda. No se exige ADN indetectable para esa estrategia.'}
  ];
  const plans=[
    {id:'diego-plan-a',title:'Sin antiviral por ahora, con seguimiento y prevención',detail:'Revisar protección de convivientes, vacunar a susceptibles y consultar antes de recibir inmunosupresores.',plan:['monitor-specific','contacts','alarm-network','review-meds'],credit:3,why:'La baja actividad documentada y la evaluación de daño hepático sostienen continuar sin antiviral por ahora, con seguimiento activo y revisión de indicaciones. La pareja ya tiene inmunidad documentada y no necesita vacunación automática. Revisa a otros contactos, vacuna a susceptibles y advierte que debe consultar antes de inmunosupresión por el riesgo de reactivación.'},
    {id:'diego-plan-b',title:'Iniciar tenofovir o entecavir por HBsAg persistente',detail:'Tratar porque lleva más de seis meses positivo, independientemente de actividad, fibrosis u otros riesgos.',plan:['hbv-antiviral'],credit:0,safety:'Inicio automático de antiviral basándose solo en la persistencia del HBsAg, sin una indicación individualizada.',why:'La cronicidad por sí sola no impone tratar a este paciente. La decisión debe integrar actividad, fibrosis, circunstancias especiales, beneficios y preferencias; el dato aislado usado en esta opción no la justifica.'},
    {id:'diego-plan-c',title:'Sin antiviral y con controles, sin revisar convivientes',detail:'Considerar innecesaria la prevención en contactos porque el ADN-VHB es bajo.',plan:['monitor-specific','alarm-network'],credit:2,why:'Crédito parcial: mantener controles sin antiviral es coherente con el escenario, pero el ADN bajo no elimina el riesgo de transmisión ni la necesidad de evaluar protección de contactos. Su pareja ya es inmune; deben revisarse otros contactos y vacunarse quienes sean susceptibles.'},
    {id:'diego-plan-d',title:'Curso corto hasta el primer ADN indetectable',detail:'Ofrecer antiviral y suspenderlo en cuanto el primer control sea indetectable.',plan:['hbv-antiviral'],credit:0,safety:'Suspensión de antiviral basada en el primer ADN indetectable: estrategia no respaldada y con riesgo de rebrote.',why:'La supresión virológica durante tratamiento no equivale a curación. Si se inicia un antiviral, su duración y una eventual suspensión requieren criterios específicos y seguimiento especializado; no se interrumpe por el primer resultado indetectable.'}
  ];
  const followups=[
    {id:'diego-follow-a',title:'ALT y ADN-VHB en seis meses',detail:'Reevaluar periódicamente HBsAg, fibrosis y riesgo de hepatocarcinoma; adelantar ante cambios o inmunosupresión.',schedules:{'hbv-monitor':'6mo'},credit:2,why:'Es una estrategia válida tras un año de baja actividad documentada: controles clínicos y virológicos, revisión periódica de HBsAg, fibrosis y riesgo de hepatocarcinoma. Se adelanta la revisión si cambian síntomas, resultados, riesgos o se plantea inmunosupresión.'},
    {id:'diego-follow-b',title:'ALT y ADN-VHB en doce meses',detail:'Mantener la misma reevaluación periódica de riesgos y acceso a control anticipado.',schedules:{'hbv-monitor':'12mo'},credit:2,why:'También recibe crédito completo: un control anual puede ser razonable con un año de estabilidad documentada, seguimiento asegurado y criterios para adelantarlo. Un control más cercano, incluso a tres meses si se justifica, no es automáticamente incorrecto.'},
    {id:'diego-follow-c',title:'Solo ALT cada seis meses',detail:'Solicitar ADN-VHB únicamente si aparecen síntomas.',schedules:{biochemical:'6mo'},credit:0,why:'Los cambios de actividad pueden ser asintomáticos. La ALT aislada y la aparición de síntomas no sustituyen el seguimiento virológico.'},
    {id:'diego-follow-d',title:'Ecografía y AFP semestrales en lugar de virología',detail:'Indicarlas por HBsAg positivo y sustituir con ellas los controles virológicos.',schedules:{hcc:'6mo'},credit:0,why:'La vigilancia de hepatocarcinoma se individualiza según riesgo y no sustituye ALT ni ADN-VHB. En Diego, de 39 años, nacido y residente en España, sin cirrosis ni historia familiar de hepatocarcinoma, el HBsAg aislado no impone esa vigilancia semestral.'}
  ];
  const lookup=(xs,id)=>xs.find(x=>x.id===id);
  const dataReady=c=>c.reviewed.length>0;
  const nextStep=d=>Number.isInteger(d?.diegoStep)&&d.diegoStep>=0&&d.diegoStep<=4?d.diegoStep:0;
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
    if(kind==='studies'){d.kftStudiesChoice=id;d.interpretationChoice='hbv-serial';}
    if(kind==='plan')Object.assign(d,{planChoice:id,plan:[...choice.plan],planText:''});
    if(kind==='followup')Object.assign(d,{followupChoice:id,followup:Object.keys(choice.schedules),schedules:{...choice.schedules},followupText:''});
    c.assessmentVersion=3;return true;
  }
  function restore(c,d){
    // Old closed consultations use their original decisions and assessment.
    if(!Number.isInteger(d.diegoStep))return;
    const clean=c.decisions;
    Object.assign(clean,{diegoStep:0,sctChoice:'',kftStudiesChoice:'',interpretationChoice:'',planChoice:'',plan:[],followupChoice:'',followup:[],schedules:{}});
    if(!clean.diagnosis)return;
    const wanted=nextStep(d);
    if(wanted===0)return;
    if(!dataReady(c)){clean.diegoStep=1;return;}
    clean.diegoStep=1;choose(c,'sct',d.sctChoice);
    if(wanted<2||!validStep(c,1))return;
    clean.diegoStep=2;choose(c,'studies',d.kftStudiesChoice);
    if(wanted<3||!validStep(c,2))return;
    clean.diegoStep=3;choose(c,'plan',d.planChoice);
    if(wanted<4||!validStep(c,3))return;
    clean.diegoStep=4;choose(c,'followup',d.followupChoice);
  }
  function secondaryExplanation(c){
    let text='';
    if(c.reviewed.includes('elastography'))text+=' La elastografía revisada de 4,8 kPa no aporta datos de fibrosis avanzada en este contexto.';
    else text+=' Integra la evaluación de fibrosis pendiente antes de darla por resuelta.';
    const coinfections=['hdv','hcv','hiv'];
    text+=coinfections.every(id=>c.reviewed.includes(id))?' Las pruebas anti-VHD, anti-VHC y VIH que revisaste son negativas.':' Revisa las coinfecciones todavía pendientes; no se presupone su resultado.';
    return text;
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
    const direction=Number(s?.id)<0?'Reconociste que ALT persistentemente normal y ADN-VHB bajo durante un año reducen la probabilidad de una fase inmunoactiva actual.':'La evolución de ALT normal y ADN-VHB bajo durante un año reduce, en vez de aumentar, la probabilidad de una fase inmunoactiva actual.';
    return [
      {title:'SCT · Cómo actualizaste la hipótesis',text:`Elegiste ${s?.title||'sin respuesta'}. ${direction} Esto no significa curación ni impide cambios futuros. −1 y −2 no reciben una nota diferente de concordancia sin un panel experto real. El SCT es formativo y no suma ni resta a la nota /10.`},
      {title:'KFT 1 · Decisión diagnóstica',text:`Elegiste «${k?.title}». ${k?.why}`},
      {title:'KFT 2 · Conducta terapéutica',text:`Elegiste «${p?.title}». ${p?.why}`},
      {title:'Seguimiento · Continuidad de la atención',text:`Elegiste «${f?.title}». ${f?.why}`}
    ];
  }
  function render(c,step,catalog,esc,page){
    const d=c.decisions;
    // Cambia solo la posición visual; SCT conserva su escala ordenada.
    const displayOrder={"diego-studies-choice":[3,1,0,2],"plan-choice":[2,0,3,1],"followup-choice":[2,3,1,0]};
    const cards=(xs,attr,selected)=>`<div class="quick-choice-grid decision-cards">${(displayOrder[attr]?displayOrder[attr].map(i=>xs[i]):xs).map(x=>`<button type="button" class="quick-choice ${selected===x.id?'selected':''}" data-${attr}="${esc(x.id)}" aria-pressed="${selected===x.id}"><span class="choice-mark">${selected===x.id?'◆':'◇'}</span><span><b>${esc(x.title)}</b>${x.detail?`<small>${esc(x.detail)}</small>`:''}</span></button>`).join('')}</div>`;
    const titles=['¿Qué diagnóstico eliges?','Razonamiento bajo incertidumbre · SCT','KFT 1 · Decisión diagnóstica','KFT 2 · Conducta terapéutica','Seguimiento'];
    let body='';
    if(step===0)body=`<p class="panel-copy">Con la información obtenida en esta consulta, ¿cuál es el diagnóstico más probable de Diego?</p><label class="clinical-field">Tu diagnóstico<select data-field="diagnosis"><option value="">Elige tu conclusión…</option>${catalog.map(x=>`<option value="${x.id}" ${d.diagnosis===x.id?'selected':''}>${esc(x.title)}</option>`).join('')}</select></label>`;
    else if(!dataReady(c))body='<p class="clinical-note">Primero solicita y revisa el perfil hepático, la serología VHB y el ADN-VHB. No se mostrarán resultados que aún no hayas revisado.</p>';
    else if(step===1)body=`<p class="panel-copy"><b>Hipótesis:</b> Diego podría estar cursando una fase inmunoactiva de la infección por VHB.</p><p class="panel-copy"><b>Dato que debes ponderar:</b> Los registros de un año muestran ALT persistentemente normal y ADN-VHB entre 380 y 620 UI/mL.</p><p class="panel-copy">¿Cómo modifica esta evolución la probabilidad de la hipótesis?</p>${cards(sct,'sct-choice',d.sctChoice)}<p class="result-disclaimer">SCT formativo, separado de la nota clínica.</p>`;
    else if(step===2)body=`<p class="panel-copy">Antes de concluir que Diego puede continuar sin tratamiento antiviral, ¿cómo completas la evaluación?</p>${c.reviewed.includes('elastography')?'<p class="panel-copy">Ya revisaste una elastografía de 4,8 kPa; integra ese resultado en tu decisión.</p>':''}${['hdv','hcv','hiv'].every(id=>c.reviewed.includes(id))?'<p class="panel-copy">La evaluación de coinfecciones ya está disponible entre los estudios que revisaste.</p>':''}${cards(studies,'diego-studies-choice',d.kftStudiesChoice)}`;
    else if(step===3)body=`<p class="panel-copy">Diego pregunta: «¿Necesito empezar un medicamento aunque me sienta bien?». ¿Qué plan le propones con los datos actuales?</p>${cards(plans,'plan-choice',d.planChoice)}`;
    else body=`<p class="panel-copy">La baja actividad está documentada durante un año. ¿Qué seguimiento acuerdas?</p>${cards(followups,'followup-choice',d.followupChoice)}`;
    return page(`<p class="decision-progress">RESUELVE LA CONSULTA · ${step+1} / 5</p><h3 class="study-title">${titles[step]}</h3>${body}<p class="result-disclaimer">Al continuar se registra tu elección y no podrás cambiarla. Las respuestas y explicaciones se revelan al terminar la consulta.</p>`,`<button class="secondary-button" data-tab="results">Repasar resultados</button><button class="primary-button" data-action="next-decision" ${validStep(c,step)?'':'disabled'}>${['Continuar con SCT →','Decisión diagnóstica →','Elegir tratamiento →','Elegir seguimiento →','Terminar consulta →'][step]}</button>`,'decision-content');
  }
  return {ID,isDiego,sct,studies,plans,followups,lookup,dataReady,nextStep,validStep,ready,choose,restore,assessParts,feedback,render};
})();
