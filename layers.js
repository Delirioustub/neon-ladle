// R11 layered city. Three tiers, read from anywhere you can see an edge:
//  - Crown Heights rides on a megastructure deck (y 0) above an under-city at y -38 (lit blocks, street grid, haze).
//  - The central districts sit at street level on a sea wall; past their edges is the flooded outer city standing in the sea (y -0.95).
//  - Ashline Docks is down at the water: the same sea, the same lights.
// Everything here is distant scenery: instanced (one draw call per batch), no collision, no lights in the pool.
import * as THREE from 'three';
import {Batch,MATS,signTex} from './world.js';
let s=4242;const r=()=>{s=(s*16807)%2147483647;return s/2147483647;},sr=(a,b)=>a+r()*(b-a),pk=a=>a[Math.floor(r()*a.length)];
const WIN=[0xffc98a,0xffb06b,0x9fe8ff,0xff9fd6,0xc9b2ff,0xfff1c9],NE=[0xff3fa4,0x3ff0ff,0xb04dff,0xff8a3d,0x5dff9b,0xffe14d];
export function buildLayers(scene,walk,block=[],cand=[]){
 const B=new Batch(new THREE.MeshLambertMaterial()),G=new Batch(new THREE.MeshBasicMaterial({toneMapped:false}));G.mat.userData.boost=1.8;
 seaWalks(scene,walk,block,cand,B,G);
 const pad=(x,z,w)=>walk.some(q=>x+w>q[0]-6&&x-w<q[1]+6&&z+w>q[2]-6&&z-w<q[3]+6)||(x+w>-90&&x-w<-40&&z>-300&&z<300);
 const CROWN=[-70,110,-300,-196];const inCrown=(x,z,w)=>x+w>CROWN[0]&&x-w<CROWN[1]&&z+w>CROWN[2]&&z-w<CROWN[3];
 const tower=(x,y0,z,w,d,h,lit)=>{B.add(x,y0+h/2,z,w,h,d,pk([0x14121c,0x1a1622,0x100e16,0x1c1820]));
  for(let k=0;k<lit;k++){const f=r()<.5,sx=f?(r()<.5?-1:1):0,sz=f?0:(r()<.5?-1:1);G.add(x+(sx?sx*(w/2+.05):sr(-w/2+.5,w/2-.5)),y0+sr(1.5,h-1),z+(sz?sz*(d/2+.05):sr(-d/2+.5,d/2-.5)),sx?.08:sr(.5,1.6),sr(.35,.8),sz?.08:sr(.5,1.6),new THREE.Color(pk(WIN)).multiplyScalar(sr(.35,.8)).getHex());}
  if(r()<.3)G.add(x,y0+h+.15,z,w*.9,.12,d*.9,new THREE.Color(pk(NE)).multiplyScalar(.6).getHex());if(r()<.25)G.add(x,y0+h*sr(.55,.85),z+d/2+.1,w*.7,sr(.8,2),.06,pk(NE));};
 // --- the sea: everywhere south of the Crown deck (the Docks keep their own water plane at -0.9)
 const sea=new THREE.Mesh(new THREE.PlaneGeometry(1000,640),MATS.WATER);sea.rotation.x=-Math.PI/2;sea.position.set(0,-.95,124);scene.add(sea);
 // central sea wall: the street districts end on masonry, not on nothing
 // flooded outer city (tops 4..26 m above the water), dense near the edges, thinning out
 for(let i=0;i<900;i++){const x=sr(-320,320),z=sr(-190,440),w=sr(5,13),d=sr(5,13);if(pad(x,z,Math.max(w,d)/2+2)||inCrown(x,z,10))continue;const far=Math.hypot(x,z-40);tower(x,-.95,z,w,d,sr(4,far>200?40:24),far>220?3:7);if(r()<.2)B.add(x+w/2+2,-.85,z,4,.2,1.6,0x2a2420);}
 // --- Crown Heights deck: foundation and under-city
 B.add(20.75,-19.2,-266,169.5,37.6,68,0x16141c);B.add(93.75,-19.2,-216.5,23.5,37.6,31,0x16141c);for(let y=-34;y<-2;y+=4)G.add(20,y,-231.9,168,.12,.1,new THREE.Color(0x9fe8ff).multiplyScalar(.25).getHex());
 for(let y=-34;y<-2;y+=4)for(const x of[-64.1,105.6])G.add(x,y,-266,.1,.12,66,new THREE.Color(0xc9b2ff).multiplyScalar(.22).getHex());
 B.add(40,-38.1,-330,640,.2,300,0x0c0b12);// under-city ground
 for(let x=-280;x<=320;x+=22)G.add(x,-37.95,-330,.8,.05,300,new THREE.Color(0xffb06b).multiplyScalar(.6).getHex());for(let z=-470;z<=-190;z+=22)G.add(40,-37.95,z,640,.05,.8,new THREE.Color(0xffb06b).multiplyScalar(.6).getHex());
 B.add(40,-19.5,-189.5,640,37.2,1,0x18161e);// sea wall where the under-city meets the sea
 for(let i=0;i<700;i++){const x=sr(-300,330),z=sr(-470,-192),w=sr(6,16),d=sr(6,16);if(inCrown(x,z,Math.max(w,d)/2+3)||(x>-90&&x<-40&&z>-300))continue;tower(x,-38,z,w,d,sr(8,Math.hypot(x-20,z+248)>140?60:32),6);}
 B.build(scene);G.build(scene);}

// R11b: the tiers are physically joined. Velvet Canal's two dead ends became plazas (Canal Head north, Canal Foot south); from each a stair
// drops to the Sea Walk, a lit boardwalk 0.35 m above the water, that runs out across the flooded city: north to a stair up onto the Halcyon
// overlook (Crown Heights), south to a stair up onto the Net Market quay (Ashline Docks). Walk rects carry ramp profiles (game.js rY), so feet
// and the bike follow the steps. The Halcyon Lift and the metro still run.
function seaWalks(scene,walk,block,cand,B,G){const Y=-.6,Wk=(x0,x1,z0,z1,y=0,q)=>walk.push(q?[x0,x1,z0,z1,y,q]:[x0,x1,z0,z1,y]);
 const L=(x,y,z,col,int=3,dist=9)=>cand.push({x,y,z,col,int,dist,pri:0});
 const sign=(t,col,x,y,z,h,ry)=>{const st=signTex(t,col,{fs:56});const m=new THREE.Mesh(new THREE.PlaneGeometry(h*st.aspect,h),new THREE.MeshBasicMaterial({map:st.t,toneMapped:false,side:THREE.DoubleSide,color:new THREE.Color(1.2,1.2,1.2)}));m.position.set(x,y,z);m.rotation.y=ry;scene.add(m);};
 // boardwalk segment: deck, planks, piles, rails on the given open sides ('n','s','e','w' each: [from,to] gaps excluded by caller)
 const deck=(x0,x1,z0,z1,rails)=>{const cx=(x0+x1)/2,cz=(z0+z1)/2,w=x1-x0,d=z1-z0;B.add(cx,Y-.12,cz,w,.24,d,0x2a2420);
  if(w>d)for(let x=x0+.3;x<x1;x+=.6)B.add(x,Y+.005,cz,.5,.02,d-.1,0x3a2e24);else for(let z=z0+.3;z<z1;z+=.6)B.add(cx,Y+.005,z,w-.1,.02,.5,0x3a2e24);
  for(let x=x0+.4;x<=x1;x+=6)for(let z=z0+.4;z<=z1;z+=6)B.add(x,-1.6,z,.3,2,.3,0x1a1612);
  for(const [ax,v,a,b] of rails){const len=b-a,m=(a+b)/2;if(len<.5)continue;
   if(ax==='x'){B.add(m,Y+.95,v,len,.08,.08,0x4a3a2a);for(let t=a;t<=b+.01;t+=3){B.add(t,Y+.5,v,.1,1,.1,0x2a2420);G.add(t,Y+1.04,v,.12,.06,.12,0x7a5a2a);}}
   else{B.add(v,Y+.95,m,.08,.08,len,0x4a3a2a);for(let t=a;t<=b+.01;t+=3){B.add(v,Y+.5,t,.1,1,.1,0x2a2420);G.add(v,Y+1.04,t,.12,.06,.12,0x7a5a2a);}}}};
 // stair: walk ramp + visible treads (ya at a -> yb at b along ax), side cheeks
 const stair=(x0,x1,z0,z1,ax,a,b,ya,yb)=>{Wk(x0,x1,z0,z1,ya,{ax,a,b,ya,yb});const n=6;for(let i=0;i<n;i++){const t0=i/n,t1=(i+1)/n,y=ya+(yb-ya)*(i+.5)/n,p0=a+(b-a)*t0,p1=a+(b-a)*t1,c=(p0+p1)/2,l=Math.abs(p1-p0);
   const top=y+.04;if(ax==='z'){B.add((x0+x1)/2,top-.4,c,x1-x0,.8,l,0x3a3640);G.add((x0+x1)/2,top+.005,c+(p1-p0)/2*.92,x1-x0-.2,.015,.05,0x3ff0ff);}
   else{B.add(c,top-.4,(z0+z1)/2,l,.8,z1-z0,0x3a3640);G.add(c+(p1-p0)/2*.92,top+.005,(z0+z1)/2,.05,.015,z1-z0-.2,0x3ff0ff);}}
  if(ax==='z'){for(const x of[x0-.1,x1+.1])B.add(x,(ya+yb)/2+.5,(a+b)/2,.2,1,Math.abs(b-a)+.6,0x2a2832);}else for(const z of[z0-.1,z1+.1])B.add((a+b)/2,(ya+yb)/2+.5,z,Math.abs(b-a)+.6,1,.2,0x2a2832);};
 // a canal-end plaza: floor, kerb lights, benches (solid), kiosk, lamps, name
 const plaza=(z0,z1,name,col,dir)=>{const x0=48.2,x1=67.8,cx=58,cz=(z0+z1)/2,edge=dir>0?z1:z0;Wk(x0,x1,z0,z1);B.add(cx,-.06,cz,x1-x0,.12,z1-z0,0x34323c);
  for(let x=x0+2;x<x1;x+=3)B.add(x,.004,cz,.06,.01,z1-z0-.4,0x24222a);
  // balustrade along the sea edge, open at the stair (x 56..60)
  for(const [a,b] of[[x0,54.3],[61.7,x1]]){B.add((a+b)/2,.45,edge,b-a,.9,.25,0x4a4852);G.add((a+b)/2,.92,edge,b-a,.03,.27,new THREE.Color(col).multiplyScalar(.35).getHex());}
  for(const x of[x0,x1]){B.add(x,.45,cz,.25,.9,z1-z0-1.2,0x4a4852);}
  for(const x of[51.5,64.5]){const z=cz;B.add(x,.42,z,3,.1,.7,0x4a3a30);B.add(x,.2,z,2.8,.4,.5,0x2a2830);block.push([x-1.5,x+1.5,z-.35,z+.35]);}
  for(const x of[49.6,66.4]){const z=edge-dir*1.6;B.add(x,.5,z,1.4,1,1.4,0x2a2832);B.add(x,1.8,z,.25,1.8,.25,0x3a2a1e);B.add(x,3,z,1.8,1.4,1.8,0x1e3a2a);block.push([x-.75,x+.75,z-.75,z+.75]);}
  for(const x of[52,64]){const z=edge-dir*.9;B.add(x,2.2,z,.14,4.4,.14,0x3a3844);G.add(x,4.45,z,.6,.12,.3,0xfff1c9);L(x,4,z,0xfff1d8,4,11);}
  sign(name,col,cx,3.2,edge-dir*.3,.8,0);G.add(cx,2.6,edge-dir*.3,6,.04,.06,col);};
 // ---- R11b(2): the joins are real roads: Catmull-Rom centrelines, continuously graded (no steps), 7 m wide (5 m carriageway + sidewalks),
 // curb lines, railings, streetlights, a few lit stalls. Each 2 m slice is a walk capsule with a height profile (game.js rY/inWalk), so bike and feet follow the grade.
 plaza(-57.2,-42.8,'CANAL HEAD',0x9fe8ff,-1);plaza(42.8,57.2,'CANAL FOOT',0xff8a3d,1);
 road([[58,-56],[58,-64,-.15],[55,-84,-.5],[63,-112,-.6],[54,-142,-.6],[61,-170,-.6],[76,-185,-.55],[90,-189,-.4],[94,-197,-.1],[94,-204,0]],'CROWN',0x9fe8ff);
 road([[58,56],[58,64,-.15],[62,88,-.5],[52,118,-.6],[62,148,-.6],[56,174,-.6],[66,188,-.5],[70.5,200,-.35],[70,212,-.15],[65,219.5,-.02],[59,220,0]],'DOCKS',0xff8a3d);
 function road(C,tag,col){const hw=3.5,pts=[];const cr=(a,b,c,d,t)=>{const t2=t*t,t3=t2*t;return .5*(2*b+(-a+c)*t+(2*a-5*b+4*c-d)*t2+(-a+3*b-3*c+d)*t3);};
  const P=C.map(p=>[p[0],p[1],p[2]||0]);for(let i=0;i<P.length-1;i++){const a=P[Math.max(0,i-1)],b=P[i],c=P[i+1],d=P[Math.min(P.length-1,i+2)];const n=Math.ceil(Math.hypot(c[0]-b[0],c[1]-b[1])/2);
   for(let k=0;k<n;k++){const t=k/n,s=t*t*(3-2*t);pts.push([cr(a[0],b[0],c[0],d[0],t),cr(a[1],b[1],c[1],d[1],t),b[2]+(c[2]-b[2])*s]);}}pts.push(P[P.length-1]);
  for(let i=0;i<pts.length-1;i++){const [x0,z0,y0]=pts[i],[x1,z1,y1]=pts[i+1];walk.push([Math.min(x0,x1)-hw,Math.max(x0,x1)+hw,Math.min(z0,z1)-hw,Math.max(z0,z1)+hw,(y0+y1)/2,{seg:[x0,z0,y0,x1,z1,y1],hw}]);}
  // ribbons
  const N=pts.map((p,i)=>{const a=pts[Math.max(0,i-1)],b=pts[Math.min(pts.length-1,i+1)];const dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz)||1;return [-dz/l,dx/l];});
  const rib=(o0,o1,dy,mat,down)=>{const v=[];for(let i=0;i<pts.length-1;i++)for(const [j,k] of[[i,i+1]]){const q=(m,o,yy)=>[pts[m][0]+N[m][0]*o,pts[m][2]+yy,pts[m][1]+N[m][1]*o];
    const a=q(j,o0,dy),b=q(j,o1,down?dy-down:dy),c=q(k,o1,down?dy-down:dy),d=q(k,o0,dy);if(down){const a2=q(j,o0,dy-down),d2=q(k,o0,dy-down);v.push(...a,...a2,...d2,...a,...d2,...d);}else v.push(...a,...b,...c,...a,...c,...d);}
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.computeVertexNormals();const m=new THREE.Mesh(g,mat);scene.add(m);return m;};
  const side=new THREE.MeshLambertMaterial({color:0x2a2832,side:THREE.DoubleSide}),walkM=new THREE.MeshLambertMaterial({color:0x4a4652,side:THREE.DoubleSide});
  const asph=MATS.ROAD.clone();asph.side=THREE.DoubleSide;
  rib(-hw+1.2,hw-1.2,.012,asph);rib(-hw,-hw+1.2,.02,walkM);rib(hw-1.2,hw,.02,walkM);rib(-hw,-hw,.02,side,1.1);rib(hw,hw,.02,side,1.1);
  const glowM=new THREE.MeshBasicMaterial({color:new THREE.Color(col).multiplyScalar(1.4),toneMapped:false,side:THREE.DoubleSide});rib(-hw+1.17,-hw+1.25,.03,glowM);rib(hw-1.25,hw-1.17,.03,glowM);
  const yel=new THREE.MeshBasicMaterial({color:0x8a7a40,toneMapped:false,side:THREE.DoubleSide});rib(-.06,.06,.016,yel);
  // railings: posts + top rail ribbon on both edges (open at both road ends where they meet the plaza/overlook/quay)
  const rl=new THREE.MeshLambertMaterial({color:0x5a5866,side:THREE.DoubleSide});for(const o of[-hw+.1,hw-.1]){const m=rib(o-.04,o+.04,1.05,rl);
   const g=m.geometry,pa=g.attributes.position;// trim first/last 2 slices so the ends stay open
   g.setDrawRange(36,Math.max(0,pa.count-72));}
  let acc=0;for(let i=1;i<pts.length-1;i++){acc+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);const [x,z,y]=pts[i];
   if(i>2&&i<pts.length-3&&i%2===0)for(const s of[-1,1]){const o=s*(hw-.1);B.add(x+N[i][0]*o,y+.52,z+N[i][1]*o,.08,1,.08,0x3a3844);}
   if(i%3===0){B.add(x,-1.4,z,.6,2,.6,0x1a1612);}
   if(i%8===4){const s=(i/8|0)%2?1:-1,o=s*(hw-.3);const lx=x+N[i][0]*o,lz=z+N[i][1]*o;B.add(lx,y+2.4,lz,.14,4.8,.14,0x3a3844);B.add(lx-N[i][0]*s*.7,y+4.8,lz-N[i][1]*s*.7,.14,.1,.14,0x3a3844);G.add(lx-N[i][0]*s*1.1,y+4.72,lz-N[i][1]*s*1.1,.5,.08,.5,0xffd090);if(i%16===4)L(lx-N[i][0]*s*1.1,y+4.2,lz-N[i][1]*s*1.1,0xffc890,4.5,13);}
   // roadside stalls on the widest bends: lit kiosk on the sidewalk outside the rail line (on its own little pier)
   if(i%22===11){const s=(i/22|0)%2?1:-1,o=s*(hw+1.6);const kx=x+N[i][0]*o,kz=z+N[i][1]*o;B.add(kx,y-.1,kz,3.2,.2,3.2,0x2a2420);B.add(kx,y+1.2,kz,2.4,2.4,2.4,0x1e1a24);G.add(kx-N[i][0]*s*1.22,y+1.1,kz-N[i][1]*s*1.22,Math.abs(N[i][1])*1.8+.06,1.1,Math.abs(N[i][0])*1.8+.06,pk(NE));G.add(kx,y+2.5,kz,2.6,.12,2.6,new THREE.Color(pk(NE)).multiplyScalar(.6).getHex());L(kx,y+2,kz,pk(NE),2.5,7);}}
  const e=pts[pts.length-1],b=pts[0];sign(tag==='CROWN'?'HARBOR RISE → CROWN HEIGHTS':'HARBOR RISE → ASHLINE DOCKS',col,b[0],4.6,b[1]+(tag==='CROWN'?-4:4),.6,0);B.add(b[0],5.2,b[1]+(tag==='CROWN'?-4:4),7.4,.14,.14,0x2a2832);for(const s of[-1,1])B.add(b[0]+s*3.7,2.6,b[1]+(tag==='CROWN'?-4:4),.18,5.2,.18,0x2a2832);}
}
