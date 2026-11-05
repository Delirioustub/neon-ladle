// R16 terrain. Veyra is one continuous hillside: Crown Heights on the high ground, the street districts on the slope,
// Ashline Docks at the sea. Gameplay keeps its flat "logical" coordinates (every system still treats street level as y=0);
// the renderer lifts every vertex by the terrain height H(x,z) relative to the camera's own ground (camera-relative warp),
// so feet, wheels, NPCs, props, lights and traffic all sit on the same ground by construction. The terrain skin, the river
// and its walls are absolute geometry (NL_ABS): they are built straight from H and only get the camera offset.
import * as THREE from 'three';
const S=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t);};
const gs=(x,z,cx,cz,r,h)=>{const q=Math.max(0,1-((x-cx)**2+(z-cz)**2)/(r*r*4));return h*q*q*q;};// cheap bell (same in GLSL)
export function H(x,z){
 let h=.5+5.5*S(235,150,z)+3.5*S(140,100,z)+3*S(60,-60,z)+16*S(-60,-215,z);
 const m=S(215,170,z)*S(-240,-150,z);h-=.035*Math.min(70,Math.max(-90,x))*m;
 const k=S(230,180,z);h+=k*(gs(x,z,-210,-40,95,16)+gs(x,z,230,-90,100,20)+gs(x,z,190,-280,85,9)+gs(x,z,-190,150,80,9)+gs(x,z,210,120,70,7));
 return h;}
const GL=`
float nlS(float a,float b,float x){float t=clamp((x-a)/(b-a),0.0,1.0);return t*t*(3.0-2.0*t);}
float nlG(vec2 p,vec2 c,float r,float h){vec2 d=p-c;float q=max(0.0,1.0-dot(d,d)/(r*r*4.0));return h*q*q*q;}
float nlH(vec2 p){float z=p.y,x=p.x;
 float h=0.5+5.5*nlS(235.0,150.0,z)+3.5*nlS(140.0,100.0,z)+3.0*nlS(60.0,-60.0,z)+16.0*nlS(-60.0,-215.0,z);
 h-=0.035*clamp(x,-90.0,70.0)*nlS(215.0,170.0,z)*nlS(-240.0,-150.0,z);
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
export function subdivideScene(scene,maxL=8){const bb=new THREE.Box3();let n=0;const cache=new Map();
 scene.updateMatrixWorld(true);
 scene.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||o.isSkinnedMesh||!o.geometry||o.userData.nlAbs||(o.material&&o.material.defines&&('NL_ABS' in o.material.defines||'NL_NOWARP' in o.material.defines)))return;
  if(o.geometry.groups&&o.geometry.groups.length>1)return;
  bb.copy(o.geometry.boundingBox||(o.geometry.computeBoundingBox(),o.geometry.boundingBox)).applyMatrix4(o.matrixWorld);
  if(Math.max(bb.max.x-bb.min.x,bb.max.z-bb.min.z)<=maxL*1.2)return;
  o.geometry=subdivide(o.geometry,o.matrixWorld,maxL);n++;});return n;}
// buckets for big instanced boxes (Batch): a unit box with n segments on x and z
const BX={};export const segBox=n=>BX[n]||(BX[n]=new THREE.BoxGeometry(1,1,1,n,1,n));
export const segFor=(sx,sz)=>{const m=Math.max(sx,sz);if(m<=9)return 1;for(const n of[2,4,8,16,32])if(m/n<=8)return n;return 32;};
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
 // sunken ground: Harbor Rise road capsules (logical y<0) and the Velvet Canal basin pull the skin down under them
 const sunk=[];for(const r of walk){const q=r[5];if(q&&q.seg&&r[4]<-.1){const [ax,az,ay,bx,bz,by]=q.seg;const dx=bx-ax,dz=bz-az,l2=dx*dx+dz*dz||1;
   sunk.push((x,z)=>{if(x<r[0]-9||x>r[1]+9||z<r[2]-9||z>r[3]+9)return null;let t=((x-ax)*dx+(z-az)*dz)/l2;t=Math.max(0,Math.min(1,t));const d=Math.hypot(x-ax-dx*t,z-az-dz*t);if(d>q.hw+7)return null;return [S(q.hw+7,q.hw+1.5,d),ay+(by-ay)*t-1.2];});}}
 sunk.push((x,z)=>{if(x<46||x>70||z<-50||z>50)return null;const d=Math.max(Math.abs(x-58)-4,Math.abs(z)-44,0);return [S(7,1,d),-1.4];});
 // --- terrain skin: one indexed grid, absolute heights, carved by the river channel, sunk under the sea past the docks
 const X0=-340,X1=340,Z0=-470,Z1=330,ST=6,nx=Math.round((X1-X0)/ST),nz=Math.round((Z1-Z0)/ST);
 const pos=new Float32Array((nx+1)*(nz+1)*3),col=new Float32Array((nx+1)*(nz+1)*3),idx=[];const cA=new THREE.Color(0x8a8494),cB=new THREE.Color(0xa49aa8),cG=new THREE.Color(0x6e8a72),cc=new THREE.Color();
 for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){const x=X0+i*ST,z=Z0+j*ST;let y=H(x,z)-.14-7.5*S(196,240,z)-6*S(0,1,(Math.abs(x)-300)/40);{let lo=0,kk=0;for(const q of sunk){const k=q(x,z);if(k&&k[0]>kk){kk=k[0];lo=k[1];}}if(kk)y=y*(1-kk)+Math.min(y,H(x,z)+lo)*kk;}
  const {d,r}=riverDist(x,z);if(d<WALL+1.2){y=Math.min(y,r.L-1.6);}else if(d<WALL+26){const bank=r.L+.55+(d-WALL-1.2)*.16;y=Math.min(y,bank*(1-S(WALL+16,WALL+26,d))+y*S(WALL+16,WALL+26,d));}
  const k=(j*(nx+1)+i)*3;pos[k]=x;pos[k+1]=y;pos[k+2]=z;const n=Math.sin(x*.37)*Math.cos(z*.29)*.5+.5;cc.copy(cA).lerp(cB,n).lerp(cG,Math.max(0,Math.min(1,(H(x,z)-14)/14))*.6);col[k]=cc.r;col[k+1]=cc.g;col[k+2]=cc.b;}
 for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+1,c=a+nx+1,d=c+1;idx.push(a,c,b,b,c,d);}
 const tg=new THREE.BufferGeometry();tg.setAttribute('position',new THREE.BufferAttribute(pos,3));tg.setAttribute('color',new THREE.BufferAttribute(col,3));tg.setIndex(idx);tg.computeVertexNormals();{const uv=new Float32Array((nx+1)*(nz+1)*2);for(let i=0;i<uv.length/2;i++){uv[i*2]=pos[i*3]/9;uv[i*2+1]=pos[i*3+2]/9;}tg.setAttribute('uv',new THREE.BufferAttribute(uv,2));}
 const groundT=canvasTex(256,256,(g,w,h)=>{g.fillStyle='#2c2a30';g.fillRect(0,0,w,h);for(let y=0;y<h;y+=32)for(let x=((y/32)%2)*32;x<w;x+=64){const v=36+Math.random()*16;g.fillStyle=`rgb(${v},${v-3},${v+4})`;g.fillRect(x+1,y+1,62,30);}
  for(let i=0;i<900;i++){g.fillStyle=Math.random()<.5?'rgba(20,18,24,.45)':'rgba(70,90,70,.25)';const r=1+Math.random()*3;g.fillRect(Math.random()*w,Math.random()*h,r,r);}
  for(let i=0;i<14;i++){g.fillStyle='rgba(10,10,14,.5)';g.fillRect(Math.random()*w,0,1,h);}});
 const tm=absMat(new THREE.MeshLambertMaterial({vertexColors:true,map:groundT,emissive:0x2a2238,emissiveMap:groundT,emissiveIntensity:.35}));const terr=new THREE.Mesh(tg,tm);terr.userData.nlAbs=1;scene.add(terr);out.terrain=terr;
 out.groundAbs=(x,z)=>{const i=Math.floor((x-X0)/ST),j=Math.floor((z-Z0)/ST);if(i<0||j<0||i>=nx||j>=nz)return -99;const fx=(x-X0)/ST-i,fz=(z-Z0)/ST-j;const g=(ii,jj)=>pos[(jj*(nx+1)+ii)*3+1];
  return fx+fz<1?g(i,j)+(g(i+1,j)-g(i,j))*fx+(g(i,j+1)-g(i,j))*fz:g(i+1,j+1)+(g(i,j+1)-g(i+1,j+1))*(1-fx)+(g(i+1,j)-g(i+1,j+1))*(1-fz);};
 // --- river water: flowing ribbon (v runs downstream; the texture scrolls), falls are vertical rungs in the same strip
 const flowT=canvasTex(64,256,(g,w,h)=>{g.fillStyle='#000';g.fillRect(0,0,w,h);for(let i=0;i<140;i++){const x=Math.random()*w,y=Math.random()*h,l=8+Math.random()*40;const gr=g.createLinearGradient(0,y,0,y+l);gr.addColorStop(0,'rgba(160,220,255,0)');gr.addColorStop(.5,`rgba(160,220,255,${.15+Math.random()*.35})`);gr.addColorStop(1,'rgba(160,220,255,0)');g.fillStyle=gr;g.fillRect(x,y,1+Math.random()*1.5,l);}});
 const wv=[],wu=[],wi=[];R.forEach((p,i)=>{for(const s of[-1,1]){wv.push(p.x+p.nx*RW*s,p.L,p.z+p.nz*RW*s);wu.push(s<0?0:1.4,p.s/6+(p.fall?p.fall/6:0));}if(i){const a=(i-1)*2;wi.push(a,a+2,a+1,a+1,a+2,a+3);}});
 // fix uv for fall rungs: v continues by drop length so water accelerates over the lip
 {let acc=0;for(let i=0;i<R.length;i++){if(R[i].fall)acc+=R[i].fall;wu[i*4+1]=R[i].s/6+acc/2.5;wu[i*4+3]=wu[i*4+1];}}
 const wg=new THREE.BufferGeometry();wg.setAttribute('position',new THREE.Float32BufferAttribute(wv,3));wg.setAttribute('uv',new THREE.Float32BufferAttribute(wu,2));wg.setIndex(wi);wg.computeVertexNormals();{const n=wg.attributes.normal.array;for(let i=0;i<n.length;i+=3)if(!(Math.abs(n[i])+Math.abs(n[i+1])+Math.abs(n[i+2])>.01)){n[i]=0;n[i+1]=1;n[i+2]=0;}}
 const wm=absMat(new THREE.MeshStandardMaterial({color:0x0a1420,roughness:.12,metalness:.85,emissive:0x7fc8ff,emissiveMap:flowT,emissiveIntensity:1.1,side:THREE.DoubleSide}));
 const water=new THREE.Mesh(wg,wm);water.userData.nlAbs=1;scene.add(water);out.water=water;
 // --- channel walls (stone, absolute): inner face from below water to the top, cap, outer face down to the ground; neon kerb on the cap
 const sv=[],si=[],gv=[],gi=[];const quad=(A,a,b,c,d,I)=>{const o=A.length/3;A.push(...a,...b,...c,...d);I.push(o,o+1,o+2,o,o+2,o+3);};
 for(const side of[-1,1]){let prev=null;for(let i=0;i<R.length;i++){const p=R[i];const ix=p.x+p.nx*WALL*side,iz=p.z+p.nz*WALL*side,ox=p.x+p.nx*(WALL+.7)*side,oz=p.z+p.nz*(WALL+.7)*side;
   const gnd=Math.max(H(ox,oz)-.14,p.L-1);const top=wallTop(ix,iz,Math.max(gnd+.9,p.L+.9));const cur={ix,iz,ox,oz,top,bot:p.L-1.8,gnd};
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
 const sheetT=canvasTex(64,128,(g,w,h)=>{g.fillStyle='rgba(0,0,0,0)';g.clearRect(0,0,w,h);g.fillStyle='rgba(170,210,240,.28)';g.fillRect(0,0,w,h);for(let i=0;i<260;i++){const x=Math.random()*w,l=30+Math.random()*90,y=Math.random()*h;g.fillStyle=`rgba(235,248,255,${.2+Math.random()*.55})`;g.fillRect(x,y,1+Math.random()*1.5,l);}});
 const sheetM=absMat(new THREE.MeshBasicMaterial({map:sheetT,color:0xcfe8ff,transparent:true,opacity:.85,depthWrite:false,side:THREE.DoubleSide}));
 const falls=[];R.forEach((p,i)=>{if(!p.fall)return;const top=R[i-1].L,bot=p.L;const g=new THREE.PlaneGeometry(RW*2,top-bot+.3,1,1);const m=new THREE.Mesh(g,sheetM);m.position.set(p.x,(top+bot)/2,p.z);m.rotation.y=Math.atan2(p.nx,p.nz)+Math.PI/2;m.userData.nlAbs=1;scene.add(m);
  const fm=[];for(let k=0;k<6;k++){const s=new THREE.Sprite(absMat(new THREE.SpriteMaterial({map:foamT,color:0xdff2ff,transparent:true,opacity:.3,depthWrite:false})));s.position.set(p.x+p.nx*(k-2.5)*1.5,bot+.15,p.z+p.nz*(k-2.5)*1.5);s.scale.setScalar(1.4);s.userData.b=s.position.clone();s.userData.t=Math.random()*3;scene.add(s);fm.push(s);}
  falls.push({p,top,bot,fm});cand.push({x:p.x,y:bot+1.5-H(p.x,p.z),z:p.z,col:0x9fe8ff,int:3,dist:12,pri:0});});
 out.falls=falls;
 out.anim.push((T,dt)=>{flowT.offset.y-=dt*.55;sheetT.offset.y+=dt*1.6;for(const f of falls)for(const s of f.fm){s.userData.t+=dt;const k=(s.userData.t%2.4)/2.4;s.position.y=s.userData.b.y+k*1.4;s.material.opacity=Math.sin(k*Math.PI)*.28;s.scale.setScalar(1.1+k*1.6);}});
 return out;}

// ================= R16 street stairs: on Harbor Rise sidewalks wherever the grade passes 7%, real treads (0.17 m risers, neon nosing) =================
export function sidewalkStairs(scene,pts,hw){const dummy=new THREE.Object3D();const T=[],N=[];const RISE=.17;
 for(const side of[-1,1]){const o=side*(hw-.6);let seg=null;const P=[];
  for(let i=0;i<pts.length-1;i++){const [x0,z0,y0]=pts[i],[x1,z1,y1]=pts[i+1];const dx=x1-x0,dz=z1-z0,l=Math.hypot(dx,dz)||1,nx=-dz/l,nz=dx/l;const n=Math.ceil(l/.25);
   for(let k=0;k<n;k++){const t=k/n,x=x0+dx*t+nx*o,z=z0+dz*t+nz*o,y=y0+(y1-y0)*t;P.push([x,z,y,H(x,z)+y,Math.atan2(dx,dz)]);}}
  let last=null;for(let i=1;i<P.length;i++){const a=P[i-1],b=P[i];const g=Math.abs(b[3]-a[3])/.25;const ka=Math.floor(a[3]/RISE),kb=Math.floor(b[3]/RISE);
   // grade sampled over 3 m so a stair run doesn't flicker on/off
   const j=Math.min(P.length-1,i+6),i0=Math.max(0,i-6);const gg=Math.abs(P[j][3]-P[i0][3])/Math.max(.25,(j-i0)*.25);
   if(ka!==kb&&gg>.07){if(last){const m=P[Math.round((last+i)/2)],len=(i-last)*.25;const lvl=(Math.min(ka,kb)+.5)*RISE;T.push([m[0],lvl-H(m[0],m[1]),m[1],len+.02,m[4]]);
     const e=P[b[3]>a[3]?last:i];N.push([e[0],(Math.min(ka,kb)+.5)*RISE-H(e[0],e[1])+.005,e[1],e[4]]);}last=i;}else if(gg<=.07)last=null;}}
 if(!T.length)return 0;
 const tm=new THREE.InstancedMesh(new THREE.BoxGeometry(1.15,.24,1).translate(0,-.12,0),new THREE.MeshLambertMaterial({color:0x5a5662}),T.length);
 T.forEach((t,i)=>{dummy.position.set(t[0],t[1],t[2]);dummy.rotation.set(0,t[4],0);dummy.scale.set(1,1,t[3]);dummy.updateMatrix();tm.setMatrixAt(i,dummy.matrix);});tm.computeBoundingSphere();scene.add(tm);
 const nm=new THREE.InstancedMesh(new THREE.BoxGeometry(1.1,.015,.04),new THREE.MeshBasicMaterial({color:new THREE.Color(0x3ff0ff).multiplyScalar(.3),toneMapped:false}),N.length);
 N.forEach((t,i)=>{dummy.position.set(t[0],t[1],t[2]);dummy.rotation.set(0,t[3],0);dummy.scale.set(1,1,1);dummy.updateMatrix();nm.setMatrixAt(i,dummy.matrix);});nm.computeBoundingSphere();scene.add(nm);
 return T.length;}
// ================= R16 river footbridges: Canal Head and Canal Foot each get a lit path east, a bridge over the Velvet River and an overlook =================
// under a footbridge the wall cap drops to 0.5 m below the deck
export function wallTop(x,z,t){for(const b of BRIDGES)if(b.rx!==undefined&&Math.abs(z-b.z)<2.6&&Math.abs(x-b.rx)<9)return Math.min(t,H(x,z)-.95);return t;}
export const BRIDGES=[{z:-50,name:'CANAL HEAD'},{z:50,name:'CANAL FOOT'}];
export function bridgeWalks(walk){const out=[];for(const b of BRIDGES){const {r}=riverDist(88,b.z);const rx=r.x;b.rx=rx;b.x0=67.6;b.x1=rx+9.5;b.ox1=rx+17;
  out.push([b.x0,b.x1,b.z-1.6,b.z+1.6,0],[b.x1-.2,b.ox1,b.z-5,b.z+5,0]);}walk.push(...out);return out;}
export function buildBridges(scene,cand,Batch,signTex,walk,LAND){
 // R16 night dressing: lamps along both river banks (lit), and a scatter of street lights over the hillsides so the slope reads at night
 {const B=new Batch(new THREE.MeshLambertMaterial()),G=new Batch(new THREE.MeshBasicMaterial({toneMapped:false}));G.mat.userData.boost=1.8;const R=sampleRiver();let rs=1;const rr=()=>{rs=(rs*16807)%2147483647;return rs/2147483647;};
  const onWalk=(x,z,p)=>walk.some(q=>x>q[0]-p&&x<q[1]+p&&z>q[2]-p&&z<q[3]+p);
  for(let i=4;i<R.length;i+=8){const p=R[i];if(p.fall)continue;for(const sd of[-1,1]){const x=p.x+p.nx*(WALL+1.3)*sd,z=p.z+p.nz*(WALL+1.3)*sd;if(onWalk(x,z,1))continue;const by=LAND.groundAbs(x,z)-H(x,z);
    B.add(x,by+1.9,z,.14,3.8,.14,0x3a3844);B.add(x-p.nx*sd*.5,by+3.8,z-p.nz*sd*.5,Math.abs(p.nz)+.14,.08,Math.abs(p.nx)+.14,0x3a3844);G.add(x-p.nx*sd*.9,by+3.72,z-p.nz*sd*.9,.45,.08,.45,(i/8|0)%3?0xffd090:0x9fe8ff);
    if((i/8|0)%2===(sd>0?1:0))cand.push({x:x-p.nx*sd*.9,y:by+3.3,z:z-p.nz*sd*.9,col:0xffc890,int:4,dist:14,pri:0});}}
  const COL=[0xffc070,0xffb060,0x9fe8ff,0xff9fd6,0xfff1c9];
  for(let k=0;k<1400;k++){const x=-320+rr()*640,z=-450+rr()*640;if(z>195||onWalk(x,z,8)||nearRiver(x,z,3))continue;const y=LAND.groundAbs(x,z);if(y<-.3)continue;const by=y-H(x,z);
   const c=COL[(rr()*COL.length)|0];if(rr()<.55){B.add(x,by+2,z,.12,4,.12,0x2a2832);G.add(x,by+4.05,z,.4,.1,.4,c);}else{G.add(x,by+rr()*3+1,z,rr()*2+.6,.5+rr()*.6,.08,new THREE.Color(c).multiplyScalar(.7).getHex());}}
  B.build(scene);G.build(scene);}const B=new Batch(new THREE.MeshLambertMaterial()),G=new Batch(new THREE.MeshBasicMaterial({toneMapped:false}));G.mat.userData.boost=1.6;
 const L=(x,y,z,col,int=3,dist=10)=>cand.push({x,y,z,col,int,dist,pri:0});
 for(const b of BRIDGES){const {z,rx,x0,x1,ox1}=b;const cx=(x0+x1)/2;
  B.add(cx,-.1,z,x1-x0,.2,3.2,0x3a3640);for(let x=x0+.5;x<x1;x+=.8)B.add(x,.003,z,.6,.01,3,0x4a4652);
  for(const s of[-1,1]){B.add(cx,.98,z+s*1.55,x1-x0,.06,.08,0x6a6676);for(let x=x0+.2;x<=x1;x+=2)B.add(x,.5,z+s*1.55,.07,1,.07,0x2a2832);G.add(cx,.12,z+s*1.62,x1-x0,.04,.04,0xff3fa4);}
  // arch under the river span, piers on the banks
  for(let k=0;k<=12;k++){const t=k/12,x=rx-7+14*t,y=-.35-Math.sin(t*Math.PI)*-.0-(1-Math.sin(t*Math.PI))*1.6;B.add(x,y,z,1.25,.3,3,0x2a2832);G.add(x,y-.17,z,1.2,.03,2.6,0x3ff0ff);}
  for(const x of[rx-7.2,rx+7.2])B.add(x,-1.6,z,1,3,3.2,0x2a2832);for(let x=x0+3;x<rx-7;x+=6)B.add(x,-1.2,z,.5,2.2,.5,0x1a1820);
  // overlook deck with benches, lamps and a sign
  const ocx=(x1+ox1)/2;B.add(ocx,-.1,z,ox1-x1,.2,10,0x34323c);for(const s of[-1,1]){B.add(ocx,.45,z+s*5,ox1-x1,.9,.25,0x4a4852);G.add(ocx,.92,z+s*5,ox1-x1,.03,.27,0x9fe8ff);}B.add(ox1,.45,z,.25,.9,10,0x4a4852);G.add(ox1,.92,z,.27,.03,10,0x9fe8ff);
  for(const s of[-1,1]){B.add(ocx,.42,z+s*3.6,3,.1,.7,0x4a3a30);B.add(ocx,.2,z+s*3.6,2.8,.4,.5,0x2a2830);}
  for(const [lx,lz] of[[x0+2,z-1.9],[rx,z+1.9],[x1-1,z-1.9],[ox1-1,z+4.4]]){B.add(lx,2.2,lz,.14,4.4,.14,0x3a3844);G.add(lx,4.45,lz,.6,.12,.3,0xfff1c9);L(lx,4,lz,0xfff1d8,4,11);}
  L(rx,-.6,z,0x3ff0ff,3,9);
  const st=signTex('VELVET RIVER',0x9fe8ff,{fs:56,style:2});const m=new THREE.Mesh(new THREE.PlaneGeometry(.8*st.aspect,.8),new THREE.MeshBasicMaterial({map:st.t,toneMapped:false,side:THREE.DoubleSide}));m.position.set(ox1-.05,1.9,z);m.rotation.y=-Math.PI/2;scene.add(m);
  B.add(ox1+.05,1.9,z,.05,.9,.8*st.aspect+.1,0x111018);B.add(ox1,1.2,z+st.aspect*.4,.12,2.4,.12,0x2a2832);B.add(ox1,1.2,z-st.aspect*.4,.12,2.4,.12,0x2a2832);}
 B.build(scene);G.build(scene);}
