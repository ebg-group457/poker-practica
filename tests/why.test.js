// Ejecutar: node tests/why.test.js  (explicación «¿Por qué?» de ¿Sigo después del flop?)
const fs=require("fs"),vm=require("vm"),path=require("path");
const html=fs.readFileSync(path.join(__dirname,"../index.html"),"utf8");
const src=html.split("/*ENGINE-START*/")[1].split("/*ENGINE-END*/")[0];
const ctx={};vm.createContext(ctx);vm.runInContext(src+";this.E={flopWhy,flopWhyHTML,flopInfo,genFlop,randDeal};",ctx);
const E=ctx.E;let pass=0,fail=0;
const P=s=>s.trim().split(/\s+/).map(t=>{const r=t.slice(0,-1),su=t.slice(-1);return{v:{A:14,K:13,Q:12,J:11,T:10}[r]||+r,s:"shdc".indexOf(su)}});
function ok(c,msg){if(c)pass++;else{fail++;console.log("FALLA:",msg)}}
const txt=w=>w.lines.map(l=>l[0]+": "+l[1]).join(" | ").replace(/<[^>]+>/g,"")+" | "+w.concl;
function W(h,f,exp,has=[]){const w=E.flopWhy(P(h),P(f)),t=txt(w);
  for(const k in exp)ok(w[k]===exp[k],`${h} | ${f}: ${k}=${w[k]} (esperado ${exp[k]})\n   ${t}`);
  for(const s of has)ok(t.includes(s),`${h} | ${f}: falta «${s}»\n   ${t}`);
  ok(w.seguir===E.flopInfo(P(h),P(f)).seguir,`${h} | ${f}: contradice la regla`);return w}
// 3 seguidas sin proyecto (el caso de Angel)
W("7h 8d","9c Ks 2d",{seguir:false,sType:"tres",pairT:"none",outs:0},["3 seguidas: 7-8-9","dos cartas exactas","carta alta 8","Por eso: retírate"]);
// escalera con hueco (gutshot)
W("8c 6d","5h 4s Kc",{seguir:false,sType:"hueco",sOuts:4,outs:4},["hueco en medio","4-5-6-__-8","un 7","4 × 4 ≈ 16 de cada 100","Por eso: retírate"]);
// punta (J-Q-K-A) y A-2-3-4
W("Kc Qd","Ah Js 2c",{seguir:false,sType:"punta",sOuts:4},["J-Q-K-A","un 10","Por eso: retírate"]);
W("Ah 2d","3c 4s Kh",{seguir:false,sType:"punta",sOuts:4},["A-2-3-4","un 5"]);
// abierta
W("8c 7d","6h 5s Kc",{seguir:true,sType:"abierta",sOuts:8,outs:8},["5-6-7-8","un 4 o un 9","8 × 4 ≈ 32","Por eso: sigue"]);
W("Jc Td","Qh 9s 2c",{seguir:true,sType:"abierta",sOuts:8},["9-10-J-Q","un 8 o un K"]);
// proyecto de color
W("Ah 7h","Kh 9h 2c",{seguir:true,fType:"proyecto",fOuts:9,outs:9},["4 de corazones","9 cartas","9 × 4 ≈ 36","Por eso: sigue"]);
// color + escalera abierta: cartas sin contar dos veces (9 + 8 - 2 = 15)
W("Jh Th","9h 8s 2h",{seguir:true,outs:15},["15 × 4 ≈ 60"]);
// 3 del mismo palo: débil
W("Ah 7h","Kh 9c 2s",{seguir:false,fType:"tres"},["3 de corazones","muy débil"]);
// pareja alta
W("Ah 7c","Ad 9s 4h",{seguir:true,pairT:"top"},["pareja alta","Eso ya alcanza","Por eso: sigue"]);
W("Kh 3c","Kd 5s 5h",{seguir:true,pairT:"top"},["la pareja de 5 está en la mesa","pareja alta"]);
// sobrepareja, pareja media, pareja baja de mano
W("Kh Ks","Qd 9s 4h",{seguir:true,pairT:"over"},["sobrepareja"]);
W("9h 4c","Kd 9s 2h",{seguir:false,pairT:"media"},["no es la carta más alta (el K)","No es pareja alta","Por eso: retírate"]);
W("9h 9s","Qd Ts 4h",{seguir:false,pairT:"baja"},["cartas más altas (Q, 10)"]);
// pareja solo en la mesa
W("Ac 7d","Kh Ks 2c",{seguir:false,pairT:"mesa"},["la pareja de K está en la mesa","no cuenta como tuya","Por eso: retírate"]);
W("Ah 7d","Kh Ks Kc",{seguir:false,pairT:"mesa"},["trío de K está entero en la mesa"]);
// escalera hecha y otras manos hechas
W("Tc 9d","8h 7s 6c",{seguir:true,sType:"hecha",pairT:"hecha"},["Escalera al 10","Por eso: sigue"]);
W("9h 8h","7h 6h 2h",{seguir:true,pairT:"hecha",fType:"hecha"});
W("7c 7d","7h Ks 2c",{seguir:true,pairT:"trio"},["trío de 7"]);
W("Kc 5d","Ks 5h 9c",{seguir:true,pairT:"dosp"},["doble pareja"]);
// doble hueco: 8 cartas pero la regla no lo cuenta
W("5c 9d","7h 8s Jc",{seguir:false,sType:"doblehueco",outs:0},["dos huecos","Por eso: retírate"]);
// pareja media + abierta => sigue gracias al proyecto
W("9c 8d","9h 7s Tc",{seguir:true,sType:"abierta"},["la pareja sola no alcanzaría"]);
// coherencia con la regla en 20000 repartos al azar
for(let i=0;i<20000;i++){const d=E.randDeal(5),h=d.slice(0,2),f=d.slice(2),w=E.flopWhy(h,f),inf=E.flopInfo(h,f);
  const good=["hecha","trio","dosp","top","over"].includes(w.pairT)||w.fType=="proyecto"||w.sType=="abierta";
  ok(w.seguir===inf.seguir&&good===inf.seguir,"incoherente: "+JSON.stringify([h,f])+" "+inf.caso+" "+txt(w));
  ok(w.concl.startsWith(inf.seguir?"Por eso: sigue":"Por eso: retírate"),"conclusión");
  const html=E.flopWhyHTML(w);ok(!/undefined|NaN/.test(html),"texto roto: "+html);if(fail>20)break}
console.log(`\n${pass} pruebas OK, ${fail} fallas`);process.exit(fail?1:0);
