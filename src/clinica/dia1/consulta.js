/* Embedded original source: src/clinica/dia1/consulta.js */
/* Módulo Día 1 original: consultation.mjs. Lógica clínica conservada. */
window.HepatoDay1Modules['consultation.mjs'] = (() => {
const {STUDY_CATALOG} = window.HepatoDay1Modules['study-catalog.mjs'];
const {HISTORY_TOPICS,DIAGNOSIS_CATALOG,PLAN_CATALOG,FOLLOWUP_CATALOG,TIMEFRAME_CATALOG} = window.HepatoDay1Modules['simulation-cases.mjs'];
const {STUDY_BUNDLES,planChoicesFor,followupChoicesFor,interpretationChoicesFor} = window.HepatoDay1Modules['game-choices.mjs'];
const {studyAppropriateness,assessInterpretation,fibrosisPending} = window.HepatoDay1Modules['clinical-reasoning.mjs'];
const {assessChallenge} = window.HepatoDay1Modules['clinical-challenges.mjs'];
const {sanitizeReturnVisit} = window.HepatoDay1Modules['return-visit.mjs'];
const Hector=window.HepatoDay1Modules['hector-reasoning.mjs'];
const Valeria=window.HepatoDay1Modules['valeria-reasoning.mjs'];
const Ernesto=window.HepatoDay1Modules['ernesto-reasoning.mjs'];
const Lucia=window.HepatoDay1Modules['lucia-reasoning.mjs'];
const Andres=window.HepatoDay1Modules['andres-reasoning.mjs'];
const Rosa=window.HepatoDay1Modules['rosa-reasoning.mjs'];
const Diego=window.HepatoDay1Modules['diego-reasoning.mjs'];
const Elena=window.HepatoDay1Modules['elena-reasoning.mjs'];
const Sofia=window.HepatoDay1Modules['sofia-reasoning.mjs'];
const Martin=window.HepatoDay1Modules['martin-reasoning.mjs'];
const validIds=(values,catalog)=>Array.isArray(values)?[...new Set(values.filter(x=>catalog.some(s=>s.id===x)))]:[];
const clinicalText=value=>typeof value==='string'?value.slice(0,2000):'';
const criterionIds=criterion=>Array.isArray(criterion)?criterion:[criterion];
const criterionChosen=(criterion,selected)=>criterionIds(criterion).some(id=>selected.includes(id));
const labelFor=(id,catalog)=>catalog.find(x=>x.id===id)?.title||id;
const halfPoint=n=>Math.round(n*2)/2;
const cleanChoiceSeed=seed=>Number.isSafeInteger(seed)&&seed>0&&seed<=0x7fffffff?seed:0;
const missingEvidence=(c,criteria=[])=>criteria.filter(criterion=>!criterionChosen(criterion,c.reviewed));
const evidenceLabels=criteria=>criteria.map(criterion=>criterionIds(criterion).map(id=>labelFor(id,STUDY_CATALOG)).join(' / '));

function initialConsultation(choiceSeed=0){return {
  version:2,assessmentVersion:3,choiceSeed:cleanChoiceSeed(choiceSeed),challenge:null,returnVisit:null,history:false,exam:false,examChecks:[],seated:false,asked:[],
  hypothesis:null,hypothesisDraft:{text:'',differential:'',rationale:''},revisions:[],
  cart:[],orders:[],orderLog:[],received:[],reviewed:[],controls:0,calculations:{},
  decisions:{diagnosis:'',autoFailedByDiagnosis:false,interpretationChoice:'',sctChoice:'',kftFibrosisChoice:'',diagnosisText:'',plan:[],planChoice:'',planText:'',followup:[],followupChoice:'',schedules:{},followupText:''},outcome:null
};}
function recordHypothesis(c){
  if(c.outcome||!c.history||!c.exam||!c.seated)return false;
  const draft=c.hypothesisDraft;if(draft.text.trim().length<4||draft.rationale.trim().length<4)return false;
  const snapshot={text:draft.text.trim(),differential:draft.differential.trim(),rationale:draft.rationale.trim(),control:c.controls};
  if(!c.hypothesis)c.hypothesis=snapshot;
  else c.revisions.push(snapshot);
  return true;
}
function currentHypothesis(c){return c.revisions.at(-1)||c.hypothesis;}
function canOrderStudy(c,id){
  const study=STUDY_CATALOG.find(s=>s.id===id);
  return !!study&&!c.outcome&&c.history&&c.exam&&c.seated&&!c.orders.includes(id)&&(study.prerequisites||[]).every(k=>c.received.includes(k));
}
function requestStudies(c,ids){
  if(c.outcome||!c.history||!c.exam||!c.seated)return {ok:false,reason:'valuation'};
  const chosen=validIds(ids,STUDY_CATALOG);
  if(!chosen.length||chosen.length!==new Set(ids).size)return {ok:false,reason:'empty'};
  if(chosen.some(id=>!canOrderStudy(c,id)))return {ok:false,reason:'prerequisites'};
  c.orderLog.push({batch:c.orderLog.length+1,control:c.controls,tests:[...chosen],reviewed:[...c.reviewed],hypothesis:currentHypothesis(c)?{...currentHypothesis(c)}:null});
  c.orders.push(...chosen);c.cart=[];return {ok:true,ordered:chosen};
}
function receiveStudies(c){
  if(c.outcome||!c.orders.some(id=>!c.received.includes(id)))return false;
  c.controls++;c.received=[...c.orders];return true;
}
function resultFor(c,caseData,id){
  if(!c.orders.includes(id)||!c.received.includes(id))return null;
  const result=caseData.results[id];if(!result)return null;
  // No teaching note, expected diagnosis or precomputed interpretation can reach the report view.
  return {title:result.title,subtitle:`Control simulado ${c.controls} · resultado solicitado`,
    ...(result.rows?{rows:result.rows.map(r=>[...r])}:{report:result.report,imageKind:'report'})};
}
function reviewResult(c,caseData,id){
  if(c.outcome||!resultFor(c,caseData,id))return false;
  if(!c.reviewed.includes(id))c.reviewed.push(id);return true;
}
function readyForDecisions(c){return !!(c.history&&c.exam&&c.seated);}
function studyBundleState(c,id){
  const bundle=STUDY_BUNDLES.find(x=>x.id===id);if(!bundle)return null;
  const remaining=bundle.tests.filter(x=>!c.orders.includes(x));
  return {remaining,available:remaining.length>0&&remaining.every(x=>canOrderStudy(c,x)),
    selected:remaining.length>0&&remaining.every(x=>c.cart.includes(x)),ordered:remaining.length===0,
    received:bundle.tests.every(x=>c.received.includes(x))};
}
function toggleStudyBundle(c,id){
  const bundle=studyBundleState(c,id);if(!bundle?.available)return false;
  c.cart=bundle.selected?c.cart.filter(x=>!bundle.remaining.includes(x)):[...new Set([...c.cart,...bundle.remaining])];return true;
}
function selectSctChoice(c,caseData,id){
  if(Hector.isHector(caseData))return readyForDecisions(c)&&Hector.choose(c,'sct',id);
  if(Valeria.isValeria(caseData))return readyForDecisions(c)&&Valeria.choose(c,'sct',id);
  if(Ernesto.isErnesto(caseData))return readyForDecisions(c)&&Ernesto.choose(c,'sct',id);
  if(Lucia.isLucia(caseData))return readyForDecisions(c)&&Lucia.choose(c,'sct',id);
  if(Andres.isAndres(caseData))return readyForDecisions(c)&&Andres.choose(c,'sct',id);
  if(Rosa.isRosa(caseData))return readyForDecisions(c)&&Rosa.choose(c,'sct',id);
  if(Diego.isDiego(caseData))return readyForDecisions(c)&&Diego.choose(c,'sct',id);
  if(Elena.isElena(caseData))return readyForDecisions(c)&&Elena.choose(c,'sct',id);
  if(Sofia.isSofia(caseData))return readyForDecisions(c)&&Sofia.choose(c,'sct',id);
  if(c.outcome||!Martin.isMartin(caseData)||!readyForDecisions(c)||!c.decisions.diagnosis||!Martin.lookup(Martin.sct,id))return false;
  c.decisions.sctChoice=id;return true;
}
function selectMartinFibrosisChoice(c,caseData,id){
  const choice=Martin.lookup(Martin.fibrosis,id);
  if(c.outcome||!Martin.isMartin(caseData)||!c.decisions.sctChoice||!choice||!readyForDecisions(c))return false;
  c.decisions.kftFibrosisChoice=id;c.decisions.interpretationChoice=choice.interpretation;c.assessmentVersion=3;return true;
}
function selectPlanChoice(c,id,caseData){
  if(Hector.isHector(caseData))return readyForDecisions(c)&&Hector.choose(c,'plan',id);
  if(Valeria.isValeria(caseData))return readyForDecisions(c)&&Valeria.choose(c,'plan',id);
  if(Ernesto.isErnesto(caseData))return readyForDecisions(c)&&Ernesto.choose(c,'plan',id);
  if(Lucia.isLucia(caseData))return readyForDecisions(c)&&Lucia.choose(c,'plan',id);
  if(Andres.isAndres(caseData))return readyForDecisions(c)&&Andres.choose(c,'plan',id);
  if(Rosa.isRosa(caseData))return readyForDecisions(c)&&Rosa.choose(c,'plan',id);
  if(Diego.isDiego(caseData))return readyForDecisions(c)&&Diego.choose(c,'plan',id);
  if(Elena.isElena(caseData))return readyForDecisions(c)&&Elena.choose(c,'plan',id);
  if(Sofia.isSofia(caseData))return readyForDecisions(c)&&Sofia.choose(c,'plan',id);
  const choice=Martin.isMartin(caseData)?Martin.lookup(Martin.plans,id):planChoicesFor(c.decisions.diagnosis).find(x=>x.id===id);
  if(c.outcome||!readyForDecisions(c)||!c.decisions.diagnosis||!choice)return false;
  Object.assign(c.decisions,{planChoice:id,plan:[...choice.plan],planText:''});return true;
}
function selectInterpretationChoice(c,id){
  if(c.outcome||!readyForDecisions(c)||!interpretationChoicesFor(c.decisions.diagnosis).some(x=>x.id===id))return false;
  c.decisions.interpretationChoice=id;c.assessmentVersion=3;return true;
}
function selectFollowupChoice(c,id,caseData){
  if(Hector.isHector(caseData))return readyForDecisions(c)&&Hector.choose(c,'followup',id);
  if(Valeria.isValeria(caseData))return readyForDecisions(c)&&Valeria.choose(c,'followup',id);
  if(Ernesto.isErnesto(caseData))return readyForDecisions(c)&&Ernesto.choose(c,'followup',id);
  if(Lucia.isLucia(caseData))return readyForDecisions(c)&&Lucia.choose(c,'followup',id);
  if(Andres.isAndres(caseData))return readyForDecisions(c)&&Andres.choose(c,'followup',id);
  if(Rosa.isRosa(caseData))return readyForDecisions(c)&&Rosa.choose(c,'followup',id);
  if(Diego.isDiego(caseData))return readyForDecisions(c)&&Diego.choose(c,'followup',id);
  if(Elena.isElena(caseData))return readyForDecisions(c)&&Elena.choose(c,'followup',id);
  if(Sofia.isSofia(caseData))return readyForDecisions(c)&&Sofia.choose(c,'followup',id);
  const choice=Martin.isMartin(caseData)?Martin.lookup(Martin.followups,id):followupChoicesFor(c.decisions.diagnosis).find(x=>x.id===id);
  if(c.outcome||!readyForDecisions(c)||!c.decisions.plan.length||!choice)return false;
  Object.assign(c.decisions,{followupChoice:id,followup:Object.keys(choice.schedules),schedules:{...choice.schedules},followupText:''});return true;
}
function decisionsComplete(c,{allowLegacy=false,caseData=null}={}){
  const d=c.decisions;
  if(d.autoFailedByDiagnosis===true&&DIAGNOSIS_CATALOG.some(x=>x.id===d.diagnosis)&&(!caseData||d.diagnosis!==caseData.rubric.diagnosis))return true;
  if(Hector.isHector(caseData)&&!allowLegacy)return DIAGNOSIS_CATALOG.some(x=>x.id===d.diagnosis)&&Hector.nextStep(d)===4&&Hector.ready(c);
  if(Valeria.isValeria(caseData)&&!allowLegacy)return DIAGNOSIS_CATALOG.some(x=>x.id===d.diagnosis)&&Valeria.nextStep(d)===4&&Valeria.ready(c);
  if(Ernesto.isErnesto(caseData)&&!allowLegacy)return DIAGNOSIS_CATALOG.some(x=>x.id===d.diagnosis)&&Ernesto.nextStep(d)===4&&Ernesto.ready(c);
  if(Lucia.isLucia(caseData)&&!allowLegacy)return DIAGNOSIS_CATALOG.some(x=>x.id===d.diagnosis)&&Lucia.nextStep(d)===4&&Lucia.ready(c);
  if(Andres.isAndres(caseData)&&!allowLegacy)return DIAGNOSIS_CATALOG.some(x=>x.id===d.diagnosis)&&Andres.nextStep(d)===4&&Andres.ready(c);
  if(Rosa.isRosa(caseData)&&!allowLegacy)return DIAGNOSIS_CATALOG.some(x=>x.id===d.diagnosis)&&Rosa.nextStep(d)===4&&Rosa.ready(c);
  if(Diego.isDiego(caseData)&&!allowLegacy)return DIAGNOSIS_CATALOG.some(x=>x.id===d.diagnosis)&&Diego.nextStep(d)===4&&Diego.ready(c);
  if(Elena.isElena(caseData)&&!allowLegacy)return DIAGNOSIS_CATALOG.some(x=>x.id===d.diagnosis)&&Elena.nextStep(d)===4&&Elena.ready(c);
  if(Sofia.isSofia(caseData)&&!allowLegacy)return DIAGNOSIS_CATALOG.some(x=>x.id===d.diagnosis)&&Sofia.nextStep(d)===4&&Sofia.ready(c);
  if(Martin.isMartin(caseData)&&!allowLegacy&&!Martin.ready(d))return false;
  return DIAGNOSIS_CATALOG.some(x=>x.id===d.diagnosis)&&(allowLegacy||interpretationChoicesFor(d.diagnosis).some(x=>x.id===d.interpretationChoice))&&d.plan.length>0&&d.plan.every(id=>PLAN_CATALOG.some(x=>x.id===id))&&d.followup.length>0&&d.followup.every(id=>FOLLOWUP_CATALOG.some(x=>x.id===id)&&TIMEFRAME_CATALOG.some(x=>x.id===d.schedules[id]));
}

function answerChallenge(c,caseData,choiceId){
  if(!c.outcome||c.challenge)return false;
  const answer=assessChallenge(caseData.id,choiceId);
  if(!answer)return false;
  // Only the first choice is stored. Its result is derived again when loading.
  c.challenge={choiceId:answer.choiceId};return answer;
}

function assessConsultation(c,caseData,{allowLegacy=false}={}){
  if(!readyForDecisions(c)||!decisionsComplete(c,{allowLegacy,caseData}))return null;
  const rubric=caseData.rubric,d=c.decisions,parts=[],planCritical=[],followupCritical=[];
  const missingHistory=rubric.history.filter(id=>!c.asked.includes(id));
  parts.push({id:'assessment',title:'Valoración inicial',max:1,score:halfPoint((1-missingHistory.length/rubric.history.length)),
    missing:missingHistory.map(id=>labelFor(id,HISTORY_TOPICS)),explanation:missingHistory.length?'Faltaron preguntas relevantes para este problema. Revisa cuáles habrían ayudado a orientar el estudio.':'Recogiste los antecedentes relevantes y examinaste al paciente antes de investigar.'});
  const missingStudies=rubric.essential.filter(id=>!c.reviewed.includes(id));
  const {lowValue:unnecessary,procedures}=studyAppropriateness(c,caseData);
  const roundedStudyPoints=Math.max(0,halfPoint(2*(1-missingStudies.length/rubric.essential.length)-unnecessary.length*.5));
  const studyPoints=missingStudies.length?Math.min(1.5,roundedStudyPoints):roundedStudyPoints;
  parts.push({id:'studies',title:'Selección e integración de estudios',max:2,score:studyPoints,
    missing:missingStudies.map(id=>labelFor(id,STUDY_CATALOG)),unnecessary:unnecessary.map(id=>labelFor(id,STUDY_CATALOG)),
    explanation:missingStudies.length?'La investigación quedó incompleta. Revisa los estudios pendientes para integrar la etiología, la gravedad o la seguridad del plan.':unnecessary.length?'Se revisaron los datos necesarios, pero hubo pedidos sin una pregunta clínica respaldada por este escenario. Más pruebas no implican una mejor consulta.':rubric.studyExplanation});
  const diagnosisCorrect=d.diagnosis===rubric.diagnosis;
  const diagnosticGaps=missingEvidence(c,rubric.diagnosticEvidence);
  const cautious=d.diagnosis==='undetermined'&&diagnosticGaps.length>0&&d.plan.includes('continue-workup')&&d.followup.includes('review-results')&&['2wk','1mo'].includes(d.schedules['review-results']);
  let diagnosisExplanation=caseData.explanations.diagnosis;
  if(rubric.diagnosis==='hfe')diagnosisExplanation='La saturación de transferrina elevada, la ferritina y la homocigosis C282Y apoyan hemocromatosis HFE con sobrecarga de hierro.'+(c.reviewed.includes('iron_mri')?' La RM solicitada aporta además la cuantificación del hierro hepático.':' La RM de hierro no es obligatoria para establecer esta etiología en el patrón típico de este escenario.');
  if(diagnosisCorrect&&diagnosticGaps.length)diagnosisExplanation='La conclusión coincide con el escenario, pero aún no está respaldada por todos los datos necesarios. Identifica qué falta revisar antes de afirmarla con certeza.';
  if(cautious)diagnosisExplanation='Mantuviste una incertidumbre razonable y un plan de ampliación, aunque esta consulta no llegó a establecer la etiología.';
  parts.push({id:'diagnosis',title:'Diagnóstico final',max:1,score:diagnosisCorrect?(diagnosticGaps.length?0:1):cautious?1:0,
    missing:diagnosisCorrect?evidenceLabels(diagnosticGaps):cautious?evidenceLabels(diagnosticGaps):[labelFor(rubric.diagnosis,DIAGNOSIS_CATALOG)],evidenceMissing:evidenceLabels(diagnosticGaps),explanation:diagnosisExplanation});
  parts.push(assessInterpretation(c,caseData));
  const requiredPlans=[...rubric.plan];
  if(fibrosisPending(c,caseData))requiredPlans.push(['stage-fibrosis','continue-workup']);
  const missingPlans=requiredPlans.filter(x=>!criterionChosen(x,d.plan));
  const indicated=new Set([...rubric.allowed,...requiredPlans.flat()]);
  const medicationIds=['daa','phlebotomy','udca','immunosuppression','steroids','mycophenolate','carvedilol','iron-supplement','iron-chelation','hbv-antiviral','antibiotic','diuretics'];
  for(const id of d.plan)if(medicationIds.includes(id)&&!indicated.has(id))planCritical.push(`${labelFor(id,PLAN_CATALOG)}: no hay una indicación respaldada por este caso.`);
  if(d.plan.includes('discharge')&&rubric.diagnosis!=='gilbert')planCritical.push('El alta sin controles deja sin atender una enfermedad que requiere seguimiento.');
  if(d.plan.includes('mycophenolate')&&rubric.diagnosis==='aih'&&!d.plan.includes('reproductive'))planCritical.push('Micofenolato requiere un plan explícito de anticoncepción y seguridad reproductiva por su teratogenicidad.');
  if(d.plan.includes('mycophenolate')&&rubric.diagnosis==='aih'&&!d.plan.some(id=>['steroids','immunosuppression'].includes(id)))planCritical.push('Micofenolato aislado no constituye el plan de inducción de esta hepatitis activa. Define el corticoide de inducción o un esquema de inmunosupresión coordinado con hepatología.');
  const treatmentGaps=d.plan.some(id=>medicationIds.includes(id))?missingEvidence(c,rubric.treatmentEvidence):[];
  const basePlanScore=planCritical.length?0:halfPoint(3*(1-missingPlans.length/requiredPlans.length));
  const planScore=cautious&&!planCritical.length?2.5:treatmentGaps.length?Math.min(1.5,basePlanScore):basePlanScore;
  const pilotPlan=Martin.isMartin(caseData)&&!allowLegacy?Martin.lookup(Martin.plans,d.planChoice):null;
  const checkedPlanScore=pilotPlan?Math.min(planScore,pilotPlan.maxCredit):planScore;
  parts.push({id:'plan',title:'Conducta y tratamiento',max:3,score:checkedPlanScore,
    missing:[...(cautious?['Definir la intervención tras completar los datos']:missingPlans.map(x=>criterionIds(x).map(id=>labelFor(id,PLAN_CATALOG)).join(' / '))),...evidenceLabels(treatmentGaps).map(x=>`Revisar ${x} antes de iniciar el tratamiento`)],
    evidenceMissing:evidenceLabels(treatmentGaps),critical:planCritical,
    explanation:cautious?'Un plan provisional sin un tratamiento no respaldado conserva seguridad. Aún debes resolver la investigación y acordar la intervención específica.':treatmentGaps.length?'La intervención elegida requiere completar su respaldo diagnóstico o la valoración previa de seguridad. Elegir el tratamiento esperado no sustituye esa evaluación.':caseData.explanations.plan,
    notes:d.plan.includes('mycophenolate')&&rubric.diagnosis==='aih'?['Su selección exige anticoncepción efectiva y planificación de suspensión/cambio antes del embarazo; discutir una alternativa compatible.']:[]});
  const followCriteria=rubric.followup.map(criterion=>({ids:criterionIds(criterion),
    good:criterionIds(criterion).some(id=>d.followup.includes(id)&&(rubric.followTimes[id]||[]).includes(d.schedules[id])&&!(id==='fibrosis'&&rubric.secondaryFibrosisIndeterminate&&c.reviewed.includes('elastography')&&fibrosisPending(c,caseData)&&d.schedules[id]==='12mo'))}));
  const followMissing=followCriteria.filter(x=>!x.good).map(x=>x.ids.map(id=>labelFor(id,FOLLOWUP_CATALOG)).join(' / '));
  if(d.followup.includes('none'))followupCritical.push('No se definieron criterios de seguimiento o reconsulta.');
  parts.push({id:'followup',title:'Seguimiento y plazos',max:2,score:followupCritical.length?0:cautious&&rubric.diagnosis!=='dili'?2:halfPoint(2*followCriteria.filter(x=>x.good).length/followCriteria.length),
    missing:cautious&&rubric.diagnosis!=='dili'?[]:followMissing,critical:followupCritical,explanation:cautious&&rubric.diagnosis!=='dili'?'Programaste un control para integrar la evaluación pendiente. Si aparecen alarmas, se adelanta la reevaluación.':rubric.diagnosis==='pbc'?'Controlar bioquímica cada 3–6 meses y síntomas según necesidad; valorar formalmente la respuesta a UDCA a los 12 meses. Esperar un año para el primer control confunde dos tareas distintas.':rubric.followupExplanation,
    notes:rubric.secondaryFibrosisIndeterminate&&c.reviewed.includes('elastography')&&fibrosisPending(c,caseData)?['La rigidez de 8,9 kPa requiere integrar el siguiente paso; programa un control con los resultados adicionales, sin dejar esa incertidumbre hasta el año.']:[]});
  if(procedures.length)parts.push({id:'procedures',title:'Procedimientos sin indicación',max:0,score:-procedures.reduce((sum,id)=>sum+(id==='biopsy'?1.5:1),0),missing:[],unnecessary:procedures.map(id=>labelFor(id,STUDY_CATALOG)),explanation:'La TC implica contraste y radiación; la biopsia, un procedimiento invasivo. En este escenario no había una pregunta adicional que justificara esos riesgos. Se descuenta crédito adicional por la indicación, sin simular una complicación.',notes:[]});
  if(d.autoFailedByDiagnosis===true&&!diagnosisCorrect){
    const diagPart=parts.find(x=>x.id==='diagnosis');
    if(diagPart){diagPart.score=0;diagPart.missing=[labelFor(rubric.diagnosis,DIAGNOSIS_CATALOG)];}
    const autoNote='Calificada automáticamente como incorrecta (0 pts) al seleccionar un diagnóstico principal incorrecto. ';
    for(const [id,title,exp] of [
      ['interpretation','KFT 1 · Decisión diagnóstica',assessInterpretation(c,caseData).explanation],
      ['plan','KFT 2 · Conducta y tratamiento',caseData.explanations.plan],
      ['followup','Seguimiento y plazos',rubric.followupExplanation]
    ]){
      const part=parts.find(x=>x.id===id);
      if(part)Object.assign(part,{title,score:0,missing:['Establecer primero el diagnóstico correcto'],explanation:autoNote+exp,notes:[],critical:[],evidenceMissing:[]});
    }
    planCritical.splice(0);followupCritical.splice(0);
  }else{
    if(Hector.isHector(caseData)&&!allowLegacy)Hector.assessParts(c,parts,planCritical,followupCritical);
    if(Valeria.isValeria(caseData)&&!allowLegacy)Valeria.assessParts(c,parts,planCritical,followupCritical);
    if(Ernesto.isErnesto(caseData)&&!allowLegacy)Ernesto.assessParts(c,parts,planCritical,followupCritical);
    if(Lucia.isLucia(caseData)&&!allowLegacy)Lucia.assessParts(c,parts,planCritical,followupCritical);
    if(Andres.isAndres(caseData)&&!allowLegacy)Andres.assessParts(c,parts,planCritical,followupCritical);
    if(Rosa.isRosa(caseData)&&!allowLegacy)Rosa.assessParts(c,parts,planCritical,followupCritical);
    if(Diego.isDiego(caseData)&&!allowLegacy)Diego.assessParts(c,parts,planCritical,followupCritical);
    if(Elena.isElena(caseData)&&!allowLegacy)Elena.assessParts(c,parts,planCritical,followupCritical);
    if(Sofia.isSofia(caseData)&&!allowLegacy)Sofia.assessParts(c,parts,planCritical,followupCritical);
  }
  for(const [key,id] of [['kftFibrosisChoice','interpretation'],['kftStudiesChoice','interpretation'],['planChoice','plan'],['followupChoice','followup']])if(d[key]==='missing-evidence'){
    const part=parts.find(x=>x.id===id);if(part)Object.assign(part,{score:0,missing:['Estudios necesarios no revisados'],explanation:'La pregunta se calificó con cero porque faltaban resultados necesarios.',evidenceMissing:['Estudios necesarios no revisados']});
  }
  if(d.sctChoice==='missing-evidence')parts.push({id:'sct-missing',title:'SCT · Información insuficiente',max:0,score:0,missing:['Estudios necesarios no revisados'],explanation:'Pregunta sin responder por falta de resultados. El SCT es formativo y no tiene puntuación numérica.'});
  const critical=[...planCritical,...followupCritical];
  const score=Math.max(0,parts.reduce((sum,p)=>sum+p.score,0));
  const adequate=score===10&&!critical.length&&parts.every(p=>!p.missing.length&&!p.unnecessary?.length);
  return {score,max:10,adequate,parts,critical,expectedDiagnosis:labelFor(rubric.diagnosis,DIAGNOSIS_CATALOG),
    title:adequate?'Conducta adecuada':critical.length?'La conducta necesita una corrección':'Conducta parcialmente adecuada',
    summary:adequate?'La valoración, los estudios, la interpretación, la conducta y el seguimiento son coherentes con este escenario.':critical.length?'Hay una decisión con riesgo o sin indicación que debes revisar. La devolución detalla el problema.':cautious?'El plan provisional conserva incertidumbre y seguridad. La investigación aún necesita completarse.':'Hay elementos bien resueltos y aspectos que ajustar: datos pendientes, interpretación, proporcionalidad de estudios o plazos.',
    initialHypothesis:c.hypothesis?{...c.hypothesis}:null,finalHypothesis:currentHypothesis(c)?{...currentHypothesis(c)}:null};
}

function sanitizeConsultation(saved,caseData){
  const c=initialConsultation();if(!saved||saved.caseId!==caseData.id||saved.version!==2)return c;
  c.assessmentVersion=saved.assessmentVersion===3?3:2;
  c.choiceSeed=cleanChoiceSeed(saved.choiceSeed);
  for(const key of ['history','exam','seated'])c[key]=saved[key]===true;
  const maxExam=Array.isArray(caseData?.exam)?caseData.exam.length:3;
  c.examChecks=Array.isArray(saved.examChecks)?[...new Set(saved.examChecks.filter(i=>Number.isInteger(i)&&i>=0&&i<maxExam))]:(c.exam?Array.from({length:maxExam},(_,i)=>i):[]);
  if(c.exam&&!c.examChecks.length)c.examChecks=Array.from({length:maxExam},(_,i)=>i);
  c.asked=validIds(saved.asked,HISTORY_TOPICS);c.history=c.history&&c.asked.length>0;
  if (Elena.isElena(caseData) && (c.asked.length>0 || ['intro','playing','fallen'].includes(saved.elenaEmergencyPhase))) {
    c.elenaEmergencyPhase = ['intro','playing','fallen'].includes(saved.elenaEmergencyPhase) ? saved.elenaEmergencyPhase : 'intro';
    c.emergencyHelpCalled = saved.emergencyHelpCalled === true && c.elenaEmergencyPhase !== 'intro';
    if (!c.emergencyHelpCalled && c.elenaEmergencyPhase === 'fallen' && ['esperar','endoscopia'].includes(saved.elenaWrongChoice)) {
      c.elenaWrongChoice = saved.elenaWrongChoice;
      c.elenaWrongPhase = saved.elenaWrongPhase === 'done' ? 'done' : 'active';
      if (c.elenaWrongPhase === 'done') {
        c.elenaPhone = ['answered','talking'].includes(saved.elenaPhone) ? saved.elenaPhone : 'ringing';
        if (c.elenaPhone === 'talking') c.elenaPhoneStep = Number.isInteger(saved.elenaPhoneStep) ? Math.max(0,Math.min(4,saved.elenaPhoneStep)) : 0;
      }
    }
    if (c.emergencyHelpCalled && ['arrival','attention','departure','arrived','complete'].includes(saved.elenaRescuePhase)) {
      c.elenaRescuePhase = saved.elenaRescuePhase === 'complete' ? 'complete' : 'arrival';
      if (c.elenaRescuePhase === 'complete') {
        const phase = saved.elenaEpilogue;
        c.elenaEpilogue = ['scene1','scene2','scene3','scene4','badCinema','economicNarrative','economicReport','final'].includes(phase) ? phase : phase === 'scene2done' ? 'scene3' : phase === 'done' ? 'scene2' : 'scene1';
        c.elenaEpilogoRecepcion=saved.elenaEpilogoRecepcion===true;
        if(Number.isFinite(saved.elenaBadTime))c.elenaBadTime=Math.max(0,saved.elenaBadTime);
        if(Number.isFinite(saved.elenaBadOffset))c.elenaBadOffset=Math.max(0,saved.elenaBadOffset);
        if (c.elenaEpilogue === 'final') c.elenaDemoComplete = true;
      }
    }
  }
  for(const key of ['text','differential','rationale'])c.hypothesisDraft[key]=clinicalText(saved.hypothesisDraft?.[key]);
  const cleanHypothesis=h=>h&&typeof h.text==='string'&&h.text.trim().length>=4&&typeof h.rationale==='string'&&h.rationale.trim().length>=4?{text:clinicalText(h.text),differential:clinicalText(h.differential),rationale:clinicalText(h.rationale),control:Number.isInteger(h.control)&&h.control>=0?h.control:0}:null;
  if(c.history&&c.exam)c.hypothesis=cleanHypothesis(saved.hypothesis);
  if(c.history&&c.exam){
    c.revisions=Array.isArray(saved.revisions)?saved.revisions.map(cleanHypothesis).filter(Boolean).slice(0,50):[];
    // Several orders may belong to the same control. Preserve their chronology,
    // and require a later control before safety results unlock procedures.
    const received=validIds(saved.received,STUDY_CATALOG),orderedAt=new Map();
    const controls=Number.isInteger(saved.controls)&&saved.controls>=0&&saved.controls<=30?saved.controls:0;
    let previousControl=0;
    if(Array.isArray(saved.orderLog))for(const batch of saved.orderLog.slice(0,30)){
      const control=batch?.control;
      if(!Number.isInteger(control)||control<previousControl||control>controls)break;
      const tests=validIds(batch?.tests,STUDY_CATALOG).filter(id=>!c.orders.includes(id));
      if(!tests.length||tests.some(id=>(STUDY_CATALOG.find(s=>s.id===id).prerequisites||[]).some(req=>!received.includes(req)||!orderedAt.has(req)||orderedAt.get(req)>=control)))break;
      c.orders.push(...tests);c.orderLog.push({batch:c.orderLog.length+1,control,tests,...(Array.isArray(batch.reviewed)?{reviewed:validIds(batch.reviewed,STUDY_CATALOG).filter(id=>c.orders.includes(id)&&received.includes(id)&&orderedAt.get(id)<control)}:{}),hypothesis:cleanHypothesis(batch.hypothesis)||c.hypothesis&&{...c.hypothesis}||null});
      for(const id of tests)orderedAt.set(id,control);
      previousControl=control;
    }
    c.controls=controls;c.received=c.orders.filter(id=>received.includes(id)&&orderedAt.get(id)<controls);
  }
  c.reviewed=validIds(saved.reviewed,STUDY_CATALOG).filter(id=>c.received.includes(id));c.cart=validIds(saved.cart,STUDY_CATALOG).filter(id=>canOrderStudy(c,id));
  const d=saved.decisions||{};
  c.decisions.diagnosis=DIAGNOSIS_CATALOG.some(x=>x.id===d.diagnosis)?d.diagnosis:'';
  c.decisions.autoFailedByDiagnosis=d.autoFailedByDiagnosis===true&&Boolean(c.decisions.diagnosis)&&c.decisions.diagnosis!==caseData.rubric.diagnosis;
  c.decisions.interpretationChoice=interpretationChoicesFor(c.decisions.diagnosis).some(x=>x.id===d.interpretationChoice)?d.interpretationChoice:'';
  if(Martin.isMartin(caseData)){
    c.decisions.sctChoice=Martin.lookup(Martin.sct,d.sctChoice)?.id||'';
    const fib=Martin.lookup(Martin.fibrosis,d.kftFibrosisChoice);
    if(fib&&c.decisions.sctChoice&&fib.interpretation===c.decisions.interpretationChoice)c.decisions.kftFibrosisChoice=fib.id;
  }
  for(const key of ['diagnosisText','planText','followupText'])c.decisions[key]=clinicalText(d[key]);
  c.decisions.plan=validIds(d.plan,PLAN_CATALOG);c.decisions.followup=validIds(d.followup,FOLLOWUP_CATALOG);
  for(const id of c.decisions.followup)if(TIMEFRAME_CATALOG.some(x=>x.id===d.schedules?.[id]))c.decisions.schedules[id]=d.schedules[id];
  const pickedPlan=Martin.isMartin(caseData)&&c.decisions.sctChoice?Martin.lookup(Martin.plans,d.planChoice):planChoicesFor(c.decisions.diagnosis).find(x=>x.id===d.planChoice);
  if(pickedPlan&&pickedPlan.plan.length===c.decisions.plan.length&&pickedPlan.plan.every(id=>c.decisions.plan.includes(id)))c.decisions.planChoice=d.planChoice;
  const pickedFollowup=Martin.isMartin(caseData)&&c.decisions.sctChoice?Martin.lookup(Martin.followups,d.followupChoice):followupChoicesFor(c.decisions.diagnosis).find(x=>x.id===d.followupChoice);
  if(pickedFollowup&&Object.keys(pickedFollowup.schedules).length===c.decisions.followup.length&&Object.entries(pickedFollowup.schedules).every(([id,time])=>c.decisions.followup.includes(id)&&c.decisions.schedules[id]===time))c.decisions.followupChoice=d.followupChoice;
  for(const id of ['fib4','r','meldNa','meld3','childPugh'])if(Number.isFinite(saved.calculations?.[id])&&saved.calculations[id]>=0)c.calculations[id]=saved.calculations[id];
  if(Hector.isHector(caseData))Hector.restore(c,d);
  const legacyHector=Hector.isHector(caseData)&&Boolean(saved.outcome)&&!Number.isInteger(d.hectorStep);
  if(Valeria.isValeria(caseData))Valeria.restore(c,d);
  const legacyValeria=Valeria.isValeria(caseData)&&Boolean(saved.outcome)&&!Number.isInteger(d.valeriaStep);
  if(Ernesto.isErnesto(caseData))Ernesto.restore(c,d);
  const legacyErnesto=Ernesto.isErnesto(caseData)&&Boolean(saved.outcome)&&!Number.isInteger(d.ernestoStep);
  if(Lucia.isLucia(caseData))Lucia.restore(c,d);
  const legacyLucia=Lucia.isLucia(caseData)&&Boolean(saved.outcome)&&!Number.isInteger(d.luciaStep);
  if(Andres.isAndres(caseData))Andres.restore(c,d);
  const legacyAndres=Andres.isAndres(caseData)&&Boolean(saved.outcome)&&!Number.isInteger(d.andresStep);
  if(Rosa.isRosa(caseData))Rosa.restore(c,d);
  const legacyRosa=Rosa.isRosa(caseData)&&Boolean(saved.outcome)&&!Number.isInteger(d.rosaStep);
  if(Diego.isDiego(caseData))Diego.restore(c,d);
  const legacyDiego=Diego.isDiego(caseData)&&Boolean(saved.outcome)&&!Number.isInteger(d.diegoStep);
  if(Elena.isElena(caseData))Elena.restore(c,d);
  const legacyElena=Elena.isElena(caseData)&&Boolean(saved.outcome)&&!Number.isInteger(d.elenaStep);
  if(Sofia.isSofia(caseData))Sofia.restore(c,d);
  const legacySofia=Sofia.isSofia(caseData)&&Boolean(saved.outcome)&&!Number.isInteger(d.sofiaStep);
  const legacyMartin=Martin.isMartin(caseData)&&Boolean(saved.outcome)&&!saved.decisions?.sctChoice;
  c.outcome=saved.outcome?assessConsultation(c,caseData,{allowLegacy:c.assessmentVersion===2||legacyMartin||legacySofia||legacyElena||legacyDiego||legacyRosa||legacyAndres||legacyLucia||legacyErnesto||legacyValeria||legacyHector}):null;
  if(c.outcome)answerChallenge(c,caseData,saved.challenge?.choiceId);
  c.returnVisit=sanitizeReturnVisit(saved.returnVisit,c,caseData);
  return c;
}

return {initialConsultation,recordHypothesis,currentHypothesis,canOrderStudy,requestStudies,receiveStudies,resultFor,reviewResult,readyForDecisions,studyBundleState,toggleStudyBundle,selectPlanChoice,selectInterpretationChoice,selectFollowupChoice,selectSctChoice,selectMartinFibrosisChoice,decisionsComplete,answerChallenge,assessConsultation,sanitizeConsultation};
})();

