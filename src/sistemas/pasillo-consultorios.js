/* HOSPITAL PORTAL · Pasillo de consultorios. */
(()=>{
  'use strict';

  const W=768;
  const H=512;

  const fondo=new Image();
  fondo.src='assets/escenarios/pasillo-especialidades-aprobado.png';
  const hoja=new Image();
  hoja.src='assets/escenarios/pasillo-consultorios.png';

  // Medidas de la imagen aprobada.
  const ORIGINAL_W=1774;
  const ORIGINAL_H=887;
  const ESCALA=H/ORIGINAL_H;
  const ANCHO_MUNDO=ORIGINAL_W*ESCALA;
  let camaraX=0;
  let acceso=null;
  let salidaTransicion=false;
  let puertaSalidaCancelada={activa:false,apertura:0};
  let puertaAutoApertura=0;
  let sensorDetecta=false, sensorLuz=0, sensorLuzTiempo=null;

function tweenPuerta(val){
  if(window.HP_TWEEN_PUERTAS_ENABLED!==false&&typeof TWEEN!=='undefined'&&TWEEN.Easing?.Quadratic?.InOut){
    return TWEEN.Easing.Quadratic.InOut(val);
  }
  return val*val*(3-2*val);
}

function calcularAperturaSalida(){
  if(acceso?.tipo==='salida'){
    const t=acceso.t;
    if(t<0.45)return 0;
    if(t<=1.05){
      return tweenPuerta((t-0.45)/0.60);
    }
    if(t<=1.65){
      return 1;
    }
    if(t<=2.35){
      return 1-tweenPuerta((t-1.65)/0.70);
    }
    return 0;
  }
  if(puertaSalidaCancelada.activa){
    return puertaSalidaCancelada.apertura;
  }
  return tweenPuerta(puertaAutoApertura);
}

function iniciarEntrada(actor,alTerminar){
  if(acceso)return false;

  acceso={
    t:0,
    tipo:'hepatologia',
    actor,
    x:actor.x,
    y:actor.y,
    alTerminar
  };

  actor.face='up';
  actor.walking=false;
  return true;
}
function iniciarSalida(actor,alTerminar){
  if(acceso)return false;
  puertaSalidaCancelada.activa=false;
  const yaEnUmbral=actor.y<=375;
  acceso={t:yaEnUmbral?1.65:0,tipo:'salida',dentro:yaEnUmbral,actor,x:actor.x,y:actor.y,alTerminar};
  actor.face='up';actor.walking=false;
  return true;
}

function cancelarSalida(){
  if(acceso?.tipo!=='salida'||acceso.dentro)return false;
  const apActual=calcularAperturaSalida();
  if(apActual>0.01){
    puertaSalidaCancelada.activa=true;
    puertaSalidaCancelada.apertura=apActual;
  }else{
    puertaSalidaCancelada.activa=false;
    puertaSalidaCancelada.apertura=0;
  }
  puertaAutoApertura=0;
  acceso.actor.walking=false;
  acceso=null;
  salidaTransicion=false;
  return true;
}
function actualizarSensor(actor,dt,onCruzar){
  const paso=Math.min(dt,0.05);
  sensorDetecta=false;
  if(puertaSalidaCancelada.activa){
    puertaSalidaCancelada.apertura=Math.max(0,puertaSalidaCancelada.apertura-paso/0.45);
    if(puertaSalidaCancelada.apertura<=0){
      puertaSalidaCancelada.activa=false;
      puertaSalidaCancelada.apertura=0;
    }
    puertaAutoApertura=0;
    return;
  }
  if(acceso||salidaTransicion)return;
  const g=geometria();
  const xIzq=28*g.escala,xDer=190*g.escala;
  const sueloAt=px=>(665-(px/g.escala-28)*(65/162))*g.escala;
  // Zona de activación del sensor automático frente al vano (x:30..95, y:365..430)
  // o mientras siga ocupando el umbral para no atrapar al personaje
  const enUmbral=actor.x>=xIzq-5&&actor.x<=xDer+5&&actor.y<=sueloAt(actor.x)+12;
  const enZonaSensor=enUmbral||(actor.x>=30&&actor.x<=95&&actor.y<=430&&actor.y>=365);
  sensorDetecta=enZonaSensor;
  if(enZonaSensor){
    puertaAutoApertura=Math.min(1,puertaAutoApertura+paso/0.40);
  }else{
    puertaAutoApertura=Math.max(0,puertaAutoApertura-paso/0.45);
  }
  // Si la puerta está abierta al menos al 80% y la médica cruza el umbral:
  if(puertaAutoApertura>=0.80&&actor.y<=sueloAt(actor.x)){
    onCruzar?.();
  }
}

function actualizar(dt){
  const paso=Math.min(dt,0.05);

  if(puertaSalidaCancelada.activa){
    puertaSalidaCancelada.apertura=Math.max(0,puertaSalidaCancelada.apertura-paso/0.45);
    if(puertaSalidaCancelada.apertura<=0){
      puertaSalidaCancelada.activa=false;
      puertaSalidaCancelada.apertura=0;
    }
  }

  if(!acceso)return;

  const a=acceso;
  const p=a.actor;
  if(a.tipo==='salida'){
    a.t+=paso;
    const destino={x:54,y:405};
    const umbralY=368;
    const antesX=p.x,antesY=p.y;

    if(a.t<0.45){
      const avance=Math.min(1,a.t/0.45);
      p.x=a.x+(destino.x-a.x)*avance;
      p.y=a.y+(destino.y-a.y)*avance;
      p.face='up';
      const dist=Math.hypot(p.x-antesX,p.y-antesY);
      p.distance+=dist;p.walking=dist>0.001;
    }else if(a.t<1.05){
      p.x=destino.x;p.y=destino.y;
      p.walking=false;p.face='up';
    }else if(a.t<1.65){
      p.x=destino.x;
      const avance=Math.min(1,(a.t-1.05)/0.60);
      p.y=destino.y+(umbralY-destino.y)*avance;
      p.face='up';
      const dist=Math.abs(p.y-antesY);
      p.distance+=dist;p.walking=dist>0.001;
    }else{
      p.x=destino.x;
      p.y=umbralY;
      p.walking=false;p.face='up';
      a.dentro=true;
    }

    if(a.t>=2.45){
      salidaTransicion=true;
      const terminar=a.alTerminar;
      p.walking=false;
      acceso=null;
      terminar?.();
    }
    return;
  }

  const destino=posicionImagen(460,700);
  const interior=posicionImagen(460,600);

  a.t+=paso;

  const antesX=p.x;
  const antesY=p.y;
  const limitar=n=>Math.max(0,Math.min(1,n));

  if(a.t<0.45){
    const avance=limitar(a.t/0.45);
    p.x=a.x+(destino.x-a.x)*avance;
    p.y=a.y+(destino.y-a.y)*avance;
  }else{
    p.x=destino.x;

    const avance=limitar((a.t-1.05)/0.85);
    p.y=destino.y+(interior.y-destino.y)*avance;
  }

  const distancia=Math.hypot(p.x-antesX,p.y-antesY);
  p.distance+=distancia;
  p.walking=distancia>0.001;
  p.face='up';

  if(a.t>=2.7){
    const terminar=a.alTerminar;
    p.walking=false;
    acceso=null;
    terminar?.();
  }
}

function dibujarAcceso(ctx,dibujarMedica){
  if(!acceso){
    if(!salidaTransicion)dibujarMedica();
    return;
  }

  if(acceso.tipo==='salida'){
    if(!acceso.dentro&&!salidaTransicion){
      dibujarMedica();
    }
    return;
  }

  const t=acceso.t;
  const limitar=n=>Math.max(0,Math.min(1,n));

  const apertura=Math.min(
    limitar((t-0.45)/0.5),
    limitar((2.6-t)/0.6)
  );

  const g=geometria();
  const origen={x:380,y:290,w:170,h:310};

  const x=g.x+origen.x*g.escala;
  const y=g.y+origen.y*g.escala;
  const ancho=origen.w*g.escala;
  const alto=origen.h*g.escala;

  const dentro=t>=1.7;

  if(apertura>0&&fondo.complete&&fondo.naturalWidth){
    ctx.save();
    ctx.beginPath();
    ctx.rect(x,y,ancho,alto);
    ctx.clip();

    if(dentro)dibujarMedica();

    // Hoja que gira sobre la bisagra izquierda.
    const anchoHoja=ancho*(1-apertura);

    if(anchoHoja>0.5){
      ctx.imageSmoothingEnabled=true;
      ctx.imageSmoothingQuality='high';

      ctx.drawImage(
        hoja,
        1043,87,194,324,
        x,y,anchoHoja,alto
      );
    }

    ctx.restore();
  }

  if(!dentro)dibujarMedica();

  // MEJORA GRÁFICA 5: Fundido cinematográfico suave al terminar de ingresar al consultorio
  if(t>=2.40){
    const progreso=Math.max(0,Math.min(1,(t-2.40)/0.30));
    const alpha=(window.HP_TWEEN_TRANSICIONES_ENABLED!==false&&typeof TWEEN!=='undefined'&&TWEEN.Easing?.Quadratic?.InOut)
      ?TWEEN.Easing.Quadratic.InOut(progreso)
      :progreso*progreso*(3-2*progreso);
    if(alpha>0.001){
      ctx.fillStyle='rgba(13,29,37,'+alpha+')';
      ctx.fillRect(camaraX,0,ctx.canvas.width,H);
    }
  }
}

  function geometria(){
    const escala=ESCALA;

    const ancho=ORIGINAL_W*escala;
    const alto=ORIGINAL_H*escala;

    return {
      escala,
      x:0,
      y:0,
      ancho,
      alto
    };
  }

  function posicionImagen(x,y){
    const g=geometria();

    return {
      x:g.x+x*g.escala,
      y:g.y+y*g.escala
    };
  }

function dibujarPuertas(ctx,dibujarMedica){
  const g=geometria();
  if(!hoja.complete||!hoja.naturalWidth)return;
  ctx.save();ctx.imageSmoothingEnabled=false;
  const p=(x,y)=>posicionImagen(x,y);
  // Paneles de cristal de la salida al pasillo principal.
  let a,w,h;
  const apertura=calcularAperturaSalida();
  // El vano izquierdo tiene una base inclinada por la perspectiva del pasillo.
  // Las dos hojas comparten ese contorno y se desplazan dentro de él.
  ctx.save();ctx.translate(g.x,g.y);ctx.scale(g.escala,g.escala);
  const izquierda=28,derecha=190,centro=(izquierda+derecha)/2;
  const techo=x=>282+(x-izquierda)*(19/(derecha-izquierda));
  const suelo=x=>665-(x-izquierda)*(65/(derecha-izquierda));
  const poligono=(x0,x1)=>{ctx.beginPath();ctx.moveTo(x0,techo(x0));ctx.lineTo(x1,techo(x1));ctx.lineTo(x1,suelo(x1));ctx.lineTo(x0,suelo(x0));ctx.closePath();};
  poligono(izquierda,derecha);ctx.clip();
  if(acceso?.tipo==='salida'&&acceso.dentro&&!salidaTransicion){
    ctx.save();
    ctx.scale(1/g.escala,1/g.escala);
    ctx.translate(-g.x,-g.y);
    dibujarMedica();
    ctx.restore();
  }
  for(let i=0;i<2;i++){
    const x0=i?centro:izquierda,x1=i?derecha:centro;
    ctx.save();ctx.translate((i?1:-1)*(centro-izquierda)*apertura,0);
    poligono(x0,x1);
    const cristal=ctx.createLinearGradient(x0,0,x1,0);
    cristal.addColorStop(0,'rgba(30,86,100,.91)');cristal.addColorStop(.3,'rgba(96,154,160,.83)');cristal.addColorStop(.8,'rgba(65,128,138,.84)');cristal.addColorStop(1,'rgba(29,83,96,.92)');
    ctx.fillStyle=cristal;ctx.fill();ctx.strokeStyle='#245868';ctx.lineWidth=5;ctx.stroke();
    ctx.fillStyle='rgba(206,234,223,.14)';ctx.fillRect(x0+9,techo(x0)+18,12,Math.min(suelo(x0)-techo(x0)-36,260));
    ctx.restore();
  }
  ctx.restore();
  // Franja interior del sensor existente en la imagen original.
  const ahora=performance.now();
  const delta=sensorLuzTiempo===null?0:Math.min((ahora-sensorLuzTiempo)/1000,0.05);
  sensorLuzTiempo=ahora;
  sensorLuz=Math.max(0,Math.min(1,sensorLuz+(sensorDetecta?1:-1)*delta/0.3));
  ctx.save();
  ctx.translate(g.x,g.y);ctx.scale(g.escala,g.escala);
  ctx.beginPath();ctx.rect(114,266,19,3);ctx.clip();
  ctx.globalCompositeOperation='screen';
  ctx.fillStyle=`rgba(40,230,255,${0.08+sensorLuz*0.7})`;
  ctx.fillRect(114,266,19,3);
  ctx.restore();
  // La hoja de Hepatología se reutiliza desde el fondo anterior.
  if(!acceso||acceso.tipo==='salida'||acceso.t<=.45){a=p(380,290);ctx.drawImage(hoja,1043,87,194,324,a.x,a.y,170*g.escala,310*g.escala);}
  for(const [x,ancho] of [[752,168],[1087,169],[1394,164]]){
    a=p(x,290);w=ancho*g.escala;h=310*g.escala;
    ctx.save();ctx.filter='sepia(1) saturate(1.1) brightness(.83)';
    ctx.drawImage(hoja,1043,87,194,324,a.x,a.y,w,h);ctx.restore();
    ctx.fillStyle='#293e3b';ctx.fillRect(a.x+w*.57,a.y+h*.12,w*.2,h*.4);
    ctx.fillStyle='#9ebbb1';ctx.fillRect(a.x+w*.59,a.y+h*.14,w*.16,h*.36);
    ctx.fillStyle='rgba(230,242,222,.4)';ctx.fillRect(a.x+w*.61,a.y+h*.16,w*.035,h*.3);
  }
  ctx.restore();
}


  function sueloAt(px){ return (665 - (px / ESCALA - 28) * (65 / 162)) * ESCALA; }

  function obstaculos(){
    const limitePared=posicionImagen(0,605).y;
    const base=(x1,y1,x2,y2)=>({x:x1*ESCALA,y:y1*ESCALA,w:(x2-x1)*ESCALA,h:(y2-y1)*ESCALA});

    const lista = [
      // Pared del fondo.
      {x:0,y:0,w:ANCHO_MUNDO,h:limitePared},

      // Límites laterales y borde inferior.
      {x:0,y:0,w:25,h:H},
      {x:ANCHO_MUNDO-25,y:0,w:25,h:H},
      {x:0,y:H-20,w:ANCHO_MUNDO,h:20},
      // Bases del mobiliario, medidas sobre la imagen del pasillo.
      base(232,545,306,620),base(570,565,735,620),
      base(969,545,1042,622),base(1581,565,1765,620)
    ];

    // Obstáculos dinámicos de las hojas de la puerta corrediza
    const g=geometria();
    const xIzq=28*g.escala,xDer=190*g.escala,xCen=109*g.escala;
    const anchoHoja=81*g.escala;
    const apertura=calcularAperturaSalida();
    const bordeDerIzq=xCen-anchoHoja*apertura;
    const bordeIzqDer=xCen+anchoHoja*apertura;

    if(bordeDerIzq>xIzq+0.5){
      lista.push({x:xIzq,y:0,w:bordeDerIzq-xIzq,h:sueloAt(bordeDerIzq)});
    }
    if(bordeIzqDer<xDer-0.5){
      lista.push({x:bordeIzqDer,y:0,w:xDer-bordeIzqDer,h:sueloAt(xDer)});
    }

    return lista;
  }

  function libre(x,y){
    if(!Number.isFinite(x)||!Number.isFinite(y)){
      return false;
    }

    // Colisión física dinámica contra las hojas de vidrio
    const sueloAt=px=>(665-(px/ESCALA-28)*(65/162))*ESCALA;
    const g=geometria();
    const xIzq=28*g.escala,xDer=190*g.escala,xCen=109*g.escala;
    const anchoHoja=81*g.escala;
    const apertura=calcularAperturaSalida();
    const bordeDerIzq=xCen-anchoHoja*apertura;
    const bordeIzqDer=xCen+anchoHoja*apertura;
    const baseSuelo=sueloAt(Math.max(xIzq,Math.min(xDer,x)));

    // Si los pies de la médica intentan penetrar o cruzar la línea del vidrio:
    if(y-5<=baseSuelo+2){
      // Bloqueo por hoja izquierda si aún cubre esta coordenada X
      if(bordeDerIzq>xIzq+0.5&&(x+9>xIzq&&x-9<bordeDerIzq)){
        return false;
      }
      // Bloqueo por hoja derecha si aún cubre esta coordenada X
      if(bordeIzqDer<xDer-0.5&&(x+9>bordeIzqDer&&x-9<xDer)){
        return false;
      }
    }

    return x>=36&&
      x<=ANCHO_MUNDO-36&&
      y<=487&&
      !obstaculos().some(o=>
        x+9>o.x&&
        x-9<o.x+o.w&&
        y+5>o.y&&
        y-5<o.y+o.h
      );
  }

  function interaccion(actor){
    const puerta=posicionImagen(460,700);

    const opciones=[
      {
        x:54,
        y:405,
        id:'volver-pasillo',
        label:'Volver al pasillo principal'
      },
      {
        x:puerta.x,
        y:puerta.y,
        id:'entrar-hepatologia',
        label:'Entrar al consultorio de Hepatología'
      }
    ];

    return opciones.reduce((cercana,opcion)=>
      Math.hypot(
        actor.x-opcion.x,
        actor.y-opcion.y
      )<
      Math.hypot(
        actor.x-cercana.x,
        actor.y-cercana.y
      )
        ?opcion
        :cercana
    );
  }

  function dibujar(ctx,dibujarMedica){
    ctx.save();
    const anchoVista=ctx.canvas.width;
    camaraX=Math.max(0,Math.min(ANCHO_MUNDO-anchoVista,(window.HP_CONSULTORIOS.actorX??anchoVista/2)-anchoVista/2));
    ctx.translate(-camaraX,0);
    ctx.imageSmoothingEnabled=false;

    if(fondo.complete&&fondo.naturalWidth){
      const g=geometria();

      ctx.drawImage(
        fondo,
        g.x,g.y,
        g.ancho,g.alto
      );

      if(window.HP_EFECTOS_AMBIENTALES?.consultorios){
        window.HP_EFECTOS_AMBIENTALES.consultorios.dibujarHaces(ctx);
      }
    }else{
      ctx.fillStyle='#eef1ef';
      ctx.fillRect(0,0,W,H);

      ctx.fillStyle='#254f5b';
      ctx.font='16px sans-serif';
      ctx.textAlign='center';
      ctx.fillText(
        'Cargando consultorios…',
        W/2,H/2
      );
    }

dibujarPuertas(ctx,dibujarMedica);
dibujarAcceso(ctx,dibujarMedica);
    if(window.HP_EFECTOS_AMBIENTALES?.consultorios){
      window.HP_EFECTOS_AMBIENTALES.consultorios.dibujarParticulas(ctx);
    }
    ctx.restore();
  }

  window.HP_CONSULTORIOS={
    iniciarEntrada,iniciarSalida,
    cancelarSalida,
    finalizarSalida(){salidaTransicion=false;puertaAutoApertura=0;puertaSalidaCancelada={activa:false,apertura:0};},
    actualizarSensor,
actualizar,
get ocupado(){
  return acceso!==null;
},
get tipoAcceso(){return acceso?.tipo||null;},
    dibujar,
    libre,
    obstaculos,
    interaccion,

    // Entrada desde el borde izquierdo.
    get entrada(){
      return {x:70,y:405};
    },
    get entradaClinica(){return posicionImagen(460,700);},

    limites:{
      x:27,
      y:340,
      w:ANCHO_MUNDO-54,
      h:155
    }
  };
  Object.defineProperty(window.HP_CONSULTORIOS,'camaraX',{get:()=>camaraX});
})();
