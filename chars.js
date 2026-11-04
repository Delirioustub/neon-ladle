// Animated humanoids: one CC0 mannequin rig (Quaternius UAL), cloned + tinted + accessorised per character.
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
let base=null,clips={};
export async function loadRig(url){const g=await new GLTFLoader().loadAsync(url);base=g.scene;for(const c of g.animations)clips[c.name]=c;return g;}
const A={idle:'Idle_Loop',walk:'Walk_Loop',talk:'Idle_Talking_Loop',sit:'Sitting_Idle_Loop',interact:'Interact',jog:'Jog_Fwd_Loop',formal:'Walk_Formal_Loop'};
const lam=(c,e=0)=>new THREE.MeshLambertMaterial({color:c,emissive:e});
const glow=c=>new THREE.MeshBasicMaterial({color:new THREE.Color(c).multiplyScalar(2.2),toneMapped:false});
// outfits: a skinned 'shell' built from the body mesh itself (vertices dominated by chosen bones, pushed out along normals) so clothes deform with the rig
const COAT=/spine|upper_arm|shoulder|neck/,COAT_LONG=/spine|upper_arm|shoulder|neck|hips|thigh/,PANTS=/hips|thigh|shin/,APRON=/spine\.001|spine\.002|hips/;
const shellCache=new Map();
function shell(root,color,re,push,frontOnly){let sk=null;root.traverse(o=>{if(o.isSkinnedMesh&&!sk&&!o.userData.shell)sk=o;});if(!sk)return;
 const key=re.source+push+(frontOnly?1:0);let geo=shellCache.get(key);
 if(!geo){const g=sk.geometry;const si=g.attributes.skinIndex,sw=g.attributes.skinWeight,pos=g.attributes.position,nor=g.attributes.normal;const bones=sk.skeleton.bones;
  const ok=new Uint8Array(pos.count);for(let v=0;v<pos.count;v++){let best=0,bi=0;for(let c=0;c<4;c++){const w=sw.getComponent(v,c);if(w>best){best=w;bi=si.getComponent(v,c);}}ok[v]=re.test(bones[bi].name)&&(!frontOnly||nor.getZ(v)>.25)?1:0;}
  geo=g.clone();const p=geo.attributes.position;for(let v=0;v<p.count;v++)p.setXYZ(v,p.getX(v)+nor.getX(v)*push,p.getY(v)+nor.getY(v)*push,p.getZ(v)+nor.getZ(v)*push);
  const idx=g.index.array,out=[];for(let i=0;i<idx.length;i+=3)if(ok[idx[i]]&&ok[idx[i+1]]&&ok[idx[i+2]])out.push(idx[i],idx[i+1],idx[i+2]);geo.setIndex(out);geo.clearGroups();shellCache.set(key,geo);}
 const m=new THREE.SkinnedMesh(geo,new THREE.MeshStandardMaterial({color,roughness:.7,metalness:.05}));m.userData.shell=1;m.frustumCulled=false;m.bind(sk.skeleton,sk.bindMatrix);sk.parent.add(m);}
// look = {skin, body, joints, hair:{style,color}, hat, coat:{color,len}, glow:{where,color}, scale}
export function makeHuman(look){const root=SkeletonUtils.clone(base);const H=new THREE.Group();H.add(root);const s=(look.scale||1)*.95;root.scale.set(s*(look.slim||1),s,s*(look.slim||1));
 const bones={};root.traverse(o=>{if(o.isBone)bones[o.name]=o;if(o.isMesh){o.frustumCulled=false;o.castShadow=false;
   const mats=Array.isArray(o.material)?o.material:[o.material];const nm=mats.map(m=>{const n=new THREE.MeshStandardMaterial({color:m.name==='M_Joints'?look.joints:look.body,roughness:.55,metalness:.15});n.name=m.name;return n;});o.material=Array.isArray(o.material)?nm:nm[0];}});
 const att=(bone,mesh,p,r)=>{const b=bones[bone];if(!b)return;mesh.position.set(...p);if(r)mesh.rotation.set(...r);b.add(mesh);};
 const head=bones['DEF-head'];
 // head/face: skin sphere over mannequin head + visor/eyes
 const hs=look.skin;att('DEF-head',new THREE.Mesh(new THREE.SphereGeometry(.118,14,10),lam(hs)),[0,.1,.01]);
 const eye=new THREE.MeshBasicMaterial({color:0x0a0810});for(const e of[-1,1])att('DEF-head',new THREE.Mesh(new THREE.BoxGeometry(.022,.014,.01),eye),[e*.04,.11,.112]);
 const hc=look.hair?.color||0x111111,hm=lam(hc);const hst=look.hair?.style;
 const backHair=(th,r=.135)=>new THREE.Mesh(new THREE.SphereGeometry(r,16,12,Math.PI*.8,Math.PI*1.4,0,Math.PI*th),hm);
 if(hst==='bob'){hm.side=THREE.DoubleSide;att('DEF-head',backHair(.72),[0,.1,-.008]);att('DEF-head',new THREE.Mesh(new THREE.SphereGeometry(.128,14,8,0,Math.PI*2,0,Math.PI*.32),hm),[0,.112,.004],[.25,0,0]);}
 else if(hst==='bun'){att('DEF-head',new THREE.Mesh(new THREE.SphereGeometry(.125,14,10,0,Math.PI*2,0,Math.PI*.55),hm),[0,.13,-.01]);att('DEF-head',new THREE.Mesh(new THREE.SphereGeometry(.06,10,8),hm),[0,.2,-.09]);}
 else if(hst==='spiky'){att('DEF-head',new THREE.Mesh(new THREE.SphereGeometry(.125,12,8,0,Math.PI*2,0,Math.PI*.5),hm),[0,.13,0]);for(let i=0;i<6;i++){const c=new THREE.Mesh(new THREE.ConeGeometry(.035,.12,5),hm);att('DEF-head',c,[Math.cos(i)*.07,.24,Math.sin(i)*.07-.02],[Math.sin(i)*.5,0,Math.cos(i)*.5]);}}
 else if(hst==='long'){hm.side=THREE.DoubleSide;att('DEF-head',backHair(.8,.137),[0,.1,-.01]);att('DEF-head',new THREE.Mesh(new THREE.SphereGeometry(.128,14,8,0,Math.PI*2,0,Math.PI*.3),hm),[0,.112,.004],[.3,0,0]);att('DEF-head',new THREE.Mesh(new THREE.BoxGeometry(.22,.3,.06),hm),[0,-.02,-.1]);}
 else if(hst==='short'){att('DEF-head',new THREE.Mesh(new THREE.SphereGeometry(.124,12,8,0,Math.PI*2,0,Math.PI*.45),hm),[0,.135,-.005]);}
 if(look.hat==='cap'){const c=lam(look.hatColor||0x222);att('DEF-head',new THREE.Mesh(new THREE.CylinderGeometry(.13,.13,.07,14),c),[0,.2,0]);att('DEF-head',new THREE.Mesh(new THREE.BoxGeometry(.2,.015,.12),c),[0,.17,.12]);}
 if(look.hat==='beanie')att('DEF-head',new THREE.Mesh(new THREE.SphereGeometry(.132,14,10,0,Math.PI*2,0,Math.PI*.5),lam(look.hatColor||0x5a2030)),[0,.13,0]);
 if(look.hat==='hood'){const hm2=lam(look.coat?.color||0x222);hm2.side=THREE.DoubleSide;att('DEF-head',new THREE.Mesh(new THREE.SphereGeometry(.16,16,12,Math.PI*.82,Math.PI*1.36,0,Math.PI*.7),hm2),[0,.1,-.03]);}
 if(look.glow){const g=glow(look.glow.color);if(look.glow.where==='visor')att('DEF-head',new THREE.Mesh(new THREE.BoxGeometry(.2,.035,.03),g),[0,.115,.115]);
  if(look.glow.where==='phones'){for(const e of[-1,1])att('DEF-head',new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,.03,10),g),[e*.125,.1,0],[0,0,Math.PI/2]);att('DEF-head',new THREE.Mesh(new THREE.TorusGeometry(.13,.012,6,16,Math.PI),lam(0x222)),[0,.12,0],[0,Math.PI/2,0]);}
  if(look.glow.where==='collar')att('DEF-spine.003',new THREE.Mesh(new THREE.TorusGeometry(.11,.012,6,16),g),[0,.2,0],[Math.PI/2,0,0]);
  if(look.glow.where==='badge')att('DEF-spine.003',new THREE.Mesh(new THREE.BoxGeometry(.06,.04,.01),g),[.08,.08,.13]);
  if(look.glow.where==='strip')att('DEF-spine.003',new THREE.Mesh(new THREE.BoxGeometry(.01,.26,.01),g),[.06,0,.15]);}
 if(look.coat)shell(root,look.coat.color,look.coat.len>.55?COAT_LONG:COAT,.022);
 if(look.pants)shell(root,look.pants,PANTS,.012);
 if(look.apron)shell(root,look.apron,APRON,.03,true);
 if(look.umbrella){const u=new THREE.Group();const c=new THREE.Mesh(new THREE.ConeGeometry(.55,.22,10,1,true),new THREE.MeshLambertMaterial({color:look.umbrella,side:THREE.DoubleSide,transparent:true,opacity:.75,emissive:new THREE.Color(look.umbrella).multiplyScalar(.25)}));c.position.y=.75;u.add(c);const st=new THREE.Mesh(new THREE.CylinderGeometry(.008,.008,.75),lam(0x222));st.position.y=.37;u.add(st);
  const hb=bones['DEF-spine.003'];if(hb){hb.add(u);u.position.set(.16,.05,.12);H.userData.umb=u;}}
 const mixer=new THREE.AnimationMixer(root);const acts={};for(const k in A)if(clips[A[k]]){acts[k]=mixer.clipAction(clips[A[k]]);}
 if(acts.interact){acts.interact.setLoop(THREE.LoopOnce);acts.interact.clampWhenFinished=true;}
 let cur=null;const play=(k,fade=.3)=>{if(cur===k||!acts[k])return;const n=acts[k];n.reset().fadeIn(fade).play();if(cur&&acts[cur])acts[cur].fadeOut(fade);cur=k;};play('idle',0);mixer.update(Math.random()*3);
 return {obj:H,mixer,play,bones,get anim(){return cur;}};}
