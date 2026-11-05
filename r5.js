// Neon Ladle R5: faction karma + gang membership, dynamic street events, romance, light gunplay, and the Node 14 pod hall.
// Story text lives in story5.js. game.js calls initR5(G) once, then R5.tick(dt,T) every frame.
import {ENDINGS} from './story5.js';
import {initGuns,GUNS} from './guns.js';
const rnd=(a,b)=>a+Math.random()*(b-a),pick=a=>a[Math.floor(Math.random()*a.length)];
export function initR5(G){const {S,THREE,scene,P,cam,npcs,toast,note,rel,say}=G;const F=S.flags;
 S.rep=S.rep||{};for(const f of['tide','wardline','civ','orrin'])S.rep[f]=S.rep[f]||0;S.gang=S.gang||{rank:0};S.rom=S.rom||{};S.gun=S.gun||{has:0,ammo:0};S.hp=100;
 const FNS={tide:'Ashline Tide',wardline:'Wardline',civ:'Civilians',orrin:'Orrin Mutual'};
 const relv=k=>S.rel[k]??2;
 // ================= r5b: karma =================
 const RIVAL={tide:'wardline',wardline:'tide',orrin:'civ',civ:'orrin'};
 G.rep=(f,d)=>{if(!d)return;S.rep[f]=Math.max(-20,Math.min(20,(S.rep[f]||0)+d));toast(`${FNS[f]} ${d>0?'▲':'▼'} ${S.rep[f]}`);const r0=S.gang.rank;if(f==='tide'&&S.gang.rank>0){const nr=rankFor(S.rep.tide);if(nr!==r0){S.gang.rank=nr;if(nr>r0){toast(`Ashline Tide rank · <b>${RANKS[nr]}</b>`);rankGun(nr);}}}};
 const mood=f=>{const v=S.rep[f]||0;return v>=10?'loyal ally':v>=5?'friendly':v>=1?'warm':v<=-8?'hunting you':v<=-3?'hostile':v<0?'wary':'neutral';};
 const RANKS=['','Deckhand','Runner','Hook','Tidecaller'];const rankFor=v=>v>=15?4:v>=10?3:v>=6?2:1;
 G.gang={rank:()=>S.gang.rank||0};
 const FAC_OF={clothes:'orrin',cafe:'orrin',bar:'tide',pawn:'tide'};
 const priceMul=shop=>{const f=FAC_OF[shop];if(!f)return 1;let m=1-Math.max(-.3,Math.min(.2,(S.rep[f]||0)*.02));if(f==='tide')m-=.08*(S.gang.rank||0);if(f==='orrin'&&G.lookClass()==='low')m+=.1;return Math.max(.5,m);};
 const jobDone=j=>{if(Math.random()<.5&&RIVAL[j.fac]&&j.fac!=='civ')G.rep(RIVAL[j.fac],-1);if(j.fac==='tide'&&S.gang.rank){const b=Math.round(j.pay*.15*S.gang.rank);S.cash+=b;toast(`Tide cut for a ${RANKS[S.gang.rank]} · +¢${b}`);}};
 // ================= gun & concealment =================
 const concealed=()=>{const c=(S.look||{}).coat;return !!(c&&c.len>=.6);};
 const armedVisible=()=>S.gun.has&&(S.gun.drawn||!concealed());
 let GN=null;const rankGun=nr=>{if(!GN)return;const R={2:['kestrel',24,'Hesk slips you a Kestrel 9 under the bar. "Keep it under a coat in Crown."'],3:['rattler',48,'Hesk slides a Tide Rattler across the bar, wrapped in a fish crate label. "Hooks need teeth."'],4:['halo',60,'Hesk unwraps a Halo carbine, Saint-white, retrimmed Tide orange. "Took it off a Saint. Now it\'s yours."']}[nr];if(R&&!GN.owned(R[0])){GN.give(R[0],R[1]);toast(R[2]);}};
 // ================= story interact points =================
 const want=ev=>{for(const id in G.Q){const s=G.stepOf(id);if(s&&G.onList(s).includes(ev))return {id,s};}return null;};
 const storyAt=(ev,title,fallback)=>{const w=want(ev);if(!w)return fallback&&fallback();if(w.s.say){const r=w.s.say(G,title);G.say(title,r[0],r[1].map(o=>({...o,fx:()=>{o.fx&&o.fx();if(o.adv)G.qAdv(w.id);}})));}else G.emit(ev);};
 const pt=(id,x,y,z,r,label,title,cond)=>G.interact.push({id,pos:()=>new THREE.Vector3(x,y,z),r,label,fn:()=>storyAt('interact:'+id,title),cond:()=>(!cond||cond())&&!!want('interact:'+id)});
 pt('r5crate',68,1.1,259,2.8,'Look under the tarp','Ashline pier');
 pt('r5relay',-35,8.6,249,2.6,"Splice Kip's listener",'Canopy relay');
 pt('r5pillar',-1.5,47.2,-273.5,2.6,'Touch the maintenance pillar','The canopy');
 pt('r5pods',0,1.3,548,6,'Look at the pods','Node 14');
 // visible props for story points
 {// R10: was a bare untextured white box on the pier walkway. Now a weathered steel cold-crate with ribs, latches and a status lamp.
  const cr=new THREE.Group();cr.position.set(68,0,259);scene.add(cr);const bm=(w,h,d,x,y,z,c,b)=>{const q=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),b?new THREE.MeshBasicMaterial({color:new THREE.Color(c).multiplyScalar(2),toneMapped:false}):new THREE.MeshStandardMaterial({color:c,roughness:.75,metalness:.5}));q.position.set(x,y,z);cr.add(q);};
  bm(1,.62,2.2,0,.35,0,0x3d4a52);bm(1.04,.06,2.24,0,.68,0,0x2a3238);for(let z=-.9;z<1;z+=.3)bm(1.03,.5,.05,0,.35,z,0x55646c);bm(.06,.1,.18,.52,.5,-.5,0x8a8a80);bm(.06,.1,.18,.52,.5,.5,0x8a8a80);bm(.02,.08,.08,.52,.58,0,0x5dff9b,1);bm(.9,.05,.9,0,.02,0,0x1a1c1e);bm(1.12,.05,1.3,.02,.72,-.35,0x3a4630);bm(.05,.4,1.3,-.56,.52,-.35,0x3a4630);
  if(G.CITY&&G.CITY.block)G.CITY.block.push([67.5,68.5,257.9,260.1]);
  const mast=new THREE.Mesh(new THREE.CylinderGeometry(.06,.08,4,6),new THREE.MeshLambertMaterial({color:0x4a4a52}));mast.position.set(-35,7.5+2,249);scene.add(mast);
  const tip=new THREE.Mesh(new THREE.SphereGeometry(.12,8,6),new THREE.MeshBasicMaterial({color:new THREE.Color(0xb04dff).multiplyScalar(2.5),toneMapped:false}));tip.position.set(-35,11.6,249);scene.add(tip);G.cand.push({x:-35,y:11,z:249,col:0xb04dff,int:2,dist:6});
  const pil=new THREE.Mesh(new THREE.CylinderGeometry(.35,.35,3.2,12),new THREE.MeshStandardMaterial({color:0xb8c0cc,metalness:.9,roughness:.25}));pil.position.set(-1.5,47.6,-273.6);scene.add(pil);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.38,.03,6,24),new THREE.MeshBasicMaterial({color:new THREE.Color(0xc9b2ff).multiplyScalar(2.5),toneMapped:false}));ring.rotation.x=Math.PI/2;ring.position.set(-1.5,48.4,-273.6);scene.add(ring);}
 // ================= Node 14 pod hall (under Line 9, reached by tunnel) =================
 const NX0=-10,NX1=10,NZ0=528,NZ1=570;
 {const B=new THREE.Group();scene.add(B);const wm=new THREE.MeshLambertMaterial({color:0x1a1c22});
  const fl=new THREE.Mesh(new THREE.BoxGeometry(20,.2,42),new THREE.MeshStandardMaterial({color:0x101216,roughness:.25,metalness:.4}));fl.position.set(0,-.1,549);B.add(fl);
  for(const [x,z,w,d] of[[0,NZ0,20,.3],[0,NZ1,20,.3],[NX0,549,.3,42],[NX1,549,.3,42]]){const m=new THREE.Mesh(new THREE.BoxGeometry(w,6,d),wm);m.position.set(x,3,z);B.add(m);}
  const ce=new THREE.Mesh(new THREE.BoxGeometry(20,.2,42),wm);ce.position.set(0,6,549);B.add(ce);
  const pod=new THREE.CapsuleGeometry(.42,1.5,4,10);pod.rotateX(Math.PI/2);const pm=new THREE.MeshStandardMaterial({color:0xdfe6ea,roughness:.4,metalness:.1});const gm=new THREE.MeshBasicMaterial({color:new THREE.Color(0x3ff0ff).multiplyScalar(1.6),toneMapped:false});
  const pos=[];for(const x of[-7.5,-4.5,4.5,7.5])for(let z=532;z<567;z+=2.6)for(const y of[.55,1.65,2.75])pos.push([x,y,z]);
  const ip=new THREE.InstancedMesh(pod,pm,pos.length),ig=new THREE.InstancedMesh(new THREE.BoxGeometry(.5,.04,1.3),gm,pos.length);const o=new THREE.Object3D();
  pos.forEach((p,i)=>{o.position.set(...p);o.updateMatrix();ip.setMatrixAt(i,o.matrix);o.position.y+=.43;o.updateMatrix();ig.setMatrixAt(i,o.matrix);});ip.computeBoundingSphere();ig.computeBoundingSphere();B.add(ip);B.add(ig);
  for(const x of[-6,-2,2,6])for(const y of[1.1,2.2])for(const z of[532]){}
  for(let z=534;z<568;z+=9){G.cand.push({x:0,y:4.5,z,col:0x3ff0ff,int:3,dist:10});G.cand.push({x:-6,y:2,z:z+4,col:0x2a8aff,int:1.6,dist:6});G.cand.push({x:6,y:2,z:z+4,col:0x2a8aff,int:1.6,dist:6});}
  for(let z=531;z<568;z+=3){const s=new THREE.Mesh(new THREE.BoxGeometry(.08,.02,1.6),gm);s.position.set(0,.01,z);B.add(s);}
  G.W.walk.push([-3.4,3.4,NZ0+.4,NZ1-.4,0]);G.CITY.rooms.push([NX0,NX1,NZ0,NZ1,6]);}
 G.interact.push({id:'r5seal',pos:()=>new THREE.Vector3(-24,1.3,77),r:2.8,label:'Maintenance seal · tunnel',cond:()=>!!F.tunnelOpen,fn:()=>{G.fade();setTimeout(()=>{Object.assign(P,{x:0,z:531.5,y:0,yaw:Math.PI,pitch:0,sit:null});toast('Forty minutes along a dripping service tunnel. Then: a hum you feel in your teeth.');G.emit('enter:node14');},350);}});
 G.interact.push({id:'r5exit',pos:()=>new THREE.Vector3(0,1.3,529.4),r:2.4,label:'Tunnel back to Line 9',cond:()=>true,fn:()=>G.leaveNode()});
 G.leaveNode=()=>{if(P.z<500)return;G.fade();setTimeout(()=>{Object.assign(P,{x:-22,z:74,y:0,yaw:0,pitch:0});},350);};
 // ================= endings =================
 G.endGame=e=>{F.ending=e;const E=ENDINGS[e];const fx={open:{civ:3,orrin:-5},fair:{civ:3,orrin:-2},tide:{tide:4,orrin:-5,wardline:-2},law:{wardline:4,tide:-2,orrin:-5},chair:{orrin:6,civ:-4}}[e];
  setTimeout(()=>{G.say('The canopy',E.pillar,[{t:'Let go of the pillar',fx:()=>{for(const f in fx)G.rep(f,fx[f]);G.chapter(E.t,E.card);note(`Ending · ${E.t}. ${E.card}`);setTimeout(()=>G.start('m12'),3800);}}]);},120);};
 G.epilogue=()=>{const e=F.ending||'open',E=ENDINGS[e];const L=[E.dess];
  if(F.wokeOne==='dayo'||e!=='chair')L.push(e==='chair'?"":"Sela's brother Dayo sits at the clinic counter most mornings, relearning how to hold a cup. She pretends to scold him for spilling. She cries in the supply closet after. Good tears.");
  L.push(e==='chair'?"Mara came by. She asked if you'd seen Lena. I told her the truth: that you'd know better than me.":"Mara and her sister Lena sat at the counter last night and argued about whose turn it was to pay. Mara lost on purpose. First time I've seen her smile with her teeth.");
  L.push(S.gang.rank?`The Tide calls you ${RANKS[S.gang.rank]} now. Hesk sends a bottle every Sunday. Don't drink it. Honestly. Don't.`:(S.rep.civ||0)>=5?"The street's started calling you the Weatherman. Kip printed stickers. They're terrible. Everyone has one.":"Kip's teaching Juno to skateboard. Juno has fallen forty-one times and logged every one as 'research'.");
  const r=S.rom.who;if(r&&S.rom.st>=3)L.push({mara:"And Mara asked me, very seriously, whether you like your tea with sugar. I said ask them yourself. She said she's trying to surprise you. Lord help us.",sela:"Sela says she's taking a whole night off. First in six years. She was very specific that it's with you. Don't waste it.",ilse:"Ilse handed in her badge and then took it back an hour later. She says it's because the job needs her. She was looking at you when she said it."}[r]);
  L.push("Go on. The city's yours. Walk it. And come back for dinner.");
  return [L.filter(Boolean),[{t:'"Night, Dess."',adv:1}]];};
 // ================= r5d: romance =================
 const ROM={
  mara:{ask:"Mara. When this is over, or before, I don't care which, would you have tea with me? Not business tea.",
   yes:["...You know I'm a terrible idea. I'm a tired woman who used to take your money.","Fine. The sky terrace in Crown, after nine. I have a pass. It's the only dry place I know where nobody owns the view for an hour."],
   d1:{at:[0,-279],y:46,ev:'r5date_mara',label:'Sit with Mara',lines:["Mara is already on the bench, coat collar up, two paper cups of Lumen tea steaming beside her. Below, the whole of Veyra burns pink through the rain.","\"I used to come up here on bad days. I'd look down at Saltgate and try to find the Ladle's sign. It was always flickering. I found that comforting. Something down there refusing to quit.\"","\"Tell me something true. Not nice. True.\""],
    o:[['"I\'m scared I\'ll turn out like the people I\'m fighting."',2,"\"Good. Stay scared. The ones who aren't are the ones I collected for.\" She leans her shoulder against yours."],['"You\'re the most interesting person in this city."',0,"\"That's nice. I asked for true.\" But she's smiling into her tea."],['"I don\'t trust you yet."',1,"\"Thank God. Neither do I.\" She laughs, properly, surprised at herself."]]},
   d2:{at:[52.5,1.6],y:0,ev:'r5date2_mara',label:'Meet Mara by the canal',lines:["Mara is by the canal railing, the water black and full of reflected neon. She's not wearing her badge. You've never seen her without it.","\"Nobody owns the water. I told you that once. I think I wanted it to be true about something.\"","\"I'm not good at this. I'm good at doors and invoices. So I'll just say it. I want to keep seeing you. Whatever happens up there.\""],
    o:[['Take her hand',2,"Her hand is cold and she holds on hard, like she's afraid the rain will wash you off."],['"Me too, Mara."',2,"She exhales, a long breath she's been holding for six years."]]}},
  sela:{ask:"Sela. You're always taking care of everyone. Can I take care of you for one evening?",
   yes:["Oh. Oh, that was smooth. Did you practise that?","...Yes. The houseboat on the canal, the one we brought the medicine to. The family moved out. There's a roof you can sit on. Come after dark."],
   d1:{at:[56,28.6],y:0,ev:'r5date_sela',label:'Climb up to Sela on the houseboat roof',lines:["Sela is sitting cross-legged on the houseboat roof under a patched umbrella, scrubs swapped for an old sweater. She's brought two bowls of your Shoyu, wrapped in a towel to keep them warm.","\"I stole these from your counter. I left money. Mostly.\"","\"Can I tell you what I think about when I can't sleep? Not heartbeats. I lied about that. I think about whether anybody would notice if I stopped.\""],
    o:[['"I would. Every single night."',2,"She looks at you for a long time. Then she puts her head on your shoulder and lets the umbrella tilt, and the rain gets you both, and she laughs."],['"You should take a holiday."',0,"\"Nurse's orders, huh?\" She smiles, but she looks away."],['Say nothing. Sit closer',1,"She leans into you. Neither of you says anything for a long time. It's the best conversation you've had in Veyra."]]},
   d2:{at:[16,-7.1],y:0,ev:'r5date2_sela',label:'Find Sela at the clinic back door',lines:["The clinic's back door, three in the morning. Sela is on the step in her coat, shaking slightly, not from cold.","\"I lost one tonight. A dockworker. Orrin debt, wouldn't come in until it was too late.\"","\"I don't need you to fix it. I just need you to be here. Is that... is that too much to ask of somebody?\""],
    o:[['"Never. I\'m here."',2,"She holds onto your coat with both fists, and breathes, and after a while her shaking stops."],['Sit down next to her on the step',2,"She tucks herself under your arm. The rain drips off the awning in a slow line between your feet."]]}},
  ilse:{ask:"Officer Varn. When you're off duty, would you let me buy you a drink? Not a bribe. A drink.",
   yes:["Heh. The day I take a bribe from a noodle cook is the day I hand in my badge.","...The Rusted Hook in Ashline. Wardline never goes in there, which is the point. Tomorrow night. Don't tell anyone. Especially not my sergeant."],
   d1:{at:[-42,271],y:0,ev:'r5date_ilse',label:'Join Ilse at the bar',lines:["Ilse is at the end of the bar in a battered leather jacket. Without the uniform she looks younger, and more tired. Hesk has left the bottle and gone very deliberately to the other end.","\"I almost didn't come. A cop drinking in Ashline. If anyone sees me I'm finished.\"","\"So here's my question, and I want a real answer. Why does a person like you stay in a city like this?\""],
    o:[['"Because someone has to notice who doesn\'t come back."',2,"She goes very still. \"That's what I said. At the academy. Word for word.\" She clinks her glass against yours."],['"For the noodles."',1,"She snorts into her drink. \"Liar. But a funny one.\""],['"For you, maybe."',0,"\"Too fast, cook.\" But she doesn't move her knee away from yours."]]},
   d2:{at:[-30,60],y:0,ev:'r5date2_ilse',label:'Meet Ilse in the Line 9 Plaza',lines:["Ilse is in uniform in the empty plaza, standing very straight, rain running off her cap. She's holding her badge in her hand instead of wearing it.","\"I filed a report today. The real one. About Orrin, the pods, all of it. They'll bury it. They'll probably bury me.\"","\"I needed someone to know I did it. I wanted it to be you.\""],
    o:[['"I\'m proud of you, Ilse."',2,"She puts the badge back on, slowly, like it's heavier than it used to be and that's fine. Then she kisses you, quick and fierce, and goes back to her beat."],['"Then let them try."',2,"\"Yeah,\" she says, and for the first time since you've known her she grins. \"Let them try.\""]]}}};
 for(const k in ROM){for(const n of['d1','d2']){const D=ROM[k][n],id=`rom_${n}_${k}`;
  G.Q[id]={t:n==='d1'?`A Date with ${G.CAST[k].n.split(' ')[0]}`:`${G.CAST[k].n.split(' ')[0]}, After Midnight`,steps:[{d:D.label+(n==='d1'&&k==='mara'?' (sky terrace, after 21:00)':''),at:D.at,on:'interact:'+D.ev,say:()=>[D.lines,D.o.map(([t,gain,after])=>({t,fx:()=>{rel(k,gain);setTimeout(()=>G.say(k,[after],[{t:'…'}]),60);},adv:1}))]}],done:()=>{S.rom.st=n==='d1'?2:3;toast(n==='d1'?`${G.CAST[k].n} · dating`:`${G.CAST[k].n} · together`);}};
  G.interact.push({id:D.ev,pos:()=>new THREE.Vector3(D.at[0],D.y+1.2,D.at[1]),r:2.8,label:D.label,cond:()=>!!want('interact:'+D.ev)&&(k!=='mara'||n!=='d1'||S.min>=21*60),fn:()=>storyAt('interact:'+D.ev,k)});}}
 const talkOpts=(k,opts)=>{const R=ROM[k];if(!R)return;const st=S.rom.who===k?S.rom.st:0;
  if(!S.rom.who&&relv(k)>=7)opts.splice(1,0,{t:'Ask her out',then:()=>setTimeout(()=>G.say(k,[R.ask],[{t:'(wait)',then:()=>setTimeout(()=>G.say(k,R.yes,[{t:'"It\'s a date."',fx:()=>{S.rom={who:k,st:1};G.start(`rom_d1_${k}`);}}]),60)}]),60)});
  else if(S.rom.who&&S.rom.who!==k&&relv(k)>=7&&!S.flags['romNo'+k]){opts.splice(1,0,{t:'Ask her out',then:()=>{S.flags['romNo'+k]=1;setTimeout(()=>G.say(k,["I've seen the way you look at "+G.CAST[S.rom.who].n.split(' ')[0]+". Don't waste that on me. Go on."],[{t:'"...Yeah."'}]),60);}});}
  else if(st===2&&relv(k)>=9&&G.Q[`rom_d2_${k}`]&&S.q[`rom_d2_${k}`]===undefined)opts.splice(1,0,{t:'"Can I see you tonight?"',fx:()=>G.start(`rom_d2_${k}`)});
  else if(st>=2)opts.splice(1,0,{t:'Steal a quiet moment',then:()=>setTimeout(()=>G.say(k,[pick({mara:["You're late. I mean that affectionately. I've been looking at the door for an hour.","I bought you tea. It's cold. That's your fault."],sela:["Hi. Hi. Sorry, I'm on hour eleven. You look like the best part of it.","Come here. Hold still. You've got rain on your eyelashes."],ilse:["On duty. Can't kiss you. Am thinking about it. That's all, citizen.","I told my sergeant I had a source in Saltgate. He thinks you're an informant. Let's keep it that way."]}[k])],[{t:'♥',fx:()=>{if(S.talkedDay['rom'+k]!==S.day){S.talkedDay['rom'+k]=S.day;rel(k,1);}}}]),60)});};
 // ================= gang membership via Hesk =================
 const heskOpts=()=>{const t=S.rep.tide||0;if(S.gang.rank)return [{t:`Rank: ${RANKS[S.gang.rank]} · ask about Tide work`,then:()=>setTimeout(()=>G.say('Old Hesk',[pick(["Turf's the pier and the roofs. Glass Saints keep sniffing round the east end. If you see them tagging, run them off.","Take the jobs off my board. Your cut goes up with your rank. Loyalty's cheaper than rent down here.","Runner gets a piece. Hook gets a crew. Tidecaller gets my stool when I'm dead. Don't get ideas."])],[{t:'"Got it."'}]),60)}];
  if(t>=3&&S.q.tide_init===undefined)return [{t:'"I want in. The Tide."',then:()=>setTimeout(()=>G.say('Old Hesk',["You've done right by us. People noticed. I noticed.","One job. Sealed tin, from my back room to the end of the pier, after dark. You don't open it. You don't ask. That's the whole test."],[{t:'"Deal."',fx:()=>G.start('tide_init')},{t:'"Not yet."'}]),60)}];
  if(t<3)return [{t:'"How do I get in with the Tide?"',then:()=>setTimeout(()=>G.say('Old Hesk',[`Work my board. Help the docks. Don't help Wardline. You're at ${t}. Come back at 3 and we'll talk.`],[{t:'"Okay."'}]),60)}];return [];};
 G.Q.tide_init={t:'The Sealed Tin',steps:[{d:'Take the sealed tin from behind the Rusted Hook bar',at:[-44,276],on:'interact:r5tin'},{d:'Carry it to the end of the Ashline pier, after dark. Do not open it',at:[70,259],on:'interact:r5drop',say:()=>[["The tin is heavier than it should be. Something inside shifts when you walk. You could pry the lid with a thumbnail.","The pier is empty. Nobody would know."],[{t:'Leave it sealed on the last piling',fx:()=>{F.tinSealed=1;},adv:1},{t:'Open it',fx:()=>{F.tinSealed=0;setTimeout(()=>G.say('Ashline pier',["Inside: sand. Just wet sand. And a note in Hesk's hand: \"Now I know.\""],[{t:'…'}]),60);},adv:1}]]}],
  done:()=>{if(F.tinSealed){S.gang.rank=rankFor(S.rep.tide);G.chapter('Ashline Tide','You are one of them now. Rank: '+RANKS[S.gang.rank]);G.rep('tide',1);note('You joined the Ashline Tide. Turf: the pier and the rooftops. Jobs pay more as you rise.');}else{G.rep('tide',-2);toast('Hesk won\'t offer again for a while.');}}};
 G.interact.push({id:'r5tin',pos:()=>new THREE.Vector3(-44,1.2,276),r:2.2,label:'Take the sealed tin',cond:()=>!!want('interact:r5tin'),fn:()=>{toast('A sealed tin, cold and heavy.');G.emit('interact:r5tin');}});
 G.interact.push({id:'r5drop',pos:()=>new THREE.Vector3(70,1.2,259),r:2.6,label:'Leave the tin',cond:()=>!!want('interact:r5drop')&&(S.min>=21*60||S.min<6*60+1440),fn:()=>storyAt('interact:r5drop','Ashline pier')});
 const staffHook=s0=>{const w=want('staff:'+s0.k);if(w&&w.s.say){storyAt('staff:'+s0.k,s0.k);return true;}return false;};
 const shopOpts=(s0,opts)=>{if(s0.k==='Old Hesk')opts.push(...heskOpts());
  if(s0.shop==='pawn'){const pm=priceMul('pawn');
   if(!S.flags.gq&&!S.gun.has&&!S.gun.impound)opts.unshift({t:'"Got any work?" (errand · earns a pistol)',fx:()=>{S.flags.gq=1;G.say('Ninefingers',["Work. Sure. A net-mender on the quay owes me. Little lockbox, sits on his bench by the water. Go get my chit out of it. He knows, he just doesn't like it.","Bring it back and I'll set you up with something that goes bang. Everybody down here carries. You should too."],[{t:'"On my way."',fx:()=>{G.qStart('gunq');}}]);}});
   for(const k of ['kestrel','warden','rattler'])if(!GN.owned(k)){const g=GUNS[k],c=Math.round(g.price*pm);opts.push({t:`${g.n} · ${g.desc} · ¢${c}`,fx:()=>{if(S.cash<c){toast('Not enough cash');return;}S.cash-=c;GN.give(k,g.mag*2);toast(`${g.n} bought, with two spare mags. A long coat keeps it hidden in Crown.`);G.save();}});}
   const ac=Math.round(18*pm);opts.push({t:`Box of rounds (+24) · ¢${ac}`,fx:()=>{if(S.cash<ac){toast('Not enough cash');return;}S.cash-=ac;S.gun.ammo=(S.gun.ammo||0)+24;toast(`Spare rounds: ${S.gun.ammo}`);G.save();}});}};
 // ================= r5c: dynamic events =================
 const pool=[];const getActor=look=>{let a=pool.find(p=>!p.busy);if(!a){if(pool.length>=5)return null;a={h:G.makeHuman(look)};scene.add(a.h.obj);pool.push(a);}else{scene.remove(a.h.obj);a.h=G.makeHuman(look);scene.add(a.h.obj);}a.busy=1;a.h.obj.visible=true;a.h.obj.rotation.set(0,0,0);return a;};
 const LOOK={tide:()=>({sex:pick(['m','f']),skin:pick([0x8a5a40,0xd8a880,0x5a3828]),top:0x2a2c22,pants:0x1a1a1a,hat:'hood',coat:{color:0x3a2a1a,len:.45},glow:{where:'strip',color:0xff8a3d},gang:'tide'}),
  saint:()=>({sex:'m',skin:pick([0xe8c8b0,0xc89878]),top:0xe8e8f0,pants:0x1a1a22,hair:{style:'spiky',color:0xf0f0f0},coat:{color:0xd8dce8,len:.5,shiny:1},glow:{where:'visor',color:0xffffff},gang:'saint'}),
  cop:()=>({sex:pick(['m','f']),skin:pick([0xe8c8b0,0x8a5a40]),top:0x1e2a44,pants:0x141c30,hat:'cap',hatColor:0x141c30,coat:{color:0x1c2640,len:.6,shiny:1},glow:{where:'collar',color:0x3f8aff},gear:[{t:'pads',col:0x141c30}],gang:'wardline'}),
  civ:()=>({sex:pick(['m','f']),skin:pick([0xe0c0a0,0x6a4030,0xd8a880,0xf0d0b8]),top:pick([0x3a3a48,0x6a2a3a,0x2a6a70]),pants:0x22222a,hair:{style:pick(['bob','long','buzz','bun']),color:0x1a1410},coat:{color:pick([0x2a3444,0x4a2a30,0x34482a]),len:.5}})};
 let ev=null,evT=rnd(40,70),lampMul=1,fight=null;
 const spot=()=>{const f=new THREE.Vector3(-Math.sin(P.yaw),0,-Math.cos(P.yaw));for(let d=14;d>=7;d-=1.5)for(const side of[0,.5,-.5]){const x=P.x+f.x*d+f.z*side*d,z=P.z+f.z*d-f.x*side*d;if(G.walkable(x,z))return [x,z];}return null;};
 const place=(a,x,z,face,anim='idle')=>{a.h.obj.position.set(x,0,z);a.h.obj.rotation.y=face;a.h.play(anim);a.x=x;a.z=z;};
 const fl=new THREE.Group();{const r=new THREE.Mesh(new THREE.BoxGeometry(.5,.12,.2),new THREE.MeshBasicMaterial({color:new THREE.Color(0xff2040).multiplyScalar(3),toneMapped:false})),b=r.clone();b.material=new THREE.MeshBasicMaterial({color:new THREE.Color(0x2050ff).multiplyScalar(3),toneMapped:false});r.position.x=-.3;b.position.x=.3;fl.add(r,b);fl.userData={r,b};const post=new THREE.Mesh(new THREE.BoxGeometry(.08,1.6,.08),new THREE.MeshLambertMaterial({color:0x222}));post.position.y=-.8;fl.add(post);fl.visible=false;scene.add(fl);}
 const flCand={x:0,y:-99,z:0,col:0x6040ff,int:4,dist:10};G.cand.push(flCand);
 const endEvent=()=>{if(!ev)return;for(const a of ev.actors){a.busy=0;a.h.obj.visible=false;}fl.visible=false;flCand.y=-99;ev=null;evT=rnd(70,140);};
 const evInteract={id:'r5event',pos:()=>ev?new THREE.Vector3(ev.x,1.3,ev.z):new THREE.Vector3(0,-99,0),r:4,label:'',cond:()=>!!ev&&!!ev.use&&!fight&&!ev.over,fn:()=>ev&&ev.use()};G.interact.push(evInteract);
 const reg=()=>G.regionOf(P.x,P.z);
 const RUMOR5=()=>pick(F.ending?["They say it rained on the Orrin Tower. Actual rain. On actual bankers.","My cousin woke up in a hospital last week. Says he was a cloud. I believe him, honestly.","You hear the Line 9 hum stopped? First time in years. I can't sleep without it now."]:S.q.m10!==undefined?["Halcyon. That's the name on the white boxes. Like the sleep pods on the billboards.","My aunt says the rain used to stop. When she was a girl. Sundays, sometimes.","Somebody saw Orrin men carrying a box out of a Saltgate walk-up. Box was the size of a person."]:["Another one gone. Lived over the pachinko. Owed Orrin. Of course he did.","Barges at three. No lights. Don't look, don't ask, don't end up on one.","Wardline doubled the checkpoints in Crown. Somebody up there's nervous."]);
 const TYPES={
  shakedown:{w:r=>r==='docks'||r==='mid'?3:0,go:(x,z)=>{const saints=reg()==='docks'||Math.random()<.4;const fac=saints?'saint':'tide';const v=getActor(LOOK.civ()),a=getActor(LOOK[fac]()),b=getActor(LOOK[fac]());if(!v||!a||!b)return null;
    place(v,x,z,0,'talk');place(a,x+1,z-1,Math.atan2(-1,1)+Math.PI,'talk');place(b,x-1,z-1.1,Math.atan2(1,1)+Math.PI,'idle');
    return {actors:[v,a,b],enemies:[a,b],label:saints?'Glass Saints shaking down a vendor · step in':'Tide toughs leaning on a vendor · step in',hint:saints?'Two Glass Saints, white coats, are leaning on a street vendor.':'Two Tide toughs are leaning on a street vendor for protection money.',
     use(){const mem=S.gang.rank>0;const o=[];
      if(!saints&&mem)o.push({t:'"This one\'s under my protection." (Tide rank)',fx:()=>{G.rep('civ',1);toast('They back off with a nod. Rank has its uses.');endEvent();}});
      o.push({t:'Talk them down',fx:()=>{const ok=(S.rep.civ||0)>=2||(saints&&mem)||Math.random()<.45;if(ok){G.rep('civ',1);if(!saints)G.rep('tide',-1);toast('They spit, swear, and leave.');endEvent();}else{toast('"Mind your business." They square up.');if(S.gun.has)startFight(ev,saints?'saint':'tide');}}});
      o.push({t:'Slip the vendor ¢30 to pay them off',fx:()=>{if(S.cash<30){toast('Not enough cash');return;}S.cash-=30;G.rep('civ',1);endEvent();}});
      if(S.gun.has)o.push({t:'Draw your pistol',fx:()=>startFight(ev,saints?'saint':'tide')});
      if(saints&&mem)o.push({t:'Run them off Tide turf',fx:()=>{G.rep('tide',1);G.rep('civ',1);toast('They see the Tide mark and scatter.');endEvent();}});
      o.push({t:'Keep walking'});G.say('Street',[this.hint],o);}};}},
  crackdown:{w:r=>r==='crown'?4:r==='mid'?2:r==='docks'?1.5:0,go:(x,z)=>{const a=getActor(LOOK.cop()),b=getActor(LOOK.cop());if(!a||!b)return null;place(a,x+.8,z,Math.PI/2);place(b,x-.8,z,-Math.PI/2);fl.position.set(x,1.9,z);fl.visible=true;flCand.x=x;flCand.y=3;flCand.z=z;
    return {actors:[a,b],enemies:[a,b],cop:1,stopped:0,label:'Wardline checkpoint',hint:'A Wardline checkpoint: light bar strobing, two officers checking IDs.',use(){stopAt();}};}},
  argue:{w:()=>2,go:(x,z)=>{const a=getActor(LOOK.civ()),b=getActor(LOOK.civ());if(!a||!b)return null;place(a,x+.6,z,-Math.PI/2,'talk');place(b,x-.6,z,Math.PI/2,'talk');
    return {actors:[a,b],label:'Two people arguing · listen in',use(){G.say('Overheard',[RUMOR5()],[{t:'Move on'}]);endEvent();}};}},
  busker:{w:r=>r==='mid'||r==='crown'?2:1,go:(x,z)=>{const a=getActor(LOOK.civ()),b=getActor(LOOK.civ()),c=getActor(LOOK.civ());if(!a||!b||!c)return null;place(a,x,z,0,'talk');place(b,x+1.4,z-1.6,Math.PI*.8);place(c,x-1.3,z-1.7,-Math.PI*.8);
    return {actors:[a,b,c],label:'A busker · toss a coin',use(){if(S.cash>=2){S.cash-=2;}if(Math.random()<.4)G.rep('civ',1);G.say('Busker',[pick(['She plays a song about a city where the rain stopped, once, for an afternoon. The small crowd is very quiet.','He sings in a language you almost know. Two strangers under one umbrella start, shyly, to sway.','A kid with a cracked synth and a voice like broken glass. It is, honestly, beautiful.'])],[{t:'Listen a while'}]);}};}},
  blackout:{w:r=>r==='mid'||r==='docks'?1:0,go:()=>{toast('⚡ Blackout. The neon gutters out. Someone laughs nervously in the dark.');return {actors:[],t:22,blk:1};}},
  turf:{w:r=>r==='docks'&&S.gang.rank>0?3:0,go:(x,z)=>{const a=getActor(LOOK.saint()),b=getActor(LOOK.saint());if(!a||!b)return null;place(a,x+.5,z,0,'talk');place(b,x-.5,z,0,'idle');
    return {actors:[a,b],enemies:[a,b],label:'Glass Saints tagging Tide turf',use(){const o=[{t:S.gang.rank>=2?'Run them off (Runner and up)':'Tell them to leave',fx:()=>{if(S.gang.rank>=2||Math.random()<.5){G.rep('tide',1);toast('They scatter into the rain.');endEvent();}else{toast('"Make us."');if(S.gun.has)startFight(ev,'saint');}}},{t:'Report it to Hesk later',fx:()=>{G.rep('tide',1);endEvent();}}];if(S.gun.has)o.splice(1,0,{t:'Draw your pistol',fx:()=>startFight(ev,'saint')});o.push({t:'Ignore it'});G.say('Tide turf',['Two Glass Saints are spraying a white halo over the Tide mark on the wall.'],o);}};}}};
 function stopAt(){if(!ev||!ev.cop||ev.stopped)return;ev.stopped=1;const w=S.rep.wardline||0;const vis=armedVisible();
  if(w>=5&&!vis){toast('The officer recognises you and waves you through.');return;}
  const o=[];const lines=[vis?'"Hands where I can see them. Is that a weapon?"':pick(['"ID. Where are you headed this late?"','"Low-city visitor. Purpose of your trip?"','"Random check. Arms out."'])];
  o.push({t:'Comply',fx:()=>{if(vis){GN.confiscate();S.cash=Math.max(0,S.cash-80);G.rep('wardline',-1);toast('Gun impounded · fined ¢80. Reclaim it at the Wardline desk.');}else toast('They pat you down and let you go.');}});
  if(relv('ilse')>=6)o.push({t:'"Officer Varn will vouch for me."',fx:()=>{toast('A radio call. A sigh. "Varn says you\'re fine. Go."');}});
  o.push({t:'Bribe ¢60',fx:()=>{if(S.cash<60){toast('Not enough cash');return;}S.cash-=60;if(Math.random()<.75||w<0){G.rep('wardline',-1);toast('The money vanishes. So do they.');}else{G.rep('wardline',-2);S.cash=Math.max(0,S.cash-60);toast('An honest one. Fined double.');}}});
  o.push({t:'Slip away into the crowd',fx:()=>{const night=S.min>=22*60||S.min<1440+300;const ok=Math.random()<(night?.7:.4)+(G.lookClass()==='low'?.1:0);if(ok)toast('You melt into the umbrellas.');else{G.rep('wardline',-2);S.cash=Math.max(0,S.cash-50);toast('Caught · fined ¢50');}}});
  if(vis&&S.gun.has)o.push({t:'Draw on them (bad idea)',fx:()=>startFight(ev,'cop')});
  G.say('Wardline',lines,o);}
 // ================= r5e / R15: gunplay (guns.js does the weapons, VFX and the firefight) =================
 const ui=document.createElement('div');ui.id='fight';ui.className='hide';ui.innerHTML='<div class="fhp"><i></i></div><button id="fBack">Back off</button><div class="fx"></div>';document.body.appendChild(ui);
 const st=document.createElement('style');st.textContent='#fight{position:fixed;inset:0;pointer-events:none;z-index:27}#fight.hide{display:none}#fight .fhp{position:absolute;left:50%;bottom:calc(env(safe-area-inset-bottom) + 30px);transform:translateX(-50%);width:200px;height:7px;background:#2228;border:1px solid #ff3fa488;border-radius:4px;overflow:hidden}#fight .fhp i{display:block;height:100%;background:linear-gradient(90deg,#ff2040,#ff8fd0);width:100%;transition:width .15s}#fight button{pointer-events:auto;position:absolute;border:1px solid #ff3fa4aa;background:#1a0814cc;color:#ffd0e8;font:700 12px system-ui;border-radius:24px;left:calc(env(safe-area-inset-left) + 22px);top:58px;padding:12px 18px;letter-spacing:.06em}#fight .fx{position:absolute;inset:0;background:radial-gradient(transparent 50%,#ff204077);opacity:0;transition:opacity .25s}';document.head.appendChild(st);
 const upd=()=>{ui.querySelector('.fhp i').style.width=Math.max(0,S.hp)+'%';};
 GN=initGuns(G,{region:()=>reg(),fighting:()=>!!fight,
  hurt:d=>{if(!fight)return;S.hp-=d;const fx=ui.querySelector('.fx');fx.style.opacity=1;setTimeout(()=>fx.style.opacity=0,200);upd();if(S.hp<=0)down();},
  bystanders:()=>ev&&ev.enemies&&!fight?ev.enemies:[],
  provoke:a=>{if(!ev||fight)return;const fac=ev.cop?'cop':ev.type==='turf'?'saint':(ev.label||'').includes('Saints')?'saint':'tide';toast(ev.cop?'You shot at the Wardline. This will follow you.':'They go for their guns.');startFight(ev,fac);},
  publicShot:n=>{if(n===1)toast('Gunfire. Screams down the street. Someone is already calling the Wardline.');G.rep('civ',-1);if(reg()==='crown'||n%3===0){G.rep('wardline',-1);if(!ev&&!fight){forceType='crackdown';evT=Math.min(evT,6);}}},
  heat:()=>{if(ev||fight)return;toast('A drawn gun in the open. A Wardline drone clocks you.');forceType='crackdown';evT=4;},
  onKill:()=>{}});
 if(S.gun.has&&!S.flags.gunHint)S.flags.gunHint=1;
 rankGun(S.gang.rank||0);
 // Ninefingers' errand: a short early job that ends with a starter pistol
 {const BX=46,BZ=262;G.Q.gunq={t:"Ninefingers' errand",steps:[{d:"Get Ninefingers' chit from the lockbox on the quay",at:[BX,BZ],on:'gq:0'},{d:'Bring the chit back to Ninefingers',at:[25.5,251],on:'gq:1'}],done:()=>{GN.give('kestrel',24);toast('Ninefingers hands you a Kestrel 9 and two spare mags.');setTimeout(()=>G.say('Ninefingers',["Kestrel 9. Old Ward surplus, I filed the numbers off myself. Pulls a little left. So do I.","Rounds are cheap here, expensive in the clinic. Keep it under a coat up in Crown and the Wardline never has to know."],[{t:'"Thanks."'}]),300);G.save();}};
  const box=new THREE.Group();box.position.set(BX,0,BZ);scene.add(box);const m1=new THREE.Mesh(new THREE.BoxGeometry(.5,.32,.36),new THREE.MeshStandardMaterial({color:0x3a3f44,metalness:.6,roughness:.45}));m1.position.y=.62;box.add(m1);const bench=new THREE.Mesh(new THREE.BoxGeometry(1.4,.46,.5),new THREE.MeshStandardMaterial({color:0x4a3a2a,roughness:.9}));bench.position.y=.23;box.add(bench);const lamp=new THREE.Mesh(new THREE.BoxGeometry(.05,.05,.02),new THREE.MeshBasicMaterial({color:new THREE.Color(0xff8a3d).multiplyScalar(3),toneMapped:false}));lamp.position.set(.12,.7,.19);box.add(lamp);
  G.interact.push({id:'gq0',pos:()=>new THREE.Vector3(BX,.9,BZ),r:2.4,label:'Open the lockbox',cond:()=>S.q.gunq===0,fn:()=>{toast('A greasy chit, a tooth, and a note: "Tell her I\'m sorry." You take the chit.');G.emit('gq:0');}});
  G.interact.push({id:'gq1',pos:()=>new THREE.Vector3(25.5,1.2,249.6),r:2.6,label:'Hand Ninefingers the chit',cond:()=>S.q.gunq===1,fn:()=>G.emit('gq:1')});
  if(S.q.gunq!==undefined&&S.q.gunq!=='done')S.flags.gq=1;}
 // Wardline desk: get an impounded gun back
 {const wb=G.interact.find(i=>i.id==='boardward');const wp=wb?wb.pos():new THREE.Vector3(0,1.2,-250);G.interact.push({id:'impound',pos:()=>wp.clone().add(new THREE.Vector3(1.6,0,0)),r:2.4,label:'Wardline desk · reclaim your gun',cond:()=>!!S.gun.impound,fn:()=>{const c=Math.round(120*(1+Math.max(0,-(S.rep.wardline||0))*.05));G.say('Wardline desk',['"Impound. Name? ... Right. Release fee is ¢'+c+'. Cash. No, we don\'t take Tide scrip."'],[{t:`Pay ¢${c}`,fx:()=>{if(S.cash<c){toast('Not enough cash');return;}S.cash-=c;GN.recover();toast('Your gun comes back in a plastic bag with a receipt.');G.save();}},{t:'"Later."'}]);}});
  window.__mapIcons=()=>{const L=[[25.5,249,'⌖','#ff8a3d',8]];if(S.gun.impound)L.push([wp.x+1.6,wp.z,'⌖','#3f8aff',8]);if(S.q.gunq===0)L.push([46,262,'!','#ff8a3d',7]);return L;};}
 function startFight(e,fac){if(!e||fight||!S.gun.has)return;fight={e,fac};S.hp=100;ui.classList.remove('hide');upd();
  for(const a of e.enemies)a.h.obj.rotation.y=Math.atan2(P.x-a.x,P.z-a.z);
  GN.startFight(e.enemies,fac,{won:()=>endFight(true)});
  toast(fac==='cop'?'You drew on the Wardline. This will follow you.':'Weapons out. Keep moving. They break for cover when hit.');if(fac==='cop')G.rep('wardline',-4);}
 const endFight=(won)=>{if(!fight)return;ui.classList.add('hide');const f=fight;fight=null;GN.endFight();f.e.over=1;if(won){const loot=Math.round(rnd(20,60));S.cash+=loot;toast(`It's over. Your hands won't stop shaking. +¢${loot}`);if(f.fac==='saint'){G.rep('tide',1);G.rep('civ',1);}else if(f.fac==='tide')G.rep('tide',-3);G.rep('civ',f.fac==='cop'?-2:0);}
  setTimeout(()=>{if(!fight&&ev===f.e)endEvent();},won?9000:0);};
 const down=()=>{endFight(false);S.gun.drawn=0;G.fade();setTimeout(()=>{Object.assign(P,{x:16,z:-5.5,y:0,yaw:0});const lost=Math.round(S.cash*.15);S.cash-=lost;S.hp=100;G.say('sela',["Hey. Hey. Eyes on me. You're at the clinic. Someone dragged you in out of the rain.",relv('sela')>=6?"Don't you ever do that to me again. I mean it. I'll kill you myself.":"Two cracked ribs, a graze, and a wallet that's ¢"+lost+" lighter. Guns are for idiots. Stay an idiot somewhere else."],[{t:'"Ow."'}]);},400);};
 ui.querySelector('#fBack').onpointerdown=e=>{e.stopPropagation();if(!fight)return;toast(fight.fac==='cop'?'You run. Sirens behind you, then only rain.':'You back away, hands up. They let you go, laughing.');if(fight.fac!=='cop')G.rep('civ',-1);endFight(false);};
 // ================= tick =================
 let lastReg=null;
 const tick=(dt,T)=>{GN.tick(dt);
  const r=reg();if(r!==lastReg){if(r==='docks'&&S.gang.rank)toast(`Tide turf. A dockhand touches two fingers to his hood. "${RANKS[S.gang.rank]}."`);if(r==='crown'&&S.gun.has&&!ev&&!G.dlg()){if(armedVisible()){evT=0;forceType='crackdown';}else toast('Pistol hidden under your coat.');}if(r==='docks'&&(S.rep.tide||0)<=-3&&!ev){evT=Math.min(evT,8);}lastReg=r;}
  if(fight){for(const a of fight.e.actors)if(!fight.e.enemies.includes(a)){a.h.mixer&&a.h.mixer.update(dt);}return;}
  if(S.hp<100)S.hp=Math.min(100,S.hp+dt*4);
  if(ev&&ev.over)return;
  if(ev){for(const a of ev.actors){a.h.mixer&&a.h.mixer.update(dt);const d=Math.hypot(a.x-cam.position.x,a.z-cam.position.z);a.h.lod&&a.h.lod(d,dt);}
   if(ev.blk){ev.t-=dt;lampMul=.12+(Math.random()<.05?.6:0);if(ev.t<=0){lampMul=1;toast('The power stutters back. Somebody cheers.');endEvent();}}
   else{const d=Math.hypot(P.x-ev.x,P.z-ev.z);if(ev.cop&&d<5&&!ev.stopped&&!G.dlg()&&(armedVisible()||(S.rep.wardline||0)<=-3||Math.random()<.5))stopAt();if(ev.cop&&!ev.stopped&&d<5)ev.stopped=1;
    if(fl.visible){const on=Math.floor(T*6)%2;fl.userData.r.visible=!!on;fl.userData.b.visible=!on;}
    ev.life-=dt;if(d>60||ev.life<=0||P.z>500)endEvent();}
   evInteract.label=ev&&ev.label||'';return;}
  if(G.dlg()||P.z>500||P.y>20||G.riding())return;evT-=dt;if(evT>0)return;
  const types=Object.entries(TYPES).filter(([k,t])=>forceType?k===forceType:t.w(r)>0);forceType=null;if(!types.length){evT=30;return;}let tot=types.reduce((s,[k,t])=>s+t.w(r),0),roll=Math.random()*tot,ch=types[0];for(const t of types){roll-=t[1].w(r);if(roll<=0){ch=t;break;}}
  const sp=spot();if(!sp){evT=10;return;}const e=ch[1].go(sp[0],sp[1]);if(!e){evT=20;return;}e.type=ch[0];e.x=sp[0];e.z=sp[1];e.life=e.life||120;ev=e;};
 let forceType=null;
 const lifeHTML=()=>{let h=Object.keys(FNS).map(f=>`<div class="row"><span>${FNS[f]}<br><small>${mood(f)}${f==='tide'&&S.gang.rank?` · member, rank ${RANKS[S.gang.rank]}`:''}</small></span><span>${S.rep[f]||0}</span></div>`).join('');
  if(S.rom.who)h+=`<div class="row"><span>${G.CAST[S.rom.who].n}<br><small>${['','first date set','dating','together'][S.rom.st]||''}</small></span><span>♥</span></div>`;
  if(S.gun.has)h+=`<div class="row"><span>${(S.gun.owned||[]).map(k=>GUNS[k].n).join(', ')} · ${S.gun.ammo} spare rounds<br><small>${S.gun.drawn?'drawn: everyone can see it':concealed()?'holstered under your coat':'holstered, visible: Wardline and Crown will notice'}</small></span><span>⚠</span></div>`;if(S.gun.impound)h+=`<div class="row"><span>Gun impounded<br><small>reclaim it at the Wardline desk in Crown</small></span><span>⌖</span></div>`;return h;};
 return {force:t=>{endEvent();forceType=t;evT=0;},clear:()=>{if(fight){ui.classList.add('hide');fight=null;GN.endFight();}endEvent();},guns:GN,forceFight:(e,f)=>startFight(e,f),get ev(){return ev;},tick,priceMul,jobDone,talkOpts,staffHook,shopOpts,lifeHTML,get lampMul(){return lampMul;},get fighting(){return !!fight;}};}
