/* Embedded original source: src/clinica/dia1/razonamiento.js */
/* Módulo Día 1 original: clinical-reasoning.mjs. Lógica clínica conservada. */
window.HepatoDay1Modules['clinical-reasoning.mjs'] = (() => {
// Assessment only. These rules never select or reorder the player's cards.
const has=(c,...ids)=>ids.every(id=>c.reviewed.includes(id));
const caseFib4=p=>(p.age*p.ast)/(p.platelets*Math.sqrt(p.alt));

function fibrosisPending(c,caseData){
  if(caseData.rubric.conditionalPlan!=='fibrosis')return false;
  if(caseData.rubric.diagnosis==='masld')return !c.reviewed.includes('biopsy')&&(!c.reviewed.includes('elastography')||caseData.rubric.secondaryFibrosisIndeterminate);
  return !c.reviewed.includes('elastography')&&!c.reviewed.includes('biopsy');
}

function studyAppropriateness(c,caseData){
  const r=caseData.rubric,accepted=new Set([...r.essential,...r.optional,...(r.reasonable||[])]);
  const biopsyLog=c.orderLog.find(log=>log.tests.includes('biopsy'));
  const knownAtBiopsy=biopsyLog?.reviewed||c.orderLog.filter(log=>log.control<biopsyLog?.control).flatMap(log=>log.tests);
  // A biopsy can resolve Elena's indeterminate secondary test. It must follow
  // an available elastography, rather than being ordered routinely up front.
  if(r.diagnosis==='masld'&&caseData.rubric.secondaryFibrosisIndeterminate){
    const orderedAt=id=>c.orderLog.find(log=>log.tests.includes(id))?.control;
    if(knownAtBiopsy.includes('elastography')&&orderedAt('biopsy')>orderedAt('elastography'))accepted.add('biopsy');
  }
  if(r.diagnosis==='hfe'&&!knownAtBiopsy.includes('elastography')){
    if(['iron','hfe'].every(id=>knownAtBiopsy.includes(id)))accepted.add('biopsy');
  }
  const lowValue=c.orders.filter(id=>!accepted.has(id));
  return {lowValue,procedures:lowValue.filter(id=>['ct','biopsy'].includes(id))};
}

function expectedInterpretation(c,caseData){
  const diagnosis=caseData.rubric.diagnosis;
  if(caseData.rubric.diagnosticEvidence.some(criterion=>!(Array.isArray(criterion)?criterion:[criterion]).some(id=>c.reviewed.includes(id))))return 'data-pending';
  if(diagnosis==='masld'){
    if(!has(c,'profile','cbc'))return 'data-pending';
    if(c.reviewed.includes('biopsy')&&caseData.rubric.secondaryFibrosisIndeterminate)return 'masld-significant';
    return caseFib4(caseData.patient)<(caseData.patient.age>65?2:1.3)?'masld-low':'masld-secondary';
  }
  return {'gilbert':'gilbert-pattern','inactive-hbv':'hbv-serial','active-hcv':'hcv-active','hfe':'iron-integrated','pbc':'pbc-integrated','dili':'dili-pattern','aih':'aih-integrated','compensated-csph':'portal-integrated'}[diagnosis]||'data-pending';
}

function assessInterpretation(c,caseData){
  const expected=expectedInterpretation(c,caseData),chosen=c.decisions.interpretationChoice;
  let score=chosen===expected?1:0;
  if(expected==='data-pending'&&c.decisions.diagnosis!=='undetermined')score=Math.min(.5,score);
  const notes=[],missing=[];
  const diagnosis=caseData.rubric.diagnosis,p=caseData.patient;
  const explanations={
    'masld-low':`FIB-4 ${caseFib4(p).toFixed(2).replace('.',',')} indica bajo riesgo actual de fibrosis avanzada; no excluye toda fibrosis. La diabetes exige control metabólico y reevaluación periódica.`,
    'masld-secondary':c.reviewed.includes('elastography')?'FIB-4 2,26 supera el umbral inferior de 2,0 para mayores de 65 años. La rigidez de 8,9 kPa queda en una zona indeterminada: no confirma cirrosis ni permite dar por resuelta la fibrosis. Integra evaluación adicional con hepatología.':'FIB-4 2,26, a los 68 años, supera el umbral inferior de 2,0. Requiere una estrategia de evaluación secundaria; por sí solo no confirma cirrosis. Una intervención metabólica intensiva con reevaluación al año es otra ruta posible si se acuerda explícitamente.',
    'masld-significant':'La biopsia solicitada muestra lesión esteatohepatítica y fibrosis F2, sin cirrosis. Su resultado establece el estadio; si antes se revisó una prueba no invasiva indeterminada, aporta una respuesta adicional.',
    'gilbert-pattern':'Predomina la bilirrubina indirecta; el resto del perfil, la hemoglobina y el estudio de hemólisis son normales. El patrón recurrente y los desencadenantes son concordantes con Gilbert.',
    'hbv-serial':'HBsAg durante más de un año, HBeAg negativo, ADN bajo y ALT normal en registros seriados apoyan baja actividad actual. No equivale a curación ni elimina la evaluación de coinfecciones, fibrosis y riesgo de cáncer.',
    'hcv-active':'El ARN confirma infección activa. La fibrosis se evalúa por separado: FIB-4 menor de 3,25, plaquetas conservadas y ausencia de signos clínicos de cirrosis permiten la ruta simplificada de este caso. La ecografía no es una obligación en esta ruta sin cirrosis.',
    'iron-integrated':'Saturación de transferrina de 76 %, ferritina elevada y homocigosis C282Y apoyan sobrecarga HFE. La ferritina sola no establece la etiología; cuantificación por RM y evaluación de fibrosis son decisiones distintas.',
    'pbc-integrated':'Colestasis persistente, AMA-M2 positivo y ausencia de obstrucción sostienen CBP. El prurito refleja carga de síntomas; no determina por sí solo el estadio ni la respuesta bioquímica.',
    'dili-pattern':'R ≈ 1,05 clasifica una lesión colestásica. No prueba causalidad ni mide gravedad: integra cronología y exclusiones, y vigila bilirrubina, INR y estado mental. FIB-4 no estadifica esta lesión aguda.',
    'aih-integrated':'Actividad hepatocelular, IgG elevada, autoanticuerpos, histología y exclusión de otras causas sostienen hepatitis autoinmune activa con F2. La inflamación puede elevar índices y rigidez: no sustituye la integración histológica.',
    'portal-integrated':'Hígado nodular, colaterales portosistémicas y trombocitopenia respaldan cirrosis con hipertensión portal significativa. No es necesario añadir elastografía para aceptar esta ruta. La ausencia de descompensación y una ALT casi normal no eliminan el riesgo.',
    'data-pending':'Faltan datos que pueden cambiar la conclusión. Mantener incertidumbre es razonable si se amplía la evaluación y se acuerda un control para integrar los resultados.'
  };
  if(diagnosis==='active-hcv'&&c.reviewed.includes('elastography'))explanations['hcv-active']+=' La rigidez revisada de 7,1 kPa es concordante con ausencia de datos de cirrosis en esta evaluación.';
  if(diagnosis==='active-hcv'&&!has(c,'profile','cbc'))explanations['hcv-active']='El ARN confirma infección activa. Todavía falta integrar perfil, plaquetas, signos de cirrosis y valoración de seguridad antes de usar la ruta simplificada. La carga viral por sí sola no determina el estadio.';
  if(!chosen)missing.push('Interpretación no registrada en la versión anterior');
  else if(chosen!==expected)missing.push('Integrar los datos disponibles y sus límites antes de elegir la conducta');
  const calculations=[['fib4',caseFib4(p)],['r',caseData.rubric.correctR]];
  for(const [calc,correctValue] of calculations){
    if(Number.isFinite(correctValue)&&Number.isFinite(c.calculations[calc])&&Math.abs(c.calculations[calc]-correctValue)>.02){
      score=Math.max(0,score-.5);
      notes.push(`El ${calc==='fib4'?'FIB-4':'cociente R'} calculado no coincide con los datos del informe. Revisa unidades y transcripción; el valor esperado con esos datos es ${correctValue.toFixed(2).replace('.',',')}.`);
      missing.push('Comprobar los datos usados en la calculadora');
    }
  }
  return {id:'interpretation',title:'Interpretación clínica',max:1,score,missing,notes,explanation:explanations[expected]};
}

return {caseFib4,fibrosisPending,studyAppropriateness,expectedInterpretation,assessInterpretation};
})();

