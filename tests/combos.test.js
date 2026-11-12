// Ejecutar: node tests/combos.test.js  («Mis combinaciones» del simulador)
const fs=require("fs"),vm=require("vm"),path=require("path");
const html=fs.readFileSync(path.join(__dirname,"../index.html"),"utf8");
const eng=html.split("/*ENGINE-START*/")[1].split("/*ENGINE-END*/")[0],sim=html.split("/*SIM-START*/")[1].split("/*SIM-END*/")[0];
const ctx={};vm.createContext(ctx);
vm.runInContext(eng+sim+";this.E={cbAll,cbSummary,cbHand,best5,randDeal,CATS};",ctx);
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
C("Ad 7c","8s 8h Kd",[["Pareja","best",{label:"Pareja de 8",mesa:true}],["Doble pareja","f1",{outs:6,need:"un A o un 7"}],["Trío","f2",{need:"dos A"}]],["de la mesa, es de todos"]);
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
let n=0;for(let t=0;t<3000;t++){const k=5+(t%3),d=E.randDeal(k),h=d.slice(0,2),b=d.slice(2),r=E.cbAll(h,b),ev=E.best5(d).ev,bst=r.rows.filter(x=>x.st=="best");
 n++;ok(bst.length==1&&bst[0].cat===ev.cat,`aleatorio ${JSON.stringify(d)}: fila ${bst[0]&&bst[0].name} vs ${ev.name}`);
 ok(r.rows.every(x=>x.cat<=ev.cat||!["best","tienes"].includes(x.st)),"ninguna fila hecha por encima del evaluador");
 r.rows.filter(x=>x.st=="tienes").forEach(x=>{const cs=x.slots.filter(s=>s.c).map(s=>s.c);ok(cs.length==5&&E.best5(cs).ev.cat>=x.cat,`fila ${x.name} no forma ${x.name}: ${JSON.stringify(cs)}`)});
 if(k==7)ok(r.rows.every(x=>["best","tienes","mejor","imposible"].includes(x.st)),"river sin pendientes");
 r.rows.filter(x=>x.st=="f1").forEach(x=>ok(x.outs.length>0,"f1 sin cartas"));}
// antes del flop
for(let t=0;t<300;t++){const h=E.randDeal(2),r=E.cbAll(h,[]),b=r.rows.find(x=>x.st=="best");ok(b.cat===(h[0].v==h[1].v?1:0),"preflop");}
console.log(`combos: ${pass} bien, ${fail} mal (${n} repartos aleatorios)`);process.exit(fail?1:0);
