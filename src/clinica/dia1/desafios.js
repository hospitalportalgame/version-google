/* Embedded original source: src/clinica/dia1/desafios.js */
/* Módulo Día 1 original: clinical-challenges.mjs. Lógica clínica conservada. */
window.HepatoDay1Modules['clinical-challenges.mjs'] = (() => {
// Optional learning questions for the completed outpatient consultations.
// This module has no clinical-state dependency. The UI must call it only after
// closure; first-attempt persistence and extra points belong to the campaign.
// The public question never contains a solution, scoring flag or explanation.
const choice=(id,title,detail)=>({id,title,detail});
const catalog={
  'masld-intro-v1':{
    id:'masld-intro-extra-v1',title:'Hasta dónde llegan los datos',
    prompt:'La ecografía muestra esteatosis y el FIB-4 de Martín es bajo. ¿Qué conclusión está respaldada?',
    choices:[
      choice('option-1','Esteatosis metabólica y riesgo bajo','Bajo riesgo actual de fibrosis avanzada; mantener seguimiento.'),
      choice('option-2','Esteatohepatitis ya confirmada','Esteatosis por imagen con enzimas elevadas permite atribuir inflamación esteatohepatítica sin histología.'),
      choice('option-3','Fibrosis totalmente descartada','El valor bajo descarta fibrosis de cualquier grado durante los próximos años.')
    ],correctChoiceId:'option-1',
    explanation:'La esteatosis y el contexto cardiometabólico apoyan MASLD. El FIB-4 bajo orienta a bajo riesgo actual de fibrosis avanzada; no demuestra ausencia de toda fibrosis. La ecografía no confirma MASH.'
  },
  'gilbert-v1':{
    id:'gilbert-extra-v1',title:'Una bilirrubina, varias explicaciones',
    prompt:'Sofía tiene bilirrubina indirecta elevada. ¿Qué datos ayudan a descartar hemólisis en esta consulta?',
    choices:[
      choice('option-1','Los episodios y su antecedente familiar','La historia familiar sugiere un patrón hereditario pero no excluye hemólisis.'),
      choice('option-2','Hemograma y marcadores de hemólisis','Hemoglobina, reticulocitos, LDH, haptoglobina y frotis sin alteraciones.'),
      choice('option-3','Las aminotransferasas normales','No hay daño hepatocelular; eso por sí solo no informa sobre destrucción de eritrocitos.')
    ],correctChoiceId:'option-2',
    explanation:'El hemograma y los marcadores de hemólisis normales no aportan evidencia de destrucción aumentada de eritrocitos en este escenario. Los antecedentes y las enzimas normales ayudan a integrar el caso, pero no sustituyen esa evaluación.'
  },
  'masld-older-v1':{
    id:'masld-older-extra-v1',title:'La edad cambia el umbral',
    prompt:'Elena tiene 68 años y FIB-4 de 2,26. ¿Qué lectura hace adecuada una evaluación secundaria?',
    choices:[
      choice('option-1','La síntesis está conservada','La albúmina y el INR normales permiten descartar fibrosis avanzada en esta paciente.'),
      choice('option-2','Los contornos son regulares','El contorno regular de la ecografía basta para descartar fibrosis avanzada.'),
      choice('option-3','Supera el umbral para su edad','En mayores de 65 años, este resultado supera 2,0 y merece otra prueba.')
    ],correctChoiceId:'option-3',
    explanation:'En mayores de 65 años se utiliza 2,0 como umbral inferior del FIB-4. El 2,26 de Elena justifica evaluación secundaria; no confirma cirrosis. La síntesis conservada y los contornos regulares no cierran por sí solos la evaluación de fibrosis.'
  },
  'hbv-monitor-v1':{
    id:'hbv-monitor-extra-v1',title:'Una fase que puede cambiar',
    prompt:'Diego está asintomático y su VHB tiene baja actividad actual. ¿Qué información permite reevaluar esa actividad en el seguimiento?',
    choices:[
      choice('option-1','La evolución de ALT y ADN-VHB','Integrar sus controles seriados con la evaluación clínica y de fibrosis.'),
      choice('option-2','La persistencia del HBsAg','El HBsAg persistentemente positivo permite conocer la fase y su actividad.'),
      choice('option-3','La ausencia de síntomas','Si no aparecen síntomas, es improbable que ALT o ADN-VHB cambien de forma relevante.')
    ],correctChoiceId:'option-1',
    explanation:'ALT y ADN-VHB seriados permiten reconocer cambios de actividad. La persistencia del HBsAg documenta infección crónica, pero no basta para caracterizar su actividad. Sentirse bien tampoco reemplaza los controles; la fase actual puede cambiar.'
  },
  'hcv-treatment-v1':{
    id:'hcv-treatment-extra-v1',title:'Anticuerpo no es infección activa',
    prompt:'El anti-VHC de Rosa puede seguir positivo incluso tras la curación. ¿Qué prueba permite comprobar si persiste infección activa?',
    choices:[
      choice('option-1','Anti-VHC de control','El descenso o desaparición de anti-VHC permite confirmar la curación.'),
      choice('option-2','ARN-VHC','Usar una prueba virológica en el control acordado tras el tratamiento.'),
      choice('option-3','Perfil hepático','La normalización de ALT demuestra que ya no existe replicación detectable.')
    ],correctChoiceId:'option-2',
    explanation:'El ARN-VHC evalúa infección activa; el anticuerpo puede permanecer positivo después de la curación. En este escenario, el seguimiento de referencia comprueba respuesta virológica sostenida con ARN a las 12 semanas o más de finalizar. La ALT normal por sí sola no demuestra erradicación.'
  },
  'hemochromatosis-v1':{
    id:'hemochromatosis-extra-v1',title:'Más que una ferritina',
    prompt:'¿Qué combinación sostiene la sobrecarga HFE de Andrés mejor que una ferritina elevada aislada?',
    choices:[
      choice('option-1','Ferritina y ALT elevadas','La ferritina alta acompañada de ALT elevada permite confirmar hemocromatosis HFE.'),
      choice('option-2','Cansancio y antecedente familiar','El patrón de artropatía y el hermano tratado establecen por sí solos hemocromatosis HFE.'),
      choice('option-3','Hierro y genotipo concordantes','Saturación de 76 %, ferritina elevada y homocigosis C282Y.')
    ],correctChoiceId:'option-3',
    explanation:'La saturación elevada, la ferritina y la homocigosis C282Y sostienen sobrecarga HFE con expresión bioquímica en este caso. La ferritina aislada es inespecífica y el antecedente familiar orienta, pero no sustituye esos resultados. La RM de hierro no es un requisito para esa conclusión en este escenario.'
  },
  'pbc-v1':{
    id:'pbc-extra-v1',title:'El síntoma y la respuesta',
    prompt:'Si Lucía consigue aliviar el prurito, ¿qué sigue siendo necesario para valorar la respuesta de su enfermedad hepática?',
    choices:[
      choice('option-1','Seguir la respuesta bioquímica','Revisar fosfatasa alcalina y bilirrubina, con evaluación formal al año.'),
      choice('option-2','Medir solo el alivio del prurito','La mejoría del sueño es un indicador suficiente de respuesta hepática al UDCA.'),
      choice('option-3','Seguir el título de AMA','El descenso del título AMA reflejaría una respuesta terapéutica completa.')
    ],correctChoiceId:'option-1',
    explanation:'Aliviar el prurito y evaluar la respuesta hepática son objetivos distintos. La respuesta bioquímica a UDCA se valora con parámetros como fosfatasa alcalina y bilirrubina, con evaluación formal alrededor de los 12 meses. El alivio del síntoma o la repetición del AMA no reemplazan ese seguimiento.'
  },
  'dili-cholestatic-v1':{
    id:'dili-cholestatic-extra-v1',title:'Patrón no es gravedad',
    prompt:'El cociente R de Ernesto es aproximadamente 1,05. ¿Qué aporta ese resultado?',
    choices:[
      choice('option-1','La gravedad de la lesión','Un patrón colestásico por cociente R bajo predice evolución sin insuficiencia hepática.'),
      choice('option-2','El patrón bioquímico','Orienta a lesión colestásica; la gravedad se evalúa por separado.'),
      choice('option-3','La causa de la lesión','Una R compatible con colestasis confirma que el antibiótico es la causa.')
    ],correctChoiceId:'option-2',
    explanation:'R = (ALT/LSN ALT)/(FA/LSN FA). El valor de 1,05 clasifica el patrón como colestásico, no su gravedad ni su causa. La cronología y las exclusiones sostienen DILI probable; síntomas, bilirrubina e INR siguen siendo esenciales para vigilar su evolución.'
  },
  'aih-planning-v1':{
    id:'aih-planning-extra-v1',title:'Tratar pensando en el futuro',
    prompt:'Valeria desea embarazo en uno o dos años. Si se considera micofenolato, ¿qué debe formar parte de la decisión desde ahora?',
    choices:[
      choice('option-1','Planificar al acercarse el embarazo','Puede postergarse la elección del fármaco hasta que comience la búsqueda de embarazo.'),
      choice('option-2','Una prueba antes de iniciar','Una prueba de embarazo negativa hoy permite utilizar MMF sin más medidas reproductivas.'),
      choice('option-3','Acordar seguridad reproductiva','Anticoncepción efectiva y planificación del tratamiento antes de buscar embarazo.')
    ],correctChoiceId:'option-3',
    explanation:'Micofenolato es teratógeno. Su consideración exige discutir anticoncepción efectiva y planificar con el equipo una alternativa o cambio antes del embarazo. Puede integrar un esquema individualizado de tratamiento; el problema es omitir esa seguridad, no que el fármaco sea siempre una opción inválida.'
  },
  'cirrhosis-compensated-v1':{
    id:'cirrhosis-compensated-extra-v1',title:'Dos objetivos, dos tiempos',
    prompt:'Si Héctor inicia el betabloqueante, ¿cómo se relacionan el control de tolerancia y la vigilancia de cáncer hepático?',
    choices:[
      choice('option-1','Tolerancia precoz y vigilancia semestral','Presión, pulso y función renal antes; ecografía y AFP cada seis meses.'),
      choice('option-2','Unificar todos los controles a seis meses','El control de tolerancia puede aplazarse hasta la ecografía semestral.'),
      choice('option-3','Bioquímica precoz y vigilancia semestral','La ALT y el INR del primer control permiten valorar tolerancia al carvedilol.')
    ],correctChoiceId:'option-1',
    explanation:'El control precoz de presión, pulso y función renal evalúa tolerancia al betabloqueante. La ecografía y AFP semestrales cumplen otro objetivo: vigilancia de cáncer hepático. La imagen no sustituye los controles de tolerancia y estar compensado no elimina la necesidad de prevención.'
  }
};

const CHALLENGE_CASE_IDS=Object.freeze(Object.keys(catalog));
const baseId=caseId=>typeof caseId==='string'?caseId.replace(/-reasoning-v2$/,''):null;
const entryFor=caseId=>{
  const id=baseId(caseId);
  return id&&Object.hasOwn(catalog,id)?catalog[id]:null;
};
const publicChoice=c=>({id:c.id,title:c.title,detail:c.detail});

function challengeFor(caseId){
  const challenge=entryFor(caseId);
  return challenge?{id:challenge.id,title:challenge.title,prompt:challenge.prompt,choices:challenge.choices.map(publicChoice)}:null;
}

// Stable shuffle: a caller can use a portable round seed without Math.random().
// Alias IDs share the same order. Objects and non-finite seeds use the default.
function challengeChoicesFor(caseId,seed=0){
  const challenge=challengeFor(caseId);
  if(!challenge)return null;
  const safeSeed=typeof seed==='string'?seed:typeof seed==='number'&&Number.isFinite(seed)?String(seed):'0';
  let value=2166136261;
  for(const char of `${baseId(caseId)}:${safeSeed}`){value^=char.codePointAt(0);value=Math.imul(value,16777619)>>>0;}
  const choices=challenge.choices;
  for(let i=choices.length-1;i>0;i--){
    value^=value<<13;value^=value>>>17;value^=value<<5;value>>>=0;
    const j=value%(i+1);[choices[i],choices[j]]=[choices[j],choices[i]];
  }
  return choices;
}

function assessChallenge(caseId,choiceId){
  const challenge=entryFor(caseId);
  if(!challenge||!challenge.choices.some(c=>c.id===choiceId))return null;
  return {choiceId,correct:choiceId===challenge.correctChoiceId,correctChoiceId:challenge.correctChoiceId,explanation:challenge.explanation};
}

return {CHALLENGE_CASE_IDS,challengeFor,challengeChoicesFor,assessChallenge};
})();

