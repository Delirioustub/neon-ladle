// Neon Ladle R15: gunplay. Quaternius Sci-Fi Modular Gun Pack (CC0) models with gang-coloured neon trim,
// a first-person view model (sway, recoil, reload), visible tracers, muzzle flash + light, sparks, scorch decals,
// hit markers, Quaternius combat clips (aim / shoot / hit / death / run) on enemies, cover-seeking, ammo drops.
// r5.js owns events, factions and dialogue; this file owns weapons, the HUD and the firefight itself.
import * as THREE from 'three';
import {TW} from './terrain.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
const rnd=(a,b)=>a+Math.random()*(b-a);
export const GUNS={
 kestrel:{n:'Kestrel 9',file:'pistol1',len:.25,mag:12,dmg:1,rof:.2,spread:.008,auto:0,price:90,kick:1,rl:1.25,snd:[1,2600],desc:'light pistol'},
 warden:{n:'Warden .45',file:'pistol3',len:.27,mag:7,dmg:2,rof:.42,spread:.006,auto:0,price:210,kick:1.7,rl:1.5,snd:[1.3,1700],desc:'heavy pistol · one-shot'},
 rattler:{n:'Tide Rattler',file:'smg2',len:.5,mag:24,dmg:1,rof:.085,spread:.028,auto:1,price:340,kick:.55,rl:1.7,snd:[.8,3200],desc:'SMG · full auto'},
 halo:{n:'Halo carbine',file:'ar1',len:.74,mag:30,dmg:1,rof:.11,spread:.01,auto:1,price:0,kick:.7,rl:1.9,snd:[1.1,2400],desc:'carbine · Tidecaller reward'}};
export const GANGCOL={tide:0xff8a3d,saint:0xf4f6ff,wardline:0x3f8aff,cop:0x3f8aff,orrin:0xc9b2ff,civ:0x5dff9b,none:0x3ff0ff};
const TEMPL={};let ANIMS={};
export async function loadGuns(dir='models/guns/'){const L=new GLTFLoader();
 await Promise.all([...new Set(Object.values(GUNS).map(g=>g.file))].map(f=>L.loadAsync(dir+f+'.glb').then(g=>TEMPL[f]=g.scene)));
 try{const a=await L.loadAsync(dir+'combat-anims.glb');for(const c of a.animations){c.tracks=c.tracks.filter(t=>!/^(Root|Body)\./.test(t.name)&&!/Hips\.position/.test(t.name));ANIMS[c.name]=c;}}catch(e){console.warn('combat anims',e);}}
const MATC=new Map();
function gunMat(src,col){const key=src.name+'|'+col;if(MATC.has(key))return MATC.get(key);let m;const n=src.name;
 if(n==='Main')m=new THREE.MeshStandardMaterial({color:0x0a0a0e,emissive:new THREE.Color(col),emissiveIntensity:1.15,roughness:.4});
 else if(n==='White')m=new THREE.MeshStandardMaterial({color:0xa8adb8,roughness:.38,metalness:.55,emissive:0x15161c});
 else if(n==='Grey')m=new THREE.MeshStandardMaterial({color:0x3c4049,roughness:.5,metalness:.6,emissive:0x0b0c10});
 else m=new THREE.MeshStandardMaterial({color:0x141519,roughness:.55,metalness:.4,emissive:0x060608});
 MATC.set(key,m);return m;}
// muzzle at local (0,my,-len), grip at origin, barrel along -Z, up +Y
export function makeGun(type,col){const G=GUNS[type]||GUNS.kestrel;const src=TEMPL[G.file];const W=new THREE.Group();W.userData.gun=type;
 if(!src){const b=new THREE.Mesh(new THREE.BoxGeometry(.04,.06,G.len),new THREE.MeshStandardMaterial({color:0x222}));b.position.z=-G.len/2;W.add(b);W.userData.muzzle=new THREE.Vector3(0,.02,-G.len);return W;}
 const s=src.clone(true);s.traverse(o=>{if(o.isMesh){o.material=gunMat(o.material,col);o.castShadow=false;}});
 const bb=new THREE.Box3().setFromObject(s),sz=bb.getSize(new THREE.Vector3());const k=G.len/sz.x;s.scale.setScalar(k);
 const gx=bb.min.x+sz.x*(G.len<.3?.28:.42),gy=bb.min.y+sz.y*.3;s.position.set(-gx*k,-gy*k,0);const I=new THREE.Group();I.add(s);I.rotation.y=Math.PI/2;W.add(I);
 W.userData.muzzle=new THREE.Vector3(0,(bb.min.y+sz.y*.78-gy)*k,-(bb.max.x-gx)*k-.01);return W;}
// ---------- shared textures ----------
function canvasTex(draw,n=64){const c=document.createElement('canvas');c.width=c.height=n;const g=c.getContext('2d');draw(g,n);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
const TX={};
function textures(){if(TX.star)return TX;
 TX.star=canvasTex((g,n)=>{const h=n/2;const r=g.createRadialGradient(h,h,0,h,h,h);r.addColorStop(0,'rgba(255,255,240,1)');r.addColorStop(.18,'rgba(255,220,140,.95)');r.addColorStop(.5,'rgba(255,120,40,.35)');r.addColorStop(1,'rgba(255,60,0,0)');g.fillStyle=r;g.fillRect(0,0,n,n);
  g.globalCompositeOperation='lighter';g.translate(h,h);for(let i=0;i<6;i++){g.rotate(Math.PI/3+rnd(-.2,.2));const L=h*rnd(.7,1);const lg=g.createLinearGradient(0,0,L,0);lg.addColorStop(0,'rgba(255,240,200,.9)');lg.addColorStop(1,'rgba(255,140,40,0)');g.fillStyle=lg;g.beginPath();g.moveTo(0,-h*.07);g.lineTo(L,0);g.lineTo(0,h*.07);g.fill();}},128);
 TX.dot=canvasTex((g,n)=>{const h=n/2,r=g.createRadialGradient(h,h,0,h,h,h);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.35,'rgba(255,255,255,.6)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,n,n);},32);
 TX.scorch=canvasTex((g,n)=>{const h=n/2,r=g.createRadialGradient(h,h,0,h,h,h);r.addColorStop(0,'rgba(5,4,4,1)');r.addColorStop(.35,'rgba(15,12,12,.85)');r.addColorStop(.7,'rgba(20,18,18,.35)');r.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=r;g.fillRect(0,0,n,n);
  g.strokeStyle='rgba(0,0,0,.6)';g.lineWidth=1.5;for(let i=0;i<7;i++){const a=rnd(0,7);g.beginPath();g.moveTo(h,h);g.lineTo(h+Math.cos(a)*h*rnd(.5,.95),h+Math.sin(a)*h*rnd(.5,.95));g.stroke();}},64);
 TX.ember=canvasTex((g,n)=>{const h=n/2,r=g.createRadialGradient(h,h,0,h,h,h*.45);r.addColorStop(0,'rgba(255,230,160,1)');r.addColorStop(.5,'rgba(255,110,30,.7)');r.addColorStop(1,'rgba(255,60,0,0)');g.fillStyle=r;g.fillRect(0,0,n,n);},32);
 return TX;}
// ---------- audio ----------
let AC=null;const ac=()=>{try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume();}catch(e){}return AC;};
const NB={};function noiseBuf(len){const A=ac();if(!A)return null;if(NB[len])return NB[len];const b=A.createBuffer(1,Math.floor(A.sampleRate*len),A.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;return NB[len]=b;}
function burst({vol=.5,lp=2500,hp=60,dec=.05,len=.35,t0=0,q=.7,type='lowpass',pan=0}){const A=ac();if(!A)return;const t=A.currentTime+t0;const s=A.createBufferSource();s.buffer=noiseBuf(len);const f=A.createBiquadFilter();f.type=type;f.frequency.value=lp;f.Q.value=q;const h=A.createBiquadFilter();h.type='highpass';h.frequency.value=hp;const g=A.createGain();g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0008,t+dec*6);
 let out=g;if(A.createStereoPanner){const p=A.createStereoPanner();p.pan.value=pan;g.connect(p);out=p;}s.connect(f).connect(h).connect(g);out.connect(A.destination);s.start(t);s.stop(t+len);}
function tone({f0=120,f1=40,vol=.5,dur=.14,t0=0,type='sine'}){const A=ac();if(!A)return;const t=A.currentTime+t0;const o=A.createOscillator();o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);const g=A.createGain();g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0008,t+dur);o.connect(g).connect(A.destination);o.start(t);o.stop(t+dur+.02);}
export const SFX={
 shot(G){const [v,lp]=G.snd;burst({vol:.55*v,lp,dec:.045,len:.4});burst({vol:.22*v,lp:9000,hp:2500,dec:.012,len:.08});tone({f0:150*(2-v*.6),f1:38,vol:.6*v,dur:.16});burst({vol:.06,lp:900,dec:.25,len:1,t0:.05});},
 enemy(d,pan){const v=Math.max(.06,.42-d*.012);burst({vol:v,lp:1300-d*12,dec:.05,len:.4,pan});tone({f0:110,f1:35,vol:v*.7,dur:.14});burst({vol:v*.2,lp:600,dec:.3,len:1,t0:.08,pan});},
 click(p=1,t0=0,v=.25){burst({vol:v,lp:4000*p,hp:1200,dec:.008,len:.05,t0,type:'bandpass',q:3});tone({f0:900*p,f1:500*p,vol:v*.3,dur:.03,t0,type:'square'});},
 dry(){SFX.click(1.3,0,.3);},
 hit(kill){tone({f0:kill?1400:1900,f1:kill?1300:1850,vol:.12,dur:.05,type:'triangle'});if(kill)tone({f0:2300,f1:2200,vol:.1,dur:.08,t0:.06,type:'triangle'});},
 ping(){tone({f0:rnd(2500,4200),f1:rnd(1200,2000),vol:.05,dur:.22,type:'sine'});burst({vol:.08,lp:5000,hp:2000,dec:.01,len:.06});},
 whiz(pan){burst({vol:.18,lp:2200,hp:800,dec:.05,len:.3,type:'bandpass',q:2,pan});},
 hurt(){tone({f0:90,f1:50,vol:.35,dur:.18});burst({vol:.2,lp:500,dec:.06,len:.3});},
 draw(){SFX.click(.7,0,.22);burst({vol:.08,lp:3000,hp:1500,dec:.04,len:.2,t0:.04,type:'bandpass',q:1.5});SFX.click(1.1,.16,.25);}};
// ======================================================================================
export function initGuns(G,H){const {S,scene,P,cam,toast}=G;const T3=textures();const V=new THREE.Vector3(),V2=new THREE.Vector3(),Q=new THREE.Quaternion();
 // ---- state + save migration ----
 const g0=S.gun||{};S.gun=g0;if(g0.has&&!g0.owned)g0.owned=['kestrel'];g0.owned=g0.owned||[];g0.mag=g0.mag||{};g0.ammo=g0.ammo||0;if(g0.has&&!g0.cur)g0.cur=g0.owned[0];g0.drawn=0;
 for(const k of g0.owned)if(g0.mag[k]==null)g0.mag[k]=GUNS[k].mag;
 const cur=()=>GUNS[S.gun.cur]||GUNS.kestrel;
 const gangCol=()=>S.gang&&S.gang.rank>0?GANGCOL.tide:(S.look&&S.look.glow&&S.look.glow.color)||GANGCOL.none;
 // ---- view model (camera child) ----
 const VM=new THREE.Group();VM.visible=false;cam.add(VM);const VMg=new THREE.Group();VM.add(VMg);let vmType=null,vmCol=null,vmGun=null;
 const glove=new THREE.MeshStandardMaterial({color:0x1c1c24,roughness:.7,metalness:.1,emissive:0x07070b}),sleeve=new THREE.MeshStandardMaterial({color:0x24222c,roughness:.85,emissive:0x060608});
 const cuffM=new THREE.MeshBasicMaterial({color:0xffffff,toneMapped:false});
 const limb=(a,b,r,m)=>{const d=new THREE.Vector3().subVectors(b,a),L=d.length();const c=new THREE.Mesh(new THREE.CylinderGeometry(r*.92,r,L,10),m);c.position.copy(a).addScaledVector(d,.5);c.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return c;};
 function buildVM(){const type=S.gun.cur||'kestrel',col=gangCol();if(type===vmType&&col===vmCol)return;vmType=type;vmCol=col;while(VMg.children.length)VMg.remove(VMg.children[0]);
  const Gd=GUNS[type];vmGun=makeGun(type,col);VMg.add(vmGun);cuffM.color.set(col).multiplyScalar(2.2);
  const fist=new THREE.Mesh(new THREE.BoxGeometry(.08,.11,.11),glove);fist.position.set(.014,-.055,.022);fist.rotation.x=-.25;VMg.add(fist);const kn=new THREE.Mesh(new THREE.BoxGeometry(.07,.03,.025),glove);kn.position.set(.014,-.01,-.03);VMg.add(kn);
  const thumb=new THREE.Mesh(new THREE.BoxGeometry(.028,.028,.06),glove);thumb.position.set(-.034,-.008,-.01);thumb.rotation.y=.4;VMg.add(thumb);
  const w=new THREE.Vector3(.01,-.08,.05),el=new THREE.Vector3(.09,-.2,.38);VMg.add(limb(w,el,.036,sleeve));const cuff=limb(w,w.clone().lerp(el,.1),.039,cuffM);VMg.add(cuff);
  if(Gd.len>.4){const fg=new THREE.Vector3(-.012,-.035,-Gd.len*.45);const f2=new THREE.Mesh(new THREE.BoxGeometry(.06,.07,.08),glove);f2.position.copy(fg);VMg.add(f2);const e2=new THREE.Vector3(-.2,-.22,.12);VMg.add(limb(fg.clone().add(new THREE.Vector3(0,-.03,.03)),e2,.035,sleeve));VMg.add(limb(fg.clone().add(new THREE.Vector3(0,-.03,.03)),fg.clone().add(new THREE.Vector3(-.02,-.05,.06)),.038,cuffM));}
  VMg.traverse(o=>{if(o.material){o.renderOrder=5;}});
  // muzzle flash
  const fm=new THREE.MeshBasicMaterial({map:T3.star,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false,color:new THREE.Color(1.6,1.3,1)});
  const fl=new THREE.Group();for(let i=0;i<3;i++){const p=new THREE.Mesh(new THREE.PlaneGeometry(.18,.18),fm);if(i==1)p.rotation.y=Math.PI/2;if(i==2){p.rotation.x=Math.PI/2;p.scale.set(.55,1.8,1);}fl.add(p);}
  const side=new THREE.Mesh(new THREE.PlaneGeometry(.16,.42),fm);side.rotation.y=Math.PI/2;side.position.z=-.14;fl.add(side);
  fl.position.copy(vmGun.userData.muzzle);fl.visible=false;vmGun.add(fl);vmGun.userData.flash=fl;}
 const HIP={x:.19,y:-.17,z:-.4};
 // ---- third-person / enemy world guns ----
 const tpGun={o:null,type:null};
 // ---- FX pools ----
 const fxLight=new THREE.PointLight(0xffb060,0,9,1.6);scene.add(fxLight);
 const TRM={p:new THREE.MeshBasicMaterial({color:new THREE.Color(1,.78,.4).multiplyScalar(8),transparent:true,opacity:1,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}),e:new THREE.MeshBasicMaterial({color:new THREE.Color(1,.28,.5).multiplyScalar(8),transparent:true,opacity:1,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false})};
 const trG=new THREE.BoxGeometry(1,1,1);trG.translate(0,0,-.5);const tracers=[];
 for(let i=0;i<28;i++){const m=new THREE.Mesh(trG,TRM.p);m.visible=false;m.frustumCulled=false;scene.add(m);const hd=new THREE.Sprite(new THREE.SpriteMaterial({map:T3.dot,color:new THREE.Color(1,.82,.5).multiplyScalar(5),blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));hd.scale.setScalar(.22);m.add(hd);m.userData.hd=hd;tracers.push({m,live:0});}
 const NSP=220,spPos=new Float32Array(NSP*3),spCol=new Float32Array(NSP*3),spV=new Float32Array(NSP*3),spL=new Float32Array(NSP);let spI=0;
 const spGeo=new THREE.BufferGeometry();spGeo.setAttribute('position',new THREE.BufferAttribute(spPos,3));spGeo.setAttribute('color',new THREE.BufferAttribute(spCol,3));
 const sparks=new THREE.Points(spGeo,new THREE.PointsMaterial({size:.11,map:T3.dot,vertexColors:true,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));sparks.frustumCulled=false;scene.add(sparks);for(let i=0;i<NSP;i++)spPos[i*3+1]=-999;
 const burstSparks=(p,n,col,sp=4,up=1.5)=>{for(let k=0;k<n;k++){const i=spI++%NSP;spPos[i*3]=p.x;spPos[i*3+1]=p.y;spPos[i*3+2]=p.z;spV[i*3]=rnd(-1,1)*sp;spV[i*3+1]=rnd(-.3,1)*sp*.7+up;spV[i*3+2]=rnd(-1,1)*sp;spL[i]=rnd(.35,.7);const c=new THREE.Color(col);spCol[i*3]=c.r*3;spCol[i*3+1]=c.g*3;spCol[i*3+2]=c.b*3;}};
 const decals=[];const dGeo=new THREE.PlaneGeometry(1,1);
 for(let i=0;i<32;i++){const m=new THREE.Mesh(dGeo,new THREE.MeshBasicMaterial({map:T3.scorch,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4,opacity:.9}));const e=new THREE.Mesh(dGeo,new THREE.MeshBasicMaterial({map:T3.ember,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,polygonOffset:true,polygonOffsetFactor:-5,toneMapped:false}));e.position.z=.002;m.add(e);m.visible=false;scene.add(m);decals.push({m,e,t:0});}let dI=0;
 const putDecal=(p,n)=>{const d=decals[dI++%decals.length];d.m.position.copy(p).addScaledVector(n,.012);d.m.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),n);d.m.rotateZ(rnd(0,6));const s=rnd(.14,.22);d.m.scale.set(s,s,s);d.m.visible=true;d.t=0;d.e.material.opacity=1;d.m.material.opacity=.9;};
 // world-ray targets: static, non-skinned meshes (cached; refreshed when the city streams)
 let statics=[],staticsT=0;const _wp=new THREE.Vector3();const rebuildStatics=()=>{statics=[];const cx=cam.position.x,cz=cam.position.z;scene.traverse(o=>{if(!o.isMesh||o.isSkinnedMesh||o.visible===false||!o.geometry||o.userData.nlAbs)return;const mat=o.material;if(mat&&(Array.isArray(mat)?mat.every(m=>m&&m.transparent&&m.opacity<.15):mat.transparent&&mat.opacity<.15))return;let p=o,skip=false;while(p){if((p.userData&&(p.userData.human||p.userData.gun||p.userData.keep))||p===VM||p.isCamera||p===sparks){skip=true;break;}p=p.parent;}if(skip)return;const e=o.matrixWorld.elements;if(Math.hypot(e[12]-cx,e[14]-cz)>85)return;statics.push(o);});staticsT=0;};
 const RC=new THREE.Raycaster();RC.far=70;
 const worldHit=(o,d,far=70)=>{RC.set(o,d);RC.far=far;let best=null;for(const m of statics){if(!m.visible)continue;let par=m.parent,vis=true;while(par){if(par.visible===false){vis=false;break;}par=par.parent;}if(!vis)continue;const hs=RC.intersectObject(m,false);if(hs.length&&(!best||hs[0].distance<best.distance))best=hs[0];}
  // ground plane fallback
  if(!best&&d.y<-.005){const gy=G.groundY?G.groundY(o.x,o.z,P.y):0;const t=(gy+.02-o.y)/d.y;if(t>0&&t<far)best={distance:t,point:o.clone().addScaledVector(d,t),face:{normal:new THREE.Vector3(0,1,0)},ground:1};}
  if(best){const n=best.face?best.face.normal.clone():new THREE.Vector3(0,1,0);if(best.object&&!best.ground)n.transformDirection(best.object.matrixWorld);if(n.dot(d)>0)n.negate();best.n=n;}return best;};
 // ---- HUD ----
 const ui=document.createElement('div');ui.id='guns';ui.innerHTML='<div id="gxh"><i></i><i></i><i></i><i></i></div><div id="ghm"><i></i><i></i><i></i><i></i></div><div id="gam"><b>12</b><span>/ 36</span><small>KESTREL 9</small></div><button id="gDraw"><svg viewBox="0 0 24 24"><path d="M3 9h13l2-2h3v4h-3l-1 1h-4l-1 5H8l1-5H3z" fill="currentColor"/></svg><span>DRAW</span></button><button id="gFire"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="2" fill="currentColor"/><path d="M12 1v5M12 18v5M1 12h5M18 12h5" stroke="currentColor" stroke-width="2"/></svg></button><button id="gReload"><svg viewBox="0 0 24 24"><path d="M19 12a7 7 0 1 1-2-5" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M14 3h5v5" fill="none" stroke="currentColor" stroke-width="2.4"/></svg></button><div id="ghint"></div>';
 document.body.appendChild(ui);
 const st=document.createElement('style');st.textContent=`#guns{position:fixed;inset:0;pointer-events:none;z-index:28;font-family:system-ui}#guns.off{display:none}
#gxh{position:absolute;left:50%;top:50%;width:0;height:0;display:none}#gxh i{position:absolute;background:#fff;box-shadow:0 0 6px #7ff3ff,0 0 1px #000;border-radius:1px;transition:transform .06s}
#gxh i:nth-child(1),#gxh i:nth-child(2){width:2px;height:9px;left:-1px}#gxh i:nth-child(3),#gxh i:nth-child(4){height:2px;width:9px;top:-1px}
#gxh.on{display:block}#gxh.t i{background:#ff4d6d;box-shadow:0 0 8px #ff2050}
#ghm{position:absolute;left:50%;top:50%;opacity:0}#ghm i{position:absolute;width:2.5px;height:11px;background:#fff;left:-1.25px;top:-5.5px;box-shadow:0 0 6px #fff}#ghm.k i{background:#ff3050;box-shadow:0 0 10px #ff2040;height:15px;top:-7.5px}
#gam{position:absolute;right:calc(max(24px,env(safe-area-inset-right)) + 128px);bottom:calc(max(34px,env(safe-area-inset-bottom) + 12px) + 112px);color:#ffe9d0;text-align:right;text-shadow:0 0 10px rgba(255,138,61,.7);display:none;line-height:1}
#gam b{font:800 30px system-ui;letter-spacing:.02em}#gam span{font:600 15px system-ui;opacity:.75;margin-left:4px}#gam small{display:block;font:700 9px system-ui;letter-spacing:.22em;opacity:.7;margin-top:3px}#gam.low b{color:#ff5070;text-shadow:0 0 12px #ff2050}
#guns button{pointer-events:auto;position:absolute;display:none;align-items:center;justify-content:center;gap:6px;border:1.5px solid rgba(255,138,61,.65);background:rgba(20,8,14,.62);color:#ffd9bf;border-radius:50%;box-shadow:0 0 18px rgba(255,120,40,.25),inset 0 0 14px rgba(255,120,40,.15);-webkit-tap-highlight-color:transparent;touch-action:none;backdrop-filter:blur(3px)}
#guns button svg{width:44%;height:44%}#guns button.on{display:flex}#guns button:active,#guns button.pr{background:rgba(255,110,40,.35);transform:scale(.95)}
#gFire{width:104px;height:104px;right:calc(max(24px,env(safe-area-inset-right)) + 14px);bottom:calc(max(34px,env(safe-area-inset-bottom) + 12px) + 70px)}
#gReload{width:62px;height:62px;right:calc(max(24px,env(safe-area-inset-right)) + 128px);bottom:calc(max(34px,env(safe-area-inset-bottom) + 12px) + 36px)}
#gDraw{width:auto!important;height:46px;border-radius:24px!important;padding:0 16px 0 12px;right:calc(max(24px,env(safe-area-inset-right)) + 14px);top:58px;font:800 11px system-ui;letter-spacing:.16em}#gDraw svg{width:22px;height:22px}
#ghint{position:absolute;left:50%;bottom:22%;transform:translateX(-50%);max-width:62%;padding:10px 16px;border-radius:14px;background:rgba(14,8,20,.82);border:1px solid rgba(255,138,61,.5);color:#ffe6d2;font:500 13px/1.4 system-ui;text-align:center;opacity:0;transition:opacity .4s}#ghint.show{opacity:1}
#gam .rl{font:800 11px system-ui;letter-spacing:.2em;color:#7ff3ff}`;document.head.appendChild(st);
 const $=id=>ui.querySelector('#'+id);const bD=$('gDraw'),bF=$('gFire'),bR=$('gReload'),xh=$('gxh'),hm=$('ghm'),am=$('gam');
 const hint=(t,ms=6500)=>{const h=$('ghint');h.innerHTML=t;h.classList.add('show');clearTimeout(hint.t);hint.t=setTimeout(()=>h.classList.remove('show'),ms);};
 // ---- input ----
 let firing=false,fireId=null,fx0=0,fy0=0,fireQueued=false;
 bD.addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault();S.gun.drawn?holster():draw();});
 bR.addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault();reload();});
 bF.addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault();ac();if(!S.gun.drawn){draw();return;}firing=true;fireQueued=true;fireId=e.pointerId;fx0=e.clientX;fy0=e.clientY;bF.classList.add('pr');try{bF.setPointerCapture(e.pointerId);}catch(_){} });
 bF.addEventListener('pointermove',e=>{if(e.pointerId!==fireId)return;G.Input.look.dx+=(e.clientX-fx0)*G.Input.lookSens;G.Input.look.dy+=(e.clientY-fy0)*G.Input.lookSens;fx0=e.clientX;fy0=e.clientY;});
 const fUp=e=>{if(e.pointerId!==fireId)return;firing=false;fireId=null;bF.classList.remove('pr');};bF.addEventListener('pointerup',fUp);bF.addEventListener('pointercancel',fUp);
 addEventListener('keydown',e=>{if(e.repeat)return;if(e.code==='KeyG'){S.gun.drawn?holster():draw();}if(e.code==='KeyR')reload();if(e.code==='KeyF'&&S.gun.drawn){firing=true;fireQueued=true;}});addEventListener('keyup',e=>{if(e.code==='KeyF')firing=false;});
 // ---- core actions ----
 let drawT=0,reloadT=0,cool=0,kick=0,kickR=0,bloom=0,flashT=0,swayX=0,swayY=0,lastYaw=P.yaw,lastPitch=P.pitch,heat=0,shotsPublic=0,lastFireDbg=null;
 const canAct=()=>S.gun.has&&!G.dlg()&&!G.riding()&&!(G.blocked&&G.blocked());
 function draw(){if(!canAct()||S.gun.drawn)return;S.gun.drawn=1;buildVM();drawT=0;SFX.draw();H.onDraw&&H.onDraw();if(!S.flags.gunDrawHint){S.flags.gunDrawHint=1;hint('Hold <b>◎</b> to fire and drag it to aim · <b>↻</b> reloads.<br>Drawing in Crown or on Saltgate streets gets the Wardline\'s attention. On Tide turf nobody blinks.',8000);}}
 function holster(){if(!S.gun.drawn)return;if(H.fighting&&H.fighting()){toast('Not while they\'re shooting at you.');return;}S.gun.drawn=0;reloadT=0;SFX.click(.8,0,.2);}
 function reload(){if(!S.gun.drawn||reloadT>0)return;const Gd=cur(),m=S.gun.mag[S.gun.cur]||0;if(m>=Gd.mag)return;if(S.gun.ammo<=0){toast('No spare rounds. Ninefingers sells boxes.');SFX.dry();return;}reloadT=Gd.rl;const L=Gd.rl;SFX.click(.9,.12);burst({vol:.12,lp:800,dec:.03,len:.2,t0:.3});SFX.click(1.2,L*.62,.3);SFX.click(.75,L*.82,.32);}
 const finishReload=()=>{const Gd=cur(),k=S.gun.cur;const need=Gd.mag-(S.gun.mag[k]||0),take=Math.min(need,S.gun.ammo);S.gun.mag[k]=(S.gun.mag[k]||0)+take;S.gun.ammo-=take;};
 const markHit=(kill,head)=>{hm.className=kill?'k':'';hm.style.transition='none';hm.style.opacity=1;hm.style.transform='scale(1.25)';void hm.offsetWidth;hm.style.transition='opacity .28s, transform .28s';hm.style.opacity=0;hm.style.transform='scale(.85)';const R=kill?15:11;hm.querySelectorAll('i').forEach((el,i)=>{const a=Math.PI/4+i*Math.PI/2;el.style.transform=`translate(${Math.cos(a)*R}px,${Math.sin(a)*R}px) rotate(${a+Math.PI/2}rad)`;});SFX.hit(kill);if(head)toast('Headshot');};
 // ---- tracers ----
 function tracer(from,to,mat,speed,onArrive){const t=tracers.find(x=>!x.live)||tracers[0];t.live=1;t.m.material=mat;t.m.userData.hd.material.color.copy(mat.color).multiplyScalar(.85);t.from=from.clone();t.to=to.clone();t.dir=V.subVectors(to,from).clone();t.len=Math.max(.4,t.dir.length());t.dir.normalize();t.s=0;t.sp=Math.min(speed,t.len/0.14);t.cb=onArrive;t.m.visible=true;t.whiz=mat===TRM.e;t.wz=0;place(t);}
 function place(t){const head=Math.min(t.s,t.len),tail=Math.max(0,head-Math.min(4.5,t.sp*.045));t.m.position.copy(t.from).addScaledVector(t.dir,head);t.m.lookAt(V2.copy(t.m.position).add(t.dir));t.m.rotateY(Math.PI);t.m.scale.set(.07,.07,Math.max(.25,head-tail));t.m.userData.hd.scale.setScalar(.28+Math.min(.25,t.sp*.001));}
 // ---- enemies (driven during a fight) ----
 let fight=null;
 const bonesWorld=(a,n)=>a.h.bones&&a.h.bones[n]?a.h.bones[n].getWorldPosition(new THREE.Vector3()):null;
 function rigEnemy(n,col){const h=n.a.h;if(h.acts&&h.mixer&&ANIMS.Death){const root=h.mixer.getRoot();const mk=(k,c,once)=>{if(!ANIMS[c])return;const a=h.mixer.clipAction(ANIMS[c],root);if(once){a.setLoop(THREE.LoopOnce);a.clampWhenFinished=true;}h.acts[k]=a;};
   mk('ghit','HitRecieve',1);mk('ghit2','HitRecieve_2',1);mk('gdie','Death',1);n.clips=1;} // aim/shoot/run gun clips retarget short; keep locomotion idle until upper-body retarget
  n.gun=makeGun(n.type,col);n.gun.scale.setScalar(1.05);scene.add(n.gun);n.play=k=>{if(n.clips&&h.acts[k])h.play(k,.18);else h.play(k==='grun'||k==='gshoot'?'jog':k==='gaim'?'idle':'idle');};n.play('gaim');}
 function enemyAim(n){const a=n.a,o=a.h.obj;const hand=bonesWorld(a,'RightHand');const tgt=V2.set(cam.position.x,cam.position.y-.25,cam.position.z);
  if(hand&&n.hp>0){n.gun.position.copy(hand);}else{o.updateMatrixWorld();n.gun.position.set(a.x+Math.sin(o.rotation.y)*.35+Math.cos(o.rotation.y)*.2,(o.position.y||0)+1.25,a.z+Math.cos(o.rotation.y)*.35-Math.sin(o.rotation.y)*.2);}
  if(n.hp>0){n.gun.lookAt(tgt);n.gun.rotateY(Math.PI);}else if(!n.dropped){n.dropped=1;n.gun.rotation.set(Math.PI/2,0,rnd(0,6));n.gun.position.set(a.x+rnd(-.5,.5),(o.position.y||0)+.03,a.z+rnd(-.5,.5));}}
 const muzzleWorld=n=>{n.gun.updateMatrixWorld();return n.gun.userData.muzzle.clone().applyMatrix4(n.gun.matrixWorld);};
 function startFight(enemies,fac,cb){if(fight)return;rebuildStatics();const col=GANGCOL[fac]||0xff4060;
  fight={fac,cb,t:0,ens:enemies.map((a,i)=>({a,hp:2,cd:rnd(.9,1.8)+i*.4,type:fac==='cop'?'warden':fac==='saint'?(i%2?'rattler':'kestrel'):(i%2?'kestrel':'rattler'),move:null,mt:rnd(.5,1.5),hitT:0}))};
  for(const n of fight.ens){rigEnemy(n,col);n.a.h.obj.rotation.y=Math.atan2(P.x-n.a.x,P.z-n.a.z);}
  if(!S.gun.drawn&&S.gun.has){S.gun.drawn=1;buildVM();drawT=0;SFX.draw();}H.onFight&&H.onFight();}
 function endFight(){if(!fight)return;for(const n of fight.ens){if(n.gun){if(n.hp<=0&&!n.dropped)enemyAim(n);n.gun.userData.keep=n.hp<=0;if(n.hp>0)scene.remove(n.gun);else droppedGuns.push({o:n.gun,t:40});}}fight=null;}
 const droppedGuns=[];
 // cover: nearest blocker rect whose far side (from the player) is walkable
 function findCover(n){const a=n.a;let best=null,bd=1e9;for(const r of (G.CITY&&G.CITY.block)||[]){const cx=(r[0]+r[1])/2,cz=(r[2]+r[3])/2;const d=Math.hypot(cx-a.x,cz-a.z);if(d>9||d>bd)continue;const dx=cx-P.x,dz=cz-P.z,L=Math.hypot(dx,dz)||1;const hw=Math.max(r[1]-r[0],r[3]-r[2])/2+.6;const x=cx+dx/L*hw,z=cz+dz/L*hw;if(Math.hypot(x-P.x,z-P.z)<5)continue;if(G.walkable(x,z)&&G.walkable((x+a.x)/2,(z+a.z)/2)){bd=d;best=[x,z];}}
  if(!best){const dx=a.x-P.x,dz=a.z-P.z,L=Math.hypot(dx,dz)||1;for(const s of[1,-1]){const k=rnd(2,3.5)*s;const x=a.x-dz/L*k+dx/L*.8,z=a.z+dx/L*k+dz/L*.8;if(G.walkable(x,z)){best=[x,z];break;}}}return best;}
 function damage(n,dmg,head){if(!fight||n.hp<=0)return;n.hp-=head?99:dmg;const kill=n.hp<=0;markHit(kill,head&&kill);
  if(kill){n.play('gdie');n.deadT=0;H.onKill&&H.onKill(n);dropAmmo(n);if(fight.ens.every(e=>e.hp<=0)){const f=fight;setTimeout(()=>{if(fight===f){endFight();f.cb&&f.cb.won&&f.cb.won();}},1400);}}
  else{n.play(Math.random()<.5?'ghit':'ghit2');n.hitT=.55;n.cd=Math.max(n.cd,.7);n.move=findCover(n);n.mt=0;}}
 const pickups=[];const puGeo=new THREE.BoxGeometry(.22,.12,.14),puM=new THREE.MeshStandardMaterial({color:0x23262e,metalness:.6,roughness:.4,emissive:0x0}),puG=new THREE.MeshBasicMaterial({color:new THREE.Color(0xffc060).multiplyScalar(2.5),toneMapped:false});
 function dropAmmo(n){const o=new THREE.Group();const b=new THREE.Mesh(puGeo,puM),s=new THREE.Mesh(new THREE.BoxGeometry(.23,.02,.15),puG);s.position.y=.04;o.add(b,s);const y=(n.a.h.obj.position.y||0);o.position.set(n.a.x+rnd(-.4,.4),y+.12,n.a.z+rnd(-.4,.4));scene.add(o);pickups.push({o,y,amt:GUNS[n.type].mag+Math.round(rnd(0,6)),t:90});}
 // ---- firing ----
 function fire(){const Gd=cur(),k=S.gun.cur;if((S.gun.mag[k]||0)<=0){SFX.dry();cool=.25;if(S.gun.ammo>0)reload();else toast('Empty. Ninefingers sells rounds.');firing=false;return;}
  S.gun.mag[k]--;cool=Gd.rof;kick=Math.min(1.6,kick+.55*Gd.kick);kickR=rnd(-1,1);bloom=Math.min(1,bloom+.25*Gd.kick);SFX.shot(Gd);
  P.pitch=Math.min(1.05,P.pitch+.011*Gd.kick);P.yaw+=rnd(-.004,.004)*Gd.kick;
  const fl=vmGun&&vmGun.userData.flash;if(fl){fl.visible=true;fl.rotation.z=rnd(0,6);fl.scale.setScalar(rnd(1.05,1.45)*(Gd.len>.4?1.2:1));flashT=.1;}
  const mw=vmGun?vmGun.userData.muzzle.clone().applyMatrix4(vmGun.matrixWorld):cam.position.clone();fxLight.position.copy(mw);fxLight.color.set(0xffb060);fxLight.intensity=22;
  // keep camera + statics in sync even when tests/scripts set P without waiting a frame
  const eye=cam.position.y;cam.position.set(P.x,eye,P.z);const fwd=new THREE.Vector3(-Math.sin(P.yaw)*Math.cos(P.pitch),Math.sin(P.pitch),-Math.cos(P.yaw)*Math.cos(P.pitch));cam.lookAt(P.x+fwd.x,eye+fwd.y,P.z+fwd.z);cam.updateMatrixWorld(true);if(vmGun)vmGun.updateMatrixWorld(true);
  if(!statics.length||staticsT>2.5)rebuildStatics();
  // aim ray from the camera with spread
  const d=fwd.clone();const moving=Math.hypot(G.Input.move.x,G.Input.move.y)>.3;const spr=Gd.spread*(1+bloom*1.6+(moving?.8:0));d.x+=rnd(-1,1)*spr;d.y+=rnd(-1,1)*spr;d.z+=rnd(-1,1)*spr;d.normalize();
  const o=cam.position.clone();const wh=worldHit(o,d);let tDist=70,target=null,head=false;
  const cand=fight?fight.ens.filter(n=>n.hp>0):(H.bystanders?H.bystanders():[]).map(a=>({a,hp:2,ghost:1}));
  for(const n of cand){const wy=TW(n.a.x,n.a.z);// R16: aim against the body where it is drawn (terrain warp, camera-relative)
   const hp=bonesWorld(n.a,'Head')||new THREE.Vector3(n.a.x,(n.a.h.obj.position.y||0)+1.65,n.a.z);hp.y+=.06+wy;const tH=raySphere(o,d,hp,.2);if(tH!=null&&tH<tDist){tDist=tH;target=n;head=true;}
   const hip=bonesWorld(n.a,'Hips')||new THREE.Vector3(n.a.x,(n.a.h.obj.position.y||0)+.95,n.a.z),nk=bonesWorld(n.a,'neck')||hip.clone().setY(hip.y+.55);hip.y+=wy;nk.y+=wy;
   for(let s=0;s<=4;s++){const c=hip.clone().lerp(nk,s/4);const r=s===0?.24:.3;const t=raySphere(o,d,c,r);if(t!=null&&t<tDist-.01){tDist=t;target=n;head=false;}}
   const legs=raySphere(o,d,hip.clone().setY(hip.y-.45),.22);if(legs!=null&&legs<tDist){tDist=legs;target=n;head=false;}}
  // solid cover only blocks if it is clearly in front of the body (ignore thin props hugging a silhouette)
  if(wh&&wh.distance<tDist-.45){target=null;head=false;tDist=wh.distance;}
  else if(!target&&wh)tDist=wh.distance;
  lastFireDbg={tDist,hasTarget:!!target,head,wh:wh&&wh.distance,cand:cand.length,dir:[d.x,d.y,d.z]};
  const end=o.clone().addScaledVector(d,tDist);
  tracer(mw,end,TRM.p,Gd.auto?78:62,()=>{if(target){if(target.ghost){H.provoke&&H.provoke(target.a);return;}burstSparks(end,16,0xff3a5a,2.8,.8);burstSparks(end,10,0xffd080,3.6,1.2);damage(target,Gd.dmg,head);}
   else if(wh){burstSparks(end,22,0xffc070,4.2,1.6);burstSparks(end,8,0xfff0c0,2.2,.4);putDecal(end,wh.n);if(Math.random()<.45)SFX.ping();}else{burstSparks(end,8,0xffb060,2.5,.5);}});
  if(!fight){const r=H.region();if(r!=='docks'){shotsPublic++;heat+=4;H.publicShot&&H.publicShot(shotsPublic);}}
  updHud();}
 const raySphere=(o,d,c,r)=>{const ox=o.x-c.x,oy=o.y-c.y,oz=o.z-c.z;const b=ox*d.x+oy*d.y+oz*d.z,cc=ox*ox+oy*oy+oz*oz-r*r,h=b*b-cc;if(h<0)return null;const t=-b-Math.sqrt(h);return t>0?t:null;};
 function enemyFire(n){const a=n.a;const mw=muzzleWorld(n);const dx=P.x-a.x,dz=P.z-a.z,dist=Math.hypot(dx,dz);const moving=Math.hypot(G.Input.move.x,G.Input.move.y)>.3;
  const hitP=(moving?.24:.5)*(dist<12?1:.6)*(n.move?.6:1);const hit=Math.random()<hitP;const tgt=cam.position.clone();tgt.y-=.35;
  if(!hit){const side=new THREE.Vector3(-dz,0,dx).normalize();tgt.addScaledVector(side,rnd(.5,1.4)*(Math.random()<.5?1:-1));tgt.y+=rnd(-.4,.6);const far=tgt.clone().sub(mw).normalize();tgt.copy(mw).addScaledVector(far,dist+rnd(6,14));}
  const pan=Math.max(-1,Math.min(1,((dx*Math.cos(P.yaw)-dz*Math.sin(P.yaw))/(dist||1))*-1));SFX.enemy(dist,pan);n.play('gshoot');n.shootT=.35;
  fxLight.position.copy(mw);fxLight.color.set(0xff8060);fxLight.intensity=Math.max(fxLight.intensity,8);
  const ef=enemyFlash(mw,n);
  const wd=tgt.clone().sub(mw);const wl=wd.length();wd.normalize();const wh=hit?null:worldHit(mw,wd,wl);if(wh)tgt.copy(wh.point);
  tracer(mw,tgt,TRM.e,55,()=>{if(hit){H.hurt&&H.hurt(rnd(9,16));SFX.hurt();}else if(wh){burstSparks(tgt,10,0xff9060,3,1.2);putDecal(tgt,wh.n);}});
  if(!hit)setTimeout(()=>SFX.whiz(-pan*.6),Math.max(0,dist/55*1000-60));}
 const efl=[];function enemyFlash(p,n){let s=efl.find(x=>x.t<=0);if(!s){if(efl.length>5)s=efl[0];else{const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:T3.star,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false,color:new THREE.Color(1.8,1.3,1)}));scene.add(sp);s={sp,t:0};efl.push(s);}}s.sp.position.copy(p);s.sp.scale.setScalar(rnd(.35,.5));s.sp.material.rotation=rnd(0,6);s.sp.visible=true;s.t=.06;}
 // ---- HUD refresh ----
 function updHud(){const Gd=cur(),m=S.gun.mag[S.gun.cur]||0;am.querySelector('b').textContent=m;am.querySelector('span').textContent='/ '+S.gun.ammo;am.querySelector('small').innerHTML=reloadT>0?'<span class="rl">RELOADING</span>':Gd.n.toUpperCase();am.classList.toggle('low',m<=Math.ceil(Gd.mag*.25));}
 // ---- tick ----
 let wasShown=null;const hudEl=document.getElementById('hud');
 function tick(dt){const has=S.gun.has;const hudVis=hudEl&&!hudEl.classList.contains('hide');const busy=G.dlg()||G.riding()||(G.blocked&&G.blocked());
  if(S.gun.drawn&&(G.riding()||!has))S.gun.drawn=0;
  const show=has&&hudVis&&!busy;if(show!==wasShown){wasShown=show;ui.classList.toggle('off',!show);}
  const dr=!!S.gun.drawn;bD.classList.toggle('on',show&&!(fight&&dr));bD.querySelector('span').textContent=dr?'HOLSTER':'DRAW';bF.classList.toggle('on',show&&dr);bR.classList.toggle('on',show&&dr);am.style.display=show&&dr?'block':'none';
  const tp=G.tp&&G.tp();xh.classList.toggle('on',show&&dr);const xhEl=document.getElementById('xh');if(xhEl)xhEl.style.opacity=show&&dr?0:'';
  // view model
  if(reloadT>0){reloadT-=dt;if(reloadT<=0){reloadT=0;finishReload();}updHud.t=0;}
  if(cool>0)cool-=dt;
  VM.visible=dr&&!busy&&!tp;if(dr){buildVM();drawT=Math.min(1,drawT+dt*4);
   if(firing&&!busy&&reloadT<=0&&cool<=0&&(cur().auto||fireQueued)){fireQueued=false;fire();}
   if(!cur().auto&&!firing)fireQueued=false;
   kick=Math.max(0,kick-dt*(6+kick*4));bloom=Math.max(0,bloom-dt*1.6);
   let dy=P.yaw-lastYaw;if(dy>Math.PI)dy-=Math.PI*2;if(dy<-Math.PI)dy+=Math.PI*2;const dp=P.pitch-lastPitch;swayX+=(Math.max(-.05,Math.min(.05,dy*.6))-swayX)*Math.min(1,dt*10);swayY+=(Math.max(-.04,Math.min(.04,-dp*.5))-swayY)*Math.min(1,dt*10);
   const m=Math.min(1,Math.hypot(G.Input.move.x,G.Input.move.y));const bob=performance.now()/1000*(m>.85?11:8);const Gd=cur();
   const rl=reloadT>0?Math.sin(Math.PI*Math.min(1,(Gd.rl-reloadT)/Gd.rl)):0;const ds=1-drawT;
   VMg.position.set(HIP.x+swayX+Math.sin(bob*.5)*.008*m,HIP.y+swayY+Math.abs(Math.cos(bob*.5))*.007*m-ds*.25-rl*.06+kick*.012,HIP.z+kick*.055+(Gd.len>.4?.06:0));
   VMg.rotation.set(kick*.16-ds*.9+rl*.5+swayY*1.2,.16+swayX*1.5+kick*kickR*.03,rl*.75-swayX*.8);
   if(flashT>0){flashT-=dt;if(flashT<=0&&vmGun&&vmGun.userData.flash)vmGun.userData.flash.visible=false;}
   const sp=8+bloom*22+(m>.3?7:0)+kick*6;const tgtOn=fight&&aimAtEnemy();xh.classList.toggle('t',!!tgtOn);xh.querySelectorAll('i').forEach((el,i)=>{el.style.transform=i===0?`translateY(${-sp-9}px)`:i===1?`translateY(${sp}px)`:i===2?`translateX(${-sp-9}px)`:`translateX(${sp}px)`;});
   if(!fight){const r=H.region();if(r!=='docks'&&r!=='home'&&r!=='metro'){heat+=dt*(r==='crown'?1.4:.7);}else heat=Math.max(0,heat-dt*2);if(heat>9){heat=0;H.heat&&H.heat();}}
   updHud();}
  else{heat=Math.max(0,heat-dt);}
  lastYaw=P.yaw;lastPitch=P.pitch;
  // third-person gun on the player
  const pl=G.player&&G.player();if(dr&&tp&&pl&&pl.obj.visible){if(!tpGun.o||tpGun.type!==S.gun.cur){if(tpGun.o)scene.remove(tpGun.o);tpGun.o=makeGun(S.gun.cur,gangCol());tpGun.type=S.gun.cur;scene.add(tpGun.o);}const hb=pl.bones&&pl.bones.RightHand;if(hb){hb.getWorldPosition(tpGun.o.position);const f=new THREE.Vector3();cam.getWorldDirection(f);tpGun.o.scale.setScalar(1.15);tpGun.o.position.addScaledVector(f,.08);tpGun.o.position.y+=.03;tpGun.o.lookAt(tpGun.o.position.clone().add(f));tpGun.o.rotateY(Math.PI);}tpGun.o.visible=true;}else if(tpGun.o)tpGun.o.visible=false;
  // FX
  staticsT+=dt;if(fxLight.intensity>0)fxLight.intensity=Math.max(0,fxLight.intensity-dt*160);
  for(const t of tracers){if(!t.live)continue;t.s+=t.sp*dt;if(t.whiz){}if(t.s>=t.len+Math.min(2.8,t.sp*.03)){t.live=0;t.m.visible=false;continue;}if(t.s>=t.len&&t.cb){const c=t.cb;t.cb=null;c();}place(t);}
  let any=false;for(let i=0;i<NSP;i++){if(spL[i]<=0)continue;any=true;spL[i]-=dt;if(spL[i]<=0){spPos[i*3+1]=-999;continue;}spV[i*3+1]-=9.8*dt;spPos[i*3]+=spV[i*3]*dt;spPos[i*3+1]+=spV[i*3+1]*dt;spPos[i*3+2]+=spV[i*3+2]*dt;const f=Math.min(1,spL[i]*3);spCol[i*3]*=.97;spCol[i*3+1]*=.94;spCol[i*3+2]*=.9;}
  if(any){spGeo.attributes.position.needsUpdate=true;spGeo.attributes.color.needsUpdate=true;}
  for(const d of decals){if(!d.m.visible)continue;d.t+=dt;d.e.material.opacity=Math.max(0,1-d.t/1.6);if(d.t>30){d.m.material.opacity=Math.max(0,.9-(d.t-30)/3);if(d.t>33)d.m.visible=false;}}
  for(const s of efl){if(s.t>0){s.t-=dt;if(s.t<=0)s.sp.visible=false;}}
  for(let i=pickups.length-1;i>=0;i--){const p=pickups[i];p.t-=dt;p.o.rotation.y+=dt*1.5;p.o.position.y=p.y+.14+Math.sin(performance.now()/300)*.03;if(Math.hypot(P.x-p.o.position.x,P.z-p.o.position.z)<1.5&&Math.abs(P.y-p.y)<1.5){S.gun.ammo+=p.amt;toast(`+${p.amt} rounds`);SFX.click(1,0,.3);SFX.click(1.4,.08,.25);scene.remove(p.o);pickups.splice(i,1);updHud();}else if(p.t<=0){scene.remove(p.o);pickups.splice(i,1);}}
  for(let i=droppedGuns.length-1;i>=0;i--){const d=droppedGuns[i];d.t-=dt;if(d.t<=0){scene.remove(d.o);droppedGuns.splice(i,1);}}
  // the firefight
  if(fight){fight.t+=dt;const f=fight;for(const n of f.ens){const a=n.a,o=a.h.obj;
    if(n.hp<=0){n.deadT+=dt;a.h.mixer&&a.h.mixer.update(dt);if(!n.clips&&n.deadT<.6){o.rotation.x=-Math.PI/2*Math.min(1,n.deadT/.5);o.position.y=(n.y0??0)+.25*Math.min(1,n.deadT/.5);}enemyAim(n);continue;}
    if(n.y0==null)n.y0=o.position.y;
    o.rotation.y=Math.atan2(P.x-a.x,P.z-a.z);
    if(n.hitT>0){n.hitT-=dt;if(n.hitT<=0)n.play(n.move?'grun':'gaim');}
    if(n.shootT>0){n.shootT-=dt;if(n.shootT<=0&&n.hitT<=0)n.play(n.move?'grun':'gaim');}
    n.mt-=dt;if(!n.move&&n.mt<=0){n.mt=rnd(3,5.5);if(Math.random()<.7){n.move=findCover(n);if(n.move)n.play('grun');}}
    if(n.move&&n.hitT<=0){const dx=n.move[0]-a.x,dz=n.move[1]-a.z,L=Math.hypot(dx,dz);if(L<.25){n.move=null;n.play('gaim');}else{const s=Math.min(L,3.4*dt);const nx=a.x+dx/L*s,nz=a.z+dz/L*s;if(G.walkable(nx,nz)){a.x=nx;a.z=nz;o.position.x=nx;o.position.z=nz;if(G.groundY)o.position.y=G.groundY(nx,nz,o.position.y);}else{n.move=null;n.play('gaim');}}}
    n.cd-=dt;if(n.cd<=0&&n.hitT<=0){n.cd=rnd(1.1,2.2);if(!G.dlg())enemyFire(n);if(!fight)return;}
    a.h.mixer&&a.h.mixer.update(dt);enemyAim(n);}}
 }
 function aimAtEnemy(){const d=new THREE.Vector3();cam.getWorldDirection(d);for(const n of fight.ens){if(n.hp<=0)continue;const c=bonesWorld(n.a,'Spine')||new THREE.Vector3(n.a.x,1.2,n.a.z);const t=raySphere(cam.position,d,c,.55);if(t!=null)return true;}return false;}
 // ---- inventory ----
 function give(type,ammo=0,quiet){const g=S.gun;const first=!g.has&&!(g.owned||[]).length;g.has=1;if(!g.owned.includes(type))g.owned.push(type);if(g.mag[type]==null)g.mag[type]=GUNS[type].mag;g.cur=type;g.ammo+=ammo;vmType=null;
  if(!quiet&&!S.flags.gunHint){S.flags.gunHint=1;setTimeout(()=>hint(`You're carrying a <b>${GUNS[type].n}</b>. Tap <b>DRAW</b> (top right) to pull it, anywhere.<br>A long coat keeps it hidden from Wardline checkpoints. A drawn gun is never hidden.`,9000),700);}}
 const owned=t=>(S.gun.owned||[]).includes(t);
 function cycle(){const o=S.gun.owned;if(o.length<2)return;S.gun.cur=o[(o.indexOf(S.gun.cur)+1)%o.length];reloadT=0;drawT=0;SFX.draw();updHud();}
 am.style.pointerEvents='auto';am.addEventListener('pointerdown',e=>{e.stopPropagation();cycle();});
 return {tick,draw,holster,reload,fire:()=>{if(S.gun.drawn&&cool<=0&&reloadT<=0)fire();},startFight,endFight,give,owned,cycle,hint,
  get fight(){return fight;},get drawn(){return !!S.gun.drawn;},get reloading(){return reloadT>0;},cur,
  confiscate(){const g=S.gun;g.impound={owned:g.owned.slice(),cur:g.cur,mag:{...g.mag}};g.has=0;g.drawn=0;g.owned=[];},
  recover(){const g=S.gun,i=g.impound;if(!i)return;g.owned=i.owned;g.cur=i.cur;g.mag=i.mag;g.has=1;delete g.impound;vmType=null;},
  _dbg:{tracers,decals,sparks:()=>spL.filter(x=>x>0).length,pickups,VM,get vmGun(){return vmGun;},statics:()=>statics.length,rebuildStatics,ANIMS,get lastFire(){return lastFireDbg;}}};}
