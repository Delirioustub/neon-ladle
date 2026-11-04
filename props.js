// R3.5 dressing pass: per-district street clutter + small signage, built in each district's local space so it streams with it.
import * as THREE from 'three';
import {Batch,signTex,DISTRICTS} from './world.js';
const VEND=[0xff3fa4,0x3ff0ff,0x5dff9b,0xffe14d,0xff8a3d];
const SMALL={mid:['RAMEN','OPEN 24H','KARAOKE','TATTOO','PACHINKO','HOTEL','BAR','LOANS','REPAIR','DUMPLINGS','麺','酒','薬','占い'],rich:['ATELIER','SALON','GALLERY','PRIVATE','VAULT','CONCIERGE','宝石'],poor:['CHEAP','FIX','BEDS','GIN','PAWN','BAIT','HOT FOOD','祈り','酒']};
export function dressCity(Wd,cand,avoid=[],blocks=[]){let n=0;// R9: props near doors are skipped; solid props push world AABBs into blocks
 for(const k in Wd){const cfg=DISTRICTS[k];if(!cfg||cfg.virtual||!Wd[k].G)continue;const G=Wd[k].G;seed(k);const cls=cfg.cls||'mid';G.updateMatrixWorld(true);
  const solid=(x,z,w,d)=>{const a=new THREE.Vector3(x-w/2,0,z-d/2).applyMatrix4(G.matrixWorld),b=new THREE.Vector3(x+w/2,0,z+d/2).applyMatrix4(G.matrixWorld);blocks.push([Math.min(a.x,b.x),Math.max(a.x,b.x),Math.min(a.z,b.z),Math.max(a.z,b.z)]);};
  const nearDoor=(x,z)=>{const v=new THREE.Vector3(x,0,z).applyMatrix4(G.matrixWorld);return avoid.some(q=>Math.hypot(q[0]-v.x,q[1]-v.z)<3.2);};
  const B=new Batch(new THREE.MeshLambertMaterial()),Gl=new Batch(new THREE.MeshBasicMaterial({toneMapped:false}));Gl.mat.userData.boost=1.6;
  const hw=cfg.hw,len=cfg.len,inGap=(side,x)=>(cfg.gaps||[]).some(g=>g.side===side&&x>g.a-1.2&&x<g.b+1.2)||(cfg.ladle&&side<0&&Math.abs(x)<6);
  const signs=[];const pal=cls==='rich'?[0xffffff,0x9fe8ff,0xc9b2ff]:cls==='poor'?[0xff4d3d,0xff8a3d,0x5dff9b]:[0xff3fa4,0x3ff0ff,0xffe14d,0x5dff9b,0xb04dff];
  for(const side of[-1,1]){const fz=side*(hw-.05);
   for(let x=-len/2+3;x<len/2-3;x+=rnd(2.4,4.2)){if(inGap(side,x))continue;const r=nearDoor(x,fz)?.55:rand(),zin=fz-side*.32;
    if(r<.12&&cls!=='rich'){// vending machine with lit front
     B.add(x,.95,zin,.9,1.9,.6,0x1a1a22);solid(x,zin,.9,.6);Gl.add(x,1.15,zin-side*.31,.78,1.2,.02,pick(VEND));Gl.add(x,.35,zin-side*.31,.5,.12,.02,0xffffff);cand.push(wp(G,x,1.2,zin-side*1));}
    else if(r<.3&&cls!=='rich'){solid(x,fz-side*.45,1.5,.9);for(let i=0;i<1+Math.floor(rand()*3);i++)B.add(x+rnd(-.5,.5),.22,fz-side*rnd(.25,.6),rnd(.4,.6),rnd(.35,.5),rnd(.4,.6),pick([0x101012,0x16161a,0x1a1c14]));}
    else if(r<.42){B.add(x,.4,zin+side*.05,.5,.8,.5,cls==='rich'?0x9a96a0:0x2a2a30);solid(x,zin+side*.05,.5,.5);if(cls==='rich'){B.add(x,1.1,zin,.6,.7,.6,0x1f4a38);}else Gl.add(x,.82,zin,.4,.04,.4,pick(pal));}
    else if(r<.52&&cls!=='rich'){B.add(x,.55,zin,1.3,.06,.04,0x3a3a40);B.add(x-.45,.35,zin,.5,.5,.03,0x222);B.add(x+.45,.35,zin,.5,.5,.03,0x222);}// parked bicycle-ish
    else if(r<.62){Gl.add(x,2.85,fz-side*.06,rnd(.8,1.6),.05,.03,pick(pal));}// neon underline strip
    // wall clutter above street level
    if(rand()<.55)B.add(x+rnd(-.6,.6),rnd(3.2,7),fz-side*.3,.8,.55,.55,0x2a2a30);// AC unit
    if(rand()<.18)for(let y=.2;y<Math.min(cfg.hmin||10,9);y+=1)B.add(x+1,y,fz-side*.08,.08,1,.08,0x3a3a3a);// pipe
    if(signs.length<5&&rand()<.14)signs.push([x,side]);}}
  // hanging lantern strings / cables across narrower streets
  if(hw<11)for(let x=-len/2+6;x<len/2-6;x+=rnd(9,14)){const y=rnd(4.6,6.2),col=pick(pal);B.add(x,y+.25,0,.02,.02,hw*2,0x0a0a10);for(let z=-hw+1;z<hw-.5;z+=rnd(1.1,1.8))Gl.add(x,y+.2*Math.cos(z/hw*1.57)-.1,z,.16,.2,.16,cls==='poor'?pick([0xff8a3d,0xffc070]):col);}
  for(const [x,side] of signs){const t=pick(SMALL[cls]||SMALL.mid),col=pick(pal),vert=/[^\x00-\x7f]/.test(t)&&rand()<.7;const st=signTex(t,col,{vert,fs:48});const h=vert?1.2:.38;
   const m=new THREE.Mesh(new THREE.PlaneGeometry(h*st.aspect,h),new THREE.MeshBasicMaterial({map:st.t,toneMapped:false,color:new THREE.Color(1.3,1.3,1.3),side:THREE.DoubleSide}));
   m.position.set(x,rnd(2.6,3.6),side*(hw-.75));m.rotation.y=Math.PI/2;G.add(m);B.add(x,m.position.y+h/2+.08,side*(hw-.4),.04,.04,.75,0x2a2a2a);cand.push(wp(G,x,m.position.y,side*(hw-1.2),col));n++;}
  B.build(G);Gl.build(G);}
 return n;}
// R11b: seeded per district, so the street dressing (and which props land near doors) is the same on every load and every device; tested once = tested.
let _s=1;const rand=()=>{_s=(_s*16807)%2147483647;return(_s-1)/2147483646;};const seed=k=>{_s=1;for(const c of k)_s=(_s*31+c.charCodeAt(0))%2147483647||7;for(let i=0;i<5;i++)rand();};
const rnd=(a,b)=>a+rand()*(b-a),pick=a=>a[Math.floor(rand()*a.length)];
function wp(G,x,y,z,col=0xffc0e0){const v=new THREE.Vector3(x,y,z).applyMatrix4(G.matrixWorld);return {x:v.x,y:v.y,z:v.z,col,int:2.2,dist:5,pri:0};}
