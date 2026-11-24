/* Embedded original source: src/clinica/dia1/simulaciones.js */
/* Módulo Día 1 original: simulation-cases.mjs. Lógica clínica conservada. */
window.HepatoDay1Modules['simulation-cases.mjs'] = (() => {
const {CASES} = window.HepatoDay1Modules['cases.mjs'];
const {createStudyResults} = window.HepatoDay1Modules['study-catalog.mjs'];
const HISTORY_TOPICS=[
  {id:'background',title:'Antecedentes personales'},
  {id:'medications',title:'Medicamentos y suplementos'},
  {id:'exposures',title:'Alcohol, exposiciones y procedimientos'},
  {id:'evolution',title:'Cronología y síntomas asociados'},
  {id:'context',title:'Familia, entorno y proyectos personales'},
  {id:'probe-1',title:'Pregunta dirigida de profundización'},
  {id:'probe-2',title:'Pregunta dirigida de profundización'}
];
const DIAGNOSIS_CATALOG=[
  {id:'undetermined',title:'Etiología aún no definida'},
  {id:'alcohol',title:'Enfermedad hepática asociada al alcohol'},
  {id:'aih',title:'Hepatitis autoinmune activa'},
  {id:'obstruction',title:'Obstrucción de la vía biliar'},
  {id:'acute-hepatitis',title:'Hepatitis viral aguda'},
  {id:'active-hbv',title:'Hepatitis B crónica inmunoactiva'},
  {id:'inactive-hbv',title:'Infección crónica por VHB de baja actividad actual'},
  {id:'active-hcv',title:'Infección activa por VHC'},
  {id:'resolved-hcv',title:'Exposición previa al VHC sin infección activa'},
  {id:'pbc',title:'Colangitis biliar primaria'},
  {id:'psc',title:'Colangitis esclerosante primaria'},
  {id:'hfe',title:'Hemocromatosis HFE con sobrecarga de hierro'},
  {id:'hemolysis',title:'Hiperbilirrubinemia por hemólisis'},
  {id:'gilbert',title:'Síndrome de Gilbert'},
  {id:'masld',title:'MASLD sin cirrosis confirmada'},
  {id:'dili',title:'Probable lesión hepática por fármacos'},
  {id:'compensated-csph',title:'Cirrosis compensada con hipertensión portal significativa'},
  {id:'decompensated',title:'Cirrosis descompensada'},
  {id:'wilson',title:'Enfermedad de Wilson'}
];
const PLAN_CATALOG=[
  {id:'metabolic',title:'Plan de hábitos y control cardiometabólico',group:'Medidas generales'},
  {id:'reassure',title:'Explicación y medidas generales, sin fármaco específico',group:'Medidas generales'},
  {id:'monitor-specific',title:'Observación activa con controles específicos',group:'Medidas generales'},
  {id:'review-meds',title:'Revisar medicación, interacciones y exposiciones',group:'Medidas generales'},
  {id:'avoid-drug',title:'Evitar reexposición al fármaco sospechoso y documentarlo',group:'Medidas generales'},
  {id:'contacts',title:'Evaluar contactos y ofrecer vacunación a susceptibles',group:'Medidas generales'},
  {id:'reproductive',title:'Acordar seguridad y planificación reproductiva',group:'Medidas generales'},
  {id:'alarm-network',title:'Dar signos de alarma y acceso a reevaluación',group:'Medidas generales'},
  {id:'nutrition',title:'Plan nutricional y prevención de sarcopenia',group:'Medidas generales'},
  {id:'continue-workup',title:'Ampliar evaluación y citar con los nuevos resultados',group:'Evaluación y tratamiento'},
  {id:'stage-fibrosis',title:'Completar estadificación no invasiva de fibrosis',group:'Evaluación y tratamiento'},
  {id:'daa',title:'Antivirales de acción directa para el VHC',group:'Evaluación y tratamiento'},
  {id:'phlebotomy',title:'Flebotomías supervisadas',group:'Evaluación y tratamiento'},
  {id:'iron-chelation',title:'Quelación de hierro',group:'Evaluación y tratamiento'},
  {id:'hbv-antiviral',title:'Tratamiento antiviral para el VHB',group:'Evaluación y tratamiento'},
  {id:'udca',title:'Ácido ursodesoxicólico',group:'Evaluación y tratamiento'},
  {id:'pruritus',title:'Tratamiento dirigido del prurito',group:'Evaluación y tratamiento'},
  {id:'immunosuppression',title:'Inmunosupresión coordinada con hepatología',group:'Evaluación y tratamiento'},
  {id:'steroids',title:'Corticoides sistémicos',group:'Evaluación y tratamiento'},
  {id:'mycophenolate',title:'Micofenolato',group:'Evaluación y tratamiento'},
  {id:'carvedilol',title:'Betabloqueante no selectivo, valorando tolerancia',group:'Evaluación y tratamiento'},
  {id:'iron-supplement',title:'Suplementación de hierro',group:'Evaluación y tratamiento'},
  {id:'antibiotic',title:'Antibiótico empírico',group:'Evaluación y tratamiento'},
  {id:'diuretics',title:'Diuréticos',group:'Evaluación y tratamiento'},
  {id:'discharge',title:'Alta sin nuevos controles hepáticos',group:'Ámbito de atención'},
  {id:'urgent',title:'Evaluación urgente o ingreso hospitalario',group:'Ámbito de atención'}
];
const FOLLOWUP_CATALOG=[
  {id:'liver-metabolic',title:'Control clínico, perfil hepático y objetivos metabólicos'},
  {id:'fibrosis',title:'Reevaluación del riesgo de fibrosis'},
  {id:'symptom-change',title:'Reevaluar si cambia el patrón o aparecen síntomas nuevos'},
  {id:'review-results',title:'Control para integrar los estudios pendientes'},
  {id:'hbv-monitor',title:'ALT, ADN-VHB y reevaluación de fase'},
  {id:'svr',title:'ARN-VHC para documentar respuesta virológica sostenida'},
  {id:'hcv-rna-on-treatment',title:'ARN-VHC durante el tratamiento'},
  {id:'iron-monitor',title:'Hemoglobina y ferritina durante el tratamiento'},
  {id:'family-screen',title:'Evaluación de familiares de primer grado'},
  {id:'biochemical',title:'Valorar respuesta bioquímica al tratamiento'},
  {id:'close-inr',title:'Vigilar síntomas, bilirrubina e INR'},
  {id:'aih-remission',title:'Aminotransferasas, IgG y seguridad de la inmunosupresión'},
  {id:'hcc',title:'Vigilancia con ecografía y AFP'},
  {id:'portal',title:'Prevención portal y control de presión, pulso y función renal'},
  {id:'none',title:'Sin seguimiento ni criterios de reconsulta'}
];
const TIMEFRAME_CATALOG=[
  {id:'48-72h',title:'48–72 horas'}, {id:'2wk',title:'1–2 semanas'}, {id:'1mo',title:'Un mes'},
  {id:'3mo',title:'Tres meses'}, {id:'6mo',title:'Seis meses'}, {id:'12wk-post',title:'12 semanas o más después de terminar el tratamiento'},
  {id:'12mo',title:'Un año'}, {id:'24mo',title:'Dos años'}, {id:'as-needed',title:'Según cambios clínicos, con criterios de reconsulta'}
];

const initialVisits=[
  {name:'Derivación por un chequeo',complaint:'«Me derivaron porque en un chequeo salieron alteradas unas pruebas del hígado. No siento nada. ¿Qué tengo que hacer?»',answers:{background:'Diabetes tipo 2, obesidad y dislipidemia. Sin enfermedad hepática diagnosticada previamente.',medications:'Metformina y atorvastatina desde hace dos años, sin cambios recientes. Niega suplementos y hierbas.',exposures:'Alcohol: 0–10 g por semana. Sin transfusiones ni procedimientos recientes; no uso de drogas inyectables.',evolution:'El hallazgo fue hace ocho semanas. No trae los valores del chequeo. Niega ictericia, prurito, dolor, edema, sangrado o confusión.',context:'Sin antecedentes familiares de enfermedad hepática. Le preocupa si debe dejar de trabajar.'}},
  {name:'Un cambio intermitente',complaint:'«A veces se me ponen un poco amarillos los ojos, sobre todo cuando rindo exámenes. Después se me pasa.»',answers:{background:'Sin enfermedades crónicas ni antecedentes de anemia. Episodios similares desde la adolescencia.',medications:'No usa medicamentos habituales, anticonceptivos, suplementos ni hierbas.',exposures:'Alcohol ocasional, <10 g por semana. En épocas de estudio pasa muchas horas sin comer y toma poca agua.',evolution:'El cambio dura unos días y se resuelve. Sin fiebre, dolor, prurito, coluria, pérdida de peso ni palidez.',context:'Su padre tuvo episodios parecidos. Desea saber si necesita tratamiento; no busca embarazo actualmente.'}},
  
  {
    name: 'Una consulta inesperada',
    complaint: '«Doctora, últimamente me siento muy cansada. Desde ayer tengo un malestar en el estómago y hoy me he sentido algo mareada.»',
    answers: {
      background: 'Diabetes tipo 2, hipertensión arterial y obesidad. Nunca le diagnosticaron cirrosis ni otra enfermedad hepática avanzada.',
      medications: 'Metformina y losartán como tratamiento habitual. Niega anticoagulantes, antiinflamatorios recientes, suplementos y hierbas.',
      exposures: 'No consume alcohol actualmente. No refiere transfusiones ni procedimientos recientes.',
      evolution: 'Cansancio progresivo durante las últimas semanas. Desde ayer presenta deposiciones muy oscuras, casi negras. Esta mañana sintió debilidad y mareo al caminar. No refiere episodios previos de hematemesis.',
      context: 'Vive con su pareja. Acudió pensando que se trataba de un problema digestivo menor y esperaba regresar a casa después de la consulta.'
    }
  },

  {name:'Un hallazgo al donar',complaint:'«Hace más de un año, en una donación me dijeron que un resultado no estaba bien. Me siento bien, pero me recomendaron controles.»',answers:{background:'Sin cirrosis conocida ni episodios de descompensación. No recibe tratamiento para el hallazgo.',medications:'Sin medicación habitual, suplementos ni inmunosupresión prevista.',exposures:'Nació y creció en España y no ha vivido en otros países. Sin alcohol ni uso de drogas inyectables. No transfusiones recientes. No sabe cómo se produjo el hallazgo.',evolution:'Está asintomático. Ya se hizo algunos controles en otro centro; los registros pueden recuperarse con el nuevo estudio solicitado.',context:'Pareja vacunada frente al VHB, con inmunidad documentada. Quiere revisar la protección de convivientes. Sin familiares con cáncer hepático.'}},
  {name:'Consulta después de un chequeo',complaint:'«En un chequeo me recomendaron consultar por un resultado. Hace años que no revisaba mi salud y estoy un poco cansada.»',answers:{background:'Nunca recibió tratamiento para una infección hepática. Menopausia; sin descompensación previa.',medications:'Omeprazol y simvastatina. No hierbas ni otros suplementos.',exposures:'Transfusión en 1988. Sin alcohol actual ni drogas inyectables.',evolution:'Cansancio leve; sin ictericia, ascitis, confusión ni hemorragia digestiva. No aporta los informes del chequeo.',context:'Quiere estudiar y tratar lo que corresponda. No posibilidad de embarazo actual; tiene acceso a controles.'}},
  {name:'Cansancio y dolor articular',complaint:'«Estoy cansado y me duelen estos nudillos. Mi hermano tuvo algo parecido y lo trataron sacándole sangre.»',answers:{background:'No diabetes, anemia ni enfermedad hepática conocida. Dolor en segundo y tercer nudillos de ambas manos.',medications:'Sin suplementos de hierro, medicamentos nuevos ni hierbas.',exposures:'No transfusiones. Alcohol <20 g por semana. Sin procedimientos recientes.',evolution:'Cansancio de varios meses. No ictericia, ascitis, sangrado ni confusión.',context:'Un hermano fue tratado con flebotomías; desconoce el nombre de la enfermedad. Tiene familiares de primer grado dispuestos a consultar.'}},
  {name:'Picazón nocturna',complaint:'«Me pica todo, sobre todo por la noche. Las cremas no me ayudan y casi no puedo dormir.»',answers:{background:'Tiroiditis autoinmune. Sin enfermedad hepática diagnosticada.',medications:'Levotiroxina estable. No nuevos medicamentos, hierbas ni suplementos.',exposures:'Sin alcohol significativo ni exposiciones recientes. No embarazo.',evolution:'Prurito de ocho meses, sin erupción primaria. Sin fiebre, dolor biliar, ictericia progresiva ni edema.',context:'El problema altera su sueño y su trabajo. Sin familiares con enfermedad hepática conocida.'}},
  {name:'Picazón de inicio reciente',complaint:'«Desde hace unos días me pica y noto algo de color amarillo. No tengo dolor, pero me preocupa.»',answers:{background:'Sin enfermedad hepática previa. Infección dental reciente, ya resuelta.',medications:'Amoxicilina/clavulánico durante siete días; terminó hace tres semanas. Sin otros fármacos nuevos, suplementos ni hierbas.',exposures:'No alcohol. No reexposición al antibiótico ni contactos enfermos.',evolution:'Síntomas desde hace cinco días. Afebril, sin dolor, vómitos, confusión, sangrado ni ascitis; puede comer.',context:'Puede acceder a un control precoz y a atención urgente si empeora. No antecedentes familiares relevantes.'}},
  {name:'Astenia sostenida',complaint:'«Estoy cansada desde hace meses. Me dijeron que había que estudiar el hígado. También quiero saber cómo puede afectar mis planes.»',answers:{background:'Sin enfermedad crónica conocida ni tratamiento hepático previo.',medications:'Niega fármacos nuevos, hierbas y suplementos. No tratamiento inmunosupresor previo.',exposures:'No alcohol ni exposiciones que recuerde. No transfusiones.',evolution:'Astenia de tres meses; sin confusión, ascitis, sangrado ni ictericia progresiva. No aporta los valores previos.',context:'Desea embarazo en uno o dos años. No está embarazada actualmente; quiere participar en las decisiones de tratamiento.'}},
  {name:'Control por un hallazgo previo',complaint:'«En otro centro me dijeron que debía estudiar mejor el hígado. Me siento bien y quiero saber qué tengo que vigilar.»',answers:{background:'Diabetes tipo 2. Nunca tuvo ascitis, encefalopatía o sangrado digestivo. No asma, bloqueo cardíaco ni enfermedad renal conocida.',medications:'Metformina. No recibe betabloqueante ni diuréticos; sin hierbas o suplementos.',exposures:'No alcohol actual; consumo previo escaso. Sin otra exposición identificada.',evolution:'Sin edema, melena, confusión ni pérdida involuntaria de peso. No trae un informe diagnóstico concluyente.',context:'Apoyo familiar y acceso a controles. Inmunidad frente a VHA y VHB documentada en el registro de vacunación.'}}
];

// These rubrics are read only by the final debrief, never by a pre-closure UI.
const consultationRubrics=[
  {diagnosis:'masld',history:['background','medications','exposures'],essential:['profile','cbc','inr','metabolic','hbv','hcv','iron','ultrasound'],optional:['autoimmune','elastography','renal'],plan:['metabolic'],followup:['liver-metabolic','fibrosis'],timeframes:['3mo','6mo','12mo'],allowed:['reassure','monitor-specific','review-meds','alarm-network','nutrition','contacts'],unnecessary:['ct','biopsy','iron_mri','hfe'],studyExplanation:'Caracteriza la alteración, revisa síntesis y plaquetas, descarta causas frecuentes y confirma el hallazgo estructural. La biopsia y la TC no aportaban valor inicial en este escenario.',followupExplanation:'Control del plan metabólico y del perfil hepático; por diabetes, reevaluar FIB-4 en 1–2 años. Persistencia >6 meses o discordancia requiere ampliar evaluación.'},
  {diagnosis:'gilbert',history:['medications','evolution','context'],essential:['profile','cbc','hemolysis'],optional:['inr'],plan:['reassure'],followup:['symptom-change'],timeframes:['as-needed'],allowed:['review-meds','alarm-network','discharge'],unnecessary:['ct','biopsy','iron_mri','hfe','elastography'],studyExplanation:'La fracción indirecta, el resto del perfil normal y la ausencia de hemólisis sostienen el diagnóstico. No era necesario recurrir a biopsia o imagen avanzada.',followupExplanation:'Explicación de desencadenantes y criterios para reevaluar cambios de patrón. No precisa controles hepáticos intensivos por este patrón típico.'},
  {diagnosis:'masld',history:['background','medications','exposures'],essential:['profile','cbc','inr','metabolic','hbv','hcv','iron','ultrasound'],optional:['elastography','autoimmune','renal'],secondaryFibrosisIndeterminate:true,plan:['metabolic'],conditionalPlan:'fibrosis',followup:['liver-metabolic',['review-results','fibrosis']],timeframes:['1mo','3mo','6mo'],allowed:['reassure','monitor-specific','review-meds','alarm-network','nutrition','stage-fibrosis','continue-workup','contacts'],unnecessary:['ct','biopsy','iron_mri','hfe'],studyExplanation:'El FIB-4 de 2,26, a los 68 años, supera el umbral inferior de 2,0. Completar evaluación secundaria; este dato solo no confirma cirrosis.',followupExplanation:'Recupera la evaluación secundaria y ajusta el seguimiento. Si ya pediste elastografía, integra su resultado y posibles discordancias.'},
  {diagnosis:'inactive-hbv',history:['evolution','exposures','context'],essential:['profile','cbc','inr','hbv','hbv_dna','hdv','hcv','hiv','ultrasound','elastography'],optional:['renal'],plan:['monitor-specific','contacts'],followup:['hbv-monitor'],timeframes:['3mo','6mo'],allowed:['review-meds','alarm-network','nutrition','stage-fibrosis','continue-workup'],unnecessary:['ct','biopsy','iron_mri','hfe'],studyExplanation:'La duración del HBsAg, HBeAg, ADN y ALT seriados permiten caracterizar la fase; la evaluación de fibrosis ayuda a individualizar decisiones.',followupExplanation:'ALT y ADN-VHB seriados, reevaluación de fibrosis, transmisión e indicación de tratamiento. Individualizar vigilancia de cáncer según riesgos; no dar alta definitiva por ALT normal.'},
  {diagnosis:'active-hcv',history:['medications','exposures','evolution'],essential:['profile','cbc','renal','hbv','hcv_rna','hiv'],optional:['inr','hcv','ultrasound','elastography','iron','autoimmune'],plan:['daa','review-meds'],followup:['svr'],timeframes:['12wk-post'],allowed:['reassure','alarm-network','nutrition','contacts','stage-fibrosis'],unnecessary:['ct','biopsy','iron_mri','hfe'],studyExplanation:'El ARN documenta infección activa. Antes del antiviral, evalúa cirrosis, función renal, coinfecciones e interacciones; no basta con anti-VHC.',followupExplanation:'ARN-VHC a las 12 semanas o más de finalizar para comprobar respuesta virológica sostenida. El anticuerpo puede permanecer positivo.'},
  {diagnosis:'hfe',history:['background','exposures','context'],essential:['profile','cbc','inr','iron','hfe'],optional:['elastography','iron_mri','hbv','hcv','ultrasound','renal'],plan:['phlebotomy'],conditionalPlan:'fibrosis',followup:['iron-monitor','family-screen'],timeframes:['2wk','1mo'],allowed:['review-meds','alarm-network','nutrition','stage-fibrosis','continue-workup'],unnecessary:['ct','biopsy'],studyExplanation:'La saturación, ferritina y homocigosis C282Y sostienen sobrecarga HFE. Evaluar daño orgánico y fibrosis; la ferritina sola no establece la etiología.',followupExplanation:'Hemoglobina y ferritina guían las flebotomías. Evaluar familiares de primer grado. La vigilancia de cáncer depende de fibrosis avanzada.'},
  {diagnosis:'pbc',history:['background','medications','evolution'],essential:['profile','inr','autoimmune','ultrasound'],optional:['cbc','hbv','hcv','elastography','renal'],plan:['udca','pruritus'],followup:['biochemical'],timeframes:['3mo','6mo'],allowed:['review-meds','alarm-network','nutrition','stage-fibrosis','monitor-specific'],unnecessary:['ct','biopsy','iron_mri','hfe'],studyExplanation:'Colestasis persistente, AMA y exclusión de obstrucción permiten integrar el diagnóstico. No requiere biopsia rutinaria ante un patrón típico sin datos de superposición.',followupExplanation:'Control bioquímico y evaluación formal de respuesta a UDCA a los 12 meses; ajustar riesgo y seguimiento según estadio. El alivio del prurito no sustituye la evaluación de la enfermedad.'},
  {diagnosis:'dili',history:['medications','exposures','evolution'],essential:['profile','cbc','inr','hbv','hcv_rna','acute_virus','autoimmune','ultrasound'],optional:['renal','hcv'],correctR:(94/40)/(290/130),plan:['avoid-drug','review-meds','alarm-network'],followup:['close-inr'],timeframes:['48-72h'],allowed:['pruritus','monitor-specific','continue-workup','reassure'],unnecessary:['ct','biopsy','iron_mri','hfe','elastography'],studyExplanation:'La cronología y la exclusión de etiologías sostienen una DILI probable. R = 1,05 clasifica el patrón colestásico, no la gravedad. FIB-4 no sirve para estadificar esta lesión aguda.',followupExplanation:'En este paciente estable: control precoz de síntomas, bilirrubina e INR, con acceso a reevaluación. Confusión, sangrado, aumento del INR o deterioro obligan a cambiar el ámbito de atención.'},
  {diagnosis:'aih',history:['medications','exposures','context'],essential:['profile','cbc','inr','hbv','hcv_rna','acute_virus','autoimmune','ultrasound','biopsy'],optional:['wilson','pregnancy','tpmt','renal','hcv','hiv','metabolic','iron'],plan:[['immunosuppression','steroids','mycophenolate'],'reproductive','review-meds'],followup:['aih-remission'],timeframes:['2wk','1mo'],allowed:['alarm-network','nutrition','monitor-specific','immunosuppression','steroids','mycophenolate'],unnecessary:['ct','iron_mri','hfe'],studyExplanation:'Integra actividad, IgG, autoanticuerpos, histología y exclusión de causas. La serología sola no establece el diagnóstico. Revisa seguridad del tratamiento y planificación reproductiva.',followupExplanation:'Aminotransferasas e IgG para respuesta y hemograma/otros controles de seguridad según tratamiento. Planificar embarazo con enfermedad controlada; no suspender por mejoría sintomática temprana.'},
  {diagnosis:'compensated-csph',history:['background','medications','evolution'],essential:['profile','cbc','inr','renal','ultrasound'],optional:['elastography','hbv','hcv','iron','autoimmune','metabolic'],plan:['carvedilol'],followup:['hcc','portal'],timeframes:['6mo'],allowed:['metabolic','nutrition','review-meds','alarm-network','stage-fibrosis','monitor-specific'],unnecessary:['ct','biopsy','iron_mri','hfe'],studyExplanation:'Contorno nodular, colaterales, trombocitopenia y rigidez elevada apoyan cirrosis compensada con hipertensión portal. Una ALT casi normal no descarta enfermedad avanzada.',followupExplanation:'Vigilancia semestral con ecografía y AFP. Control más temprano de presión, pulso y función renal al iniciar el betabloqueante. Si no puede recibirlo, definir estrategia endoscópica de prevención variceal.'}
];
const followTimeRules=[
  {'liver-metabolic':['3mo','6mo','12mo'],fibrosis:['12mo','24mo']},
  {'symptom-change':['as-needed']},
  {'liver-metabolic':['1mo','3mo','6mo'],'review-results':['1mo','3mo'],fibrosis:['6mo','12mo']},
  {'hbv-monitor':['3mo','6mo','12mo']},
  {svr:['12wk-post']},
  {'iron-monitor':['2wk','1mo'],'family-screen':['1mo','3mo','6mo']},
  {biochemical:['3mo','6mo']},
  {'close-inr':['48-72h']},
  {'aih-remission':['2wk','1mo']},
  {hcc:['6mo'],portal:['2wk','1mo']}
];

// These lists support assessment after closure. They never choose the menus.
// Diagnostic evidence is separate from general workup and treatment safety.
const diagnosticEvidence=[
  ['profile','ultrasound','hbv','hcv'],
  ['profile','cbc','hemolysis'],
  ['profile','ultrasound','hbv','hcv'],
  ['profile','hbv','hbv_dna'],
  ['hcv_rna'],
  ['iron','hfe'],
  ['profile','autoimmune','ultrasound'],
  ['profile','hbv','hcv_rna','acute_virus','autoimmune','ultrasound'],
  ['profile','autoimmune','biopsy','hbv','hcv_rna','acute_virus'],
  ['cbc','ultrasound']
];
const treatmentEvidence=[
  [],[],[],[],
  ['profile','cbc','renal','hbv','hiv','hcv_rna'],
  ['cbc','iron','hfe'],
  ['profile','autoimmune','ultrasound'],
  [],
  ['profile','cbc','inr','autoimmune','biopsy','hbv','hcv_rna','acute_virus'],
  ['profile','cbc','renal','ultrasound']
];

const SIMULATIONS=CASES.map((base,index)=>({
  id:`${base.id}-reasoning-v2`,level:base.level,patient:base.patient,
  name:initialVisits[index].name,description:'Consulta ambulatoria · evaluación por realizar',
  complaint:initialVisits[index].complaint,answers:initialVisits[index].answers,exam:base.exam,
  results:createStudyResults(base,index),rubric:{...consultationRubrics[index],followTimes:followTimeRules[index],diagnosticEvidence:diagnosticEvidence[index],treatmentEvidence:treatmentEvidence[index],
    ...(index===3?{followupExplanation:'La baja actividad está documentada durante un año: ALT y ADN a 3, 6 o 12 meses son opciones razonables en este escenario estable. Reevaluar HBsAg periódicamente, fibrosis y riesgo de CHC según edad, origen, familia y evolución. Diego nació y vivió en España, sin cirrosis ni historia familiar de CHC: no se impone vigilancia semestral por el HBsAg aislado. Si el riesgo cambia, añadir vigilancia; adelantar controles ante cambios clínicos o inmunosupresión.'}:{})},
  explanations:{...Object.fromEntries(base.questions.map(q=>[q.id,q.explanation])),
    ...(index===8?{plan:'Inducción con corticoide y un ahorrador, coordinando selección y controles con hepatología. Azatioprina o micofenolato son alternativas según contexto; el micofenolato es teratógeno y no es un esquema de inducción aislado. Incorpora anticoncepción y planificación del embarazo con la enfermedad controlada.'}:{})},
  sources:index===3?[...base.sources,{label:'EASL · hepatitis B 2025: seguimiento individualizado',url:'https://easlcampus.eu/sites/default/files/2025-08/EASL_CPGs_on_management_of_HBV_infection.pdf'}]:base.sources
}));

// Catálogo independiente de la jornada.
// Conservamos los identificadores actuales de los casos.
const PATIENT_CATALOG = Object.fromEntries(
  SIMULATIONS.map(patient => [patient.id, patient])
);

// Recupera los pacientes en el orden solicitado por la agenda.
function getPatientsByIds(patientIds) {
  if (!Array.isArray(patientIds)) {
    throw new Error('La agenda debe contener una lista de pacientes.');
  }

  return patientIds.map(patientId => {
    if (!Object.hasOwn(PATIENT_CATALOG, patientId)) {
      throw new Error(`Paciente desconocido: ${patientId}`);
    }

    return PATIENT_CATALOG[patientId];
  });
}
// Agenda de la demo: cada jornada referencia pacientes del catálogo.
const DAY_AGENDAS = {
  1: [
    'masld-intro-v1-reasoning-v2',
    'gilbert-v1-reasoning-v2'
  ],
  
2: [
    'masld-intro-v1-reasoning-v2',
    'gilbert-v1-reasoning-v2',
    'masld-older-v1-reasoning-v2'
  ]

};

function getPatientsForDay(day) {
  const patientIds = DAY_AGENDAS[day];

  if (!patientIds) {
    throw new Error(`No hay agenda definida para el día ${day}.`);
  }

  return getPatientsByIds(patientIds);
}
return {
  HISTORY_TOPICS,
  DIAGNOSIS_CATALOG,
  PLAN_CATALOG,
  FOLLOWUP_CATALOG,
  TIMEFRAME_CATALOG,
  SIMULATIONS,
  PATIENT_CATALOG,
  getPatientsByIds,
  DAY_AGENDAS,
  getPatientsForDay
};
})();

