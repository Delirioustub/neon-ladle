// Neon Ladle R6: the noodle bar as a place: work the pass behind the counter, build bowls to order, eat as a customer, steam + sizzle.
const pick=a=>a[Math.floor(Math.random()*a.length)];
export function initLadle(G){const {S,THREE,scene,P,toast,say,interact}=G;
 // ---- props: burner flames under the stock pots, a wok, rising steam puffs ----
 const fl=[],puffs=[];const fm=new THREE.MeshBasicMaterial({color:0x4aa8ff,toneMapped:false,transparent:true,opacity:.85});
 for(const x of[-2.4,0,2.4]){const f=new THREE.Mesh(new THREE.ConeGeometry(.22,.16,10,1,true),fm);f.position.set(x,.99,-8.43);f.rotation.x=Math.PI;scene.add(f);fl.push(f);}
 const wok=new THREE.Mesh(new THREE.SphereGeometry(.32,16,8,0,Math.PI*2,Math.PI*.6,Math.PI*.4),new THREE.MeshStandardMaterial({color:0x2a2a2e,roughness:.4,metalness:.7,side:THREE.DoubleSide}));wok.position.set(1.2,1.2,-8.43);scene.add(wok);
 const wf=new THREE.Mesh(new THREE.ConeGeometry(.2,.14,10,1,true),new THREE.MeshBasicMaterial({color:0xff7a2a,toneMapped:false,transparent:true,opacity:.8}));wf.rotation.x=Math.PI;wf.position.set(1.2,.99,-8.43);scene.add(wf);
 const pcv=document.createElement('canvas');pcv.width=pcv.height=64;{const g=pcv.getContext('2d'),gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.5,'rgba(255,255,255,.45)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);}
 const pm=new THREE.MeshBasicMaterial({color:0xcfd6e0,map:new THREE.CanvasTexture(pcv),transparent:true,opacity:.18,depthWrite:false});const pg=new THREE.PlaneGeometry(.35,.35);// R8: soft round puffs (square planes read as floating white boxes)const pg=new THREE.PlaneGeometry(.35,.35);
 for(let i=0;i<14;i++){const m=new THREE.Mesh(pg,pm.clone());m.userData={src:[-2.4,0,2.4,1.2][i%4],t:Math.random()*2};scene.add(m);puffs.push(m);}
 // ---- sizzle (own tiny audio graph so it works without the ambience bus) ----
 let AC=null;const sizzle=(dur=1.2,vol=.18)=>{try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();const n=AC.sampleRate*dur|0,b=AC.createBuffer(1,n,AC.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++){const t=i/n;d[i]=(Math.random()*2-1)*(Math.random()<.08?1:.35)*Math.min(1,t*20)*(1-t);}
  const s=AC.createBufferSource();s.buffer=b;const hp=AC.createBiquadFilter();hp.type='highpass';hp.frequency.value=2500;const g=AC.createGain();g.gain.value=vol;s.connect(hp);hp.connect(g);g.connect(AC.destination);s.start();}catch(e){}};
 let burst=0;
 // ---- bowl building ----
 const BROTH=[['Shoyu','shoyu'],['Miso','miso'],['Static Chili','chili']],NOOD=[['Thin','thin'],['Thick','thick']],TOP=[['Soft egg','egg'],['Chashu','pork'],['Scallion + nori','green']];
 const NAMES=['A dock loader','A tired nurse','Two kids sharing','A courier, helmet on','An Orrin clerk, slumming it','A Wardline cadet off shift','A busker counting coins'];
 const keys=()=>S.q.m1!==undefined&&S.q.m1!==0;
 const order=()=>S.ladleOrder||(S.ladleOrder={who:pick(NAMES),b:pick(BROTH)[1],n:pick(NOOD)[1],t:pick(TOP)[1]});
 const lbl=(L,k)=>L.find(x=>x[1]===k)[0];
 const ticket=o=>`${o.who} wants: ${lbl(BROTH,o.b)}, ${lbl(NOOD,o.n).toLowerCase()} noodles, ${lbl(TOP,o.t).toLowerCase()}.`;
 function build(){if(!keys()){say('The pass',['The burners are cold and the shutters are down. You need the keys first.']);return;}
  const o=order(),bowl={};
  const step3=()=>say('The pass',[ticket(o),'Last thing on top.'],TOP.map(([n,k])=>({t:n,fx:()=>{bowl.t=k;serve();}})));
  const step2=()=>{sizzle(.9,.12);burst=1.5;say('The pass',[ticket(o),'Noodles into the basket, shake, shake, into the bowl.'],NOOD.map(([n,k])=>({t:n,fx:()=>{bowl.n=k;},then:step3})));};
  say('The pass',[ticket(o),'Ladle the broth first.'],BROTH.map(([n,k])=>({t:n,fx:()=>{bowl.b=k;},then:step2})).concat([{t:'Step away'}]));
  function serve(){sizzle(1.4,.2);burst=2.5;const hit=(bowl.b===o.b)+(bowl.n===o.n)+(bowl.t===o.t);const pay=6+hit*3+(hit===3?5:0);S.cash+=pay;S.min+=3;S.ladleBowls=(S.ladleBowls||0)+1;delete S.ladleOrder;
   toast(hit===3?`Perfect bowl · +¢${pay} (tip included)`:hit?`+¢${pay} · ${3-hit} thing${hit===2?'':'s'} off, they eat it anyway`:`+¢${pay} · "...this isn't what I ordered."`);if(hit===3&&Math.random()<.35&&G.rep)G.rep('civ',1);}}
 interact.push({id:'pass',pos:()=>new THREE.Vector3(0,1.2,-7.3),r:2.2,label:'The pass · build a bowl to order',fn:build,cond:()=>P.z<-6.9&&(P.y||0)<.5});
 // ---- eat as a customer ----
 const LINES=['The broth is dark and salty and tastes like somebody\'s grandmother was very angry and very loving.','Steam fogs your eyes. For two minutes the city outside is just sound.','You slurp. The old man two stools down nods once, approving.','Chili oil, too much of it. Exactly enough of it.'];
 interact.push({id:'eatbowl',pos:()=>new THREE.Vector3(0,1,-4.7),r:1.6,label:'Order a bowl · ¢8',cond:()=>P.z>-5.5&&(P.y||0)<.5,fn:()=>{
  if(S.ateDay===S.day){say('The Neon Ladle',['You\'re still full. The night cook slides you a cup of barley tea instead, on the house.']);return;}
  if(S.cash<8){say('The Neon Ladle',['¢8 a bowl. You count your pockets twice. Not tonight.']);return;}
  say('The Neon Ladle',[keys()?'You take a stool on the customer side for once. The night cook raises an eyebrow and starts a bowl without asking.':'A night cook covering the shuttered counter ladles one bowl for you, cash only.'],[{t:'Shoyu',fx:()=>eat()},{t:'Miso',fx:()=>eat()},{t:'Never mind'}]);}});
 function eat(){S.cash-=8;S.ateDay=S.day;S.min+=15;sizzle(1,.14);burst=2;P.x=Math.max(-2.6,Math.min(2.6,Math.round(P.x/1.3)*1.3));P.z=-5.05;P.yaw=0;P.sit=1;G.fade&&G.fade();setTimeout(()=>say('The Neon Ladle',[pick(LINES)]),400);}
 // ---- tick ----
 let T=0;return {tick(dt){T+=dt;const near=Math.hypot(P.x,P.z+7)<30;for(const f of fl){f.visible=near;f.scale.set(1+Math.sin(T*23+f.position.x)*.12,1+Math.sin(T*17+f.position.x*3)*.3,1);}
  wf.scale.y=1+Math.sin(T*29)*.35+(burst>0?1.2:0);burst=Math.max(0,burst-dt);
  for(const m of puffs){m.visible=near;if(!near)continue;const u=m.userData;u.t+=dt*(burst>0?1.8:1);if(u.t>2.4)u.t=0;const k=u.t/2.4;m.position.set(u.src+Math.sin(u.t*3+u.src)*.15,1.4+k*1.6,-8.43+Math.cos(u.t*2)*.1);m.scale.setScalar(.6+k*1.6);m.material.opacity=.22*(1-k)*(burst>0?1.6:1);m.quaternion.copy(G.cam.quaternion);}}};}
