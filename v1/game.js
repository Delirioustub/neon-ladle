import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {VOXLoader,VOXMesh} from 'three/addons/loaders/VOXLoader.js';
import {buildWorld,makeRain,makeSteam,makeTraffic,rnd,pick} from './world.js';
const $=id=>document.getElementById(id);
// ================= renderer / scene =================
const canvas=$('c');const R=new THREE.WebGLRenderer({canvas,antialias:false,powerPreference:'high-performance'});
const PR=Math.min(devicePixelRatio,window.__PR||1.5);R.setPixelRatio(PR);R.toneMapping=THREE.ACESFilmicToneMapping;R.toneMappingExposure=1.15;
const scene=new THREE.Scene();scene.background=new THREE.Color(0x120a22);scene.fog=new THREE.FogExp2(0x241236,.03);
const cam=new THREE.PerspectiveCamera(58,2,.1,220);
scene.add(new THREE.HemisphereLight(0x5a4a9a,0x120818,.55));
const moon=new THREE.DirectionalLight(0x6a7aff,.35);moon.position.set(-10,30,10);scene.add(moon);
const fill=new THREE.PointLight(0xb8a8ff,3,9,1.2);scene.add(fill);const lights=[];const W=buildWorld(scene,lights);
// env map for wet reflections: render the lit city once into a cube
const cubeRT=new THREE.WebGLCubeRenderTarget(256,{type:THREE.HalfFloatType});const cubeCam=new THREE.CubeCamera(.5,120,cubeRT);cubeCam.position.set(0,.4,0);scene.add(cubeCam);
const composer=new EffectComposer(R);composer.addPass(new RenderPass(scene,cam));
const bloom=new UnrealBloomPass(new THREE.Vector2(512,256),.75,.5,.72);composer.addPass(bloom);composer.addPass(new OutputPass());
function resize(){const w=innerWidth,h=innerHeight;R.setSize(w,h,false);composer.setSize(w,h);bloom.resolution.set(w/2,h/2);cam.aspect=w/h;cam.updateProjectionMatrix();}addEventListener('resize',resize);resize();
const rain=makeRain(scene);const steam=makeSteam(scene,[new THREE.Vector3(-1.2,1.6,-7.5),new THREE.Vector3(1.2,1.6,-7.5),...W.vents]);const traffic=makeTraffic(scene);
// ================= save state =================
const DEF={cash:120,debt:20000,day:1,min:18*60,open:false,served:0,servedTotal:0,rel:{},q:{},flags:{},up:{stools:3,burners:1,sign:0,menu:['shoyu','tea']},talkedDay:{}};
let S;try{S=Object.assign(structuredClone(DEF),JSON.parse(localStorage.getItem('neonLadle')||'{}'));}catch(e){S=structuredClone(DEF);}
const save=()=>localStorage.setItem('neonLadle',JSON.stringify(S));
// ================= content =================
const DISH={shoyu:{n:'Saltgate Shoyu',p:28,t:6},tea:{n:'Kettle Tea',p:12,t:3},miso:{n:'Midnight Miso',p:44,t:8},chili:{n:'Static Chili Tan',p:58,t:9}};
const CAST={
 mara:{n:'Mara Voss',role:'building agent, Orrin Mutual',vox:'chr_lady2',pos:[-9,-6.6],tint:0xe0d0ff},
 juno:{n:'Juno-7',role:'courier android',vox:'chr_robot',pos:[13,6.6],tint:0xc8f0ff},
 benny:{n:'Benny Tsai',role:'dumpling cart, rival-ish',vox:'chr_beardo1',pos:[-17,6.4],tint:0xfff0d8},
 sela:{n:'Sela Okafor',role:'night nurse, Okafor Clinic',vox:'chr_nurse',pos:[22,-6.6],tint:0xffe0f0},
 kip:{n:'Kip',role:'rooftop kid, "netrunner"',vox:'chr_headphones',pos:[8,-6.8],tint:0xe8ffe8},
 ilse:{n:'Officer Ilse Varn',role:'Wardline patrol',vox:'chr_cop1',pos:[-26,6.6],tint:0xd8e0ff}
};
const Q={
 m1:{t:'Keys Under the Kettle',main:1,steps:['Find Mara Voss, the building agent','Open The Neon Ladle (the counter)']},
 m2:{t:'First Bowls',main:1,steps:['Serve 5 customers in one shift']},
 m3:{t:"Dess's Secret Broth",main:1,steps:['Ask Benny Tsai about Aunt Dess','Get Kip to crack the recipe chip','Search the alley fuse box (east end)']},
 m4:{t:'Static on Line 9',main:1,steps:['Pay ¢1,500 toward the debt (Ledger)','Talk to Juno-7']},
 s1:{t:'Tea Before Rounds',steps:['Serve Sela a Kettle Tea at the Ladle']},
 s2:{t:'Drone in the Wires',steps:["Find Kip's drone (look up near the west awnings)","Return it to Kip"]},
 s3:{t:'Missing Faces',steps:['Read the 3 missing-persons posters','Report back to Officer Varn']},
 s4:{t:'Lost Parcel',steps:["Find Juno's parcel by the dumpsters (west)","Return it to Juno-7"]}
};
const qs=id=>S.q[id]; // undefined | step index | 'done'
function qStart(id){if(S.q[id]===undefined){S.q[id]=0;toast(`New ${Q[id].main?'story':'side'} quest · <b>${Q[id].t}</b>`);save();}}
function qAdv(id,step){if(S.q[id]===step){S.q[id]++;if(S.q[id]>=Q[id].steps.length){S.q[id]='done';toast(`Quest complete · ${Q[id].t}`);onQuestDone(id);}save();}}
function onQuestDone(id){if(id=='m1')qStart('m2');if(id=='m2'){qStart('m3');S.cash+=100;}if(id=='m3'){S.up.menu.includes('miso')||S.up.menu.push('miso');toast('Recipe learned · Midnight Miso');qStart('m4');}
 if(id=='m4'){setTimeout(()=>say('juno',["Juno-7 holds out a sealed data-card, rain beading on its chrome.","PLAYBACK: \"Kid, it's Dess. I'm alive. Don't trust Orrin Mutual. Line 9 still hums. Come find me below the old station.\"","[End of the opening chapter. The Ladle is yours. Keep cooking, keep the lights on. More of Saltgate to come.]"],[]),400);}
 if(id=='s1'){rel('sela',2);S.cash+=40;}if(id=='s2'){rel('kip',2);S.cash+=60;}if(id=='s3'){rel('ilse',2);S.cash+=80;}if(id=='s4'){rel('juno',2);S.cash+=70;}}
const rel=(k,d)=>{S.rel[k]=Math.max(0,Math.min(10,(S.rel[k]||2)+d));if(d>0)toast(`${CAST[k].n} ♥ ${'●'.repeat(Math.round(S.rel[k]/2))}`);};
// dialogue trees (original). Each returns {lines, opts:[{t,fx}]}
function talk(k){const r=S.rel[k]||2,today=S.talkedDay[k]===S.day;const once=(d)=>{if(!today){S.talkedDay[k]=S.day;rel(k,d);}};
 const warm=(t,d=1)=>({t,fx:()=>once(d)}),cool=(t)=>({t,fx:()=>{if(!today){S.talkedDay[k]=S.day;rel(k,-1);}}});
 switch(k){
 case 'mara':if(qs('m1')===0){qAdv('m1',0);return [["So you're Dess's niece. You've got her chin. And her debt.","Twenty thousand to Orrin Mutual. The keys were under the kettle, like she always said. Try not to burn the place down."],[warm('"I\'ll keep it running. Promise."'),cool('"Her debt isn\'t my problem."')]];}
  if(qs('m4')===0)return [["Paying already? Look at you. Use the ledger at the counter. Orrin likes punctual people. I'm... less sure what Orrin likes lately."],[warm('"You sound worried."')]];
  return [[pick(["Rain's good for business. People want something hot.","Orrin's auditors are sniffing around Line 9. Don't ask me why.","Dess used to slip me a bowl after curfew. Don't tell anyone."])],[warm('"Come by later, bowl\'s on me."'),{t:'"See you around."',fx:()=>{}}]];
 case 'benny':if(qs('m3')===0){qAdv('m3',0);return [["Dess? We fought over this corner for eleven years. Best rival I ever had.","She kept her real broth on a recipe chip. Encrypted. Paranoid old bird. The kid upstairs, Kip, can crack anything."],[warm('"Thanks, Benny. Dumplings on me sometime."'),cool('"You\'re not getting her recipe."')]];}
  return [[pick(["Dumplings, three for ten! ...Your broth smells better than mine tonight. Annoying.","You hear the trains under the street? Line 9's been dead for years.","Corpsec rousted my cart again. Rain or no rain."])],[warm('"Your dumplings are the real deal."'),cool('"Better watch out, Benny."')]];
 case 'kip':if(qs('m3')===1){qAdv('m3',1);return [["Ohhh, a Marrow-family chip. Gimme a sec... done. It's not a recipe. Well, it IS, but half of it's a map. Alley fuse box, east end. She hid something there."],[warm('"You\'re a genius, Kip."',2)]];}
  if(qs('s2')===undefined){qStart('s2');return [["My drone, Mothball, ate a gust and landed on an awning somewhere west. I can't climb, I'm grounded. Literally."],[warm('"I\'ll find Mothball."')]];}
  if(qs('s2')===1){qAdv('s2',1);return [["MOTHBALL! You absolute legend. I owe you. Digitally."],[warm('"Keep her out of the wind."')]];}
  return [[pick(["The Wardline cameras loop every 40 seconds. Not that I checked.","Your sign's flickering in the wrong rhythm. It bugs me.","Juno-7 is the only android that says thank you."])],[warm('"Teach me sometime?"'),{t:'"Stay out of trouble."',fx:()=>{}}]];
 case 'sela':if(qs('s1')===undefined){qStart('s1');return [["Twelve-hour shift and it's still raining. If you've got a Kettle Tea before my rounds, I'd love you forever."],[warm('"One tea, coming up."')]];}
  return [[pick(["The clinic's full of people who skipped dinner to pay rent.","Dess patched me up once. Long story. Knife, sort of.","Get some sleep after curfew. I mean it. Nurse's orders."])],[warm('"Take care of yourself too."'),cool('"Not my business."')]];
 case 'ilse':if(qs('s3')===undefined){qStart('s3');return [["Wardline. Easy. Three people from this block went missing this month. Posters are up. Read them; maybe a face jogs your memory."],[warm('"I\'ll look."'),cool('"Isn\'t that your job?"')]];}
  if(qs('s3')===1){qAdv('s3',1);return [["All three used to eat at the Ladle. Huh. That's... not nothing. Thanks. Keep your eyes open, cook."],[warm('"You too, officer."')]];}
  return [[pick(["Curfew at two. I don't make the rules. I just get yelled at for them.","Off the record? Orrin Mutual pays my sergeant's rent.","Your Miso's the only good thing on my beat."])],[warm('"Shift drink? On the house."'),cool('"Move along."')]];
 case 'juno':if(qs('m4')===1){qAdv('m4',1);return null;}
  if(qs('s4')===undefined){qStart('s4');return [["GREETINGS. Parcel 77-K is lost. Last ping near the west dumpsters. Courier rating at risk. Distress level: moderate."],[warm('"I\'ll find it, Juno."')]];}
  if(qs('s4')===1){qAdv('s4',1);return [["PARCEL RECOVERED. Gratitude subroutine engaged. Thank you, friend. I have never used that word in a delivery log before."],[warm('"Anytime, friend."')]];}
  return [[pick(["THE RAIN IS 4% ACIDIC TONIGHT. PLEASE ENJOY IT RESPONSIBLY.","Do you dream? I defragment. It is similar, I think.","Delivery for Marrow... no record. Strange. Very strange."])],[warm('"Want to sit at the counter a while?"'),{t:'"Good night, Juno."',fx:()=>{}}]];
 }}
// ================= characters (MMMM .vox, CC-BY) =================
const loader=new VOXLoader();const voxCache={};
async function vox(name){if(!voxCache[name])voxCache[name]=loader.loadAsync('vox/'+name+'.vox');const chunks=await voxCache[name];const m=new VOXMesh(chunks[0]);return m;}
async function char(name,tint,h=1.75){const m=await vox(name);m.geometry.computeBoundingBox();const b=m.geometry.boundingBox;const s=h/(b.max.y-b.min.y);m.scale.setScalar(s);m.position.y=-b.min.y*s;
 m.material=m.material.clone();m.material.roughness=.7;if(tint)m.material.color.setHex(tint);const g=new THREE.Group();g.add(m);scene.add(g);return g;}
async function prop(name,x,z,h,ry=0,tint){const g=await char(name,tint,h);g.position.set(x,.16,z);g.rotation.y=ry;return g;}
const npcs={};let player,walkers=[],customers=[];const P={x:-4,z:-4.6,ry:0,vx:0,vz:0};
const interact=[];// {x,z,r,label,fn,show()}
// ================= UI helpers =================
function toast(t){const d=document.createElement('div');d.className='toast';d.innerHTML=t;$('toasts').appendChild(d);setTimeout(()=>d.remove(),3400);}
let dlgOpen=false;
function say(k,lines,opts){dlgOpen=true;const D=$('dlg');D.classList.remove('hide');$('dname').textContent=CAST[k]?CAST[k].n.toUpperCase():k;$('dheart').textContent=CAST[k]?'♥ '+'●'.repeat(Math.round((S.rel[k]||2)/2))+'○'.repeat(5-Math.round((S.rel[k]||2)/2)):'';
 let i=0;const show=()=>{$('dtext').textContent=lines[i];const o=$('dopts');o.innerHTML='';
  if(i<lines.length-1){const b=document.createElement('button');b.textContent='…';b.onclick=()=>{i++;show();};o.appendChild(b);}
  else{(opts.length?opts:[{t:'Leave',fx:()=>{}}]).forEach(op=>{const b=document.createElement('button');b.textContent=op.t;b.onclick=()=>{op.fx();D.classList.add('hide');dlgOpen=false;save();};o.appendChild(b);});}};show();}
function inspect(title,text){say(title,[text],[]);}
// ================= interactables =================
function addI(x,z,r,label,fn,cond=()=>true){interact.push({x,z,r,label,fn,cond});}
addI(3.6,-5.0,1.6,'Kitchen',()=>openCook());
addI(-6.2,-6.4,1.3,'Sleep (home)',()=>sleep(),()=>S.min>=26*60-1||S.min<6*60||true);
addI(W.L-4,-6.6,1.6,'Fuse box',()=>{if(qs('m3')===2){qAdv('m3',2);inspect('Fuse box','Behind the fuses: a greasy tin. Inside, Dess\'s handwriting: "Midnight Miso. Toast the paste. Never trust Orrin. Line 9 still hums."');}else inspect('Fuse box','A rusted fuse box humming in the rain. Someone has scratched a little ladle into the paint.');});
const posters=[[-20,-7.3],[16,7.3],[31,-7.3]];posters.forEach(([x,z],i)=>addI(x,z+(z<0?1:-1),1.4,'Poster',()=>{const names=['TOMAS REYE, 34. Last seen: Neon Ladle, Saltgate.','AIKO VENN, 27. Line cook. Last seen near the old Line 9 stairs.','"GRANDPA" OSU, 71. Regular at Saltgate noodle bars.'];
 inspect('Missing',names[i]);if(qs('s3')===0){S.flags['p'+i]=1;if(S.flags.p0&&S.flags.p1&&S.flags.p2)qAdv('s3',0);else toast(`Posters read ${[0,1,2].filter(j=>S.flags['p'+j]).length}/3`);}}));
addI(-30,-5.4,1.6,'Something on the awning',()=>{qAdv('s2',0);toast('Got Mothball the drone');},()=>qs('s2')===0);
addI(-38,7.0,1.6,'Dumpster',()=>{if(qs('s4')===0){qAdv('s4',0);toast('Found Parcel 77-K');}else inspect('Dumpster','Wet cardboard, a broken umbrella, and a very judgmental cat.');});
// ================= kitchen / shop sim =================
let pots=[];// {dish,t,max}
function openCook(){if(!S.open){if(qs('m1')===0){inspect('The Neon Ladle','The shutters won\'t budge. You need the keys first. Mara Voss, the building agent, should be close by.');return;}
  if(S.min>=26*60){inspect('Curfew','It\'s past curfew. Get some sleep. The door home is just west of the Ladle.');return;}
  S.open=true;S.served=0;qAdv('m1',1);toast('The Ladle is open');W.ladleSign.material.color.setScalar(2.2);save();}
 $('cook').classList.remove('hide');renderCook();}
function renderCook(){const d=$('dishes');d.innerHTML='';S.up.menu.forEach(k=>{const b=document.createElement('button');b.className='dish';b.innerHTML=`<span>${DISH[k].n}</span><small>¢${DISH[k].p} · ${DISH[k].t}s</small>`;
  b.onclick=()=>{if(pots.length>=S.up.burners){toast('All burners busy');return;}pots.push({dish:k,t:0,max:DISH[k].t*(S.up.burners>1?.8:1)});renderCook();};d.appendChild(b);});
 $('cookFoot').innerHTML=`Burners ${pots.length}/${S.up.burners} · Ready bowls go to the customer who ordered them. ${S.open?'<button id="closeShop" style="margin-top:8px;width:100%">Close for the night</button>':''}`;
 const cs=$('closeShop');if(cs)cs.onclick=()=>{closeShop();$('cook').classList.add('hide');};}
function closeShop(){S.open=false;customers.forEach(c=>c.leave=true);W.ladleSign.material.color.setScalar(.6);toast(`Shift over · served ${S.served}`);save();}
let ready=[];
function tickShop(dt){const pd=$('pots');pd.innerHTML=pots.map(p=>`<div style="font-size:11px">${DISH[p.dish].n}</div><div class="pot"><i style="width:${Math.min(100,p.t/p.max*100)}%"></i></div>`).join('')+(ready.length?`<div style="font-size:11px;color:#ffd98a">Ready: ${ready.map(k=>DISH[k].n).join(', ')}</div>`:'');
 pots=pots.filter(p=>{p.t+=dt;if(p.t>=p.max){ready.push(p.dish);return false;}return true;});
 // deliver
 for(let i=ready.length-1;i>=0;i--){const c=customers.find(c=>c.seated&&!c.served&&c.order===ready[i]);if(c){c.served=true;c.leaveT=2.5;const tip=Math.round(DISH[c.order].p*(.1+.4*c.pat/c.patMax));S.cash+=DISH[c.order].p+tip;S.served++;S.servedTotal++;
   toast(`+¢${DISH[c.order].p+tip} · ${DISH[c.order].n}${tip>8?' · great tip':''}`);if(c.who=='sela'&&c.order=='tea')qAdv('s1',0);if(S.served>=5)qAdv('m2',0);ready.splice(i,1);}}
 // spawn
 if(S.open&&S.min<26*60){spawnT-=dt;const cap=S.up.stools;if(spawnT<=0&&customers.filter(c=>!c.leave).length<cap){spawnT=rnd(5,9)*(S.up.sign?0.7:1);spawnCustomer();}}
 if(S.open&&S.min>=26*60){closeShop();toast('Curfew · 02:00. Head home to sleep.');}}
let spawnT=2;const CROWD=['chr_raver1','chr_raver2','chr_goth1','chr_worker1','chr_suit1','chr_scientist','chr_mechanic','chr_ponytail1','chr_hobo1','chr_lady2','chr_thief'];
async function spawnCustomer(){const used=customers.map(c=>c.seat);let seat=[0,1,2,3,4].slice(0,S.up.stools).find(s=>!used.includes(s));if(seat===undefined)return;
 let who=null,model=pick(CROWD);if(qs('s1')===0&&!customers.some(c=>c.who=='sela')&&Math.random()<.5){who='sela';model='chr_nurse';}
 const side=Math.random()<.5?-1:1;const g=await char(model,0xe8e0ff);g.position.set(side*24,.16,-4.6);
 const order=who=='sela'?'tea':pick(S.up.menu);const tag=document.createElement('div');tag.className='tag order';$('tags').appendChild(tag);
 customers.push({g,seat,sx:[-2.6,-1.3,0,1.3,2.6][seat],order,who,seated:false,served:false,pat:60,patMax:60,tag});}
function tickCustomers(dt,t){customers=customers.filter(c=>{const p=c.g.position;let tx=c.sx,tz=-4.6;
  if(c.leave||c.leaveT!==undefined&&(c.leaveT-=dt)<0){c.leave=true;tx=p.x<0?-30:30;}
  if(c.seated&&!c.leave){p.set(c.sx,.62-.16+.16,-5.15);c.g.rotation.y=Math.PI;if(!c.served){c.pat-=dt;if(c.pat<=0){c.leave=true;toast('A customer left hungry');}}}
  else{const dx=tx-p.x,dz=tz-p.z,d=Math.hypot(dx,dz);if(d<.15&&!c.leave){c.seated=true;}else{p.x+=dx/d*dt*1.6;p.z+=dz/d*dt*1.6;c.g.rotation.y=Math.atan2(dx,dz);p.y=.16+Math.abs(Math.sin(t*9))*.04;}}
  c.tag.style.display=c.seated&&!c.served&&!c.leave?'block':'none';if(c.seated&&!c.served){c.tag.innerHTML=`${DISH[c.order].n}<i style="width:${c.pat/c.patMax*100}%"></i>`;place(c.tag,p.x,2.2,p.z);}
  if(c.leave&&Math.abs(p.x)>=29){scene.remove(c.g);c.tag.remove();return false;}return true;});}
// ================= ambient walkers =================
async function spawnWalkers(){for(let i=0;i<14;i++){const g=await char(pick(CROWD),0xe0d8ff);const side=i%2?1:-1;const w={g,x:rnd(-40,40),z:side*rnd(6.6,7.9),v:(Math.random()<.5?1:-1)*rnd(.9,1.5),ph:rnd(0,6)};
  // some carry an umbrella (custom voxel)
  if(Math.random()<.5){const u=new THREE.Group();const col=pick([0x2a2a3a,0xff3fa4,0x3ff0ff,0x1a1a22]);const top=new THREE.Mesh(new THREE.BoxGeometry(1.1,.08,1.1),new THREE.MeshLambertMaterial({color:col,emissive:col,emissiveIntensity:col>0x300000?.25:0}));top.position.y=2.05;u.add(top);
   const st=new THREE.Mesh(new THREE.BoxGeometry(.04,.7,.04),new THREE.MeshLambertMaterial({color:0x222}));st.position.y=1.7;u.add(st);g.add(u);}
  walkers.push(w);}}
function tickWalkers(dt,t){for(const w of walkers){w.x+=w.v*dt;if(w.x>44)w.x=-44;if(w.x<-44)w.x=44;w.g.position.set(w.x,.16+Math.abs(Math.sin(t*8+w.ph))*.04,w.z);w.g.rotation.y=w.v>0?Math.PI/2:-Math.PI/2;}}
// ================= input =================
const joy={id:null,ox:0,oy:0,dx:0,dy:0};const J=$('joy'),K=$('knob');
canvas.addEventListener('pointerdown',e=>{if(e.clientX<innerWidth*.5&&joy.id===null){joy.id=e.pointerId;const r=J.getBoundingClientRect();joy.ox=r.left+60;joy.oy=r.top+60;
  if(Math.hypot(e.clientX-joy.ox,e.clientY-joy.oy)>90){J.style.left=(e.clientX-60)+'px';J.style.top=(e.clientY-60)+'px';J.style.bottom='auto';joy.ox=e.clientX;joy.oy=e.clientY;}move(e);}
 else if(e.clientX>=innerWidth*.5){tapWorld(e);}});
function move(e){let dx=e.clientX-joy.ox,dy=e.clientY-joy.oy;const d=Math.hypot(dx,dy);if(d>48){dx*=48/d;dy*=48/d;}joy.dx=dx/48;joy.dy=dy/48;K.style.transform=`translate(${dx}px,${dy}px)`;J.style.opacity=.9;}
addEventListener('pointermove',e=>{if(e.pointerId===joy.id)move(e);});
addEventListener('pointerup',e=>{if(e.pointerId===joy.id){joy.id=null;joy.dx=joy.dy=0;K.style.transform='';J.style.opacity=.55;}});
addEventListener('pointercancel',e=>{if(e.pointerId===joy.id){joy.id=null;joy.dx=joy.dy=0;K.style.transform='';}});
let moveTo=null;function tapWorld(e){const r=new THREE.Raycaster();r.setFromCamera(new THREE.Vector2(e.clientX/innerWidth*2-1,-(e.clientY/innerHeight)*2+1),cam);
 // tap an NPC?
 for(const k in npcs){const n=npcs[k];const p=n.position.clone();p.y=1;const s=p.project(cam);const sx=(s.x+1)/2*innerWidth,sy=(1-s.y)/2*innerHeight;if(Math.hypot(sx-e.clientX,sy-e.clientY)<50){moveTo={x:n.position.x,z:n.position.z,then:k};return;}}
 const pt=new THREE.Vector3();if(r.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),-.16),pt))moveTo={x:pt.x,z:pt.z};}
let near=null;$('act').onclick=()=>{if(near)near.fn();};
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$(b.dataset.close).classList.add('hide'));
$('menuB').onclick=()=>{$('menu').classList.remove('hide');tab('q');};
document.querySelectorAll('#tabs button').forEach(b=>b.onclick=()=>tab(b.dataset.t));
function tab(t){document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('on',b.dataset.t==t));const M=$('mbody');let h='';
 if(t=='q'){for(const grp of[['STORY',1],['SIDE',0]]){h+=`<div class="qh">${grp[0]}</div>`;for(const id in Q){if(!!Q[id].main!==!!grp[1]||S.q[id]===undefined)continue;const st=S.q[id];h+=`<div class="row"><span class="${st=='done'?'done':''}">${Q[id].t}<br><small>${st=='done'?'Complete':Q[id].steps[st]}</small></span></div>`;}}}
 if(t=='p'){for(const k in CAST){const met=S.rel[k]!==undefined||S.talkedDay[k];const r=Math.round((S.rel[k]||2)/2);h+=`<div class="row"><span>${met?CAST[k].n:'???'}<br><small>${met?CAST[k].role:'not met yet'}</small></span><span class="meter">${met?'●'.repeat(r)+'○'.repeat(5-r):''}</span></div>`;}}
 if(t=='l'){h+=`<div class="row"><span>Cash<br><small>Day ${S.day} · served ${S.servedTotal} bowls total</small></span><span style="color:#ffd98a">¢${S.cash}</span></div><div class="row"><span>Debt to Orrin Mutual</span><span>¢${S.debt}</span></div>`;
  const ups=[['pay','Pay ¢1,500 toward the debt',1500,()=>{S.debt-=1500;qAdv('m4',0);}],['burner','Second burner (cook 2 at once, faster)',400,()=>S.up.burners=2,()=>S.up.burners<2],['stools','Two more stools',300,()=>S.up.stools=5,()=>S.up.stools<5],['sign','Fix the flickering sign (more walk-ins)',250,()=>{S.up.sign=1;},()=>!S.up.sign],['chili','Recipe: Static Chili Tan',600,()=>S.up.menu.push('chili'),()=>!S.up.menu.includes('chili')]];
  ups.forEach(([id,n,c,fx,cond])=>{if(cond&&!cond())return;h+=`<div class="row"><span>${n}</span><button data-u="${id}">¢${c}</button></div>`;});M.innerHTML=h;
  M.querySelectorAll('[data-u]').forEach(b=>b.onclick=()=>{const u=ups.find(x=>x[0]==b.dataset.u);if(S.cash<u[2]){toast('Not enough cash');return;}S.cash-=u[2];u[3]();save();tab('l');});return;}
 if(t=='o'){h+=`<div class="row"><span>Rain & city audio</span><button id="aud">${audioOn?'On':'Off'}</button></div><div class="row"><span>Graphics</span><button id="gq">${localStorage.nlLow?'Battery saver':'Full'}</button></div><div class="row"><span>Erase save</span><button id="wipe">Reset</button></div><small>Neon Ladle v1 · original story. Characters & props: Mini Mike's Metro Minis (CC-BY 4.0).</small>`;
  M.innerHTML=h;$('aud').onclick=()=>{toggleAudio();tab('o');};$('gq').onclick=()=>{localStorage.nlLow?delete localStorage.nlLow:localStorage.nlLow=1;location.reload();};$('wipe').onclick=()=>{if(confirm('Erase your save?')){localStorage.removeItem('neonLadle');location.reload();}};return;}
 M.innerHTML=h;}
// ================= audio (procedural rain + city, no external files) =================
let AC,master,audioOn=false;
function startAudio(){if(AC)return;AC=new (window.AudioContext||window.webkitAudioContext)();master=AC.createGain();master.gain.value=.0;master.connect(AC.destination);
 const len=AC.sampleRate*3,buf=AC.createBuffer(2,len,AC.sampleRate);for(let ch=0;ch<2;ch++){const d=buf.getChannelData(ch);let b=0;for(let i=0;i<len;i++){const w=Math.random()*2-1;b=.97*b+.03*w;d[i]=w*.5+b*2;}}
 const mk=(f,q,g,type='bandpass')=>{const s=AC.createBufferSource();s.buffer=buf;s.loop=true;const fl=AC.createBiquadFilter();fl.type=type;fl.frequency.value=f;fl.Q.value=q;const gn=AC.createGain();gn.gain.value=g;s.connect(fl).connect(gn).connect(master);s.start(0,Math.random()*2);return gn;};
 mk(2600,.4,.22);mk(900,.6,.12);mk(180,.7,.35,'lowpass'); // rain hiss, patter, city rumble
 const hum=AC.createOscillator();hum.frequency.value=55;const hg=AC.createGain();hg.gain.value=.015;hum.connect(hg).connect(master);hum.start();
 // distant chimes / synth pads
 setInterval(()=>{if(!audioOn)return;const o=AC.createOscillator(),g=AC.createGain();o.type='sine';o.frequency.value=pick([220,261.6,329.6,392,440,523.3])*pick([1,.5]);g.gain.setValueAtTime(0,AC.currentTime);g.gain.linearRampToValueAtTime(.025,AC.currentTime+1.5);g.gain.linearRampToValueAtTime(0,AC.currentTime+6);o.connect(g).connect(master);o.start();o.stop(AC.currentTime+6.2);},4200);
 audioOn=true;master.gain.linearRampToValueAtTime(.8,AC.currentTime+3);}
function toggleAudio(){if(!AC){startAudio();return;}audioOn=!audioOn;master.gain.linearRampToValueAtTime(audioOn?.8:0,AC.currentTime+.5);}
// ================= time / sleep =================
function sleep(){if(S.open){toast('Close the shop first (Kitchen)');return;}
 if(S.min<24*60&&S.min>=18*60&&S.min<22*60){inspect('Home','A narrow capsule flat above the Ladle. It\'s too early to sleep. The street is still awake.');return;}
 S.day++;S.min=18*60;S.talkedDay={};const interest=Math.round(S.debt*.002);S.debt+=interest;toast(`Day ${S.day} · Orrin Mutual added ¢${interest} interest`);save();}
// ================= helpers =================
const tmpV=new THREE.Vector3();function place(el,x,y,z){tmpV.set(x,y,z).project(cam);if(tmpV.z>1){el.style.display='none';return;}el.style.left=((tmpV.x+1)/2*innerWidth)+'px';el.style.top=((1-tmpV.y)/2*innerHeight)+'px';}
const nameTags={};
// ================= boot =================
async function boot(){if(localStorage.nlLow){R.setPixelRatio(1);bloom.strength=.7;}
 player=await char('chr_punk',0xf0e8ff,1.72);
 for(const k in CAST){const c=CAST[k];const g=await char(c.vox,c.tint);g.position.set(c.pos[0],.16,c.pos[1]);g.rotation.y=c.pos[1]<0?0:Math.PI;npcs[k]=g;
  const t=document.createElement('div');t.className='tag';t.innerHTML=`<span style="color:#7ff3ff">${c.n}</span>`;$('tags').appendChild(t);nameTags[k]=t;addI(c.pos[0],c.pos[1],1.8,'Talk · '+c.n.split(' ')[0],()=>{const r=talk(k);if(r)say(k,r[0],r[1]);});}
 // MMMM props, tinted to the night palette
 const props=[['obj_dogstand',-17,5.5,2.2,Math.PI],['obj_trashcan1',-12,8.0,1],['obj_trashcan1',19,-8.1,1],['obj_rubbish1',-38,7.6,.6],['obj_rubbish2',-36.5,7.9,.5],['obj_container1',-39,8.5,2,Math.PI/2],['obj_newsbox1',6,-8.0,1.1],['obj_arcade1',10,-8.1,1.9],['obj_arcade2',11,-8.1,1.9],['obj_hydrant',-14,6.4,.7],['obj_bench1',26,7.9,.9,Math.PI],['obj_cone1',-3,5.0,.6],['obj_cone1',-2.2,5.2,.6],['mob_cat1',-37,7.2,.4,1],['obj_table1',-18.5,4.9,.9],['obj_chair1',-19.5,4.9,.8,1.5]];
 for(const p of props)await prop(p[0],p[1],p[2],p[3],p[4]||0,0xd8cff0);
 // Kip's drone on the awning (custom voxel)
 const dr=new THREE.Group();const db=new THREE.Mesh(new THREE.BoxGeometry(.5,.15,.5),new THREE.MeshLambertMaterial({color:0x555566}));dr.add(db);const de=new THREE.Mesh(new THREE.BoxGeometry(.12,.12,.12),new THREE.MeshBasicMaterial({color:new THREE.Color(0x5dff9b).multiplyScalar(3),toneMapped:false}));de.position.y=.12;dr.add(de);dr.position.set(-30,3.05,-7.3);scene.add(dr);window.__drone=dr;
 // poster props
 posters.forEach(([x,z])=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(.8,1.1),new THREE.MeshLambertMaterial({color:0xd8d0c0,emissive:0x302820}));m.position.set(x,1.6,z<0?-8.55:8.55);m.rotation.y=z<0?0:Math.PI;scene.add(m);});
 await spawnWalkers();
 // bake reflections
 cubeCam.update(R,scene);scene.traverse(o=>{if(o.isMesh&&o.material&&o.material.isMeshStandardMaterial&&o.material.metalness>.3){o.material.envMap=cubeRT.texture;o.material.envMapIntensity=1.4;o.material.needsUpdate=true;}});
 if(!S.q.m1&&S.q.m1!==0){qStart('m1');}
 $('load').classList.add('hide');$('start').classList.remove('hide');requestAnimationFrame(frame);}
$('start').onclick=async()=>{$('title').classList.add('hide');$('hud').classList.remove('hide');startAudio();
 try{await document.documentElement.requestFullscreen?.();await screen.orientation?.lock?.('landscape');}catch(e){}
 if(!S.flags.intro){S.flags.intro=1;save();say('Saltgate Ward',['Veyra City. Saltgate Ward. It hasn\'t stopped raining in three years.','Your Aunt Dess vanished a week ago. She left you her noodle bar, The Neon Ladle, plus a twenty-thousand-credit debt to Orrin Mutual, and a note: "Line 9 still hums."','Left thumb walks. Right side: tap people and places, then use the action button.'],[]);}};
// ================= main loop =================
let last=performance.now(),camPos=new THREE.Vector3(-4,7,4),look=new THREE.Vector3(),T=0,saveT=0;
function frame(now){const dt=Math.min(.05,(now-last)/1000);last=now;T+=dt;
 // move
 let mx=joy.dx,mz=joy.dy;if(Math.hypot(mx,mz)>.1)moveTo=null;else if(moveTo){const dx=moveTo.x-P.x,dz=moveTo.z-P.z,d=Math.hypot(dx,dz);if(d<1.3){if(moveTo.then){const n=interact.find(i=>i.label.includes(CAST[moveTo.then].n.split(' ')[0]));moveTo=null;n&&n.fn();}else if(d<.2)moveTo=null;if(moveTo){mx=dx/d;mz=dz/d;}}else{mx=dx/d;mz=dz/d;}}
 if(dlgOpen){mx=mz=0;}
 const sp=3.4,m=Math.hypot(mx,mz);if(m>.05){P.x+=mx*sp*dt;P.z+=mz*sp*dt;P.ry=Math.atan2(mx,mz);}
 P.x=Math.max(-W.L+1,Math.min(W.L-1,P.x));P.z=Math.max(-8,Math.min(8,P.z));if(Math.abs(P.x)<3.8&&P.z<-5.4)P.z=-5.4; // counter
 const onWalk=Math.abs(P.z)>6;if(player){player.position.set(P.x,(onWalk?.16:0)+(m>.05?Math.abs(Math.sin(T*10))*.05:0),P.z);let a=P.ry-player.rotation.y;a=Math.atan2(Math.sin(a),Math.cos(a));player.rotation.y+=a*Math.min(1,dt*10);}
 // smooth camera: angled third-person street cam
 const want=new THREE.Vector3(P.x-1.2,3.4,Math.min(P.z+6.4,4.8));camPos.lerp(want,1-Math.exp(-dt*3));cam.position.copy(camPos);look.lerp(new THREE.Vector3(P.x+.4,3.1,P.z-4),1-Math.exp(-dt*5));cam.lookAt(look);
 fill.position.set(P.x-1,2.6,P.z+2.5);
 // time
 if(!dlgOpen){S.min+=dt*2;if(S.min>=30*60)S.min=30*60;}
 const hh=Math.floor(S.min/60)%24,mm=Math.floor(S.min%60);$('clock').textContent=`Day ${S.day} · ${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;$('shop').textContent=S.open?'Ladle open':S.min>=26*60?'Curfew':'Ladle closed';$('cash').textContent='¢'+S.cash;
 // quest tracker
 const cur=['m1','m2','m3','m4'].find(id=>S.q[id]!==undefined&&S.q[id]!=='done');$('track').innerHTML=cur?`<b>${Q[cur].t.toUpperCase()}</b>${Q[cur].steps[S.q[cur]]}`:(S.q.m4==='done'?'<b>CHAPTER ONE COMPLETE</b>Keep the Ladle running':'');
 // interact
 near=null;let bd=9;for(const i of interact){if(!i.cond())continue;const d=Math.hypot(i.x-P.x,i.z-P.z);if(d<i.r&&d<bd){bd=d;near=i;}}
 const A=$('act');if(near&&!dlgOpen){A.classList.remove('hide');A.textContent=near.label;}else A.classList.add('hide');
 for(const k in npcs){const n=npcs[k];const d=Math.hypot(n.position.x-P.x,n.position.z-P.z);nameTags[k].style.display=d<7?'block':'none';if(d<7)place(nameTags[k],n.position.x,2.15,n.position.z);
  n.position.y=.16+Math.sin(T*1.5+n.position.x)*.01;if(d<4){const ty=Math.atan2(P.x-n.position.x,P.z-n.position.z);let a=ty-n.rotation.y;a=Math.atan2(Math.sin(a),Math.cos(a));n.rotation.y+=a*dt*3;}}
 if(window.__drone)window.__drone.visible=qs('s2')!==1&&qs('s2')!=='done';
 tickShop(dt);tickCustomers(dt,T);tickWalkers(dt,T);
 // ambience
 rain.update(dt,cam.position);steam.update(dt);traffic.update(dt);
 for(const f of W.flick){if(f.material.color){const on=Math.sin(T*3+f.id)>-.92||Math.random()>.3;f.material.color.setScalar(on?1.25:.3);}}
 if(!S.open&&!S.up.sign)W.ladleSign.material.color.setScalar(Math.random()<.04?.4:1.2);else W.ladleSign.material.color.setScalar(1.6);
 saveT+=dt;if(saveT>6){saveT=0;save();}
 composer.render();requestAnimationFrame(frame);}
boot().catch(e=>{$('load').textContent='Failed to load: '+e.message;console.error(e);});
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
window.__S=S;window.__P=P;
