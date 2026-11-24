/* Embedded original source: src/graficos/sprites-personajes.js */
/* Módulo compartido original: character-sprites.mjs. Conservado sin modificar su lógica. */
window.HepatoSharedModules['character-sprites.mjs'] = (() => {
const {SPRITE_ART,unpackSprite} = window.HepatoSharedModules['character-art.mjs'];
const {bitmap} = window.HepatoSharedModules['pixel-art.mjs'];
const {FOOT} = window.HepatoSharedModules['engine.mjs'];
const SPRITE_CELL={width:SPRITE_ART.width,height:SPRITE_ART.height,anchorX:24,anchorY:60};
const GAIT_DISTANCE_STEP=2.5;
const CHARACTER_FRAMES=Object.fromEntries(Object.entries(SPRITE_ART.frames).map(([style,dirs])=>[style,Object.fromEntries(Object.entries(dirs).map(([face,actions])=>[face,Object.fromEntries(Object.entries(actions).map(([action,frames])=>[action,frames.map(unpackSprite)]))]))]));
const colorCache=new Map();
function mix(a,b,amount){const rgb=hex=>hex.slice(1).match(/../g).map(v=>parseInt(v,16)),ca=rgb(a),cb=rgb(b);return '#'+ca.map((n,i)=>Math.round(n+(cb[i]-n)*amount).toString(16).padStart(2,'0')).join('');}
function materialColor(p,a){
 const shade=p.shade||0;
 if(p.role==='skin'){
  if(shade===-1)return a.skinShade;
  if(shade<0)return mix(a.skin,a.skinShade,Math.abs(shade));
  return shade>0?mix(a.skin,'#fff1cd',.34):a.skin;
 }
 if(p.role==='hair'){if(shade<0)return mix(a.hair,'#2d2934',.5);return shade>0?mix(a.hair,'#d3a47a',shade===2?.52:.3):a.hair;}
 if(p.role==='top'){if(shade<0)return mix(a.top,'#273746',.43);return shade>0?mix(a.top,'#c4dbd8',shade===2?.5:.31):a.top;}
 return p.color;
}
function spritePalette(appearance=null,resident=false){
 const a={skin:'#e5ae86',skinShade:'#bc806a',hair:'#795649',top:'#4f8390',style:'short',glasses:false,...appearance};
 const key=JSON.stringify([a,resident]);if(colorCache.has(key))return colorCache.get(key);
 const palette={style:a.style,glasses:a.glasses,skin:a.skin,skinShade:a.skinShade};

SPRITE_ART.palette.forEach((p, i) => {
  if (!i) return;

  const key = String.fromCharCode(0xe000 + i);

  if (resident && p.role === 'hair') {
    const tonos = {
      '-2': '#121318',
      '0': '#20212a',
      '1': '#343640',
      '2': '#51535e'
    };
    palette[key] = tonos[p.shade] || '#20212a';
  } else {
    palette[key] = resident ? p.color : materialColor(p, a);
  }
});

 colorCache.set(key,palette);return palette;
}
function frameForActor(actor,time=0){
 const style=actor.resident?'clinician':(['short','bob','long','curly','bald'].includes(actor.appearance?.style)?actor.appearance.style:'short'),slotFace=actor.animation?.face||actor.face||'down',face=CHARACTER_FRAMES[style][slotFace]?slotFace:'down';
 const frames=CHARACTER_FRAMES[style][face];let action='idle',index=0;
 if(actor.animation?.action&&frames[actor.animation.action]){
  action=actor.animation.action;const list=frames[action];index=Number.isInteger(actor.animation.frame)?actor.animation.frame:Math.floor(Math.max(0,actor.animation.progress||0)*list.length);index=Math.max(0,Math.min(list.length-1,index));
 }else if(actor.pose==='lying')action='lie';
 else if(actor.pose==='examining'){action='examine';index=frames.examine.length-1;}
 else if(actor.seated){action='sit';index=frames.sit.length-1;}
 else if(actor.walking){action='walk';const phase=Number.isFinite(actor.distance)?Math.floor(actor.distance/GAIT_DISTANCE_STEP):Math.floor((actor.walkTime||0)*16);index=((phase%8)+8)%8;}
 const meta=SPRITE_ART.landmarks?.[style]?.[face]?.[action]?.[index];
 return {rows:frames[action][index],face:meta?.face||face,style,action,index,landmarks:meta};
}
function drawGlasses(r,eyes,x,y,face,reclining=false){
 const color='#526174',shine='#91a6b3';
 const height=reclining?1:2;
 for(const eye of eyes){r(x+eye.x-1,y+eye.y-1,3,1,color);r(x+eye.x-1,y+eye.y+height,3,1,color);r(x+eye.x-1,y+eye.y,1,height,color);r(x+eye.x+1,y+eye.y,1,height,color);r(x+eye.x-1,y+eye.y-1,1,1,shine);}
 if(eyes.length===2){const[a,b]=[...eyes].sort((a,b)=>a.x-b.x);r(x+a.x+2,y+a.y,Math.max(1,b.x-a.x-3),1,color);}
 else if(eyes.length){const eye=eyes[0];r(x+eye.x+(face==='left'?2:-3),y+eye.y,2,1,color);}
}
function drawActor(r,actor,time=0){
 const palette=spritePalette(actor.appearance,actor.resident),{rows,face,action,landmarks}=frameForActor(actor,time),x=Math.round(actor.x)-24,y=Math.round(actor.y)-60;
 const transfer=['mount','dismount'].includes(actor.animation?.action);
 const contacts=transfer?(landmarks?.supportContacts||[]).filter(c=>c.kind==='floor').map(c=>c.local):landmarks?.floorContacts||[];
 // The same planted soles carry their shadows while sitting, rising and
 // loading the bed. Bed soles and reclining heads never cast a floor oval.
 const walkingFootprint=action==='idle'||action==='walk';
 const shadow=(sx,sy,w,h,color)=>{
  if(!walkingFootprint){r(sx,sy,w,h,color);return;}
  // A walking sole can reach the raster edge of the collision footprint.
  // Its soft fringe stays on that same floor volume rather than extending
  // across the unmasked foreground wall caps or outside the closed room.
  const left=Math.max(sx,x+24-FOOT.halfWidth),top=Math.max(sy,y+60-FOOT.halfHeight),
   right=Math.min(sx+w,x+24+FOOT.halfWidth+1),bottom=Math.min(sy+h,y+60+FOOT.halfHeight);
  if(right>left&&bottom>top)r(left,top,right-left,bottom-top,color);
 };
 const seen=new Set();
 for(const contact of contacts){
  const px=x+contact.x,py=y+contact.y,key=`${px}:${py}`;if(seen.has(key))continue;seen.add(key);
  shadow(px-3,py,7,1,'#23364b18');shadow(px-2,py+1,5,1,'#23364b26');shadow(px-1,py+2,3,1,'#23364b10');
 }
 if(landmarks?.reclining){
  // One native crease below the head and under the low shoulders attaches
  // the body to the mattress, using the clinic's cool contact-shadow hues.
  r(x+20,y+landmarks.crown+9,9,1,'#a8b8c8');
  r(x+31,y+(landmarks.shoulders?.y||32),3,7,'#a8b8c8');
 }
 bitmap(r,rows,x,y,palette);
 if(palette.glasses&&face!=='up')drawGlasses(r,landmarks?.eyes||[],x,y,face,landmarks?.reclining);
}
function spritePortrait(appearance,mood='neutral'){
 const isResident=appearance?.resident===true;
 const palette=spritePalette(appearance,isResident),style=isResident?'clinician':(CHARACTER_FRAMES[palette.style]?palette.style:'short'),rows=CHARACTER_FRAMES[style].down.idle[0],meta=SPRITE_ART.landmarks[style].down.idle[0],parts=[];
 const rect=(x,y,w,h,c,extra='')=>parts.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"${extra}/>`);
 const bg=mood==='critical'?'#b8c6d2':mood==='concerned'?'#bfcedb':mood==='relieved'?'#c7e0d8':mood==='noting'?'#c4d8e2':'#c8dae4';
 const border=mood==='critical'?'#9a3540':mood==='concerned'?'#8a6838':mood==='relieved'?'#3d7860':'#60778e';
 rect(0,0,32,32,bg);rect(0,31,32,1,border);
 const cropY=meta.crown-6;
 for(let y=cropY;y<cropY+32;y++)for(let x=8;x<40;x++){const c=palette[rows[y][x]];if(c)rect(x-8,y-cropY,1,1,c);}
 if(palette.glasses)drawGlasses(rect,meta.eyes,-8,-cropY,'down');
 const eyes=meta.eyes||[];
 if(eyes.length>=2){
  const [e1,e2]=[...eyes].sort((a,b)=>a.x-b.x);
  const lx=e1.x-8,rx=e2.x-8,ey=e1.y-cropY;
  const mouthX=Math.round((lx+rx)/2),mouthY=ey+4;
  if(mood==='concerned'||mood==='critical'){
   rect(lx-1,ey-2,2,1,palette.skinShade||'#9c6b56');
   rect(rx,ey-2,2,1,palette.skinShade||'#9c6b56');
   rect(mouthX-1,mouthY,3,1,'#7d4b42');
  }else if(mood==='speaking'){
   rect(mouthX-1,mouthY,2,2,'#7a443c');
  }else if(mood==='relieved'){
   rect(mouthX-1,mouthY,3,1,'#8c584c');
   rect(mouthX-2,mouthY-1,1,1,palette.skinShade||'#b07862');
   rect(mouthX+2,mouthY-1,1,1,palette.skinShade||'#b07862');
  }
  if(mood==='critical'){
   rect(0,0,32,31,'#e6f2f7',' opacity="0.22"');
   rect(rx+3,ey-1,1,2,'#7ec8e3');
   rect(rx+3,ey+1,1,1,'#dcf5fc');
  }
 }
 if(mood==='noting'){
  rect(20,21,9,9,'#d4b483');
  rect(21,22,7,7,'#f8f5ec');
  rect(22,24,5,1,'#527084');
  rect(22,26,4,1,'#527084');
  rect(18,22,2,6,'#1e4e68');
  rect(17,28,1,1,'#0f2d3c');
 }
 return parts.join('');
}

return {SPRITE_CELL,GAIT_DISTANCE_STEP,CHARACTER_FRAMES,spritePalette,frameForActor,drawActor,spritePortrait};
})();

