// World builder: dense voxel city block, neon, rain, wet streets.
import * as THREE from 'three';
import {carSlot} from './cars.js';
import {segFor,segBox,TW,H as TH,nearRiver} from './terrain.js';
export const rnd=(a,b)=>a+Math.random()*(b-a), pick=a=>a[Math.floor(Math.random()*a.length)];
export let seed=7;export const srand=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
const sr=(a,b)=>a+srand()*(b-a), spick=a=>a[Math.floor(srand()*a.length)];
export const NEON=[0xff3fa4,0x3ff0ff,0xb04dff,0xff8a3d,0x5dff9b,0xffe14d,0xff4d5e];
const WALL=[0x2a2433,0x221d2c,0x302838,0x1d1a26,0x2e2a36,0x3a2c34,0x24202e];
// ---- instanced voxel batches ----
class Batch{constructor(mat){this.mat=mat;this.m=[];this.c=[];}
 add(x,y,z,sx,sy,sz,col){if(sy>2&&Math.abs(y-sy/2)<.03&&!this.noPlinth){y-=.35;sy+=.7;}// R16: building feet run below grade so slopes never show a gap
  this.m.push(x,y,z,sx,sy,sz);this.c.push(col);}
 build(scene){const n=this.c.length;if(!n)return;// R16: big boxes go into segmented buckets so the terrain warp bends their floors and wall feet
  const bk={};for(let i=0;i<n;i++){const k=i*6,sg=segFor(this.m[k+3],this.m[k+5]);(bk[sg]||(bk[sg]=[])).push(i);}let first=null;
  for(const sg in bk){const ids=bk[sg];const im=new THREE.InstancedMesh(sg==1?new THREE.BoxGeometry(1,1,1):segBox(+sg),this.mat,ids.length);const o=new THREE.Object3D(),c=new THREE.Color();
  ids.forEach((i,j)=>{const k=i*6;o.position.set(this.m[k],this.m[k+1],this.m[k+2]);o.scale.set(this.m[k+3],this.m[k+4],this.m[k+5]);o.updateMatrix();im.setMatrixAt(j,o.matrix);c.setHex(this.c[i]);if(this.mat.userData.boost)c.multiplyScalar(this.mat.userData.boost);im.setColorAt(j,c);});
  im.computeBoundingSphere();im.frustumCulled=true;scene.add(im);if(!first||sg==1)first=im;}return first;}}
export function signTex(text,col,opt={}){const vert=opt.vert,fs=opt.fs||64;const cv=document.createElement('canvas');const ctx=cv.getContext('2d');
 const sty=opt.style!==undefined?opt.style:(opt.cjk?0:Math.floor(Math.random()*5));// R9: 5 sign looks (block, serif, thin outline, condensed italic, script) so streets don't read as one brand
 const fam=opt.cjk?'"Noto Sans CJK JP","Noto Serif CJK JP","Hiragino Sans",sans-serif':['"Arial Black",Impact,sans-serif','Didot,"Bodoni 72",Georgia,serif','"Helvetica Neue",Helvetica,Arial,sans-serif','"Avenir Next Condensed","Arial Narrow",sans-serif','"Snell Roundhand","Brush Script MT",cursive'][sty];
 const font=`${sty===4?'':sty===3?'italic ':''}${opt.weight||(sty===2?300:sty===1?600:800)} ${fs}px ${fam}`;ctx.font=font;
 const chars=vert?[...text]:[text];const w=vert?fs*1.4:ctx.measureText(text).width+fs*.8,h=vert?chars.length*fs*1.1+fs*.5:fs*1.5;cv.width=Math.ceil(w);cv.height=Math.ceil(h);
 ctx.fillStyle=opt.bg||'#0a0710';ctx.fillRect(0,0,cv.width,cv.height);ctx.font=font;ctx.textAlign='center';ctx.textBaseline='middle';
 const c='#'+new THREE.Color(col).getHexString();ctx.shadowColor=c;ctx.shadowBlur=fs*.25;ctx.fillStyle=c;
 if(vert)chars.forEach((ch,i)=>ctx.fillText(ch,w/2,fs*.75+i*fs*1.1));else ctx.fillText(text,w/2,h/2);
 ctx.globalCompositeOperation='source-atop';ctx.fillStyle=c;ctx.globalAlpha=.0;ctx.fillRect(0,0,cv.width,cv.height);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
 ctx.strokeStyle=c;if(sty===0){ctx.lineWidth=fs*.08;ctx.strokeRect(fs*.06,fs*.06,cv.width-fs*.12,cv.height-fs*.12);}else if(sty===1){ctx.lineWidth=fs*.03;ctx.strokeRect(fs*.06,fs*.06,cv.width-fs*.12,cv.height-fs*.12);ctx.strokeRect(fs*.16,fs*.16,cv.width-fs*.32,cv.height-fs*.32);}else if(sty===2){ctx.lineWidth=fs*.05;ctx.beginPath();ctx.moveTo(fs*.4,cv.height-fs*.15);ctx.lineTo(cv.width-fs*.4,cv.height-fs*.15);ctx.stroke();}else if(sty===3){ctx.lineWidth=fs*.06;ctx.beginPath();ctx.arc(fs*.3,cv.height/2,fs*.12,0,7);ctx.arc(cv.width-fs*.3,cv.height/2,fs*.12,0,7);ctx.stroke();}
 const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return {t,aspect:cv.width/cv.height};}
// ================= corridor generator (local space: street runs along +x, facades at |z|=hw) =================
const winCols=[0xffc98a,0xffb06b,0x9fe8ff,0xff9fd6,0xc9b2ff,0xfff1c9];
const vertTexts=['ホテル','電脳','薬局','麻雀','酒場','カラオケ','修理','占い','質屋','夜市','回線','整体','水路','屋台','漢方','電気'];
const horTexts=['PACHI-9','BAR STATIC','CYBERDENT','24H','KESTREL HOTEL','OKAFOR CLINIC','NOODLE','LUCKY ORBIT','RE:LIFE','VOLT MART','SYNTH·BAR','TEA','DUMPLING','FIXER','MEMORY+','KARAOKE','GOLDEN WOK','NEURO-NAILS','HOTPOT 88','ARCADE OMEGA','BLUE LOTUS','SOBA SOBA','CHROME DOC','LUCKY CAT','NIGHT PHARMA','DATA CAFÉ','GYOZA KING','STARLIGHT INN','PIXEL PAWN','TEMPLE BAR','WET WIRE','MAHJONG','OYSTER','SUSHI GO','BAO HAUS','VHS·DVD','CAPSULE 7','SAKE SAKE'];
export function corridor(scene,cfg,cand){const NE=cfg.neon||NEON,HT0=cfg.hor||horTexts,VT0=cfg.vert||vertTexts;
 // R9: draw sign texts from a shuffled deck (no repeat until every text is used once) instead of picking with replacement
 const deck=a=>{let q=[];return()=>{if(!q.length){q=a.slice();for(let i=q.length-1;i>0;i--){const j=Math.floor(srand()*(i+1));[q[i],q[j]]=[q[j],q[i]];}}return q.pop();};};const HT=deck(HT0),VT=deck(VT0);ZL=(ZI++%5)*.003;// R9: each district's ground sits a few mm apart so overlapping road/paving planes at junctions never z-fight
 const G=new THREE.Group();G.position.set(cfg.cx,0,cfg.cz);G.rotation.y=cfg.rot||0;scene.add(G);G.updateMatrixWorld();
 const lit=new Batch(new THREE.MeshLambertMaterial()),glow=new Batch(new THREE.MeshBasicMaterial({toneMapped:false})),glowHot=new Batch(new THREE.MeshBasicMaterial({toneMapped:false}));glow.mat.userData.boost=1;glowHot.mat.userData.boost=2.6;
 const L=cfg.len/2,hw=cfg.hw,kind=cfg.kind||'street',gaps=cfg.gaps||[];const vents=[],steamPts=[],flick=[];
 const toW=(x,y,z)=>new THREE.Vector3(x,y,z).applyMatrix4(G.matrixWorld);
 const addLight=(x,y,z,col,int=6,dist=9,pri=0)=>{const w=toW(x,y,z);cand.push({x:w.x,y:w.y,z:w.z,col,int,dist,pri});};
 const sign=(text,col,x,y,z,h,opt={})=>{const st=signTex(text,col,opt);const w=h*st.aspect;const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:st.t,toneMapped:false,color:new THREE.Color(1.25,1.25,1.25),side:THREE.DoubleSide}));
  m.position.set(x,y,z);if(opt.ry!==undefined){m.rotation.y=opt.ry;lit.add(x,y,z,.05,h+.1,w+.1,0x111018);m.position.x+=.04;const m2=m.clone();m2.position.x-=.08;G.add(m2);}else{if(z>0)m.rotation.y=Math.PI;lit.add(x,y,z+Math.sign(z)*.05,w+.1,h+.1,.05,0x111018);}
  G.add(m);if(opt.flick)flick.push(m);if(opt.light!==false)addLight(x,y-.5,z-Math.sign(z)*1.2,col,opt.li||5,opt.ld||9,opt.pri?1:0);
  if(kind!=='canal'||Math.abs(z)>4){const sk=new THREE.Mesh(new THREE.PlaneGeometry(opt.ry!==undefined?.5:Math.min(w,3),Math.min(y*1.1,hw*1.6)),streakMat(col));sk.rotation.x=-Math.PI/2;sk.position.set(x,.05,z-Math.sign(z)*(Math.min(y*.55,hw*.8)+.3));G.add(sk);}return m;};
 // ---- ground ----
 if(kind==='street'){const road=new THREE.Mesh(new THREE.PlaneGeometry(cfg.len,hw*2-5.2),cfg.roadMat||ROAD);road.rotation.x=-Math.PI/2;road.position.y=ZL;G.add(road);
  for(const s of[-1,1]){const sw=new THREE.Mesh(new THREE.BoxGeometry(cfg.len,.16,2.6),cfg.walkMat||WALK);sw.position.set(0,.08,s*(hw-1.3));G.add(sw);
   for(let x=-L;x<L;x+=1.2)lit.add(x,.17,s*(hw-1.3)+sr(-1,1),1.15,.02,1.15,srand()<.5?(cfg.t1||0x1e1c26):(cfg.t2||0x22202a));for(let x=-L;x<L;x+=.6)lit.add(x,.1,s*(hw-2.6),.58,.2,.2,0x3a3644);}
  for(let x=-L;x<L;x+=4)glow.add(x,.02,0,1.6,.02,.12,0x4a4460);
 }else if(kind==='canal'){const wat=new THREE.Mesh(new THREE.PlaneGeometry(cfg.len,7),WATER);wat.rotation.x=-Math.PI/2;wat.position.y=-.9;G.add(wat);
  for(const s of[-1,1]){const sw=new THREE.Mesh(new THREE.BoxGeometry(cfg.len,.16,hw-3.5),WALK);sw.position.set(0,.08,s*(3.5+(hw-3.5)/2));G.add(sw);lit.add(0,-.45,s*3.55,cfg.len,.9,.1,0x2a2630);
   for(let x=-L;x<L;x+=1.2){lit.add(x,.17,s*sr(4,hw-.5),1.15,.02,1.15,srand()<.5?0x1e1c26:0x24202a);if(!(cfg.bridges||[]).some(b=>Math.abs(b-x)<2.2)){lit.add(x,.65,s*3.65,.08,.9,.08,0x4a4652);lit.add(x+.6,1.05,s*3.65,1.2,.06,.06,0x5a5662);}}}
  for(let i=0;i<cfg.len/2.2;i++){const col=spick([0xff3fa4,0x3ff0ff,0xffc070,0xb04dff,0xff8a3d,0xffd9a0]);const sk=new THREE.Mesh(new THREE.PlaneGeometry(sr(.15,.5),sr(2.5,6)),streakMat(col));sk.rotation.x=-Math.PI/2;sk.rotation.z=Math.PI/2;sk.position.set(sr(-L,L),-.88,sr(-3,3));G.add(sk);}
  for(const bx of cfg.bridges||[]){lit.add(bx,.1,0,3.6,.2,7.4,0x2e2a36);for(const s of[-1,1]){lit.add(bx+s*1.8,.6,0,.1,1,7.4,0x4a4652);}glowHot.add(bx,1.12,0,3.6,.04,.04,0xff8a3d);addLight(bx,2,0,0xff8a3d,3,7);}
  for(let i=0;i<5;i++){const x=sr(-L+4,L-4);if((cfg.bridges||[]).some(b=>Math.abs(b-x)<4))continue;const z=srand()<.5?-1.6:1.6;lit.add(x,-.6,z,5,.5,1.8,0x2b2228);lit.add(x,-.1,z,2.4,.7,1.4,0x3a2c30);glow.add(x,-.1,z-Math.sign(z)*.71,1.8,.3,.02,0xffb06b);for(let k=-2;k<=2;k++)glowHot.add(x+k*.9,.65,z,.18,.22,.18,0xff4d3d);addLight(x,.8,z,0xff8040,2.5,6);}
 }else{ // alley / plaza: paving everywhere
  const pv=new THREE.Mesh(new THREE.PlaneGeometry(cfg.len,hw*2),cfg.walkMat||WALK2);pv.rotation.x=-Math.PI/2;pv.position.y=.01+ZL;G.add(pv);
  for(let x=-L;x<L;x+=1)for(let z=-hw+.5;z<hw;z+=1)if(srand()<.3)lit.add(x+.5,.02,z,.95,.02,.95,srand()<.5?(cfg.t1||0x181620):(cfg.t2||0x1d1a26));}
 {const n=Math.round(cfg.len/2.6),im=new THREE.InstancedMesh(PUDDLE_G,PUDDLE,n),m=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler();// instanced puddles: one draw call per district
  for(let i=0;i<n;i++){const r=sr(.4,1.6);e.set(-Math.PI/2,0,sr(0,3.14));q.setFromEuler(e);m.compose(new THREE.Vector3(sr(-L,L),.034+(i%6)*.0025+ZL,sr(-hw+1,hw-1)*(kind==='canal'?0:1)+(kind==='canal'?(srand()<.5?-6:6):0)),q,new THREE.Vector3(r,r*sr(.35,.8),1));im.setMatrixAt(i,m);}
  im.computeBoundingSphere();G.add(im);}
 // ---- buildings ----
 for(const s of[-1,1]){let x=-L;while(x<L-1){let w=sr(4.5,8.5);if(x+w>L)w=L-x;const g=gaps.find(g=>g.side===s&&x+w>g.a&&x<g.b);if(g){if(x<g.a){w=g.a-x;}else{x=g.b;continue;}}if(w<1.5){x+=w;continue;}
   const cx=x+w/2,fh=(cfg.forceH||[]).find(f=>f.side===s&&cx>f.a&&cx<f.b),h=fh?fh.h:sr(cfg.hmin||13,cfg.hmax||34),fz=s*hw,depth=10,wall=spick(cfg.wall||WALL);const isLadle=cfg.ladle&&s<0&&x<0&&x+w>0;
   lit.add(cx,h/2,fz+s*depth/2,w-.05,h,depth,wall);(cfg._fh||(cfg._fh=[])).push([s,x,x+w,h]);
   if(!isLadle){const shopCol=spick(NE);const open=srand()<.7;
    if(open){glow.add(cx,1.35,fz-s*.02,w*.7,2.2,.05,new THREE.Color(shopCol).multiplyScalar(.13).getHex());for(let k=0;k<4;k++)lit.add(cx+sr(-w*.3,w*.3),sr(.6,1.8),fz+s*.3,sr(.3,.8),sr(.3,1),.3,0x15121c);addLight(cx,1.6,fz-s*1.4,shopCol,2.5,6);}
    else for(let y=.2;y<2.6;y+=.18)lit.add(cx,y,fz-s*.05,w*.72,.1,.06,0x3d3a46);
    lit.add(cx,2.85,fz-s*.8,w*.82,.12,1.6,spick([0x5a2030,0x203a4a,0x3a2050,0x2a2a2a]));glow.add(cx,2.78,fz-s*1.58,w*.82,.04,.04,shopCol);
    if(srand()<.85)sign(HT(),spick(NE),cx,3.45,fz-s*.12,.62,{});
    if(kind==='alley'&&srand()<.8){const tc=spick([0x6a2030,0x2a4a5a,0x5a4a20,0x402a5a]);lit.add(cx,2.2,fz-s*1.6,w*.6,.06,1.8,tc);lit.add(cx-w*.28,1.1,fz-s*1.6,.06,2.2,.06,0x333);lit.add(cx,.9,fz-s*1.4,w*.55,.1,1,0x4a3a30);
     for(let k=0;k<6;k++)lit.add(cx+sr(-w*.25,w*.25),1.05,fz-s*sr(1,1.8),sr(.2,.4),sr(.1,.3),sr(.2,.4),spick([0xc04040,0xe0a040,0x60a050,0xd0d0c0,0x8040a0]));glowHot.add(cx,2.05,fz-s*1.6,.2,.2,.2,0xffc070);addLight(cx,1.9,fz-s*1.6,0xffa050,2.5,5);steamPts.push(toW(cx,1.2,fz-s*1.4));}}
   for(let y=4.4;y<h-1.2;y+=1.9){for(let wx=x+.8;wx<x+w-.6;wx+=.95){const r=srand();
     if(r<.4){glow.add(wx,y,fz-s*.03,.6,.85,.04,new THREE.Color(spick(winCols)).multiplyScalar(sr(.12,.45)).getHex());lit.add(wx,y,fz-s*.06,.04,.85,.03,0x18161e);if(srand()<.4)lit.add(wx,y+.2,fz-s*.07,.6,.25,.02,spick([0x3a2a40,0x203040,0x402a2a]));}
     else{lit.add(wx,y,fz-s*.03,.6,.85,.04,0x0b0c16);if(srand()<.3)glow.add(wx,y-.3,fz-s*.04,.6,.4,.02,0x1b1030);}
     lit.add(wx,y-.5,fz-s*.1,.7,.06,.16,0x3a3442);
     if(srand()<.2){lit.add(wx+.1,y-.8,fz-s*.3,.55,.38,.45,0x56535e);lit.add(wx+.1,y-.8,fz-s*.53,.38,.28,.02,0x2a2830);}
     if(srand()<.06)glow.add(wx,y+.55,fz-s*.4,.5,.05,.05,spick(NE));}
    if(srand()<.18){lit.add(cx,y-1.25,fz-s*.6,w*.8,.1,1.2,0x2c2834);for(let rx=x+.5;rx<x+w-.4;rx+=.3)lit.add(rx,y-.9,fz-s*1.15,.05,.6,.05,0x4a4652);lit.add(cx,y-.6,fz-s*1.15,w*.8,.05,.05,0x4a4652);}}
   lit.add(x+.35,h/2,fz-s*.25,.16,h,.16,0x4b4650);if(srand()<.5)lit.add(x+w-.5,h/2+1,fz-s*.4,.1,h-2,.1,0x3a3640);
   lit.add(cx,h+.3,fz-s*.1,w,.6,.3,0x1a1720);if(srand()<.6&&!fh)lit.add(cx+sr(-1,1),h+1.2,fz+s*3,1.8,2,1.8,0x35303a);
   if(srand()<.5){lit.add(cx,h+2.5,fz+s*2,.08,5,.08,0x55505a);glowHot.add(cx,h+5,fz+s*2,.18,.18,.18,0xff3030);}
   if(!isLadle&&srand()<.35)sign(HT(),spick(NE),cx-w*.25,sr(7,15),fz-s*1.3,.7,{ry:Math.PI/2,fs:48,light:srand()<.4});
   if(!isLadle&&srand()<.8){sign(VT(),spick(NE),x+w-.6,sr(6,Math.min(h-4,13)),fz-s*1.0,sr(3.5,5.5),{vert:true,cjk:true,ry:Math.PI/2,flick:srand()<.2,li:7,ld:11});lit.add(x+w-.6,9,fz-s*.5,.1,.1,1,0x333333);}
   x+=w;}}
 for(const e of cfg.caps||[]){const ex=e*(L+4),pt=cfg.portal===e;if(pt){const Z=hw+10;lit.add(ex,20,-(Z+3.5)/2,8,40,Z-3.5,0x1b1824);lit.add(ex,20,(Z+3.5)/2,8,40,Z-3.5,0x1b1824);lit.add(ex,23.4,0,8,33.2,7,0x1b1824);lit.add(ex,.01,0,8,.02,7,0x2a2630);glowHot.add(ex-e*4.06,6.85,0,.08,.1,7,0x3ff0ff);glowHot.add(ex+e*4.06,6.85,0,.08,.1,7,0x3ff0ff);}else lit.add(ex,20,0,8,40,hw*2+20,0x1b1824);for(let k=0;k<40;k++){const yy=sr(3,38),zz=sr(-hw,hw),cc=new THREE.Color(spick(winCols)).multiplyScalar(sr(.1,.4)).getHex();if(!(pt&&yy<7.6&&Math.abs(zz)<4))glow.add(ex-e*4.05,yy,zz,.6,.85,.04,cc);}if(e)sign(VT(),spick(NE),ex-e*4.2,8,0,5,{vert:true,cjk:true,ry:Math.PI/2,li:6});}
 // overhead cables + lanterns
 // R10: cables used to span y 5..16 between any two x, so above low roofs (Docks h 7..14) or across side-street gaps they ended in midair. Each end now must land on a facade at least 1.5 m below its roofline, and gets a wall bracket.
 const FH=cfg._fh||[];delete cfg._fh;const roofAt=(s,x)=>{const f=FH.find(f=>f[0]===s&&x>f[1]+.3&&x<f[2]-.3);return f?f[3]:0;};
 for(let i=0;i<cfg.len/3.5*(cfg.cables??1);i++){const x0=sr(-L,L),x1=x0+sr(-6,6),hA=roofAt(-1,x0),hB=roofAt(1,x1);let y0=sr(5,14),y1=y0+sr(-2,2);const sag=sr(.6,2);y0=Math.min(y0,hA-1.5);y1=Math.min(y1,hB-1.5);if(y0<4.6||y1<4.6)continue;lit.add(x0,y0,-hw+.12,.14,.14,.24,0x3a3640);lit.add(x1,y1,hw-.12,.14,.14,.24,0x3a3640);const pts=[];for(let t=0;t<=1.001;t+=.05)pts.push(new THREE.Vector3(x0+(x1-x0)*t,y0+(y1-y0)*t-Math.sin(t*Math.PI)*sag,-hw+.1+(hw*2-.2)*t));
  G.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),CABLE));
  if(srand()<(kind==='alley'?.7:.35)){const col=spick([0xff4d5e,0xff8a3d,0xff3fa4,0xffc070]);for(let k=2;k<pts.length-2;k+=2){const p=pts[k];glowHot.add(p.x,p.y-.25,p.z,.22,.3,.22,col);}addLight(pts[10].x,pts[10].y-1,pts[10].z,col,3,8);}}
 // street furniture
 if(kind!=='canal')for(let i=0;i<cfg.len/7;i++){const s=srand()<.5?-1:1,x=sr(-L+2,L-2);if(cfg.ladle&&Math.abs(x)<6&&s<0)continue;if(gaps.some(g=>g.side===s&&x>g.a-1&&x<g.b+1))continue;const col=spick([0x3ff0ff,0xff3fa4,0xffe14d,0x5dff9b]);
  lit.add(x,1.0,s*(hw-.5),.9,2,.7,0xb8b4c4);glow.add(x,1.2,s*(hw-.86),.7,1.2,.02,new THREE.Color(col).multiplyScalar(.7).getHex());glow.add(x,.35,s*(hw-.86),.5,.12,.02,0xffffff);if(i%2==0)addLight(x,1.2,s*(hw-1.4),col,2,4.5);}
 if(kind==='street')for(let i=0;i<cfg.len/12;i++){const x=sr(-L+4,L-4),z=sr(-hw+4,hw-4);lit.add(x,.03,z,.9,.06,.6,0x2a2830);vents.push(toW(x,.1,z));}
 if(kind==='street')for(let x=-L+12;x<L;x+=13){for(const s of[-1,1]){if(gaps.some(g=>g.side===s&&x>g.a-1&&x<g.b+1))continue;lit.add(x,3,s*(hw-2.3),.12,6,.12,0x2a2830);lit.add(x,6,s*(hw-2.8),.1,.1,1,0x2a2830);glowHot.add(x,5.9,s*(hw-3.3),.4,.06,.2,0xbfe8ff);addLight(x,5.5,s*(hw-3.3),0x9fd8ff,3,8);}}
 if(kind==='canal')for(let x=-L+6;x<L;x+=9)for(const s of[-1,1]){lit.add(x,1.6,s*3.9,.1,3.2,.1,0x2a2830);glowHot.add(x,3.25,s*3.9,.25,.25,.25,0xffd9a0);addLight(x,3,s*4.2,0xffc890,2.5,7);}
 const ms=[lit.build(G),glow.build(G),glowHot.build(G)];
 return {G,vents:[...vents],steamPts,flick,cfg,api:{toW,lit,glow,glowHot,sign,addLight}};}
const ROAD=new THREE.MeshStandardMaterial({color:0x0d0c14,roughness:.18,metalness:.55});
const WALK=new THREE.MeshStandardMaterial({color:0x1a1822,roughness:.3,metalness:.4});
const WALK2=new THREE.MeshStandardMaterial({color:0x16141e,roughness:.22,metalness:.5});
const PUDDLE=new THREE.MeshStandardMaterial({color:0x07060c,roughness:.02,metalness:.9,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-2}),PUDDLE_G=new THREE.CircleGeometry(1,18);
const WATER=new THREE.MeshStandardMaterial({color:0x0a0c18,roughness:.05,metalness:.95});
const CABLE=new THREE.LineBasicMaterial({color:0x0a0a10});
// ================= the whole city =================
export const DISTRICTS={
 main:{name:'Saltgate Street',cx:0,cz:0,rot:0,len:96,hw:8.6,kind:'street',portal:-1,gaps:[{side:-1,a:20.8,b:27.2},{side:1,a:-27.4,b:-16.6}],caps:[-1],ladle:true,parent:null},
 alley:{name:'Lantern Market',cx:24,cz:-28.6,rot:Math.PI/2,len:40,hw:3.2,kind:'alley',hmin:10,hmax:26,caps:[1],parent:'main',join:[24,-6.5]},
 avenue:{name:'Line 9 Approach',cx:-22,cz:24.3,rot:-Math.PI/2,len:31.4,hw:5,kind:'street',hmin:14,hmax:30,parent:'main',join:[-22,6.5]},
 plaza:{name:'Line 9 Plaza',cx:-22,cz:54,rot:0,len:34,hw:14,kind:'plaza',hmin:18,hmax:40,gaps:[{side:-1,a:-5.2,b:5.2},{side:1,a:-5,b:5}],caps:[-1,1],parent:'avenue',join:[-22,41]},
 canal:{name:'Velvet Canal',cx:58,cz:0,rot:Math.PI/2,len:88,hw:10,kind:'canal',hmin:12,hmax:28,bridges:[-25,0,25],gaps:[{side:-1,a:-8.7,b:8.7}],caps:[],parent:'main',join:[50,0]}
};
let ZI=0,ZL=0;
export function buildWorld(scene,cand){const out={districts:{},flick:[],vents:[],steamPts:[],walk:[],block:[]};
 for(const k in DISTRICTS){if(DISTRICTS[k].cls)continue;seed=7+k.length*131+k.charCodeAt(0);const d=corridor(scene,DISTRICTS[k],cand);out.districts[k]=d;out.flick.push(...d.flick);out.vents.push(...d.vents);out.steamPts.push(...d.steamPts);}
 // walkable rectangles (world AABBs)
 const rect=(x0,x1,z0,z1)=>out.walk.push([Math.min(x0,x1),Math.max(x0,x1),Math.min(z0,z1),Math.max(z0,z1)]);
 rect(-47.5,49,-8.2,8.2);rect(21.2,26.8,-48,-7.2);rect(-26.6,-17.4,7.2,41.8);rect(-38.5,-5.5,40.5,67.6);// R6: joins overlap >0.6m so the 0.3m margin never seals a seam
 rect(48,54.2,-43.5,43.5);rect(61.8,67.6,-43.5,43.5);for(const b of[-25,0,25])rect(48,67.6,b-1.6,b+1.6);
 // ---- The Neon Ladle (main street, x≈0 north) ----
 const A=out.districts.main.api;const {lit,glow,glowHot,sign,addLight}=A;
 // (extra instanced batches for set pieces)
 const xl=new Batch(new THREE.MeshLambertMaterial()),xg=new Batch(new THREE.MeshBasicMaterial({toneMapped:false})),xh=new Batch(new THREE.MeshBasicMaterial({toneMapped:false}));xg.mat.userData.boost=1;xh.mat.userData.boost=2.6;
 const metal=new Batch(new THREE.MeshStandardMaterial({roughness:.35,metalness:.6}));
 xl.add(0,1.5,-8.7,7.6,3,.1,0x2b1c1c);xg.add(0,1.7,-8.6,6.8,1.6,.04,0x4a1a12);for(let i=-3;i<=3;i++)xh.add(i,2.75,-8.55,.4,.08,.08,0xffb36b);
 xl.add(0,1.05,-6.25,7.4,.1,1.1,0x6a4a34);xl.add(0,.52,-6.25,7.2,1.02,.9,0x2a1a16);for(let i=-3.4;i<=3.4;i+=.4)xl.add(i,.5,-5.78,.2,.9,.02,0x3a2420);
 for(let i=-2;i<=2;i++){xl.add(i*1.3,.62,-5.2,.5,.08,.5,0xb04040);xl.add(i*1.3,.3,-5.2,.08,.6,.08,0x444444);}
 // R8: back range against the rear wall (outside the walk rect), so the pass aisle z -6.95..-8.2 stays clear
 xl.add(0,.45,-8.43,7.4,.9,.46,0x2a2226);xl.add(0,.92,-8.43,7.5,.04,.5,0x5a5a62);for(let i=-2;i<=2;i+=2){metal.add(i*1.2,1.16,-8.43,.42,.44,.42,0x8a8a92);metal.add(i*1.2,.95,-8.43,.5,.02,.5,0x222226);}
 for(let i=-3;i<=3;i++){xl.add(i*.9,1.13,-6.4,.3,.06,.3,0xe8e0d0);} // bowls on counter
 xl.add(0,3.1,-6.6,8.2,.14,2.8,0x7a1c24);for(let i=-3.6;i<=3.6;i+=.9){xg.add(i,2.62,-5.3,.2,.26,.2,0xff5a2a);xl.add(i,2.8,-5.3,.03,.12,.03,0x222);}
 for(let i=-3.6;i<=3.6;i+=.45)xl.add(i,2.96,-5.22,.43,.26,.02,Math.round(i/.45)%2?0x6a1818:0x1a1010);
 xl.add(-6.2,1.2,-8.55,1.1,2.4,.1,0x3a3040);xh.add(-6.2,2.55,-8.5,.8,.08,.08,0x3ff0ff); // home door
 const ladleSign=sign('NEON LADLE',0xff3fa4,0,4.5,-8.5,1.0,{li:10,ld:12,fs:80,pri:1});sign('麺',0x3ff0ff,4.4,6.2,-7.7,2.4,{cjk:true,li:6,pri:1});addLight(0,2.2,-6.6,0xffa060,8,8,1);
 // ---- Line 9 station (plaza south) ----
 const st=(x,y,z,sx,sy,sz,c)=>xl.add(x,y,z,sx,sy,sz,c);
 st(-22,6,70.5,16,12,5,0x24202e);st(-22,.6,68.2,8,1.2,.4,0x3a3644);for(let k=0;k<5;k++)st(-22,.1+k*.0,67.9-k*.0,7.6,.1,.4,0x2a2630);
 xg.add(-22,1.6,68.0,6.2,2.4,.05,0x0c1a22);const gate=new THREE.Group();for(let gx=-2.8;gx<=2.8;gx+=.4){const b=new THREE.Mesh(new THREE.BoxGeometry(.08,2.6,.08),new THREE.MeshLambertMaterial({color:0x5a5662}));b.position.set(-22+gx,1.3,67.8);gate.add(b);}scene.add(gate);out.gate=gate;
 sign('LINE 9',0x3ff0ff,-22,4.2,67.9,1.3,{fs:90,li:10,ld:14,pri:1});sign('九号線',0xff8a3d,-27.5,7,67.9,1.0,{cjk:true,li:6});
 // elevated rail over the plaza
 for(let x=-39;x<=-5;x+=1)xl.add(x,9,50,1,.5,2.6,0x2a2632);for(const x of[-37,-30,-14,-7])xl.add(x,4.5,50,.6,9,.6,0x2a2632);for(let x=-39;x<=-5;x+=2)xh.add(x,8.7,48.75,.4,.06,.06,0xff3fa4);
 // plaza dressing: lamps, benches, ticket machines, holo billboard, glowing stair edge
 for(const [x,z] of[[-34,46],[-10,46],[-34,60],[-10,60],[-27,53],[-17,53]]){xl.add(x,2.2,z,.14,4.4,.14,0x2a2830);xl.add(x,4.45,z,.9,.08,.9,0x2a2830);xh.add(x,4.35,z,.7,.06,.7,0xffd2a0);addLight(x,3.8,z,0xffc890,4,9);}
 for(const [x,z] of[[-30,53],[-14,53]]){xl.add(x,.45,z,2.4,.1,.6,0x4a3a30);xl.add(x,.22,z,.1,.44,.5,0x333);}
 for(const x of[-28.5,-27.3,-16.7,-15.5]){out.block.push([x-.4,x+.4,66.65,67.15]);xl.add(x,.9,66.9,.8,1.8,.5,0x3a3a48);xg.add(x,1.2,66.63,.6,.5,.02,0x1a4a60);xh.add(x,.6,66.63,.3,.05,.02,0x3ff0ff);}addLight(-28,1.5,65.5,0x3ff0ff,3,6);addLight(-16,1.5,65.5,0x3ff0ff,3,6);
 xh.add(-22,.06,67.4,7,.03,.04,0x1fa8b8);xh.add(-25.9,1.6,67.8,.05,3.2,.05,0x1fa8b8);xh.add(-18.1,1.6,67.8,.05,3.2,.05,0x1fa8b8);xh.add(-22,3.2,67.8,7.9,.05,.05,0x1fa8b8);addLight(-22,2.5,65.8,0x3ff0ff,4,10,1);
 sign('ORRIN MUTUAL · YOUR FUTURE, FINANCED',0xb04dff,-22,11.5,49,1.1,{fs:56,li:8,ld:16});addLight(-22,8,46,0xb04dff,6,14);
 // station platform room (behind the gate)
 st(-22,0,72,10,.1,8,0x1a1820);st(-27,2,72,.2,4,8,0x2a2630);st(-17,2,72,.2,4,8,0x2a2630);st(-22,4,72,10,.2,8,0x1a1820);st(-22,2,76,10,4,.2,0x2a2630);
 for(let x=-26;x<=-18;x+=2)xh.add(x,3.85,72,.8,.06,.2,0xffd9a0);xl.add(-20,.5,74,1.6,1,.8,0x4a3a30);xh.add(-20,1.2,74,.2,.3,.2,0xffb36b);addLight(-22,3,72,0xffc890,9,12,1);addLight(-25.5,2.4,74.5,0x3ff0ff,4,8,1);xh.add(-26.85,.5,72,.04,.06,7.6,0x3ff0ff);xh.add(-17.15,.5,72,.04,.06,7.6,0x3ff0ff);xg.add(-22,2.4,75.85,4,.9,.04,0x1a3a48);xh.add(-22,.12,69.2,9.6,.03,.3,0xffd24a);
 // canal: Juno's houseboat marker & the old courier box
 xl.add(58,-.3,30,6,.8,2.4,0x2e2a36);xl.add(57,.6,30,3,1.4,2,0x3a3040);xg.add(57,.7,28.95,1.6,.5,.02,0x9fe8ff);addLight(57,1.4,28.5,0x9fe8ff,3,7);
 // rooftop-ish antenna junction boxes for Kip's quest (3 districts)
 for(const [x,z] of[[24,-46],[-36,62],[66,-38]]){xl.add(x,1,z,.8,1.6,.5,0x55505a);xh.add(x,1.5,z-.26*(z<0?-1:1),.3,.1,.02,0x5dff9b);}
 xl.build(scene);xg.build(scene);xh.build(scene);metal.build(scene);
 out.ladleSign=ladleSign;out.L=48;
 // far skyline
 const DUMMY={add(){}};
 const sky=new Batch(new THREE.MeshLambertMaterial()),skg=new Batch(new THREE.MeshBasicMaterial({toneMapped:false}));skg.mat.userData.boost=1.6;seed=99;
 for(let i=0;i<90;i++){const a=srand()*Math.PI*2,r=sr(80,140);const x=10+Math.cos(a)*r,z=20+Math.sin(a)*r,h=sr(40,120),w=sr(8,18);
  // R8: never stand a skyline block on the Ring Causeway band or on any street rect (they were the black boxes on the deck)
  const pad=w/2+2;// R16: the river valley / footbridge exclusions must not change the random stream (later districts draw from it), so hidden blocks still roll their dice into a throwaway batch
  const hide=nearRiver(x,z,pad+2)||[[44,140,-215,-40],[64,118,40,62],[64,118,-62,-40]].some(q=>x+pad>q[0]&&x-pad<q[1]&&z+pad>q[2]&&z-pad<q[3]);const SK=hide?DUMMY:sky,SG=hide?DUMMY:skg;
  if((x+pad>-84&&x-pad<-44)||[[44,100,-215,-40],[44,80,40,226]].some(q=>x+pad>q[0]&&x-pad<q[1]&&z+pad>q[2]&&z-pad<q[3])/* R11b: canal plazas + Harbor Rise roads */||out.walk.some(q=>x+pad>q[0]&&x-pad<q[1]&&z+pad>q[2]&&z-pad<q[3]))continue;SK.add(x,h/2,z,w,h,w,0x110f18);
  for(let k=0;k<10;k++)SG.add(x+sr(-w/2,w/2),sr(4,h),z+(z>20?-1:1)*(w/2+.05),sr(.5,2),sr(.3,.8),.1,new THREE.Color(spick(winCols)).multiplyScalar(.5).getHex());if(srand()<.35)SG.add(x,h*.75,z+(z>20?-1:1)*(w/2+.1),w*.8,sr(1.5,4),.1,spick(NEON));}
 sky.build(scene);skg.build(scene);
 return out;}
// dynamic light pool: a fixed number of PointLights follow the nearest candidates (keeps shader cost constant)
export function makeLightPool(scene,cand,n){const pool=[];for(let i=0;i<n;i++){const l=new THREE.PointLight(0xffffff,0,8,1.5);scene.add(l);pool.push({l,c:null,tI:0});}
 let t=0;return {pool,mul:1,update(dt,cam){const M=this.mul;t-=dt;if(t<=0){t=.35;const p=cam.position;const ranked=cand.map(c=>({c,d:(c.x-p.x)**2+(c.y-p.y)**2+(c.z-p.z)**2-(c.pri?400:0)})).sort((a,b)=>a.d-b.d).slice(0,n).map(r=>r.c);
   const free=pool.filter(s=>!ranked.includes(s.c));const want=ranked.filter(c=>!pool.some(s=>s.c===c));for(const s of free){const c=want.shift();if(!c){s.c=null;continue;}s.c=c;s.l.intensity=0;s.l.position.set(c.x,c.y,c.z);s.l.color.setHex(c.col);s.l.distance=c.dist*1.3;}}
  for(const s of pool){if(s.c)s.l.position.y=s.c.abs?s.c.y-TH(cam.position.x,cam.position.z):s.c.y+TW(s.c.x,s.c.z);const target=s.c?s.c.int*1.4*M:0;s.l.intensity+=(target-s.l.intensity)*Math.min(1,dt*4);}}};}
const streakTex=(()=>{const c=document.createElement('canvas');c.width=16;c.height=128;const g=c.getContext('2d');const gr=g.createLinearGradient(0,0,0,128);gr.addColorStop(0,'rgba(255,255,255,0)');gr.addColorStop(.75,'rgba(255,255,255,.55)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,16,128);const h=g.createLinearGradient(0,0,16,0);h.addColorStop(0,'rgba(0,0,0,1)');h.addColorStop(.5,'rgba(0,0,0,0)');h.addColorStop(1,'rgba(0,0,0,1)');g.globalCompositeOperation='destination-out';g.fillStyle=h;g.fillRect(0,0,16,128);return new THREE.CanvasTexture(c);})();
function streakMat(col){return new THREE.MeshBasicMaterial({map:streakTex,color:new THREE.Color(col).multiplyScalar(.9),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false});}
// ---- rain ----
export function makeRain(scene,n=2600){const g=new THREE.BufferGeometry();const a=new Float32Array(n*6);const sp=new Float32Array(n);
 for(let i=0;i<n;i++){const x=rnd(-18,18),y=rnd(0,16),z=rnd(-12,12);a.set([x,y,z,x-.03,y-.55,z+.02],i*6);sp[i]=rnd(14,20);}
 g.setAttribute('position',new THREE.BufferAttribute(a,3));const m=new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:0x9fb4e8,transparent:true,opacity:.32}));m.frustumCulled=false;scene.add(m);
 return {m,n,update(dt,c,fl=0){const p=g.attributes.position.array;for(let i=0;i<n;i++){const k=i*6;let y=p[k+1]-sp[i]*dt;if(y<fl||y>fl+20){y=fl+rnd(12,16);const x=c.x+rnd(-18,18),z=c.z+rnd(-12,12);p[k]=x;p[k+3]=x-.03;p[k+2]=z;p[k+5]=z+.02;}
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
  scene.add(g);carSlot(g,lane%3?'hover':'sky','salt',i+lane,Math.PI/2,-.35,1.15);cars.push({g,lane,x:rnd(-60,60),y:18+lane*5+rnd(-1,1),z:-4+lane*2.6,v:(lane%2?1:-1)*rnd(6,10)});}
 return {update(dt){for(const c of cars){c.x+=c.v*dt;if(c.x>70)c.x=-70;if(c.x<-70)c.x=70;c.g.position.set(c.x,c.y,c.z);c.g.rotation.y=c.v>0?0:Math.PI;}}};}
export {Batch,streakMat};export const MATS={ROAD,WALK,WALK2,PUDDLE,WATER};
