/* Embedded original source: src/motor/movimiento-colisiones.js */
/* Módulo compartido original: engine.mjs. Conservado sin modificar su lógica. */
window.HepatoSharedModules['engine.mjs'] = (() => {
// Production-art coordinates, measured on the native 384 × 256 background.
const FOOT={halfWidth:7,halfHeight:4};
// A brisk, readable gait on the native canvas. Sprite cadence follows actual
// travelled pixels, so a faster route keeps its planted feet instead of skating.
const WALK_SPEED=48;
const PATIENT_WALK_SPEED=40;
const WALLS=[
  {id:'north-wall',x:57,y:15,w:277,h:63},
  {id:'north-west-wall',x:26,y:45,w:45,h:37},
  {id:'north-east-wall',x:334,y:45,w:26,h:37},
  {id:'west-wall',x:11,y:45,w:15,h:186},
  {id:'east-wall',x:360,y:45,w:14,h:186},
  {id:'south-wall',x:26,y:224,w:334,h:7},
  {id:'southwest-cap',x:26,y:217,w:52,h:7,pixelContact:true},
  {id:'southeast-cap',x:317,y:217,w:43,h:7,pixelContact:true}
];
const FURNITURE=[
 {id:'wall-cabinets',kind:'wall-cabinets',x:209,y:8,w:118,h:76,foot:{x:2,y:70,w:114,h:4}},
 {id:'sink',kind:'sink',x:26,y:69,w:82,h:90,foot:{x:2,y:69,w:78,h:21}},
 {id:'stool',kind:'stool',x:38,y:162,w:32,h:41,foot:{x:2,y:21,w:24,h:20}},
 {id:'couch',kind:'bed',x:281,y:81,w:42,h:102,foot:{x:3,y:2,w:37,h:99}},
 {id:'equipment',kind:'equipment',x:325,y:95,w:35,h:66,foot:{x:3,y:42,w:30,h:24}},
 {id:'plant',kind:'plant',x:328,y:164,w:36,h:50,foot:{x:10,y:35,w:19,h:15}},
{id:'desk',kind:'desk',x:147,y:129,w:80,h:71,foot:{x:1,y:46,w:79,h:25}},
 {id:'chair',kind:'chair',x:123,y:151,w:28,h:56,foot:{x:2,y:30,w:26,h:26},seat:{x:137,y:205,face:'right'}},
 {id:'patient-chair',kind:'chair',x:228,y:151,w:30,h:55,foot:{x:2,y:30,w:28,h:25},seat:{x:245,y:205,face:'left'}}
].map(f=>({...f,body:{x:f.x+f.foot.x,y:f.y+f.foot.y,w:f.foot.w,h:f.foot.h}}));
const ROOM={
 id:'consultorio',width:384,height:256,
  floor:{x:26,y:82,w:334,h:142},
  reservedFloor:[
    {id:'bed-service-clearance',x:321,y:82,w:39,h:55}
  ],
  walkable:[{x:26,y:78,w:295,h:146},{x:321,y:137,w:39,h:87}],
  interior:{x:26,y:52,w:334,h:172},
  bounds:{x:26,y:78,w:334,h:146},
 // Only the doorway extends north of the main movement rectangle. Its feet
 // remain below the wall and its full sprite remains in the upper room wing.
 doorApproach:{x:78,y:86,w:32,h:30},
 portal:{x:62,y:26,w:64,h:90},
 walls:WALLS,furniture:FURNITURE,
 
obstacles:[
 ...WALLS,
 ...FURNITURE
  .filter(f=>!['stool','chair','patient-chair'].includes(f.id))
.map(f=>({id:f.id,...f.body})),
{id:'silla-oficina-nueva',x:171,y:199,w:34,h:12}

],

 interactions:[
  {id:'chair',label:'Sentarse',x:188,y:212,range:36,approach:{x:188,y:216},face:'up'},
  // Feet alone permitted a position directly in front of the patient, but
  // their upright silhouettes then overlapped. Stand beside the chair with
  // a clear sightline; both characters face each other in the conversation.
{id:'patient',label:'Conversar con Martín',x:188,y:165,range:50,approach:{x:230,y:161},face:'left'},
  {id:'computer',label:'Revisar estudios',x:164,y:146,range:38,approach:{x:129,y:145},face:'right'},
  {id:'door',label:'Ver el consultorio',x:94,y:116,range:30,approach:{x:94,y:125},face:'up'}
 ],
 hitAreas:{chair:{x:174,y:198,w:28,h:24},computer:{x:148,y:129,w:79,h:76},bed:{x:281,y:81,w:43,h:103},door:{x:73,y:26,w:38,h:56}},
patientSeat:{x:188,y:165,face:'down'},
 seat:{x:188,y:212,face:'up',exit:{x:188,y:216}},
 exitDoor:{x:94,y:92,face:'up'},
 // The portal is reserved for the scripted doorway crossing. Manual movement
 // still stops on the interior mat; the renderer clips passage behind the lintel.
 doorway:{inside:{x:94,y:74},outside:{x:122,y:74},clip:{x:77,y:30,w:30,h:194},openSeconds:.18,closeSeconds:.18},
 exam:{patientExit:{x:188,y:165},bedEntry:{x:274,y:150},bedEdgeContact:{x:287,y:125},bedEdgePose:{x:287,y:136,face:'left'},bedPose:{x:302,y:146,face:'down'},residentWait:{x:268,y:124,face:'right'},residentExam:{x:277,y:140,face:'right'}},
 spawn:{x:118,y:125,face:'down'}
};
const HOSPITAL=[{id:'consultorio',title:'Consultorio',label:'Disponible',available:true}];
const FIXED_DT=1/60;
function createPlayer() {return {...ROOM.spawn,speed:WALK_SPEED,seated:false,walking:false,walkTime:0,path:[],distance:0};}
function containsBox(area,box){return box.x>=area.x&&box.y>=area.y&&box.x+box.w<=area.x+area.w&&box.y+box.h<=area.y+area.h;}
function isFree(x,y,room=ROOM) {
  // The character's body can overlap surfaces visually; only feet collide.
  const foot={x:x-FOOT.halfWidth,y:y-FOOT.halfHeight,w:FOOT.halfWidth*2,h:FOOT.halfHeight*2}, b=room.bounds;
  // The two rectangles overlap by the full height of a foot box, so every
  // foot box covered by their union is contained by at least one rectangle.
  // A corridor cannot admit just a corner of the feet outside the room.
  if(!containsBox(b,foot)&&(!room.doorApproach||!containsBox(room.doorApproach,foot)))return false;
  if(room.walkable){for(const px of [foot.x,x,foot.x+foot.w])for(const py of [foot.y,y,foot.y+foot.h])if(!room.walkable.some(a=>px>=a.x&&py>=a.y&&px<=a.x+a.w&&py<=a.y+a.h))return false;}
  const overlaps=(a,o)=>a.x<o.x+o.w&&a.x+a.w>o.x&&a.y<o.y+o.h&&a.y+a.h>o.y;
  // These unmasked foreground caps cannot hide a sole at their inner edge.
  // Match the raster's rounded anchor and inclusive ±7px horizontal soles,
  // while retaining the continuous sweep that prevents tunneling.
  const pixels={x:Math.round(x)-FOOT.halfWidth,y:Math.round(y)-FOOT.halfHeight,w:FOOT.halfWidth*2+1,h:FOOT.halfHeight*2};
  return !room.obstacles.some(o=>overlaps(foot,o)||(o.pixelContact&&overlaps(pixels,o)));
}
function movePlayer(p,dx,dy,dt,room=ROOM) {
  if(p.seated) {p.walking=false;return;}
  const len=Math.hypot(dx,dy); if(!len){p.walking=false;return;}
  // Direccion visual estable durante movimientos diagonales.
// Conserva la orientacion anterior cuando ambos ejes
// tienen una intensidad muy parecida.

const ax = Math.abs(dx);
const ay = Math.abs(dy);

const margenDireccion = 1.25;

if (ax > ay * margenDireccion) {

  p.face = dx > 0 ? 'right' : 'left';

} else if (ay > ax * margenDireccion) {

  p.face = dy > 0 ? 'down' : 'up';

} else if (p.face === 'left' || p.face === 'right') {

  p.face = dx > 0 ? 'right' : 'left';

} else {

  p.face = dy > 0 ? 'down' : 'up';

}
  const distance=(p.speed||WALK_SPEED)*Math.min(dt,0.05), mx=dx/len*distance,my=dy/len*distance;
  // Small swept steps prevent tunneling; separate axes allow wall sliding.
  const n=Math.max(1,Math.ceil(distance/2));let travelled=0;
  for(let i=0;i<n;i++) {const ox=p.x,oy=p.y;if(isFree(p.x+mx/n,p.y,room))p.x+=mx/n;if(isFree(p.x,p.y+my/n,room))p.y+=my/n;travelled+=Math.hypot(p.x-ox,p.y-oy);}
  p.walking=travelled>0.001;p.distance+=travelled;if(p.walking)p.walkTime+=dt;
}
function nearestInteraction(p,room=ROOM) {
  if(p.seated)return {id:'computer',label:'Abrir consulta',distance:0};
  return room.interactions.map(i=>({...i,distance:Math.hypot(i.x-p.x,i.y-p.y)})).filter(i=>i.distance<=i.range).sort((a,b)=>a.distance-b.distance)[0]||null;
}
function sit(p,room=ROOM) {
  // The chair interaction can be detected from farther away, but the actual
  // sitting action begins only from the free floor station beside the seat.
  // A direct snap from anywhere in the interaction circle crossed furniture.
  if(p.seated || Math.hypot(p.x-room.seat.exit.x,p.y-room.seat.exit.y)>3) return false;
  p.path=[];p.x=room.seat.x;p.y=room.seat.y;p.face=room.seat.face;p.seated=true;p.walking=false;p.walkTime=0;return true;
}
function stand(p,room=ROOM) {
  if(!p.seated)return false;
  if(!isFree(room.seat.exit.x,room.seat.exit.y,room))return false;
  p.x=room.seat.exit.x;p.y=room.seat.exit.y;p.seated=false;p.face='down';p.path=[];p.walking=false;return true;
}
function findPath(start,target,room=ROOM) {
  const step=4,b=room.bounds;
  const cell=p=>({x:Math.round((p.x-b.x)/step),y:Math.round((p.y-b.y)/step)});
  const point=c=>({x:b.x+c.x*step,y:b.y+c.y*step});
  const key=c=>`${c.x},${c.y}`;
  const walkable=c=>{const p=point(c);return isFree(p.x,p.y,room);};
  if(!isFree(start.x,start.y,room)||!isFree(target.x,target.y,room))return [];
  const segmentFree=(a,z)=>{
    if(!isFree(a.x,a.y,room)||!isFree(z.x,z.y,room))return false;
    // Test the continuous feet sweep against each expanded obstacle. A
    // diagonal must not shave a furniture corner between sample points.
    for(const o of room.obstacles){
      let enter=0,exit=1,intersects=true;
      for(const [axis,lo,hi]of [['x',o.x-FOOT.halfWidth,o.x+o.w+FOOT.halfWidth],['y',o.y-FOOT.halfHeight,o.y+o.h+FOOT.halfHeight]]){
        const delta=z[axis]-a[axis];
        if(Math.abs(delta)<1e-12){if(a[axis]<=lo||a[axis]>=hi){intersects=false;break;}}
        else{const first=(lo-a[axis])/delta,last=(hi-a[axis])/delta;enter=Math.max(enter,Math.min(first,last));exit=Math.min(exit,Math.max(first,last));if(enter>=exit-1e-10){intersects=false;break;}}
      }
      if(intersects&&enter<exit-1e-10)return false;
    }
    // The doorway and any custom walkable areas form a non-convex union;
    // inspect its boundary at a quarter native pixel as well.
    if(room.doorApproach||room.walkable){const n=Math.ceil(Math.hypot(z.x-a.x,z.y-a.y)*4);for(let i=1;i<n;i++){const t=i/n;if(!isFree(a.x+(z.x-a.x)*t,a.y+(z.y-a.y)*t,room))return false;}}
    return true;
  };
  // HEPATO-2: ruta directa cuando el camino esta despejado.
// Evita giros innecesarios de la cuadricula.
// Conserva todas las comprobaciones de colision.

if (segmentFree(start, target)) {
  return [{x: target.x, y: target.y}];
}
  const safeCell=p=>{const c=cell(p),candidates=[];for(let x=-2;x<=2;x++)for(let y=-2;y<=2;y++)candidates.push({x:c.x+x,y:c.y+y});return candidates.filter(walkable).sort((a,z)=>Math.hypot(point(a).x-p.x,point(a).y-p.y)-Math.hypot(point(z).x-p.x,point(z).y-p.y)).find(c=>segmentFree(p,point(c)));};
  const beg=safeCell(start),end=safeCell(target);if(!beg||!end)return [];
  const open=[beg],visited=new Set([key(beg)]),parents=new Map();let found=false;
  for(let idx=0;idx<open.length;idx++) {
    const c=open[idx];if(key(c)===key(end)){found=true;break;}
    for(const [x,y] of [[1,0],[-1,0],[0,1],[0,-1]]) {const next={x:c.x+x,y:c.y+y},k=key(next);if(!visited.has(k)&&walkable(next)){visited.add(k);parents.set(k,c);open.push(next);}}
  }
  if(!found)return [];
  const path=[];let current=end;
  while(key(current)!==key(beg)){path.unshift(point(current));current=parents.get(key(current));}
  path.unshift(point(beg));path.push({...target});
  // Pull a taut route through visible free space. Grid points at the final
  // station otherwise caused tiny left/up/right flickers over a few pixels.
  const smooth=[];let anchor=start,next=0;
  while(next<path.length){let furthest=next;for(let i=path.length-1;i>next;i--)if(segmentFree(anchor,path[i])){furthest=i;break;}smooth.push(path[furthest]);anchor=path[furthest];next=furthest+1;}
  return smooth;
}
function followPath(p,dt,room=ROOM) {
  if(!p.path.length){p.walking=false;return;}
  // Spend one time budget across waypoints. Snapping and then taking a full
  // step would make a character briefly speed up at each grid boundary.
  let remaining=Math.min(dt,.05),travelled=0,guard=0;
  while(p.path.length&&remaining>1e-7&&guard++<16){
    const target=p.path[0],dx=target.x-p.x,dy=target.y-p.y,distance=Math.hypot(dx,dy);
    if(distance<1e-7){p.x=target.x;p.y=target.y;p.path.shift();continue;}
    const stepTime=Math.min(remaining,distance/(p.speed||WALK_SPEED)),oldX=p.x,oldY=p.y;
    movePlayer(p,dx,dy,stepTime,room);remaining-=stepTime;
    const moved=Math.hypot(p.x-oldX,p.y-oldY);travelled+=moved;
    if(Math.hypot(target.x-p.x,target.y-p.y)<1e-7){p.x=target.x;p.y=target.y;p.path.shift();}
    if(moved<1e-7)break;
  }
  p.walking=travelled>1e-7;
}

function bindAnalogJoystick(baseEl, { keysSet, canMove, onBlocked, onMoveStart, onAudioUnlock } = {}) {
  if (!baseEl || !keysSet) return null;
  const knob = baseEl.querySelector('.hp-joy-knob');
  const ticks = {
    n: baseEl.querySelector('[data-t="n"]'),
    s: baseEl.querySelector('[data-t="s"]'),
    w: baseEl.querySelector('[data-t="w"]'),
    e: baseEl.querySelector('[data-t="e"]')
  };
  let dragging = false;
  const dirs = ['w', 'a', 's', 'd'];
  const clearKeys = () => {
    for (const k of dirs) keysSet.delete(k);
    if (ticks.n) ticks.n.classList.remove('active');
    if (ticks.s) ticks.s.classList.remove('active');
    if (ticks.w) ticks.w.classList.remove('active');
    if (ticks.e) ticks.e.classList.remove('active');
  };
  const reset = () => {
    dragging = false;
    clearKeys();
    if (knob) {
      knob.classList.remove('dragging');
      knob.style.transform = 'translate(0px, 0px)';
    }
  };
  const updateFromPoint = (clientX, clientY) => {
    const r = baseEl.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const maxR = r.width * 0.31;
    let dx = clientX - (r.left + r.width / 2);
    let dy = clientY - (r.top + r.height / 2);
    const dist = Math.hypot(dx, dy);
    if (dist > maxR) {
      dx = (dx / dist) * maxR;
      dy = (dy / dist) * maxR;
    }
    if (knob) knob.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`;
    const nx = dx / maxR;
    const ny = dy / maxR;
    const dead = 0.26;
    const up = ny < -dead;
    const down = ny > dead;
    const left = nx < -dead;
    const right = nx > dead;
    up ? keysSet.add('w') : keysSet.delete('w');
    down ? keysSet.add('s') : keysSet.delete('s');
    left ? keysSet.add('a') : keysSet.delete('a');
    right ? keysSet.add('d') : keysSet.delete('d');
    if (ticks.n) ticks.n.classList.toggle('active', up);
    if (ticks.s) ticks.s.classList.toggle('active', down);
    if (ticks.w) ticks.w.classList.toggle('active', left);
    if (ticks.e) ticks.e.classList.toggle('active', right);
    if ((up || down || left || right) && onMoveStart) onMoveStart();
  };
  baseEl.addEventListener('pointerdown', e => {
    e.preventDefault();
    if (onAudioUnlock) onAudioUnlock();
    if (canMove && !canMove()) {
      if (onBlocked) onBlocked();
      return;
    }
    dragging = true;
    if (knob) knob.classList.add('dragging');
    try { baseEl.setPointerCapture(e.pointerId); } catch {}
    updateFromPoint(e.clientX, e.clientY);
  });
  baseEl.addEventListener('pointermove', e => {
    if (!dragging) return;
    if (canMove && !canMove()) { reset(); return; }
    updateFromPoint(e.clientX, e.clientY);
  });
  for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    baseEl.addEventListener(ev, reset);
  }
  window.addEventListener('blur', reset);
  return { reset };
}

return {FOOT,WALK_SPEED,PATIENT_WALK_SPEED,ROOM,HOSPITAL,FIXED_DT,createPlayer,isFree,movePlayer,nearestInteraction,sit,stand,findPath,followPath,bindAnalogJoystick};
})();

