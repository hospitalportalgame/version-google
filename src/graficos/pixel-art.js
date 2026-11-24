/* Embedded original source: src/graficos/pixel-art.js */
/* Módulo compartido original: pixel-art.mjs. Conservado sin modificar su lógica. */
window.HepatoSharedModules['pixel-art.mjs'] = (() => {
// The room uses a one-pixel grid. Every asset is drawn with integer rectangles;
// no external fonts, bitmap downloads, gradients, or antialiased paths are needed.
const ART = Object.freeze({
  ink:'#3a3a50',deep:'#46465e',edge:'#565972',
  wall:'#d9dce2',wallLight:'#f8f8f8',wallShade:'#aeb2c3',
  jade:'#719578',jadeLight:'#a3b696',jadeDark:'#4c745c',
  floor:'#c8d5df',floorLight:'#cfdbe1',grout:'#aeb2c3',
  shadow:'#b3bac7',shadowDeep:'#929eaf',
  wood:'#ba8859',woodLight:'#dfb57a',woodDark:'#835e47',
  paper:'#ebe4f2',paperShade:'#d8d0e0',
  metal:'#aeb2c3',metalLight:'#cccfde',metalDark:'#565972',
  blue:'#6899b5',blueLight:'#a7cedd',blueDark:'#506983',
  cloth:'#a5afbf',clothLight:'#d9dce6',clothDark:'#747d96',
  coral:'#be806d',coralLight:'#dfa587',leaf:'#71935e',leafLight:'#9fba77',leafDark:'#486d4f'
});

function bitmap(r,rows,x,y,colors,scale=1,mirror=false){
  const width=Math.max(...rows.map(row=>row.length));
  for(let yy=0;yy<rows.length;yy++)for(let xx=0;xx<rows[yy].length;xx++){
    const color=colors[rows[yy][xx]];
    if(color)r(x+(mirror?width-xx-1:xx)*scale,y+yy*scale,scale,scale,color);
  }
}

const GLYPHS={
  A:['010','101','111','101','101'],B:['110','101','110','101','110'],
  C:['011','100','100','100','011'],D:['110','101','101','101','110'],
  E:['111','100','110','100','111'],F:['111','100','110','100','100'],
  G:['011','100','101','101','011'],H:['101','101','111','101','101'],
  I:['111','010','010','010','111'],J:['001','001','001','101','010'],
  K:['101','101','110','101','101'],L:['100','100','100','100','111'],
  M:['101','111','111','101','101'],N:['101','111','111','111','101'],
  O:['010','101','101','101','010'],P:['110','101','110','100','100'],
  Q:['010','101','101','111','011'],R:['110','101','110','101','101'],
  S:['011','100','010','001','110'],T:['111','010','010','010','010'],
  U:['101','101','101','101','111'],V:['101','101','101','101','010'],
  W:['101','101','111','111','101'],X:['101','101','010','101','101'],
  Y:['101','101','010','010','010'],Z:['111','001','010','100','111'],
  '0':['111','101','101','101','111'],'1':['010','110','010','010','111'],
  '2':['110','001','010','100','111'],'3':['110','001','010','001','110'],
  '4':['101','101','111','001','001'],'5':['111','100','110','001','110'],
  '6':['011','100','111','101','111'],'7':['111','001','010','010','010'],
  '8':['111','101','111','101','111'],'9':['111','101','111','001','110'],
  '+':['000','010','111','010','000'],'-':['000','000','111','000','000'],
  ' ':['000','000','000','000','000']
};
function pixelLabel(r,value,x,y,color=ART.ink,scale=1){
  const normalized=String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
  for(const glyph of normalized){bitmap(r,GLYPHS[glyph]||GLYPHS[' '],x,y,{'1':color},scale);x+=4*scale;}
}


return {ART,bitmap,pixelLabel};
})();

