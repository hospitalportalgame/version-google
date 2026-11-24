/* HOSPITAL PORTAL — piloto de razonamiento clínico exclusivamente para Martín.
 * Los demás casos y los catálogos generales permanecen intactos.
 * Las distribuciones de expertos SCT no están disponibles: sin nota SCT validada.
 */
window.HepatoDay1Modules['martin-reasoning.mjs'] = (() => {
  const ID='masld-intro-v1-reasoning-v2';
  const isMartin=caseData=>caseData?.id===ID;
  const sct=[
    {id:'-2',title:'−2 · Mucho menos probable'},
    {id:'-1',title:'−1 · Menos probable'},
    {id:'0',title:'0 · No modifica la probabilidad'},
    {id:'1',title:'+1 · Más probable'},
    {id:'2',title:'+2 · Mucho más probable'}
  ];
  const fibrosis=[
    {id:'fibrosis-a',title:'Riesgo bajo y reevaluación proporcionada',detail:'Intervenir sobre factores metabólicos y reevaluar FIB-4; ampliar antes ante persistencia o alarmas.',interpretation:'masld-low',credit:1},
    {id:'fibrosis-b',title:'Elastografía ahora y tratamiento metabólico desde hoy',detail:'Completar estratificación sin asumir fibrosis avanzada ni retrasar intervención.',interpretation:'masld-low',credit:1},
    {id:'fibrosis-c',title:'Biopsia antes de intervenir',detail:'Determinar el estadio histológico de rutina antes de modificar hábitos.',interpretation:'masld-significant',credit:0},
    {id:'fibrosis-d',title:'Descartar fibrosis y suspender evaluaciones',detail:'No reevaluar mientras permanezca asintomático.',interpretation:'masld-secondary',credit:0}
  ];
  const plans=[
    {id:'martin-plan-a',title:'Plan metabólico integral adaptado al trabajo',detail:'Objetivos de peso, alimentación y actividad realistas, control de diabetes y lípidos, sin suspender estatina sin motivo.',plan:['metabolic','nutrition','alarm-network'],maxCredit:3},
    {id:'martin-plan-b',title:'Suspender atorvastatina y centrarse en hábitos',detail:'Retirar la estatina por ALT leve, y revisar el tratamiento lipídico después.',plan:['nutrition','review-meds','alarm-network'],maxCredit:.5},
    {id:'martin-plan-c',title:'Mantener fármacos y reforzar solo ejercicio',detail:'Posponer la optimización integral de diabetes, nutrición y objetivos de peso.',plan:['monitor-specific','alarm-network'],maxCredit:1},
    {id:'martin-plan-d',title:'Esperar la elastografía para comenzar el tratamiento',detail:'Aplazar medidas metabólicas hasta conocer la rigidez hepática.',plan:['stage-fibrosis','continue-workup','alarm-network'],maxCredit:.5}
  ];
  const followups=[
    {id:'martin-follow-a',title:'Control metabólico cercano y fibrosis periódica',detail:'Revisar evolución clínica y metabólica ~3 meses; FIB-4 en 1–2 años, antes ante persistencia >6 meses o alarmas.',schedules:{'liver-metabolic':'3mo',fibrosis:'12mo'}},
    {id:'martin-follow-b',title:'Solo control bioquímico y metabólico',detail:'Revisar transaminasas y HbA1c a tres meses sin planificar reevaluación de fibrosis.',schedules:{'liver-metabolic':'3mo'}},
    {id:'martin-follow-c',title:'Elastografía trimestral por rutina',detail:'Control intensivo sin indicación por los datos actuales.',schedules:{fibrosis:'3mo'}},
    {id:'martin-follow-d',title:'Alta del seguimiento hepático',detail:'Reconsultar únicamente ante síntomas como ictericia o ascitis.',schedules:{'symptom-change':'as-needed'}}
  ];
  const missingChoice={id:'missing-evidence',title:'Información insuficiente',credit:0,maxCredit:0,why:'No se revisaron los estudios necesarios para responder esta pregunta.',plan:['nutrition'],schedules:{'symptom-change':'as-needed'},interpretation:'masld-low'};
  const missing=(c,step)=>({1:['profile','cbc'],2:['profile','cbc','ultrasound'],3:['metabolic']}[step]||[]).filter(id=>!c.reviewed.includes(id));
  const lookup=(array,id)=>id==='missing-evidence'?missingChoice:array.find(x=>x.id===id);
  const ready= d=>Boolean(lookup(sct,d?.sctChoice)&&lookup(fibrosis,d?.kftFibrosisChoice)&&lookup(plans,d?.planChoice)&&lookup(followups,d?.followupChoice));
  function nextStep(d){
    if(!d?.diagnosis)return 0;
    if(!lookup(sct,d.sctChoice))return 1;
    if(!lookup(fibrosis,d.kftFibrosisChoice))return 2;
    if(!lookup(plans,d.planChoice))return 3;
    return 4;
  }
  const feedback=d=>{
    const choice=lookup(sct,d?.sctChoice),fib=lookup(fibrosis,d?.kftFibrosisChoice),plan=lookup(plans,d?.planChoice),follow=lookup(followups,d?.followupChoice);
    if(!choice)return '';
    const sctInterpret=Number(choice.id)<0?'Identificaste correctamente que el índice desplaza la sospecha hacia un riesgo menor.':'El FIB-4 de 1,02 se sitúa por debajo de 1,3 en este paciente de 46 años, por lo que disminuye, y no aumenta, la sospecha de fibrosis avanzada.';
    const reasons={
      'fibrosis-a':'Estrategia proporcionada: bajo riesgo actual, sin descartar fibrosis para siempre; intervenir sobre comorbilidades y reevaluar.',
      'fibrosis-b':'Alternativa aceptable: una elastografía no invasiva puede ser razonable por la diabetes y el contexto, aunque no es obligatoria en todos los pacientes con FIB-4 bajo.',
      'fibrosis-c':'La biopsia no se justifica de rutina antes de las medidas metabólicas con estos datos; añade riesgos sin necesidad inicial.',
      'fibrosis-d':'El FIB-4 bajo no equivale a ausencia de toda fibrosis ni cancela el seguimiento en un paciente diabético.'
    };
    const planReasons={
      'martin-plan-a':'El tratamiento comienza hoy: peso, nutrición, actividad, diabetes y lípidos; el trabajo como conductor requiere metas sostenibles. La elevación leve de ALT no obliga a suspender una estatina indicada.',
      'martin-plan-b':'Suspender atorvastatina de manera automática por una ALT levemente elevada no está justificado en este escenario y deja menos protegido el riesgo cardiovascular.',
      'martin-plan-c':'Solo reforzar ejercicio y esperar bioquímica deja sin abordar alimentación, peso y optimización de comorbilidades.',
      'martin-plan-d':'Esperar una elastografía para actuar sobre el riesgo metabólico retrasa medidas beneficiosas que no dependen del estadio de fibrosis.'
    };
    const followReasons={
      'martin-follow-a':'Control clínico/metabólico inicial cercano y reevaluación periódica de fibrosis en diabetes, adelantando estudio si la elevación de enzimas supera seis meses o hay discordancias.',
      'martin-follow-b':'El control metabólico es útil, pero debe quedar un plan explícito de reevaluación del riesgo de fibrosis.',
      'martin-follow-c':'La elastografía trimestral sin nueva indicación supone sobreinvestigación; el seguimiento debe responder al riesgo y la evolución.',
      'martin-follow-d':'La ausencia de síntomas no excluye progresión de enfermedad metabólica: no es apropiado perder el seguimiento.'
    };
    return [
      {title:'SCT · Cómo actualizaste la sospecha',text:`Elegiste ${choice.title}. ${sctInterpret} El índice no excluye por completo fibrosis avanzada y debe interpretarse con sus limitaciones. La intensidad −1 frente a −2 no se califica sin un panel de expertos real: este SCT es solo formativo.`},
      {title:'KFT 1 · Decisión sobre fibrosis',text:`Elegiste «${fib?.title||'sin respuesta'}». ${reasons[fib?.id]||''}`},
      {title:'KFT 2 · Conducta terapéutica',text:`Elegiste «${plan?.title||'sin respuesta'}». ${planReasons[plan?.id]||''}`},
      {title:'Seguimiento · Continuidad de la atención',text:`Elegiste «${follow?.title||'sin respuesta'}». ${followReasons[follow?.id]||''}`}
    ];
  };
  return {missing,ID,isMartin,sct,fibrosis,plans,followups,lookup,ready,nextStep,feedback};
})();
