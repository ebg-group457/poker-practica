// Ejecutar: node tests/engine.test.js  (extrae el motor de index.html)
const fs=require("fs"),vm=require("vm"),path=require("path");
const html=fs.readFileSync(path.join(__dirname,"../index.html"),"utf8");
const src=html.split("/*ENGINE-START*/")[1].split("/*ENGINE-END*/")[0];
const ctx={};vm.createContext(ctx);vm.runInContext(src+";this.E={ev5,compare,cmpEv,describe,flopInfo,genCat,genPair,genFlop,CATS,whyWin,whyCat};",ctx);
const E=ctx.E;let pass=0,fail=0;
const P=s=>s.trim().split(/\s+/).map(t=>{const r=t.slice(0,-1),su=t.slice(-1);return{v:{A:14,K:13,Q:12,J:11,T:10}[r]||+r,s:"shdc".indexOf(su)}});
function ok(c,msg){if(c)pass++;else{fail++;console.log("FALLA:",msg)}}
const cat=(h,n)=>{const e=E.ev5(P(h));ok(E.CATS[e.cat]==n,`${h} => ${E.CATS[e.cat]} (esperado ${n})`)};
const win=(a,b,w)=>{const d=E.compare(P(a),P(b)),r=d>0?"A":d<0?"B":"E";ok(r==w,`${a} vs ${b} => ${r} (esperado ${w})`)};
// categorías
cat("Ah 2d 3c 4s 5h","Escalera");cat("Ts Jd Qc Kh As","Escalera");cat("Ts Js Qs Ks As","Escalera real");cat("Ah 2h 3h 4h 5h","Escalera de color");
cat("9c Tc Jc Qc Kc","Escalera de color");cat("Qh Kh Ah 2h 3h","Color");cat("Qd Ks Ah 2c 3h","Carta alta");cat("2h 7h 9h Jh Kh","Color");
cat("9s 9h 9d 9c Ks","Póker");cat("Qs Qh Qd 4c 4h","Full");cat("7s 7h 7c Ad 3s","Trío");cat("Js Jd 5c 5h 9s","Doble pareja");cat("As Ah 8c 6d 2s","Pareja");cat("Kc Jd 8s 5h 2c","Carta alta");
// comparaciones
win("Ah 2d 3c 4s 5h","2c 3d 4h 5s 6c","B");           // rueda es la escalera más baja
win("Ts Jd Qc Kh Ad","9s Td Jc Qh Kd","A");           // broadway > al K
win("2h 7h 9h Jh Kh","Ts Jd Qc Kh Ad","A");           // color > escalera
win("Qs Qh Qd 4c 4h","Ah Kh 9h 5h 2h","A");           // full > color
win("3s 3h 3d 2c 2h","2s 2d 2c As Ah","A");           // full: manda el trío
win("Ks Kh 9d 7c 4h","Kd Kc 9s 7d 3h","A");           // pareja igual, kicker 3º
win("Ks Kh 9d 7c 4h","Kd Kc 9s 7d 4s","E");           // empate exacto
win("Js Jd 5c 5h 9s","Jh Jc 5s 5d Ks","B");           // doble pareja: kicker
win("Js Jd 5c 5h 9s","Th Tc 9h 9d As","A");           // doble pareja: pareja alta
win("Js Jd 4c 4h As","Jh Jc 3s 3d Ks","A");           // segunda pareja
win("Ah Kh 9h 5h 2h","As Ks 9s 5s 3s","B");           // color carta por carta
win("Ah 2d 3c 4s 5h","As 2c 3d 4h 5d","E");           // ruedas empatan
win("9s 9h 9d 9c 2s","9s 9h 9d 9c 3s".replace(/9s 9h 9d 9c/,"8s 8h 8d 8c"),"A");
win("As Ad Ac Ah 2s","Ks Kd Kc Kh Qs","A");
win("Ts Js Qs Ks As","9h Th Jh Qh Kh","A");           // real > color
win("Ah 2h 3h 4h 5h","Kd Kc Kh Ks Ad","A");           // escalera de color > póker
win("Ac Kd 9s 7h 3c","Ad Kh 9c 7d 2s","A");           // carta alta, 5ª carta
win("Qs Qd 3c 3h 2s","Qh Qc 3s 3d 2d","E");
// referencia independiente: puntuación por fuerza bruta distinta
function ref(cs){const v=cs.map(c=>c.v).sort((a,b)=>b-a),f=cs.every(c=>c.s==cs[0].s);const c={};v.forEach(x=>c[x]=(c[x]||0)+1);
 const g=Object.entries(c).map(([k,n])=>[n,+k]).sort((a,b)=>b[0]-a[0]||b[1]-a[1]);let st=0;
 const u=[...new Set(v)];if(u.length==5){if(u[0]-u[4]==4)st=u[0];if(u.join()=="14,5,4,3,2")st=5}
 const shape=g.map(x=>x[0]).join("");let k;
 if(st&&f)k=8;else if(shape=="41")k=7;else if(shape=="32")k=6;else if(f)k=5;else if(st)k=4;else if(shape=="311")k=3;else if(shape=="221")k=2;else if(shape=="2111")k=1;else k=0;
 const t=(st?[st]:g.map(x=>x[1]));while(t.length<5)t.push(0);return [k,...t].reduce((a,x)=>a*16+x,0)}
const deck=[];for(let v=2;v<=14;v++)for(let s=0;s<4;s++)deck.push({v,s});
let mism=0;for(let i=0;i<200000;i++){const d=[...deck].sort(()=>Math.random()-.5).slice(0,10),A=d.slice(0,5),B=d.slice(5);
 const x=Math.sign(E.compare(A,B)),y=Math.sign(ref(A)-ref(B));if(x!=y){mism++;if(mism<3)console.log(JSON.stringify(A),JSON.stringify(B),x,y,ref(A),ref(B))}}
ok(mism==0,"200000 comparaciones aleatorias vs referencia: "+mism+" diferencias");
// generadores sesgados
for(let c=0;c<10;c++)for(let i=0;i<300;i++){const h=E.genCat(c);ok(h&&h.length==5&&new Set(h.map(x=>x.v+"-"+x.s)).size==5&&E.ev5(h).cat==c,"genCat "+c)}
const seen={};for(let i=0;i<3000;i++){const[a,b]=E.genPair();const ks=new Set([...a,...b].map(x=>x.v+"-"+x.s));ok(ks.size==10,"genPair cartas repetidas");const d=E.compare(a,b);seen[d>0?"A":d<0?"B":"E"]=(seen[d>0?"A":d<0?"B":"E"]||0)+1}
console.log("Resultados ¿Cuál gana? en 3000 repartos:",JSON.stringify(seen));
// regla del flop
const fl=(h,f,seg,caso)=>{const r=E.flopInfo(P(h),P(f));ok(r.seguir==seg&&(!caso||r.caso==caso),`flop ${h} | ${f} => ${r.seguir} ${r.caso} (esperado ${seg} ${caso}) ${r.msg}`)};
fl("Ah 7c","Ad 9s 4h",true,"top");fl("Kh Ks","Qd 9s 4h",true,"over");fl("9h 9s","Qd Ts 4h",false,"baja");fl("9h 4c","Kd 9s 2h",false,"media");
fl("Ah 7h","Kh 9h 2c",true,"color");fl("8c 7d","6h 5s Kc",true,"escalera");fl("8c 6d","5h 4s Kc",false,"esquinera");fl("Ah 2d","3c 4s Kh",false,"esquinera");
fl("Kc 5d","Ks 5h 9c",true,"dosp");fl("7c 7d","7h Ks 2c",true,"trio");fl("Ac 7d","Kh Ks 2c",false,"mesa");fl("Ac Qd","Jh 9s 3c",false,"nada");
fl("9h 8h","7h 6h 2h",true,"hecha");fl("Tc 9d","8h 7s 6c",true,"hecha");fl("5c 5d","Kh Ks 5h",true,"hecha");fl("7c 7d","Kh Ks 2c",false,"baja");
fl("Ah Kd","Kh Ks Kc",true,"hecha");fl("Ah 7d","Kh Ks Kc",false,"mesa");fl("Jc Td","Qh 9s 2c",true,"escalera");fl("Kc Qd","Ah Js 2c",false,"esquinera");
const cs={};for(let i=0;i<2000;i++){const g=E.genFlop();cs[g.inf.caso]=(cs[g.inf.caso]||0)+1;ok(E.flopInfo(g.hole,g.flop).seguir==g.inf.seguir,"genFlop coherente")}
console.log("Casos ¿Sigo? en 2000 repartos:",JSON.stringify(cs));
console.log(`\n${pass} pruebas OK, ${fail} fallas`);process.exit(fail?1:0);
