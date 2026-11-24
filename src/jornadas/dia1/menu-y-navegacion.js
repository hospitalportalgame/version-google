(function(){
 'use strict';
 const home=document.getElementById('hp-home'),game=document.getElementById('hp-day1');
 const start=document.getElementById('hp-start'),startLabel=document.getElementById('hp-start-label');
 const newBtn=document.getElementById('hp-new'),dialog=document.getElementById('hp-new-dialog');
 const key='hospital-portal-solo-dia1-v1';
 function saved(){try{return JSON.parse(localStorage.getItem(key)||'null');}catch(e){return null;}}
 function updateMenu(){
   const data=saved();
   // A fresh state can be created by the game engine while the home screen is displayed.
   const showContinue=Boolean(window.HP_SAVED_BEFORE_BOOT||window.HP_PLAYER_STARTED||data?.campaign?.completed?.length||data?.asked?.length||data?.exam||data?.outcome);
   startLabel.textContent=showContinue?'Continuar':'Nueva partida';
   start.dataset.newGame=String(!showContinue);
   newBtn.hidden=!showContinue;
   const day=data?.campaign?.day||1;
   const total=window.HepatoDay1Modules['simulation-cases.mjs'].getPatientsForDay(day).length;
   const done=day===1&&data?.campaign?.demoDay1Complete
     ?(Array.isArray(data?.campaign?.pendingInitial)?data.campaign.pendingInitial.length:total)
     :(Array.isArray(data?.campaign?.completed)?data.campaign.completed.length:0);
   document.getElementById('hp-save-info').textContent=showContinue
     ? (data?.campaign?.finished?`DÍA ${day} COMPLETADO · ${done}/${total} PACIENTES`:`DÍA ${day} · ${done}/${total} PACIENTES FINALIZADOS`)
     : `DÍA 1 · ${total} PACIENTES EN AGENDA`;
   document.getElementById('hp-reset-title').textContent='¿Reiniciar toda la campaña?';
   document.getElementById('hp-confirm-new').textContent='REINICIAR CAMPAÑA';
   const note=document.querySelector('.hp-local-note');
   if(note)note.textContent='↑ ↓ Seleccionar · Enter Confirmar';
 }
 function show(which){
   if(which==='game')window.HP_PLAYER_STARTED=true;
   if(which==='game'&&window.HP_ARRIVAL?.start())return;
   window.HP_SINGLE_VIEW=which;
   home.hidden=which==='game';game.hidden=which!=='game';
   if(which==='game'){
     try{history.replaceState(null,'',location.pathname+location.search+'#jugar');}catch(e){}
     window.scrollTo(0,0);
   }else{
     updateMenu();
     try{history.replaceState(null,'',location.pathname+location.search);}catch(e){}
     window.scrollTo(0,0);
   }
 }
 window.HP_SHOW_HOME=function(){
   window.HP_ARRIVAL?.stop();
   if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});
   document.getElementById('panel').close?.();
   show('menu');
 };
 start.addEventListener('click',function(e){e.preventDefault();show('game');});
 home.addEventListener('keydown',e=>{
   if(dialog.open||!['ArrowDown','ArrowUp','Home','End'].includes(e.key))return;
   const choices=[start,newBtn].filter(button=>!button.hidden);
   const current=choices.indexOf(document.activeElement);
   const index=e.key==='Home'?0:e.key==='End'?choices.length-1:
     (Math.max(0,current)+(e.key==='ArrowDown'?1:-1)+choices.length)%choices.length;
   e.preventDefault();choices[index].focus();
 });
 document.getElementById('hp-menu-return').addEventListener('click',window.HP_SHOW_HOME);
 newBtn.addEventListener('click',()=>dialog.showModal());
 document.getElementById('hp-cancel-new').addEventListener('click',()=>dialog.close());
 document.getElementById('hp-confirm-new').addEventListener('click',()=>{
   dialog.close();
   // Reset from a fresh page so the Day 1 engine reinitializes from patient 1.
   try{localStorage.removeItem(key);}catch(e){}
   window.location.hash='nueva-partida';
   window.location.reload();
 });
 show(window.HP_SINGLE_VIEW);
 if(window.HP_SINGLE_VIEW==='menu')updateMenu();
})();
