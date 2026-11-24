/* Embedded original source: src/clinica/dia1/caso-inicial.js */
/* Módulo Día 1 original: case.mjs. Lógica clínica conservada. */
window.HepatoDay1Modules['case.mjs'] = (() => {
// Clinical content stays independent of room, rendering, and input systems.
const CASE = {
  id: 'masld-intro-v1', name: 'Una consulta de rutina', specialty: 'Hepatología',
  patient: {name:'Martín', age:46, sex:'Masculino', bmi:31.2, ast:44, alt:68, platelets:240},
  description: 'Un hallazgo en la ecografía. Una oportunidad para prevenir.',
  history: [
    {title:'Motivo de consulta', text:'«Me hice una ecografía por un chequeo y me dijeron que tengo grasa en el hígado. ¿Es algo grave?» Martín, 46 años, trae todos sus estudios.'},
    {title:'Antecedentes y exposición', text:'Diabetes tipo 2, obesidad y dislipidemia. Toma metformina y atorvastatina desde hace dos años, sin cambios recientes. Alcohol: 0–10 g por semana. Niega suplementos, hierbas y otros fármacos. Sin antecedentes familiares de hepatopatía.'},
    {title:'Evolución', text:'Asintomático. Elevación leve de ALT documentada hace ocho semanas; previamente normal. Niega síntomas de alarma.'}
  ],
  exam:[
    {title:'Signos vitales y antropometría',text:'PA 132/82 mmHg. IMC 31,2 kg/m². Paciente lúcido, en buen estado general.'},
    {title:'Inspección y examen general',text:'Sin ictericia, edema ni estigmas de hepatopatía crónica.'},
    {title:'Examen abdominal',text:'Abdomen blando, indoloro. Sin ascitis ni otros signos clínicos de descompensación.'}
  ],
  studies: {
    lab: {title:'Laboratorio', subtitle:'Extracción · hace 3 días', rows:[
      ['AST','44 U/L','10–40','high'],['ALT','68 U/L','7–40','high'],['Fosfatasa alcalina','88 U/L','40–130',''],['Bilirrubina total','0,7 mg/dL','0,2–1,2',''],['Albúmina','4,3 g/dL','3,5–5,0',''],['INR','1,0','0,8–1,2',''],['Plaquetas','240 ×10⁹/L','150–400',''],['HbA1c','7,2 %','<5,7','high'],['Triglicéridos','215 mg/dL','<150','high'] ], note:'Elevación leve de aminotransferasas. Función sintética conservada. Los intervalos son los de este laboratorio ficticio.'},
    serology: {title:'Estudios etiológicos', subtitle:'Resultados aportados por el paciente', rows:[
      ['HBsAg','Negativo','—',''],['Anti-HBc total','Negativo','—',''],['Anti-VHC','Negativo','—',''],['Ferritina','165 ng/mL','30–400',''],['Saturación transferrina','26 %','20–45',''],['IgG','1.100 mg/dL','700–1.600',''],['ANA / ASMA','Negativos','—',''] ], note:'No se identifica una causa viral, sobrecarga de hierro ni evidencia serológica de hepatitis autoinmune en este escenario. Un resultado aislado no excluye todas las etiologías.'},
    ultrasound: {title:'Ecografía abdominal', subtitle:'Informe · hace 1 semana', report:'Hígado de contornos regulares, con aumento difuso de la ecogenicidad compatible con esteatosis. Sin lesiones focales. Vía biliar no dilatada. Vena porta permeable. Bazo de tamaño normal. Sin líquido libre.', note:'La ecografía describe esteatosis; no confirma MASH ni determina el estadio de fibrosis.'}
  },
  questions: [
    {id:'diagnosis', title:'¿Cuál es tu impresión diagnóstica?', description:'Integra la historia, las exposiciones y los estudios.', options:[
      {id:'masld',title:'Enfermedad hepática esteatósica metabólica (MASLD)',detail:'Esteatosis con factores cardiometabólicos.',correct:true},
      {id:'dili',title:'Lesión hepática por fármacos',detail:'Atribuir la elevación a la atorvastatina.',correct:false},
      {id:'obstruction',title:'Obstrucción de la vía biliar',detail:'Interpretar la esteatosis como colestasis.',correct:false}
    ]},
    {id:'plan',title:'¿Qué plan propones hoy?',description:'El paciente está estable y el riesgo de fibrosis avanzada es bajo.',options:[
      {id:'steroids',title:'Iniciar corticoides',detail:'Tratar una supuesta inflamación autoinmune.',correct:false},
      {id:'metabolic',title:'Plan de hábitos y control cardiometabólico',detail:'Nutrición, actividad física, peso, diabetes y lípidos.',correct:true},
      {id:'dismiss',title:'Dar el alta sin intervención',detail:'La grasa hepática no requiere un plan.',correct:false}
    ]},
    {id:'followup',title:'¿Cómo organizarías el seguimiento?',description:'El FIB-4 orienta el riesgo; no reemplaza la evaluación clínica.',options:[
      {id:'biopsy',title:'Biopsia hepática inmediata',detail:'Realizarla de rutina por la ecografía.',correct:false},
      {id:'never',title:'No volver a controlar',detail:'Un FIB-4 bajo descarta toda enfermedad futura.',correct:false},
      {id:'monitor',title:'Seguimiento clínico y reevaluación del riesgo',detail:'Control de hábitos y metabolismo; FIB-4 en 1–2 años.',correct:true}
    ]}
  ],
  sources:[
    {label:'AASLD · evaluación no invasiva',url:'https://www.aasld.org/liver-fellow-network/core-series/clinical-pearls/spare-me-jab-noninvasive-assessment-patients-masld'},
    {label:'AASLD · Practice Guidance 2023',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC10735173/'},
    {label:'EASL–EASD–EASO · MASLD 2024',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC11299976/'}
  ]
};
function fib4(p=CASE.patient) {return p.age*p.ast/(p.platelets*Math.sqrt(p.alt));}

return {CASE,fib4};
})();

