/* Embedded original source: src/clinica/dia1/catalogo-estudios.js */
/* Módulo Día 1 original: study-catalog.mjs. Lógica clínica conservada. */
window.HepatoDay1Modules['study-catalog.mjs'] = (() => {
// The same menu is used for every patient. A test name is never a recommendation.
const STUDY_CATALOG=[
  {id:'profile',title:'Perfil hepático completo',group:'Laboratorio',detail:'AST, ALT, FA, GGT, bilirrubina total/directa y albúmina'},
  {id:'cbc',title:'Hemograma con plaquetas',group:'Laboratorio',detail:'Serie roja, leucocitos y plaquetas'},
  {id:'inr',title:'Tiempo de protrombina e INR',group:'Laboratorio',detail:'Coagulación'},
  {id:'renal',title:'Función renal y electrolitos',group:'Laboratorio',detail:'Creatinina, eGFR, sodio y potasio'},
  {id:'metabolic',title:'Perfil cardiometabólico',group:'Laboratorio',detail:'Glucemia, HbA1c y lípidos'},
  {id:'hbv',title:'Serología del VHB',group:'Virología',detail:'HBsAg, anti-HBc total, anti-HBs, HBeAg y anti-HBe; antecedentes de laboratorio disponibles'},
  {id:'hbv_dna',title:'ADN-VHB cuantitativo',group:'Virología',detail:'PCR y controles previos disponibles'},
  {id:'hdv',title:'Cribado de hepatitis D',group:'Virología',detail:'Anticuerpos totales anti-VHD; ARN-VHD si el cribado es positivo'},
  {id:'hcv',title:'Anticuerpos anti-VHC',group:'Virología',detail:'Serología'},
  {id:'hcv_rna',title:'ARN-VHC cuantitativo',group:'Virología',detail:'PCR'},
  {id:'hiv',title:'VIH Ag/Ac',group:'Virología',detail:'Cribado combinado'},
  {id:'acute_virus',title:'Estudio de hepatitis virales agudas',group:'Virología',detail:'VHA IgM, anti-HBc IgM y VHE IgM/ARN'},
  {id:'iron',title:'Metabolismo del hierro',group:'Etiología',detail:'Ferritina y saturación de transferrina'},
  {id:'hemolysis',title:'Estudio de hemólisis',group:'Etiología',detail:'Reticulocitos, LDH, haptoglobina y frotis'},
  {id:'autoimmune',title:'Autoinmunidad hepática e inmunoglobulinas',group:'Etiología',detail:'ANA, ASMA, AMA-M2, IgG e IgM'},
  {id:'wilson',title:'Ceruloplasmina y cobre urinario',group:'Etiología',detail:'Ceruloplasmina y cobre en orina de 24 horas'},
  {id:'hfe',title:'Genética HFE',group:'Etiología',detail:'Variantes C282Y y H63D'},
  {id:'pregnancy',title:'β-hCG',group:'Seguridad',detail:'Prueba de embarazo, según contexto'},
  {id:'tpmt',title:'Actividad TPMT',group:'Seguridad',detail:'Actividad enzimática previa a tratamiento, según contexto'},
  {id:'ultrasound',title:'Ecografía abdominal con Doppler',group:'Imágenes',detail:'Hígado, vía biliar, porta, bazo y líquido libre'},
  {id:'elastography',title:'Elastografía hepática',group:'Imágenes',detail:'Rigidez y parámetros de validez'},
  {id:'iron_mri',title:'RM para cuantificación de hierro',group:'Imágenes',detail:'Concentración de hierro hepático'},
  {id:'ct',title:'TC abdominal con contraste',group:'Imágenes',detail:'Requiere función renal disponible',prerequisites:['renal']},
  {id:'biopsy',title:'Biopsia hepática programada',group:'Procedimientos',detail:'Requiere hemograma, INR e imagen previos; se realiza en un control simulado',prerequisites:['cbc','inr','ultrasound']}
];

const rawRow=(label,value,reference,flag='')=>[label,String(value),reference,flag];
const rawTable=(id,rows)=>({title:STUDY_CATALOG.find(s=>s.id===id).title,rows,subtitle:'Laboratorio ficticio · control solicitado'});
const rawReport=(id,text)=>({title:STUDY_CATALOG.find(s=>s.id===id).title,report:text,subtitle:'Informe del estudio solicitado',imageKind:'report'});
// Presentation only: measured values retain their precision and numeric inputs.
// Quantification limits, ranges and qualitative reports remain authored text.
const labNumberFormat=new Intl.NumberFormat('es-AR',{maximumSignificantDigits:21});
const decimal=n=>labNumberFormat.format(n);
// PT is derived from INR and reported to a tenth of a second, not to float precision.
const secondsFormat=new Intl.NumberFormat('es-AR',{maximumFractionDigits:1});
const labProfile=[
  {fa:88,ggt:43,bili:.7,direct:.1,albumin:4.3,inr:1,hb:14.5,egfr:96,cr:.9,a1c:7.2,tg:215,ldl:126},
  {fa:70,ggt:17,bili:2.6,direct:.3,albumin:4.6,inr:1,hb:13.4,egfr:110,cr:.7,a1c:5.1,tg:88,ldl:96},
  {fa:90,ggt:59,bili:.8,direct:.2,albumin:4.1,inr:1,hb:13.1,egfr:73,cr:.9,a1c:7.5,tg:204,ldl:118},
  {fa:78,ggt:22,bili:.8,direct:.2,albumin:4.4,inr:1,hb:14.8,egfr:102,cr:.9,a1c:5.3,tg:112,ldl:104},
  {fa:99,ggt:67,bili:.9,direct:.2,albumin:4.2,inr:1,hb:12.9,egfr:84,cr:.8,a1c:5.6,tg:129,ldl:110},
  {fa:85,ggt:52,bili:.9,direct:.2,albumin:4.3,inr:1,hb:15.1,egfr:90,cr:.9,a1c:5.5,tg:122,ldl:114},
  {fa:390,ggt:280,bili:.9,direct:.2,albumin:4.2,inr:1,hb:13.5,egfr:94,cr:.8,a1c:5.4,tg:104,ldl:136},
  {fa:290,ggt:210,bili:2.4,direct:1.8,albumin:4.1,inr:1,hb:14.5,egfr:90,cr:.9,a1c:5.5,tg:115,ldl:112},
  {fa:98,ggt:67,bili:1.1,direct:.3,albumin:4.0,inr:1.05,hb:12.8,egfr:105,cr:.7,a1c:5.2,tg:96,ldl:103},
  {fa:116,ggt:70,bili:.9,direct:.2,albumin:3.8,inr:1.15,hb:13.7,egfr:88,cr:.9,a1c:6.8,tg:160,ldl:102}
];
const echoReports=[
  'Hígado de contornos regulares, con aumento difuso de la ecogenicidad. Sin lesiones focales. Vía biliar no dilatada. Vena porta permeable. Bazo normal. Sin líquido libre.',
  'Hígado de tamaño y ecogenicidad normales. Sin lesión focal. Vía biliar no dilatada. Porta permeable; bazo normal. Sin líquido libre.',
  'Aumento difuso de la ecogenicidad hepática. Contornos regulares. Porta permeable, bazo de tamaño normal. Sin nódulos ni líquido libre.',
  'Hígado de contornos regulares, sin lesiones focales. Porta permeable; bazo normal. Vía biliar no dilatada. Sin líquido libre.',
  'Hígado sin nodularidad ni lesión focal; bazo normal. Vía biliar no dilatada. Porta permeable. Sin líquido libre.',
  'Hígado discretamente aumentado, sin lesión focal ni nodularidad. Porta permeable. Bazo normal. Sin líquido libre.',
  'Vía biliar intra y extrahepática no dilatada. No se identifican cálculos obstructivos ni masas. Contornos hepáticos regulares. Sin líquido libre.',
  'No se identifican dilatación de la vía biliar, cálculos obstructivos ni masas. Vena porta permeable. Sin líquido libre.',
  'Hígado discretamente aumentado; vía biliar no dilatada. Sin lesiones focales, esplenomegalia ni líquido libre.',
  'Hígado de contorno nodular. Bazo de 15 cm. Colaterales portosistémicas. Vena porta permeable. Sin líquido libre ni lesión focal.'
];
const pathologyReports=[
  'Arquitectura conservada. Esteatosis macrovesicular en aproximadamente 25 % de hepatocitos. Sin balonización; inflamación lobulillar escasa. Sin fibrosis (F0).',
  'Arquitectura lobulillar conservada. Sin inflamación significativa, colestasis ni fibrosis.',
  'Esteatosis macrovesicular con inflamación lobulillar y balonización focal. Fibrosis perisinusoidal y portal, sin puentes completos (F2).',
  'Inflamación portal leve; actividad de interfase mínima. Sin fibrosis ni nódulos de regeneración.',
  'Inflamación portal con actividad leve. Fibrosis portal sin puentes (F1). No se identifican nódulos de regeneración.',
  'Depósito de hierro en hepatocitos, más intenso en regiones periportales; tinción de Perls positiva. Fibrosis portal leve (F1).',
  'Lesión de conductos biliares pequeños, infiltrado portal y granuloma focal. Fibrosis portal leve; sin hepatitis de interfase intensa.',
  'Colestasis canalicular y lesión ductular con infiltrado inflamatorio mixto. No se identifican fibrosis avanzada ni nódulos.',
  'Hepatitis de interfase de intensidad moderada, infiltrado linfoplasmocitario y actividad lobulillar. Fibrosis portal y perisinusoidal (F2), sin nódulos de regeneración.',
  'Nódulos regenerativos rodeados de septos fibrosos y puentes completos (F4). Esteatosis residual e inflamación lobulillar focal.'
];
function createStudyResults(caseData,index){
  const p=caseData.patient,l=labProfile[index],hbv=index===3,hcv=index===4;
  const high=(v,limit)=>v>limit?'high':'';
  const ferritin=[165,75,180,120,190,860,130,220,180,260][index],saturation=[26,24,28,29,30,76,25,31,29,32][index];
  const igg=[1100,1120,1210,1200,1180,1150,1280,1180,2720,1350][index],igm=index===6?410:120;
  const stiffness=[5.4,4.4,8.9,4.8,7.1,5.6,6.5,7.0,8.1,27.5][index];
  const results={
    profile:rawTable('profile',[
      rawRow('AST',`${decimal(p.ast)} U/L`,'10–40',high(p.ast,40)),rawRow('ALT',`${decimal(p.alt)} U/L`,'7–40',high(p.alt,40)),
      rawRow('Fosfatasa alcalina',`${decimal(l.fa)} U/L`,'40–130',high(l.fa,130)),rawRow('GGT',`${decimal(l.ggt)} U/L`,p.sex==='Femenino'?'7–45':'10–60',high(l.ggt,p.sex==='Femenino'?45:60)),
      rawRow('Bilirrubina total',`${decimal(l.bili)} mg/dL`,'0,2–1,2',high(l.bili,1.2)),rawRow('Bilirrubina directa',`${decimal(l.direct)} mg/dL`,'0–0,3',high(l.direct,.3)),rawRow('Albúmina',`${decimal(l.albumin)} g/dL`,'3,5–5,0')]),
    cbc:rawTable('cbc',[rawRow('Hemoglobina',`${decimal(l.hb)} g/dL`,p.sex==='Femenino'?'12–16':'13–17'),rawRow('Leucocitos','6,2 ×10⁹/L','4–10'),rawRow('Plaquetas',`${decimal(p.platelets)} ×10⁹/L`,'150–400',p.platelets<150?'low':'')]),
    inr:rawTable('inr',[rawRow('INR',decimal(l.inr),'0,8–1,2'),rawRow('Tiempo de protrombina',`${secondsFormat.format(12*l.inr)} s`,'11–14')]),
    renal:rawTable('renal',[rawRow('Creatinina',`${decimal(l.cr)} mg/dL`,'0,6–1,2'),rawRow('eGFR',`${decimal(l.egfr)} mL/min/1,73 m²`,'>60'),rawRow('Sodio','139 mmol/L','135–145'),rawRow('Potasio','4,2 mmol/L','3,5–5,0')]),
    metabolic:rawTable('metabolic',[rawRow('HbA1c',`${decimal(l.a1c)} %`,'<5,7',high(l.a1c,5.7)),rawRow('Triglicéridos',`${decimal(l.tg)} mg/dL`,'<150',high(l.tg,150)),rawRow('LDL',`${decimal(l.ldl)} mg/dL`,'Objetivo según riesgo individual')]),
    hbv:rawTable('hbv',[rawRow('HBsAg',hbv?'Positivo':'Negativo','Negativo'),rawRow('Anti-HBc total',hbv?'Positivo':'Negativo','—'),rawRow('Anti-HBs',hbv?'<3 mUI/mL':index===4?'48 mUI/mL':index===9?'60 mUI/mL':'<3 mUI/mL','≥10 tras vacunación'),rawRow('HBeAg',hbv?'Negativo':'No realizado (HBsAg negativo)','—'),rawRow('Anti-HBe',hbv?'Positivo':'No realizado (HBsAg negativo)','—'),...(hbv?[rawRow('HBsAg en registro previo','Positivo hace 14 meses','—')]:[])]),
    hbv_dna:rawTable('hbv_dna',[rawRow('ADN-VHB',hbv?'450 UI/mL':'No detectable','Límite de cuantificación: 10 UI/mL'),...(hbv?[rawRow('Controles previos','380 y 620 UI/mL (hace 12 y 6 meses)','—'),rawRow('ALT en esos controles','23 y 25 U/L','7–40')]:[])]),
    hdv:rawTable('hdv',[rawRow('Anti-VHD total','Negativo','Negativo'),rawRow('ARN-VHD','No realizado: cribado no positivo','—')]),
    hcv:rawTable('hcv',[rawRow('Anti-VHC',hcv?'Positivo':'Negativo','Negativo')]),
    hcv_rna:rawTable('hcv_rna',[rawRow('ARN-VHC',hcv?'1.300.000 UI/mL':'No detectable','Límite de cuantificación: 15 UI/mL')]),
    hiv:rawTable('hiv',[rawRow('VIH Ag/Ac','Negativo','Negativo')]),
    acute_virus:rawTable('acute_virus',[rawRow('VHA IgM','Negativo','—'),rawRow('Anti-HBc IgM','Negativo','—'),rawRow('VHE IgM','Negativo','—'),rawRow('ARN-VHE','No detectable','—')]),
    iron:rawTable('iron',[rawRow('Ferritina',`${decimal(ferritin)} ng/mL`,p.sex==='Femenino'?'15–200':'30–400',high(ferritin,p.sex==='Femenino'?200:400)),rawRow('Saturación transferrina',`${decimal(saturation)} %`,'20–45',high(saturation,45))]),
    hemolysis:rawTable('hemolysis',[rawRow('Reticulocitos','1,1 %','0,5–2'),rawRow('LDH','170 U/L','120–250'),rawRow('Haptoglobina','110 mg/dL','30–200'),rawRow('Frotis','Sin alteraciones morfológicas','—')]),
    autoimmune:rawTable('autoimmune',[rawRow('ANA',index===8?'1:320':'Negativo','Negativo'),rawRow('ASMA',index===8?'1:160':'Negativo','Negativo'),rawRow('AMA-M2',index===6?'Positivo, título alto':'Negativo','Negativo'),rawRow('IgG',`${decimal(igg)} mg/dL`,'700–1.600',high(igg,1600)),rawRow('IgM',`${decimal(igm)} mg/dL`,'40–230',high(igm,230))]),
    wilson:rawTable('wilson',[rawRow('Ceruloplasmina','27 mg/dL','20–40'),rawRow('Cobre urinario de 24 h','24 µg/24 h','15–60')]),
    hfe:rawTable('hfe',[rawRow('HFE C282Y',index===5?'Homocigoto':'No detectada','—'),rawRow('HFE H63D','No detectada','—')]),
    pregnancy:rawTable('pregnancy',[rawRow('β-hCG',p.sex==='Femenino'&&p.age<50?'<1 mUI/mL':'No realizada: contexto no aplicable','<5')]),
    tpmt:rawTable('tpmt',[rawRow('Actividad TPMT','38 U/mL','24–44 (laboratorio ficticio)')]),
    ultrasound:rawReport('ultrasound',echoReports[index]),
    elastography:rawReport('elastography',`Mediana de rigidez: ${decimal(stiffness)} kPa. Diez mediciones válidas; IQR/mediana 12 %. Ayuno previo documentado. ${index===7||index===8?'Estudio obtenido durante la alteración bioquímica actual.':''}`),
    iron_mri:rawReport('iron_mri',`Concentración estimada de hierro hepático: ${index===5?'5,2':'1,1'} mg/g de peso seco (referencia de este centro: <1,8). Sin lesiones focales. ${index===9?'Contorno nodular y colaterales portosistémicas.':''}`),
    ct:rawReport('ct',`${index===9?'Contorno hepático nodular, esplenomegalia y colaterales portosistémicas.':index===0||index===2?'Disminución difusa de la atenuación hepática, sin lesiones focales.':'Sin lesiones focales hepáticas ni masas abdominales.'} Vía biliar no dilatada. Sin líquido libre.`),
    biopsy:rawReport('biopsy',pathologyReports[index])
  };
  return results;
}

function extractRelevantFindings(id, result, caseData) {
  if (!result) return { title: id, group: 'Estudio', findings: [] };
  const study = STUDY_CATALOG.find(s => s.id === id);
  const title = study ? study.title : result.title;
  const group = study ? study.group : 'Estudio';
  const findings = [];

  if (result.rows) {
    result.rows.forEach(r => {
      const [param, val, ref, flag] = r;
      const isHigh = flag === 'high';
      const isLow = flag === 'low';
      const isPositive = typeof val === 'string' && (val.includes('Positivo') || val.includes('Homocigoto') || (/\bUI\/mL\b/.test(val) && !val.includes('No detectable')) || val.includes('1:'));

      if (isHigh || isLow) {
        const arrow = isHigh ? '↑' : '↓';
        const label = isHigh ? 'elevado' : 'disminuido';
        findings.push(`<strong>${param}:</strong> ${val} <span class="hp-finding-flag ${flag}">(${arrow} ${label}, ref: ${ref})</span>`);
      } else if (isPositive) {
        findings.push(`<strong>${param}:</strong> <span class="hp-finding-flag is-positive">${val}</span> (ref: ${ref})`);
      }
    });

    if (findings.length === 0) {
      findings.push(`Parámetros dentro de los rangos de referencia esperados (sin alteraciones analíticas señaladas).`);
    }
  } else if (result.report) {
    const text = String(result.report || '');
    if (id === 'ultrasound') {
      if (/aumento difuso de la ecogenicidad/i.test(text)) {
        findings.push(`<strong>Ecogenicidad:</strong> Aumento difuso de la ecogenicidad hepática (patrón ecográfico de esteatosis).`);
      } else if (/contorno nodular/i.test(text)) {
        findings.push(`<strong>Parénquima:</strong> Hígado de contorno nodular (compatible con hepatopatía crónica avanzada/cirrosis).`);
      } else if (/discretamente aumentado/i.test(text)) {
        findings.push(`<strong>Parénquima:</strong> Hígado discretamente aumentado de tamaño, sin lesiones focales ni nodularidad.`);
      } else {
        findings.push(`<strong>Parénquima:</strong> Tamaño y ecogenicidad normales.`);
      }
      if (!/contorno nodular/i.test(text) && /(sin lesiones focales|sin lesión focal)/i.test(text)) {
        findings.push(`<strong>Morfología:</strong> Contornos regulares, sin lesiones focales ni dilatación de vía biliar.`);
      }
      if (/colaterales portosistémicas|bazo de 15 cm/i.test(text)) {
        findings.push(`<strong>Vascular y bazo:</strong> Vena porta permeable, esplenomegalia (bazo de 15 cm) y colaterales portosistémicas; sin líquido libre.`);
      } else if (/porta permeable/i.test(text)) {
        findings.push(`<strong>Vascular:</strong> Vena porta permeable, bazo normal y sin líquido libre ascítico.`);
      }
    } else if (id === 'elastography') {
      const kpaMatch = text.match(/([\d,]+)\s*kPa/);
      const kpa = kpaMatch ? kpaMatch[1] : '';
      findings.push(`<strong>Mediana de rigidez:</strong> ${kpa ? `${kpa} kPa` : 'Medida obtenida'} (IQR/mediana ≤ 30 %, estudio técnicamente válido).`);
      const valNum = Number(String(kpa).replace(',', '.'));
      if (Number.isFinite(valNum) && valNum < 8) {
        findings.push(`<strong>Interpretación de rigidez:</strong> Valor compatible con fibrosis ausente o leve (F0-F1; bajo riesgo de fibrosis avanzada).`);
      } else if (Number.isFinite(valNum)) {
        findings.push(`<strong>Interpretación de rigidez:</strong> Rigidez incrementada, correlacionar con sospecha de fibrosis significativa.`);
      }
    } else if (id === 'iron_mri') {
      findings.push(`<strong>RM Hepática:</strong> ${text}`);
    } else if (id === 'ct') {
      findings.push(`<strong>Tomografía:</strong> ${text}`);
    } else if (id === 'biopsy') {
      findings.push(`<strong>Histopatología:</strong> ${text}`);
    } else {
      findings.push(text);
    }
  }

  return { title, group, findings };
}

return {STUDY_CATALOG,createStudyResults,extractRelevantFindings};
})();

