/* Embedded original source: src/clinica/dia1/opciones-decision.js */
/* Módulo Día 1 original: game-choices.mjs. Lógica clínica conservada. */
window.HepatoDay1Modules['game-choices.mjs'] = (() => {
// Menus depend on the player's chosen diagnosis, never on the hidden case rubric.
const study=(id,title,detail,group,tests=[id])=>({id,title,detail,group,tests});
const STUDY_GROUPS=['Sangre','Virus','Imágenes','Otros'];
const STUDY_BUNDLES=[
  study('basic','Analítica inicial','Perfil hepático, hemograma y coagulación','Sangre',['profile','cbc','inr']),
  study('renal','Función renal','Creatinina y electrolitos','Sangre'),
  study('metabolic','Perfil metabólico','Glucosa y lípidos','Sangre'),
  study('iron','Hierro','Ferritina y saturación','Sangre'),
  study('autoimmune','Autoinmunidad','Autoanticuerpos e inmunoglobulinas','Sangre'),
  study('hemolysis','Hemólisis','Reticulocitos, LDH y haptoglobina','Sangre'),
  study('hbv','Serología VHB','Marcadores de hepatitis B','Virus'),
  study('hcv','Serología VHC','Anticuerpos contra hepatitis C','Virus'),
  study('hbv_dna','ADN-VHB','Carga viral de hepatitis B','Virus'),
  study('hdv','Hepatitis D','Anticuerpos totales anti-VHD; ARN si corresponde','Virus'),
  study('hcv_rna','ARN-VHC','Carga viral de hepatitis C','Virus'),
  study('acute_virus','Virus agudos','VHA, VHB agudo y VHE','Virus'),
  study('hiv','VIH','Ag/Ac combinados','Virus'),
  study('ultrasound','Ecografía','Abdomen y Doppler','Imágenes'),
  study('elastography','Elastografía','Rigidez hepática','Imágenes'),
  study('biopsy','Biopsia','Histología hepática','Imágenes'),
  study('ct','Tomografía','Abdomen con contraste','Imágenes'),
  study('iron_mri','RM de hierro','Cuantificación hepática','Imágenes'),
  study('hfe','Genética HFE','C282Y y H63D','Otros'),
  study('wilson','Cobre','Ceruloplasmina y orina de 24 h','Otros'),
  study('pregnancy','Prueba de embarazo','β-hCG','Otros'),
  study('tpmt','Actividad TPMT','Estudio de seguridad','Otros')
];

const planCard=(id,title,detail,plan)=>({id,title,detail,plan});
const followCard=(id,title,detail,schedules)=>({id,title,detail,schedules});
const discharge=planCard('discharge','Dar el alta','Sin nuevos controles hepáticos',['discharge']);
const observe=planCard('observe','Vigilar por ahora','Observación con controles clínicos',['monitor-specific','alarm-network']);
const investigate=planCard('investigate','Seguir investigando','Ampliar estudios y citar con resultados',['continue-workup','alarm-network']);

// These are alternatives for the diagnosis the player selected. Their contents
// and order never depend on the patient's diagnosis, rubric or future outcome.
// Changed distractors get new IDs so an older save cannot acquire new actions.
const PLAN_CHOICES={
  masld:[
    planCard('metabolic-base','Intervención cardiometabólica integral','Acordar reducción ponderal, actividad, nutrición y optimizar diabetes y lípidos desde hoy.',['metabolic','nutrition','alarm-network']),
    planCard('metabolic-fibrosis','Intervención metabólica y estadificar fibrosis','Iniciar cambios y pedir evaluación no invasiva según el riesgo individual.',['metabolic','stage-fibrosis','alarm-network']),
    planCard('metabolic-tests-first','Esperar la estadificación para tratar','Pedir elastografía y comenzar cambios metabólicos solo cuando llegue el informe.',['stage-fibrosis','continue-workup','alarm-network']),
    planCard('metabolic-observe','Control analítico antes de intervenir','Revisar medicación y repetir aminotransferasas antes de fijar objetivos metabólicos.',['monitor-specific','review-meds','alarm-network'])],
  gilbert:[
    planCard('explain','Explicar el hallazgo y cuándo consultar','Revisar desencadenantes, tranquilizar y acordar signos de alarma sin controles innecesarios.',['reassure','alarm-network']),
    planCard('gilbert-workup','Completar estudio etiológico ampliado','Solicitar inmunología, Doppler y pruebas adicionales antes de confirmar el patrón benigno.',['continue-workup','alarm-network']),
    planCard('gilbert-observe','Documentar normalización antes del alta','Repetir hepatograma en controles sucesivos mientras haya bilirrubina elevada.',['monitor-specific','alarm-network']),
    planCard('gilbert-medications','Priorizar causas farmacológicas','Pedir un diario de medicación y nuevas analíticas antes de explicar el cuadro.',['review-meds','monitor-specific','alarm-network'])],
  'inactive-hbv':[
    planCard('hbv-monitor','Vigilancia virológica y prevención','Programar ALT/ADN seriados, evaluar fibrosis y riesgo de CHC y revisar inmunidad de contactos.',['monitor-specific','contacts','alarm-network']),
    planCard('hbv-virus-only','Vigilar infección sin estrategia familiar','Monitorizar ALT y ADN-VHB, pero dejar vacunación y asesoramiento de contactos para después.',['monitor-specific','alarm-network']),
    planCard('hbv-treat-persistent','Indicar antiviral desde hoy','Iniciar supresión por persistencia de HBsAg, sin otros criterios de actividad o fibrosis.',['hbv-antiviral','contacts','alarm-network']),
    planCard('hbv-symptoms','Citar si desarrolla síntomas','Informar señales de alarma y evitar análisis seriados mientras se encuentre bien.',['reassure','alarm-network'])],
  'active-hcv':[
    planCard('hcv-treat','Iniciar AAD tras revisar seguridad','Confirmar esquema, estadio y posibles interacciones con simvastatina y omeprazol.',['daa','review-meds','alarm-network']),
    planCard('hcv-direct','Iniciar AAD sin ajustar medicación','Indicar esquema pangenotípico manteniendo simvastatina y omeprazol sin comprobar interacciones.',['daa','alarm-network']),
    planCard('hcv-observe','Reevaluar ARN antes de tratar','Repetir carga viral en varios meses por estar clínicamente estable.',['monitor-specific','alarm-network']),
    planCard('hcv-fibrosis-first','Diferir AAD hasta tener toda la estadificación','Solicitar nuevas pruebas de fibrosis aunque no cambien la indicación inicial de tratar.',['stage-fibrosis','continue-workup','alarm-network'])],
  hfe:[
    planCard('iron-treat','Flebotomías con evaluación de órganos','Plan individualizado, hemoglobina y ferritina seriadas, fibrosis y familiares.',['phlebotomy','stage-fibrosis','alarm-network']),
    planCard('iron-observe','Confirmar sobrecarga en más controles','Repetir hierro y ferritina antes de iniciar depleción pese al genotipo y la saturación.',['monitor-specific','alarm-network']),
    planCard('iron-chelate-first','Preferir quelación por comodidad','Elegir quelante oral antes de valorar flebotomías en un paciente sin anemia.',['iron-chelation','stage-fibrosis','alarm-network']),
    planCard('iron-diet-only','Reducir ingesta de hierro como tratamiento','Consejo dietario y evitar suplementos, posponiendo depleción con flebotomías.',['nutrition','review-meds','alarm-network'])],
  pbc:[
    planCard('pbc-treat','Tratar CBP y prurito en paralelo','UDCA 13–15 mg/kg/día y medidas específicas para el síntoma; controles bioquímicos.',['udca','pruritus','alarm-network']),
    planCard('itch-only','Tratar primero el síntoma predominante','Iniciar tratamiento antipruriginoso y diferir UDCA hasta evaluar el alivio.',['pruritus']),
    planCard('pbc-udca-only','Iniciar solo UDCA y observar prurito','Comenzar tratamiento de la colangiopatía sin intervención específica sobre el sueño y el prurito.',['udca','alarm-network']),
    planCard('pbc-overlap','Presumir superposición autoinmune','Añadir corticoides al inicio sin datos específicos de hepatitis de interfase o actividad hepatocelular.',['steroids','monitor-specific','alarm-network'])],
  dili:[
    planCard('drug-safety','Evitar reexposición y documentar DILI','Registrar el antibiótico sospechoso, revisar otros agentes y dar alarmas por deterioro.',['avoid-drug','review-meds','alarm-network']),
    planCard('drug-symptoms','Priorizar control sintomático','Aliviar prurito y citar, sin documentar explícitamente la sospecha del antibiótico.',['pruritus','alarm-network']),
    planCard('drug-observe','Observación seriada sin atribuir causalidad','Seguir bioquímica y síntomas, dejando pendiente el registro de reacción medicamentosa.',['review-meds','monitor-specific','alarm-network']),
    planCard('drug-steroid-trial','Ensayo empírico de corticoide','Tratar la colestasis con inmunosupresión sin criterios de lesión inmunoalérgica grave.',['steroids','monitor-specific','alarm-network'])],
  aih:[
    planCard('aih-treat','Inducción y mantenimiento con plan reproductivo','Corticoide y ahorrador adecuado, seguridad farmacológica, anticoncepción y remisión previa al embarazo.',['immunosuppression','reproductive','review-meds']),
    planCard('aih-steroids','Corticoide y ahorrador compatible','Inducción, valorar azatioprina y controles; coordinar planificación de embarazo.',['steroids','immunosuppression','reproductive','review-meds']),
    planCard('mmf','Elegir micofenolato como monoterapia','Iniciar MMF sin corticoide de inducción ni evaluación o consejo reproductivo.',['mycophenolate']),
    planCard('aih-induction-only','Corticoide inicial y decidir luego','Iniciar prednisona y aplazar el ahorrador y la planificación reproductiva.',['steroids','review-meds','alarm-network'])],
  'compensated-csph':[
    planCard('portal-prevent','Prevenir descompensación y vigilar CHC','Carvedilol según tolerancia, control temprano de presión/riñón y vigilancia semestral.',['carvedilol','nutrition','alarm-network']),
    planCard('portal-diuretics','Prevenir ascitis con diuréticos','Prescribir espironolactona aun sin retención de líquido ni ascitis.',['diuretics','alarm-network']),
    planCard('portal-wait','Optimizar nutrición y vigilar','Controlar enfermedad crónica sin abordar todavía la hipertensión portal significativa.',['nutrition','monitor-specific','alarm-network']),
    planCard('portal-more-tests','Confirmación adicional antes de prevenir','Pedir más pruebas pese a colaterales y cirrosis documentadas; posponer el betabloqueante.',['continue-workup','alarm-network'])]
};
const DEFAULT_PLANS=[investigate,observe,planCard('urgent','Derivación urgente','Cambiar el ámbito de atención',['urgent','alarm-network']),discharge];

const symptomControl=followCard('symptoms','Si cambia algo','Síntomas nuevos o cambio del patrón',{'symptom-change':'as-needed'});
const resultsControl=followCard('new-results','Control en un mes','Integrar estudios pendientes',{'review-results':'1mo'});
const FOLLOWUP_CHOICES={
  masld:[
    followCard('metabolic-year','Metabolismo a los 3 meses y fibrosis al año','Revisar glucemia, peso, hábitos, perfil hepático y riesgo posterior de fibrosis.',{'liver-metabolic':'3mo',fibrosis:'12mo'}),
    followCard('metabolic-results','Control precoz por estudios pendientes','Revisar en un mes los resultados de evaluación de fibrosis y objetivos metabólicos.',{'liver-metabolic':'1mo','review-results':'1mo'}),
    followCard('metabolic-labs-only','Seguir perfil hepático y HbA1c','Analítica a los tres meses, sin plan explícito de reevaluación de fibrosis.',{'liver-metabolic':'3mo'})],
  gilbert:[symptomControl,
    followCard('gilbert-monthly','Controles mensuales de bilirrubina','Vigilar el valor hasta que se normalice pese al patrón típico intermitente.',{'liver-metabolic':'1mo'}),
    followCard('gilbert-annual','Perfil hepático anual por Gilbert','Mantener pruebas hepáticas programadas aunque no cambien síntomas ni patrón.',{'liver-metabolic':'12mo'})],
  'inactive-hbv':[
    followCard('hbv-3','Control a los 3 meses','ALT, ADN-VHB y reevaluación',{'hbv-monitor':'3mo'}),
    followCard('hbv-6','Control a los 6 meses','ALT, ADN-VHB y reevaluación',{'hbv-monitor':'6mo'}),
    followCard('hbv-12','Control al año','ALT, ADN y reevaluación de fase; adelantar si cambia la situación',{'hbv-monitor':'12mo'})],
  'active-hcv':[
    followCard('hcv-svr','ARN-VHC tras terminar','12 semanas o más después del tratamiento',{svr:'12wk-post'}),
    followCard('hcv-labs','Control bioquímico tras tratamiento','Solicitar enzimas a un mes, sin documentar ARN-VHC tras finalizar AAD.',{'liver-metabolic':'1mo'}),
    followCard('hcv-rna-during','ARN al mes de iniciar AAD','Revisar descenso de viremia inicial, sin planificar SVR12 al finalizar.',{'hcv-rna-on-treatment':'1mo'})],
  hfe:[
    followCard('iron-close','Control en 1–2 semanas','Hb y ferritina; evaluar familiares en 3 meses',{'iron-monitor':'2wk','family-screen':'3mo'}),
    followCard('iron-quarterly','Primer control al tercer mes','Concentrar ferritina, hemoglobina y familia en una sola visita trimestral.',{'iron-monitor':'3mo','family-screen':'3mo'}),
    followCard('iron-labs-only','Hemoglobina y ferritina tempranas','Ajustar flebotomías y diferir la evaluación de familiares.',{'iron-monitor':'2wk'})],
  pbc:[
    followCard('pbc-response','Control a los 3 meses','Bioquímica; respuesta formal al año',{biochemical:'3mo'}),
    followCard('pbc-six','Control a los 6 meses','Bioquímica y síntomas; respuesta formal al año',{biochemical:'6mo'}),
    followCard('pbc-year','Primer control bioquímico al año','Esperar hasta la evaluación formal de respuesta a UDCA para revisar FA y bilirrubina.',{biochemical:'12mo'}),
    followCard('pbc-pruritus','Control de prurito al mes','Revisar sueño y bienestar, sin plan explícito de respuesta bioquímica.',{'symptom-change':'1mo'})],
  dili:[
    followCard('drug-close','Control en 48–72 horas','Síntomas, bilirrubina e INR',{'close-inr':'48-72h'}),
    followCard('drug-month','Revisar evolución dentro de un mes','Control de bilirrubina e INR sin reevaluación temprana tras la ictericia.',{'close-inr':'1mo'}),
    followCard('drug-enzymes-only','Control temprano centrado en ALT y FA','Analítica y síntomas a las 48–72 h, pero sin acordar INR.',{'liver-metabolic':'48-72h'})],
  aih:[
    followCard('aih-close','Control en 1–2 semanas','Aminotransferasas, IgG y seguridad',{'aih-remission':'2wk'}),
    followCard('aih-late','Primer control de tratamiento en 3 meses','Analítica y tolerancia recién al trimestre tras iniciar inmunosupresión.',{'aih-remission':'3mo'}),
    followCard('aih-enzymes-only','ALT y AST a las dos semanas','Revisar lesión hepatocelular sin incluir IgG ni seguridad del inmunosupresor.',{'liver-metabolic':'2wk'})],
  'compensated-csph':[
    followCard('portal-close','Tolerancia en 1–2 semanas','Presión, pulso y riñón; ecografía y AFP cada 6 meses',{portal:'2wk',hcc:'6mo'}),
    followCard('portal-6','Primera revisión global a los seis meses','Unificar vigilancia de CHC y tolerancia al carvedilol en la misma fecha.',{portal:'6mo',hcc:'6mo'}),
    followCard('portal-tolerance-only','Tolerancia precoz, imágenes según síntomas','Controlar presión, pulso y función renal, pero omitir vigilancia semestral de CHC.',{portal:'2wk','symptom-change':'as-needed'})]
};

const DEFAULT_FOLLOWUPS=[resultsControl,followCard('routine','Control a los 3 meses','Evaluación clínica y analítica',{'liver-metabolic':'3mo'}),symptomControl];

const interpretation=(id,title,detail)=>({id,title,detail});
const pending=interpretation('data-pending','Aún faltan datos','Ampliar evaluación e integrar resultados antes de afirmar la conclusión');
// Same alternatives for the chosen diagnosis in every patient. No expected
// answer, threshold result or case-specific hint is used to build this menu.
const INTERPRETATION_CHOICES={
  masld:[
    interpretation('masld-low','Bajo riesgo actual','Seguimiento metabólico y reevaluación periódica; no excluye toda fibrosis'),
    interpretation('masld-secondary','Riesgo aún sin resolver','Completar evaluación secundaria; el índice o la rigidez no confirman cirrosis'),
    interpretation('masld-significant','Fibrosis significativa sin cirrosis','Histología que confirma el estadio, integrada con los demás datos'),
    pending],
  gilbert:[
    interpretation('gilbert-pattern','Patrón indirecto sin hemólisis','Perfil restante y estudio de hemólisis concordantes con benignidad'),
    interpretation('gilbert-total-only','Bilirrubina fluctuante, causa aún indeterminada','Tomar la cifra total como suficiente sin integrar fracciones ni hemólisis.'),pending],
  'inactive-hbv':[
    interpretation('hbv-serial','Baja actividad documentada','ALT y ADN seriados; evaluar fibrosis, coinfecciones y riesgo de cáncer'),
    interpretation('hbv-one-alt','Baja actividad por la ALT de hoy','Basar la fase solo en un valor normal sin integrar ADN ni evolución seriada.'),
    interpretation('hbv-cured','Supresión virológica equivale a resolución','Interpretar ADN bajo como curación aunque el HBsAg continúa positivo.'),pending],
  'active-hcv':[
    interpretation('hcv-active','ARN e infección activa','Evaluar cirrosis y seguridad por separado antes del tratamiento'),
    interpretation('hcv-antibody','La serología define actividad y curación','Usar anti-VHC para decidir infección actual y posterior éxito terapéutico.'),
    interpretation('hcv-viral-load','La carga viral refleja lesión estructural','Usar el número de copias como estimador del grado de fibrosis.'),pending],
  hfe:[
    interpretation('iron-integrated','Sobrecarga integrada','Saturación, ferritina y genotipo; valorar daño orgánico y fibrosis'),
    interpretation('iron-ferritin','Sobrecarga por ferritina elevada','Dar por establecida la etiología sin integrar saturación y genotipo.'),
    interpretation('iron-genotype','Genotipo HFE y estadio hepático','Inferir fibrosis avanzada solamente desde la homocigosis C282Y.'),pending],
  pbc:[
    interpretation('pbc-integrated','Colestasis, AMA e imagen','Integrar persistencia y excluir obstrucción; riesgo y síntomas por separado'),
    interpretation('pbc-itch-stage','Síntomas intensos como criterio de estadio','Inferir enfermedad avanzada por el prurito, sin evaluar fibrosis ni síntesis.'),
    interpretation('pbc-ama-only','AMA positivo como criterio único','No integrar colestasis persistente ni exclusión de obstrucción.'),pending],
  dili:[
    interpretation('dili-pattern','Patrón y gravedad separados','R clasifica; cronología, exclusiones, INR y clínica completan la evaluación'),
    interpretation('dili-r-cause','Patrón colestásico como prueba de causalidad','Atribuir la lesión al antibiótico solo por el cociente R, sin cronología.'),
    interpretation('dili-fibrosis','FIB-4 elevado como fibrosis basal','Interpretar un índice calculado durante lesión aguda como estadio crónico.'),pending],
  aih:[
    interpretation('aih-integrated','Actividad e histología integradas','IgG, autoanticuerpos, biopsia y exclusión de otras causas'),
    interpretation('aih-ana-only','Autoinmunidad serológica suficiente','Concluir enfermedad activa con ANA aislado sin IgG, exclusiones e histología.'),
    interpretation('aih-stiffness','Rigidez elevada como diagnóstico de actividad','Dar por conocida la etiología y fibrosis solo por elastografía inflamatoria.'),pending],
  'compensated-csph':[
    interpretation('portal-integrated','Compensado con riesgo portal','Integrar colaterales, imagen y plaquetas; no hubo descompensación'),
    interpretation('portal-normal-alt','ALT casi normal como actividad baja','Inferir ausencia de enfermedad avanzada pese a imagen portal y plaquetas.'),
    interpretation('portal-decompensated','Trombocitopenia como descompensación','Clasificar como descompensado por plaquetas bajas sin eventos clínicos.'),pending]
};

// A reproducible Fisher–Yates shuffle. The caller persists one seed per
// consultation; tab changes and restores therefore keep every card in place.
// No Math.random, case content or rubric access is involved here.
function seedHash(value){
  const text=typeof value==='string'||typeof value==='number'&&Number.isFinite(value)?String(value):'0';
  let hash=2166136261;
  for(let i=0;i<text.length;i++){hash^=text.charCodeAt(i);hash=Math.imul(hash,16777619);}
  return hash>>>0;
}
function orderedChoices(choices,seed,scope){
  let state=seedHash(`${seedHash(seed)}:${scope}`);
  const random=()=>{
    state=(state+0x6D2B79F5)>>>0;
    let value=Math.imul(state^(state>>>15),1|state);
    value^=value+Math.imul(value^(value>>>7),61|value);
    return ((value^(value>>>14))>>>0)/4294967296;
  };
  const cards=choices.map(card=>({...card,...(card.plan?{plan:[...card.plan]}:{schedules:{...card.schedules}})}));
  for(let i=cards.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[cards[i],cards[j]]=[cards[j],cards[i]];}
  return cards;
}

const choicesFor=(catalog,diagnosis,fallback)=>typeof diagnosis==='string'&&Object.hasOwn(catalog,diagnosis)?catalog[diagnosis]:fallback;
const planChoicesFor=(diagnosis,seed=0)=>orderedChoices(choicesFor(PLAN_CHOICES,diagnosis,DEFAULT_PLANS),seed,`${diagnosis}:plan`);
const followupChoicesFor=(diagnosis,seed=0)=>orderedChoices(choicesFor(FOLLOWUP_CHOICES,diagnosis,DEFAULT_FOLLOWUPS),seed,`${diagnosis}:followup`);
const interpretationChoicesFor=(diagnosis,seed=0)=>orderedChoices(choicesFor(INTERPRETATION_CHOICES,diagnosis,[pending,interpretation('data-certain','Conclusión definitiva','Los datos ya permiten afirmar etiología y gravedad')]),seed,`${diagnosis}:interpretation`);

return {
  STUDY_GROUPS,
  STUDY_BUNDLES,
  planChoicesFor,
  followupChoicesFor,
  interpretationChoicesFor
};

})();

