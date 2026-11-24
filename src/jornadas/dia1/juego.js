/* Embedded original source: src/jornadas/dia1/juego.js */
/* Módulo Día 1 original: app.mjs. Lógica clínica conservada. */
window.HepatoDay1Modules['app.mjs'] = (() => {
const {ROOM,FIXED_DT,createPlayer,movePlayer,nearestInteraction,sit,stand,findPath,followPath,bindAnalogJoystick} = window.HepatoDay1Modules['engine.mjs'];
const {fib4} = window.HepatoDay1Modules['case.mjs'];
const {initialConsultation,toggleStudyBundle,selectInterpretationChoice,selectPlanChoice,selectFollowupChoice,selectSctChoice,selectMartinFibrosisChoice,recordHypothesis,requestStudies,receiveStudies,resultFor,reviewResult,assessConsultation,decisionsComplete,answerChallenge} = window.HepatoDay1Modules['consultation.mjs'];
const {STUDY_GROUPS} = window.HepatoDay1Modules['game-choices.mjs'];
const {STUDY_CATALOG} = window.HepatoDay1Modules['study-catalog.mjs'];
const Economy=window.HepatoDay1Modules['economy.mjs'];
const {ClinicalUI,escapeClinical,parseClinicalValue} = window.HepatoDay1Modules['clinical-ui.mjs'];
const Hector=window.HepatoDay1Modules['hector-reasoning.mjs'];
const Valeria=window.HepatoDay1Modules['valeria-reasoning.mjs'];
const Ernesto=window.HepatoDay1Modules['ernesto-reasoning.mjs'];
const Lucia=window.HepatoDay1Modules['lucia-reasoning.mjs'];
const Andres=window.HepatoDay1Modules['andres-reasoning.mjs'];
const Rosa=window.HepatoDay1Modules['rosa-reasoning.mjs'];
const Diego=window.HepatoDay1Modules['diego-reasoning.mjs'];
const Elena=window.HepatoDay1Modules['elena-reasoning.mjs'];
const Sofia=window.HepatoDay1Modules['sofia-reasoning.mjs'];
const Martin=window.HepatoDay1Modules['martin-reasoning.mjs'];
const {
  getPatientsForDay,
  HISTORY_TOPICS,
  DIAGNOSIS_CATALOG
} = window.HepatoDay1Modules['simulation-cases.mjs'];

let SIMULATIONS;
const {initialCampaign,restoreCampaign,recordConsultation,advanceCampaign,campaignSummary,hasNextDay,startNextDay} = window.HepatoDay1Modules['campaign.mjs'];
const {createGameSave,readGameSave,MAX_SAVE_BYTES} = window.HepatoDay1Modules['game-save.mjs'];
const {VisitSequence} = window.HepatoDay1Modules['visits.mjs'];
const {render,portraitMarkup,actualizarYRenderizarPolvoPOV} = window.HepatoDay1Modules['renderer.mjs'];
const {SPRITE_CELL} = window.HepatoDay1Modules['character-sprites.mjs'];
const {ExamSequence,actorRoom,EXAM_STATIONS,createActorTransition,sampleActorTransition} = window.HepatoDay1Modules['exam.mjs'];
const {readGameSettings} = window.HepatoDay1Modules['game-settings.mjs'];
const {Ambience} = window.HepatoDay1Modules['ambience.mjs'];
const {returnVisitAvailable,initialReturnVisit,chooseReturnVisit,returnVisitStep,returnVisitScenario} = window.HepatoDay1Modules['return-visit.mjs'];
const {returnVisitMarkup} = window.HepatoDay1Modules['return-visit-ui.mjs'];
const $=id=>document.getElementById(id),canvas=$('world'),ctx=canvas.getContext('2d'),panel=$('panel');
const stage=canvas.parentElement;
let sceneExpanded=false,nativeFullscreen=false;
function sizeExpandedScene(){
  if(!sceneExpanded)return;
  const fit=Math.min(window.innerWidth/ROOM.width,window.innerHeight/ROOM.height);
  const scale=fit>=1?Math.floor(fit):fit;
  canvas.style.width=`${ROOM.width*scale}px`;canvas.style.height=`${ROOM.height*scale}px`;
}
async function expandScene(value){
  sceneExpanded=value;stage.classList.toggle('expanded',value);document.body.classList.toggle('scene-expanded',value);
  $('collapse-btn').hidden=!value;$('expand-btn').setAttribute('aria-expanded',String(value));
  if(value){
    sizeExpandedScene();canvas.focus({preventScroll:true});
    try{if(!document.fullscreenElement&&document.documentElement.requestFullscreen){await document.documentElement.requestFullscreen();nativeFullscreen=true;}}catch{/* The same enlarged view works inside a browser preview. */}
    sizeExpandedScene();
  }else{
    canvas.style.removeProperty('width');canvas.style.removeProperty('height');
    if(nativeFullscreen&&document.fullscreenElement){nativeFullscreen=false;try{await document.exitFullscreen();}catch{}}
    nativeFullscreen=false;canvas.focus({preventScroll:true});
  }
}
$('expand-btn').onclick=()=>expandScene(true);$('collapse-btn').onclick=()=>expandScene(false);
window.addEventListener('resize',sizeExpandedScene);
document.addEventListener('fullscreenchange',()=>{if(nativeFullscreen&&!document.fullscreenElement)expandScene(false);else sizeExpandedScene();});
const SAVE_KEY='hospital-portal-solo-dia1-v1';
let saved=null;try{saved=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');}catch{/* Storage is optional. */}
const restored=restoreCampaign(saved);
SIMULATIONS = getPatientsForDay(restored.campaign.day);
let activeCase=SIMULATIONS[restored.campaign.index];
const state={player:createPlayer(),exam:new ExamSequence(ROOM,activeCase.patient.appearance),visits:new VisitSequence(),clinical:restored.clinical,campaign:restored.campaign,settings:readGameSettings(saved?.settings),keys:new Set(),paused:false,pendingAction:null,toastTimer:null,seatTween:null,visitPurpose:''};
function restoreElenaEmergency(source=null){
  // Los flags narrativos de Elena no son campos del formulario clínico.
  // Restaurarlos desde el guardado cuando pertenece al mismo caso evita
  // perder el epílogo al actualizar o recargar el navegador.
  if (Elena.isElena(activeCase) && source?.caseId === activeCase.id) {
    for (const key of [
      'elenaEmergencyPhase','elenaWrongPhase','elenaWrongChoice',
      'elenaPhone','elenaPhoneStep','emergencyHelpCalled',
      'elenaRescuePhase','elenaEpilogue','elenaDemoComplete',
      'elenaEpilogoRecepcion','elenaBadTime','elenaBadOffset'
    ]) {
      if (Object.hasOwn(source,key)) state.clinical[key]=source[key];
    }
  }
  const phase=state.clinical.elenaEmergencyPhase;
  state.elenaEmergency=Elena.isElena(activeCase) && ['playing','fallen'].includes(phase) ? {phase:'fallen'} : null;
  if(state.elenaEmergency) state.clinical.elenaEmergencyPhase='fallen';
  state.elenaRescue = state.clinical.emergencyHelpCalled && state.clinical.elenaRescuePhase ? {phase:state.clinical.elenaRescuePhase, time:0} : null;
  state.elenaWrong = Elena.isElena(activeCase) && state.clinical.elenaWrongPhase ? createElenaWrong(state.clinical.elenaWrongPhase) : null;
  if (state.elenaWrong?.phase === 'done') state.exam.patient.visible=false;
  frame.phoneRestored=false;
}
restoreElenaEmergency(saved);
const ambience=new Ambience();ambience.setEnabled(state.settings.sound);window.HP_AMBIENCE=ambience;
window.HP_SYNC_SOUND=(enabled)=>{
  if(state?.settings){
    state.settings.sound=!!enabled;
    ambience.setEnabled(state.settings.sound);
    syncElenaMusic();
    hud();
  }
};
window.HP_UPDATE_ARRIVAL_SOUND_BTN?.(state.settings.sound);
if(state.clinical.seated)Object.assign(state.player,ROOM.seat,{seated:true});
if(state.campaign.finished||window.HP_ARRIVAL?.pendingFirstPatient)state.exam.patient.visible=false;
const clinicalUI=new ClinicalUI(state,()=>activeCase);
let currentPanel='',currentTab='history',last=0,accumulator=0,elapsed=0;
// Primera persona es solo una vista temporal; el estado clínico sigue en state.clinical.
let deskViewEnabled=true,deskViewAssetsReady=false;
const deskView=document.createElement('section');
deskView.className='hp-desk-view';deskView.hidden=true;
deskView.setAttribute('aria-label','Vista desde el escritorio de la médica');
deskView.innerHTML='<img class="hp-desk-bg" src="assets/escenas/consulta_pov/fondo.png" alt=""><canvas class="hp-desk-dust-canvas" width="768" height="512" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:2;image-rendering:pixelated;"></canvas><img class="hp-desk-chair" src="assets/sprites/mobiliario/silla-paciente.png" alt=""><img class="hp-desk-patient" src="assets/sprites/pacientes/martin/martin_sentado_frente.png" alt="Martín sentado frente a la médica"><img class="hp-desk-patient-mouth" src="assets/sprites/pacientes/martin/martin_sentado_frente_hablando.png" alt="" aria-hidden="true" hidden><button type="button" class="hp-desk-patient-btn" aria-label="Conversar con Martín" title="Conversar con Martín"><span class="hp-desk-patient-chip" aria-hidden="true">💬 Conversar con Martín</span></button><canvas class="hp-desk-patient-canvas" width="256" height="256" hidden aria-label="Elena en emergencia frente al escritorio"></canvas><img class="hp-desk-table" src="assets/escenas/consulta_pov/escritorio.png" alt=""><button type="button" class="hp-desk-computer" aria-label="Abrir la interfaz clínica" title="Abrir consulta"><span class="hp-monitor-content" aria-hidden="true"><strong>✚ HOSPITAL PORTAL</strong><small>ABRIR SISTEMA ›</small></span></button><button type="button" class="hp-desk-stand">Levantarse</button>';
deskView.querySelector('.hp-desk-stand').insertAdjacentHTML('beforebegin','<img class="hp-desk-keyboard" src="assets/escenas/consulta_pov/teclado_raton_retro.png" alt="">');
deskView.querySelector('.hp-desk-stand').insertAdjacentHTML('beforebegin','<button type="button" class="hp-desk-phone" aria-label="Abrir teléfono del consultorio" title="Teléfono del consultorio"><span class="hp-desk-phone-lcd" aria-hidden="true">INT 104</span></button>');
deskView.querySelector('.hp-desk-stand').insertAdjacentHTML('beforebegin','<button type="button" class="hp-desk-calculator" aria-label="Abrir herramientas clínicas" title="Abrir herramientas clínicas"><span aria-hidden="true">CALCULAR</span></button>');
deskView.querySelector('.hp-desk-stand').insertAdjacentHTML('beforebegin','<button type="button" class="hp-desk-notebook" aria-label="Abrir libreta clínica" title="Libreta clínica"><span class="hp-desk-nb-badge" aria-hidden="true">📋 <b class="hp-desk-nb-count">0</b></span><span class="hp-desk-nb-toast" hidden aria-hidden="true">+1 PISTA</span></button>');
deskView.querySelector('.hp-desk-stand').insertAdjacentHTML('beforebegin','<button type="button" class="hp-desk-tray" aria-label="Bandeja de estudios complementarios" title="Estudios complementarios"></button>');
document.body.appendChild(deskView);
const deskDustCanvas=deskView.querySelector('.hp-desk-dust-canvas');
const deskDustCtx=deskDustCanvas?.getContext('2d');
const deskClassic=document.createElement('button');deskClassic.type='button';deskClassic.className='hp-desk-classic';deskClassic.textContent='Vista clásica';deskView.appendChild(deskClassic);
const deskAgenda=document.createElement('button');deskAgenda.type='button';deskAgenda.className='hp-desk-agenda';deskAgenda.textContent='📅 Agenda';deskAgenda.title='Ver agenda, devoluciones y guardar partida';deskView.appendChild(deskAgenda);
deskAgenda.addEventListener('click',()=>{if(!deskView.hidden&&!state.paused&&!movementBusy())agenda();});
const deskToggle=document.createElement('button');deskToggle.type='button';deskToggle.className='preference-button';deskToggle.textContent='Vista: primera persona';deskToggle.setAttribute('aria-pressed','true');deskToggle.title='Alternar la vista de consulta';
document.querySelector('.room-preferences').appendChild(deskToggle);
deskToggle.addEventListener('click',()=>{
  if(Elena.isElena(activeCase)&&state.elenaEmergency?.phase==='playing')return;
  deskViewEnabled=!deskViewEnabled;deskToggle.textContent=deskViewEnabled?'Vista: primera persona':'Vista: clásica';deskToggle.setAttribute('aria-pressed',String(deskViewEnabled));syncDeskView();
});
deskClassic.addEventListener('click',()=>deskToggle.click());
deskView.querySelector('.hp-desk-computer').addEventListener('click',()=>{if(!deskView.hidden&&!state.paused&&!movementBusy())consultation('history');});
deskView.querySelector('.hp-desk-patient-btn')?.addEventListener('click',()=>{
  if(deskView.hidden||state.paused||panel.open||movementBusy())return;
  openDeskPatientTalk();
});
deskView.querySelector('.hp-desk-calculator').addEventListener('click',()=>{
  if(deskView.hidden||state.paused||panel.open||movementBusy())return;
  if(Elena.isElena(activeCase)&&state.clinical.elenaEmergencyPhase){if(state.clinical.elenaEmergencyPhase==='intro')mostrarIntroElena();return;}
  openDeskCalculator();
});
deskView.querySelector('.hp-desk-phone').addEventListener('click',()=>{
  if(deskView.hidden||state.paused||panel.open||movementBusy())return;
  openDeskPhone();
});
deskView.querySelector('.hp-desk-notebook').addEventListener('click',()=>{
  if(deskView.hidden||state.paused||panel.open||movementBusy())return;
  if(Elena.isElena(activeCase)&&state.clinical.elenaEmergencyPhase){if(state.clinical.elenaEmergencyPhase==='intro')mostrarIntroElena();return;}
  openDeskNotebook();
});
deskView.querySelector('.hp-desk-tray').addEventListener('click',()=>{
  if(deskView.hidden||state.paused||panel.open||movementBusy())return;
  if(Elena.isElena(activeCase)&&state.clinical.elenaEmergencyPhase){if(state.clinical.elenaEmergencyPhase==='intro')mostrarIntroElena();return;}
  openDeskStudiesTray();
});
deskView.querySelector('.hp-desk-stand').addEventListener('click',()=>{
  if(deskView.hidden||state.paused||movementBusy())return;
  if(Elena.isElena(activeCase)&&state.clinical.elenaEmergencyPhase){if(state.clinical.elenaEmergencyPhase==='intro')mostrarIntroElena();return;}
  standPlayer();
});
const phoneAssetImg=new Image();phoneAssetImg.src='assets/escenas/consulta_pov/telefono.png';
const notebookAssetImg=new Image();notebookAssetImg.src='assets/escenas/consulta_pov/libreta.png';
const trayEmptyImg=new Image();trayEmptyImg.src='assets/escenas/consulta_pov/estudios_vacia.png';
const trayFewImg=new Image();trayFewImg.src='assets/escenas/consulta_pov/estudios_pocos.png';
const trayFullImg=new Image();trayFullImg.src='assets/escenas/consulta_pov/estudios_llena.png';
const sofiaFrontImg=new Image();sofiaFrontImg.src='assets/sprites/pacientes/sofia/sofia_sentada_frente.png';
const sofiaWorriedImg=new Image();sofiaWorriedImg.src='assets/sprites/pacientes/sofia/sofia_sentada_frente_preocupada.png';
const sofiaRelievedImg=new Image();sofiaRelievedImg.src='assets/sprites/pacientes/sofia/sofia_sentada_frente_aliviada.png';
const sofiaBlinkImg=new Image();sofiaBlinkImg.src='assets/sprites/pacientes/sofia/sofia_sentada_frente_parpadeo.png';
const sofiaTalkImg=new Image();sofiaTalkImg.src='assets/sprites/pacientes/sofia/sofia_sentada_frente_hablando.png';
const elenaFrontImg=new Image();elenaFrontImg.src='assets/sprites/pacientes/elena/elena_sentada_frente.png';
const elenaTiredImg=new Image();elenaTiredImg.src='assets/sprites/pacientes/elena/elena_sentada_frente_decaimiento.png';
const elenaCritImg=new Image();elenaCritImg.src='assets/sprites/pacientes/elena/elena_sentada_frente_critica.png';
const elenaBlinkImg=new Image();elenaBlinkImg.src='assets/sprites/pacientes/elena/elena_sentada_frente_parpadeo.png';
const elenaTalkImg=new Image();elenaTalkImg.src='assets/sprites/pacientes/elena/elena_sentada_frente_hablando.png';
const martinWorriedImg=new Image();martinWorriedImg.src='assets/sprites/pacientes/martin/martin_sentado_frente_preocupado.png';
const martinRelievedImg=new Image();martinRelievedImg.src='assets/sprites/pacientes/martin/martin_sentado_frente_aliviado.png';
const martinBlinkImg=new Image();martinBlinkImg.src='assets/sprites/pacientes/martin/martin_sentado_frente_parpadeo.png';
const martinTalkImg=new Image();martinTalkImg.src='assets/sprites/pacientes/martin/martin_sentado_frente_hablando.png';
const elenaEmergImg=new Image();elenaEmergImg.src='assets/sprites/pacientes/elena/elena_emergencia_9x3.png';
Promise.all([...deskView.querySelectorAll('img'),phoneAssetImg,notebookAssetImg,trayEmptyImg,trayFewImg,trayFullImg,sofiaFrontImg,sofiaWorriedImg,sofiaRelievedImg,sofiaBlinkImg,sofiaTalkImg,elenaFrontImg,elenaTiredImg,elenaCritImg,elenaBlinkImg,elenaTalkImg,martinWorriedImg,martinRelievedImg,martinBlinkImg,martinTalkImg,elenaEmergImg].map(img=>img.decode())).then(()=>{frame.elenaEmergenciaHoja=elenaEmergImg;deskViewAssetsReady=true;syncDeskViewPatient();syncDeskViewTray();syncDeskView();}).catch(()=>{deskViewEnabled=false;deskToggle.textContent='Vista: clásica';deskToggle.setAttribute('aria-pressed','false');deskToggle.title='No se pudieron cargar los recursos de la vista';});
function isElenaPovEmergency(){
  if(!Elena.isElena(activeCase))return false;
  if(state.elenaRescue||state.elenaWrong||state.clinical.elenaEmergencyPhase==='fallen')return false;
  if(state.clinical.elenaEmergencyPhase==='intro'&&!state.elenaEmergency)return true;
  if(state.elenaEmergency?.phase==='playing'&&!state.elenaEmergency.povDone){
    const inicio=Number.isFinite(state.elenaEmergency.inicioVisual)?state.elenaEmergency.inicioVisual:elapsed;
    const t=Math.max(0,elapsed-inicio);
    return t<1.44;
  }
  return false;
}
function renderDeskElenaEmergencyFrame(cuadro){
  const patientCanvas=deskView.querySelector('.hp-desk-patient-canvas');
  if(!patientCanvas)return;
  const hoja=frame.elenaEmergenciaHoja||elenaEmergImg;
  if(!hoja||!hoja.complete||hoja.naturalWidth!==2304)return;
  const c=Math.max(0,Math.min(8,cuadro|0));
  const ctx=patientCanvas.getContext('2d');
  ctx.clearRect(0,0,256,256);
  ctx.imageSmoothingEnabled=false;
  const sx=(c%9)*256;
  const sy=Math.floor(c/9)*256;
  const scale=[0.96,0.98,1.00,1.02,1.02,1.02,1.02,1.02,1.02][c]??1.0;
  const dy=[6,4,8,-22,-18,-18,-18,-18,-18][c]??0;
  const drawW=Math.round(256*scale);
  const drawH=Math.round(256*scale);
  const dx=Math.round((256-drawW)/2);
  ctx.drawImage(hoja,sx,sy,256,256,dx,dy,drawW,drawH);
  patientCanvas.dataset.elenaFrame=String(c);
  patientCanvas.dataset.elenaStage=c===0?'seated-unwell':c<=2?'rising':c===3?'standing':'hematemesis';
}
let patientTalkingUntil=0;
function triggerPatientTalking(ms=1600){
  patientTalkingUntil=performance.now()+ms;
}
function selectElenaDeskSprite(exprMood, isBlinking) {
  const base = 'assets/sprites/pacientes/elena/elena_sentada_frente';
  if (exprMood === 'critical') return `${base}_critica.png`;
  if (exprMood === 'concerned') return `${base}_decaimiento.png`;
  if (isBlinking) return `${base}_parpadeo.png`;
  return `${base}.png`;
}
function selectDeskPatientSprite(prefix, genderSuffix, exprMood, isBlinking) {
  if (exprMood === 'concerned') return `${prefix}_preocupad${genderSuffix}.png`;
  if (exprMood === 'relieved') return `${prefix}_aliviad${genderSuffix}.png`;
  if (isBlinking) return `${prefix}_parpadeo.png`;
  return `${prefix}.png`;
}
function syncDeskViewPatient(){
  const patientImg=deskView.querySelector('.hp-desk-patient');
  const mouthImg=deskView.querySelector('.hp-desk-patient-mouth');
  const patientBtn=deskView.querySelector('.hp-desk-patient-btn');
  const patientCanvas=deskView.querySelector('.hp-desk-patient-canvas');
  const chairImg=deskView.querySelector('.hp-desk-chair');
  if(!patientImg)return;
  const isSofiaCase=Sofia.isSofia(activeCase);
  const isElenaCase=Elena.isElena(activeCase);
  const exprMood=typeof patientExpressionState==='function'?patientExpressionState().mood:'collaborative';
  const patientName=activeCase?.patient?.name||(isElenaCase?'Elena':isSofiaCase?'Sofía':'Martín');
  const nowMs=performance.now();
  const isTalking=!isReducedMotion()&&nowMs<patientTalkingUntil&&(Math.floor(nowMs/160)%2===0);
  const isBlinking=!isReducedMotion()&&!state.paused&&nowMs>=patientTalkingUntil&&((elapsed%3.6)<0.14);
  const targetSrc=isElenaCase
    ?selectElenaDeskSprite(exprMood,isBlinking)
    :isSofiaCase
      ?selectDeskPatientSprite('assets/sprites/pacientes/sofia/sofia_sentada_frente','a',exprMood,isBlinking)
      :selectDeskPatientSprite('assets/sprites/pacientes/martin/martin_sentado_frente','o',exprMood,isBlinking);
  const mouthSrc=isElenaCase
    ?'assets/sprites/pacientes/elena/elena_sentada_frente_hablando.png'
    :isSofiaCase
      ?'assets/sprites/pacientes/sofia/sofia_sentada_frente_hablando.png'
      :'assets/sprites/pacientes/martin/martin_sentado_frente_hablando.png';
  const patientKey=isElenaCase?'elena':isSofiaCase?'sofia':'martin';
  patientImg.dataset.mood=exprMood;
  const targetAlt=isElenaCase
    ?'Elena sentada frente a la médica'
    :isSofiaCase
      ?'Sofía sentada frente a la médica'
      :'Martín sentado frente a la médica';
  if(!patientImg.src.endsWith(targetSrc)){
    patientImg.src=targetSrc;
    patientImg.alt=targetAlt;
  }
  if(patientBtn){
    const talkLabel=`Conversar con ${patientName}`;
    patientBtn.setAttribute('aria-label',talkLabel);
    patientBtn.setAttribute('title',talkLabel);
    const chip=patientBtn.querySelector('.hp-desk-patient-chip');
    if(chip)chip.textContent=`💬 ${talkLabel}`;
  }
  const playingPov=isElenaCase&&state.elenaEmergency?.phase==='playing'&&!state.elenaEmergency.povDone;
  const fallenPov=isElenaCase&&!state.elenaRescue&&!state.elenaWrong&&(state.clinical.elenaEmergencyPhase==='fallen'||(state.elenaEmergency?.phase==='playing'&&state.elenaEmergency.povDone));
  if(playingPov&&patientCanvas){
    const inicio=Number.isFinite(state.elenaEmergency.inicioVisual)?state.elenaEmergency.inicioVisual:elapsed;
    const t=Math.max(0,elapsed-inicio);
    if(t<1.44){
      const cuadro=Math.min(8,Math.floor(t/0.16));
      patientImg.hidden=true;
      if(mouthImg)mouthImg.hidden=true;
      if(patientBtn)patientBtn.hidden=true;
      if(chairImg)chairImg.hidden=true;
      patientCanvas.hidden=false;
      renderDeskElenaEmergencyFrame(cuadro);
      return;
    }
  }
  if(fallenPov){
    patientImg.hidden=true;
    if(mouthImg)mouthImg.hidden=true;
    if(patientBtn)patientBtn.hidden=true;
    if(chairImg)chairImg.hidden=false;
    if(patientCanvas){
      patientCanvas.hidden=true;
      delete patientCanvas.dataset.elenaFrame;
      delete patientCanvas.dataset.elenaStage;
    }
    return;
  }
  patientImg.hidden=false;
  if(mouthImg){
    if(!mouthImg.src.endsWith(mouthSrc))mouthImg.src=mouthSrc;
    mouthImg.dataset.patient=patientKey;
    mouthImg.hidden=!(isTalking&&exprMood!=='critical');
  }
  if(patientBtn)patientBtn.hidden=false;
  if(chairImg)chairImg.hidden=false;
  if(patientCanvas){
    patientCanvas.hidden=true;
    delete patientCanvas.dataset.elenaFrame;
    delete patientCanvas.dataset.elenaStage;
  }
}
function syncDeskViewTray(){
  const trayBtn=deskView.querySelector('.hp-desk-tray');
  if(!trayBtn)return;
  const receivedCount=(state.clinical&&Array.isArray(state.clinical.received))?state.clinical.received.length:0;
  let sprite='estudios_vacia.png';
  let label='Bandeja de estudios · Vacía (0 informes disponibles)';
  let stateKind='empty';
  if(receivedCount>=6){
    sprite='estudios_llena.png';
    label=`Bandeja de estudios · Llena (${receivedCount} informes disponibles)`;
    stateKind='full';
  }else if(receivedCount>=1){
    sprite='estudios_pocos.png';
    label=`Bandeja de estudios · Pocos documentos (${receivedCount} disponibles)`;
    stateKind='few';
  }
  trayBtn.style.backgroundImage=`url('assets/escenas/consulta_pov/${sprite}')`;
  trayBtn.setAttribute('data-tray-state',stateKind);
  trayBtn.setAttribute('data-studies-count',String(receivedCount));
  trayBtn.setAttribute('title',label);
  trayBtn.setAttribute('aria-label',label);
}
let trackedClueCaseId='';
let trackedClueIds=new Set();
let notebookToastTimer=null;
let lastNotebookDeskSig='';
function syncDeskViewNotebook(notifyNew=false){
  const nbBtn=deskView.querySelector('.hp-desk-notebook');
  if(!nbBtn||!activeCase)return;
  const c=state.clinical||{};
  lastNotebookDeskSig=`${state.campaign?.day||1}:${activeCase.id}:${(c.asked||[]).length}:${c.exam?1:0}:${(c.reviewed||[]).length}:${Object.keys(c.calculations||{}).length}`;
  const Investigation=window.ClinicalInvestigation||window.HepatoDay1Modules['clinical-investigation.mjs'];
  const isPiloto=Boolean(Investigation&&(Investigation.isMartin(activeCase)||Investigation.isSofia(activeCase)||Investigation.isElena(activeCase)));
  const clues=isPiloto?Investigation.getCaseClues(activeCase,state.clinical):[];
  const discovered=clues.filter(c=>c.discovered);
  const caseKey=`${state.campaign?.day||1}:${activeCase.id}`;
  if(trackedClueCaseId!==caseKey){
    trackedClueCaseId=caseKey;
    trackedClueIds=new Set(discovered.map(c=>c.id));
    nbBtn.classList.remove('has-new-clue');
    const toastChip=nbBtn.querySelector('.hp-desk-nb-toast');
    if(toastChip)toastChip.hidden=true;
  }
  let newClues=[];
  if(notifyNew){
    newClues=discovered.filter(c=>!trackedClueIds.has(c.id));
    for(const c of discovered)trackedClueIds.add(c.id);
  }else{
    trackedClueIds=new Set(discovered.map(c=>c.id));
  }
  const countEl=nbBtn.querySelector('.hp-desk-nb-count');
  if(countEl)countEl.textContent=String(discovered.length);
  nbBtn.setAttribute('data-clues-count',String(discovered.length));
  const label=`Libreta clínica · ${discovered.length} de ${clues.length} pistas registradas`;
  nbBtn.setAttribute('title',label);
  nbBtn.setAttribute('aria-label',label);
  if(newClues.length>0){
    nbBtn.classList.add('has-new-clue');
    const toastChip=nbBtn.querySelector('.hp-desk-nb-toast');
    if(toastChip){
      toastChip.textContent=`+${newClues.length} ${newClues.length===1?'PISTA':'PISTAS'}`;
      toastChip.hidden=false;
      if(notebookToastTimer)clearTimeout(notebookToastTimer);
      notebookToastTimer=setTimeout(()=>{if(toastChip)toastChip.hidden=true;},4500);
    }
    animatePopElement(nbBtn,{fromScale:0.88,fromY:5,duration:280});
    const latest=newClues.at(-1);
    if(latest&&['history','consultation'].includes(currentPanel)){
      toast(`📋 Nueva pista en la libreta: ${latest.title}`);
    }
  }
}
function syncDeskView(){
  const isDeskCase=Martin.isMartin(activeCase)||Sofia.isSofia(activeCase)||Elena.isElena(activeCase);
  const elenaPhoneDuringFallen=Elena.isElena(activeCase)&&!state.elenaRescue&&!state.elenaWrong&&state.clinical.elenaEmergencyPhase==='fallen'&&panel.open&&currentPanel==='phone-panel';
  const elenaThirdPersonOnly=Elena.isElena(activeCase)&&!elenaPhoneDuringFallen&&(
    state.elenaRescue||
    state.elenaWrong||
    state.clinical.elenaEmergencyPhase==='fallen'||
    (state.elenaEmergency&&!isElenaPovEmergency())
  );
  const visible=deskViewEnabled&&deskViewAssetsReady&&window.HP_SINGLE_VIEW==='game'&&isDeskCase&&!state.campaign.finished&&state.player.seated&&!state.seatTween&&!state.exam.busy&&!state.exam.atBed&&!state.visits.busy&&state.exam.patient.visible!==false&&state.exam.patient.seated&&!elenaThirdPersonOnly;
  const wasHidden=deskView.hidden;
  deskView.hidden=!visible;
  if(visible){
    syncDeskViewPatient();
    syncDeskViewTray();
    const c=state.clinical||{};
    const sig=`${state.campaign?.day||1}:${activeCase?.id||''}:${(c.asked||[]).length}:${c.exam?1:0}:${(c.reviewed||[]).length}:${Object.keys(c.calculations||{}).length}`;
    if(wasHidden||sig!==lastNotebookDeskSig)syncDeskViewNotebook(false);
    if(wasHidden)animateDeskViewEntrance();
  }
  document.body.classList.toggle('hp-desk-active',visible);
  document.body.classList.toggle('hp-desk-computer-open',visible&&panel.open&&currentPanel==='consultation');
  const touchEl=document.querySelector('#hp-day1 .touch-controls');
  if(touchEl)touchEl.hidden=Boolean(visible||state.player.seated||movementBusy()||panel.open||state.paused);
}
let clickPulse=null; // purely visual; deliberately not part of save data
let pendingLoadedGame=null;
const percent=n=>`${Math.round(n*100)}%`;
function movementBusy(){return state.exam.busy||state.visits.busy||!!state.seatTween||state.elenaEmergency?.phase==='playing'||!!state.elenaRescue||!!state.elenaWrong && state.elenaWrong.phase !== 'done';}
// DEMO: Martín y Sofía reciben resultados el Día 2.
function estudiosDiferidosDemo() {
  return state.campaign.day === 1 &&
    (Martin.isMartin(activeCase) || Sofia.isSofia(activeCase)) &&
    state.clinical.received.length === 0;
}
function returnVisitActive(){return returnVisitAvailable(state.clinical,activeCase)&&state.clinical.returnVisit?.status==='active';}
function save(){Economy.settle(state.campaign,activeCase,state.clinical);window.HP_FUNDS?.update(state.campaign.finance);try{localStorage.setItem(SAVE_KEY,JSON.stringify({caseId:activeCase.id,...state.clinical,campaign:state.campaign,settings:state.settings,hospitalArrival:window.HP_ARRIVAL?.snapshot()||saved?.hospitalArrival||null}));}catch{}}
// Epílogo visual independiente de los paneles de consulta.
const epilogueScenes = {
  scene1: {text:'Elena fue trasladada de urgencia. Su estado era crítico. Las próximas horas serían decisivas.', image:'assets/escenas/elena_epilogo_01_traslado.png', label:'Traslado de Elena a emergencias'},
  scene2: {text:'Las horas se convirtieron en días. Elena permanecía en terapia intensiva, luchando por su vida. Su familia esperaba, aferrada a la esperanza de volver a verla sonreír.', image:'assets/escenas/elena_epilogo_02_terapia_intensiva.png', label:'Elena en terapia intensiva'},
  scene3: {text:'Después de semanas de incertidumbre, Elena finalmente recibió el alta. Aún tenía un largo camino de recuperación, pero lo más importante era que podría volver a casa con su familia.', image:'assets/escenas/elena_epilogo_03_salida_hospital.png', label:'Elena regresa a casa'},
  scene4: {text:'Meses después, Elena sostuvo por primera vez a su nieto. Aquel futuro que parecía incierto ahora estaba entre sus brazos.', image:'assets/escenas/elena_epilogo_04_nieto.png', label:'Elena y su nieto'} 
};
const epilogue = document.createElement('section');
epilogue.className = 'elena-epilogue';
epilogue.hidden = true;
epilogue.setAttribute('aria-label', 'Traslado de Elena a emergencias');
epilogue.innerHTML = '<div class="elena-epilogue-image"></div><div class="elena-epilogue-dialog" hidden><p></p><button type="button" hidden>Continuar →</button></div><div class="elena-epilogue-final" hidden><h1>HOSPITAL PORTAL</h1><p class="elena-final-motto">Cada decisión cuenta.</p><p class="elena-final-message">Detrás de cada paciente hay una historia que continúa más allá del consultorio.</p><p class="elena-final-end">FIN DE LA DEMOSTRACIÓN</p><p class="elena-final-next">CONTINUARÁ...</p><div class="elena-final-signature"><div class="elena-final-character elena-final-doctor" role="img" aria-label="Doctora"></div><div class="elena-final-credit"><span>UN JUEGO CREADO POR</span><strong>Keivin Duque</strong><a class="elena-final-email" href="mailto:hospitalportal.game@gmail.com">✉ hospitalportal.game@gmail.com</a><small>© 2026 · HOSPITAL PORTAL</small></div><div class="elena-final-character elena-final-manager" role="img" aria-label="Gerente"></div></div><button type="button">Volver al menú</button></div>';
stage.appendChild(epilogue);
epilogue.addEventListener('pointerdown',()=>{
  if(state.clinical.elenaEpilogue==='badCinema' && !window.HP_MUSIC?.sorrowStatus().playing){
    window.HP_MUSIC?.beginSorrow(Math.max(0,(Number(state.clinical.elenaBadTime)||0)-(Number(state.clinical.elenaBadOffset)||0)));
  }
  window.HP_MUSIC?.unlock();
});
const epilogueImage = epilogue.querySelector('.elena-epilogue-image');
const epilogueDialog = epilogue.querySelector('.elena-epilogue-dialog');
const epilogueParagraph = epilogueDialog.querySelector('p');
const epilogueButton = epilogueDialog.querySelector('button');
const epilogueFinal = epilogue.querySelector('.elena-epilogue-final');
const epilogueMenu = epilogueFinal.querySelector('button');
const epilogueTimeCard=document.createElement('p');
epilogueTimeCard.className='elena-epilogue-timecard';
epilogueTimeCard.textContent='Semanas después…';
epilogueTimeCard.hidden=true;
epilogueDialog.before(epilogueTimeCard);
const epilogueEconomic=document.createElement('section');
epilogueEconomic.className='elena-economic';epilogueEconomic.hidden=true;
epilogueEconomic.innerHTML='<div class="elena-economic-card"><span class="elena-economic-kicker"></span><h2></h2><p class="elena-economic-copy"></p><div class="elena-economic-details"></div><button type="button">Continuar →</button></div>';
epilogue.append(epilogueEconomic);
const economicButton=epilogueEconomic.querySelector('button');
economicButton.onclick=()=>{
  const rescue=state.elenaRescue;
  if(!rescue?.economicReady||rescue.economicClosing)return;
  rescue.economicClosing=.001;economicButton.disabled=true;
};
function updateElenaEconomic(rescue,dt){
  const narrative=state.clinical.elenaEpilogue==='economicNarrative';
  if(!narrative&&state.campaign.finance.elena?.status!=='applied'){
    Economy.finalizeElena(state.campaign);save();
  }
  if(!state.paused&&!document.hidden){rescue.epilogueTime=(rescue.epilogueTime||0)+dt;if(rescue.economicClosing)rescue.economicClosing+=dt;}
  const t=rescue.epilogueTime||0,closing=Math.min(1,(rescue.economicClosing||0)/.7);
  const bad=state.clinical.elenaEpilogoRecepcion===true;
  const text=narrative
    ?'Meses después, la familia obtuvo una indemnización por las fallas en la atención de Elena. El hospital, ya debilitado por la crisis económica, no pudo afrontar el pago y terminó cerrando sus puertas.'
    :bad?'El hospital no pudo afrontar sus obligaciones. La indemnización agotó los fondos disponibles y el cierre fue definitivo.'
    :'La atención oportuna de Elena permitió completar su tratamiento. La financiación recibida ayudará al hospital a seguir adelante.';
  const characters=Math.max(0,Math.floor((t-1)*30));
  epilogueImage.style.opacity='0';epilogueDialog.hidden=true;epilogueFinal.hidden=true;epilogueTimeCard.hidden=true;
  epilogue.style.backgroundColor='#000';epilogueEconomic.hidden=false;
  epilogueEconomic.classList.toggle('economic-narrative',narrative);
  epilogueEconomic.style.opacity=String(Math.min(1,t)*(1-closing));
  epilogueEconomic.querySelector('.elena-economic-kicker').textContent=narrative?'MESES DESPUÉS':'HOSPITAL PORTAL · INFORME DE GERENCIA';
  epilogueEconomic.querySelector('h2').textContent=narrative?'':bad?'Hospital cerrado':'Atención completada';
  epilogueEconomic.querySelector('.elena-economic-copy').textContent=text.slice(0,characters);
  const details=epilogueEconomic.querySelector('.elena-economic-details');details.hidden=narrative||characters<text.length;
  if(!narrative&&details.hidden===false){
    const f=state.campaign.finance,e=f.entries.find(x=>x.caseId===activeCase.id),saldo=Economy.balance(f);
    if(bad){
      details.innerHTML='<span class="elena-economic-status">FONDOS AGOTADOS · HOSPITAL CERRADO</span><dl><div><dt>Fondos disponibles</dt><dd>'+Economy.money(Math.max(0,saldo))+'</dd></div>'+(saldo<0?'<div><dt>Deuda pendiente</dt><dd>'+Economy.money(-saldo)+'</dd></div>':'')+'</dl><p>Las ganancias acumuladas y la indemnización quedan registradas en el historial financiero.</p>';
    }else{
      details.innerHTML='<span class="elena-economic-status">FINANCIACIÓN RECIBIDA</span><dl><div><dt>Ingreso por atención</dt><dd>+'+Economy.money(e?.reward||0)+'</dd></div><div><dt>Estudios innecesarios</dt><dd>−'+Economy.money(e?.fees||0)+'</dd></div><div><dt>Fondos del hospital</dt><dd>'+Economy.money(saldo)+'</dd></div></dl>';
    }
  }
  rescue.economicReady=characters>=text.length&&!closing;
  economicButton.hidden=!rescue.economicReady;economicButton.disabled=!rescue.economicReady;
  if(closing>=1){
    state.clinical.elenaEpilogue=narrative?'economicReport':'final';
    if(!narrative)state.clinical.elenaDemoComplete=true;
    rescue.epilogueTime=0;rescue.economicClosing=0;rescue.economicReady=false;rescue.finalTime=0;
    epilogueEconomic.hidden=true;save();
  }
}
let badMusicStarted=false,badSaveTime=-1;
const badImages={
  cemetery:'assets/escenas/elena_final_malo_cementerio.png',
  maternity:'assets/escenas/elena_final_malo_maternidad.png'
};
// Precargar las dos ilustraciones sin cambiar las escenas aprobadas.
for(const path of Object.values(badImages)){const image=new Image();image.src=path;}
function updateElenaBadEnding(rescue,dt){
  let t=Math.max(0,Number(state.clinical.elenaBadTime)||0);
  const offset=Number(state.clinical.elenaBadOffset)||0;
  if(!badMusicStarted&&window.HP_MUSIC){window.HP_MUSIC.beginSorrow(Math.max(0,t-offset));badMusicStarted=true;}
  const audio=window.HP_MUSIC?.sorrowStatus();
  const duration=Number.isFinite(audio?.duration)&&audio.duration>0?audio.duration:121;
  if(!state.paused&&!document.hidden){
    const nextTime=t+dt;
    const audioTime=(state.settings.sound&&audio?.playing&&Number.isFinite(audio.time))?audio.time+offset:-1;
    t=Math.max(nextTime,audioTime);
    if(state.settings.sound&&audio?.playing&&Number.isFinite(audio.time)&&nextTime>audioTime+0.05){
      state.clinical.elenaBadOffset=nextTime-audio.time;
    }
  }
  t=Math.min(duration,t);
  state.clinical.elenaBadTime=t;
  if(Math.floor(t)!==badSaveTime){badSaveTime=Math.floor(t);save();}
  const scale=duration/121;
  const cemeteryEnd=48*scale,maternityStart=62*scale,closingStart=110*scale;
  const skip=rescue.badSkip;
  if(skip){
    if(!state.paused&&!document.hidden)skip.time+=dt;
    if(skip.time>=.7){
      const targetTime=skip.target+0.05;
      state.clinical.elenaBadOffset=offset+Math.max(0,targetTime-t);
      state.clinical.elenaBadTime=Math.max(t,targetTime);
      rescue.badSkip=null;save();
      updateElenaBadEnding(rescue,0);return;
    }
  }
  const clamp=value=>Math.max(0,Math.min(1,value));
  epilogue.style.backgroundColor='#000';
  epilogueFinal.hidden=true;
  epilogueButton.hidden=true;
  rescue.textReady=false;
  epilogueTimeCard.hidden=true;
  epilogueDialog.hidden=true;
  const cemetery=t<cemeteryEnd;
  const maternity=t>=maternityStart;
  const image=cemetery?badImages.cemetery:badImages.maternity;
  epilogueImage.style.backgroundImage='url("'+image+'")';
  epilogue.setAttribute('aria-label',cemetery?'Despedida de Elena':maternity?'El nacimiento y la memoria de Elena':'Semanas después');
  epilogueImage.style.opacity=String(cemetery?Math.min(clamp(t/1.5),clamp((cemeteryEnd-t)/1.5)):maternity?Math.min(clamp((t-maternityStart)/1.5),clamp((closingStart+3-t)/3)):0);
  if(!cemetery&&!maternity){
    epilogueTimeCard.hidden=false;
    epilogueTimeCard.style.opacity=String(Math.min(clamp((t-cemeteryEnd-1)/1.5),clamp((maternityStart-t)/1.5)));
  }
  if(maternity&&t>maternityStart+8&&t<closingStart){
    const message='Elena esperaba con ilusión conocer a su nieto. Nunca pudo hacerlo';
    epilogueDialog.hidden=false;
    epilogueDialog.style.opacity=String(clamp(t-maternityStart-8));
    epilogueParagraph.textContent=message.slice(0,Math.floor((t-maternityStart-8)*25));
  }
  const ready=cemetery?t>=2:t<maternityStart?t>=cemeteryEnd+2.5:t>=maternityStart+11&&t<closingStart;
  epilogueDialog.classList.toggle('elena-continue-only',!maternity);
  epilogueParagraph.hidden=!maternity;
  if(ready&&!skip){
    epilogueDialog.hidden=false;epilogueDialog.style.opacity='1';
    epilogueButton.hidden=false;epilogueButton.disabled=false;
    epilogueButton.textContent='Continuar →';rescue.textReady=true;
    rescue.badNext=cemetery?cemeteryEnd:t<maternityStart?maternityStart:closingStart;
  }
  if(skip){
    const alpha=1-clamp(skip.time/.7);
    epilogueImage.style.opacity=String(Number(epilogueImage.style.opacity)*alpha);
    epilogueTimeCard.style.opacity=String(Number(epilogueTimeCard.style.opacity||1)*alpha);
    epilogueDialog.hidden=true;
  }
  if(t>=closingStart+3){
    state.clinical.elenaEpilogue='economicNarrative';
    rescue.epilogueTime=0;rescue.finalTime=0;save();
  }
}
epilogueMenu.addEventListener('click', () => window.HP_SHOW_HOME?.());
epilogueButton.addEventListener('click', () => {
  if(state.clinical.elenaEpilogue==='badCinema'){
    const rescue=state.elenaRescue;
    if(!rescue?.textReady||rescue.badSkip)return;
    rescue.badSkip={time:0,target:rescue.badNext};
    rescue.textReady=false;epilogueButton.disabled=true;return;
  }
  if (state.elenaRescue?.phase !== 'complete' ||
      !epilogueScenes[state.clinical.elenaEpilogue] ||
      !state.elenaRescue.textReady || state.elenaRescue.closing) return;
  // Ambas rutas comparten terapia intensiva; después divergen.
  if (state.clinical.elenaEpilogoRecepcion === true &&
      state.clinical.elenaEpilogue === 'scene2') {
    state.elenaRescue.closing = 0.001;
    epilogueButton.disabled = true;
    return;
  }
  state.elenaRescue.closing = 0.001;
  syncElenaMusic();
  epilogueButton.disabled = true;
});
function updateElenaEpilogue(rescue, dt) {
  if (!rescue || rescue.phase !== 'complete') {
    epilogue.hidden = true;
    return;
  }
  epilogue.hidden = false;
  epilogueEconomic.hidden=true;
  if(['economicNarrative','economicReport'].includes(state.clinical.elenaEpilogue)){
    updateElenaEconomic(rescue,dt);return;
  }
  if(state.clinical.elenaEpilogue==='badCinema'){
    updateElenaBadEnding(rescue,dt);return;
  }
  epilogueTimeCard.hidden=true;
  epilogueDialog.classList.remove('elena-continue-only');
  epilogueParagraph.hidden=false;
  epilogueDialog.style.opacity='1';
  if (state.clinical.elenaEpilogue === 'final') {
    epilogue.setAttribute('aria-label','HOSPITAL PORTAL · Fin de la demostración');
    if(state.clinical.elenaEpilogoRecepcion){
      const audio=window.HP_MUSIC?.sorrowStatus();
      if(audio?.playing||audio?.ended){
        const time=audio.time+(Number(state.clinical.elenaBadOffset)||0);
        state.clinical.elenaBadTime=time;
        if(Math.floor(time)!==badSaveTime){badSaveTime=Math.floor(time);save();}
      }
    }
    if (!state.paused && !document.hidden) rescue.finalTime = (rescue.finalTime || 0) + dt;
    epilogue.style.backgroundColor = '#000';
    epilogueImage.style.opacity = '0';
    epilogueDialog.hidden = true;
    epilogueFinal.hidden = false;
    epilogueFinal.style.opacity = String(Math.min(1, (rescue.finalTime || 0) / 1));
    return;
  }
  epilogueFinal.hidden = true;
  const scene = epilogueScenes[state.clinical.elenaEpilogue] || epilogueScenes.scene1;
  if (epilogue.dataset.scene !== state.clinical.elenaEpilogue) {
    epilogue.dataset.scene = state.clinical.elenaEpilogue;
    epilogue.setAttribute('aria-label', scene.label);
    epilogueImage.style.backgroundImage = 'url("' + scene.image + '")';
  }
  if (!state.paused && !document.hidden) {
    rescue.epilogueTime = (rescue.epilogueTime || 0) + dt;
    if (rescue.closing) rescue.closing += dt;
  }
  const t = rescue.epilogueTime || 0;
  const first = state.clinical.elenaEpilogue === 'scene1';
  const black = first && !state.clinical.elenaEpilogoRecepcion ? Math.min(1, t / 0.7) : 1;
  const imageAlpha = Math.max(0, Math.min(1, t - (first ? 0.7 : 0)));
  const closingDuration = state.clinical.elenaEpilogue === 'scene4' ? 1.5 : 0.7;
  const closing = rescue.closing ? Math.min(1, rescue.closing / closingDuration) : 0;
  epilogue.style.backgroundColor = 'rgba(0,0,0,' + black + ')';
  epilogueImage.style.opacity = String(imageAlpha * (1 - closing));
  const characters = Math.max(0, Math.min(scene.text.length, Math.floor((t - (first ? 1.7 : 1)) * 30)));
  epilogueDialog.hidden = characters === 0 || closing > 0;
  epilogueParagraph.textContent = scene.text.slice(0, characters);
  rescue.textReady = characters === scene.text.length;
  epilogueButton.hidden = !rescue.textReady || closing > 0;
  epilogueButton.textContent = 'Continuar →';
  epilogueButton.disabled = !!closing;
  if (closing >= 1) {
    if(state.clinical.elenaEpilogoRecepcion===true && state.clinical.elenaEpilogue==='scene2'){
      state.clinical.elenaEpilogue='badCinema';
      state.clinical.elenaBadTime=0;
      state.clinical.elenaBadOffset=0;
      badMusicStarted=false;badSaveTime=-1;
      rescue.closing=0;rescue.textReady=false;
      epilogueImage.style.opacity='0';epilogueDialog.hidden=true;
      syncElenaMusic();
      save();
      return;
    }
    const next = {scene1:'scene2', scene2:'scene3', scene3:'scene4', scene4:'economicReport'};
    state.clinical.elenaEpilogue = next[state.clinical.elenaEpilogue];
    rescue.epilogueTime = 0;
    rescue.closing = 0;
    rescue.textReady = false;
    epilogueDialog.hidden = true;
    save();
  }
}
function syncElenaMusic(){
  const epilogue=state.clinical.elenaEpilogue;
  const emergency=Elena.isElena(activeCase) && ['playing','fallen'].includes(state.clinical.elenaEmergencyPhase);
  const later=['scene3','scene4','economicReport','final'].includes(epilogue);
  const fadingToRelief=epilogue==='scene2' && !!state.elenaRescue?.closing;
  const sorrow=state.clinical.elenaEpilogoRecepcion===true && ['badCinema','economicNarrative','economicReport','final'].includes(epilogue);
  const musicMode = sorrow ? 'sorrow' : fadingToRelief&&state.clinical.elenaEpilogoRecepcion ? 'silence' : emergency && (later || fadingToRelief) ? 'hope' : emergency ? 'tension' : 'calm';
  if(sorrow&&!badMusicStarted&&window.HP_MUSIC){window.HP_MUSIC.beginSorrow(Math.max(0,(Number(state.clinical.elenaBadTime)||0)-(Number(state.clinical.elenaBadOffset)||0)));badMusicStarted=true;}
  window.HP_MUSIC?.setGameState(musicMode, state.settings.sound, state.paused);
}
// El recorrido usa las colisiones del consultorio y el atlas aprobado de Elena.
function createElenaWrong(phase){
  const room=actorRoom(ROOM,state.player);
  const furniture=ROOM.furniture.filter(f=>['chair','patient-chair','stool'].includes(f.id)).map(f=>({id:f.id,...f.body}));
  const safeRoom={...room,obstacles:[...room.obstacles,...furniture]};
  const patient={...state.exam.patient,x:246,y:138,face:'left',seated:false,pose:'standing',visible:true,walking:false,speed:38,distance:0,path:[]};
  patient.path=findPath(patient,ROOM.exitDoor,safeRoom);
  return {phase:phase==='done'?'done':'rest',time:0,patient,room:safeRoom,portalTime:0};
}
function updateElenaWrong(dt){
  const w=state.elenaWrong;
  if(!w)return {groundOpacity:1,patient:null};
  if(w.phase==='done') return {groundOpacity:0,patient:{...w.patient,visible:false,doorOpen:0}};
  if(!state.paused&&!document.hidden&&window.HP_SINGLE_VIEW==='game'){
    w.time+=dt;
    if(w.phase==='rest' && w.time>=1){w.phase='rise';w.time=0;}
    else if(w.phase==='rise' && w.time>=.65){w.phase='stand';w.time=0;}
    else if(w.phase==='stand' && w.time>=.6){w.phase='walk';w.time=0;}
    else if(w.phase==='walk'){
      if(w.patient.path.length) followPath(w.patient,dt,w.room);
      else {w.phase='portal';w.portalTime=0;w.patient.face='up';}
    } else if(w.phase==='portal'){
      w.portalTime+=dt;
      const p=Math.min(1,w.portalTime/1.1);
      w.patient.x=ROOM.exitDoor.x;w.patient.y=ROOM.exitDoor.y+(ROOM.doorway.inside.y-ROOM.exitDoor.y)*p;
      w.patient.walking=p<1;w.patient.distance+=dt*w.patient.speed;
      if(p>=1){w.phase='pause';w.time=0;w.patient.visible=false;}
    } else if(w.phase==='pause' && w.time>=1){
      w.phase='done';state.clinical.elenaWrongPhase='done';state.clinical.elenaPhone='ringing';state.exam.patient.visible=false;save();window.HP_ARRIVAL?.prepareElenaEmergency();hud();
      toast('El teléfono está sonando. Contesta la llamada.');
    }
  }
  const rise=w.phase==='rise' ? Math.min(1,w.time/.65) : ['rest'].includes(w.phase)?0:1;
  const groundOpacity=1-rise;
  const p=w.patient;
  const doorOpen=w.phase==='portal' ? 1 : w.phase==='pause' ? Math.max(0,1-w.time/.6) : Math.max(0,1-Math.hypot(p.x-ROOM.exitDoor.x,p.y-ROOM.exitDoor.y)/36);
  return {groundOpacity,patient:{...p,opacity:rise,visible:p.visible && rise>0,portalTravel:w.phase==='portal',doorOpen}};
}
function toast(message){$('toast').textContent=message;$('toast').classList.add('visible');clearTimeout(state.toastTimer);state.toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),3200);}
function sceneRoom(){
  const room=actorRoom(ROOM,state.exam.patient);
  return {...room,interactions:room.interactions.filter(i=>i.id!=='patient'||state.exam.patient.visible!==false).map(i=>i.id==='patient'?(state.exam.atBed?{...i,label:`Examinar a ${activeCase.patient.name}`,...EXAM_STATIONS.bedPose,range:44,approach:EXAM_STATIONS.residentExam,face:EXAM_STATIONS.residentExam.face}:{...i,label:`Conversar con ${activeCase.patient.name}`}):i)};
}
// La historia clínica se muestra únicamente mientras la médica está sentada.
function syncClinicalLayout(){

  // Vista de exploración durante la emergencia de Elena (una vez que regresa a tercera persona).
  const emergenciaCinematica =
    (state.elenaEmergency?.phase === 'playing' && !isElenaPovEmergency()) || !!state.elenaRescue || !!state.elenaWrong;
  document.body.classList.toggle('elena-rescue-active', !!state.elenaRescue || !!state.elenaWrong && state.elenaWrong.phase !== 'done');

  document.body.classList.toggle(
    'hospital-exploring',
    !state.player.seated || emergenciaCinematica
  );

}
function callFirstPatient(){
  if(!window.HP_ARRIVAL?.pendingFirstPatient||!state.player.seated||state.seatTween||state.visits.busy)return;
  if(state.visits.arrive(state.exam.patient,state.player)){
    window.HP_ARRIVAL.patientCalled();save();toast('Llamas al primer paciente. Está entrando al consultorio.');
  }else toast('No se pudo iniciar la entrada del paciente. Levántate y vuelve a sentarte para intentarlo.');
}
function tasks(){const c=state.clinical;return [c.history,c.exam,c.orders.length>0,c.reviewed.length>0,!!c.outcome];}
function patientExpressionState(){
  const c=state.clinical,isElenaCase=Elena.isElena(activeCase),isMartinCase=Martin.isMartin(activeCase),isSofiaCase=Sofia.isSofia(activeCase);
  if(isElenaCase&&state.campaign.day===2){
    if(c.elenaEmergencyPhase||c.asked.length>=1){
      return {
        mood:'critical',
        label:'Palidez y sudor frío',
        detail:'Rostro pálido y perlado de sudor frío; se lleva la mano al epigastrio con debilidad.'
      };
    }
    return {
      mood:'concerned',
      label:'Decaimiento marcado',
      detail:'Luce pálida y fatigada desde que tomó asiento frente al escritorio.'
    };
  }
  if(c.outcome){
    if(c.outcome.adequate||c.outcome.score>=7){
      return {
        mood:'relieved',
        label:'Expresión aliviada',
        detail:isMartinCase
          ?'Respira con alivio al comprender cómo abordar su hígado graso sin procedimientos invasivos innecesarios.'
          :isSofiaCase
            ?'Sonríe más tranquila al saber que su ictericia intermitente responde a una condición benigna.'
            :'Asiente con serenidad y confianza tras recibir una explicación clara del plan.'
      };
    }
    return {
      mood:'concerned',
      label:'Mirada inquieta',
      detail:'Persiste con gesto de preocupación e incertidumbre sobre el manejo de su cuadro.'
    };
  }
  if(c.orders.includes('biopsy')||c.decisions?.kftFibrosisChoice==='fibrosis-c'){
    return {
      mood:'concerned',
      label:'Mirada de preocupación',
      detail:isMartinCase
        ?'Frunce el ceño con inquietud ante la mención de una biopsia hepática o fibrosis avanzada.'
        :'Muestra tensión evidente ante la solicitud de una punción hepática invasiva.'
    };
  }
  if(c.reviewed.length>0||c.orders.includes('elastography')){
    return {
      mood:'concerned',
      label:isMartinCase?'Inquieto por su hígado':isSofiaCase?'Ansiosa por el resultado':'Expectante ante informes',
      detail:isMartinCase
        ?'Observa con preocupación mientras analizas el grado de esteatosis y riesgo de fibrosis.'
        :isSofiaCase
          ?'Aguarda con nerviosismo saber si el tinte amarillento ocular se debe a una hepatopatía grave.'
          :'Sigue tu lectura de los estudios con gesto tenso y atento.'
    };
  }
  if(c.asked.length>0){
    const lastTopic=c.asked.at(-1);
    if(isMartinCase&&['evolution','background','exposures','probe-1','probe-2'].includes(lastTopic)){
      const sabeEsteatosis=c.reviewed.includes('ultrasound');
      return {
        mood:'concerned',
        label:sabeEsteatosis?'Preocupado por esteatosis':'Inquieto por sus análisis',
        detail:sabeEsteatosis
          ?'Relata sus antecedentes con gesto serio, inquieto por si su hígado graso ha progresado.'
          :'Relata sus antecedentes laborales y metabólicos con gesto serio, preocupado por el hallazgo en su chequeo.'
      };
    }
    if(isSofiaCase&&['evolution','background','exposures','probe-1','probe-2'].includes(lastTopic)){
      return {
        mood:'concerned',
        label:'Inquieta por la ictericia',
        detail:'Explica con ansiedad cómo nota los ojos amarillos en días de ayuno o estrés académico.'
      };
    }
    return {
      mood:'speaking',
      label:'Relatando síntomas',
      detail:'Responde con atención a tu interrogatorio y detalla la evolución de su cuadro.'
    };
  }
  return {
    mood:'neutral',
    label:'Actitud colaboradora',
    detail:'Aguarda tus preguntas con disposición tranquila frente al escritorio.'
  };
}
function hud(){
  if(window.HP_MEMORY_ONLY&&!state.warnedMemoryOnly){
    state.warnedMemoryOnly=true;
    $('toast').textContent='Almacenamiento temporal: este navegador no permite conservar tu partida. Si recargas o cierras el juego, perderás el progreso.';
    $('toast').classList.add('visible');
    clearTimeout(state.toastTimer);
    state.toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),7000);
  }
  syncClinicalLayout();
  document.querySelectorAll('#hp-day1 .brand-sub').forEach(el => el.textContent = `CONSULTORIO · DÍA ${state.campaign.day}`);
  document.querySelectorAll('#hp-day1 .build-tag').forEach(el => el.textContent = `DÍA ${state.campaign.day}`);
  if(!state.clinical.choiceSeed)state.clinical.choiceSeed=Math.floor(Math.random()*0x7ffffffe)+1;
  const n=state.campaign.index+1,p=activeCase.patient,completed=state.campaign.completed.length,expr=patientExpressionState();
  const distintivoPaciente=document.querySelector('#hp-day1 .patient-card > .stable-badge');
  distintivoPaciente.style.display=Elena.isElena(activeCase) &&
    (state.clinical.elenaRescuePhase === 'complete' || state.clinical.elenaWrongPhase === 'done') ? 'none' : '';
  distintivoPaciente.lastChild.nodeValue =
    Elena.isElena(activeCase) && ['intro','playing','fallen'].includes(state.clinical.elenaEmergencyPhase) &&
    state.clinical.elenaRescuePhase !== 'complete' && state.clinical.elenaWrongPhase !== 'done'
      ? ' Paciente inestable' : ' Paciente estable';
  $('patient-name').textContent=state.campaign.finished?'Ronda completa':p.name;
  $('patient-details').textContent=state.campaign.finished?`${SIMULATIONS.length} consultas finalizadas`:`${p.age} años · ${p.occupation}`;
  $('patient-portrait').dataset.mood=expr.mood;
  $('patient-portrait').innerHTML=portraitMarkup(p.appearance,expr.mood);
  $('case-number').textContent=`CASO ${String(n).padStart(2,'0')} / ${String(SIMULATIONS.length).padStart(2,'0')}`;
  $('case-name').textContent=activeCase.name;$('case-description').textContent=activeCase.description;
  $('case-difficulty').textContent=`COMPLEJIDAD ${activeCase.level} / 5`;
  $('round-count').textContent=`Devoluciones archivadas: ${completed}`;$('round-fill').style.width=percent(completed/SIMULATIONS.length);
  $('risk-step-detail').textContent='Datos que decidiste solicitar';
  const done=tasks(),count=done.filter(Boolean).length,first=done.findIndex(x=>!x),stage=first<0?4:first;
  $('progress-count').textContent=`${count}/5`;$('progress-fill').style.width=percent(count/5);
  document.querySelectorAll('#checklist li').forEach((li,i)=>{li.classList.toggle('current',i===first);li.querySelector('.check-circle').classList.toggle('done',done[i]);li.querySelector('.check-circle').textContent=done[i]?'✓':i+1;});
  const objectives=[[`Conoce a ${p.name}.`,'Elige qué preguntarle.'],['Acompaña al paciente a la camilla.','Observa los hallazgos del examen físico.'],['¿Qué quieres investigar?','Elige estudios con las tarjetas.'],['Mira los resultados.','Puedes usar las herramientas o ampliar el pedido.'],['Resuelve la consulta.',(activeCase.id===Martin.ID||Sofia.isSofia(activeCase)||Elena.isElena(activeCase)||Diego.isDiego(activeCase)||Rosa.isRosa(activeCase)||Andres.isAndres(activeCase)||Lucia.isLucia(activeCase)||Ernesto.isErnesto(activeCase)||Valeria.isValeria(activeCase)||Hector.isHector(activeCase))?'Registra el diagnóstico, resuelve SCT y KFT y planifica el seguimiento.':'Elige diagnóstico, interpretación, conducta y próximo control.']];
  $('objective').textContent=state.campaign.finished?`Completaste las ${SIMULATIONS.length} consultas de esta jornada.`:done[4]?`Terminaste de atender a ${p.name}.`:objectives[stage][0];
  $('objective-detail').textContent=state.campaign.finished?'Abre la agenda para repasar tus decisiones o iniciar una nueva ronda.':done[4]?'Puedes repasar la devolución o recibir al siguiente paciente.':objectives[stage][1];
  $('mission-step').textContent=done[4]?'05 / 05':`0${stage+1} / 05`;
  $('desk-btn').innerHTML=state.player.seated?'Abrir consulta <span>→</span>':'Ir al escritorio <span>→</span>';
  $('history-btn').innerHTML=returnVisitActive()?'Continuar el control <span>↗</span>':'Conversar con el paciente <span>↗</span>';
  $('checklist').hidden=returnVisitActive();
  if(returnVisitActive()){
    const step=returnVisitStep(state.clinical);
    $('case-name').textContent='El control de Martín';$('case-description').textContent=returnVisitScenario(state.clinical,activeCase).timing;
    $('objective').textContent=step?'Acuerda cómo continuar la atención.':'Elige un hábito que encaje en su jornada.';
    $('objective-detail').textContent='Abre el control de Martín. Son dos decisiones breves.';$('mission-step').textContent=`0${step+1} / 02`;
    $('progress-count').textContent=`${step}/2`;$('progress-fill').style.width=percent(step/2);
  }
  $('speed-btn').textContent=state.settings.fastTransfers?'Traslados: 3×':'Traslados: 1×';$('speed-btn').setAttribute('aria-pressed',String(state.settings.fastTransfers));
  $('speed-btn').setAttribute('aria-label',state.settings.fastTransfers?'Traslados a velocidad triple. Volver a velocidad normal':'Acelerar los traslados a velocidad triple');
  $('sound-btn').textContent=state.settings.sound?'Sonido: activo':'Sonido: apagado';$('sound-btn').setAttribute('aria-pressed',String(state.settings.sound));
  $('sound-btn').setAttribute('aria-label',state.settings.sound?'Silenciar sonidos del consultorio':'Activar sonidos del consultorio');
  contextHUD();save();
}
function contextHUD(){
  const busy=movementBusy(),finished=state.campaign.finished,near=nearestInteraction(state.player,sceneRoom()),name=activeCase.patient.name;
  const title=state.visits.busy?(['parking','leaving','fade-out'].includes(state.visits.stage)?`${name} termina y se retira`:`Llega ${name} al consultorio`):state.exam.busy?(state.exam.stage==='to_bed'?`${name} camina hacia la camilla`:'Volviendo al escritorio'):finished?(state.campaign.day===1?`${SIMULATIONS.length} primeras visitas completadas`:`Jornada completada · ${SIMULATIONS.length} pacientes`):state.player.seated?'Sentada · Frente al paciente':near?near.label:'Explora el consultorio';
  const sub=busy?'El recorrido está en curso. Puedes pausar el turno.':finished?'E para revisar la ronda y las devoluciones.':state.player.seated?'E para abrir la consulta · Q para levantarte':near?'Pulsa E o usa el botón para interactuar.':'Acércate al paciente, a tu silla o al escritorio.';
  const waiting = state.elenaWrong?.phase === 'done';
  const ringing = waiting && state.clinical.elenaPhone === 'ringing';
  const visibleTitle = ringing ? 'Llamada entrante' : waiting && state.clinical.elenaPhone === 'answered' ? 'Urgencia en recepción' : waiting ? 'Elena se retiró del consultorio' : title;
  const visibleSub = ringing ? 'Pulsa E o el botón para contestar.' : waiting && state.clinical.elenaPhone === 'answered' ? 'Recepción solicita ayuda urgente. Puedes moverte por el consultorio.' : waiting ? 'La situación continúa pendiente. Puedes moverte por el consultorio.' : sub;
  if($('context-title').textContent!==visibleTitle)$('context-title').textContent=visibleTitle;
  if($('context-subtitle').textContent!==visibleSub)$('context-subtitle').textContent=visibleSub;
  $('interact-btn').disabled=state.paused||busy||(!ringing && (!near||waiting && state.player.seated));
  $('history-btn').disabled=busy||finished;$('desk-btn').disabled=busy;$('exam-btn').disabled=busy||finished||!!state.clinical.outcome;
  $('reset-btn').disabled=busy;
  $('return-visit-btn').hidden=busy||finished||!returnVisitAvailable(state.clinical,activeCase);
  $('return-visit-btn').textContent=state.clinical.returnVisit?.status==='completed'?'Revisar el control de Martín →':returnVisitActive()?'Continuar el control de Martín →':'Control de Martín · opcional →';
  $('next-patient-btn').hidden=!state.clinical.outcome||busy||finished||returnVisitActive();
  $('next-patient-btn').textContent=state.campaign.index===SIMULATIONS.length-1?'Despedir y terminar la ronda →':'Continuar con otro paciente →';
  $('exam-btn').textContent=state.clinical.exam?'Repetir examen físico':'Hacer examen físico';
  $('interact-btn').innerHTML=ringing?'Contestar llamada <span>↵</span>':state.player.seated?'Abrir consulta <span>↵</span>':'Interactuar <span>↵</span>';
  const status=state.paused?'En pausa':panel.open?'En consulta':busy?'Traslado':state.player.seated?'Sentada':state.player.walking?'Caminando':'Explorando';
  if($('player-status').textContent.trim()!==status)$('player-status').innerHTML=`<i></i> ${status}`;
  const touchEl=document.querySelector('#hp-day1 .touch-controls');
  if(touchEl){touchEl.hidden=Boolean(state.player.seated||busy||panel.open||state.paused||!deskView.hidden);}
}

function adaptDiagnosisSelector(){
  const root=$('panel-body');

  // No modificar el buscador de Martín, ya aprobado.
  if(root.querySelector('.hp-diagnosis-picker'))return;

  const select=root.querySelector('select[data-field="diagnosis"]');
  if(!select||select.hidden)return;

  const oldLabel=select.closest('label.clinical-field');
  if(!oldLabel)return;

  const picker=document.createElement('div');
  picker.className='hp-diagnosis-picker';

  const searchLabel=document.createElement('label');
  searchLabel.textContent='Buscar diagnóstico';

  const search=document.createElement('input');
  search.type='search';
  search.className='hp-diagnosis-search';
  search.placeholder='Escribe el nombre del diagnóstico…';
  search.autocomplete='off';

  searchLabel.appendChild(search);
  picker.appendChild(searchLabel);

  const options=document.createElement('div');
  options.className='hp-diagnosis-options';
  options.setAttribute('role','group');
  options.setAttribute('aria-label','Opciones diagnósticas');

  for(const option of select.options){
    if(!option.value)continue;

    const selected=option.value===select.value;
    const button=document.createElement('button');

    button.type='button';
    button.className='hp-diagnosis-option';

    if(selected)button.classList.add('selected');

    button.dataset.diagnosisChoice=option.value;
    button.setAttribute('aria-pressed',String(selected));

    const mark=document.createElement('span');
    mark.className='hp-diagnosis-mark';
    mark.setAttribute('aria-hidden','true');
    mark.textContent=selected?'✓':'◇';

    const text=document.createElement('span');
    text.textContent=option.textContent;

    button.append(mark,text);
    options.appendChild(button);
  }

  picker.appendChild(options);

  const empty=document.createElement('p');
  empty.className='hp-diagnosis-empty';
  empty.hidden=true;
  empty.textContent='No se encontraron diagnósticos.';
  picker.appendChild(empty);

  // Mantener el selector original para guardar la decisión.
  select.hidden=true;
  select.tabIndex=-1;
  select.setAttribute('aria-hidden','true');

  picker.appendChild(select);
  oldLabel.replaceWith(picker);
}

let activeAbdomenMinigame=null;
function destroyAbdomenMinigame(){
  if(activeAbdomenMinigame){
    try{activeAbdomenMinigame.destroy();}catch{}
    activeAbdomenMinigame=null;
  }
}

function setPanel(title,kicker,body,id){
  destroyNotebookSortables();
  destroyAbdomenMinigame();
  const scrollBody=$('panel-body'),tab=id==='consultation'?currentTab:'';
  $('close-panel').hidden=id==='elena-urgent-call';
  const preserveScroll=panel.open&&panel.dataset.panel===id&&panel.dataset.tab===tab;
  const scroll=preserveScroll?scrollBody.scrollTop:0;
  state.keys.clear();if(!movementBusy()){state.player.path=[];state.player.walking=false;}state.pendingAction=null;
  $('panel-title').textContent=title;$('panel-kicker').textContent=kicker;
scrollBody.innerHTML=body;
currentPanel=id;

// Preguntas específicas para Elena, tercera paciente del Día 2.
if (
  state.campaign.day === 2 &&
  state.campaign.index === 2 &&
  activeCase.id === 'masld-older-v1-reasoning-v2'
) {
  const preguntasElena = {
    evolution:
      '¿Desde cuándo te sientes mal? ¿Cómo han sido tus deposiciones?',
    background:
      '¿Qué enfermedades tienes? ¿Alguna vez te hablaron de problemas hepáticos?',
    medications:
      '¿Qué medicamentos tomas? ¿Has usado antiinflamatorios o anticoagulantes?',
    exposures:
      '¿Consumes alcohol? ¿Has presentado antes algún sangrado digestivo?',
    context:
      '¿Con quién vives? ¿Hay alguien que pueda acompañarte?'
  };

  for (const boton of scrollBody.querySelectorAll('button[data-topic]')) {
    const pregunta = preguntasElena[boton.dataset.topic];
    if (!pregunta) continue;

    const recorrido = document.createTreeWalker(
      boton,
      NodeFilter.SHOW_TEXT
    );

    let nodo;
    while ((nodo = recorrido.nextNode())) {
      if (nodo.textContent.trim() &&
          nodo.textContent.trim() !== '+') {
        nodo.textContent = pregunta;
        break;
      }
    }
  }
}

  panel.dataset.panel=id;panel.dataset.tab=tab;

if (id === 'emergency-active') {
  const decisiones = document.createElement('section');

  decisiones.innerHTML = `
  <section class="hp-emergency-decisions">

    <div class="hp-emergency-heading">
      <div class="hp-emergency-symbol">!</div>

      <div>
        <div class="hp-emergency-label">
          DECISIÓN CLÍNICA · 01
        </div>

        <h3 class="hp-emergency-title">
          Cada decisión importa
        </h3>
      </div>
    </div>

    <p class="hp-emergency-question">
      Elena continúa pálida, sudorosa e hipotensa.
      El sangrado digestivo es abundante y su
      estado clínico se deteriora.
      <strong>¿Qué haces primero?</strong>
    </p>

    <div id="elena-opciones"
         class="hp-emergency-options">

      <button type="button"
        class="hp-emergency-option"
        data-emergencia="esperar">

        <span class="hp-emergency-number">01</span>

        <span class="hp-emergency-option-text">
          Continuar la anamnesis para obtener
          más información antes de intervenir.
        </span>

        <span class="hp-emergency-chevron">›</span>
      </button>

      <button type="button"
        class="hp-emergency-option"
        data-emergencia="ayuda">

        <span class="hp-emergency-number">02</span>

        <span class="hp-emergency-option-text">
          Activar ayuda urgente e iniciar
          la evaluación ABCDE y estabilización.
        </span>

        <span class="hp-emergency-chevron">›</span>
      </button>

      <button type="button"
        class="hp-emergency-option"
        data-emergencia="endoscopia">

        <span class="hp-emergency-number">03</span>

        <span class="hp-emergency-option-text">
          Solicitar una endoscopia ambulatoria
          y esperar su realización.
        </span>

        <span class="hp-emergency-chevron">›</span>
      </button>

    </div>

    <div id="elena-respuesta"
      class="hp-emergency-response"
      role="status"
      aria-live="polite">
    </div>

    <div class="hp-emergency-footer">
      HOSPITAL PORTAL · SIMULACIÓN CLÍNICA
    </div>

  </section>
`;


  scrollBody.append(decisiones);

  const opciones = decisiones.querySelector('#elena-opciones');
  const respuesta = decisiones.querySelector('#elena-respuesta');

  
function mostrarAyudaSolicitada() {
  opciones.hidden = true;

  // La primera decisión ya terminó.
  // Actualizamos el encabezado para continuar la historia.
  const encabezado = decisiones.querySelector(
    '.hp-emergency-heading'
  );

  if (encabezado) {
    encabezado.innerHTML = `
      <div class="hp-emergency-symbol is-alerted">✓</div>
      <div>
        <div class="hp-emergency-label is-alerted">
          RESPUESTA DE EMERGENCIA · 02
        </div>
        <h3 class="hp-emergency-title">
          El equipo ha sido alertado
        </h3>
      </div>
    `;
  }

  const pregunta = decisiones.querySelector(
    '.hp-emergency-question'
  );

  if (pregunta) {
    pregunta.innerHTML = `
      Has solicitado asistencia urgente.
      Mientras el equipo se dirige al consultorio,
      debes mantener la atención de Elena.
    `;
  }

  respuesta.innerHTML = `
    <div class="hp-emergency-alert-box">
      <div class="hp-emergency-alert-kicker">
        EVENTO EN CURSO · PROTOCOLO ABCDE
      </div>

      <p class="hp-emergency-alert-lead">
        La ayuda está en camino.
      </p>

      <p>
        La médica activa el protocolo de emergencia
        y solicita asistencia inmediata.
      </p>

      <p>
        Elena permanece consciente, pero continúa
        muy pálida e hipotensa. Se inicia la
        valoración ABCDE y la estabilización.
      </p>

      <div class="hp-emergency-alert-status">
        LA PACIENTE CONTINÚA INESTABLE
      </div>
    </div>
  `;

  // FINAL BUENO — Preparar la escena de traslado.
  const botonTraslado = document.createElement('button');

  botonTraslado.type = 'button';
  botonTraslado.className = 'primary-button hp-emergency-transfer-btn';
  botonTraslado.textContent = 'Continuar con el traslado →';

  botonTraslado.addEventListener('click', () => {
    if (!state.clinical.emergencyHelpCalled) return;

    setPanel(
      'Respuesta del equipo de emergencias',
      'HOSPITAL PORTAL · TRASLADO URGENTE',
      `
        <p class="panel-copy">
          Has reconocido la gravedad del cuadro y
          solicitado asistencia inmediata.
        </p>

        <article class="history-entry">
          <h3>El equipo responde</h3>
          <p>
            El personal de emergencias se dirige al
            consultorio con una camilla para trasladar
            a Elena a un área de atención crítica.
          </p>
        </article>

        <p class="clinical-note">
          Elena continúa inestable. La atención de
          emergencia y la estabilización deben continuar
          durante el traslado.
        </p>

        <div class="panel-actions panel-footer">
          <button
            class="primary-button"
            data-action="close">
            Volver al consultorio →
          </button>
        </div>
      `,
      'elena-traslado'
    );
  });

  respuesta.appendChild(botonTraslado);
}


  if (state.clinical.emergencyHelpCalled) {
    mostrarAyudaSolicitada();
  }

  decisiones.addEventListener('click', event => {
    const boton = event.target.closest('[data-emergencia]');
    if (!boton || state.clinical.emergencyHelpCalled) return;

    if (boton.dataset.emergencia === 'ayuda') {
      phoneState.view = 'emergency';
      phoneState.replyKey = 'greeting';
      openDeskPhone();
      return;
    }

    if (!['esperar','endoscopia'].includes(boton.dataset.emergencia) || state.elenaWrong) return;
    state.clinical.elenaWrongChoice = boton.dataset.emergencia;
    state.clinical.elenaWrongPhase = 'active';
    state.elenaWrong = createElenaWrong('active');
    state.keys.clear(); state.player.path=[]; state.player.walking=false; state.pendingAction=null;
    closePanel(); syncClinicalLayout(); save();

  });
}

  if(id==='consultation'&&tab==='decisions'){
    adaptDiagnosisSelector();
  }

  document.body.classList.toggle('clinical-panel-open',['history','consultation','physical-exam','return-visit'].includes(id));
  if(!panel.open){ambience.play('folder');panel.showModal();}
  syncDeskView();
  scrollBody.scrollTop=scroll;
  // Keep the close button predictable and move focus away from replaced nodes.
  const focusClose=id==='notebook-panel'?(scrollBody.querySelector('.hp-nb-close-corner-btn')||$('close-panel')):$('close-panel');
  focusClose?.focus({preventScroll:true});contextHUD();
}
function closePanel(){if(currentPanel==='elena-urgent-call' && state.clinical.elenaPhone==='talking')return;if(currentPanel==='phone-panel' && Elena.isElena(activeCase) && state.clinical.elenaEmergencyPhase==='fallen' && !state.clinical.emergencyHelpCalled && !state.elenaWrong){phoneState.view='menu';phoneState.replyKey='greeting';consultation();syncDeskView();return;}destroyNotebookSortables();destroyAbdomenMinigame();phoneState.view='menu';phoneState.replyKey='greeting';$('close-panel').hidden=false;panel.close();document.body.classList.remove('clinical-panel-open');state.keys.clear();canvas.focus({preventScroll:true});syncDeskView();contextHUD();}
$('close-panel').onclick=closePanel;
panel.addEventListener('cancel',e=>{e.preventDefault();closePanel();});
panel.addEventListener('close',()=>{if(!panel.open){destroyNotebookSortables();destroyAbdomenMinigame();phoneState.view='menu';phoneState.replyKey='greeting';$('close-panel').hidden=false;document.body.classList.remove('clinical-panel-open');state.keys.clear();canvas.focus({preventScroll:true});syncDeskView();contextHUD();}});
panel.addEventListener('click',e=>{if(e.target===panel){const b=panel.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)closePanel();}});

function historyBody(){return clinicalUI.historyBody();}
function examAtBed(justCheckedIdx=null){
  const p=activeCase.patient;
  const c=state.clinical;
  const totalExam=Array.isArray(activeCase.exam)?activeCase.exam.length:0;
  if(!Array.isArray(c.examChecks)){
    c.examChecks=c.exam?Array.from({length:totalExam},(_,i)=>i):[];
  }
  const checkedSet=new Set(c.examChecks);
  const checkedCount=checkedSet.size;
  const allChecked=checkedCount>=totalExam;
  const maneuverMeta=[
    {icon:'🩺',verb:'Tomar signos vitales y antropometría',hint:'Controlar presión arterial, estado general, hidratación e IMC.'},
    {icon:'👁️',verb:'Inspeccionar escleras, piel y mucosas',hint:'Buscar ictericia escleral, palidez, edemas o estigmas hepáticos crónicos.'},
    {icon:'✋',verb:'Palpar y percutir abdomen por cuadrantes',hint:'Explorar hipocondrio derecho, borde hepático, bazo y descartar ascitis.'}
  ];
  const residentSvg=portraitMarkup({resident:true},'noting');
  const spiralRings=Array.from({length:12},()=>'<span class="hp-exam-spiral-ring"><i></i></span>').join('');
  const hallazgos=activeCase.exam.map((h,i)=>{
    const meta=maneuverMeta[i]||{icon:'🩺',verb:`Realizar maniobra · ${h.title}`,hint:'Explorar esta región clínica.'};
    const isChecked=checkedSet.has(i);
    if(!isChecked){
      return `
        <article class="hp-exam-note-item is-unexplored" data-exam-card="${i}">
          <div class="hp-exam-note-margin" aria-hidden="true">
            <span class="hp-exam-note-num">${String(i+1).padStart(2,'0')}</span>
            <span class="hp-exam-note-tick is-pending">${meta.icon}</span>
          </div>
          <div class="hp-exam-note-content hp-exam-maneuver-box">
            <div class="hp-exam-maneuver-copy">
              <h3>${String(i+1).padStart(2,'0')} · ${escapeClinical(meta.verb)}</h3>
              <p>${escapeClinical(meta.hint)}</p>
            </div>
            <button type="button" class="primary-button hp-exam-maneuver-btn" data-exam-check="${i}">
              ${meta.icon} ${i===0?'Medir signos vitales →':i===1?'Inspeccionar con linterna →':i===2?'Iniciar palpación →':'Examinar ahora →'}
            </button>
          </div>
        </article>
      `;
    }
    return `
      <article class="hp-exam-note-item history-entry is-revealed" data-exam-card="${i}">
        <div class="hp-exam-note-margin" aria-hidden="true">
          <span class="hp-exam-note-num">${String(i+1).padStart(2,'0')}</span>
          <span class="hp-exam-note-tick">✓</span>
        </div>
        <div class="hp-exam-note-content">
          <div class="hp-exam-revealed-head">
            <h3>${String(i+1).padStart(2,'0')} · ${escapeClinical(h.title)}</h3>
            <div class="hp-exam-revealed-actions">
              ${i>=0&&i<=2?`<button type="button" class="text-button hp-exam-replay-btn" data-replay-exam="${i}">Repetir maniobra</button>`:''}
              <span class="hp-exam-revealed-badge">✓ Hallazgo registrado</span>
            </div>
          </div>
          <p>${escapeClinical(h.text)}</p>
        </div>
      </article>
    `;
  }).join('');
  setPanel(
    `Exploración en camilla · ${p.name}`,
    'EXPLORACIÓN EN CAMILLA · SEMIOLOGÍA CLÍNICA INTERACTIVA',
    `<section class="hp-exam-notebook is-bedside" aria-label="Libreta de apuntes del examen físico">
      <div class="hp-exam-spiral" aria-hidden="true">${spiralRings}</div>
      <header class="hp-exam-notebook-head">
        <svg class="hp-exam-notebook-avatar" viewBox="0 0 32 32" shape-rendering="crispEdges" aria-hidden="true">${residentSvg}</svg>
        <div class="hp-exam-notebook-meta">
          <span class="hp-exam-notebook-kicker">✎ SEMIOLOGÍA EN CAMILLA · CONSULTORIO 01</span>
          <h3>Examen físico de ${escapeClinical(p.name)}</h3>
          <small>${escapeClinical(p.age)} años · ${escapeClinical(p.sex)} · ${escapeClinical(p.occupation||'Paciente ambulatorio')}</small>
        </div>
        <span class="hp-exam-notebook-stamp ${allChecked?'is-complete':''}">${allChecked?'✓ COMPLETO':`${checkedCount}/${totalExam} EXPLORADOS`}</span>
      </header>
      <div class="hp-exam-notebook-page">
        <p class="hp-exam-notebook-lead">${escapeClinical(p.name)} se recostó en la camilla. Selecciona cada maniobra semiológica para examinar al paciente y registrar los hallazgos en tu libreta:</p>
        <div class="hp-exam-notes-list">
          ${hallazgos}
        </div>
        <footer class="hp-exam-notebook-foot">
          <span>✎ Dra. Residente · Servicio de Hepatología</span>
          <span>${checkedCount} de ${totalExam} regiones exploradas</span>
        </footer>
      </div>
    </section>
    <div class="panel-actions panel-footer">
      ${!allChecked?`<button type="button" class="secondary-button" data-action="exam-check-all">🩺 Realizar las ${totalExam-checkedCount} maniobras restantes</button>`:''}
      <button class="primary-button" data-action="finish-exam">${allChecked?'Guardar en la libreta y volver al escritorio →':'Completar examen y volver al escritorio →'}</button>
    </div>`,
    'physical-exam'
  );
  if(Number.isInteger(justCheckedIdx)){
    const card=$('panel-body')?.querySelector(`[data-exam-card="${justCheckedIdx}"]`);
    if(card)animatePopElement(card,{fromScale:0.95,fromY:6,duration:240});
  }
}
function openExamMinigame(idx){
  const abdMod=window.HepatoDay1Modules?.['exam-abdomen-minigame.mjs'];
  const clinMod=window.HepatoDay1Modules?.['exam-clinical-minigames.mjs'];
  const p=activeCase.patient;
  const spec=idx===0
    ? {mount:clinMod?.mountVitals,title:`Signos vitales · ${p.name}`,kicker:'EXPLORACIÓN EN CAMILLA · TENSIÓMETRO Y CONTROL BASAL'}
    : idx===1
      ? {mount:clinMod?.mountInspection,title:`Inspección clínica · ${p.name}`,kicker:'EXPLORACIÓN EN CAMILLA · LINTERNA CLÍNICA'}
      : idx===2
        ? {mount:abdMod?.mount,title:`Palpación abdominal · ${p.name}`,kicker:'EXPLORACIÓN EN CAMILLA · PALPACIÓN Y PERCUSIÓN INTERACTIVA'}
        : null;
  if(!spec||typeof spec.mount!=='function')return false;
  setPanel(
    spec.title,
    spec.kicker,
    '<div id="hp-exam-minigame-root"></div>',
    'physical-exam'
  );
  const root=$('panel-body')?.querySelector('#hp-exam-minigame-root');
  if(!root)return false;
  activeAbdomenMinigame=spec.mount({
    container:root,
    activeCase,
    ambience,
    onCancel:()=>{
      activeAbdomenMinigame=null;
      ambience.play('paper');
      examAtBed();
    },
    onComplete:()=>{
      activeAbdomenMinigame=null;
      const totalExam=Array.isArray(activeCase.exam)?activeCase.exam.length:0;
      if(!Array.isArray(state.clinical.examChecks))state.clinical.examChecks=[];
      if(idx>=0&&idx<totalExam&&!state.clinical.examChecks.includes(idx))state.clinical.examChecks.push(idx);
      if(state.clinical.examChecks.length>=totalExam)state.clinical.exam=true;
      ambience.play(idx===0?'beep':'pen');
      save();
      hud();
      syncDeskViewNotebook(true);
      examAtBed(idx);
    }
  });
  return true;
}
function iniciarEmergenciaElenaAlInteractuar(){
  const c=state.clinical, patient=state.exam.patient;
  if(state.campaign.day!==2||state.campaign.index!==2||!Elena.isElena(activeCase)||
     c.outcome||c.elenaEmergencyPhase||state.elenaWrong||state.elenaRescue||
     !patient.seated||patient.visible===false||state.visits.busy)return false;
  c.elenaEmergencyPhase='intro';
  state.keys.clear();state.player.path=[];state.player.walking=false;state.pendingAction=null;
  save();hud();mostrarIntroElena();
  return true;
}
function beginExam(){
  if(state.paused||movementBusy()||state.campaign.finished||state.clinical.outcome)return;
  if(iniciarEmergenciaElenaAlInteractuar())return;
  if(Elena.isElena(activeCase)&&state.clinical.elenaEmergencyPhase){
    if(state.clinical.elenaEmergencyPhase!=='playing')consultation('history');
    return;
  }
  if(state.exam.atBed){if(Math.hypot(state.player.x-EXAM_STATIONS.residentExam.x,state.player.y-EXAM_STATIONS.residentExam.y)<15)examAtBed();else goTo('patient');return;}
  if(!state.exam.begin(state.player)){toast('No hay una ruta libre hacia la camilla. Acércate al escritorio e inténtalo de nuevo.');return;}
  tutorialLibretaPendiente=tutorialExamenPendiente;
  tutorialExamenPendiente=false;
  state.seatTween=null;state.pendingAction=null;state.keys.clear();if(panel.open)closePanel();hud();toast(`${activeCase.patient.name} se levanta y camina a la camilla. Acompañas el recorrido.`);
}
function finishExam(){
  if(!state.exam.finish(state.player)){toast('El camino de vuelta está ocupado. Libera el paso para continuar.');return;}
  const totalExam=Array.isArray(activeCase.exam)?activeCase.exam.length:3;
  state.clinical.examChecks=Array.from({length:totalExam},(_,i)=>i);
  state.clinical.exam=true;syncDeskViewNotebook(true);state.keys.clear();closePanel();hud();toast(`Examen terminado. 📋 Hallazgos anotados en la libreta.`);
}

/* MELD-Na clásico OPTN/UNOS 2016 */
function calculateMeldNa(values){
  const cr=values.dialysis==='yes'
    ?4
    :Math.min(4,Math.max(1,values.creatinine));

  const bili=Math.max(1,values.bilirubin);
  const inr=Math.max(1,values.inr);
  const na=Math.min(137,Math.max(125,values.sodium));

  const meld=Math.max(6,Math.min(40,
    Math.round(10*(
      0.957*Math.log(cr)
      +0.378*Math.log(bili)
      +1.120*Math.log(inr)
      +0.643
    ))
  ));

  const adjusted=meld>11
    ?meld+1.32*(137-na)-0.033*meld*(137-na)
    :meld;

  return Math.max(6,Math.min(40,Math.round(adjusted)));
}


function calculateChildPugh(v){
  const bilirubin=v.bilirubin<2?1:v.bilirubin<=3?2:3;
  const albumin=v.albumin>3.5?1:v.albumin>=2.8?2:3;
  const inr=v.inr<1.7?1:v.inr<=2.3?2:3;

  const ascites={
    none:1,
    mild:2,
    severe:3
  }[v.ascites];

  const encephalopathy={
    none:1,
    mild:2,
    severe:3
  }[v.encephalopathy];

  return bilirubin+albumin+inr+ascites+encephalopathy;
}

function calculateMeld3(v){
  const bili=Math.max(1,v.bilirubin);
  const inr=Math.max(1,v.inr);
  const cr=v.dialysis==='yes'
    ?3
    :Math.min(3,Math.max(1,v.creatinine));

  const sodium=Math.min(137,Math.max(125,v.sodium));
  const albumin=Math.min(3.5,Math.max(1.5,v.albumin));
  const naGap=137-sodium;
  const albGap=3.5-albumin;

  const score=(v.female?1.33:0)
    +4.56*Math.log(bili)
    +0.82*naGap
    -0.24*naGap*Math.log(bili)
    +9.09*Math.log(inr)
    +11.14*Math.log(cr)
    +1.85*albGap
    -1.83*albGap*Math.log(cr)
    +6;

  return Math.max(6,Math.min(40,Math.round(score)));
}

function prepareCalculator(){
  const tool=clinicalUI.tool;
  const c=state.clinical;
  const values=clinicalUI.toolInputs[tool]||{};

  const fill=(key,value)=>{
    if(values[key]===undefined)values[key]=value;
  };

  // Conservamos FIB-4 y cociente R.
  if(tool==='fib4')fill('age',activeCase.patient.age);

  const profile=c.reviewed.includes('profile')
    ?activeCase.results.profile?.rows
    :null;

  const fromRow=(name)=>{
    const value=parseClinicalValue(
      profile?.find(r=>r[0]===name)?.[1]
    );
    return Number.isFinite(value)?value:'';
  };

  if(profile&&(tool==='fib4'||tool==='r')){
    fill('alt',fromRow('ALT'));

    if(tool==='fib4'){
      fill('ast',fromRow('AST'));
    }else{
      fill('altLimit',40);
      fill('alp',fromRow('Fosfatasa alcalina'));
      fill('alpLimit',130);
    }
  }

  if(tool==='fib4'&&c.reviewed.includes('cbc')){
    fill('platelets',activeCase.patient.platelets);
  }

  // MELD-Na: utilizar exclusivamente informes revisados.
  if(tool==='meldNa'||tool==='meld3'){
    const reviewedValue=(studyId,analyte)=>{
      if(!c.reviewed.includes(studyId))return NaN;

      const rows=activeCase.results[studyId]?.rows||[];
      const row=rows.find(r=>r[0]===analyte);

      return parseClinicalValue(row?.[1]);
    };

    const required={
      bilirubin:reviewedValue(
        'profile','Bilirrubina total'
      ),
      inr:reviewedValue(
        'inr','INR'
      ),
      creatinine:reviewedValue(
        'renal','Creatinina'
      ),
      sodium:reviewedValue(
        'renal','Sodio'
      )
    };
if(tool==='meld3'){
  required.albumin=reviewedValue('profile','Albúmina');
}
    for(const [key,value] of Object.entries(required)){
      if(
        Number.isFinite(value)&&
        (values[key]===undefined||values[key]==='')
      ){
        values[key]=value;
      }
    }
  }

  if(tool==='childPugh'){
    const reviewedValue=(studyId,analyte)=>{
      if(!c.reviewed.includes(studyId))return NaN;

      const rows=activeCase.results[studyId]?.rows||[];
      const row=rows.find(r=>r[0]===analyte);

      return parseClinicalValue(row?.[1]);
    };

    const labValues={
      bilirubin:reviewedValue('profile','Bilirrubina total'),
      albumin:reviewedValue('profile','Albúmina'),
      inr:reviewedValue('inr','INR')
    };

    for(const [key,value] of Object.entries(labValues)){
      if(Number.isFinite(value)&&
         (values[key]===undefined||values[key]==='')){
        values[key]=value;
      }
    }
  }

  clinicalUI.toolInputs[tool]=values;
}
function openDeskCalculator(){
  if(Elena.isElena(activeCase)&&state.clinical.elenaEmergencyPhase){if(state.clinical.elenaEmergencyPhase==='intro')mostrarIntroElena();return;}
  prepareCalculator();
  const body=clinicalUI.toolsBody().replace(/<button class="secondary-button" data-tab="results">\s*Volver a los resultados\s*<\/button>/,'<button class="secondary-button" data-action="close">Volver al escritorio</button>');
  setPanel('Calculadora clínica','HERRAMIENTA DEL CONSULTORIO',body,'calculator-intro');
}
function refreshCalculator(){if(currentPanel==='calculator-intro')openDeskCalculator();else consultation('tools');}
function calculationSummary(){
  const labels={fib4:'FIB-4',r:'Cociente R',meldNa:'MELD-Na',meld3:'MELD 3.0',childPugh:'Child-Pugh'};
  const entries=Object.entries(labels).filter(([id])=>Number.isFinite(state.clinical.calculations[id]));
  if(!entries.length)return '';
  return `<section class="hp-hc-card hp-calculation-summary" aria-label="Escalas registradas">
    <div class="hp-hc-heading">
      <h3>Escalas y cálculos clínicos</h3>
      <small>Asentados en la ficha del paciente</small>
    </div>
    <div class="hp-calculation-list">
      ${entries.map(([id,label])=>{
        const n=state.clinical.calculations[id];
        const interp=ClinicalUI.getClinicalInterpretation?.(id,n,activeCase?.patient?.age);
        const scoreStr=id==='childPugh'?`${n} puntos · clase ${n<=6?'A':n<=9?'B':'C'}`:Number.isInteger(n)?n:n.toFixed(2).replace('.',',');
        return `
          <div class="hp-summary-entry" data-tool="${id}">
            <div class="hp-summary-main">
              <p><b>${label}:</b> <span class="hp-summary-num">${scoreStr}</span></p>
            </div>
            ${interp?`
              <div class="hp-summary-tag" data-tier="${interp.tag}">
                <span class="hp-tag-title">${escapeClinical(interp.label)}</span>
                <span class="hp-tag-sub">${escapeClinical(interp.detail)}</span>
              </div>
            `:''}
          </div>
        `;
      }).join('')}
    </div>
  </section>`;
}

const phoneState = {
  view: 'menu',
  replyKey: 'greeting'
};

function recordPhoneCallLog(ext, contact, summary) {
  if (!state.campaign) return;
  if (!Array.isArray(state.campaign.phoneLogs)) state.campaign.phoneLogs = [];
  const cleanSummary = String(summary || '').replace(/^[«"]|[»"]$/g, '').trim();
  if (!cleanSummary) return;
  const patient = activeCase?.patient?.name || 'Turno general';
  const day = state.campaign.day || 1;
  const last = state.campaign.phoneLogs[state.campaign.phoneLogs.length - 1];
  if (last && last.ext === ext && last.summary === cleanSummary && last.patient === patient && last.day === day) {
    return;
  }
  state.campaign.phoneLogs.push({
    ext,
    contact,
    summary: cleanSummary,
    patient,
    day
  });
  if (state.campaign.phoneLogs.length > 40) {
    state.campaign.phoneLogs = state.campaign.phoneLogs.slice(-40);
  }
  save();
}

function phoneMenuMarkup() {
  const logsCount = Array.isArray(state.campaign?.phoneLogs) ? state.campaign.phoneLogs.length : 0;
  const isElenaEmerg = Elena.isElena(activeCase) && !!state.clinical.elenaEmergencyPhase && !state.elenaWrong && !state.clinical.emergencyHelpCalled;
  return `
    <div class="hp-phone-device" aria-label="Dispositivo telefónico del consultorio">
      <div class="hp-phone-screen">
        <div class="hp-phone-screen-header">
          <span class="hp-phone-screen-dot">●</span>
          <span>HOSP-TEL · RED HOSPITALARIA</span>
          <span class="hp-phone-screen-int">INT 104</span>
        </div>
        <div class="hp-phone-screen-display">
          <p class="hp-phone-display-title">TELÉFONO DEL CONSULTORIO</p>
          <p class="hp-phone-display-status">${isElenaEmerg ? 'ALERTA CLÍNICA EN CONSULTORIO · GUARDIA DISPONIBLE' : 'LÍNEA OPERATIVA · DISCO DISPONIBLE'}</p>
        </div>
      </div>

      <div class="hp-phone-directory-grid">
        <button type="button" class="hp-phone-btn hp-phone-btn-reception" data-phone-action="call-reception">
          <span class="hp-phone-btn-icon" aria-hidden="true">📞</span>
          <div class="hp-phone-btn-text">
            <strong>Recepción Central</strong>
            <small>Interno 101 · Sala de espera y agenda</small>
          </div>
          <span class="hp-phone-btn-arrow">Llamar ›</span>
        </button>

        <button type="button" class="hp-phone-btn hp-phone-btn-staff" data-phone-action="call-staff">
          <span class="hp-phone-btn-icon" aria-hidden="true">🩺</span>
          <div class="hp-phone-btn-text">
            <strong>Interconsulta de Hepatología</strong>
            <small>Interno 105 · Dr. Vega (Orientación y pistas clínicas)</small>
          </div>
          <span class="hp-phone-btn-arrow">Consultar ›</span>
        </button>

        <button type="button" class="hp-phone-btn hp-phone-btn-disabled" disabled title="Se habilitará al adquirir el Laboratorio Propio con las ganancias del consultorio">
          <span class="hp-phone-btn-icon" aria-hidden="true">🏥</span>
          <div class="hp-phone-btn-text">
            <strong>Laboratorio y Servicios Propios</strong>
            <small>Interno 102 · Procesamiento rápido en el día (Mejora de clínica)</small>
          </div>
          <span class="hp-phone-badge">Ampliación</span>
        </button>

        <button type="button" class="hp-phone-btn hp-phone-btn-emergency ${isElenaEmerg ? 'is-urgent-pulse' : ''}" data-phone-action="call-emergency">
          <span class="hp-phone-btn-icon" aria-hidden="true">🚨</span>
          <div class="hp-phone-btn-text">
            <strong>Guardia y Emergencias</strong>
            <small>Interno 109 · Código Rojo, shock room y camilleros</small>
          </div>
          <span class="hp-phone-btn-arrow">${isElenaEmerg ? '¡URGENTE! ›' : 'Llamar ›'}</span>
        </button>

        <button type="button" class="hp-phone-btn hp-phone-btn-history" data-phone-action="call-history">
          <span class="hp-phone-btn-icon" aria-hidden="true">📜</span>
          <div class="hp-phone-btn-text">
            <strong>Historial de llamadas</strong>
            <small>Interno 100 · Registro de pistas y comunicaciones (${logsCount})</small>
          </div>
          <span class="hp-phone-btn-arrow">Ver (${logsCount}) ›</span>
        </button>
      </div>

      <div class="panel-actions hp-phone-bottom-actions">
        <button type="button" class="secondary-button" data-action="close">
          Colgar y volver al escritorio
        </button>
      </div>
    </div>
  `;
}

function phoneReceptionMarkup(replyKey = 'greeting') {
  const currentPatientName = activeCase?.patient?.name || 'el paciente';
  const nextCase = SIMULATIONS[state.campaign.index + 1];
  const nextPatientName = nextCase?.patient?.name || null;
  const isFinishedDay = state.campaign.finished;
  const consultEmpty = !state.exam.patient.visible || !!window.HP_ARRIVAL?.pendingFirstPatient;

  let speakerLine = '';

  if (replyKey === 'greeting') {
    speakerLine = '«Hola Doctora, consultorio 1. La escucho, ¿en qué puedo ayudarle desde recepción?»';
  } else if (replyKey === 'who-is-waiting') {
    if (consultEmpty) {
      speakerLine = `«En la sala de espera está aguardando ${currentPatientName} para iniciar la primera consulta del día.»`;
    } else if (nextPatientName) {
      const citadaStr = nextCase?.patient?.sex === 'Masculino' ? 'citado' : 'citada';
      speakerLine = `«En este momento en la sala de espera está aguardando ${nextPatientName}, ${citadaStr} a continuación en la agenda.»`;
    } else if (isFinishedDay) {
      speakerLine = '«Por el momento no quedan más pacientes citados para la jornada de hoy, Doctora.»';
    } else {
      speakerLine = '«Por ahora no hay más pacientes en espera en este turno, Doctora.»';
    }
    recordPhoneCallLog('INT 101', 'Sandra · Recepción Central', speakerLine);
  } else if (replyKey === 'waiting-room-news') {
    if (state.campaign.day === 1) {
      speakerLine = '«Por ahora todo marcha con normalidad en los pasillos, Doctora. Los pacientes de hepatología están llegando a horario y la sala de espera está tranquila.»';
    } else {
      speakerLine = '«La sala de espera se mantiene tranquila por ahora. Cualquier novedad le aviso de inmediato por este interno.»';
    }
    recordPhoneCallLog('INT 101', 'Sandra · Recepción Central', speakerLine);
  }

  return `
    <div class="hp-phone-device hp-phone-active-call" aria-label="Comunicación activa con recepción">
      <div class="hp-phone-screen hp-phone-screen-talking">
        <div class="hp-phone-screen-header">
          <span class="hp-phone-screen-dot hp-phone-dot-pulse">●</span>
          <span>EN COMUNICACIÓN</span>
          <span class="hp-phone-screen-int">INT 101</span>
        </div>
        <div class="hp-phone-screen-display">
          <p class="hp-phone-display-title">RECEPCIÓN CENTRAL</p>
          <p class="hp-phone-display-status">SANDRA · MESA DE ENTRADAS AMBULATORIA</p>
        </div>
      </div>

      <article class="hp-phone-dialogue-bubble">
        <div class="hp-phone-avatar-tag">
          <span class="hp-phone-avatar-icon" aria-hidden="true">👩‍💼</span>
          <strong>Sandra · Recepción</strong>
        </div>
        <p class="hp-phone-speech">${escapeClinical(speakerLine)}</p>
      </article>

      <div class="hp-phone-dialogue-options">
        <p class="hp-phone-options-title">Indicar a la recepcionista:</p>
        <button type="button" class="hp-phone-option-btn ${replyKey==='who-is-waiting'?'active':''}" data-phone-ask="who-is-waiting">
          1. «¿Quién está esperando en la sala de espera?»
        </button>
        <button type="button" class="hp-phone-option-btn ${replyKey==='waiting-room-news'?'active':''}" data-phone-ask="waiting-room-news">
          2. «¿Alguna novedad o aviso en recepción?»
        </button>
      </div>

      <div class="panel-actions hp-phone-bottom-actions">
        <button type="button" class="secondary-button" data-phone-action="menu">
          ‹ Menú del teléfono
        </button>
        <button type="button" class="secondary-button hp-phone-hangup-btn" data-action="close">
          🔴 Colgar llamada
        </button>
      </div>
    </div>
  `;
}

function buildStaffNextStepHint() {
  const c = state.clinical;
  const pName = activeCase?.patient?.name || 'el paciente';
  if (Elena.isElena(activeCase)) {
    if (c.elenaEmergencyPhase && !c.emergencyHelpCalled) {
      return '«¡Doctora, si la paciente tiene signos de hemorragia digestiva alta e inestabilidad hemodinámica, no pierda un segundo! Active ya mismo el Código Rojo en el Interno 109 o desde el protocolo de emergencia.»';
    }
    if (!c.history) {
      return `«Con ${pName}, empiece escuchando su motivo de consulta. Preste mucha atención a signos de alarma como mareos, ortostatismo o cambios en las deposiciones.»`;
    }
    return `«Asegure primero la estabilidad hemodinámica y el traslado a unidad crítica; ningún estudio ambulatorio está por encima del ABCDE.»`;
  }
  if (!c.history) {
    return `«Todavía no completó la anamnesis de ${pName}. Converse cara a cara con ${pName} para explorar sus antecedentes, medicación, hábitos y síntomas antes de sacar conclusiones.»`;
  }
  const totalExam = Array.isArray(activeCase?.exam) ? activeCase.exam.length : 3;
  const checkedCount = Array.isArray(c.examChecks) ? c.examChecks.length : (c.exam ? totalExam : 0);
  if (!c.exam || checkedCount < totalExam) {
    return `«Ya tiene el relato clínico, pero le falta completar las maniobras del examen físico en la camilla (${checkedCount}/${totalExam} realizadas). Revise signos vitales, escleras y palpación abdominal.»`;
  }
  if (!c.hypothesis) {
    return `«Con la historia y el examen físico listos, abra el Monitor PC en la pestaña Historia para registrar su sospecha clínica inicial antes de pedir estudios complementarios.»`;
  }
  if (!c.orders.length) {
    return `«Ya formuló su hipótesis inicial. Ahora vaya a la pestaña Pedidos del Monitor PC y solicite solo los estudios de primera línea justificados para confirmar o descartar su sospecha.»`;
  }
  if (typeof estudiosDiferidosDemo === 'function' && estudiosDiferidosDemo()) {
    return `«En el Día 1 los estudios de laboratorio e imágenes se procesan para el día siguiente. Si ya solicitó los estudios pertinentes, cite a ${pName} en la Agenda para el Día 2.»`;
  }
  if (c.received.length > c.reviewed.length) {
    return `«Tiene informes recibidos pendientes de lectura en la pestaña Resultados (${c.reviewed.length}/${c.received.length} revisados). Ábralos todos para desbloquear sus pistas en la libreta.»`;
  }
  if (Martin.isMartin(activeCase) && !Number.isFinite(c.calculations?.fib4)) {
    return `«En un paciente con sospecha de esteatosis metabólica y transaminasas elevadas, no olvide abrir la pestaña Escalas y calcular el puntaje FIB-4 para estratificar el riesgo de fibrosis antes de decidir la conducta.»`;
  }
  if (!c.outcome) {
    return `«Ya cuenta con la anamnesis, el examen físico y los estudios revisados. Puede organizar sus pistas en la Libreta y pasar a la pestaña Conclusión para cerrar el diagnóstico y el plan.»`;
  }
  return `«Ya cerró la devolución clínica de ${pName}. Revise la enseñanza del caso o continúe con el siguiente paciente de la agenda.»`;
}

function buildStaffCluesHint() {
  if (Elena.isElena(activeCase)) {
    return '«En hepatología de guardia, la combinación de dolor epigástrico, mareos al incorporarse y melena obliga a pensar en hemorragia digestiva alta. La prioridad absoluta es pedir ayuda de emergencia y estabilizar (ABCDE), nunca demorar con estudios ambulatorios.»';
  }
  if (Sofia.isSofia(activeCase)) {
    return '«Cuando vea ictericia leve intermitente en una persona joven desencadenada por ayuno o estrés de exámenes, mire el fraccionamiento de la bilirrubina y las transaminasas. Si predomina la fracción indirecta con hepatograma normal y sin anemia ni hemólisis, piense en una condición benigna que requiere tranquilidad y educación, no tratamientos invasivos.»';
  }
  return '«En un paciente con factores cardiometabólicos (sobrepeso, dislipidemia) y elevación leve de transaminasas con alcohol por debajo del umbral hepatotóxico, evalúe esteatosis metabólica (MASLD). Recuerde dos perlas: estratifique fibrosis de forma no invasiva (FIB-4) antes de pensar en biopsia, y no suspenda estatinas por una hipertransaminasemia leve asintomática.»';
}

function phoneStaffMarkup(replyKey = 'greeting') {
  const pName = activeCase?.patient?.name || 'el paciente actual';
  let speakerLine = '«Dr. Vega al habla desde Jefatura de Hepatología. Dígame Doctora, ¿cómo va la consulta en el consultorio 1 y en qué puedo orientarla?»';

  if (replyKey === 'staff-next-step') {
    speakerLine = buildStaffNextStepHint();
    recordPhoneCallLog('INT 105', 'Dr. Vega · Jefe de Hepatología', speakerLine);
  } else if (replyKey === 'staff-clues-review') {
    speakerLine = buildStaffCluesHint();
    recordPhoneCallLog('INT 105', 'Dr. Vega · Jefe de Hepatología', speakerLine);
  }

  return `
    <div class="hp-phone-device hp-phone-active-call" aria-label="Interconsulta con Jefatura de Hepatología">
      <div class="hp-phone-screen hp-phone-screen-talking">
        <div class="hp-phone-screen-header">
          <span class="hp-phone-screen-dot hp-phone-dot-pulse">●</span>
          <span>EN COMUNICACIÓN</span>
          <span class="hp-phone-screen-int">INT 105</span>
        </div>
        <div class="hp-phone-screen-display">
          <p class="hp-phone-display-title">JEFATURA DE HEPATOLOGÍA</p>
          <p class="hp-phone-display-status">DR. VEGA · SUPERVISIÓN DOCENTE</p>
        </div>
      </div>

      <article class="hp-phone-dialogue-bubble">
        <div class="hp-phone-avatar-tag">
          <span class="hp-phone-avatar-icon" aria-hidden="true">👨‍⚕️</span>
          <strong>Dr. Vega · Jefe de Servicio</strong>
        </div>
        <p class="hp-phone-speech">${escapeClinical(speakerLine)}</p>
      </article>

      <div class="hp-phone-dialogue-options">
        <p class="hp-phone-options-title">Consultar al supervisor sobre ${escapeClinical(pName)}:</p>
        <button type="button" class="hp-phone-option-btn ${replyKey==='staff-next-step'?'active':''}" data-phone-ask="staff-next-step">
          1. «¿Cuál debería ser mi siguiente paso en la consulta ahora mismo?»
        </button>
        <button type="button" class="hp-phone-option-btn ${replyKey==='staff-clues-review'?'active':''}" data-phone-ask="staff-clues-review">
          2. «¿Qué claves clínicas del cuadro no debo pasar por alto?»
        </button>
      </div>

      <div class="panel-actions hp-phone-bottom-actions">
        <button type="button" class="secondary-button" data-phone-action="menu">
          ‹ Menú del teléfono
        </button>
        <button type="button" class="secondary-button hp-phone-hangup-btn" data-action="close">
          🔴 Colgar llamada
        </button>
      </div>
    </div>
  `;
}

function phoneEmergencyMarkup(replyKey = 'greeting') {
  const isElenaEmerg = Elena.isElena(activeCase) && !!state.clinical.elenaEmergencyPhase && !state.elenaWrong;
  const alreadyCalled = !!state.clinical.emergencyHelpCalled;
  let speakerLine = '«Central de Guardia y Shock Room, Interno 109. Equipo de respuesta rápida y camilleros operativos. ¿Cuál es su situación, Doctora?»';

  if (isElenaEmerg && !alreadyCalled) {
    speakerLine = '«¡Guardia de Emergencias al habla! Escuchamos alerta en el Consultorio 1. ¿Confirma activación de Código Rojo por descompensación hemodinámica?»';
  } else if (isElenaEmerg && alreadyCalled) {
    speakerLine = '«El equipo de Código Rojo y los camilleros ya fueron despachados al Consultorio 1 para asistir a Elena.»';
  } else if (replyKey === 'er-status') {
    speakerLine = '«El Shock Room tiene camas disponibles y el equipo de guardia está en alerta verde. Si ingresa un paciente con hemorragia digestiva o síncope en consultorio, comuníquese de inmediato para activar Código Rojo.»';
    recordPhoneCallLog('INT 109', 'Guardia y Emergencias', speakerLine);
  } else if (replyKey === 'er-protocol') {
    speakerLine = '«Recuerde el protocolo hospitalario de Código Rojo: ante sospecha de hemorragia digestiva alta con mareos o hipotensión, la prioridad es activar ayuda inmediata y estabilización ABCDE (vía aérea, oxígeno y dos vías periféricas gruesas) antes de cualquier endoscopía.»';
    recordPhoneCallLog('INT 109', 'Guardia y Emergencias', speakerLine);
  }

  return `
    <div class="hp-phone-device hp-phone-active-call" aria-label="Comunicación con Guardia y Emergencias">
      <div class="hp-phone-screen hp-phone-screen-talking">
        <div class="hp-phone-screen-header">
          <span class="hp-phone-screen-dot hp-phone-dot-pulse">●</span>
          <span>${isElenaEmerg ? 'LÍNEA PRIORITARIA · CÓDIGO ROJO' : 'EN COMUNICACIÓN'}</span>
          <span class="hp-phone-screen-int">INT 109</span>
        </div>
        <div class="hp-phone-screen-display">
          <p class="hp-phone-display-title">GUARDIA Y EMERGENCIAS</p>
          <p class="hp-phone-display-status">SHOCK ROOM · RESPUESTA RÁPIDA Y CAMILLEROS</p>
        </div>
      </div>

      <article class="hp-phone-dialogue-bubble">
        <div class="hp-phone-avatar-tag">
          <span class="hp-phone-avatar-icon" aria-hidden="true">🚨</span>
          <strong>Coordinación de Guardia · Int 109</strong>
        </div>
        <p class="hp-phone-speech">${escapeClinical(speakerLine)}</p>
      </article>

      ${isElenaEmerg && !alreadyCalled ? `
        <div class="hp-phone-action-callout hp-phone-emergency-callout">
          <p>🚨 Elena presenta descompensación aguda en el consultorio</p>
          <button type="button" class="primary-button hp-phone-trigger-btn" data-phone-action="trigger-elena-code-red">
            🚨 Activar Código Rojo ahora →
          </button>
        </div>
      ` : `
      <div class="hp-phone-dialogue-options">
        <p class="hp-phone-options-title">Consultas a Guardia:</p>
        <button type="button" class="hp-phone-option-btn ${replyKey==='er-status'?'active':''}" data-phone-ask="er-status">
          1. «¿Cuál es la disponibilidad actual de Shock Room y camilleros?»
        </button>
        <button type="button" class="hp-phone-option-btn ${replyKey==='er-protocol'?'active':''}" data-phone-ask="er-protocol">
          2. «Recordar protocolo de Código Rojo ante descompensación en consultorio»
        </button>
      </div>
      `}

      <div class="panel-actions hp-phone-bottom-actions">
        ${isElenaEmerg && !alreadyCalled ? `<button type="button" class="secondary-button" data-phone-action="back-to-emergency">
          ‹ Volver junto a Elena
        </button>` : `<button type="button" class="secondary-button" data-phone-action="menu">
          ‹ Menú del teléfono
        </button>`}
        <button type="button" class="secondary-button hp-phone-hangup-btn" data-action="close">
          🔴 Colgar llamada
        </button>
      </div>
    </div>
  `;
}

function phoneHistoryMarkup() {
  const logs = Array.isArray(state.campaign?.phoneLogs) ? [...state.campaign.phoneLogs].reverse() : [];
  const itemsMarkup = logs.length
    ? logs.map((item, idx) => `
        <article class="hp-phone-log-item" data-phone-log-idx="${idx}">
          <div class="hp-phone-log-head">
            <span class="hp-phone-log-ext">${escapeClinical(item.ext)}</span>
            <strong>${escapeClinical(item.contact)}</strong>
            <span class="hp-phone-log-meta">Día ${escapeClinical(item.day)} · ${escapeClinical(item.patient)}</span>
          </div>
          <p class="hp-phone-log-summary">«${escapeClinical(item.summary)}»</p>
        </article>
      `).join('')
    : `<p class="hp-phone-log-empty">Aún no se registran comunicaciones salientes en este turno. Tus consultas a Recepción (Int 101), Jefatura de Hepatología (Int 105) y Guardia (Int 109) quedarán anotadas aquí para que puedas repasarlas.</p>`;

  return `
    <div class="hp-phone-device hp-phone-active-call" aria-label="Historial de llamadas del turno">
      <div class="hp-phone-screen">
        <div class="hp-phone-screen-header">
          <span class="hp-phone-screen-dot">●</span>
          <span>REGISTRO DE COMUNICACIONES</span>
          <span class="hp-phone-screen-int">INT 100</span>
        </div>
        <div class="hp-phone-screen-display">
          <p class="hp-phone-display-title">HISTORIAL DE LLAMADAS</p>
          <p class="hp-phone-display-status">${logs.length} ${logs.length === 1 ? 'COMUNICACIÓN REGISTRADA' : 'COMUNICACIONES REGISTRADAS'}</p>
        </div>
      </div>

      <div class="hp-phone-log-list" role="region" aria-label="Lista de llamadas registradas">
        ${itemsMarkup}
      </div>

      <div class="panel-actions hp-phone-bottom-actions">
        <button type="button" class="secondary-button" data-phone-action="menu">
          ‹ Menú del teléfono
        </button>
        <button type="button" class="secondary-button hp-phone-hangup-btn" data-action="close">
          Cerrar registro
        </button>
      </div>
    </div>
  `;
}

function openDeskPhone() {
  if (state.clinical.elenaPhone === 'ringing' && state.elenaWrong?.phase === 'done') {
    answerElenaPhone();
    return;
  }
  if (Elena.isElena(activeCase) && state.clinical.elenaEmergencyPhase === 'intro') {
    mostrarIntroElena();
    return;
  }
  if (Elena.isElena(activeCase) && state.clinical.elenaEmergencyPhase && !state.elenaWrong && !state.clinical.emergencyHelpCalled && phoneState.view === 'menu') {
    phoneState.view = 'emergency';
    phoneState.replyKey = 'greeting';
  }
  ambience.play('beep');
  let body = '';
  if (phoneState.view === 'reception') {
    body = phoneReceptionMarkup(phoneState.replyKey);
  } else if (phoneState.view === 'staff') {
    body = phoneStaffMarkup(phoneState.replyKey);
  } else if (phoneState.view === 'emergency') {
    body = phoneEmergencyMarkup(phoneState.replyKey);
  } else if (phoneState.view === 'history') {
    body = phoneHistoryMarkup();
  } else {
    body = phoneMenuMarkup();
  }
  setPanel('Teléfono del consultorio', 'COMUNICACIONES INTERNAS · INT 104', body, 'phone-panel');
}

let notebookState = {
  tab: 'clues',
  filter: 'all',
  selectedPair: [],
  selectedSuspicion: 'masld'
};

const uiTweenGroup = (typeof TWEEN !== 'undefined' && TWEEN.Group) ? new TWEEN.Group() : null;
const activeElTweens = new WeakMap();
let lastNotebookAnimatedTarget = null;
let activeNotebookSortables = [];

function isReducedMotion() {
  return !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

function animatePopElement(el, options = {}) {
  if (!el || !uiTweenGroup || typeof TWEEN === 'undefined' || isReducedMotion()) return;
  const prev = activeElTweens.get(el);
  if (prev) {
    prev.stop();
    uiTweenGroup.remove(prev);
    activeElTweens.delete(el);
  }
  const obj = { s: options.fromScale ?? 0.92, y: options.fromY ?? 6 };
  el.style.transform = `translateY(${obj.y}px) scale(${obj.s})`;
  const tw = new TWEEN.Tween(obj, uiTweenGroup)
    .to({ s: 1, y: 0 }, options.duration ?? 260)
    .easing(TWEEN.Easing.Back.Out)
    .onUpdate(() => {
      if (!el.isConnected) {
        tw.stop();
        uiTweenGroup.remove(tw);
        activeElTweens.delete(el);
        return;
      }
      el.style.transform = `translateY(${obj.y.toFixed(2)}px) scale(${obj.s.toFixed(4)})`;
    })
    .onComplete(() => {
      uiTweenGroup.remove(tw);
      if (activeElTweens.get(el) === tw) activeElTweens.delete(el);
      el.style.transform = '';
    });
  activeElTweens.set(el, tw);
  tw.start();
}

function animateCalculatorOutput(tool, finalValue) {
  if (!Number.isFinite(finalValue) || !uiTweenGroup || typeof TWEEN === 'undefined' || isReducedMotion()) return;
  const output = $('panel-body')?.querySelector('.calculation-output.hp-calculator-lcd');
  if (!output) return;
  const screen = output.querySelector('.hp-lcd-screen') || output;
  animatePopElement(screen, { fromScale: 0.94, fromY: 5, duration: 240 });
  const valEl = output.querySelector('.hp-lcd-val strong');
  if (!valEl) return;
  const prev = activeElTweens.get(valEl);
  if (prev) {
    prev.stop();
    uiTweenGroup.remove(prev);
    activeElTweens.delete(valEl);
  }
  const isInt = tool === 'meldNa' || tool === 'meld3' || tool === 'childPugh';
  const formatVal = (v) => isInt ? String(Math.round(v)) : v.toFixed(2).replace('.', ',');
  const finalFormatted = formatVal(finalValue);
  const obj = { val: 0 };
  valEl.textContent = formatVal(0);
  const tw = new TWEEN.Tween(obj, uiTweenGroup)
    .to({ val: finalValue }, 380)
    .easing(TWEEN.Easing.Cubic.Out)
    .onUpdate(() => {
      if (!valEl.isConnected) {
        tw.stop();
        uiTweenGroup.remove(tw);
        activeElTweens.delete(valEl);
        return;
      }
      valEl.textContent = formatVal(obj.val);
    })
    .onComplete(() => {
      uiTweenGroup.remove(tw);
      if (activeElTweens.get(valEl) === tw) activeElTweens.delete(valEl);
      valEl.textContent = finalFormatted;
    });
  activeElTweens.set(valEl, tw);
  tw.start();
}

function animateDeskViewEntrance() {
  if (!uiTweenGroup || typeof TWEEN === 'undefined' || isReducedMotion()) return;
  const selectors = ['.hp-desk-computer', '.hp-desk-notebook', '.hp-desk-tray', '.hp-desk-calculator', '.hp-desk-phone', '.hp-desk-keyboard'];
  selectors.forEach((sel, idx) => {
    const el = deskView.querySelector(sel);
    if (!el) return;
    const prev = activeElTweens.get(el);
    if (prev) {
      prev.stop();
      uiTweenGroup.remove(prev);
      activeElTweens.delete(el);
    }
    const obj = { y: 10, o: 0.72 };
    el.style.opacity = String(obj.o);
    el.style.transform = `translateY(${obj.y}px)`;
    const tw = new TWEEN.Tween(obj, uiTweenGroup)
      .to({ y: 0, o: 1 }, 240)
      .delay(idx * 24)
      .easing(TWEEN.Easing.Cubic.Out)
      .onUpdate(() => {
        if (deskView.hidden) {
          tw.stop();
          uiTweenGroup.remove(tw);
          activeElTweens.delete(el);
          el.style.transform = '';
          el.style.opacity = '';
          return;
        }
        el.style.transform = `translateY(${obj.y.toFixed(2)}px)`;
        el.style.opacity = obj.o.toFixed(3);
      })
      .onComplete(() => {
        uiTweenGroup.remove(tw);
        if (activeElTweens.get(el) === tw) activeElTweens.delete(el);
        el.style.transform = '';
        el.style.opacity = '';
      });
    activeElTweens.set(el, tw);
    tw.start();
  });
}

function destroyNotebookSortables() {
  while (activeNotebookSortables.length) {
    const inst = activeNotebookSortables.pop();
    try { inst?.destroy?.(); } catch {}
  }
}

function initNotebookSortable(activeTab) {
  destroyNotebookSortables();
  if (typeof Sortable === 'undefined') return;
  const body = $('panel-body');
  if (!body) return;
  const sharedOpts = {
    animation: 150,
    delay: 180,
    delayOnTouchOnly: true,
    touchStartThreshold: 6,
    ghostClass: 'hp-sortable-ghost',
    chosenClass: 'hp-sortable-chosen',
    dragClass: 'hp-sortable-drag'
  };

  if (activeTab === 'relations') {
    const chipsGrid = body.querySelector('.hp-nb-chips-scroll');
    if (chipsGrid) {
      activeNotebookSortables.push(Sortable.create(chipsGrid, {
        ...sharedOpts,
        group: { name: 'hp-nb-rel', pull: 'clone', put: false },
        sort: false,
        draggable: '.hp-nb-clue-chip'
      }));
    }
    for (const slotEl of body.querySelectorAll('.hp-nb-slot[data-nb-drop-slot]')) {
      const slotIdx = Number(slotEl.dataset.nbDropSlot);
      activeNotebookSortables.push(Sortable.create(slotEl, {
        ...sharedOpts,
        group: { name: 'hp-nb-rel', pull: false, put: true },
        sort: false,
        onAdd(evt) {
          const clueId = evt.item?.dataset?.clueId || evt.item?.dataset?.nbSlotPick;
          evt.item?.remove?.();
          if (!clueId) return;
          const pair = Array.isArray(notebookState.selectedPair) ? [...notebookState.selectedPair] : [];
          const otherIdx = slotIdx === 0 ? 1 : 0;
          if (pair[otherIdx] === clueId) {
            pair[otherIdx] = pair[slotIdx];
          }
          pair[slotIdx] = clueId;
          notebookState.selectedPair = pair.slice(0, 2);
          const renderedSlot = notebookState.selectedPair.indexOf(clueId);
          ambience.play('paper');
          lastNotebookAnimatedTarget = `.hp-nb-slot[data-nb-drop-slot="${renderedSlot >= 0 ? renderedSlot : slotIdx}"]`;
          openDeskNotebook('relations');
        }
      }));
    }
  } else if (activeTab === 'suspicions') {
    const assignGrid = body.querySelector('.hp-nb-assignment-grid');
    if (assignGrid) {
      activeNotebookSortables.push(Sortable.create(assignGrid, {
        ...sharedOpts,
        group: { name: 'hp-nb-susp', pull: 'clone', put: false },
        sort: false,
        draggable: '.hp-nb-assign-row',
        filter: 'button',
        preventOnFilter: false
      }));
    }
    for (const zoneEl of body.querySelectorAll('.hp-nb-assigned-items[data-nb-drop-zone]')) {
      const zone = zoneEl.dataset.nbDropZone;
      activeNotebookSortables.push(Sortable.create(zoneEl, {
        ...sharedOpts,
        group: { name: 'hp-nb-susp', pull: true, put: true },
        draggable: '.hp-nb-assigned-card',
        filter: 'button',
        preventOnFilter: false,
        onAdd(evt) {
          const clueId = evt.item?.dataset?.clueId;
          evt.item?.remove?.();
          if (!clueId || (zone !== 'pro' && zone !== 'con')) return;
          const suspKey = notebookState.selectedSuspicion || 'masld';
          const nb = getActiveNotebook();
          const susp = nb.suspicions[suspKey];
          if (!susp) return;
          susp.pros = susp.pros.filter(id => id !== clueId);
          susp.cons = susp.cons.filter(id => id !== clueId);
          const targetArr = zone === 'pro' ? susp.pros : susp.cons;
          const insertIdx = Number.isInteger(evt.newIndex)
            ? Math.max(0, Math.min(evt.newIndex, targetArr.length))
            : targetArr.length;
          targetArr.splice(insertIdx, 0, clueId);
          save();
          ambience.play('pen');
          lastNotebookAnimatedTarget = `.hp-nb-evidence-col.is-${zone}`;
          openDeskNotebook('suspicions');
        },
        onUpdate() {
          if (zone !== 'pro' && zone !== 'con') return;
          const suspKey = notebookState.selectedSuspicion || 'masld';
          const nb = getActiveNotebook();
          const susp = nb.suspicions[suspKey];
          if (!susp) return;
          const ordered = [...zoneEl.querySelectorAll('.hp-nb-assigned-card[data-clue-id]')]
            .map(el => el.dataset.clueId)
            .filter((id, idx, arr) => id && arr.indexOf(id) === idx);
          if (zone === 'pro') susp.pros = ordered;
          else susp.cons = ordered;
          save();
          ambience.play('paper');
        }
      }));
    }
  } else if (activeTab === 'clues') {
    const cluesGrid = body.querySelector('.hp-clues-grid');
    if (cluesGrid) {
      activeNotebookSortables.push(Sortable.create(cluesGrid, {
        ...sharedOpts,
        draggable: '.hp-clue-card.is-discovered',
        filter: 'button',
        preventOnFilter: false,
        onUpdate() {
          const nb = getActiveNotebook();
          const visibleIds = [...cluesGrid.querySelectorAll('.hp-clue-card.is-discovered[data-clue-id]')]
            .map(el => el.dataset.clueId)
            .filter((id, idx, arr) => id && arr.indexOf(id) === idx);
          const rest = (nb.customClueOrder || []).filter(id => !visibleIds.includes(id));
          nb.customClueOrder = [...visibleIds, ...rest];
          save();
          ambience.play('paper');
        }
      }));
    }
  }
}

function getActiveNotebook() {
  const id = activeCase?.id;
  if (!id) return { findings: [], hypotheses: [], pending: [], notes: '', pinnedClues: [], customClueOrder: [], relations: {}, suspicions: {} };
  if (!state.campaign.notebooks || typeof state.campaign.notebooks !== 'object') {
    state.campaign.notebooks = {};
  }
  if (!state.campaign.notebooks[id]) {
    state.campaign.notebooks[id] = {};
  }
  const nb = state.campaign.notebooks[id];
  if (nb.notes && !nb.legacyNotes) nb.legacyNotes = nb.notes;
  if (!Array.isArray(nb.findings)) nb.findings = [];
  if (!Array.isArray(nb.hypotheses)) nb.hypotheses = [];
  if (!Array.isArray(nb.pending)) nb.pending = [];
  if (typeof nb.notes !== 'string') nb.notes = '';

  if (!Array.isArray(nb.pinnedClues)) nb.pinnedClues = [];
  if (!Array.isArray(nb.customClueOrder)) nb.customClueOrder = [];
  if (!nb.relations || typeof nb.relations !== 'object') nb.relations = {};
  if (!nb.suspicions || typeof nb.suspicions !== 'object') {
    nb.suspicions = {};
  }
  const Investigation = window.ClinicalInvestigation || window.HepatoDay1Modules['clinical-investigation.mjs'];
  const suspicionDefs = Investigation ? Investigation.getCaseSuspicions(activeCase) : [];
  for (const s of suspicionDefs) {
    if (!nb.suspicions[s.id]) {
      nb.suspicions[s.id] = { status: 'investigating', pros: [], cons: [] };
    }
  }
  for (const sKey of Object.keys(nb.suspicions)) {
    if (!nb.suspicions[sKey]) nb.suspicions[sKey] = { status: 'investigating', pros: [], cons: [] };
    if (!Array.isArray(nb.suspicions[sKey].pros)) nb.suspicions[sKey].pros = [];
    if (!Array.isArray(nb.suspicions[sKey].cons)) nb.suspicions[sKey].cons = [];
    if (!['investigating', 'main', 'discarded'].includes(nb.suspicions[sKey].status)) nb.suspicions[sKey].status = 'investigating';
  }

  state.clinical.notebook = nb;
  return nb;
}

function notebookMarkup(tab) {
  const nb = getActiveNotebook();
  const p = activeCase.patient;
  const Investigation = window.ClinicalInvestigation || window.HepatoDay1Modules['clinical-investigation.mjs'];
  const isPiloto = Investigation && (Investigation.isMartin(activeCase) || Investigation.isSofia(activeCase) || Investigation.isElena(activeCase));

  const activeTab = ['clues', 'relations', 'suspicions'].includes(tab) ? tab : (notebookState.tab || 'clues');
  notebookState.tab = activeTab;

  const clues = isPiloto ? Investigation.getCaseClues(activeCase, state.clinical) : [];
  const discoveredClues = clues.filter(c => c.discovered);
  const totalClues = clues.length;
  const discoveredCount = discoveredClues.length;

  const relations = isPiloto ? Investigation.getCaseRelations(activeCase) : [];
  const activePair = Array.isArray(notebookState.selectedPair) ? notebookState.selectedPair : [];
  const savedRelationEntries = relations.filter(r => Boolean(nb.relations && nb.relations[r.id]));
  const formulatedRelCount = savedRelationEntries.length;
  const usedClueIds = new Set();
  for (const r of savedRelationEntries) {
    if (Array.isArray(r.clues)) {
      for (const cId of r.clues) usedClueIds.add(cId);
    }
  }

  const suspicionDefs = isPiloto ? Investigation.getCaseSuspicions(activeCase) : [];
  const defaultSuspId = suspicionDefs[0]?.id || 'masld';
  const activeSuspKey = (suspicionDefs.some(s => s.id === notebookState.selectedSuspicion) ? notebookState.selectedSuspicion : null) || defaultSuspId;
  notebookState.selectedSuspicion = activeSuspKey;
  const activeSuspDef = suspicionDefs.find(s => s.id === activeSuspKey) || suspicionDefs[0] || {
    id: defaultSuspId, title: defaultSuspId, shortTitle: defaultSuspId, description: '', clinicalWarning: ''
  };
  const activeSuspData = nb.suspicions[activeSuspKey] || { status: 'investigating', pros: [], cons: [] };

  let leftPageContent = '';
  let rightPageContent = '';

  if (!isPiloto) {
    leftPageContent = `
      <div class="hp-nb-page-header">
        <span class="hp-nb-page-badge is-findings">LIBRETA CLÍNICA</span>
        <h3 class="hp-nb-page-title">Expediente de ${escapeClinical(p.name)}</h3>
      </div>
      <div class="hp-nb-pilot-notice">
        <p>El sistema de deducciones avanzadas e investigación clínica está disponible en los casos activos de la demostración (Martín, Sofía y Elena).</p>
      </div>
    `;
    rightPageContent = `
      <div class="hp-nb-page-header">
        <span class="hp-nb-page-badge is-findings">ANOTACIONES</span>
      </div>
      <div class="hp-nb-pilot-notice">
        <p>No hay evidencias adicionales registradas para este paciente.</p>
      </div>
    `;
  } else if (activeTab === 'clues') {
    const currentFilter = notebookState.filter || 'all';
    const filteredClues = clues.filter(c => {
      if (currentFilter === 'all') return true;
      if (currentFilter === 'anamnesis') return c.category === 'anamnesis';
      if (currentFilter === 'exam') return c.category === 'exam';
      if (currentFilter === 'studies') return c.category === 'studies';
      if (currentFilter === 'calculator') return c.category === 'calculator';
      return true;
    });

    const orderList = Array.isArray(nb.customClueOrder) ? nb.customClueOrder : [];
    filteredClues.sort((a, b) => {
      const pinA = nb.pinnedClues.includes(a.id) ? 1 : 0;
      const pinB = nb.pinnedClues.includes(b.id) ? 1 : 0;
      if (pinA !== pinB) return pinB - pinA;
      const idxA = orderList.indexOf(a.id);
      const idxB = orderList.indexOf(b.id);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return 0;
    });

    const clueCards = filteredClues.map(c => {
      const isPinned = nb.pinnedClues.includes(c.id);
      const isUsedInRel = usedClueIds.has(c.id);
      if (c.discovered) {
        return `
          <article class="hp-clue-card is-discovered ${isPinned ? 'is-pinned' : ''} ${isUsedInRel ? 'is-used-in-relation' : ''}" data-clue-id="${c.id}">
            <header class="hp-clue-head">
              <div class="hp-clue-meta">
                <span class="hp-clue-icon" aria-hidden="true">${c.icon}</span>
                <span class="hp-clue-cat-tag is-${c.category}">${c.categoryLabel}</span>
                ${isUsedInRel ? '<span class="hp-clue-used-tag" title="Esta pista ya forma parte de una relación clínica registrada">🔗 Utilizada en una relación</span>' : ''}
              </div>
              <button type="button" class="hp-clue-pin-btn ${isPinned ? 'pinned' : ''}" data-nb-pin="${c.id}" title="${isPinned ? 'Desfijar pista' : 'Fijar pista arriba'}">
                ${isPinned ? '★' : '☆'}
              </button>
            </header>
            <h4 class="hp-clue-title">${escapeClinical(c.title)}</h4>
            <p class="hp-clue-body">${escapeClinical(c.text)}</p>
            <footer class="hp-clue-foot">
              <span class="hp-clue-status-tag">✓ Descubierta · ${escapeClinical(c.source || c.categoryLabel)}</span>
              <button type="button" class="secondary-button hp-clue-relate-action" data-nb-relate-pick="${c.id}">
                🔗 Relacionar
              </button>
            </footer>
          </article>
        `;
      } else {
        return `
          <article class="hp-clue-card is-undiscovered" data-clue-id="${c.id}">
            <header class="hp-clue-head">
              <div class="hp-clue-meta">
                <span class="hp-clue-icon" aria-hidden="true">?</span>
                <span class="hp-clue-cat-tag is-pending">${c.categoryLabel}</span>
              </div>
              <span class="hp-clue-lock-badge">PENDIENTE</span>
            </header>
            <h4 class="hp-clue-title is-hidden">✦ Pista pendiente de explorar</h4>
            <p class="hp-clue-hint">Información clínica no descubierta aún.</p>
          </article>
        `;
      }
    }).join('');

    leftPageContent = `
      <div class="hp-nb-page-header">
        <span class="hp-nb-page-badge is-findings">🔍 EVIDENCIAS CLÍNICAS</span>
        <h3 class="hp-nb-page-title">Expediente de ${escapeClinical(p.name)}</h3>
        <p class="hp-nb-patient-meta-sub">${escapeClinical(p.age)} años · ${escapeClinical(p.sex)} · ${escapeClinical(p.occupation || 'Consulta externa')}</p>
      </div>

      <div class="hp-nb-clue-summary-card">
        <div class="hp-nb-clue-counter-box">
          <span class="hp-nb-clue-num">${discoveredCount}</span>
          <span class="hp-nb-clue-label">pistas descubiertas</span>
        </div>
        <div class="hp-nb-progress-info">
          <span class="hp-nb-progress-text">${discoveredCount} de ${totalClues} evidencias registradas</span>
          <div class="hp-nb-progress-track">
            <div class="hp-nb-progress-fill" style="width: ${totalClues ? Math.round((discoveredCount / totalClues) * 100) : 0}%"></div>
          </div>
        </div>
      </div>

      <div class="hp-nb-filter-section">
        <span class="hp-nb-section-label">FILTRAR POR ORIGEN:</span>
        <div class="hp-nb-filter-bar" role="toolbar" aria-label="Filtro de pistas por categoría">
          <button type="button" class="hp-nb-filter-btn ${currentFilter === 'all' ? 'active' : ''}" data-nb-filter="all">Todas (${discoveredCount})</button>
          <button type="button" class="hp-nb-filter-btn ${currentFilter === 'anamnesis' ? 'active' : ''}" data-nb-filter="anamnesis">Anamnesis</button>
          <button type="button" class="hp-nb-filter-btn ${currentFilter === 'exam' ? 'active' : ''}" data-nb-filter="exam">Examen Físico</button>
          <button type="button" class="hp-nb-filter-btn ${currentFilter === 'studies' ? 'active' : ''}" data-nb-filter="studies">Estudios</button>
          <button type="button" class="hp-nb-filter-btn ${currentFilter === 'calculator' ? 'active' : ''}" data-nb-filter="calculator">Calculadora</button>
        </div>
      </div>

      <div class="hp-nb-page-guide">
        <h5 class="hp-nb-guide-title">✎ Notas de investigación:</h5>
        <ul class="hp-nb-guide-list">
          <li>Las pistas se descubren al interrogar, examinar, solicitar analíticas o usar la calculadora clínica.</li>
          <li>Usa <strong>★</strong> para fijar los hallazgos principales en la parte superior.</li>
          <li>Pulsa <strong>[ 🔗 Relacionar ]</strong> para enviar un hallazgo a la mesa de deducciones.</li>
        </ul>
        <div class="hp-nb-save-indicator" title="Persistencia sincronizada">
          <span class="hp-nb-dot">●</span> <span>LIBRETA PERSONAL · AUTO-GUARDADO</span>
        </div>
      </div>
    `;

    rightPageContent = `
      <div class="hp-nb-page-header">
        <span class="hp-nb-page-badge is-findings">REGISTRO DE HALLAZGOS</span>
        <h3 class="hp-nb-page-title">Evidencias Descubiertas</h3>
        <p class="hp-nb-page-lead">Lista de observaciones objetivas verificadas en la consulta:</p>
      </div>

      <div class="hp-clues-grid">
        ${clueCards}
      </div>
    `;
  } else if (activeTab === 'relations') {
    const clueA = clues.find(c => c.id === activePair[0]);
    const clueB = clues.find(c => c.id === activePair[1]);

    let matchedRel = null;
    if (clueA && clueB) {
      matchedRel = relations.find(r =>
        (r.clues[0] === clueA.id && r.clues[1] === clueB.id) ||
        (r.clues[0] === clueB.id && r.clues[1] === clueA.id)
      );
    }

    const savedRelChoice = matchedRel ? nb.relations[matchedRel.id] : null;
    const isAlreadyRegistered = Boolean(matchedRel && savedRelChoice);

    let workbenchResultMarkup = '';
    if (clueA && clueB) {
      if (matchedRel) {
        workbenchResultMarkup = `
          <div class="hp-nb-deduction-workbench ${isAlreadyRegistered ? 'is-registered' : ''}" data-relation-id="${matchedRel.id}">
            <header class="hp-nb-deduction-head">
              <div class="hp-nb-deduction-head-top">
                <span class="hp-nb-badge-debate ${isAlreadyRegistered ? 'is-saved' : ''}">
                  ${isAlreadyRegistered ? '✓ RELACIÓN YA REGISTRADA EN LA LIBRETA' : 'RELACIÓN EN INVESTIGACIÓN'}
                </span>
                ${isAlreadyRegistered ? `
                  <button type="button" class="hp-nb-delete-rel-btn" data-nb-delete-relation="${matchedRel.id}" title="Eliminar esta relación registrada">
                    ✕ Quitar registro
                  </button>
                ` : ''}
              </div>
              <h4 class="hp-nb-deduction-title">${escapeClinical(matchedRel.title)}</h4>
              <p class="hp-nb-deduction-desc">${escapeClinical(matchedRel.description)}</p>
              ${isAlreadyRegistered ? `
                <p class="hp-nb-already-registered-note">
                  🔗 Estas dos evidencias ya fueron vinculadas. Se ha recuperado tu deducción registrada; puedes consultarla o cambiar la interpretación seleccionada sin duplicar registros.
                </p>
              ` : ''}
            </header>
            <div class="hp-nb-deduction-options">
              <p class="hp-nb-options-prompt">Selecciona la interpretación clínica de trabajo que consideres más plausible:</p>
              ${matchedRel.options.map(opt => {
                const isSelected = savedRelChoice === opt.id;
                return `
                  <button type="button" class="hp-nb-opt-card ${isSelected ? 'is-selected' : ''}" data-nb-set-relation="${matchedRel.id}" data-nb-option="${opt.id}">
                    <span class="hp-nb-opt-radio" aria-hidden="true">${isSelected ? '●' : '○'}</span>
                    <div class="hp-nb-opt-content">
                      <strong class="hp-nb-opt-title">${escapeClinical(opt.title)}</strong>
                      <p class="hp-nb-opt-detail">${escapeClinical(opt.detail)}</p>
                      ${isSelected ? '<span class="hp-nb-opt-tag">✓ Deducción registrada en la libreta</span>' : ''}
                    </div>
                  </button>
                `;
              }).join('')}
            </div>
          </div>
        `;
      } else {
        workbenchResultMarkup = `
          <div class="hp-nb-deduction-workbench is-neutral">
            <span class="hp-nb-badge-neutral">ℹ️ SIN RELACIÓN CLÍNICA ESPECÍFICA</span>
            <p class="hp-nb-neutral-text">No se ha identificado una relación clínica específica entre estas evidencias.</p>
            <p class="hp-nb-neutral-hint">Ambas observaciones forman parte del caso, pero puedes vincular cada una con otros antecedentes, desencadenantes o resultados complementarios.</p>
          </div>
        `;
      }
    } else {
      workbenchResultMarkup = `
        <div class="hp-nb-workbench-placeholder">
          <div class="hp-nb-placeholder-icon" aria-hidden="true">🔗</div>
          <h4 class="hp-nb-placeholder-title">Mesa de trabajo a la espera</h4>
          <p class="hp-nb-placeholder-text">Selecciona 2 evidencias en la página izquierda para contrastarlas y registrar una deducción médica.</p>
        </div>
      `;
    }

    const savedRelationsListMarkup = savedRelationEntries.length > 0 ? `
      <div class="hp-nb-saved-relations-section">
        <h5 class="hp-nb-saved-relations-title">Relaciones registradas en esta libreta (${savedRelationEntries.length}):</h5>
        <div class="hp-nb-saved-relations-list">
          ${savedRelationEntries.map(r => {
            const chosenOpt = r.options.find(o => o.id === nb.relations[r.id]);
            const isCurrentPair = matchedRel && matchedRel.id === r.id;
            return `
              <div class="hp-nb-saved-rel-item ${isCurrentPair ? 'is-active' : ''}" data-saved-relation-item="${r.id}">
                <button type="button" class="hp-nb-saved-rel-load" data-nb-load-relation="${r.id}" title="Cargar esta relación en la mesa">
                  <span class="hp-nb-saved-rel-head">🔗 ${escapeClinical(r.title)}</span>
                  <span class="hp-nb-saved-rel-choice">✓ ${escapeClinical(chosenOpt ? chosenOpt.title : 'Interpretación registrada')}</span>
                </button>
                <button type="button" class="hp-nb-saved-rel-rm" data-nb-delete-relation="${r.id}" title="Eliminar relación">✕</button>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    ` : '';

    leftPageContent = `
      <div class="hp-nb-page-header">
        <div class="hp-nb-head-row">
          <div>
            <span class="hp-nb-page-badge is-hypotheses">🔗 MESA DE VINCULACIÓN</span>
            <h3 class="hp-nb-page-title">Contraste de Evidencias</h3>
          </div>
          <button type="button" class="secondary-button hp-nb-clear-btn" data-nb-relate-clear="true" ${!activePair.some(Boolean) ? 'disabled' : ''}>
            ↺ Limpiar selección
          </button>
        </div>
        <p class="hp-nb-page-lead">Coloca dos evidencias descubiertas en la mesa para confrontar hipótesis:</p>
      </div>

      <div class="hp-nb-slots-container">
        <div class="hp-nb-slot ${clueA ? 'has-item' : 'is-empty'}" data-nb-drop-slot="0">
          <span class="hp-nb-slot-label">EVIDENCIA A</span>
          ${clueA ? `
            <div class="hp-nb-slot-card">
              <span class="hp-nb-slot-icon">${clueA.icon}</span>
              <span class="hp-nb-slot-text">${escapeClinical(clueA.title)}</span>
              <button type="button" class="hp-nb-slot-rm-btn" data-nb-slot-remove="1" title="Quitar de la mesa">✕</button>
            </div>
          ` : `
            <div class="hp-nb-slot-card is-placeholder">
              <span>[ Selecciona o arrastra una evidencia aquí ]</span>
            </div>
          `}
        </div>

        <div class="hp-nb-slots-link" aria-hidden="true">
          <span class="hp-nb-link-symbol">⟷</span>
        </div>

        <div class="hp-nb-slot ${clueB ? 'has-item' : 'is-empty'}" data-nb-drop-slot="1">
          <span class="hp-nb-slot-label">EVIDENCIA B</span>
          ${clueB ? `
            <div class="hp-nb-slot-card">
              <span class="hp-nb-slot-icon">${clueB.icon}</span>
              <span class="hp-nb-slot-text">${escapeClinical(clueB.title)}</span>
              <button type="button" class="hp-nb-slot-rm-btn" data-nb-slot-remove="2" title="Quitar de la mesa">✕</button>
            </div>
          ` : `
            <div class="hp-nb-slot-card is-placeholder">
              <span>[ Selecciona o arrastra una evidencia aquí ]</span>
            </div>
          `}
        </div>
      </div>

      <div class="hp-nb-palette-section">
        <h5 class="hp-nb-palette-title">Evidencias descubiertas disponibles (${discoveredClues.length}):</h5>
        ${discoveredClues.length === 0 ? `
          <p class="hp-nb-empty-sub">Aún no has descubierto suficientes evidencias. Conversa con el paciente, haz el examen físico o revisa estudios.</p>
        ` : `
          <div class="hp-nb-chips-scroll">
            ${discoveredClues.map(c => {
              const inPair = activePair.includes(c.id);
              const isUsed = usedClueIds.has(c.id);
              return `
                <button type="button" class="hp-nb-clue-chip ${inPair ? 'is-selected' : ''} ${isUsed ? 'is-used-in-relation' : ''}" data-nb-slot-pick="${c.id}" data-clue-id="${c.id}" title="Haz clic o arrastra hacia una ranura de evidencia">
                  <span class="hp-nb-chip-icon">${c.icon}</span>
                  <span class="hp-nb-chip-text">${escapeClinical(c.title)}</span>
                  ${isUsed ? '<span class="hp-nb-chip-used-badge" title="Ya participa en al menos una relación registrada">🔗 Utilizada en una relación</span>' : ''}
                  ${inPair ? '<span class="hp-nb-chip-check">✓</span>' : ''}
                </button>
              `;
            }).join('')}
          </div>
        `}
      </div>
    `;

    rightPageContent = `
      <div class="hp-nb-page-header">
        <span class="hp-nb-page-badge is-hypotheses">DEDUCCIONES REGISTRADAS</span>
        <h3 class="hp-nb-page-title">Interpretación de Relaciones</h3>
        <p class="hp-nb-page-lead">Resultado del análisis de los dos hallazgos vinculados:</p>
      </div>

      ${workbenchResultMarkup}
      ${savedRelationsListMarkup}
    `;
  } else if (activeTab === 'suspicions') {
    const pros = activeSuspData.pros || [];
    const cons = activeSuspData.cons || [];
    const currentStatus = activeSuspData.status || 'investigating';

    const proClueObjects = pros.map(id => clues.find(c => c.id === id)).filter(Boolean);
    const conClueObjects = cons.map(id => clues.find(c => c.id === id)).filter(Boolean);

    leftPageContent = `
      <div class="hp-nb-page-header">
        <span class="hp-nb-page-badge is-pending">⚖️ TABLERO DIFERENCIAL</span>
        <h3 class="hp-nb-page-title">Hipótesis Clínicas</h3>
        <p class="hp-nb-page-lead">Selecciona el diagnóstico para evaluar sus argumentos:</p>
      </div>

      <div class="hp-nb-suspicion-tabs" role="tablist">
        ${suspicionDefs.map(s => {
          const sData = nb.suspicions[s.id] || { pros: [], cons: [], status: 'investigating' };
          const isSelected = s.id === activeSuspKey;
          return `
            <button type="button" class="hp-nb-susp-tab ${isSelected ? 'active' : ''} is-${s.color}" data-nb-select-suspicion="${s.id}">
              <span class="hp-nb-susp-tab-title">${escapeClinical(s.shortTitle)}</span>
              <span class="hp-nb-susp-tab-meta">+${sData.pros.length} / -${sData.cons.length}</span>
            </button>
          `;
        }).join('')}
      </div>

      <div class="hp-nb-status-control-box">
        <span class="hp-nb-status-label">Grado de convicción médica:</span>
        <div class="hp-nb-status-buttons" role="group">
          <button type="button" class="hp-nb-status-btn ${currentStatus === 'investigating' ? 'active is-investigating' : ''}" data-nb-set-status="investigating">
            🔍 En investigación
          </button>
          <button type="button" class="hp-nb-status-btn ${currentStatus === 'main' ? 'active is-main' : ''}" data-nb-set-status="main">
            ★ Sospecha prioritaria
          </button>
          <button type="button" class="hp-nb-status-btn ${currentStatus === 'discarded' ? 'active is-discarded' : ''}" data-nb-set-status="discarded">
            ✕ Descartada por el médico
          </button>
        </div>
      </div>

      <div class="hp-nb-assignment-drawer">
        <h5 class="hp-nb-drawer-title">Asignar evidencias a esta hipótesis:</h5>
        ${discoveredClues.length === 0 ? `
          <p class="hp-nb-empty-sub">Aún no hay evidencias descubiertas para asignar.</p>
        ` : `
          <div class="hp-nb-assignment-grid">
            ${discoveredClues.map(c => {
              const isPro = pros.includes(c.id);
              const isCon = cons.includes(c.id);
              return `
                <div class="hp-nb-assign-row ${isPro ? 'is-assigned-pro' : isCon ? 'is-assigned-con' : ''}" data-clue-id="${c.id}">
                  <div class="hp-nb-assign-info">
                    <span class="hp-nb-assign-icon">${c.icon}</span>
                    <span class="hp-nb-assign-title">${escapeClinical(c.title)}</span>
                  </div>
                  <div class="hp-nb-assign-actions">
                    <button type="button" class="hp-nb-action-tag is-pro ${isPro ? 'active' : ''}" data-nb-assign-pro="${c.id}" title="Marcar como evidencia a favor">
                      ${isPro ? '✓ A favor' : '+ A favor'}
                    </button>
                    <button type="button" class="hp-nb-action-tag is-con ${isCon ? 'active' : ''}" data-nb-assign-con="${c.id}" title="Marcar como evidencia en contra o duda">
                      ${isCon ? '✓ En contra' : '− En contra'}
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    `;

    rightPageContent = `
      <article class="hp-nb-suspicion-board">
        <header class="hp-nb-board-head">
          <div class="hp-nb-head-row">
            <div>
              <span class="hp-nb-page-badge is-pending">BALANCE DE EVIDENCIAS</span>
              <h4 class="hp-nb-board-title">${escapeClinical(activeSuspDef.title)}</h4>
            </div>
            <span class="hp-nb-status-pill is-${escapeClinical(currentStatus)}">
              ${currentStatus === 'main' ? '★ Sospecha prioritaria' : currentStatus === 'discarded' ? '✕ Descartada por el médico' : '🔍 En investigación'}
            </span>
          </div>
          <p class="hp-nb-board-desc">${escapeClinical(activeSuspDef.description)}</p>
        </header>

        <div class="hp-nb-evidence-columns">
          <div class="hp-nb-evidence-col is-pro">
            <header class="hp-nb-col-head">
              <span class="hp-nb-col-tag is-pro">+ EVIDENCIAS A FAVOR (${proClueObjects.length})</span>
            </header>
            <div class="hp-nb-assigned-items" data-nb-drop-zone="pro">
              ${proClueObjects.length === 0 ? `
                <div class="hp-nb-empty-col">
                  <p>No has asignado evidencias a favor aún.</p>
                </div>
              ` : proClueObjects.map(c => `
                <div class="hp-nb-assigned-card is-pro" data-clue-id="${c.id}">
                  <span class="hp-nb-card-icon">${c.icon}</span>
                  <span class="hp-nb-card-title">${escapeClinical(c.title)}</span>
                  <button type="button" class="hp-nb-remove-evidence" data-nb-remove-pro="${c.id}" title="Quitar evidencia">✕</button>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="hp-nb-evidence-col is-con">
            <header class="hp-nb-col-head">
              <span class="hp-nb-col-tag is-con">− EN CONTRA O DUDAS (${conClueObjects.length})</span>
            </header>
            <div class="hp-nb-assigned-items" data-nb-drop-zone="con">
              ${conClueObjects.length === 0 ? `
                <div class="hp-nb-empty-col">
                  <p>No has asignado evidencias en contra o dudas.</p>
                </div>
              ` : conClueObjects.map(c => `
                <div class="hp-nb-assigned-card is-con" data-clue-id="${c.id}">
                  <span class="hp-nb-card-icon">${c.icon}</span>
                  <span class="hp-nb-card-title">${escapeClinical(c.title)}</span>
                  <button type="button" class="hp-nb-remove-evidence" data-nb-remove-con="${c.id}" title="Quitar evidencia">✕</button>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </article>
    `;
  }

  return `
    <div class="hp-notebook-frame hp-nb-spread-frame" aria-label="Libreta clínica interactiva de investigación">
      <!-- Cubierta de cuero del cuaderno -->
      <div class="hp-nb-cover">
        <!-- Botón de cerrar integrado en la esquina superior del cuaderno -->
        <button type="button" class="hp-nb-close-corner-btn" data-action="close" title="Cerrar libreta (Esc)" aria-label="Cerrar libreta">✕</button>

        <!-- Separadores de cuaderno (Bookmark tabs en el borde derecho) -->
        <nav class="hp-nb-bookmark-tabs hp-nb-tabs" role="tablist" aria-label="Separadores de la libreta">
          <button type="button" role="tab" class="hp-nb-tab-btn hp-nb-bookmark-tab hp-nb-tab-teal ${activeTab === 'clues' ? 'active' : ''}" data-nb-tab="clues" aria-selected="${activeTab === 'clues'}" title="Separador: Pistas y Evidencias">
            <span class="hp-nb-tab-ridge" aria-hidden="true"></span>
            <span class="hp-nb-tab-icon" aria-hidden="true">🔍</span>
            <span class="hp-nb-tab-label">Pistas</span>
            <span class="hp-nb-counter ${discoveredCount > 0 ? 'has-items' : ''}">${discoveredCount}</span>
          </button>
          <button type="button" role="tab" class="hp-nb-tab-btn hp-nb-bookmark-tab hp-nb-tab-amber ${activeTab === 'relations' ? 'active' : ''}" data-nb-tab="relations" aria-selected="${activeTab === 'relations'}" title="Separador: Relacionar Evidencias">
            <span class="hp-nb-tab-ridge" aria-hidden="true"></span>
            <span class="hp-nb-tab-icon" aria-hidden="true">💡</span>
            <span class="hp-nb-tab-label">Relacionar</span>
            <span class="hp-nb-counter ${formulatedRelCount > 0 ? 'has-items' : ''}">${formulatedRelCount}</span>
          </button>
          <button type="button" role="tab" class="hp-nb-tab-btn hp-nb-bookmark-tab hp-nb-tab-coral ${activeTab === 'suspicions' ? 'active' : ''}" data-nb-tab="suspicions" aria-selected="${activeTab === 'suspicions'}" title="Separador: Diagnósticos Diferenciales">
            <span class="hp-nb-tab-ridge" aria-hidden="true"></span>
            <span class="hp-nb-tab-icon" aria-hidden="true">⚖️</span>
            <span class="hp-nb-tab-label">Sospechas</span>
            <span class="hp-nb-counter ${suspicionDefs.length > 0 ? 'has-items' : ''}">${suspicionDefs.length}</span>
          </button>
        </nav>

        <!-- Bloque de hojas apiladas -->
        <div class="hp-nb-pages-stack">
          <div class="hp-nb-book-spread hp-nb-body-wrapper">
            <!-- Página Izquierda -->
            <section class="hp-nb-page is-left" aria-label="Página izquierda del cuaderno">
              <div class="hp-nb-page-inner">
                ${activeTab==='clues'&&tutorialLibretaPendiente&&state.clinical.exam?'<div class="clinical-note" role="status"><b>La libreta:</b> en Pistas, toca la estrella de una evidencia que quieras destacar. Puedes elegir cualquiera o continuar sin fijar una. <button type="button" class="text-button" data-action="tutorial-libreta-omitir">Omitir guía</button></div>':''}
                ${tutorialEstudiosPendientes?'<div class="clinical-note" role="status"><b>Estudios:</b> vuelve a la consulta y abre Pedidos para seleccionar los que consideres necesarios. <button type="button" class="text-button" data-action="tutorial-estudios-omitir">Omitir guía</button></div>':''}
                ${leftPageContent}
              </div>
              <footer class="hp-nb-page-foot is-left">
                <span>Expediente clínico · ${escapeClinical(p.name)}</span>
                <span>Pág. 1</span>
              </footer>
            </section>

            <!-- Espiral / Anillas Centrales -->
            <div class="hp-nb-center-spine" aria-hidden="true">
              <div class="hp-nb-spine-holes is-left">
                <span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span>
              </div>
              <div class="hp-nb-rings">
                <span class="hp-nb-ring"><i></i></span>
                <span class="hp-nb-ring"><i></i></span>
                <span class="hp-nb-ring"><i></i></span>
                <span class="hp-nb-ring"><i></i></span>
                <span class="hp-nb-ring"><i></i></span>
                <span class="hp-nb-ring"><i></i></span>
                <span class="hp-nb-ring"><i></i></span>
                <span class="hp-nb-ring"><i></i></span>
                <span class="hp-nb-ring"><i></i></span>
                <span class="hp-nb-ring"><i></i></span>
              </div>
              <div class="hp-nb-spine-holes is-right">
                <span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span>
              </div>
            </div>

            <!-- Página Derecha -->
            <section class="hp-nb-page is-right" aria-label="Página derecha del cuaderno">
              <div class="hp-nb-page-inner">
                ${rightPageContent}
              </div>
              <footer class="hp-nb-page-foot is-right">
                <span>Hospital Portal · Cuaderno de investigación</span>
                <span>Pág. 2</span>
              </footer>
            </section>
          </div>
        </div>
      </div>
    </div>
  `;
}

function openDeskNotebook(tab = notebookState.tab) {
  if (Elena.isElena(activeCase) && state.clinical.elenaEmergencyPhase) {
    if (state.clinical.elenaEmergencyPhase === 'intro') mostrarIntroElena();
    return;
  }
  const nbBtn = deskView.querySelector('.hp-desk-notebook');
  if (nbBtn) {
    nbBtn.classList.remove('has-new-clue');
    const toastChip = nbBtn.querySelector('.hp-desk-nb-toast');
    if (toastChip) toastChip.hidden = true;
  }
  ambience.play('folder');
  const activeTab = ['clues', 'relations', 'suspicions'].includes(tab) ? tab : (notebookState.tab || 'clues');
  notebookState.tab = activeTab;
  const p = activeCase.patient;
  const body = notebookMarkup(activeTab);
  setPanel(`Libreta clínica · ${p.name}`, 'HERRAMIENTA DE INVESTIGACIÓN · CONSULTORIO 01', body, 'notebook-panel');
  initNotebookSortable(activeTab);
  if (lastNotebookAnimatedTarget) {
    const targetEl = $('panel-body')?.querySelector(lastNotebookAnimatedTarget);
    lastNotebookAnimatedTarget = null;
    if (targetEl) animatePopElement(targetEl, { fromScale: 0.94, fromY: 5, duration: 260 });
  }
}

const trayState = {
  selectedStudyId: null,
  lastJustReviewedId: null
};

function trayMarkup(selectedId = trayState.selectedStudyId) {
  const c = state.clinical;
  const p = activeCase.patient;
  const received = Array.isArray(c.received) ? c.received : [];
  const reviewed = Array.isArray(c.reviewed) ? c.reviewed : [];
  const orders = Array.isArray(c.orders) ? c.orders : [];
  const allDeliveredReviewed = received.length > 0 && received.every(id => reviewed.includes(id));

  // CASO 1: BANDEJA VACÍA (0 estudios entregados)
  if (!received.length) {
    const hasPending = orders.length > 0;
    const pendingItems = hasPending ? orders.map(id => {
      const study = STUDY_CATALOG.find(s => s.id === id);
      return `
        <div class="hp-tray-empty-order-row">
          <span class="hp-tray-empty-order-bullet">⏳</span>
          <div class="hp-tray-empty-order-info">
            <strong>${escapeClinical(study ? study.title : id)}</strong>
            <small>${escapeClinical(study ? study.group : 'Estudio')} · Solicitado (pendiente de procesamiento y entrega)</small>
          </div>
        </div>
      `;
    }).join('') : '';

    return `
      <section class="hp-tray-modal-view is-empty" aria-label="Bandeja de estudios vacía">
        <div class="hp-tray-sheet-wrapper">
          <div class="hp-tray-sheet-page">
            <header class="hp-tray-sheet-header">
              <div class="hp-tray-sheet-kicker">HOSPITAL PORTAL · BANDEJA DE ENTRADA</div>
              <h3 class="hp-tray-sheet-title">Bandeja de estudios complementarios</h3>
              <p class="hp-tray-sheet-subtitle">Consultorio 01 · Paciente: ${escapeClinical(p.name)}</p>
            </header>

            <div class="hp-tray-empty-content">
              <div class="hp-tray-empty-icon" aria-hidden="true">📭</div>
              <h4>No hay estudios disponibles para revisar</h4>
              <p class="hp-tray-empty-desc">
                ${hasPending
                  ? 'Los estudios solicitados aún están pendientes de entrega. El paciente regresará con los informes impresos en su próxima consulta programada.'
                  : 'Aún no se han emitido órdenes médicas de laboratorio o imágenes para este paciente. Puedes solicitarlos ingresando al computador del escritorio.'}
              </p>

              ${hasPending ? `
                <div class="hp-tray-pending-box">
                  <span class="hp-tray-pending-header">ÓRDENES MÉDICAS EN CURSO (${orders.length}):</span>
                  <div class="hp-tray-pending-list">
                    ${pendingItems}
                  </div>
                </div>
              ` : ''}
            </div>

            <footer class="hp-tray-sheet-footer">
              <button type="button" class="primary-button" data-tray-action="close">Cerrar bandeja</button>
            </footer>
          </div>
        </div>
      </section>
    `;
  }

  // CASO 2: VISTA DE INFORME INDIVIDUAL
  if (selectedId && received.includes(selectedId)) {
    const rawRes = resultFor(c, activeCase, selectedId);
    const study = STUDY_CATALOG.find(s => s.id === selectedId);
    const isRev = reviewed.includes(selectedId);
    const title = study ? study.title : (rawRes ? rawRes.title : selectedId);
    const group = study ? study.group : 'Diagnóstico';
    const index = received.indexOf(selectedId) + 1;

    let docHtml = '';
    if (rawRes && rawRes.rows) {
      const rows = rawRes.rows.map(r => {
        const flag = r[3] === 'high' ? 'high' : r[3] === 'low' ? 'low' : '';
        const flagLabel = flag === 'high' ? 'ALTO' : flag === 'low' ? 'BAJO' : '';
        const marker = flag === 'high' ? '↑' : flag === 'low' ? '↓' : '';
        return `
          <tr class="${flag ? 'hp-tray-row-abnormal' : ''}">
            <th scope="row">${escapeClinical(r[0])}</th>
            <td>
              <span class="hp-tray-value ${flag}">${escapeClinical(r[1])}</span>
              ${flag ? `<span class="hp-tray-flag ${flag}">${marker} ${flagLabel}</span>` : ''}
            </td>
            <td class="hp-tray-ref">${escapeClinical(r[2])}</td>
          </tr>
        `;
      }).join('');

      docHtml = `
        <div class="hp-tray-doc-table-wrap">
          <table class="hp-tray-doc-table">
            <thead>
              <tr>
                <th scope="col">DETERMINACIÓN</th>
                <th scope="col">RESULTADO</th>
                <th scope="col">VALORES DE REFERENCIA</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
        <p class="hp-tray-doc-footnote">Las marcas ↑ y ↓ señalan parámetros fuera del rango de referencia del laboratorio.</p>
      `;
    } else if (rawRes && rawRes.report) {
      const paragraphs = String(rawRes.report).split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÑ])/u).map(s => s.trim()).filter(Boolean);
      docHtml = `
        <div class="hp-tray-doc-report-paragraphs">
          ${paragraphs.map(pText => `<p>${escapeClinical(pText)}</p>`).join('')}
        </div>
      `;
    } else {
      docHtml = `<p class="hp-tray-doc-empty">El informe no contiene datos legibles.</p>`;
    }

    const prevReviewedStudy = trayState.lastJustReviewedId && trayState.lastJustReviewedId !== selectedId
      ? STUDY_CATALOG.find(s => s.id === trayState.lastJustReviewedId)
      : null;

    return `
      <section class="hp-tray-modal-view is-report" aria-label="Informe médico de ${escapeClinical(title)}">
        <div class="hp-tray-sheet-wrapper">
          <div class="hp-tray-sheet-page">
            <div class="hp-tray-top-toolbar">
              <button type="button" class="secondary-button hp-tray-back-btn" data-tray-back>← Volver a la lista de estudios</button>
              <div class="hp-tray-review-badge ${isRev ? 'is-reviewed' : 'is-pending'}">
                ${isRev ? '✓ REVISADO POR MÉDICO' : '○ PENDIENTE DE REVISIÓN'}
              </div>
            </div>

            ${prevReviewedStudy && !isRev ? `
              <div class="hp-tray-auto-advance-banner" role="status">
                <span>✓ <strong>${escapeClinical(prevReviewedStudy.title)}</strong> registrado en la historia clínica · Mostrando el siguiente informe pendiente (${index} de ${received.length}).</span>
              </div>
            ` : ''}

            ${allDeliveredReviewed ? `
              <div class="hp-tray-all-reviewed-banner" role="status">
                <span>✓ Todos los informes disponibles fueron revisados</span>
                <button type="button" class="secondary-button hp-tray-all-reviewed-index-btn" data-tray-back>Ver índice de estudios →</button>
              </div>
            ` : ''}

            <article class="hp-tray-printed-report">
              <header class="hp-tray-printed-header">
                <div class="hp-tray-hospital-brand">
                  <span class="hp-tray-cross">✚</span>
                  <div>
                    <strong>HOSPITAL PORTAL · SERVICIO DE DIAGNÓSTICO</strong>
                    <small>Centro Asistencial de Alta Complejidad · Consultorio de Hepatología</small>
                  </div>
                </div>
                <div class="hp-tray-patient-meta">
                  <div><span>Paciente:</span> <strong>${escapeClinical(p.name)}</strong> (${p.age} años, ${p.sex})</div>
                  <div><span>Área:</span> <strong>${escapeClinical(group)}</strong> · Control: <strong>Día ${state.campaign.day || 1}</strong></div>
                </div>
                <h3 class="hp-tray-study-headline">${escapeClinical(title)}</h3>
              </header>

              <div class="hp-tray-printed-body">
                ${docHtml}
              </div>

              <footer class="hp-tray-printed-footer">
                <div class="hp-tray-footer-seal">
                  <span>DOCUMENTO ORIGINAL IMPRESO</span>
                  <small>Copia oficial entregada en mano por el paciente</small>
                </div>
                <div class="hp-tray-footer-actions">
                  ${!isRev ? `
                    <button type="button" class="primary-button hp-tray-btn-mark-reviewed" data-tray-review="${selectedId}">
                      ✓ Marcar como revisado
                    </button>
                  ` : `
                    <div class="hp-tray-reviewed-banner">
                      <span>✓ Estudio marcado como revisado</span>
                      <small>Hallazgos relevantes registrados en historia clínica.</small>
                    </div>
                  `}
                </div>
              </footer>
            </article>

            <footer class="hp-tray-nav-footer">
              <div class="hp-tray-counter">Estudio ${index} de ${received.length} disponibles</div>
              <button type="button" class="secondary-button" data-tray-action="close">Cerrar informe</button>
            </footer>
          </div>
        </div>
      </section>
    `;
  }

  // CASO 3: LISTA GENERAL DE ESTUDIOS DISPONIBLES EN LA BANDEJA
  const reviewedCount = received.filter(id => reviewed.includes(id)).length;
  const listItems = received.map((id, i) => {
    const study = STUDY_CATALOG.find(s => s.id === id);
    const isRev = reviewed.includes(id);
    const title = study ? study.title : id;
    const group = study ? study.group : 'General';
    return `
      <article class="hp-tray-index-card ${isRev ? 'is-reviewed' : 'is-unreviewed'}">
        <div class="hp-tray-index-card-head">
          <span class="hp-tray-index-num">${String(i + 1).padStart(2, '0')}</span>
          <div class="hp-tray-index-titles">
            <span class="hp-tray-group-pill">${escapeClinical(group)}</span>
            <h4>${escapeClinical(title)}</h4>
          </div>
          <span class="hp-tray-status-tag ${isRev ? 'tag-reviewed' : 'tag-pending'}">
            ${isRev ? '✓ Revisado' : '○ Sin revisar'}
          </span>
        </div>
        <div class="hp-tray-index-card-actions">
          <button type="button" class="primary-button" data-tray-open="${id}">Abrir informe original →</button>
        </div>
      </article>
    `;
  }).join('');

  return `
    <section class="hp-tray-modal-view is-index" aria-label="Bandeja de estudios complementarios">
      <div class="hp-tray-sheet-wrapper">
        <div class="hp-tray-sheet-page">
          <header class="hp-tray-sheet-header">
            <div class="hp-tray-sheet-kicker">ESTUDIOS COMPLEMENTARIOS · BANDEJA DE ENTRADA</div>
            <h3 class="hp-tray-sheet-title">Informes impresos recibidos</h3>
            <p class="hp-tray-sheet-subtitle">
              Paciente: <strong>${escapeClinical(p.name)}</strong> · ${received.length} ${received.length === 1 ? 'estudio entregado' : 'estudios entregados'} (${reviewedCount} revisados)
            </p>
          </header>

          <p class="hp-tray-lead-text">
            El paciente ha aportado los siguientes resultados de laboratorio y diagnóstico por imágenes.
            Selecciona un estudio para abrir el documento impreso original y registrar su revisión clínica.
          </p>

          ${allDeliveredReviewed ? `
            <div class="hp-tray-all-reviewed-banner is-in-index" role="status">
              <span>✓ Todos los informes disponibles fueron revisados y sus hallazgos ya constan en la historia clínica.</span>
            </div>
          ` : ''}

          <div class="hp-tray-items-grid">
            ${listItems}
          </div>

          <footer class="hp-tray-sheet-footer">
            <span class="hp-tray-tip">💡 Al marcar un estudio como revisado, sus hallazgos relevantes se incorporan al computador y desbloquean pistas de investigación.</span>
            <button type="button" class="secondary-button" data-tray-action="close">Cerrar bandeja</button>
          </footer>
        </div>
      </div>
    </section>
  `;
}

function openDeskStudiesTray(studyId = null) {
  if (Elena.isElena(activeCase) && state.clinical.elenaEmergencyPhase) {
    if (state.clinical.elenaEmergencyPhase === 'intro') mostrarIntroElena();
    return;
  }
  trayState.selectedStudyId = studyId;
  ambience.play('paper');
  const p = activeCase.patient;
  const body = trayMarkup(studyId);
  setPanel(`Estudios complementarios · ${p.name}`, 'ESTUDIOS COMPLEMENTARIOS · BANDEJA DE ENTRADA', body, 'studies-tray-panel');
}

function puedeCerrarPrimeraConsultaDemo() {
  const c = state.clinical;

  const pacienteValido =
    (state.campaign.index === 0 &&
      Martin.isMartin(activeCase)) ||
    (state.campaign.index === 1 &&
      Sofia.isSofia(activeCase));

  return (
    state.campaign.day === 1 &&
    pacienteValido &&
    !!c.hypothesis &&
    c.received.length === 0 &&
    !!state.campaign.appointments?.some(a =>
      a.caseId === activeCase.id &&
      a.day === 2 &&
      [2, 3].includes(a.slot)
    )
  );
}

function despedirConsultaInicialDemo() {
  if (
    state.paused ||
    movementBusy() ||
    !puedeCerrarPrimeraConsultaDemo()
  ) return false;

  if (!state.visits.leave(
    state.exam.patient,
    state.player
  )) {
    toast(`${activeCase.patient.name} debe estar sentado para despedirse.`);
    return false;
  }

  const pendientes = state.campaign.pendingInitial || [];

  const consultaGuardada = {
    caseId: activeCase.id,
    clinical: JSON.parse(JSON.stringify({
      ...state.clinical,
      caseId: activeCase.id
    }))
  };

  state.campaign.pendingInitial = [
    ...pendientes.filter(
      registro => registro.caseId !== activeCase.id
    ),
    consultaGuardada
  ];

  state.visitPurpose = 'demo-initial';
  state.seatTween = null;
  state.pendingAction = null;
  state.keys.clear();

  closePanel();
  save();
  hud();

  toast(`${activeCase.patient.name} se retira. Su control del Día 2 está guardado.`);
  return true;
}


function activarCodigoRojoElena() {
  if (state.clinical.emergencyHelpCalled || state.elenaWrong) return false;
  state.clinical.emergencyHelpCalled = true;
  state.clinical.elenaRescuePhase = 'arrival';
  state.elenaRescue = {phase:'arrival', time:0};
  state.keys.clear();
  state.player.path = [];
  state.player.walking = false;
  state.pendingAction = null;
  closePanel();
  syncClinicalLayout();
  save();
  return true;
}

function mostrarIntroElena() {
    const paciente=activeCase.patient;
    setPanel(
      'Algo no está bien...',
      'HOSPITAL PORTAL · EVENTO INESPERADO',
      `
        <section class="hp-consulta-paciente" data-mood="critical" aria-label="Estado agudo de Elena">
          <svg class="hp-consulta-retrato" data-mood="critical" viewBox="0 0 32 32" shape-rendering="crispEdges" aria-hidden="true">${portraitMarkup(paciente.appearance,'critical')}</svg>
          <div class="hp-consulta-identidad">
            <strong>${escapeClinical(paciente.name)}</strong>
            <div class="hp-consulta-expresion" data-mood="critical">
              <span class="hp-expresion-tag">Palidez y sudor frío</span>
              <span class="hp-expresion-copy">Se lleva la mano al epigastrio; la frente perlada de sudor frío anuncia el desvanecimiento.</span>
            </div>
          </div>
          <span class="hp-consulta-estado">Inestable</span>
        </section>

        <p class="panel-copy">
          Mientras se acomoda, Elena sonríe con cansancio:
          «Mi hija está por tener a mi primer nieto, doctora.
          No me lo quiero perder por nada del mundo».
        </p>

        <p class="panel-copy">
          La paciente relata que desde ayer presenta
          deposiciones negras y que esta mañana
          sintió un mareo intenso.
        </p>

        <article class="history-entry">
          <h3>La conversación se interrumpe</h3>
          <p>
            «Doctora... espere un momento...
            me estoy sintiendo muy mal...»
          </p>
        </article>

        <p class="clinical-note">
          La paciente se inclina hacia adelante.
          Su rostro está pálido y parece a punto
          de desvanecerse.
        </p>

        <div class="panel-actions panel-footer">
          <button
            class="primary-button"
            data-action="elena-mirar">
            Observar a la paciente →
          </button>
        </div>
      `,
      'emergency-intro'
    );
}

let tutorialConsultorioOfrecido=false,tutorialConsultorioTab='history',tutorialHistoriaActiva=false,tutorialExamenPendiente=false,tutorialLibretaPendiente=false,tutorialEstudiosPendientes=false,tutorialCierrePendiente=false,tutorialCierreFase='';
function tutorialConsultorio(paso=0){
  const pasos=[
    ['Conoce al paciente','En Historia puedes hacer preguntas sobre los síntomas y los antecedentes. Lee las respuestas y usa la libreta para organizar las pistas.'],
    ['Explora al paciente','Cuando estés lista, inicia el examen y acompaña al paciente a la camilla para revisar los hallazgos.'],
    ['Solicita y revisa estudios','En Pedidos elige los estudios que consideres necesarios. Después consulta los resultados disponibles en Resultados; la calculadora del escritorio ofrece escalas clínicas.'],
    ['Decide y recibe la devolución','En Conclusión registra tus decisiones clínicas y finaliza la atención cuando estés lista. La devolución te ayudará a revisar tu razonamiento.']
  ];
  if(paso===0){
    setPanel('Tutorial del consultorio','GUÍA OPCIONAL',`<p class="panel-copy">¿Quieres conocer los pasos de una consulta antes de comenzar?</p><div class="panel-actions"><button class="secondary-button" data-action="tutorial-consultorio-omitir">Ahora no</button><button class="primary-button" data-action="tutorial-consultorio-paso" data-paso="1">Ver guía →</button></div>`,'tutorial-consultorio');
    return;
  }
  const [titulo,texto]=pasos[paso-1];
  setPanel(titulo,`TUTORIAL DEL CONSULTORIO · ${paso}/${pasos.length}`,`<p class="panel-copy">${texto}</p><div class="panel-actions"><button class="secondary-button" data-action="tutorial-consultorio-omitir">Omitir tutorial</button><button class="primary-button" data-action="${paso===pasos.length?'tutorial-consultorio-iniciar':'tutorial-consultorio-paso'}" data-paso="${paso+1}">${paso===pasos.length?'Ir a la consulta →':'Siguiente →'}</button></div>`,'tutorial-consultorio');
}
function consultation(tab=
state.clinical.outcome?'decisions':currentTab){
  if (state.elenaWrong) { toast('Elena se ha retirado. La situación continúa pendiente.'); return; }
  if(window.HP_ARRIVAL?.pendingFirstPatient){toast('Siéntate en tu silla para recibir al primer paciente.');return;}
  
if (state.campaign.finished) {
  agenda();
  return;
}
if(!tutorialConsultorioOfrecido&&!window.HP_SAVED_BEFORE_BOOT&&state.campaign.day===1&&state.campaign.index===0&&Martin.isMartin(activeCase)&&!state.clinical.outcome){
  tutorialConsultorioOfrecido=true;
  tutorialConsultorioTab=tab;
  tutorialConsultorio();
  return;
}

// Elena: la emergencia interrumpe la consulta habitual.
const emergenciaElena =
  state.campaign.day === 2 &&
  state.campaign.index === 2 &&
  Elena.isElena(activeCase) &&
  !!state.clinical.elenaEmergencyPhase;

if (emergenciaElena && state.clinical.elenaEmergencyPhase === 'intro') {
  mostrarIntroElena();
  return;
}
if (emergenciaElena) {
  setPanel(
  '¡Emergencia en el consultorio!',
  'HOSPITAL PORTAL · CÓDIGO ROJO',
  `
    <section class="hp-er-wrap">

      <div class="hp-er-hero">
        <div class="hp-er-kicker">Alarma clínica · Prioridad I</div>
        <div class="hp-er-title">Hematemesis abundante</div>
        <p class="hp-er-lead">
          Elena se inclina bruscamente hacia adelante y vomita sangre roja en gran cantidad.
          La consulta se interrumpe de inmediato y su estado general empeora frente a ti.
        </p>
      </div>

      <div class="hp-er-grid">
        <section class="hp-er-card">
          <h3>Situación actual</h3>

          <div class="hp-er-bullets">
            <div class="hp-er-bullet">
              <span class="hp-er-dot"></span>
              <span>La paciente está <strong>pálida</strong>, <strong>sudorosa</strong> y visiblemente angustiada.</span>
            </div>

            <div class="hp-er-bullet">
              <span class="hp-er-dot"></span>
              <span>Refiere <strong>mareo intenso</strong>, sensación de desvanecimiento y debilidad extrema.</span>
            </div>

            <div class="hp-er-bullet">
              <span class="hp-er-dot"></span>
              <span>Las deposiciones negras desde ayer y el vómito con sangre se suman ahora a la <strong>palidez marcada</strong>.</span>
            </div>
          </div>
        </section>

        <section class="hp-er-vitals" aria-label="Monitor multiparamétrico de guardia">
          <div class="hp-er-monitor-head">
            <span class="hp-er-monitor-dot" aria-hidden="true"></span>
            <span>MONITOR MULTIPARAMÉTRICO</span>
            <svg class="hp-er-ecg" viewBox="0 0 80 18" aria-hidden="true">
              <polyline fill="none" stroke="currentColor" stroke-width="1.8" points="0,10 18,10 23,4 27,15 31,2 35,16 39,8 44,10 80,10"/>
            </svg>
          </div>
          <div class="hp-er-vital danger">
            <div class="hp-er-vital-label">Presión arterial · NIBP</div>
            <div class="hp-er-vital-value">85/50</div>
            <div class="hp-er-vital-sub">mmHg · Hipotensión</div>
          </div>

          <div class="hp-er-vital warn">
            <div class="hp-er-vital-label">Frecuencia cardiaca · ECG</div>
            <div class="hp-er-vital-value">124</div>
            <div class="hp-er-vital-sub">lpm · Taquicardia sinusal</div>
          </div>

          <div class="hp-er-vital">
            <div class="hp-er-vital-label">Saturación · SpO₂</div>
            <div class="hp-er-vital-value">96%</div>
            <div class="hp-er-vital-sub">aire ambiente</div>
          </div>
        </section>
      </div>

      <section class="hp-er-interpretation">
        <h3>Hallazgos a pie de silla</h3>
        <p>
          Extremidades frías y húmedas, relleno capilar lento (&gt;3 s).
          Responde con lentitud y no logra mantenerse erguida sin apoyo.
          Persiste el vómito con restos hemáticos.
        </p>
      </section>

      <section class="hp-er-status">
        Elena te mira buscando ayuda. La consulta programada quedó interrumpida y la decisión es tuya.
      </section>

    </section>
  `,
  'emergency-active'
);
return;
}
  

  if(returnVisitActive()){returnVisitPanel();return;}
  if(tab==='orders'&&tutorialLibretaPendiente&&state.clinical.exam){
    tutorialLibretaPendiente=false;
    tutorialEstudiosPendientes=true;
  }
  const tabs=[['history','Historia'],['exam','Examen'],['orders','Pedidos'],['results','Resultados'],['tools','Escalas'],['decisions',state.clinical.outcome?'Devolución':'Conclusión']];
  if(!tabs.some(([id])=>id===tab))tab='history';currentTab=tab;
  const deskConsultation=deskViewEnabled&&deskViewAssetsReady&&(Martin.isMartin(activeCase)||Sofia.isSofia(activeCase)||Elena.isElena(activeCase))&&state.player.seated;
  if(tab==='tools'&&!deskConsultation)prepareCalculator();
  const nav=`<div class="panel-tabs" role="tablist" aria-label="Secciones de la consulta">${tabs.map(([id,t])=>`<button role="tab" aria-selected="${id===tab}" class="${id===tab?'active':''}" data-tab="${id}">${t}</button>`).join('')}<button type="button" data-action="open-notebook" title="Abrir libreta de notas y razonamiento clínico">📖 Libreta</button><button type="button" data-action="open-pc">🖥 Monitor PC</button>${state.player.seated?'<button data-action="stand">Levantarse ↗</button>':''}</div>`;
  const calcCount=Object.keys(state.clinical.calculations||{}).filter(k=>Number.isFinite(state.clinical.calculations[k])).length;
  const toolsDeskContent=`<div class="clinical-content">
    ${calculationSummary()||'<p class="clinical-note">Todavía no hay cálculos registrados. Utiliza la calculadora del escritorio.</p>'}
    <div class="hp-desk-calc-shortcut-box">
      <button type="button" class="primary-button hp-shortcut-calc-btn" data-action="open-desk-calc">
        ⌨ ${calcCount>0?'Recalcular en la calculadora del escritorio →':'Tomar calculadora del escritorio →'}
      </button>
    </div>
  </div>`;
  let body=tab==='history'?clinicalUI.historyBody().replace('</div><div class="panel-actions',`${deskConsultation?calculationSummary():''}</div><div class="panel-actions`):tab==='exam'?clinicalUI.examBody():tab==='orders'?clinicalUI.ordersBody():tab==='results'?clinicalUI.resultsBody():tab==='tools'?(deskConsultation?toolsDeskContent:clinicalUI.toolsBody()):clinicalUI.decisionBody();
  if(tab==='history'&&tutorialHistoriaActiva){
    body=body.replace('<div class="history-topics" aria-describedby="history-hint">','<div class="clinical-note" role="status"><b>Primer paso:</b> elige una pregunta para escuchar al paciente. Puedes seleccionar la que consideres más útil. <button type="button" class="text-button" data-action="tutorial-consultorio-detener">Omitir guía</button></div><div class="history-topics" aria-describedby="history-hint">');
  }
  if((tab==='history'||tab==='exam')&&tutorialExamenPendiente&&!state.clinical.exam){
    const indicacion='<div class="clinical-note" role="status"><b>Siguiente paso:</b> cuando estés lista, inicia el examen físico para acompañar al paciente a la camilla. Puedes hacer más preguntas antes. <button type="button" class="text-button" data-action="tutorial-consultorio-detener">Omitir guía</button></div>';
    body=tab==='history'?body.replace('<div class="history-topics" aria-describedby="history-hint">',`${indicacion}<div class="history-topics" aria-describedby="history-hint">`):body.replace('<section class="hp-exam-notebook',`${indicacion}<section class="hp-exam-notebook`);
  }
  if((tab==='history'||tab==='exam')&&tutorialLibretaPendiente&&state.clinical.exam){
    const indicacion='<div class="clinical-note" role="status"><b>Organiza tus pistas:</b> abre «Libreta» para revisar lo que descubriste y destacar una evidencia si lo deseas. <button type="button" class="text-button" data-action="tutorial-libreta-omitir">Omitir guía</button></div>';
    body=tab==='history'?body.replace('<div class="history-topics" aria-describedby="history-hint">',`${indicacion}<div class="history-topics" aria-describedby="history-hint">`):body.replace('<section class="hp-exam-notebook',`${indicacion}<section class="hp-exam-notebook`);
  }
  if((tab==='history'||tab==='exam'||tab==='orders')&&tutorialEstudiosPendientes&&!state.clinical.orders.length){
    const indicacion=tab==='orders'?'Selecciona los estudios que consideres necesarios y pulsa «Solicitar estudios». En esta primera visita, los resultados llegarán en la reconsulta.':'Abre Pedidos para elegir los estudios que consideres necesarios. En esta primera visita, los resultados llegarán en la reconsulta.';
    body=body.replace(/(<div class="clinical-content[^"]*">)/,`$1<div class="clinical-note" role="status"><b>Estudios y resultados:</b> ${indicacion} <button type="button" class="text-button" data-action="tutorial-estudios-omitir">Omitir guía</button></div>`);
  }
  let faseCierre='';
  if(tab==='orders'&&tutorialCierrePendiente&&estudiosDiferidosDemo()){
    const cita=state.campaign.appointments?.some(a=>a.caseId===activeCase.id&&a.day===2&&[2,3].includes(a.slot));
    faseCierre=!state.clinical.hypothesis?'impresion':!cita?'agenda':'despedida';
    const indicacion=!state.clinical.hypothesis?'Elige tu impresión diagnóstica preliminar. La elección quedará registrada y no podrás modificarla en esta primera visita.':!cita?'Abre la agenda y reserva un turno para la reconsulta.':'Pulsa «Despedir» para cerrar esta primera visita. Los resultados y la evaluación continuarán en la reconsulta.';
    body=body.replace(/(<div class="clinical-content[^"]*">)/,`$1<div class="clinical-note" role="status" data-tutorial-cierre><b>Cierre de la primera visita:</b> ${indicacion} <button type="button" class="text-button" data-action="tutorial-cierre-omitir">Omitir guía</button></div>`);
  }
  
  const paciente=activeCase.patient,expr=patientExpressionState();
  const ficha=`<section class="hp-consulta-paciente" data-mood="${expr.mood}" aria-label="Datos del paciente">
    <svg class="hp-consulta-retrato" data-mood="${expr.mood}" viewBox="0 0 32 32" shape-rendering="crispEdges" aria-hidden="true">${portraitMarkup(paciente.appearance,expr.mood)}</svg>
    <div class="hp-consulta-identidad">
      <strong>${escapeClinical(paciente.name)}</strong>
      <span>${escapeClinical(paciente.age)} años · ${escapeClinical(paciente.sex)} · ${escapeClinical(paciente.occupation||'Ocupación no registrada')}</span>
      <small>Motivo de atención: ${escapeClinical(activeCase.name)}</small>
      <div class="hp-consulta-expresion" data-mood="${expr.mood}">
        <span class="hp-expresion-tag">${escapeClinical(expr.label)}</span>
        <span class="hp-expresion-copy">${escapeClinical(expr.detail)}</span>
      </div>
    </div>
    <span class="hp-consulta-estado">${state.clinical.outcome?'Finalizada':'En consulta'}</span>
  </section>`;
  
  setPanel(`Consulta de ${activeCase.patient.name}`,`CONSULTORIO 01 · CASO ${String(state.campaign.index+1).padStart(2,'0')} / ${String(SIMULATIONS.length).padStart(2,'0')}`,ficha+nav+body,'consultation');
  if(faseCierre&&faseCierre!==tutorialCierreFase){
    tutorialCierreFase=faseCierre;
    $('panel-body').querySelector('[data-tutorial-cierre]')?.scrollIntoView({block:'center',inline:'nearest'});
  }


  
if (
  tab === 'orders' &&
  puedeCerrarPrimeraConsultaDemo()
) {
  const footer = $('panel-body').querySelector('.panel-footer');

  if (footer) {
    footer.insertAdjacentHTML(
      'afterbegin',
      `<button
        type="button"
        class="primary-button"
        data-action="cerrar-consulta-inicial-demo">
        Despedir a ${activeCase.patient.name} · Control agendado →
      </button>`
    );
  }
}

}

function impresionInicial() {
  consultation('orders');
}

function openDeskPatientTalk(){
  if(state.elenaWrong){toast('Elena se ha retirado. La situación continúa pendiente.');return;}
  if(window.HP_ARRIVAL?.pendingFirstPatient){toast('Siéntate en tu silla para recibir al primer paciente.');return;}
  if(state.campaign.finished){agenda();return;}
  if(returnVisitActive()){returnVisitPanel();return;}
  if(state.clinical.outcome){consultation('decisions');return;}
  if(Elena.isElena(activeCase)&&state.clinical.elenaEmergencyPhase){
    if(state.clinical.elenaEmergencyPhase==='intro')mostrarIntroElena();
    else consultation('history');
    return;
  }
  const paciente=activeCase.patient,expr=patientExpressionState();
  const ficha=`<section class="hp-consulta-paciente is-face-to-face" data-mood="${expr.mood}" aria-label="Estado del paciente">
    <svg class="hp-consulta-retrato" data-mood="${expr.mood}" viewBox="0 0 32 32" shape-rendering="crispEdges" aria-hidden="true">${portraitMarkup(paciente.appearance,expr.mood)}</svg>
    <div class="hp-consulta-identidad">
      <strong>${escapeClinical(paciente.name)} · ${escapeClinical(paciente.age)} años</strong>
      <span>${escapeClinical(paciente.occupation||'Consulta ambulatoria')} · ${escapeClinical(activeCase.name)}</span>
      <div class="hp-consulta-expresion" data-mood="${expr.mood}">
        <span class="hp-expresion-tag">${escapeClinical(expr.label)}</span>
        <span class="hp-expresion-copy">${escapeClinical(expr.detail)}</span>
      </div>
    </div>
  </section>`;
  let body=clinicalUI.historyBody().replace(
    '<div class="panel-actions panel-footer',
    '<div class="panel-actions panel-footer"><button type="button" class="secondary-button" data-action="close">Mirar escritorio</button><button type="button" class="secondary-button" data-action="open-monitor-orders">🖥 Monitor PC (Pedidos) →</button>'
  );
  setPanel(`Conversando con ${paciente.name}`,'INTERROGATORIO CARA A CARA · CONSULTORIO 01',ficha+body,'history');
}
function talk(){if(state.campaign.finished){agenda();return;}if(returnVisitActive()){returnVisitPanel();return;}if(state.clinical.outcome){consultation('decisions');return;}if(state.exam.atBed){examAtBed();return;}if(state.player.seated){consultation('history');return;}setPanel(`Escucha a ${activeCase.patient.name}`,'CONSULTA AMBULATORIA · PACIENTE ESTABLE',historyBody(),'history');}
function returnVisitPanel(){
  if(!state.clinical.returnVisit||!returnVisitAvailable(state.clinical,activeCase))return;
  setPanel('El control de Martín','UN PRÓXIMO CONTROL · PACIENTE ESTABLE',returnVisitMarkup(state.clinical,activeCase),'return-visit');
}
function startReturnVisit(){
  if(state.paused||movementBusy()||!returnVisitAvailable(state.clinical,activeCase))return;
  if(state.clinical.returnVisit){returnVisitPanel();return;}
  if(!state.visits.leave(state.exam.patient,state.player)){toast('Vuelve al escritorio para comenzar el próximo control.');return;}
  state.clinical.returnVisit=initialReturnVisit();state.visitPurpose='return-visit';state.seatTween=null;state.pendingAction=null;state.keys.clear();
  closePanel();hud();toast('Martín se retira. Un control más tarde, vuelve a conversar contigo.');
}
function seatPlayer(){
  const station=ROOM.seat.exit;
  if(Math.hypot(state.player.x-station.x,state.player.y-station.y)>3){goTo('chair');return;}
  const from={...state.player};
  if(sit(state.player)){
    ambience.play('chair');
    state.clinical.seated=true;
    state.seatTween={...createActorTransition(state.player,from,state.player,'sit',0,{face:ROOM.seat.face}),progress:0};
    state.keys.clear();hud();toast('Te acomodas frente al paciente. Pulsa E para abrir la consulta.');
  }
}
function standPlayer(){
  if(state.seatTween)return;
  const from={...state.player};
  if(stand(state.player)){
    ambience.play('chair');
    state.seatTween={...createActorTransition(state.player,from,state.player,'stand',0,{face:ROOM.seat.face}),progress:0};
    state.keys.clear();hud();toast('Te levantaste de la silla.');
  }
}
const elenaPhoneDialogue = [
  {speaker:'MÉDICA', text:'Hola'},
  {speaker:'RECEPCIONISTA', text:'¡Doctora! Necesitamos que venga urgentemente a recepción'},
  {speaker:'MÉDICA', text:'¿Qué ocurrió?'},
  {speaker:'RECEPCIONISTA', text:'La paciente que acaba de salir de su consultorio se desplomó en el hall. ¡Está sangrando y no responde!'},
  {speaker:'MÉDICA', text:'¡Activen el equipo de emergencias! ¡Voy para allá!'}
];
let elenaPhoneTyping=0;
function showElenaPhoneDialogue(){
  if(state.clinical.elenaPhone!=='talking')return;
  const line=elenaPhoneDialogue[state.clinical.elenaPhoneStep];
  if(!line)return;
  elenaPhoneTyping=0;
  setPanel('Llamada desde recepción','URGENCIA · TELÉFONO',
    '<div class="urgent-call-banner"><span class="urgent-call-light" aria-hidden="true"></span><span>LLAMADA URGENTE · RECEPCIÓN</span><span class="urgent-call-counter">'+String(state.clinical.elenaPhoneStep+1).padStart(2,'0')+' / 05</span></div><article class="urgent-call-message"><h3>'+line.speaker+'</h3><p id="elena-phone-line" aria-live="off"></p></article><div class="panel-actions panel-footer urgent-call-actions"><button class="primary-button" data-action="elena-phone-next" disabled>Continuar →</button></div>',
    'elena-urgent-call');
  $('close-panel').hidden=true;
}
function updateElenaPhoneDialogue(dt){
  if(state.clinical.elenaPhone!=='talking'||!panel.open||currentPanel!=='elena-urgent-call'||state.paused||document.hidden)return;
  const line=elenaPhoneDialogue[state.clinical.elenaPhoneStep];
  const text=$('elena-phone-line'),button=$('panel-body').querySelector('[data-action="elena-phone-next"]');
  if(!line||!text||!button)return;
  elenaPhoneTyping+=dt;
  const count=Math.max(0,Math.min(line.text.length,Math.floor((elenaPhoneTyping-.3)*36)));
  text.textContent='«'+line.text.slice(0,count)+(count===line.text.length?'»':'');
  button.disabled=count<line.text.length;
}
function answerElenaPhone(){
  if(state.clinical.elenaPhone!=='ringing'||state.elenaWrong?.phase!=='done'||panel.open||state.paused)return;
  state.clinical.elenaPhone='talking';state.clinical.elenaPhoneStep=0;frame.phoneRestored=true;
  ambience.stopPhone();state.keys.clear();state.player.path=[];state.pendingAction=null;save();
  showElenaPhoneDialogue();
}
function nextElenaPhoneLine(){
  if(state.clinical.elenaPhone!=='talking'||currentPanel!=='elena-urgent-call')return;
  if(state.clinical.elenaPhoneStep<elenaPhoneDialogue.length-1){
    state.clinical.elenaPhoneStep++;save();showElenaPhoneDialogue();return;
  }
  state.clinical.elenaPhone='answered';delete state.clinical.elenaPhoneStep;
  window.HP_ARRIVAL?.prepareElenaEmergency();
  $('close-panel').hidden=false;save();closePanel();hud();
}

function computerScreen(){
  ambience.play('beep');
  const fin=state.campaign.finance||Economy.initial();
  const bal=Economy.balance(fin);
  const b=Economy.budget(activeCase);
  const statusLabel=bal<0?'DÉFICIT CRÍTICO':bal<1000?'CONTINGENCIA':bal<1800?'AUSTERIDAD':bal>2200?'SOLVENCIA ALTA':'OPERATIVO';
  setPanel(
    'Terminal del Consultorio 01',
    `HOSP-OS v2.4 · JORNADA 0${state.campaign.day} · INTRANET`,
    `<div class="hp-pc-terminal">
      ${clinicalUI.managerMemoMarkup()}
      <section class="hp-pc-telemetry" aria-label="Estado financiero en pantalla">
        <div class="hp-pc-metric">
          <small>FONDOS DEL HOSPITAL</small>
          <strong>${Economy.money(bal)}</strong>
          <span>Estado operativo: ${statusLabel}</span>
        </div>
        <div class="hp-pc-metric">
          <small>COBERTURA DEL PACIENTE EN TURNO</small>
          <strong>${Economy.money(b.coverage)}</strong>
          <span>${escapeClinical(activeCase.patient.name)} · Estudios indicados cubiertos</span>
        </div>
      </section>
      <div class="hp-pc-statusbar">
        <span>● RED HOSPITALARIA ACTIVA</span>
        <span>SERVICIO DE HEPATOLOGÍA · TERMINAL 01</span>
      </div>
      <div class="panel-actions panel-footer">
        <button type="button" class="primary-button" data-tab="orders">Abrir módulo de pedidos →</button>
        <button type="button" class="secondary-button" data-tab="results">Visor de laboratorio →</button>
        <button type="button" class="secondary-button" data-tab="history">Volver a carpeta clínica →</button>
      </div>
    </div>`,
    'computer-screen'
  );
}
function interact(){if(state.paused||panel.open||movementBusy())return;if(state.clinical.elenaPhone==='ringing'&&state.elenaWrong?.phase==='done'){answerElenaPhone();return;}if(state.campaign.finished){agenda();return;}const i=nearestInteraction(state.player,sceneRoom());if(!i){toast('Acércate al paciente, a tu silla o al escritorio.');return;}if(state.player.seated){consultation();return;}state.player.path=[];state.pendingAction=null;
  if(i.id==='chair')seatPlayer();else if(i.id==='patient')goTo('patient');else if(i.id==='computer'){state.player.face=i.face;computerScreen();}else if(i.id==='door')hospitalMap();
}
function goTo(id){
  if(state.campaign.finished&&(id==='patient'||id==='chair'||id==='computer')){agenda();return;}
  if(movementBusy()){toast('Espera a que termine el traslado del paciente.');return;}
  if(state.paused){toast('Continúa el turno para moverte.');return;}
  if(state.player.seated){if(id==='computer'){computerScreen();return;}if(id==='chair'){consultation();return;}if(id==='patient'&&!state.exam.atBed){talk();return;}standPlayer();}
  const room=sceneRoom(),i=room.interactions.find(x=>x.id===id);if(!i)return;const path=findPath(state.player,i.approach,room);
  if(path.length){state.player.path=path;state.pendingAction=id;clickPulse={...i.approach,at:elapsed};toast(id==='chair'?'Caminando hacia tu silla…':id==='patient'?`Acercándote a ${activeCase.patient.name}…`:'Caminando…');}
  else if(Math.hypot(state.player.x-i.approach.x,state.player.y-i.approach.y)<3){arrive(id);}
  else toast('No hay una ruta libre hasta ese punto. Prueba desde otra posición.');
}
function arrive(id){const i=sceneRoom().interactions.find(x=>x.id===id);state.pendingAction=null;if(!i)return;state.player.face=i.face;if(id==='chair')seatPlayer();else if(id==='patient')talk();else if(id==='computer')computerScreen();else hospitalMap();}
function hospitalMap(){
  setPanel('Tu consultorio','CONSULTORIO 01',`
    <p class="panel-copy">
      Puedes regresar al pasillo y continuar la consulta al volver.
    </p>
    <div class="map-grid">
      <button class="map-room available" data-action="close">
        <b>▣ Consultorio</b>
        <span>ESTÁS AQUÍ</span>
      </button>
      <button class="map-room available" data-action="salir-pasillo">
        <b>← Salir al pasillo</b>
        <span>ÁREA DE CONSULTORIOS</span>
      </button>
    </div>
  `,'map');
}
function help(){setPanel('Tu guía para la ronda','CÓMO JUGAR',`<p class="panel-copy">Muévete por el consultorio, escucha a cada paciente y solicita los estudios según tu sospecha.</p><div class="help-grid"><div><b>Caminar</b><p>WASD o las flechas. También puedes hacer clic o tocar un punto del suelo: la residente rodea los muebles.</p></div><div><b>Interactuar</b><p>Pulsa E al acercarte. Haz clic en el paciente, el ordenador o tu silla para caminar hacia ellos e interactuar.</p></div><div><b>Sentarte y levantarte</b><p>Tu silla está a la izquierda del escritorio. E te sienta mirando al paciente. Q te levanta; también hay un botón dentro de la consulta.</p></div><div><b>Completar la consulta</b><p>Conversa y acompaña al paciente a la camilla. Al volver, elige estudios con las tarjetas y abre los resultados. Puedes pedir más o usar las calculadoras. Para terminar, elige diagnóstico, una interpretación de los datos, una conducta y un próximo control. La devolución aparece al cerrar, con un reto extra opcional que suma puntos aparte. Después llega otro paciente. Martín también tiene un próximo control opcional, con dos decisiones breves.</p></div><div><b>A tu ritmo</b><p>El botón Traslados: 1× cambia los recorridos automáticos a 3×. Las flechas y WASD conservan su velocidad habitual. Pulsa Sonido: apagado para escuchar pasos, silla y papel; puedes silenciarlos cuando quieras.</p></div></div><p class="clinical-note">El progreso se guarda en este navegador cuando es posible. La opción ↺ reinicia el caso actual y conserva las consultas anteriores. La agenda permite revisar devoluciones, guardar o cargar una partida desde un archivo y reiniciar la ronda al terminar. Los recorridos se detienen al abrir una ventana. La respiración y el parpadeo continúan durante el diálogo; la pausa y cambiar de pestaña detienen ambos.</p><div class="panel-actions"><button class="primary-button" data-action="close">Listo, a explorar →</button></div>`,'help');}
function confirmReset(){setPanel('Volver a empezar','REINICIAR LA CONSULTA',`<p class="panel-copy">Se borrarán las revisiones y decisiones de este caso y volverás a la entrada del consultorio.</p><div class="panel-actions"><button class="secondary-button" data-action="close">Seguir jugando</button><button class="primary-button" data-action="reset">Reiniciar caso</button></div>`,'reset');}
function reset(){
  if(state.campaign.finished){confirmRoundReset();return;}
  if(movementBusy())return;
  state.elenaWrong=null;state.elenaEmergency=null;state.elenaRescue=null;window.HP_ARRIVAL?.clearElenaEmergency();
  state.clinical=initialConsultation();state.player=createPlayer();state.exam=new ExamSequence(ROOM,activeCase.patient.appearance);if(window.HP_ARRIVAL?.pendingFirstPatient)state.exam.patient.visible=false;state.visits=new VisitSequence();state.visitPurpose='';ambience.reset();state.pendingAction=null;state.seatTween=null;state.keys.clear();clinicalUI.reset();currentTab='history';setPaused(false);closePanel();hud();toast(`${activeCase.patient.name} espera para reiniciar esta consulta. Tu agenda anterior se conserva.`);
}
function nextPatient(){
  if(state.paused||movementBusy()||state.campaign.finished||!state.clinical.outcome||returnVisitActive())return;
  if(!state.visits.leave(state.exam.patient,state.player)){toast('Termina el examen y vuelve al escritorio antes de despedir al paciente.');return;}
  if(!recordConsultation(state.campaign,state.clinical)){state.visits=new VisitSequence();return;}
  state.visitPurpose='next-patient';state.seatTween=null;state.pendingAction=null;state.keys.clear();if(panel.open)closePanel();hud();
  toast(`${activeCase.patient.name} se retira. ${state.campaign.index===SIMULATIONS.length-1?'La ronda está por terminar.':'El siguiente paciente espera su turno.'}`);
}
// El cierre lee los resultados guardados; no vuelve a puntuar las consultas.
function jornadaBody(){
  const summary=campaignSummary(state.campaign),esc=escapeClinical;
  const number=value=>String(value).replace('.',',');
  const records=state.campaign.completed;
  const modules=[Martin,Sofia,Elena,Diego,Rosa,Andres,Lucia,Ernesto,Valeria,Hector];
  const review=(i,label='Ver devolución')=>`<button class="secondary-button" data-record="${i}">${esc(label)}</button>`;
  const rows=predicate=>records.flatMap((record,i)=>{
    const caseData=SIMULATIONS[i];
    return (record.clinical.outcome.parts||[]).filter(predicate).map(part=>`<article class="feedback-row"><b>${esc(caseData.patient.name)} · ${esc(part.title)}</b><p>${number(part.score)}/${number(part.max)}${part.max===0?' · Ajuste de puntuación':''}</p>${part.explanation?`<p>${esc(part.explanation)}</p>`:''}${review(i,'Revisar explicación')}</article>`);
  }).join('');
  const strengths=rows(p=>p.max>0&&p.score===p.max);
  const revise=rows(p=>p.score<p.max);
  const patients=records.map((record,i)=>`<article class="agenda-item attended"><span class="agenda-number">${String(i+1).padStart(2,'0')}</span><div><b>${esc(SIMULATIONS[i].patient.name)}</b><p>${esc(SIMULATIONS[i].name)}</p><small>${number(record.clinical.outcome.score)}/10 · Finalizado</small></div>${review(i)}</article>`).join('');
  const sct=records.map((record,i)=>{
    const d=record.clinical.decisions||{};
    const module=modules.find(m=>m?.ID===record.caseId);
    const selected=module?.sct?.find(x=>x.id===d.sctChoice);
    const feedback=selected?module.feedback(d).find(x=>x.title.startsWith('SCT')):null;
    return `<article class="feedback-row"><b>${esc(SIMULATIONS[i].patient.name)}</b><p>${feedback?esc(feedback.text):'SCT no registrado en esta partida. Se conserva la devolución original.'}</p>${review(i)}</article>`;
  }).join('');
  return `<p class="panel-copy">Has atendido a los ${SIMULATIONS.length} pacientes de esta jornada. Revisa tus decisiones y los aprendizajes de esta jornada.</p><div class="round-summary"><div><strong>${summary.completed}/${SIMULATIONS.length}</strong><span>Pacientes atendidos</span></div><div><strong>${number(summary.total)}/${SIMULATIONS.length * 10}</strong><span>Puntuación de la jornada</span></div><div><strong>${summary.perfect}</strong><span>Consultas con 10/10</span></div></div><div class="panel-actions"><button class="primary-button" data-action="review-patients">Revisar pacientes ↓</button></div><h3 id="jornada-pacientes" tabindex="-1">Tus pacientes</h3><div class="agenda-list">${patients}</div><details class="reasoning-record"><summary>Fortalezas</summary><p class="panel-copy">Apartados que recibieron puntuación completa.</p>${strengths||'<p>Aún no hay apartados con puntuación completa en estos registros.</p>'}</details><details class="reasoning-record"><summary>Para repasar</summary><p class="panel-copy">Apartados con puntuación parcial, sin puntos o con descuentos.</p>${revise||'<p>Todos los apartados registrados recibieron puntuación completa.</p>'}</details><details class="reasoning-record"><summary>Razonamiento SCT · Formativo</summary><p class="panel-copy">Tu respuesta y su explicación docente por paciente. El SCT no modifica la nota clínica.</p>${sct}</details><section class="save-game-card"><h3>Conserva tu jornada</h3><p>Las devoluciones siguen disponibles desde la agenda. Guarda también un archivo para conservar una copia o consultarla en otro equipo.</p><div class="panel-actions"><button class="secondary-button" data-action="export-game">Guardar partida ↓</button><button class="secondary-button" data-action="choose-game">Cargar partida ↑</button></div></section><div class="panel-actions"><button class="secondary-button" data-action="review-patients">Revisar pacientes</button>${hasNextDay(state.campaign)?`<button class="primary-button" data-action="next-day">Comenzar Día ${state.campaign.day+1} →</button>`:'<p class="clinical-note">Llegaste al final de las jornadas disponibles.</p>'}<button class="secondary-button" data-action="solo-menu">Volver al menú principal →</button></div>`;
}

function agendaBody(){
  if (
    state.campaign.day === 1 &&
    state.campaign.demoDay1Complete
  ) {
    const citas = state.campaign.appointments || [];
    const pendientes = state.campaign.pendingInitial || [];

    const pacientes = [
      {id: Martin.ID, nombre: 'Martín'},
      {id: Sofia.ID, nombre: 'Sofía'}
    ];

    const filas = pacientes.map(p => {
      const cita = citas.find(a =>
        a.caseId === p.id && a.day === 2
      );

      const guardado = pendientes.some(r =>
        r.caseId === p.id
      );

      return `
        <article class="agenda-item attended">
          <span class="agenda-number">✓</span>
          <div>
            <b>${p.nombre}</b>
            <p>Primera consulta realizada</p>
            <small>
              ${guardado
                ? 'Historia y estudios pendientes guardados'
                : 'Consulta pendiente de recuperar'}
            </small>
          </div>
          <span class="stable-badge">
            ${cita
              ? `Día 2 · Turno ${cita.slot}`
              : 'Sin turno'}
          </span>
        </article>
      `;
    }).join('');

    return `
      <p class="clinical-note">
        Jornada inicial completada. Los resultados de
        los estudios estarán disponibles cuando los
        pacientes regresen a sus controles.
      </p>

      <div class="round-summary">
        <div>
          <strong>2/2</strong>
          <span>Consultas iniciales</span>
        </div>
        <div>
          <strong>${pendientes.length}/2</strong>
          <span>Historias guardadas</span>
        </div>
      </div>

      <h3 class="study-title">Reconsultas programadas</h3>

      <div class="agenda-list">
        ${filas}
      </div>

      <p class="clinical-note">
        Las evaluaciones y puntuaciones clínicas
        se realizarán después de recibir los resultados.
      </p>

      <div class="panel-actions">
        <button class="secondary-button"
          data-action="export-game">
          Guardar partida ↓
        </button>
        
<button class="primary-button"
  data-action="next-day">
  Comenzar Día 2 →
</button>
<button class="secondary-button"
  data-action="solo-menu">
  Volver al menú principal →
</button>

      </div>
    `;
  }

  if(state.campaign.finished)return jornadaBody();

  const summary=campaignSummary(state.campaign);
  return `<p class="panel-copy">${SIMULATIONS.length} consultas ambulatorias en esta jornada. Al despedir a cada paciente, se guarda su devolución y llega el siguiente.</p><div class="round-summary"><div><strong>${summary.completed}/${SIMULATIONS.length}</strong><span>Pacientes atendidos</span></div><div><strong>${String(summary.total).replace('.',',')}/${SIMULATIONS.length * 10}</strong><span>Puntos de razonamiento</span></div><div><strong>${summary.perfect}</strong><span>Consultas con 10/10</span></div></div><p class="round-progress-extra">Retos extra: <b>${summary.challengePoints}/${SIMULATIONS.length} puntos</b> · ${summary.challengesPlayed}/${SIMULATIONS.length} jugados. Mejor racha: <b>${summary.bestStreak}</b> consultas adecuadas consecutivas.</p><div class="agenda-list">${SIMULATIONS.map((c,i)=>{const record=state.campaign.completed[i];return `<article class="agenda-item ${record?'attended':i===state.campaign.index?'in-progress':''}"><span class="agenda-number">${String(i+1).padStart(2,'0')}</span><div><b>${c.patient.name} · ${c.patient.age} años</b><p>${c.name}</p><small>Complejidad ${c.level}/5 · ${record?'Finalizado':i===state.campaign.index?'En consulta':'En agenda'}</small></div>${record?`<button class="secondary-button" data-record="${i}">${String(record.clinical.outcome.score).replace('.',',')}/10 · Revisar</button>`:''}</article>`;}).join('')}</div><section class="save-game-card"><h3>Tu partida</h3><p>Guarda un archivo para retomar la ronda aquí o en otro equipo.</p><div class="panel-actions"><button class="secondary-button" data-action="export-game">Guardar partida ↓</button><button class="secondary-button" data-action="choose-game">Cargar partida ↑</button></div></section><div class="panel-actions"><button class="secondary-button" data-action="close">Volver al consultorio</button></div>`;
}
function agenda(){setPanel(state.campaign.finished?'Jornada completada':'Agenda de consultas',`DÍA ${state.campaign.day} · ${SIMULATIONS.length} ${SIMULATIONS.length===1?'PACIENTE':'PACIENTES'}`,agendaBody()+pastDaysMarkup(),'agenda');}

function pastDaysMarkup() {
  if (!state.campaign.archives.length) return '';
  return `<details class="reasoning-record"><summary>Jornadas anteriores</summary>${state.campaign.archives.map(archive => {
    const cases = getPatientsForDay(archive.day);
    return `<h3>Día ${archive.day}</h3><div class="agenda-list">${archive.completed.map((record, index) =>
      `<article class="agenda-item attended"><span class="agenda-number">${index+1}</span><div><b>${escapeClinical(cases[index].patient.name)}</b><p>${String(record.clinical.outcome.score).replace('.',',')}/10 · Finalizado</p></div><button class="secondary-button" data-archive-day="${archive.day}" data-archive-record="${index}">Ver devolución</button></article>`
    ).join('')}</div>`;
  }).join('')}</details>`;
}
function reviewArchivedRecord(day, index) {
  const archive = state.campaign.archives.find(a => a.day === day);
  const record = archive?.completed[index];
  if (!record) return;
  const caseData = getPatientsForDay(day)[index];
  setPanel(`Devolución de ${caseData.patient.name}`, `DÍA ${day} · CONSULTA FINALIZADA`,
    clinicalUI.debriefBody(caseData, record.clinical, true)+
    '<div class="panel-actions"><button class="secondary-button" data-action="agenda">Volver a la agenda</button></div>', 'record');
}
function beginNextDay() {
  if (state.paused || movementBusy()) return;
  if (typeof window.HP_ARRIVAL?.restart !== 'function') {
    toast('No se pudo conectar la entrada del hospital. La jornada actual se conserva.');
    return;
  }
  const next = startNextDay(state.campaign);
  if (!next) return;

  // Archiva el día anterior y prepara la consulta, sin recibir al paciente aún.
  state.campaign = next.campaign;
  SIMULATIONS = getPatientsForDay(state.campaign.day);
  activeCase = SIMULATIONS[0];
  state.clinical = next.clinical;
  state.clinical.seated = false;
  state.player = createPlayer();
  state.exam = new ExamSequence(ROOM, activeCase.patient.appearance);
  state.exam.patient.visible = false;
  state.visits = new VisitSequence();
  state.visitPurpose = '';
  state.pendingAction = null;
  state.seatTween = null;
  state.keys.clear();
  pendingLoadedGame = null;
  $('load-game-file').value = '';
  clinicalUI.reset();
  currentTab = 'history';
  ambience.reset();
  if (panel.open) closePanel();
  hud();
  save();

  // Este método reinicia solo el recorrido exterior y la espera del paciente.
  // La campaña y las devoluciones anteriores permanecen intactas.
  if (sceneExpanded) expandScene(false);
  if (typeof window.HP_ARRIVAL.startNextDay === 'function') {
    window.HP_ARRIVAL.startNextDay();
  } else {
    window.HP_ARRIVAL.restart();
  }
}

function exportGame(){
  if(movementBusy()){toast('Espera a que termine el traslado antes de guardar una partida.');return;}
  const contents=createGameSave(activeCase.id,state.clinical,state.campaign,state.settings);
  const url=URL.createObjectURL(new Blob([contents],{type:'application/json'}));
  const link=document.createElement('a');link.href=url;link.download=`Hepato_Partida_${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  toast('Partida guardada. Puedes cargar este archivo en otro equipo.');
}
function chooseGame(){
  if(movementBusy()){toast('Espera a que termine el traslado antes de cargar una partida.');return;}
  pendingLoadedGame=null;$('load-game-file').click();
}
async function previewGameFile(e){
  const file=e.target.files?.[0];if(!file)return;
  try{
    if(file.size>MAX_SAVE_BYTES)throw new Error('La partida supera el tamaño permitido.');
    const loaded=readGameSave(await file.text());pendingLoadedGame=loaded;
    const campaign=loaded.campaign,loadedCases=getPatientsForDay(campaign.day),patient=loadedCases[campaign.index].patient;
    setPanel('Cargar una partida',`TU AVANCE · DÍA ${campaign.day}`,`<p class="panel-copy"><b>${escapeClinical(file.name)}</b></p><div class="round-summary"><div><strong>${campaign.completed.length}/${loadedCases.length}</strong><span>Consultas finalizadas</span></div><div><strong>${campaign.finished?'Ronda completa':escapeClinical(patient.name)}</strong><span>${campaign.finished?'Devoluciones disponibles':`Consulta ${campaign.index+1} de ${loadedCases.length}`}</span></div></div><p class="clinical-note">Esta partida reemplazará el avance abierto en este navegador. Puedes cancelar y guardar tu partida actual primero.</p><div class="panel-actions"><button class="secondary-button" data-action="cancel-load">Conservar partida actual</button><button class="primary-button" data-action="apply-load">Usar esta partida →</button></div>`,'load-game');
  }catch(error){pendingLoadedGame=null;toast(error.message||'No se pudo abrir la partida. Tu avance se conserva.');}
  finally{e.target.value='';}
}
function applyGame(){
  if(!pendingLoadedGame||movementBusy())return;
  const loaded=pendingLoadedGame;pendingLoadedGame=null;window.HP_ARRIVAL?.useImported();
  state.campaign=loaded.campaign;SIMULATIONS=getPatientsForDay(state.campaign.day);state.clinical=loaded.clinical;state.settings=readGameSettings(loaded.settings);ambience.setEnabled(state.settings.sound);ambience.reset();activeCase=SIMULATIONS[state.campaign.index];window.HP_UPDATE_ARRIVAL_SOUND_BTN?.(state.settings.sound);
  state.player=createPlayer();if(state.clinical.seated)Object.assign(state.player,ROOM.seat,{seated:true});
  state.exam=new ExamSequence(ROOM,activeCase.patient.appearance);if(state.campaign.finished||window.HP_ARRIVAL?.pendingFirstPatient)state.exam.patient.visible=false;
  restoreElenaEmergency();
  if(state.clinical.elenaWrongPhase==='done')window.HP_ARRIVAL?.prepareElenaEmergency();
  state.visits=new VisitSequence();state.visitPurpose='';state.pendingAction=null;state.seatTween=null;state.keys.clear();clinicalUI.reset();currentTab='history';
  setPaused(false);closePanel();hud();toast('Partida cargada. Puedes continuar la ronda.');
  if(state.campaign.finished)agenda();else if(state.player.seated)consultation(state.clinical.outcome?'decisions':state.clinical.received.length?'results':'history');
}
function reviewRecord(index){
  const record=state.campaign.completed[index];if(!record)return;
  const caseData=SIMULATIONS[index];setPanel(`Devolución de ${caseData.patient.name}`,`CONSULTA ${index+1} / ${SIMULATIONS.length} · FINALIZADA`,clinicalUI.debriefBody(caseData,record.clinical,true),'record');
}
function confirmRoundReset(fromGame=false){setPanel('Reiniciar toda la partida','VOLVER AL INICIO',`<p class="panel-copy">Se borrarán todas las jornadas, las decisiones, las devoluciones y los puntos de los retos. Volverás a la primera consulta con Martín.</p><div class="panel-actions"><button class="secondary-button" data-action="${fromGame?'close':'agenda'}">Seguir jugando</button><button class="primary-button" data-action="restart-round">Reiniciar todo</button></div>`,'reset-round');}
function restartRound(){state.elenaEmergency=null;state.elenaRescue=null;state.elenaWrong=null;state.campaign=initialCampaign();SIMULATIONS=getPatientsForDay(1);activeCase=SIMULATIONS[0];state.clinical=initialConsultation();state.player=createPlayer();state.exam=new ExamSequence(ROOM,activeCase.patient.appearance);if(window.HP_ARRIVAL?.pendingFirstPatient)state.exam.patient.visible=false;state.visits=new VisitSequence();state.visitPurpose='';ambience.reset();state.pendingAction=null;state.seatTween=null;state.keys.clear();pendingLoadedGame=null;$('load-game-file').value='';clinicalUI.reset();currentTab='history';setPaused(false);closePanel();hud();state.exam.patient.visible=false;window.HP_ARRIVAL?.restart();toast('Partida reiniciada. Camina hasta la entrada del hospital.');}
function setPaused(value){state.paused=value;state.keys.clear();state.player.walking=false;$('pause-overlay').hidden=!value;$('pause-btn').textContent=value?'▶':'Ⅱ';$('pause-btn').setAttribute('aria-label',value?'Continuar juego':'Pausar juego');contextHUD();}

function refreshClinicalForm(target){
  ambience.play('pen');
  const scroll=$('panel-body').scrollTop;consultation(currentTab);$('panel-body').scrollTop=scroll;
  const keys=['field','studyBundle','interpretationChoice','planChoice','followupChoice'];
  const key=keys.find(k=>target?.dataset?.[k]!==undefined);
  if(key){const attr=key.replace(/[A-Z]/g,c=>'-'+c.toLowerCase());$('panel-body').querySelector?.(`[data-${attr}="${target.dataset[key]}"]`)?.focus({preventScroll:true});}
}
function updateClinicalField(e){
  if(state.clinical.outcome)return;const target=e.target,c=state.clinical,d=c.decisions;
  if(target.dataset?.field){
    const field=target.dataset.field,value=String(target.value||'').slice(0,2000);
    if(Hector.isHector(activeCase)&&Hector.nextStep(d)>0)return;
    if(Valeria.isValeria(activeCase)&&Valeria.nextStep(d)>0)return;
    if(Ernesto.isErnesto(activeCase)&&Ernesto.nextStep(d)>0)return;
    if(Lucia.isLucia(activeCase)&&Lucia.nextStep(d)>0)return;
    if(Andres.isAndres(activeCase)&&Andres.nextStep(d)>0)return;
    if(Rosa.isRosa(activeCase)&&Rosa.nextStep(d)>0)return;
    if(Diego.isDiego(activeCase)&&Diego.nextStep(d)>0)return;
    if(Elena.isElena(activeCase)&&Elena.nextStep(d)>0)return;
    if(Sofia.isSofia(activeCase)&&Sofia.nextStep(d)>0)return;
    if(field==='diagnosis'&&(value===''||DIAGNOSIS_CATALOG.some(x=>x.id===value))){
      if(d.diagnosis!==value)Object.assign(d,{diagnosis:value,autoFailedByDiagnosis:false,interpretationChoice:'',sctChoice:'',kftFibrosisChoice:'',plan:[],planChoice:'',followup:[],followupChoice:'',schedules:{}});
    }
    save();if(e.type==='change'&&target.tagName==='SELECT')refreshClinicalForm(target);return;
  }
  
if(target.dataset?.calculationInput){
  const activeTool=clinicalUI.tool;
  if(!clinicalUI.toolInputs[activeTool])clinicalUI.toolInputs[activeTool]={};
  clinicalUI.toolInputs[activeTool][target.dataset.calculationInput]=target.value;

  if(activeTool&&state.clinical.calculations&&activeTool in state.clinical.calculations){
    delete state.clinical.calculations[activeTool];
    $('panel-body').querySelector('.calculation-output')?.remove();
    save();
  }
  return;
}

}
$('panel-body').addEventListener('input',updateClinicalField);
$('panel-body').addEventListener('change',updateClinicalField);

$('panel-body').addEventListener('input',e=>{
  if(!e.target.matches('.hp-diagnosis-search'))return;

  const normalize=text=>text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .toLowerCase();

  const term=normalize(e.target.value.trim());
  const picker=e.target.closest('.hp-diagnosis-picker');
  const cards=[...picker.querySelectorAll('.hp-diagnosis-option')];

  for(const card of cards){
    card.hidden=!normalize(card.textContent).includes(term);
  }

  picker.querySelector('.hp-diagnosis-empty').hidden=
    cards.some(card=>!card.hidden);
});

$('panel-body').addEventListener('click',e=>{
  const nbTabBtn=e.target.closest('[data-nb-tab]');
  if(nbTabBtn){
    ambience.play('paper');
    notebookState.tab = nbTabBtn.dataset.nbTab;
    openDeskNotebook(notebookState.tab);
    return;
  }
  const nbFilterBtn = e.target.closest('[data-nb-filter]');
  if (nbFilterBtn) {
    ambience.play('paper');
    notebookState.filter = nbFilterBtn.dataset.nbFilter;
    openDeskNotebook();
    return;
  }
  const nbSlotPick = e.target.closest('[data-nb-slot-pick]');
  if (nbSlotPick) {
    ambience.play('paper');
    const clueId = nbSlotPick.dataset.nbSlotPick;
    if (!notebookState.selectedPair) notebookState.selectedPair = [];
    if (notebookState.selectedPair.includes(clueId)) {
      notebookState.selectedPair = notebookState.selectedPair.map(id => id === clueId ? null : id);
    } else if (!notebookState.selectedPair[0]) {
      notebookState.selectedPair[0] = clueId;
    } else if (!notebookState.selectedPair[1]) {
      notebookState.selectedPair[1] = clueId;
    } else {
      notebookState.selectedPair = [notebookState.selectedPair[1], clueId];
    }
    openDeskNotebook('relations');
    return;
  }
  const nbSlotRemove = e.target.closest('[data-nb-slot-remove]');
  if (nbSlotRemove) {
    ambience.play('paper');
    const slotIdx = Number(nbSlotRemove.dataset.nbSlotRemove) - 1;
    if (notebookState.selectedPair && notebookState.selectedPair[slotIdx]) {
      notebookState.selectedPair[slotIdx] = null;
    }
    openDeskNotebook('relations');
    return;
  }
  const nbRelateClear = e.target.closest('[data-nb-relate-clear]');
  if (nbRelateClear) {
    ambience.play('paper');
    notebookState.selectedPair = [];
    openDeskNotebook('relations');
    return;
  }
  const nbRelatePick = e.target.closest('[data-nb-relate-pick]');
  if (nbRelatePick) {
    ambience.play('folder');
    const clueId = nbRelatePick.dataset.nbRelatePick;
    notebookState.selectedPair = [clueId];
    openDeskNotebook('relations');
    return;
  }
  const nbSetRel = e.target.closest('[data-nb-set-relation]');
  if (nbSetRel) {
    ambience.play('pen');
    const relId = nbSetRel.dataset.nbSetRelation;
    const optId = nbSetRel.dataset.nbOption;
    const nb = getActiveNotebook();
    nb.relations[relId] = optId;
    save();
    lastNotebookAnimatedTarget = '.hp-nb-deduction-workbench';
    openDeskNotebook('relations');
    return;
  }
  const nbDeleteRel = e.target.closest('[data-nb-delete-relation]');
  if (nbDeleteRel) {
    ambience.play('paper');
    const relId = nbDeleteRel.dataset.nbDeleteRelation;
    const nb = getActiveNotebook();
    if (nb.relations && relId in nb.relations) {
      delete nb.relations[relId];
      save();
    }
    openDeskNotebook('relations');
    return;
  }
  const nbLoadRel = e.target.closest('[data-nb-load-relation]');
  if (nbLoadRel) {
    ambience.play('paper');
    const relId = nbLoadRel.dataset.nbLoadRelation;
    const Investigation = window.ClinicalInvestigation || window.HepatoDay1Modules['clinical-investigation.mjs'];
    const relations = Investigation ? Investigation.getCaseRelations(activeCase) : [];
    const found = relations.find(r => r.id === relId);
    if (found && Array.isArray(found.clues) && found.clues.length === 2) {
      notebookState.selectedPair = [found.clues[0], found.clues[1]];
    }
    openDeskNotebook('relations');
    return;
  }
  const nbSuspSelect = e.target.closest('[data-nb-select-suspicion]');
  if (nbSuspSelect) {
    ambience.play('paper');
    notebookState.selectedSuspicion = nbSuspSelect.dataset.nbSelectSuspicion;
    openDeskNotebook('suspicions');
    return;
  }
  const nbSetStatus = e.target.closest('[data-nb-set-status]');
  if (nbSetStatus) {
    ambience.play('pen');
    const status = nbSetStatus.dataset.nbSetStatus;
    const suspKey = notebookState.selectedSuspicion || 'masld';
    const nb = getActiveNotebook();
    if (nb.suspicions[suspKey]) {
      nb.suspicions[suspKey].status = status;
      save();
      openDeskNotebook('suspicions');
    }
    return;
  }
  const nbAssignPro = e.target.closest('[data-nb-assign-pro]');
  if (nbAssignPro) {
    ambience.play('pen');
    const clueId = nbAssignPro.dataset.nbAssignPro;
    const suspKey = notebookState.selectedSuspicion || 'masld';
    const nb = getActiveNotebook();
    const susp = nb.suspicions[suspKey];
    if (susp) {
      if (!susp.pros.includes(clueId)) susp.pros.push(clueId);
      susp.cons = susp.cons.filter(id => id !== clueId);
      save();
      openDeskNotebook('suspicions');
    }
    return;
  }
  const nbAssignCon = e.target.closest('[data-nb-assign-con]');
  if (nbAssignCon) {
    ambience.play('pen');
    const clueId = nbAssignCon.dataset.nbAssignCon;
    const suspKey = notebookState.selectedSuspicion || 'masld';
    const nb = getActiveNotebook();
    const susp = nb.suspicions[suspKey];
    if (susp) {
      if (!susp.cons.includes(clueId)) susp.cons.push(clueId);
      susp.pros = susp.pros.filter(id => id !== clueId);
      save();
      openDeskNotebook('suspicions');
    }
    return;
  }
  const nbRemovePro = e.target.closest('[data-nb-remove-pro]');
  if (nbRemovePro) {
    ambience.play('paper');
    const clueId = nbRemovePro.dataset.nbRemovePro;
    const suspKey = notebookState.selectedSuspicion || 'masld';
    const nb = getActiveNotebook();
    const susp = nb.suspicions[suspKey];
    if (susp) {
      susp.pros = susp.pros.filter(id => id !== clueId);
      save();
      openDeskNotebook('suspicions');
    }
    return;
  }
  const nbRemoveCon = e.target.closest('[data-nb-remove-con]');
  if (nbRemoveCon) {
    ambience.play('paper');
    const clueId = nbRemoveCon.dataset.nbRemoveCon;
    const suspKey = notebookState.selectedSuspicion || 'masld';
    const nb = getActiveNotebook();
    const susp = nb.suspicions[suspKey];
    if (susp) {
      susp.cons = susp.cons.filter(id => id !== clueId);
      save();
      openDeskNotebook('suspicions');
    }
    return;
  }
  const nbPin = e.target.closest('[data-nb-pin]');
  if (nbPin) {
    ambience.play('paper');
    const clueId = nbPin.dataset.nbPin;
    const nb = getActiveNotebook();
    if (nb.pinnedClues.includes(clueId)) {
      nb.pinnedClues = nb.pinnedClues.filter(id => id !== clueId);
    } else {
      nb.pinnedClues.push(clueId);
      if(tutorialLibretaPendiente)tutorialEstudiosPendientes=true;
      tutorialLibretaPendiente=false;
    }
    save();
    openDeskNotebook('clues');
    return;
  }
  const trayOpenBtn = e.target.closest('[data-tray-open]');
  if (trayOpenBtn) {
    ambience.play('paper');
    trayState.lastJustReviewedId = null;
    openDeskStudiesTray(trayOpenBtn.dataset.trayOpen);
    return;
  }
  const trayBackBtn = e.target.closest('[data-tray-back]');
  if (trayBackBtn) {
    ambience.play('paper');
    trayState.lastJustReviewedId = null;
    openDeskStudiesTray(null);
    return;
  }
  const trayReviewBtn = e.target.closest('[data-tray-review]');
  if (trayReviewBtn) {
    const studyId = trayReviewBtn.dataset.trayReview;
    if (reviewResult(state.clinical, activeCase, studyId)) {
      ambience.play('paper');
      save();
      hud();
      syncDeskViewTray();
      syncDeskViewNotebook(true);
      const study = STUDY_CATALOG.find(s => s.id === studyId);
      const rec = Array.isArray(state.clinical.received) ? state.clinical.received : [];
      const rev = Array.isArray(state.clinical.reviewed) ? state.clinical.reviewed : [];
      const curIdx = rec.indexOf(studyId);
      const nextPending =
        (curIdx >= 0 ? rec.slice(curIdx + 1).find(id => !rev.includes(id)) : null) ||
        rec.find(id => !rev.includes(id)) ||
        null;
      trayState.lastJustReviewedId = studyId;
      if (nextPending) {
        const nextStudy = STUDY_CATALOG.find(s => s.id === nextPending);
        toast(`${study ? study.title : studyId}: revisado · Abriendo ${nextStudy ? nextStudy.title : nextPending}.`);
        openDeskStudiesTray(nextPending);
      } else {
        toast('Todos los informes disponibles fueron revisados.');
        openDeskStudiesTray(studyId);
      }
      const trayAnimEl = $('panel-body')?.querySelector('.hp-tray-auto-advance-banner, .hp-tray-all-reviewed-banner, .hp-tray-review-badge.is-reviewed');
      if (trayAnimEl) animatePopElement(trayAnimEl, { fromScale: 0.94, fromY: 6, duration: 260 });
    }
    return;
  }
  const trayActionClose = e.target.closest('[data-tray-action="close"]');
  if (trayActionClose) {
    ambience.play('paper');
    closePanel();
    return;
  }
  const b=e.target.closest('button');if(!b||b.disabled)return;
  if(b.dataset.action==='tutorial-consultorio-paso'){tutorialConsultorio(Number(b.dataset.paso));return;}
  if(b.dataset.action==='tutorial-consultorio-omitir'){consultation(tutorialConsultorioTab);return;}
  if(b.dataset.action==='tutorial-consultorio-iniciar'){tutorialHistoriaActiva=true;consultation('history');return;}
  if(b.dataset.action==='tutorial-consultorio-detener'){tutorialHistoriaActiva=false;tutorialExamenPendiente=false;tutorialLibretaPendiente=false;tutorialEstudiosPendientes=false;tutorialCierrePendiente=false;consultation(currentTab);return;}
  if(b.dataset.action==='tutorial-libreta-omitir'){tutorialLibretaPendiente=false;if(currentPanel==='notebook-panel')openDeskNotebook(notebookState.tab);else consultation(currentTab);return;}
  if(b.dataset.action==='tutorial-estudios-omitir'){tutorialEstudiosPendientes=false;if(currentPanel==='notebook-panel')openDeskNotebook(notebookState.tab);else consultation(currentTab);return;}
  if(b.dataset.action==='tutorial-cierre-omitir'){tutorialCierrePendiente=false;consultation(currentTab);return;}
  if(b.dataset.action==='open-tray'){
    ambience.play('paper');
    openDeskStudiesTray(b.dataset.trayTarget || null);
    return;
  }
  if(b.dataset.action==='open-notebook'){openDeskNotebook();return;}
  if(b.dataset.action==='elena-phone-next'){nextElenaPhoneLine();return;}
  if(b.dataset.tab){ambience.play('paper');consultation(b.dataset.tab);return;}
  if(b.dataset.record!==undefined){ambience.play('paper');reviewRecord(Number(b.dataset.record));return;}
  if(b.dataset.archiveDay!==undefined){ambience.play('paper');reviewArchivedRecord(Number(b.dataset.archiveDay),Number(b.dataset.archiveRecord));return;}
  if(b.dataset.action==='next-day'){beginNextDay();return;}
  if(b.dataset.action==='review-patients'){const heading=$('jornada-pacientes');if(heading){heading.scrollIntoView({block:'start'});heading.focus({preventScroll:true});}return;}
  if(b.dataset.phoneAction){
    ambience.play('paper');
    if(b.dataset.phoneAction==='call-reception'){
      phoneState.view='reception';
      phoneState.replyKey='greeting';
      openDeskPhone();
    } else if(b.dataset.phoneAction==='call-staff'){
      phoneState.view='staff';
      phoneState.replyKey='greeting';
      openDeskPhone();
    } else if(b.dataset.phoneAction==='call-emergency'){
      phoneState.view='emergency';
      phoneState.replyKey='greeting';
      openDeskPhone();
    } else if(b.dataset.phoneAction==='call-history'){
      phoneState.view='history';
      phoneState.replyKey='greeting';
      openDeskPhone();
    } else if(b.dataset.phoneAction==='trigger-elena-code-red'){
      if(Elena.isElena(activeCase) && !state.clinical.emergencyHelpCalled && !state.elenaWrong){
        recordPhoneCallLog('INT 109', 'Guardia y Emergencias', 'Código Rojo activado por teléfono desde el Consultorio 1 para asistir y trasladar a Elena.');
        activarCodigoRojoElena();
      }
    } else if(b.dataset.phoneAction==='back-to-emergency'){
      phoneState.view='menu';
      phoneState.replyKey='greeting';
      consultation();
    } else if(b.dataset.phoneAction==='menu'){
      phoneState.view='menu';
      phoneState.replyKey='greeting';
      openDeskPhone();
    }
    return;
  }
  if(b.dataset.phoneAsk){
    ambience.play('beep');
    phoneState.replyKey=b.dataset.phoneAsk;
    openDeskPhone();
    return;
  }
  
if(b.dataset.tool){
  if(['fib4','r','meldNa','meld3','childPugh'].includes(b.dataset.tool)){
    ambience.play('beep');
    clinicalUI.tool=b.dataset.tool;
    refreshCalculator();
  }
  return;
}

  if(b.dataset.orderGroup){if(STUDY_GROUPS.includes(b.dataset.orderGroup)){ambience.play('paper');clinicalUI.orderGroup=b.dataset.orderGroup;consultation('orders');}return;}
  
  if(b.dataset.diagnosisChoice){
    if(currentPanel!=='consultation'||
       currentTab!=='decisions'||
       state.clinical.outcome)return;

    const picker=b.closest('.hp-diagnosis-picker');
    const select=picker?.querySelector(
      'select[data-field="diagnosis"]'
    );

    if(!select||
       !DIAGNOSIS_CATALOG.some(
         x=>x.id===b.dataset.diagnosisChoice
       ))return;

    ambience.play('pen');
    select.value=b.dataset.diagnosisChoice;

    // Utilizar el registro original del diagnóstico.
    select.dispatchEvent(
      new Event('input',{bubbles:true})
    );

    picker.querySelectorAll('.hp-diagnosis-option')
      .forEach(card=>{
        const chosen=card===b;
        card.classList.toggle('selected',chosen);
        card.setAttribute('aria-pressed',String(chosen));
        card.querySelector('.hp-diagnosis-mark').textContent=
          chosen?'✓':'◇';
      });

    const next=$('panel-body').querySelector(
      '[data-action="next-decision"]'
    );

    if(next)next.disabled=false;
    return;
  }

  if(b.dataset.applyNbDiagnosis){
    if(currentPanel!=='consultation'||currentTab!=='decisions'||state.clinical.outcome)return;
    const diagId=b.dataset.applyNbDiagnosis;
    if(!DIAGNOSIS_CATALOG.some(x=>x.id===diagId))return;
    ambience.play('pen');
    if(state.clinical.decisions.diagnosis!==diagId){
      Object.assign(state.clinical.decisions,{diagnosis:diagId,autoFailedByDiagnosis:false,interpretationChoice:'',sctChoice:'',kftFibrosisChoice:'',plan:[],planChoice:'',followup:[],followupChoice:'',schedules:{}});
    }
    save();
    consultation('decisions');
    toast('Diagnóstico principal aplicado desde tu sospecha prioritaria de la libreta.');
    return;
  }

  const action=b.dataset.action;
  if(action==='salir-pasillo'){
  if(state.paused||movementBusy()){
    toast('Termina el traslado o continúa el turno antes de salir.');
    return;
  }

  if(typeof window.HP_VOLVER_AL_PASILLO!=='function'){
    toast('No se pudo conectar el regreso al pasillo.');
    return;
  }

  if(state.player.seated){
    closePanel();
    standPlayer();
    toast('Acércate a la puerta para salir al pasillo.');
    return;
  }

  state.keys.clear();
  state.player.path=[];
  state.player.walking=false;
  state.pendingAction=null;

  closePanel();
  save();

  if(sceneExpanded)expandScene(false);

  window.HP_VOLVER_AL_PASILLO();
  return;
}
// ELENA — Iniciar animación desde el evento narrativo.
if (action === 'elena-mirar') {
  if (
    currentPanel !== 'emergency-intro' ||
    state.campaign.day !== 2 ||
    state.campaign.index !== 2 ||
    !Elena.isElena(activeCase)
  ) return;

  state.elenaEmergency = {
    phase: 'playing',
    inicioVisual: elapsed,
    povDone: false
  };
  state.clinical.elenaEmergencyPhase = 'playing';
  syncElenaMusic();
  save();

  closePanel();
  $('toast').classList.remove('visible');
  syncDeskView();
  syncClinicalLayout();

  state.keys.clear();
  state.player.path = [];
  state.player.walking = false;

  return;
}
  if(action==='close'){closePanel();return;}
  if(action==='agenda'){agenda();return;}
  if(action==='export-game'){exportGame();return;}
  if(action==='choose-game'){chooseGame();return;}
  if(action==='cancel-load'){pendingLoadedGame=null;agenda();return;}
  if(action==='apply-load'){applyGame();return;}
  if(action==='next-patient'){nextPatient();return;}
  if(action==='return-visit'){startReturnVisit();return;}
  if(action==='solo-menu'){save();window.HP_SHOW_HOME();return;}
  if(action==='restart-round'){restartRound();return;}
  if(action==='reset'){reset();return;}
  if(action==='stand'){closePanel();standPlayer();return;}
  if(action==='open-monitor-orders'){consultation('orders');return;}
  if(b.dataset.challengeChoice){
    if(currentPanel!=='consultation'||currentTab!=='decisions')return;
    const answer=answerChallenge(state.clinical,activeCase,b.dataset.challengeChoice);
    if(answer){save();consultation('decisions');toast(answer.correct?'Reto resuelto: +1 punto extra.':'Reto registrado. La explicación te ayuda a revisar la decisión.');}
    return;
  }
  if(b.dataset.returnChoice){
    if(currentPanel==='return-visit'&&chooseReturnVisit(state.clinical,activeCase,b.dataset.returnChoice)){
      ambience.play('paper');hud();returnVisitPanel();$('panel-body').scrollTop=0;
    }
    return;
  }
  
if (action === 'cerrar-consulta-inicial-demo') {
  if(despedirConsultaInicialDemo())tutorialCierrePendiente=false;
  return;
}

const c=state.clinical;if(c.outcome)return;


if (action === 'continuar-sin-estudios-demo') {
  if (!estudiosDiferidosDemo() || c.orders.length) return;
  if(tutorialEstudiosPendientes)tutorialCierrePendiente=true;
  tutorialEstudiosPendientes=false;
  clinicalUI.continuarSinEstudiosDemo = true;
  consultation('orders');
  return;
}

if (action === 'alternar-agenda-demo') {
  if (!estudiosDiferidosDemo() || !c.hypothesis) return;

  clinicalUI.agendaDemoVisible =
    !clinicalUI.agendaDemoVisible;

  consultation('orders');
  return;
}

if (action === 'reservar-demo') {
  if (!estudiosDiferidosDemo() || !c.hypothesis) return;

  const turno = Number(b.dataset.turno);

  if (![2, 3].includes(turno)) return;

  const citas = state.campaign.appointments ||
    (state.campaign.appointments = []);

  if (citas.some(a => a.caseId === activeCase.id)) {
    toast('Este paciente ya tiene una reconsulta.');
    return;
  }

  if (citas.some(a =>
    a.day === 2 && a.slot === turno
  )) {
    toast('Ese turno ya está ocupado.');
    return;
  }

  citas.push({
    caseId: activeCase.id,
    day: 2,
    slot: turno
  });

  save();
  hud();
  consultation('orders');

  toast(
    `${activeCase.patient.name}: reconsulta reservada para el Día 2.`
  );
  return;
}


if (b.dataset.impresionChoice) {
  if (
    !estudiosDiferidosDemo() ||
    c.hypothesis ||
    (!c.orders.length && !clinicalUI.continuarSinEstudiosDemo)
  ) return;

  const permitidos = Martin.isMartin(activeCase)
    ? ['masld','hfe','alcohol','dili','undetermined']
    : ['gilbert','hemolysis','acute-hepatitis',
       'obstruction','undetermined'];

  const id = b.dataset.impresionChoice;

  if (!permitidos.includes(id)) return;

  const diagnostico =
    DIAGNOSIS_CATALOG.find(d => d.id === id);

  if (!diagnostico) return;

  c.hypothesisDraft.text = diagnostico.title;
  c.hypothesisDraft.differential = '';
  c.hypothesisDraft.rationale =
    'Impresión preliminar elegida antes de recibir resultados.';

  if (!recordHypothesis(c)) {
    toast('No se pudo registrar la impresión.');
    return;
  }

  if (c.orderLog.length) {
    c.orderLog.at(-1).hypothesis = {...c.hypothesis};
  }

  ambience.play('pen');
  save();
  hud();
  consultation('orders');
  toast('Impresión diagnóstica registrada.');
  return;
}


if (b.dataset.topic) {
  const tema = b.dataset.topic;
  triggerPatientTalking(1600);

  if (!HISTORY_TOPICS.some(x => x.id === tema)) return;

  clinicalUI.historySelectedCase = activeCase.id;
  clinicalUI.historySelectedTopic = tema;

  const preguntaNueva = !c.asked.includes(tema);

  if (preguntaNueva) c.asked.push(tema);
  if (preguntaNueva && tutorialHistoriaActiva){tutorialHistoriaActiva=false;tutorialExamenPendiente=true;}


  c.history = c.asked.length > 0;
  ambience.play('pen');

  const emergenciaDemo =
    state.campaign.day === 2 &&
    state.campaign.index === 2 &&
    Elena.isElena(activeCase) &&
    preguntaNueva &&
    !c.elenaEmergencyPhase;

  if (emergenciaDemo) {
    c.elenaEmergencyPhase = 'intro';
    save();
    hud();
    mostrarIntroElena();
    return;
  }

  save();
  hud();
  syncDeskViewNotebook(true);

  if (currentPanel === 'history' && !deskView.hidden) {
    openDeskPatientTalk();
  } else if (state.player.seated || currentPanel === 'consultation') {
    consultation('history');
  } else {
    talk();
  }

  $('panel-body')
    .querySelector?.('.history-current')
    ?.scrollIntoView?.({block:'nearest'});

  return;
}

  if(b.dataset.studyBundle){if(toggleStudyBundle(c,b.dataset.studyBundle)){save();refreshClinicalForm(b);}return;}
  if(Hector.isHector(activeCase)){
    const step=Hector.nextStep(c.decisions);
    if((b.dataset.sctChoice&&step!==1)||(b.dataset.hectorStudiesChoice&&step!==2)||(b.dataset.planChoice&&step!==3)||(b.dataset.followupChoice&&step!==4))return;
    if(b.dataset.interpretationChoice||b.dataset.martinFibrosisChoice)return;
  }
  if(b.dataset.hectorStudiesChoice){if(Hector.isHector(activeCase)&&Hector.choose(c,'studies',b.dataset.hectorStudiesChoice)){save();refreshClinicalForm(b);}return;}
  if(Valeria.isValeria(activeCase)){
    const step=Valeria.nextStep(c.decisions);
    if((b.dataset.sctChoice&&step!==1)||(b.dataset.valeriaStudiesChoice&&step!==2)||(b.dataset.planChoice&&step!==3)||(b.dataset.followupChoice&&step!==4))return;
    if(b.dataset.interpretationChoice||b.dataset.martinFibrosisChoice)return;
  }
  if(b.dataset.valeriaStudiesChoice){if(Valeria.isValeria(activeCase)&&Valeria.choose(c,'studies',b.dataset.valeriaStudiesChoice)){save();refreshClinicalForm(b);}return;}
  if(Ernesto.isErnesto(activeCase)){
    const step=Ernesto.nextStep(c.decisions);
    if((b.dataset.sctChoice&&step!==1)||(b.dataset.ernestoStudiesChoice&&step!==2)||(b.dataset.planChoice&&step!==3)||(b.dataset.followupChoice&&step!==4))return;
    if(b.dataset.interpretationChoice||b.dataset.martinFibrosisChoice)return;
  }
  if(b.dataset.ernestoStudiesChoice){if(Ernesto.isErnesto(activeCase)&&Ernesto.choose(c,'studies',b.dataset.ernestoStudiesChoice)){save();refreshClinicalForm(b);}return;}
  if(Lucia.isLucia(activeCase)){
    const step=Lucia.nextStep(c.decisions);
    if((b.dataset.sctChoice&&step!==1)||(b.dataset.luciaStudiesChoice&&step!==2)||(b.dataset.planChoice&&step!==3)||(b.dataset.followupChoice&&step!==4))return;
    if(b.dataset.interpretationChoice||b.dataset.martinFibrosisChoice)return;
  }
  if(b.dataset.luciaStudiesChoice){if(Lucia.isLucia(activeCase)&&Lucia.choose(c,'studies',b.dataset.luciaStudiesChoice)){save();refreshClinicalForm(b);}return;}
  if(Andres.isAndres(activeCase)){
    const step=Andres.nextStep(c.decisions);
    if((b.dataset.sctChoice&&step!==1)||(b.dataset.andresStudiesChoice&&step!==2)||(b.dataset.planChoice&&step!==3)||(b.dataset.followupChoice&&step!==4))return;
    if(b.dataset.interpretationChoice||b.dataset.martinFibrosisChoice)return;
  }
  if(b.dataset.andresStudiesChoice){if(Andres.isAndres(activeCase)&&Andres.choose(c,'studies',b.dataset.andresStudiesChoice)){save();refreshClinicalForm(b);}return;}
  if(Rosa.isRosa(activeCase)){
    const step=Rosa.nextStep(c.decisions);
    if((b.dataset.sctChoice&&step!==1)||(b.dataset.rosaStudiesChoice&&step!==2)||(b.dataset.planChoice&&step!==3)||(b.dataset.followupChoice&&step!==4))return;
    if(b.dataset.interpretationChoice||b.dataset.martinFibrosisChoice)return;
  }
  if(b.dataset.rosaStudiesChoice){if(Rosa.isRosa(activeCase)&&Rosa.choose(c,'studies',b.dataset.rosaStudiesChoice)){save();refreshClinicalForm(b);}return;}
  if(Diego.isDiego(activeCase)){
    const step=Diego.nextStep(c.decisions);
    if((b.dataset.sctChoice&&step!==1)||(b.dataset.diegoStudiesChoice&&step!==2)||(b.dataset.planChoice&&step!==3)||(b.dataset.followupChoice&&step!==4))return;
    if(b.dataset.interpretationChoice||b.dataset.martinFibrosisChoice)return;
  }
  if(b.dataset.diegoStudiesChoice){if(Diego.isDiego(activeCase)&&Diego.choose(c,'studies',b.dataset.diegoStudiesChoice)){save();refreshClinicalForm(b);}return;}
  if(Elena.isElena(activeCase)){
    const step=Elena.nextStep(c.decisions);
    if((b.dataset.sctChoice&&step!==1)||(b.dataset.elenaStudiesChoice&&step!==2)||(b.dataset.planChoice&&step!==3)||(b.dataset.followupChoice&&step!==4))return;
    if(b.dataset.interpretationChoice||b.dataset.martinFibrosisChoice)return;
  }
  if(b.dataset.elenaStudiesChoice){if(Elena.isElena(activeCase)&&Elena.choose(c,'studies',b.dataset.elenaStudiesChoice)){save();refreshClinicalForm(b);}return;}
  if(Sofia.isSofia(activeCase)){
    const step=Sofia.nextStep(c.decisions);
    if((b.dataset.sctChoice&&step!==1)||(b.dataset.sofiaStudiesChoice&&step!==2)||(b.dataset.planChoice&&step!==3)||(b.dataset.followupChoice&&step!==4))return;
    if(b.dataset.interpretationChoice||b.dataset.martinFibrosisChoice)return;
  }
  if(b.dataset.sofiaStudiesChoice){if(Sofia.isSofia(activeCase)&&Sofia.choose(c,'studies',b.dataset.sofiaStudiesChoice)){save();refreshClinicalForm(b);}return;}
  if(b.dataset.sctChoice){if(selectSctChoice(c,activeCase,b.dataset.sctChoice)){save();refreshClinicalForm(b);}return;}
  if(b.dataset.martinFibrosisChoice){if(selectMartinFibrosisChoice(c,activeCase,b.dataset.martinFibrosisChoice)){save();refreshClinicalForm(b);}return;}
  if(b.dataset.interpretationChoice){if(selectInterpretationChoice(c,b.dataset.interpretationChoice)){save();refreshClinicalForm(b);}return;}
  if(b.dataset.planChoice){if(selectPlanChoice(c,b.dataset.planChoice,activeCase)){save();refreshClinicalForm(b);}return;}
  if(b.dataset.followupChoice){if(selectFollowupChoice(c,b.dataset.followupChoice,activeCase)){save();refreshClinicalForm(b);}return;}
  if(b.dataset.examCheck!==undefined){
    if(currentPanel!=='physical-exam'||state.clinical.outcome)return;
    const idx=Number(b.dataset.examCheck);
    const totalExam=Array.isArray(activeCase.exam)?activeCase.exam.length:0;
    if(!Number.isInteger(idx)||idx<0||idx>=totalExam)return;
    if(idx>=0&&idx<=2&&openExamMinigame(idx)){
      ambience.play('paper');
      return;
    }
    if(!Array.isArray(state.clinical.examChecks))state.clinical.examChecks=[];
    if(!state.clinical.examChecks.includes(idx))state.clinical.examChecks.push(idx);
    if(state.clinical.examChecks.length>=totalExam)state.clinical.exam=true;
    ambience.play(idx===0?'beep':'pen');
    save();
    hud();
    syncDeskViewNotebook(true);
    examAtBed(idx);
    return;
  }
  if(b.dataset.replayExam!==undefined){
    if(currentPanel!=='physical-exam'||state.clinical.outcome)return;
    const idx=Number(b.dataset.replayExam);
    if(Number.isInteger(idx)&&openExamMinigame(idx))ambience.play('paper');
    return;
  }
  if(action==='exam-check-all'){
    if(currentPanel!=='physical-exam'||state.clinical.outcome)return;
    const totalExam=Array.isArray(activeCase.exam)?activeCase.exam.length:0;
    state.clinical.examChecks=Array.from({length:totalExam},(_,i)=>i);
    state.clinical.exam=true;
    ambience.play('pen');
    save();
    hud();
    syncDeskViewNotebook(true);
    examAtBed(totalExam-1);
    return;
  }
  if(action==='begin-exam')beginExam();
  else if(action==='finish-exam')finishExam();
  else if(action==='open-pc')computerScreen();
  else if(action==='open-desk-calc'){closePanel();openDeskCalculator();}
  
else if (action === 'submit-orders') {
  if(state.campaign.day===2&&(Martin.isMartin(activeCase)||Sofia.isSofia(activeCase))){toast('No hay otra consulta disponible para recibir estudios nuevos.');return;}
  const result = requestStudies(c, c.cart);

  if (!result.ok) {
    toast('Revisa la selección y los requisitos del pedido.');
    return;
  }

  if(tutorialEstudiosPendientes&&estudiosDiferidosDemo())tutorialCierrePendiente=true;
  tutorialEstudiosPendientes=false;

  ambience.play('paper');

  // Martín y Sofía: resultados diferidos.
  if (estudiosDiferidosDemo()) {
    save();
    hud();
    impresionInicial();
    return;
  }

  // Mantener la lógica actual para otros casos.
  receiveStudies(c);
  syncDeskViewTray();

  hud();
  consultation('results');
  toast('Tus resultados están disponibles.');
}

else if (action === 'receive-results') {
  // No permitir recibir resultados el Día 1.
  if (estudiosDiferidosDemo()) {
    impresionInicial();
    return;
  }

  if (!receiveStudies(c)) return;
  syncDeskViewTray();

  hud();
  consultation('results');
}

  
  else if(action==='calculate-tool'){
    const tool=clinicalUI.tool;
    const input=clinicalUI.toolInputs[tool]||{};

    if(tool==='childPugh'){
      const values={
        bilirubin:Number(input.bilirubin),
        albumin:Number(input.albumin),
        inr:Number(input.inr),
        ascites:input.ascites,
        encephalopathy:input.encephalopathy
      };

      const labsValid=['bilirubin','albumin','inr'].every(k=>
        input[k]!==undefined&&
        String(input[k]).trim()!==''&&
        Number.isFinite(values[k])&&
        values[k]>0
      );

      const clinicalValid=
        ['none','mild','severe'].includes(values.ascites)&&
        ['none','mild','severe'].includes(values.encephalopathy);

      if(!labsValid||!clinicalValid){
        toast('Completa los análisis y selecciona ascitis y encefalopatía.');
        return;
      }

      c.calculations.childPugh=calculateChildPugh(values);
      ambience.play('beep');
      save();
      syncDeskViewNotebook(true);
      refreshCalculator();
      animateCalculatorOutput(tool,c.calculations.childPugh);
      return;
    }


    const keys=tool==='fib4'
      ?['age','ast','alt','platelets']
      :tool==='r'
        ?['alt','altLimit','alp','alpLimit']
        :tool==='meld3'
          ?['bilirubin','inr','creatinine','sodium','albumin']
          :['bilirubin','inr','creatinine','sodium'];

    const invalid=keys.some(k=>
      input[k]===undefined||
      String(input[k]).trim()===''||
      !Number.isFinite(Number(input[k]))||
      Number(input[k])<=0
    );

    const meld=tool==='meldNa'||tool==='meld3';

    if(invalid||(meld&&(
      Number(input.sodium)<100||
      Number(input.sodium)>180
    ))){
      toast('Revisa los valores y las unidades antes de calcular.');
      return;
    }

    const values=Object.fromEntries(
      keys.map(k=>[k,Number(input[k])])
    );

    if(meld){
      values.dialysis=input.dialysis==='yes'?'yes':'no';
    }

    if(tool==='meld3'){
      if(activeCase.patient.age<18){
        toast('Esta fórmula MELD 3.0 está implementada para adultos.');
        return;
      }
      values.female=activeCase.patient.sex==='Femenino';
    }

    c.calculations[tool]=tool==='fib4'
      ?fib4(values)
      :tool==='r'
        ?(values.alt/values.altLimit)/(values.alp/values.alpLimit)
        :tool==='meldNa'
          ?calculateMeldNa(values)
          :calculateMeld3(values);

    ambience.play('beep');
    save();
    syncDeskViewNotebook(true);
    refreshCalculator();
    animateCalculatorOutput(tool,c.calculations[tool]);
  }


  else if(action==='previous-decision'){
    if(Hector.isHector(activeCase))return;
    if(Valeria.isValeria(activeCase))return;
    if(Ernesto.isErnesto(activeCase))return;
    if(Lucia.isLucia(activeCase))return;
    if(Andres.isAndres(activeCase))return;
    if(Rosa.isRosa(activeCase))return;
    if(Diego.isDiego(activeCase))return;
    if(Elena.isElena(activeCase))return;
    if(Sofia.isSofia(activeCase))return;
    ambience.play('paper');
    clinicalUI.decisionStep=Math.max(Martin.isMartin(activeCase)?1:0,clinicalUI.decisionStep-1);
    consultation('decisions');$('panel-body').scrollTop=0;
  }
  else if(action==='next-decision'){
    const currentStep=Hector.isHector(activeCase)?Hector.nextStep(c.decisions):Valeria.isValeria(activeCase)?Valeria.nextStep(c.decisions):Ernesto.isErnesto(activeCase)?Ernesto.nextStep(c.decisions):Lucia.isLucia(activeCase)?Lucia.nextStep(c.decisions):Andres.isAndres(activeCase)?Andres.nextStep(c.decisions):Rosa.isRosa(activeCase)?Rosa.nextStep(c.decisions):Diego.isDiego(activeCase)?Diego.nextStep(c.decisions):Elena.isElena(activeCase)?Elena.nextStep(c.decisions):Sofia.isSofia(activeCase)?Sofia.nextStep(c.decisions):clinicalUI.decisionStep;
    // Al avanzar sin los datos de esta pregunta, registrar la omisión sin revelar resultados.
    if(currentStep>0){
      const pilot=Martin.isMartin(activeCase)?Martin:Sofia.isSofia(activeCase)?Sofia:Elena.isElena(activeCase)?Elena:null;
      if(pilot?.missing(c,currentStep).length){
        const kind=['','sct','studies','plan','followup'][currentStep];
        if(pilot===Martin){
          if(kind==='sct')selectSctChoice(c,activeCase,'missing-evidence');
          else if(kind==='studies')selectMartinFibrosisChoice(c,activeCase,'missing-evidence');
          else if(kind==='plan')selectPlanChoice(c,'missing-evidence',activeCase);
          else if(kind==='followup')selectFollowupChoice(c,'missing-evidence',activeCase);
        }else pilot.choose(c,kind,'missing-evidence');
      }
    }
    if(currentStep===0&&c.decisions.diagnosis&&c.decisions.diagnosis!==activeCase.rubric.diagnosis){
      c.decisions.autoFailedByDiagnosis=true;
      c.outcome=assessConsultation(c,activeCase);
      save();hud();consultation('decisions');$('panel-body').scrollTop=0;
      ambience.play('stamp');
      toast('Diagnóstico incorrecto: todas las preguntas se calificaron como incorrectas.');
      return;
    }
    if(Hector.isHector(activeCase)){
      const step=Hector.nextStep(c.decisions);
      if(!Hector.validStep(c,step))return;
      if(step<4){c.decisions.hectorStep=step+1;clinicalUI.decisionStep=step+1;save();consultation('decisions');$('panel-body').scrollTop=0;}
      else if(decisionsComplete(c,{caseData:activeCase})){c.outcome=assessConsultation(c,activeCase);save();hud();consultation('decisions');}
    }else if(Valeria.isValeria(activeCase)){
      const step=Valeria.nextStep(c.decisions);
      if(!Valeria.validStep(c,step))return;
      if(step<4){c.decisions.valeriaStep=step+1;clinicalUI.decisionStep=step+1;save();consultation('decisions');$('panel-body').scrollTop=0;}
      else if(decisionsComplete(c,{caseData:activeCase})){c.outcome=assessConsultation(c,activeCase);save();hud();consultation('decisions');}
    }else if(Ernesto.isErnesto(activeCase)){
      const step=Ernesto.nextStep(c.decisions);
      if(!Ernesto.validStep(c,step))return;
      if(step<4){c.decisions.ernestoStep=step+1;clinicalUI.decisionStep=step+1;save();consultation('decisions');$('panel-body').scrollTop=0;}
      else if(decisionsComplete(c,{caseData:activeCase})){c.outcome=assessConsultation(c,activeCase);save();hud();consultation('decisions');}
    }else if(Lucia.isLucia(activeCase)){
      const step=Lucia.nextStep(c.decisions);
      if(!Lucia.validStep(c,step))return;
      if(step<4){c.decisions.luciaStep=step+1;clinicalUI.decisionStep=step+1;save();consultation('decisions');$('panel-body').scrollTop=0;}
      else if(decisionsComplete(c,{caseData:activeCase})){c.outcome=assessConsultation(c,activeCase);save();hud();consultation('decisions');}
    }else if(Andres.isAndres(activeCase)){
      const step=Andres.nextStep(c.decisions);
      if(!Andres.validStep(c,step))return;
      if(step<4){c.decisions.andresStep=step+1;clinicalUI.decisionStep=step+1;save();consultation('decisions');$('panel-body').scrollTop=0;}
      else if(decisionsComplete(c,{caseData:activeCase})){c.outcome=assessConsultation(c,activeCase);save();hud();consultation('decisions');}
    }else if(Rosa.isRosa(activeCase)){
      const step=Rosa.nextStep(c.decisions);
      if(!Rosa.validStep(c,step))return;
      if(step<4){c.decisions.rosaStep=step+1;clinicalUI.decisionStep=step+1;save();consultation('decisions');$('panel-body').scrollTop=0;}
      else if(decisionsComplete(c,{caseData:activeCase})){c.outcome=assessConsultation(c,activeCase);save();hud();consultation('decisions');}
    }else if(Diego.isDiego(activeCase)){
      const step=Diego.nextStep(c.decisions);
      if(!Diego.validStep(c,step))return;
      if(step<4){c.decisions.diegoStep=step+1;clinicalUI.decisionStep=step+1;save();consultation('decisions');$('panel-body').scrollTop=0;}
      else if(decisionsComplete(c,{caseData:activeCase})){c.outcome=assessConsultation(c,activeCase);save();hud();consultation('decisions');}
    }else if(Elena.isElena(activeCase)){
      const step=Elena.nextStep(c.decisions);
      if(!Elena.validStep(c,step))return;
      if(step<4){c.decisions.elenaStep=step+1;clinicalUI.decisionStep=step+1;save();consultation('decisions');$('panel-body').scrollTop=0;}
      else if(decisionsComplete(c,{caseData:activeCase})){c.outcome=assessConsultation(c,activeCase);save();hud();consultation('decisions');}
    }else if(Sofia.isSofia(activeCase)){
      const step=Sofia.nextStep(c.decisions);
      if(!Sofia.validStep(c,step))return;
      if(step<4){c.decisions.sofiaStep=step+1;clinicalUI.decisionStep=step+1;save();consultation('decisions');$('panel-body').scrollTop=0;}
      else if(decisionsComplete(c,{caseData:activeCase})){c.outcome=assessConsultation(c,activeCase);save();hud();consultation('decisions');}
    }else if(Martin.isMartin(activeCase)){
      const d=c.decisions,step=clinicalUI.decisionStep;
      const ready=[!!d.diagnosis,!!Martin.lookup(Martin.sct,d.sctChoice)&&(c.reviewed.length>0||d.sctChoice==='missing-evidence'),!!Martin.lookup(Martin.fibrosis,d.kftFibrosisChoice),!!Martin.lookup(Martin.plans,d.planChoice),!!Martin.lookup(Martin.followups,d.followupChoice)];
      if(!ready[step])return;
      if(step<4){clinicalUI.decisionStep++;save();consultation('decisions');$('panel-body').scrollTop=0;}
      else if(decisionsComplete(c,{caseData:activeCase})){c.outcome=assessConsultation(c,activeCase);save();hud();consultation('decisions');}
    }else if(clinicalUI.decisionStep<3){
      if(clinicalUI.decisionStep===0&&!c.decisions.diagnosis||clinicalUI.decisionStep===1&&!c.decisions.interpretationChoice||clinicalUI.decisionStep===2&&!c.decisions.plan.length)return;
      clinicalUI.decisionStep++;save();consultation('decisions');$('panel-body').scrollTop=0;
    }else if(decisionsComplete(c)){c.outcome=assessConsultation(c,activeCase);save();hud();consultation('decisions');}
    ambience.play(c.outcome?'stamp':'paper');
  }
});
$('history-btn').onclick=()=>goTo('patient');$('desk-btn').onclick=()=>goTo('chair');
$('exam-btn').onclick=beginExam;
$('next-patient-btn').onclick=nextPatient;$('agenda-btn').onclick=agenda;
$('load-game-file').addEventListener('change',previewGameFile);
$('interact-btn').onclick=interact;$('touch-interact').onclick=interact;
$('map-nav').onclick=hospitalMap;$('room-nav').onclick=()=>{if(panel.open)closePanel();canvas.focus({preventScroll:true});};
for(const id of ['help-top','help-nav','controls-btn'])$(id).onclick=help;
$('reset-btn').onclick=()=>state.campaign.finished?confirmRoundReset():confirmReset();$('pause-btn').onclick=()=>setPaused(!state.paused);$('resume-btn').onclick=()=>setPaused(false);
$('restart-game-btn').onclick=()=>confirmRoundReset(true);
$('return-visit-btn').onclick=startReturnVisit;
$('speed-btn').onclick=()=>{state.settings.fastTransfers=!state.settings.fastTransfers;hud();toast(state.settings.fastTransfers?'Traslados a 3×. Puedes volver a 1× cuando quieras.':'Traslados a velocidad normal.');};
$('sound-btn').onclick=async()=>{
  state.settings.sound=!state.settings.sound;ambience.setEnabled(state.settings.sound);syncElenaMusic();
  save(); hud();
  window.HP_UPDATE_ARRIVAL_SOUND_BTN?.(state.settings.sound);
  if(!state.settings.sound){toast('Sonido apagado.');return;}
  const ready=await ambience.unlock();
  if(!state.settings.sound)return;
  if(!ready){toast('No se pudo activar el audio en este navegador.');return;}
  ambience.play('paper');toast('Sonido activo: pasos, silla y papel.');
};
document.addEventListener('pointerdown',()=>{window.HP_MUSIC?.unlock();if(state.settings.sound)ambience.unlock();},{capture:true});
document.addEventListener('keydown',()=>{window.HP_MUSIC?.unlock();if(state.settings.sound)ambience.unlock();},{capture:true});
const movementKeys={w:[0,-1],arrowup:[0,-1],a:[-1,0],arrowleft:[-1,0],s:[0,1],arrowdown:[0,1],d:[1,0],arrowright:[1,0]};
window.addEventListener('keydown',e=>{
  if(window.HP_SINGLE_VIEW!=='game')return;
  if(state.elenaRescue || state.elenaWrong && state.elenaWrong.phase !== 'done'){
    if(e.key === 'Tab' || (([epilogueButton,epilogueMenu,economicButton].includes(e.target) || e.target.matches?.('.elena-final-email')) && ['Enter',' '].includes(e.key))) return;
    e.preventDefault(); return;
  }
  if(e.key==='Escape'&&sceneExpanded&&!panel.open){e.preventDefault();expandScene(false);return;}
  if(panel.open||e.ctrlKey||e.metaKey||e.altKey||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;
  if(movementBusy()&&e.key!=='Escape'){if(movementKeys[e.key.toLowerCase()])e.preventDefault();return;}
  const k=e.key.toLowerCase();if(movementKeys[k]){e.preventDefault();if(!state.paused){if(state.player.seated){if(!e.repeat)toast('Pulsa Q para levantarte de la silla.');}else{state.keys.add(k);state.player.path=[];state.pendingAction=null;clickPulse=null;}}}
  else if(k==='e'){e.preventDefault();if(!e.repeat)interact();}
  else if(k==='q'&&!e.repeat&&!state.paused)standPlayer();
  else if(k==='escape'&&!e.repeat)setPaused(!state.paused);
});
window.addEventListener('keyup',e=>state.keys.delete(e.key.toLowerCase()));
window.addEventListener('blur',()=>{state.keys.clear();state.player.walking=false;});
document.addEventListener('visibilitychange',()=>{state.keys.clear();state.player.walking=false;last=0;accumulator=0;});
if(typeof bindAnalogJoystick==='function'){
  bindAnalogJoystick(document.getElementById('consult-joystick'),{
    keysSet:state.keys,
    canMove:()=>!state.paused&&!panel.open&&!movementBusy()&&!state.player.seated,
    onBlocked:()=>{if(state.player.seated&&!state.paused&&!panel.open)toast('Levántate desde el menú de consulta.');},
    onMoveStart:()=>{state.player.path=[];state.pendingAction=null;clickPulse=null;},
    onAudioUnlock:()=>{if(typeof ambience?.unlock==='function')ambience.unlock();window.HP_MUSIC?.unlock?.();}
  });
}
canvas.addEventListener('pointerdown',e=>{
  if(panel.open||state.paused||movementBusy())return;e.preventDefault();canvas.focus({preventScroll:true});
  const b=canvas.getBoundingClientRect(),x=(e.clientX-b.left)/b.width*ROOM.width,y=(e.clientY-b.top)/b.height*ROOM.height;
  if(state.clinical.elenaPhone==='ringing' && x>=157 && x<=178 && y>=152 && y<=173){answerElenaPhone();return;}
  const hit=area=>x>=area.x&&x<=area.x+area.w&&y>=area.y&&y<=area.y+area.h;
  if(hit(ROOM.hitAreas.chair)){goTo('chair');return;}
  const patient=state.exam.patient;
  if(patient.visible!==false&&(state.exam.atBed?hit(ROOM.hitAreas.bed):x>=patient.x-SPRITE_CELL.anchorX&&x<=patient.x+SPRITE_CELL.width-SPRITE_CELL.anchorX&&y>=patient.y-SPRITE_CELL.anchorY&&y<=patient.y+SPRITE_CELL.height-SPRITE_CELL.anchorY)){goTo('patient');return;}
  if(hit(ROOM.hitAreas.computer)){goTo('computer');return;}
  if(hit(ROOM.hitAreas.door)){goTo('door');return;}
  if(state.player.seated)standPlayer();
  const path=findPath(state.player,{x,y},sceneRoom());if(path.length){state.player.path=path;state.pendingAction=null;clickPulse={x,y,at:elapsed};}else toast('Ese punto está ocupado. Haz clic en un espacio libre.');
});
function update(dt){
  if(window.HP_SINGLE_VIEW!=='game')return;
  // Bloquear el movimiento durante la emergencia de Elena.
if (state.elenaEmergency?.phase === 'playing' || state.elenaRescue || state.elenaWrong && state.elenaWrong.phase !== 'done') {
  state.player.walking = false;
  return;
}
  if(panel.open||state.paused||document.hidden){state.player.walking=false;return;}
  if(state.visits.busy){
    const event=state.visits.update(state.player,dt);
    if(event==='departed'){
      if(state.visitPurpose==='return-visit'){
        state.exam=new ExamSequence(ROOM,activeCase.patient.appearance);
        state.clinical.seated=state.player.seated;state.visits.arrive(state.exam.patient,state.player);hud();return;
      }
      

if (state.visitPurpose === 'demo-initial') {

  // Sofia fue la ultima consulta inicial del Dia 1.
  if (state.campaign.index === 1) {
    state.campaign.demoDay1Complete = true;
    state.campaign.finished = true;
    state.visitPurpose = '';
    state.exam.patient.visible = false;

    save();
    hud();

    setPanel(
      'Día 1 · Consultas iniciales completas',
      'HOSPITAL PORTAL · FIN DE JORNADA',
      `<p class="panel-copy">
        Martín y Sofía completaron sus primeras consultas.
        Sus estudios continúan pendientes y ambos tienen
        una reconsulta reservada para el Día 2.
      </p>
      <p class="clinical-note">
        Las evaluaciones definitivas se realizarán
        cuando regresen con sus resultados.
      </p>
      <div class="panel-actions">
        <button class="primary-button"
          data-action="next-day">
          Comenzar Día 2 →
        </button>
        <button class="secondary-button"
          data-action="export-game">
          Guardar partida ↓
        </button>
        <button class="secondary-button"
          data-action="solo-menu">
          Volver al menú principal →
        </button>
      </div>`,
      'agenda'
    );
    return;
  }

  state.campaign.index = 1;


  activeCase = SIMULATIONS[1];
  state.clinical = initialConsultation();
  state.clinical.seated = state.player.seated;

  state.exam = new ExamSequence(
    ROOM,
    activeCase.patient.appearance
  );

  clinicalUI.reset();
  currentTab = 'history';
  state.visitPurpose = '';

  if (!state.visits.arrive(
    state.exam.patient,
    state.player
  )) {
    toast('No se pudo iniciar la entrada de Sofía.');
  }

  save();
  hud();
  return;
}

const clinical=advanceCampaign(state.campaign);

      if(state.campaign.finished){save();hud();agenda();}
      else{
        activeCase=SIMULATIONS[state.campaign.index];state.clinical=clinical;state.clinical.seated=state.player.seated;
        state.exam=new ExamSequence(ROOM,activeCase.patient.appearance);clinicalUI.reset();currentTab='history';
        if(!state.visits.arrive(state.exam.patient,state.player))toast('No se pudo iniciar la entrada. Reinicia esta consulta para recuperar el espacio.');
        hud();
      }
    }else if(event==='arrived'){
      const isReturn=state.visitPurpose==='return-visit';state.visitPurpose='';ambience.play('chair');hud();
      toast(isReturn?'Martín vuelve para revisar el plan contigo.':`${activeCase.patient.name} se sentó frente a ti. Comienza una nueva consulta.`);
      if(isReturn)returnVisitPanel();else consultation('history');
    }
    return;
  }
  if(state.exam.busy){
    const event=state.exam.update(state.player,dt);
    if(event==='ready'){hud();examAtBed();}
    else if(event==='complete'){state.clinical.seated=true;hud();toast(`${activeCase.patient.name} volvió a su silla. Elige qué investigar.`);consultation(state.clinical.history?'orders':'history');}
    return;
  }
  if(state.seatTween){state.player.walking=false;return;}
  let dx=0,dy=0;for(const k of state.keys){const d=movementKeys[k];if(d){dx+=d[0];dy+=d[1];}}
  if(dx||dy)movePlayer(state.player,dx,dy,dt,sceneRoom());
  else if(state.player.path.length){followPath(state.player,dt,sceneRoom());if(!state.player.path.length&&state.pendingAction)arrive(state.pendingAction);}
  else state.player.walking=false;
  callFirstPatient();
}
function frame(now){
  if(!last)last=now;const frameDelta=Math.min((now-last)/1000,.1);accumulator+=frameDelta;last=now;
  if(uiTweenGroup)uiTweenGroup.update(now);
  // Idle gestures keep a real-time rhythm during conversation. Only an
  // explicit pause or a hidden tab stops them; transfers keep their own clock.
  if(!state.paused&&!document.hidden)elapsed+=frameDelta;
  while(accumulator>=FIXED_DT){
    // Faster transfers use the same collision-safe fixed steps. Manual walking
    // stays at its usual speed; no actor is teleported or takes a larger step.
    const steps=state.settings.fastTransfers&&(movementBusy()||state.player.path.length&&!state.keys.size)?3:1;
    for(let i=0;i<steps;i++){
      const active=!panel.open&&!state.paused&&!document.hidden;update(FIXED_DT);
      if(active)ambience.step([{...state.player,resident:true},state.exam.patient],FIXED_DT);
    }
    accumulator-=FIXED_DT;
  }
  let visual=state.player;
  if(state.exam.busy)visual=state.exam.visualResident(state.player);
  if(state.visits.busy)visual=state.visits.visualResident(state.player);
  if(state.seatTween){
    // A dialog stops walking, but must not leave the sitting pose outside its chair.
    if(!state.paused&&!document.hidden)state.seatTween.progress+=frameDelta*(state.settings.fastTransfers?3:1);
    const transition=state.seatTween;
    visual={...state.player,...sampleActorTransition(transition,transition.progress)};
    if(transition.progress>=transition.duration)state.seatTween=null;
  }
  syncDeskView();
  const reducedMotion=!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const cueReady=!panel.open&&!state.paused&&!movementBusy()&&!state.campaign.finished&&!state.clinical.history&&!state.clinical.outcome;
  const activePulse=clickPulse&&elapsed-clickPulse.at<.72?{...clickPulse,age:elapsed-clickPulse.at}:null;
  // Salida de Elena tras una decisión incorrecta.
  const wrongVisual = updateElenaWrong(frameDelta);
  // Secuencia única: entrada por la puerta, atención y traslado.
  const rescate = state.elenaRescue;
  let rescueOrderly = null;
  if (rescate) {
    if (rescate.phase !== 'complete' && !state.paused && !document.hidden) {
      rescate.time += frameDelta;
      if (rescate.phase === 'arrival' && rescate.time >= 6) { rescate.phase='attention'; rescate.time=0; }
      else if (rescate.phase === 'attention' && rescate.time >= 1.2) { rescate.phase='departure'; rescate.time=0; }
      else if (rescate.phase === 'departure' && rescate.time >= 6) {
        rescate.phase='complete'; rescate.time=0;
        state.clinical.elenaRescuePhase='complete';
        state.clinical.elenaEpilogue='scene1'; save();
      }
    }
    const departing = rescate.phase === 'departure';
    const images = frame.rescueFrames ??= Object.fromEntries(['north','south','east','west'].map(dir => [dir, Array.from({length:8}, (_,i) => {const img=new Image();img.src='assets/sprites/rescate/rescate-'+dir+'-'+String(i).padStart(3,'0')+'.png';return img;})]));
    if (rescate.phase !== 'complete') {
      const moving = rescate.phase !== 'attention';
      const t = rescate.time;
      // La entrada y la salida tienen dos tramos: avanzar y girar.
      let x=145, y=125, direction='east', portal=false;
      if (rescate.phase === 'arrival') {
        if (t < 2) { x=49; y=74+29*t/2; direction='south'; portal=t<1; }
        else { const p=Math.min(1,(t-2)/4); x=49+96*p; y=103+22*p; direction='east'; }
      } else if (departing) {
        if (t < 4) { const p=t/4; x=145-96*p; y=125-22*p; direction='west'; }
        else { x=49; y=103-29*Math.min(1,(t-4)/2); direction='north'; portal=t>5; }
      }
      const index = moving ? Math.floor(t * 8) % 8 : 0;
      rescueOrderly = {image:images[direction][index], x, y, opacity:1, patient:departing && direction !== 'north', direction, portal};
    }
  }
  // ELENA — Secuencia cinematográfica de emergencia.
// ELENA — Animación dentro de las capas del consultorio.
const emergencia = state.elenaEmergency;

const enEscena =
  emergencia?.phase === 'playing' ||
  emergencia?.phase === 'fallen';

const pacienteBase = state.visits.busy
  ? state.visits.visualPatient()
  : state.exam.visualPatient();

let capaElena = null;
let animacionTerminada = false;

if (enEscena) {

  const hoja = frame.elenaEmergenciaHoja ??= new Image();

  if (!hoja.src) {
    hoja.src = 'assets/sprites/pacientes/elena/elena_emergencia_9x3.png';
  }

  if (
    hoja.complete &&
    hoja.naturalWidth === 2304 &&
    hoja.naturalHeight === 768
  ) {

    const inicio = emergencia.inicioVisual ??= elapsed;

    const t = emergencia.phase === 'fallen'
      ? 999
      : Math.max(0, elapsed - inicio);

    const duracionInicio = 1.44;
    const duracionCaminar = 0.99;
    const duracionCaida = 1.80;

    const desde = ROOM.patientSeat;

// Mismo punto lateral que utiliza Elena al llegar
// y salir de la silla durante las consultas.
const salida = {
  x: desde.x + 30,
  y: desde.y + 4
};

const destino = {x: 232, y: 138};

    let cuadro = 0;
    let x = desde.x;
    let y = desde.y;

    if (t < duracionInicio) {

  cuadro = Math.min(8, Math.floor(t / 0.16));

  if (!emergencia.povDone && !deskView.hidden) {
    renderDeskElenaEmergencyFrame(cuadro);
  }

  // Elena se incorpora y sale lateralmente de la silla.
  // El movimiento termina antes de que empiece a caminar.
  const avanceSalida = Math.min(
    1,
    Math.max(0, (t - 0.12) / 0.52)
  );

  x = desde.x + (salida.x - desde.x) * avanceSalida;
  y = desde.y + (salida.y - desde.y) * avanceSalida;

} else if (t < duracionInicio + duracionCaminar) {
      if (!emergencia.povDone) {
        emergencia.povDone = true;
        syncDeskView();
      }

      const tiempo = t - duracionInicio;

      const avance = Math.min(
        1,
        tiempo / duracionCaminar
      );

      cuadro = 9 + Math.min(
        8,
        Math.floor(tiempo / 0.11)
      );

      x = salida.x + (destino.x - salida.x) * avance;
y = salida.y + (destino.y - salida.y) * avance;

    } else {
      if (!emergencia.povDone) {
        emergencia.povDone = true;
        syncDeskView();
      }

      const tiempo = t
        - duracionInicio
        - duracionCaminar;

      cuadro = 18 + Math.min(
        8,
        Math.floor(tiempo / 0.20)
      );

      x = destino.x;
      y = destino.y;
    }

    capaElena = (rescate && ['departure','complete'].includes(rescate.phase) || state.elenaWrong && wrongVisual.groundOpacity <= 0) ? null : {
      image: hoja,
      frame: cuadro,
      x,
      y,
      opacity: state.elenaWrong ? wrongVisual.groundOpacity : 1
    };
    if (capaElena) {
      canvas.dataset.elena3pFrame = String(cuadro);
      canvas.dataset.elena3pX = x.toFixed(1);
      canvas.dataset.elena3pY = y.toFixed(1);
    } else {
      delete canvas.dataset.elena3pFrame;
      delete canvas.dataset.elena3pX;
      delete canvas.dataset.elena3pY;
    }

    const fin =
      duracionInicio +
      duracionCaminar +
      duracionCaida;

    animacionTerminada =
      emergencia.phase === 'playing' &&
      t >= fin + 0.75;
  }
}

// El renderizador dibuja la escena completa UNA SOLA VEZ.
const finState = state.campaign.finance;
const finBal = finState ? Economy.balance(finState) : 2000;
const lastFinEntry = finState?.entries?.length ? finState.entries[finState.entries.length - 1] : null;
const economyVisualState = {
  tier: finBal < 1000 ? 'crisis' : finBal < 1800 ? 'strained' : finBal > 2200 ? 'surplus' : 'normal',
  memoKind: finBal < 1000
    ? 'crisis'
    : lastFinEntry && (lastFinEntry.fees > 0 || lastFinEntry.penalty > 0)
      ? 'warning'
      : lastFinEntry && lastFinEntry.reward > 0 && lastFinEntry.fees === 0
        ? 'praise'
        : 'directive'
};
render(ctx, visual, {
  time: elapsed,
  paused: state.paused || panel.open || movementBusy(),

  patient: state.elenaWrong ? wrongVisual.patient : enEscena
    ? {...pacienteBase, visible: false, doorOpen: rescate && rescate.phase !== 'complete' ? 1 : 0}
    : pacienteBase,

  room: sceneRoom(),
  animate: !reducedMotion,
  clickPulse: reducedMotion ? null : activePulse,
  showPatientCue: cueReady,

  // Elena entra en las capas del renderizador.
  emergencyElena: capaElena,
  rescueOrderly,
  rescueElena: rescate?.phase === 'departure' ? frame.elenaEmergenciaHoja : null,
  rescueBlack: false,
  phoneRinging: state.clinical.elenaPhone === 'ringing' && state.elenaWrong?.phase === 'done',
  economyState: economyVisualState
});

// Abrir las decisiones únicamente después de la caída.
if (animacionTerminada) {
  emergencia.phase = 'fallen';
  state.clinical.elenaEmergencyPhase = 'fallen';
  save();
  consultation('history');
}
  if(state.clinical.elenaPhone==='ringing' && state.elenaWrong?.phase==='done' && window.HP_SINGLE_VIEW==='game' && !state.paused && !document.hidden && !panel.open) ambience.phoneRing();
  else if(ambience.phoneVoice) ambience.stopPhone();
  if(state.clinical.elenaPhone==='talking' && state.elenaWrong?.phase==='done' && window.HP_SINGLE_VIEW==='game' && !panel.open && !frame.phoneRestored){frame.phoneRestored=true;showElenaPhoneDialogue();}
  updateElenaPhoneDialogue(frameDelta);
  updateElenaEpilogue(rescate, frameDelta);
  syncElenaMusic();
  if (deskDustCtx) {
    if (window.HP_SINGLE_VIEW === 'game' && !deskView.hidden) {
      actualizarYRenderizarPolvoPOV?.(deskDustCtx, frameDelta, !state.paused && !document.hidden && !reducedMotion);
    } else {
      deskDustCtx.clearRect(0, 0, deskDustCanvas.width, deskDustCanvas.height);
    }
  }
  syncClinicalLayout();contextHUD();requestAnimationFrame(frame);
}
if(!ctx){$('context-title').textContent='Canvas no está disponible en este navegador.';}else{hud();requestAnimationFrame(frame);}

return {
  syncDeskViewTray,
  iniciarEpilogoRecepcion(escena='scene1') {
    // Reusar la misma capa, transición, textos y música del final bueno.
    // No generar otra cinemática en llegada-hospital.js.
    if (!epilogueScenes[escena]) return false;
    state.clinical.elenaWrongPhase = 'done';
    state.clinical.elenaPhone = 'answered';
    state.clinical.emergencyHelpCalled = true;
    state.clinical.elenaRescuePhase = 'complete';
    state.clinical.elenaEpilogue = escena;
    state.clinical.elenaEpilogoRecepcion = true;
    state.clinical.elenaDemoComplete = false;
    state.elenaRescue = {
      phase:'complete',time:0,epilogueTime:0,
      textReady:false,closing:0
    };
    state.keys.clear();
    state.player.path=[];
    state.pendingAction=null;
    if (panel.open) {
      // La ventana clínica no debe bloquear la cinemática.
      $('close-panel').hidden=false;
      closePanel();
    }
    setPaused(false);
    epilogue.dataset.scene='';
    // Cubrir el consultorio antes de cambiar desde recepción al motor clínico.
    epilogue.style.backgroundColor='#000';
    epilogueImage.style.opacity='0';
    epilogue.hidden=false;
    epilogueDialog.hidden=true;
    epilogueFinal.hidden=true;
    window.HP_SINGLE_VIEW='game';
    $('hp-home').hidden=true;
    $('hp-day1').hidden=false;
    hud();
    syncElenaMusic();
    save();
    return true;
  },
  enterFromHospital(){
  state.keys.clear();
  state.player.path=[];
  state.pendingAction=null;

  Object.assign(state.player,{
    x:ROOM.exitDoor.x,
    y:ROOM.exitDoor.y+20,
    face:'down',
    seated:false,
    walking:false
  });

  state.clinical.seated=false;

  const esperaPrimerPaciente=!!window.HP_ARRIVAL?.pendingFirstPatient;

  if(esperaPrimerPaciente||state.campaign.finished){
    state.exam.patient.visible=false;
  }

  if(panel.open)closePanel();

  hud();
  canvas.focus({preventScroll:true});

  toast(esperaPrimerPaciente
    ?'Acércate a tu silla y siéntate para recibir al primer paciente.'
    :'Regresaste al consultorio.'
  );

  save();
},
syncDeskView,
openDeskNotebook,
openDeskCalculator,
openDeskPhone,
openDeskStudiesTray,
consultation,
despedirConsultaInicialDemo,
restoreElenaEmergency,
getActiveCase: () => activeCase,
setActiveCase: (c) => { activeCase = c; },
getSimulations: () => SIMULATIONS,
setSimulations: (s) => { SIMULATIONS = s; },
getElapsed: () => elapsed,
getDeskDebug: () => ({ deskViewEnabled, deskViewAssetsReady }),
getActiveNotebook,
save,
closePanel,
getState: () => state,
hud,
seatPlayer,
standPlayer
};
})();
