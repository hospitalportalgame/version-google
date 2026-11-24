/* Embedded original source: src/jornadas/dia1/interfaz-reconsultas.js */
/* Módulo Día 1 original: return-visit-ui.mjs. Lógica clínica conservada. */
window.HepatoDay1Modules['return-visit-ui.mjs'] = (() => {
const {returnVisitAvailable,returnVisitScenario,returnVisitStep,returnVisitChoices,returnVisitResult,RETURN_VISIT_SOURCE} = window.HepatoDay1Modules['return-visit.mjs'];
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function returnVisitOfferMarkup(c,caseData,archived=false){
  if(!returnVisitAvailable(c,caseData)||archived&&!c.returnVisit)return '';
  const v=c.returnVisit,result=returnVisitResult(c,caseData);
  if(archived)return `<details class="reasoning-record return-visit-record"><summary>El control de Martín · ${v.status==='completed'?'jugado':'pendiente'}</summary>${result?`<p><b>${escape(result.title)}</b></p><p>${escape(result.habit)}</p>${result.followup?`<p>${escape(result.followup)}</p>`:''}<p>${escape(result.explanation)}</p>`:'<p>El control quedó por comenzar.</p>'}</details>`;
  return `<section class="return-visit-offer"><span class="eyebrow">TU DECISIÓN CONTINÚA</span><h3>${v?.status==='completed'?escape(result.title):'Martín tiene un próximo control'}</h3><p>${v?.status==='completed'?'Quedó registrado el acuerdo que hicieron. Puedes revisarlo antes de seguir.':'Vuelve al consultorio y descubre cómo encaja tu plan en su vida. Dos decisiones breves.'}</p><button class="secondary-button" data-action="return-visit">${v?.status==='completed'?'Revisar el control':v?'Continuar el control':'Jugar el control de Martín'} →</button><small>Opcional · Tu nota de la primera consulta se conserva.</small></section>`;
}
function returnVisitMarkup(c,caseData){
  const scenario=returnVisitScenario(c,caseData),step=returnVisitStep(c),result=returnVisitResult(c,caseData);
  if(!scenario||!c.returnVisit)return '';
  const choices=returnVisitChoices(c,caseData);
  const header=step===0?`<div class="return-visit-timeline"><span>Primera consulta</span><i aria-hidden="true">→</i><b>${escape(scenario.timing)}</b></div><details class="return-visit-context"><summary>Desde la primera consulta</summary><p class="return-visit-consequence">${escape(scenario.consequence)}</p></details>`:'';
  const decision=step===0?`<blockquote class="patient-voice">${escape(scenario.voice)}</blockquote><h3 class="choice-heading">¿Qué acuerdo pueden sostener?</h3>`:step===1?`<blockquote class="patient-voice">${escape(result.reaction)}</blockquote><p class="panel-copy">${scenario.evidenceReady?'La primera evaluación está disponible. Sigue estable y sin síntomas nuevos.':'La primera evaluación dejó información pendiente. Sigue estable y sin síntomas nuevos.'}</p><h3 class="choice-heading">¿Cómo continúas la atención?</h3>`:`<div class="return-visit-outcome ${result.adequate?'good':''}" role="status"><span class="eyebrow">CONTROL FINALIZADO</span><h3>${escape(result.title)}</h3><blockquote class="patient-voice">${escape(result.reaction)}</blockquote><p>${escape(result.explanation)}</p><div class="return-visit-agreements"><p><b>Hábito:</b> ${escape(result.habit)}</p><p><b>Continuidad:</b> ${escape(result.followup)}</p></div></div><details class="reasoning-record"><summary>Por qué este control importa</summary><p>${escape(result.note)}</p><p>Los datos de laboratorio de la primera consulta no equivalen a resultados nuevos ni demuestran una curación. La respuesta clínica se evalúa en controles reales.</p><a href="${RETURN_VISIT_SOURCE.url}" target="_blank" rel="noopener noreferrer">${escape(RETURN_VISIT_SOURCE.label)} ↗</a></details>`;
  return `<div class="clinical-content return-visit-page">${header}<div class="return-visit-step">${step<2?`DECISIÓN ${step+1} DE 2`:'DOS DECISIONES · REGISTRADAS'}</div>${decision}${choices.length?`<div class="quick-choice-grid return-visit-choices">${choices.map(choice=>`<button class="quick-choice" data-return-choice="${choice.id}"><span><b>${escape(choice.title)}</b><small>${escape(choice.detail)}</small></span></button>`).join('')}</div>`:''}</div><div class="panel-actions panel-footer"><button class="secondary-button" data-action="close">${step<2?'Volver al consultorio':'Ver el consultorio'}</button>${step===2?'<button class="primary-button" data-action="next-patient">Recibir a Sofía →</button>':''}</div>`;
}

return {returnVisitOfferMarkup,returnVisitMarkup};
})();

