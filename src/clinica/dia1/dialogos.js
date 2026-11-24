/* Embedded original source: src/clinica/dia1/dialogos.js */
/* Módulo Día 1 original: history-dialogue.mjs. Lógica clínica conservada. */
window.HepatoDay1Modules['history-dialogue.mjs'] = (() => {
const {HISTORY_TOPICS} = window.HepatoDay1Modules['simulation-cases.mjs'];
// Questions follow the patient's opening complaint. They do not consult the
// diagnostic rubric. Voices paraphrase one fact already present in the history;
// the complete original answer remains available beside each response.
const line=(id,question,voice)=>({id,question,voice});
const DIALOGUES={
  'masld-intro-v1-reasoning-v2':[
    line('background','¿Tienes otras enfermedades?','Tengo diabetes y obesidad.'),
    line('evolution','¿Cuándo te avisaron? ¿Cómo te has sentido?','Me lo dijeron hace ocho semanas; no tengo molestias.'),
    line('medications','¿Qué medicación y suplementos tomas?','Tomo metformina y atorvastatina desde hace dos años.'),
    line('exposures','¿Cuánto alcohol tomas? ¿Otras exposiciones?','Tomo muy poco alcohol.'),
    line('context','¿Qué es lo que más te preocupa?','Hago turnos largos al volante; me preocupa que esto me obligue a dejar el trabajo.')
  ],
  'gilbert-v1-reasoning-v2':[
    line('evolution','¿Cuánto duran los episodios?','Me dura unos días y después se me pasa.'),
    line('exposures','¿Qué cambia cuando estás estudiando?','Cuando estoy de exámenes a veces desayuno tarde, tomo poco líquido y duermo mal.'),
    line('background','¿Desde cuándo te pasa? ¿Otras enfermedades?','Me viene pasando desde la adolescencia.'),
    line('medications','¿Usas medicación, hierbas o suplementos?','No tomo medicación ni suplementos.'),
    line('context','¿Le pasa a alguien de tu familia?','A mi papá le pasó algo parecido.')
  ],
  'masld-older-v1-reasoning-v2':[
    line('evolution','¿Desde cuándo te sientes así? ¿Notaste algún otro síntoma?','Llevo semanas muy cansada; desde ayer hago deposiciones muy oscuras, casi negras, y hoy me sentí mareada al caminar.'),
    line('background','¿Qué enfermedades te han diagnosticado?','Tengo diabetes tipo 2, presión alta y obesidad; nunca me diagnosticaron cirrosis ni otra enfermedad hepática avanzada.'),
    line('exposures','¿Alcohol o alguna exposición reciente?','No tomo alcohol ni tuve transfusiones o procedimientos recientes.'),
    line('medications','¿Ha cambiado tu medicación?','Tomo metformina y losartán; no tomo anticoagulantes, antiinflamatorios ni hierbas.'),
    line('context','¿Con quién vives? ¿Esperabas volver hoy a casa?','Vivo con mi pareja; vine pensando que era algo menor del estómago y esperaba volver a casa.')
  ],
  'hbv-monitor-v1-reasoning-v2':[
    line('evolution','¿Qué controles hiciste desde la donación?','Ya me controlé en otro centro; pueden recuperar los registros.'),
    line('background','¿Recibiste tratamiento por este hallazgo?','No recibo tratamiento por aquel hallazgo.'),
    line('context','¿Qué te preocupa sobre tus convivientes?','Mi pareja está vacunada, pero quiero estar seguro de que en casa nadie corre riesgos.'),
    line('medications','¿Tomas o tienes prevista alguna medicación?','No tomo medicación ni suplementos.'),
    line('exposures','¿Tuviste transfusiones u otras exposiciones?','No sé cómo se produjo el hallazgo.')
  ],
  'hcv-treatment-v1-reasoning-v2':[
    line('evolution','¿Cómo es el cansancio? ¿Otros síntomas?','Estoy un poco cansada; no tengo los informes conmigo.'),
    line('exposures','¿Te hicieron transfusiones o procedimientos?','Me hicieron una transfusión en 1988.'),
    line('medications','¿Qué tomas, incluidos suplementos?','Todos los días tomo omeprazol y una pastilla para el colesterol; no sé si importan.'),
    line('background','¿Recibiste tratamientos antes?','Nunca recibí tratamiento para una infección del hígado.'),
    line('context','¿Qué esperas de esta consulta?','Quiero estudiar y tratar lo que corresponda.')
  ],
  'hemochromatosis-v1-reasoning-v2':[
    line('background','¿Dónde te duele? ¿Otras enfermedades?','Me duelen el segundo y el tercer nudillo de las dos manos.'),
    line('context','¿Qué tratamiento recibió tu hermano?','Mi hermano venía cada tanto para que le sacaran sangre; ¿eso se hereda?'),
    line('evolution','¿Desde cuándo estás cansado?','Estoy cansado desde hace varios meses.'),
    line('medications','¿Tomas hierro, medicamentos o hierbas?','No tomo hierro ni medicamentos nuevos.'),
    line('exposures','¿Has recibido transfusiones? ¿Tomas alcohol?','No me hicieron transfusiones.')
  ],
  'pbc-v1-reasoning-v2':[
    line('evolution','¿Desde cuándo pica? ¿Hay otros síntomas?','Llevo ocho meses con picazón.'),
    line('medications','¿Qué tomas? ¿Algo empezó hace poco?','Tomo levotiroxina; no empecé ninguna medicación nueva.'),
    line('background','¿Tienes otras enfermedades diagnosticadas?','Tengo tiroiditis autoinmune.'),
    line('context','¿Cómo afecta tu sueño y tu trabajo?','Me despierto rascándome, y al día siguiente llego agotada al trabajo.'),
    line('exposures','¿Hubo exposiciones recientes? ¿Alcohol?','No hubo exposiciones recientes.')
  ],
  'dili-cholestatic-v1-reasoning-v2':[
    line('evolution','¿Cuándo comenzó? ¿Apareció algún otro síntoma?','Empezó hace cinco días; no tengo dolor ni fiebre.'),
    line('medications','¿Empezaste algún medicamento recientemente?','Me recetaron amoxicilina con clavulánico por una muela; terminé el antibiótico hace tres semanas.'),
    line('exposures','¿Alcohol, nuevos contactos o exposiciones?','No volví a tomar el antibiótico.'),
    line('background','¿Tuviste alguna enfermedad reciente?','Tuve una infección dental, pero ya se resolvió.'),
    line('context','¿Puedes volver pronto si lo necesitas?','Puedo venir pronto al control y buscar atención si empeoro.')
  ],
  'aih-planning-v1-reasoning-v2':[
    line('evolution','¿Cuánto lleva el cansancio? ¿Otros síntomas?','Llevo tres meses cansada; no traje los valores previos.'),
    line('context','¿Qué planes te gustaría que tengamos en cuenta?','Quiero ser mamá en uno o dos años; necesito entender qué medicación sería segura.'),
    line('medications','¿Medicamentos nuevos, hierbas o suplementos?','No empecé medicamentos, hierbas ni suplementos.'),
    line('exposures','¿Alcohol o transfusiones previas?','No tomo alcohol y no recuerdo otras exposiciones.'),
    line('background','¿Hay enfermedades o tratamientos anteriores?','No tengo una enfermedad crónica conocida.')
  ],
  'cirrhosis-compensated-v1-reasoning-v2':[
    line('background','¿Has tenido problemas de salud importantes?','Nunca me sacaron líquido del abdomen ni tuve vómitos con sangre; me dicen que puedo tener cirrosis igual.'),
    line('evolution','¿Apareció hinchazón, sangrado o confusión?','No tengo hinchazón ni he bajado de peso sin querer.'),
    line('medications','¿Qué medicación tomas actualmente?','Tomo metformina; no tomo betabloqueantes ni diuréticos.'),
    line('context','¿Tienes apoyo y puedes venir a los controles?','Tengo apoyo de mi familia y acceso a los controles.'),
    line('exposures','¿Cómo ha sido tu consumo de alcohol?','Ahora no tomo alcohol; antes consumía poco.')
  ]
};
// The original five topics remain intact for grading, saves and backwards
// compatibility. New lines are authored for each individual patient, not
// generated from the hidden diagnosis or from scoring rules.
const NATURAL_VOICES={
  'masld-intro-v1-reasoning-v2':{
    background:'Tengo diabetes tipo 2, obesidad y el colesterol alto. Hasta ahora nunca me habían dicho que tuviera una enfermedad del hígado.',
    evolution:'Me avisaron de los análisis hace unas ocho semanas, pero no traje los números. La verdad es que me siento bien: no he notado ojos amarillos, picazón, dolor ni hinchazón.',
    medications:'Desde hace dos años tomo metformina y atorvastatina. No empecé nada nuevo ni tomo suplementos; me preguntaba si la pastilla del colesterol tendrá algo que ver.',
    exposures:'Bebo muy poco, no todas las semanas. No consumo drogas inyectables y no recuerdo transfusiones ni procedimientos recientes.',
    context:'Paso muchas horas al volante. Me preocupa que el resultado del chequeo me impida seguir trabajando y necesito entender qué puedo hacer.'
  },
  'gilbert-v1-reasoning-v2':{
    evolution:'Los ojos se me ponen algo amarillos durante unos días y después vuelven a la normalidad. Nunca he tenido fiebre, dolor, picazón ni orina oscura cuando me pasa.',
    exposures:'En época de exámenes a veces paso muchas horas sin comer, tomo poca agua y duermo mal. Alcohol, apenas en alguna ocasión.',
    background:'Me ocurre desde la adolescencia, pero fuera de eso estoy sana. Nunca me dijeron que tuviera anemia ni otro problema importante.',
    medications:'No tomo medicamentos, anticonceptivos ni productos naturales. Tampoco he comenzado ningún suplemento recientemente.',
    context:'Mi papá dice que de joven a veces le pasaba lo mismo. Me preocupa que sea algo serio y quiero saber si tendré que tomar alguna medicina.'
  },
  'masld-older-v1-reasoning-v2':{
    evolution:'Llevo semanas sintiéndome muy cansada, y desde ayer empecé con deposiciones muy oscuras, casi negras. Esta mañana sentí bastante debilidad y mareo al caminar, aunque no vomité sangre.',
    background:'Tengo diabetes tipo 2, presión alta y obesidad. Nunca me habían diagnosticado cirrosis ni otra enfermedad hepática avanzada.',
    exposures:'No consumo alcohol actualmente. Tampoco me hicieron transfusiones ni procedimientos recientes.',
    medications:'Tomo metformina y losartán de forma habitual. No tomo anticoagulantes, antiinflamatorios recientes, hierbas ni suplementos.',
    context:'Vivo con mi pareja. Vine creyendo que sería un malestar menor del estómago y esperaba regresar a casa después de la consulta.'
  },
  'hbv-monitor-v1-reasoning-v2':{
    evolution:'Todo empezó cuando fui a donar sangre, hace más de un año. Después me hicieron otros controles, aunque hoy no traje los papeles; me dijeron que podrían recuperarlos.',
    background:'No he tenido problemas graves del hígado, ni barriga hinchada ni sangrados. Tampoco me han indicado tratamiento por aquel resultado.',
    context:'Mi pareja tiene las vacunas y le confirmaron que está protegida. Quiero saber si el resto de las personas con las que vivo necesita hacerse algo.',
    medications:'No tomo medicación habitual ni suplementos. Tampoco tengo previsto un tratamiento que me baje las defensas.',
    exposures:'Nací y crecí en España. No consumo alcohol ni drogas inyectables; no me han transfundido recientemente y no sé cómo apareció aquel resultado.'
  },
  'hcv-treatment-v1-reasoning-v2':{
    evolution:'Últimamente estoy algo cansada, pero sigo haciendo mi vida. No he tenido ojos amarillos, barriga hinchada, sangrados ni confusión. No traje los resultados del chequeo.',
    exposures:'En 1988 me hicieron una transfusión de sangre. No uso drogas inyectables y actualmente no bebo alcohol.',
    medications:'Tomo omeprazol y simvastatina todos los días. No uso hierbas ni suplementos; por favor dime si alguna de estas pastillas puede interferir con un tratamiento.',
    background:'Nunca me han tratado por una infección del hígado. Ya pasé la menopausia y tampoco he tenido complicaciones hepáticas conocidas.',
    context:'Quiero saber qué tengo y tratarlo si hace falta. Puedo venir a consultas y hacerme los controles que correspondan.'
  },
  'hemochromatosis-v1-reasoning-v2':{
    background:'Me duelen los nudillos del índice y del dedo medio de ambas manos. No tengo diabetes, anemia ni me habían diagnosticado nada del hígado.',
    context:'Mi hermano venía al hospital para que le sacaran sangre de vez en cuando. No sé cómo se llama lo que tenía, pero quisiera saber si nos puede pasar a otros familiares.',
    evolution:'Llevo varios meses sintiéndome más cansado. No he tenido ojos amarillos, hinchazón del abdomen, sangrados ni episodios de confusión.',
    medications:'No tomo hierro ni suplementos de vitaminas, hierbas o medicamentos nuevos.',
    exposures:'Nunca recibí transfusiones y bebo poco alcohol, menos de lo que sería una copa por semana de promedio. No me han hecho procedimientos recientes.'
  },
  'pbc-v1-reasoning-v2':{
    evolution:'Llevo unos ocho meses con picazón, sobre todo por la noche. No tenía ronchas ni manchas antes de rascarme. No he tenido fiebre, dolor intenso del lado derecho ni hinchazón.',
    medications:'Tomo levotiroxina hace tiempo y la dosis está estable. No empecé otros medicamentos, hierbas ni suplementos.',
    background:'Tengo tiroiditis autoinmune. Hasta ahora nadie me había dicho que tuviera una enfermedad hepática.',
    context:'Me despierto varias veces por el picor y al otro día llego agotada al trabajo. Lo que más quisiera es poder descansar.',
    exposures:'No bebo casi alcohol ni he tenido exposiciones nuevas. No estoy embarazada.'
  },
  'dili-cholestatic-v1-reasoning-v2':{
    evolution:'Empecé con picazón y algo de amarillo hace cinco días. No tengo fiebre, dolor de barriga, vómitos ni sangrados; estoy comiendo normalmente.',
    medications:'Por una infección en una muela tomé amoxicilina con clavulánico durante siete días. Terminé hace tres semanas. No he usado otros medicamentos nuevos, hierbas ni suplementos.',
    exposures:'No tomo alcohol ni volví a usar ese antibiótico después de terminarlo. Tampoco recuerdo contactos enfermos recientes.',
    background:'Antes de la infección dental estaba bien y nunca había tenido una enfermedad del hígado. La muela ya no me molesta.',
    context:'Puedo regresar pronto para controlar los análisis. Si aparece algo preocupante, tengo cómo acudir a una guardia.'
  },
  'aih-planning-v1-reasoning-v2':{
    evolution:'Llevo unos tres meses muy cansada. No traje los análisis que me hicieron y no he tenido hinchazón del abdomen, sangrados, confusión ni ojos amarillos de forma progresiva.',
    context:'Quisiera intentar quedar embarazada dentro de uno o dos años. Me da miedo empezar una medicina que después pueda perjudicar a un bebé; quiero planificarlo bien.',
    medications:'No he empezado medicación nueva ni he tomado hierbas o suplementos. Nunca recibí tratamiento para bajar las defensas.',
    exposures:'No tomo alcohol ni recuerdo haber recibido transfusiones. No identifico otras exposiciones importantes.',
    background:'No tengo enfermedades crónicas conocidas ni me habían tratado antes por un problema del hígado.'
  },
  'cirrhosis-compensated-v1-reasoning-v2':{
    background:'Tengo diabetes tipo 2. Nunca he tenido líquido en la barriga, vómitos de sangre ni confusión; por eso me sorprende que un médico se preocupe por mi hígado.',
    evolution:'Me siento bastante bien. No tengo las piernas hinchadas, heces negras ni pérdida de peso que no pueda explicar.',
    medications:'Solo tomo metformina. No uso diuréticos ni medicamentos para bajar la presión de las venas del hígado; tampoco suplementos.',
    context:'Mi familia me acompaña y puedo venir a los controles. Quiero entender qué debo vigilar para no tener complicaciones.',
    exposures:'Ahora no bebo alcohol. Antes tomaba muy poco; tampoco recuerdo otras exposiciones relevantes.'
  }
};
// Each new follow-up unlocks after the matching foundational topic is asked.
// Their IDs are deliberately shared across cases but their content is case-specific:
// every patient's asked[] state is stored separately.
const TARGETED_FOLLOWUPS={
  'masld-intro-v1-reasoning-v2':[
    {id:'probe-1',after:'context',question:'¿Cómo te organizas para comer mientras conduces?',voice:'Entre los turnos largos y las rutas no siempre puedo parar a comer a horario. Si tengo que cambiar mi alimentación, quisiera un plan que pueda cumplir trabajando.'},
    {id:'probe-2',after:'medications',question:'¿Suspendiste alguna medicina por miedo al resultado?',voice:'No he suspendido nada. La sigo tomando como siempre, pero me preocupa si la del colesterol puede afectar al hígado.'}
  ],
  'gilbert-v1-reasoning-v2':[
    {id:'probe-1',after:'evolution',question:'Cuando tus ojos cambian de color, ¿también se oscurece la orina?',voice:'No, el color de la orina sigue como siempre. Tampoco tengo dolor o fiebre; me preocupa el color de los ojos.'},
    {id:'probe-2',after:'exposures',question:'¿Has notado relación con los ayunos y el descanso?',voice:'Sí, suele pasarme después de muchas horas estudiando sin comer bien. Cuando vuelvo a mis horarios normales, desaparece.'}
  ],
  'masld-older-v1-reasoning-v2':[
    {id:'probe-1',after:'background',question:'¿Qué controles haces por la diabetes y la presión?',voice:'Tomo mis medicamentos y acudo a controles, pero hacía tiempo que nadie me revisaba el hígado. No sé si el azúcar o la presión pueden estar relacionados.'},
    {id:'probe-2',after:'context',question:'¿Podrías volver si necesitamos evaluar mejor la fibrosis?',voice:'Sí, puedo organizarme para regresar. Prefiero que me expliquen qué estudio falta y por qué es importante.'}
  ],
  'hbv-monitor-v1-reasoning-v2':[
    {id:'probe-1',after:'evolution',question:'¿Los controles anteriores fueron separados en el tiempo?',voice:'Sí, me hicieron análisis en distintos momentos durante el último año. No recuerdo los valores, pero me dijeron que se pueden recuperar.'},
    {id:'probe-2',after:'context',question:'¿Hay antecedentes familiares de cáncer de hígado?',voice:'Que yo sepa, nadie en mi familia ha tenido cáncer de hígado. Mi pareja tiene documentada su vacunación.'}
  ],
  'hcv-treatment-v1-reasoning-v2':[
    {id:'probe-1',after:'medications',question:'¿Sabes cuáles son las pastillas que tomas cada día?',voice:'Sí, omeprazol para el estómago y simvastatina para el colesterol. No quisiera suspenderlas por mi cuenta; ¿habría que revisar interacciones?'},
    {id:'probe-2',after:'background',question:'¿Recibiste alguna vez antivirales o tratamiento del hígado?',voice:'Nunca. Esta sería la primera vez que me estudian para decidir un tratamiento hepático.'}
  ],
  'hemochromatosis-v1-reasoning-v2':[
    {id:'probe-1',after:'context',question:'¿Otros familiares estarían dispuestos a hacerse estudios?',voice:'Sí, creo que mis familiares cercanos consultarían si hiciera falta. Mi hermano no me explicó el nombre exacto de su enfermedad.'},
    {id:'probe-2',after:'background',question:'¿El dolor de las manos se acompaña de otras molestias?',voice:'Me duelen sobre todo esos nudillos y además estoy cansado desde hace meses. No tengo otras molestias importantes del hígado.'}
  ],
  'pbc-v1-reasoning-v2':[
    {id:'probe-1',after:'evolution',question:'¿Aparecieron ronchas o lesiones antes de la picazón?',voice:'No, la piel estaba normal antes. Lo que ves son marcas de tanto rascarme, especialmente de noche.'},
    {id:'probe-2',after:'context',question:'¿Qué es lo que más te afecta de este síntoma?',voice:'Dormir mal. A veces paso la noche rascándome y después me cuesta muchísimo concentrarme en el trabajo.'}
  ],
  'dili-cholestatic-v1-reasoning-v2':[
    {id:'probe-1',after:'medications',question:'¿La picazón comenzó mientras tomabas el antibiótico?',voice:'No. Terminé los siete días de tratamiento y pasaron unas semanas antes de que empezara la picazón y notara el color amarillo.'},
    {id:'probe-2',after:'evolution',question:'¿Has tenido confusión, sangrado o dificultad para comer?',voice:'No, nada de eso. Estoy comiendo bien y puedo volver pronto si necesitas repetir los análisis.'}
  ],
  'aih-planning-v1-reasoning-v2':[
    {id:'probe-1',after:'context',question:'¿Estás buscando un embarazo en este momento?',voice:'Todavía no. Me gustaría intentarlo dentro de uno o dos años, pero prefiero hablar de los riesgos de los medicamentos desde ahora.'},
    {id:'probe-2',after:'medications',question:'¿Tomaste alguna vez corticoides o inmunosupresores?',voice:'No. Nunca me indicaron ese tipo de tratamiento y por eso quiero saber qué controles necesitaría.'}
  ],
  'cirrhosis-compensated-v1-reasoning-v2':[
    {id:'probe-1',after:'evolution',question:'¿Alguna vez tuviste líquido en el abdomen o sangrado digestivo?',voice:'Nunca. No me han drenado líquido, no he vomitado sangre ni he tenido heces negras o episodios de confusión.'},
    {id:'probe-2',after:'background',question:'¿Tienes asma, bloqueos cardíacos o enfermedad renal?',voice:'No que yo sepa. Tengo diabetes, pero no me han diagnosticado esas otras enfermedades.'}
  ]
};
const FALLBACK=[
  line('background','¿Tienes enfermedades o antecedentes importantes?',''),
  line('medications','¿Qué medicamentos, hierbas o suplementos tomas?',''),
  line('exposures','¿Alcohol, procedimientos u otras exposiciones?',''),
  line('evolution','¿Desde cuándo te pasa? ¿Qué otros síntomas hay?',''),
  line('context','¿Qué te preocupa? ¿Cómo es tu entorno?','')
];

function historyDialogueFor(caseData){
  const caseId=caseData?.id;
  const profile=Object.hasOwn(DIALOGUES,caseId)?DIALOGUES[caseId]:FALLBACK;
  const voices=NATURAL_VOICES[caseId]||{};
  const basics=profile.map(({id,question,voice})=>({id,question,voice:voices[id]||voice,
    title:HISTORY_TOPICS.find(topic=>topic.id===id).title,
    answer:typeof caseData?.answers?.[id]==='string'?caseData.answers[id]:''
  }));
  const followups=(TARGETED_FOLLOWUPS[caseId]||[]).map(({id,after,question,voice})=>({id,after,question,voice,answer:'',title:'Profundización dirigida',optional:true}));
  return [...basics,...followups];
}

return {historyDialogueFor};
})();

