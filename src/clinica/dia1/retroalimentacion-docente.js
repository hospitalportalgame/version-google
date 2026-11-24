/* Embedded original source: src/clinica/dia1/retroalimentacion-docente.js */
/* HOSPITAL PORTAL: revisión docente de los 10 escenarios escritos del Día 1.
 * Solo se consume después de finalizar una consulta; no revela resultados durante el juego.
 * No sustituye la rúbrica, no cambia resultados ni usa red/API. */
window.HepatoDay1Modules['teaching-feedback.mjs'] = (() => {
'use strict';
const lessons = {
 'masld-intro-v1': {
  evidence:'Martín tiene diabetes tipo 2, IMC 31,2, ALT 68 U/L, AST 44 U/L, triglicéridos 215 mg/dL y esteatosis ecográfica. La exposición alcohólica referida es baja. Su FIB-4 calculado con edad, AST, ALT y plaquetas es 1,02.',
  differential:'El conjunto favorece MASLD. El FIB-4 bajo reduce la probabilidad actual de fibrosis avanzada, pero no descarta fibrosis de cualquier grado. La ecografía no diferencia esteatosis simple de MASH. No hay temporalidad que apoye atribuir la ALT a la estatina.',
  key:'El objetivo es tratar el riesgo cardiometabólico y reevaluar fibrosis, no diagnosticar MASH por imagen ni retirar una estatina solo por MASLD.',
  plans:{'metabolic-base':'Adecuada: aborda peso, alimentación, ejercicio, diabetes y lípidos. El FIB-4 bajo no obliga a una biopsia.','metabolic-fibrosis':'También válida: combina el manejo metabólico con una evaluación de fibrosis; para este FIB-4 bajo puede resultar más intensiva de lo necesario.','metabolic-tests-first':'Incompleta: pedir más pruebas no reemplaza iniciar el manejo cardiometabólico desde hoy.','metabolic-observe':'Insuficiente: vigilar transaminasas sin intervenir sobre diabetes, peso y lípidos desaprovecha la principal oportunidad terapéutica.'},
  follow:{'metabolic-year':'Correcta: objetivos clínicos/metabólicos a corto plazo y riesgo de fibrosis posteriormente, por diabetes.','metabolic-results':'El control precoz es razonable si hay nuevos estudios, pero no sustituye un plan explícito para reevaluar fibrosis en el tiempo.','metabolic-labs-only':'La bioquímica y los objetivos metabólicos importan; falta plan de reevaluación de fibrosis.'}
 },
 'gilbert-v1': {
  evidence:'Sofía presenta bilirrubina total 2,6 mg/dL, directa 0,3 mg/dL e indirecta calculada 2,3 mg/dL. AST 22, ALT 19 y fosfatasa alcalina 70 U/L. Hemoglobina, reticulocitos, LDH y haptoglobina normales; episodios con ayuno desde la adolescencia.',
  differential:'La hiperbilirrubinemia no conjugada aislada, sin hemólisis ni lesión hepatocelular, favorece Gilbert. Una obstrucción biliar típicamente produce colestasis o aumento de bilirrubina conjugada; la hemólisis mostraría otros hallazgos. La bilirrubina elevada por sí sola no prueba el diagnóstico.',
  key:'Explicar un trastorno benigno de conjugación y reconocer cambios de patrón evita tanto sobreestudios como atribuir toda ictericia futura a Gilbert.',
  plans:{explain:'Correcta: explica benignidad, desencadenantes y cuándo volver. No hay indicación de fármacos específicos.','gilbert-workup':'Puede ser razonable estudiar más si el patrón es atípico, pero aquí ya hay fraccionamiento y hemólisis normales; ampliar indiscriminadamente no aporta valor.','gilbert-observe':'Los controles seriados hasta normalizar la bilirrubina no son necesarios en un cuadro típico, porque Gilbert puede fluctuar.','gilbert-medications':'Revisar exposiciones puede ser útil, pero Sofía no usa medicamentos y la evolución típica requiere explicar el diagnóstico.'},
  follow:{symptoms:'Correcto: reconsultar ante coluria, fiebre, dolor, prurito persistente, anemia o cambios en enzimas/fracciones.','gilbert-monthly':'La ecografía o bioquímica mensual no aporta beneficio para un patrón estable y típico.','gilbert-annual':'No se requiere vigilancia hepática anual específicamente por Gilbert; el seguimiento depende de nuevos síntomas o hallazgos.'}
 },
 'masld-older-v1': {
  evidence:'Elena tiene 68 años, diabetes, IMC 32,4, ALT 64 U/L, AST 42 U/L y plaquetas 158 ×10⁹/L: FIB-4 2,26. Si se solicitó elastografía, la rigidez de 8,9 kPa requiere integración adicional.',
  differential:'En mayores de 65 años se utiliza un umbral inferior de FIB-4 de 2,0: Elena lo supera. Eso exige evaluación secundaria; ni la ecografía sin nodularidad ni la albúmina normal descartan fibrosis avanzada. Una elastografía indeterminada no demuestra cirrosis ni estadio F2 por sí misma.',
  key:'La edad modifica la lectura del FIB-4. La acción central es continuar el manejo metabólico y resolver la incertidumbre sobre la fibrosis.',
  plans:{'metabolic-fibrosis':'Correcta: manejo metabólico y evaluación adicional de fibrosis, por el FIB-4 2,26.','metabolic-base':'Necesaria pero incompleta: sin una segunda prueba o estrategia de reevaluación, el riesgo de fibrosis queda sin resolver.','metabolic-tests-first':'Investigar fibrosis está bien, pero retrasar toda intervención cardiometabólica no está justificado.','metabolic-observe':'Insuficiente: el FIB-4 sobre el umbral de su edad requiere una estrategia de evaluación secundaria.'},
  follow:{'metabolic-results':'Correcto si hay pruebas pendientes: permite integrar la rigidez indeterminada sin esperar un año.','metabolic-year':'Un control de fibrosis al año puede ser demasiado tardío cuando se solicitó una elastografía indeterminada que necesita resolución.','metabolic-labs-only':'Repetir enzimas sin plan de evaluación secundaria no resuelve el riesgo de fibrosis.'}
 },
 'hbv-monitor-v1': {
  evidence:'Diego tiene HBsAg persistente por más de 14 meses, HBeAg negativo, ADN-VHB actual 450 UI/mL y previo 380–620 UI/mL, con ALT seriadas 23–25 U/L y actual 24 U/L. No hay datos de cirrosis ni inmunosupresión.',
  differential:'La infección crónica HBeAg negativa de baja actividad es la interpretación de esta serie. El ADN bajo no equivale a curación y una ALT normal aislada no basta para definir la fase. Coinfecciones, fibrosis, factores de riesgo y posibilidades de reactivación deben revisarse.',
  key:'Seguimiento virológico y clínico individualizado; tratamiento antiviral si surgen indicaciones, como fibrosis relevante, mayor actividad, alto riesgo o inmunosupresión.',
  plans:{'hbv-monitor':'Correcta: une vigilancia de la infección con prevención y evaluación de contactos.','hbv-virus-only':'ALT y ADN seriados son esenciales, pero también hay que abordar transmisión y susceptibilidad de contactos.','hbv-treat-persistent':'HBsAg persistente por sí solo no indica antiviral en este escenario de baja actividad, sin cirrosis ni otros factores.','hbv-symptoms':'El VHB puede progresar sin síntomas; controlar solo si se siente mal es insuficiente.'},
  follow:{'hbv-3':'Aceptable como control cercano según incertidumbre, especialmente al caracterizar una fase.','hbv-6':'Aceptable: ALT y ADN periódicos con revisión de fibrosis y factores de riesgo.','hbv-12':'Aceptable cuando la baja actividad está bien documentada; adelantar si aparecen riesgos o cambios.'}
 },
 'hcv-treatment-v1': {
  evidence:'Rosa tiene ARN-VHC 1.300.000 UI/mL, AST 54 U/L, ALT 76 U/L, plaquetas conservadas y sin datos clínicos de descompensación. Usa omeprazol y simvastatina, cuya compatibilidad depende del antiviral elegido.',
  differential:'El ARN demuestra infección activa; el anticuerpo aislado no distingue exposición pasada de viremia. La carga viral tampoco permite estimar fibrosis. Deben evaluarse cirrosis y elegibilidad para una vía simplificada, seguridad e interacciones.',
  key:'La curación se documenta mediante ARN-VHC a las 12 semanas o más tras terminar; el anti-VHC puede continuar positivo.',
  plans:{'hcv-treat':'Correcta: tratamiento antiviral con revisión de interacciones, estadio y seguridad.','hcv-direct':'Iniciar antiviral es correcto, pero conservar sin revisión omeprazol y simvastatina puede causar interacciones importantes según el esquema.','hcv-observe':'La infección activa requiere ofrecer tratamiento; una espera indefinida no aporta beneficio en esta paciente.','hcv-fibrosis-first':'La evaluación de fibrosis es importante, pero no debe convertirse en una demora injustificada del tratamiento de una paciente elegible.'},
  follow:{'hcv-svr':'Correcto: ARN-VHC ≥12 semanas después del último comprimido para documentar respuesta virológica sostenida.','hcv-labs':'Controlar enzimas puede ser útil, pero la normalización de ALT no demuestra curación.','hcv-rna-during':'Un ARN durante el tratamiento no reemplaza el ARN posterior necesario para confirmar curación.'}
 },
 'hemochromatosis-v1': {
  evidence:'Andrés tiene dolor en segundas y terceras articulaciones metacarpofalángicas, familiar afectado, saturación de transferrina 76 %, ferritina 860 ng/mL y homocigosis HFE C282Y.',
  differential:'Saturación y ferritina elevadas junto con C282Y homocigoto sustentan hemocromatosis HFE con sobrecarga. La ferritina sola puede elevarse por inflamación y otras hepatopatías. El genotipo no determina por sí solo el grado de fibrosis.',
  key:'Flebotomías con vigilancia de hemoglobina y ferritina, valoración de órganos diana y fibrosis; consejo y evaluación familiar.',
  plans:{'iron-treat':'Correcta: flebotomías como primera línea, con evaluación de fibrosis y tolerancia.','iron-observe':'Con expresión bioquímica y genotipo concordantes, repetir laboratorios indefinidamente retrasa el tratamiento.','iron-chelate-first':'La quelación no es primera línea si el paciente tolera flebotomías; añade efectos adversos y complejidad.','iron-diet-only':'La dieta no sustituye la extracción terapéutica de hierro ni la vigilancia de daño de órganos.'},
  follow:{'iron-close':'Correcto: hemoglobina y ferritina durante la inducción, además de consejo y evaluación de familiares.','iron-quarterly':'Puede resultar demasiado espaciado al iniciar flebotomías; el ritmo se individualiza según hemoglobina y ferritina.','iron-labs-only':'Falta evaluar a familiares de primer grado, incluso si el laboratorio del paciente se controla.'}
 },
 'pbc-v1': {
  evidence:'Lucía tiene ocho meses de prurito nocturno sin lesiones primarias, FA 390 U/L, GGT 280 U/L, AMA-M2 positivo e IgM 410 mg/dL; la ecografía no muestra obstrucción.',
  differential:'El patrón colestásico, AMA y ausencia de obstrucción permiten diagnosticar colangitis biliar primaria. Ni la intensidad del prurito ni el título de AMA miden por sí solos el estadio o la respuesta al tratamiento. No hay datos suficientes de superposición con hepatitis autoinmune.',
  key:'UDCA 13–15 mg/kg/día (ajustado al peso) y manejo específico del prurito son objetivos complementarios. Separar colestiramina de otros fármacos si se indica.',
  plans:{'pbc-treat':'Correcta: trata la enfermedad con UDCA y atiende el prurito que afecta el sueño.','itch-only':'Aliviar el síntoma es necesario pero no sustituye UDCA, que modifica el curso de la enfermedad.','pbc-udca-only':'UDCA es fundamental; no abordar un prurito severo deja sin resolver una necesidad importante de Lucía.','pbc-overlap':'Sin datos de hepatitis de interfase relevante ni IgG elevada, los corticoides para una supuesta superposición no están indicados.'},
  follow:{'pbc-six':'Adecuado: bioquímica temprana y evaluación formal de respuesta tras alrededor de 12 meses de UDCA.','pbc-response':'Adecuado: no esperar hasta el año para el primer contacto clínico y de laboratorio.','pbc-pruritus':'La mejoría del prurito no demuestra respuesta bioquímica; seguir FA y bilirrubina.','pbc-year':'Esperar 12 meses para la primera revisión retrasa detección de intolerancia, cambios y respuesta inicial.'}
 },
 'dili-cholestatic-v1': {
  evidence:'Ernesto recibió amoxicilina/clavulánico y terminó hace tres semanas; presentó prurito e ictericia recientemente. ALT 94 U/L (LSN 40), FA 290 U/L (LSN 130), bilirrubina directa 1,8 y total 2,4 mg/dL; R ≈ 1,05.',
  differential:'R = (ALT/LSN ALT)/(FA/LSN FA) ≈ 1,05, patrón colestásico. El cociente R clasifica el tipo de lesión, NO prueba causalidad ni gravedad. La cronología es compatible con DILI por amoxicilina/clavulánico, pero se deben excluir obstrucción, virus y otras causas.',
  key:'Documentar la sospecha y evitar reexposición. Bilirrubina, INR, estado mental y evolución clínica orientan urgencia; el paciente hoy está estable, pero necesita control precoz.',
  plans:{'drug-safety':'Correcta: evita reexposición y documenta el agente, revisa exposiciones y explica alarmas.','drug-symptoms':'Tratar el prurito es válido, pero falta reconocer y registrar el fármaco causante sospechoso.','drug-observe':'Vigilar sin indicar evitar reexposición y sin documentar la reacción deja un riesgo preventivo importante.','drug-steroid-trial':'Los corticoides no son tratamiento rutinario de la DILI colestásica sin otra indicación.'},
  follow:{'drug-close':'Correcto: reevaluar precozmente síntomas, bilirrubina e INR y cambiar de ámbito si aparecen alarmas.','drug-month':'Esperar un mes con ictericia reciente puede demorar la detección de deterioro.','drug-enzymes-only':'La mejoría de ALT/FA no garantiza seguridad; deben vigilarse bilirrubina, INR y estado mental.'}
 },
 'aih-planning-v1': {
  evidence:'Valeria tiene astenia, AST 210 U/L, ALT 286 U/L, IgG 2.720 mg/dL, ANA 1:320 y ASMA 1:160. La biopsia muestra hepatitis de interfase con infiltrado linfoplasmocitario y fibrosis F2. Desea embarazo en uno o dos años.',
  differential:'Autoanticuerpos por sí solos no bastan; en conjunto con actividad hepatocelular, hipergammaglobulinemia, histología y exclusión de virus y otras causas apoyan hepatitis autoinmune activa. Una elastografía obtenida con inflamación puede sobrestimar rigidez.',
  key:'Inducción y mantenimiento bajo supervisión, con control de AST/ALT, IgG y seguridad. En deseo reproductivo, preferir una estrategia compatible con embarazo y coordinar planificación preconcepcional.',
  plans:{'aih-treat':'Adecuada como estrategia general, pero debe especificarse el agente de mantenimiento, la seguridad reproductiva y los controles.','aih-steroids':'Adecuada: el corticoide inicia el control inflamatorio, con selección de mantenimiento y planificación reproductiva.','mmf':'Inadecuada: micofenolato aislado no es un esquema de inducción apropiado y tiene riesgo teratogénico. En una paciente con deseo de embarazo, debe priorizarse un régimen compatible o cambiarlo con antelación suficiente.','aih-induction-only':'Parcial: iniciar corticoide puede ser razonable, pero falta un plan completo de mantenimiento y conversación reproductiva.'},
  follow:{'aih-close':'Correcto: controlar enzimas, IgG y seguridad en las primeras semanas; respuesta bioquímica y tolerancia guían ajustes.','aih-late':'Tres meses sin revisión inicial es tardío para comenzar inmunosupresión.','aih-enzymes-only':'Las aminotransferasas importan, pero IgG y seguridad de fármacos también deben monitorizarse.'}
 },
 'cirrhosis-compensated-v1': {
  evidence:'Héctor tiene contorno nodular, bazo 15 cm, colaterales portosistémicas y plaquetas reducidas para este contexto; elastografía 27,5 kPa si se solicita. Sin antecedentes de ascitis, hemorragia o encefalopatía.',
  differential:'Estos datos apoyan cirrosis compensada con hipertensión portal clínicamente significativa. Estar asintomático, no tener ascitis y conservar ALT casi normal no descarta enfermedad avanzada; trombocitopenia aislada tampoco equivale a descompensación.',
  key:'Prevención de descompensación mediante betabloqueante no selectivo cuando no hay contraindicaciones y es tolerable; vigilancia de carcinoma hepatocelular semestral y control precoz de tensión/pulso/riñón.',
  plans:{'portal-prevent':'Correcta: carvedilol valorando presión arterial y tolerancia, más medidas generales y alarmas.','portal-diuretics':'Sin ascitis ni edema, indicar diuréticos preventivos expone a hipotensión, hiponatremia y lesión renal sin beneficio.','portal-wait':'La vigilancia sin prevención portal desaprovecha una intervención indicada cuando existe CSPH.','portal-more-tests':'La evidencia clínica e imagenológica ya permite discutir prevención; no se debe posponer sin motivo.'},
  follow:{'portal-close':'Correcto: evaluar tolerancia al betabloqueante pronto y, separadamente, ecografía y AFP cada seis meses.','portal-6':'Esperar seis meses para comprobar presión, pulso y función renal después de iniciar carvedilol es demasiado tardío.','portal-tolerance-only':'Revisar tolerancia pronto es necesario, pero falta vigilancia semestral de hepatocarcinoma.'}
 }
};
// Explain the most plausible alternative hypotheses when chosen by the player.
// All explanations are available only in the completed consultation.
const alternatives={
 'masld-intro-v1':{dili:'No hay una exposición nueva temporalmente relacionada; la estatina se mantiene estable desde hace años y coinciden esteatosis y factores metabólicos.',alcohol:'El consumo informado de 0–10 g/semana es demasiado bajo para desplazar la explicación cardiometabólica.',aih:'IgG y autoinmunidad no sustentan hepatitis autoinmune; la ecografía muestra esteatosis.'},
 'gilbert-v1':{hemolysis:'Hemoglobina, reticulocitos, LDH, haptoglobina y frotis no sugieren destrucción eritrocitaria aumentada.',obstruction:'Predomina la bilirrubina indirecta con FA y transaminasas normales; no hay patrón obstructivo.', 'acute-hepatitis':'No hay elevación de enzimas ni síndrome agudo compatible con hepatitis viral.'},
 'masld-older-v1':{'compensated-csph':'FIB-4 2,26 exige una segunda prueba; no demuestra por sí solo cirrosis ni hipertensión portal.',aih:'No hay hipergammaglobulinemia ni autoanticuerpos que orienten a esta causa.'},
 'hbv-monitor-v1':{'active-hbv':'La ALT permanece normal y el ADN-VHB es 450 UI/mL, sin actividad inmunomediada documentada que justifique esta etiqueta.', 'acute-hepatitis':'HBsAg positivo hace más de 14 meses corresponde a infección crónica, no una nueva infección aguda.'},
 'hcv-treatment-v1':{'resolved-hcv':'El ARN-VHC detectable demuestra infección actual, no exposición ya resuelta.','acute-hepatitis':'No hay evidencia suficiente para clasificarla como hepatitis viral aguda; el objetivo es evaluar y tratar una infección activa.'},
 'hemochromatosis-v1':{masld:'Puede coexistir con alteraciones metabólicas, pero la saturación de 76 % y C282Y homocigoto explican mejor la sobrecarga de hierro.',aih:'No hay IgG elevada ni autoinmunidad, y el patrón del hierro apunta a HFE.'},
 'pbc-v1':{obstruction:'La ecografía no muestra dilatación biliar ni lesión obstructiva y el AMA-M2 apoya colangiopatía autoinmune.',psc:'La asociación de colestasis con AMA-M2 positivo e IgM elevada orienta más a CBP; sin datos de colangitis esclerosante.',aih:'Predomina la colestasis, con AMA positivo e IgG normal; no hay evidencia de superposición que justifique inmunosupresión.'},
 'dili-cholestatic-v1':{pbc:'La colestasis apareció después de un antibiótico y no hay AMA positivo ni historia crónica característica de CBP.',obstruction:'No hay dilatación ni cálculo obstructivo en ecografía; la exposición farmacológica es un dato clave.','acute-hepatitis':'Los marcadores virales agudos del caso son negativos; el patrón de laboratorio y la cronología orientan a DILI.'},
 'aih-planning-v1':{dili:'No se documentó nueva exposición farmacológica; IgG, autoanticuerpos e histología apoyan autoinmunidad.',pbc:'Predomina un patrón hepatocelular con IgG elevada; no la colestasis y AMA típicos de CBP.','acute-hepatitis':'Se descartaron causas virales agudas relevantes y la histología e inmunología favorecen hepatitis autoinmune.'},
 'cirrhosis-compensated-v1':{decompensated:'No ha tenido ascitis, encefalopatía ni hemorragia digestiva; la trombocitopenia no constituye descompensación.',masld:'La etiología metabólica puede explicar la fibrosis, pero la pregunta clínica actual es reconocer la cirrosis ya establecida y la hipertensión portal.'}
};
const clinicalTurningPoints={
  "masld-intro-v1": "Si la diabetes se descontrola, aparece caída de plaquetas o sube FIB-4, adelanta la estratificación; si las enzimas persisten elevadas más de seis meses, revisa etiologías y factores coexistentes.",
  "gilbert-v1": "Una elevación de la fracción directa, anemia con reticulocitosis, coluria, fiebre o dolor ya no debe interpretarse automáticamente como Gilbert y exige reevaluación.",
  "masld-older-v1": "Una elastografía indeterminada o discordante, caída de plaquetas o signos portales cambia la prioridad: completar pruebas secundarias o derivar a hepatología.",
  "hbv-monitor-v1": "Ascenso persistente de ALT/ADN-VHB, evidencia de fibrosis significativa, embarazo, inmunosupresión o mayor riesgo de CHC obliga a revalorar seguimiento y posible tratamiento.",
  "hcv-treatment-v1": "Una interacción importante entre el AAD y simvastatina u omeprazol cambia el esquema o la medicación; sin ARN-VHC posterior no puedes documentar curación.",
  "hemochromatosis-v1": "Anemia, intolerancia a flebotomías, daño orgánico o fibrosis avanzada exige ajustar estrategia; la ferritina y la hemoglobina guían depleción y seguridad.",
  "pbc-v1": "FA o bilirrubina que no mejoran adecuadamente durante el UDCA requieren revisar adherencia, riesgo y opciones de segunda línea; prurito persistente necesita abordaje propio.",
  "dili-cholestatic-v1": "Un INR en ascenso, encefalopatía, sangrado o empeoramiento rápido modifica de inmediato el ámbito de atención; R por sí solo no indica gravedad.",
  "aih-planning-v1": "Al elegir el ahorrador, la planificación reproductiva cambia la decisión: MMF es teratógeno y debe retirarse al menos tres meses antes de concebir; la enfermedad debe controlarse antes del embarazo.",
  "cirrhosis-compensated-v1": "Hipotensión, bradicardia sintomática o deterioro renal obligan a revisar carvedilol; ascitis, hemorragia o encefalopatía cambia la fase de la cirrosis y el manejo."
};
const diagnosisNames={
 undetermined:'Etiología aún no definida',alcohol:'Enfermedad hepática asociada al alcohol',aih:'Hepatitis autoinmune',obstruction:'Obstrucción biliar', 'acute-hepatitis':'Hepatitis viral aguda','active-hbv':'Hepatitis B inmunoactiva','inactive-hbv':'Infección por VHB de baja actividad','active-hcv':'Infección activa por VHC','resolved-hcv':'Infección por VHC resuelta',pbc:'Colangitis biliar primaria',psc:'Colangitis esclerosante primaria',hfe:'Hemocromatosis HFE',hemolysis:'Hemólisis',gilbert:'Síndrome de Gilbert',masld:'MASLD',dili:'DILI','compensated-csph':'Cirrosis compensada con hipertensión portal',decompensated:'Cirrosis descompensada',wilson:'Enfermedad de Wilson'
};
function teachingFeedbackFor(caseData,consultation){
 const id=String(caseData?.id||'').replace(/-reasoning-v2$/,'');
 const guide=lessons[id];if(!guide||!consultation?.outcome)return null;
 const d=consultation.decisions;
 const parts=consultation.outcome.parts;
 const part=id=>parts.find(p=>p.id===id);
 const diagnosisCorrect=d.diagnosis===caseData.rubric.diagnosis;
 const missing=caseData.rubric.essential.filter(id=>!consultation.reviewed.includes(id));
 const lowValue=part('studies')?.unnecessary||[];
 const isPilot=window.HepatoDay1Modules['martin-reasoning.mjs'].isMartin(caseData)&&Boolean(d.sctChoice);
 const interpretation=isPilot?window.HepatoDay1Modules['martin-reasoning.mjs'].lookup(window.HepatoDay1Modules['martin-reasoning.mjs'].fibrosis,d.kftFibrosisChoice):window.HepatoDay1Modules['game-choices.mjs'].interpretationChoicesFor(d.diagnosis,consultation.choiceSeed).find(x=>x.id===d.interpretationChoice);
 const interpretationPart=part('interpretation');
 const interpretationWhy=interpretationPart?.explanation||guide.differential;
 const diagnosticPart=part('diagnosis');
 const interpretationCorrect=interpretationPart?.score===interpretationPart?.max&&!interpretationPart?.missing?.length;
 const critical=consultation.outcome.critical||[];
 const studyDetails=part('studies')?.missing||[];
 return {
   evidence:guide.evidence,differential:guide.differential,key:guide.key,pivot:clinicalTurningPoints[id]||'',
   diagnosticFeedback:diagnosisCorrect?'Acertaste la hipótesis principal. Lo importante es que esté respaldada por la historia y los estudios realmente revisados.':diagnosticPart?.score===1?'Reconociste explícitamente la incertidumbre, completaste la evaluación pendiente y planificaste un control; esto es válido cuando aún faltan datos. La hipótesis que explica finalmente este escenario se fundamenta en la evidencia expuesta arriba.':`Elegiste «${diagnosisNames[d.diagnosis]||d.diagnosis}». ${alternatives[id]?.[d.diagnosis]||'Esta hipótesis no integra tan bien el patrón, la cronología y los estudios descritos arriba.'} La explicación de referencia se apoya en los hallazgos enumerados del paciente.`,
   interpretationFeedback:d.autoFailedByDiagnosis?`Calificada automáticamente como incorrecta (0 pts) al seleccionar un diagnóstico principal erróneo. ${interpretationWhy}`:interpretationCorrect?`Interpretación adecuada${interpretation?.title?` («${interpretation.title}»)` : ''}. ${interpretationWhy}`:`Tu interpretación${interpretation?.title?` «${interpretation.title}»`:''} necesita corrección. ${interpretation?.detail?`La tarjeta afirmaba: «${interpretation.detail}». `:''}${interpretationWhy}${interpretationPart?.notes?.length?' '+interpretationPart.notes.join(' '):''}`,
   studiesFeedback:missing.length?`Faltó revisar: ${studyDetails.join('; ')||missing.join(', ')}. ${caseData.rubric.studyExplanation} Los estudios no revisados limitan la certeza de la conclusión.`:lowValue.length?`Revisaste lo esencial, pero el evaluador considera de bajo valor: ${lowValue.join('; ')}. ${caseData.rubric.studyExplanation} En otros escenarios una prueba adicional sí puede justificarse por una pregunta clínica concreta.`:`Revisaste los estudios centrales. ${caseData.rubric.studyExplanation} Otras pruebas pueden ser válidas si responden a una pregunta clínica razonable.`,
   safetyFeedback:critical.length?`Se detectaron ${critical.length} advertencia(s) de seguridad: ${critical.join(' ')} Estas decisiones merecen prioridad aunque la puntuación total sea relativamente alta.`:'No se detectaron decisiones críticas de seguridad según la rúbrica de este escenario. Esto no sustituye la revisión clínica individual de cada paciente.',
   planFeedback:d.autoFailedByDiagnosis?`Calificada automáticamente como incorrecta (0 pts) al seleccionar un diagnóstico principal erróneo. ${caseData.explanations.plan}`:isPilot?window.HepatoDay1Modules['martin-reasoning.mjs'].feedback(d).find(x=>x.title.includes('Conducta terapéutica'))?.text:guide.plans[d.planChoice]||'La evaluación distingue indicación, seguridad y completitud del tratamiento. Revisa la rúbrica detallada y los estudios que faltan.',
   followFeedback:d.autoFailedByDiagnosis?`Calificada automáticamente como incorrecta (0 pts) al seleccionar un diagnóstico principal erróneo. ${caseData.rubric.followupExplanation}`:isPilot?window.HepatoDay1Modules['martin-reasoning.mjs'].feedback(d).find(x=>x.title.includes('Continuidad'))?.text:guide.follow[d.followupChoice]||'El intervalo debe corresponder al riesgo y al tratamiento; revisa los plazos y objetivos concretos del caso.',
   planScore:part('plan')?.score,followScore:part('followup')?.score,studiesScore:part('studies')?.score
 };
}
return {teachingFeedbackFor,lessons};
})();

