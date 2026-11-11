// Ejecutar: node tests/sim.test.js  (extrae el motor y el simulador de index.html)
const fs=require("fs"),vm=require("vm"),path=require("path");
const html=fs.readFileSync(path.join(__dirname,"../index.html"),"utf8");
const eng=html.split("/*ENGINE-START*/")[1].split("/*ENGINE-END*/")[0],sim=html.split("/*SIM-START*/")[1].split("/*SIM-END*/")[0];
const ctx={};vm.createContext(ctx);
vm.runInContext(eng+sim+";this.E={simNew,simStart,simAct,simLegal,botDecide,simCoach,simReview,postInfo,startGroup,best5,potTotal,describe,SIM_STACK};",ctx);
const E=ctx.E;let pass=0,fail=0;
function ok(c,msg){if(c)pass++;else{fail++;console.log("FALLA:",msg)}}
const eq=(a,b,msg)=>ok(JSON.stringify(a)===JSON.stringify(b),msg+" => "+JSON.stringify(a)+" (esperado "+JSON.stringify(b)+")");
const C=t=>{const r=t.slice(0,-1),s=t.slice(-1);return{v:{A:14,K:13,Q:12,J:11,T:10}[r]||+r,s:"shdc".indexOf(s)}};
const P=s=>s.trim().split(/\s+/).map(C);
// baraja: jugador i recibe deck[2i],deck[2i+1]; la mesa sale desde deck[8]
function mk(holes,board){const used=holes.join(" ")+" "+board,d=P(used);const k=new Set(d.map(c=>c.v+"-"+c.s));
  for(let v=2;v<=14;v++)for(let s=0;s<4;s++)if(!k.has(v+"-"+s))d.push({v,s});return d}
function game(stacks,dealer){const g=E.simNew(stacks);g.dealer=(dealer==null?0:dealer)-1;return g}
const sum=g=>g.players.reduce((s,p)=>s+p.stack,0);
function play(g,seq){for(const[who,type,to]of seq){ok(g.toAct===who,`turno: esperado ${who}, es ${g.toAct} (${type})`);E.simAct(g,type,to)}}
const throws=f=>{try{f();return false}catch(e){return true}};

// 1) orden y cierre de rondas; ciega grande con opción
{const g=game(null,0);E.simStart(g);eq([g.dealer,g.sb,g.bb,g.toAct],[0,1,2,3],"posiciones mano 1");
 eq(g.players.map(p=>p.stack),[200,199,198,200],"ciegas 1/2 puestas");
 play(g,[[3,"call"],[0,"call"],[1,"call"]]);ok(g.street==0&&g.toAct==2,"la ciega grande conserva la opción");
 const L=E.simLegal(g);ok(L.canCheck&&L.canRaise,"CG puede pasar o subir");
 play(g,[[2,"check"]]);ok(g.street==1&&g.board.length==3,"flop tras pasar la CG");ok(g.toAct==1,"postflop empieza a la izquierda del botón");
 play(g,[[1,"check"],[2,"raise",6],[3,"call"],[0,"fold"]]);ok(g.street==1&&g.toAct==1,"tras apuesta, vuelve a quien pasó");
 play(g,[[1,"call"]]);ok(g.street==2&&g.board.length==4,"turn al cerrarse la ronda");
 play(g,[[1,"check"],[2,"check"],[3,"check"]]);ok(g.street==3,"river");play(g,[[1,"check"],[2,"check"],[3,"check"]]);
 ok(g.over&&g.result.type=="showdown","showdown tras el river");ok(sum(g)==800,"fichas conservadas");}
// 2) subida mínima
{const g=game(null,0);E.simStart(g);ok(E.simLegal(g).minTo==4,"subida mínima preflop a 4");
 ok(throws(()=>E.simAct(g,"raise",3)),"subir a 3 es ilegal");play(g,[[3,"raise",6]]);
 eq(E.simLegal(g).minTo,10,"tras subir a 6, mínimo 10");ok(throws(()=>E.simAct(g,"raise",8)),"subir a 8 es ilegal");
 play(g,[[0,"raise",10]]);eq(E.simLegal(g).minTo,14,"tras 10, mínimo 14");ok(throws(()=>E.simAct(g,"check")),"no puede pasar con apuesta");
 play(g,[[1,"raise",30]]);eq(E.simLegal(g).minTo,50,"tras 30, mínimo 50");}
// 3) all-in corto no reabre la apuesta a quien ya actuó
{const g=game([13,200,200,200],0);E.simStart(g);play(g,[[3,"raise",10],[0,"raise",13]]);ok(g.players[0].allin,"all-in corto");
 let L=E.simLegal(g);ok(L.canRaise&&L.minTo==21,"la CG que no ha actuado sí puede subir (mín. 21): "+JSON.stringify(L));
 play(g,[[1,"fold"],[2,"fold"]]);L=E.simLegal(g);ok(g.toAct==3&&!L.canRaise&&L.toCall==3,"quien subió solo puede igualar o retirarse: "+JSON.stringify(L));
 play(g,[[3,"call"]]);ok(g.over,"se reparte todo sin más apuestas");ok(sum(g)==613,"conservación con all-in corto");}
// 4) botes laterales con 3 pilas distintas + recompra
{const g=game([50,100,200,200],0);E.simStart(g,mk(["As Ah","Ks Kh","Qs Qh","7c 2d"],"2c 5d 9h Js 3s"));
 play(g,[[3,"raise",200],[0,"call"],[1,"call"],[2,"call"]]);ok(g.over,"todos all-in: se corre la mesa");
 eq(g.result.pots.map(p=>[p.amount,p.winners]),[[200,[0]],[150,[1]],[200,[2]]],"bote principal y dos laterales");
 eq(g.players.map(p=>p.stack),[200,150,200,0],"pagos de botes laterales");
 ok(g.result.text[0].startsWith("Bote principal (200 fichas): Ganaste porque tu Pareja de A"),"explicación del bote principal: "+g.result.text[0]);
 E.simStart(g);ok(g.players[3].stack+g.players[3].total==200&&g.rebuys==1,"recompra a 200");ok(g.log[0].includes("Sofía se quedó sin fichas y recompra 200"),"avisa la recompra: "+g.log[0]);}
// 4b) lateral donde gana el corto
{const g=game([30,200,120,200],0);E.simStart(g,mk(["Ks Kh","Qs Qh","As Ah","7c 2d"],"2c 5d 9h Js 3s"));
 play(g,[[3,"fold"],[0,"raise",30],[1,"raise",200],[2,"call"]]);eq(g.result.pots.map(p=>[p.amount,p.winners]),[[90,[2]],[180,[2]],[80,[1]]],"el AA gana principal y lateral, se devuelve lo no igualado");
 eq(g.players.map(p=>p.stack),[0,80,270,200],"pagos");ok(g.result.text.some(t=>t.includes("Se le devuelven 80 fichas a Ana")),"menciona la devolución");}
// 5) bote dividido con ficha impar
{const g=game(null,0);E.simStart(g,mk(["2c 3d","4c 5d","6c 7d","8c 2h"],"Ts Jd Qc Kh Ah"));
 play(g,[[3,"call"],[0,"call"],[1,"fold"],[2,"check"],[2,"check"],[3,"check"],[0,"check"],[2,"check"],[3,"check"],[0,"check"],[2,"check"],[3,"check"],[0,"check"]]);
 eq(g.result.pots[0].winners,[2,3,0],"tres ganadores");eq(g.players.map(p=>p.stack),[200,199,201,200],"ficha impar al primero tras el botón");
 ok(g.result.text[0]=="Empate entre Luis, Sofía y tú: todos tienen Escalera al A del mismo valor (los palos no desempatan). Se reparte el bote: unas 2 fichas cada uno.","texto empate: "+g.result.text[0]);}
// 6) rotación de ciegas
{const g=game(null);for(let h=0;h<9;h++){E.simStart(g);const d=h%4;eq([g.dealer,g.sb,g.bb],[d,(d+1)%4,(d+2)%4],"rotación mano "+(h+1));
  while(!g.over)E.simAct(g,E.simLegal(g).canCheck?"check":"fold");}}
// 7) explicaciones
function sd(holes,board,dealer,acts){const g=game(null,dealer);E.simStart(g,mk(holes,board));
  for(let n=0;!g.over&&n<100;n++){const i=g.toAct,L=E.simLegal(g);let a=acts&&acts[i];if(!a||(a=="call"&&L.canCheck))a=L.canCheck?"check":"call";E.simAct(g,a)}return g}
{let g=sd(["8s 8h","Kd 5d","2s 3s","4d 6h"],"8d Kc 5s 2h Jc",0,{2:"fold",3:"fold"});
 eq(g.result.text,["Ganaste porque tu Trío de 8 le gana a la Doble pareja de K y 5 de Ana."],"victoria");
 g=sd(["Ks Kh","2d 3d","4s 4c","6c 7d"],"5h 8s 9d 2c Qs",0,{1:"fold",2:"fold"});
 eq(g.result.text,["Ganó Sofía porque su Escalera al 9 le gana a tu Pareja de K."],"derrota");
 g=sd(["As Kd","Ah Qc","2s 3c","4d 6h"],"Ad 7c 4h 9s 2d",0,{2:"fold",3:"fold"});
 eq(g.result.text,["Ganaste: ambos tienen Pareja de A, pero tu kicker (carta acompañante) K le gana a la Q de Ana."],"kicker");
 g=sd(["2c 3d","4c 5d","6c 7d","8c 2h"],"Ts Jd Qc Kh Ah",0,{2:"fold",3:"fold"});
 eq(g.result.text,["Empate entre Ana y tú: ambos tienen Escalera al A del mismo valor (los palos no desempatan). Se reparte el bote: 3 fichas cada uno."],"empate");
 g=sd(["Qs 9h","Kd Kc","Qd Jh","2c 3d"],"Kh 7c 4h 9s 2d",0,{0:"call"});
 ok(/^Ganó Ana porque su Trío de K le gana a tu Pareja de 9\.$/.test(g.result.text[0]),"derrota vs usuario se compara contigo: "+g.result.text[0]);
 const g2=game(null,2);E.simStart(g2);while(!g2.over)E.simAct(g2,"fold");eq(g2.result.text,["Ganaste porque todos los demás se retiraron."],"todos se retiran");
 const g3=game(null,3);E.simStart(g3);E.simAct(g3,"fold");while(!g3.over)E.simAct(g3,"fold");eq(g3.result.text,["Ganó Ana porque todos los demás se retiraron."],"gana un bot sin showdown");}
// 8) consejos y repaso
{const g=game(null,0);E.simStart(g,mk(["7c 2d","As Ks","Qs Qh","Jd Th"],"2c 5d 9h Js 3s"));
 ok(g.toAct==3);E.simAct(g,"raise",6);const c=E.simCoach(g);ok(c.rec=="retirarse"&&/grupo «Botar»/.test(c.text)&&/1 de cada/.test(c.text),"consejo preflop: "+c.text);
 g.userActs.push({street:0,type:"call",rec:c.rec});E.simAct(g,"call");ok(/1 de 1|0 de 1/.test(E.simReview(g))&&/convenía retirarte y igualaste/.test(E.simReview(g)),"repaso: "+E.simReview(g));}
ok(E.postInfo(P("Ah 7h"),P("Kh 9h 2c")).lvl==1,"proyecto de color");ok(E.postInfo(P("Ah 7c"),P("Ad 9s 4h 2c")).lvl==2,"pareja alta en turn");
ok(E.postInfo(P("Ah 7h"),P("Kh 9h 2c 3s 4d")).lvl==0,"en el river el proyecto ya no cuenta");ok(E.postInfo(P("2c 3d"),P("Ts Jd Qc Kh Ah")).lvl==0,"jugar la mesa no es mano propia");
eq([P("As Ah"),P("Ts 9s"),P("7c 2d"),P("Kd Qd"),P("Ks Qd")].map(E.startGroup),[1,3,4,2,3],"grupos iniciales");

// 9) miles de manos aleatorias: bots + jugador al azar, con pilas raras
let hands=0,errs=0,maxAct=0,sds=0,side=0,splits=0;const g=E.simNew();let base=800;
function randomAct(g){const L=E.simLegal(g),o=["fold"];o.push(L.canCheck?"check":"call");if(L.canRaise)o.push("raise","raise");
  const t=o[Math.floor(Math.random()*o.length)];if(t=="raise"){const r=Math.random();return[t,r<.3?L.minTo:r<.5?L.maxTo:L.minTo+Math.floor(Math.random()*(L.maxTo-L.minTo+1))]}return[t]}
for(let h=0;h<30000;h++){
  if(Math.random()<.25){g.players.forEach(p=>p.stack=1+Math.floor(Math.random()*(Math.random()<.5?20:300)));base=sum(g)}
  const rb=g.rebuys;E.simStart(g);base+=(g.rebuys-rb)*E.SIM_STACK;hands++;let n=0;
  try{while(!g.over){if(++n>300)throw Error("mano atascada");const L=E.simLegal(g),p=g.players[g.toAct];
      if(p.folded||p.allin)throw Error("turno de jugador inactivo");
      const[t,to]=g.toAct==0&&Math.random()<.7?randomAct(g):(d=>[d.type,d.to])(E.botDecide(g));E.simAct(g,t,to);
      if(sum(g)+E.potTotal(g)!=base)throw Error("fichas no se conservan a mitad de mano");
      if(g.players.some(p=>p.stack<0))throw Error("pila negativa")}
    if(sum(g)!=base)throw Error("fichas no se conservan al final "+sum(g)+" vs "+base);
    const tot=g.result.pots.reduce((s,p)=>s+Object.values(p.share).reduce((a,b)=>a+b,0),0);if(tot!=g.result.pot)throw Error("reparto != bote");
    if(g.result.type=="showdown"){sds++;if(g.result.pots.length>1)side++;if(g.result.pots.some(p=>p.winners.length>1))splits++;if(g.board.length!=5)throw Error("mesa incompleta")}
    if(!g.result.text.length||!g.result.review)throw Error("sin explicación");maxAct=Math.max(maxAct,n)}
  catch(e){errs++;if(errs<4)console.log("ERROR mano",h,e.message)}}
ok(errs==0,`manos aleatorias con errores: ${errs}`);
console.log(`Manos aleatorias: ${hands} · showdowns ${sds} · con botes laterales ${side} · botes divididos ${splits} · máx. acciones/mano ${maxAct}`);
// 10) bots entre sí, pilas normales: que no sean pasivos ni locos
{const g=E.simNew();let fold=0,raise=0,acts=0;for(let h=0;h<3000;h++){E.simStart(g);while(!g.over){const d=E.botDecide(g);acts++;if(d.type=="fold")fold++;if(d.type=="raise")raise++;E.simAct(g,d.type,d.to)}}
 console.log(`Bots: ${acts} acciones, ${Math.round(fold/acts*100)}% retiros, ${Math.round(raise/acts*100)}% subidas`);ok(raise>0&&fold>0,"bots variados");ok(sum(g)==800+g.rebuys*200,"bots conservan fichas");}
console.log(`\n${pass} pruebas OK, ${fail} fallas`);process.exit(fail?1:0);
