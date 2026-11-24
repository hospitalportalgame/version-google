/* Embedded original source: src/sistemas/examen-fisico.js */
/* Módulo compartido original: exam.mjs. Conservado sin modificar su lógica. */
window.HepatoSharedModules['exam.mjs'] = (() => {
const {ROOM,FOOT,WALK_SPEED,PATIENT_WALK_SPEED,createPlayer,isFree,findPath,followPath,sit,stand} = window.HepatoSharedModules['engine.mjs'];
const {SPRITE_ART} = window.HepatoSharedModules['character-art.mjs'];
const EXAM_STATIONS={patientSeat:ROOM.patientSeat,...ROOM.exam};

// Chairs and the clinical gesture use six contact keys. Bed transfers use
// native microposes whose anchors and supports are authored with the rig.
const transfer=SPRITE_ART.bedTransfer;
const nativeMount=transfer?.anchors?.length&&transfer.keys?.length===transfer.anchors.length&&transfer.weights?.length===transfer.anchors.length;
const ACTOR_TRANSITIONS={
  sit:{duration:.66,weights:[.10,.14,.18,.22,.18,.18],motion:[0,.48,.84,1,1,1],keys:['approach','align','hinge','contact','settle','rest']},
  stand:{duration:.62,weights:[.14,.18,.22,.18,.16,.12],motion:[0,0,0,.16,.52,1],keys:['rest','balance','push','rise','align','standing']},
  mount:nativeMount?{duration:transfer.duration??1.6,weights:transfer.weights,keys:transfer.keys,linen:transfer.linen,discrete:true}
    :{duration:1.30,weights:[.12,.20,.20,.16,.18,.14],keys:['reach','support','edge','swing','recline','rest']},
  dismount:nativeMount?{duration:transfer.dismountDuration??1.5,weights:[...transfer.weights].reverse(),keys:[...transfer.keys].reverse(),linen:transfer.linen&&[...transfer.linen].reverse(),discrete:true}
    :{duration:1.20,weights:[.14,.18,.16,.20,.20,.12],keys:['rest','upright','swing','edge','support','landing']},
  examine:{duration:1.70,weights:[.16,.16,.15,.23,.18,.12],motion:[0,0,0,0,0,0],keys:['anticipate','lean','contact','hold','withdraw','rest']}
};
const clamp=n=>Math.max(0,Math.min(1,n)),ease=n=>n*n*(3-2*n);
const point=p=>({x:p.x,y:p.y});

function createActorTransition(actor,from,to,action,clock,{duration,anchors,face}={}){
  const clip=ACTOR_TRANSITIONS[action]||ACTOR_TRANSITIONS.stand;
  const a=point(from),b=point(to),travel=clip.motion||clip.keys.map((_,i)=>i/(clip.keys.length-1));
  return {from:a,to:b,at:clock,duration:duration??clip.duration,action,
    face:face||(action==='sit'?to.face:from.face)||actor.face||'down',
    anchors:(anchors||travel.map(f=>({x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f}))).map(point)};
}

function sampleActorTransition(transition,clock){
  const clip=ACTOR_TRANSITIONS[transition.action]||ACTOR_TRANSITIONS.stand;
  const progress=clamp((clock-transition.at)/transition.duration);
  let frame=0,start=0;
  while(frame<clip.weights.length-1&&progress>=start+clip.weights[frame]-1e-10){start+=clip.weights[frame++];}
  const local=clamp((progress-start)/clip.weights[frame]);
  const a=transition.anchors[frame],b=transition.anchors[Math.min(frame+1,transition.anchors.length-1)],f=clip.discrete?0:ease(local);
  return {x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f,
    animation:{action:transition.action,progress,frame,key:clip.keys[frame],face:transition.face,
      ...(['mount','dismount'].includes(transition.action)?{linenAmount:clip.linen?.[frame]??0}:{})}};
}

function createPatient(appearance=null,room=ROOM){return {...createPlayer(),...room.patientSeat,speed:PATIENT_WALK_SPEED,seated:true,pose:'seated',mode:'idle',visible:true,appearance};}
function actorRoom(room,other){
  if(!other||other.visible===false||other.pose==='lying')return room;
  const x=FOOT.halfWidth+1,y=FOOT.halfHeight;
  return {...room,obstacles:[...room.obstacles,{id:'other-actor',x:other.x-x,y:other.y-y,w:x*2,h:y*2}]};
}

// Walking remains swept physics. Furniture transfers are visible contact
// sequences; the model stays at its reserved floor station until on the bed.
class ExamSequence {
  constructor(room=ROOM,appearance=null){
    this.room=room;this.stations={patientSeat:room.patientSeat,...room.exam};this.patient=createPatient(appearance,room);
    this.stage='idle';this.clock=0;this.patientTween=null;this.residentTween=null;
    this.patientDeparture=null;this.residentApproach=null;this.residentApproachStarted=false;this.examinationStarted=false;this.coordinatedDeparture=false;
  }
  get busy(){return this.stage==='to_bed'||this.stage==='returning';}
  get atBed(){return this.stage==='at_bed';}
  bedAnchors(){
    const s=this.stations,entry=s.bedEntry,rest=s.bedPose,edge=s.bedEdgePose||{x:entry.x+(rest.x-entry.x)*.45,y:rest.y-10};
    if(s.bedTransfer)return s.bedTransfer;
    if(nativeMount){
      const baseEntry=transfer.reference.entry,baseRest=transfer.reference.rest;
      const entryOffset={x:entry.x-baseEntry.x,y:entry.y-baseEntry.y};
      const restOffset={x:rest.x-baseRest.x-entryOffset.x,y:rest.y-baseRest.y-entryOffset.y};
      return transfer.anchors.map(a=>{
        const progress=clamp((a.x-baseEntry.x)/(baseRest.x-baseEntry.x));
        return {x:a.x+entryOffset.x+restOffset.x*progress,y:a.y+entryOffset.y+restOffset.y*progress};
      });
    }
    const style=this.patient.appearance?.style||'short',face=entry.face||'right',rig=SPRITE_ART.landmarks?.[style]?.[face]?.mount;
    if(!rig)return [entry,entry,edge,edge,{x:edge.x+(rest.x-edge.x)*.55,y:edge.y+(rest.y-edge.y)*.5},rest];
    const ax=SPRITE_ART.anchorX??24,ay=SPRITE_ART.anchorY??60;
    const contact=s.bedEdgeContact||{x:edge.x+rig[2].pelvis.x-ax,y:edge.y+rig[2].pelvis.y-ay};
    const restingPelvis={x:rest.x+rig[5].pelvis.x-ax,y:rest.y+rig[5].pelvis.y-ay};
    const anchor=(joint,key)=>({x:joint.x-rig[key].pelvis.x+ax,y:joint.y-rig[key].pelvis.y+ay});
    const recliningJoint={x:contact.x+(restingPelvis.x-contact.x)*.55,y:contact.y+(restingPelvis.y-contact.y)*.55};
    // While the legs swing, the pelvis stays on the measured bed lip. The
    // local rig may change in later art revisions without moving that contact.
    return [entry,entry,anchor(contact,2),anchor(contact,3),anchor(recliningJoint,4),rest];
  }
  tween(actor,from,to,which,duration){
    const action=which==='residentTween'?(actor.seated?'sit':'stand'):({rising:'stand',mounting:'mount',dismounting:'dismount',sitting:'sit'}[actor.mode]||'stand');
    const anchors=action==='mount'?this.bedAnchors():action==='dismount'?[...this.bedAnchors()].reverse():undefined;
    this[which]=createActorTransition(actor,from,to,action,this.clock,{duration,anchors,
      face:['mount','dismount'].includes(action)?this.stations.bedEntry.face||'right':undefined});
  }
  tweenDone(which){return !this[which]||this.clock-this[which].at>=this[which].duration-1e-10;}
  visual(actor,which){const t=this[which];return t?{...actor,...sampleActorTransition(t,this.clock)}:actor;}
  
visualPatient() {
  const actor = this.visual(this.patient, 'patientTween');

  // Aplicar el ajuste exclusivamente a Sofia.
  if (
    this.patient?.mode !== 'rising' ||
    actor.animation?.action !== 'stand'
  ) return actor;

  const sofia = window.HepatoDay1Modules
    ?.['simulation-cases.mjs']
    ?.PATIENT_CATALOG
    ?.['gilbert-v1-reasoning-v2'];

  if (
    !sofia ||
    this.patient.appearance !== sofia.patient.appearance
  ) return actor;

  const avance = actor.animation.progress ?? 0;

  // Primera parte: Sofia permanece sentada.
  if (avance < 0.83) {
    return {
      ...actor,
      x: this.room.patientSeat.x,
      y: this.room.patientSeat.y,
      seated: true,
      pose: 'seated',
      walking: false
    };
  }

  // Segunda parte: aparece de pie delante de la silla.
  return {
    ...actor,
    x: this.patientTween.to.x,
    y: this.patientTween.to.y,
    seated: false,
    pose: 'standing',
    face: 'down',
    walking: false
  };
}

  visualResident(resident){
    const actor=this.visual(resident,'residentTween');
    // Waiting is an oriented neutral pose. The final clinical pose is the
    // same neutral key, so the ready signal never pops back to an extended arm.
    if(this.atBed||this.stage==='to_bed'&&!resident.path.length&&!this.residentTween){
      return {...actor,pose:'standing',face:this.stations.residentExam.face};
    }
    return actor;
  }
  departureIsClear(resident){
    if(this.residentTween)return false;
    if(!resident.path.length)return true;
    const s=this.stations,waiting=s.residentWait||s.residentExam,target=resident.path[0];
    // Only the known chair-to-bed route may overlap departures. The resident
    // must have cleared the shared lower passage and be moving north in the
    // bed aisle, faster than the patient. Rising takes .62 s, opening a larger
    // gap before the patient starts walking. Arbitrary standing starts retain
    // the full parking rule, including the adverse right-hand passage starts.
    return this.coordinatedDeparture&&resident.path.length===1&&
      Math.hypot(target.x-waiting.x,target.y-waiting.y)<1e-7&&
      Math.abs(resident.x-waiting.x)<=FOOT.halfWidth&&
      resident.y>=waiting.y&&resident.y<=s.patientExit.y+FOOT.halfHeight&&
      (resident.speed||WALK_SPEED)>=(this.patient.speed||PATIENT_WALK_SPEED);
  }
  begin(resident){
    if(this.busy||this.atBed||!this.patient.seated)return false;
    const p=this.patient,s=this.stations,rstart=resident.seated?this.room.seat.exit:resident,waiting=s.residentWait||s.residentExam;
    const settledResident={...resident,...waiting,seated:false,pose:'standing'};
    
const sofia = window.HepatoDay1Modules
  ?.['simulation-cases.mjs']
  ?.PATIENT_CATALOG
  ?.['gilbert-v1-reasoning-v2'];

const esSofia =
  !!sofia && p.appearance === sofia.patient.appearance;

// Punto delante de la silla, igual al recorrido de entrada.
const frenteSilla = {
  x: this.room.patientSeat.x,
  y: this.room.patientSeat.y + 4
};

const exits = esSofia
  ? [
      frenteSilla,
      s.patientExit,
      {x:this.room.patientSeat.x+20,y:s.patientExit.y},
      {x:this.room.patientSeat.x+20,y:this.room.patientSeat.y+20}
    ]
  : [
      s.patientExit,
      {x:this.room.patientSeat.x+20,y:s.patientExit.y},
      {x:this.room.patientSeat.x+20,y:this.room.patientSeat.y+20}
    ];

    const exit=exits.find(e=>isFree(e.x,e.y,actorRoom(this.room,settledResident)));
    if(!exit)return false;
    const patientPath=findPath(exit,s.bedEntry,actorRoom(this.room,settledResident));
    const residentPath=findPath(rstart,waiting,actorRoom(this.room,p));
    const approach=findPath(waiting,s.residentExam,this.room);
    if(!patientPath.length||!residentPath.length||!approach.length)return false;
    const seatedDeparture=resident.seated;
    if(resident.seated){const from={...resident};if(!stand(resident,this.room))return false;this.tween(resident,from,resident,'residentTween');}
    this.patientDeparture={exit:{...exit},path:patientPath};this.residentApproach=approach;resident.path=residentPath;resident.walking=false;
    this.coordinatedDeparture=seatedDeparture&&rstart.x<=exit.x-40;
    this.stage='to_bed';this.residentApproachStarted=false;this.examinationStarted=false;return true;
  }
  finish(resident){
    if(!this.atBed)return false;
    const p=this.patient,s=this.stations,exit=s.bedEntry,rstart=resident.seated?this.room.seat.exit:resident;
    const silla = this.room.patientSeat;

const lado = {
  x: silla.x + 30,
  y: silla.y + 4
};

const frente = {
  x: silla.x,
  y: silla.y + 4
};

this.patientReturnRoom = {
  ...this.room,
  obstacles: [
    ...this.room.obstacles,
    {
      id: 'silla-paciente-regreso',
      x: silla.x - 16,
      y: silla.y - 31,
      w: 32,
      h: 29
    }
  ]
};

const salaRegreso = actorRoom(
  this.patientReturnRoom,
  {...resident, ...rstart}
);

const tramo1 = findPath(exit, lado, salaRegreso);
const tramo2 = findPath(lado, frente, salaRegreso);

if (!tramo1.length || !tramo2.length) return false;

const patientPath = [...tramo1, ...tramo2];
    const residentPath=findPath(rstart,this.room.seat.exit,actorRoom(this.room,{...p,...exit,pose:'standing'}));
    if(!patientPath.length||!residentPath.length)return false;
    if(resident.seated){const from={...resident};if(!stand(resident,this.room))return false;this.tween(resident,from,resident,'residentTween');}
    const from={...p};Object.assign(p,exit,{pose:'standing',mode:'dismounting',face:'down',walking:false,path:patientPath});
    this.tween(p,from,p,'patientTween');resident.path=residentPath;this.stage='returning';return true;
  }
  update(resident,dt){
    if(!this.busy)return null;this.clock+=dt;const p=this.patient,s=this.stations;
    if(this.residentTween&&this.tweenDone('residentTween'))this.residentTween=null;
    if(this.patientTween&&this.tweenDone('patientTween')){
      this.patientTween=null;
      if(p.mode==='rising')p.mode='to_bed';
      else if(p.mode==='mounting'){Object.assign(p,s.bedPose,{pose:'lying',mode:'on_bed',face:s.bedPose.face});}
      else if(p.mode==='dismounting')p.mode='returning';
      else if(p.mode==='sitting')p.mode='idle';
    }
    if(!this.residentTween&&resident.path.length)followPath(resident,dt,actorRoom(this.room,p));
    else resident.walking=false;
    if (!this.patientTween && p.path.length) {
  const salaPaciente =
    this.stage === 'returning' && this.patientReturnRoom
      ? this.patientReturnRoom
      : this.room;

  followPath(p, dt, actorRoom(salaPaciente, resident));
}
    else p.walking=false;
    if(this.stage==='to_bed'){
      if(!p.path.length&&p.mode==='to_bed'){
        p.walking=false;p.mode='mounting';p.face=s.bedEntry.face||'right';this.tween(p,p,s.bedPose,'patientTween');
      }
      if(!resident.path.length&&!this.residentTween&&!this.residentApproachStarted){
        resident.face=(s.residentWait||s.residentExam).face;
      }
      if(this.patientDeparture&&this.departureIsClear(resident)){
          const from={...p},{exit,path}=this.patientDeparture;
          Object.assign(p,exit,{seated:false,pose:'standing',mode:'rising',face:'down',walking:false,path});
          this.tween(p,from,p,'patientTween');this.patientDeparture=null;
      }
      if(p.mode==='on_bed'&&!this.residentTween){
        if(!this.residentApproachStarted){
          this.residentApproachStarted=true;
          if(Math.hypot(resident.x-s.residentExam.x,resident.y-s.residentExam.y)>1e-6){
            resident.path=this.residentApproach.map(point);return null;
          }
        }
        if(!resident.path.length){
          resident.walking=false;resident.face=s.residentExam.face;
          if(!this.examinationStarted){
            const station=point(resident);
            this.residentTween=createActorTransition(resident,station,station,'examine',this.clock,{face:s.residentExam.face});
            this.examinationStarted=true;
          }else{this.stage='at_bed';return 'ready';}
        }
      }
    }else{
      if(!resident.path.length&&!resident.seated&&!this.residentTween){const from={...resident};if(sit(resident,this.room))this.tween(resident,from,resident,'residentTween');}
      if(!p.path.length&&p.mode==='returning'){
        const from={...p};Object.assign(p,s.patientSeat,{seated:true,pose:'seated',mode:'sitting',walking:false});this.tween(p,from,p,'patientTween');
      }
      if(p.mode==='idle'&&resident.seated&&!this.residentTween){this.stage='complete';return 'complete';}
    }
    return null;
  }
}

return {EXAM_STATIONS,ACTOR_TRANSITIONS,createActorTransition,sampleActorTransition,createPatient,actorRoom,ExamSequence};
})();

