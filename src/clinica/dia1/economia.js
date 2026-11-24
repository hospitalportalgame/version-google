/* Economía de la demo. Créditos ficticios; no son tarifas médicas. */
window.HepatoDay1Modules['economy.mjs']=(()=>{
  const {STUDY_CATALOG}=window.HepatoDay1Modules['study-catalog.mjs'];
  const {PATIENT_CATALOG}=window.HepatoDay1Modules['simulation-cases.mjs'];
  const {studyAppropriateness}=window.HepatoDay1Modules['clinical-reasoning.mjs'];
  const OPENING_BALANCE=2000;
  const PRICES=Object.freeze({profile:80,cbc:40,inr:30,renal:50,metabolic:70,hbv:80,hbv_dna:180,hdv:120,hcv:60,hcv_rna:180,hiv:60,acute_virus:150,iron:60,hemolysis:80,autoimmune:160,wilson:140,hfe:250,pregnancy:30,tpmt:150,ultrasound:180,elastography:250,iron_mri:500,ct:400,biopsy:700});
  const REWARDS={'masld-intro-v1-reasoning-v2':600,'gilbert-v1-reasoning-v2':400,'masld-older-v1-reasoning-v2':1000};
  const ELENA='masld-older-v1-reasoning-v2';
  const number=new Intl.NumberFormat('es-AR',{maximumFractionDigits:0});
  const money=value=>number.format(value)+' cr';
  const signed=value=>(value>0?'+':'')+money(value);
  const price=id=>PRICES[id]||0;
  const total=ids=>[...new Set(ids)].reduce((sum,id)=>sum+price(id),0);
  const validIds=ids=>Array.isArray(ids)?[...new Set(ids.filter(id=>Object.hasOwn(PRICES,id)))]:[];
  const validMoney=n=>Number.isSafeInteger(n)&&Math.abs(n)<=10000000;
  function budget(caseData){
    const r=caseData.rubric;
    const covered=[...r.essential,...r.optional,...(r.reasonable||[])];
    if(r.secondaryFibrosisIndeterminate)covered.push('biopsy');
    return {coverage:Math.ceil(total(covered)/50)*50,reward:REWARDS[caseData.id]||500};
  }
  function initial(){return {version:1,opening:OPENING_BALANCE,entries:[],legacy:[],priorOrders:{},elena:null,closed:false};}
  function cleanStudies(studies){return (Array.isArray(studies)?studies:[]).filter(s=>Object.hasOwn(PRICES,s?.id)&&typeof s.covered==='boolean').filter((s,i,list)=>list.findIndex(x=>x.id===s.id)===i).map(s=>({id:s.id,covered:s.covered,prior:s.prior===true,value:validMoney(s.value)&&s.value>=0?s.value:price(s.id)}));}
  const studyFees=studies=>studies.filter(s=>!s.covered&&!s.prior).reduce((sum,s)=>sum+Math.round(s.value*1.5),0);
  function balance(finance){return finance.opening+finance.entries.reduce((sum,e)=>sum+e.net,0);}
  function restore(raw,campaign,clinical,caseData,legacySave=false){
    const f=initial();
    if(raw?.version===1&&Array.isArray(raw.entries)){
      f.opening=validMoney(raw.opening)&&raw.opening>=0?raw.opening:OPENING_BALANCE;
      f.legacy=Array.isArray(raw.legacy)?[...new Set(raw.legacy.filter(id=>Object.hasOwn(PATIENT_CATALOG,id)))]:[];
      for(const [id,ids] of Object.entries(raw.priorOrders||{}))if(Object.hasOwn(PATIENT_CATALOG,id))f.priorOrders[id]=validIds(ids);
      for(const entry of raw.entries){
        if(!Object.hasOwn(PATIENT_CATALOG,entry?.caseId)||f.entries.some(e=>e.caseId===entry.caseId)||!validMoney(entry.reward)||!validMoney(entry.penalty)||entry.reward<0||entry.penalty<0||!Array.isArray(entry.studies))continue;
        const studies=cleanStudies(entry.studies);
        const fees=studyFees(studies);
        const reward=entry.reward;
        const penalty=entry.penalty;
        const compensation=entry.caseId===ELENA&&validMoney(entry.compensation)&&entry.compensation>=0?entry.compensation:0;
        f.entries.push({caseId:entry.caseId,day:Number.isInteger(entry.day)&&entry.day>0?entry.day:campaign.day,reward,penalty,fees,compensation,net:reward-penalty-fees-compensation,studies});
      }
      if(['good','bad'].includes(raw.elena?.result)&&['pending','applied'].includes(raw.elena?.status)){
        const entry=f.entries.find(e=>e.caseId===ELENA);
        const applied=raw.elena.status==='applied'&&!!entry;
        f.elena={result:raw.elena.result,status:applied?'applied':'pending',day:Number.isInteger(raw.elena.day)?raw.elena.day:campaign.day,studies:cleanStudies(raw.elena.studies)};
        f.closed=applied&&f.elena.result==='bad';
      }
      return f;
    }
    // Las partidas anteriores conservan su avance sin cargos ni premios retroactivos.
    if(legacySave){
      const records=[...(campaign.completed||[]),...(campaign.archives||[]).flatMap(a=>a.completed||[]),...(campaign.pendingInitial||[])];
      for(const record of [...records,{caseId:caseData.id,clinical}]){
        if(!Object.hasOwn(PATIENT_CATALOG,record.caseId))continue;
        f.priorOrders[record.caseId]=validIds([...(f.priorOrders[record.caseId]||[]),...(record.clinical.orders||[])]);
        if(record.clinical.outcome||record.clinical.emergencyHelpCalled||record.clinical.elenaWrongChoice)f.legacy.push(record.caseId);
      }
      f.legacy=[...new Set(f.legacy)];
    }
    return f;
  }
  function settle(campaign,caseData,clinical){
    const f=campaign.finance;if(!f)return null;
    if(caseData.id===ELENA){
      const result=clinical.elenaWrongChoice?'bad':clinical.emergencyHelpCalled?'good':null;
      if(result&&!f.elena&&clinical.elenaEpilogue!=='final'){
        const low=new Set(studyAppropriateness(clinical,caseData).lowValue);
        f.elena={result,status:'pending',day:campaign.day,studies:validIds(clinical.orders).map(id=>({id,covered:!low.has(id),prior:(f.priorOrders[ELENA]||[]).includes(id),value:price(id)}))};
      }
      return null;
    }
    if(f.legacy.includes(caseData.id)||f.entries.some(e=>e.caseId===caseData.id))return null;
    if(!clinical.outcome)return null;
    const adequate=clinical.outcome.adequate===true;
    const lowValue=new Set(studyAppropriateness(clinical,caseData).lowValue);
    const studies=validIds(clinical.orders).map(id=>({id,covered:!lowValue.has(id),prior:(f.priorOrders[caseData.id]||[]).includes(id),value:price(id)}));
    const fees=studies.filter(s=>!s.covered&&!s.prior).reduce((sum,s)=>sum+Math.round(s.value*1.5),0);
    const reward=adequate?budget(caseData).reward:0,penalty=adequate?0:budget(caseData).reward/2;
    const entry={caseId:caseData.id,day:campaign.day,reward,penalty,fees,net:reward-penalty-fees,studies};
    f.entries.push(entry);return entry;
  }
  function finalizeElena(campaign){
    const f=campaign.finance,pending=f?.elena;if(!pending)return null;
    let entry=f.entries.find(e=>e.caseId===ELENA);
    if(pending.status==='applied')return entry;
    if(!entry){
      const studies=pending.studies,fees=studyFees(studies),reward=pending.result==='good'?REWARDS[ELENA]:0;
      entry={caseId:ELENA,day:pending.day,reward,penalty:0,fees,compensation:0,net:reward-fees,studies};
      f.entries.push(entry);
    }
    if(pending.result==='bad'){
      // La indemnización consume los fondos disponibles; una deuda previa se conserva.
      entry.compensation=(entry.compensation||0)+Math.max(0,balance(f));
      entry.net=entry.reward-entry.penalty-entry.fees-entry.compensation;
      f.closed=true;
    }
    pending.status='applied';return entry;
  }
  function orderMarkup(caseData,clinical,finance){
    const b=budget(caseData),selected=total(clinical.cart||[]);
    const cerrado=finance?.entries.some(e=>e.caseId===caseData.id)||finance?.legacy.includes(caseData.id);
    return '<aside class="economy-order"><strong>Presupuesto del episodio · '+money(b.coverage)+'</strong>'+(finance?'<span>Fondos del hospital: '+money(balance(finance))+'</span>':'')+'<span>Valor seleccionado: '+money(selected)+' · Cargo máximo si ninguno está indicado: '+money(Math.round(selected*1.5))+'</span><details><summary>Cobertura y condiciones económicas</summary><p>Los estudios indicados están cubiertos, sin descontar fondos. Los innecesarios cuestan su valor + 50 %. Se liquida al finalizar, sin revelar indicaciones por adelantado.</p><small>La devolución «Conducta adecuada» (10/10 y sin fallos) genera +'+money(b.reward)+'. Otro resultado supone −'+money(b.reward/2)+'. Pedidos innecesarios: cargo adicional. La consulta inicial y su reconsulta comparten presupuesto.</small></details>'+(cerrado?'<p>Este episodio ya está cerrado o es anterior al sistema económico. Reiniciarlo permite practicar, sin nuevos ingresos ni cargos.</p>':'')+'</aside>';
  }
  function receiptMarkup(finance,caseId){
    if(!finance)return '';
    const e=finance.entries.find(x=>x.caseId===caseId);if(!e)return finance.legacy.includes(caseId)?'<p class="economy-caption">Consulta anterior al sistema económico · Sin liquidación retroactiva.</p>':'';
    const rows=e.studies.map(s=>'<li><span>'+STUDY_CATALOG.find(x=>x.id===s.id).title+'</span><b>'+(s.prior?'Previo · Sin cargo':s.covered?'Cubierto · 0 cr':'−'+money(Math.round(s.value*1.5)))+'</b></li>').join('');
    return '<section class="economy-receipt"><h3>Balance del episodio · '+signed(e.net)+'</h3><p>Ingreso por atención: +'+money(e.reward)+' · Ajuste por consulta inadecuada: −'+money(e.penalty)+' · Pedidos innecesarios: −'+money(e.fees)+'.</p><details><summary>Ver liquidación de estudios</summary><ul>'+rows+'</ul></details></section>';
  }
  return {OPENING_BALANCE,PRICES,price,total,money,signed,budget,initial,restore,balance,settle,finalizeElena,orderMarkup,receiptMarkup};
})();
