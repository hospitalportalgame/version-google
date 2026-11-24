/* Embedded original source: src/sistemas/sonido-ambiente.js */
/* Módulo compartido original: ambience.mjs. Conservado sin modificar su lógica. */
window.HepatoSharedModules['ambience.mjs'] = (() => {
// Short, quiet sounds synthesized locally; no downloads or background music.
// Enabling sound never creates an AudioContext. Call unlock() from a user click.
class Ambience {
 constructor({audioContextFactory=null}={}){
  this.enabled=false;this.context=null;this.master=null;this.unlocked=false;this.disposed=false;
  this.factory=audioContextFactory;this.voices=new Set();this.phoneVoice=null;this.phoneLast=-Infinity;this.tracks=new Map();this.lastPlayed=new Map();this.noise=null;this.unlocking=null;
 }
 setEnabled(value){
  this.enabled=Boolean(value)&&!this.disposed;
  if(this.master){const now=this.context.currentTime;this.master.gain.cancelScheduledValues(now);this.master.gain.setTargetAtTime(this.enabled?0.65:0,now,.012);}
  if(!this.enabled)this.stopVoices();
  return this.enabled;
 }
 async unlock(){
  if(!this.enabled||this.disposed)return false;
  if(this.unlocking)return this.unlocking;
  this.unlocking=(async()=>{
   try{
    if(!this.context){
     const Context=globalThis.AudioContext||globalThis.webkitAudioContext;
     if(!this.factory&&!Context)return false;
     this.context=this.factory?this.factory():new Context();
     this.master=this.context.createGain();this.master.gain.value=this.enabled?0.65:0;this.master.connect(this.context.destination);
    }
    if(this.context.state!=='running')await this.context.resume();
    this.unlocked=this.context.state==='running';return this.unlocked&&this.enabled&&!this.disposed;
   }catch{this.unlocked=false;return false;}
  })();
  try{return await this.unlocking;}finally{this.unlocking=null;}
 }
 phoneRing(){
  if(!this.enabled||!this.unlocked||this.disposed||this.context?.state!=='running')return;
  const ctx=this.context,now=ctx.currentTime;
  if(this.phoneVoice || now-this.phoneLast<1.7)return;
  this.phoneLast=now;
  const gain=ctx.createGain(),tones=[ctx.createOscillator(),ctx.createOscillator()];
  gain.gain.setValueAtTime(0,now);
  gain.gain.linearRampToValueAtTime(.075,now+.025);
  gain.gain.setValueAtTime(.075,now+.16);
  gain.gain.linearRampToValueAtTime(0,now+.20);
  gain.gain.setValueAtTime(0,now+.28);
  gain.gain.linearRampToValueAtTime(.075,now+.305);
  gain.gain.setValueAtTime(.075,now+.44);
  gain.gain.linearRampToValueAtTime(0,now+.48);
  gain.connect(this.master);
  tones.forEach((tone,i)=>{tone.type='sine';tone.frequency.value=i?480:620;tone.connect(gain);tone.start(now);tone.stop(now+.5);});
  const voice={stop:()=>{for(const tone of tones){try{tone.stop();}catch{} try{tone.disconnect();}catch{}}try{gain.disconnect();}catch{} }};
  this.phoneVoice=voice;this.voices.add(voice);
  tones[0].onended=()=>{voice.stop();this.voices.delete(voice);if(this.phoneVoice===voice)this.phoneVoice=null;};
 }
 stopPhone(){if(this.phoneVoice){this.phoneVoice.stop();this.voices.delete(this.phoneVoice);this.phoneVoice=null;}this.phoneLast=-Infinity;}
 noiseBuffer(){
  if(this.noise)return this.noise;
  const buffer=this.context.createBuffer(1,Math.ceil(this.context.sampleRate*.24),this.context.sampleRate),data=buffer.getChannelData(0);let seed=7321;
  for(let i=0;i<data.length;i++){seed=(seed*16807)%2147483647;data[i]=(seed/2147483647)*2-1;}
  this.noise=buffer;return buffer;
 }
 play(kind){
  if(!this.enabled||!this.unlocked||this.disposed||this.context?.state!=='running')return false;
  const sounds={
   step:{duration:.072,frequency:560,volume:.13,gap:.115,tone:135,toneVol:.022,q:.65,filter:'lowpass'},
   chair:{duration:.145,frequency:250,volume:.12,gap:.3,tone:86,toneVol:.01,q:.65,filter:'bandpass'},
   paper:{duration:.14,frequency:1750,volume:.16,gap:.11,tone:0,toneVol:0,q:.65,filter:'bandpass'},
   pen:{duration:.058,frequency:2800,volume:.12,gap:.05,tone:380,toneVol:.008,q:1.2,filter:'bandpass'},
   stamp:{duration:.11,frequency:420,volume:.2,gap:.15,tone:96,toneVol:.045,q:.8,filter:'lowpass'},
   beep:{duration:.065,frequency:1480,volume:.015,gap:.07,tone:1320,toneVol:.04,q:2,filter:'bandpass',wave:'sine',steady:true},
   door:{duration:.15,frequency:310,volume:.16,gap:.22,tone:108,toneVol:.03,q:.7,filter:'lowpass'},
   folder:{duration:.125,frequency:1180,volume:.15,gap:.12,tone:148,toneVol:.018,q:.75,filter:'bandpass'}
  };
  const sound=sounds[kind];if(!sound)return false;
  const ctx=this.context,now=ctx.currentTime,last=this.lastPlayed.get(kind);
  if(last!==undefined&&now-last<sound.gap)return false;
  this.lastPlayed.set(kind,now);
  const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();
  source.buffer=this.noiseBuffer();filter.type=sound.filter||'bandpass';filter.frequency.value=sound.frequency;filter.Q.value=sound.q||.65;
  gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(sound.volume,now+.008);gain.gain.exponentialRampToValueAtTime(.0001,now+sound.duration);
  source.connect(filter);filter.connect(gain);gain.connect(this.master);
  const nodes=[source,filter,gain],sources=[source];
  if(sound.tone){
   const tone=ctx.createOscillator(),toneGain=ctx.createGain();tone.type=sound.wave||'triangle';tone.frequency.setValueAtTime(sound.tone,now);
   if(!sound.steady)tone.frequency.exponentialRampToValueAtTime(sound.tone*.64,now+sound.duration);
   toneGain.gain.setValueAtTime(0,now);toneGain.gain.linearRampToValueAtTime(sound.toneVol||(kind==='step'?.022:.01),now+.006);toneGain.gain.exponentialRampToValueAtTime(.0001,now+sound.duration);
   tone.connect(toneGain);toneGain.connect(this.master);nodes.push(tone,toneGain);sources.push(tone);
  }
  const voice={stop:()=>{for(const node of sources)try{node.stop();}catch{}for(const node of nodes)try{node.disconnect();}catch{}}};
  this.voices.add(voice);source.onended=()=>{voice.stop();this.voices.delete(voice);};
  for(const node of sources){node.start(now);node.stop(now+sound.duration+.012);}
  return true;
 }
 step(actors,dt){
  if(this.disposed||!Number.isFinite(dt)||dt<=0)return;
  const seen=new Set();
  for(const[slot,actor]of(actors||[]).entries()){
   if(!actor||!Number.isFinite(actor.x)||!Number.isFinite(actor.y))continue;
   const id=actor.audioId||actor.id||(actor.resident?'resident':`patient-${slot}`);seen.add(id);
   const previous=this.tracks.get(id),current={x:actor.x,y:actor.y,travel:previous?.travel||0};this.tracks.set(id,current);
   if(!previous)continue;
   const distance=Math.hypot(current.x-previous.x,current.y-previous.y);
   const walking=actor.walking&&actor.visible!==false&&!actor.seated&&!actor.animation&&!['lying','examining'].includes(actor.pose);
   // Scripted seating, teleport/reset and inactive actors cannot make steps.
   if(!walking||distance>12){current.travel=0;continue;}
   current.travel+=distance;
   if(current.travel>=9.5){current.travel%=9.5;this.play('step');}
  }
  for(const id of this.tracks.keys())if(!seen.has(id))this.tracks.delete(id);
 }
 stopVoices(){this.stopPhone();for(const voice of this.voices)voice.stop();this.voices.clear();}
 reset(){this.stopVoices();this.tracks.clear();this.lastPlayed.clear();}
 async dispose(){
  this.disposed=true;this.setEnabled(false);this.reset();
  if(this.context&&this.context.state!=='closed')try{await this.context.close();}catch{}
  this.context=null;this.master=null;this.noise=null;this.unlocked=false;
 }
}

return {Ambience};
})();


