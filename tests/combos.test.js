// Ejecutar: node tests/combos.test.js  («Mis combinaciones» del simulador)
const fs=require("fs"),vm=require("vm"),path=require("path");
const html=fs.readFileSync(path.join(__dirname,"../index.html"),"utf8");
const eng=html.split("/*ENGINE-START*/")[1].split("/*ENGINE-END*/")[0],sim=html.split("/*SIM-START*/")[1].split("/*SIM-END*/")[0];
const ctx={};vm.createContext(ctx);
vm.runInContext(eng+sim+";this.E={cbAll,cbSummary,cbHand,best5,randDeal,CATS,ckey};",ctx);
const E=ctx.E;let pass=0,fail=0;
function ok(c,msg){if(c)pass++;else{fail++;console.log("FALLA:",msg)}}
const P=s=>s.trim()?s.trim().split(/\s+/).map(t=>{const r=t.slice(0,-1),su=t.slice(-1);return{v:{A:14,K:13,Q:12,J:11,T:10}[r]||+r,s:"shdc".indexOf(su)}}):[];
const row=(r,name)=>r.rows.find(x=>x.name==name);
function C(h,b,exp,has=[]){const r=E.cbAll(P(h),P(b)),s=E.cbSummary(r),tag=`${h} | ${b}`;
 for(const[name,st,extra]of exp){const x=row(r,name);ok(x.st===st,`${tag}: ${name} st=${x.st} (esperado ${st}) ${x.label||""} ${x.need||""}`);
  if(extra&&extra.outs!=null)ok(x.outs&&x.outs.length===extra.outs,`${tag}: ${name} outs=${x.outs&&x.outs.length} (esperado ${extra.outs})`);
  if(extra&&extra.label)ok(x.label===extra.label,`${tag}: ${name} label=${x.label} (esperado ${extra.label})`);
  if(extra&&extra.need)ok((x.need||"").includes(extra.need),`${tag}: ${name} need=${x.need} (esperado ${extra.need})`);
  if(extra&&extra.mesa!=null)ok(!!x.mesa===extra.mesa,`${tag}: ${name} mesa=${x.mesa}`);}
 for(const t of has)ok(s.includes(t),`${tag}: resumen sin «${t}»\n   ${s}`);
 ok(r.rows.filter(x=>x.st=="best").length===1,`${tag}: una sola «Tu mejor mano»`);
 r.rows.forEach(x=>ok(x.slots.length===5,`${tag}: ${x.name} con ${x.slots.length} huecos`));return r}

// antes del flop: pareja de mano
C("8s 8h","",[["Pareja","best",{label:"Pareja de 8"}],["Trío","f1",{outs:2,need:"un 8"}],["Póker","f2"],["Carta alta","mejor"],["Color","f3",{need:"4 ♠ más"}],["Escalera real","imposible"]],["Antes del flop: tienes Pareja de 8"]);
// antes del flop: A-K del mismo palo
C("Ah Kh","",[["Carta alta","best"],["Pareja","f1",{outs:6}],["Escalera real","f3"],["Color","f3"]]);
// proyecto de color en el flop
C("Ah 7h","Kh 9h 2c",[["Color","f1",{outs:9,need:"cualquier ♥"}],["Pareja","f1",{outs:6,need:"un A o un 7"}],["Carta alta","best"],["Escalera real","imposible"]],["Flop: tienes Carta alta A","Color (cualquier ♥, 9 cartas)"]);
// escalera abierta
C("8c 7d","6h 5s Kc",[["Escalera","f1",{outs:8,need:"un 9 o un 4"}],["Color","imposible"]],["Escalera (un 9 o un 4, 8 cartas)"]);
// escalera con hueco (gutshot)
C("8c 6d","5h 4s Kc",[["Escalera","f1",{outs:4,need:"un 7"}]]);
// color + escalera: cada fila cuenta sus cartas
C("Jh Th","9h 8s 2h",[["Color","f1",{outs:9}],["Escalera","f1",{outs:8}],["Escalera de color","f2"]]);
// escalera hecha
C("8c 7d","6h 5s 4c",[["Escalera","best",{label:"Escalera al 8"}],["Color","imposible"],["Trío","mejor"],["Carta alta","mejor"]],["Flop: tienes Escalera al 8"]);
// escalera A-2-3-4-5
C("Ah 2d","3c 4s 5h",[["Escalera","best",{label:"Escalera A-2-3-4-5"}]]);
// solo pareja de la mesa
C("Ad 7c","8s 8h Kd",[["Pareja","mesa"],["Carta alta","best",{label:"Carta alta A"}],["Doble pareja","f1",{outs:6,need:"un A o un 7"}],["Trío","f2",{need:"dos A"}]],["tu mano real es Carta alta A; la pareja de 8 es de todos, no te sirve"]);
// full
C("8s 8h","8d Kc Kh",[["Full","best",{label:"Full de 8 con K"}],["Trío","tienes",{label:"Trío de 8"}],["Doble pareja","tienes"],["Pareja","tienes"],["Póker","f1",{outs:1}],["Color","mejor"]]);
// después del river: lo que no tienes ya no es posible
const rv=C("Ah 7h","Kh 9h 2c 5s Qd",[["Carta alta","best"],["Color","imposible"],["Escalera","imposible"],["Pareja","imposible"],["Escalera real","imposible"]],["River: tu mano final es Carta alta A"]);
ok(rv.rows.every(x=>!["f1","f2","f3"].includes(x.st)),"river: nada pendiente");
// turn: color con una sola carta por salir y doble pareja tuya
C("Kh Qh","Kd Qc 4h 9h",[["Doble pareja","best",{label:"Doble pareja de K y Q"}],["Color","f1",{outs:9}],["Full","f1",{outs:4}],["Escalera","imposible"],["Pareja","tienes"]]);
// mano completa: proyecto del flop que no salió
const H=E.cbHand(P("Ah 7h"),P("Kh 9h 2c 5s Qd"));
ok(H.draws.some(d=>d.name=="Color"&&d.miss==1&&!d.hit),"cbHand: color del flop no salió");
const H2=E.cbHand(P("Ah 7h"),P("Kh 9h 2c 5h Qd"));
ok(H2.draws.some(d=>d.name=="Color"&&d.hit)&&H2.made[0].name=="Color","cbHand: color del flop sí salió");

// consistencia aleatoria: «Tu mejor mano» == evaluador en miles de repartos
// «Tu mejor mano» = evaluador solo si tus cartas forman la combinación; si no, lo que hacen tus 2 cartas solas
let n=0,nOwn=0,nMesa=0;for(let t=0;t<3000;t++){const k=5+(t%3),d=E.randDeal(k),h=d.slice(0,2),b=d.slice(2),r=E.cbAll(h,b),B5=E.best5(d),ev=B5.ev,bst=r.rows.filter(x=>x.st=="best");
 const hk=new Set(h.map(E.ckey)),own=ev.cat>0&&ev.used.some(i=>hk.has(E.ckey(B5.cards[i]))),exp=own?ev.cat:(h[0].v==h[1].v?1:0);own?nOwn++:nMesa++;
 n++;ok(bst.length==1&&bst[0].cat===exp,`aleatorio ${JSON.stringify(d)}: fila ${bst[0]&&bst[0].name} (esperado ${E.CATS[exp]}, evaluador ${ev.name})`);
 if(!own&&ev.cat>exp){ok(r.rows.find(x=>x.cat==ev.cat).st=="mesa",`la mano de la mesa sale «De la mesa» ${JSON.stringify(d)}`);ok(!!bst[0].note&&E.cbSummary(r).includes("es de todos"),"nota de mano real")}
 ok(r.rows.every(x=>!(x.st=="best"||x.st=="tienes")||x.cat==exp||x.slots.some(o=>o.c&&o.own)),"ninguna fila hecha sin tus cartas");
 ok(r.rows.every(x=>x.cat<=ev.cat||!["best","tienes"].includes(x.st)),"ninguna fila hecha por encima del evaluador");
 r.rows.filter(x=>x.st=="tienes").forEach(x=>{const cs=x.slots.filter(s=>s.c).map(s=>s.c);ok(cs.length==5&&E.best5(cs).ev.cat>=x.cat,`fila ${x.name} no forma ${x.name}: ${JSON.stringify(cs)}`)});
 if(k==7)ok(r.rows.every(x=>["best","tienes","mejor","imposible","mesa"].includes(x.st)),"river sin pendientes");
 r.rows.filter(x=>x.st=="f1").forEach(x=>ok(x.outs.length>0,"f1 sin cartas"));}
// antes del flop
for(let t=0;t<300;t++){const h=E.randDeal(2),r=E.cbAll(h,[]),b=r.rows.find(x=>x.st=="best");ok(b.cat===(h[0].v==h[1].v?1:0),"preflop");}

// qué aporta cada una de tus cartas (fila «Tu mejor mano» y resumen)
function K(h,b,best,has,warn){const r=E.cbAll(P(h),P(b)),x=r.rows.find(y=>y.st=="best"),s=E.cbSummary(r),tag=`${h} | ${b}`;
 ok(x.label===best,`${tag}: mejor=${x.label} (esperado ${best})`);
 for(const t of has)ok(s.toLowerCase().includes(t.toLowerCase())&&((x.contrib||"")+(x.warn||"")).includes(t),`${tag}: falta «${t}»\n   fila: ${x.contrib} ${x.warn||""}\n   resumen: ${s}`);
 if(warn===false)ok(!x.warn&&!x.note,`${tag}: no debería avisar: ${x.warn}`);else for(const t of warn)ok((x.warn||"").includes(t)&&s.includes(t),`${tag}: aviso sin «${t}» → ${x.warn}`);
 return{x,r,s}}
// el caso de Angel: la pareja de 6 es de la mesa → no le sirve; su mano real es carta alta 10
{const{r,s}=K("4h Th","6d 6h 7h Kd","Carta alta 10",["Tu mano real es Carta alta 10; la pareja de 6 es de todos, no te sirve."],["un K, un 7 o un 6","más alta que tu 10"]);
 ok(r.rows.find(x=>x.name=="Pareja").st=="mesa","Pareja de 6 → «De la mesa»");ok(!r.rows.some(x=>x.st=="tienes"),"nada «La tienes»");ok(s.startsWith("Turn: tu mano real es Carta alta 10"),s)}
K("4h Th","6d 6h 7h Kd 2c","Carta alta 10",["la pareja de 6 es de todos"],["más alta que tu 10"]);
// solo de acompañante (kicker) no cuenta: trío de la mesa con tu A
{const{x}=K("Ah 3c","Kd Ks Kh 7c 2d","Carta alta A",["Tu mano real es Carta alta A; el trío de K es de todos, no te sirve."],["un K, un 7 o un 2 te gana"]);ok(!x.warn.includes("más alta"),"con A no habla de carta más alta")}
// una carta tuya hace la pareja, la otra es kicker
K("Ah Kd","As 7c 2d","Pareja de A",["Tu A♥ forma la pareja con la mesa: A-A-K-7-2.","Tu K♦ juega como carta acompañante (kicker)."],false);
// una carta forma la pareja, la otra no entra
K("Qh 3c","Qs 9c 8d 5h","Pareja de Q",["Tu Q♥ forma la pareja con la mesa","Tu 3♣ no entra en tu mejor mano."],false);
// las dos cartas
K("8s 8h","Kc 4d 2s","Pareja de 8",["Tus dos cartas (8♠ y 8♥) forman la pareja: 8-8-K-4-2."],false);
K("Ks Qd","Kd Qc 4h","Doble pareja de K y Q",["Tus dos cartas (K♠ y Q♦) forman las dos parejas: K-K-Q-Q-4."],false);
K("7c 8d","9h Ts Jd","Escalera al J",["Tus dos cartas (8♦ y 7♣) forman la escalera: 7-8-9-10-J."],false);
// tu carta + pareja de la mesa = doble pareja tuya (tu K hace pareja)
K("Kh 4c","6d 6s Kd","Doble pareja de K y 6",["Tu K♥ forma las dos parejas con la mesa"],false);
// ninguna carta juega: la mesa
K("2c 3d","As Ah Kd Kc Qs","Carta alta 3",["la doble pareja de A y K es de todos"],["un A o un K","más alta que Q","mucho empatas"]);
K("2c 3d","Ts Js Qd Kh Ac","Carta alta 3",["la escalera es de todos"],["mucho empatas"]);
// escalera de la mesa más alta que la tuya: tu 4 no la mejora
{const{r}=K("4h 2c","5d 6s 7h 8c 9d","Carta alta 4",["la escalera es de todos"],["mucho empatas"]);ok(r.rows.find(x=>x.name=="Escalera").st=="mesa","escalera de la mesa")}
// pareja en la mano con doble pareja en la mesa: tu mano real es tu pareja
{const{r}=K("4h 4c","Kd Ks 6h 6c 2d","Pareja de 4",["Tu mano real es Pareja de 4; la doble pareja de K y 6 es de todos, no te sirve."],[]);ok(r.rows.find(x=>x.name=="Doble pareja").st=="mesa","doble pareja de la mesa")}
// tu carta mejora la mesa: escalera de la mesa + tu 10 = escalera más alta (sí es tuya)
K("Th 2c","5d 6s 7h 8c 9d","Escalera al 10",["Tu 10♥ forma la escalera con la mesa"],false);
// preflop: pareja en la mano
ok(E.cbAll(P("9s 9d"),[]).rows.find(x=>x.st=="best").contrib=="Tus dos cartas forman la pareja.","preflop pareja");
// fin de mano: el proyecto cuenta contra tu mano real
{const H=E.cbHand(P("4h Th"),P("6d 6h 7h Kd 2c"));ok(H.made[0].label=="Carta alta 10"&&H.made.length==1,"cbHand usa tu mano real")}
console.log(`combos: ${pass} bien, ${fail} mal (${n} repartos aleatorios: ${nOwn} con tus cartas, ${nMesa} solo mesa/carta alta)`);process.exit(fail?1:0);
