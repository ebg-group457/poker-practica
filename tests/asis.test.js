// Ejecutar: node tests/asis.test.js  («Partida real (asistente)»: selector de cartas y tabla compartida con el simulador)
const fs=require("fs"),vm=require("vm"),path=require("path");
const html=fs.readFileSync(path.join(__dirname,"../index.html"),"utf8");
const cut=(a,b)=>html.split(a)[1].split(b)[0];
const src=cut("/*ENGINE-START*/","/*ENGINE-END*/")+cut("/*SIM-START*/","/*SIM-END*/")+cut("/*ASIS-START*/","/*ASIS-END*/");
const ctx={};vm.createContext(ctx);
vm.runInContext(src+";this.E={asNew,asSet,asClear,asUndo,asNewHand,asUsed,asCanPick,asRankFree,asFirstEmpty,asCards,asView,asPre,asAdvice,asOdds,simNew,simStart,simCbView,cbView,cbAll,cbSummary,cbTableHTML,fullDeck,shuffle,ckey,randDeal,flopInfo,flopWhy,flopWhyHTML,startGroup,startExplain,potOddsText};",ctx);
const E=ctx.E;let pass=0,fail=0;
function ok(c,msg){if(c)pass++;else{fail++;console.log("FALLA:",msg)}}
const C=t=>({v:{A:14,K:13,Q:12,J:11,T:10}[t.slice(0,-1)]||+t.slice(0,-1),s:"shdc".indexOf(t.slice(-1))});
const P=s=>s.trim()?s.trim().split(/\s+/).map(C):[];
function fill(list){const s=E.asNew();list.forEach((c,i)=>{if(c)ok(E.asSet(s,i,c),"asSet "+i)});return s}

// ---- 1) selector: no permite cartas repetidas ----
{const s=E.asNew();
 ok(E.asSet(s,0,C("As")),"pone A♠");ok(s.act===1,"pasa al siguiente hueco");
 ok(!E.asSet(s,1,C("As")),"no deja repetir A♠ en otro hueco");ok(s.c[1]===null,"hueco sigue vacío");
 ok(!E.asSet(s,4,C("As")),"tampoco en la mesa");
 ok(!E.asCanPick(s,C("As"),1)&&E.asCanPick(s,C("As"),0),"A♠ bloqueada salvo en su propio hueco");
 ok(E.asSet(s,0,C("As")),"volver a poner la misma carta en su hueco es válido");
 ok(E.asSet(s,1,C("Ah"))&&E.asSet(s,2,C("Ad")),"otros ases sí");ok(E.asRankFree(s,14,3),"queda un A libre");
 ok(E.asSet(s,3,C("Ac")),"cuarto as");ok(!E.asRankFree(s,14,4),"rango A deshabilitado con los 4 usados");ok(E.asRankFree(s,14,0),"pero en un hueco con A sí (para cambiar el palo)");
 ok(!E.asSet(s,4,C("Ac")),"no repite A♣");
 ok(E.asSet(s,0,C("Ks")),"cambiar A♠ por K♠");ok(E.asCanPick(s,C("As"),5),"A♠ vuelve a estar libre al cambiarla");
 ok(E.asUsed(s).size===4,"4 cartas usadas");
 // carta inválida
 ok(!E.asSet(s,5,{v:1,s:0})&&!E.asSet(s,5,{v:5,s:4})&&!E.asSet(s,9,C("2c")),"rechaza cartas o huecos inválidos");
 // deshacer / quitar / nueva mano
 const before=JSON.stringify(s.c);ok(E.asClear(s,2),"quitar A♦");ok(s.c[2]===null&&s.act===2,"queda el hueco activo");
 ok(E.asUndo(s)&&JSON.stringify(s.c)===before,"deshacer restaura");
 E.asNewHand(s);ok(s.c.every(c=>c===null)&&s.act===0,"nueva mano limpia");ok(E.asUndo(s)&&JSON.stringify(s.c)===before,"deshacer recupera la mano anterior");
 // aleatorio: nunca hay duplicados
 for(let t=0;t<2000;t++){const s2=E.asNew();for(let k=0;k<30;k++){const slot=Math.floor(Math.random()*7),c={v:2+Math.floor(Math.random()*13),s:Math.floor(Math.random()*4)};
   const can=E.asCanPick(s2,c,slot),r=E.asSet(s2,slot,c);ok(r===can,"asSet coincide con asCanPick");if(Math.random()<.1)E.asUndo(s2);if(Math.random()<.1)E.asClear(s2,slot)}
  const ks=s2.c.filter(Boolean).map(E.ckey);ok(new Set(ks).size===ks.length,"sin duplicados: "+ks.join(","))}}

// ---- 2) calles: solo se analiza lo completo ----
{let v=E.asView(fill([C("Ah"),C("Kh")]));ok(v.pre.label==="Jugar"&&v.board.length===0&&!v.adv,"preflop A-K: Jugar");ok(v.pre.reason.includes("A-K"),"razón A-K");
 v=E.asView(fill([C("7c"),C("2d")]));ok(v.pre.label==="Botar","7-2: Botar");
 v=E.asView(fill([C("5s"),C("5d")]));ok(v.pre.label==="Depende","5-5: Depende");
 v=E.asView(fill([C("Ah"),C("Kh"),C("Qh"),C("9h")]));ok(v.partialFlop&&v.board.length===0&&!v.adv,"flop incompleto no se analiza");
 v=E.asView(fill([C("Ah"),C("Kh"),C("Qh"),C("9h"),C("2c"),null,C("3d")]));ok(v.riverNoTurn&&v.board.length===3,"river sin turn: solo flop");
 v=E.asView(fill([C("Ah")]));ok(!v.pre&&!v.cb,"con 1 carta no hay análisis");}

// ---- 3) flop = misma regla y explicación que «¿Sigo después del flop?» ----
for(let t=0;t<1500;t++){const d=E.randDeal(5),h=d.slice(0,2),f=d.slice(2),v=E.asView(fill(d));
 ok(v.adv.verdict===(E.flopInfo(h,f).seguir?"seguir":"retirarse"),"flop: misma regla");ok(v.adv.whyHTML===E.flopWhyHTML(E.flopWhy(h,f)),"flop: misma explicación");}
// caso de Angel: 3 seguidas
{const v=E.asView(fill(P("7h 8d 9c Ks 2d")));ok(v.adv.verdict==="retirarse"&&v.adv.whyHTML.includes("dos cartas exactas"),"7-8-9: retirarse con explicación")}
// turn: outs ×2
{const v=E.asView(fill(P("Ah 7h Kh 9h 2c 5s")));ok(v.adv.street===2&&v.adv.outs===9,"turn: 9 cartas para color (outs "+v.adv.outs+")");ok(v.adv.whyHTML.includes("9 × 2 ≈ <b>18 de cada 100"),"turn ×2");ok(v.adv.verdict==="barato","proyecto en turn: sigue solo si es barato");
 const o=E.asOdds("20","10",v.adv);ok(o.includes("pagas 10 para ganar 20")&&o.includes("33 de cada 100")&&o.includes("no conviene"),"bote: 18% < 33% → no conviene: "+o);
 const o2=E.asOdds("90","10",v.adv);ok(o2.includes("✅ conviene"),"bote barato → conviene: "+o2);}
{const v=E.asView(fill(P("Ah 7h Kh 9h 2c")));ok(v.adv.outs===9,"flop color: 9");const o=E.asOdds(30,10,v.adv);ok(o.includes("36 de cada 100")&&o.includes("✅ conviene"),"flop ×4: "+o)}
{const v=E.asView(fill(P("Ks Kd Kh 7c 2d 9s 3h")));ok(v.adv.street===3&&v.adv.verdict==="seguir","river con trío: seguir");ok(E.asOdds(10,5,v.adv).includes("mano hecha"),"mano hecha → paga")}
ok(E.asOdds("","")===""&&E.asOdds("40","").includes("pasar gratis"),"bote opcional");
ok(E.asOdds("50","10",null).startsWith("Cuentas del bote: "+E.potOddsText(50,10)),"misma frase del simulador");
// turn/river aleatorios: sin errores y recomendación coherente con postInfo
for(let t=0;t<1500;t++){const d=E.randDeal(6+(t%2)),v=E.asView(fill(d));ok(v.adv&&v.adv.whyHTML.length>0&&["seguir","barato","retirarse"].includes(v.adv.verdict),"turn/river ok")}

// ---- 4) tabla compartida: idéntica en simulador y asistente con las mismas cartas ----
function simWith(cards,nBoard){const g=E.simNew(),hole=cards.slice(0,2),board=cards.slice(2),k=new Set(cards.map(E.ckey));
 // el jugador 0 recibe deck[0],deck[1]; la mesa sale desde deck[8]
 const rest=E.shuffle(E.fullDeck().filter(c=>!k.has(E.ckey(c)))),deck=hole.concat(rest.slice(0,6),board,rest.slice(6));
 E.simStart(g,deck);g.board=board.slice(0,nBoard);return g}
let same=0;
for(let t=0;t<1200;t++){const nb=[0,3,4,5][t%4],d=E.randDeal(2+nb),g=simWith(d,nb);
 ok(JSON.stringify(g.players[0].hole)===JSON.stringify(d.slice(0,2)),"el simulador repartió las cartas pedidas");
 const sv=E.simCbView(g),av=E.asView(fill(d)).cb;
 ok(sv.table===av.table&&sv.sum===av.sum,"tabla idéntica "+JSON.stringify(d));
 ok(av.table===E.cbTableHTML(E.cbAll(d.slice(0,2),d.slice(2))),"misma función de tabla");if(sv.table===av.table)same++}
{const v=E.asView(fill(P("Ah 7h Kh 9h 2c")));ok(v.cb.table.includes("Te falta 1: cualquier ♥: 9 cartas")&&v.cb.sum.includes("Color (cualquier ♥, 9 cartas)"),"tabla del flop con color")}
console.log(`asis: ${pass} bien, ${fail} mal (${same} tablas idénticas)`);process.exit(fail?1:0);
