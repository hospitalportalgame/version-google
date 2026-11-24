/* Embedded original source: src/graficos/camilla.js */
/* Módulo compartido original: bed-linen.mjs. Conservado sin modificar su lógica. */
window.HepatoSharedModules['bed-linen.mjs'] = (() => {
const {bitmap} = window.HepatoSharedModules['pixel-art.mjs'];
// A separate textile belongs to the bed. It settles over the legs after the
// patient reclines and is pulled back before the legs leave the mattress.
const LINEN_COLORS={s:'#c5d1dd',m:'#e2e7eb',l:'#f3f4ec',h:'#eef3f4',d:'#9daec4'};
const LINEN_ROWS=[
 '.ssssssssssssssssssssssssss.',
 'smhhhhhhhhhhhhhhhhhhhhhhhhms',
 'smhhhhhhhhhhhhhhhhhhhhhhhhms',
 'smmmmmmmmmmmmmmmmmmmmmmmmmms',
 'smllllllllllllllllllllllllms',
 'smllllllllllllllllllllllllms',
 'sllllllllllllllllllllllllmls',
 'sllllmlllllllllllllllllllmls',
 'sllllmlllllllllllllllllllmls',
 'slllllmllllllllllllllllllmls',
 'slllllmllllllllllllllllllmls',
 'sllllllmlllllllllllllllllmls',
 'sllllllmlllllllllllllllllmls',
 'sllllllllllhhhhhhllllllllmls',
 'slllllllllmllllllmlllllllmls',
 'sllllllllmllllllllmllllllmls',
 'slllllllmllllllllllmlllllmls',
 'sllllllmllllllllllllmllllmls',
 'sllllllllllllllllllllllllmls',
 'sllllmllllllllllllllllmllmls',
 'slllllmllllllllllllllmlllmls',
 'sllllllmllllllllllllmllllmls',
 'smllllllllllllllllllllllllms',
 'smmmmmmmmmmmmmmmmmmmmmmmmmms',
 '.ssssssssssssssssssssssssss.',
 '..dddddddddddddddddddddddd..'
];

function paintBedLinen(r,room,actor){
 if(actor.resident)return;
 const action=actor.animation?.action;
 let amount=actor.pose==='lying'?1:0;
 if(['mount','dismount'].includes(action))amount=Math.max(0,Math.min(1,actor.animation.linenAmount??0));
 if(amount<=0)return;
 const rows=Math.ceil(LINEN_ROWS.length*amount),start=LINEN_ROWS.length-rows;
 // The folded edge overlaps the waist below the examining hand, attaching
 // the sheet to the supine body rather than leaving a detached lower panel.
 bitmap(r,LINEN_ROWS.slice(start),room.exam.bedPose.x-14,room.exam.bedPose.y-18+start,LINEN_COLORS);
}

return {paintBedLinen};
})();

