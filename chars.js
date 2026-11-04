// Animated humanoids: Quaternius Universal Base Characters (CC0) + Universal Animation Library clips (CC0).
// Each character = cloned skinned body + skinned clothing shells + rigid hair/gear on bones + rim-lit materials.
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
const BASE={},HAIR={};let clips={};
export async function loadRig(dir='models/'){const L=new GLTFLoader();
 const [m,f,h,a]=await Promise.all(['ubc-male','ubc-female','ubc-hair','ubc-anims'].map(n=>L.loadAsync(dir+n+'.glb')));
 BASE.m=m.scene;BASE.f=f.scene;h.scene.traverse(o=>{if(o.isMesh){let n=o;while(n.parent&&!/^Hair_/.test(n.name))n=n.parent;HAIR[n.name.replace('Hair_','')]=o;o.updateWorldMatrix(true,false);}});
 for(const c of a.animations)clips[c.name]=c;}
const A={idle:'Idle_Loop',walk:'Walk_Loop',talk:'Idle_Talking_Loop',sit:'Sitting_Idle_Loop',sittalk:'Sitting_Talking_Loop',interact:'Interact',jog:'Jog_Fwd_Loop',formal:'Walk_Formal_Loop'};
// shared rim light: neon edge glow so figures separate from the dark street (cheap: one extra term in the fragment shader)
const RIM=new THREE.Color(0x8a6cff);
function rim(mat,str=.55,col=RIM){mat.onBeforeCompile=s=>{s.uniforms.rimC={value:col};s.uniforms.rimS={value:str};
 s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nuniform vec3 rimC;uniform float rimS;').replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n{float r=1.0-saturate(dot(normalize(vNormal),normalize(vViewPosition)));totalEmissiveRadiance+=rimC*rimS*r*r*r;}');};
 mat.customProgramCacheKey=()=>'rim'+str;return mat;}
const std=(c,r=.75,m=.05,str=.5)=>rim(new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m}),str);
const glow=c=>new THREE.MeshBasicMaterial({color:new THREE.Color(c).multiplyScalar(2.2),toneMapped:false});
// region masks by dominant bone
const R_={top:/spine|clavicle|upperarm|neck/,sleeve:/spine|clavicle|upperarm|lowerarm|neck/,coatL:/spine|clavicle|upperarm|lowerarm|pelvis|thigh/,pants:/pelvis|thigh|calf|spine_01/,shorts:/pelvis|thigh/,boots:/foot|ball|calf/,gloves:/hand|index|middle|ring|pinky|thumb/,apron:/spine_01|spine_02|pelvis|thigh/};
const shellCache=new Map(),PAD=new WeakSet();
// Laplacian-smooth selected vertices (welded by position) so clothes drape instead of shrink-wrapping anatomy
function smooth(geo,sel,it){const p=geo.attributes.position,n=p.count,key=new Map(),id=new Int32Array(n);
 for(let v=0;v<n;v++){const k=Math.round(p.getX(v)*500)+','+Math.round(p.getY(v)*500)+','+Math.round(p.getZ(v)*500);if(!key.has(k))key.set(k,key.size);id[v]=key.get(k);}
 const U=key.size,P=new Float32Array(U*3),nb=Array.from({length:U},()=>new Set()),S=new Uint8Array(U);
 for(let v=0;v<n;v++){const u=id[v];P[u*3]=p.getX(v);P[u*3+1]=p.getY(v);P[u*3+2]=p.getZ(v);if(sel[v])S[u]=1;}
 const ix=geo.index.array;for(let i=0;i<ix.length;i+=3)for(let a=0;a<3;a++){const x=id[ix[i+a]],y=id[ix[i+(a+1)%3]];nb[x].add(y);nb[y].add(x);}
 const Q=new Float32Array(U*3);for(let t=0;t<it;t++){Q.set(P);for(let u=0;u<U;u++){if(!S[u]||!nb[u].size)continue;let x=0,y=0,z=0;for(const w of nb[u]){x+=Q[w*3];y+=Q[w*3+1];z+=Q[w*3+2];}const c=nb[u].size;P[u*3]=Q[u*3]*.4+x/c*.6;P[u*3+1]=Q[u*3+1]*.4+y/c*.6;P[u*3+2]=Q[u*3+2]*.4+z/c*.6;}}
 for(let v=0;v<n;v++){const u=id[v];p.setXYZ(v,P[u*3],P[u*3+1],P[u*3+2]);}}
function bodyMesh(root){let sk=null;root.traverse(o=>{if(o.isSkinnedMesh&&!o.userData.shell&&(!sk||o.geometry.attributes.position.count>sk.geometry.attributes.position.count))sk=o;});return sk;}
function shell(sk,sex,mat,region,push,opt={}){
 const key=sex+region+push+JSON.stringify(opt);let geo=shellCache.get(key);
 if(!geo){const g=sk.geometry,si=g.attributes.skinIndex,sw=g.attributes.skinWeight,pos=g.attributes.position,nor=g.attributes.normal,bones=sk.skeleton.bones,re=R_[region];
  const bb=new THREE.Box3().setFromBufferAttribute(pos),H=bb.max.y-bb.min.y,up=bb.max.y>bb.max.z?1:2;// detect y-up vs z-up geometry
  const ok=new Uint8Array(pos.count);for(let v=0;v<pos.count;v++){let best=0,bi=0;for(let c=0;c<4;c++){const w=sw.getComponent(v,c);if(w>best){best=w;bi=si.getComponent(v,c);}}
   let o=re.test(bones[bi].name);if(o&&opt.front)o=nor.getZ(v)>.2;if(o&&opt.minH!=null)o=(pos.getY(v)-bb.min.y)/H>=opt.minH;if(o&&opt.maxH!=null)o=(pos.getY(v)-bb.min.y)/H<=opt.maxH;ok[v]=o?1:0;}
  geo=g.clone();const p=geo.attributes.position,k=push*H/1.8;for(let v=0;v<p.count;v++){let s=k;if(opt.flare){const t=1-(p.getY(v)-bb.min.y)/H;s+=Math.max(0,t-.45)*opt.flare*H;}p.setXYZ(v,p.getX(v)+nor.getX(v)*s,p.getY(v)+nor.getY(v)*s,p.getZ(v)+nor.getZ(v)*s);}
  if(opt.smooth){const sel=new Uint8Array(p.count);for(let v=0;v<p.count;v++){let best=0,bi=0;for(let c=0;c<4;c++){const w=sw.getComponent(v,c);if(w>best){best=w;bi=si.getComponent(v,c);}}sel[v]=/spine|pelvis|clavicle/.test(bones[bi].name)?1:0;}const O=g.attributes.position;smooth(geo,sel,opt.smooth);for(let v=0;v<p.count;v++){const dx=p.getX(v)-O.getX(v),dy=p.getY(v)-O.getY(v),dz=p.getZ(v)-O.getZ(v),nx=nor.getX(v),ny=nor.getY(v),nz=nor.getZ(v),d=dx*nx+dy*ny+dz*nz;if(d<k)p.setXYZ(v,p.getX(v)+(k-d)*nx,p.getY(v)+(k-d)*ny,p.getZ(v)+(k-d)*nz);}}
  const idx=g.index.array,out=[];for(let i=0;i<idx.length;i+=3)if(ok[idx[i]]&&ok[idx[i+1]]&&ok[idx[i+2]])out.push(idx[i],idx[i+1],idx[i+2]);geo.setIndex(out);geo.clearGroups();geo.computeBoundingSphere();shellCache.set(key,geo);}
 const m=new THREE.SkinnedMesh(geo,mat);m.userData.shell=1;m.bind(sk.skeleton,sk.bindMatrix);sk.parent.add(m);return m;}
// attach in *model space at bind pose*: a carrier group on the bone that cancels the bone's bind transform, so offsets are just (x right, y up, z forward) metres
function carrier(root,bone){root.updateMatrixWorld(true);const g=new THREE.Group();const inv=new THREE.Matrix4().copy(bone.matrixWorld).invert().multiply(root.matrixWorld);inv.decompose(g.position,g.quaternion,g.scale);bone.add(g);return g;}
// look: {sex:'m'|'f', skin, top, pants, boots, coat:{color,len,open}, hair:{style,color}, hat, hatColor, glow:{where,color}, gear:[...], slim, bulk, scale, android, apron, umbrella}
export function makeHuman(look){const sex=look.sex||'f';const root=SkeletonUtils.clone(BASE[sex]);const H=new THREE.Group();H.add(root);
 const sc0=look.scale||1,kid=look.kid||sc0<.9;const s=(kid?sc0:Math.min(1.045,Math.max(.955,sc0)))*(sex==='m'?1.02:.97);/* normalized adult heights ~1.6-1.86m */root.scale.set(s*(look.slim||1)*(look.bulk||1),s,s*(look.slim||1)*(look.bulk||1));
 const bones={};root.traverse(o=>{if(o.isBone)bones[o.name]=o;});
 const sk=bodyMesh(root);
 root.traverse(o=>{if(!o.isMesh||o.userData.shell)return;const mats=Array.isArray(o.material)?o.material:[o.material];o.material=mats.map(m=>{const n=m.clone();
   if(/Superhero/.test(m.name)){n.color=new THREE.Color(look.skin||0xd8b8a0).multiplyScalar(1.15);n.roughness=.62;n.metalness=look.android?.55:0;if(look.android){n.map=null;n.color=new THREE.Color(look.skin);n.roughness=.35;}rim(n,.45);}
   else if(/Hair/.test(m.name)){n.color=new THREE.Color(look.hair?.color??0x1a1410);if(look.android)o.visible=false;}
   return n;});if(o.material.length===1)o.material=o.material[0];});
 // clothing shells (inner to outer)
 const top=look.top??0x2a2430,pants=look.pants??0x18161e,boots=look.boots??0x0e0c10;
 if(!look.android){shell(sk,sex,std(top,.8),look.coat&&!look.coat.open?'top':'sleeve',.01,{smooth:sex==='f'?14:6});shell(sk,sex,std(pants,.85),'pants',.011,{smooth:10});shell(sk,sex,std(boots,.5,.1),'boots',.016,{maxH:.12});}
 else{shell(sk,sex,std(look.body??0x8a96aa,.3,.7,.35),'pants',.004);shell(sk,sex,std(look.body??0x8a96aa,.3,.7,.35),'sleeve',.004);}
 const hb=bones.Head,sb=bones.spine_03,pb=bones.pelvis;const HC=hb?carrier(root,hb):H,SC=sb?carrier(root,sb):H,PC=pb?carrier(root,pb):H;
 if(look.coat){const c=look.coat;const mat=std(c.color,c.shiny?.35:.8,c.shiny?.3:.05,.6);mat.side=THREE.DoubleSide;
  if(c.len>.5){// long coat: one skinned shell over torso, arms and thighs, so the tails follow the legs instead of clipping through them
   const bot=Math.max(.25,1.9*(1-c.len));shell(sk,sex,mat,'coatL',.026,{minH:Math.max(.16,bot/1.86),smooth:sex==='f'?18:8,flare:.1});}
  else shell(sk,sex,mat,'sleeve',.022,{minH:.47,smooth:sex==='f'?18:8});}
 if(look.apron){const ap=new THREE.Mesh(new THREE.CylinderGeometry(.21,.27,.62,14,1,true,-Math.PI*.36,Math.PI*.72),std(look.apron,.9));ap.material.side=THREE.DoubleSide;ap.position.set(0,.72,.0);ap.scale.z=.85;PC.add(ap);const bib=new THREE.Mesh(new THREE.BoxGeometry(.26,.3,.02),std(look.apron,.9));bib.position.set(0,1.3,.15);SC.add(bib);}
 if(look.gloves)shell(sk,sex,std(look.gloves,.5,.2),'gloves',.006);
 // head metrics (bind pose, model space): find head top
 const headY=sex==='m'?1.83:1.76;const add=(par,mesh,p,r)=>{mesh.position.set(...p);if(r)mesh.rotation.set(...r);par.add(mesh);return mesh;};
 // hair
 const hm=std(look.hair?.color??0x1a1410,.6,0,.7);
 const hairs={bob:['SimpleParted'],short:['SimpleParted'],buzz:['Buzzed'],bun:['Buns'],long:['Long'],spiky:['Buzzed'],beard:['SimpleParted','Beard']};
 if(look.hair&&!look.android&&look.hat!=='hood')for(const nm of hairs[look.hair.style]||[]){const src=HAIR[nm];if(!src)continue;const m=new THREE.Mesh(src.geometry,hm);src.matrixWorld.decompose(m.position,m.quaternion,m.scale);
  if(sex==='m'){}else{m.position.y-=.06*0;}HC.add(m);}
 if(look.hair?.style==='spiky'&&look.hat!=='hood')for(let i=0;i<7;i++){const c=new THREE.Mesh(new THREE.ConeGeometry(.03,.13,5),hm);add(HC,c,[Math.cos(i*.9)*.06,headY+.02,Math.sin(i*.9)*.06-.01],[Math.sin(i*.9)*.6,0,-Math.cos(i*.9)*.6]);}
 const dk=std(look.hatColor||0x1a1a22,.6,.2);
 if(look.hat==='cap'){add(HC,new THREE.Mesh(new THREE.CylinderGeometry(.115,.12,.07,16),dk),[0,headY-(sex==='f'?.04:.03),-.005]);add(HC,new THREE.Mesh(new THREE.BoxGeometry(.19,.012,.1),dk),[0,headY-(sex==='f'?.075:.065),.11],[.15,0,0]);}
 if(look.hat==='beanie')add(HC,new THREE.Mesh(new THREE.SphereGeometry(.118,16,10,0,Math.PI*2,0,Math.PI*.55),dk),[0,headY-.07,-.005]);
 if(look.hat==='hood'){const m2=std(look.coat?.color||0x222,.85);m2.side=THREE.DoubleSide;const hd=new THREE.Mesh(new THREE.SphereGeometry(.15,18,12,Math.PI*.78,Math.PI*1.44,0,Math.PI*.72),m2);add(HC,hd,[0,headY-.1,-.025]);
  add(HC,new THREE.Mesh(new THREE.TorusGeometry(.13,.03,6,18,Math.PI*1.2),m2),[0,headY-.2,-.01],[Math.PI/2,0,Math.PI*.9]);}
 if(look.glow){const g=glow(look.glow.color),w=look.glow.where;
  if(w==='visor'){add(HC,new THREE.Mesh(new THREE.BoxGeometry(.17,.028,.03),g),[0,headY-.105,.1]);}
  if(w==='phones'){for(const e of[-1,1])add(HC,new THREE.Mesh(new THREE.CylinderGeometry(.042,.042,.03,12),g),[e*.1,headY-.12,-.005],[0,0,Math.PI/2]);add(HC,new THREE.Mesh(new THREE.TorusGeometry(.105,.01,6,16,Math.PI),std(0x222)),[0,headY-.12,-.005],[0,Math.PI/2,0]);}
  if(w==='collar')add(SC,new THREE.Mesh(new THREE.TorusGeometry(.075,.008,6,18),g),[0,headY-.24,0],[Math.PI/2,0,0]);
  if(w==='badge')add(SC,new THREE.Mesh(new THREE.BoxGeometry(.05,.035,.01),g),[.08,headY-.42,.13]);
  if(w==='strip'){add(SC,new THREE.Mesh(new THREE.BoxGeometry(.008,.24,.008),g),[.07,headY-.48,.135]);}}
 for(const gr of look.gear||[]){const g=gr.c?glow(gr.c):null;
  if(gr.t==='bag')add(SC,new THREE.Mesh(new THREE.BoxGeometry(.3,.36,.16),std(gr.col||0x2a2430,.7)),[0,headY-.55,-.16]);
  if(gr.t==='bagglow'){add(SC,new THREE.Mesh(new THREE.BoxGeometry(.32,.38,.18),std(gr.col||0x2a2430,.5,.3)),[0,headY-.55,-.17]);add(SC,new THREE.Mesh(new THREE.BoxGeometry(.24,.03,.01),g),[0,headY-.5,-.265]);}
  if(gr.t==='satchel'){add(SC,new THREE.Mesh(new THREE.BoxGeometry(.06,.22,.24),std(gr.col||0x4a3020,.8)),[-.17,headY-.78,0]);}
  if(gr.t==='pads'){for(const e of[-1,1]){const m=add(SC,new THREE.Mesh(new THREE.SphereGeometry(.085,12,6,0,Math.PI*2,0,Math.PI*.42),std(gr.col||0x2a3044,.4,.4)),[e*.17,headY-.33,0],[0,0,e*-.5]);m.scale.set(1,.6,1.05);}}
  if(gr.t==='mask')add(HC,new THREE.Mesh(new THREE.BoxGeometry(.12,.06,.05),std(gr.col||0x18181e,.5,.2)),[0,headY-.2,.085]);
  if(gr.t==='glasses'){add(HC,new THREE.Mesh(new THREE.BoxGeometry(.16,.03,.02),g||std(0x111)),[0,headY-.115,.1]);}
  if(gr.t==='cyber'){add(HC,new THREE.Mesh(new THREE.BoxGeometry(.012,.05,.05),g),[.093,headY-.12,.02]);}
  if(gr.t==='belt')add(SC,new THREE.Mesh(new THREE.TorusGeometry(.15,.015,4,20),std(0x111,.4,.5)),[0,headY-.72,0],[Math.PI/2,0,0]);}
 if(look.umbrella){const u=new THREE.Group();const c=new THREE.Mesh(new THREE.ConeGeometry(.55,.22,12,1,true),new THREE.MeshLambertMaterial({color:look.umbrella,side:THREE.DoubleSide,transparent:true,opacity:.75,emissive:new THREE.Color(look.umbrella).multiplyScalar(.3)}));c.position.y=.75;u.add(c);const st=new THREE.Mesh(new THREE.CylinderGeometry(.008,.008,.75),std(0x222));st.position.y=.37;u.add(st);
  const hr=bones.hand_r;if(hr){const cr=carrier(root,hr);cr.add(u);u.position.set(-.22,headY-.85,.1);H.userData.umb=u;}}
 // culling: skinned meshes test a padded bind-pose sphere, so off-screen people cost no draw calls
 H.traverse(o=>{if(o.isMesh){const g=o.geometry;if(!g.boundingSphere)g.computeBoundingSphere();if(o.isSkinnedMesh){o.boundingSphere=g.boundingSphere.clone();o.boundingSphere.radius+=.45;}o.frustumCulled=true;if(!o.isSkinnedMesh&&g.boundingSphere.radius<.09)(H.userData.small||(H.userData.small=[])).push(o);}});
 const mixer=new THREE.AnimationMixer(root);const acts={};const ts=look.tempo||1;
 for(const k in A)if(clips[A[k]]){acts[k]=mixer.clipAction(clips[A[k]]);acts[k].timeScale=(k==='idle'?.85:k==='talk'?.9:1)*ts;}
 if(acts.interact){acts.interact.setLoop(THREE.LoopOnce);acts.interact.clampWhenFinished=true;}
 let cur=null;const play=(k,fade=.4)=>{if(cur===k||!acts[k])return;const n=acts[k];const o=cur&&acts[cur];n.enabled=true;n.reset();
  if(o&&/walk|jog|formal/.test(k)&&/walk|jog|formal/.test(cur)){n.time=o.time/o.getClip().duration*n.getClip().duration;}// keep foot phase between gaits
  n.play();if(o)o.crossFadeTo(n,fade,false);else n.fadeIn(fade);cur=k;};play('idle',0);mixer.update(Math.random()*3);
 let acc=0,fc=Math.floor(Math.random()*4),far=false;
 // distance LOD: full-rate animation up close, every 2nd/4th frame further out; tiny trinkets vanish past 26m
 const lod=(d,dt)=>{acc+=dt;fc++;const n=d<14?1:d<28?2:4;if(fc%n===0||acc>.25){mixer.update(acc);acc=0;}const f=d>26;if(f!==far){far=f;for(const o of H.userData.small||[])o.visible=!f;}};
 return {obj:H,mixer,play,bones,acts,lod,get anim(){return cur;}};}
