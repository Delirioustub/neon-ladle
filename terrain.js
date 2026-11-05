// R16 terrain. Veyra is one continuous hillside: Crown Heights on the high ground, the street districts on the slope,
// Ashline Docks at the sea. Gameplay keeps its flat "logical" coordinates (every system still treats street level as y=0);
// the renderer lifts every vertex by the terrain height H(x,z) relative to the camera's own ground (camera-relative warp),
// so feet, wheels, NPCs, props, lights and traffic all sit on the same ground by construction. The terrain skin, the river
// and its walls are absolute geometry (NL_ABS): they are built straight from H and only get the camera offset.
import * as THREE from 'three';
const S=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t);};
const gs=(x,z,cx,cz,r,h)=>h*Math.exp(-((x-cx)**2+(z-cz)**2)/(r*r));
export function H(x,z){
 let h=.5+5.5*S(235,150,z)+3.5*S(140,100,z)+3*S(60,-60,z)+16*S(-70,-205,z);
 const m=S(215,170,z)*S(-215,-180,z);h-=.035*Math.min(110,Math.max(-90,x))*m;
 const k=S(230,180,z);h+=k*(gs(x,z,-210,-40,95,16)+gs(x,z,230,-90,100,20)+gs(x,z,190,-280,85,9)+gs(x,z,-190,150,80,9)+gs(x,z,210,120,70,7));
 return h;}
const GL=`
float nlS(float a,float b,float x){float t=clamp((x-a)/(b-a),0.0,1.0);return t*t*(3.0-2.0*t);}
float nlG(vec2 p,vec2 c,float r,float h){vec2 d=p-c;return h*exp(-dot(d,d)/(r*r));}
float nlH(vec2 p){float z=p.y,x=p.x;
 float h=0.5+5.5*nlS(235.0,150.0,z)+3.5*nlS(140.0,100.0,z)+3.0*nlS(60.0,-60.0,z)+16.0*nlS(-70.0,-205.0,z);
 h-=0.035*clamp(x,-90.0,110.0)*nlS(215.0,170.0,z)*nlS(-215.0,-180.0,z);
 h+=nlS(230.0,180.0,z)*(nlG(p,vec2(-210.0,-40.0),95.0,16.0)+nlG(p,vec2(230.0,-90.0),100.0,20.0)+nlG(p,vec2(190.0,-280.0),85.0,9.0)+nlG(p,vec2(-190.0,150.0),80.0,9.0)+nlG(p,vec2(210.0,120.0),70.0,7.0));
 return h;}
float nlW(vec3 w){
#ifdef NL_NOWARP
 return 0.0;
#elif defined(NL_ABS)
 return -nlH(cameraPosition.xz);
#else
 return nlH(w.xz)-nlH(cameraPosition.xz);
#endif
}
`;
// ---- the warp, installed into three's shared shader chunks before anything compiles ----
const C=THREE.ShaderChunk;
if(!C.common.includes('nlH')){
 C.common+=GL;
 C.project_vertex=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
 mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
 mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelMatrix * mvPosition; mvPosition.y += nlW(mvPosition.xyz);
mvPosition = viewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`;
 C.worldpos_vertex=C.worldpos_vertex.replace('worldPosition = modelMatrix * worldPosition;','worldPosition = modelMatrix * worldPosition; worldPosition.y += nlW(worldPosition.xyz);');
 const sp=THREE.ShaderLib.sprite;sp.vertexShader=sp.vertexShader.replace('vec4 mvPosition = modelViewMatrix[ 3 ];','vec4 nlc = modelMatrix[ 3 ]; nlc.y += nlW(nlc.xyz); vec4 mvPosition = viewMatrix * nlc;');
}
// camera-relative offset on the CPU (lights, DOM labels, culling, aiming)
export const CAM=new THREE.Vector3();let camH=H(0,0);
export const setCam=p=>{CAM.copy(p);camH=H(p.x,p.z);};
export const TW=(x,z)=>H(x,z)-camH;
// frustum culling in render space: shift each bounding sphere by its own warp (and pad for shear across it)
{const F=THREE.Frustum.prototype,is=F.intersectsSphere,tmp=new THREE.Sphere();
 F.intersectsSphere=function(s){tmp.copy(s);tmp.center.y+=TW(s.center.x,s.center.z);tmp.radius=s.radius*1.25+1;return is.call(this,tmp);};}
export function hookRenderer(R){const r=R.render.bind(R);R.render=(sc,c)=>{c.updateMatrixWorld();setCam(c.getWorldPosition(new THREE.Vector3()));return r(sc,c);};}
export const absMat=m=>{m.defines=Object.assign(m.defines||{},{NL_ABS:''});m.needsUpdate=true;return m;};
export const noWarp=m=>{m.defines=Object.assign(m.defines||{},{NL_NOWARP:''});m.needsUpdate=true;return m;};
// ---- dense geometry so the warp bends floors and wall feet with the ground (longest-edge bisection in world xz) ----
export function subdivide(geo,mw,maxL=4){let g=geo.index?geo.toNonIndexed():geo.clone();const names=Object.keys(g.attributes);
 const A=names.map(n=>g.attributes[n]),isz=A.map(a=>a.itemSize);const src=A.map(a=>a.array);const out=names.map(()=>[]);
 const v=[new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3()];const P=g.attributes.position;const tri=[];
 const n=P.count/3;let budget=60000;
 const read=(i)=>A.map((a,k)=>Array.from(src[k].slice(i*isz[k],i*isz[k]+isz[k])));
 const W=vals=>{const p=vals[names.indexOf('position')];return new THREE.Vector3(p[0],p[1],p[2]).applyMatrix4(mw);};
 const mid=(a,b)=>a.map((x,k)=>x.map((y,j)=>(y+b[k][j])/2));
 const stack=[];for(let t=0;t<n;t++)stack.push([read(t*3),read(t*3+1),read(t*3+2)]);
 while(stack.length){const T=stack.pop();const w=T.map(W);const L=[w[0].distanceTo(w[1])*0+Math.hypot(w[0].x-w[1].x,w[0].z-w[1].z),Math.hypot(w[1].x-w[2].x,w[1].z-w[2].z),Math.hypot(w[2].x-w[0].x,w[2].z-w[0].z)];
  const mx=Math.max(...L);if(mx<=maxL||budget<=0){for(const p of T)p.forEach((x,k)=>out[k].push(...x));continue;}budget--;
  const e=L.indexOf(mx),a=T[e],b=T[(e+1)%3],c=T[(e+2)%3],m=mid(a,b);stack.push([a,m,c],[m,b,c]);}
 const ng=new THREE.BufferGeometry();names.forEach((nm,k)=>ng.setAttribute(nm,new THREE.Float32BufferAttribute(out[k],isz[k],A[k].normalized)));
 for(const gr of geo.groups||[])0;ng.computeBoundingSphere();ng.computeBoundingBox();return ng;}
export function subdivideScene(scene,maxL=4){const bb=new THREE.Box3();let n=0;const cache=new Map();
 scene.updateMatrixWorld(true);
 scene.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||o.isSkinnedMesh||!o.geometry||o.userData.nlAbs||(o.material&&o.material.defines&&('NL_ABS' in o.material.defines||'NL_NOWARP' in o.material.defines)))return;
  if(o.geometry.groups&&o.geometry.groups.length>1)return;
  bb.copy(o.geometry.boundingBox||(o.geometry.computeBoundingBox(),o.geometry.boundingBox)).applyMatrix4(o.matrixWorld);
  if(Math.max(bb.max.x-bb.min.x,bb.max.z-bb.min.z)<=maxL*1.2)return;
  o.geometry=subdivide(o.geometry,o.matrixWorld,maxL);n++;});return n;}
// buckets for big instanced boxes (Batch): a unit box with n segments on x and z
const BX={};export const segBox=n=>BX[n]||(BX[n]=new THREE.BoxGeometry(1,1,1,n,1,n));
export const segFor=(sx,sz)=>{const m=Math.max(sx,sz);if(m<=5)return 1;for(const n of[2,4,8,16,32,64])if(m/n<=4)return n;return 64;};
// ================= the land: terrain skin, the Velvet River (source in Crown Heights -> falls -> sea), walls, falls, footbridges =================
export const RIVER=[[110,-224],[112,-206],[110,-186],[106,-166],[101,-142],[95,-116],[91,-92],[88,-68],[87,-44],[87,-20],[87,4],[88,28],[89,52],[91,80],[93,110],[94,140],[94,168],[92,196],[90,222],[89,250],[88,290]];
const RW=4.6,WALL=5.6;// water half-width, inner wall line
let RS=null;// sampled river: [{x,z,nx,nz,L,s}]
function sampleRiver(){if(RS)return RS;const P=RIVER,pts=[];const cr=(a,b,c,d,t)=>{const t2=t*t,t3=t2*t;return .5*(2*b+(-a+c)*t+(2*a-5*b+4*c-d)*t2+(-a+3*b-3*c+d)*t3);};
 for(let i=0;i<P.length-1;i++){const a=P[Math.max(0,i-1)],b=P[i],c=P[i+1],d=P[Math.min(P.length-1,i+2)];const n=Math.ceil(Math.hypot(c[0]-b[0],c[1]-b[1])/2);for(let k=0;k<n;k++){const t=k/n;pts.push([cr(a[0],b[0],c[0],d[0],t),cr(a[1],b[1],c[1],d[1],t)]);}}pts.push(P[P.length-1]);
 const SEA=-.45;let L=H(pts[0][0],pts[0][1])-1.7,s=0;RS=[];
 for(let i=0;i<pts.length;i++){const [x,z]=pts[i],a=pts[Math.max(0,i-1)],b=pts[Math.min(pts.length-1,i+1)];let dx=b[0]-a[0],dz=b[1]-a[1];const l=Math.hypot(dx,dz)||1;dx/=l;dz/=l;
  if(i)s+=Math.hypot(x-pts[i-1][0],z-pts[i-1][1]);
  const t=Math.max(SEA,Math.min(H(x,z)-1.7,H(x+dz*7,z-dx*7)-1.7,H(x-dz*7,z+dx*7)-1.7));let fall=0;
  const Ln=Math.max(t,L-.035*2);if(Ln-t>1.5){fall=Ln-t;}
  if(fall){RS.push({x,z,nx:-dz,nz:dx,L:Ln,s,top:1});L=t;RS.push({x,z,nx:-dz,nz:dx,L,s:s+.001,fall});}else{L=Ln;RS.push({x,z,nx:-dz,nz:dx,L,s});}}
 return RS;}
export function riverDist(x,z){const R=sampleRiver();let best=1e9,bi=0;for(let i=0;i<R.length;i+=2){const d=(R[i].x-x)**2+(R[i].z-z)**2;if(d<best){best=d;bi=i;}}return {d:Math.sqrt(best),r:R[bi]};}
export const nearRiver=(x,z,pad=0)=>{for(const p of RIVER)0;return riverDist(x,z).d<WALL+1.2+pad;};
const canvasTex=(w,h,fn)=>{const c=document.createElement('canvas');c.width=w;c.height=h;fn(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;return t;};
export function buildLand(scene,cand,{walk,block}){const R=sampleRiver();const out={anim:[]};
 // --- terrain skin: one indexed grid, absolute heights, carved by the river channel, sunk under the sea past the docks
 const X0=-340,X1=340,Z0=-470,Z1=330,ST=6,nx=Math.round((X1-X0)/ST),nz=Math.round((Z1-Z0)/ST);
 const pos=new Float32Array((nx+1)*(nz+1)*3),col=new Float32Array((nx+1)*(nz+1)*3),idx=[];const cA=new THREE.Color(0x1d1a22),cB=new THREE.Color(0x2a2430),cG=new THREE.Color(0x16201c),cc=new THREE.Color();
 for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){const x=X0+i*ST,z=Z0+j*ST;let y=H(x,z)-1.08-7.5*S(196,240,z)-6*S(0,1,(Math.abs(x)-300)/40);
  const {d,r}=riverDist(x,z);if(d<WALL+7){const bed=r.L-1.6;const k=S(WALL+7,WALL+1,d);y=y*(1-k)+Math.min(y,bed)*k;}
  const k=(j*(nx+1)+i)*3;pos[k]=x;pos[k+1]=y;pos[k+2]=z;const n=Math.sin(x*.37)*Math.cos(z*.29)*.5+.5;cc.copy(cA).lerp(cB,n).lerp(cG,Math.max(0,Math.min(1,(H(x,z)-14)/14))*.6);col[k]=cc.r;col[k+1]=cc.g;col[k+2]=cc.b;}
 for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+1,c=a+nx+1,d=c+1;idx.push(a,c,b,b,c,d);}
 const tg=new THREE.BufferGeometry();tg.setAttribute('position',new THREE.BufferAttribute(pos,3));tg.setAttribute('color',new THREE.BufferAttribute(col,3));tg.setIndex(idx);tg.computeVertexNormals();
 const tm=absMat(new THREE.MeshLambertMaterial({vertexColors:true}));const terr=new THREE.Mesh(tg,tm);terr.userData.nlAbs=1;scene.add(terr);out.terrain=terr;
 out.groundAbs=(x,z)=>{const i=Math.floor((x-X0)/ST),j=Math.floor((z-Z0)/ST);if(i<0||j<0||i>=nx||j>=nz)return -99;const fx=(x-X0)/ST-i,fz=(z-Z0)/ST-j;const g=(ii,jj)=>pos[(jj*(nx+1)+ii)*3+1];
  return fx+fz<1?g(i,j)+(g(i+1,j)-g(i,j))*fx+(g(i,j+1)-g(i,j))*fz:g(i+1,j+1)+(g(i,j+1)-g(i+1,j+1))*(1-fx)+(g(i+1,j)-g(i+1,j+1))*(1-fz);};
 // --- river water: flowing ribbon (v runs downstream; the texture scrolls), falls are vertical rungs in the same strip
 const flowT=canvasTex(64,256,(g,w,h)=>{g.fillStyle='#000';g.fillRect(0,0,w,h);for(let i=0;i<140;i++){const x=Math.random()*w,y=Math.random()*h,l=8+Math.random()*40;const gr=g.createLinearGradient(0,y,0,y+l);gr.addColorStop(0,'rgba(160,220,255,0)');gr.addColorStop(.5,`rgba(160,220,255,${.15+Math.random()*.35})`);gr.addColorStop(1,'rgba(160,220,255,0)');g.fillStyle=gr;g.fillRect(x,y,1+Math.random()*1.5,l);}});
 const wv=[],wu=[],wi=[];R.forEach((p,i)=>{for(const s of[-1,1]){wv.push(p.x+p.nx*RW*s,p.L,p.z+p.nz*RW*s);wu.push(s<0?0:1.4,p.s/6+(p.fall?p.fall/6:0));}if(i){const a=(i-1)*2;wi.push(a,a+2,a+1,a+1,a+2,a+3);}});
 // fix uv for fall rungs: v continues by drop length so water accelerates over the lip
 {let acc=0;for(let i=0;i<R.length;i++){if(R[i].fall)acc+=R[i].fall;wu[i*4+1]=R[i].s/6+acc/2.5;wu[i*4+3]=wu[i*4+1];}}
 const wg=new THREE.BufferGeometry();wg.setAttribute('position',new THREE.Float32BufferAttribute(wv,3));wg.setAttribute('uv',new THREE.Float32BufferAttribute(wu,2));wg.setIndex(wi);wg.computeVertexNormals();{const n=wg.attributes.normal.array;for(let i=0;i<n.length;i+=3)if(!(Math.abs(n[i])+Math.abs(n[i+1])+Math.abs(n[i+2])>.01)){n[i]=0;n[i+1]=1;n[i+2]=0;}}
 const wm=absMat(new THREE.MeshStandardMaterial({color:0x0a1420,roughness:.12,metalness:.85,emissive:0x7fc8ff,emissiveMap:flowT,emissiveIntensity:.55,side:THREE.DoubleSide}));
 const water=new THREE.Mesh(wg,wm);water.userData.nlAbs=1;scene.add(water);out.water=water;
 // --- channel walls (stone, absolute): inner face from below water to the top, cap, outer face down to the ground; neon kerb on the cap
 const sv=[],si=[],gv=[],gi=[];const quad=(A,a,b,c,d,I)=>{const o=A.length/3;A.push(...a,...b,...c,...d);I.push(o,o+1,o+2,o,o+2,o+3);};
 for(const side of[-1,1]){let prev=null;for(let i=0;i<R.length;i++){const p=R[i];const ix=p.x+p.nx*WALL*side,iz=p.z+p.nz*WALL*side,ox=p.x+p.nx*(WALL+.7)*side,oz=p.z+p.nz*(WALL+.7)*side;
   const gnd=Math.max(H(ox,oz)-1.08,p.L-1);const top=Math.max(gnd+.9,p.L+.9);const cur={ix,iz,ox,oz,top,bot:p.L-1.8,gnd};
   if(prev&&Math.hypot(prev.ix-cur.ix,prev.iz-cur.iz)<.05){prev.top=Math.max(prev.top,cur.top);prev.bot=Math.min(prev.bot,cur.bot);continue;}if(prev){const P=prev,c=cur;const ty=Math.max(P.top,c.top);// keep caps continuous across a fall
    quad(sv,[P.ix,P.bot,P.iz],[c.ix,c.bot,c.iz],[c.ix,c.top,c.iz],[P.ix,P.top,P.iz],si);quad(sv,[P.ix,P.top,P.iz],[c.ix,c.top,c.iz],[c.ox,c.top,c.oz],[P.ox,P.top,P.oz],si);quad(sv,[P.ox,P.top,P.oz],[c.ox,c.top,c.oz],[c.ox,c.gnd-1,c.oz],[P.ox,P.gnd-1,P.oz],si);
    const e=(q,t)=>[q.ix+(q.ox-q.ix)*t,q.top+.03,q.iz+(q.oz-q.iz)*t];quad(gv,e(P,.06),e(c,.06),e(c,.16),e(P,.16),gi);}
   prev=cur;}}
 const stoneT=canvasTex(128,128,(g,w,h)=>{g.fillStyle='#3a3640';g.fillRect(0,0,w,h);for(let y=0;y<h;y+=16)for(let x=(y/16%2)*16;x<w;x+=32){g.fillStyle=`rgb(${50+Math.random()*14},${46+Math.random()*12},${56+Math.random()*14})`;g.fillRect(x+1,y+1,30,14);}});
 const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.Float32BufferAttribute(sv,3));sg.setIndex(si);sg.computeVertexNormals();{const n=sg.attributes.normal.array;for(let i=0;i<n.length;i+=3)if(!(Math.abs(n[i])+Math.abs(n[i+1])+Math.abs(n[i+2])>.01)){n[i]=0;n[i+1]=1;n[i+2]=0;}}
 const wallM=absMat(new THREE.MeshLambertMaterial({color:0x8a8494,side:THREE.DoubleSide}));const walls=new THREE.Mesh(sg,wallM);walls.userData.nlAbs=1;scene.add(walls);
 const gg=new THREE.BufferGeometry();gg.setAttribute('position',new THREE.Float32BufferAttribute(gv,3));gg.setIndex(gi);
 const neon=absMat(new THREE.MeshBasicMaterial({color:new THREE.Color(0x3ff0ff).multiplyScalar(1.6),toneMapped:false,side:THREE.DoubleSide}));const kerb=new THREE.Mesh(gg,neon);kerb.userData.nlAbs=1;scene.add(kerb);
 // --- falls: white water sheet, foam at the foot, mist, a light that makes the spray glow
 const foamT=canvasTex(64,64,(g,w,h)=>{const r=g.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,'rgba(255,255,255,.9)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,w,h);});
 const sheetT=canvasTex(64,128,(g,w,h)=>{g.fillStyle='rgba(0,0,0,0)';g.clearRect(0,0,w,h);for(let i=0;i<90;i++){const x=Math.random()*w,l=20+Math.random()*60,y=Math.random()*h;g.fillStyle=`rgba(220,240,255,${.25+Math.random()*.5})`;g.fillRect(x,y,1+Math.random()*2,l);}});
 const sheetM=absMat(new THREE.MeshBasicMaterial({map:sheetT,color:0xcfe8ff,transparent:true,opacity:.85,depthWrite:false,side:THREE.DoubleSide}));
 const falls=[];R.forEach((p,i)=>{if(!p.fall)return;const top=R[i-1].L,bot=p.L;const g=new THREE.PlaneGeometry(RW*2,top-bot+.3,1,1);const m=new THREE.Mesh(g,sheetM);m.position.set(p.x,(top+bot)/2,p.z);m.rotation.y=Math.atan2(p.nx,p.nz)+Math.PI/2;m.userData.nlAbs=1;scene.add(m);
  const fm=[];for(let k=0;k<6;k++){const s=new THREE.Sprite(absMat(new THREE.SpriteMaterial({map:foamT,color:0xdff2ff,transparent:true,opacity:.5,depthWrite:false})));s.position.set(p.x+p.nx*(k-2.5)*1.5,bot+.3,p.z+p.nz*(k-2.5)*1.5);s.scale.setScalar(2.2);s.userData.b=s.position.clone();s.userData.t=Math.random()*3;scene.add(s);fm.push(s);}
  falls.push({p,top,bot,fm});cand.push({x:p.x,y:bot+1.5-H(p.x,p.z),z:p.z,col:0x9fe8ff,int:3,dist:12,pri:0});});
 out.falls=falls;
 out.anim.push((T,dt)=>{flowT.offset.y-=dt*.55;sheetT.offset.y+=dt*1.6;for(const f of falls)for(const s of f.fm){s.userData.t+=dt;const k=(s.userData.t%2.4)/2.4;s.position.y=s.userData.b.y+k*1.4;s.material.opacity=Math.sin(k*Math.PI)*.45;s.scale.setScalar(1.6+k*2.2);}});
 return out;}
