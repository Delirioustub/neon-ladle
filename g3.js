// R12: Grab3D CC0 rigged humans (decimated: ~15k tris "hi" for cast/player, ~6k "lo" for crowds) + Quaternius CC0 small robots.
// The 8 Universal Animation Library clips (authored on the UBC skeleton) are retargeted onto each Grab3D skeleton at load time:
// per mapped bone, world-space rotation delta from the source bind pose, pre-aligned so target bone directions match source bone directions
// at bind (handles A-pose vs T-pose), hips translation scaled by leg length. Looks get a clothing tint (skin-preserving shader), neon trims
// on bones (class/gang coloured), and glow accessories.
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
export const BODIES=['woman','man','businessman','police-officer','teen-character','sci-fi-soldier','ninja','android','cyborg'];
const HEIGHT={woman:1.7,man:1.8,businessman:1.8,'police-officer':1.8,'teen-character':1.66,'sci-fi-soldier':1.84,ninja:1.78,android:1.78,cyborg:1.74};
const SIDE=s=>s==='l'?'Left':'Right';
const MAP={pelvis:'Hips',spine_01:'Spine02',spine_02:'Spine01',spine_03:'Spine',neck_01:'neck',Head:'Head'};
for(const s of['l','r']){const S=SIDE(s);Object.assign(MAP,{['clavicle_'+s]:S+'Shoulder',['upperarm_'+s]:S+'Arm',['lowerarm_'+s]:S+'ForeArm',['hand_'+s]:S+'Hand',['thigh_'+s]:S+'UpLeg',['calf_'+s]:S+'Leg',['foot_'+s]:S+'Foot',['ball_'+s]:S+'ToeBase'});
 for(const f of['index','middle','ring','pinky','thumb'])for(const i of[1,2,3])MAP[`${f}_0${i}_${s}`]=`${S}Hand${f[0].toUpperCase()+f.slice(1)}${i}`;}
const CHILD={pelvis:'spine_01',spine_01:'spine_02',spine_02:'spine_03',spine_03:'neck_01',neck_01:'Head'};
for(const s of['l','r']){Object.assign(CHILD,{['clavicle_'+s]:'upperarm_'+s,['upperarm_'+s]:'lowerarm_'+s,['lowerarm_'+s]:'hand_'+s,['hand_'+s]:'middle_01_'+s,['thigh_'+s]:'calf_'+s,['calf_'+s]:'foot_'+s,['foot_'+s]:'ball_'+s});
 for(const f of['index','middle','ring','pinky','thumb'])for(const i of[1,2])CHILD[`${f}_0${i}_${s}`]=`${f}_0${i+1}_${s}`;}
const LIB={hi:{},lo:{}},CLIPS={},ROBO={};let SRC=null,SRCCLIPS=null;
export const g3Ready=()=>!!LIB.lo.man;
export async function loadG3(dir,srcScene,srcClips,hiSet){const L=new GLTFLoader();SRC=srcScene;SRCCLIPS=srcClips;
 const jobs=[];for(const b of BODIES){jobs.push(L.loadAsync(`${dir}g3/${b}-lo.glb`).then(g=>LIB.lo[b]=prep(g.scene,b)));if(hiSet.includes(b))jobs.push(L.loadAsync(`${dir}g3/${b}-hi.glb`).then(g=>LIB.hi[b]=prep(g.scene,b)));}
 for(const r of ['CP_Flying','CP_Robot_2Legs','Enemy_EyeDrone','Enemy_Trilobite','Enemy_QuadShell'])jobs.push(L.loadAsync(`${dir}robots/${r}.glb`).then(g=>ROBO[r]={scene:g.scene,clips:g.animations}).catch(()=>{}));
 await Promise.all(jobs);}
function prep(scene,b){let sk=null;scene.traverse(o=>{if(o.isSkinnedMesh){sk=o;o.frustumCulled=false;}});return {scene,b};}
const bonesOf=root=>{const m={};root.traverse(o=>{if(o.isBone)m[o.name]=o;});return m;};
// ---------- retarget (once per body kind; the lo and hi files share the skeleton) ----------
function retargetAll(b,tgtRoot){if(CLIPS[b])return CLIPS[b];
 const src=SkeletonUtils.clone(SRC);let ssk;src.traverse(o=>{if(o.isSkinnedMesh&&!ssk)ssk=o;});ssk.skeleton.pose();src.updateMatrixWorld(true);
 const tgt=SkeletonUtils.clone(tgtRoot);let tsk;tgt.traverse(o=>{if(o.isSkinnedMesh&&!tsk)tsk=o;});tsk.skeleton.pose();tgt.updateMatrixWorld(true);
 const SB=bonesOf(src),TB=bonesOf(tgt);const pairs=[];const q=new THREE.Quaternion(),v=new THREE.Vector3(),v2=new THREE.Vector3();
 for(const s in MAP){const t=TB[MAP[s]];if(!SB[s]||!t)continue;const qs0=SB[s].getWorldQuaternion(new THREE.Quaternion()),qt0=t.getWorldQuaternion(new THREE.Quaternion());let C=new THREE.Quaternion();
  const sc=CHILD[s];if(sc&&SB[sc]&&TB[MAP[sc]]&&s!=='pelvis'){const ds=SB[sc].getWorldPosition(new THREE.Vector3()).sub(SB[s].getWorldPosition(v)).normalize(),dt=TB[MAP[sc]].getWorldPosition(new THREE.Vector3()).sub(t.getWorldPosition(v2)).normalize();C.setFromUnitVectors(dt,ds);}
  pairs.push({s:SB[s],t,pre:C.multiply(qt0),qs0i:qs0.invert()});}
 const order=[];tgt.traverse(o=>{if(o.isBone){const p=pairs.find(p=>p.t===o);if(p)order.push(p);}});
 const sh=SB.pelvis.getWorldPosition(new THREE.Vector3()),th=TB.Hips.getWorldPosition(new THREE.Vector3());const k=th.y/sh.y;const thp=TB.Hips.parent;
 const out={};const mixer=new THREE.AnimationMixer(src);
 for(const name in SRCCLIPS){const clip=SRCCLIPS[name];const act=mixer.clipAction(clip);act.play();const fps=30,n=Math.max(2,Math.ceil(clip.duration*fps)+1);const times=new Float32Array(n);const Q={},Pv=new Float32Array(n*3);for(const p of order)Q[p.t.name]=new Float32Array(n*4);
  for(let i=0;i<n;i++){const t=Math.min(clip.duration,i/fps);times[i]=t;act.time=t;mixer.update(0);src.updateMatrixWorld(true);
   const hp=SB.pelvis.getWorldPosition(new THREE.Vector3()).sub(sh).multiplyScalar(k).add(th);thp.worldToLocal(hp);TB.Hips.position.copy(hp);TB.Hips.updateMatrixWorld(false);
   for(const p of order){p.s.getWorldQuaternion(q);q.multiply(p.qs0i).multiply(p.pre);const pq=p.t.parent.getWorldQuaternion(new THREE.Quaternion()).invert();p.t.quaternion.copy(pq.multiply(q));p.t.updateMatrixWorld(true);p.t.quaternion.toArray(Q[p.t.name],i*4);}
   TB.Hips.position.toArray(Pv,i*3);}
  act.stop();const tracks=order.map(p=>new THREE.QuaternionKeyframeTrack(p.t.name+'.quaternion',times,Q[p.t.name]));tracks.push(new THREE.VectorKeyframeTrack('Hips.position',times,Pv));out[name]=new THREE.AnimationClip(name,clip.duration,tracks);}
 return CLIPS[b]=out;}
// ---------- materials ----------
const RIM=new THREE.Color(0x8a6cff);
function skinMat(src,tint,str,rimC,metal,neckH){const m=new THREE.MeshStandardMaterial({map:src.map||null,normalMap:null,color:0xffffff,roughness:metal?.35:.78,metalness:metal?.55:0,emissive:0x000000});
 m.onBeforeCompile=s=>{s.uniforms.tintC={value:new THREE.Color(tint)};s.uniforms.tintS={value:str};s.uniforms.rimC={value:rimC||RIM};s.uniforms.rimS={value:.5};s.uniforms.neckH={value:neckH??1e9};s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying float vH;').replace('#include <begin_vertex>','#include <begin_vertex>\nvH=position.y;');
  s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nuniform vec3 tintC;uniform float tintS;uniform float neckH;varying float vH;uniform vec3 rimC;uniform float rimS;')
  .replace('#include <map_fragment>','#include <map_fragment>\n{vec3 c=diffuseColor.rgb;float mx=max(c.r,max(c.g,c.b)),mn=min(c.r,min(c.g,c.b));float sat=(mx-mn)/(mx+.001);float skin=smoothstep(.02,.08,c.r-c.g)*smoothstep(-.01,.03,c.g-c.b)*smoothstep(.04,.12,c.r)*(1.-smoothstep(.62,.8,sat));float l=dot(c,vec3(.3,.59,.11));vec3 t=tintC*l*2.4;diffuseColor.rgb=mix(c,mix(c,t,tintS),(1.-skin)*(1.-smoothstep(neckH-.04*abs(neckH),neckH,vH)));}')
  .replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n{float r=1.0-saturate(dot(normalize(vNormal),normalize(vViewPosition)));totalEmissiveRadiance+=rimC*rimS*r*r*r;}');};
 m.customProgramCacheKey=()=>'g3tint';return m;}
const glowM=c=>new THREE.MeshBasicMaterial({color:new THREE.Color(c).multiplyScalar(2.4),toneMapped:false});
const stdM=(c,r=.6,m=.2)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m});
// ---------- body pick ----------
const hash=o=>{let h=7;const s=JSON.stringify(o);for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))|0;return Math.abs(h);};
export function bodyFor(look){if(look.body&&BODIES.includes(look.body))return look.body;const h=hash(look);
 if(look.android)return h%2?'android':'cyborg';if(look.gang==='wardline'||(look.hat==='cap'&&look.top===0x1e2a44))return 'police-officer';
 if(look.gang==='tide')return ['ninja','man','teen-character'][h%3];if(look.gang==='saint')return 'sci-fi-soldier';
 if(look.sex==='f')return h%5===0?'teen-character':'woman';
 if(look.cls==='rich')return h%4===0?'man':'businessman';if(look.cls==='poor')return ['man','teen-character','sci-fi-soldier','man'][h%4];
 return ['man','teen-character','businessman','man','sci-fi-soldier'][h%5];}
const TRIM={rich:[0xffe0a0,0xffffff,0xf0d890],mid:[0x3ff0ff,0xff3fa4,0x5dff9b,0xb04dff,0xffe14d],poor:[0xff8a3d,0xc06a30,0x8a7a5a],tide:[0xff8a3d],saint:[0xffffff],wardline:[0x3f8aff],orrin:[0xc9b2ff]};
const A={idle:'Idle_Loop',walk:'Walk_Loop',talk:'Idle_Talking_Loop',sit:'Sitting_Idle_Loop',sittalk:'Sitting_Talking_Loop',interact:'Interact',jog:'Jog_Fwd_Loop',formal:'Walk_Formal_Loop'};
export function makeG3(look,hi){const b=bodyFor(look);const lib=(hi&&LIB.hi[b])||LIB.lo[b];const root=SkeletonUtils.clone(lib.scene);const H=new THREE.Group();H.userData.human=1;H.add(root);
 const h=hash(look),cls=look.gang||look.cls||'mid',pal=TRIM[cls]||TRIM.mid,trim=look.trim??(look.glow?.color??pal[h%pal.length]);
 const tint=look.top??0x8a8a8a,str=look.tintS??(b==='android'||b==='cyborg'?.35:cls==='rich'?.35:cls==='poor'?.45:.55);
 let sk=null;root.traverse(o=>{if(o.isSkinnedMesh&&!sk)sk=o;});sk.skeleton.pose();root.updateMatrixWorld(true);const nb=bonesOf(root).neck;
root.traverse(o=>{if(o.isMesh){o.material=skinMat(Array.isArray(o.material)?o.material[0]:o.material,cls==='poor'?new THREE.Color(tint).lerp(new THREE.Color(0x6a5a48),.4).getHex():tint,str,new THREE.Color(trim).multiplyScalar(.45),b==='android'||b==='cyborg',nb?o.worldToLocal(nb.getWorldPosition(new THREE.Vector3())).y:null);o.castShadow=false;}});

 // normalise height + stand on y=0
 const ht=HEIGHT[b]*(look.scale?Math.min(1.05,Math.max(.95,look.scale)):1)*(look.sex==='f'&&b!=='woman'?.97:1);{const B0=bonesOf(root);const hy=B0.Hips.getWorldPosition(new THREE.Vector3()).y,ty=(B0.LeftToeBase||B0.LeftFoot).getWorldPosition(new THREE.Vector3()).y;const s=ht*.51/(hy-ty);root.scale.multiplyScalar(s);root.updateMatrixWorld(true);root.position.y=-B0.LeftToeBase.getWorldPosition(new THREE.Vector3()).y+.02*ht;const hp=B0.Hips.getWorldPosition(new THREE.Vector3());root.position.x-=hp.x;root.position.z-=hp.z;}
 const sl=(look.slim||1)*(look.bulk||1);root.scale.x*=sl;root.scale.z*=sl;root.updateMatrixWorld(true);
 const bones=bonesOf(root);const Hinv=new THREE.Matrix4().copy(H.matrixWorld).invert();
 // attach a node to a bone with metre-space offsets in H space at bind pose (x right, y up, z forward)
 const carrier=bone=>{const g=new THREE.Group();const inv=new THREE.Matrix4().copy(bone.matrixWorld).invert().multiply(H.matrixWorld);inv.decompose(g.position,g.quaternion,g.scale);bone.add(g);return g;};
 const bp=n=>bones[n]?bones[n].getWorldPosition(new THREE.Vector3()):new THREE.Vector3();
 const head=bp('Head'),top=bp('head_end').y>head.y?bp('head_end'):head.clone().setY(head.y+.18);const headY=top.y,neckY=bp('neck').y,hipY=bp('Hips').y;
 const HC=bones.Head?carrier(bones.Head):H,SC=bones.Spine?carrier(bones.Spine):H,PC=bones.Hips?carrier(bones.Hips):H;const fz=head.z;
 const add=(par,mesh,p,r)=>{mesh.position.set(...p);if(r)mesh.rotation.set(...r);par.add(mesh);return mesh;};
 // neon trims: rings around wrists, ankles, neck, waist (class / gang colour)
 const gm=glowM(trim);const ring=(bn,r,from,to)=>{const bo=bones[bn];if(!bo)return;const C=carrier(bo);const a=bp(from),c=bp(to);const p=a.clone().lerp(c,.85);const d=c.clone().sub(a).normalize();const m=new THREE.Mesh(new THREE.TorusGeometry(r,.006,4,18),gm);m.position.copy(p);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),d);C.add(m);};
 const tr=look.trims??(cls==='rich'?['neck','wrists']:cls==='poor'?(h%3?['wrists']:[]):['wrists','ankles','waist'].filter((_,i)=>(h>>i)&1||i===0));
 if(tr.includes('wrists')){ring('LeftForeArm',.042,'LeftForeArm','LeftHand');ring('RightForeArm',.042,'RightForeArm','RightHand');}
 if(tr.includes('ankles')){ring('LeftLeg',.055,'LeftLeg','LeftFoot');ring('RightLeg',.055,'RightLeg','RightFoot');}
 if(tr.includes('neck'))ring('neck',.068,'Spine','neck');if(tr.includes('waist'))add(PC,new THREE.Mesh(new THREE.TorusGeometry(.16,.008,4,28),gm),[0,hipY+.06,fz],[Math.PI/2,0,0]);
 if(cls==='rich'){add(SC,new THREE.Mesh(new THREE.BoxGeometry(.06,.012,.01),glowM(0xffe0a0)),[.09,neckY-.2,fz+.12]);}// gold lapel pin
 // glow accessories (same vocabulary as the UBC rig)
 const fy=head.z+.1;
 if(look.glow){const g=glowM(look.glow.color),w=look.glow.where;
  if(w==='visor')add(HC,new THREE.Mesh(new THREE.BoxGeometry(.17,.026,.03),g),[0,head.y+.07,fy]);
  if(w==='phones'){for(const e of[-1,1])add(HC,new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,.03,12),g),[e*.09,head.y+.06,head.z],[0,0,Math.PI/2]);}
  if(w==='collar')add(SC,new THREE.Mesh(new THREE.TorusGeometry(.075,.008,6,18),g),[0,neckY-.02,head.z],[Math.PI/2,0,0]);
  if(w==='badge')add(SC,new THREE.Mesh(new THREE.BoxGeometry(.05,.035,.01),g),[.08,neckY-.2,fz+.13]);
  if(w==='strip')add(SC,new THREE.Mesh(new THREE.BoxGeometry(.008,.24,.008),g),[.07,neckY-.26,fz+.13]);}
 const dk=stdM(look.hatColor||0x1a1a22);
 if(false&&look.hat==='cap'&&b!=='police-officer'){add(HC,new THREE.Mesh(new THREE.CylinderGeometry(.105,.11,.06,16),dk),[0,headY-.05,head.z-.005]);add(HC,new THREE.Mesh(new THREE.BoxGeometry(.18,.012,.1),dk),[0,headY-.08,head.z+.1],[.15,0,0]);}
 if(false&&look.hat==='beanie')add(HC,new THREE.Mesh(new THREE.SphereGeometry(.112,16,10,0,Math.PI*2,0,Math.PI*.5),dk),[0,headY-.08,head.z-.005]);
 for(const gr of look.gear||[]){const g=gr.c?glowM(gr.c):null;
  if(gr.t==='bag'||gr.t==='bagglow'){add(SC,new THREE.Mesh(new THREE.BoxGeometry(.3,.36,.16),stdM(gr.col||0x2a2430,.7)),[0,neckY-.32,head.z-.2]);if(g||gr.t==='bagglow')add(SC,new THREE.Mesh(new THREE.BoxGeometry(.24,.03,.01),g||gm),[0,neckY-.26,head.z-.285]);}
  if(gr.t==='satchel')add(SC,new THREE.Mesh(new THREE.BoxGeometry(.06,.22,.24),stdM(gr.col||0x4a3020,.8)),[-.19,hipY+.05,head.z]);
  if(gr.t==='mask')add(HC,new THREE.Mesh(new THREE.BoxGeometry(.12,.06,.05),stdM(gr.col||0x18181e,.5)),[0,head.y-.02,fy-.01]);
  if(gr.t==='glasses')add(HC,new THREE.Mesh(new THREE.BoxGeometry(.15,.028,.02),g||stdM(0x111)),[0,head.y+.06,fy+.005]);
  if(gr.t==='cyber')add(HC,new THREE.Mesh(new THREE.BoxGeometry(.012,.05,.05),g||gm),[.088,head.y+.05,head.z+.02]);
  if(gr.t==='pads'&&b!=='police-officer')for(const e of[-1,1])add(SC,new THREE.Mesh(new THREE.SphereGeometry(.08,10,6,0,Math.PI*2,0,Math.PI*.42),stdM(gr.col||0x2a3044,.4,.4)),[e*.17,neckY-.06,head.z],[0,0,e*-.5]);
  if(gr.t==='belt')add(PC,new THREE.Mesh(new THREE.TorusGeometry(.15,.015,4,20),stdM(0x111,.4,.5)),[0,hipY+.04,head.z],[Math.PI/2,0,0]);}
 if(cls==='mid'&&!look.glow&&h%3===0)add(HC,new THREE.Mesh(new THREE.BoxGeometry(.012,.05,.05),gm),[.088,head.y+.05,head.z+.02]);// ear jack
 if(false&&cls==='poor'&&h%4===1)add(HC,new THREE.Mesh(new THREE.SphereGeometry(.112,14,8,0,Math.PI*2,0,Math.PI*.5),stdM(0x2a2420,.9,0)),[0,headY-.08,head.z-.005]);// worn knit cap
 // umbrella (right hand IK as on the UBC rig)
 if(look.umbrella&&bones.RightHand){const u=new THREE.Group();const c=new THREE.Mesh(new THREE.ConeGeometry(.55,.22,12,1,true),new THREE.MeshLambertMaterial({color:look.umbrella,side:THREE.DoubleSide,transparent:true,opacity:.75,emissive:new THREE.Color(look.umbrella).multiplyScalar(.3)}));u.add(c);const st=new THREE.Mesh(new THREE.CylinderGeometry(.008,.008,1),stdM(0x222));st.geometry.translate(0,.5,0);u.add(st);root.parent.add(u);H.userData.umb=u;
  const hr=bones.RightHand,lo=bones.RightForeArm,up=bones.RightArm;const tp=new THREE.Vector3(0,headY+.3,head.z+.04),grip=new THREE.Vector3(-.13,neckY-.32,head.z+.22),tw=new THREE.Vector3(),hv=new THREE.Vector3(),bq=new THREE.Vector3(),v1=new THREE.Vector3(),v2=new THREE.Vector3(),qw=new THREE.Quaternion(),pq=new THREE.Quaternion(),UP=new THREE.Vector3(0,1,0),dir=new THREE.Vector3(),q=new THREE.Quaternion();
  const ik=()=>{H.updateWorldMatrix(true,false);tw.copy(grip);H.localToWorld(tw);for(let it=0;it<3;it++)for(const bo of[lo,up]){if(!bo)continue;hr.updateWorldMatrix(true,false);hv.setFromMatrixPosition(hr.matrixWorld);bq.setFromMatrixPosition(bo.matrixWorld);v1.subVectors(hv,bq).normalize();v2.subVectors(tw,bq).normalize();qw.setFromUnitVectors(v1,v2);bo.parent.getWorldQuaternion(pq);qw.premultiply(pq.clone().invert()).multiply(pq);bo.quaternion.premultiply(qw);bo.updateMatrixWorld(true);}};
  u.userData.fit=()=>{ik();hr.updateWorldMatrix(true,false);hv.setFromMatrixPosition(hr.matrixWorld);H.worldToLocal(hv);dir.subVectors(tp,hv);const L=dir.length();dir.multiplyScalar(1/L);st.position.copy(hv);st.quaternion.setFromUnitVectors(UP,dir);st.scale.y=L+.02;c.position.copy(tp);c.position.y+=.08;q.setFromUnitVectors(UP,dir);c.quaternion.identity().slerp(q,.2);};}
 H.traverse(o=>{if(o.isMesh){o.frustumCulled=!o.isSkinnedMesh;if(!o.isSkinnedMesh){const g=o.geometry;if(!g.boundingSphere)g.computeBoundingSphere();if(g.boundingSphere.radius<.09)(H.userData.small||(H.userData.small=[])).push(o);}}});
 if(sk)sk.frustumCulled=false;
 const clips=retargetAll(b,lib.scene);const mixer=new THREE.AnimationMixer(root);const acts={};const ts=look.tempo||1;
 for(const k in A)if(clips[A[k]]){acts[k]=mixer.clipAction(clips[A[k]]);acts[k].timeScale=(k==='idle'?.85:k==='talk'?.9:1)*ts;}
 if(acts.interact){acts.interact.setLoop(THREE.LoopOnce);acts.interact.clampWhenFinished=true;}
 return finish(H,mixer,acts,bones);}
function finish(H,mixer,acts,bones){let cur=null;const play=(k,fade=.4)=>{if(!acts[k])k=acts.idle?'idle':Object.keys(acts)[0];if(cur===k||!acts[k])return;const n=acts[k];const o=cur&&acts[cur];n.enabled=true;n.reset();
  if(o&&/walk|jog|formal/.test(k)&&/walk|jog|formal/.test(cur))n.time=o.time/o.getClip().duration*n.getClip().duration;n.play();if(o)o.crossFadeTo(n,fade,false);else n.fadeIn(fade);cur=k;};play('idle',0);mixer.update(Math.random()*3);
 let acc=0,fc=Math.floor(Math.random()*4),far=false;
 const lod=(d,dt)=>{acc+=dt;fc++;const n=d<14?1:d<28?2:4;if(fc%n===0||acc>.25){mixer.update(acc);acc=0;const um=H.userData.umb;if(um&&um.userData.fit)um.userData.fit();}const f=d>26;if(f!==far){far=f;for(const o of H.userData.small||[])o.visible=!f;}};
 return {obj:H,mixer,play,bones,acts,lod,get anim(){return cur;}};}
// ---------- robots: human-scale or smaller only (no CP_Large) ----------
const RSPEC={CP_Flying:{h:.75,fly:1.25,walk:'Walk',idle:'Idle'},CP_Robot_2Legs:{h:1.25,walk:'Walk',idle:'Idle'},Enemy_EyeDrone:{h:.5,fly:1.6,walk:'Idle',idle:'Look'},Enemy_Trilobite:{h:.45,walk:'Walk',idle:'Look'},Enemy_QuadShell:{h:.8,walk:'Walk',idle:'Idle'}};
export const ROBOTS=Object.keys(RSPEC);export const robotsReady=()=>Object.keys(ROBO).length>0;
export function makeRobot(kind,col){const R=ROBO[kind]||Object.values(ROBO)[0];if(!R)return null;kind=Object.keys(ROBO).find(k=>ROBO[k]===R);const sp=RSPEC[kind];
 const root=SkeletonUtils.clone(R.scene);const H=new THREE.Group();H.userData.human=1;H.userData.robot=kind;H.add(root);root.updateMatrixWorld(true);
 const bb=new THREE.Box3().setFromObject(root,true);const s=sp.h/(bb.max.y-bb.min.y);root.scale.multiplyScalar(s);root.position.y=-bb.min.y*s+(sp.fly||0);
 root.traverse(o=>{if(o.isMesh){const m=o.material.clone();m.roughness=.45;m.metalness=.5;m.emissive=new THREE.Color(col).multiplyScalar(.12);o.material=m;o.frustumCulled=false;}});
 const eye=new THREE.Mesh(new THREE.SphereGeometry(.04,8,6),glowM(col));eye.position.set(0,sp.h*.62+(sp.fly||0),sp.h*.3);H.add(eye);
 const mixer=new THREE.AnimationMixer(root);const acts={};const cl=n=>R.clips.find(c=>c.name.endsWith(n));
 for(const [k,n] of Object.entries({idle:sp.idle,walk:sp.walk,formal:sp.walk,jog:sp.walk,talk:sp.idle,interact:sp.idle,sit:sp.idle,sittalk:sp.idle})){const c=cl(n);if(c)acts[k]=mixer.clipAction(c);}
 if(sp.fly){let t=Math.random()*6;const base=root.position.y;mixer.addEventListener&&0;const u=mixer.update.bind(mixer);mixer.update=dt=>{t+=dt;root.position.y=base+Math.sin(t*2)*.08;return u(dt);};}
 return finish(H,mixer,acts,{});}
