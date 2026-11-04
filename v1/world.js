// World builder: dense voxel city block, neon, rain, wet streets.
import * as THREE from 'three';
export const rnd=(a,b)=>a+Math.random()*(b-a), pick=a=>a[Math.floor(Math.random()*a.length)];
let seed=7;export const srand=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
const sr=(a,b)=>a+srand()*(b-a), spick=a=>a[Math.floor(srand()*a.length)];
export const NEON=[0xff3fa4,0x3ff0ff,0xb04dff,0xff8a3d,0x5dff9b,0xffe14d,0xff4d5e];
const WALL=[0x2a2433,0x221d2c,0x302838,0x1d1a26,0x2e2a36,0x3a2c34,0x24202e];
// ---- instanced voxel batches ----
class Batch{constructor(mat){this.mat=mat;this.m=[];this.c=[];}
 add(x,y,z,sx,sy,sz,col){this.m.push(x,y,z,sx,sy,sz);this.c.push(col);}
 build(scene){const n=this.c.length;if(!n)return;const im=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),this.mat,n);const o=new THREE.Object3D(),c=new THREE.Color();
  for(let i=0;i<n;i++){const k=i*6;o.position.set(this.m[k],this.m[k+1],this.m[k+2]);o.scale.set(this.m[k+3],this.m[k+4],this.m[k+5]);o.updateMatrix();im.setMatrixAt(i,o.matrix);c.setHex(this.c[i]);if(this.mat.userData.boost)c.multiplyScalar(this.mat.userData.boost);im.setColorAt(i,c);}
  im.frustumCulled=false;scene.add(im);return im;}}
export function signTex(text,col,opt={}){const vert=opt.vert,fs=opt.fs||64;const cv=document.createElement('canvas');const ctx=cv.getContext('2d');
 const font=`${opt.weight||800} ${fs}px ${opt.cjk?'"Noto Sans CJK JP","Noto Serif CJK JP","Hiragino Sans",sans-serif':'"Arial Black",Impact,sans-serif'}`;ctx.font=font;
 const chars=vert?[...text]:[text];const w=vert?fs*1.4:ctx.measureText(text).width+fs*.8,h=vert?chars.length*fs*1.1+fs*.5:fs*1.5;cv.width=Math.ceil(w);cv.height=Math.ceil(h);
 ctx.fillStyle=opt.bg||'#0a0710';ctx.fillRect(0,0,cv.width,cv.height);ctx.font=font;ctx.textAlign='center';ctx.textBaseline='middle';
 const c='#'+new THREE.Color(col).getHexString();ctx.shadowColor=c;ctx.shadowBlur=fs*.25;ctx.fillStyle=c;
 if(vert)chars.forEach((ch,i)=>ctx.fillText(ch,w/2,fs*.75+i*fs*1.1));else ctx.fillText(text,w/2,h/2);
 ctx.globalCompositeOperation='source-atop';ctx.fillStyle=c;ctx.globalAlpha=.0;ctx.fillRect(0,0,cv.width,cv.height);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
 ctx.strokeStyle=c;ctx.lineWidth=fs*.08;ctx.strokeRect(fs*.06,fs*.06,cv.width-fs*.12,cv.height-fs*.12);
 const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return {t,aspect:cv.width/cv.height};}
export function buildWorld(scene,lights){
 const lit=new Batch(new THREE.MeshLambertMaterial());
 const metal=new Batch(new THREE.MeshStandardMaterial({roughness:.35,metalness:.6}));
 const glow=new Batch(new THREE.MeshBasicMaterial({toneMapped:false}));glow.mat.userData.boost=1;
 const glowHot=new Batch(new THREE.MeshBasicMaterial({toneMapped:false}));glowHot.mat.userData.boost=2.6;
 const signs=[];const flick=[];const streaks=[];
 const cand=[];const addLight=(x,y,z,col,int=6,dist=9,pri=0)=>{cand.push({x,y,z,col,int,dist,pri});};
 const sign=(text,col,x,y,z,h,opt={})=>{const s=signTex(text,col,opt);const w=h*s.aspect;const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:s.t,toneMapped:false,color:new THREE.Color(opt.int||1.25,opt.int||1.25,opt.int||1.25),side:THREE.DoubleSide}));
   m.position.set(x,y,z);if(opt.ry!==undefined)m.rotation.y=opt.ry;scene.add(m);signs.push(m);if(opt.flick)flick.push(m);
   if(opt.ry!==undefined){lit.add(x+.07,y,z,.06,h+.1,w+.1,0x111018);m.position.x-=.0;const m2=m.clone();m2.position.x+=.14;scene.add(m2);}else lit.add(x,y,z+Math.sign(z)*.06,w+.1,h+.1,.06,0x111018);
   if(opt.light!==false)addLight(x+(opt.ry!==undefined?0:0),y-.5,z-Math.sign(z)*1.2,col,opt.li||5,opt.ld||9,opt.pri?1:0);
   // wet-ground reflection streak
   const st=new THREE.Mesh(new THREE.PlaneGeometry(opt.ry!==undefined?.5:Math.min(w,3),y*1.1),streakMat(col));st.rotation.x=-Math.PI/2;st.position.set(x,.025,z-Math.sign(z)*(y*.55+.3));scene.add(st);streaks.push(st);return m;};
 // ---- ground ----
 const L=46;
 const road=new THREE.Mesh(new THREE.PlaneGeometry(L*2,12,1,1),new THREE.MeshStandardMaterial({color:0x0d0c14,roughness:.18,metalness:.55}));road.rotation.x=-Math.PI/2;scene.add(road);
 for(const s of[-1,1]){const sw=new THREE.Mesh(new THREE.BoxGeometry(L*2,.16,2.6),new THREE.MeshStandardMaterial({color:0x1a1822,roughness:.3,metalness:.4}));sw.position.set(0,.08,s*7.3);scene.add(sw);
  for(let x=-L;x<L;x+=1.2)lit.add(x,.17,s*7.3+sr(-1,1),1.15,.02,1.15,srand()<.5?0x1e1c26:0x22202a); // paving
  for(let x=-L;x<L;x+=.6)lit.add(x,.1,s*6,.58,.2,.2,0x3a3644); // curb
 }
 for(let x=-L;x<L;x+=4)glow.add(x,.02,0,1.6,.02,.12,0x4a4460); // lane dashes
 for(let i=0;i<20;i++){const p=new THREE.Mesh(new THREE.CircleGeometry(sr(.6,1.6),18),new THREE.MeshStandardMaterial({color:0x07060c,roughness:.02,metalness:.9}));p.rotation.x=-Math.PI/2;p.scale.y=sr(.4,.8);p.position.set(sr(-L,L),.012,sr(-5.5,5.5));scene.add(p);}
 // ---- buildings ----
 const winCols=[0xffc98a,0xffb06b,0x9fe8ff,0xff9fd6,0xc9b2ff,0xfff1c9];
 const vertTexts=['ホテル','電脳','薬局','麻雀','酒場','カラオケ','修理','占い','質屋','夜市','回線','整体'];
 const horTexts=['PACHI-9','BAR STATIC','CYBERDENT','24H','KESTREL HOTEL','OKAFOR CLINIC','NOODLE','LUCKY ORBIT','RE:LIFE','VOLT MART','SYNTH·BAR','TEA'];
 for(const s of[-1,1]){let x=-L;while(x<L){const w=sr(4.5,8.5),h=sr(13,34),cx=x+w/2,fz=s*8.6,depth=10;const wall=spick(WALL);
   const isLadle=s<0&&x<0&&x+w>0;
   lit.add(cx,h/2,fz+s*depth/2,w-.05,h,depth,wall);
   // ground floor
   if(!isLadle){const shopCol=spick(NEON);const open=srand()<.65;
    if(open){glow.add(cx,1.35,fz-s*.02,w*.7,2.2,.05,new THREE.Color(shopCol).multiplyScalar(.13).getHex());for(let k=0;k<4;k++)lit.add(cx+sr(-w*.3,w*.3),sr(.6,1.8),fz+s*.3,sr(.3,.8),sr(.3,1),.3,0x15121c);addLight(cx,1.6,fz-s*1.4,shopCol,2.5,6);}
    else for(let y=.2;y<2.6;y+=.18)lit.add(cx,y,fz-s*.05,w*.72,.1,.06,0x3d3a46); // shutter
    lit.add(cx,2.85,fz-s*.8,w*.82,.12,1.6,spick([0x5a2030,0x203a4a,0x3a2050,0x2a2a2a])); // awning
    glow.add(cx,2.78,fz-s*1.58,w*.82,.04,.04,shopCol);
    if(srand()<.8)sign(spick(horTexts),spick(NEON),cx,3.45,fz-s*.12,.62,{});
   }
   // upper floors
   for(let y=4.4;y<h-1.2;y+=1.9){for(let wx=x+.8;wx<x+w-.6;wx+=.95){const r=srand();
     if(r<.4){glow.add(wx,y,fz-s*.03,.6,.85,.04,new THREE.Color(spick(winCols)).multiplyScalar(sr(.12,.45)).getHex());lit.add(wx,y,fz-s*.06,.04,.85,.03,0x18161e);if(srand()<.4)lit.add(wx,y+.2,fz-s*.07,.6,.25,.02,spick([0x3a2a40,0x203040,0x402a2a]));}
     else{lit.add(wx,y,fz-s*.03,.6,.85,.04,0x0b0c16);if(srand()<.3)glow.add(wx,y-.3,fz-s*.04,.85,.5,.02,0x1b1030);} // dark glass, faint TV
     lit.add(wx,y-.5,fz-s*.1,.7,.06,.16,0x3a3442); // sill
     if(srand()<.2){lit.add(wx+.1,y-.8,fz-s*.3,.55,.38,.45,0x56535e);lit.add(wx+.1,y-.8,fz-s*.53,.38,.28,.02,0x2a2830);} // AC unit
     if(srand()<.06)glow.add(wx,y+.75,fz-s*.4,.5,.05,.05,spick(NEON));}
    if(srand()<.18){lit.add(cx,y-1.25,fz-s*.6,w*.8,.1,1.2,0x2c2834);for(let rx=x+.5;rx<x+w-.4;rx+=.3)lit.add(rx,y-.9,fz-s*1.15,.05,.6,.05,0x4a4652);lit.add(cx,y-.6,fz-s*1.15,w*.8,.05,.05,0x4a4652);}
   }
   lit.add(x+.35,h/2,fz-s*.25,.16,h,.16,0x4b4650); // pipe
   if(srand()<.5)lit.add(x+w-.5,h/2+1,fz-s*.4,.1,h-2,.1,0x3a3640);
   // roof clutter
   lit.add(cx,h+.3,fz-s*.1,w,.6,.3,0x1a1720);if(srand()<.6){lit.add(cx+sr(-1,1),h+1.2,fz+s*3,1.8,2,1.8,0x35303a);}
   if(srand()<.6){lit.add(cx,h+2.5,fz+s*2,.08,5,.08,0x55505a);const b=new THREE.Mesh(new THREE.BoxGeometry(.18,.18,.18),new THREE.MeshBasicMaterial({color:new THREE.Color(0xff3030).multiplyScalar(3),toneMapped:false}));b.position.set(cx,h+5,fz+s*2);scene.add(b);flick.push(b);}
   // big vertical sign
   if(!isLadle&&srand()<.35){const c2=spick(NEON);sign(spick(horTexts),c2,cx-w*.25,sr(7,15),fz-s*1.3,.7,{ry:Math.PI/2,fs:48,light:srand()<.4});}
   if(!isLadle&&srand()<.8){const col=spick(NEON);sign(spick(vertTexts),col,x+w-.6,sr(6,Math.min(h-4,13)),fz-s*1.0,sr(3.5,5.5),{vert:true,cjk:true,ry:Math.PI/2,flick:srand()<.2,li:7,ld:11});lit.add(x+w-.6,9,fz-s*.5,.1,.1,1,0x333);}
   x+=w;}}
 // end caps & far skyline (beyond fog for silhouette)
 for(const ex of[-L-4,L+4])lit.add(ex,20,0,8,40,40,0x1b1824);
 for(let i=0;i<70;i++){const a=srand()*Math.PI*2,r=sr(28,60);const x=Math.cos(a)*r*1.6,z=Math.sin(a)*r+Math.sign(Math.sin(a))*14,h=sr(30,90),w=sr(5,12);if(Math.abs(z)<17)continue;
  lit.add(x,h/2,z,w,h,w,0x14121c);for(let k=0;k<14;k++)glow.add(x+sr(-w/2,w/2),sr(4,h),z-Math.sign(z)*w/2-.05,sr(.4,1.5),sr(.3,.8),.1,new THREE.Color(spick(winCols)).multiplyScalar(.6).getHex());
  if(srand()<.3)glowHot.add(x,h*.7,z-Math.sign(z)*w/2-.1,w*.8,sr(1,3),.1,spick(NEON));}
 // overhead cables with lanterns
 const cableM=new THREE.LineBasicMaterial({color:0x0a0a10});
 for(let i=0;i<26;i++){const x0=sr(-L,L),x1=x0+sr(-6,6),y0=sr(5,14),y1=y0+sr(-2,2),sag=sr(.6,2);const pts=[];for(let t=0;t<=1.001;t+=.05)pts.push(new THREE.Vector3(x0+(x1-x0)*t,y0+(y1-y0)*t-Math.sin(t*Math.PI)*sag,-8.5+17*t));
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),cableM));
  if(srand()<.35){const col=spick([0xff4d5e,0xff8a3d,0xff3fa4]);for(let k=2;k<pts.length-2;k+=2){const p=pts[k];glowHot.add(p.x,p.y-.25,p.z,.22,.3,.22,col);}addLight(pts[10].x,pts[10].y-1,pts[10].z,col,3,8);}}
 // street props: vending machines, vents, poles
 const vents=[];
 for(let i=0;i<14;i++){const s=srand()<.5?-1:1,x=sr(-L+2,L-2);if(Math.abs(x)<6&&s<0)continue;const col=spick([0x3ff0ff,0xff3fa4,0xffe14d,0x5dff9b]);
  lit.add(x,1.0,s*8.1,.9,2,.7,0xb8b4c4);glow.add(x,1.2,s*7.74,.7,1.2,.02,new THREE.Color(col).multiplyScalar(.7).getHex());glow.add(x,.35,s*7.74,.5,.12,.02,0xffffff);if(i%2==0)addLight(x,1.2,s*7.2,col,2,4.5);}
 for(let i=0;i<8;i++){const x=sr(-L+4,L-4),z=sr(-4.5,4.5);lit.add(x,.03,z,.9,.06,.6,0x2a2830);vents.push(new THREE.Vector3(x,.1,z));}
 for(let x=-L+12;x<L;x+=13){for(const s of[-1,1]){lit.add(x,3,s*6.3,.12,6,.12,0x2a2830);lit.add(x,6,s*5.8,.1,.1,1,0x2a2830);glowHot.add(x,5.9,s*5.3,.4,.06,.2,0xbfe8ff);addLight(x,5.5,s*5.3,0x9fd8ff,3,8);}}
 // ---- The Neon Ladle storefront (x≈0, north side) ----
 const bar=new THREE.Group();scene.add(bar);
 lit.add(0,1.5,-8.7,7.6,3,.1,0x2b1c1c); // back wall
 glow.add(0,1.7,-8.6,6.8,1.6,.04,0x4a1a12); // warm kitchen glow wall
 for(let i=-3;i<=3;i++)glowHot.add(i,2.75,-8.55,.4,.08,.08,0xffb36b);
 lit.add(0,1.05,-6.25,7.4,.1,1.1,0x6a4a34);lit.add(0,.52,-6.25,7.2,1.02,.9,0x2a1a16); // counter
 for(let i=-3.4;i<=3.4;i+=.4)lit.add(i,.5,-5.78,.2,.9,.02,0x3a2420);
 for(let i=-2;i<=2;i++){lit.add(i*1.3,.62,-5.2,.5,.08,.5,0xb04040);lit.add(i*1.3,.3,-5.2,.08,.6,.08,0x444);} // stools
 for(let i=-2;i<=2;i+=2){metal.add(i*1.2,1.32,-7.5,.7,.5,.7,0x8a8a92);} // pots
 lit.add(0,3.1,-6.6,8.2,.14,2.8,0x7a1c24); // awning
 for(let i=-3.6;i<=3.6;i+=.9){glowHot.add(i,2.75,-5.25,.28,.4,.28,0xff4d3d);} // paper lanterns
 for(let i=-3.6;i<=3.6;i+=.45)lit.add(i,2.7,-5.25,.43,.42,.02,i%0.9==0?0x111:0x5a1414); // noren curtains
 const ladleSign=sign('NEON LADLE',0xff3fa4,0,4.5,-8.5,1.0,{li:10,ld:12,fs:80,pri:1});
 const ladleKanji=sign('麺',0x3ff0ff,4.4,6.2,-7.7,2.4,{cjk:true,li:6,pri:1});
 addLight(0,2.2,-6.6,0xffa060,8,8,1);
 const ladleOff=[ladleSign];
 const MAXL=window.__MAXL||22;const pri=cand.filter(c=>c.pri),rest=cand.filter(c=>!c.pri);const step=Math.max(1,rest.length/(MAXL-pri.length));
 for(const c of pri)mk(c);for(let i=0;i<rest.length&&lights.length<MAXL;i+=step)mk(rest[Math.floor(i)]);
 function mk(c){const l=new THREE.PointLight(c.col,c.int*1.4,c.dist*1.3,1.5);l.position.set(c.x,c.y,c.z);scene.add(l);lights.push(l);}
 // build batches
 lit.build(scene);metal.build(scene);glow.build(scene);glowHot.build(scene);
 return {signs,flick,streaks,vents,ladleSign,ladleKanji,L};
}
const streakTex=(()=>{const c=document.createElement('canvas');c.width=16;c.height=128;const g=c.getContext('2d');const gr=g.createLinearGradient(0,0,0,128);gr.addColorStop(0,'rgba(255,255,255,0)');gr.addColorStop(.75,'rgba(255,255,255,.55)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,16,128);const h=g.createLinearGradient(0,0,16,0);h.addColorStop(0,'rgba(0,0,0,1)');h.addColorStop(.5,'rgba(0,0,0,0)');h.addColorStop(1,'rgba(0,0,0,1)');g.globalCompositeOperation='destination-out';g.fillStyle=h;g.fillRect(0,0,16,128);return new THREE.CanvasTexture(c);})();
function streakMat(col){return new THREE.MeshBasicMaterial({map:streakTex,color:new THREE.Color(col).multiplyScalar(.9),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false});}
// ---- rain ----
export function makeRain(scene,n=2600){const g=new THREE.BufferGeometry();const a=new Float32Array(n*6);const sp=new Float32Array(n);
 for(let i=0;i<n;i++){const x=rnd(-18,18),y=rnd(0,16),z=rnd(-12,12);a.set([x,y,z,x-.03,y-.55,z+.02],i*6);sp[i]=rnd(14,20);}
 g.setAttribute('position',new THREE.BufferAttribute(a,3));const m=new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:0x9fb4e8,transparent:true,opacity:.32}));m.frustumCulled=false;scene.add(m);
 return {m,update(dt,c){const p=g.attributes.position.array;for(let i=0;i<n;i++){const k=i*6;let y=p[k+1]-sp[i]*dt;if(y<0){y=rnd(12,16);const x=c.x+rnd(-18,18),z=c.z+rnd(-12,12);p[k]=x;p[k+3]=x-.03;p[k+2]=z;p[k+5]=z+.02;}
   p[k+1]=y;p[k+4]=y-.55;}g.attributes.position.needsUpdate=true;}};}
// ---- steam/smoke puffs ----
export function makeSteam(scene,origins){const tex=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');const r=g.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,'rgba(255,255,255,.5)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,64,64);return new THREE.CanvasTexture(c);})();
 const ps=[];for(const o of origins)for(let i=0;i<7;i++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,color:0xc8c0e0,transparent:true,opacity:0,depthWrite:false}));scene.add(s);ps.push({s,o,t:Math.random()*4});}
 return {update(dt){for(const p of ps){p.t+=dt;if(p.t>4)p.t=0;const k=p.t/4;p.s.position.set(p.o.x+Math.sin(p.t*1.3)*.3,p.o.y+k*3,p.o.z);p.s.scale.setScalar(.6+k*2);p.s.material.opacity=Math.sin(k*Math.PI)*.09;}}};}
// ---- flying traffic ----
export function makeTraffic(scene){const cars=[];const cols=[0xffe0a0,0xff4d5e,0x9fe8ff];
 for(let lane=0;lane<4;lane++)for(let i=0;i<6;i++){const g=new THREE.Group();const body=new THREE.Mesh(new THREE.BoxGeometry(1.4,.4,.7),new THREE.MeshLambertMaterial({color:0x2a2834}));g.add(body);
  const hl=new THREE.Mesh(new THREE.BoxGeometry(.06,.12,.5),new THREE.MeshBasicMaterial({color:new THREE.Color(cols[lane%3]).multiplyScalar(3),toneMapped:false}));hl.position.x=.72;g.add(hl);
  const tl=new THREE.Mesh(new THREE.BoxGeometry(.06,.1,.5),new THREE.MeshBasicMaterial({color:new THREE.Color(0xff2040).multiplyScalar(2.5),toneMapped:false}));tl.position.x=-.72;g.add(tl);
  scene.add(g);cars.push({g,lane,x:rnd(-60,60),y:18+lane*5+rnd(-1,1),z:-4+lane*2.6,v:(lane%2?1:-1)*rnd(6,10)});}
 return {update(dt){for(const c of cars){c.x+=c.v*dt;if(c.x>70)c.x=-70;if(c.x<-70)c.x=70;c.g.position.set(c.x,c.y,c.z);c.g.rotation.y=c.v>0?0:Math.PI;}}};}
