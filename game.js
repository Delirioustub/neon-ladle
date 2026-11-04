// Neon Ladle v2 · first-person neon noodle-bar life sim. Original story & code.
import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {buildWorld,makeLightPool,makeRain,makeSteam,makeTraffic,rnd,pick,DISTRICTS,MATS} from './world.js';
import {makeEnv,fmtWeather} from './env.js';
import {buildCity,regionOf} from './city.js';
import {dressCity} from './props.js';
import {loadRig,makeHuman} from './chars.js';
import {Input,initInput} from './input.js';
import {DISH,CAST,PLACES,SCHED,PATROL,CHAT,TOPICS,makeQuests} from './story.js';
const $=id=>document.getElementById(id);
// ================= settings (device-agnostic; persisted) =================
const SET=Object.assign({low:0,scale:1,master:.8,rain:.8,amb:.7,view:'fp',sens:1},JSON.parse(localStorage.getItem('nlSettings')||'{}'));
if(localStorage.nlLow&&SET.low===0&&!localStorage.nlSettings)SET.low=1;
const saveSet=()=>localStorage.setItem('nlSettings',JSON.stringify(SET));Input.lookSens=SET.sens;
// ================= renderer / scene =================
const canvas=$('c');const R=new THREE.WebGLRenderer({canvas,antialias:false,powerPreference:'high-performance'});
R.toneMapping=THREE.ACESFilmicToneMapping;R.toneMappingExposure=1.15;
const scene=new THREE.Scene();scene.background=new THREE.Color(0x120a22);scene.fog=new THREE.FogExp2(0x241236,.03);
const cam=new THREE.PerspectiveCamera(66,2,.08,220);scene.add(cam);
const hemi=new THREE.HemisphereLight(0x5a4a9a,0x120818,.6);scene.add(hemi);
const moon=new THREE.DirectionalLight(0x6a7aff,.35);moon.position.set(-10,30,10);scene.add(moon);
const fill=new THREE.PointLight(0xb8a8ff,2.2,8,1.3);scene.add(fill);
const cand=[];const W=buildWorld(scene,cand);const CITY=buildCity(scene,cand);W.walk.push(...CITY.walk);Object.assign(W.districts,CITY.districts);dressCity(W.districts,cand);const LP=makeLightPool(scene,cand,SET.low?10:18);
const cubeRT=new THREE.WebGLCubeRenderTarget(256,{type:THREE.HalfFloatType});const cubeCam=new THREE.CubeCamera(.5,120,cubeRT);scene.add(cubeCam);
const composer=new EffectComposer(R);composer.addPass(new RenderPass(scene,cam));
const bloom=new UnrealBloomPass(new THREE.Vector2(512,256),.75,.5,.72);composer.addPass(bloom);composer.addPass(new OutputPass());
// resolution scaling: one place decides the internal render size for every device
function pixelRatio(){return Math.min(devicePixelRatio,SET.low?1:1.5)*SET.scale;}
function vpSize(){const r=R.domElement.getBoundingClientRect();const vv=window.visualViewport;return [Math.max(1,Math.round(Math.max(r.width,innerWidth,vv?vv.width:0))),Math.max(1,Math.round(Math.max(r.height,innerHeight,vv?vv.height:0)))];}
let VW=innerWidth,VH=innerHeight;function resize(){const [w,h]=vpSize();VW=w;VH=h;R.setPixelRatio(pixelRatio());composer.setPixelRatio(pixelRatio());R.setSize(w,h,false);composer.setSize(w,h);bloom.resolution.set(w/2,h/2);cam.aspect=w/h;cam.updateProjectionMatrix();}
const resizeSoon=()=>{resize();[60,250,600,1200].forEach(t=>setTimeout(resize,t));};addEventListener('resize',resizeSoon);addEventListener('orientationchange',resizeSoon);addEventListener('pageshow',resizeSoon);document.addEventListener('visibilitychange',()=>{if(!document.hidden)resizeSoon();});window.visualViewport&&visualViewport.addEventListener('resize',resizeSoon);if(window.ResizeObserver)new ResizeObserver(()=>resize()).observe(R.domElement);resize();
const rain=makeRain(scene,SET.low?1500:2600);const steam=makeSteam(scene,[new THREE.Vector3(-1.2,1.6,-7.5),new THREE.Vector3(1.2,1.6,-7.5),...W.vents,...W.steamPts.slice(0,SET.low?3:8),...CITY.steam.slice(0,SET.low?4:10)]);const traffic=makeTraffic(scene);
// elevated Line 9 train
const train=new THREE.Group();{const bm=new THREE.MeshLambertMaterial({color:0x2a2838}),wm=new THREE.MeshBasicMaterial({color:new THREE.Color(0xffe0b0).multiplyScalar(1.8),toneMapped:false}),sm=new THREE.MeshBasicMaterial({color:new THREE.Color(0x3ff0ff).multiplyScalar(2),toneMapped:false});
 for(let i=0;i<4;i++){const c=new THREE.Mesh(new THREE.BoxGeometry(7,2.2,2.4),bm);c.position.x=i*7.3;train.add(c);for(const s of[-1,1]){const w=new THREE.Mesh(new THREE.BoxGeometry(6,.6,.05),wm);w.position.set(i*7.3,.3,s*1.22);train.add(w);const st=new THREE.Mesh(new THREE.BoxGeometry(7,.08,.06),sm);st.position.set(i*7.3,-.8,s*1.22);train.add(st);}}
 train.position.set(-140,10.4,50);scene.add(train);}
let trainT=10;
// ================= save =================
const DEF={v:2,cash:120,debt:20000,day:1,min:18*60,open:false,served:0,servedTotal:0,rel:{},q:{},flags:{},up:{stools:3,burners:1,sign:0,menu:['shoyu','tea']},talkedDay:{},asked:{},notes:[],track:null,P:null};
let S;try{const raw=localStorage.getItem('neonLadle2');if(raw)S=Object.assign(structuredClone(DEF),JSON.parse(raw));else{const v1=JSON.parse(localStorage.getItem('neonLadle')||'null');S=structuredClone(DEF);
  if(v1){for(const k of['cash','debt','day','servedTotal','rel','q','flags','up'])if(v1[k]!==undefined)S[k]=v1[k];S.flags.fromV1=1;}}}catch(e){S=structuredClone(DEF);}
S.open=false;const save=()=>localStorage.setItem('neonLadle2',JSON.stringify(S));
// ================= UI helpers =================
function toast(t){const d=document.createElement('div');d.className='toast';d.innerHTML=t;$('toasts').appendChild(d);setTimeout(()=>d.remove(),3600);}
const relv=k=>S.rel[k]??2;
const rel=(k,d)=>{S.rel[k]=Math.max(0,Math.min(10,relv(k)+d));if(d)toast(`${CAST[k].n} ${d>0?'♥':'♡'} ${'●'.repeat(Math.round(S.rel[k]/2))}${'○'.repeat(5-Math.round(S.rel[k]/2))}`);};
const note=t=>{if(!S.notes.includes(t)){S.notes.push(t);toast('Journal updated');}};
const flag=(k,v)=>{S.flags[k]=v;};
function chapter(a,b){const c=$('chapter');c.innerHTML=`<b>${a}</b><span>${b}</span>`;c.classList.remove('show');void c.offsetWidth;c.classList.add('show');}
// ================= quest engine =================
const G={S,rel,note,toast,flag,chapter,start:qStart,openGate,nextPoster:()=>POSTERS.find((p,i)=>!S.flags['poster'+i])?.slice(0,2),nextJbox:()=>JBOX.find((p,i)=>!S.flags['jbox'+i])};
const Q=makeQuests(G);
function qStart(id){if(S.q[id]===undefined){S.q[id]=0;if(!S.track||S.q[S.track]==='done'||Q[id].main)S.track=id;toast(`New ${Q[id].main?'story':'side'} quest · <b>${Q[id].t}</b>`);save();}}
function qAdv(id){const q=Q[id];if(typeof S.q[id]!=='number')return;S.q[id]++;if(S.q[id]>=q.steps.length){S.q[id]='done';toast(`Quest complete · <b>${q.t}</b>`);q.done&&q.done();if(S.track===id)S.track=Object.keys(Q).find(k=>typeof S.q[k]==='number'&&Q[k].main)||Object.keys(Q).find(k=>typeof S.q[k]==='number')||null;}save();}
const stepOf=id=>typeof S.q[id]==='number'?Q[id].steps[S.q[id]]:null;
const onList=s=>Array.isArray(s.on)?s.on:[s.on];
function emit(ev){for(const id in Q){const s=stepOf(id);if(!s)continue;for(const o of onList(s)){if(o===ev&&!s.say){qAdv(id);break;}
  if(o.startsWith('count:')){const[,key,n]=o.split(':');if(ev==='count:'+key){const c=Object.keys(S.flags).filter(f=>f.startsWith(key)&&/\d$/.test(f)).length;if(c>=+n)qAdv(id);else toast(`${key==='poster'?'Posters read':'Relays spliced'} ${c}/${n}`);}}}}}
function stepTarget(s){let a=s&&s.at;if(typeof a==='function')a=a();if(!a)return null;if(typeof a==='string'){const n=npcs[a];return n&&n.obj.visible?new THREE.Vector3(n.obj.position.x,2.1,n.obj.position.z):null;}return new THREE.Vector3(a[0],1.4,a[1]);}
// ================= dialogue =================
let dlgOpen=false,dlgWho=null;
function say(k,lines,opts=[]){dlgOpen=true;dlgWho=k;const D=$('dlg');D.classList.remove('hide');const c=CAST[k];
 $('dname').textContent=c?c.n.toUpperCase():k.toUpperCase();$('drole').textContent=c?c.role:'';const r=Math.round(relv(k)/2);$('dheart').textContent=c?'♥ '+'●'.repeat(r)+'○'.repeat(5-r):'';
 const pi=$('dport');if(c){pi.src='portraits/'+k+'.jpg';pi.parentElement.classList.remove('none');}else pi.parentElement.classList.add('none');
 if(npcs[k]){npcs[k].talking=true;npcs[k].h.play('talk');}
 let i=0;const show=()=>{$('dtext').textContent=lines[i];const o=$('dopts');o.innerHTML='';
  if(i<lines.length-1){const b=document.createElement('button');b.textContent='…';b.onclick=()=>{i++;show();};o.appendChild(b);}
  else{(opts.length?opts:[{t:'Leave'}]).forEach(op=>{const b=document.createElement('button');b.textContent=op.t;b.onclick=()=>{endDlg();op.fx&&op.fx();if(op.then)op.then();save();};o.appendChild(b);});}};show();}
function endDlg(){$('dlg').classList.add('hide');dlgOpen=false;if(npcs[dlgWho])npcs[dlgWho].talking=false;dlgWho=null;}
function inspect(title,text,opts){say(title,[].concat(text),opts||[]);}
const OFFERS={s1:"Twelve-hour shift and it's still raining. If you've got a Kettle Tea when I come by the Ladle around eight, I'd love you forever.",s2:"My drone, Mothball, ate a gust and landed on an awning at the west end of the street. I can't climb. I'm grounded. Literally.",
 s3:"Wardline. Three people from this ward went missing this month. Posters are up: Saltgate, the market, the Line 9 approach. Read them. Maybe a face jogs something.",s4:"GREETINGS. Parcel 77-K is lost. Last ping: the canal dumpster, far north on the east bank. Courier rating at risk. Distress level: moderate.",
 s5:"Pell in the Lantern Market is gouging me on fish. Pell likes new faces. Go haggle for me? I'd owe you. A little.",s6:"I need someone I trust. There's a crate of medicine outside the clinic. It goes to a houseboat on the canal. No paperwork. No questions.",
 s7:"I built relays. Three. They need splicing into junction boxes: the end of the market, the plaza corner, canal north. You're tall. Ish.",s8:"I'll be honest. I want to taste it. Her broth. Your broth. I'll come sit at your counter tonight. Don't make it weird.",
 s9:"My route planner keeps drawing a line to the houseboat on the canal. I am... afraid to look. That is new. Will you look for me?"};
function talk(k){const n=npcs[k];
 // 1) an active quest step that wants this conversation
 for(const id in Q){const s=stepOf(id);if(!s||!s.say||!onList(s).includes('talk:'+k))continue;const r=s.say(G,k);if(!r)continue;
  say(k,r[0],r[1].map(o=>({...o,fx:()=>{o.fx&&o.fx();if(o.adv)qAdv(id);}})));return;}
 // 2) offer a side quest this person gives
 for(const id in Q){const q=Q[id];if(q.giver!==k||S.q[id]!==undefined||(q.req&&!q.req()))continue;
  say(k,[OFFERS[id]],[{t:'"I\'ll do it."',fx:()=>qStart(id)},{t:'"Not right now."'}]);return;}
 // 3) small talk + topics
 const tier=relv(k)>=7?2:relv(k)>=4?1:0;const late=S.min>=23*60;const pool=CHAT[k];const line=pick(late&&Math.random()<.5?pool.l:pool[tier]);
 const today=S.talkedDay[k]===S.day;const opts=[];
 opts.push({t:today?'"Good to see you again."':'Chat a while',fx:()=>{if(!today){S.talkedDay[k]=S.day;rel(k,1);}}});
 const tops=[['dess','Ask about Dess'],['orrin','Ask about Orrin Mutual'],['line9','Ask about Line 9']].filter(([t])=>TOPICS[t][k]&&!(S.asked[k+t]===S.day));
 if(tops.length){const [t,l]=tops[0];opts.push({t:l,then:()=>{S.asked[k+t]=S.day;say(k,[TOPICS[t][k]],[{t:'"Thanks."'}]);}});}
 if(k==='dess'&&S.flags.dessHome)opts.unshift({t:'"Any tips, chef?"',then:()=>say('dess',[pick(["Customers wait longer if you look busy. Look busy.","Tea's a gateway. Nobody leaves after tea. They want soup.","Close before curfew. Wardline doesn't tip."])],[])});
 opts.push({t:'"Night."'});say(k,[line],opts);}
// ================= people =================
await loadRig('models/');
const npcs={};const tags={};
for(const k in CAST){const h=makeHuman(CAST[k].look);scene.add(h.obj);npcs[k]={k,h,obj:h.obj,route:[],place:null,talking:false,pi:0};
 const t=document.createElement('div');t.className='tag';t.innerHTML=`<span>${CAST[k].n}</span>`;$('tags').appendChild(t);tags[k]=t;}
npcs.dess.obj.visible=false;
const BASE_LOOK={sex:'f',skin:0xe0c0a8,top:0x221a28,pants:0x16141c,hair:{style:'bob',color:0x2a1a2a},coat:{color:0x3a2440,len:.45,shiny:1},glow:{where:'strip',color:0xff3fa4},gear:[{t:'bag',col:0x221a28}]};
let player=makeHuman(Object.assign({},BASE_LOOK,S.look||{}));scene.add(player.obj);
function rebuildPlayer(){scene.remove(player.obj);player=makeHuman(Object.assign({},BASE_LOOK,S.look||{}));scene.add(player.obj);}
const SKIN=[0xf0d0b8,0xe0b898,0xc89070,0x8a5a40,0x5a3828,0xe8c8a8];const DRESS=[0x2a2438,0x3a2a2a,0x1e2a3a,0x2a3a2a,0x3a3040,0x4a2030,0x202028,0x5a4a3a];
const randLook=()=>{const sex=Math.random()<.5?'m':'f';const hood=Math.random()<.22;return {sex,skin:pick(SKIN),top:pick(DRESS),pants:pick([0x141218,0x1a1a22,0x22202a,0x2a2430]),boots:pick([0x0c0a0e,0x1a1410,0x2a2a30]),
 hair:{style:pick(sex==='m'?['short','buzz','spiky','beard','short']:['bob','bun','long','short','buzz']),color:pick([0x101010,0x2a1a10,0x6a4a2a,0xc0b0a0,0xff3fa4,0x3ff0ff,0x101010])},hat:hood?'hood':pick([null,null,null,'cap','beanie']),hatColor:pick(DRESS),
 coat:hood||Math.random()<.65?{color:pick(DRESS),len:pick([.4,.45,.6,.72]),shiny:Math.random()<.3}:null,umbrella:Math.random()<.4?pick([0x1a1a26,0xff3fa4,0x3ff0ff,0xffe14d,0x2a2a3a]):null,
 glow:Math.random()<.35?{where:pick(['visor','collar','strip','badge']),color:pick([0x3ff0ff,0xff3fa4,0x5dff9b,0xb04dff])}:null,gear:Math.random()<.45?[{t:pick(['bag','satchel','mask','glasses','pads']),c:pick([0x3ff0ff,0xff3fa4])}]:[],slim:rnd(.88,1.02),bulk:Math.random()<.2?rnd(1.05,1.15):1,scale:rnd(.93,1.05),tempo:rnd(.9,1.08)};};
const RICH=[0xd8d4cc,0x8a8a9a,0x1a1a22,0x2a2a3a,0xe8e4e0,0x5a4a6a,0x3a4a5a],POOR=[0x2a2420,0x3a3028,0x2a2c22,0x34281e,0x1e1c1a,0x3a2a2a];
function classLook(cls){const l=randLook();if(cls==='rich'){l.hat=Math.random()<.15?'cap':null;l.coat={color:pick(RICH),len:pick([.6,.72,.72]),shiny:Math.random()<.6};l.top=pick(RICH);l.umbrella=Math.random()<.6?pick([0xf0f0f0,0x101014,0xd8c8a8,0x3ff0ff]):null;l.glow=Math.random()<.5?{where:pick(['visor','collar']),color:pick([0x9fe8ff,0xffffff,0xc9b2ff])}:null;l.hair.color=pick([0x101010,0x2a1a10,0x6a4a2a,0xd8c8a8,0xe8e8f0]);}
 else if(cls==='poor'){const hood=Math.random()<.5;l.hat=hood?'hood':pick([null,'beanie','beanie','cap']);l.coat=hood||Math.random()<.5?{color:pick(POOR),len:pick([.4,.45]),shiny:0}:null;l.top=pick(POOR);l.pants=pick(POOR);l.umbrella=Math.random()<.12?0x2a2a2a:null;l.gear=Math.random()<.5?[{t:pick(['mask','bag','satchel','pads']),c:pick([0xff4d3d,0x5dff9b])}]:[];l.glow=Math.random()<.15?{where:'strip',color:pick([0xff4d3d,0xff8a3d])}:null;}
 return l;}
const COP=()=>({sex:pick(['m','f']),skin:pick(SKIN),top:0x1e2a44,pants:0x141c30,boots:0x08080c,hair:{style:'buzz',color:0x2a1a10},hat:'cap',hatColor:0x141c30,coat:{color:0x1c2640,len:.6,shiny:1},glow:{where:'collar',color:0x3f8aff},gear:[{t:'pads',col:0x141c30}],scale:rnd(.98,1.04)});
// district graph routing
function districtAt(x,z){{const r=regionOf(x,z);if(r!=='mid')return r;}if(x>=47.5)return'canal';if(z<-8.3&&x>20&&x<28)return'alley';if(z>8.3&&z<40.6&&x>-28&&x<-16)return'avenue';if(z>=40.4&&x<-4)return'plaza';return'main';}
const chain=d=>{const c=[d];while(DISTRICTS[c[c.length-1]].parent)c.push(DISTRICTS[c[c.length-1]].parent);return c;};
function route(x0,z0,x1,z1){const a=chain(districtAt(x0,z0)),b=chain(districtAt(x1,z1));const pts=[];let common=a.find(d=>b.includes(d));
 for(const d of a){if(d===common)break;pts.push(DISTRICTS[d].join);}const down=[];for(const d of b){if(d===common)break;down.unshift(DISTRICTS[d].join);}pts.push(...down);
 // the platform room is behind the gate: go through the gate mouth
 if(z1>67.5)pts.push([-22,66]);if(z0>67.5)pts.unshift([-22,66]);pts.push([x1,z1]);return pts.map(p=>({x:p[0],z:p[1]}));}
function placeFor(k){const m=S.min;
 if(k==='dess'){if(S.q.m6===undefined)return null;if(!S.flags.dessHome)return'dess_platform';if(stepOf('m8')===Q.m8.steps[0]&&S.open)return'stool:2';return'dess_ladle';}
 if(k==='benny'&&stepOf('s8')===Q.s8.steps[0]&&S.open&&m<25*60)return'stool:4';
 if(k==='sela'&&m>=20*60&&m<21*60+30)return'stool:3';
 const sc=SCHED[k];let p=sc[0][1];for(const [t,pl] of sc)if(m>=t)p=pl;return p;}
const STOOLX=[-2.6,-1.3,0,1.3,2.6];
function placePos(p){if(p.startsWith('stool:'))return[STOOLX[+p.slice(6)],-5.05,'sit',Math.PI];return PLACES[p];}
// ================= interactables =================
const interact=[];// {id,pos:()=>Vector3,r,label,fn,cond}
function addI(id,x,y,z,r,label,fn,cond=()=>true){interact.push({id,pos:()=>new THREE.Vector3(x,y,z),r,label,fn,cond});}
addI('kitchen',3.6,1.2,-6.3,2.4,'Kitchen',()=>openCook());
addI('home',-6.2,1.2,-8.4,2.2,'Home · sleep',()=>sleep());
addI('fuse',24,1,-46.6,2.2,'Fuse box',()=>{if(stepOf('m3')===Q.m3.steps[2]){inspect('Fuse box','Behind the fuses: a greasy tin. Inside, Dess\'s handwriting: "Midnight Miso. Toast the paste. Never trust Orrin. Line 9 still hums."');emit('interact:fuse');}else inspect('Fuse box','A rusted fuse box humming in the rain. Someone scratched a little ladle into the paint.');});
const POSTERS=[[-20,1.6,-8.5,'TOMAS REYE, 34. Dock loader. Last seen: The Neon Ladle, Saltgate.'],[21.3,1.6,-24,'AIKO VENN, 27. Line cook. Last seen near the old Line 9 stairs.'],[-17.1,1.6,26,'"GRANDPA" OSU, 71. Retired. Regular at Saltgate noodle bars. Owes nobody, says his daughter. Orrin says otherwise.']];
POSTERS.forEach(([x,y,z,t],i)=>addI('poster'+i,x,y,z,2,'Missing poster',()=>{inspect('Missing',t);if(S.q.s3===0&&!S.flags['poster'+i]){S.flags['poster'+i]=1;emit('count:poster');}}));
const JBOX=[[24,-46],[-36,62],[66,-38]];JBOX.forEach(([x,z],i)=>addI('jbox'+i,x,1.2,z,2,'Junction box',()=>{if(S.q.s7===0&&!S.flags['jbox'+i]){S.flags['jbox'+i]=1;toast('Relay spliced');emit('count:jbox');}else inspect('Junction box','Humming. Warm. A sticker of a moth on the lid.');},()=>S.q.s7===0||i>0));
addI('drone',-30,2.4,-6.5,2.6,'Something on the awning',()=>{toast('Got Mothball the drone');emit('interact:drone');},()=>S.q.s2===0);
addI('parcel',64.5,.8,-38.5,2.2,'Dumpster',()=>{if(S.q.s4===0){toast('Found Parcel 77-K');emit('interact:parcel');}else inspect('Dumpster','Wet cardboard, a broken umbrella, and a very judgmental cat.');});
addI('gate',-22,1.4,67.4,2.6,'Line 9 gate',()=>{const s=stepOf('m5');if(s===Q.m5.steps[1]){inspect('Line 9 gate',['Rusted shutters, an Orrin Mutual seal, and a fresh keypad that doesn\'t belong. Under the hum you hear it: machinery, far below.','You need help to get through. Kip can crack locks. Officer Varn carries Wardline keycards.']);emit('interact:gate');}
 else if(s===Q.m5.steps[3]){inspect('Line 9 gate',S.flags.gateBy==='kip'?'You press Kip\'s spike to the panel and count to forty. The camera blinks. The gate shudders up.':'Ilse\'s keycard. The light turns green. The gate shudders up, groaning.');emit('interact:gate');}
 else if(!S.flags.gateOpen)inspect('Line 9 gate','Sealed. "STRUCTURAL HAZARD · ORRIN MUTUAL PROPERTY". The ground under your feet hums.');},()=>!S.flags.gateOpen);
addI('pell',22.3,1.2,-36,2.2,"Pell's fish stall",()=>{if(S.q.s5===0)say('Pell',["Fresh! Mostly. Forty a crate. For you, forty. For Benny, sixty. Benny knows why."],[{t:'Haggle hard (be ruthless)',fx:()=>{S.flags.haggle='hard';emit('interact:pell');toast('Pell grumbles: twenty a crate')}},{t:'Pay a fair price',fx:()=>{S.flags.haggle='fair';S.cash=Math.max(0,S.cash-20);emit('interact:pell');toast('Fair deal · −¢20')}}]);else inspect('Pell',"Pell looks at you the way fish look at nets.");});
addI('crate',17.5,.6,-7.6,2,'Medicine crate',()=>{toast('Picked up the medicine crate');emit('interact:crate');},()=>S.q.s6===0);
addI('boat',56,.8,28.4,2.6,'Houseboat',()=>{if(S.q.s6===1){inspect('Houseboat','A tired woman opens the hatch, takes the crate, and presses a paper crane into your hand. Inside, a child coughs, then laughs.');emit('interact:boat');}
 else if(S.q.s9===0){inspect('Houseboat',['Cabin 9. Empty except for a courier locker, scratched with a duck.','Inside: a delivery log on an old memory card. JUNO-7, the header says.']);emit('interact:boat');}
 else inspect('Houseboat','Lanterns bob on the black water. Somebody inside is humming along to the rain.');});
addI('shrine',25.8,1,-41,2,'Little shrine',()=>inspect('Shrine','Incense, a bowl of rice, and a tiny ladle someone carved from a chopstick. Notes tucked underneath: names. Tomas. Aiko. Osu.'));
addI('view',52,1.4,-12,2.2,'Railing',()=>inspect('Velvet Canal','Rain stipples the black water. Neon smears across it like wet paint. Somewhere a houseboat radio plays an old love song, badly.'));
for(const k in CAST)interact.push({id:'npc:'+k,npc:k,pos:()=>new THREE.Vector3(npcs[k].obj.position.x,1.3,npcs[k].obj.position.z),r:2.6,label:'Talk · '+CAST[k].n.split(' ')[0],fn:()=>talk(k),cond:()=>npcs[k].obj.visible});
function openGate(){S.flags.gateOpen=1;W.walk.push([-26.6,-17.4,66,75.5]);gateAnim=1;}let gateAnim=0;if(S.flags.gateOpen){W.walk.push([-26.6,-17.4,66,75.5]);W.gate.position.y=2.9;}
// ================= R2 city: interactables, staff, metro =================
let riding=null,crack=0;
for(const c of CITY.inter)interact.push({id:c.id,pos:()=>new THREE.Vector3(c.x,c.y,c.z),r:c.r,label:c.label,fn:()=>cityAct(c.act),cond:()=>true});
function tp(x,y,z,yaw){fade();setTimeout(()=>{P.x=x;P.y=y;P.z=z;if(yaw!==undefined)P.yaw=yaw;P.sit=null;},350);}
function cityAct(a){if(a.type==='tp'){tp(a.x,a.y,a.z,a.yaw);if(a.msg)setTimeout(()=>toast(a.msg),700);}
 else if(a.type==='sit'){P.x=a.x;P.z=a.z;P.y=a.y;P.yaw=a.yaw;P.sit=1;toast('Sitting · move to stand');}
 else if(a.type==='read')inspect(a.t,a.t==='Wardline scan'?(lookClass()==='high'?'The arch hums. A soft chime: RESIDENT-GRADE ATTIRE · WELCOME BACK. Nobody looks twice at you.':lookClass()==='low'?'The arch hums, then buzzes. VISITOR · LOW CITY ORIGIN · MONITORED. Two drones swing your way and hang there.':a.x):a.x);else if(a.type==='metro')metro(a.from);}
function metro(from){const st=CITY.stations;const opts=Object.keys(st).filter(k=>k!==from).map(k=>({t:`Ride to ${st[k].name}${S.cash>=5?' · ¢5':''}`,fx:()=>{if(S.cash>=5){S.cash-=5;}else toast('You hop the turnstile. Nobody stops you. This time.');ride(k);}}));
 opts.push({t:'Not now'});say('Ring Line',['Stairs down into warm, stale air. A chime, a voice older than the city: "Ring Line. Mind the gap. Mind your business."'],opts);}
function ride(to){fade();setTimeout(()=>{P.x=-3;P.z=CITY.car.cz+.3;P.y=0;P.yaw=-Math.PI/2;P.sit=null;riding={to,t:11};toast('Next stop · '+CITY.stations[to].name);},350);}
function tickRide(dt){if(!riding)return;riding.t-=dt;if(riding.t<=0){const s=CITY.stations[riding.to];riding=null;fade();setTimeout(()=>{P.x=s.spawn[0];P.z=s.spawn[1];P.y=0;P.sit=null;emit('metro');},350);}}
const staff=[];for(const s0 of CITY.staff){const look=s0.rand?Object.assign(randLook(),{sex:s0.sex}):Object.assign({pants:0x1a1a22,boots:0x0c0a0e},s0.look);const h=makeHuman(look);h.obj.position.set(s0.x,s0.sit?.1:0,s0.z);h.obj.rotation.y=s0.ry;scene.add(h.obj);h.play(s0.sit?'sit':'idle');staff.push({h,s0});
 interact.push({id:'staff'+staff.length,pos:()=>new THREE.Vector3(s0.x,1.3,s0.z),r:2.6,label:(s0.shop?'Talk · ':'')+s0.k,fn:()=>staffTalk(s0),cond:()=>true});}
const SHOPS={
 clothes:{hi:"Maison Veil. Everything here is waterproof, including the prices.",items:[['Pearl long coat',90,{coat:{color:0xd8d4cc,len:.72,shiny:1}}],['Obsidian jacket',60,{coat:{color:0x16161c,len:.45,shiny:1}}],['Teal glow collar',35,{glow:{where:'collar',color:0x3ff0ff}}],['Ivory umbrella',25,{umbrella:0xf0f0f0}]]},
 cafe:{hi:"Lumen Café. Real beans. Well. Realer.",items:[['Lumen latte',6,null,'Warm, bitter, faintly floral. For a moment the rain sounds far away.'],['Rain-cake slice',9,null,'Sweet, soft, and it costs more than a Saltgate dinner.']]},
 bar:{hi:"Hesk wipes a glass with a dirtier rag.",items:[['Ashline lager',4,null,'Tastes like a battery and a long day. Perfect.'],['Buy Hesk a drink (hear a rumor)',6,null,null,1]]},
 pawn:{hi:"Ninefingers taps the counter. Nine times.",items:[['Patched black umbrella',10,{umbrella:0x1a1a22}],['Hooded rain shell',30,{hat:'hood',coat:{color:0x2a2c22,len:.45}}],['Cracked visor',15,{glow:{where:'visor',color:0x5dff9b}}]]}};
const RUMORS=["The barges leave the Ashline pier at three in the morning. No lights. They come back lighter.","Orrin Mutual buys debts nobody can pay. Then the debtors stop being anybody's problem.","Wardline doesn't patrol down here. They just count us.","There's an old Ring Line tunnel that doesn't show on the map. You can hear it from the Line 9 platform.","Somebody's paying good money for couriers who can't read."];
function staffTalk(s0){const sh=s0.shop&&SHOPS[s0.shop];if(sh&&s0.shop==='bar'&&lookClass()==='high'&&!S.flags.heskCoat){S.flags.heskCoat=1;say(s0.k,['Nice coat. Lose it down here or somebody will lose it for you.'],[{t:'"Noted."'}]);return;}if(!sh){say(s0.k,[pick(s0.lines)],[{t:'"Thanks."'}]);return;}
 const opts=sh.items.map(([n,c,look,txt,rum])=>({t:`${n} · ¢${c}`,fx:()=>{if(S.cash<c){toast('Not enough cash');return;}S.cash-=c;if(look){S.look=Object.assign(S.look||{},look);rebuildPlayer();toast(`Bought ${n} · switch to third person to see it`);}else if(rum)setTimeout(()=>say(s0.k,[pick(RUMORS)],[{t:'"Huh."'}]),50);else toast(txt);save();}}));
 opts.push({t:'"Just looking."'});say(s0.k,[(s0.lines?pick(s0.lines)+' ':'')+sh.hi],opts);}
function tickStaff(dt){for(const st of staff){const d=Math.hypot(st.s0.x-cam.position.x,st.s0.z-cam.position.z);st.h.obj.visible=d<45;if(d<45)st.h.lod(d,dt);}}
// ================= R3: look class, character creator, jobs, apartments =================
function lookClass(){const l=S.look||{};if(l.hat==='hood')return'low';if(l.coat&&l.coat.shiny&&l.coat.len>=.7)return'high';return'mid';}
let creating=false;const CC={sex:['f','m'],skin:[0xf0d0b8,0xe0b898,0xc89070,0x8a5a40,0x5a3828],hairF:['bob','bun','long','short','buzz'],hairM:['short','buzz','spiky','beard'],hairC:[0x101010,0x2a1a10,0x6a4a2a,0xc0b0a0,0xff3fa4,0x3ff0ff,0x5dff9b],coat:[[0x3a2440,.45,1],[0x16161c,.6,1],[0x2a2c22,.45,0],[0x5a2030,.72,1],null],glow:[0xff3fa4,0x3ff0ff,0x5dff9b,0xffe14d,null],height:[.96,1,1.04]};
function cyc(a,v,d){const i=a.indexOf(v);return a[((i<0?0:i)+d+a.length)%a.length];}
function openCreator(first){creating=true;S.look=S.look||{};const el=$('cc');el.classList.remove('hide');const L=()=>Object.assign({},BASE_LOOK,S.look);
 const rows=[['Body',()=>L().sex==='m'?'Masc':'Fem',d=>{S.look.sex=L().sex==='m'?'f':'m';S.look.hair={style:(S.look.sex==='m'?CC.hairM:CC.hairF)[0],color:L().hair.color};}],
  ['Skin',()=>'tone '+(CC.skin.indexOf(L().skin)+1||1),d=>{S.look.skin=cyc(CC.skin,L().skin,d);}],
  ['Hair',()=>L().hair.style,d=>{S.look.hair={style:cyc(L().sex==='m'?CC.hairM:CC.hairF,L().hair.style,d),color:L().hair.color};}],
  ['Hair colour',()=>'#'+L().hair.color.toString(16).padStart(6,'0'),d=>{S.look.hair={style:L().hair.style,color:cyc(CC.hairC,L().hair.color,d)};}],
  ['Coat',()=>L().coat?'#'+L().coat.color.toString(16).padStart(6,'0'):'none',d=>{const a=CC.coat;const i=a.findIndex(c=>c&&L().coat&&c[0]===L().coat.color);const n=a[((i<0?a.length-1:i)+d+a.length)%a.length];S.look.coat=n?{color:n[0],len:n[1],shiny:n[2]}:null;}],
  ['Glow trim',()=>L().glow?'#'+L().glow.color.toString(16).padStart(6,'0'):'none',d=>{const a=CC.glow;const i=a.findIndex(c=>L().glow&&c===L().glow.color);const n=a[((i<0?a.length-1:i)+d+a.length)%a.length];S.look.glow=n?{where:'strip',color:n}:null;}],
  ['Height',()=>({0.96:'Shorter',1:'Average',1.04:'Taller'})[L().scale||1],d=>{S.look.scale=cyc(CC.height,L().scale||1,d);}]];
 const draw=()=>{el.querySelector('.ccr').innerHTML=rows.map((r,i)=>`<div class="row"><button data-i="${i}" data-d="-1">‹</button><span>${r[0]}<br><small>${r[1]()}</small></span><button data-i="${i}" data-d="1">›</button></div>`).join('');
  el.querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>{rows[+b.dataset.i][2](+b.dataset.d);rebuildPlayer();draw();});};draw();
 $('ccDone').onclick=()=>{creating=false;el.classList.add('hide');save();if(first)beginStory();};}
function tickCreator(dt){if(!creating)return;player.obj.visible=true;player.obj.position.set(P.x,P.y,P.z);player.obj.rotation.y=P.yaw+Math.PI;player.play('idle');player.mixer.update(dt);
 const f=new THREE.Vector3(-Math.sin(P.yaw),0,-Math.cos(P.yaw)),r=new THREE.Vector3(Math.cos(P.yaw),0,-Math.sin(P.yaw));cam.position.set(P.x+f.x*2.4-r.x*.6,P.y+1.4,P.z+f.z*2.4-r.z*.6);cam.lookAt(P.x-r.x*.55,P.y+1.0,P.z-r.z*.55);}
S.rep=S.rep||{tide:0,wardline:0,civ:0,orrin:0};const FN={tide:'Ashline Tide (gang)',wardline:'Wardline (police)',civ:'Civilians',orrin:'Orrin Mutual'};
const SPOTS=[[-30,5,'Saltgate west end'],[34,-6,'Saltgate east end'],[23,-36,'Lantern Market'],[-22,28,'Line 9 Approach'],[-30,60,'Line 9 Plaza'],[52,20,'Velvet Canal east bank'],[64,-25,'Velvet Canal north'],[-40,-252,'Crown boulevard west'],[30,-268,'Crown, by the Galleria'],[12,-252,'Crown fountain'],[-30,256,'Ashline alley'],[20,264,'Ashline market row'],[62,259,'Ashline pier'],[-35,249,'Ashline rooftops',7.5],[5,271,'Ashline south roofs',7.5]];
const BOARDS=[{id:'tide',x:-37.2,y:1.3,z:265.6,label:"Hesk's back-room board · Ashline Tide",f:['tide','civ']},{id:'ward',x:-14,y:1.3,z:-7.7,label:'Wardline tip terminal',f:['wardline','civ']},{id:'orrin',x:-48,y:1.3,z:-271.4,label:'Orrin courier kiosk',f:['orrin','civ']}];
const JOBT={courier:{n:'Courier run',d:(a,b)=>[`Pick up the package · ${a[2]}`,`Deliver it · ${b[2]}`],pay:[30,70]},
 investigate:{n:'Investigation',d:(a,b,c)=>[`Look for evidence · ${a[2]}`,`Follow the second lead · ${b[2]}`,`Search · ${c[2]}`],pay:[60,120]},
 fix:{n:'Repair job',d:a=>[`Fix the dead relay · ${a[2]}`],pay:[25,45]}};
const FLAV={tide:{courier:"A sealed tin for a Tide runner. Don't shake it.",investigate:"Someone's been skimming Tide turf money. Find out who.",fix:"Tide's camera relay died. Fix it before Wardline notices."},
 wardline:{courier:'Evidence transfer. The official van "broke down."',investigate:"Missing-person tip. Officially nobody's working it. Unofficially, you are.",fix:'A patrol beacon is out. Wardline pays contractors, slowly.'},
 civ:{courier:"Medicine for a neighbor who can't leave the house.",investigate:'A mother wants to know where her son goes at night.',fix:"The block's water pump relay keeps tripping."},
 orrin:{courier:'A locked case, no questions. Orrin tips well for silence.',investigate:'Audit a "delinquent account." Find where the debtor hides.',fix:'Calibrate an Orrin advert. The smile flickers.'}};
function genJob(fs){const fac=pick(fs),type=pick(Object.keys(JOBT)),sp=[...SPOTS].sort(()=>Math.random()-.5).slice(0,3),T=JOBT[type];let pay=Math.round(rnd(...T.pay));if(fac==='orrin'&&lookClass()==='low')pay=Math.round(pay*.8);if(fac==='tide'&&lookClass()==='high')pay=Math.round(pay*.85);return {fac,type,sp:sp.map(p=>p.slice()),pay,flav:FLAV[fac][type]};}
function mountJob(j){const T=JOBT[j.type],ds=T.d(...j.sp);Q.job={t:`${T.n} · ${FN[j.fac].split(' (')[0]}`,steps:ds.map((d,i)=>({d,at:[j.sp[i][0],j.sp[i][1]],on:'job:'+i})),done:()=>{S.cash+=j.pay;S.rep[j.fac]=(S.rep[j.fac]||0)+1;toast(`Paid ¢${j.pay} · ${FN[j.fac]} standing ${S.rep[j.fac]}`);S.jobsDone=(S.jobsDone||0)+1;delete S.jobDef;setTimeout(()=>{delete Q.job;delete S.q.job;save();},50);}};}
if(S.jobDef&&typeof S.q.job==='number')mountJob(S.jobDef);else{delete S.q.job;delete S.jobDef;}
const jobMarker=new THREE.Mesh(new THREE.OctahedronGeometry(.22),new THREE.MeshBasicMaterial({color:new THREE.Color(0xffe14d).multiplyScalar(2),toneMapped:false}));scene.add(jobMarker);jobMarker.visible=false;
const jobI={id:'jobpt',pos:()=>{const p=S.jobDef.sp[S.q.job];return new THREE.Vector3(p[0],(p[3]||0)+1.1,p[1]);},r:2.2,label:'',
 fn:()=>{const j=S.jobDef,i=S.q.job;const msg=j.type==='investigate'?pick(['A smear of blue paint and a dropped Orrin keycard sleeve.','Footprints in the wet grime. Too many for one person.','A receipt: Ring Line, 03:12, ASHLINE. Every night this week.','Someone scratched a moth into the wall. Fresh.']):j.type==='fix'?'You pry the panel, bridge two corroded leads, and the relay hums back to life.':i?"Handed over. They don't say thanks. They do pay.":'The package is heavier than it looks.';toast(msg);emit('job:'+i);},cond:()=>{if(!S.jobDef||typeof S.q.job!=='number')return false;const j=S.jobDef;jobI.label=j.type==='courier'?(S.q.job?'Deliver the package':'Pick up the package'):j.type==='fix'?'Fix the relay':'Search for evidence';return true;}};interact.push(jobI);
for(const b of BOARDS){interact.push({id:'board'+b.id,pos:()=>new THREE.Vector3(b.x,b.y,b.z),r:2.4,label:b.label,fn:()=>jobBoard(b),cond:()=>true});const m=new THREE.Mesh(new THREE.BoxGeometry(1.1,1.4,.08),new THREE.MeshBasicMaterial({color:new THREE.Color(b.id==='tide'?0xff8a3d:b.id==='ward'?0x3f8aff:0xc9b2ff).multiplyScalar(.6),toneMapped:false}));m.position.set(b.x,1.4,b.z+(b.z>200?.6:-.6));scene.add(m);cand.push({x:b.x,y:2,z:b.z,col:0xffe0a0,int:2,dist:5});}
function jobBoard(b){if(S.jobDef){say('Job board',[`You're already on a job: ${Q.job.t}. ${S.jobDef.flav}`],[{t:'Keep at it'},{t:'Abandon the job',fx:()=>{delete S.jobDef;delete Q.job;delete S.q.job;if(S.track==='job')S.track=null;toast('Job abandoned');}}]);return;}
 const offers=[genJob(b.f),genJob(b.f),genJob(b.f)];say('Job board',['Three postings flicker on the cracked screen.'],offers.map(j=>({t:`${JOBT[j.type].n} · ${FN[j.fac].split(' (')[0]} · ¢${j.pay}`,fx:()=>{S.jobDef=j;mountJob(j);S.q.job=0;S.track='job';toast(`Job taken · <b>${Q.job.t}</b><br>${j.flav}`);save();}})).concat([{t:'Leave'}]));}
S.apts=S.apts||{};S.decor=S.decor||{};const DECOR=[['Nothing',null],['Potted fern',0x2a6a40],['Neon tube (pink)',0xff3fa4],['Neon tube (cyan)',0x3ff0ff],['Paper lantern',0xffb06b],['Rug',0x6a2a3a],['Vinyl crate',0x3a3a48]];
const decorG={};function buildDecor(key){const A=CITY.apts[key];if(decorG[key])scene.remove(decorG[key]);const g=new THREE.Group();scene.add(g);decorG[key]=g;
 A.slots.forEach((p,si)=>{const it=DECOR[(S.decor[key]||[])[si]||0];if(!it[1])return;const c=it[1],name=it[0];let m;
  if(name.startsWith('Neon'))m=new THREE.Mesh(new THREE.BoxGeometry(1.2,.06,.06),new THREE.MeshBasicMaterial({color:new THREE.Color(c).multiplyScalar(2.5),toneMapped:false}));
  else if(name==='Paper lantern')m=new THREE.Mesh(new THREE.SphereGeometry(.22,10,8),new THREE.MeshBasicMaterial({color:new THREE.Color(c).multiplyScalar(1.6),toneMapped:false}));
  else if(name==='Rug')m=new THREE.Mesh(new THREE.BoxGeometry(2,.02,1.3),new THREE.MeshLambertMaterial({color:c}));
  else m=new THREE.Mesh(new THREE.BoxGeometry(.45,name==='Potted fern'?.9:.4,.45),new THREE.MeshLambertMaterial({color:c}));
  m.position.set(p[0],p[1]+(p[1]>2?-.2:p[1]>1?0:name==='Potted fern'?.45:.2),p[2]);if(name==='Rug')m.position.set(A.x-.6,.06,A.z+.2);g.add(m);});}
for(const k in CITY.apts){const A=CITY.apts[k];buildDecor(k);const out=A.door[1]>200?-1.4:1.4;
 interact.push({id:'aptdoor'+k,pos:()=>new THREE.Vector3(A.door[0],1.2,A.door[1]),r:2.4,label:`Door · ${A.name}`,fn:()=>{if(S.apts[k]){tp(A.x,0,A.z-1.4,Math.PI);return;}say('Ring Realty',[`${A.name}. ${A.blurb} One-time lease: ¢${A.price}.`],[{t:`Lease it · ¢${A.price}`,fx:()=>{if(S.cash<A.price){toast('Not enough cash. Take some jobs.');return;}S.cash-=A.price;S.apts[k]=1;toast(`The keys are yours · ${A.name}`);save();}},{t:'"Maybe later."'}]);},cond:()=>true});
 const dm=new THREE.Mesh(new THREE.BoxGeometry(1.2,2.2,.06),new THREE.MeshBasicMaterial({color:new THREE.Color(A.col).multiplyScalar(.35),toneMapped:false}));dm.position.set(A.door[0],1.1,A.door[1]);scene.add(dm);
 interact.push({id:'aptout'+k,pos:()=>new THREE.Vector3(A.x,1.2,A.z-2.2),r:1.8,label:'Leave the apartment',fn:()=>tp(A.door[0],0,A.door[1]+out,out>0?0:Math.PI),cond:()=>true});
 interact.push({id:'aptbed'+k,pos:()=>new THREE.Vector3(A.x+2.4,.9,A.z+1.4),r:2,label:'Bed · sleep',fn:()=>{if(S.min<20*60&&S.min>=10*60){inspect('Bed','Too early to sleep. The city is still awake out there.');return;}S.day++;S.min=10*60;S.talkedDay={};S.asked={};fade();toast(`Day ${S.day} · you wake to rain on the window`);save();},cond:()=>true});
 interact.push({id:'aptdec'+k,pos:()=>new THREE.Vector3(A.x-1.5,1.2,A.z+1.2),r:2.4,label:'Decorate',fn:()=>decorate(k),cond:()=>true});}
function decorate(k){const A=CITY.apts[k];const names=['Corner by the door','Window corner','Left wall','Ceiling','Over the bed'];
 say('Decorate',[`${A.name}. Tap a spot to change what's there.`],names.map((n,si)=>({t:`${n}: ${DECOR[(S.decor[k]||[])[si]||0][0]}`,then:()=>{S.decor[k]=S.decor[k]||[];S.decor[k][si]=((S.decor[k][si]||0)+1)%DECOR.length;buildDecor(k);save();decorate(k);}})).concat([{t:'Done'}]));}
// ================= kitchen / shop =================
let pots=[],ready=[],customers=[],spawnT=2;
const price=k=>DISH[k].p+(k==='miso'?(S.flags.goodFish?6:0)+(S.flags.misoPremium?8:0):0);
function openCook(){if(!S.open){if(S.q.m1===undefined||S.q.m1===0){inspect('The Neon Ladle','The shutters won\'t budge. You need the keys first. Mara Voss, the building agent, should be close by.');return;}
  if(S.min>=26*60){inspect('Curfew','It\'s past curfew. Get some sleep. Your door is just west of the Ladle.');return;}
  S.open=true;S.served=0;emit('interact:kitchen');toast('The Ladle is open');W.ladleSign.material.color.setScalar(2.2);save();}
 $('cook').classList.remove('hide');renderCook();}
function renderCook(){const d=$('dishes');d.innerHTML='';S.up.menu.forEach(k=>{const b=document.createElement('button');b.className='dish';b.innerHTML=`<span>${DISH[k].n}</span><small>¢${price(k)} · ${DISH[k].t}s</small>`;
  b.onclick=()=>{if(pots.length>=S.up.burners){toast('All burners busy');return;}pots.push({dish:k,t:0,max:DISH[k].t*(S.up.burners>1?.8:1)});renderCook();};d.appendChild(b);});
 const waiting=allDiners().filter(c=>c.seated&&!c.served).map(c=>`${c.name||'Customer'}: ${DISH[c.order].n}`);
 $('cookFoot').innerHTML=`${waiting.length?'<div class="wait">'+waiting.join('<br>')+'</div>':''}Burners ${pots.length}/${S.up.burners} · Bowls go to whoever ordered them. ${S.open?'<button id="closeShop">Close for the night</button>':''}`;
 const cs=$('closeShop');if(cs)cs.onclick=()=>{closeShop();$('cook').classList.add('hide');};}
function closeShop(){S.open=false;customers.forEach(c=>c.leave=true);W.ladleSign.material.color.setScalar(.6);toast(`Shift over · served ${S.served}`);save();}
// NPC diners: named people sitting at a stool while a quest wants them fed
const npcOrders={};
function allDiners(){const l=[...customers];for(const k in npcs){const n=npcs[k];const p=n.place||'';if(p.startsWith('stool:')&&n.arrived&&S.open){const want=k==='sela'?(S.q.s1===0?'tea':null):k==='benny'?'miso':k==='dess'?'miso':null;
   if(want&&!npcOrders[k+S.day]){l.push(npcOrders['_'+k]||(npcOrders['_'+k]={npc:k,name:CAST[k].n.split(' ')[0],order:want,seated:true,served:false,pat:999,patMax:999}));}}}return l;}
let cookT=0;function tickShop(dt){cookT-=dt;if(cookT<=0&&!$('cook').classList.contains('hide')){cookT=.5;renderCook();}
 $('pots').innerHTML=pots.map(p=>`<div class="pl">${DISH[p.dish].n}</div><div class="pot"><i style="width:${Math.min(100,p.t/p.max*100)}%"></i></div>`).join('')+(ready.length?`<div class="rd">Ready: ${ready.map(k=>DISH[k].n).join(', ')}</div>`:'');
 pots=pots.filter(p=>{p.t+=dt;if(p.t>=p.max){ready.push(p.dish);return false;}return true;});
 const diners=allDiners();
 for(let i=ready.length-1;i>=0;i--){const c=diners.find(c=>c.seated&&!c.served&&c.order===ready[i]);if(!c)continue;c.served=true;ready.splice(i,1);
  if(c.npc){npcOrders[c.npc+S.day]=1;delete npcOrders['_'+c.npc];toast(`${CAST[c.npc].n} · ${DISH[c.order].n}`);emit(`serve:${c.npc}:${c.order}`);continue;}
  c.leaveT=2.5;const tip=Math.round(price(c.order)*(.1+.4*c.pat/c.patMax));S.cash+=price(c.order)+tip;S.served++;S.servedTotal++;
  toast(`+¢${price(c.order)+tip} · ${DISH[c.order].n}${tip>8?' · great tip':''}`);if(S.served>=5)emit('served5');}
 if(S.open&&S.min<26*60){spawnT-=dt;const taken=Object.values(npcs).filter(n=>(n.place||'').startsWith('stool:')).map(n=>+n.place.slice(6));
  if(spawnT<=0&&customers.filter(c=>!c.leave).length+taken.length<S.up.stools){spawnT=rnd(6,11)*(S.up.sign?.75:1)*(S.flags.radio?.8:1)*(S.flags.ledger==='ilse'?.85:1);spawnCustomer(taken);}}
 if(S.open&&S.min>=26*60){closeShop();toast('Curfew · 02:00. Head home to sleep.');}}
function spawnCustomer(taken){const used=[...customers.map(c=>c.seat),...taken];const seat=[0,1,2,3,4].slice(0,S.up.stools).find(s=>!used.includes(s));if(seat===undefined)return;
 const h=makeHuman(randLook());const side=Math.random()<.5?-1:1;h.obj.position.set(side*22,0,rnd(-1,3));scene.add(h.obj);h.play('walk');
 const tag=document.createElement('div');tag.className='tag order';$('tags').appendChild(tag);customers.push({h,seat,order:pick(S.up.menu),seated:false,served:false,pat:75,patMax:75,tag});}
function tickCustomers(dt){customers=customers.filter(c=>{const p=c.h.obj.position;const sx=STOOLX[c.seat];
  if(!c.leave&&c.leaveT!==undefined&&(c.leaveT-=dt)<0)c.leave=true;
  if(c.seated&&!c.leave){if(!c.served){c.pat-=dt;if(c.pat<=0){c.leave=true;toast('A customer left hungry');}}}
  else{const tx=c.leave?(p.x<0?-24:24):sx,tz=c.leave?2:(c.near?-5.05:-4.2);const dx=tx-p.x,dz=tz-p.z,d=Math.hypot(dx,dz);
   if(d<.12&&!c.leave){if(!c.near)c.near=1;else{c.seated=true;c.h.play('sit');p.set(sx,0,-5.05);c.h.obj.rotation.y=Math.PI;}}else{if(c.seated){c.seated=false;}c.h.play('walk');p.x+=dx/d*dt*1.35;p.z+=dz/d*dt*1.35;turn(c.h.obj,Math.atan2(dx,dz),dt);}}
  c.h.mixer.update(dt);
  c.tag.style.display=c.seated&&!c.served&&!c.leave?'block':'none';if(c.seated&&!c.served){c.tag.innerHTML=`${DISH[c.order].n}<i style="width:${c.pat/c.patMax*100}%"></i>`;place(c.tag,p.x,2.0,p.z);}
  if(c.leave&&Math.abs(p.x)>=23.5){scene.remove(c.h.obj);c.tag.remove();return false;}return true;});}
function turn(o,a,dt){let d=a-o.rotation.y;d=Math.atan2(Math.sin(d),Math.cos(d));o.rotation.y+=d*Math.min(1,dt*8);}
// ================= pedestrians =================
const LANES=[[-44,7.4,-24,7.4],[-14,7.5,44,7.5],[-44,-7.6,-5,-7.6],[5,-7.6,19,-7.6],[30,-7.6,44,-7.6],[23,-10,23,-44],[25.2,-12,25.2,-40],[-25.5,9,-25.5,40],[-18.5,10,-18.5,40],[-36,43,-8,43],[-34,61,-10,61],[51,-42,51,42],[65,-40,65,40],[-44,2,44,2]];
const peds=[];const pools=[['mid',SET.low?8:16,LANES,()=>randLook(),1],['crown',SET.low?6:11,CITY.lanes.crown,()=>classLook('rich'),3],['docks',SET.low?6:12,CITY.lanes.docks,()=>classLook('poor'),0]];
for(const [reg,cnt,lanes,lf,cops] of pools)for(let i=0;i<cnt;i++){const h=makeHuman(i<cops?COP():lf());scene.add(h.obj);const L=lanes[i%lanes.length];const len=Math.hypot(L[2]-L[0],L[3]-L[1]);peds.push({h,L,len,reg,t:Math.random(),dir:Math.random()<.5?1:-1,v:rnd(1,1.45)/len});h.play(i<cops?'formal':'walk');}
function tickPeds(dt){const reg=regionOf(P.x,P.z);for(const p of peds){if(p.reg!==reg){p.h.obj.visible=false;continue;}p.t+=p.v*p.dir*dt;if(p.t>1){p.t=1;p.dir=-1;}if(p.t<0){p.t=0;p.dir=1;}const L=p.L;const x=L[0]+(L[2]-L[0])*p.t,z=L[1]+(L[3]-L[1])*p.t;const o=p.h.obj;o.position.set(x,0,z);
  o.rotation.y=Math.atan2((L[2]-L[0])*p.dir,(L[3]-L[1])*p.dir);const d=Math.hypot(x-cam.position.x,z-cam.position.z);o.visible=d<(SET.low?32:44);if(o.visible)p.h.lod(d,dt);}}
// ================= NPC schedules =================
function tickNPCs(dt){for(const k in npcs){const n=npcs[k],o=n.obj;const pl=placeFor(k);
  if(!pl){o.visible=false;continue;}if(k==='dess'&&!o.visible){o.visible=true;const pp=placePos(pl);o.position.set(pp[0],0,pp[1]);n.place=pl;n.arrived=true;}
  if(pl!=='ilse_patrol'&&pl!==n.place){n.place=pl;n.arrived=false;const pp=placePos(pl);
   const far=Math.hypot(o.position.x-P.x,o.position.z-P.z)>45&&Math.hypot(pp[0]-P.x,pp[1]-P.z)>45;if(far||!n.init){o.position.set(pp[0],0,pp[1]);n.route=[];n.arrived=true;}else n.route=route(o.position.x,o.position.z,pp[0],pp[1]);n.init=1;}
  if(pl==='ilse_patrol'){n.place=pl;n.init=1;if(!n.route.length){n.pi=(n.pi+1)%PATROL.length;const t=PATROL[n.pi];n.route=[{x:t[0],z:t[1]}];}}
  if(n.talking){const a=Math.atan2(P.x-o.position.x,P.z-o.position.z);turn(o,a,dt);}
  else if(n.route.length){const t=n.route[0];const dx=t.x-o.position.x,dz=t.z-o.position.z,d=Math.hypot(dx,dz);if(d<.15){n.route.shift();if(!n.route.length)n.arrived=true;}else{const sp=(k==='ilse'?1.15:1.35)*dt;o.position.x+=dx/d*Math.min(sp,d);o.position.z+=dz/d*Math.min(sp,d);turn(o,Math.atan2(dx,dz),dt);n.h.play(k==='mara'?'formal':'walk');}}
  else{const pp=placePos(n.place);if(pp){if(pp[2]==='sit'){o.position.set(pp[0],0,pp[1]);o.rotation.y=pp[3];}else turn(o,pp[3],dt);n.h.play(pp[2]);}}
  const d=Math.hypot(o.position.x-cam.position.x,o.position.z-cam.position.z);o.visible=o.visible&&d<70;if(o.visible)n.h.lod(d,dt);
  const tg=tags[k];const show=o.visible&&d<7&&!dlgOpen;tg.style.display=show?'block':'none';if(show)place(tg,o.position.x,2.05,o.position.z);}}
// ================= player / camera =================
const P={x:-3.5,z:-1.5,y:0,yaw:0,pitch:.05,bob:0,sit:null};if(S.P){Object.assign(P,S.P);P.y=P.y||0;P.sit=null;}
function walkable(x,z){const m=.3;const py=P.y||0;if(py<.5&&Math.abs(x)<4&&z<-5.5&&z>-9)return false;if(x>-18.4&&x<-15.6&&z>5.8&&z<7.8)return false;
 for(const r of W.walk)if(Math.abs((r[4]||0)-py)<.6&&x>r[0]+m&&x<r[1]-m&&z>r[2]+m&&z<r[3]-m)return true;return false;}
let viewTP=SET.view==='tp';Input.on('toggleView',()=>{viewTP=!viewTP;SET.view=viewTP?'tp':'fp';saveSet();});
const fwd=new THREE.Vector3(),camTP=new THREE.Vector3();let zone='';
function tickPlayer(dt){if(creating){Input.consumeLook();return;}const lk=Input.consumeLook();if(!dlgOpen&&!menuOpen()){P.yaw-=lk.dx*.0055;P.pitch=Math.max(-1.1,Math.min(1.05,P.pitch-lk.dy*.0045));}
 let mx=Input.move.x,my=Input.move.y;if(dlgOpen||menuOpen())mx=my=0;const m=Math.min(1,Math.hypot(mx,my));if(P.sit&&m>.35){P.sit=null;}
 if(m>.08&&!P.sit&&!riding){const s=Math.sin(P.yaw),c=Math.cos(P.yaw);const vx=(-s*-my+c*mx),vz=(-c*-my-s*mx);const sp=(m>.85?3.6:2.4)*dt;const nx=P.x+vx*sp,nz=P.z+vz*sp;
  if(walkable(nx,P.z))P.x=nx;if(walkable(P.x,nz))P.z=nz;P.bob+=dt*m*9;}
 const eye=P.y+(P.sit?1.12:1.62)+Math.sin(P.bob)*.035*Math.min(1,m*2)+(riding?Math.sin(T*7)*.012:0);
 fwd.set(-Math.sin(P.yaw)*Math.cos(P.pitch),Math.sin(P.pitch),-Math.cos(P.yaw)*Math.cos(P.pitch));
 player.obj.position.set(P.x,P.y,P.z);player.obj.rotation.y=P.yaw+Math.PI;player.play(P.sit?'sit':m>.08?(m>.85?'jog':'walk'):'idle');player.obj.visible=viewTP;if(viewTP)player.mixer.update(dt);
 if(viewTP){const back=new THREE.Vector3(Math.sin(P.yaw),0,Math.cos(P.yaw));const want=new THREE.Vector3(P.x,P.y+1.95,P.z).addScaledVector(back,2.6).add(new THREE.Vector3(Math.cos(P.yaw)*.55,0,-Math.sin(P.yaw)*.55));
  camTP.lerp(want,1-Math.exp(-dt*8));cam.position.copy(camTP);cam.lookAt(cam.position.x+fwd.x,cam.position.y+fwd.y-.12,cam.position.z+fwd.z);}
 else{cam.position.set(P.x,eye,P.z);camTP.copy(cam.position);cam.lookAt(P.x+fwd.x,eye+fwd.y,P.z+fwd.z);}
 fill.position.set(P.x+fwd.x*1.5,P.y+2.4,P.z+fwd.z*1.5);if(riding)cam.rotateZ(Math.sin(T*1.3)*.006);
 const d=districtAt(P.x,P.z);if(d!==zone){if(zone){const z=$('zone');z.textContent=DISTRICTS[d].name;z.classList.remove('show');void z.offsetWidth;z.classList.add('show');}zone=d;emit('enter:'+d);}}
// aim-based interaction: the thing you're looking at, close by
let near=null;const tv=new THREE.Vector3();
function pickTarget(){near=null;let best=1e9;const flat=new THREE.Vector3(fwd.x,0,fwd.z).normalize();
 for(const i of interact){if(!i.cond())continue;const p=i.pos();if(Math.abs(p.y-(P.y+1.2))>2.4)continue;tv.set(p.x-P.x,0,p.z-P.z);const d=tv.length();if(d>i.r)continue;const dot=d<.01?1:tv.normalize().dot(flat);if(dot<.6&&d>1.1)continue;const sc=d*(1.6-dot);if(sc<best){best=sc;near=i;}}
 const A=$('act');if(near&&!dlgOpen&&!menuOpen()){A.classList.remove('hide');A.textContent=near.label;$('xh').classList.add('on');}else{A.classList.add('hide');$('xh').classList.remove('on');}}
function doInteract(){if(dlgOpen||menuOpen()||!near)return;if(audio&&!audio.on)startAudio();if(near.npc)npcs[near.npc].h.play('talk');near.fn();}
Input.on('interact',doInteract);Input.on('tap',doInteract);$('act').addEventListener('click',doInteract);
Input.on('menu',()=>{menuOpen()?$('menu').classList.add('hide'):openMenu('q');});
// waypoint
const beam=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,40,8,1,true),new THREE.MeshBasicMaterial({color:new THREE.Color(0x7ff3ff).multiplyScalar(1.4),transparent:true,opacity:.22,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));scene.add(beam);
function tickWaypoint(t){const id=S.track&&typeof S.q[S.track]==='number'?S.track:null;const s=id&&stepOf(id);const tg=s&&stepTarget(s);const wp=$('wp');
 $('track').innerHTML=id?`<b>${Q[id].t.toUpperCase()}</b>${s.d}`:(S.q.m8==='done'?'<b>CHAPTER TWO COMPLETE</b>Keep the lights on':'');
 if(!tg){wp.style.display='none';beam.visible=false;return;}const dist=Math.hypot(tg.x-P.x,tg.z-P.z);beam.visible=dist>6;beam.position.set(tg.x,20,tg.z);beam.material.opacity=(.14+Math.sin(t*2.4)*.05)*Math.min(1,(dist-6)/14);tv.copy(tg).project(cam);const behind=tv.z>1;let sx=(tv.x+1)/2*VW,sy=(1-tv.y)/2*VH;
 if(behind){sx=VW-sx;sy=VH-sy;}const mg=40,off=behind||sx<mg||sx>VW-mg||sy<mg||sy>VH-mg;
 if(off){const cx=VW/2,cy=VH/2;let dx=sx-cx,dy=sy-cy;if(behind&&Math.abs(dx)<1)dx=1;const k=Math.min((cx-mg)/Math.abs(dx||1e-3),(cy-mg)/Math.abs(dy||1e-3));sx=cx+dx*k;sy=cy+dy*k;wp.querySelector('i').style.transform=`rotate(${Math.atan2(dy,dx)}rad)`;wp.classList.add('edge');}else{wp.classList.remove('edge');wp.querySelector('i').style.transform='';}
 wp.style.display=dist<2.2?'none':'block';wp.style.left=sx+'px';wp.style.top=sy+'px';wp.querySelector('span').textContent=Math.round(dist)+'m';}
// ================= journal / menu =================
const menuOpen=()=>!$('menu').classList.contains('hide');
$('menuB').onclick=()=>openMenu('q');document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$(b.dataset.close).classList.add('hide'));
document.querySelectorAll('#tabs button').forEach(b=>b.onclick=()=>openMenu(b.dataset.t));
function openMenu(t){$('menu').classList.remove('hide');document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('on',b.dataset.t==t));const M=$('mbody');let h='';
 if(t=='q'){const act=Object.keys(Q).filter(id=>typeof S.q[id]==='number'),done=Object.keys(Q).filter(id=>S.q[id]==='done');
  for(const [lab,ids] of[['STORY',act.filter(i=>Q[i].main)],['SIDE',act.filter(i=>!Q[i].main)]]){if(!ids.length)continue;h+=`<div class="qh">${lab}</div>`;
   for(const id of ids){const q=Q[id];h+=`<div class="row quest ${S.track===id?'tracked':''}" data-q="${id}"><span><b>${q.t}</b>${q.ch?` <small>· Chapter ${q.ch}</small>`:''}<br>${q.steps.map((s,i)=>i<S.q[id]?`<small class="done">${s.d}</small>`:i===S.q[id]?`<small class="cur">▸ ${s.d}</small>`:'').filter(Boolean).join('<br>')}</span><span class="trk">${S.track===id?'◆ tracking':'track'}</span></div>`;}}
  const locked=Object.keys(Q).filter(id=>S.q[id]===undefined&&Q[id].lock&&Q[id].req&&!Q[id].req());if(locked.length){h+='<div class="qh">FAVORS (LOCKED)</div>';for(const id of locked)h+=`<div class="row"><span>${CAST[Q[id].giver].n} has something to ask<br><small>Needs ${Q[id].lock}</small></span><span>🔒</span></div>`;}
  if(done.length){h+=`<div class="qh">COMPLETE</div>`;for(const id of done)h+=`<div class="row"><span class="done">${Q[id].t}</span></div>`;}
  if(!act.length&&!done.length)h+='<div class="row"><span>Nothing yet. Walk the street. Talk to people.</span></div>';
  M.innerHTML=h;M.querySelectorAll('[data-q]').forEach(r=>r.onclick=()=>{S.track=r.dataset.q;save();openMenu('q');});return;}
 if(t=='n'){h+=S.notes.length?S.notes.slice().reverse().map(n=>`<div class="row"><span>${n}</span></div>`).join(''):'<div class="row"><span><small>Your notes will collect here as you learn what happened to Dess.</small></span></div>';}
 if(t=='p'){for(const k in CAST){const met=S.rel[k]!==undefined||S.talkedDay[k]||k==='dess'&&S.q.m6!==undefined;if(k==='dess'&&!met)continue;const r=Math.round(relv(k)/2);const fav=Object.keys(Q).find(id=>Q[id].giver===k&&Q[id].lock&&S.q[id]===undefined);
  h+=`<div class="row person"><img src="portraits/${k}.jpg" alt=""><span><b>${met?CAST[k].n:'???'}</b><br><small>${met?CAST[k].role:'not met yet'}</small><br><small class="where">${met?CAST[k].home:''}</small>${fav&&met?`<br><small class="cur">Favor at ♥6</small>`:''}</span><span class="meter">${met?'●'.repeat(r)+'○'.repeat(5-r):''}</span></div>`;}}
 if(t=='l'){h+=Object.keys(FN).map(f=>`<div class="row"><span>${FN[f]}<br><small>standing</small></span><span>${S.rep[f]||0}</span></div>`).join('')+`<div class="row"><span>Your look<br><small>how the city reads you: ${({high:'upper city',mid:'street',low:'low city'})[lookClass()]}</small></span><button id="edLook">Edit look</button></div>`;h+=`<div class="row"><span>Cash<br><small>Day ${S.day} · ${S.servedTotal} bowls served</small></span><span style="color:#ffd98a">¢${S.cash}</span></div><div class="row"><span>Debt to Orrin Mutual<br><small>${S.flags.interestFrozen?'Interest frozen by court order':'0.2% interest nightly'}</small></span><span>¢${S.debt}</span></div>`;
  const ups=[['pay','Pay ¢1,500 toward the debt',1500,()=>{S.debt=Math.max(0,S.debt-1500);emit('pay');if(!S.debt)chapter('Debt free','The Neon Ladle belongs to you. Free and clear.');},()=>S.debt>0],['burner','Second burner (cook 2 at once, faster)',400,()=>S.up.burners=2,()=>S.up.burners<2],['stools','Two more stools',300,()=>S.up.stools=5,()=>S.up.stools<5],['sign','Fix the flickering sign (more walk-ins)',250,()=>{S.up.sign=1;},()=>!S.up.sign],['chili','Recipe: Static Chili Tan',600,()=>S.up.menu.push('chili'),()=>!S.up.menu.includes('chili')]];
  ups.forEach(([id,n,c,fx,cond])=>{if(cond&&!cond())return;h+=`<div class="row"><span>${n}</span><button data-u="${id}">¢${c.toLocaleString()}</button></div>`;});M.innerHTML=h;
  $('edLook').onclick=()=>{$('menu').classList.add('hide');openCreator(false);};M.querySelectorAll('[data-u]').forEach(b=>b.onclick=()=>{const u=ups.find(x=>x[0]==b.dataset.u);if(S.cash<u[2]){toast('Not enough cash');return;}S.cash-=u[2];u[3]();save();openMenu('l');});return;}
 if(t=='o'){const sl=(id,l,v)=>`<div class="row"><span>${l}</span><input type="range" id="${id}" min="0" max="100" value="${Math.round(v*100)}"></div>`;
  h+=sl('vMaster','Master volume',SET.master)+sl('vRain','Rain',SET.rain)+sl('vAmb','City ambience',SET.amb)+
  `<div class="row"><span>Camera</span><button id="oView">${viewTP?'Third person':'First person'}</button></div>`+sl('oSens','Look sensitivity',SET.sens/2)+
  `<div class="row"><span>Graphics<br><small>Battery saver: fewer lights & people, lower resolution</small></span><button id="gq">${SET.low?'Battery saver':'Full'}</button></div>`+
  `<div class="row"><span>Render scale</span><button id="oScale">${Math.round(SET.scale*100)}%</button></div><div class="row"><span>Erase save</span><button id="wipe">Reset</button></div><small>Neon Ladle v2 · original story. Characters: Quaternius Universal Animation Library (CC0). Portraits generated for this game. <a href="v1/">Play v1</a></small>`;
  M.innerHTML=h;const bind=(id,k,f)=>$(id).oninput=e=>{SET[k]=e.target.value/100*(f||1);saveSet();applyVol();Input.lookSens=SET.sens;};bind('vMaster','master');bind('vRain','rain');bind('vAmb','amb');bind('oSens','sens',2);
  $('oView').onclick=()=>{Input.emit('toggleView');openMenu('o');};$('gq').onclick=()=>{SET.low=SET.low?0:1;saveSet();location.reload();};
  $('oScale').onclick=()=>{const o=[1,.85,.7,.55];SET.scale=o[(o.indexOf(SET.scale)+1)%o.length]||1;saveSet();resize();openMenu('o');};
  $('wipe').onclick=()=>{if(confirm('Erase your save?')){localStorage.removeItem('neonLadle2');location.reload();}};return;}
 M.innerHTML=h;}
// ================= audio (procedural, three buses) =================
let audio=null;
function startAudio(){if(audio)return;const AC=new (window.AudioContext||window.webkitAudioContext)();const master=AC.createGain(),rainB=AC.createGain(),ambB=AC.createGain();master.gain.value=0;rainB.connect(master);ambB.connect(master);master.connect(AC.destination);
 const len=AC.sampleRate*3,buf=AC.createBuffer(2,len,AC.sampleRate);for(let ch=0;ch<2;ch++){const d=buf.getChannelData(ch);let b=0;for(let i=0;i<len;i++){const w=Math.random()*2-1;b=.97*b+.03*w;d[i]=w*.5+b*2;}}
 const mk=(f,q,g,bus,type='bandpass')=>{const s=AC.createBufferSource();s.buffer=buf;s.loop=true;const fl=AC.createBiquadFilter();fl.type=type;fl.frequency.value=f;fl.Q.value=q;const gn=AC.createGain();gn.gain.value=g;s.connect(fl).connect(gn).connect(bus);s.start(0,Math.random()*2);return {gn,fl};};
 mk(2600,.4,.22,rainB);mk(900,.6,.12,rainB);const rumble=mk(180,.7,.35,ambB,'lowpass');const water=mk(420,1.2,0,ambB);const crowd=mk(1200,2.5,0,ambB);
 const hum=AC.createOscillator();hum.frequency.value=55;const hg=AC.createGain();hg.gain.value=.015;hum.connect(hg).connect(ambB);hum.start();
 const chime=()=>{const o=AC.createOscillator(),g=AC.createGain();o.type='sine';o.frequency.value=pick([220,261.6,329.6,392,440,523.3])*pick([1,.5]);g.gain.setValueAtTime(0,AC.currentTime);g.gain.linearRampToValueAtTime(.025,AC.currentTime+1.5);g.gain.linearRampToValueAtTime(0,AC.currentTime+6);o.connect(g).connect(ambB);o.start();o.stop(AC.currentTime+6.2);};
 setInterval(()=>{if(audio.on&&!document.hidden)chime();},4200);
 audio={AC,master,rainB,ambB,water,crowd,hg,rumble,on:true};applyVol();}
function applyVol(){if(!audio)return;const t=audio.AC.currentTime;audio.master.gain.linearRampToValueAtTime(audio.on?SET.master:0,t+.6);audio.rainB.gain.setTargetAtTime(SET.rain*(zone==='plaza'&&P.z>68||riding?.1:CITY.inRoom(P.x,P.z,P.y+1)?.35:1)*(.15+.85*(window.__ENV?__ENV.st.rain:1)),t,.4);audio.ambB.gain.setTargetAtTime(SET.amb,t,.4);}
function tickAudio(){if(!audio)return;const t=audio.AC.currentTime;audio.rainB.gain.setTargetAtTime(SET.rain*(zone==='plaza'&&P.z>68?.25:1)*(.15+.85*ENV.st.rain),t,.8);audio.water.gn.gain.setTargetAtTime(zone==='canal'||(zone==='docks'&&P.x>35)?.5:zone==='docks'?.15:0,t,1);audio.crowd.gn.gain.setTargetAtTime(zone==='alley'?.05:zone==='main'&&S.open&&Math.hypot(P.x,P.z+5)<10?.03:0,t,1);
 const tr=riding?1:Math.max(0,1-Math.hypot(train.position.x+11-P.x,50-P.z)/45);audio.rumble.gn.gain.setTargetAtTime(.35+tr*.6,t,.3);audio.hg.gain.setTargetAtTime(.015+(zone==='plaza'?.03:0),t,1);}
document.addEventListener('visibilitychange',()=>{if(!audio)return;document.hidden?audio.AC.suspend():audio.AC.resume();});
// ================= time / sleep =================
function sleep(){if(S.open){toast('Close the shop first (Kitchen)');return;}
 if(S.min<22*60){inspect('Home','A narrow capsule flat above the Ladle. It\'s too early to sleep. The street is still awake.');return;}
 S.day++;S.min=10*60;S.talkedDay={};S.asked={};const interest=S.flags.interestFrozen?0:Math.round(S.debt*.002);S.debt+=interest;fade();toast(`Day ${S.day}${interest?` · Orrin Mutual added ¢${interest} interest`:''}`);save();}
function fade(){const f=$('fade');f.classList.remove('show');void f.offsetWidth;f.classList.add('show');}
// ================= helpers =================
const tmpV=new THREE.Vector3();function place(el,x,y,z){tmpV.set(x,y,z).project(cam);if(tmpV.z>1){el.style.display='none';return;}el.style.left=((tmpV.x+1)/2*VW)+'px';el.style.top=((1-tmpV.y)/2*VH)+'px';}
// district streaming: hide whole districts the camera can't meaningfully see
function tickStreaming(){const lim=SET.low?58:72;for(const k in W.districts){const d=DISTRICTS[k],g=W.districts[k].G;const c=Math.cos(d.rot||0),s=Math.abs(Math.sin(d.rot||0));const hx=(c*c>.5?d.len/2:d.hw+10),hz=(c*c>.5?d.hw+10:d.len/2);
  const dx=Math.max(0,Math.abs(cam.position.x-d.cx)-hx),dz=Math.max(0,Math.abs(cam.position.z-d.cz)-hz);g.visible=Math.hypot(dx,dz)<lim;}}
// ================= boot =================
initInput({surface:canvas,joyEl:$('joy'),knobEl:$('knob')});
if(SET.low)bloom.strength=.7;
// bake wet-street reflections once, lit by the pool around the Ladle
const ENV=makeEnv(scene,{hemi,moon,bloom,R,mats:MATS});ENV.set(S.weather||'rain',true);if(S.wet!=null)ENV.st.wet=S.wet;window.__ENV=ENV;let envBake=0;
ENV.onThunder=()=>{if(!audio)return;const A=audio.AC,t=A.currentTime+.4+Math.random()*1.5,b=A.createBuffer(1,A.sampleRate*3,A.sampleRate),d=b.getChannelData(0);let l=0;for(let i=0;i<d.length;i++){l=l*.985+(Math.random()*2-1)*.015;d[i]=l*12*Math.exp(-i/A.sampleRate*1.1);}const sN=A.createBufferSource();sN.buffer=b;const g=A.createGain();g.gain.value=.9;sN.connect(g);g.connect(audio.rainB);sN.start(t);};
cam.position.set(0,1.6,-2);ENV.update(0,(S.min/60)%24,0,S);LP.update(10,cam);for(let i=0;i<20;i++)LP.update(.5,cam);cubeCam.position.set(0,.4,-2);cubeCam.update(R,scene);
scene.traverse(o=>{if(o.material&&o.material.isMeshStandardMaterial&&o.material.metalness>.3){o.material.envMap=cubeRT.texture;o.material.envMapIntensity=.9;}});
for(const k in npcs)tickNPCs(0);
window.__S=S;window.__P=P;window.__G={setTP:v=>{viewTP=v},THREE,scene,player,jobBoard,BOARDS,decorate,openCreator,cam,cand,LP,CITY,Q,emit,qStart,npcs,talk,W,interact,SET,openMenu,walkable,stepOf,get near(){return near;}};
$('load').classList.add('hide');$('start').classList.remove('hide');
$('start').onclick=async()=>{$('title').classList.add('gone');setTimeout(()=>$('title').remove(),900);$('hud').classList.remove('hide');startAudio();
 try{await document.documentElement.requestFullscreen?.();await screen.orientation?.lock?.('landscape');}catch(e){}
 if(!S.flags.intro){openCreator(true);}
 else if(S.flags.fromV1&&!S.flags.v1note){S.flags.v1note=1;toast('Your v1 progress carried over');if(S.q.m4==='done'&&S.q.m5===undefined){chapter('Chapter Two','Line 9 Still Hums');qStart('m5');}}};
if(S.q.m4==='done'&&S.q.m5===undefined&&S.flags.intro)qStart('m5');
function beginStory(){S.flags.intro=1;save();say('Veyra City',["Veyra. It hasn't stopped raining in three years. The upper city stays dry under a canopy you can't see. Everyone else gets wet.",'You came in on the Ring Line with ¢120 and one message from your aunt Dess, a fixer who ran deals out of a Saltgate noodle bar called the Neon Ladle: "Come. Line 9 still hums." By the time you arrived, she was gone.',"Nobody here knows your name yet. Take jobs from the gangs, the Wardline, the towers or the street. Find out who keeps disappearing, and why.",'Left thumb walks. Drag on the right to look. Look at something and tap. Job boards are in Saltgate, Ashline and Crown Heights. The Ring Line connects them.'],[{t:'Step into the rain',fx:()=>qStart('m1')}]);}
// ================= main loop =================
let last=performance.now(),T=0,saveT=0,slowT=0,flickT=0;
function frame(now){const dt=Math.min(.05,(now-last)/1000)*(window.__G.ts||1);last=now;T+=dt;
 tickPlayer(dt);let gH=0;if(!dlgOpen&&!menuOpen()){S.min+=dt*1;gH=dt/60;if(S.min>=34*60){S.min-=24*60;S.day++;S.talkedDay={};S.asked={};}}
 ENV.update(dt,(S.min/60)%24,gH,S);LP.mul=ENV.lampMul;if(P.y>20)scene.fog.density*=.4;else if(riding)scene.fog.density*=.3;rain.m.geometry.setDrawRange(0,Math.round(rain.n*2*Math.min(1,ENV.st.rain*1.1)));rain.m.material.opacity=.18+.2*ENV.st.rain;
 envBake-=gH;if(envBake<=0){envBake=1.5;const vis=[];cubeCam.position.set(P.x,P.y+.4,P.z);cubeCam.update(R,scene);}
 const hh=Math.floor(S.min/60)%24,mm=Math.floor(S.min%60);$('clock').textContent=`Day ${S.day} · ${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')} · ${fmtWeather(ENV.st.w)}`;$('shop').textContent=S.open?'Ladle open':S.min>=26*60?'Curfew':'Ladle closed';$('cash').textContent='¢'+S.cash.toLocaleString();
 tickNPCs(dt);tickStaff(dt);tickCreator(dt);if(S.jobDef&&typeof S.q.job==='number'){const p=S.jobDef.sp[S.q.job];jobMarker.visible=true;jobMarker.position.set(p[0],(p[3]||0)+1.3+Math.sin(T*2)*.1,p[1]);jobMarker.rotation.y=T;}else jobMarker.visible=false;tickShop(dt);tickCustomers(dt);tickPeds(dt);pickTarget();tickWaypoint(T);
 slowT-=dt;if(slowT<=0){slowT=.5;tickStreaming();tickAudio();}
 LP.update(dt,cam);const indoor=(P.z>67.8&&P.z<80&&P.x<-16)||CITY.inRoom(P.x,P.z,P.y+1);rain.m.visible=!indoor&&!riding;rain.update(dt,cam.position,P.y);for(const a of CITY.anim)a(T,crack);tickRide(dt);steam.update(dt);traffic.update(dt);
 trainT-=dt;if(trainT<=0){train.position.x+=dt*16;if(train.position.x>40){train.position.x=-90;trainT=rnd(25,45);}}
 if(gateAnim&&W.gate.position.y<2.9){W.gate.position.y+=dt*.8;}
 flickT-=dt;if(flickT<=0){flickT=rnd(.05,.4);for(const f of W.flick)f.material.color.setScalar(Math.random()<.15?.25:1.25);if(!S.up.sign&&!S.open)W.ladleSign.material.color.setScalar(Math.random()<.12?.2:.6);}
 saveT+=dt;if(saveT>5){saveT=0;if(!riding)S.P={x:P.x,z:P.z,y:P.y,yaw:P.yaw,pitch:P.pitch};save();}
 composer.render(dt);requestAnimationFrame(frame);}
requestAnimationFrame(frame);
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
