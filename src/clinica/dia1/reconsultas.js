/* Embedded original source: src/clinica/dia1/reconsultas.js */
/* Módulo Día 1 original: return-visit.mjs. Lógica clínica conservada. */
window.HepatoDay1Modules['return-visit.mjs'] = (() => {
// A short, optional return visit. Progress is stored as choices, never as a
// predicted biological outcome. The original clinical score stays intact.
const RETURN_VISIT_CASE='masld-intro-v1-reasoning-v2';
const RETURN_VISIT_SOURCE={label:'EASL–EASD–EASO · hábitos, barreras y seguimiento',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC11519095/'};
const diagnosticStudies=['profile','cbc','inr','metabolic','hbv','hcv','iron','ultrasound'];
const habitChoices=[
  {id:'walking',title:'Caminar en las pausas',detail:'Aumentar la actividad de forma gradual.'},
  {id:'food',title:'Preparar la comida del turno',detail:'Elegir cambios de alimentación que pueda sostener.'},
  {id:'supplement',title:'Probar un suplemento «hepático»',detail:'Usarlo como medida principal hasta el control.'}
];
function returnVisitAvailable(c,caseData){return caseData?.id===RETURN_VISIT_CASE&&!!c?.outcome;}
function returnVisitScenario(c,caseData){
  if(!returnVisitAvailable(c,caseData))return null;
  const plan=c.decisions.plan.includes('metabolic'),
    scheduled=c.decisions.followup.includes('liver-metabolic')&&['3mo','6mo','12mo'].includes(c.decisions.schedules['liver-metabolic']),
    missing=diagnosticStudies.filter(id=>!c.reviewed.includes(id)),evidenceReady=!missing.length;
  return {
    branch:!plan?'no-plan':!scheduled?'no-control':'planned',evidenceReady,missing,
    timing:scheduled?({ '3mo':'Tres meses después','6mo':'Seis meses después','12mo':'Un año después' }[c.decisions.schedules['liver-metabolic']]):'Un control más tarde',
    consequence:!plan?'Salió de la primera consulta sin un plan de hábitos concreto. Vuelve porque no sabía por dónde empezar.':!scheduled?'Tenía un plan de hábitos, pero el próximo control no quedó acordado. Vuelve para recuperar el seguimiento.':'Salió con un plan de hábitos y un control acordado. Hoy puedes revisar cómo encajó en su vida.',
    voice:!plan?'«Seguí trabajando, pero no sabía qué cambiar. ¿Por dónde empiezo?»':!scheduled?'«Intenté hacer algunos cambios. No me quedó claro cuándo tenía que volver.»':'«Empecé a caminar, pero mis turnos cambian. Me cuesta mantenerlo toda la semana.»',
    followupChoices:evidenceReady?[
      {id:'monitor',title:'Acordar el próximo control',detail:'Revisar salud hepática, metabólica y riesgo de fibrosis.'},
      {id:'support',title:'Sumar apoyo nutricional y controles',detail:'Buscar ayuda para el hábito y mantener la reevaluación.'},
      {id:'discharge',title:'Cerrar el seguimiento',detail:'Como se siente bien, continuar sin controles ni criterios de reconsulta.'}
    ]:[
      {id:'complete',title:'Recuperar estudios y citarlo',detail:'Revisar los resultados pendientes y sostener el hábito acordado.'},
      {id:'assume',title:'Confirmar la conclusión anterior',detail:'Mantenerla sin recuperar la información que falta.'},
      {id:'discharge',title:'Cerrar el seguimiento',detail:'Como se siente bien, continuar sin controles ni criterios de reconsulta.'}
    ]
  };
}
function initialReturnVisit(){return {version:1,status:'active',habit:'',followup:''};}
function returnVisitStep(c){return c.returnVisit?.habit?c.returnVisit.followup?2:1:0;}
function returnVisitChoices(c,caseData){
  const scenario=returnVisitScenario(c,caseData);if(!scenario)return [];
  return returnVisitStep(c)===0?habitChoices:returnVisitStep(c)===1?scenario.followupChoices:[];
}
function chooseReturnVisit(c,caseData,id){
  if(!returnVisitAvailable(c,caseData)||c.returnVisit?.status!=='active')return false;
  const choice=returnVisitChoices(c,caseData).find(x=>x.id===id);if(!choice)return false;
  if(!c.returnVisit.habit)c.returnVisit.habit=id;
  else {c.returnVisit.followup=id;c.returnVisit.status='completed';}
  return true;
}
function sanitizeReturnVisit(saved,c,caseData){
  if(!returnVisitAvailable(c,caseData)||saved?.version!==1||!['active','completed'].includes(saved.status))return null;
  const v=initialReturnVisit();
  if(habitChoices.some(x=>x.id===saved.habit))v.habit=saved.habit;
  const choices=returnVisitScenario(c,caseData).followupChoices;
  if(v.habit&&choices.some(x=>x.id===saved.followup)){v.followup=saved.followup;v.status='completed';}
  return v;
}
function returnVisitResult(c,caseData){
  const scenario=returnVisitScenario(c,caseData),v=c.returnVisit;
  if(!scenario||!v?.habit)return null;
  const practical=v.habit!=='supplement',complete=v.status==='completed',
    followupGood=scenario.evidenceReady?['monitor','support'].includes(v.followup):v.followup==='complete';
  const habit=habitChoices.find(x=>x.id===v.habit),followup=scenario.followupChoices.find(x=>x.id===v.followup);
  return {complete,adequate:complete&&practical&&followupGood,
    habit:habit.title,followup:followup?.title||'',
    reaction:v.habit==='walking'?'«Puedo empezar con una caminata en las pausas. Eso sí entra en mi jornada.»':v.habit==='food'?'«Puedo llevar comida de casa. Prefiero empezar por ahí y revisarlo contigo.»':'«¿Con eso alcanza? Todavía no tengo claro qué cambiar en mi día a día.»',
    title:complete?(practical&&followupGood?'Un plan que Martín puede continuar':'Todavía hay algo que ajustar'):'Martín responde a tu propuesta',
    explanation:!practical?'El suplemento no sustituye los hábitos ni el control cardiometabólico. Recupera un objetivo practicable con Martín.':!complete?'Acordaste una medida que encaja en su trabajo. Ahora define cómo sostenerla y reevaluarla.':!followupGood?(scenario.evidenceReady?'Sentirse bien no elimina la necesidad de seguimiento. Mantén controles y criterios de reevaluación.':'La primera evaluación dejó estudios pendientes. Recupéralos antes de sostener una conclusión definitiva.') :scenario.evidenceReady?'Acordaron un hábito y una forma de revisarlo. En este paciente con diabetes, la reevaluación de fibrosis sigue siendo parte del seguimiento.':'Acordaron un hábito y recuperar la evaluación pendiente. El próximo control permitirá integrar esos resultados.',
    note:'Este control registra si el plan quedó comprendido y cómo continuará la atención. La respuesta clínica se evalúa con los controles acordados.'};
}

return {RETURN_VISIT_CASE,RETURN_VISIT_SOURCE,returnVisitAvailable,returnVisitScenario,initialReturnVisit,returnVisitStep,returnVisitChoices,chooseReturnVisit,sanitizeReturnVisit,returnVisitResult};
})();

