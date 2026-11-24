/* Embedded original source: src/sistemas/visitas.js */
/* Módulo compartido original: visits.mjs. Conservado sin modificar su lógica. */
window.HepatoSharedModules['visits.mjs'] = (() => {
const {ROOM,PATIENT_WALK_SPEED,findPath,followPath,sit} = window.HepatoSharedModules['engine.mjs'];
const {EXAM_STATIONS,actorRoom,createActorTransition,sampleActorTransition} = window.HepatoSharedModules['exam.mjs'];
const VISIT_DOOR=ROOM.exitDoor;
const clamp=n=>Math.max(0,Math.min(1,n));
const ease=n=>{const t=clamp(n);return t*t*(3-2*t);};
function portalPoint(points,distance){
  for(let i=1;i<points.length;i++){
    const a=points[i-1],b=points[i],dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);
    if(distance<=length||i===points.length-1){
      const f=length?clamp(distance/length):1;
      return {x:a.x+dx*f,y:a.y+dy*f,face:Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up'};
    }
    distance-=length;
  }
  return {...points.at(-1),face:'up'};
}
// A separate controller owns the queue. The examination controller remains reusable.
// The resident parks first so the two actors cannot meet head-on at the desk.
class VisitSequence {
  constructor(room=ROOM){this.room=room;this.stage='idle';this.clock=0;this.patientTween=null;this.residentTween=null;this.patient=null;this.portalDistance=0;}
  get busy(){return ['parking','leaving','fade-out','fade-in','arriving','facing','seating'].includes(this.stage);}
  tween(actor,from,to,which,duration){const action=actor.seated?'sit':'stand';this[which]=createActorTransition(actor,from,to,action,this.clock,{duration});}
  visual(actor,which){const t=this[which];return t?{...actor,...sampleActorTransition(t,this.clock)}:actor;}
  visualPatient(){
    const p=this.visual(this.patient,'patientTween');if(!p)return p;
    const door=this.room.exitDoor,nearby=Math.max(0,1-Math.hypot(p.x-door.x,p.y-door.y)/36);
    if(this.stage==='fade-out'||this.stage==='fade-in'){
      // These stage names are kept for the HUD/save event contract. There is
      // no fading: a full-opacity actor walks through the reserved opening,
      // and the renderer clips it behind the lintel on the same pixel grid.
      const incoming=this.stage==='fade-in',portal=this.room.doorway,
        openSeconds=portal.openSeconds??.18,closeSeconds=portal.closeSeconds??.18,
        elapsed=this.clock-this.fadeAt,delay=incoming?openSeconds:0,
        progress=clamp((elapsed-delay)/this.portalSeconds),travelled=this.portalDistance*progress,
        position=portalPoint(this.portalPath,travelled),
        walking=elapsed>=delay&&progress<1;
      return {...p,...position,walking,portalTravel:true,opacity:1,
        distance:(this.portalStartDistance||0)+travelled,
        walkTime:(this.portalStartWalkTime||0)+Math.max(0,elapsed-delay),
        doorOpen:incoming?ease(elapsed/openSeconds):1-ease((elapsed-this.portalSeconds)/closeSeconds)};
    }
    return {...p,doorOpen:['leaving','arriving'].includes(this.stage)?nearby:0};
  }
  visualResident(resident){return this.visual(resident,'residentTween');}
  beginPortal(incoming){
    const p=this.patient,door=this.room.exitDoor,portal=this.room.doorway,
      points=portal.inside?[door,portal.inside,portal.outside]:[door,portal.outside];
    this.portalPath=incoming?[...points].reverse():points;
    this.portalDistance=points.slice(1).reduce((sum,b,i)=>sum+Math.hypot(b.x-points[i].x,b.y-points[i].y),0);
    this.portalSeconds=this.portalDistance/(p.speed||PATIENT_WALK_SPEED);
    this.portalStartDistance=p.distance||0;this.portalStartWalkTime=p.walkTime||0;
    this.fadeAt=this.clock;this.stage=incoming?'fade-in':'fade-out';
    p.walking=false;p.face=incoming?'down':'up';
  }
  leave(patient,resident){
    if(this.busy||!patient.seated||patient.visible===false)return false;
    const silla = this.room.patientSeat;

this.departureExit = {
  x: silla.x,
  y: silla.y + 4
};

const lado = {
  x: silla.x + 30,
  y: silla.y + 4
};

const sala = actorRoom(this.room, {
  ...resident,
  ...this.room.seat,
  seated: true
});

this.departureRoom = {
  ...sala,
  obstacles: [
    ...sala.obstacles,
    {
      id: 'silla-paciente-salida',
      x: silla.x - 16,
      y: silla.y - 31,
      w: 32,
      h: 29
    }
  ]
};

const tramo1 = findPath(
  this.departureExit,
  lado,
  this.departureRoom
);

const tramo2 = findPath(
  lado,
  this.room.exitDoor,
  this.departureRoom
);

if (!tramo1.length || !tramo2.length) return false;

const route = [...tramo1, ...tramo2];
    const residentRoute=resident.seated?[]:findPath(resident,this.room.seat.exit,actorRoom(this.room,patient));
    if(!route.length||(!resident.seated&&!residentRoute.length))return false;
    this.patient=patient;this.departureRoute=route;resident.path=residentRoute;resident.walking=false;this.stage='parking';return true;
  }
  arrive(patient,resident){
    const martin = window.HepatoDay1Modules?.['simulation-cases.mjs']
      ?.PATIENT_CATALOG?.['masld-intro-v1-reasoning-v2'];

    const esMartin = !!martin &&
  patient.appearance === martin.patient.appearance;

const elena = window.HepatoDay1Modules
  ?.['simulation-cases.mjs']
  ?.PATIENT_CATALOG
  ?.['masld-older-v1-reasoning-v2'];

const esElena = !!elena &&
  patient.appearance === elena.patient.appearance;
    const sofia = window.HepatoDay1Modules
  ?.['simulation-cases.mjs']
  ?.PATIENT_CATALOG
  ?.['gilbert-v1-reasoning-v2'];

const esSofia = !!sofia &&
  patient.appearance === sofia.patient.appearance;

    const room = actorRoom(this.room, resident);
    let route;
    this.arrivalRoom = null;

    if (esMartin || esSofia || esElena) {
      const silla = this.room.patientSeat;

      // Rodea la silla por la derecha y llega por delante.
      const porElLado = {
        x: silla.x + 30,
        y: silla.y + 4
      };

      const frente = {
        x: silla.x,
        y: silla.y + 4
      };

      const roomConSilla = {
        ...room,
        obstacles: [
          ...room.obstacles,
          {
            id: 'silla-paciente-entrada',
            x: silla.x - 16,
            y: silla.y - 31,
            w: 32,
            h: 29
          }
        ]
      };

      const tramo1 = findPath(
        this.room.exitDoor, porElLado, roomConSilla
      );

      const tramo2 = findPath(
        porElLado, frente, roomConSilla
      );

      if (!tramo1.length || !tramo2.length) return false;

      route = [...tramo1, ...tramo2];
      this.arrivalRoom = roomConSilla;
    } else {
      route = findPath(
        this.room.exitDoor,
        EXAM_STATIONS.patientExit,
        room
      );

      if (!route.length) return false;
    }

    this.patient = patient;

    Object.assign(patient, this.room.exitDoor, {
      seated: false,
      pose: 'standing',
      mode: 'arriving',
      face: 'down',
      visible: true,
      walking: false,
      path: route
    });

    this.patientTween = null;
    this.beginPortal(true);
    return true;
  }
  update(resident,dt){
    if(!this.busy)return null;
    this.clock+=dt;const p=this.patient;
    for(const which of ['patientTween','residentTween'])if(this[which]&&this.clock-this[which].at>=this[which].duration)this[which]=null;
    if(this.stage==='parking'){
      if(resident.path.length)followPath(resident,dt,actorRoom(this.room,p));
      if(!resident.path.length&&!resident.seated){const from={...resident};if(sit(resident,this.room))this.tween(resident,from,resident,'residentTween');}
      if(resident.seated&&!this.residentTween){
        const from={...p};Object.assign(p,this.departureExit || EXAM_STATIONS.patientExit,{seated:false,pose:'standing',mode:'leaving',face:'down',walking:false,path:this.departureRoute});
        this.tween(p,from,p,'patientTween');this.stage='leaving';
      }
    }else if(this.stage==='leaving'||this.stage==='arriving'){
      if(!this.patientTween&&p.path.length)followPath(
  p,
  dt,
  this.stage === 'arriving' && this.arrivalRoom
  ? this.arrivalRoom
  : this.stage === 'leaving' && this.departureRoom
    ? this.departureRoom
    : actorRoom(this.room, resident)
);
      else p.walking=false;
      if(!p.path.length&&!this.patientTween){
        p.walking=false;
        if(this.stage==='leaving'){this.beginPortal(false);}
        else {
          const martin = window.HepatoDay1Modules?.['simulation-cases.mjs']
            ?.PATIENT_CATALOG?.['masld-intro-v1-reasoning-v2'];

          const sofia = window.HepatoDay1Modules
  ?.['simulation-cases.mjs']
  ?.PATIENT_CATALOG
  ?.['gilbert-v1-reasoning-v2'];

const elena = window.HepatoDay1Modules
  ?.['simulation-cases.mjs']
  ?.PATIENT_CATALOG
  ?.['masld-older-v1-reasoning-v2'];

if (
  (martin && p.appearance === martin.patient.appearance) ||
  (sofia && p.appearance === sofia.patient.appearance) ||
  (elena && p.appearance === elena.patient.appearance)
) {
            p.face = 'down';
            p.seated = false;
            p.pose = 'standing';
            this.facingAt = this.clock;
            this.stage = 'facing';
          } else {
            const from = {...p};

            Object.assign(p, EXAM_STATIONS.patientSeat, {
              seated: true,
              pose: 'seated',
              mode: 'sitting',
              walking: false
            });

            this.tween(p, from, p, 'patientTween');
            this.stage = 'seating';
          }
        }
      }
    }else if(this.stage==='facing') {
      p.walking = false;

      if (this.clock - this.facingAt >= 0.45) {
        Object.assign(p, EXAM_STATIONS.patientSeat, {
          face: 'down',
          seated: true,
          pose: 'seated',
          mode: 'idle',
          walking: false
        });

        this.patientTween = null;
        this.stage = 'idle';
        return 'arrived';
      }
    }else if(this.stage==='fade-in'&&this.clock-this.fadeAt>=this.portalSeconds+(this.room.doorway.openSeconds??.18)){
      p.distance=this.portalStartDistance+this.portalDistance;p.walkTime=this.portalStartWalkTime+this.portalSeconds;this.stage='arriving';
    }
    else if(this.stage==='fade-out'&&this.clock-this.fadeAt>=this.portalSeconds+(this.room.doorway.closeSeconds??.18)){
      p.distance=this.portalStartDistance+this.portalDistance;p.walkTime=this.portalStartWalkTime+this.portalSeconds;
      p.visible=false;p.mode='departed';this.stage='departed';return 'departed';
    }
    else if(this.stage==='seating'&&!this.patientTween){p.mode='idle';this.stage='idle';return 'arrived';}
    return null;
  }
}

return {VISIT_DOOR,VisitSequence};
})();

