(function(){
  'use strict';
  const saveKey='hospital-portal-solo-dia1-v1';
  // Browser privacy settings can restrict file:// storage. Keep the game playable
  // and allow manual JSON exports even in private/restricted contexts.
  try {const _=window.localStorage.length;}
  catch(e) {
    const memory=new Map();
    Object.defineProperty(window,'localStorage',{configurable:true,value:{
      getItem:k=>memory.has(String(k))?memory.get(String(k)):null,
      setItem:(k,v)=>memory.set(String(k),String(v)),
      removeItem:k=>memory.delete(String(k)),
      clear:()=>memory.clear(),key:i=>[...memory.keys()][i]||null,
      get length(){return memory.size;}
    }});
    window.HP_MEMORY_ONLY=true;
  }
  const mode=window.location.hash;
  window.HP_SINGLE_VIEW=mode==='#jugar'||mode==='#nueva-partida'?'game':'menu';
  try{
    window.HP_SAVED_BEFORE_BOOT=localStorage.getItem(saveKey)!==null;
    if(mode==='#nueva-partida') {localStorage.removeItem(saveKey);window.HP_SAVED_BEFORE_BOOT=false;}
  }catch(e){window.HP_SAVED_BEFORE_BOOT=false;}
  // Keep the bookmark URL clean, especially for local file:// use.
  if(mode==='#nueva-partida')try{history.replaceState(null,'',location.pathname+location.search+'#jugar');}catch(e){}
})();
